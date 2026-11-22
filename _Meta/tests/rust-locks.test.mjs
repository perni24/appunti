import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Mutex T e RwLock T"];
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
const prefix = "appunti-rust-locks-";
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

const guard = "La guardia resta viva fino al rilascio";
const readers = "Lettori e scrittori";
const counter = "Contatore concorrente con attesa esplicita";
const log = "Registro condiviso con snapshot indipendente";
const repair = "Riparare uno stato avvelenato";
const exclusive = "Accesso esclusivo senza acquisire il lock";
const upgrade = "Dal controllo in lettura alla modifica";
const escaping = "Restituire un riferimento dopo aver rilasciato la guardia";
const mutation = "Modificare attraverso una read guard";
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

test("baseline reale e nove programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 9);
});
test("frontmatter, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Mutex T e RwLock T.md";
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
    "Mutex<T> e RwLock<T>",
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
  for (const page of ["Mutex", "RwLock", "MutexGuard", "PoisonError"])
    assert.ok(
      content.includes(
        "https://doc.rust-lang.org/std/sync/struct." + page + ".html",
      ),
    );
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep|mem::forget/,
    );
});
for (const heading of [guard, readers, counter, log, exclusive, upgrade])
  test("programma originale: " + heading, () => run(from(heading)));
test("programma originale: recupero dopo panic del worker", () =>
  run(from(repair), { stderr: /interrupted update/ }));
test("controesempio: riferimento senza guardia", () =>
  run(from(escaping), { error: "E0515" }));
test("controesempio: read guard mutabile", () =>
  run(from(mutation), { error: "E0596" }));

