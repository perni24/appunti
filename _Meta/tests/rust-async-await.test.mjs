import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const notePath = "Programmazione/Rust/Pagine/Async Await.md";
const note = parseNote(notePath);
const original = fs.readFileSync(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const n of note.tree.children) {
  if (n.type === "heading") heading = text(n);
  if (n.type === "code") {
    assert.ok(["rust", "toml"].includes(n.lang));
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, n.value);
  }
}
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-tokio-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  assert.deepEqual(fs.readFileSync(notePath), original);
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUST_MIN_STACK$|TOKIO_)/i.test(
      key,
    )
  )
    delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: tool("rustdoc"),
  RUST_BACKTRACE: "0",
  RUST_LIB_BACKTRACE: "0",
  CARGO_HOME:
    process.env.RUST_ASYNC_TEST_CARGO_HOME || path.join(root, "cargo-home"),
  CARGO_TARGET_DIR: path.join(root, "target"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
});
for (let dir = root; ; dir = path.dirname(dir)) {
  for (const name of ["config", "config.toml"])
    assert.ok(
      !fs.existsSync(path.join(dir, ".cargo", name)),
      "Unexpected Cargo config: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
for (const name of ["config", "config.toml"])
  assert.ok(
    !fs.existsSync(path.join(env.CARGO_HOME, name)),
    "Unexpected cache configuration",
  );
let sequence = 0,
  dependencyDir,
  tokioLibrary;
function launch(executable, args, cwd = root, overrides = {}, timeout = 60000) {
  const r = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    timeout,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}
function ok(r) {
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
}
function source(name) {
  assert.ok(blocks.has(name), name);
  return blocks.get(name);
}
let setupError;
function prepare() {
  if (tokioLibrary) return;
  if (setupError) throw setupError;
  try {
    prepareDependencies();
  } catch (error) {
    setupError = error;
    throw error;
  }
}
function prepareDependencies() {
  const project = path.join(root, "dependencies");
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  fs.writeFileSync(path.join(project, "Cargo.toml"), source("Cargo.toml"));
  fs.writeFileSync(path.join(project, "src/main.rs"), "fn main() {}\n");
  ok(
    launch(tool("cargo"), ["fetch"], project, {
      CARGO_NET_OFFLINE:
        process.env.RUST_ASYNC_TEST_FETCH === "1" ? "false" : "true",
      CARGO_NET_RETRY: "0",
      CARGO_HTTP_TIMEOUT: "30",
    }),
  );
  const metadata = JSON.parse(
    ok(
      launch(
        tool("cargo"),
        ["metadata", "--format-version=1", "--locked", "--offline"],
        project,
      ),
    ).stdout,
  );
  const versions = metadata.packages
    .filter((p) => p.source)
    .map((p) => `${p.name}@${p.version}`)
    .sort();
  assert.ok(versions.includes("tokio@1.54.1"));
  console.log("Dependency baseline: " + versions.join(", "));
  ok(
    launch(
      tool("cargo"),
      ["build", "--locked", "--offline"],
      project,
      {},
      180000,
    ),
  );
  dependencyDir = path.join(env.CARGO_TARGET_DIR, "debug", "deps");
  const libraries = fs
    .readdirSync(dependencyDir)
    .filter((n) => /^libtokio-[\da-f]+\.rlib$/.test(n));
  assert.equal(libraries.length, 1);
  tokioLibrary = path.join(dependencyDir, libraries[0]);
}
function run(code, options = {}) {
  prepare();
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const executable = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const compiled = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name=note_example",
      "--error-format=json",
      "--extern",
      "tokio=" + tokioLibrary,
      "-L",
      "dependency=" + dependencyDir,
      ...(options.flags || []),
      "main.rs",
      "-o",
      executable,
    ],
    dir,
  );
  if (options.error || options.errorText) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    if (options.error)
      assert.ok(
        diagnostics.some(
          (d) => d.level === "error" && d.code?.code === options.error,
        ),
        compiled.stderr,
      );
    if (options.errorText) assert.match(compiled.stderr, options.errorText);
    return;
  }
  ok(compiled);
  const result = ok(launch(executable, [], dir));
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
}
function main(name, body) {
  const code = source(name);
  const start = code.indexOf("#[tokio::main");
  assert.ok(start >= 0);
  return (
    code.slice(0, start) +
    '#[tokio::main(flavor = "current_thread")]\nasync fn main() {\n' +
    body +
    "\n}"
  );
}
function plain(body) {
  return (
    '#[tokio::main(flavor = "current_thread")]\nasync fn main() {\n' +
    body +
    "\n}"
  );
}
const lazy = "Creazione lazy e primo polling";
const ready = "Await pronto non significa yield";
const captures = "Prestiti, move e Result";
const errors = "Ricevere un risultato e propagare gli errori";
const join = "Attese sequenziali e join";
const blocking = "Separare lavoro bloccante";

