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
const notePath =
  "Programmazione/Rust/Pagine/Runtime async Tokio e async-std.md";
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
const prefix = "appunti-rust-runtime-";
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
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUST_MIN_STACK$|TOKIO_|ASYNC_)/i.test(
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
    process.env.RUST_RUNTIME_TEST_CARGO_HOME || path.join(root, "cargo-home"),
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

let sequence = 0;
const libraries = new Map();
const setupErrors = new Map();
// Non esporre il GCC parziale della toolchain Rust come compilatore di sistema.
if (process.env.RUST_RUNTIME_TEST_TOOLS_BIN) {
  const bin = path.resolve(process.env.RUST_RUNTIME_TEST_TOOLS_BIN);
  for (const name of ["dlltool.exe", "as.exe"])
    assert.ok(fs.existsSync(path.join(bin, name)), "Missing tool: " + name);
  const key =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  env[key] = bin + path.delimiter + (env[key] || "");
}
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
function prepare(kind = "tokio") {
  if (libraries.has(kind)) return libraries.get(kind);
  if (setupErrors.has(kind)) throw setupErrors.get(kind);
  try {
    const crate = kind === "legacy" ? "async_std" : "tokio";
    let manifest = source(
      kind === "legacy"
        ? "Cargo.toml per il confronto legacy"
        : "Cargo.toml per Tokio",
    );
    if (kind === "no-time") manifest = manifest.replace(', "time"', "");
    const project = path.join(root, "dependency-" + kind);
    const target = path.join(root, "target-" + kind);
    const overrides = { CARGO_TARGET_DIR: target };
    fs.mkdirSync(path.join(project, "src"), { recursive: true });
    fs.writeFileSync(path.join(project, "Cargo.toml"), manifest);
    fs.writeFileSync(path.join(project, "src/main.rs"), "fn main() {}\n");
    ok(
      launch(
        tool("cargo"),
        ["fetch"],
        project,
        {
          ...overrides,
          CARGO_NET_OFFLINE:
            process.env.RUST_RUNTIME_TEST_FETCH === "1" ? "false" : "true",
          CARGO_NET_RETRY: "0",
          CARGO_HTTP_TIMEOUT: "30",
        },
        180000,
      ),
    );
    const metadata = JSON.parse(
      ok(
        launch(
          tool("cargo"),
          ["metadata", "--format-version=1", "--locked", "--offline"],
          project,
          overrides,
        ),
      ).stdout,
    );
    const versions = metadata.packages
      .filter((p) => p.source)
      .map((p) => p.name + "@" + p.version)
      .sort();
    assert.ok(
      versions.includes(
        kind === "legacy" ? "async-std@1.13.2" : "tokio@1.54.1",
      ),
    );
    console.log(kind + " dependency baseline: " + versions.join(", "));
    ok(
      launch(
        tool("cargo"),
        ["build", "--locked", "--offline"],
        project,
        overrides,
        180000,
      ),
    );
    const dir = path.join(target, "debug", "deps");
    const names = fs
      .readdirSync(dir)
      .filter((n) => new RegExp("^lib" + crate + "-[a-f0-9]+[.]rlib$").test(n));
    assert.equal(names.length, 1);
    const prepared = { crate, dir, library: path.join(dir, names[0]) };
    libraries.set(kind, prepared);
    return prepared;
  } catch (error) {
    setupErrors.set(kind, error);
    throw error;
  }
}
function run(code, options = {}) {
  const dep = prepare(options.kind);
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
      dep.crate + "=" + dep.library,
      "-L",
      "dependency=" + dep.dir,
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
  const result = launch(executable, [], dir, options.env || {});
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
function plain(body) {
  return (
    '#[tokio::main(flavor="current_thread")]\nasync fn main() {\n' +
    body +
    "\n}"
  );
}
const multi = "Task concorrenti con timer";
const builder = "Builder e confine sincrono";
const local = "LocalSet per una task con Rc";
const legacy = "Esempio async-std esistente";

test("baseline e inventario: due manifest e sette programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 9);
  prepare();
  prepare("legacy");
});
test("YAML invariato, struttura e stato legacy documentato", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Runtime async: Tokio e async-std",
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
  assert.match(note.source, /dismesso/);
  assert.match(note.source, /https:\/\/github.com\/async-rs\/async-std/);
});
for (const name of [multi, builder, local])
  test("programma originale: " + name, () => run(source(name)));
