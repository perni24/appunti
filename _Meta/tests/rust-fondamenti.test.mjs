import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = [
  "Sintassi di base",
  "Tipi di dato primitivi",
  "Variabili mutabilita e shadowing",
];
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
      assert.ok(!result.has(heading), heading);
      result.set(heading, node.value);
    }
  }
  return result;
});

const prefix = "appunti-rust-fondamenti-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
let sequence = 0;
function launch(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
    env: { ...process.env, RUST_BACKTRACE: "0" },
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}
function compile(source, { errorCode, flags = [] } = {}) {
  const directory = path.join(root, String(sequence++));
  fs.mkdirSync(directory);
  const input = path.join(directory, "main.rs");
  const binary = path.join(
    directory,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  fs.writeFileSync(input, source);
  const result = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name",
      "note_example",
      "--error-format=json",
      ...flags,
      input,
      "-o",
      binary,
    ],
    directory,
  );
  if (errorCode) {
    assert.notEqual(result.status, 0, "Il controesempio deve essere rifiutato");
    const diagnostics = result.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === errorCode,
      ),
      result.stderr,
    );
    return null;
  }
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return binary;
}
function execute(source, options = {}) {
  const binary = compile(source, options);
  const result = launch(binary, options.args ?? []);
  if (options.panic) {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, options.panic);
  } else {
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  return result;
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading);
}
function replaceOnce(value, before, after) {
  assert.equal(value.split(before).length, 2, before);
  return value.replace(before, () => after);
}

test("baseline rustc reale e inventario dei 21 blocchi", () => {
  const result = launch(rustc, ["--version", "--verbose"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /release: 1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [5, 7, 9],
  );
});
for (const [i, note] of notes.entries()) {
  test(`${names[i]}: struttura e metadati`, () => {
    assert.equal(note.data.type, "technical-note");
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Rust");
    assert.equal(String(note.data.date), "2026-05-20");
    const headings = note.tree.children.filter((n) => n.type === "heading");
    const h1 = headings.filter((n) => n.depth === 1);
    assert.equal(h1.length, 1);
    assert.equal(text(h1[0]), note.data.title);
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
        headings.some((h) => text(h) === name),
        name,
      );
    for (let n = 1; n < headings.length; n++)
      assert.ok(headings[n].depth <= headings[n - 1].depth + 1);
  });
}

const failures = new Map([
  ["Punto e virgola che cambia il risultato", "E0308"],
  ["Rami con tipi incompatibili", "E0308"],
  ["Riassegnazione senza mut", "E0384"],
  ["Mut non cambia il tipo", "E0308"],
]);
const output = new Map([
  ["Programma minimo", "Ciao, Rust\n"],
  ["Valore del blocco e valore unit", "Calcolo eseguito\nRisultato: 21\n"],
  ["Funzione e if come espressione", "Consegna: 0\n"],
  ["Dichiarazioni e accessi", "R: 42, 21.5, true\n"],
  ["Array, slice e accesso controllato", "Primo valore: 10, lunghezza: 3\n"],
  ["Mutazione dello stesso binding", "Conteggio: 6\n"],
  ["Shadowing con cambio di tipo", "Valore: 42\n"],
  ["Trasformazioni progressive", "RUST\n"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(`${names[i]}: ${heading}`, () => {
      const errorCode = failures.get(heading);
      if (errorCode) compile(code, { errorCode });
      else {
        const result = execute(code);
        assert.equal(
          result.stdout.replaceAll("\r\n", "\n"),
          output.get(heading) ?? "",
        );
        assert.equal(result.stderr, "");
      }
    });
  }
}

test("semicolon: la correzione documentata restituisce 42", () => {
  const code = replaceOnce(
    source(0, "Punto e virgola che cambia il risultato"),
    "42;",
    "42",
  );
  assert.equal(execute(code).stdout.trim(), "42");
});
test("condizione numerica rifiutata senza truthiness", () => {
  const code = replaceOnce(
    source(0, "Funzione e if come espressione"),
    "if is_member",
    "if 1",
  );
  compile(code, { errorCode: "E0308" });
});
test("variabile del blocco non accessibile all'esterno", () => {
  const code = replaceOnce(
    source(0, "Valore del blocco e valore unit"),
    "assert_eq!(y, 21);",
    "assert_eq!(doubled, 20);",
  );
  compile(code, { errorCode: "E0425" });
});
test("parse: input non numerico propagato da main senza panic", () => {
  const code = replaceOnce(
    source(2, "Shadowing con cambio di tipo"),
    'let value = "42";',
    'let value = "not a number";',
  );
  const result = launch(compile(code), []);
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /ParseIntError/);
  assert.doesNotMatch(result.stderr, /panicked/);
});
test("inizializzazione mancante su un ramo rifiutata", () => {
  const code = replaceOnce(
    source(2, "Inizializzazione differita"),
    "limit = 0;",
    "// Nessuna inizializzazione",
  );
  compile(code, { errorCode: "E0381" });
});
test("mut consente la riassegnazione dichiarata", () => {
  const code = replaceOnce(
    source(2, "Riassegnazione senza mut"),
    "let count",
    "let mut count",
  );
  assert.equal(execute(code).stdout.trim(), "1");
});
test("shadowing risolve il cambio tipo, non mut", () => {
  const code = replaceOnce(
    source(2, "Mut non cambia il tipo"),
    "input = input.len();",
    "let input = input.len();",
  );
  assert.equal(execute(code).stdout.trim(), "4");
});
test("nuovo let torna immutabile anche dopo mut", () => {
  const code = replaceOnce(
    source(2, "Mutazione dello stesso binding"),
    "assert_eq!(count, 6);",
    "let count = count;\n    count = 7;",
  );
  compile(code, { errorCode: "E0384" });
});
test("mut sul binding non concede scritture tramite &T", () => {
  const code = replaceOnce(
    source(2, "Mutabilita del riferimento e del valore"),
    "let reference = &mut total;",
    "let mut reference = &total;",
  );
  compile(code, { errorCode: "E0594" });
});
test("char non puo contenere due scalari", () => {
  const code = replaceOnce(source(1, "Dichiarazioni e accessi"), "'R'", "'RS'");
  const directory = path.join(root, "invalid-char");
  fs.mkdirSync(directory);
  const input = path.join(directory, "main.rs");
  fs.writeFileSync(input, code);
  const result = launch(
    rustc,
    ["--edition=2024", "--emit=metadata", input],
    directory,
  );
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /character literal may only contain one codepoint/,
  );
});

