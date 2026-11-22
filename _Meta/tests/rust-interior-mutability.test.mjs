import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Interior mutability"];
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
const prefix = "appunti-rust-interior-mutability-";
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

const basics = "Cell e RefCell non applicano lo stesso controllo";
const stats = "Metrica locale con overflow esplicito";
const cache = "Cache derivata con invalidazione esclusiva";
const shared = "Piu proprietari nello stesso thread";
const moved = "Trasferire non equivale a condividere";
const nested = "Una protezione esterna puo cambiare il contratto";
const lifetime = "Far uscire il riferimento dalla sua guardia";
const arc = "Scambiare Arc per sincronizzazione del contenuto";
const from = (heading) => source(0, heading);
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

test("baseline e inventario degli otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Interior mutability.md";
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
    "Interior mutability",
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
    "reference/interior-mutability.html",
    "std/cell/struct.UnsafeCell.html",
    "std/cell/struct.RefCell.html",
    "std/cell/struct.OnceCell.html",
    "std/marker/trait.Sync.html",
    "std/sync/struct.Mutex.html",
    "std/sync/atomic/index.html",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url), url);
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep|mem::forget/,
    );
});
for (const heading of [basics, stats, cache, shared, moved, nested])
  test("programma originale: " + heading, () => run(from(heading)));
test("controesempio: riferimento senza guardia", () =>
  run(from(lifetime), { error: "E0515" }));
test("controesempio: Arc non sincronizza RefCell", () =>
  run(from(arc), { error: "E0277" }));

test("guardia viva anche dopo l'ultima lettura", () => {
  run(replaceOnce(from(basics), "drop(read);", "assert_eq!(read.len(), 1);"), {
    panic: /BorrowMutError/,
  });
});
test("try_borrow e try_borrow_mut durante scrittura", () => {
  run(
    main(
      basics,
      "let cell=RefCell::new(vec![1]); let write=cell.borrow_mut(); assert!(cell.try_borrow().is_err()); assert!(cell.try_borrow_mut().is_err()); drop(write); assert!(cell.try_borrow().is_ok()); assert!(cell.try_borrow_mut().is_ok());",
    ),
  );
});
test("Cell con valore non Copy e non Clone", () => {
  run(
    main(
      basics,
      'struct Item(String); let cell=Cell::new(Item(String::from("old"))); let old=cell.replace(Item(String::from("new"))); assert_eq!(old.0,"old"); assert_eq!(cell.into_inner().0,"new");',
    ),
  );
});
for (const options of [
  {},
  { args: ["-C", "opt-level=3", "-C", "overflow-checks=off"] },
])
  test(
    "overflow esplicito anche con ottimizzazione: " + JSON.stringify(options),
    () => {
      run(
        main(
          stats,
          'let stats=RequestStats {seen:Cell::new(u64::MAX-1)}; assert_eq!(stats.record(),Ok(())); for _ in 0..2 {assert_eq!(stats.record(),Err("counter overflow"));} assert_eq!(stats.seen(),u64::MAX);',
        ),
        options,
      );
    },
  );
test("metriche indipendenti, alias condiviso e nessun mut necessario", () => {
  run(
    main(
      stats,
      "let first=RequestStats::default(); let second=RequestStats::default(); let alias=&first; alias.record().unwrap(); assert_eq!(first.seen(),1); assert_eq!(second.seen(),0);",
    ),
  );
});
for (const [input, count] of [
  ["", 0],
  [" \t\n", 0],
  ["alpha beta", 2],
  ["caff\u00e8\u2003Rust", 2],
  ["one,two", 1],
])
  test("cache: " + JSON.stringify(input), () => {
    const literal = JSON.stringify(input);
    run(
      main(
        cache,
        "let document=Document::new(String::from(" +
          literal +
          ")); assert!(document.word_count.get().is_none()); for _ in 0..3 {assert_eq!(document.word_count()," +
          count +
          ");} assert_eq!(document.word_count.get(),Some(&" +
          count +
          "));",
      ),
    );
  });
