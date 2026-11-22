import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const cargo = process.env.CARGO_TEST_EXECUTABLE || tool("cargo");
const rustdoc = process.env.RUSTDOC_TEST_EXECUTABLE || tool("rustdoc");
const names = ["Funzioni", "Commenti e documentazione", "Controllo di flusso"];
const notes = names.map((name) =>
  parseNote(`Programmazione/Rust/Pagine/${name}.md`),
);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  const result = new Map();
  let heading;
  for (const node of note.tree.children) {
    if (node.type === "heading") heading = text(node);
    if (node.type === "code" && node.lang === "rust") {
      assert.ok(heading);
      assert.ok(!result.has(heading));
      result.set(heading, node.value);
    }
  }
  return result;
});
const prefix = "appunti-rust-funzioni-doc-flusso-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = {
  ...process.env,
  RUSTC: rustc,
  RUSTDOC: rustdoc,
  RUST_BACKTRACE: "0",
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
};
for (const key of [
  "RUSTFLAGS",
  "RUSTDOCFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "CARGO_ENCODED_RUSTDOCFLAGS",
  "CARGO_TARGET_DIR",
  "CARGO_BUILD_TARGET",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function launch(exe, args, cwd = root, extraEnv = {}) {
  const result = spawnSync(exe, args, {
    cwd,
    env: { ...env, ...extraEnv },
    encoding: "utf8",
    timeout: 90000,
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
function compile(code, errorCode, extra = []) {
  const dir = directory();
  const input = path.join(dir, "main.rs");
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  fs.writeFileSync(input, code);
  const result = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name",
      "note_example",
      "--error-format=json",
      ...extra,
      input,
      "-o",
      output,
    ],
    dir,
  );
  if (errorCode) {
    assert.notEqual(result.status, 0);
    const diagnostics = result.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === errorCode,
      ),
      result.stderr,
    );
    return;
  }
  ok(result);
  return output;
}
function run(code) {
  return ok(launch(compile(code), []));
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading);
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function probe(i, heading, assertions) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + assertions,
  );
}
const library = () => source(1, "Sorgente documentato");
function packageFixture(code = library()) {
  const parent = directory();
  ok(
    launch(
      cargo,
      ["new", "note-rust", "--lib", "--edition", "2024", "--vcs", "none"],
      parent,
    ),
  );
  const dir = path.join(parent, "note-rust");
  fs.writeFileSync(path.join(dir, "src/lib.rs"), code);
  return dir;
}
function docTests(dir) {
  return launch(cargo, ["test", "--doc"], dir);
}
function passed(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((sum, match) => sum + Number(match[1]), 0);
}

