import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Macro dichiarative.md";
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
const prefix = "appunti-rust-declarative-macros-";
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
  if (options.error || options.message) {
    assert.notEqual(compiled.status, 0);
    const errors = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      errors.some(
        (d) =>
          d.level === "error" &&
          (options.error
            ? d.code?.code === options.error
            : options.message.test(d.message)),
      ),
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

const hello = "Prima macro e valutazione singola";
const vector = "Una lista con zero, uno o piu elementi";
const guard = "Una guardia con uscita anticipata";
const edition = "Edition del punto di definizione";
const exported = "Scope ed esportazione";
const ambiguous = "Ambiguita locale del matcher";
const follow = "Separatore non ammesso dopo expr";
const opaque = "Frammento inoltrato come se fosse testo";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}
function library(code, edition = "2024") {
  const dir = path.join(root, "lib-" + sequence++);
  fs.mkdirSync(dir);
  const source = path.join(dir, "lib.rs");
  const output = path.join(dir, "libmacro_origin.rlib");
  fs.writeFileSync(source, code);
  const result = launch(
    rustc,
    [
      "--edition=" + edition,
      "--crate-type=rlib",
      "--crate-name=macro_origin",
      "--error-format=json",
      source,
      "-o",
      output,
    ],
    dir,
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return output;
}
function cross(code, caller, options = {}) {
  const file = library(code, options.libEdition);
  return run(caller, {
    ...options,
    edition: options.callerEdition || "2024",
    rustcArgs: ["--extern", "renamed=" + file],
  });
}
const exportLib = from(exported).split("fn main(")[0];
const editionLib = from(edition)
  .split("fn main(")[0]
  .replaceAll("macro_rules!", "#[macro_export]\nmacro_rules!");

test("baseline reale e otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
});
test("frontmatter: solo Hygiene riclassificato; struttura, fonti e HTML", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  const hygiene = '  - "[[Programmazione/Rust/Pagine/Hygiene]]"\n';
  const expected = yaml(head.stdout)
    .replace(hygiene, "")
    .replace("related:\n", "related:\n" + hygiene);
  assert.equal(yaml(originalBytes.toString()), expected);
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  function noHtml(n) {
    assert.notEqual(n.type, "html");
    for (const child of n.children ?? []) noHtml(child);
  }
  noHtml(note.tree);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Macro dichiarative",
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
  const table = note.tree.children.find(
    (n) => n.type === "paragraph" && text(n).startsWith("| Frammento |"),
  );
  assert.ok(table);
  assert.equal(text(table).split("\n").length, 9);
  for (const row of text(table).split("\n"))
    assert.equal(row.split("|").length, 4);
  for (const url of [
    "https://doc.rust-lang.org/reference/macros-by-example.html",
    "https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html",
    "https://doc.rust-lang.org/edition-guide/rust-2021/or-patterns-macro-rules.html",
    "https://doc.rust-lang.org/std/macro.compile_error.html",
  ])
    assert.ok(originalBytes.toString().includes(url));
  for (const code of blocks.values())
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
});
for (const title of [hello, vector, guard, edition, exported]) {
  test("programma originale: " + title, () => {
    assert.equal(run(from(title)), title === hello ? "hello\n7\n" : "");
  });
}
for (const [title, message] of [
  [ambiguous, /local ambiguity/],
  [follow, /not allowed for.*expr/],
  [opaque, /no rules expected/],
])
  test("controesempio: " + title, () => run(from(title), { message }));

