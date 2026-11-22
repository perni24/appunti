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
const notePath = "Programmazione/Rust/Pagine/Graceful shutdown.md";
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
const prefix = "appunti-rust-shutdown-";
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
    process.env.RUST_SHUTDOWN_TEST_CARGO_HOME || path.join(root, "cargo-home"),
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
// Gli strumenti GNU aggiuntivi valgono solo per i processi di questa suite.
if (process.env.RUST_SHUTDOWN_TEST_TOOLS_BIN) {
  const bin = path.resolve(process.env.RUST_SHUTDOWN_TEST_TOOLS_BIN);
  for (const name of ["dlltool.exe", "as.exe"])
    assert.ok(fs.existsSync(path.join(bin, name)), "Missing tool: " + name);
  const key =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  env[key] = bin + path.delimiter + (env[key] || "");
}
let sequence = 0,
  dependencyDir,
  tokioLibrary,
  utilityLibrary;
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
        process.env.RUST_SHUTDOWN_TEST_FETCH === "1" ? "false" : "true",
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
  assert.ok(versions.includes("tokio-util@0.7.20"));
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
  const utilities = fs
    .readdirSync(dependencyDir)
    .filter((n) => /^libtokio_util-[a-f0-9]+[.]rlib$/.test(n));
  assert.equal(utilities.length, 1);
  utilityLibrary = path.join(dependencyDir, utilities[0]);
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
      "--extern",
      "tokio_util=" + utilityLibrary,
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

const watch = "Watch: stato iniziale e canale chiuso";
const drain = "Chiudere l'ingresso e drenare il lavoro ammesso";
const tracker = "Notifica condivisa e cleanup tracciato";
const tokens = "Token figli e ambito della cancellazione";
const deadline = "Scadenza unica e raccolta degli esiti con JoinSet";
const signal = "Trigger interno oppure Ctrl+C";
const moved = "Perdere l'handle nel timeout";

test("baseline, manifest e sette programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
  prepare();
});

test("frontmatter invariato e template completo", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Graceful shutdown",
  ]);
  assert.deepEqual(headings.filter((n) => n.depth === 2).map(text), [
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
});

for (const name of [watch, drain, tracker, tokens, deadline, signal])
  test("programma originale: " + name, () => run(source(name)));
test("handle trasferito al timeout: E0382", () =>
  run(source(moved), { error: "E0382" }));

test("watch false resta Pending finche arriva true", () => {
  run(
    main(
      watch,
      String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let (tx, rx) = watch::channel(false);
    let mut stop = pin!(wait_for_stop(rx));
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(stop.as_mut().poll(&mut cx), Poll::Pending));
    }
    tx.send(true).unwrap();
    assert_eq!(stop.await, StopReason::Requested);
  `,
    ),
  );
});

test("watch true non visto dopo chiusura resta richiesta", () => {
  run(
    main(
      watch,
      String.raw`
    let (tx, rx) = watch::channel(false);
    tx.send(true).unwrap();
    drop(tx);
    assert_eq!(wait_for_stop(rx).await, StopReason::Requested);
  `,
    ),
  );
});

test("nuovo subscriber dopo richiesta true non perde lo stop", () => {
  run(
    main(
      watch,
      String.raw`
    let (tx, _rx) = watch::channel(false);
    tx.send(true).unwrap();
    assert_eq!(wait_for_stop(tx.subscribe()).await, StopReason::Requested);
  `,
    ),
  );
});

test("resettare false puo nascondere la richiesta true", () => {
  run(
    main(
      watch,
      String.raw`
    let (tx, rx) = watch::channel(false);
    tx.send(true).unwrap();
    tx.send(false).unwrap();
    drop(tx);
    assert_eq!(wait_for_stop(rx).await, StopReason::SenderGone);
  `,
    ),
  );
});

test("watch chiuso produce Err pronto ripetutamente, senza loop infinito nel test", () => {
  run(
    plain(String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let (tx, mut rx) = tokio::sync::watch::channel(false);
    drop(tx);
    for _ in 0..4 {
        let mut changed = pin!(rx.changed());
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(changed.as_mut().poll(&mut cx), Poll::Ready(Err(_))));
    }
  `),
  );
});

