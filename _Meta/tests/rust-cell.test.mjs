import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Cell T"];
const notes = names.map((name) =>
  parseNote("Programmazione/Rust/Pagine/" + name + ".md"),
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
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-cell-";
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
      ...(options.args ?? []),
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error || options.message) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) =>
          d.level === "error" &&
          (options.error
            ? d.code?.code === options.error
            : options.message.test(d.message)),
      ),
      compiled.stderr,
    );
    if (options.detail) assert.match(compiled.stderr, options.detail);
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, [], dir);
  if (options.panic) {
    assert.equal(execution.status, 101, execution.stdout + execution.stderr);
    assert.match(execution.stderr, options.panic);
    return;
  }
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
  return execution.stdout.replaceAll("\r\n", "\n");
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading);
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function probe(i, heading, extra) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + extra,
  );
}

const copy = "Copiare il valore non significa prenderlo in prestito";
const string = "Sostituire ed estrarre una String";
const exclusive = "Accesso per riferimento quando sei esclusivo";
const metrics = "Contatore con overflow esplicito";
const slot = "Uno slot opzionale senza Clone o Default del contenuto";
const views = "Viste per elemento di slice e array";
const transfer = "Trasferire una cella a un worker";
const getError = "Usare get su un tipo soltanto Clone";
const mutError = "Chiedere get_mut attraverso un riferimento condiviso";
const threadError = "Condividere Cell tra thread";
const update = "Trattare update come una transazione";
const from = (heading) => source(0, heading);
const fixture = (lines) => lines.join("\n");
function main(heading, body) {
  const original = from(heading);
  assert.equal(original.split("fn main(").length, 2);
  return (
    original.slice(0, original.indexOf("fn main(")) +
    "fn main() {\n" +
    body +
    "\n}"
  );
}
test("baseline reale e inventario: undici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 11);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Cell T.md";
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  const content = fs.readFileSync(file, "utf8");
  assert.equal(yaml(content), yaml(head.stdout));
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Cell<T>",
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
  ])
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  for (const url of [
    "std/cell/struct.Cell.html",
    "std/cell/index.html",
    "std/marker/trait.Copy.html",
    "std/primitive.u64.html#method.checked_add",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url));
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep/,
    );
});
for (const title of [
  copy,
  string,
  exclusive,
  metrics,
  slot,
  views,
  transfer,
  update,
])
  test("programma originale: " + title, () => run(from(title)));
for (const [title, error] of [
  [getError, "E0599"],
  [mutError, "E0596"],
  [threadError, "E0277"],
])
  test("controesempio originale: " + title, () => run(from(title), { error }));
