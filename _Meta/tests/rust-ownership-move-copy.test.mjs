import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Ownership", "Move semantics", "Copy e Clone"];
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
const prefix = "appunti-rust-ownership-move-copy-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of [
  "RUSTFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
let sequence = 0;
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
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function run(code, errorCode) {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const result = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
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
  return ok(launch(output, [], dir)).stdout.replaceAll("\r\n", "\n");
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
test("toolchain 1.99.1 e inventario dei 22 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [6, 7, 9],
  );
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
  ["Riferimento a un valore locale", "E0515"],
  ["Uso dopo il trasferimento", "E0382"],
  ["Copy su un campo String", "E0204"],
]);
const outputs = new Map([
  ["Trasformare e restituire ownership", "id-ordine\n"],
  [
    "Distruzione a fine scope e drop anticipato",
    "rilascio seconda\nrilascio prima\nfine\n",
  ],
  ["Coordinate passate per valore", "3:12\n3:12\n"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(`${names[i]}: ${heading}`, () => {
      const error = failures.get(heading);
      if (error) run(code, error);
      else assert.equal(run(code), outputs.get(heading) ?? "");
    });
  }
}

test("lettura: lunghezza UTF-8 in byte per vuoto, Unicode e NUL", () => {
  run(
    probe(
      0,
      "Leggere senza consumare",
      String.raw`assert_eq!(byte_len(""), 0); assert_eq!(byte_len("\u{00E8}"), 2); assert_eq!(byte_len("\u{1F600}"), 4); assert_eq!(byte_len("\0"), 1);`,
    ),
  );
});
test("parametro String consuma il valore del chiamante", () => {
  run(
    replaceOnce(
      source(0, "Consumare un valore"),
      "assert_eq!(bytes, 4);",
      'assert_eq!(bytes, 4); println!("{name}");',
    ),
    "E0382",
  );
});
test("mutazione di stringa vuota conserva ownership", () => {
  run(
    probe(
      0,
      "Modificare senza trasferire",
      'let mut empty = String::new(); append_marker(&mut empty); assert_eq!(empty, "!"); append_marker(&mut empty); assert_eq!(empty, "!!");',
    ),
  );
});
test("prefisso: vuoto, Unicode e chiamate ripetute", () => {
  run(
    probe(
      0,
      "Trasformare e restituire ownership",
      String.raw`assert_eq!(add_prefix(String::new()), "id-"); assert_eq!(add_prefix(String::from("\u{00E8}")), "id-\u{00E8}"); assert_eq!(add_prefix(String::from("id-x")), "id-id-x");`,
    ),
  );
});
test("restituire String corregge il riferimento pendente", () => {
  let code = replaceOnce(
    source(0, "Riferimento a un valore locale"),
    "-> &'static str",
    "-> String",
  );
  code = replaceOnce(code, "    &name", "    name");
  assert.equal(run(code), "Luca\n");
});
test("drop del riferimento non distrugge il proprietario", () => {
  const code = replaceOnce(
    source(0, "Distruzione a fine scope e drop anticipato"),
    "drop(first);",
    "drop(&first);",
  );
  assert.equal(run(code), "rilascio seconda\nfine\nrilascio prima\n");
});
test("ritorno anticipato rilascia i proprietari ancora presenti", () => {
  const code = replaceOnce(
    source(0, "Distruzione a fine scope e drop anticipato"),
    'drop(first);\n    println!("fine");',
    "return;",
  );
  assert.equal(run(code), "rilascio seconda\nrilascio prima\n");
});
test("forget puo evitare Drop anche nel codice safe", () => {
  const code = replaceOnce(
    source(0, "Distruzione a fine scope e drop anticipato"),
    "drop(first);",
    "std::mem::forget(first);",
  );
  assert.equal(run(code), "rilascio seconda\nfine\n");
});
test("riassegnare distrugge il valore precedente, non un move", () => {
  let code = replaceOnce(
    source(0, "Distruzione a fine scope e drop anticipato"),
    "let first =",
    "let mut first =",
  );
  code = replaceOnce(
    code,
    "drop(first);",
    'first = Resource("nuova"); drop(first);',
  );
  assert.equal(
    run(code),
    "rilascio seconda\nrilascio prima\nrilascio nuova\nfine\n",
  );
});
test("move di String conserva il buffer senza clone", () => {
  let code = replaceOnce(
    source(1, "Trasferimento senza clone"),
    "let second = first;",
    "let address = first.as_ptr(); let second = first; assert_eq!(address, second.as_ptr());",
  );
  run(code);
});
test("struct con solo u32 non e automaticamente Copy", () => {
  run(
    'struct Id(u32); fn main() { let first = Id(7); let second = first; println!("{} {}", first.0, second.0); }',
    "E0382",
  );
});
test("binding reinizializzato dopo il move possiede un altro valore", () => {
  let code = replaceOnce(
    source(1, "Trasferimento senza clone"),
    "let first =",
    "let mut first =",
  );
  code = replaceOnce(
    code,
    'assert_eq!(second, "ciao");',
    'first = String::from("nuovo"); assert_eq!(first, "nuovo"); assert_eq!(second, "ciao");',
  );
  run(code);
});
test("push/pop: due job vengono estratti in ordine LIFO", () => {
  run(
    probe(
      1,
      "Passare un job alla coda",
      `let mut multiple = Vec::new();
    enqueue(&mut multiple, Job { id: 1, payload: String::new() });
    enqueue(&mut multiple, Job { id: u64::MAX, payload: String::from("last") });
    let last = multiple.pop().unwrap(); assert_eq!(last.id, u64::MAX); assert_eq!(last.payload, "last");
    assert_eq!(multiple.pop().unwrap().id, 1); assert!(multiple.pop().is_none());`,
    ),
  );
});
test("job non piu leggibile dopo enqueue", () => {
  run(
    replaceOnce(
      source(1, "Passare un job alla coda"),
      "enqueue(&mut queue, job);",
      'enqueue(&mut queue, job); println!("{}", job.id);',
    ),
    "E0382",
  );
});
test("move parziale vieta il prestito del valore intero", () => {
  run(
    replaceOnce(
      source(1, "Move parziale e reinizializzazione"),
      'user.name = String::from("Ada");',
      "let whole = &user; let _ = whole.visits;",
    ),
    "E0382",
  );
});
test("Drop sulla struct impedisce l'estrazione del campo String", () => {
  run(
    source(1, "Move parziale e reinizializzazione") +
      "\nimpl Drop for User { fn drop(&mut self) {} }",
    "E0509",
  );
});
test("non si puo estrarre String da un riferimento condiviso", () => {
  run(
    "struct User { name: String } fn take(user: &User) -> String { user.name } fn main() {}",
    "E0507",
  );
});
test("replace e take lasciano un valore valido al posto di quello estratto", () => {
  run(
    'fn main() { let mut name = String::from("prima"); let old = std::mem::replace(&mut name, String::from("dopo")); assert_eq!(old, "prima"); assert_eq!(name, "dopo"); let mut slot = Some(old); assert_eq!(slot.take().as_deref(), Some("prima")); assert!(slot.is_none()); }',
  );
});
test("move closure non consuma ogni volta la cattura di sola lettura", () => {
  run(
    probe(
      1,
      "Cattura move di una closure",
      "let number = 7_u32; let read = move || number; assert_eq!(read(), 7); assert_eq!(number, 7);",
    ),
  );
  run(
    replaceOnce(
      source(1, "Cattura move di una closure"),
      "let byte_len = move || label.len();",
      'let byte_len = move || label.len(); println!("{label}");',
    ),
    "E0382",
  );
});
test("closure che restituisce la String catturata puo essere consumata una volta", () => {
  run(
    'fn main() { let text = String::from("x"); let take = move || text; assert_eq!(take(), "x"); let _ = take(); }',
    "E0382",
  );
});
test("move di un riferimento non lo rende static", () => {
  run(
    'fn require_static<T: \'static>(_: T) {} fn main() { let text = String::from("x"); let borrowed = &text; require_static(move || borrowed.len()); }',
    "E0597",
  );
});
test("Copy non consente Drop e richiede Clone", () => {
  run(
    "#[derive(Copy, Clone)] struct Token(u32); impl Drop for Token { fn drop(&mut self) {} } fn main() {}",
    "E0184",
  );
  run("struct Token(u32); impl Copy for Token {} fn main() {}", "E0277");
});
test("array grande Copy: dimensione non e garanzia di costo", () => {
  run(
    "fn needs_copy<T: Copy>() {} fn main() { needs_copy::<[u8; 65536]>(); let first = [7_u8; 65536]; let mut second = first; second[0] = 9; assert_eq!(first[0], 7); assert_eq!(second[0], 9); assert_eq!(std::mem::size_of_val(&first), 65536); }",
  );
});
test("riferimento condiviso Copy anche per T non Clone", () => {
  run(
    "struct NoClone(u8); fn main() { let value = NoClone(7); let first = &value; let second = first; assert!(std::ptr::eq(first, second)); assert_eq!(first.0, 7); }",
  );
});
test("riferimento mutabile non Copy, ma reborrow in chiamata consentito", () => {
  run(
    "fn needs_copy<T: Copy>() {} fn main() { needs_copy::<&mut u32>(); }",
    "E0277",
  );
  run(
    "fn increment(value: &mut u32) { *value += 1; } fn main() { let mut value = 0; let reference = &mut value; increment(reference); increment(reference); assert_eq!(*reference, 2); }",
  );
});
test("clone String: contenuto vuoto e Unicode restano indipendenti", () => {
  for (const input of ['""', '"\\u{00E8}"']) {
    let code = replaceOnce(
      source(2, "Clonare una String"),
      'String::from("rust")',
      `String::from(${input})`,
    );
    code = replaceOnce(
      code,
      'assert_eq!(original, "rust");',
      `assert_eq!(original, ${input});`,
    );
    code = replaceOnce(
      code,
      'assert_eq!(duplicate, "rust!");',
      `assert_eq!(duplicate, format!("{}!", ${input}));`,
    );
    run(code);
  }
});
test("clone Rc non richiede Clone sul contenuto", () => {
  run(
    "use std::rc::Rc; struct NoClone(u8); fn main() { let first = Rc::new(NoClone(7)); let second = Rc::clone(&first); assert!(Rc::ptr_eq(&first, &second)); assert_eq!(second.0, 7); }",
  );
});
test("derive Clone puo condividere stato tramite Rc", () => {
  run(
    "use std::{rc::Rc, cell::Cell}; #[derive(Clone)] struct State { count: Rc<Cell<u32>> } fn main() { let first = State { count: Rc::new(Cell::new(0)) }; let second = first.clone(); second.count.set(7); assert_eq!(first.count.get(), 7); assert!(Rc::ptr_eq(&first.count, &second.count)); }",
  );
});
test("clone_from cambia contenuto senza trasferire la sorgente", () => {
  run(
    probe(
      2,
      "clone_from e conversione a posseduto",
      'let source = String::new(); let mut target = String::from("prima"); target.clone_from(&source); assert!(target.is_empty()); assert!(source.is_empty());',
    ),
  );
});
test("clone di str borrowed resta riferimento, to_owned produce String", () => {
  run(
    'fn main() { let borrowed: &str = "note"; let cloned: &str = Clone::clone(&borrowed); assert!(std::ptr::eq(borrowed, cloned)); let mut owned: String = borrowed.to_owned(); owned.push(\'!\'); assert_eq!(borrowed, "note"); assert_eq!(owned, "note!"); }',
  );
});
