import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["OnceLock e LazyLock"];
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
const prefix = "appunti-rust-once-lazy-";
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

const basic = "Impostare un valore e osservare il rifiuto";
const lazy = "Inizializzatore dichiarato con LazyLock";
const concurrent = "Una sola inizializzazione riuscita fra piu thread";
const waiting = "Osservare un'inizializzazione in corso";
const settings = "Configurazione esplicita prima di avviare il servizio";
const errors = "Memorizzare un errore e una scelta diversa dal retry";
const panics = "Panic: nuovo tentativo o poisoning permanente";
const exclusive = "Accesso esclusivo a contenitori locali";
const lifetime = "Credere che il risultato sia sempre statico";
const sync = "Pensare che la cella sincronizzata renda ogni dato Sync";
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

test("baseline reale e inventario di dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 10);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/OnceLock e LazyLock.md";
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
    "OnceLock e LazyLock",
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
    "std/sync/struct.OnceLock.html",
    "std/sync/struct.LazyLock.html",
    "reference/items/static-items.html",
    "reference/items/constant-items.html",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url));
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep|mem::forget/,
    );
});
for (const heading of [
  basic,
  lazy,
  concurrent,
  waiting,
  settings,
  errors,
  exclusive,
])
  test("programma originale: " + heading, () => run(from(heading)));
test("programma originale: panic intercettati e retry", () =>
  run(from(panics), { stderr: /once failed[\s\S]*lazy failed[\s\S]*poison/i }));
test("controesempio: riferimento a cella locale", () =>
  run(from(lifetime), { error: "E0515" }));
test("controesempio: Cell in static OnceLock", () =>
  run(from(sync), { error: "E0277" }));