test("baseline reale, manifest e otto programmi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 9);
  assert.match(source("Cargo.toml"), /version = "=1\.54\.1"/);
  prepare();
});
test("YAML invariato, template e gerarchia", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Async/Await",
  ]);
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
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
});
for (const name of [lazy, ready, captures, errors, join, blocking])
  test("programma originale: " + name, () => run(source(name)));
test("await fuori da async: E0728", () =>
  run(source("Await fuori da un contesto async"), { error: "E0728" }));
test("riferimento catturato da spawn resta non static: E0597", () =>
  run(source("Move di un riferimento non lo rende static"), {
    error: "E0597",
  }));

test("argomenti valutati subito, corpo differito", () =>
  run(
    plain(`
    use std::cell::Cell;
    async fn work(value: u32, body: &Cell<bool>) -> u32 { body.set(true); value }
    let arguments = Cell::new(0);
    let body = Cell::new(false);
    let future = work({ arguments.set(1); 7 }, &body);
    assert_eq!(arguments.get(), 1);
    assert!(!body.get());
    assert_eq!(future.await, 7);
    assert!(body.get());
`),
  ));
test("drop di future mai avviata distrugge argomenti senza eseguire il corpo", () =>
  run(
    plain(`
    use std::cell::Cell;
    struct Guard<'a>(&'a Cell<bool>);
    impl Drop for Guard<'_> { fn drop(&mut self) { self.0.set(true); } }
    async fn work(_guard: Guard<'_>, body: &Cell<bool>) { body.set(true); }
    let dropped = Cell::new(false);
    let body = Cell::new(false);
    let future = work(Guard(&dropped), &body);
    assert!(!dropped.get());
    drop(future);
    assert!(dropped.get());
    assert!(!body.get());
`),
  ));
test("cento await pronti non cedono alla task nel current-thread", () => {
  const code = source(ready).replace(
    "let answer = std::future::ready(42).await;",
    "for _ in 0..100 { assert_eq!(std::future::ready(1).await, 1); }\n    let answer = std::future::ready(42).await;",
  );
  run(code, { flags: ["-O"] });
});
test("Pending e wake: due poll reali guidati da Tokio", () =>
  run(
    plain(`
    use std::cell::Cell;
    use std::task::Poll;
    let polls = Cell::new(0);
    let finished = Cell::new(false);
    let work = async {
        let value = std::future::poll_fn(|cx| {
            polls.set(polls.get() + 1);
            if polls.get() == 1 {
                cx.waker().wake_by_ref();
                Poll::Pending
            } else { Poll::Ready(7) }
        }).await;
        finished.set(true);
        value
    };
    assert_eq!(work.await, 7);
    assert_eq!(polls.get(), 2);
    assert!(finished.get());
`),
  ));
test("mutation prima di await rifiutata per prestito vivo", () =>
  run(
    plain(`
    let mut name = String::from("Rust");
    let future = async { name.len() };
    name.push('!');
    assert_eq!(future.await, 5);
`),
    { error: "E0502" },
  ));
test("async move trasferisce la String prima del polling", () =>
  run(
    plain(`
    let name = String::from("Rust");
    let future = async move { name.len() };
    drop(name);
    assert_eq!(future.await, 4);
`),
    { error: "E0382" },
  ));
