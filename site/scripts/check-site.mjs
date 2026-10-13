import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "parse5"
import YAML from "yaml"
import { inside } from "./vault.mjs"

export function checkSite(output = inside("site/public")) {
  const config = YAML.parse(fs.readFileSync(inside("site/quartz.config.yaml"), "utf8"))
  const base = new URL(`https://${config.configuration.baseUrl.replace(/\/$/, "")}/`)
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(file) : entry.isFile() ? [file] : []
    })
  const files = new Set(
    walk(output).map((file) => path.relative(output, file).split(path.sep).join("/")),
  )
  const ids = new Map(),
    links = [],
    errors = new Set()
  for (const file of files) {
    if (!file.endsWith(".html")) continue
    const tree = parse(fs.readFileSync(path.join(output, file), "utf8")),
      pageIds = new Set()
    function visit(node) {
      const attrs = Object.fromEntries((node.attrs ?? []).map((attr) => [attr.name, attr.value]))
      if (attrs.id) pageIds.add(attrs.id)
      for (const name of ["href", "src"]) if (attrs[name]) links.push({ file, url: attrs[name] })
      for (const child of node.childNodes ?? []) visit(child)
    }
    visit(tree)
    ids.set(file, pageIds)
  }
  for (const link of links) {
    let url
    try {
      url = new URL(link.url, new URL(link.file, base))
    } catch {
      errors.add(`${link.file}: URL non valido: ${link.url}`)
      continue
    }
    if (url.origin !== base.origin) continue
    const pathname = decodeURIComponent(url.pathname)
    const prefix = decodeURIComponent(base.pathname)
    if (!pathname.startsWith(prefix) && pathname !== prefix.slice(0, -1)) {
      errors.add(`${link.file}: link esterno al sottopercorso del sito: ${link.url}`)
      continue
    }
    const relative = pathname.slice(prefix.length),
      folder = relative.replace(/\/$/, "")
    const target = [relative, `${relative}.html`, `${folder ? folder + "/" : ""}index.html`].find(
      (file) => files.has(file),
    )
    if (!target) {
      errors.add(`${link.file}: file non trovato: ${link.url}`)
      continue
    }
    if (
      url.hash &&
      ids.has(target) &&
      !ids.get(target).has(decodeURIComponent(url.hash.slice(1)))
    ) {
      errors.add(`${link.file}: ancora non trovata: ${link.url}`)
    }
  }
  const summary = `${ids.size} HTML, ${links.length} riferimenti verificati, ${errors.size} errori.`
  console.log(summary)
  if (errors.size) throw new Error([...errors].join("\n"))
  return { html: ids.size, links: links.length, errors: errors.size }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) checkSite()
