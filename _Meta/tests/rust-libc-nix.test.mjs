import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/libc e nix.md",
).tree.children.filter((n) => n.type === "code");
const win = process.platform === "win32";
const cross = process.env.RUST_UNIX_CHECK_TARGET;

function run(dir, cmd, args, success = true) {
  const r = spawnSync(cmd, args, {
    cwd: dir,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
    encoding: "utf8",
    timeout: 180000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, success, r.stdout + r.stderr);
  return r;
}

test("crate dagli esempi libc e nix", async (t) => {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rust-libc-nix-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rust-libc-nix-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  for (const [file, lang, marker] of [
    ["Cargo.toml", "toml", "[package]"],
    ["examples/pid.rs", "rust", "fn main()"],
    ["src/lib.rs", "rust", "pub fn position_raw"],
    ["tests/position.rs", "rust", "fn pipe_is_open"],
  ]) {
    const hits = blocks.filter(
      (b) => b.lang === lang && b.value.includes(marker),
    );
    assert.equal(hits.length, 1, file);
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), hits[0].value + "\n");
  }
  await t.test(
    "il PID stampato coincide con quello del processo avviato",
    () => {
      run(dir, "cargo", ["build", "--example", "pid"]);
      const r = run(
        dir,
        path.join(dir, "target", "debug", "examples", win ? "pid.exe" : "pid"),
        [],
      );
      assert.equal(r.stdout.trim(), String(r.pid));
    },
  );
  await t.test(
    "file e pipe: esecuzione Unix nativa",
    { skip: win && "host Windows" },
    () => {
      const r = run(dir, "cargo", ["test", "--test", "position"]);
      assert.match(r.stdout, /2 passed; 0 failed; 0 ignored/);
    },
  );
  await t.test(
    "verifica tipi ed esempi per il target richiesto",
    { skip: !cross },
    () => {
      const cfg = run(dir, "rustc", ["--print", "cfg", "--target", cross]);
      assert.match(cfg.stdout, /^unix\r?$/m, "Serve un target Unix");
      run(dir, "cargo", ["check", "--all-targets", "--target", cross]);
    },
  );
  await t.test(
    "getpid e lseek richiedono le due feature dichiarate",
    { skip: win && !cross },
    () => {
      const manifest = path.join(dir, "Cargo.toml");
      const original = fs.readFileSync(manifest, "utf8");
      for (const [keep, item, args] of [
        ["fs", "getpid", ["--example", "pid"]],
        ["process", "lseek", ["--lib"]],
      ]) {
        const reduced = original.replace(
          '["process", "fs"]',
          JSON.stringify([keep]),
        );
        assert.notEqual(reduced, original);
        fs.writeFileSync(manifest, reduced);
        const r = run(
          dir,
          "cargo",
          ["check", ...args, ...(cross ? ["--target", cross] : [])],
          false,
        );
        assert.ok(
          r.stderr.includes(item) &&
            /configured out|gated behind/.test(r.stderr),
          r.stderr,
        );
      }
    },
  );
});
