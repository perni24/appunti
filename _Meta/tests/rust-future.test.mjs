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
const notePath = "Programmazione/Rust/Pagine/Future Trait.md";
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
const prefix = "appunti-rust-future-";
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

const generic = "Helper generico che usa davvero la future";
const wrapper = "Future manuale che adatta un receiver";
const boxed = "Future boxed eterogenee e prestiti";
const local = "Future locale senza Send";
const polling = "Adattare poll con poll_fn";

test("baseline reale, manifest e sette programmi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
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
    "Future Trait",
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

for (const name of [generic, wrapper, boxed, local, polling])
  test("programma originale: " + name, () => run(source(name)));

test("Box dyn Future senza Unpin: E0277", () =>
  run(source("Box senza Pin per un trait object Future"), { error: "E0277" }));

test("boxing non aggiunge Send", () =>
  run(source("Boxing non rende Send una future"), {
    errorText: /future cannot be sent between threads safely/,
  }));

test("helper lazy: non esegue ne future ne mapper alla costruzione", () =>
  run(
    main(
      generic,
      `
    let calls = std::cell::Cell::new(0);
    let maps = std::cell::Cell::new(0);
    let result = map_future(async { calls.set(calls.get() + 1); 4 },
      |value| { maps.set(maps.get() + 1); value * 3 });
    assert_eq!((calls.get(), maps.get()), (0, 0));
    assert_eq!(result.await, 12);
    assert_eq!((calls.get(), maps.get()), (1, 1));
  `,
    ),
  ));

test("drop helper mai pollato distrugge le catture senza eseguirle", () =>
  run(
    main(
      generic,
      `
    struct Guard<'a>(&'a std::cell::Cell<u32>);
    impl Drop for Guard<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }
    let drops = std::cell::Cell::new(0);
    let guard = Guard(&drops);
    let future = map_future(async { panic!("not polled"); 0 },
      move |value| { drop(guard); value });
    drop(future);
    assert_eq!(drops.get(), 1);
  `,
    ),
  ));

test("FnOnce puo consumare una cattura non Copy", () =>
  run(
    main(
      generic,
      `
    let suffix = String::from("done");
    let result = map_future(async { 3 }, move |n| (n, suffix)).await;
    assert_eq!(result, (3, String::from("done")));
  `,
    ),
  ));

test("Output Result: il mapper vede anche Err", () =>
  run(
    main(
      generic,
      `
    let future = async { Err::<u32, _>("invalid") };
    let result = map_future(future, |value| value.map_err(|_| "mapped")).await;
    assert_eq!(result, Err("mapped"));
  `,
    ),
  ));

test("helper attraversa un'attesa reale oneshot", () =>
  run(
    main(
      generic,
      `
    let (sender, receiver) = tokio::sync::oneshot::channel::<u32>();
    let task = tokio::spawn(async move { sender.send(21).unwrap(); });
    assert_eq!(map_future(receiver, |value| value.unwrap() * 2).await, 42);
    task.await.unwrap();
  `,
    ),
  ));

test("wrapper: produttore chiuso prima del polling", () =>
  run(
    main(
      wrapper,
      `
    let (sender, receiver) = oneshot::channel();
    drop(sender);
    assert_eq!(ReceiveJob { receiver }.await, Err("producer stopped"));
  `,
    ),
  ));

test("wrapper: errore applicativo distinto dal canale chiuso", () =>
  run(
    main(
      wrapper,
      `
    let (sender, receiver) = oneshot::channel();
    sender.send(Err("invalid")).unwrap();
    assert_eq!(ReceiveJob { receiver }.await, Err("invalid"));
  `,
    ),
  ));

test("wrapper: Send, Unpin e attesa tramite prestito mutabile", () =>
  run(
    main(
      wrapper,
      `
    fn assert_bounds<T: Future + Send + Unpin>() {}
    assert_bounds::<ReceiveJob>();
    let (sender, receiver) = oneshot::channel();
    sender.send(Ok(0)).unwrap();
    let mut job = ReceiveJob { receiver };
    assert_eq!((&mut job).await, Ok(0));
  `,
    ),
  ));

test("wrapper: drop notifica il sender e non conserva un consumer", () =>
  run(
    main(
      wrapper,
      `
    let (sender, receiver) = oneshot::channel();
    drop(ReceiveJob { receiver });
    assert!(sender.is_closed());
    assert_eq!(sender.send(Ok(42)), Err(Ok(42)));
  `,
    ),
  ));

const counter = `
use std::sync::{Arc, atomic::{AtomicUsize, Ordering}};
use std::task::{Wake, Waker};
#[derive(Default)]
struct Counter(AtomicUsize);
impl Wake for Counter {
    fn wake(self: Arc<Self>) { self.0.fetch_add(1, Ordering::Relaxed); }
}
`;
function counted(body) {
  return counter + main(wrapper, body);
}
test("Pending delegato registra il Waker piu recente", () =>
  run(
    counted(`
    let (sender, receiver) = oneshot::channel();
    let mut job = ReceiveJob { receiver };
    let first = Arc::new(Counter::default());
    let second = Arc::new(Counter::default());
    let waker1 = Waker::from(first.clone());
    let waker2 = Waker::from(second.clone());
    assert!(Pin::new(&mut job).poll(&mut Context::from_waker(&waker1)).is_pending());
    assert!(Pin::new(&mut job).poll(&mut Context::from_waker(&waker2)).is_pending());
    let old_wakes = first.0.load(Ordering::Relaxed);
    let new_wakes = second.0.load(Ordering::Relaxed);
    sender.send(Ok(42)).unwrap();
    assert_eq!(first.0.load(Ordering::Relaxed), old_wakes);
    assert!(second.0.load(Ordering::Relaxed) > new_wakes);
    assert_eq!(job.await, Ok(42));
  `),
  ));

test("drop del produttore risveglia un receiver gia Pending", () =>
  run(
    counted(`
    let (sender, receiver) = oneshot::channel();
    let mut job = ReceiveJob { receiver };
    let counter = Arc::new(Counter::default());
    let waker = Waker::from(counter.clone());
    assert!(Pin::new(&mut job).poll(&mut Context::from_waker(&waker)).is_pending());
    let before = counter.0.load(Ordering::Relaxed);
    drop(sender);
    assert!(counter.0.load(Ordering::Relaxed) > before);
    assert_eq!(job.await, Err("producer stopped"));
  `),
  ));

test("Poll map conserva Pending senza invocare la closure", () =>
  run(
    plain(`
    let mapped = std::task::Poll::<u32>::Pending.map(|_| panic!("not ready"));
    assert!(mapped.is_pending());
  `),
  ));

test("boxed: vuoto e Unicode distinguono byte e scalari", () =>
  run(
    main(
      boxed,
      `
    for (text, bytes, chars) in [("", 0, 0), ("Rust", 4, 4), ("\u{1F642}", 4, 1)] {
        assert_eq!(byte_length(text).await, bytes);
        assert_eq!(char_count(text).await, chars);
    }
  `,
    ),
  ));

test("boxed: proprietario pinnato puo muoversi durante Pending", () =>
  run(
    plain(`
    use std::future::Future;
    use std::task::{Context, Waker};
    let (sender, receiver) = tokio::sync::oneshot::channel::<u32>();
    let mut future: std::pin::Pin<Box<dyn Future<Output=u32> + Send>> =
        Box::pin(async move { receiver.await.unwrap() });
    assert!(future.as_mut().poll(&mut Context::from_waker(Waker::noop())).is_pending());
    let moved = future;
    sender.send(42).unwrap();
    assert_eq!(moved.await, 42);
  `),
  ));

test("boxed: prestito impedisce drop anticipato dell'owner", () =>
  run(
    main(
      boxed,
      `
    let text = String::from("borrowed");
    let future = byte_length(&text);
    drop(text);
    assert_eq!(future.await, 8);
  `,
    ),
    { error: "E0505" },
  ));

test("boxed: Send non rende static il prestito per spawn", () =>
  run(
    main(
      boxed,
      `
    let text = String::from("borrowed");
    let task = tokio::spawn(byte_length(&text));
    task.await.unwrap();
  `,
    ),
    { error: "E0597" },
  ));

test("alias locale puo contenere Rc ma spawn richiede Send", () =>
  run(
    main(
      local,
      `
    let task = tokio::spawn(local_value(Rc::new(7)));
    task.await.unwrap();
  `,
    ),
    { error: "E0277" },
  ));

test("LocalSet esegue la future locale in una task separata", () =>
  run(
    main(
      local,
      `
    let set = tokio::task::LocalSet::new();
    let task = set.spawn_local(local_value(Rc::new(7)));
    assert_eq!(set.run_until(task).await.unwrap(), 7);
  `,
    ),
  ));

test("BoxFuture Send non implica Output Send", () =>
  run(
    main(
      boxed,
      `
    let future: BoxFuture<'static, std::rc::Rc<u32>> =
        Box::pin(async { std::rc::Rc::new(7) });
    assert_eq!(*future.await, 7);
  `,
    ),
  ));

test("spawn richiede anche Output Send", () =>
  run(
    main(
      boxed,
      `
    let future: BoxFuture<'static, std::rc::Rc<u32>> =
        Box::pin(async { std::rc::Rc::new(7) });
    tokio::spawn(future).await.unwrap();
  `,
    ),
    { error: "E0277" },
  ));

test("poll_fn conserva stato e lascia al runtime il risveglio", () =>
  run(
    plain(`
    let mut attempts = 0;
    let value = std::future::poll_fn(|cx| {
        attempts += 1;
        if attempts == 1 {
            cx.waker().wake_by_ref();
            std::task::Poll::Pending
        } else {
            std::task::Poll::Ready(42)
        }
    }).await;
    assert_eq!(value, 42);
    assert_eq!(attempts, 2);
  `),
  ));

test("poll_fn del demo gestisce anche la chiusura del canale", () =>
  run(
    source(polling)
      .replace('sender.send(42).expect("receiver dropped");', "drop(sender);")
      .replace("assert_eq!(result, Ok(42));", "assert!(result.is_err());"),
  ));

test("impl Future con due blocchi async distinti non unifica i tipi", () =>
  run(
    `
    use std::future::Future;
    fn choose(flag: bool) -> impl Future<Output=u32> {
        if flag { async { 1 } } else { async { 2 } }
    }
    fn main() {}
  `,
    { error: "E0308" },
  ));

test("un solo blocco async permette la scelta senza boxing", () =>
  run(`
    use std::future::Future;
    fn choose(flag: bool) -> impl Future<Output=u32> {
        async move { if flag { 1 } else { 2 } }
    }
    #[tokio::main(flavor="current_thread")]
    async fn main() {
        assert_eq!(choose(true).await, 1);
        assert_eq!(choose(false).await, 2);
    }
  `));

test("Box di Future Unpin e attendibile senza Pin esplicito", () =>
  run(
    plain(`
    let value = Box::new(std::future::ready(42)).await;
    assert_eq!(value, 42);
  `),
  ));
