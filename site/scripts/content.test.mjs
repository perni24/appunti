import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { checkSite } from "./check-site.mjs"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { resolver, wikiLinks } from "./vault.mjs"
import { sitePath, publicationData, transformNote, prepareContent } from "./prepare-content.mjs"

const parse = unified().use(remarkParse)
const note = (file, body, data = null) => ({
  file,
  body,
  data,
  index: file.split("/").at(-1).startsWith("Indice "),
  tree: parse.parse(body),
})

test("indici locali diventano landing di cartella, Home resta index", () => {
  assert.equal(
    sitePath(note("Programmazione/Python/Indice Python.md", "# Python")),
    "Programmazione/Python/index.md",
  )
  assert.equal(sitePath(note("Home.md", "# Home")), "index.md")
})
test("un indice privato o draft non viene pubblicato implicitamente", () => {
  assert.equal(
    publicationData(
      note("Programmazione/Indice Programmazione.md", "# Indice", { publish: false }),
    ),
    null,
  )
  assert.equal(
    publicationData(note("Programmazione/Indice Programmazione.md", "# Indice", { draft: true })),
    null,
  )
  assert.equal(
    publicationData(note("Programmazione/Indice Programmazione.md", "# Indice")).publish,
    true,
  )
})

test("gli indici mantengono nel sito un titolo breve e una classe dedicata", () => {
  const data = publicationData(note("Programmazione/Python/Indice Python.md", "# Indice Python"))
  assert.equal(data.title, "Python")
  assert.deepEqual(data.cssclasses, ["knowledge-index"])
})
test("link in codice e inline code non sono navigazione", () => {
  const n = note(
    "Home.md",
    "# Home\n\n`[[inesistente]]`\n\n```js\n[[inesistente]]\n```\n\n[[Home|Home]]",
  )
  assert.equal(wikiLinks(n).length, 1)
})
test("risoluzione contestuale distingue note omonime", () => {
  const a = note("Programmazione/Rust/Pagine/Generics.md", "# Generics"),
    b = note("Programmazione/TypeScript/Pagine/Generics.md", "# Generics")
  const resolve = resolver([a, b])
  assert.equal(resolve("Generics", "Programmazione/Rust/Pagine/Traits.md"), a)
  assert.equal(resolve("Generics", "Home.md"), null)
})
test("la trasformazione conserva label, ancora, codice e un unico frontmatter", () => {
  const home = note(
    "Home.md",
    "# Home\n\n[[Programmazione/Python/Indice Python#Base|Python]]\n\n`[[Home]]`",
  )
  const idx = note("Programmazione/Python/Indice Python.md", "# Python\n\n## Base\n\nTesto.")
  const out = transformNote(home, resolver([home, idx]))
  assert.match(out, /\[\[Programmazione\/Python\/index#Base\|Python\]\]/)
  assert.match(out, /`\[\[Home\]\]`/)
  assert.equal((out.match(/^---$/gm) || []).length, 2)
  assert.doesNotMatch(out, /^# Home$/m)
})
test("non si puo cancellare una directory temporanea arbitraria", async () => {
  await assert.rejects(prepareContent("C:/non-consentita"), /non consentita/)
})

test("i wikilink nelle tabelle mantengono il separatore escapato", () => {
  const n = note("Home.md", "# Home\n\n| Nota |\n| --- |\n| [[Home\\|Inizio]] |")
  assert.equal(wikiLinks(n)[0].target, "Home")
  assert.equal(wikiLinks(n)[0].label, "Inizio")
  assert.match(transformNote(n, resolver([n])), /\[\[index\\\|Inizio\]\]/)
})

test("verifica HTML: sottopercorso Pages, file mancanti e ancore", () => {
  const prefix = path.join(os.tmpdir(), "quartz-linktest-")
  const root = fs.mkdtempSync(prefix)
  try {
    fs.writeFileSync(
      path.join(root, "index.html"),
      '<h1 id="inizio">Home</h1><a href="/appunti/">Home</a><a href="./index#inizio">Titolo</a>',
    )
    assert.equal(checkSite(root).errors, 0)
    fs.writeFileSync(
      path.join(root, "index.html"),
      '<a href="./manca">Errore</a><a href="#inesistente">Errore</a>',
    )
    assert.throws(() => checkSite(root), /file non trovato:[\s\S]*ancora non trovata:/)
  } finally {
    if (!path.resolve(root).startsWith(path.resolve(prefix)))
      throw new Error("Directory di test inattesa")
    fs.rmSync(root, { recursive: true, force: true })
  }
})
