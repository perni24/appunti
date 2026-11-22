import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/const fn.md";
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
const prefix = "appunti-rust-const-fn-";
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
      ...(options.rustcArgs || []),
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
  const execution = launch(output, options.cliArgs || [], dir);
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
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

const double = "La stessa funzione in due contesti";
const ports = "Costruttore fallibile con Option";
const table = "Cicli e mutazioni locali";
const limits = "Configurazione con invariante e Default";
const capacity = "Dimensione con overflow gestito";
const block = "Blocco const e parametri generici";
const helper = "Chiamare un helper non const";
const capture = "Catturare un parametro runtime in const";
const panic = "Violare un invariante durante la compilazione";
const defaults = "Confondere Default con un costruttore const";

function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}

test("baseline reale e inventario di dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 10);
});
test("frontmatter invariato, struttura e fonti", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "const fn",
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
  for (const url of [
    "https://doc.rust-lang.org/reference/const_eval.html",
    "https://doc.rust-lang.org/reference/expressions/block-expr.html#const-blocks",
    "https://doc.rust-lang.org/std/default/trait.Default.html",
    "https://doc.rust-lang.org/error_codes/E0080.html",
  ]) {
    assert.ok(originalBytes.toString().includes(url));
  }
  for (const code of blocks.values()) {
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|todo!|unimplemented!|thread::sleep|process::exit/,
    );
  }
});
test("programma originale: const, static, array e argomento runtime", () => {
  assert.equal(run(from(double)), "20\n");
});
test("forma della tabella: chiamata const nella lunghezza dell'array", () => {
  assert.ok(originalBytes.toString().includes("[0u8; double(8) as usize]"));
  assert.equal(
    run(replace(from(double), "[0u8; SIZE]", "[0u8; double(8) as usize]")),
    "20\n",
  );
});
for (const title of [ports, table, limits, capacity, block]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [helper, "E0015"],
  [capture, "E0435"],
  [panic, "E0080"],
  [defaults, "E0015"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}
for (const input of [0, 12, 65535]) {
  test("argomento runtime valido: " + input, () => {
    assert.equal(
      run(from(double), { cliArgs: [String(input)] }),
      String(input * 2) + "\n",
    );
  });
}
for (const input of ["-1", "bad", "65536"]) {
  test("parsing runtime rifiutato: " + input, () => {
    run(from(double), {
      cliArgs: [input],
      exitCode: 1,
      stderr: /ParseIntError/,
    });
  });
}
test("costruttore: minimo positivo e massimo senza allocazioni", () => {
  run(
    main(
      limits,
      "assert_eq!(Limits::new(1).max_connections(), 1); assert_eq!(Limits::new(usize::MAX).max_connections(), usize::MAX);",
    ),
  );
});
test("costruttore: zero rifiutato durante la compilazione", () => {
  run(
    replace(
      from(limits),
      "const DEFAULT_LIMITS: Limits = Limits::new(100);",
      "const DEFAULT_LIMITS: Limits = Limits::new(0);",
    ),
    { error: "E0080" },
  );
});
test("costruttore: zero causa panic ordinario", () => {
  run(main(limits, "let _limits = Limits::new(0);"), {
    exitCode: 101,
    stderr: /limit must be positive/,
  });
});
test("assert del costruttore resta attivo con debug assertions disabilitate", () => {
  run(main(limits, "let _limits = Limits::new(0);"), {
    rustcArgs: ["-C", "opt-level=3", "-C", "debug-assertions=no"],
    exitCode: 101,
    stderr: /limit must be positive/,
  });
});
test("campo privato impedisce di aggirare il costruttore", () => {
  run(main(limits, "let _limits = Limits { max_connections: 0 };"), {
    error: "E0451",
  });
});
test("rimuovere const dal costruttore rompe il chiamante costante", () => {
  run(replace(from(limits), "pub const fn new(", "pub fn new("), {
    error: "E0015",
  });
});
test("Option None e un valore costante valido", () => {
  run(
    main(
      ports,
      "const INVALID: Option<Port> = Port::new(0); assert_eq!(INVALID, None);",
    ),
  );
});
test("porte al minimo positivo e al massimo del tipo", () => {
  run(
    main(
      ports,
      "assert_eq!(Port::new(1).unwrap().get(), 1); assert_eq!(Port::new(u16::MAX).unwrap().get(), u16::MAX);",
    ),
  );
});
test("correzione: rendere const anche helper", () => {
  run(replace(from(helper), "fn helper(", "const fn helper("));
});
test("correzione: rinunciare a const per la funzione esterna", () => {
  run(replace(from(helper), "const fn increment(", "fn increment("));
});
test("correzione: parametro in normale corpo di const fn", () => {
  let code = replace(from(capture), "fn double(", "const fn double(");
  code = replace(code, "const { value * 2 }", "value * 2");
  assert.equal(run(code), "6\n");
});
test("correzione: input valido della costante", () => {
  assert.equal(run(replace(from(panic), "nonzero(0)", "nonzero(1)")), "1\n");
});
test("stessa asserzione fallita a runtime produce panic e non E0080", () => {
  let code = replace(from(panic), "const INVALID: usize = nonzero(0);", "");
  code = replace(code, 'println!("{INVALID}");', 'println!("{}", nonzero(0));');
  run(code, { exitCode: 101, stderr: /value must be positive/ });
});
test("correzione: inizializzatore esplicito al posto di Default", () => {
  run(
    replace(from(defaults), "Settings::default()", "Settings { retries: 0 }"),
  );
});
test("checked_mul al confine rappresentabile del target", () => {
  run(
    main(
      capacity,
      "assert_eq!(capacity(usize::MAX / 2), Some(usize::MAX - 1)); assert_eq!(capacity(usize::MAX / 2 + 1), None);",
    ),
  );
});
test("overflow nel corpo const fn rifiutato con controlli attivi", () => {
  run(
    'const fn double(x: u8) -> u8 { x * 2 } const INVALID: u8 = double(255); fn main() { println!("{INVALID}"); }',
    {
      rustcArgs: ["-C", "overflow-checks=yes"],
      error: "E0080",
    },
  );
});
test("overflow nel corpo const fn con controlli disattivi: baseline restituisce wrap", () => {
  assert.equal(
    run(
      'const fn double(x: u8) -> u8 { x * 2 } const VALUE: u8 = double(255); fn main() { println!("{VALUE}"); }',
      { rustcArgs: ["-C", "overflow-checks=no"] },
    ),
    "254\n",
  );
});
test("overflow diretto nell'inizializzatore resta errore senza controlli runtime", () => {
  run('const VALUE: u8 = 255u8 * 2; fn main() { println!("{VALUE}"); }', {
    rustcArgs: ["-C", "overflow-checks=no"],
    error: "E0080",
  });
});
for (const setting of ["yes", "no"]) {
  test("checked_mul indipendente dai controlli: " + setting, () => {
    run(
      main(
        capacity,
        "const SIZE: Option<usize> = capacity(usize::MAX); assert_eq!(SIZE, None);",
      ),
      {
        rustcArgs: ["-C", "overflow-checks=" + setting],
      },
    );
  });
}
test("istanza generica con zero rifiutata dal blocco const", () => {
  run(main(block, "let _bytes = buffer::<0>();"), { error: "E0080" });
});
test("istanze generiche valide con dimensioni distinte", () => {
  run(
    main(
      block,
      "assert_eq!(buffer::<1>(), [0]); assert_eq!(buffer::<16>().len(), 16);",
    ),
  );
});
test("riferimento mutabile ammesso e modifica locale osservabile", () => {
  run(
    "const fn bump(x: &mut u32) { *x += 1; } const VALUE: u32 = { let mut x = 2; bump(&mut x); x }; fn main() { let mut x = 4; bump(&mut x); assert_eq!(VALUE, 3); assert_eq!(x, 5); }",
  );
});
test("distruzione di String non ammessa nel corpo const", () => {
  run(
    "const fn consume(_value: String) {} fn main() { consume(String::new()); }",
    { error: "E0493" },
  );
});
test("while non sostituibile con un for Range nella baseline", () => {
  const code =
    'const fn total() -> u32 { let mut sum = 0; for x in 0..3 { sum += x; } sum } fn main() { println!("{}", total()); }';
  run(code, { error: "E0015" });
});