test("programma originale legacy", () =>
  run(source(legacy), { kind: "legacy" }));
test("driver time mancante: panic atteso", () =>
  run(source("Timer senza driver"), { panic: /timers are disabled/ }));
test("timer costruito fuori contesto: panic atteso", () =>
  run(source("Timer costruito fuori dal contesto"), {
    panic: /no reactor running|outside the context/,
  }));
test("block_on annidato: panic atteso", () =>
  run(source("Block_on annidato nel runtime"), {
    panic: /Cannot start a runtime from within a runtime/,
  }));

test("correzione driver: enable_all", () =>
  run(
    source("Timer senza driver").replace(
      "Builder::new_current_thread().build()",
      "Builder::new_current_thread().enable_all().build()",
    ),
  ));
test("correzione contesto: costruzione differita del timer", () =>
  run(
    source("Timer costruito fuori dal contesto").replace(
      "runtime.block_on(sleep(Duration::from_millis(1)));",
      "runtime.block_on(async { sleep(Duration::from_millis(1)).await });",
    ),
  ));
test("correzione block_on: await nel contesto async", () =>
  run(
    source("Block_on annidato nel runtime").replace(
      "let _ = handle.block_on(async { 42 });",
      "let result = async { 42 }.await; assert_eq!(result, 42);",
    ),
  ));

test("enable_all non abilita la feature Cargo time", () =>
  run("use tokio::time::sleep; fn main() { let _ = sleep; }", {
    kind: "no-time",
    error: "E0432",
  }));
test("runtime senza time puo eseguire future senza timer", () =>
  run(
    "fn main() { let rt=tokio::runtime::Builder::new_current_thread().enable_all().build().unwrap(); assert_eq!(rt.block_on(async {42}),42); }",
    { kind: "no-time" },
  ));
test("macro multi-thread configurata realmente con due worker", () =>
  run(
    source(multi).replace(
      "let first = tokio::spawn(do_work(10));",
      "assert_eq!(tokio::runtime::Handle::current().metrics().num_workers(), 2);\n    let first = tokio::spawn(do_work(10));",
    ),
  ));

test("multi-thread avanza una task senza Runtime block_on", () =>
  run(`
  use std::sync::mpsc;
  use std::time::Duration;
  fn main() {
    let caller=std::thread::current().id();
    let runtime=tokio::runtime::Builder::new_multi_thread().worker_threads(2).build().unwrap();
    let (sender, receiver)=mpsc::channel();
    let task=runtime.spawn(async move {
      tokio::task::yield_now().await;
      sender.send(std::thread::current().id()).unwrap();
      42
    });
    let worker=receiver.recv_timeout(Duration::from_secs(10)).unwrap();
    assert_ne!(worker,caller);
    assert_eq!(runtime.block_on(task).unwrap(),42);
  }
`));
test("current-thread e contesto enter non avviano task da soli", () =>
  run(`
  fn main() {
    use tokio::runtime::{Builder,Handle};
    assert!(Handle::try_current().is_err());
    let runtime=Builder::new_current_thread().build().unwrap();
    let task={
      let _guard=runtime.enter();
      assert!(Handle::try_current().is_ok());
      tokio::spawn(async { 42 })
    };
    assert!(Handle::try_current().is_err());
    assert!(!task.is_finished());
    assert_eq!(runtime.block_on(task).unwrap(),42);
  }
`));
test("future radice di block_on accetta Rc e prestito locale", () =>
  run(`
  fn main() {
    let runtime=tokio::runtime::Builder::new_current_thread().build().unwrap();
    let text=std::rc::Rc::new(String::from("local"));
    let result=runtime.block_on(async {
      tokio::task::yield_now().await;
      text.len()
    });
    assert_eq!(result,5);
    assert_eq!(*text,"local");
  }
`));
test("spawn su current-thread rifiuta Rc non Send", () =>
  run(
    plain(`
  let value=std::rc::Rc::new(42);
  tokio::spawn(async move { *value }).await.unwrap();
`),
    { errorText: /future cannot be sent between threads safely/ },
  ));