test("set trasferisce anche valori non Clone e restituisce il rifiutato", () => {
  run(
    main(
      basic,
      `
    #[derive(Debug)] struct Item(String);
    let cell=OnceLock::new();
    cell.set(Item(String::from("first"))).unwrap();
    let rejected=cell.set(Item(String::from("other"))).unwrap_err();
    assert_eq!(rejected.0,"other");
    assert_eq!(cell.get().unwrap().0,"first");
  `,
    ),
  );
});
test("il candidato eager viene costruito anche se set fallisce", () => {
  run(
    main(
      basic,
      `
    let cell=OnceLock::from(1);
    let calls=std::cell::Cell::new(0);
    let rejected=cell.set({calls.set(calls.get()+1);2});
    assert_eq!(rejected,Err(2));
    assert_eq!(calls.get(),1);
    assert_eq!(cell.get_or_init(|| {calls.set(calls.get()+1);3}),&1);
    assert_eq!(calls.get(),1);
  `,
    ),
  );
});
test("get_or_init accetta FnOnce che consuma una String", () => {
  run(
    main(
      basic,
      `
    let text=String::from("owned");
    let cell=OnceLock::new();
    assert_eq!(cell.get_or_init(move||text),"owned");
    assert_eq!(cell.into_inner().as_deref(),Some("owned"));
  `,
    ),
  );
});
test("cattura inutilizzata distrutta anche senza chiamare la closure", () => {
  run(
    main(
      basic,
      `
    struct Tracked<'a>(&'a std::cell::Cell<u32>);
    impl Drop for Tracked<'_>{fn drop(&mut self){self.0.set(self.0.get()+1);}}
    let drops=std::cell::Cell::new(0);
    let capture=Tracked(&drops);
    let cell=OnceLock::from(10);
    assert_eq!(cell.get_or_init(move||{drop(capture);20}),&10);
    assert_eq!(drops.get(),1);
  `,
    ),
  );
});
for (const workers of [1, 2, 16]) {
  test("inizializzatore singolo con " + workers + " worker", () => {
    run(replaceOnce(from(concurrent), "0..8", "0.." + workers));
  });
}
test("nessun consumer lascia OnceLock vuoto", () => {
  let code = replaceOnce(from(concurrent), "0..8", "0..0");
  code = replaceOnce(
    code,
    "calls.load(Ordering::Relaxed), 1",
    "calls.load(Ordering::Relaxed), 0",
  );
  code = replaceOnce(code, 'Some("ready")', "None");
  run(code);
});
test("contesa con set: un successo e candidati rifiutati integri", () => {
  run(`
use std::sync::OnceLock;
use std::thread;
fn main() {
    let cell=OnceLock::new();
    let results=thread::scope(|s| {
        let handles:Vec<_>=(0..8).map(|n| {
            let cell=&cell;
            s.spawn(move|| (n,cell.set(n)))
        }).collect();
        handles.into_iter().map(|h|h.join().unwrap()).collect::<Vec<_>>()
    });
    let winner=*cell.get().unwrap();
    assert_eq!(results.iter().filter(|(_,r)|r.is_ok()).count(),1);
    for (n,result) in results {
        assert_eq!(result,if n==winner {Ok(())} else {Err(n)});
    }
}
`);
});
test("wait su valore gia pronto restituisce lo stesso riferimento", () => {
  run(
    main(
      basic,
      `
    let cell=OnceLock::from(String::from("ready"));
    assert!(std::ptr::eq(cell.get().unwrap(),cell.wait()));
  `,
    ),
  );
});
test("LazyLock concorrente esegue la closure una volta", () => {
  run(`
use std::sync::{LazyLock,atomic::{AtomicUsize,Ordering}};
use std::thread;
fn main(){
    let calls=AtomicUsize::new(0);
    let lazy=LazyLock::new(||{calls.fetch_add(1,Ordering::Relaxed);String::from("value")});
    thread::scope(|s|{for _ in 0..8{s.spawn(||assert_eq!(&*lazy,"value"));}});
    assert_eq!(calls.load(Ordering::Relaxed),1);
    assert!(std::ptr::eq(LazyLock::get(&lazy).unwrap(),LazyLock::force(&lazy)));
}
`);
});
test("LazyLock get non forza e osserva None durante inizializzazione", () => {
  run(`
use std::sync::{LazyLock,mpsc};
use std::thread;
fn main(){
    let (started_tx,started_rx)=mpsc::channel();
    let (release_tx,release_rx)=mpsc::channel();
    let lazy=LazyLock::new(move||{
        started_tx.send(()).unwrap();
        release_rx.recv().unwrap();
        7
    });
    assert!(LazyLock::get(&lazy).is_none());
    thread::scope(|s|{
        let worker=s.spawn(||LazyLock::force(&lazy));
        started_rx.recv().unwrap();
        assert!(LazyLock::get(&lazy).is_none());
        release_tx.send(()).unwrap();
        assert_eq!(worker.join().unwrap(),&7);
    });
    assert_eq!(LazyLock::get(&lazy),Some(&7));
}
`);
});
for (const [input, error] of [
  ["", "invalid port"],
  ["-1", "invalid port"],
  ["65536", "invalid port"],
  ["0", "port must be nonzero"],
]) {
  test("configurazione rifiutata: " + JSON.stringify(input), () => {
    run(
      main(
        settings,
        `
      assert_eq!(install_settings("${input}"),Err("${error}"));
      assert!(settings().is_none());
      assert_eq!(install_settings("8080"),Ok(()));
      assert_eq!(settings().unwrap().port,8080);
    `,
      ),
    );
  });
}
for (const port of [1, 65535]) {
  test("porta valida al limite: " + port, () => {
    run(
      main(
        settings,
        `
      assert_eq!(install_settings("${port}"),Ok(()));
      assert_eq!(settings().unwrap().port,${port});
      assert_eq!(install_settings("${port}"),Err("already configured"));
      assert_eq!(settings().unwrap().port,${port});
    `,
      ),
    );
  });
}
test("lazy Result conserva Err senza poisoning o retry", () => {
  run(`
use std::sync::{LazyLock,atomic::{AtomicUsize,Ordering}};
fn main(){
    let calls=AtomicUsize::new(0);
    let lazy=LazyLock::new(||{calls.fetch_add(1,Ordering::Relaxed);Err::<u16,_>("bad")});
    assert_eq!(LazyLock::force(&lazy),&Err("bad"));
    assert_eq!(LazyLock::force(&lazy),&Err("bad"));
    assert_eq!(LazyLock::get(&lazy),Some(&Err("bad")));
    assert_eq!(calls.load(Ordering::Relaxed),1);
}
`);
});
test("OnceLock riprova dopo panic senza cancellare effetti gia avvenuti", () => {
  run(
    `
use std::sync::{OnceLock,atomic::{AtomicUsize,Ordering}};
use std::panic::catch_unwind;
fn main(){
    let calls=AtomicUsize::new(0);
    let value=OnceLock::<u32>::new();
    assert!(catch_unwind(||value.get_or_init(||{calls.fetch_add(1,Ordering::Relaxed);panic!("attempt failed")})).is_err());
    assert!(value.get().is_none());
    assert_eq!(value.get_or_init(||{calls.fetch_add(1,Ordering::Relaxed);99}),&99);
    assert_eq!(calls.load(Ordering::Relaxed),2);
}
`,
    { stderr: /attempt failed/ },
  );
});
test("panic del worker libera OnceLock per un altro inizializzatore", () => {
  run(
    `
use std::{sync::OnceLock,thread};
fn main(){
    let value=OnceLock::<u32>::new();
    thread::scope(|s|{
        assert!(s.spawn(||value.get_or_init(||panic!("worker failed"))).join().is_err());
        assert_eq!(s.spawn(||value.get_or_init(||9)).join().unwrap(),&9);
    });
}
`,
    { stderr: /worker failed/ },
  );
});
test("LazyLock poisoned non richiama la closure", () => {
  run(
    `
use std::sync::{LazyLock,atomic::{AtomicUsize,Ordering}};
use std::panic::catch_unwind;
fn main(){
    let calls=AtomicUsize::new(0);
    let lazy=LazyLock::<u32,_>::new(||{calls.fetch_add(1,Ordering::Relaxed);panic!("first panic")});
    for _ in 0..3 {assert!(catch_unwind(||LazyLock::force(&lazy)).is_err());}
    assert_eq!(calls.load(Ordering::Relaxed),1);
    assert!(LazyLock::get(&lazy).is_none());
}
`,
    { stderr: /first panic[\s\S]*poison/i },
  );
});
test("panic dopo inizializzazione non avvelena LazyLock", () => {
  run(
    `
use std::sync::LazyLock;
use std::panic::catch_unwind;
fn main(){
    let lazy=LazyLock::new(||String::from("ready"));
    assert!(catch_unwind(||{assert_eq!(&*lazy,"ready");panic!("consumer failed");}).is_err());
    assert_eq!(LazyLock::force(&lazy),"ready");
}
`,
    { stderr: /consumer failed/ },
  );
});
test("take e into_inner su celle vuote", () => {
  run(
    main(
      basic,
      `
    let mut value=OnceLock::<String>::new();
    assert!(value.get_mut().is_none());
    assert!(value.take().is_none());
    assert!(value.into_inner().is_none());
  `,
    ),
  );
});
test("take non puo invalidare un riferimento ancora usato", () => {
  run(
    `
use std::sync::OnceLock;
fn main(){let mut cell=OnceLock::from(String::from("x"));let old=cell.get().unwrap();cell.take();println!("{old}");}
`,
    { error: "E0502" },
  );
});
test("take richiede accesso esclusivo", () => {
  run(
    `
use std::sync::OnceLock;
fn reset(cell:&OnceLock<String>){cell.take();}
fn main(){}
`,
    { error: "E0596" },
  );
});
test("clonare OnceLock crea celle indipendenti", () => {
  run(
    main(
      basic,
      `
    let first=OnceLock::from(String::from("first"));
    let mut second=first.clone();
    second.get_mut().unwrap().push('!');
    assert_eq!(first.get().unwrap(),"first");
    assert_eq!(second.get().unwrap(),"first!");
  `,
    ),
  );
});
test("catture locali richiedono il parametro F inferito", () => {
  run(
    `
use std::sync::LazyLock;
fn main(){let name=String::from("local");let lazy:LazyLock<String>=LazyLock::new(move||name);assert_eq!(&*lazy,"local");}
`,
    { error: "E0308" },
  );
});
for (const [type, bound, valid] of [
  ["std::sync::OnceLock<String>", "Sync", true],
  ["std::sync::OnceLock<std::cell::Cell<u32>>", "Send", true],
  ["std::sync::OnceLock<std::cell::Cell<u32>>", "Sync", false],
  ["std::sync::OnceLock<std::rc::Rc<u32>>", "Send", false],
  ["std::sync::LazyLock<std::cell::Cell<u32>>", "Send", true],
  ["std::sync::LazyLock<std::cell::Cell<u32>>", "Sync", false],
  ["std::sync::LazyLock<std::rc::Rc<u32>>", "Send", false],
  ["std::cell::OnceCell<u32>", "Send", true],
  ["std::cell::OnceCell<u32>", "Sync", false],
  ["std::cell::LazyCell<u32>", "Sync", false],
])
  test(bound + ": " + type, () =>
    run(
      "fn require<T:" + bound + ">(){} fn main(){require::<" + type + ">();}",
      valid ? {} : { error: "E0277" },
    ),
  );

