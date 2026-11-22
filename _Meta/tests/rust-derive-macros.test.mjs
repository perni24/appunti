import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Derive macros.md";
const original = fs.readFileSync(file);
const note = parseNote(file);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type === "code" && ["rust", "toml"].includes(node.lang)) {
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, node.value);
  }
}
function source(name) {
  assert.ok(blocks.has(name), name);
  return blocks.get(name);
}
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-derive-macros-";
const root = fs.mkdtempSync(path.join(parent, prefix));
const project = path.join(root, "derive-guide");
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_)/i.test(key)) delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: tool("rustdoc"),
  RUST_BACKTRACE: "0",
  CARGO_HOME:
    process.env.RUST_DERIVE_TEST_CARGO_HOME || path.join(root, "cargo-home"),
  CARGO_TARGET_DIR: path.join(root, "target"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
});
for (let dir = root; ; dir = path.dirname(dir)) {
  for (const name of ["config", "config.toml"])
    assert.ok(
      !fs.existsSync(path.join(dir, ".cargo", name)),
      "Unexpected Cargo config: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
for (const name of ["config", "config.toml"])
  assert.ok(
    !fs.existsSync(path.join(env.CARGO_HOME, name)),
    "Unexpected cache configuration",
  );
if (process.env.RUST_DERIVE_TEST_TOOLS_BIN) {
  const bin = path.resolve(process.env.RUST_DERIVE_TEST_TOOLS_BIN);
  for (const name of ["dlltool.exe", "as.exe"])
    assert.ok(fs.existsSync(path.join(bin, name)), "Missing tool: " + name);
  const key =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  env[key] = bin + path.delimiter + (env[key] || "");
}
after(() => {
  try {
    assert.deepEqual(fs.readFileSync(file), original);
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
function write(name, value) {
  const target = path.resolve(project, name);
  assert.ok(target.startsWith(project + path.sep));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
function launch(executable, args, cwd = project, overrides = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function cargo(args) {
  return launch(tool("cargo"), [...args, "--locked", "--offline"]);
}
let prepared = false,
  setupError;
function prepare() {
  if (prepared) return;
  if (setupError) throw setupError;
  try {
    for (const name of [
      "Cargo.toml",
      "schema/Cargo.toml",
      "schema/src/lib.rs",
      "macros/Cargo.toml",
      "macros/src/lib.rs",
      "macros/src/config.rs",
      "macros/src/expand.rs",
      "demo/Cargo.toml",
      "demo/src/main.rs",
    ])
      write(name, source(name));
    ok(launch(tool("cargo"), ["generate-lockfile", "--offline"]));
    const metadata = JSON.parse(
      ok(cargo(["metadata", "--format-version=1"])).stdout,
    );
    const versions = metadata.packages
      .filter((p) => p.source)
      .map((p) => p.name + "@" + p.version)
      .sort();
    assert.deepEqual(versions, [
      "proc-macro2@1.0.107",
      "quote@1.0.47",
      "syn@3.0.10",
      "unicode-ident@1.0.27",
    ]);
    console.log("Dependency baseline: " + versions.join(", "));
    ok(cargo(["build", "--workspace"]));
    prepared = true;
  } catch (error) {
    setupError = error;
    throw error;
  }
}
function build(main, changes = {}) {
  prepare();
  const files = { "demo/src/main.rs": main, ...changes };
  try {
    for (const [name, value] of Object.entries(files)) write(name, value);
    return cargo(["build", "-p", "derive-demo", "--message-format=json"]);
  } finally {
    for (const name of Object.keys(files)) write(name, source(name));
  }
}
function run(main, changes) {
  ok(build(main, changes));
  const result = ok(
    launch(
      path.join(
        env.CARGO_TARGET_DIR,
        "debug",
        process.platform === "win32" ? "derive-demo.exe" : "derive-demo",
      ),
      [],
    ),
  );
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
}
function fails(main, expected, changes) {
  const result = build(main, changes);
  assert.notEqual(result.status, 0);
  const errors = result.stdout
    .split("\n")
    .filter((l) => l.startsWith("{"))
    .map(JSON.parse)
    .filter((m) => m.reason === "compiler-message")
    .map((m) => m.message)
    .filter((m) => m.level === "error");
  const found = errors.find((m) =>
    expected instanceof RegExp
      ? expected.test(m.message)
      : m.code?.code === expected,
  );
  assert.ok(found, result.stdout + result.stderr);
  assert.ok(
    !errors.some((m) =>
      /proc macro panicked|custom derive panicked/.test(m.message),
    ),
  );
  return found;
}
function derived(declaration, body = "", attrs = "") {
  return (
    "use schema::Describe;\n#[derive(Describe)]\n" +
    "#[describe(crate_path = ::schema)]\n" +
    attrs +
    "\n" +
    declaration +
    "\nfn main() {\n" +
    body +
    "\n}"
  );
}
test("metadata, template e 18 blocchi, senza HTML accidentale", () => {
  assert.equal(note.data.title, "Derive macros");
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  assert.equal(blocks.size, 14);
  assert.equal(note.tree.children.filter((n) => n.type === "code").length, 18);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.equal(headings.filter((n) => n.depth === 1).length, 1);
  for (const name of [
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
  ])
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  const walk = (n) => {
    assert.notEqual(n.type, "html");
    for (const c of n.children ?? []) walk(c);
  };
  walk(note.tree);
});
test("workspace originale: trait, re-export, alias, generics e skip non redige Debug", () =>
  run(source("demo/src/main.rs")));
test("due test Rust dell'helper e check workspace", () => {
  prepare();
  assert.match(
    ok(cargo(["test", "-p", "note-schema-derive", "--lib"])).stdout,
    /2 passed; 0 failed/,
  );
  ok(cargo(["check", "--workspace"]));
});
test("Debug e Clone: programma standard completo", () => {
  prepare();
  write("standalone.rs", source("Usare un derive esistente"));
  const exe = path.join(
    project,
    process.platform === "win32" ? "standalone.exe" : "standalone",
  );
  ok(launch(rustc, ["--edition=2024", "standalone.rs", "-o", exe]));
  const result = ok(launch(exe, []));
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});
test("thiserror: programma completo col manifest della nota collegata", () => {
  const other = parseNote("Programmazione/Rust/Pagine/thiserror e anyhow.md");
  let heading, manifest;
  for (const n of other.tree.children) {
    if (n.type === "heading") heading = text(n);
    if (n.type === "code" && n.lang === "toml" && heading === "Cargo.toml")
      manifest = n.value;
  }
  assert.ok(manifest);
  const home = process.env.RUST_DERIVE_TEST_ERROR_CARGO_HOME;
  assert.ok(
    home,
    "Set RUST_DERIVE_TEST_ERROR_CARGO_HOME to the populated error-guide cache",
  );
  for (const name of ["config", "config.toml"])
    assert.ok(!fs.existsSync(path.join(home, name)));
  const dir = path.join(root, "error-guide");
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.writeFileSync(path.join(dir, "Cargo.toml"), manifest);
  fs.writeFileSync(
    path.join(dir, "src/main.rs"),
    source("thiserror: implementazioni pronte"),
  );
  const overrides = {
    CARGO_HOME: home,
    CARGO_TARGET_DIR: path.join(root, "error-target"),
  };
  ok(launch(tool("cargo"), ["generate-lockfile", "--offline"], dir, overrides));
  const metadata = JSON.parse(
    ok(
      launch(
        tool("cargo"),
        ["metadata", "--format-version=1", "--locked", "--offline"],
        dir,
        overrides,
      ),
    ).stdout,
  );
  const versions = metadata.packages
    .filter((p) => p.source)
    .map((p) => p.name + "@" + p.version)
    .sort();
  assert.deepEqual(versions, [
    "anyhow@1.0.104",
    "proc-macro2@1.0.107",
    "quote@1.0.47",
    "syn@3.0.9",
    "thiserror-impl@2.0.21",
    "thiserror@2.0.21",
    "unicode-ident@1.0.27",
  ]);
  console.log("Error demo baseline: " + versions.join(", "));
  const result = ok(
    launch(
      tool("cargo"),
      ["run", "--quiet", "--locked", "--offline"],
      dir,
      overrides,
    ),
  );
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});
test("typo: diagnostica e span sul nome errato", () => {
  const error = fails(
    source("Opzione scritta male"),
    /unsupported describe option here/,
  );
  assert.ok(
    error.spans.some(
      (s) => s.is_primary && s.text.some((l) => l.text.includes("renmae")),
    ),
  );
});
test("skip e rename: conflitto esplicito", () =>
  fails(
    source("Configurazione contraddittoria"),
    /skip conflicts with rename/,
  ));
test("impl manuale: conflitto E0119", () =>
  fails(source("Implementazione duplicata"), "E0119"));
test("default del nome, ordine e tipo senza Clone/Debug", () =>
  run(
    derived(
      "struct Item<T> { second: T, first: u8 }",
      'struct Opaque; assert_eq!(Item::<Opaque>::NAME, "Item");' +
        'assert_eq!(Item::<Opaque>::FIELDS, &["second", "first"]);' +
        "let item = Item { second: Opaque, first: 3 }; let _ = item.second; assert_eq!(item.first, 3);",
    ),
  ));
test("struct nominata vuota: nessun campo", () =>
  run(
    derived(
      "struct Empty {}",
      "assert_eq!(Empty::FIELDS.len(), 0); let _ = Empty {};",
    ),
  ));
test("tutti i campi saltati restano accessibili", () =>
  run(
    derived(
      "struct Hidden { #[describe(skip)] value: u8 }",
      "assert!(Hidden::FIELDS.is_empty()); assert_eq!(Hidden { value: 5 }.value, 5);",
    ),
  ));
test("raw identifiers normalizzati nei metadati", () =>
  run(
    derived(
      "struct r#type { r#match: u8 }",
      'assert_eq!(r#type::NAME, "type"); assert_eq!(r#type::FIELDS, &["match"]);',
    ),
  ));
test("rename accetta stringhe, spazi e Unicode senza creare identificatori", () =>
  run(
    derived(
      'struct Item { #[describe(rename = "first name")] id: u8 }',
      'assert_eq!(Item::NAME, "caf\\u{e9}"); assert_eq!(Item::FIELDS, &["first name"]);',
      '#[describe(rename = "caf\\u{e9}")]',
    ),
  ));
test("default generici e where con tipi associati", () =>
  run(
    derived(
      "struct Item<T: Iterator = std::vec::IntoIter<u8>, const N: usize = 1> " +
        "where T::Item: Copy { value: T::Item, bytes: [u8; N] }",
      'type Example = Item; assert_eq!(Example::FIELDS, &["value", "bytes"]);',
    ),
  ));
test("lifetime non static e tipo unsized", () =>
  run(
    derived(
      "struct View<'a, T: ?Sized> where T: 'a { value: &'a T }",
      'let local = String::from("x"); let v = View { value: local.as_str() };' +
        'assert_eq!(v.value, "x"); assert_eq!(View::<str>::FIELDS, &["value"]);',
    ),
  ));
test("default del percorso con dipendenza non rinominata", () =>
  run(
    "use note_schema::Describe; #[derive(Describe)] struct Item { id: u8 }" +
      'fn main() { assert_eq!(Item::NAME, "Item"); }',
    {
      "demo/Cargo.toml": source("demo/Cargo.toml").replace(
        'schema = { package = "note-schema", path = "../schema" }',
        'note-schema = { path = "../schema" }',
      ),
    },
  ));
test("alias Cargo senza override non viene indovinato", () =>
  fails(
    "use schema::Describe; #[derive(Describe)] struct Item { id: u8 } fn main() {}",
    "E0433",
  ));
test("percorso runtime configurato con alias interno", () =>
  run(
    "use schema as local_schema; use local_schema::Describe;" +
      "#[derive(Describe)] #[describe(crate_path = local_schema)] struct Item { id: u8 }" +
      'fn main() { assert_eq!(Item::NAME, "Item"); }',
  ));
for (const [name, declaration, expected] of [
  ["tuple struct", "struct Item(u8);", /Describe requires named fields/],
  ["unit struct", "struct Item;", /Describe requires named fields/],
  ["enum", "enum Item { A }", /Describe requires a struct/],
  ["union", "union Item { id: u8 }", /Describe requires a struct/],
])
  test(name + ": forma non supportata rifiutata", () =>
    fails(derived(declaration), expected),
  );
for (const [name, attrs, field, expected] of [
  [
    "rename duplicato",
    '#[describe(rename = "a")] #[describe(rename = "b")]',
    "id: u8",
    /duplicate rename/,
  ],
  [
    "crate_path duplicato",
    "#[describe(crate_path = ::schema)]",
    "id: u8",
    /duplicate crate_path/,
  ],
  [
    "skip sul tipo",
    "#[describe(skip)]",
    "id: u8",
    /unsupported describe option here/,
  ],
  [
    "crate_path sul campo",
    "",
    "#[describe(crate_path = ::schema)] id: u8",
    /unsupported describe option here/,
  ],
  [
    "skip duplicato",
    "",
    "#[describe(skip)] #[describe(skip)] id: u8",
    /duplicate skip/,
  ],
  [
    "campo con opzione sconosciuta",
    "",
    "#[describe(unknown)] id: u8",
    /unsupported describe option here/,
  ],
  [
    "rename vuoto",
    '#[describe(rename = "")]',
    "id: u8",
    /rename cannot be empty/,
  ],
  [
    "rename non stringa",
    "#[describe(rename = 7)]",
    "id: u8",
    /expected string literal/,
  ],
  ["skip con valore", "", "#[describe(skip = true)] id: u8", /expected.*,/],
  ["rename senza uguale", "#[describe(rename)]", "id: u8", /expected.*=/],
  [
    "nomi campi duplicati",
    "",
    '#[describe(rename = "same")] a: u8, #[describe(rename = "same")] b: u8',
    /duplicate field name/,
  ],
  [
    "conflitto in attributi separati",
    "",
    '#[describe(rename = "x")] #[describe(skip)] id: u8',
    /skip conflicts with rename/,
  ],
])
  test(name + ": diagnostica mirata", () =>
    fails(derived("struct Item { " + field + " }", "", attrs), expected),
  );
test("nome duplicato escluso con skip non confligge", () =>
  run(
    derived(
      'struct Item { #[describe(skip)] a: u8, #[describe(rename = "a")] b: u8 }',
      'assert_eq!(Item::FIELDS, &["a"]);',
    ),
  ));
test("nomi uguali tra tipi non sono identificatori globali", () =>
  run(
    "mod a { #[derive(schema::Describe)] #[describe(crate_path = ::schema)] pub struct Item {} }" +
      "mod b { #[derive(schema::Describe)] #[describe(crate_path = ::schema)] pub struct Item {} }" +
      "fn main() { use schema::Describe; assert_eq!(a::Item::NAME, b::Item::NAME); }",
  ));
test("helper senza derive non e una attribute macro", () =>
  fails(
    "#[describe(skip)] struct Item {} fn main() {}",
    /cannot find attribute.*describe/,
  ));
test("derive ripetuto genera impl in conflitto", () =>
  fails(derived("struct Item {}", "", "#[derive(Describe)]"), "E0119"));
test("ritornare anche l'input originale duplica il tipo", () =>
  fails(derived("struct Item {}"), "E0428", {
    "macros/src/expand.rs": source("macros/src/expand.rs").replace(
      "Ok(quote! {",
      "Ok(quote! { #input",
    ),
  }));
test("ripristino finale del workspace originale", () =>
  run(source("demo/src/main.rs")));
