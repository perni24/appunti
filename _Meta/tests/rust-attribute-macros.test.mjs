import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const note = parseNote("Programmazione/Rust/Pagine/Attribute macros.md");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = node.children[0].value;
  if (node.type === "code" && ["rust", "toml"].includes(node.lang)) {
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value);
  }
}
const root = fs.realpathSync(os.tmpdir());
const prefix = "appunti-attribute-macros-";
const project = fs.mkdtempSync(path.join(root, prefix));
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const cargo = path.isAbsolute(rustc)
  ? path.join(
      path.dirname(rustc),
      process.platform === "win32" ? "cargo.exe" : "cargo",
    )
  : "cargo";
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_)/i.test(key)) delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  CARGO_HOME:
    process.env.RUST_PROC_TEST_CARGO_HOME || path.join(project, "cargo-home"),
  CARGO_TARGET_DIR: path.join(project, "target"),
  CARGO_NET_OFFLINE: "true",
});
if (process.env.RUST_PROC_TEST_TOOLS_BIN) {
  const key =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  env[key] = process.env.RUST_PROC_TEST_TOOLS_BIN + path.delimiter + env[key];
}
function invoke(args) {
  const r = spawnSync(cargo, [...args, "--offline"], {
    cwd: project,
    env,
    timeout: 180000,
    encoding: "utf8",
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
before(() => {
  for (const name of ["config", "config.toml"]) {
    assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, name)));
    for (let dir = project; ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, ".cargo", name)));
      if (dir === path.dirname(dir)) break;
    }
  }
  assert.deepEqual(
    [...blocks.keys()],
    ["Cargo.toml", "src/lib.rs", "examples/counter.rs"],
  );
  for (const [name, code] of blocks) {
    const file = path.join(project, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, code);
  }
  ok(invoke(["generate-lockfile"]));
});
after(() => {
  const dir = fs.realpathSync(project);
  assert.equal(path.dirname(dir), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, force: true });
});
function example(code) {
  fs.writeFileSync(path.join(project, "examples/probe.rs"), code);
  return ok(invoke(["run", "--quiet", "--locked", "--example", "probe"]));
}
test("esempio della nota: successo, ? e return", () => {
  ok(invoke(["check", "--locked", "--example", "counter"]));
  assert.equal(
    ok(invoke(["run", "--quiet", "--locked", "--example", "counter"])).stdout,
    "",
  );
});
test("async: nessun effetto prima del poll, nessuna ripetizione dopo Pending", () => {
  example(`use std::{future::{Future, poll_fn}, pin::pin, task::{Context, Poll, Waker}};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};
static N: AtomicUsize = AtomicUsize::new(0);
fn record() { N.fetch_add(1, Relaxed); }
#[entry_hook::on_entry(crate::record)]
async fn f() -> u8 {
    let mut first = true;
    poll_fn(|_| if std::mem::take(&mut first) { Poll::Pending } else { Poll::Ready(()) }).await;
    7
}
fn main() {
    drop(f());
    let mut future = pin!(f());
    let mut cx = Context::from_waker(Waker::noop());
    assert_eq!(N.load(Relaxed), 0);
    assert_eq!(future.as_mut().poll(&mut cx), Poll::Pending);
    assert_eq!(N.load(Relaxed), 1);
    assert_eq!(future.as_mut().poll(&mut cx), Poll::Ready(7));
    assert_eq!(N.load(Relaxed), 1);
}`);
});
test("due inserzioni in testa: ordine runtime inverso, firma pubblica conservata", () => {
  const r = example(`fn outer() { print!("A"); } fn inner() { print!("B"); }
mod m {
    #[entry_hook::on_entry(crate::outer)]
    #[entry_hook::on_entry(crate::inner)]
    pub fn work(outer: &str) -> &str { print!("C"); outer }
}
fn main() { assert_eq!(m::work("ok"), "ok"); }`);
  assert.equal(r.stdout, "BAC");
});
test("panic dell'hook precede gli effetti del corpo", () => {
  example(`fn record() { panic!("stop"); }
#[entry_hook::on_entry(record)]
fn work(n: &mut u8) { *n += 1; }
fn main() { let mut n = 0; assert!(std::panic::catch_unwind(
    std::panic::AssertUnwindSafe(|| work(&mut n))).is_err()); assert_eq!(n, 0); }`);
});
for (const [name, body, expected] of [
  ["argomento assente", "#[on_entry] fn f() {}", /expected/],
  [
    "chiamata anziche percorso",
    "#[on_entry(record())] fn f() {}",
    /unexpected token/,
  ],
  ["due percorsi", "#[on_entry(record, record)] fn f() {}", /unexpected token/],
  [
    "argomenti generici espliciti",
    "#[on_entry(record::<u8>)] fn f() {}",
    /expected|unexpected/,
  ],
  ["struct non supportata", "#[on_entry(record)] struct Item;", /expected.*fn/],
  [
    "funzione const",
    "#[on_entry(record)] const fn f() {}",
    /on_entry does not support const fn/,
  ],
  ["percorso non risolto", "#[on_entry(missing)] fn f() {}", "E0425"],
  [
    "argomenti richiesti dall'hook",
    "fn hook(_:u8) {} #[on_entry(hook)] fn f() {}",
    "E0061",
  ],
  [
    "risultato non unit",
    "fn hook()->u8 {1} #[on_entry(hook)] fn f() {}",
    "E0308",
  ],
  [
    "nome nascosto dal parametro",
    "#[on_entry(record)] fn f(record:u8) {}",
    "E0618",
  ],
  [
    "deprecated non rimosso",
    "#[on_entry(record)] #[deprecated] fn f() {} #[deny(deprecated)] fn g(){f();}",
    /deprecated function/,
  ],
])
  test(name, () => {
    fs.writeFileSync(
      path.join(project, "examples/probe.rs"),
      "use entry_hook::on_entry; fn record() {}\n" + body + "\nfn main() {}",
    );
    const r = invoke([
      "check",
      "--locked",
      "--example",
      "probe",
      "--message-format=json",
    ]);
    assert.notEqual(r.status, 0);
    const errors = r.stdout
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map(JSON.parse)
      .filter(
        (m) => m.reason === "compiler-message" && m.message.level === "error",
      )
      .map((m) => m.message);
    assert.ok(
      errors.some(
        (m) =>
          (typeof expected === "string"
            ? m.code?.code === expected
            : expected.test(m.message)) &&
          m.spans.some(
            (s) =>
              s.is_primary &&
              s.file_name.replaceAll("\\", "/").endsWith("examples/probe.rs"),
          ),
      ),
      r.stdout + r.stderr,
    );
  });
