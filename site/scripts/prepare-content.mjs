import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, rm, writeFile, cp } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkContent } from "./check-content.mjs"
import { vaultRoot, inside, stem, serialize, wikiLinks, applyEdits, resolver } from "./vault.mjs"

export function defaultOutputRoot() {
  const id = createHash("sha256").update(vaultRoot).digest("hex").slice(0, 10)
  return path.join(tmpdir(), `quartz-content-${id}`)
}

export function sitePath(note) {
  if (note.file === "Home.md") return "index.md"
  return note.index ? `${path.posix.dirname(note.file)}/index.md` : note.file
}

export function publicationData(note) {
  if (note.data?.publish === false || note.data?.draft === true) return null
  if (!note.index && note.file !== "Home.md" && note.data?.publish !== true) return null
  const heading = note.body.match(/^# (.+)$/m)?.[1] ?? path.posix.basename(stem(note.file))
  const title = note.index ? heading.replace(/^Indice /, "") : heading
  // Aliases remain searchable in source metadata; redirects are emitted separately.
  const data = { ...(note.data ?? {}), title, publish: true }
  if (note.index || note.file === "Home.md")
    data.cssclasses = [...new Set([...(data.cssclasses ?? []), "knowledge-index"])]
  return data
}

export function transformNote(note, resolve) {
  const data = publicationData(note)
  if (!data) return null
  const edits = wikiLinks(note)
    .filter((l) => l.target)
    .map((link) => {
      const target = resolve(link.target, note.file)
      if (!target) throw new Error(`Link non risolto: ${note.file} -> ${link.target}`)
      return { ...link, text: link.raw.replace(link.target, stem(sitePath(target))) }
    })
  const body = applyEdits(note.body, edits).replace(/^# [^\n]+\n+/, "")
  return serialize(data, body)
}

export async function prepareContent(outputRoot = defaultOutputRoot()) {
  // Never recursively clear a caller-selected directory.
  if (path.resolve(outputRoot) !== path.resolve(defaultOutputRoot()))
    throw new Error("Directory temporanea non consentita")
  const config = JSON.parse(await readFile(inside("site/publish.config.json"), "utf8"))
  const result = checkContent()
  if (result.errors.length) throw new Error(result.errors.join("\n"))
  const expected = ["Programmazione", "Stampante 3D", "Programmi open source"]
  if (JSON.stringify(config.areas) !== JSON.stringify(expected))
    throw new Error("Le aree pubblicabili non corrispondono al vault")
  const resolve = resolver(result.notes)
  await mkdir(outputRoot, { recursive: true })
  for (const entry of await readdir(outputRoot)) {
    const target = path.resolve(outputRoot, entry)
    if (!target.startsWith(path.resolve(outputRoot) + path.sep))
      throw new Error("Pulizia fuori dalla directory temporanea")
    await rm(target, { recursive: true, force: true })
  }
  let publishedNotes = 0,
    skippedNotes = 0,
    copiedAssets = 0
  for (const note of result.notes) {
    const markdown = transformNote(note, resolve)
    if (!markdown) {
      skippedNotes++
      continue
    }
    const target = path.join(outputRoot, sitePath(note))
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, markdown, "utf8")
    publishedNotes++
  }
  // Only public media formats can leave the vault; never publish arbitrary source files.
  const assetExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".pdf",
    ".mp3",
    ".mp4",
    ".webm",
  ])
  async function copyAssets(relative) {
    for (const entry of await readdir(inside(relative), { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue
      const source = `${relative}/${entry.name}`
      if (entry.isDirectory()) await copyAssets(source)
      else if (entry.isFile() && assetExtensions.has(path.extname(entry.name).toLowerCase())) {
        const destination = path.join(outputRoot, source)
        await mkdir(path.dirname(destination), { recursive: true })
        await cp(inside(source), destination)
        copiedAssets++
      }
    }
  }
  for (const area of config.areas) await copyAssets(area)
  console.log(
    `Contenuti pronti: ${publishedNotes} pagine, ${skippedNotes} escluse, ${copiedAssets} asset. Directory: ${outputRoot}`,
  )
  return { outputRoot, publishedNotes, skippedNotes, copiedAssets }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await prepareContent()
