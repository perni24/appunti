import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Rc T e Arc T"];
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
const prefix = "appunti-rust-rc-arc-";
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

const shared = "Clonare gli handle e osservare il rilascio";
const weak = "Weak non e un proprietario forte";
const unique = "get_mut senza interior mutability";
const cow = "make_mut e separazione alla prima modifica";
const cell = "Mutazione condivisa nello stesso thread";
const reader = "Condivisione in lettura tra thread con join";
const mutex = "Stato mutabile condiviso con Arc e Mutex";
const tree = "Collegamento al padre senza ciclo forte";
const extract = "Recuperare ownership del contenuto";
const cyclic = "Riferimento debole a se stessi con new_cyclic";
const direct = "Mutare direttamente attraverso un handle mutabile";
const sendRc = "Spostare Rc in un thread";
const refCellArc = "Pensare che Arc renda RefCell thread-safe";
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
const fixture = (lines) => lines.join("\n");
test("baseline reale e inventario: tredici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 13);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Rc T e Arc T.md";
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
    "Rc<T> e Arc<T>",
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
    "std/rc/struct.Rc.html",
    "std/sync/struct.Arc.html",
    "std/rc/struct.Weak.html",
    "std/sync/struct.Weak.html",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url));
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep/,
    );
});
for (const title of [
  shared,
  weak,
  unique,
  cow,
  cell,
  reader,
  mutex,
  tree,
  extract,
  cyclic,
])
  test("programma originale: " + title, () => run(from(title)));
for (const [title, error] of [
  [direct, "E0596"],
  [sendRc, "E0277"],
  [refCellArc, "E0277"],
])
  test("controesempio originale: " + title, () => run(from(title), { error }));

