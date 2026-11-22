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
const notePath = "Programmazione/Rust/Pagine/Async streams.md";
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
const prefix = "appunti-rust-streams-";
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
    process.env.RUST_STREAM_TEST_CARGO_HOME || path.join(root, "cargo-home"),
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
const extraLibraries = {};
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
        process.env.RUST_STREAM_TEST_FETCH === "1" ? "false" : "true",
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
  for (const dependency of [
    "tokio@1.54.1",
    "futures-util@0.3.34",
    "tokio-stream@0.1.19",
  ])
    assert.ok(versions.includes(dependency));
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
  for (const crate of ["futures_util", "tokio_stream"]) {
    const files = fs
      .readdirSync(dependencyDir)
      .filter((n) => new RegExp("^lib" + crate + "-[a-f0-9]+[.]rlib$").test(n));
    assert.equal(files.length, 1, crate);
    extraLibraries[crate] = path.join(dependencyDir, files[0]);
  }
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
      ...Object.entries(extraLibraries).flatMap(([crate, file]) => [
        "--extern",
        crate + "=" + file,
      ]),
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

const consumer = "Consumo generico con pinning locale";
const filters = "Filtri delle due librerie";
const receiver = "ReceiverStream e backpressure";
const errors = "Errori come elementi oppure uscita anticipata";
const concurrent = "Concorrenza limitata e ordine";
const fused = "Fuse e terminazione osservabile";
const boxed = "Boxing senza imporre static";
const unpinned = "Next su un tipo non Unpin";
const ambiguous = "Due trait di estensione nello stesso scope";

function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, after);
}

test("baseline, manifest e nove programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 10);
  prepare();
});

test("frontmatter invariato, template e gerarchia", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Async streams",
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

for (const name of [
  consumer,
  filters,
  receiver,
  errors,
  concurrent,
  fused,
  boxed,
])
  test("programma originale: " + name, () => run(source(name)));

test("next senza pinning: E0277", () =>
  run(source(unpinned), { error: "E0277" }));
test("due StreamExt: E0034", () => run(source(ambiguous), { error: "E0034" }));

test("pinning corregge il primo controesempio", () => {
  run(
    replaceOnce(
      source(unpinned),
      "    let _ = source.next().await;",
      "    let mut source = std::pin::pin!(source);\n    assert_eq!(source.next().await, Some(1));",
    ),
  );
});

test("chiamata qualificata corregge l'ambiguita", () => {
  run(
    replaceOnce(
      source(ambiguous),
      "    let _ = source.next().await;",
      "    assert_eq!(futures_util::StreamExt::next(&mut source).await, Some(1));",
    ),
  );
});

test("uno Stream non e direttamente una Future", () => {
  run(plain("let _ = futures_util::stream::iter([1_u32]).await;"), {
    error: "E0277",
  });
});

test("helper generico: vuoto e prestiti locali", () => {
  run(
    main(
      consumer,
      String.raw`
    assert!(consume_numbers(stream::empty()).await.is_empty());
    let data = vec![0_u64, 1, u64::MAX];
    assert_eq!(consume_numbers(stream::iter(data.iter().copied())).await, data);
  `,
    ),
  );
});

test("helper generico accetta stream non Send con Rc", () => {
  run(
    main(
      consumer,
      String.raw`
    let data = std::rc::Rc::new(42_u64);
    let input = stream::once(async move {
      tokio::task::yield_now().await;
      *data
    });
    assert_eq!(consume_numbers(input).await, [42]);
  `,
    ),
  );
});

test("map async produce future non ancora eseguite", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let count = std::cell::Cell::new(0);
    let count_ref = &count;
    let pipeline = stream::iter([1_u32,2,3]).map(|n| async move {
      count_ref.set(count_ref.get() + 1);
      n * 10
    });
    assert_eq!(count.get(), 0);
    let futures: Vec<_> = pipeline.collect().await;
    assert_eq!(count.get(), 0);
    let mut values = Vec::new();
    for future in futures { values.push(future.await); }
    assert_eq!(count.get(), 3);
    assert_eq!(values, [10,20,30]);
  `),
  );
});

for (const [method, limit] of [
  ["then", 1],
  ["buffer_unordered", 2],
]) {
  test(method + ": limite di future attive", () => {
    const ending =
      method === "then"
        ? ".then(work).collect::<Vec<_>>().await"
        : ".map(work).buffer_unordered(2).collect::<Vec<_>>().await";
    run(
      plain(
        String.raw`
      use futures_util::{stream, StreamExt};
      use std::cell::Cell;
      let active = Cell::new(0);
      let peak = Cell::new(0);
      let (a, p) = (&active, &peak);
      let work = |value| async move {
        a.set(a.get()+1);
        p.set(p.get().max(a.get()));
        tokio::task::yield_now().await;
        a.set(a.get()-1);
        value
      };
      let result = stream::iter([1_u32,2,3,4])
    ` +
          ending +
          ";\nassert_eq!(result.len(),4);\nassert_eq!(active.get(),0);\nassert_eq!(peak.get()," +
          limit +
          ");",
      ),
    );
  });
}

test("buffered trattiene un secondo risultato pronto fino al primo", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, Stream, StreamExt};
    use std::pin::Pin;
    use std::task::Poll;
    let (tx1, rx1) = tokio::sync::oneshot::channel::<u32>();
    let (tx2, rx2) = tokio::sync::oneshot::channel::<u32>();
    tx2.send(20).unwrap();
    let mut stream = stream::iter([rx1,rx2])
      .map(|rx| async move { rx.await.unwrap() }).buffered(2);
    let pending = std::future::poll_fn(|cx| {
      Poll::Ready(Pin::new(&mut stream).poll_next(cx).is_pending())
    }).await;
    assert!(pending);
    tx1.send(10).unwrap();
    assert_eq!(stream.next().await, Some(10));
    assert_eq!(stream.next().await, Some(20));
    assert_eq!(stream.next().await, None);
  `),
  );
});

