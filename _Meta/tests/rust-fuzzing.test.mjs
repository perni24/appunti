import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Fuzzing.md").tree.children;
const snippets = (lang) => blocks.filter((b) => b.type === "code" && b.lang === lang).map((b) => b.value);
const [lib, oracle, cases, target] = snippets("rust");
const commands = snippets("sh").map((s) => s.split(" "));
const [create, unit, , install, init, list, smoke] = commands;
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-fz-";
let dir, cwd, env;
function run([program, ...args], pass = true) {
  const r = spawnSync(program, args, { cwd, env, encoding: "utf8", timeout: 360000, windowsHide: true });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, pass, out);
  return out;
}
function put(relative, source) {
  const file = path.join(cwd, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source + "\n");
}
before(() => {
  cwd = dir = fs.mkdtempSync(path.join(root, prefix));
  const localTools = path.join(dir, "tools");
  env = { ...process.env, CARGO_TERM_COLOR: "never", CARGO_INSTALL_ROOT: localTools, CARGO_TARGET_DIR: path.join(dir, "t") };
  const key = Object.keys(env).find((k) => k.toLowerCase() === "path");
  env[key] = path.join(localTools, "bin") + path.delimiter + env[key];
  run(create);
  cwd = path.join(dir, "gray_notes");
  put("src/lib.rs", lib);
  put("checks/oracle.rs", oracle);
  put("tests/histogram.rs", cases);
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("I casi manuali e l'oracolo per tutte le intensità passano su stable", () => {
  assert.match(run(unit), /2 passed; 0 failed/);
});
test("Il confine errato conserva il totale ma fallisce sulla fascia del pixel 64", () => {
  put("src/lib.rs", lib.replace(" / 64", " / 65"));
  try {
    const out = run([...unit, "every_single_pixel_matches_the_model", "--", "--exact"], false);
    assert.match(out, /left: \[1, 0, 0, 0\]\s+right: \[0, 1, 0, 0\]/);
  } finally { put("src/lib.rs", lib); }
});
test("Lo stesso oracolo accetta tutte le coppie di byte e una sequenza di 64 pixel ripetuti", () => {
  put("tests/sequences.rs", `#[path = "../checks/oracle.rs"]
mod oracle;
#[test]
fn pairs_and_repeats() {
    for a in 0..=u8::MAX {
        for b in 0..=u8::MAX { oracle::check(&[a, b]); }
    }
    oracle::check(&[128; 64]);
}`);
  assert.match(run(["cargo", "test", "--test", "sequences"]), /1 passed; 0 failed/);
});
function prepareFuzzTarget() {
  if (fs.existsSync(path.join(cwd, "fuzz/Cargo.toml"))) return;
  run(install);
  run(init);
  assert.ok(fs.existsSync(path.join(cwd, "fuzz/fuzz_targets/histogram.rs")));
  put("fuzz/fuzz_targets/histogram.rs", target);
}
test("cargo-fuzz genera ed elenca histogram; Cargo controlla il vero target con il modello condiviso", () => {
  prepareFuzzTarget();
  assert.match(run(list), /^histogram\s*$/m);
  run(["cargo", "check", "--manifest-path", "fuzz/Cargo.toml", "--bin", "histogram"]);
});
test("Campagna strumentata di 1000 esecuzioni, solo con toolchain e runtime configurati", {
  skip: process.env.VAULT_FUZZ_NIGHTLY !== "1" && "richiede nightly e supporto nativo; attivare VAULT_FUZZ_NIGHTLY=1",
}, () => {
  prepareFuzzTarget();
  const out = run(smoke);
  assert.match(out, /#1000\s+DONE|Done 1000 runs/i);
  assert.match(out, /cov:\s*[1-9]\d*/i);
});