test("Arc clona gli handle anche senza Clone del contenuto", () => {
  run(from(shared).replace("use std::rc::Rc;", "use std::sync::Arc as Rc;"));
});
test("move e prestito non aggiungono proprietari; Weak non ritarda Drop", () => {
  run(
    main(
      shared,
      fixture([
        "let drops = Cell::new(0);",
        'let first = Rc::new(Node { name: "node".into(), drops: &drops });',
        "let moved = first; let borrowed = &moved;",
        "assert_eq!(Rc::strong_count(borrowed), 1);",
        "let weak = Rc::downgrade(&moved); drop(moved);",
        "assert_eq!(drops.get(), 1); assert!(weak.upgrade().is_none());",
      ]),
    ),
  );
});
test("identita di allocazione distinta dall'uguaglianza", () => {
  run(
    main(
      weak,
      fixture([
        'let a = Rc::new(String::from("same")); let b = Rc::new(String::from("same"));',
        "assert_eq!(a, b); assert!(!Rc::ptr_eq(&a, &b));",
        "assert!(Rc::ptr_eq(&a, &Rc::clone(&a)));",
      ]),
    ),
  );
});
test("Weak clonato conta separatamente dai forti", () => {
  run(
    main(
      weak,
      fixture([
        "let owner = Rc::new(9); let a = Rc::downgrade(&owner); let b = Weak::clone(&a);",
        "assert_eq!(Rc::strong_count(&owner), 1); assert_eq!(Rc::weak_count(&owner), 2);",
        "drop(a); assert_eq!(Rc::weak_count(&owner), 1);",
        "drop(owner); assert!(b.upgrade().is_none());",
      ]),
    ),
  );
});
test("stesso ciclo di vita con sync Weak", () => {
  run(
    from(weak).replace("std::rc::{Rc, Weak}", "std::sync::{Arc as Rc, Weak}"),
  );
});
test("Weak non si dereferenzia", () => {
  run(
    main(
      weak,
      "let value = Rc::new(7); let weak = Rc::downgrade(&value); let _n = *weak;",
    ),
    { error: "E0614" },
  );
});
test("get_mut vale anche per Rc", () => {
  run(from(unique).replace("std::sync::Arc", "std::rc::Rc as Arc"));
});
test("get_mut non richiede Clone", () => {
  run(
    "use std::sync::Arc; struct NonClone(u8); fn main() { let mut p = Arc::new(NonClone(1)); Arc::get_mut(&mut p).unwrap().0 = 2; assert_eq!(p.0, 2); }",
  );
});
test("get_mut non aggira un prestito ancora in uso", () => {
  run(
    main(
      unique,
      "let mut p = Arc::new(1); let alias = &p; let _ = Arc::get_mut(&mut p); assert_eq!(**alias, 1);",
    ),
    { error: "E0502" },
  );
});
test("get_mut richiede un prestito mutabile dell'handle", () => {
  run(main(unique, "let p = Arc::new(1); let _ = Arc::get_mut(&p);"), {
    error: "E0308",
  });
});
test("make_mut vale anche per Arc", () => {
  run(from(cow).replace("std::rc::Rc", "std::sync::Arc as Rc"));
});
for (const pointer of ["std::rc::Rc", "std::sync::Arc"]) {
  for (const mode of ["unique", "strong", "weak"]) {
    test(pointer + ": make_mut conta Clone nel caso " + mode, () => {
      const setup =
        mode === "strong"
          ? "let peer = P::clone(&p);"
          : mode === "weak"
            ? "let observer = P::downgrade(&p);"
            : "";
      const check =
        mode === "strong"
          ? "assert_eq!(peer.value, 1); assert!(!P::ptr_eq(&p, &peer));"
          : mode === "weak"
            ? "assert!(observer.upgrade().is_none());"
            : "";
      run(
        fixture([
          "use " + pointer + " as P; use std::cell::Cell;",
          "struct Value<'a> { value: u8, clones: &'a Cell<u8> }",
          "impl Clone for Value<'_> { fn clone(&self) -> Self {",
          "self.clones.set(self.clones.get() + 1); Self { value: self.value, clones: self.clones } }}",
          "fn main() { let clones = Cell::new(0);",
          "let mut p = P::new(Value { value: 1, clones: &clones });",
          setup,
          "P::make_mut(&mut p).value = 2; assert_eq!(p.value, 2);",
          "assert_eq!(clones.get(), " + (mode === "strong" ? 1 : 0) + ");",
          check,
          "}",
        ]),
      );
    });
  }
}
test("make_mut richiede contenuto clonabile anche quando unico", () => {
  run(
    "use std::rc::Rc; struct NonClone(u8); fn main() { let mut p = Rc::new(NonClone(1)); Rc::make_mut(&mut p).0 = 2; }",
    { error: "E0277" },
  );
});
test("con altri forti il Weak continua a puntare al vecchio valore", () => {
  run(
    main(
      cow,
      fixture([
        'let mut p = Rc::new(String::from("old")); let peer = Rc::clone(&p); let weak = Rc::downgrade(&p);',
        'Rc::make_mut(&mut p).push_str("!"); let old = weak.upgrade().unwrap();',
        'assert!(Rc::ptr_eq(&old, &peer)); assert_eq!(&*old, "old"); assert_eq!(&*p, "old!");',
      ]),
    ),
  );
});
test("clone-on-write non implica clonazione profonda dei campi", () => {
  run(
    fixture([
      "use std::rc::Rc; use std::cell::Cell;",
      "#[derive(Clone)] struct Config { revision: u8, shared: Rc<Cell<u8>> }",
      "fn main() { let mut a = Rc::new(Config { revision: 0, shared: Rc::new(Cell::new(0)) });",
      "let b = Rc::clone(&a); Rc::make_mut(&mut a).revision = 1; a.shared.set(7);",
      "assert_eq!(a.revision, 1); assert_eq!(b.revision, 0);",
      "assert!(Rc::ptr_eq(&a.shared, &b.shared)); assert_eq!(b.shared.get(), 7); }",
    ]),
  );
});
test("RefCell: borrow_mut in conflitto produce panic", () => {
  run(
    from(cell).replace(
      "assert!(editor.try_borrow_mut().is_err());",
      "let _conflict = editor.borrow_mut();",
    ),
    { panic: /already borrowed/ },
  );
});
test("Cell consente aggiornamenti condivisi single-thread", () => {
  run(
    "use std::rc::Rc; use std::cell::Cell; fn main() { let a = Rc::new(Cell::new(2)); let b = Rc::clone(&a); b.set(7); assert_eq!(a.get(), 7); }",
  );
});
for (const [values, sum, length] of [
  ["[]", 0, 0],
  ["[-4_i32, 0, 2]", -2, 3],
]) {
  test("lettura concorrente: " + values, () => {
    let code = replaceOnce(
      from(reader),
      "vec![10_i32, 20, 30]",
      "Vec::<i32>::from(" + values + ")",
    );
    code = replaceOnce(code, "unwrap(), 60", "unwrap(), " + sum);
    code = replaceOnce(code, "data.len(), 3", "data.len(), " + length);
    run(code);
  });
}
test("spostare l'unico Arc impedisce il successivo uso dal chiamante", () => {
  run(
    from(reader).replace(
      "let worker_data = Arc::clone(&data);",
      "let worker_data = data;",
    ),
    { error: "E0382" },
  );
});
test("Arc non rende static il riferimento interno", () => {
  run(
    fixture([
      "use std::sync::Arc; use std::thread;",
      'fn main() { let text = String::from("local"); let value = Arc::new(text.as_str());',
      "let worker = thread::spawn(move || value.len()); assert_eq!(worker.join().unwrap(), 5); }",
    ]),
    { error: "E0597" },
  );
});
test("possedere la String soddisfa spawn senza memoria eterna", () => {
  run(
    fixture([
      "use std::sync::Arc; use std::thread;",
      'fn main() { let text = String::from("local"); let value = Arc::new(text);',
      "let worker = thread::spawn(move || value.len()); assert_eq!(worker.join().unwrap(), 5); }",
    ]),
  );
});
for (const [type, error] of [
  ["std::sync::Arc<String>", null],
  ["std::sync::Weak<String>", null],
  ["std::sync::Arc<std::cell::Cell<i32>>", "E0277"],
  ["std::sync::Arc<std::sync::Mutex<std::cell::Cell<i32>>>", null],
  ["std::sync::Arc<std::sync::Mutex<std::rc::Rc<i32>>>", "E0277"],
  ["std::rc::Rc<i32>", "E0277"],
  ["std::rc::Weak<i32>", "E0277"],
]) {
  test("bound Send e Sync: " + type, () => {
    run(
      "fn both<T: Send + Sync>() {} fn main() { both::<" + type + ">(); }",
      error ? { error } : {},
    );
  });
}
test("un Rc puo essere costruito e usato interamente dentro un worker", () => {
  run(
    "fn main() { let worker = std::thread::spawn(|| { let local = std::rc::Rc::new(7); *local }); assert_eq!(worker.join().unwrap(), 7); }",
  );
});
for (const [workers, repeats] of [
  [0, 10],
  [1, 0],
  [8, 37],
]) {
  test("Mutex: " + workers + " worker e " + repeats + " incrementi", () => {
    let code = replaceOnce(from(mutex), "0..4", "0.." + workers);
    code = replaceOnce(code, "0..250", "0.." + repeats);
    code = replaceOnce(
      code,
      "unwrap(), 1_000",
      "unwrap(), " + workers * repeats,
    );
    run(code);
  });
}
test("osservare i contatori solo con un protocollo sincronizzato", () => {
  run(
    fixture([
      "use std::sync::{Arc, mpsc}; use std::thread;",
      "fn main() { let p = Arc::new(7); let local = Arc::clone(&p);",
      "let (ready_tx, ready_rx) = mpsc::channel(); let (release_tx, release_rx) = mpsc::channel();",
      "let worker = thread::spawn(move || { ready_tx.send(()).unwrap(); release_rx.recv().unwrap(); assert_eq!(*local, 7); });",
      "ready_rx.recv().unwrap(); assert_eq!(Arc::strong_count(&p), 2);",
      "release_tx.send(()).unwrap(); worker.join().unwrap(); assert_eq!(Arc::strong_count(&p), 1); }",
    ]),
  );
});
test("upgrade mantiene vivo il padre dopo il drop dell'handle iniziale", () => {
  run(
    main(
      tree,
      fixture([
        'let parent = Rc::new(Node { name: "parent".into(), parent: RefCell::new(Weak::new()), children: RefCell::new(vec![]) });',
        "let observer = Rc::downgrade(&parent); let kept = observer.upgrade().unwrap(); drop(parent);",
        'assert_eq!(kept.name, "parent"); assert!(observer.upgrade().is_some());',
        "drop(kept); assert!(observer.upgrade().is_none());",
      ]),
    ),
  );
});
test("un ciclo forte sopravvive; interromperlo rilascia entrambi i nodi", () => {
  run(
    main(
      tree,
      fixture([
        "let make = |name: &str| Rc::new(Node { name: name.into(), parent: RefCell::new(Weak::new()), children: RefCell::new(vec![]) });",
        'let a = make("a"); let b = make("b");',
        "a.children.borrow_mut().push(Rc::clone(&b)); b.children.borrow_mut().push(Rc::clone(&a));",
        "let wa = Rc::downgrade(&a); let wb = Rc::downgrade(&b); drop(a); drop(b);",
        "let recovered = wa.upgrade().unwrap(); assert!(wb.upgrade().is_some());",
        "recovered.children.borrow_mut().clear(); drop(recovered);",
        "assert!(wa.upgrade().is_none()); assert!(wb.upgrade().is_none());",
      ]),
    ),
  );
});
for (const pointer of ["std::rc::Rc", "std::sync::Arc"]) {
  test(
    pointer + ": estrarre un contenuto non Clone con Weak conserva il valore",
    () => {
      run(
        fixture([
          "use " + pointer + " as P; use std::cell::Cell;",
          "struct Value<'a>(&'a Cell<usize>);",
          "impl Drop for Value<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }",
          "fn main() { let drops = Cell::new(0); let p = P::new(Value(&drops)); let weak = P::downgrade(&p);",
          "let owned = P::try_unwrap(p).ok().unwrap();",
          "assert_eq!(drops.get(), 0); assert!(weak.upgrade().is_none());",
          "drop(owned); assert_eq!(drops.get(), 1); }",
        ]),
      );
    },
  );
}
for (const count of [1, 2, 8]) {
  test(
    "into_inner concorrente: esattamente un risultato per " +
      count +
      " proprietari",
    () => {
      run(
        fixture([
          "use std::sync::{Arc, Barrier}; use std::thread;",
          'fn main() { let p = Arc::new(String::from("payload"));',
          "let owners: Vec<_> = (0.." +
            count +
            ").map(|_| Arc::clone(&p)).collect(); drop(p);",
          "let barrier = Arc::new(Barrier::new(" + count + "));",
          "let workers: Vec<_> = owners.into_iter().map(|owner| { let barrier = Arc::clone(&barrier);",
          "thread::spawn(move || { barrier.wait(); Arc::into_inner(owner) }) }).collect();",
          "let values: Vec<_> = workers.into_iter().filter_map(|w| w.join().unwrap()).collect();",
          'assert_eq!(values, ["payload"]); }',
        ]),
      );
    },
  );
}
test("try_unwrap().ok(): entrambi possono fallire e distruggere il contenuto", () => {
  run(
    fixture([
      "use std::sync::{Arc, Barrier, atomic::{AtomicUsize, Ordering}}; use std::thread;",
      "struct Value(Arc<AtomicUsize>);",
      "impl Drop for Value { fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); } }",
      "fn main() { let drops = Arc::new(AtomicUsize::new(0));",
      "let first = Arc::new(Value(Arc::clone(&drops))); let second = Arc::clone(&first);",
      "let barrier = Arc::new(Barrier::new(2));",
      "let workers: Vec<_> = [first, second].into_iter().map(|owner| { let barrier = Arc::clone(&barrier);",
      "thread::spawn(move || { let result = Arc::try_unwrap(owner); barrier.wait(); result.ok() }) }).collect();",
      "for worker in workers { assert!(worker.join().unwrap().is_none()); }",
      "assert_eq!(drops.load(Ordering::SeqCst), 1); }",
    ]),
  );
});
test("Rc into_inner consuma il forte anche quando restituisce None", () => {
  run(
    main(
      weak,
      "let first = Rc::new(7); let last = Rc::clone(&first); assert_eq!(Rc::into_inner(first), None); assert_eq!(Rc::strong_count(&last), 1); assert_eq!(Rc::into_inner(last), Some(7));",
    ),
  );
});
test("unwrap_or_clone clona solo in presenza di altri forti", () => {
  run(
    fixture([
      "use std::rc::Rc; use std::cell::Cell; struct Value<'a>(&'a Cell<u8>);",
      "impl Clone for Value<'_> { fn clone(&self) -> Self { self.0.set(self.0.get()+1); Self(self.0) } }",
      "fn main() { let clones = Cell::new(0); let first = Rc::new(Value(&clones)); let peer = Rc::clone(&first);",
      "let _a = Rc::unwrap_or_clone(first); assert_eq!(clones.get(), 1);",
      "let _b = Rc::unwrap_or_clone(peer); assert_eq!(clones.get(), 1); }",
    ]),
  );
});
test("Arc new_cyclic: upgrade fallisce durante la costruzione", () => {
  run(
    from(cyclic).replace("std::rc::{Rc, Weak}", "std::sync::{Arc as Rc, Weak}"),
  );
});
test("new_cyclic: piu promozioni mantengono vivo il valore fino all'ultima", () => {
  run(
    main(
      cyclic,
      fixture([
        "let node = Rc::new_cyclic(|weak| Node { self_ref: weak.clone() });",
        "let observer = Weak::clone(&node.self_ref);",
        "let a = observer.upgrade().unwrap(); let b = observer.upgrade().unwrap();",
        "drop(node); drop(a); assert!(observer.upgrade().is_some());",
        "drop(b); assert!(observer.upgrade().is_none());",
      ]),
    ),
  );
});
test("tipi unsized e trait object condiviso tra thread", () => {
  run(
    fixture([
      "use std::rc::Rc; use std::sync::Arc;",
      "trait Value { fn read(&self) -> i32; } impl Value for i32 { fn read(&self) -> i32 { *self } }",
      'fn main() { let text: Rc<str> = Rc::from("text"); assert_eq!(&*text, "text");',
      "let slice: Arc<[i32]> = Arc::from([1, 2, 3]); assert_eq!(&*slice, &[1,2,3]);",
      "let object: Arc<dyn Value + Send + Sync> = Arc::new(7);",
      "let worker = std::thread::spawn(move || object.read()); assert_eq!(worker.join().unwrap(), 7); }",
    ]),
  );
});
test("correzione del controesempio diretto con get_mut", () => {
  run(
    from(direct).replace(
      "value.push('!');",
      "Rc::get_mut(&mut value).unwrap().push('!'); assert_eq!(&*value, \"rust!\");",
    ),
  );
});
test("correzione del trasferimento di Rc usando Arc", () => {
  run(from(sendRc).replace("std::rc::Rc", "std::sync::Arc as Rc"));
});
test("correzione Arc RefCell usando Mutex e verifica del risultato", () => {
  let code = from(refCellArc).replace(
    "use std::cell::RefCell;",
    "use std::sync::Mutex;",
  );
  code = code
    .replace("RefCell::new(0)", "Mutex::new(0)")
    .replace("borrow_mut()", "lock().unwrap()");
  code = code.replace(
    "worker.join().unwrap();",
    "worker.join().unwrap(); assert_eq!(*value.lock().unwrap(), 1);",
  );
  run(code);
});
