import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = (name) => parseNote("Programmazione/Rust/Pagine/" + name + ".md")
  .tree.children.filter((n) => n.type === "code").map((n) => n.value);
function one(source, prefix) {
  const matches = source.filter((b) => b.startsWith(prefix));
  assert.equal(matches.length, 1, prefix);
  return matches[0];
}
const rtic = blocks("RTIC"), log = blocks("defmt"), board = blocks("Embedded Rust");
const src = one(rtic, "#![no_std]"), file = "src/bin/rtic-burst.rs";
const args = one(rtic, "cargo build ").split(" ").slice(1);
const root = fs.realpathSync(os.tmpdir());
let dir;
function write(file, contents) {
  const dest = path.join(dir, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents + "\n");
}
function run(cmd, args, error) {
  const r = spawnSync(cmd, args, { cwd: dir, windowsHide: true, timeout: 240000, encoding: "utf8",
    env: { ...process.env, DEFMT_LOG: "info", CARGO_TARGET_DIR: path.join(dir, "target") } });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  if (error) {
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, error);
  } else assert.equal(r.status, 0, r.stderr + r.stdout);
  return r.stdout;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-rtic-"));
  const deps = one(rtic, "[dependencies]");
  write("Cargo.toml", one(log, "[package]").replace(/\[dependencies\][\s\S]*?(?=\n\[profile)/, deps + "\n"));
  write(".cargo/config.toml", one(log, "[target."));
  write("src/main.rs", one(log, "#![no_std]") + "\n" + one(rtic, "use stm32f4 as _;"));
  write("build.rs", one(board, "fn main() {\n    println!"));
  write("memory.x", one(board, "MEMORY"));
  write(file, src);
  assert.deepEqual(args, ["build", "--release", "--bin", "rtic-burst", "--target", "thumbv7em-none-eabi"]);
  run("cargo", args);
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-rtic-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("ELF STM32F401: vettori EXTI0 e USART2 associati a due gestori distinti", () => {
  const elf = path.join(dir, one(rtic, "probe-rs run ").split(" ").at(-1));
  const host = /^host: (.+)$/m.exec(run("rustc", ["-vV"]))[1].trim();
  const bin = path.join(run("rustc", ["--print", "sysroot"]).trim(), "lib", "rustlib", host, "bin");
  const llvm = (cmd) => path.join(bin, cmd + (process.platform === "win32" ? ".exe" : ""));
  run(llvm("llvm-objcopy"), ["-O", "binary", "--only-section=.vector_table", elf, "vectors.bin"]);
  const vectors = fs.readFileSync(path.join(dir, "vectors.bin"));
  const table = run(llvm("llvm-objdump"), ["-t", elf]);
  function address(label) {
    const row = table.split(/\r?\n/).find((s) => s.trim().split(/\s+/).at(-1) === label);
    assert.ok(row, label);
    return parseInt(row.trim().split(/\s+/)[0], 16) | 1;
  }
  for (const [irq, label] of [[6, "EXTI0"], [38, "USART2"]]) {
    const ptr = vectors.readUInt32LE(4 * (16 + irq));
    assert.equal(ptr, address(label));
    assert.notEqual(ptr, address("DefaultHandler"));
  }
  assert.notEqual(address("EXTI0"), address("USART2"));
  assert.ok(table.includes("id={=u32} dropped={=u32}"));
});
test("Il firmware reading-log originale collega ancora con il manifest RTIC", () => {
  run("cargo", ["build", "--release", "--bin", "reading-log", "--target", "thumbv7em-none-eabi"]);
});
function reject(change, replacement, diagnostic) {
  assert.ok(src.includes(change));
  write(file, src.replace(change, replacement));
  try { run("cargo", ["check", ...args.slice(1)], diagnostic); }
  finally { write(file, src); }
}
test("Un task software v2 senza async viene rifiutato", () => {
  reject("async fn report", "fn report", /this task handler must have type signature `async fn/);
});
test("Il dispatcher non può coincidere con il vettore del task hardware", () => {
  reject("dispatchers = [USART2]", "dispatchers = [EXTI0]", /dispatcher interrupts can't be used as hardware tasks/);
});
test("La risorsa locale non può appartenere contemporaneamente a due task", () => {
  reject("priority = 1, shared = [dropped]", "priority = 1, local = [sequence], shared = [dropped]",
    /Local resource "sequence" is used by multiple tasks/);
});