test("await per valore consuma la future", () =>
  run(
    plain(`
    let future = async { 7 };
    assert_eq!(future.await, 7);
    assert_eq!(future.await, 7);
`),
    { error: "E0382" },
  ));
test("question mark esce dal blocco async, non dal suo chiamante", () =>
  run(
    plain(`
    let mut after_error = false;
    let result = async {
        let number = "bad".parse::<u32>()?;
        after_error = true;
        Ok::<_, std::num::ParseIntError>(number)
    }.await;
    assert!(result.is_err());
    assert!(!after_error);
    let reached_outer = true;
    assert!(reached_outer);
`),
  ));
test("handler: vuoto Unicode ed errore applicativo", () =>
  run(
    main(
      errors,
      String.raw`
    for name in ["", "Luca", "\u{00c9}va"] {
        let (tx, rx) = oneshot::channel();
        tx.send(Ok(name.to_owned())).unwrap();
        assert_eq!(handler(rx).await, Ok(format!("Hello, {name}")));
    }
    let (tx, rx) = oneshot::channel();
    tx.send(Err("user not found")).unwrap();
    assert_eq!(handler(rx).await, Err("user not found"));
`,
    ),
  ));
test("handler: sender perso e receiver perso sono errori diversi", () =>
  run(
    main(
      errors,
      `
    let (tx, rx) = oneshot::channel::<UserResult>();
    drop(tx);
    assert_eq!(handler(rx).await, Err("producer stopped"));
    let (tx, rx) = oneshot::channel::<UserResult>();
    drop(rx);
    assert_eq!(tx.send(Ok("unused".into())), Err(Ok("unused".into())));
`,
    ),
  ));
test("panic del produttore: errore del canale e JoinError osservabili", () =>
  run(
    main(
      errors,
      `
    std::panic::set_hook(Box::new(|_| {}));
    let (tx, rx) = oneshot::channel::<UserResult>();
    let worker = tokio::spawn(async move {
        drop(tx);
        panic!("producer failed");
    });
    assert_eq!(handler(rx).await, Err("producer stopped"));
    assert!(worker.await.unwrap_err().is_panic());
`,
    ),
  ));
test("JoinHandle con output Result mantiene i due livelli", () =>
  run(
    plain(`
    let handle = tokio::spawn(async { Err::<u32, _>("application") });
    assert_eq!(handle.await.unwrap(), Err("application"));
    let handle = tokio::spawn(async { Ok::<u32, &str>(7) });
    assert_eq!(handle.await.unwrap().unwrap(), 7);
`),
  ));
test("join accetta prestiti e Rc, resta nella task corrente", () =>
  run(
    plain(`
    use std::rc::Rc;
    let value = Rc::new(String::from("Rust"));
    let id = std::thread::current().id();
    let a = async { assert_eq!(std::thread::current().id(), id); value.len() };
    let b = async { assert_eq!(std::thread::current().id(), id); value.to_uppercase() };
    let (length, label) = tokio::join!(a, b);
    assert_eq!((length, label), (4, String::from("RUST")));
`),
  ));
test("join attende tutti anche se un ramo restituisce Err", () =>
  run(
    plain(`
    let mut completed = false;
    let (error, ()) = tokio::join!(
        async { Err::<(), _>("failed") },
        async { tokio::task::yield_now().await; completed = true; },
    );
    assert_eq!(error, Err("failed"));
    assert!(completed);
`),
  ));
test("task spawnata Rc non Send rifiutata anche sul current-thread", () =>
  run(
    plain(`
    let value = std::rc::Rc::new(7);
    tokio::spawn(async move { *value }).await.unwrap();
`),
    { errorText: /cannot be sent between threads safely/ },
  ));
test("output Rc rifiutato da spawn", () =>
  run(
    plain(`
    tokio::spawn(async { std::rc::Rc::new(7) }).await.unwrap();
`),
    { error: "E0277" },
  ));
test("LocalSet esegue realmente una future non Send", () =>
  run(
    plain(`
    let value = std::rc::Rc::new(7);
    let local = tokio::task::LocalSet::new();
    let result = local.run_until(async move {
        tokio::task::spawn_local(async move {
            tokio::task::yield_now().await;
            *value
        }).await.unwrap()
    }).await;
    assert_eq!(result, 7);
`),
  ));
