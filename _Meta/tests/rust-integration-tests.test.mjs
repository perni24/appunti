import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const snippets = (name) => parseNote("Programmazione/Rust/Pagine/" + name + ".md")
  .tree.children.filter((b) => b.type === "code");
const unit = snippets("Unit test"), integration = snippets("Integration test");
function rust(page, marker) {
  const matches = page.filter((b) => b.lang === "rust" && b.value.includes(marker));
  assert.equal(matches.length, 1, marker);
  return matches[0].value;
}
const commands = integration.filter((b) => b.lang === "sh").map((b) => b.value.split(" "));
assert.deepEqual(commands.map((c) => c.join(" ")), [
  "cargo test --test api", "cargo test --test cli",
  "cargo test --test cli invalid_input_is_a_process_error -- --exact", "cargo test",
]);
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-it-", main = rust(integration, "fn main()");
let dir, project;
function run(args, fail = false) {
  const r = spawnSync("cargo", args, {
    cwd: project, encoding: "utf8", windowsHide: true, timeout: 90000,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "t") },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  if (fail) assert.notEqual(r.status, 0, r.stdout + r.stderr);
  else assert.equal(r.status, 0, r.stdout + r.stderr);
  return r.stdout;
}
function put(file, source) {
  const dest = path.join(project, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, source + "\n");
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  project = dir;
  run(["new", "--lib", "--vcs", "none", "percentage_notes"]);
  project = path.join(dir, "percentage_notes");
  put("src/lib.rs", rust(unit, "pub fn parse_percentage"));
  put("src/bin/percent.rs", main);
  put("tests/api.rs", rust(integration, "fn clamps_numeric_input"));
  put("tests/cli.rs", rust(integration, "fn run(args:"));
  put("tests/common/mod.rs", rust(integration, "pub const ABOVE_MAX"));
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("Cargo scopre api e cli; un helper direttamente in tests/ produrrebbe un terzo target", () => {
  const targets = () => JSON.parse(run(["metadata", "--format-version", "1", "--no-deps"]))
    .packages[0].targets.filter((t) => t.kind.includes("test")).map((t) => t.name).sort();
  const nested = path.join(project, "tests/common/mod.rs"), flat = path.join(project, "tests/common.rs");
  assert.deepEqual(targets(), ["api", "cli"]);
  fs.renameSync(nested, flat);
  try { assert.deepEqual(targets(), ["api", "cli", "common"]); }
  finally { fs.renameSync(flat, nested); }
});
test("I comandi della nota eseguono due casi API, tre CLI o un caso esatto", () => {
  assert.match(run(commands[0].slice(1)), /2 passed; 0 failed/);
  assert.match(run(commands[1].slice(1)), /3 passed; 0 failed/);
  assert.match(run(commands[2].slice(1)), /1 passed; 0 failed; .*2 filtered out/);
});
test("La suite completa comprende anche i cinque test della nota precedente", () => {
  const out = run(commands[3].slice(1));
  for (const count of [2, 3, 5]) assert.match(out, new RegExp(count + " passed; 0 failed"));
});
test("Se la CLI termina con successo per un input errato, l'API passa ma il test di processo fallisce", () => {
  const original = 'eprintln!("invalid percentage");\n        ExitCode::from(2)';
  assert.ok(main.includes(original));
  put("src/bin/percent.rs", main.replace(original, 'eprintln!("invalid percentage");\n        ExitCode::SUCCESS'));
  try {
    assert.match(run(commands[0].slice(1)), /2 passed; 0 failed/);
    const out = run(commands[2].slice(1), true);
    assert.match(out, /left: Some\(0\)\s+right: Some\(2\)/);
    assert.match(out, /0 passed; 1 failed/);
  } finally { put("src/bin/percent.rs", main); }
});
