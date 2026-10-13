import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { areas, inside, loadNotes, resolver, wikiLinks, stem } from "./vault.mjs"

export function checkContent() {
  const notes = loadNotes(),
    resolve = resolver(notes),
    errors = [],
    warnings = []
  const byFile = new Map(notes.map((n) => [n.file, n]))
  const graph = new Map()
  for (const note of notes) {
    const headings = note.tree.children.filter((n) => n.type === "heading")
    if (headings.filter((h) => h.depth === 1).length !== 1)
      errors.push(`${note.file}: serve un solo titolo H1`)
    if (note.data?.title && note.data.title !== note.body.match(/^# (.+)$/m)?.[1])
      errors.push(`${note.file}: title YAML diverso dal titolo H1`)
    if (note.file !== "Home.md" && !note.index) {
      if (!note.data?.title || !note.data?.area || !note.data?.type)
        errors.push(`${note.file}: metadati essenziali mancanti`)
      if (note.data?.area !== note.file.split("/")[0]) errors.push(`${note.file}: area incoerente`)
      if (!["non revisionato", "revisionato (da me)"].includes(note.data?.status))
        errors.push(`${note.file}: status non valido`)
      if (typeof note.data?.publish !== "boolean")
        errors.push(`${note.file}: publish deve essere booleano`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(note.data?.date)))
        errors.push(`${note.file}: data non valida`)
      if (!/https?:\/\//.test(note.body)) warnings.push(`${note.file}: nessuna fonte web esplicita`)
    }
    for (let i = 0; i < note.tree.children.length; i++) {
      const node = note.tree.children[i],
        next = note.tree.children[i + 1]
      if (
        node.type === "heading" &&
        (!next || (next.type === "heading" && next.depth <= node.depth))
      )
        errors.push(`${note.file}:${node.position.start.line}: sezione vuota`)
      if (node.type === "code" && !node.lang)
        warnings.push(`${note.file}:${node.position.start.line}: blocco senza linguaggio`)
    }
    const destinations = []
    for (const link of wikiLinks(note)) {
      if (!link.target) continue
      const target = resolve(link.target, note.file)
      if (!target) {
        errors.push(`${note.file}: link non risolto: ${link.target}`)
        continue
      }
      if (link.target !== stem(target.file))
        errors.push(`${note.file}: link non canonico: ${link.target}`)
      if (
        note.data?.publish !== false &&
        note.data?.draft !== true &&
        (target.data?.publish === false || target.data?.draft === true)
      )
        errors.push(`${note.file}: link pubblico verso nota esclusa: ${target.file}`)
      destinations.push(target.file)
    }
    graph.set(note.file, destinations)
    for (const field of ["prerequisites", "related"])
      for (const value of note.data?.[field] ?? []) {
        const match = String(value).match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/)
        if (match && !resolve(match[1], note.file))
          errors.push(`${note.file}: ${field} non risolto: ${match[1]}`)
      }
  }
  const reached = new Set(),
    queue = ["Home.md"]
  while (queue.length) {
    const file = queue.shift()
    if (reached.has(file)) continue
    reached.add(file)
    queue.push(...(graph.get(file) ?? []))
  }
  for (const n of notes)
    if (n.data?.publish !== false && !reached.has(n.file))
      errors.push(`${n.file}: non raggiungibile da Home`)
  for (const area of areas)
    if (!notes.some((n) => n.index && path.posix.dirname(n.file) === area))
      errors.push(`${area}: indice principale mancante`)
  const redirects = JSON.parse(fs.readFileSync(inside("site/redirects.json"), "utf8"))
  for (const { from, to } of redirects) {
    inside(from)
    inside(to)
    if (!byFile.has(to)) errors.push(`Redirect senza destinazione: ${to}`)
  }
  return { notes, errors, warnings, reached: reached.size }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkContent()
  console.log(
    `${result.notes.length} documenti; ${result.reached} raggiungibili; ${result.errors.length} errori; ${result.warnings.length} avvisi editoriali.`,
  )
  for (const error of result.errors) console.error(error)
  if (process.argv.includes("--report")) {
    const linked = (message) =>
      message.replace(/^(.+?)\.md(?=:)/, (_, file) => `[[${file}|${path.posix.basename(file)}]]`)
    const counts = areas
      .map(
        (area) =>
          `- ${area}: ${result.notes.filter((note) => note.file.startsWith(area + "/")).length}`,
      )
      .join("\n")
    const report = `# Controllo del Vault\n\nRapporto rigenerabile con \`npm --prefix site run content:check -- --report\`.\n\n## Risultato Strutturale\n\n- Documenti, inclusa Home: ${result.notes.length}\n- Raggiungibili da Home: ${result.reached}\n- Errori bloccanti: ${result.errors.length}\n${counts}\n\n## Portata\n\nIl controllo verifica metadati, titoli, collegamenti e navigazione. Non esegue gli esempi delle note e non certifica la loro correttezza tecnica. L'assenza di una fonte esplicita e una priorita editoriale, non la prova di un errore; viceversa, avere una fonte non garantisce che il testo sia aggiornato.\n\n## Errori\n\n${result.errors.map((e) => `- ${linked(e)}`).join("\n") || "Nessuno."}\n\n## Avvisi Editoriali\n\n${result.warnings.map((w) => `- ${linked(w)}`).join("\n") || "Nessun avviso."}\n`
    fs.writeFileSync(inside("_Meta/Controllo del vault.md"), report)
  }
  if (result.errors.length) process.exitCode = 1
}
