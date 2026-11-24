import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Property testing.md").tree.children;
const snippets = (lang) => blocks.filter((b) => b.type === "code" && b.lang === lang).map((b) => b.value);
const [implementation, tests, regression] = snippets("rust");
const [manifest] = snippets("toml");
const [create, suite, stable, content] = snippets("sh").map((s) => {
  const [program, ...args] = s.split(" ");
  assert.equal(program, "cargo");
  return args;
});
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-prop-";
let dir, cwd, saved;
function cargo(args, pass = true, config = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("PROPTEST_")));
  Object.assign(env, { CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "t"), PROPTEST_RNG_SEED: "20261123" }, config);
  const r = spawnSync("cargo", args, { cwd, env, encoding: "utf8", timeout: 240000, windowsHide: true });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, pass, out);
  return out;
}
function install(body, withRegression = false) {
  const module = withRegression ? tests.replace(/}\s*$/, () => "\n" + regression + "\n}") : tests;
  fs.writeFileSync(path.join(cwd, "src/lib.rs"), body + "\n\n" + module + "\n");
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  cwd = dir;
  cargo(create);
  cwd = path.join(dir, "label_notes");
  saved = path.join(cwd, "proptest-regressions/lib.txt");
  fs.appendFileSync(path.join(cwd, "Cargo.toml"), "\n" + manifest + "\n");
});
beforeEach(() => { fs.rmSync(saved, { force: true }); });
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
const wrongTrim = implementation.replace(".trim()", ".trim_start()");

test("Il modulo pubblicato esegue un esempio e due proprietà, selezionabili anche separatamente", () => {
  install(implementation);
  assert.match(cargo(suite), /3 passed; 0 failed/);
  for (const cmd of [stable, content]) assert.match(cargo(cmd), /1 passed; 0 failed; .*2 filtered out/);
});
test("Due implementazioni sbagliate restano idempotenti ma perdono il contenuto atteso", () => {
  for (const body of [implementation.replace("input.trim().to_lowercase()", "String::new()"), wrongTrim]) {
    install(body);
    assert.match(cargo(stable), /1 passed; 0 failed/);
    const out = cargo(content, false);
    assert.match(out, /minimal failing input: label = "a", left = 0, right = 1/);
  }
});
test("Il seed viene riprovato anche senza casi nuovi; la correzione supera anche l'esempio esplicito", () => {
  install(wrongTrim, true);
  assert.match(cargo(content, false), /minimal failing input:/);
  const seedFile = fs.readFileSync(saved);
  assert.match(seedFile.toString(), /^cc [0-9a-f]{64}/m);
  const replayOnly = { PROPTEST_CASES: "0", PROPTEST_RNG_SEED: "7" };
  assert.match(cargo(content, false, replayOnly), /minimal failing input:/);
  fs.rmSync(saved);
  assert.match(cargo(content, true, replayOnly), /1 passed; 0 failed/);
  assert.match(cargo(["test", "--lib", "tests::removes_one_trailing_space", "--", "--exact"], false), /left: "a "\s+right: "a"/);
  fs.writeFileSync(saved, seedFile);
  install(implementation, true);
  assert.match(cargo(suite), /4 passed; 0 failed/);
});
test("Un generatore mirato all'ASCII non sostituisce un esempio Unicode con risultato noto", () => {
  install(implementation.replace(".to_lowercase()", ".to_ascii_lowercase()"));
  assert.match(cargo(stable), /1 passed; 0 failed/);
  assert.match(cargo(content), /1 passed; 0 failed/);
  assert.match(cargo(suite, false), /left: "Èco  2"\s+right: "èco  2"/);
});
