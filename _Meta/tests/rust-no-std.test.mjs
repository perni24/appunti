import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/no_std.md",
).tree.children.filter((n) => n.type === "code");
const target = "thumbv7em-none-eabi";
const root = fs.realpathSync(os.tmpdir());
let dir;
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-rust-no-std-"));
  for (const [file, lang, marker] of [
    ["Cargo.toml", "toml", "[package]"],
    ["src/lib.rs", "rust", "#![cfg_attr"],
    ["tests/checksum.rs", "rust", "fn core_checksum()"],
  ]) {
    const matches = blocks.filter(
      (b) => b.lang === lang && b.value.includes(marker),
    );
    assert.equal(matches.length, 1, file);
    const dest = path.join(dir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, matches[0].value + "\n");
  }
});
after(() => {
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-rust-no-std-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function cargo(args, reject = false) {
  const r = spawnSync("cargo", args, {
    cwd: dir,
    env: {
      ...process.env,
      CARGO_NET_OFFLINE: "true",
      CARGO_TARGET_DIR: path.join(dir, "target"),
    },
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, !reject, r.stdout + r.stderr);
  return r;
}

for (const [mode, flags, count] of [
  ["core", ["--no-default-features"], 1],
  ["alloc", ["--no-default-features", "--features", "alloc"], 2],
  ["std", [], 3],
]) {
  test("test nativi pubblicati: " + mode, () => {
    const { stdout } = cargo(["test", "--test", "checksum", ...flags]);
    assert.ok(stdout.includes(count + " passed; 0 failed; 0 ignored"), stdout);
  });
}
for (const [mode, flags] of [
  ["core", []],
  ["alloc", ["--features", "alloc"]],
]) {
  test("build rlib bare-metal: " + mode, () => {
    const { stdout } = cargo([
      "build",
      "--lib",
      "--target",
      target,
      "--no-default-features",
      ...flags,
      "--message-format=json",
    ]);
    const artifacts = stdout.trim().split(/\r?\n/).map(JSON.parse);
    const compiled = artifacts.find(
      (e) =>
        e.reason === "compiler-artifact" && e.target.name === "checksum_notes",
    );
    assert.ok(
      compiled?.filenames.some((f) => f.endsWith(".rlib") && fs.existsSync(f)),
      stdout,
    );
  });
}
test("il target bare-metal non fornisce std", () => {
  const { stdout } = cargo(
    ["check", "--lib", "--target", target, "--message-format=json"],
    true,
  );
  const diagnostics = stdout.trim().split(/\r?\n/).map(JSON.parse);
  assert.ok(
    diagnostics.some(
      (e) =>
        e.message?.code?.code === "E0463" && e.message.message.includes("std"),
    ),
    stdout,
  );
});