for (const [workers, iterations] of [
  [0, 250],
  [1, 0],
  [2, 50],
  [8, 500],
]) {
  test(
    "conteggio con " + workers + " worker e " + iterations + " iterazioni",
    () => {
      let code = replaceOnce(from(counter), "0..4", "0.." + workers);
      code = replaceOnce(code, "0..250", "0.." + iterations);
      code = replaceOnce(code, "1000);", workers * iterations + ");");
      run(code);
    },
  );
}
test("overflow esplicito anche con ottimizzazione", () => {
  let code = replaceOnce(from(counter), "0_u32", "u32::MAX");
  code = replaceOnce(code, "0..4", "0..1");
  code = replaceOnce(code, "0..250", "0..1");
  run(code, {
    args: ["-O", "-C", "overflow-checks=off"],
    panic: /counter overflow/,
  });
});
test("le asserzioni rilevano un aggiornamento omesso", () => {
  run(
    replaceOnce(
      from(counter),
      '*value = value.checked_add(1).expect("counter overflow");',
      "let _ = *value;",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("lo snapshot non mantiene il lock e resta indipendente", () => {
  run(
    main(
      log,
      String.raw`
    let log = SharedLog::default();
    assert_eq!(log.len(), Ok(0));
    assert!(log.snapshot().unwrap().is_empty());
    log.push(String::from("a\nb")).unwrap();
    log.push(String::from("\u{e8}")).unwrap();
    let snapshot = log.snapshot().unwrap();
    log.push(String::new()).unwrap();
    assert_eq!(snapshot, ["a\nb", "\u{e8}"]);
    assert_eq!(log.len(), Ok(3));
    assert_eq!(log.snapshot().unwrap().last().unwrap(), "");
    assert!(log.entries.try_lock().is_ok());
  `,
    ),
  );
});
test("cloni del log condividono tutti gli inserimenti", () => {
  run(
    main(
      log,
      String.raw`
    let log = SharedLog::default();
    let workers: Vec<_> = (0..4).map(|worker| {
        let log = log.clone();
        thread::spawn(move || {
            for n in 0..20 { log.push(format!("{worker}:{n}")).unwrap(); }
        })
    }).collect();
    for worker in workers { worker.join().unwrap(); }
    let mut snapshot = log.snapshot().unwrap();
    snapshot.sort();
    let mut expected: Vec<_> = (0..4).flat_map(|w| (0..20).map(move |n| format!("{w}:{n}"))).collect();
    expected.sort();
    assert_eq!(snapshot, expected);
    assert_eq!(log.len(), Ok(80));
  `,
    ),
  );
});
test("tutti i metodi rifiutano poisoning senza trattenere la guardia", () => {
  run(
    main(
      log,
      String.raw`
    let log = SharedLog::default();
    let copy = log.clone();
    assert!(thread::spawn(move || {
        let _guard = copy.entries.lock().unwrap();
        panic!("poison log");
    }).join().is_err());
    assert_eq!(log.push(String::from("x")), Err("log poisoned"));
    assert_eq!(log.len(), Err("log poisoned"));
    assert_eq!(log.snapshot(), Err("log poisoned"));
    assert!(matches!(log.entries.try_lock(), Err(std::sync::TryLockError::Poisoned(_))));
  `,
    ),
    { stderr: /poison log/ },
  );
});
test("read guard compatibile con lettore di un altro thread", () => {
  run(String.raw`
use std::sync::{RwLock,TryLockError};
use std::thread;
fn main() {
    let lock=RwLock::new(7);
    let first=lock.read().unwrap();
    thread::scope(|s| { s.spawn(|| {
        assert_eq!(*lock.try_read().unwrap(),7);
        assert!(matches!(lock.try_write(),Err(TryLockError::WouldBlock)));
    }).join().unwrap(); });
    drop(first);
    let writer=lock.write().unwrap();
    thread::scope(|s| { s.spawn(|| {
        assert!(matches!(lock.try_read(),Err(TryLockError::WouldBlock)));
        assert!(matches!(lock.try_write(),Err(TryLockError::WouldBlock)));
    }).join().unwrap(); });
    drop(writer);
    assert!(lock.try_write().is_ok());
}`);
});
test("PoisonError conserva una guardia acquisita", () => {
  run(
    String.raw`
use std::sync::{Mutex,TryLockError};
use std::thread;
fn main() {
    let lock=Mutex::new(0);
    thread::scope(|s| {
        assert!(s.spawn(|| {let _g=lock.lock().unwrap();panic!("poisoned worker");}).join().is_err());
    });
    let error=lock.lock().unwrap_err();
    thread::scope(|s| {s.spawn(|| {
        assert!(matches!(lock.try_lock(),Err(TryLockError::WouldBlock)));
    }).join().unwrap();});
    drop(error);
    match lock.try_lock() {
        Err(TryLockError::Poisoned(error)) => assert_eq!(*error.into_inner(),0),
        _=>panic!("expected poisoning"),
    };
}`,
    { stderr: /poisoned worker/ },
  );
});
test("recuperare la guardia non cancella il flag", () => {
  const code = replaceOnce(
    from(repair),
    "bounds.clear_poison();",
    "assert!(bounds.is_poisoned());",
  );
  run(
    replaceOnce(
      code,
      "assert!(!bounds.is_poisoned());",
      "assert!(bounds.is_poisoned());",
    ),
    { panic: /PoisonError/ },
  );
});
test("clear_poison non ripara il contenuto", () => {
  let code = replaceOnce(
    from(repair),
    "*state = Bounds { lower: 0, upper: 5 };",
    "assert!(state.lower > state.upper);",
  );
  run(code, { panic: /assertion.*failed/s });
});
for (const [kind, acquire] of [
  ["Mutex", "lock"],
  ["RwLock", "write"],
]) {
  test(kind + ": get_mut e into_inner conservano il poisoning", () => {
    run(
      String.raw`
use std::sync::${kind};
use std::thread;
fn main() {
    let mut lock=${kind}::new(String::from("before"));
    thread::scope(|s| {
        assert!(s.spawn(|| {
            let mut guard=lock.${acquire}().unwrap();
            guard.push_str(" partial");
            panic!("partial edit");
        }).join().is_err());
    });
    let value=lock.get_mut().unwrap_err().into_inner();
    assert_eq!(value,"before partial");
    value.push('!');
    assert!(lock.is_poisoned());
    assert_eq!(lock.into_inner().unwrap_err().into_inner(),"before partial!");
}`,
      { stderr: /partial edit/ },
    );
  });
}
for (const [mode, poisoned] of [
  ["read", false],
  ["write", true],
]) {
  test("RwLock panic con guardia " + mode, () => {
    run(
      String.raw`
use std::sync::RwLock;
use std::thread;
fn main() {
    let lock=RwLock::new(9);
    thread::scope(|s| {
        assert!(s.spawn(|| {
            let _guard=lock.${mode}().unwrap();
            panic!("rw panic");
        }).join().is_err());
    });
    assert_eq!(lock.is_poisoned(),${poisoned});
    assert_eq!(lock.read().is_err(),${poisoned});
    assert_eq!(lock.write().is_err(),${poisoned});
}`,
      { stderr: /rw panic/ },
    );
  });
}
test("errore ordinario Result non avvelena automaticamente", () => {
  run(String.raw`
use std::sync::Mutex;
fn edit(lock:&Mutex<i32>)->Result<(),()> {
    let mut value=lock.lock().unwrap();
    *value=99;
    Err(())
}
fn main() {
    let lock=Mutex::new(0);
    assert_eq!(edit(&lock),Err(()));
    assert!(!lock.is_poisoned());
    assert_eq!(*lock.lock().unwrap(),99);
}`);
});
test("ricontrollo dopo modifica interposta deterministicamente", () => {
  let code = replaceOnce(
    from(upgrade),
    "let mut current = slot.write().unwrap();",
    '*slot.write().unwrap() = Some(String::from("other"));\n    let mut current = slot.write().unwrap();',
  );
  code = replaceOnce(
    code,
    'assert_eq!(initialize_if_absent(&slot, String::from("first")), "first");',
    'assert_eq!(initialize_if_absent(&slot, String::from("first")), "other");',
  );
  code = replaceOnce(
    code,
    'assert_eq!(initialize_if_absent(&slot, String::from("second")), "first");',
    'assert_eq!(initialize_if_absent(&slot, String::from("second")), "other");',
  );
  run(code);
  run(
    replaceOnce(
      code,
      "current.get_or_insert(candidate).clone()",
      "*current = Some(candidate.clone()); candidate",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("inizializzazione concorrente conserva un unico vincitore", () => {
  run(
    main(
      upgrade,
      String.raw`
    let slot=std::sync::Arc::new(RwLock::new(None));
    let workers: Vec<_>=(0..8).map(|n| {
        let slot=std::sync::Arc::clone(&slot);
        std::thread::spawn(move || initialize_if_absent(&slot,n.to_string()))
    }).collect();
    let results: Vec<_>=workers.into_iter().map(|w|w.join().unwrap()).collect();
    let value=slot.read().unwrap().clone().unwrap();
    assert!(results.iter().all(|result|result==&value));
    assert!((0..8).any(|n|n.to_string()==value));
  `,
    ),
  );
});
test("candidato vuoto e un valore valido", () => {
  run(
    main(
      upgrade,
      String.raw`
    let slot=RwLock::new(None);
    assert_eq!(initialize_if_absent(&slot,String::new()),"");
    assert_eq!(initialize_if_absent(&slot,String::from("later")),"");
  `,
    ),
  );
});

for (const [type, bound, valid] of [
  ["std::sync::Mutex<std::cell::Cell<u32>>", "Send", true],
  ["std::sync::Mutex<std::cell::Cell<u32>>", "Sync", true],
  ["std::sync::RwLock<std::cell::Cell<u32>>", "Send", true],
  ["std::sync::RwLock<std::cell::Cell<u32>>", "Sync", false],
  ["std::sync::Mutex<std::rc::Rc<u32>>", "Send", false],
  ["std::sync::Mutex<std::rc::Rc<u32>>", "Sync", false],
  ["std::sync::RwLock<String>", "Sync", true],
  ["std::sync::MutexGuard<'static, u32>", "Send", false],
  ["std::sync::RwLockReadGuard<'static, u32>", "Send", false],
  ["std::sync::RwLockWriteGuard<'static, u32>", "Send", false],
  ["std::sync::MutexGuard<'static, u32>", "Sync", true],
  ["std::sync::MutexGuard<'static, std::cell::Cell<u32>>", "Sync", false],
]) {
  test(bound + ": " + type, () => {
    run(
      "fn require<T: " +
        bound +
        ">() {} fn main() { require::<" +
        type +
        ">(); }",
      valid ? {} : { error: "E0277" },
    );
  });
}
test("Mutex con Cell e thread scoped, senza Arc", () => {
  run(String.raw`
use std::{cell::Cell,sync::Mutex,thread};
fn main(){
    let lock=Mutex::new(Cell::new(0));
    thread::scope(|s| { for _ in 0..4 {s.spawn(||{
        let cell=lock.lock().unwrap();
        cell.set(cell.get()+1);
    });}});
    assert_eq!(lock.into_inner().unwrap().into_inner(),4);
}`);
});
test("correzione: restituzione di una String posseduta", () => {
  let code = replaceOnce(
    from(escaping),
    "fn text(value: &Mutex<String>) -> &str {\n    &value.lock().unwrap()\n}",
    "fn text(value: &Mutex<String>) -> String {\n    value.lock().unwrap().clone()\n}",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    `fn main() {let lock=Mutex::new(String::from("ok"));let copy=text(&lock);lock.lock().unwrap().push('!');assert_eq!(copy,"ok");}`,
  );
  run(code);
});
test("correzione: ritorno esplicito di una guardia", () => {
  run(String.raw`
use std::sync::{Mutex,MutexGuard};
fn text(value:&Mutex<String>)->MutexGuard<'_,String> {value.lock().unwrap()}
fn main(){let lock=Mutex::new(String::from("ok"));let guard=text(&lock);assert_eq!(&*guard,"ok");drop(guard);assert!(lock.try_lock().is_ok());}
`);
});
test("correzione: write guard al posto della read guard", () => {
  run(replaceOnce(from(mutation), "text.read()", "text.write()"));
});
test("una guardia non attraversa un await in un Future Send", () => {
  run(
    String.raw`
use std::sync::Mutex;
async fn work(value:&Mutex<u32>) {
    let mut guard=value.lock().unwrap();
    std::future::ready(()).await;
    *guard+=1;
}
fn require_send<T:Send>(_:T){}
fn main(){let lock=Mutex::new(0);require_send(work(&lock));}
`,
    { message: /cannot be sent between threads safely/ },
  );
});
test("scope sincrono prima di await permette Future Send", () => {
  run(String.raw`
use std::sync::Mutex;
async fn work(value:&Mutex<u32>) {
    { let mut guard=value.lock().unwrap();*guard+=1; }
    std::future::ready(()).await;
}
fn require_send<T:Send>(_:T){}
fn main(){let lock=Mutex::new(0);require_send(work(&lock));}
`);
});
test("get_cloned e ancora nightly", () => {
  run("fn main(){let lock=std::sync::Mutex::new(0);let _=lock.get_cloned();}", {
    error: "E0658",
  });
});
test("MutexGuard::map e ancora nightly", () => {
  run(
    "fn main(){let lock=std::sync::Mutex::new((1,2));let _guard=std::sync::MutexGuard::map(lock.lock().unwrap(),|v|&mut v.0);}",
    { error: "E0658" },
  );
});