test("buffer_unordered emette il secondo prima del primo ancora pendente", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let (tx1, rx1) = tokio::sync::oneshot::channel::<u32>();
    let (tx2, rx2) = tokio::sync::oneshot::channel::<u32>();
    tx2.send(20).unwrap();
    let mut stream = stream::iter([rx1,rx2])
      .map(|rx| async move { rx.await.unwrap() }).buffer_unordered(2);
    assert_eq!(stream.next().await, Some(20));
    tx1.send(10).unwrap();
    assert_eq!(stream.next().await, Some(10));
    assert_eq!(stream.next().await, None);
  `),
  );
});

test("ReceiverStream: Pending, wake, Some e None distinti", () => {
  run(String.raw`
    use futures_util::Stream;
    use std::pin::Pin;
    use std::sync::{Arc, atomic::{AtomicUsize, Ordering}};
    use std::task::{Context, Poll, Wake, Waker};
    use tokio_stream::wrappers::ReceiverStream;
    struct Counter(AtomicUsize);
    impl Wake for Counter {
      fn wake(self: Arc<Self>) { self.0.fetch_add(1,Ordering::SeqCst); }
      fn wake_by_ref(self: &Arc<Self>) { self.0.fetch_add(1,Ordering::SeqCst); }
    }
    fn main() {
      let counter = Arc::new(Counter(AtomicUsize::new(0)));
      let waker = Waker::from(counter.clone());
      let mut cx = Context::from_waker(&waker);
      let (tx, rx) = tokio::sync::mpsc::channel(1);
      let mut stream = ReceiverStream::new(rx);
      assert_eq!(Pin::new(&mut stream).poll_next(&mut cx), Poll::Pending);
      tx.try_send(42).unwrap();
      assert!(counter.0.load(Ordering::SeqCst)>0);
      assert_eq!(Pin::new(&mut stream).poll_next(&mut cx), Poll::Ready(Some(42)));
      drop(tx);
      assert_eq!(Pin::new(&mut stream).poll_next(&mut cx), Poll::Ready(None));
    }
  `);
});

test("backpressure: send resta Pending fino al consumo", () => {
  run(
    main(
      receiver,
      String.raw`
    use std::future::{Future, poll_fn};
    use std::task::Poll;
    let (tx, rx) = mpsc::channel(1);
    tx.try_send(10).unwrap();
    let mut stream = ReceiverStream::new(rx);
    let mut send = std::pin::pin!(tx.send(20));
    assert!(poll_fn(|cx| Poll::Ready(send.as_mut().poll(cx).is_pending())).await);
    assert_eq!(stream.next().await, Some(10));
    send.await.unwrap();
    assert_eq!(stream.next().await, Some(20));
  `,
    ),
  );
});

test("close drena il buffer e rispetta permit gia ottenuti", () => {
  run(
    main(
      receiver,
      String.raw`
    let (tx, rx) = mpsc::channel(2);
    tx.try_send(10).unwrap();
    let permit = tx.clone().reserve_owned().await.unwrap();
    let mut stream = ReceiverStream::new(rx);
    stream.close();
    assert!(tx.send(99).await.is_err());
    permit.send(20);
    assert_eq!(stream.collect::<Vec<_>>().await, [10,20]);
  `,
    ),
  );
});

test("un clone del sender mantiene aperto lo stream vuoto", () => {
  run(
    main(
      receiver,
      String.raw`
    let (tx, rx) = mpsc::channel::<u32>(1);
    let clone = tx.clone();
    drop(tx);
    let mut stream = ReceiverStream::new(rx);
    assert!(tokio::time::timeout(std::time::Duration::from_millis(1),stream.next()).await.is_err());
    drop(clone);
    assert_eq!(stream.next().await,None);
  `,
    ),
  );
});

test("drop del consumer permette al producer di osservare send fallito", () => {
  run(
    main(
      receiver,
      String.raw`
    let (tx, rx) = mpsc::channel(1);
    let producer = tokio::spawn(async move {
      tx.closed().await;
      tx.send(42).await.unwrap_err().0
    });
    drop(ReceiverStream::new(rx));
    assert_eq!(producer.await.unwrap(),42);
  `,
    ),
  );
});

test("try_next puo proseguire dopo un elemento Err della sorgente dimostrativa", () => {
  run(
    main(
      errors,
      String.raw`
    let mut source = stream::iter([Err("bad"),Ok(42)]);
    assert_eq!(source.try_next().await,Err("bad"));
    assert_eq!(source.try_next().await,Ok(Some(42)));
    assert_eq!(source.try_next().await,Ok(None));
  `,
    ),
  );
});

test("try_collect non consuma gli elementi successivi all'errore", () => {
  run(
    main(
      errors,
      String.raw`
    let visits = std::cell::Cell::new(0);
    let result: Result<Vec<_>,_> = stream::iter([Ok(1),Err("bad"),Ok(3)])
      .inspect(|_| visits.set(visits.get()+1)).try_collect().await;
    assert_eq!(result,Err("bad"));
    assert_eq!(visits.get(),2);
  `,
    ),
  );
});

test("fuse non ripolla la sorgente interna dopo None", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    use std::task::Poll;
    let polls = std::cell::Cell::new(0);
    let mut source = stream::poll_fn(|_| {
      polls.set(polls.get()+1);
      match polls.get() {
        1 => Poll::Ready(Some(42)),
        2 => Poll::Ready(None),
        _ => panic!("inner polled after end"),
      }
    }).fuse();
    assert_eq!(source.next().await,Some(42));
    assert_eq!(source.next().await,None);
    assert_eq!(source.next().await,None);
    assert_eq!(polls.get(),2);
  `),
  );
});