test("spawn con String posseduta risolve il prestito non static", () =>
  run(
    plain(`
    let name = String::from("Rust");
    let handle = tokio::spawn(async move { name.len() });
    assert_eq!(handle.await.unwrap(), 4);
`),
  ));
test("drop JoinHandle distacca ma la task completa tramite oneshot", () =>
  run(
    plain(`
    let (tx, rx) = tokio::sync::oneshot::channel();
    let handle = tokio::spawn(async move { tx.send(7).unwrap(); });
    drop(handle);
    assert_eq!(rx.await.unwrap(), 7);
`),
  ));
test("abort di task sospesa distrugge lo stato, senza rollback", () =>
  run(
    plain(`
    use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
    struct Guard(Arc<AtomicBool>);
    impl Drop for Guard { fn drop(&mut self) { self.0.store(true, Ordering::Relaxed); } }
    let dropped = Arc::new(AtomicBool::new(false));
    let worker_flag = Arc::clone(&dropped);
    let (started_tx, started_rx) = tokio::sync::oneshot::channel();
    let handle = tokio::spawn(async move {
        let _guard = Guard(worker_flag);
        started_tx.send(()).unwrap();
        std::future::pending::<()>().await;
    });
    started_rx.await.unwrap();
    handle.abort();
    assert!(handle.await.unwrap_err().is_cancelled());
    assert!(dropped.load(Ordering::Relaxed));
`),
  ));
test("drop di future posseduta sospesa preserva gli effetti precedenti", () =>
  run(
    plain(`
    use std::cell::Cell;
    let changed = Cell::new(false);
    let mut work = Box::pin(async {
        changed.set(true);
        std::future::pending::<()>().await;
    });
    tokio::select! {
        biased;
        _ = &mut work => panic!("pending future completed"),
        _ = std::future::ready(()) => {}
    }
    drop(work);
    assert!(changed.get());
`),
  ));
test("spawn_blocking usa un thread distinto e mantiene l'ownership", () =>
  run(
    plain(`
    let caller = std::thread::current().id();
    let values = vec![1_u32, 2, 3];
    let total = tokio::task::spawn_blocking(move || {
        assert_ne!(std::thread::current().id(), caller);
        values.into_iter().map(u64::from).sum::<u64>()
    }).await.unwrap();
    assert_eq!(total, 6);
`),
  ));
test("abort non ferma un blocking job gia avviato", () =>
  run(
    plain(`
    let (started_tx, started_rx) = tokio::sync::oneshot::channel();
    let (release_tx, release_rx) = std::sync::mpsc::channel();
    let handle = tokio::task::spawn_blocking(move || {
        started_tx.send(()).unwrap();
        release_rx.recv_timeout(std::time::Duration::from_secs(5)).unwrap();
        7
    });
    started_rx.await.unwrap();
    handle.abort();
    release_tx.send(()).unwrap();
    assert_eq!(handle.await.unwrap(), 7);
`),
  ));
test("spawn_blocking restituisce una future senza eseguirla se la closure e async", () =>
  run(
    plain(`
    use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
    let ran = Arc::new(AtomicBool::new(false));
    let copy = Arc::clone(&ran);
    let future = tokio::task::spawn_blocking(move || async move {
        copy.store(true, Ordering::Relaxed);
        7
    }).await.unwrap();
    assert!(!ran.load(Ordering::Relaxed));
    assert_eq!(future.await, 7);
    assert!(ran.load(Ordering::Relaxed));
`),
  ));
test("timer configurato e timeout su future non completabile", () =>
  run(
    plain(`
    use std::time::Duration;
    tokio::time::sleep(Duration::from_millis(1)).await;
    assert!(tokio::time::timeout(Duration::from_millis(1), std::future::pending::<()>()).await.is_err());
`),
  ));
test("spawn senza runtime fallisce in modo osservabile", () =>
  run(`
    fn main() {
        std::panic::set_hook(Box::new(|_| {}));
        assert!(std::panic::catch_unwind(|| tokio::spawn(async {})).is_err());
    }
`));
