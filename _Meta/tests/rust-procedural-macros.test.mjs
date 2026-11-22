import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Procedural macros.md";
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
const prefix = "appunti-rust-procedural-macros-";
const root = fs.mkdtempSync(path.join(parent, prefix));
const project = path.join(root, "proc-guide");
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_)/i.test(key)) delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: tool("rustdoc"),
  RUST_BACKTRACE: "0",
  CARGO_HOME:
    process.env.RUST_PROC_TEST_CARGO_HOME || path.join(root, "cargo-home"),
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
if (process.env.RUST_PROC_TEST_TOOLS_BIN) {
  const bin = path.resolve(process.env.RUST_PROC_TEST_TOOLS_BIN);
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
function launch(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: project,
    env,
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
      "macros/Cargo.toml",
      "macros/src/lib.rs",
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
    return cargo(["build", "-p", "proc-demo", "--message-format=json"]);
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
        process.platform === "win32" ? "proc-demo.exe" : "proc-demo",
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
function derived(declaration, body) {
  return (
    "use note_macros::TypeName;\n#[derive(TypeName)]\n" +
    declaration +
    "\nfn main() {\n" +
    body +
    "\n}"
  );
}

test("struttura, metadata e blocchi della nota", () => {
  assert.equal(note.data.title, "Procedural macros");
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
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
  assert.equal(note.tree.children.filter((n) => n.type === "code").length, 13);
  assert.equal(blocks.size, 9);
});

test("workspace originale: build e assert runtime", () =>
  run(source("demo/src/main.rs")));

test("due test Rust dell'helper e check dell'intero workspace", () => {
  prepare();
  const result = ok(cargo(["test", "-p", "note-macros", "--lib"]));
  assert.match(result.stdout, /2 passed; 0 failed/);
  ok(cargo(["check", "--workspace"]));
});

test("union: diagnostica e span sul tipo del chiamante", () => {
  const error = fails(
    source("Union non supportata dal demo"),
    /TypeName supports only structs and enums/,
  );
  assert.ok(
    error.spans.some(
      (s) =>
        s.is_primary &&
        s.file_name.replaceAll("\\", "/").endsWith("demo/src/main.rs") &&
        s.text.some((line) => line.text.includes("union Bits")),
    ),
  );
});

test("collisione: errore E0592 invece di un metodo sovrascritto", () =>
  fails(source("Collisione con un metodo esistente"), "E0592"));

test("attributo: argomenti rifiutati con span nel chiamante", () => {
  const error = fails(
    source("Argomenti ignorati silenziosamente"),
    /keep_item takes no arguments/,
  );
  assert.ok(
    error.spans.some(
      (s) =>
        s.is_primary && s.text.some((line) => line.text.includes("unexpected")),
    ),
  );
});

test("derive su unit struct", () =>
  run(
    derived(
      "struct Marker;",
      'assert_eq!(Marker::type_name(), "Marker"); let _ = Marker;',
    ),
  ));

test("derive su tuple struct conserva i campi", () =>
  run(
    derived(
      "struct Entry(String);",
      'assert_eq!(Entry::type_name(), "Entry"); assert_eq!(Entry("ok".into()).0, "ok");',
    ),
  ));

test("enum generica: varianti, tipi non Clone e nessun bound Debug", () =>
  run(
    derived(
      "enum Choice<T> { Some(T), None }",
      'struct Opaque; assert_eq!(Choice::<Opaque>::type_name(), "Choice");' +
        "let _ = Choice::Some(Opaque); let _ = Choice::<Opaque>::None;",
    ),
  ));

test("enum vuota: metodo associato senza costruire valori", () =>
  run(derived("enum Never {}", 'assert_eq!(Never::type_name(), "Never");')));

test("default di tipo e const generic esclusi dalla firma impl", () =>
  run(
    derived(
      "struct Container<T = u8, const N: usize = 2> { values: [T; N] }",
      'assert_eq!(Container::<String, 0>::type_name(), "Container");' +
        "let c: Container = Container { values: [1, 2] }; assert_eq!(c.values, [1, 2]);",
    ),
  ));

test("where con tipo associato conserva il vincolo necessario", () =>
  run(
    derived(
      "struct Stream<T: Iterator> where T::Item: Copy { item: T::Item }",
      "type Iter = std::vec::IntoIter<u8>;" +
        'assert_eq!(Stream::<Iter>::type_name(), "Stream");' +
        "assert_eq!(Stream::<Iter> { item: 3 }.item, 3);",
    ),
  ));

test("lifetime e tipo unsized non diventano bound static o Sized", () =>
  run(
    derived(
      "struct View<'a, T: ?Sized> where T: 'a { value: &'a T }",
      'let data = String::from("local"); let v = View { value: data.as_str() };' +
        'assert_eq!(v.value, "local"); assert_eq!(View::<str>::type_name(), "View");',
    ),
  ));

test("struct senza Debug/Clone e con campo privato", () =>
  run(
    derived(
      "struct Holder<T> { value: T }",
      "struct Opaque; let h = Holder { value: Opaque }; let _ = h.value;" +
        'assert_eq!(Holder::<Opaque>::type_name(), "Holder");',
    ),
  ));

test("nomi in moduli diversi non sono identificatori globali", () =>
  run(
    "mod a { #[derive(note_macros::TypeName)] pub struct Item; }" +
      "mod b { #[derive(note_macros::TypeName)] pub struct Item; }" +
      "fn main() { assert_eq!(a::Item::type_name(), b::Item::type_name()); }",
  ));

test("percorso core resiste a stringify locale", () =>
  run(
    'macro_rules! stringify { ($($t:tt)*) => { "wrong" }; }' +
      derived("struct Actual;", 'assert_eq!(Actual::type_name(), "Actual");'),
  ));

test("derive ripetuto produce una collisione esplicita", () =>
  fails(derived("#[derive(TypeName)] struct Twice;", ""), "E0592"));

test("derive non applicabile a una funzione", () =>
  fails(
    "use note_macros::TypeName; #[derive(TypeName)] fn main() {}",
    "E0774",
  ));

test("identity: effetto runtime eseguito una volta e move non Copy", () =>
  run(
    "use note_macros::identity; fn main() {" +
      'let mut count = 0; let value = String::from("moved");' +
      "let output = identity!({ count += 1; value });" +
      'assert_eq!(output, "moved"); assert_eq!(count, 1); }',
  ));

test("identity: preserva la regola di ownership", () =>
  fails(
    'use note_macros::identity; fn main() { let value = String::from("moved");' +
      'let _output = identity!(value); println!("{value}"); }',
    "E0382",
  ));

test("identity: token utilizzabili in posizione item, tipo e pattern", () =>
  run(
    "use note_macros::identity; identity! { fn number() -> u8 { 7 } }" +
      "type Number = identity!(u8); fn main() { let n: Number = number();" +
      "let identity!(Some(value)) = Some(n) else { return }; assert_eq!(value, 7); }",
  ));

test("identity non corregge errori di tipo", () =>
  fails(
    'use note_macros::identity; fn main() { let _: u8 = identity!("text"); }',
    "E0308",
  ));

test("keep_item conserva visibilita, generics e attributi residui", () =>
  run(
    "mod nested { #[note_macros::keep_item()] #[inline] pub fn pass<T>(v: T) -> T { v } }" +
      'fn main() { assert_eq!(nested::pass(String::from("ok")), "ok"); }',
  ));

test("keep_item puo conservare una struct con derive", () =>
  run(
    "#[note_macros::keep_item] #[derive(note_macros::TypeName)] struct Record(u8);" +
      'fn main() { assert_eq!(Record::type_name(), "Record"); assert_eq!(Record(5).0, 5); }',
  ));

test("dipendenza rinominata: entry point e output non fissano il nome della crate", () =>
  run(
    source("demo/src/main.rs").replace(
      "use note_macros::",
      "use renamed_macros::",
    ),
    {
      "demo/Cargo.toml": source("demo/Cargo.toml").replace(
        'note-macros = { path = "../macros" }',
        'renamed-macros = { package = "note-macros", path = "../macros" }',
      ),
    },
  ));

test("regressione: impl senza generics non compila il demo", () =>
  fails(source("demo/src/main.rs"), "E0726", {
    "macros/src/expand.rs": source("macros/src/expand.rs").replace(
      "impl #impl_generics #ident #ty_generics #where_clause",
      "impl #ident",
    ),
  }));

test("crate proc-macro non esporta normali funzioni pubbliche", () =>
  fails(
    source("demo/src/main.rs"),
    /cannot export any items other than functions tagged/,
    {
      "macros/src/lib.rs":
        source("macros/src/lib.rs") + "\npub fn runtime_api() {}\n",
    },
  ));

test("macro non invocabile nella crate che la definisce", () =>
  fails(
    source("demo/src/main.rs"),
    /can't use a procedural macro from the same crate/,
    {
      "macros/src/lib.rs":
        source("macros/src/lib.rs") + "\n#[derive(TypeName)] struct Local;\n",
    },
  ));

test("baseline ripristinata dopo le sonde negative", () =>
  run(source("demo/src/main.rs")));