test("worker termina su coda vuota senza sender", () => {
  run(
    main(
      drain,
      String.raw`
    let (tx, rx) = mpsc::channel(1);
    drop(tx);
    assert!(worker(rx, CancellationToken::new()).await.is_empty());
  `,
    ),
  );
});

test("worker normale conserva ordine senza token cancellato", () => {
  run(
    main(
      drain,
      String.raw`
    let (tx, rx) = mpsc::channel(3);
    for value in [3, 2, 1] { tx.send(value).await.unwrap(); }
    drop(tx);
    assert_eq!(worker(rx, CancellationToken::new()).await, [3, 2, 1]);
  `,
    ),
  );
});

test("worker fermato attende ancora un permit precedente", () => {
  run(
    main(
      drain,
      String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let (tx, rx) = mpsc::channel(1);
    let permit = tx.reserve().await.unwrap();
    let stop = CancellationToken::new();
    stop.cancel();
    let mut work = pin!(worker(rx, stop));
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(work.as_mut().poll(&mut cx), Poll::Pending));
    }
    assert!(tx.is_closed());
    permit.send(8);
    assert_eq!(work.await, [8]);
  `,
    ),
  );
});

test("stop durante process non scarta job corrente e buffer", () => {
  let code = main(
    drain,
    String.raw`
    let stop = CancellationToken::new();
    STOP.set(stop.clone()).unwrap();
    let (tx, rx) = mpsc::channel(2);
    tx.send(5).await.unwrap();
    tx.send(6).await.unwrap();
    assert_eq!(worker(rx, stop).await, [5, 6]);
    assert!(tx.is_closed());
  `,
  );
  const needle = "    tokio::task::yield_now().await;";
  assert.equal(code.split(needle).length, 2);
  code = code.replace(needle, "    STOP.get().unwrap().cancel();\n" + needle);
  run(
    "static STOP: std::sync::OnceLock<tokio_util::sync::CancellationToken> = std::sync::OnceLock::new();\n" +
      code,
  );
});

test("drop di un token non cancella clone o figlio", () => {
  run(
    plain(String.raw`
    use tokio_util::sync::CancellationToken;
    let root = CancellationToken::new();
    let clone = root.clone();
    let child = root.child_token();
    drop(root);
    assert!(!clone.is_cancelled());
    assert!(!child.is_cancelled());
    clone.cancel();
    child.cancelled().await;
  `),
  );
});

test("cancellazione anticipata e ripetuta e osservata da nuovi waiter", () => {
  run(
    plain(String.raw`
    use tokio_util::sync::CancellationToken;
    let stop = CancellationToken::new();
    stop.cancel();
    stop.cancel();
    stop.cancelled().await;
    stop.child_token().cancelled().await;
  `),
  );
});

test("cancellare un waiter non cancella il token", () => {
  run(
    plain(String.raw`
    use tokio_util::sync::CancellationToken;
    let stop = CancellationToken::new();
    tokio::select! {
        biased;
        _ = async {} => {}
        _ = stop.cancelled() => panic!("non cancellato"),
    }
    assert!(!stop.is_cancelled());
    stop.cancel();
    stop.cancelled().await;
  `),
  );
});

test("tracker vuoto ma aperto non termina wait", () => {
  run(
    plain(String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let tracker = tokio_util::task::TaskTracker::new();
    let mut wait = pin!(tracker.wait());
    {
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(wait.as_mut().poll(&mut cx), Poll::Pending));
    }
    assert!(tracker.close());
    assert!(!tracker.close());
    wait.await;
  `),
  );
});

test("tracker chiuso permette nuovi spawn e aspetta task bloccata", () => {
  run(
    plain(String.raw`
    use std::{future::Future, pin::pin, task::{Context, Poll, Waker}};
    let tracker = tokio_util::task::TaskTracker::new();
    tracker.close();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let handle = tracker.spawn(async move { rx.await.unwrap() });
    {
        let mut wait = pin!(tracker.wait());
        let mut cx = Context::from_waker(Waker::noop());
        assert!(matches!(wait.as_mut().poll(&mut cx), Poll::Pending));
    }
    tx.send(12).unwrap();
    tracker.wait().await;
    assert_eq!(handle.await.unwrap(), 12);
  `),
  );
});

test("tracker clone condivide close e reopen", () => {
  run(
    plain(String.raw`
    let tracker = tokio_util::task::TaskTracker::new();
    let other = tracker.clone();
    other.close();
    assert!(tracker.is_closed());
    tracker.wait().await;
    other.reopen();
    assert!(!tracker.is_closed());
    tracker.close();
    other.wait().await;
  `),
  );
});

