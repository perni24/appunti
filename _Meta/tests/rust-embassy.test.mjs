import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Embassy.md").tree.children.filter((b) => b.type === "code");
function block(prefix) {
  const matches = blocks.filter((b) => b.value.startsWith(prefix));
  assert.equal(matches.length, 1, prefix);
  return matches[0].value;
}
const root = fs.realpathSync(os.tmpdir()), target = "thumbv7em-none-eabi";
const manifest = block("[package]"), producer = block("use embassy_sync"), args = block("cargo build ").split(" ").slice(1);
let dir, fw, host;
function put(base, file, source) {
  const dest = path.join(base, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, source + "\n");
}
function run(cmd, args, { cwd = fw, fails, timeout = 240000 } = {}) {
  const r = spawnSync(cmd, args, { cwd, env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
    windowsHide: true, timeout, encoding: "utf8" });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  if (fails) {
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, fails);
  } else assert.equal(r.status, 0, r.stderr + r.stdout);
  return r.stdout;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-embassy-"));
  fw = path.join(dir, "fw");
  host = path.join(dir, "host");
  put(fw, "Cargo.toml", manifest);
  put(fw, ".cargo/config.toml", block("[target."));
  put(fw, "src/main.rs", block("#![no_std]"));
  put(fw, "src/levels.rs", producer);
  assert.deepEqual(args, ["build", "--release", "--target", target]);
  run("cargo", args);
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-embassy-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("Firmware ARM: TIM2 punta al gestore del driver, non a DefaultHandler", () => {
  const elf = path.join(dir, block("probe-rs run ").split(" ").at(-1));
  const triple = /^host: (.+)$/m.exec(run("rustc", ["-vV"]))[1].trim();
  const bin = path.join(run("rustc", ["--print", "sysroot"]).trim(), "lib", "rustlib", triple, "bin");
  const llvm = (tool) => path.join(bin, tool + (process.platform === "win32" ? ".exe" : ""));
  const table = run(llvm("llvm-objdump"), ["-t", elf]);
  function symbol(label) {
    const row = table.split(/\r?\n/).find((line) => line.trim().split(/\s+/).at(-1) === label);
    assert.ok(row, label);
    return parseInt(row.trim().split(/\s+/)[0], 16) | 1;
  }
  run(llvm("llvm-objcopy"), ["-O", "binary", "--only-section=.vector_table", elf, "vectors.bin"]);
  const ptr = fs.readFileSync(path.join(fw, "vectors.bin")).readUInt32LE(4 * (16 + 28));
  assert.equal(ptr, symbol("TIM2"));
  assert.notEqual(ptr, symbol("DefaultHandler"));
});

test("Executor host: scadenza, pool occupato e produttore sospeso se il canale è pieno", () => {
  put(host, "Cargo.toml", `[package]
name = "check-levels"
version = "0.1.0"
edition = "2024"
[dependencies]
critical-section = { version = "1", features = ["std"] }
embassy-executor = { version = "=0.10.0", features = ["platform-std", "executor-thread"] }
embassy-futures = "0.1"
embassy-sync = "=0.8.0"
embassy-time = { version = "=0.5.1", features = ["mock-driver"] }`);
  put(host, "src/levels.rs", producer);
  put(host, "src/main.rs", `mod levels;
use embassy_executor::{Spawner, SpawnError};
use embassy_futures::yield_now;
use embassy_time::{Duration, MockDriver};
use levels::{LEVELS, produce};

async fn advance(ms: u64) {
    MockDriver::get().advance(Duration::from_millis(ms));
    yield_now().await;
    yield_now().await;
}

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    spawner.spawn(produce().unwrap());
    assert!(matches!(produce(), Err(SpawnError::Busy)));
    advance(0).await;
    advance(249).await;
    assert!(LEVELS.try_receive().is_err());
    advance(1).await;
    assert!(LEVELS.is_full());
    advance(250).await; // il secondo invio è sospeso: il primo è ancora nel canale
    advance(1000).await;
    assert_eq!(LEVELS.try_receive().unwrap(), true);
    advance(0).await;
    assert_eq!(LEVELS.try_receive().unwrap(), false);
    advance(249).await;
    assert!(LEVELS.try_receive().is_err());
    advance(1).await;
    assert_eq!(LEVELS.try_receive().unwrap(), true);
    println!("true false true");
    std::process::exit(0);
}`);
  run("cargo", ["build"], { cwd: host });
  const exe = path.join(dir, "target", "debug", "check-levels" + (process.platform === "win32" ? ".exe" : ""));
  assert.equal(run(exe, [], { cwd: host, timeout: 5000 }).trim(), "true false true");
});
test("Senza il driver del tempo, il link non produce un firmware eseguibile", () => {
  const noDriver = manifest.replace(', "time-driver-tim2"', "");
  assert.notEqual(noDriver, manifest);
  put(fw, "Cargo.toml", noDriver);
  try { run("cargo", args, { fails: /undefined symbol: _embassy_time_(now|schedule_wake)/ }); }
  finally { put(fw, "Cargo.toml", manifest); }
});