test("take limita il consumo e take zero non polla la sorgente", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let visits = std::cell::Cell::new(0);
    let values: Vec<_> = stream::iter([1,2,3])
      .inspect(|_| visits.set(visits.get()+1)).take(2).collect().await;
    assert_eq!(values,[1,2]);
    assert_eq!(visits.get(),2);
    let values: Vec<u32> = stream::poll_fn(|_| -> std::task::Poll<Option<u32>> { panic!("should not poll") })
      .take(0).collect().await;
    assert!(values.is_empty());
  `),
  );
});

test("boxed: ordine normale, vuoto e Unicode senza copie del testo", () => {
  run(
    main(
      boxed,
      String.raw`
    let empty: Vec<String> = Vec::new();
    assert!(labels(&empty,false).collect::<Vec<_>>().await.is_empty());
    let data = vec![String::from("caff\u{e8}"),String::from("\u{1F642}")];
    let result = labels(&data,false).collect::<Vec<_>>().await;
    assert_eq!(result,[data[0].as_str(),data[1].as_str()]);
    assert_eq!(result[0].as_ptr(),data[0].as_ptr());
  `,
    ),
  );
});

test("boxing non prolunga la vita dei dati: E0597", () => {
  run(
    main(
      boxed,
      String.raw`
    let source;
    {
      let data = vec![String::from("short")];
      source = labels(&data,false);
    }
    let _ = source.collect::<Vec<_>>().await;
  `,
    ),
    { error: "E0597" },
  );
});

test("boxed_local accetta Rc non Send", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let value = std::rc::Rc::new(String::from("local"));
    let mut source = stream::once(async move {
      tokio::task::yield_now().await;
      value.len()
    }).boxed_local();
    assert_eq!(source.next().await,Some(5));
  `),
  );
});