test("drop del tracker non abortisce la task", () => {
  run(
    plain(String.raw`
    let tracker = tokio_util::task::TaskTracker::new();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let handle = tracker.spawn(async move { rx.await.unwrap() });
    drop(tracker);
    tx.send(7).unwrap();
    assert_eq!(handle.await.unwrap(), 7);
  `),
  );
});

test("finish con set vuoto non richiede escalation", () => {
  run(
    main(
      deadline,
      String.raw`
    let mut tasks = JoinSet::new();
    let report = finish(&mut tasks, Instant::now()).await;
    assert!(!report.forced);
    assert_eq!(report.completed + report.failed + report.cancelled + report.panicked, 0);
  `,
    ),
  );
});

test("finish conserva successi ed errori applicativi senza escalation", () => {
  run(
    main(
      deadline,
      String.raw`
    let mut tasks = JoinSet::new();
    tasks.spawn(async { Ok(()) });
    tasks.spawn(async { Err("failed") });
    let report = finish(&mut tasks, Instant::now() + Duration::from_secs(5)).await;
    assert!(!report.forced);
    assert_eq!(report.completed, 1);
    assert_eq!(report.failed, 1);
    assert_eq!(report.panicked + report.cancelled, 0);
  `,
    ),
  );
});

test("finish raccoglie panic senza abbandonare le altre task", () => {
  run(
    main(
      deadline,
      String.raw`
    std::panic::set_hook(Box::new(|_| {}));
    let mut tasks = JoinSet::new();
    tasks.spawn(async { panic!("expected panic") });
    tasks.spawn(async { Ok(()) });
    let report = finish(&mut tasks, Instant::now() + Duration::from_secs(5)).await;
    assert_eq!(report.panicked, 1);
    assert_eq!(report.completed, 1);
    assert!(!report.forced);
    assert!(tasks.is_empty());
  `,
    ),
  );
});

test("finish distingue cancellazione gia richiesta da escalation", () => {
  run(
    main(
      deadline,
      String.raw`
    let mut tasks = JoinSet::new();
    tasks.spawn(std::future::pending::<Result<(), &'static str>>());
    tasks.abort_all();
    let report = finish(&mut tasks, Instant::now() + Duration::from_secs(5)).await;
    assert_eq!(report.cancelled, 1);
    assert!(!report.forced);
  `,
    ),
  );
});

test("una deadline scaduta raccoglie risultati pronti poi abortisce il resto", () => {
  run(
    main(
      deadline,
      String.raw`
    let mut tasks = JoinSet::new();
    let (done, ready) = oneshot::channel();
    tasks.spawn(async move { done.send(()).unwrap(); Ok(()) });
    ready.await.unwrap();
    tasks.spawn(std::future::pending::<Result<(), &'static str>>());
    let report = finish(&mut tasks, Instant::now()).await;
    assert_eq!(report.completed, 1);
    assert_eq!(report.cancelled, 1);
    assert!(report.forced);
    assert!(tasks.is_empty());
  `,
    ),
  );
});

test("abort_all richiede ancora join per svuotare il set", () => {
  run(
    plain(String.raw`
    let mut tasks = tokio::task::JoinSet::new();
    tasks.spawn(std::future::pending::<()>());
    tasks.abort_all();
    assert_eq!(tasks.len(), 1);
    assert!(tasks.join_next().await.unwrap().unwrap_err().is_cancelled());
    assert!(tasks.is_empty());
  `),
  );
});

test("JoinSet shutdown abortisce, non esegue cleanup dopo await", () => {
  run(
    plain(String.raw`
    use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
    let cleaned = Arc::new(AtomicBool::new(false));
    let value = cleaned.clone();
    let mut tasks = tokio::task::JoinSet::new();
    let (ready, started) = tokio::sync::oneshot::channel();
    tasks.spawn(async move {
        ready.send(()).unwrap();
        std::future::pending::<()>().await;
        value.store(true, Ordering::SeqCst);
    });
    started.await.unwrap();
    tasks.shutdown().await;
    assert!(tasks.is_empty());
    assert!(!cleaned.load(Ordering::SeqCst));
  `),
  );
});

