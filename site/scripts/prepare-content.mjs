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

  const homepage = createHomepage(config.homepage)
  await writeFile(path.join(outputRoot, "index.md"), homepage, "utf8")

  const homepageTarget = path.join(outputRoot, `${config.homepage.target}.md`)
  const targetStats = await stat(homepageTarget).catch(() => null)
  if (!targetStats?.isFile()) {
    throw new Error(
      `La destinazione della homepage non e stata pubblicata: ${config.homepage.target}`,
    )
  }

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
      if (!isPublished(markdown)) {
        counters.skippedNotes += 1
        continue
      }

      await mkdir(destinationDir, { recursive: true })
      await writeFile(destinationPath, removeLeadingTitle(markdown), "utf8")
      counters.publishedNotes += 1
      continue
    }

    await mkdir(destinationDir, { recursive: true })
    await cp(sourcePath, destinationPath)
    counters.copiedAssets += 1
  }
}

function isPublished(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return false

  const frontmatter = YAML.parse(match[1])
  return frontmatter?.publish === true || frontmatter?.publish === "true"
}

function removeLeadingTitle(markdown) {
  const frontmatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)
  if (!frontmatter) return markdown

  const body = markdown.slice(frontmatter[0].length)
  const bodyWithoutTitle = body.replace(/^(?:\r?\n)*# [^\r\n]+(?:\r?\n){1,2}/, "")
  return `${frontmatter[0].trimEnd()}\n\n${bodyWithoutTitle}`
}

function createHomepage(homepageConfig) {
  if (!homepageConfig?.title || !homepageConfig?.description || !homepageConfig?.target) {
    throw new Error("Configurazione homepage incompleta in publish.config.json")
  }

  return `---
date: 2026-07-14
area: Linux
topic: Indice
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [linux]
aliases: []
prerequisites: []
related: [${homepageConfig.target}]
title: ${homepageConfig.title}
---

## Sintesi

${homepageConfig.description}

## Inizia da qui

- [[${homepageConfig.target}|Apri l'indice Linux]]
`
}

function resolveInside(root, relativePath) {
  const resolved = path.resolve(root, relativePath)
  const relative = path.relative(root, resolved)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Percorso non consentito in publish.config.json: ${relativePath}`)
  }

  return resolved
}
