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
const notePath = "Programmazione/Rust/Pagine/select join e cancellation.md";
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
const prefix = "appunti-rust-select-";
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

const guards = "Guardie: costruzione e polling";
const join = "Join e try_join: errori diversi";
const channels = "Ricevere da due canali fino alla chiusura";
const retained = "Conservare una future tra due selezioni";
const deadline = "Una sola scadenza per tutto il ciclo";
const timeout = "Timeout di una task con arresto esplicito";
const pair = "Due attese sicure non formano sempre un'operazione sicura";
const disabled = "Tutti i rami disabilitati: panic";

test("baseline, manifest e otto programmi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 9);
  assert.match(source("Cargo.toml"), /version = "=1\.54\.1"/);
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
    "select!, join! e cancellation",
  ]);
  const h2 = headings.filter((n) => n.depth === 2).map(text);
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
    assert.ok(h2.includes(title), title);
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
});

for (const name of [guards, join, channels, retained, deadline, timeout, pair])
  test("programma originale: " + name, () => run(source(name)));

test("tutti i pattern non corrispondenti: panic", () => {
  run(source(disabled), { panic: /all branches are disabled/ });
});

test("tutte le guardie false: panic", () => {
  run(plain("tokio::select! { _ = async {}, if false => {} }"), {
    panic: /all branches are disabled/,
  });
});

test("else corregge il caso senza rami validi", () => {
  run(
    plain(String.raw`
    let fallback = tokio::select! {
      Some(_) = std::future::ready(None::<u32>) => false,
      else => true,
    };
    assert!(fallback);
  `),
  );
});

test("un Err non corrispondente viene scartato", () => {
  run(
    plain(String.raw`
    let value = tokio::select! {
      biased;
      Ok(v) = async { Err::<u32, &str>("lost error") } => v,
      v = async { 42 } => v,
      else => 0,
    };
    assert_eq!(value, 42);
  `),
  );
});

test("else non e un default per future Pending", () => {
  run(
    plain(String.raw`
    let outcome = tokio::time::timeout(
      std::time::Duration::from_millis(1),
      async {
        tokio::select! {
          _ = std::future::pending::<()>() => (),
          else => panic!("Pending is not disabled"),
        }
      }
    ).await;
    assert!(outcome.is_err());
  `),
  );
});

test("guardia false non protegge la costruzione da panic", () => {
  run(
    plain(String.raw`
    tokio::select! {
      _ = {
        None::<()>.expect("disabled expression evaluated");
        async {}
      }, if false => (),
      else => (),
    }
  `),
    { panic: /disabled expression evaluated/ },
  );
});

test("gli handler devono avere tipi compatibili", () => {
  run(
    plain(String.raw`
    let _ = tokio::select! {
      _ = async {} => 42u32,
      _ = async {} => String::from("incompatible"),
    };
  `),
    { error: "E0308" },
  );
});

test("due recv concorrenti sullo stesso receiver violano il prestito", () => {
  run(
    plain(String.raw`
    let (_tx, mut rx) = tokio::sync::mpsc::channel::<u32>(1);
    tokio::select! {
      _ = rx.recv() => (),
      _ = rx.recv() => (),
    }
  `),
    { error: "E0499" },
  );
});

