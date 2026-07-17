import { createHash } from "node:crypto"
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const vaultRoot = path.resolve(siteRoot, "..")
const configPath = path.join(siteRoot, "publish.config.json")

export function defaultOutputRoot() {
  const workspaceId = createHash("sha256").update(vaultRoot).digest("hex").slice(0, 10)
  return path.join(tmpdir(), `quartz-content-${workspaceId}`)
}

export async function prepareContent(outputRoot = defaultOutputRoot()) {
  const config = JSON.parse(await readFile(configPath, "utf8"))

  if (!Array.isArray(config.areas) || config.areas.length === 0) {
    throw new Error("publish.config.json deve contenere almeno un'area pubblicabile")
  }

  await cleanOutput(outputRoot)

  const counters = {
    publishedNotes: 0,
    skippedNotes: 0,
    copiedAssets: 0,
  }

  for (const area of config.areas) {
    const sourceRoot = resolveInside(vaultRoot, area)
    const sourceStats = await stat(sourceRoot).catch(() => null)

    if (!sourceStats?.isDirectory()) {
      throw new Error(`Area pubblicabile non trovata: ${area}`)
    }

    await copyPublishedTree(sourceRoot, path.join(outputRoot, area), counters)
  }

  const homepage = await createHomepage(config.homepage)
  await writeFile(path.join(outputRoot, "index.md"), homepage, "utf8")

  console.log(
    `Contenuti preparati in ${outputRoot}: ${counters.publishedNotes} note pubblicate, ${counters.skippedNotes} escluse, ${counters.copiedAssets} asset copiati.`,
  )

  return { outputRoot, ...counters }
}

if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareContent()
}

async function cleanOutput(outputRoot) {
  await mkdir(outputRoot, { recursive: true })
  const entries = await readdir(outputRoot, { withFileTypes: true })

  await Promise.all(
    entries.map((entry) => rm(path.join(outputRoot, entry.name), { recursive: true, force: true })),
  )
}

async function copyPublishedTree(sourceDir, destinationDir, counters) {
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue

    const sourcePath = path.join(sourceDir, entry.name)
    const destinationPath = path.join(destinationDir, entry.name)

    if (entry.isDirectory()) {
      await copyPublishedTree(sourcePath, destinationPath, counters)
      continue
    }

    if (!entry.isFile()) continue

    if (path.extname(entry.name).toLowerCase() === ".md") {
      const markdown = await readFile(sourcePath, "utf8")
      const publishedMarkdown = isPublished(markdown)
        ? markdown
        : isAreaIndex(entry.name)
          ? addPublicationFrontmatter(markdown)
          : null

      if (!publishedMarkdown) {
        counters.skippedNotes += 1
        continue
      }

      await mkdir(destinationDir, { recursive: true })
      await writeFile(destinationPath, removeLeadingTitle(publishedMarkdown), "utf8")
      counters.publishedNotes += 1
      continue
    }

    await mkdir(destinationDir, { recursive: true })
    await cp(sourcePath, destinationPath)
    counters.copiedAssets += 1
  }
}

function isPublished(markdown) {
  const match = markdown.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return false

  const frontmatter = YAML.parse(match[1])
  return frontmatter?.publish === true || frontmatter?.publish === "true"
}

function isAreaIndex(fileName) {
  return /^Indice .+\.md$/i.test(fileName)
}

function addPublicationFrontmatter(markdown) {
  return `---\npublish: true\n---\n\n${markdown.trimStart()}`
}

function removeLeadingTitle(markdown) {
  const frontmatter = markdown.match(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)
  if (!frontmatter) return markdown

  const body = markdown.slice(frontmatter[0].length)
  const bodyWithoutTitle = body.replace(/^(?:\r?\n)*# [^\r\n]+(?:\r?\n){1,2}/, "")
  const normalizedFrontmatter = frontmatter[0].replace(/^\uFEFF/, "").trimEnd()
  return `${normalizedFrontmatter}\n\n${bodyWithoutTitle}`
}

async function createHomepage(homepageConfig) {
  if (!homepageConfig?.source || !homepageConfig?.title) {
    throw new Error("Configurazione homepage incompleta in publish.config.json")
  }

  const sourcePath = resolveInside(vaultRoot, homepageConfig.source)
  const sourceStats = await stat(sourcePath).catch(() => null)
  if (!sourceStats?.isFile()) {
    throw new Error(`Homepage non trovata: ${homepageConfig.source}`)
  }

  const markdown = await readFile(sourcePath, "utf8")
  const frontmatterMatch = markdown.match(
    /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  )
  const frontmatter = frontmatterMatch ? (YAML.parse(frontmatterMatch[1]) ?? {}) : {}
  const body = frontmatterMatch ? markdown.slice(frontmatterMatch[0].length) : markdown

  frontmatter.title = homepageConfig.title
  frontmatter.publish = true

  return `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n\n${body.trimStart()}`
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath)
  const relative = path.relative(root, resolved)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Percorso non consentito in publish.config.json: ${relativePath}`)
  }

  return resolved
}
