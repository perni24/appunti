import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["RefCell T"];
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
const prefix = "appunti-rust-refcell-";
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

const guards = "Guardie e rilascio del prestito";
const failure = "Gestire il conflitto come risultato";
const exclusive = "Accesso esclusivo, sostituzione ed estrazione";
const logger = "Logger con snapshot prima del callback";
const projection = "Restituire una vista con Ref::map";
const split = "Dividere una guardia su parti disgiunte";
const transfer = "Trasferire ownership non e condividere riferimenti";
const lastUse = "Confondere ultimo uso e distruzione";
const temporary = "Nascondere una guardia temporanea in if let";
const fix = "Rendere esplicito il confine del prestito";
const escape = "Restituire un riferimento senza la guardia";
const share = "Condividere una cella attraverso un riferimento";
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
test("baseline reale e inventario: dodici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 12);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/RefCell T.md";
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
    "RefCell<T>",
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
    "std/cell/struct.RefCell.html",
    "std/cell/struct.Ref.html",
    "std/cell/struct.RefMut.html",
    "edition-guide/rust-2024/temporary-if-let-scope.html",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url));
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep/,
    );
});
for (const title of [
  guards,
  failure,
  exclusive,
  logger,
  projection,
  split,
  transfer,
  fix,
])
  test("programma originale: " + title, () => run(from(title)));
for (const title of [lastUse, temporary])
  test("panic originale: " + title, () =>
    run(from(title), { panic: /already borrowed/ }),
  );
for (const [title, error] of [
  [escape, "E0515"],
  [share, "E0277"],
])
  test("controesempio originale: " + title, () => run(from(title), { error }));

