import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Cross-compilation.md",
).tree.children.filter((b) => b.type === "code");
const root = fs.realpathSync(os.tmpdir());
let dir;

function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}

function run(program, args) {
  const r = spawnSync(program, args, {
    cwd: dir,
    env: {
      ...process.env,
      CARGO_TARGET_DIR: path.join(dir, "target"),
      CARGO_NET_OFFLINE: "true",
    },
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  return r.stdout.trim();
}

function example(command) {
  const [program, ...args] = snippet("sh", command).trim().split(/\s+/);
  return run(program, args);
}

before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-rust-cross-"));
  fs.mkdirSync(path.join(dir, "src"));
  fs.mkdirSync(path.join(dir, ".cargo"));
  fs.writeFileSync(
    path.join(dir, "Cargo.toml"),
    '[package]\nname = "cross-demo"\nversion = "0.1.0"\nedition = "2024"\n',
  );
  for (const [file, lang, marker] of [
    ["build.rs", "rust", "cargo:rustc-env"],
    ["src/main.rs", "rust", "env::args"],
    ["run-wasi.mjs", "js", "wasi.start"],
    [".cargo/config.toml", "toml", "target.wasm32-wasip1"],
  ]) {
    fs.writeFileSync(path.join(dir, file), snippet(lang, marker) + "\n");
  }
});

after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-rust-cross-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});

test("la CLI nativa identifica il target predefinito del compilatore", () => {
  const host = /^host: (\S+)/m.exec(example("rustc -vV"))[1];
  assert.equal(run("cargo", ["run", "--", "verifica"]), host + " verifica");
});

test("il controllo per ARM64 Linux non produce l'eseguibile finale", () => {
  example("cargo check --target aarch64-unknown-linux-gnu");
  const out = path.join(dir, "target/aarch64-unknown-linux-gnu/debug");
  assert.ok(fs.statSync(out).isDirectory());
  assert.equal(fs.existsSync(path.join(out, "cross-demo")), false);
});

test("la build produce un comando WASI Preview 1 con entry point", () => {
  example("cargo build --target wasm32-wasip1");
  const bytes = fs.readFileSync(
    path.join(dir, "target/wasm32-wasip1/debug/cross-demo.wasm"),
  );
  const mod = new WebAssembly.Module(bytes);
  assert.ok(
    WebAssembly.Module.imports(mod).some(
      (i) => i.module === "wasi_snapshot_preview1",
    ),
  );
  assert.ok(
    WebAssembly.Module.exports(mod).some(
      (e) => e.kind === "function" && e.name === "_start",
    ),
  );
});

test("Cargo avvia il runner e inoltra gli argomenti alla CLI WASI", () => {
  assert.equal(
    example("cargo run --target wasm32-wasip1"),
    "wasm32-wasip1 verifica",
  );
});