test("invalidazione anche prima del primo calcolo e su testo vuoto", () => {
  run(
    main(
      cache,
      'let mut document=Document::new(String::from("old text")); document.replace_text(String::new()); assert_eq!(document.word_count(),0); document.replace_text(String::from("new longer text")); assert_eq!(document.word_count(),3); document.replace_text(String::from("x")); assert_eq!(document.word_count(),1);',
    ),
  );
});
test("la prova rileva una cache non invalidata", () => {
  run(replaceOnce(from(cache), "self.word_count.take();", ""), {
    panic: /assertion failed/,
  });
});
test("modifica del testo vietata attraverso riferimento condiviso", () => {
  run(
    main(
      cache,
      'let document=Document::new(String::from("old")); let shared=&document; shared.replace_text(String::from("new"));',
    ),
    { error: "E0596" },
  );
});
test("nessun reset con riferimento alla cache ancora usato", () => {
  run(
    main(
      cache,
      'let mut document=Document::new(String::from("old")); document.word_count(); let count=document.word_count.get().unwrap(); document.replace_text(String::new()); println!("{count}");',
    ),
    { error: "E0502" },
  );
});
test("owner Rc distinto da clone del contenuto", () => {
  run(
    main(
      shared,
      "let original=Rc::new(RefCell::new(vec![1])); let independent=original.as_ref().clone(); independent.borrow_mut().push(2); assert_eq!(*original.borrow(),vec![1]); assert_eq!(*independent.borrow(),vec![1,2]);",
    ),
  );
});
test("dopo move il chiamante non puo usare la cella", () => {
  const code = replaceOnce(
    from(moved),
    "assert_eq!(worker.join().unwrap(), vec![1, 2]);",
    'assert_eq!(worker.join().unwrap(), vec![1, 2]);\n    println!("{:?}",values);',
  );
  run(code, { error: "E0382" });
});
test("riferimento a RefCell non diventa Send con thread scoped", () => {
  run(
    "use std::{cell::RefCell,thread}; fn main(){let values=RefCell::new(vec![1]);thread::scope(|s|{s.spawn(||values.borrow_mut().push(2));});}",
    { error: "E0277" },
  );
});
test("mutex esterno non elimina conflitti interni nello stesso accesso", () => {
  run(
    main(
      nested,
      "let state=Mutex::new(RefCell::new(vec![1])); let guard=state.lock().unwrap(); let read=guard.borrow(); assert!(guard.try_borrow_mut().is_err()); drop(read); guard.borrow_mut().push(2);",
    ),
  );
});
test("semplificazione: Mutex senza RefCell", () => {
  let code = replaceOnce(
    from(nested),
    "Mutex::new(RefCell::new(Vec::new()))",
    "Mutex::new(Vec::new())",
  );
  code = code
    .replaceAll("let guard =", "let mut guard =")
    .replaceAll("guard.borrow_mut().push", "guard.push");
  code = replaceOnce(
    code,
    "state.into_inner().unwrap().into_inner()",
    "state.into_inner().unwrap()",
  );
  run(code);
});
test("correzione: risultato posseduto e Option per Vec vuoto", () => {
  run(
    "use std::cell::RefCell; fn first(values:&RefCell<Vec<i32>>)->Option<i32>{values.borrow().first().copied()} fn main(){assert_eq!(first(&RefCell::new(vec![])),None);assert_eq!(first(&RefCell::new(vec![7])),Some(7));}",
  );
});
test("correzione: guardia proiettata", () => {
  run(
    "use std::cell::{Ref,RefCell}; fn first(values:&RefCell<Vec<i32>>)->Option<Ref<'_,i32>>{Ref::filter_map(values.borrow(),|v|v.first()).ok()} fn main(){let values=RefCell::new(vec![7]); let first=first(&values).unwrap(); assert_eq!(*first,7); assert!(values.try_borrow_mut().is_err()); drop(first); assert!(values.try_borrow_mut().is_ok());}",
  );
});
test("correzione: Arc e Mutex", () => {
  let code = from(arc)
    .replaceAll("RefCell", "Mutex")
    .replace("std::cell::Mutex", "std::sync::Mutex")
    .replace("shared.borrow_mut()", "shared.lock().unwrap()");
  code = replaceOnce(
    code,
    "}).join().unwrap();",
    "}).join().unwrap();\n    assert_eq!(*values.lock().unwrap(),vec![1,2]);",
  );
  run(code);
});
for (const [type, bound, valid] of [
  ["std::cell::Cell<String>", "Send", true],
  ["std::cell::Cell<String>", "Sync", false],
  ["std::cell::RefCell<String>", "Send", true],
  ["std::cell::RefCell<String>", "Sync", false],
  ["std::cell::RefCell<std::rc::Rc<u32>>", "Send", false],
  ["std::sync::Mutex<std::cell::RefCell<String>>", "Sync", true],
  ["std::sync::RwLock<std::cell::RefCell<String>>", "Sync", false],
  ["std::sync::Arc<std::cell::RefCell<String>>", "Send", false],
  ["std::sync::Arc<std::sync::Mutex<String>>", "Send", true],
  ["std::cell::OnceCell<usize>", "Sync", false],
  ["std::sync::OnceLock<usize>", "Sync", true],
  ["std::cell::UnsafeCell<usize>", "Sync", false],
])
  test(bound + ": " + type, () =>
    run(
      "fn require<T:" + bound + ">(){} fn main(){require::<" + type + ">();}",
      valid ? {} : { error: "E0277" },
    ),
  );