test("log: valore non Copy trasferito e restituito senza duplicare il buffer", () => {
  assert.equal(
    run(
      main(
        hello,
        'let value = String::from("text"); let p = value.as_ptr(); let result = log_value!(value); assert_eq!(result.as_ptr(), p); assert_eq!(result, "text");',
      ),
    ),
    '"text"\n',
  );
});
test("log: il nome locale non cattura il nome nel chiamante", () => {
  assert.equal(
    run(
      main(
        hello,
        "let value = 9; assert_eq!(log_value!(value), 9); assert_eq!(value, 9);",
      ),
    ),
    "9\n",
  );
});
test("log: usare di nuovo un valore mosso e vietato", () => {
  run(
    main(
      hello,
      'let value = String::from("x"); let _ = log_value!(value); drop(value);',
    ),
    { error: "E0382" },
  );
});
test("log: Debug richiesto dal codice generato", () => {
  run(main(hello, "struct Hidden; let _ = log_value!(Hidden);"), {
    error: "E0277",
  });
});
test("vec: forme vuota, singola, multipla e virgola finale", () => {
  run(
    main(
      vector,
      "let a: Vec<i16> = vec_like!(); assert!(a.is_empty()); assert_eq!(vec_like!{2,}, [2]); assert_eq!(vec_like!(1, 2, 3), [1, 2, 3]);",
    ),
  );
});
test("vec: virgola isolata rifiutata", () => {
  run(main(vector, "let _: Vec<u8> = vec_like![,];"), {
    message: /no rules expected/,
  });
});
test("vec: forma di ripetizione della macro standard non implementata", () => {
  run(main(vector, "let _ = vec_like![4; 3];"), {
    message: /no rules expected/,
  });
});
test("vec: elementi incompatibili rifiutati dopo il matching", () => {
  run(main(vector, 'let _ = vec_like![1u8, "x"];'), { error: "E0308" });
});
test("vec: lista vuota senza contesto richiede annotazione", () => {
  run(main(vector, "let values = vec_like![];"), { error: "E0282" });
});
test("vec: ordine, valutazione singola e assenza di Clone", () => {
  run(
    main(
      vector,
      "struct Item(u8); let mut n = 0; let v = vec_like![{n += 1; Item(n)}, {n += 1; Item(n)}, {n += 1; Item(n)}]; assert_eq!(n, 3); assert_eq!(v.iter().map(|x| x.0).collect::<Vec<_>>(), [1, 2, 3]);",
    ),
  );
});
test("vec: path assoluto resiste a un nome Vec nel chiamante", () => {
  run(
    main(vector, "struct Vec; let v = vec_like![1, 2]; assert_eq!(v, [1, 2]);"),
  );
});
test("vec: il vecchio matcher unico accettava la virgola isolata", () => {
  run(
    "macro_rules! old { ($($item:expr),* $(,)?) => {{ let mut v = Vec::new(); $(v.push($item);)* v }}; } fn main() { let v: Vec<u8> = old![,]; assert!(v.is_empty()); }",
  );
});
test("ensure: tutti i valori u16, solo zero e rifiutato", () => {
  run(
    main(
      guard,
      "for p in 0..=u16::MAX { assert_eq!(validate_port(p).is_ok(), p != 0); }",
    ),
  );
});
test("ensure: condizione singola, messaggio solo in caso di errore", () => {
  run(
    main(
      guard,
      'use std::cell::Cell; fn check(ok: bool, c: &Cell<u8>, m: &Cell<u8>) -> Result<(), String> { ensure!({c.set(c.get()+1); ok}, {m.set(m.get()+1); "bad"},); Ok(()) } let c = Cell::new(0); let m = Cell::new(0); assert!(check(true, &c, &m).is_ok()); assert_eq!((c.get(), m.get()), (1, 0)); assert_eq!(check(false, &c, &m), Err("bad".to_owned())); assert_eq!((c.get(), m.get()), (2, 1));',
    ),
  );
});
test("ensure: ritorno dalla closure senza uscire dal suo chiamante", () => {
  run(
    main(
      guard,
      'let result = (|| -> Result<(), String> { ensure!(false, "stop"); Ok(()) })(); assert_eq!(result, Err("stop".to_owned())); let continued = true; assert!(continued);',
    ),
  );
});
test("ensure: return resta nel blocco async senza await", () => {
  run(
    main(
      guard,
      'use std::future::Future; use std::task::{Context, Poll, Waker}; let mut future = std::pin::pin!(async { ensure!(false, "async stop"); Ok::<(), String>(()) }); let mut context = Context::from_waker(Waker::noop()); assert_eq!(future.as_mut().poll(&mut context), Poll::Ready(Err("async stop".to_owned())));',
    ),
  );
});
test("ensure: blocco ordinario non intercetta il return", () => {
  run(
    main(
      guard,
      'fn check() -> Result<u8, String> { { ensure!(false, "stop"); } Ok(9) } assert_eq!(check(), Err("stop".to_owned()));',
    ),
  );
});
test("ensure: nessun rollback degli effetti precedenti", () => {
  run(
    main(
      guard,
      'fn check(n: &mut u8) -> Result<(), String> { *n += 1; ensure!(false, "stop"); Ok(()) } let mut n = 0; assert!(check(&mut n).is_err()); assert_eq!(n, 1);',
    ),
  );
});
test("ensure: tipo di ritorno non Result rifiutato", () => {
  run(main(guard, 'ensure!(false, "bad");'), { error: "E0308" });
});
test("ensure: conversione del messaggio deve essere disponibile", () => {
  run(
    main(
      guard,
      'fn check() -> Result<(), u8> { ensure!(false, String::from("bad")); Ok(()) } let _ = check();',
    ),
    { error: "E0277" },
  );
});
test("ensure: path qualificati non dipendono da Err o Into locali", () => {
  run(
    main(
      guard,
      'fn check() -> Result<(), String> { struct Into; struct Err; ensure!(false, "bad"); Ok(()) } assert!(check().is_err());',
    ),
  );
});
test("ordine: non riprova il secondo braccio dopo un errore di tipo", () => {
  run(
    'macro_rules! choose { ($value:expr) => { "text" }; (7) => { 7u8 }; } fn main() { let _: u8 = choose!(7); }',
    { error: "E0308" },
  );
});
test("edition 2021: const seleziona il secondo braccio", () => {
  run(
    main(
      edition,
      'assert_eq!(classify!(const { 2 + 3 }), "const arm"); assert_eq!(classify_legacy!(const { 2 + 3 }), "const arm");',
    ),
    { edition: "2021" },
  );
});
test("edition 2021: expr non cattura underscore al livello esterno", () => {
  run(main(edition, "let _ = classify!(_);"), {
    edition: "2021",
    message: /no rules expected/,
  });
});
test("edition 2024: catturare underscore non lo rende un valore generale", () => {
  run(
    "macro_rules! value { ($e:expr) => {$e}; } fn main() { let _x = value!(_); }",
    { message: /can only be used/ },
  );
});
test("macro esportata: crate rinominata e import use", () => {
  cross(
    exportLib,
    'use renamed::port_label; fn main() { assert_eq!(port_label!(8080), "port:8080"); assert_eq!(renamed::port_label!(7), "port:7"); }',
  );
});
test("macro esportata: chiamante edition 2018", () => {
  cross(
    exportLib,
    'fn main() { assert_eq!(renamed::port_label!(0), "port:0"); }',
    { callerEdition: "2018" },
  );
});
test("macro_export: macro alla radice, non sotto il modulo", () => {
  cross(exportLib, "fn main() { let _ = renamed::support::port_label!(9); }", {
    error: "E0433",
  });
});
test("dollar-crate: non aggira helper privati", () => {
  cross(
    replace(exportLib, "pub fn label", "fn label"),
    "fn main() { let _ = renamed::port_label!(9); }",
    { error: "E0603" },
  );
});
test("dollar-crate: anche il modulo deve essere accessibile", () => {
  cross(
    replace(exportLib, "pub mod support", "mod support"),
    "fn main() { let _ = renamed::port_label!(9); }",
    { error: "E0603" },
  );
});
test("crate invece di dollar-crate cerca nel chiamante", () => {
  cross(
    replace(exportLib, "$crate::support", "crate::support"),
    "fn main() { let _ = renamed::port_label!(9); }",
    { error: "E0433" },
  );
});
test("edition della definizione 2021, chiamante 2024", () => {
  cross(
    editionLib,
    'fn main() { assert_eq!(renamed::classify!(const { 2 }), "const arm"); }',
    { libEdition: "2021" },
  );
});
test("edition della definizione 2024, chiamante 2021", () => {
  cross(
    editionLib,
    'fn main() { assert_eq!(renamed::classify!(const { 2 }), "expr"); assert_eq!(renamed::classify!(_), "expr"); }',
    { callerEdition: "2021" },
  );
});
test("pat: or-pattern accettato in edition 2021 e 2024", () => {
  const code =
    "macro_rules! check { ($p:pat) => { matches!(2, $p) }; } fn main() { assert!(check!(1 | 2)); }";
  run(code, { edition: "2021" });
  run(code);
});
test("pat: barra esplicita dopo pat rifiutata da edition 2021", () => {
  run("macro_rules! check { ($p:pat | $q:pat) => {}; } fn main() {}", {
    edition: "2021",
    message: /not allowed for.*pat/,
  });
});
test("pat_param: alternativa separata funziona nelle tre edition", () => {
  const code =
    "macro_rules! check { ($($p:pat_param)|+) => { matches!(2, $($p)|+) }; } fn main() { assert!(check!(1 | 2)); }";
  for (const edition of ["2018", "2021", "2024"]) run(code, { edition });
});
test("scope testuale: invocazione prima della definizione rifiutata", () => {
  run("fn main() { local!(); macro_rules! local { () => {}; } }", {
    message: /cannot find macro/,
  });
});
test("ripetizioni: liste di diversa lunghezza non si possono combinare", () => {
  run(
    "macro_rules! pairs { ($($a:expr),* ; $($b:expr),*) => { ($(( $a, $b )),*) }; } fn main() { let _ = pairs!(1, 2; 3); }",
    { message: /repeats.*times/ },
  );
});
test("generazione item: identificatore e corpo prodotto", () => {
  run(
    "macro_rules! make { ($name:ident, $value:expr) => { fn $name() -> u8 { $value } }; } make!(answer, 42); fn main() { assert_eq!(answer(), 42); }",
  );
});
test("fallback compile_error: diagnostica esplicita", () => {
  run(
    'macro_rules! mode { (fast) => { 1 }; ($($other:tt)*) => { compile_error!("expected fast"); }; } fn main() { let _ = mode!(slow); }',
    { message: /expected fast/ },
  );
});
test("correzione ambiguita: delimitatore separa la coda", () => {
  run(
    replace(
      replace(
        from(ambiguous),
        "($($head:ident)* $tail:ident)",
        "($($head:ident),* ; $tail:ident)",
      ),
      "last_name!(entry)",
      "last_name!(; entry)",
    ),
  );
});
test("correzione follow-set: virgola invece di parentesi quadre", () => {
  const code = replace(
    from(follow),
    "($value:expr [$index:expr])",
    "($value:expr, $index:expr)",
  );
  run(
    replace(
      code,
      "fn main() {}",
      "fn main() { assert_eq!(indexed!([2, 5], 1), 5); }",
    ),
  );
});
test("correzione forwarding: tt permette confronto col token", () => {
  run(replace(from(opaque), "($value:expr)", "($value:tt)"));
});
test("correzione forwarding: macro interna accetta expr", () => {
  run(
    replace(
      from(opaque),
      '(7) => { "seven" };',
      '($e:expr) => { if $e == 7 { "seven" } else { "other" } };',
    ),
  );
});