test("join mantiene ordine della tupla anche con completamento inverso", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::oneshot::channel();
    let result = tokio::join!(
      async { rx.await.unwrap(); 10 },
      async { tx.send(()).unwrap(); 20 }
    );
    assert_eq!(result, (10, 20));
  `),
  );
});

test("join e select accettano Rc e prestiti nella task corrente", () => {
  run(
    plain(String.raw`
    let text = std::rc::Rc::new(String::from("local"));
    let (a, b) = tokio::join!(
      async { tokio::task::yield_now().await; text.len() },
      async { text.chars().count() }
    );
    assert_eq!((a,b), (5,5));
    let result = tokio::select! {
      v = async { text.as_str() } => v,
      _ = std::future::pending::<()>() => "",
    };
    assert_eq!(result, "local");
  `),
  );
});

test("try_join tutti Ok produce tupla", () => {
  run(
    plain(String.raw`
    let result = tokio::try_join!(
      async { Ok::<_, &str>(10u32) },
      async { Ok::<_, &str>(String::from("done")) }
    );
    assert_eq!(result, Ok((10, String::from("done"))));
  `),
  );
});

test("try_join biased ritorna il primo Err osservato", () => {
  run(
    plain(String.raw`
    let result = tokio::try_join!(
      biased;
      async { Err::<u32, &str>("first") },
      async { Err::<u32, &str>("second") }
    );
    assert_eq!(result, Err("first"));
  `),
  );
});

test("try_join elimina stato posseduto ma non annulla effetti precedenti", () => {
  run(String.raw`
    use std::cell::Cell;
    struct Guard<'a>(&'a Cell<bool>);
    impl Drop for Guard<'_> {
      fn drop(&mut self) { self.0.set(true); }
    }
    #[tokio::main(flavor="current_thread")]
    async fn main() {
      let dropped = Cell::new(false);
      let progress = Cell::new(0);
      let (tx, rx) = tokio::sync::oneshot::channel();
      let result = tokio::try_join!(
        async { rx.await.unwrap(); Err::<(), &str>("stop") },
        async {
          let _guard = Guard(&dropped);
          progress.set(1);
          tx.send(()).unwrap();
          std::future::pending::<Result<(), &str>>().await
        }
      );
      assert_eq!(result, Err("stop"));
      assert!(dropped.get());
      assert_eq!(progress.get(), 1);
    }
  `);
});

test("try_join su handle non appiattisce Result applicativo", () => {
  run(
    plain(String.raw`
    let first = tokio::spawn(async { Err::<u32, &str>("application error") });
    let second = tokio::spawn(async { Ok::<u32, &str>(42) });
    let (a,b) = tokio::try_join!(first, second).unwrap();
    assert_eq!(a, Err("application error"));
    assert_eq!(b, Ok(42));
  `),
  );
});

test("select su handle posseduto lo distacca senza fermare la task", () => {
  run(
    plain(String.raw`
    let (release, wait) = tokio::sync::oneshot::channel::<()>();
    let (done, observed) = tokio::sync::oneshot::channel();
    let handle = tokio::spawn(async move {
      wait.await.unwrap();
      done.send(42).unwrap();
    });
    tokio::select! {
      biased;
      _ = handle => panic!("not released"),
      _ = std::future::ready(()) => (),
    }
    release.send(()).unwrap();
    assert_eq!(observed.await.unwrap(), 42);
  `),
  );
});

test("timeout su handle preso in prestito conserva il risultato", () => {
  run(
    plain(String.raw`
    let (tx, rx) = tokio::sync::oneshot::channel::<u32>();
    let mut handle = tokio::spawn(async { rx.await.unwrap() });
    assert!(tokio::time::timeout(std::time::Duration::ZERO, &mut handle).await.is_err());
    tx.send(42).unwrap();
    assert_eq!(handle.await.unwrap(), 42);
  `),
  );
});

test("recv perdente non consuma il messaggio successivo", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::channel::<u32>(1);
    tokio::select! {
      biased;
      _ = rx.recv() => panic!("no message available"),
      _ = std::future::ready(()) => (),
    }
    tx.send(42).await.unwrap();
    assert_eq!(rx.recv().await, Some(42));
  `),
  );
});

test("conservare take_pair pinnata evita la perdita fra selezioni", () => {
  run(
    main(
      pair,
      String.raw`
    let (tx, mut rx) = mpsc::channel(2);
    tx.try_send(10).unwrap();
    let operation = take_pair(&mut rx);
    tokio::pin!(operation);
    tokio::select! {
      biased;
      _ = &mut operation => panic!("second value missing"),
      _ = std::future::ready(()) => (),
    }
    tx.try_send(20).unwrap();
    assert_eq!(operation.await, Some((10,20)));
  `,
    ),
  );
});

