import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Embedded Rust.md",
).tree.children.filter((n) => n.type === "code");
const target = "thumbv7em-none-eabi";
const root = fs.realpathSync(os.tmpdir());
let dir;
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-embedded-led-"));
  for (const [file, lang, marker] of [
    ["Cargo.toml", "toml", "[package]"],
    ["src/lib.rs", "rust", "struct Blink"],
    ["tests/blink.rs", "rust", "struct TestPin"],
    ["examples/blink.rs", "rust", "#[entry]"],
    ["memory.x", "ld", "MEMORY"],
    ["build.rs", "rust", "cargo::rustc-link-search"],
    [".cargo/config.toml", "toml", "link-arg"],
  ]) {
    const matches = blocks.filter(
      (b) => b.lang === lang && b.value.includes(marker),
    );
    assert.equal(matches.length, 1, file);
    const out = path.join(dir, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, matches[0].value + "\n");
  }
});
after(() => {
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-embedded-led-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: dir,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
    encoding: "utf8",
    timeout: 240000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status, 0, cmd + ": " + r.stdout + r.stderr);
  return r.stdout;
}
test("OutputPin su host: avvio, errore, ritentativo e livello successivo", () => {
  assert.match(
    run("cargo", ["test", "--test", "blink"]),
    /test retries_same_level \.\.\. ok/,
  );
});
test("ELF Cortex-M: vettori in Flash, stack iniziale e reset Thumb", (t) => {
  run("cargo", [
    "build",
    "--release",
    "--example",
    "blink",
    "--target",
    target,
  ]);
  const elf = path.join(dir, "target", target, "release", "examples", "blink");
  const sysroot = run("rustc", ["--print", "sysroot"]).trim();
  const host = /^host: (.+)$/m.exec(run("rustc", ["-vV"]))[1].trim();
  const llvm = (name) =>
    path.join(
      sysroot,
      "lib",
      "rustlib",
      host,
      "bin",
      name + (process.platform === "win32" ? ".exe" : ""),
    );
  const header = run(llvm("llvm-readobj"), ["--file-headers", elf]);
  assert.match(header, /Machine: EM_ARM/);
  assert.match(header, /Type: Executable/);
  const entry = Number(/Entry: (0x[0-9a-f]+)/i.exec(header)[1]);
  assert.match(
    run(llvm("llvm-objdump"), ["-h", elf]),
    /\.vector_table\s+[0-9a-f]+\s+0*8000000\b/i,
  );
  run(llvm("llvm-objcopy"), [
    "-O",
    "binary",
    "--only-section=.vector_table",
    elf,
    "vectors.bin",
  ]);
  const vectors = fs.readFileSync(path.join(dir, "vectors.bin"));
  const sp = vectors.readUInt32LE(0),
    reset = vectors.readUInt32LE(4);
  assert.equal(sp, 0x20000000 + 96 * 1024);
  assert.equal(reset, entry);
  assert.equal(reset & 1, 1);
  assert.ok(reset >= 0x08000000 + vectors.length && reset < 0x08080000);
  t.diagnostic("SP=0x" + sp.toString(16) + ", reset=0x" + reset.toString(16));
});
