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
const notePath = "Programmazione/Rust/Pagine/Channel async.md";
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
const prefix = "appunti-rust-channels-";
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
    process.env.RUST_CHANNEL_TEST_CARGO_HOME || path.join(root, "cargo-home"),
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
        process.env.RUST_CHANNEL_TEST_FETCH === "1" ? "false" : "true",
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
  const result = launch(executable, [], dir);
  assert.equal(result.stdout, "");
  if (options.panic) {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /panicked/);
    assert.match(result.stderr, options.panic);
  } else {
    ok(result);
    assert.equal(result.stderr, "");
  }
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

const queue = "Coda bounded con produttore atteso";
const full = "Coda piena e recupero del valore";
const close = "Chiusura con permit gia acquisito";
const request = "Richiesta e risposta con oneshot";
const broadcast = "Broadcast e ricevitore in ritardo";
const watch = "Watch per lo stato corrente";
const reserve = "Cancellare l'attesa senza perdere il payload";
const clone = "Il receiver mpsc non e clonabile";
const once = "Il sender oneshot si usa una volta";

test("baseline, manifest e nove programmi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 10);
  assert.match(source("Cargo.toml"), /version = "=1\.54\.1"/);
  prepare();
});

test("frontmatter invariato, struttura e collegamenti", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Channel async",
  ]);
  const h2 = headings.filter((n) => n.depth === 2).map(text);
  assert.deepEqual(h2, [
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
  ]);
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(
    note.source,
    /\[\[Programmazione\/Rust\/Pagine\/Graceful shutdown\|Graceful shutdown\]\]/,
  );
});

for (const name of [queue, full, close, request, broadcast, watch, reserve])
  test("programma originale: " + name, () => run(source(name)));

test("mpsc Receiver non clonabile: E0599", () =>
  run(source(clone), { error: "E0599" }));
test("oneshot Sender gia consumato: E0382", () =>
  run(source(once), { error: "E0382" }));

test("mpsc bounded zero non e rendezvous", () => {
  run(plain("let _ = tokio::sync::mpsc::channel::<u8>(0);"), {
    panic: /buffer > 0/,
  });
});

test("try_send distingue Closed da Full e restituisce il payload", () => {
  run(
    plain(String.raw`
    use tokio::sync::mpsc::{self, error::TrySendError};
    let (tx, rx) = mpsc::channel(1);
    drop(rx);
    assert!(matches!(tx.try_send(String::from("kept")),
        Err(TrySendError::Closed(value)) if value == "kept"));
  `),
  );
});

test("sender clone mantiene aperta la coda vuota", () => {
  run(
    plain(String.raw`
    use tokio::sync::mpsc::{self, error::TryRecvError};
    let (tx, mut rx) = mpsc::channel::<u8>(1);
    let other = tx.clone();
    drop(tx);
    assert_eq!(rx.try_recv(), Err(TryRecvError::Empty));
    drop(other);
    assert_eq!(rx.recv().await, None);
    assert_eq!(rx.try_recv(), Err(TryRecvError::Disconnected));
  `),
  );
});

test("send pending su coda piena, recv libera il posto", () => {
  run(
    plain(String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    tx.send(1).await.unwrap();
    let mut send = pin!(tx.send(2));
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(send.as_mut().poll(&mut cx), Poll::Pending));
    }
    assert_eq!(rx.recv().await, Some(1));
    send.await.unwrap();
    assert_eq!(rx.recv().await, Some(2));
  `),
  );
});

test("close con permit vuoto resta Pending fino al rilascio", () => {
  run(
    plain(String.raw`
    use std::task::{Context, Poll, Waker};
    let (tx, mut rx) = tokio::sync::mpsc::channel::<u8>(1);
    let permit = tx.reserve().await.unwrap();
    rx.close();
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(rx.poll_recv(&mut cx), Poll::Pending));
    }
    drop(permit);
    assert_eq!(rx.recv().await, None);
  `),
  );
});

test("eliminare il receiver elimina i payload accodati", () => {
  run(
    plain(String.raw`
    use std::sync::{Arc, atomic::{AtomicUsize, Ordering}};
    struct Item(Arc<AtomicUsize>);
    impl Drop for Item {
        fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); }
    }
    let count = Arc::new(AtomicUsize::new(0));
    let (tx, rx) = tokio::sync::mpsc::channel(1);
    assert!(tx.send(Item(count.clone())).await.is_ok());
    assert_eq!(count.load(Ordering::SeqCst), 0);
    drop(rx);
    assert_eq!(count.load(Ordering::SeqCst), 1);
    tx.closed().await;
  `),
  );
});

test("mpsc unbounded send sincrono e drain dopo drop", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
    for i in 0..100 { tx.send(i).unwrap(); }
    drop(tx);
    for i in 0..100 { assert_eq!(rx.recv().await, Some(i)); }
    assert_eq!(rx.recv().await, None);
  `),
  );
});

