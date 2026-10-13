import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { slugifyFilePath } from "@quartz-community/utils/path"
import { loadNotes, inside } from "./vault.mjs"
import { sitePath, publicationData } from "./prepare-content.mjs"

const escape = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
export async function writeRedirects(output = inside("site/public")) {
  const notes = loadNotes().filter((n) => publicationData(n)),
    byFile = new Map(notes.map((n) => [n.file, n]))
  const canonical = new Set(notes.map((n) => slugifyFilePath(sitePath(n))))
  const routes = new Map()
  const register = (from, to) => {
    const source = slugifyFilePath(from),
      target = slugifyFilePath(to)
    if (source === target || canonical.has(source)) return
    if (routes.has(source) && routes.get(source) !== target)
      throw new Error(`Redirect ambiguo: ${source}`)
    routes.set(source, target)
  }
  const previous = JSON.parse(await fs.readFile(inside("site/redirects.json"), "utf8"))
  for (const { from, to } of previous) if (byFile.has(to)) register(from, sitePath(byFile.get(to)))
  for (const note of notes) register(note.file, sitePath(note))
  for (const [source, target] of routes) {
    const destination = path.resolve(output, source + ".html")
    if (!destination.startsWith(path.resolve(output) + path.sep))
      throw new Error("Redirect esterno")
    await fs.access(path.resolve(output, target + ".html"))
    let url = path.posix.relative(path.posix.dirname(source), target)
    if (!url.startsWith(".")) url = "./" + url
    url = encodeURI(url)
    const html = `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${escape(url)}"><link rel="canonical" href="${escape(url)}"><title>Pagina spostata</title><a href="${escape(url)}">Apri la pagina aggiornata</a></html>`
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.writeFile(destination, html, "utf8")
  }
  console.log(`${routes.size} reindirizzamenti per i percorsi precedenti.`)
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await writeRedirects()