test("Ref clone non richiede Clone del contenuto", () => {
  run(
    main(
      guards,
      "struct NonClone(u8); let value = RefCell::new(NonClone(7)); let a = value.borrow(); let b = Ref::clone(&a); assert_eq!(a.0 + b.0, 14);",
    ),
  );
});
test("Ref clone e clone del Vec sono operazioni distinte", () => {
  run(
    main(
      guards,
      fixture([
        "let value = RefCell::new(vec![1]); let guard = value.borrow();",
        "let second = Ref::clone(&guard); let mut owned = guard.clone(); owned.push(2);",
        "drop(guard); assert!(value.try_borrow_mut().is_err()); drop(second);",
        "value.borrow_mut().push(3); assert_eq!(*value.borrow(), [1,3]); assert_eq!(owned, [1,2]);",
      ]),
    ),
  );
});
test("il riferimento derivato impedisce di distruggere la guardia", () => {
  run(
    main(
      guards,
      'let value = RefCell::new(String::from("x")); let guard = value.borrow(); let text = guard.as_str(); drop(guard); assert_eq!(text, "x");',
    ),
    { error: "E0505" },
  );
});
test("Ref non espone DerefMut", () => {
  run(
    main(
      guards,
      "let value = RefCell::new(0); let mut guard = value.borrow(); *guard += 1;",
    ),
    { error: "E0594" },
  );
});
test("RefMut richiede binding mutabile per DerefMut", () => {
  run(
    main(
      guards,
      "let value = RefCell::new(0); let guard = value.borrow_mut(); *guard += 1;",
    ),
    { error: "E0596" },
  );
});
test("wildcard non conserva una nuova guardia; binding nominato la conserva", () => {
  run(
    main(
      guards,
      "let value = RefCell::new(0); let _ = value.borrow(); assert!(value.try_borrow_mut().is_ok()); let _guard = value.borrow(); assert!(value.try_borrow_mut().is_err());",
    ),
  );
});
test("un prestito mutabile blocca sia lettori sia scrittori", () => {
  run(
    main(
      failure,
      fixture([
        "let messages = RefCell::new(vec![]); let mut guard = messages.borrow_mut();",
        'assert!(append(&messages, "blocked").is_err()); assert!(messages.try_borrow().is_err());',
        'guard.push("manual".to_owned()); drop(guard); append(&messages, "ok").unwrap();',
        'assert_eq!(*messages.borrow(), ["manual", "ok"]);',
      ]),
    ),
  );
});
for (const value of ["", "caff\u00e8", "a\nb"]) {
  test("append preserva il messaggio " + JSON.stringify(value), () => {
    const literal = JSON.stringify(value);
    run(
      main(
        failure,
        "let messages = RefCell::new(vec![]); append(&messages, " +
          literal +
          ").unwrap(); assert_eq!(*messages.borrow(), [" +
          literal +
          "]);",
      ),
    );
  });
}
test("Errore di borrowing implementa Error", () => {
  run(
    main(
      failure,
      'fn error<T: std::error::Error>() {} error::<BorrowMutError>(); let messages = RefCell::new(vec![]); let _view = messages.borrow(); let err = append(&messages, "blocked").unwrap_err(); assert!(!err.to_string().is_empty());',
    ),
  );
});
test("get_mut e into_inner non richiedono Clone o Default", () => {
  run(
    main(
      exclusive,
      "struct Value(u8); let mut cell = RefCell::new(Value(1)); cell.get_mut().0 = 2; let old = cell.replace(Value(3)); assert_eq!(old.0, 2); assert_eq!(cell.into_inner().0, 3);",
    ),
  );
});
test("into_inner non puo muovere la cella ancora presa in prestito", () => {
  run(
    main(
      exclusive,
      "let cell = RefCell::new(7); let guard = cell.borrow(); let _owned = cell.into_inner(); assert_eq!(*guard, 7);",
    ),
    { error: "E0505" },
  );
});
test("get_mut richiede accesso esclusivo alla cella", () => {
  run(
    main(
      exclusive,
      "let cell = RefCell::new(7); let shared = &cell; let _ = shared.get_mut();",
    ),
    { error: "E0596" },
  );
});
for (const operation of [
  "replace(9)",
  "take()",
  "replace_with(|value| *value + 1)",
]) {
  test(operation + " fa panic con un lettore attivo", () => {
    run(
      main(
        exclusive,
        "let cell = RefCell::new(7); let _guard = cell.borrow(); let _ = cell." +
          operation +
          ";",
      ),
      { panic: /already borrowed/ },
    );
  });
}
test("swap della stessa cella fa panic", () => {
  run(main(exclusive, "let cell = RefCell::new(7); cell.swap(&cell);"), {
    panic: /already borrowed/,
  });
});
test("swap tra celle distinte scambia i valori", () => {
  run(
    main(
      exclusive,
      "let a = RefCell::new(7); let b = RefCell::new(9); a.swap(&b); assert_eq!(a.into_inner(), 9); assert_eq!(b.into_inner(), 7);",
    ),
  );
});
test("replace_with mantiene un prestito esclusivo durante la callback", () => {
  run(
    main(
      exclusive,
      "let cell = RefCell::new(7); let old = cell.replace_with(|value| { assert!(cell.try_borrow().is_err()); *value + 1 }); assert_eq!(old, 7); assert_eq!(cell.into_inner(), 8);",
    ),
  );
});
test("forget della guardia non viene riparato da get_mut", () => {
  run(
    main(
      exclusive,
      "let mut cell = RefCell::new(7); std::mem::forget(cell.borrow_mut()); assert!(cell.try_borrow().is_err()); *cell.get_mut() = 9; assert!(cell.try_borrow().is_err()); assert_eq!(cell.into_inner(), 9);",
    ),
  );
});
test("clone di RefCell produce celle distinte", () => {
  run(
    main(
      exclusive,
      "let a = RefCell::new(vec![1]); let b = a.clone(); b.borrow_mut().push(2); assert_eq!(*a.borrow(), [1]); assert_eq!(*b.borrow(), [1,2]);",
    ),
  );
});
test("clone di RefCell fallisce durante un prestito mutabile", () => {
  run(
    main(
      exclusive,
      "let a = RefCell::new(vec![1]); let _guard = a.borrow_mut(); let _b = a.clone();",
    ),
    { panic: /already mutably borrowed/ },
  );
});
test("clone di Rc condivide la medesima cella", () => {
  run(
    main(
      exclusive,
      "let a = std::rc::Rc::new(RefCell::new(vec![1])); let b = std::rc::Rc::clone(&a); b.borrow_mut().push(2); assert_eq!(*a.borrow(), [1,2]);",
    ),
  );
});
test("logger vuoto: nessuna callback", () => {
  run(
    main(
      logger,
      'let logger = Logger::default(); logger.visit(|_| panic!("unreachable")); assert_eq!(logger.count(), 0); assert!(logger.snapshot().is_empty());',
    ),
  );
});
test("logger: ordine, duplicati e snapshot indipendente", () => {
  run(
    main(
      logger,
      fixture([
        'let logger = Logger::default(); for text in ["", "same", "same"] { logger.log(text).unwrap(); }',
        'let mut owned = logger.snapshot(); owned.push("local".into());',
        'assert_eq!(logger.snapshot(), ["", "same", "same"]); assert_eq!(owned.len(), 4);',
      ]),
    ),
  );
});
test("logger: errore esplicito e dati invariati con una vista attiva", () => {
  run(
    main(
      logger,
      'let logger = Logger::default(); let view = logger.messages.borrow(); assert!(logger.log("blocked").is_err()); assert!(view.is_empty()); drop(view); logger.log("ok").unwrap(); assert_eq!(logger.count(), 1);',
    ),
  );
});
test("logger: count fa panic se un futuro metodo trattiene RefMut", () => {
  run(
    main(
      logger,
      "let logger = Logger::default(); let _write = logger.messages.borrow_mut(); let _ = logger.count();",
    ),
    { panic: /already mutably borrowed/ },
  );
});
test("logger: iterare sulla guardia causa conflitto nel callback rientrante", () => {
  let code = replaceOnce(
    from(logger),
    "let messages = self.snapshot();",
    "let messages = self.messages.borrow();",
  );
  code = replaceOnce(
    code,
    "for message in &messages {",
    "for message in messages.iter() {",
  );
  run(code, { panic: /BorrowMutError/ });
});
test("logger: la visita corrente non cresce con i nuovi messaggi", () => {
  run(
    main(
      logger,
      fixture([
        'let logger = Logger::default(); for _ in 0..4 { logger.log("initial").unwrap(); }',
        'let mut visits = 0; logger.visit(|_| { visits += 1; logger.log("added").unwrap(); });',
        "assert_eq!(visits, 4); assert_eq!(logger.count(), 8);",
      ]),
    ),
  );
});
test("logger: panic nel callback conserva gli aggiornamenti gia effettuati", () => {
  run(
    main(
      logger,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe};",
        'let logger = Logger::default(); logger.log("initial").unwrap();',
        "let result = catch_unwind(AssertUnwindSafe(|| { logger.visit(|_| {",
        'logger.log("added").unwrap(); panic!("visitor failed"); }); }));',
        'assert!(result.is_err()); assert_eq!(logger.snapshot(), ["initial", "added"]);',
        'logger.log("after").unwrap(); assert_eq!(logger.count(), 3);',
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /visitor failed/ },
  );
});
test("proiezione: anche i campi non proiettati restano protetti", () => {
  run(
    main(
      projection,
      'let profile = RefCell::new(Profile { name: "x".into(), visits: 0 }); let label = name(&profile); assert!(profile.try_borrow_mut().is_err()); assert_eq!(profile.borrow().visits, 0); drop(label); profile.borrow_mut().visits = 2;',
    ),
  );
});
test("filter_map Some conserva la guardia finche non viene rilasciata", () => {
  run(
    main(
      projection,
      "let values = RefCell::new(vec![10,20]); let found = Ref::filter_map(values.borrow(), |v| v.get(1)).unwrap(); assert_eq!(*found, 20); assert!(values.try_borrow_mut().is_err()); drop(found); assert!(values.try_borrow_mut().is_ok());",
    ),
  );
});
test("filter_map None scartato rilascia la guardia originale", () => {
  run(
    main(
      projection,
      "let values = RefCell::new(Vec::<i32>::new()); let missing = Ref::filter_map(values.borrow(), |v| v.first()).ok(); assert!(missing.is_none()); assert!(values.try_borrow_mut().is_ok());",
    ),
  );
});
test("RefMut map aggiorna un solo campo ma occupa l'intera cella", () => {
  run(
    main(
      split,
      "let values = RefCell::new((1,2)); let mut first = RefMut::map(values.borrow_mut(), |p| &mut p.0); *first = 7; assert!(values.try_borrow().is_err()); drop(first); assert_eq!(values.into_inner(), (7,2));",
    ),
  );
});
test("RefMut filter_map restituisce la guardia originale in Err", () => {
  run(
    main(
      split,
      "let values = RefCell::new(vec![1]); let mut guard = RefMut::filter_map(values.borrow_mut(), |v| v.get_mut(8)).unwrap_err(); guard.push(2); assert!(values.try_borrow().is_err()); drop(guard); assert_eq!(values.into_inner(), [1,2]);",
    ),
  );
});
test("RefMut filter_map Some consente la modifica del componente", () => {
  run(
    main(
      split,
      "let values = RefCell::new(vec![1]); let mut guard = RefMut::filter_map(values.borrow_mut(), |v| v.first_mut()).unwrap(); *guard = 9; drop(guard); assert_eq!(values.into_inner(), [9]);",
    ),
  );
});
for (const boundary of [0, 1, 3, 4]) {
  test("map_split con confine " + boundary, () => {
    run(
      main(
        split,
        fixture([
          "let values = RefCell::new([0; 4]);",
          "let (mut a, mut b) = RefMut::map_split(values.borrow_mut(), |v| v.split_at_mut(" +
            boundary +
            "));",
          "a.fill(1); b.fill(2); drop(a); assert!(values.try_borrow().is_err()); drop(b);",
          "let result = values.into_inner(); assert!(result[.." +
            boundary +
            "].iter().all(|&n| n == 1));",
          "assert!(result[" + boundary + "..].iter().all(|&n| n == 2));",
        ]),
      ),
    );
  });
}
test("map_split non permette due riferimenti mutabili alla stessa zona", () => {
  run(
    main(
      split,
      "let values = RefCell::new([0;4]); let _ = RefMut::map_split(values.borrow_mut(), |v| (&mut v[..], &mut v[..]));",
    ),
    { error: "E0499" },
  );
});
test("proiezione che fa panic rilascia la guardia durante unwind", () => {
  run(
    main(
      split,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe};",
        "let values = RefCell::new([1]);",
        "let result = catch_unwind(AssertUnwindSafe(|| {",
        'let _: RefMut<\'_, i32> = RefMut::map(values.borrow_mut(), |_| panic!("projection failed"));',
        "})); assert!(result.is_err()); assert!(values.try_borrow_mut().is_ok());",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /projection failed/ },
  );
});
for (const [type, bound, error] of [
  ["std::cell::RefCell<String>", "Send", null],
  ["std::cell::RefCell<String>", "Sync", "E0277"],
  ["std::cell::RefCell<std::rc::Rc<i32>>", "Send", "E0277"],
  ["std::cell::Ref<'static, i32>", "Send", "E0277"],
  ["std::cell::RefMut<'static, i32>", "Send", "E0277"],
  ["std::sync::Arc<std::cell::RefCell<i32>>", "Send", "E0277"],
  ["std::sync::Mutex<std::cell::RefCell<i32>>", "Sync", null],
]) {
  test("bound " + bound + ": " + type, () =>
    run(
      "fn bound<T: " + bound + ">() {} fn main() { bound::<" + type + ">(); }",
      error ? { error } : {},
    ),
  );
}
test("trasferire RefCell consuma il binding originale", () => {
  run(
    replaceOnce(
      from(transfer),
      "assert_eq!(worker.join().unwrap(), [1, 2, 3]);",
      "assert_eq!(worker.join().unwrap(), [1, 2, 3]); let _ = values.borrow();",
    ),
    { error: "E0382" },
  );
});
test("scoped thread con prestito esclusivo non richiede Sync della cella", () => {
  run(
    fixture([
      "use std::cell::RefCell; use std::thread;",
      "fn main() { let mut value = RefCell::new(0); let exclusive = &mut value;",
      "thread::scope(|scope| { scope.spawn(move || { *exclusive.get_mut() += 1; }); });",
      "assert_eq!(value.into_inner(), 1); }",
    ]),
  );
});
test("drop esplicito risolve il panic dopo l'ultimo uso", () => {
  run(
    replaceOnce(
      from(lastUse),
      "*value.borrow_mut() += 1;",
      "drop(read); *value.borrow_mut() += 1; assert_eq!(*value.borrow(), 11);",
    ),
  );
});
test("temporaneo del ramo positivo ancora vivo in edition 2021", () => {
  run(from(temporary), { edition: "2021", panic: /already borrowed/ });
});
test("correzione del temporaneo valida anche in edition 2021", () => {
  run(from(fix), { edition: "2021" });
});
for (const edition of ["2021", "2024"]) {
  test("ramo else e temporaneo: edition " + edition, () => {
    run(
      main(
        temporary,
        fixture([
          "let values = RefCell::new(Vec::<i32>::new());",
          "if let Some(_) = values.borrow_mut().pop() {} else { values.borrow_mut().push(7); };",
          "assert_eq!(*values.borrow(), [7]);",
        ]),
      ),
      edition === "2021" ? { edition, panic: /already borrowed/ } : { edition },
    );
  });
}
test("match conserva il temporaneo nell'arm", () => {
  run(
    main(
      temporary,
      "let values = RefCell::new(vec![1]); match values.borrow_mut().pop() { Some(n) => values.borrow_mut().push(n), None => {} };",
    ),
    { panic: /already borrowed/ },
  );
});
test("ritorno corretto con una guardia proiettata", () => {
  run(
    fixture([
      "use std::cell::{RefCell, Ref};",
      "fn text(value: &RefCell<String>) -> Ref<'_, str> { Ref::map(value.borrow(), |v| v.as_str()) }",
      'fn main() { let value = RefCell::new(String::from("text")); let guard = text(&value); assert_eq!(&*guard, "text"); assert!(value.try_borrow_mut().is_err()); }',
    ]),
  );
});
test("ritorno corretto con String posseduta indipendente", () => {
  run(
    fixture([
      "use std::cell::RefCell;",
      "fn text(value: &RefCell<String>) -> String { value.borrow().clone() }",
      'fn main() { let value = RefCell::new(String::from("text")); let owned = text(&value); value.borrow_mut().clear(); assert_eq!(owned, "text"); }',
    ]),
  );
});
test("unwind rilascia la guardia senza rollback o poisoning", () => {
  run(
    main(
      exclusive,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe};",
        "let cell = RefCell::new(vec![1]);",
        'let result = catch_unwind(AssertUnwindSafe(|| { let mut guard = cell.borrow_mut(); guard.push(2); panic!("partial update"); }));',
        "assert!(result.is_err()); assert_eq!(*cell.borrow(), [1,2]);",
        "cell.try_borrow_mut().unwrap().push(3); assert_eq!(cell.into_inner(), [1,2,3]);",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /partial update/ },
  );
});
test("replace_with non annulla modifiche fatte prima del panic", () => {
  run(
    main(
      exclusive,
      fixture([
        "use std::panic::{catch_unwind, AssertUnwindSafe}; let cell = RefCell::new(1);",
        'let result = catch_unwind(AssertUnwindSafe(|| { cell.replace_with(|value| { *value = 9; panic!("replacement failed"); }); }));',
        "assert!(result.is_err()); assert_eq!(cell.into_inner(), 9);",
      ]),
    ),
    { args: ["-C", "panic=unwind"], stderr: /replacement failed/ },
  );
});
test("catch_unwind non ammette automaticamente un riferimento a RefCell", () => {
  run(
    main(
      exclusive,
      "let cell = RefCell::new(0); let _ = std::panic::catch_unwind(|| { *cell.borrow_mut() += 1; });",
    ),
    { error: "E0277" },
  );
});
test("as_ptr e sicuro, la dereferenziazione richiede unsafe", () => {
  run(
    main(
      exclusive,
      "let cell = RefCell::new(0); let ptr = cell.as_ptr(); let _ = *ptr;",
    ),
    { error: "E0133" },
  );
});
