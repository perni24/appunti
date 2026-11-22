import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = (name) => parseNote("Programmazione/Rust/Pagine/" + name + ".md")
  .tree.children.filter((b) => b.type === "code");
const timer = blocks("cortex-m"), board = blocks("Embedded Rust");
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-cortex-tick-";
const target = "thumbv7em-none-eabi";
let dir;
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  for (const [file, source, lang, marker] of [
    ["Cargo.toml", timer, "toml", "[package]"],
    ["src/lib.rs", timer, "rust", "fn reload_for"],
    ["examples/tick.rs", timer, "rust", "#[entry]"],
    ["memory.x", board, "ld", "MEMORY"],
    ["build.rs", board, "rust", "cargo::rustc-link-search"],
    [".cargo/config.toml", board, "toml", "link-arg"],
  ]) {
    const matches = source.filter((b) => b.lang === lang && b.value.includes(marker));
    assert.equal(matches.length, 1, file);
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), matches[0].value + "\n");
  }
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: dir, env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
    encoding: "utf8", windowsHide: true, timeout: 180000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, [cmd, ...args, r.stderr, r.stdout].join(" "));
  return r.stdout;
}
test("LOAD: periodo richiesto, limiti a 24 bit e frequenze non valide", () => {
  assert.match(run("cargo", ["test", "--lib"]), /exact_period_and_limits \.\.\. ok/);
});
test("Cortex-M0: il codice del gestore non richiede istruzioni del Cortex-M4", () => {
  run("cargo", ["check", "--example", "tick", "--target", "thumbv6m-none-eabi"]);
});
function readVector(example) {
  run("cargo", ["build", "--release", "--example", example, "--target", target]);
  const elf = path.join(dir, "target", target, "release", "examples", example);
  const sysroot = run("rustc", ["--print", "sysroot"]).trim();
  const host = /^host: (.+)$/m.exec(run("rustc", ["-vV"]))[1].trim();
  const llvm = (name) => path.join(sysroot, "lib", "rustlib", host, "bin",
    name + (process.platform === "win32" ? ".exe" : ""));
  run(llvm("llvm-objcopy"), ["-O", "binary", "--only-section=.vector_table", elf, "vec.bin"]);
  const vectors = fs.readFileSync(path.join(dir, "vec.bin"));
  const table = run(llvm("llvm-objdump"), ["-t", elf]);
  const addr = (label) => {
    const row = table.split(/\r?\n/).find((line) => line.trim().split(/\s+/).at(-1) === label);
    assert.ok(row, label);
    return parseInt(row.trim().split(/\s+/)[0], 16) & ~1;
  };
  const raw = vectors.readUInt32LE(15 * 4);
  assert.equal(raw & 1, 1);
  return { handler: raw & ~1, systick: addr("SysTick"), fallback: addr("DefaultHandler") };
}
test("Cortex-M4: il vettore 15 punta al gestore SysTick della nota", () => {
  const { handler, systick, fallback } = readVector("tick");
  assert.equal(handler, systick);
  assert.notEqual(handler, fallback);
});
test("Controprova: una funzione SysTick senza attributo non sostituisce DefaultHandler", () => {
  const source = fs.readFileSync(path.join(dir, "examples/tick.rs"), "utf8");
  assert.ok(source.includes("#[exception]\nfn SysTick()"));
  fs.writeFileSync(path.join(dir, "examples/plain.rs"), source.replace("#[exception]\n", ""));
  const { handler, fallback } = readVector("plain");
  assert.equal(handler, fallback);
});
