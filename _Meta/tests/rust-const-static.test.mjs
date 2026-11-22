import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/const e static.md";
const originalBytes = fs.readFileSync(file);
const note = parseNote(file);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type === "code" && node.lang === "rust") {
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, node.value);
  }
}
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-const-static-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  try {
    assert.deepEqual(fs.readFileSync(file), originalBytes);
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of [
  "RUSTFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
function launch(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}
let sequence = 0;
function run(code, options = {}) {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const compiled = launch(
    rustc,
    [
      "--edition=" + (options.edition || "2024"),
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error) {
    assert.notEqual(compiled.status, 0);
    const errors = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      errors.some((d) => d.level === "error" && d.code?.code === options.error),
      compiled.stderr,
    );
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, [], dir);
  assert.equal(execution.status, 0, execution.stdout + execution.stderr);
  assert.equal(execution.stderr, "");
  return execution.stdout.replaceAll("\r\n", "\n");
}
function from(title) {
  assert.ok(blocks.has(title), title);
  return blocks.get(title);
}
function replace(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
const limits = "Limiti e costanti associate";
const identity = "Riferimenti alla stessa allocazione";
const drops = "Costante non Copy e Drop";
const lazy = "Inizializzare al primo accesso";
const mutex = "Mutabilita condivisa senza static mut";
const cells = "Una const con interior mutability non e un singleton";
const generic = "Uno static dentro una funzione generica resta unico";
const nonConst = "Chiamare una normale funzione in un inizializzatore";
const sync = "Usare un tipo non Sync come static condiviso";
const moving = "Spostare un valore non Copy fuori da uno static";
const lifetime = "Supporre che ogni prestito di const sia statico";

test("baseline reale e inventario di undici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 11);
});
test("frontmatter invariato, struttura, fonti e codice non distruttivo", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "const e static",
  ]);
  for (const title of [
    "Sintesi",
    "Quando usarlo",
    "Come funziona",
    "API / Sintassi",
    "Esempio pratico",
    "Varianti",
    "Errori comuni",
    "Checklist",
    "Collegamenti",
    "Fonti",
    "Navigazione",
  ]) {
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  }
  for (const suffix of [
    "reference/items/constant-items.html",
    "reference/items/static-items.html",
    "reference/const_eval.html",
    "edition-guide/rust-2024/static-mut-references.html",
  ]) {
    assert.ok(
      originalBytes.toString().includes("https://doc.rust-lang.org/" + suffix),
    );
  }
  for (const code of blocks.values()) {
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|todo!|unimplemented!|thread::sleep|process::exit/,
    );
  }
});
for (const title of [limits, identity, lazy, mutex, cells, generic]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
test("programma originale: due Drop indipendenti", () => {
  assert.equal(run(from(drops)), "drop 7\ndrop 7\n");
});
for (const [title, error] of [
  [nonConst, "E0015"],
  [sync, "E0277"],
  [moving, "E0507"],
  [lifetime, "E0515"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}
test("anche static richiede una funzione const", () => {
  run(replace(from(nonConst), "const PORT", "static PORT"), { error: "E0015" });
});
test("correzione: funzione const con costante", () => {
  assert.equal(
    run(replace(from(nonConst), "fn default_port", "const fn default_port")),
    "8080\n",
  );
});
test("correzione: funzione const con static", () => {
  const code = replace(
    replace(from(nonConst), "fn default_port", "const fn default_port"),
    "const PORT",
    "static PORT",
  );
  assert.equal(run(code), "8080\n");
});
test("correzione: inizializzazione locale a runtime", () => {
  let code = replace(from(nonConst), "const PORT: u16 = default_port();", "");
  code = replace(
    code,
    'println!("{PORT}");',
    'let port = default_port(); println!("{port}");',
  );
  assert.equal(run(code), "8080\n");
});
test("correzione: clonare senza spostare lo static", () => {
  const code = replace(
    from(moving),
    "let owned = NAME;",
    "let owned = NAME.clone(); assert!(NAME.is_empty());",
  );
  assert.equal(run(code), "");
});
test("correzione: restituire una cella per valore", () => {
  let code = replace(from(lifetime), "-> &'static Cell<u32>", "-> Cell<u32>");
  code = replace(code, "&EMPTY_COUNTER", "EMPTY_COUNTER");
  code = replace(
    code,
    "fn main() {}",
    "fn main() { let a = counter(); a.set(3); assert_eq!(counter().get(), 0); }",
  );
  assert.equal(run(code), "");
});
test("prestito di una costante scalare promuovibile", () => {
  assert.equal(
    run(
      "const VALUE: u32 = 3; fn value() -> &'static u32 { &VALUE } fn main() { assert_eq!(*value(), 3); }",
    ),
    "",
  );
});
test("static non esegue Drop al ritorno normale da main", () => {
  let code = replace(
    from(drops),
    "fn main() {",
    "static SHARED: Ticket = Ticket(9);\nfn main() { assert_eq!(SHARED.0, 9);",
  );
  assert.equal(run(code), "drop 7\ndrop 7\n");
});
test("static immutabile distinto di dimensione non nulla", () => {
  let code = replace(
    from(identity),
    'static APP_NAME: &str = "notes";',
    'static APP_NAME: &str = "notes";\nstatic OTHER_NAME: &str = "notes";',
  );
  code = replace(
    code,
    "fn main() {",
    "fn main() { assert!(!std::ptr::eq(&APP_NAME, &OTHER_NAME));",
  );
  assert.equal(run(code), "");
});
test("static in funzione sopravvive a chiamate distinte", () => {
  assert.equal(
    run(
      "fn slot() -> &'static u8 { static VALUE: u8 = 7; &VALUE } fn main() { assert!(std::ptr::eq(slot(), slot())); }",
    ),
    "",
  );
});
test("static mut refs e deny in edition 2024", () => {
  run(
    "static mut VALUE: u32 = 0; fn main() { unsafe { let _reference = &VALUE; } }",
    { error: "static_mut_refs" },
  );
});
test("bound static non impedisce Drop locale", () => {
  const code = replace(
    from(drops),
    "let first = DEFAULT_TICKET;",
    "fn accepts_static<T: 'static>(_: &T) {}\nlet first = DEFAULT_TICKET; accepts_static(&first);",
  );
  assert.equal(run(code), "drop 7\ndrop 7\n");
});
