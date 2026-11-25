import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const parent = fs.realpathSync(os.tmpdir());
let root;
before(() => {
  root = fs.mkdtempSync(path.join(parent, "rust-memo-sistema-"));
});
after(() => {
  if (!root) return;
  assert.equal(path.dirname(fs.realpathSync(root)), parent);
  assert.ok(path.basename(root).startsWith("rust-memo-sistema-"));
  fs.rmSync(root, { recursive: true, maxRetries: 4, retryDelay: 250 });
});
function blocks(note, lang, count) {
  const nodes = parseNote(
    "Programmazione/Rust/Promemoria/Pagine/Rust - " + note + ".md",
  ).tree.children.filter((n) => n.type === "code" && n.lang === lang);
  assert.equal(nodes.length, count, note + ": " + lang);
  return nodes.map((n) => n.value);
}
function make(name) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, file, body) {
  const dest = path.join(dir, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body + "\n");
}
function run(cwd, command, args, expected = 0) {
  const r = spawnSync(command, args, {
    cwd,
    windowsHide: true,
    encoding: "utf8",
    timeout: 240000,
    env: {
      ...process.env,
      CARGO_NET_OFFLINE: process.env.CARGO_NET_OFFLINE ?? "true",
      CARGO_TERM_COLOR: "never",
      CARGO_TARGET_DIR: path.join(cwd, "target"),
      RUSTFLAGS: "-Dwarnings",
      RUSTDOCFLAGS: "-Dwarnings",
    },
  });
  assert.ifError(r.error);
  assert.equal(
    r.status,
    expected,
    [command, ...args, r.stdout, r.stderr].join("\n"),
  );
  return r;
}
const manifest =
  '[package]\nname = "app"\nversion = "0.1.0"\nedition = "2024"\n';
function rustc(dir, code, name) {
  write(dir, name + ".rs", code);
  const bin = path.join(
    dir,
    name + (process.platform === "win32" ? ".exe" : ""),
  );
  run(dir, "rustc", ["--edition=2024", "-Dwarnings", name + ".rs", "-o", bin]);
  return bin;
}
const io = "File percorsi e Serde";
const concurrency = "Concorrenza e async";
test("File: testo, byte e directory; un secondo avvio non sovrascrive", () => {
  const dir = make("files");
  const bin = rustc(dir, blocks(io, "rust", 2)[0], "files");
  const lines = run(dir, bin, []).stdout.trim().split(/\r?\n/);
  assert.deepEqual(lines.slice(0, 2), ["prima", "seconda"]);
  assert.deepEqual(
    lines
      .slice(2)
      .map((s) => path.basename(s))
      .sort(),
    ["note.txt", "raw.bin"],
  );
  const dest = path.join(dir, "memo-io", "data", "note.txt");
  fs.writeFileSync(dest, "da conservare");
  assert.match(run(dir, bin, [], 1).stderr, /AlreadyExists/);
  assert.equal(fs.readFileSync(dest, "utf8"), "da conservare");
});
test("Serde: JSON su disco e rifiuto di un file esistente", () => {
  const dir = make("serde");
  write(dir, "Cargo.toml", manifest + blocks(io, "toml", 1)[0]);
  write(dir, "src/main.rs", blocks(io, "rust", 2)[1]);
  run(dir, "cargo", ["build", "--quiet"]);
  const bin = path.join(
    dir,
    "target",
    "debug",
    process.platform === "win32" ? "app.exe" : "app",
  );
  run(dir, bin, []);
  const dest = path.join(dir, "memo-user.json");
  assert.deepEqual(JSON.parse(fs.readFileSync(dest, "utf8")), {
    id: 7,
    name: "Ada",
  });
  fs.writeFileSync(dest, "sentinella");
  assert.match(run(dir, bin, [], 1).stderr, /AlreadyExists/);
  assert.equal(fs.readFileSync(dest, "utf8"), "sentinella");
});
test("Moduli: API tra le crate e feature JSON attiva solo su richiesta", () => {
  const dir = make("modules");
  const note = "Moduli e Cargo";
  const [lib, repo, main] = blocks(note, "rust", 3);
  write(dir, "Cargo.toml", blocks(note, "toml", 1)[0]);
  write(dir, "src/lib.rs", lib);
  write(dir, "src/repository.rs", repo);
  write(dir, "src/main.rs", main);
  assert.equal(run(dir, "cargo", ["run", "--quiet"]).stdout.trim(), "Ada");
  const out = run(dir, "cargo", ["run", "--quiet", "--features", "json"])
    .stdout.trim()
    .split(/\r?\n/);
  assert.deepEqual([out[0], JSON.parse(out[1])], ["Ada", { name: "Ada" }]);
  assert.doesNotMatch(run(dir, "cargo", ["tree"]).stdout, /serde_json/);
  assert.match(
    run(dir, "cargo", ["tree", "--features", "json"]).stdout,
    /serde_json/,
  );
});
test("Thread: risultato via join, chiusura del channel e contatore condiviso", () => {
  const dir = make("threads");
  for (const [i, s] of blocks(concurrency, "rust", 4).slice(0, 3).entries()) {
    const bin = rustc(dir, "fn main() {\n" + s + "\n}", "thread" + i);
    run(dir, bin, []);
  }
});
test("Tokio: task, try_join su successo ed errore, timeout e lavoro bloccante", () => {
  const dir = make("tokio");
  write(dir, "Cargo.toml", manifest + blocks(concurrency, "toml", 1)[0]);
  write(dir, "src/main.rs", blocks(concurrency, "rust", 4)[3]);
  run(dir, "cargo", ["run", "--quiet"]);
});
test("Qualità: unit, integrazione, filtro e doctest; rustfmt e Clippy", () => {
  const dir = make("quality");
  const [lib, integration] = blocks("Test e qualita", "rust", 2);
  write(dir, "Cargo.toml", manifest);
  write(dir, "src/lib.rs", lib);
  write(dir, "tests/api_test.rs", integration);
  run(dir, "cargo", ["fmt", "--check"]);
  run(dir, "cargo", ["check", "--all-targets", "--all-features"]);
  run(dir, "cargo", [
    "clippy",
    "--all-targets",
    "--all-features",
    "--",
    "-D",
    "warnings",
  ]);
  const all = run(dir, "cargo", [
    "test",
    "--all-targets",
    "--all-features",
  ]).stdout;
  assert.match(all, /2 passed; 0 failed/);
  assert.match(all, /test accepts_public_id \.\.\. ok/);
  const filtered = run(dir, "cargo", ["test", "parses_id"]).stdout;
  assert.match(filtered, /test tests::parses_id \.\.\. ok/);
  assert.doesNotMatch(filtered, /test accepts_public_id /);
  const docs = run(dir, "cargo", ["test", "--doc", "--all-features"]).stdout;
  assert.match(docs, /1 passed; 0 failed/);
  run(dir, "cargo", ["doc", "--no-deps"]);
});