test("cattura Rc impedisce Sync anche se il risultato e u32", () => {
  run(
    `
use std::{rc::Rc,sync::LazyLock};
fn require<T:Sync>(_:&T){}
fn main(){let input=Rc::new(1);let lazy=LazyLock::new(move||*input);require(&lazy);}
`,
    { error: "E0277" },
  );
});
test("cattura Send non Sync sufficiente per LazyLock Sync", () => {
  run(`
use std::{cell::Cell,sync::LazyLock,thread};
fn main(){
    let input=Cell::new(7);
    let lazy=LazyLock::new(move||input.get());
    thread::scope(|s|{assert_eq!(s.spawn(||*lazy).join().unwrap(),7);});
}
`);
});
test("correzione lifetime: risultato posseduto", () => {
  let code = replaceOnce(from(lifetime), "-> &'static str", "-> String");
  code = replaceOnce(code, ".as_str()", ".clone()");
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main(){assert_eq!(name(),"local");}',
  );
  run(code);
});
test("correzione lifetime: cella del chiamante", () => {
  run(`
use std::sync::OnceLock;
fn name(value:&OnceLock<String>)->&str {value.get_or_init(||String::from("local")).as_str()}
fn main(){let value=OnceLock::new();assert_eq!(name(&value),"local");}
`);
});
test("correzione static: contenuto protetto da mutex", () => {
  run(`
use std::sync::{OnceLock,Mutex};
static COUNTER:OnceLock<Mutex<u32>>=OnceLock::new();
fn main(){let value=COUNTER.get_or_init(||Mutex::new(0));*value.lock().unwrap()+=1;assert_eq!(*value.lock().unwrap(),1);}
`);
});
for (const [label, code] of [
  [
    "get_or_try_init",
    "let cell=std::sync::OnceLock::<u32>::new();let _=cell.get_or_try_init(||Ok::<_,()>(1));",
  ],
  [
    "get_mut_or_init",
    "let mut cell=std::sync::OnceLock::new();let _=cell.get_mut_or_init(||1);",
  ],
  [
    "try_insert",
    "let cell=std::sync::OnceLock::new();let _=cell.try_insert(1);",
  ],
  [
    "LazyLock::into_inner",
    "let lazy=std::sync::LazyLock::new(||1);let _=std::sync::LazyLock::into_inner(lazy);",
  ],
])
  test("API nightly: " + label, () =>
    run("fn main(){" + code + "}", { error: "E0658" }),
  );
