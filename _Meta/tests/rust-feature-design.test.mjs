import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Feature flags ben progettate.md").tree.children
  .filter((b) => b.type === "code");
const files = ["user-ids/Cargo.toml", "user-ids/src/lib.rs", "user-ids/tests/api.rs",
  "id-log/Cargo.toml", "id-log/src/lib.rs", "cli/Cargo.toml", "cli/src/main.rs"];
const sources = blocks.filter((b) => ["toml", "rust"].includes(b.lang)).map((b) => b.value);
assert.equal(sources.length, files.length);
const commands = blocks.filter((b) => b.lang === "sh").map((b) => {
  const [tool, ...args] = b.value.split(" ");
  assert.equal(tool, "cargo");
  return args;
});
const [minimal, defaults, serde, all, bare, run, runLog, tree, treeLog] = commands;
assert.equal(commands.length, 9);
const root = fs.realpathSync(os.tmpdir());
let dir;
const put = (name, data) => fs.writeFileSync(path.join(dir, name), data + "\n");
function cargo(pkg, args, status = 0) {
  const p = spawnSync("cargo", args, {
    cwd: path.join(dir, pkg), encoding: "utf8", windowsHide: true, timeout: 120000,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target"), CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", RUSTUP_AUTO_INSTALL: "0" },
  });
  assert.ifError(p.error);
  assert.equal(p.status, status, p.stdout + p.stderr);
  return p.stdout + p.stderr;
}
const lib = (args, status) => cargo("user-ids", args, status);
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-feature-api-"));
  for (const [i, name] of files.entries()) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    put(name, sources[i]);
  }
});
beforeEach(() => put(files[0], sources[0]));
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-feature-api-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});

test("Le quattro configurazioni esercitano esattamente le API promesse", () => {
  for (const [args, io, wire] of [[minimal, false, false], [defaults, true, false], [serde, false, true], [all, true, true]]) {
    const out = lib(args);
    assert.match(out, /test base_api \.\.\. ok/);
    assert.equal(out.includes("test writes_little_endian ... ok"), io);
    assert.equal(out.includes("test supports_serde ... ok"), wire);
    assert.ok(out.includes(`${1 + Number(io) + Number(wire)} passed; 0 failed`), out);
  }
});

test("Il punto interrogativo inoltra std senza aggiungere Serde alla build predefinita", () => {
  const graph = ["tree", "-e", "normal", "--prefix", "none"];
  assert.doesNotMatch(lib(graph), /^serde v/m);
  assert.doesNotMatch(lib([...graph, "--no-default-features"]), /^serde v/m);
  assert.match(lib([...graph, "--no-default-features", "--features", "serde"]), /^serde v/m);
  put(files[0], sources[0].replace("serde?/std", "serde/std"));
  assert.match(lib(graph), /^serde v/m);
});

test("Serde senza std compila sul target bare metal; il default accidentale sfugge ai test host", () => {
  lib(bare);
  put(files[0], sources[0].replace("default-features = false", "default-features = true"));
  assert.match(lib(serde), /2 passed; 0 failed/);
  // Without target std, Serde emits many follow-on errors; request compact diagnostics.
  const out = lib([...bare, "--message-format=short"], 101);
  assert.match(out, /E0463[^\n]*can't find crate for `std`/);
});

test("La CLI conserva il JSON numerico e aggiunge i byte soltanto con log", () => {
  assert.equal(cargo("cli", run).trim(), "json=258");
  assert.deepEqual(cargo("cli", runLog).trim().split(/\r?\n/), ["json=258", "bytes=[2, 1, 0, 0, 0, 0, 0, 0]"]);
});

test("Due percorsi normali unificano le feature dello stesso user-ids", () => {
  const isolated = cargo("cli", tree);
  assert.match(isolated, /user-ids feature "serde"/);
  assert.doesNotMatch(isolated, /user-ids feature "(std|default)"|id-log v/);
  const joined = cargo("cli", treeLog);
  for (const flag of ["std", "default", "serde"]) assert.ok(joined.includes(`user-ids feature "${flag}"`), joined);
  assert.match(joined, /id-log v/);
});

test("Rimuovere std dal default rompe il consumer anche se la libreria passa con tutte le feature", () => {
  put(files[0], sources[0].replace('default = ["std"]', "default = []"));
  assert.match(lib(all), /3 passed; 0 failed/);
  const out = cargo("cli", ["check", "--features", "log", "--message-format=json"], 101);
  const diagnostics = out.split(/\r?\n/).filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
  assert.ok(diagnostics.some((m) => m.target?.name === "id_log" && m.message?.code?.code === "E0599" && m.message.message.includes("write_le")), out);
});