// These standalone probes check prose claims beyond the unchanged fenced examples.
test("unit, tupla singola e inferenza numerica", () => {
  execute(`fn main() {
    let integer = 1; let float = 1.0;
    assert_eq!(std::any::type_name_of_val(&integer), "i32");
    assert_eq!(std::any::type_name_of_val(&float), "f64");
    let single = (42,); assert_eq!(single.0, 42);
    assert_eq!({}, ());
    assert_eq!(std::mem::size_of::<usize>(), std::mem::size_of::<*const ()>());
  }`);
});
test("get su slice vuota e slice senza copia", () => {
  execute(`fn main() {
    let empty: [i32; 0] = [];
    assert_eq!(empty.get(0), None);
    let data = [10, 20, 30]; let view: &[i32] = &data[1..];
    assert!(std::ptr::eq(&view[0], &data[1]));
  }`);
});
test("shadowing conserva la vecchia risorsa fino allo scope", () => {
  const result = execute(`struct Trace(&'static str);
    impl Drop for Trace { fn drop(&mut self) { println!("drop:{}", self.0); } }
    fn main() {
      let resource = Trace("old");
      let resource = Trace("new");
      println!("visible:{}", resource.0);
      println!("end");
    }`);
  assert.equal(
    result.stdout.replaceAll("\r\n", "\n"),
    "visible:new\nend\ndrop:new\ndrop:old\n",
  );
});
test("drop esplicito rilascia prima della fine del blocco", () => {
  const result = execute(`struct Trace;
    impl Drop for Trace { fn drop(&mut self) { println!("drop"); } }
    fn main() { let resource = Trace; drop(resource); println!("after"); }`);
  assert.equal(result.stdout.replaceAll("\r\n", "\n"), "drop\nafter\n");
});
test("interior mutability tramite Cell non richiede binding mut", () => {
  execute(
    `fn main() { let value = std::cell::Cell::new(1); value.set(2); assert_eq!(value.get(), 2); }`,
  );
});
test("const non accetta una funzione runtime arbitraria", () => {
  compile(
    `fn value() -> u32 { 3 } const MAX: u32 = value(); fn main() { println!("{MAX}"); }`,
    { errorCode: "E0015" },
  );
});
for (const checks of ["yes", "no"]) {
  const flags = ["-C", `overflow-checks=${checks}`, "-C", "opt-level=3"];
  test(`politiche esplicite overflow, checks=${checks}`, () => {
    execute(source(1, "Overflow: scegliere la politica"), { flags });
  });
  test(`somma runtime fuori range, checks=${checks}`, () => {
    const code = `fn main() {
      let value: u8 = std::env::args().nth(1).unwrap().parse().unwrap();
      println!("{}", value + 1);
    }`;
    if (checks === "yes")
      execute(code, { flags, args: ["255"], panic: /overflow/ });
    else
      assert.equal(execute(code, { flags, args: ["255"] }).stdout.trim(), "0");
  });
  test(`divisione intera per zero, checks=${checks}`, () => {
    execute(
      `fn main() { let zero = std::hint::black_box(0); println!("{}", 7 / zero); }`,
      { flags, panic: /divide by zero/ },
    );
  });
  test(`divisione MIN per -1, checks=${checks}`, () => {
    execute(
      `fn main() { let value = std::hint::black_box(i32::MIN); println!("{}", value / -1); }`,
      { flags, panic: /overflow/ },
    );
  });
  test(`bounds runtime fuori limite, checks=${checks}`, () => {
    execute(
      `fn main() { let data = [10, 20]; let i = std::hint::black_box(2usize); println!("{}", data[i]); }`,
      { flags, panic: /index out of bounds/ },
    );
  });
}