test("abort esegue Drop ma non cleanup asincrono successivo", () => {
  run(
    plain(String.raw`
    use std::sync::{Arc, atomic::{AtomicUsize, Ordering}};
    struct Guard(Arc<AtomicUsize>);
    impl Drop for Guard {
        fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); }
    }
    let state = Arc::new(AtomicUsize::new(0));
    let guard = Guard(state.clone());
    let (ready, started) = tokio::sync::oneshot::channel();
    let handle = tokio::spawn(async move {
        let _guard = guard;
        ready.send(()).unwrap();
        std::future::pending::<()>().await;
        5
    });
    started.await.unwrap();
    handle.abort();
    assert!(handle.await.unwrap_err().is_cancelled());
    assert_eq!(state.load(Ordering::SeqCst), 1);
  `),
  );
});

test("handle preso in prestito nel timeout resta disponibile per abort", () => {
  run(
    main(
      moved,
      String.raw`
    let mut handle = tokio::spawn(std::future::pending::<()>());
    assert!(timeout(Duration::ZERO, &mut handle).await.is_err());
    handle.abort();
    assert!(handle.await.unwrap_err().is_cancelled());
  `,
    ),
  );
});

test("drop di JoinHandle distacca, non arresta il lavoro", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::oneshot::channel();
    let (done, finished) = tokio::sync::oneshot::channel();
    let handle = tokio::spawn(async move { rx.await.unwrap(); done.send(9).unwrap(); });
    drop(handle);
    tx.send(()).unwrap();
    assert_eq!(finished.await.unwrap(), 9);
  `),
  );
});

test("trigger interno pronto non polla il ramo esterno", () => {
  run(
    main(
      signal,
      String.raw`
    let stop = CancellationToken::new();
    stop.cancel();
    let external = std::future::poll_fn(|_| -> std::task::Poll<io::Result<()>> {
        panic!("external must not be polled")
    });
    assert!(wait_trigger(&stop, external).await.is_ok());
  `,
    ),
  );
});

test("trigger esterno puo riuscire senza segnale OS", () => {
  run(
    main(
      signal,
      String.raw`
    let stop = CancellationToken::new();
    assert!(wait_trigger(&stop, async { Ok(()) }).await.is_ok());
    assert!(!stop.is_cancelled());
  `,
    ),
  );
});

test("errore del trigger viene preservato e cleanup avviene comunque", () => {
  run(
    main(
      signal,
      String.raw`
    let stop = CancellationToken::new();
    let child = stop.clone();
    let task = tokio::spawn(async move { child.cancelled().await; 42 });
    let result = wait_trigger(&stop, async {
        Err(io::Error::new(io::ErrorKind::PermissionDenied, "injected"))
    }).await;
    stop.cancel();
    assert_eq!(task.await.unwrap(), 42);
    assert_eq!(result.unwrap_err().kind(), io::ErrorKind::PermissionDenied);
  `,
    ),
  );
});

test("abort non interrompe spawn_blocking gia iniziato", () => {
  run(
    plain(String.raw`
    let (ready, started) = tokio::sync::oneshot::channel();
    let (release, gate) = std::sync::mpsc::channel();
    let task = tokio::task::spawn_blocking(move || {
        ready.send(()).unwrap();
        gate.recv().unwrap();
        42
    });
    started.await.unwrap();
    task.abort();
    release.send(()).unwrap();
    assert_eq!(task.await.unwrap(), 42);
  `),
  );
});

test("future pronta riesce anche oltre la deadline", () => {
  run(
    plain(String.raw`
    let deadline = tokio::time::Instant::now() - std::time::Duration::from_secs(1);
    assert_eq!(tokio::time::timeout_at(deadline, async { 7 }).await.unwrap(), 7);
  `),
  );
});

test("drop di JoinSet cancella le task possedute", () => {
  run(
    plain(String.raw`
    struct Guard(Option<tokio::sync::oneshot::Sender<()>>);
    impl Drop for Guard {
        fn drop(&mut self) { let _ = self.0.take().unwrap().send(()); }
    }
    let (done, dropped) = tokio::sync::oneshot::channel();
    let guard = Guard(Some(done));
    let mut set = tokio::task::JoinSet::new();
    set.spawn(async move { let _guard = guard; std::future::pending::<()>().await; });
    drop(set);
    dropped.await.unwrap();
  `),
  );
});