test("spawn_local senza contesto locale produce panic", () =>
  run(
    plain(`
  tokio::task::spawn_local(async {42}).await.unwrap();
`),
    { panic: /spawn_local.*outside|outside.*LocalSet/ },
  ));
test("spawn_local mantiene il requisito static", () =>
  run(
    plain(`
  let value=String::from("local");
  let borrowed=&value;
  tokio::task::LocalSet::new().run_until(async {
    tokio::task::spawn_local(async move {borrowed.len()}).await.unwrap();
  }).await;
`),
    { error: "E0597" },
  ));
test("run_until non attende tutte le task locali", () =>
  run(
    plain(`
  let local=tokio::task::LocalSet::new();
  let (sender, receiver)=tokio::sync::oneshot::channel::<u32>();
  let task=local.spawn_local(async move {receiver.await.unwrap()});
  local.run_until(async {}).await;
  assert!(!task.is_finished());
  sender.send(42).unwrap();
  assert_eq!(local.run_until(task).await.unwrap(),42);
`),
  ));
test("spawn_blocking usa un altro thread anche con current-thread", () =>
  run(
    plain(`
  let caller=std::thread::current().id();
  let worker=tokio::task::spawn_blocking(||std::thread::current().id()).await.unwrap();
  assert_ne!(caller,worker);
`),
  ));
test("Handle clonato non impedisce lo shutdown del proprietario", () =>
  run(`
  fn main() {
    let rt=tokio::runtime::Builder::new_current_thread().build().unwrap();
    let handle=rt.handle().clone();
    let task=handle.spawn(std::future::pending::<u32>());
    drop(rt);
    let other=tokio::runtime::Builder::new_current_thread().build().unwrap();
    assert!(other.block_on(task).unwrap_err().is_cancelled());
    drop(handle);
  }
`));
test("drop runtime distrugge catture di task non completata", () =>
  run(`
  use std::sync::{Arc,atomic::{AtomicBool,Ordering}};
  struct Guard(Arc<AtomicBool>);
  impl Drop for Guard {fn drop(&mut self){self.0.store(true,Ordering::SeqCst);}}
  fn main() {
    let flag=Arc::new(AtomicBool::new(false));
    let guard=Guard(flag.clone());
    let rt=tokio::runtime::Builder::new_current_thread().build().unwrap();
    let task=rt.spawn(async move {
      let _guard=guard;
      std::future::pending::<()>().await;
    });
    drop(rt);
    assert!(flag.load(Ordering::SeqCst));
    drop(task);
  }
`));
test("Tokio JoinHandle distingue errore di task e Result applicativo", () =>
  run(
    plain(`
  let result=tokio::spawn(async {Err::<u32,_>("invalid")}).await.unwrap();
  assert_eq!(result,Err("invalid"));
  std::panic::set_hook(Box::new(|_|{}));
  let error=tokio::spawn(async {panic!("worker");}).await.unwrap_err();
  assert!(error.is_panic());
`),
  ));
test("async-std block_on alternativo alla macro", () =>
  run(
    `
  fn main() {
    let result=async_std::task::block_on(async {
      async_std::task::sleep(std::time::Duration::from_millis(1)).await;
      42
    });
    assert_eq!(result,42);
  }
`,
    { kind: "legacy" },
  ));
test("async-std JoinHandle restituisce direttamente Result applicativo", () =>
  run(
    `
  #[async_std::main]
  async fn main(){
    let result=async_std::task::spawn(async {Err::<u32,_>("invalid")}).await;
    assert_eq!(result,Err("invalid"));
  }
`,
    { kind: "legacy" },
  ));
test("async-std spawn rifiuta Rc non Send", () =>
  run(
    `
  #[async_std::main]
  async fn main(){
    let value=std::rc::Rc::new(42);
    let _=async_std::task::spawn(async move {*value}).await;
  }
`,
    {
      kind: "legacy",
      errorText: /future cannot be sent between threads safely/,
    },
  ));
test("future standard non dipendente dal runtime su async-std", () =>
  run(
    `
  fn main(){ assert_eq!(async_std::task::block_on(std::future::ready(42)),42); }
`,
    { kind: "legacy" },
  ));