test("toolchain 1.99.1 reale e inventario di 17 blocchi Rust", () => {
  for (const executable of [rustc, cargo, rustdoc])
    assert.match(ok(launch(executable, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [6, 2, 9],
  );
  const commands = notes[1].tree.children
    .filter((n) => n.type === "code" && n.lang === "powershell")
    .map((n) => n.value);
  assert.deepEqual(commands, [
    "cargo new note-rust --lib --edition 2024 --vcs none",
    "cd note-rust",
    "cargo doc --no-deps",
    "cargo test --doc",
    "cargo doc --no-deps --open",
  ]);
});
for (const [i, note] of notes.entries()) {
  test(`${names[i]}: metadati e struttura`, () => {
    assert.equal(note.data.type, "technical-note");
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Rust");
    assert.equal(String(note.data.date), "2026-05-20");
    const headings = note.tree.children.filter((n) => n.type === "heading");
    assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
      note.data.title,
    ]);
    for (const h of [
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
        headings.some((n) => text(n) === h),
        h,
      );
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
const failures = new Map([
  ["Valore usato dopo il trasferimento", "E0382"],
  ["Break con valore nel costrutto sbagliato", "E0571"],
]);
const outputs = new Map([
  ["Parametri e risultato unit", "5\n"],
  ["Predicato riutilizzabile", "true\n"],
  ["If come espressione", "Attivo\n"],
  ["Classificare tutti i segni", "negativo\nzero\npositivo\n"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    if (heading === "Sorgente documentato") continue;
    test(`${names[i]}: ${heading}`, () => {
      const error = failures.get(heading);
      if (error) compile(code, error);
      else {
        const result = run(code);
        assert.equal(
          result.stdout.replaceAll("\r\n", "\n"),
          outputs.get(heading) ?? "",
        );
        assert.equal(result.stderr, "");
      }
    });
  }
}
test("predicato: estremi interi", () => {
  run(
    probe(
      0,
      "Predicato riutilizzabile",
      "assert!(is_even(i32::MIN)); assert!(!is_even(i32::MAX));",
    ),
  );
});
test("primo positivo: input vuoto, valori limite e ordine", () => {
  run(
    probe(
      0,
      "Uscita anticipata e valore assente",
      "assert_eq!(first_positive(&[i32::MIN, 0, i32::MAX, 1]), Some(i32::MAX)); assert_eq!(first_positive(&[]), None);",
    ),
  );
});
test("lettura UTF-8 e modifica di stringa vuota", () => {
  run(
    probe(
      0,
      "Mutazione locale e modifica tramite riferimento",
      String.raw`assert_eq!(byte_len("\u{00E8}"), 2); let mut text = String::new(); append_marker(&mut text); assert_eq!(text, "!");`,
    ),
  );
});
test("prestito corregge il contratto senza clonazione", () => {
  let code = replaceOnce(
    source(0, "Valore usato dopo il trasferimento"),
    "text: String",
    "text: &str",
  );
  code = replaceOnce(code, "consume(label)", "consume(&label)");
  assert.equal(run(code).stdout.trim(), "Rust");
});
test("argomento callback non e il risultato bool della chiamata", () => {
  const code = replaceOnce(
    source(0, "Passare una funzione come argomento"),
    "accepts(8, is_even)",
    "accepts(8, is_even(8))",
  );
  compile(code, "E0308");
});
test("closure con cattura non convertibile a fn pointer", () => {
  const code = probe(
    0,
    "Passare una funzione come argomento",
    "let threshold = 3; accepts(8, |value| value > threshold);",
  );
  compile(code, "E0308");
});
test("fn annidata non cattura le variabili esterne", () => {
  compile(
    'fn main() { let value = 3; fn inner() -> i32 { value } println!("{}", inner()); }',
    "E0434",
  );
});
test("due funzioni omonime non creano un overload", () => {
  compile("fn f(_: i32) {} fn f(_: &str) {} fn main() {}", "E0428");
});
test("parametro obbligatorio omesso", () => {
  compile(
    replaceOnce(source(0, "Parametri e risultato unit"), "add(2, 3)", "add(2)"),
    "E0061",
  );
});
test("match: estremi e copertura mancante", () => {
  run(
    probe(
      2,
      "Match esaustivo su Option",
      'assert_eq!(describe(Some(i32::MIN)), "presente"); assert_eq!(describe(Some(i32::MAX)), "presente");',
    ),
  );
  compile(
    replaceOnce(
      source(2, "Match esaustivo su Option"),
      'None => "assente",',
      "",
    ),
    "E0004",
  );
});
test("range vuoto, range inverso e limiti inclusivi", () => {
  run(
    probe(
      2,
      "Range e for",
      "assert_eq!((0..0).count(), 0); assert_eq!((4..1).count(), 0); assert_eq!((0..=0).count(), 1); assert_eq!((4..=1).count(), 0);",
    ),
  );
});
test("while con condizione subito falsa", () => {
  let code = replaceOnce(
    source(2, "While con avanzamento esplicito"),
    "let mut remaining = 3;",
    "let mut remaining = 0;",
  );
  code = replaceOnce(
    code,
    "assert_eq!(visited, [2, 0]);",
    "assert!(visited.is_empty());",
  );
  run(code);
});
test("label: senza uscita esterna viene trovato un altro risultato", () => {
  let code = replaceOnce(
    source(2, "Uscire da un ciclo esterno"),
    "break 'search;",
    "break;",
  );
  code = replaceOnce(
    code,
    "assert_eq!(found, Some((1, 2)));",
    "assert_eq!(found, Some((2, 1)));",
  );
  run(code);
});
test("loop: break con tipi diversi rifiutato", () => {
  const code = replaceOnce(
    source(2, "Loop che produce un risultato"),
    "count += 1;",
    "count += 1; if count == 1 { break; }",
  );
  compile(code, "E0308");
});
test("push durante prestito mutabile del vettore rifiutato", () => {
  const code = replaceOnce(
    source(2, "Lettura e modifica di una collezione"),
    "*value *= 2;",
    "values.push(9); *value *= 2;",
  );
  compile(code, "E0499");
});
test("for su Vec posseduto consuma il vettore", () => {
  compile(
    'fn main() { let values = vec![1, 2]; for value in values { println!("{value}"); } println!("{}", values.len()); }',
    "E0382",
  );
});

test("libreria originale: cargo new e tre doctest reali", () => {
  const dir = packageFixture();
  assert.equal(fs.existsSync(path.join(dir, ".git")), false);
  const manifest = fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8");
  assert.match(manifest, /name = "note-rust"/);
  assert.match(manifest, /edition = "2024"/);
  assert.equal(passed(docTests(dir)), 3);
});
test("rustdoc HTML: link ai simboli e righe nascoste", () => {
  const dir = packageFixture();
  ok(
    launch(cargo, ["doc", "--no-deps"], dir, {
      RUSTDOCFLAGS: "-D rustdoc::broken_intra_doc_links",
    }),
  );
  const index = fs.readFileSync(
    path.join(dir, "target/doc/note_rust/index.html"),
    "utf8",
  );
  assert.match(index, /href="fn\.add\.html"/);
  assert.match(index, /href="fn\.is_even\.html"/);
  const html = fs.readFileSync(
    path.join(dir, "target/doc/note_rust/fn.add.html"),
    "utf8",
  );
  const code = [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)]
    .map((m) => m[1])
    .join("\n");
  assert.match(code, /assert_eq/);
  assert.doesNotMatch(code, /note_rust::add/);
});
test("cargo doc puo riuscire anche con asserzione doctest errata", () => {
  const dir = packageFixture(replaceOnce(library(), "Some(5)", "Some(6)"));
  ok(launch(cargo, ["doc", "--no-deps"], dir));
  const result = docTests(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /assertion .*failed|FAILED/);
});
test("compile_fail fallisce se l'argomento diventa valido", () => {
  const dir = packageFixture(
    replaceOnce(
      library(),
      'note_rust::is_even("2");',
      "note_rust::is_even(2);",
    ),
  );
  const result = docTests(dir);
  assert.notEqual(result.status, 0);
  assert.match(
    result.stdout + result.stderr,
    /compiled successfully|test compiled successfully/i,
  );
});
test("compile_fail stable puo passare per un motivo diverso", () => {
  const dir = packageFixture(
    replaceOnce(
      library(),
      'note_rust::is_even("2");',
      "note_rust::missing_function();",
    ),
  );
  assert.equal(passed(docTests(dir)), 3);
});
test("nome crate errato fa fallire i doctest normali", () => {
  const dir = packageFixture(
    replaceOnce(library(), "use note_rust::add;", "use missing_crate::add;"),
  );
  const result = docTests(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /missing_crate/);
});
test("link intra-doc mancante rilevato come errore con lint esplicito", () => {
  const dir = packageFixture(
    replaceOnce(library(), "[`add`]", "[`missing_function`]"),
  );
  const result = launch(cargo, ["doc", "--no-deps"], dir, {
    RUSTDOCFLAGS: "-D rustdoc::broken_intra_doc_links",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unresolved link/);
});
test("no_run compila senza eseguire un panic dimostrativo", () => {
  const dir = packageFixture(
    '/// ```no_run\n/// panic!("not executed");\n/// ```\npub fn demo() {}',
  );
  assert.equal(passed(docTests(dir)), 1);
});
test("no_run non nasconde gli errori di tipo", () => {
  const dir = packageFixture(
    '/// ```no_run\n/// let value: u32 = "wrong";\n/// ```\npub fn demo() {}',
  );
  assert.notEqual(docTests(dir).status, 0);
});
test("ignore esclude mentre text non diventa un doctest", () => {
  const dir = packageFixture(
    "/// ```ignore\n/// not valid Rust\n/// ```\n/// ```text\n/// not Rust either\n/// ```\npub fn demo() {}",
  );
  const result = ok(docTests(dir));
  assert.match(result.stdout, /0 passed; 0 failed; 1 ignored/);
});
test("should_panic richiede un panic runtime", () => {
  const dir = packageFixture(
    '/// ```should_panic\n/// panic!("expected");\n/// ```\npub fn demo() {}',
  );
  assert.equal(passed(docTests(dir)), 1);
  fs.writeFileSync(
    path.join(dir, "src/lib.rs"),
    "/// ```should_panic\n/// assert!(true);\n/// ```\npub fn demo() {}",
  );
  assert.notEqual(docTests(dir).status, 0);
});
test("documentare item privati non cambia la visibilita", () => {
  const dir = packageFixture(
    library() + "\n/// Interno.\nfn internal_helper() {}\n",
  );
  ok(launch(cargo, ["doc", "--no-deps"], dir));
  assert.equal(
    fs.existsSync(
      path.join(dir, "target/doc/note_rust/fn.internal_helper.html"),
    ),
    false,
  );
  ok(launch(cargo, ["doc", "--no-deps", "--document-private-items"], dir));
  assert.ok(
    fs.existsSync(
      path.join(dir, "target/doc/note_rust/fn.internal_helper.html"),
    ),
  );
  fs.appendFileSync(
    path.join(dir, "src/lib.rs"),
    "\n/// ```\n/// note_rust::internal_helper();\n/// ```\npub fn visibility_probe() {}\n",
  );
  const result = docTests(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /private|E0603/);
});
test("doc comment esterno senza item non ammesso", () => {
  const dir = directory();
  const input = path.join(dir, "lib.rs");
  fs.writeFileSync(input, "/// Documento senza item successivo\n");
  const result = launch(
    rustc,
    ["--edition=2024", "--crate-type=lib", "--emit=metadata", input],
    dir,
  );
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /doesn't document anything|expected item after doc comment/,
  );
});
