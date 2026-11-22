import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Unit test.md").tree.children.filter((n) => n.type === "code");
const rust = blocks.filter((b) => b.lang === "rust");
assert.equal(rust.length, 1);
const src = rust[0].value;
const commands = blocks.filter((b) => b.lang === "sh").map((b) => b.value.split(" "));
const expected = [
  "cargo new --lib percentage_notes", "cargo test --lib", "cargo test --lib -- --list",
  "cargo test --lib tests::rejects_integer_outside_i32 -- --exact",
];
assert.deepEqual(commands.map((c) => c.join(" ")), expected);
const root = fs.realpathSync(os.tmpdir());
let dir, project, lib;
function run(args, { cwd = project, fail = false } = {}) {
  const r = spawnSync("cargo", args, {
    cwd, encoding: "utf8", windowsHide: true, timeout: 90000,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TARGET_DIR: path.join(dir, "target"), CARGO_TERM_COLOR: "never" },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const output = r.stdout + r.stderr;
  if (fail) assert.notEqual(r.status, 0, output);
  else assert.equal(r.status, 0, output);
  return output;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-unit-tests-"));
  run([...commands[0].slice(1), "--vcs", "none"], { cwd: dir });
  project = path.join(dir, "percentage_notes");
  lib = path.join(project, "src/lib.rs");
  fs.writeFileSync(lib, src + "\n");
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-unit-tests-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("I cinque test del Markdown superano entrambi i profili", () => {
  for (const extra of [[], ["--release"]]) {
    assert.match(run([...commands[1].slice(1), ...extra]), /5 passed; 0 failed/);
  }
});
test("Elenco, filtro completo e filtro con zero corrispondenze", () => {
  const listing = run(commands[2].slice(1));
  assert.equal(listing.match(/^tests::\w+: test\r?$/gm)?.length, 5);
  const exact = commands[3].slice(1);
  assert.match(listing, /tests::rejects_integer_outside_i32: test/);
  assert.match(run(exact), /1 passed; 0 failed; .*4 filtered out/);
  assert.match(run(exact.map((s) => s.replace(/^tests::/, ""))), /0 passed; 0 failed; .*5 filtered out/);
});
test("Anticipare il cast in una copia fa fallire il caso negativo documentato", () => {
  const changed = src.replace("value.clamp(0, 100) as u8", "(value as u8).min(100)");
  assert.notEqual(changed, src);
  fs.writeFileSync(lib, changed);
  try {
    const out = run(["test", "--lib", "tests::clamps_at_both_limits", "--", "--exact"], { fail: true });
    assert.match(out, /input=-1/);
    assert.match(out, /0 passed; 1 failed/);
  } finally { fs.writeFileSync(lib, src); }
});
test("Una crate di integrazione vede l'API pubblica, non i privati né gli helper cfg(test)", () => {
  const file = path.join(project, "tests/api.rs");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '#[test] fn public_api() { assert_eq!(percentage_notes::parse_percentage("101").unwrap(), 100); }');
  assert.match(run(["test", "--test", "api"]), /1 passed; 0 failed/);
  fs.writeFileSync(file, "#[test] fn private_api() { percentage_notes::clamp_percentage(42); }");
  assert.match(run(["test", "--test", "api", "--no-run"], { fail: true }), /error\[E0603\].*clamp_percentage.*private/);
  fs.writeFileSync(lib, src + "\n#[cfg(test)] pub fn unit_only() {}\n");
  fs.writeFileSync(file, "#[test] fn helper() { percentage_notes::unit_only(); }");
  try {
    assert.match(run(["test", "--test", "api", "--no-run"], { fail: true }), /error\[E0425\].*unit_only/);
  } finally { fs.writeFileSync(lib, src); }
});