test("take_pair chiuso dopo il primo valore perde comunque il parziale", () => {
  run(
    main(
      pair,
      String.raw`
    let (tx, mut rx) = mpsc::channel(2);
    tx.try_send(10).unwrap();
    drop(tx);
    assert_eq!(take_pair(&mut rx).await, None);
  `,
    ),
  );
});

test("send perdente elimina il valore anche se non lo ha inviato", () => {
  run(String.raw`
    use std::cell::Cell;
    use std::rc::Rc;
    struct Token(Rc<Cell<u32>>);
    impl Drop for Token {
      fn drop(&mut self) { self.0.set(self.0.get() + 1); }
    }
    #[tokio::main(flavor="current_thread")]
    async fn main() {
      let dropped = Rc::new(Cell::new(0));
      let (tx, mut rx) = tokio::sync::mpsc::channel(1);
      assert!(tx.try_send(Token(dropped.clone())).is_ok());
      tokio::select! {
        biased;
        _ = tx.send(Token(dropped.clone())) => panic!("queue is full"),
        _ = std::future::ready(()) => (),
      }
      assert_eq!(dropped.get(), 1);
      drop(rx.recv().await.unwrap());
      assert_eq!(dropped.get(), 2);
    }
  `);
});

test("reserve conserva il valore fuori dalla future cancellata", () => {
  run(
    plain(String.raw`
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);
    tx.try_send(String::from("first")).unwrap();
    let value = String::from("kept");
    tokio::select! {
      biased;
      _ = tx.reserve() => panic!("queue is full"),
      _ = std::future::ready(()) => (),
    }
    assert_eq!(value, "kept");
    assert_eq!(rx.recv().await.as_deref(), Some("first"));
    let permit = tx.reserve().await.unwrap();
    permit.send(value);
    assert_eq!(rx.recv().await.as_deref(), Some("kept"));
  `),
  );
});

test("timeout zero puo riuscire su future immediatamente pronta", () => {
  run(
    plain(String.raw`
    assert_eq!(
      tokio::time::timeout(std::time::Duration::ZERO, std::future::ready(42)).await.unwrap(),
      42
    );
  `),
  );
});

test("timeout non interrompe un poll sincrono che supera la scadenza", () => {
  run(
    plain(String.raw`
    let value = tokio::time::timeout(std::time::Duration::ZERO, async {
      std::thread::sleep(std::time::Duration::from_millis(5));
      42
    }).await.unwrap();
    assert_eq!(value, 42);
  `),
  );
});

test("biased sceglie il primo ramo pronto", () => {
  run(
    plain(String.raw`
    for _ in 0..5 {
      let value = tokio::select! {
        biased;
        v = async { 1 } => v,
        v = async { 2 } => v,
      };
      assert_eq!(value, 1);
    }
  `),
  );
});

test("Sleep preso in prestito senza pin: E0277", () => {
  const code = source(deadline);
  const line = "    tokio::pin!(deadline);";
  assert.equal(code.split(line).length, 2);
  run(code.replace(line, "    let mut deadline = deadline;"), {
    error: "E0277",
  });
});

test("completamento della task prima di abort rimane Ok", () => {
  run(
    plain(String.raw`
    let handle = tokio::spawn(async { 42 });
    while !handle.is_finished() { tokio::task::yield_now().await; }
    handle.abort();
    assert_eq!(handle.await.unwrap(), 42);
  `),
  );
});

test("handler scelto non continua a monitorare il ramo shutdown", () => {
  run(
    plain(String.raw`
    let (stop, mut stopped) = tokio::sync::oneshot::channel::<()>();
    let finished = std::cell::Cell::new(false);
    tokio::select! {
      biased;
      _ = &mut stopped => panic!("not signalled yet"),
      _ = std::future::ready(()) => {
        stop.send(()).unwrap();
        tokio::task::yield_now().await;
        finished.set(true);
      }
    }
    assert!(finished.get());
    stopped.await.unwrap();
  `),
  );
});