test("boxed richiede Send e rifiuta Rc", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let value = std::rc::Rc::new(String::from("local"));
    let _ = stream::once(async move {
      tokio::task::yield_now().await;
      value.len()
    }).boxed();
  `),
    { errorText: /cannot be sent between threads safely/ },
  );
});

test("futures filter non accetta un bool al posto della future", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, StreamExt};
    let _ = stream::iter([1_u32]).filter(|n| n%2==0);
  `),
    { error: "E0277" },
  );
});

test("tokio filter non accetta un predicato async", () => {
  run(
    plain(String.raw`
    use tokio_stream::StreamExt;
    let _ = tokio_stream::iter([1_u32]).filter(|&n| async move { n%2==0 });
  `),
    { error: "E0308" },
  );
});

test("next richiede il trait di estensione in scope", () => {
  run(
    plain(String.raw`
    let mut source = tokio_stream::iter([1_u32]);
    let _ = source.next().await;
  `),
    { error: "E0599" },
  );
});

test("next perdente in select conserva il receiver", () => {
  run(
    main(
      receiver,
      String.raw`
    let (tx,rx) = mpsc::channel(1);
    let mut source = ReceiverStream::new(rx);
    tokio::select! {
      biased;
      _ = source.next() => panic!("no value yet"),
      _ = std::future::ready(()) => (),
    }
    tx.send(42).await.unwrap();
    assert_eq!(source.next().await,Some(42));
  `,
    ),
  );
});

test("drop del buffer elimina future possedute senza annullare effetti", () => {
  run(
    plain(String.raw`
    use futures_util::{stream, Stream, StreamExt};
    use std::cell::Cell;
    use std::pin::Pin;
    use std::task::Poll;
    struct Guard<'a>(&'a Cell<bool>);
    impl Drop for Guard<'_> { fn drop(&mut self) { self.0.set(true); } }
    let dropped = Cell::new(false);
    let started = Cell::new(false);
    let mut source = stream::iter([Guard(&dropped)]).map(|guard| {
      let started = &started;
      async move {
        let _guard = guard;
        started.set(true);
        std::future::pending::<u32>().await
      }
    }).buffer_unordered(1);
    assert!(std::future::poll_fn(|cx|
      Poll::Ready(Pin::new(&mut source).poll_next(cx).is_pending())
    ).await);
    assert!(started.get());
    drop(source);
    assert!(dropped.get());
    assert!(started.get());
  `),
  );
});