test("blocking_send non si usa dentro task async", () => {
  run(
    plain(String.raw`
    let (tx, _rx) = tokio::sync::mpsc::channel(1);
    let _ = tx.blocking_send(1);
  `),
    { panic: /Cannot block/ },
  );
});

test("ponte sync con thread dedicato e blocking_send", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    let sender = std::thread::spawn(move || {
        tx.blocking_send(5).unwrap();
        tx.blocking_send(8).unwrap();
    });
    assert_eq!(rx.recv().await, Some(5));
    assert_eq!(rx.recv().await, Some(8));
    assert_eq!(rx.recv().await, None);
    sender.join().unwrap();
  `),
  );
});

test("oneshot non inviato distingue abbandono da errore applicativo", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::oneshot::channel::<Result<u32, &'static str>>();
    drop(tx);
    assert!(rx.await.is_err());
    let (tx, rx) = tokio::sync::oneshot::channel();
    tx.send(Err::<u32, _>("invalid")).unwrap();
    assert_eq!(rx.await.unwrap(), Err("invalid"));
  `),
  );
});

test("oneshot restituisce direttamente il payload senza receiver", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::oneshot::channel();
    drop(rx);
    assert_eq!(tx.send(String::from("kept")), Err(String::from("kept")));
  `),
  );
});

test("oneshot send funziona senza runtime", () => {
  run(String.raw`
    fn main() {
        let (tx, mut rx) = tokio::sync::oneshot::channel();
        tx.send(7).unwrap();
        assert_eq!(rx.try_recv(), Ok(7));
    }
  `);
});

test("worker drena anche i comandi accodati dopo Shutdown", () => {
  run(
    main(
      request,
      String.raw`
    let (tx, rx) = mpsc::channel(4);
    tx.send(Command::Shutdown).await.unwrap();
    let (reply, response) = oneshot::channel();
    tx.send(Command::Count { input: "abc".into(), reply }).await.unwrap();
    assert_eq!(worker(rx).await, 1);
    assert_eq!(response.await.unwrap(), Ok(3));
    assert!(tx.is_closed());
  `,
    ),
  );
});

test("worker completa il job anche se il client abbandona la risposta", () => {
  run(
    main(
      request,
      String.raw`
    let (tx, rx) = mpsc::channel(1);
    let (reply, response) = oneshot::channel();
    drop(response);
    tx.send(Command::Count { input: "abc".into(), reply }).await.unwrap();
    drop(tx);
    assert_eq!(worker(rx).await, 1);
  `,
    ),
  );
});

test("worker conta caratteri Unicode, non byte", () => {
  run(
    main(
      request,
      String.raw`
    let (tx, rx) = mpsc::channel(1);
    let (reply, response) = oneshot::channel();
    tx.send(Command::Count { input: "\u{e8}\u{1f680}".into(), reply }).await.unwrap();
    drop(tx);
    assert_eq!(worker(rx).await, 1);
    assert_eq!(response.await.unwrap(), Ok(2));
  `,
    ),
  );
});

test("broadcast subscribe non riproduce il passato e puo riaprire gli invii", () => {
  run(
    plain(String.raw`
    use tokio::sync::broadcast::{self, error::TryRecvError};
    let (tx, mut early) = broadcast::channel(2);
    tx.send(1).unwrap();
    let mut late = tx.subscribe();
    assert_eq!(late.try_recv(), Err(TryRecvError::Empty));
    assert_eq!(early.recv().await.unwrap(), 1);
    drop(early);
    drop(late);
    assert_eq!(tx.send(2).unwrap_err().0, 2);
    let mut newest = tx.subscribe();
    tx.send(3).unwrap();
    assert_eq!(newest.recv().await.unwrap(), 3);
  `),
  );
});

test("broadcast richiede Clone per i valori", () => {
  run(
    String.raw`
    struct Item;
    fn main() { let _ = tokio::sync::broadcast::channel::<Item>(1); }
  `,
    { error: "E0277" },
  );
});

test("watch initial e subscribe considerano visto il valore corrente", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::watch::channel(1);
    assert_eq!(rx.has_changed().unwrap(), false);
    tx.send(2).unwrap();
    let new = tx.subscribe();
    assert_eq!(*new.borrow(), 2);
    assert_eq!(new.has_changed().unwrap(), false);
    assert_eq!(rx.has_changed().unwrap(), true);
  `),
  );
});

test("watch borrow non marca visto, borrow_and_update si", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::watch::channel(1);
    tx.send(2).unwrap();
    assert_eq!(*rx.borrow(), 2);
    assert_eq!(rx.has_changed().unwrap(), true);
    assert_eq!(*rx.borrow_and_update(), 2);
    assert_eq!(rx.has_changed().unwrap(), false);
  `),
  );
});

test("watch changed legge ultimo aggiornamento dopo close, has_changed fallisce", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::watch::channel(1);
    tx.send(2).unwrap();
    drop(tx);
    assert!(rx.has_changed().is_err());
    assert!(rx.changed().await.is_ok());
    assert_eq!(*rx.borrow(), 2);
    assert!(rx.changed().await.is_err());
  `),
  );
});

