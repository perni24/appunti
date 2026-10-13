import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"
import { unified } from "unified"
import remarkParse from "remark-parse"

export const vaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
export const areas = ["Programmazione", "Stampante 3D", "Programmi open source"]
const parser = unified().use(remarkParse)
export const posix = (value) => value.replaceAll("\\", "/")
export const stem = (value) => value.replace(/\.md$/i, "")

export function inside(relative) {
  const absolute = path.resolve(vaultRoot, relative)
  if (!absolute.startsWith(vaultRoot + path.sep)) throw new Error(`Percorso esterno: ${relative}`)
  return absolute
}

export function walk(relative) {
  return fs.readdirSync(inside(relative), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return []
    const file = `${relative}/${entry.name}`
    return entry.isDirectory() ? walk(file) : entry.name.endsWith(".md") ? [file] : []
  })
}

export function parseNote(file) {
  const source = fs
    .readFileSync(inside(file), "utf8")
    .replace(/^\uFEFF/, "")
    .replaceAll("\r\n", "\n")
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  const data = match ? YAML.parse(match[1]) : null
  const body = match ? source.slice(match[0].length).trimStart() : source
  return {
    file,
    source,
    data,
    body,
    index: path.posix.basename(file).startsWith("Indice "),
    tree: parser.parse(body),
  }
}

export function serialize(data, body) {
  return (
    (data ? `---\n${YAML.stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n` : "") +
    body.trim() +
    "\n"
  )
}

export function loadNotes() {
  return ["Home.md", ...areas.flatMap(walk)].map(parseNote)
}

export function resolver(notes) {
  const exact = new Map(notes.map((n) => [stem(n.file).toLowerCase(), n]))
  const names = new Map()
  for (const n of notes) {
    for (const name of new Set([path.posix.basename(stem(n.file)), ...(n.data?.aliases ?? [])])) {
      const key = String(name).toLowerCase()
      names.set(key, [...new Set([...(names.get(key) ?? []), n])])
    }
  }
  return (target, from) => {
    const key = stem(target).toLowerCase()
    const direct =
      exact.get(key) ??
      exact.get(path.posix.normalize(`${path.posix.dirname(from)}/${key}`).toLowerCase())
    if (direct) return direct
    let candidates = key.includes("/")
      ? notes.filter((n) => stem(n.file).toLowerCase().endsWith(`/${key}`))
      : (names.get(key) ?? [])
    const scope =
      from
        .split("/")
        .slice(0, from.startsWith("Programmazione/") ? 2 : 1)
        .join("/") + "/"
    const local = candidates.filter((n) => n.file.startsWith(scope))
    if (local.length) candidates = local
    return candidates.length === 1 ? candidates[0] : null
  }
}

export function textNodes(node) {
  if (node.type === "code" || node.type === "inlineCode") return []
  if (node.type === "text") return [node]
  return (node.children ?? []).flatMap(textNodes)
}

// Read source slices so escaped pipes in Obsidian tables retain their offsets.
export function wikiLinks(note) {
  return textNodes(note.tree).flatMap((node) => {
    const start = node.position.start.offset
    const source = note.body.slice(start, node.position.end.offset)
    return [...source.matchAll(/(!?)\[\[([^\]\n]+)\]\]/g)].map((m) => {
      const parts = m[2].replaceAll("\\|", "|").split("|")
      const [target, ...anchor] = parts[0].split("#")
      return {
        start: start + m.index,
        end: start + m.index + m[0].length,
        raw: m[0],
        embed: m[1],
        target,
        anchor: anchor.length ? `#${anchor.join("#")}` : "",
        label: parts.slice(1).join("|"),
      }
    })
  })
}

export function applyEdits(source, edits) {
  for (const edit of edits.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  return source
}