for (const [first, second] of [
  ["false", "true"],
  ["Some(7)", "None"],
  ["[1,2]", "[3,4]"],
]) {
  test("snapshot Copy: " + first, () => {
    run(
      main(
        copy,
        "let cell = Cell::new(" +
          first +
          "); let old = cell.get(); cell.set(" +
          second +
          "); assert_eq!(old, " +
          first +
          "); assert_eq!(cell.get(), " +
          second +
          ");",
      ),
    );
  });
}
test("Cell non e Copy anche quando il contenuto lo e", () => {
  run(
    main(
      copy,
      "let cell = Cell::new(7); let moved = cell; let _ = cell.get(); assert_eq!(moved.get(), 7);",
    ),
    { error: "E0382" },
  );
});
test("Clone di Cell richiede Copy e non il solo Clone del contenuto", () => {
  run(
    main(
      string,
      'let cell = Cell::new(String::from("x")); let _copy = cell.clone();',
    ),
    { error: "E0599" },
  );
});
test("Rc clone condivide la cella senza clonare il contenuto", () => {
  run(
    main(
      string,
      'let cell = std::rc::Rc::new(Cell::new(String::from("x"))); let other = std::rc::Rc::clone(&cell); other.set(String::from("y")); assert_eq!(cell.take(), "y"); assert_eq!(other.take(), "");',
    ),
  );
});
test("replace e swap con tipo non Clone e non Default", () => {
  run(
    main(
      string,
      "struct Value(u8); let a = Cell::new(Value(1)); let b = Cell::new(Value(2)); let old = a.replace(Value(3)); assert_eq!(old.0, 1); a.swap(&b); assert_eq!(a.into_inner().0, 2); assert_eq!(b.into_inner().0, 3);",
    ),
  );
});
for (const value of ["", "caff\u00e8", "a\nb"]) {
  test("take di String: " + JSON.stringify(value), () => {
    const literal = JSON.stringify(value);
    run(
      main(
        string,
        "let cell = Cell::new(String::from(" +
          literal +
          ")); assert_eq!(cell.take(), " +
          literal +
          '); assert_eq!(cell.into_inner(), "");',
      ),
    );
  });
}
const tracker = fixture([
  "use std::cell::Cell;",
  "struct Value<'a> { drops: &'a Cell<usize> }",
  "impl Drop for Value<'_> { fn drop(&mut self) { self.drops.set(self.drops.get() + 1); } }",
]);
test("set distrugge il vecchio valore prima di restituire", () => {
  run(
    tracker +
      "\nfn main() { let drops = Cell::new(0); let cell = Cell::new(Value { drops: &drops }); cell.set(Value { drops: &drops }); assert_eq!(drops.get(), 1); drop(cell); assert_eq!(drops.get(), 2); }",
  );
});
test("replace trasferisce al chiamante la responsabilita del vecchio valore", () => {
  run(
    tracker +
      "\nfn main() { let drops = Cell::new(0); let cell = Cell::new(Value { drops: &drops }); let old = cell.replace(Value { drops: &drops }); assert_eq!(drops.get(), 0); drop(old); assert_eq!(drops.get(), 1); drop(cell); assert_eq!(drops.get(), 2); }",
  );
});
test("into_inner non distrugge anticipatamente il contenuto", () => {
  run(
    tracker +
      "\nfn main() { let drops = Cell::new(0); let cell = Cell::new(Value { drops: &drops }); let owned = cell.into_inner(); assert_eq!(drops.get(), 0); drop(owned); assert_eq!(drops.get(), 1); }",
  );
});
test("take usa il Default del tipo e non un presunto zero", () => {
  run(
    main(
      string,
      "struct Value(u8); impl Default for Value { fn default() -> Self { Self(42) } } let cell = Cell::new(Value(7)); assert_eq!(cell.take().0, 7); assert_eq!(cell.into_inner().0, 42);",
    ),
  );
});
test("get_mut non richiede Copy Clone o Default", () => {
  run(
    main(
      exclusive,
      "struct Value(u8); let mut cell = Cell::new(Value(7)); cell.get_mut().0 = 9; assert_eq!(cell.into_inner().0, 9);",
    ),
  );
});
test("get_mut impedisce set mentre il riferimento esclusivo e ancora usato", () => {
  run(
    main(
      exclusive,
      "let mut cell = Cell::new(7); let reference = cell.get_mut(); cell.set(9); assert_eq!(*reference, 7);",
    ),
    { error: "E0502" },
  );
});
test("into_inner consuma la cella", () => {
  run(
    main(
      exclusive,
      "let cell = Cell::new(7); let _owned = cell.into_inner(); let _again = cell.get();",
    ),
    { error: "E0382" },
  );
});
for (const [start, count] of [
  ["0", 0],
  ["0", 5],
  ["u64::MAX - 1", 2],
  ["u64::MAX", 3],
]) {
  test(
    "Metrics: stato iniziale " + start + " e " + count + " tentativi",
    () => {
      run(
        main(
          metrics,
          fixture([
            "let metrics = Metrics { calls: Cell::new(" +
              start +
              ") }; let mut expected: u64 = " +
              start +
              ";",
            "for _ in 0.." +
              count +
              " { let result = expected.checked_add(1); assert_eq!(metrics.record_call(), result); if let Some(next) = result { expected = next; } assert_eq!(metrics.calls(), expected); }",
            "assert_eq!(metrics.calls(), expected);",
          ]),
        ),
      );
    },
  );
}
test("Metrics conserva la politica anche con ottimizzazioni e overflow checks disabilitati", () => {
  run(from(metrics), { args: ["-O", "-C", "overflow-checks=off"] });
});
test("Metrics: la variante wrapping errata viene rilevata", () => {
  run(
    replaceOnce(
      from(metrics),
      "self.calls.get().checked_add(1)?",
      "self.calls.get().wrapping_add(1)",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("Metrics: eliminare la scrittura viene rilevato", () => {
  run(replaceOnce(from(metrics), "self.calls.set(next);", ""), {
    panic: /assertion.*failed/s,
  });
});
test("slot vuoto ed estrazione ripetuta senza Default del Job", () => {
  run(
    main(
      slot,
      'let cell = Cell::<Option<Job>>::new(None); assert!(cell.take().is_none()); cell.set(Some(Job { name: String::new() })); assert_eq!(cell.take().unwrap().name, ""); assert!(cell.take().is_none());',
    ),
  );
});
test("lo slot puo essere svuotato con replace None", () => {
  run(
    main(
      slot,
      'let cell = Cell::new(Some(Job { name: "job".into() })); let old = cell.replace(None).unwrap(); assert_eq!(old.name, "job"); assert!(cell.take().is_none());',
    ),
  );
});
test("reinserire il Job lo muove e impedisce di riusare il binding", () => {
  run(
    main(
      slot,
      'let cell = Cell::new(None); let job = Job { name: "job".into() }; cell.set(Some(job)); assert_eq!(job.name, "job");',
    ),
    { error: "E0382" },
  );
});
test("errore dopo take non ripristina lo slot automaticamente", () => {
  run(
    main(
      slot,
      fixture([
        'fn process(cell: &Cell<Option<Job>>) -> Result<(), &\'static str> { let _job = cell.take().ok_or("empty")?; Err("failed") }',
        'let cell = Cell::new(Some(Job { name: "job".into() })); assert_eq!(process(&cell), Err("failed")); assert!(cell.take().is_none());',
      ]),
    ),
  );
});
test("reinserire uno snapshot puo sovrascrivere la modifica rientrante", () => {
  run(
    main(
      slot,
      fixture([
        'let cell = Cell::new(Some(Job { name: "original".into() })); let mut current = cell.take().unwrap();',
        'cell.set(Some(Job { name: "reentrant".into() })); current.name.push_str(" edited"); cell.set(Some(current));',
        'assert_eq!(cell.take().unwrap().name, "original edited");',
      ]),
    ),
  );
});
for (const [values, expected] of [
  ["[]", "[]"],
  ["[1,2]", "[1,2]"],
  ["[-1,-2]", "[0,0]"],
  ["[0,-3,4,0]", "[0,0,4,0]"],
  ["[i32::MIN,i32::MAX]", "[0,i32::MAX]"],
]) {
  test("vista slice: " + values, () => {
    run(
      main(
        views,
        "let mut values: [i32; " +
          (values === "[]" ? 0 : values.split(",").length) +
          "] = " +
          values +
          "; clear_negative(&mut values); assert_eq!(values, " +
          expected +
          ");",
      ),
    );
  });
}
test("la vista slice punta agli elementi originali, senza copiare il buffer", () => {
  run(
    main(
      views,
      "let mut values = [1,2]; let original = values.as_mut_ptr(); let cells = Cell::from_mut(&mut values[..]).as_slice_of_cells(); assert_eq!(cells[0].as_ptr(), original); cells[0].set(7); assert_eq!(values, [7,2]);",
    ),
  );
});
test("vista array di String non Copy", () => {
  run(
    main(
      views,
      'let array = Cell::new([String::from("a"), String::from("b")]); let cells = array.as_array_of_cells(); cells[0].set("changed".into()); assert_eq!(cells[1].take(), "b"); assert_eq!(array.into_inner(), ["changed", ""]);',
    ),
  );
});
test("from_mut non permette letture incompatibili dell'originale", () => {
  run(
    main(
      views,
      "let mut value = 0; let cell = Cell::from_mut(&mut value); assert_eq!(value, 0); cell.set(1);",
    ),
    { error: "E0502" },
  );
});
test("una vista Cell non puo sopravvivere al locale", () => {
  run(
    "use std::cell::Cell; fn invalid<'a>() -> &'a Cell<i32> { let mut value = 0; Cell::from_mut(&mut value) } fn main() {}",
    { error: "E0515" },
  );
});
test("array view mantiene la lunghezza nel tipo", () => {
  run(
    main(
      views,
      "let array = Cell::new([1,2]); let _: &[Cell<i32>; 3] = array.as_array_of_cells();",
    ),
    { error: "E0308" },
  );
});
for (const [type, bound, error] of [
  ["std::cell::Cell<String>", "Send", null],
  ["std::cell::Cell<String>", "Sync", "E0277"],
  ["std::cell::Cell<std::rc::Rc<i32>>", "Send", "E0277"],
  ["std::rc::Rc<std::cell::Cell<i32>>", "Send", "E0277"],
  ["std::sync::Arc<std::cell::Cell<i32>>", "Send", "E0277"],
  ["std::sync::Mutex<std::cell::Cell<i32>>", "Sync", null],
  ["&'static mut std::cell::Cell<String>", "Send", null],
]) {
  test("bound " + bound + ": " + type, () =>
    run(
      "fn bound<T: " + bound + ">() {} fn main() { bound::<" + type + ">(); }",
      error ? { error } : {},
    ),
  );
}
test("il worker prende ownership della cella originale", () => {
  run(
    replaceOnce(
      from(transfer),
      'assert_eq!(worker.join().unwrap(), "done");',
      'assert_eq!(worker.join().unwrap(), "done"); let _ = text.into_inner();',
    ),
    { error: "E0382" },
  );
});
test("prestito esclusivo scoped della cella", () => {
  run(
    main(
      transfer,
      fixture([
        'let mut cell = Cell::new(String::from("text")); let exclusive = &mut cell;',
        'thread::scope(|scope| { scope.spawn(move || exclusive.get_mut().push_str("!")); });',
        'assert_eq!(cell.into_inner(), "text!");',
      ]),
    ),
  );
});
test("update restituisce unit e chiama la callback una volta", () => {
  run(
    main(
      update,
      "let cell = Cell::new(7); let calls = Cell::new(0); let result: () = cell.update(|old| { calls.set(calls.get()+1); old+1 }); assert_eq!(result, ()); assert_eq!(calls.get(), 1); assert_eq!(cell.get(), 8);",
    ),
  );
});
test("update accetta una callback FnOnce con cattura consumata", () => {
  run(
    main(
      update,
      'let cell = Cell::new(7); let owned = String::from("consume"); cell.update(move |old| { drop(owned); old+1 }); assert_eq!(cell.get(), 8);',
    ),
  );
});
test("update richiede Copy del contenuto", () => {
  run(
    main(
      update,
      'let cell = Cell::new(String::from("x")); cell.update(|mut old| { old.push_str("y"); old });',
    ),
    { error: "E0599" },
  );
});
test("update annidato viene sovrascritto dal risultato esterno", () => {
  run(
    main(
      update,
      "let cell = Cell::new(1); cell.update(|old| { cell.update(|inner| inner+10); assert_eq!(cell.get(), 11); old+1 }); assert_eq!(cell.get(), 2);",
    ),
  );
});
for (const mutation of [false, true]) {
  test("panic nella callback update, effetti precedenti: " + mutation, () => {
    run(
      main(
        update,
        fixture([
          "use std::panic::{catch_unwind, AssertUnwindSafe}; let cell = Cell::new(7);",
          "let result = catch_unwind(AssertUnwindSafe(|| { cell.update(|_| {",
          mutation ? "cell.set(100);" : "",
          'panic!("update failed"); }); })); assert!(result.is_err());',
          "assert_eq!(cell.get(), " +
            (mutation ? 100 : 7) +
            "); cell.set(9); assert_eq!(cell.get(), 9);",
        ]),
      ),
      { args: ["-C", "panic=unwind"], stderr: /update failed/ },
    );
  });
}
test("swap con se stessa non modifica il valore", () => {
  run(
    main(
      string,
      'let cell = Cell::new(String::from("same")); cell.swap(&cell); assert_eq!(cell.into_inner(), "same");',
    ),
  );
});
test("Default che fa panic durante take lascia il valore iniziale", () => {
  run(
    main(
      string,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe}; struct Value(u8);",
        'impl Default for Value { fn default() -> Self { panic!("default failed"); } }',
        "let cell = Cell::new(Value(7)); let result = catch_unwind(AssertUnwindSafe(|| cell.take()));",
        "assert!(result.is_err()); assert_eq!(cell.into_inner().0, 7);",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /default failed/ },
  );
});
test("set installa il nuovo valore anche se il vecchio Drop fa panic", () => {
  run(
    main(
      string,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe}; struct Value { id: u8 }",
        'impl Drop for Value { fn drop(&mut self) { if self.id == 1 { panic!("old drop failed"); } } }',
        "let cell = Cell::new(Value { id: 1 });",
        "let result = catch_unwind(AssertUnwindSafe(|| cell.set(Value { id: 2 })));",
        "assert!(result.is_err()); assert_eq!(cell.into_inner().id, 2);",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /old drop failed/ },
  );
});
test("panic dopo take lascia lo slot vuoto", () => {
  run(
    main(
      slot,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe};",
        'let cell = Cell::new(Some(Job { name: "job".into() }));',
        'let result = catch_unwind(AssertUnwindSafe(|| { let _owned = cell.take().unwrap(); panic!("job failed"); }));',
        "assert!(result.is_err()); assert!(cell.take().is_none());",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /job failed/ },
  );
});
test("get_cloned resta feature-gated sulla baseline stable", () => {
  run(
    main(
      copy,
      "let cell = Cell::new(std::rc::Rc::new(7)); let _cloned = cell.get_cloned();",
    ),
    { error: "E0658" },
  );
});
test("as_ptr non permette dereferenziazione safe", () => {
  run(
    main(
      copy,
      "let cell = Cell::new(7); let ptr = cell.as_ptr(); let _read = *ptr;",
    ),
    { error: "E0133" },
  );
});
test("correzione del get non Copy usando take", () => {
  run(
    replaceOnce(
      from(getError),
      "let _copy = text.get();",
      'let owned = text.take(); assert_eq!(owned, "rust"); assert_eq!(text.into_inner(), "");',
    ),
  );
});
test("correzione di get_mut tramite firma esclusiva", () => {
  let code = replaceOnce(
    from(mutError),
    "text: &Cell<String>",
    "text: &mut Cell<String>",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main() { let mut value = Cell::new(String::from("rust")); change(&mut value); assert_eq!(value.into_inner(), "rust!"); }',
  );
  run(code);
});
test("correzione della condivisione con un atomico e ordering esplicito", () => {
  run(
    fixture([
      "use std::sync::atomic::{AtomicU32, Ordering}; use std::thread;",
      "fn main() { let value = AtomicU32::new(0); thread::scope(|scope| { scope.spawn(|| { value.fetch_add(1, Ordering::Relaxed); }); });",
      "assert_eq!(value.load(Ordering::Relaxed), 1); }",
    ]),
  );
});