test("const lazy ricreato, static lazy condiviso", () => {
  run(`
use std::sync::{LazyLock,atomic::{AtomicUsize,Ordering}};
static CALLS:AtomicUsize=AtomicUsize::new(0);
fn next()->usize{CALLS.fetch_add(1,Ordering::Relaxed)+1}
const REPEATED:LazyLock<usize>=LazyLock::new(next);
static SHARED:LazyLock<usize>=LazyLock::new(next);
fn main(){
    assert_eq!(*REPEATED,1);
    assert_eq!(*REPEATED,2);
    assert_eq!(*SHARED,3);
    assert_eq!(*SHARED,3);
    assert_eq!(CALLS.load(Ordering::Relaxed),3);
}
`);
});
test("Drop locale per valore inizializzato e cattura mai forzata", () => {
  run(`
use std::{cell::Cell,sync::{OnceLock,LazyLock}};
struct Tracked<'a>(&'a Cell<u32>);
impl Drop for Tracked<'_>{fn drop(&mut self){self.0.set(self.0.get()+1);}}
fn main(){
    let drops=Cell::new(0);
    let once=OnceLock::new();
    assert!(once.set(Tracked(&drops)).is_ok());
    drop(once);
    assert_eq!(drops.get(),1);
    let capture=Tracked(&drops);
    let lazy=LazyLock::new(move||capture);
    drop(lazy);
    assert_eq!(drops.get(),2);
    let lazy=LazyLock::new(||Tracked(&drops));
    LazyLock::force(&lazy);
    drop(lazy);
    assert_eq!(drops.get(),3);
}
`);
});
test("static lazy inizializzato non esegue Drop alla fine del processo", () => {
  assert.equal(
    run(`
use std::sync::LazyLock;
struct Tracked;
impl Drop for Tracked {fn drop(&mut self){println!("unexpected drop");}}
static VALUE:LazyLock<Tracked>=LazyLock::new(||Tracked);
fn main(){LazyLock::force(&VALUE);}
`),
    "",
  );
});