test("watch invio senza observer contro send_replace persistente", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::watch::channel(1);
    drop(rx);
    assert_eq!(tx.send(2).unwrap_err().0, 2);
    assert_eq!(*tx.borrow(), 1);
    assert_eq!(tx.send_replace(3), 1);
    let rx = tx.subscribe();
    assert_eq!(*rx.borrow(), 3);
    assert_eq!(rx.has_changed().unwrap(), false);
  `),
  );
});

test("watch send notifica anche valore uguale, send_if_modified decide", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::watch::channel(1);
    tx.send(1).unwrap();
    assert_eq!(rx.has_changed().unwrap(), true);
    rx.borrow_and_update();
    assert!(!tx.send_if_modified(|_| false));
    assert_eq!(rx.has_changed().unwrap(), false);
    assert!(tx.send_if_modified(|v| { *v = 2; true }));
    assert_eq!(rx.has_changed().unwrap(), true);
  `),
  );
});

test("watch aggiornamento fra changed e lettura non resta non visto", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::watch::channel(0);
    tx.send(1).unwrap();
    rx.changed().await.unwrap();
    tx.send(2).unwrap();
    assert_eq!(*rx.borrow(), 2);
    assert_eq!(rx.has_changed().unwrap(), true);
    assert_eq!(*rx.borrow_and_update(), 2);
    assert_eq!(rx.has_changed().unwrap(), false);
  `),
  );
});

test("watch guard attraverso await impedisce spawn Send", () => {
  run(
    plain(String.raw`
    let (_tx, rx) = tokio::sync::watch::channel(1);
    tokio::spawn(async move {
        let guard = rx.borrow();
        tokio::task::yield_now().await;
        assert_eq!(*guard, 1);
    }).await.unwrap();
  `),
    { errorText: /cannot be sent between threads safely/ },
  );
});

test("reserve helper conserva valore su receiver chiuso", () => {
  run(
    main(
      reserve,
      String.raw`
    let (tx, rx) = mpsc::channel(1);
    drop(rx);
    let (_signal, stop) = oneshot::channel();
    assert_eq!(enqueue_or_return(&tx, "kept".into(), stop).await,
        Err(String::from("kept")));
  `,
    ),
  );
});

test("reserve helper privilegia stop anche se coda libera", () => {
  run(
    main(
      reserve,
      String.raw`
    let (tx, mut rx) = mpsc::channel(1);
    let (signal, stop) = oneshot::channel();
    signal.send(()).unwrap();
    assert_eq!(enqueue_or_return(&tx, "kept".into(), stop).await,
        Err(String::from("kept")));
    assert_eq!(rx.try_recv(), Err(mpsc::error::TryRecvError::Empty));
  `,
    ),
  );
});

test("reserve helper interpreta anche drop del segnale come stop", () => {
  run(
    main(
      reserve,
      String.raw`
    let (tx, _rx) = mpsc::channel(1);
    let (signal, stop) = oneshot::channel();
    drop(signal);
    assert_eq!(enqueue_or_return(&tx, "kept".into(), stop).await,
        Err(String::from("kept")));
  `,
    ),
  );
});

test("cancellare send elimina la cattura ma non modifica la coda", () => {
  run(
    plain(String.raw`
    use std::{future::Future, sync::{Arc, atomic::{AtomicUsize, Ordering}},
        task::{Context, Poll, Waker}};
    struct Item(Arc<AtomicUsize>);
    impl Drop for Item {
        fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); }
    }
    let count = Arc::new(AtomicUsize::new(0));
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    assert!(tx.send(Item(count.clone())).await.is_ok());
    let mut pending = Box::pin(tx.send(Item(count.clone())));
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(pending.as_mut().poll(&mut cx), Poll::Pending));
    }
    drop(pending);
    assert_eq!(count.load(Ordering::SeqCst), 1);
    drop(rx.recv().await);
    assert_eq!(count.load(Ordering::SeqCst), 2);
  `),
  );
});

test("cancellare recv in select non consuma il valore", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    tx.send(9).await.unwrap();
    tokio::select! {
        biased;
        _ = async {} => {}
        _ = rx.recv() => panic!("ramo non scelto"),
    }
    assert_eq!(rx.recv().await, Some(9));
  `),
  );
});

test("Rc locale consentito, spawn richiede Send", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    tx.send(std::rc::Rc::new(4)).await.unwrap();
    assert_eq!(*rx.recv().await.unwrap(), 4);
  `),
  );
  run(
    plain(String.raw`
    let (tx, _rx) = tokio::sync::mpsc::channel(1);
    let item = std::rc::Rc::new(4);
    tokio::spawn(async move { let _ = tx.send(item).await; }).await.unwrap();
  `),
    { errorText: /cannot be sent between threads safely/ },
  );
});
