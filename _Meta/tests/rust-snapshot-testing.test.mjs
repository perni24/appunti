import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Snapshot testing.md").tree.children;
const snippets = (lang) => blocks.filter((b) => b.type === "code" && b.lang === lang).map((b) => b.value);
const [lib, main, cases] = snippets("rust"), [deps] = snippets("toml"), [expectedText] = snippets("text");
const [create, suite, install, pending] = snippets("sh").map((s) => s.split(" "));
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-sn-";
const names = { text: "report__cli_report.snap", json: "report__report_json.snap" };
const expectedJson = { run_id: "[run]", passed: 2, failed: 1 };
let dir, cwd, env, snapshots;
function run([program, ...args], pass = true, update = "new") {
  const r = spawnSync(program, args, { cwd, env: { ...env, INSTA_UPDATE: update },
    encoding: "utf8", timeout: 360000, windowsHide: true });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, pass, out);
  return out;
}
const body = (file) => {
  const raw = fs.readFileSync(path.join(snapshots, file), "utf8").replaceAll("\r\n", "\n");
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(raw);
  assert.ok(match, "Intestazione mancante: " + file);
  return match[1].replace(/\n$/, "");
};
const files = () => fs.existsSync(snapshots) ? fs.readdirSync(snapshots).sort() : [];
const put = (file, value) => fs.writeFileSync(path.join(cwd, file), value + "\n");
function firstReview() {
  assert.match(run(suite, false), /1 passed; 2 failed/);
  assert.deepEqual(files(), [names.text + ".new", names.json + ".new"]);
  assert.equal(body(names.text + ".new"), expectedText);
  assert.deepEqual(JSON.parse(body(names.json + ".new")), expectedJson);
  const listed = run(pending);
  for (const name of Object.values(names)) assert.ok(listed.includes(name), listed);
  // Solo nella fixture: i due corpi sono stati confrontati con risultati indipendenti.
  run(["cargo", "insta", "accept"]);
  assert.deepEqual(files(), [names.text, names.json]);
}
before(() => {
  cwd = dir = fs.mkdtempSync(path.join(root, prefix));
  env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("INSTA_")));
  env.CARGO_INSTALL_ROOT = path.join(dir, "tools");
  env.CARGO_TARGET_DIR = path.join(dir, "t");
  env.CARGO_TERM_COLOR = "never";
  const key = Object.keys(env).find((k) => k.toLowerCase() === "path");
  env[key] = path.join(env.CARGO_INSTALL_ROOT, "bin") + path.delimiter + env[key];
  run(create);
  cwd = path.join(dir, "report_notes");
  const manifest = fs.readFileSync(path.join(cwd, "Cargo.toml"), "utf8");
  assert.match(manifest, /\[dependencies\]\s*$/);
  put("Cargo.toml", manifest.replace(/\[dependencies\]\s*$/, deps));
  fs.mkdirSync(path.join(cwd, "tests"));
  snapshots = path.join(cwd, "tests/snapshots");
  put("src/main.rs", main);
  run(install);
});
beforeEach(() => {
  put("src/lib.rs", lib);
  put("tests/report.rs", cases);
  for (const name of Object.values(names)) {
    for (const ext of ["", ".new"]) fs.rmSync(path.join(snapshots, name + ext), { force: true });
  }
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("La CI non crea riferimenti; la prima review locale trasforma le sole due proposte corrette in baseline", () => {
  assert.match(run(suite, false, "no"), /1 passed; 2 failed/);
  assert.deepEqual(files(), []);
  firstReview();
  assert.match(run(suite, true, "no"), /3 passed; 0 failed/);
});
test("Il conteggio stampato errato non rompe il JSON; rifiutare la proposta non ripara il codice", () => {
  firstReview();
  put("src/lib.rs", lib.replace("self.passed, self.failed", "self.passed, self.passed"));
  assert.match(run(suite, false), /2 passed; 1 failed/);
  assert.deepEqual(files(), [names.text, names.text + ".new", names.json]);
  assert.equal(body(names.text + ".new"), expectedText.replace("failed: 1", "failed: 2"));
  run(["cargo", "insta", "reject"]);
  assert.equal(body(names.text), expectedText);
  assert.deepEqual(files(), [names.text, names.json]);
  assert.match(run(suite, false, "no"), /2 passed; 1 failed/);
  put("src/lib.rs", lib);
  assert.match(run(suite, true, "no"), /3 passed; 0 failed/);
});
test("L'intestazione voluta è la sola differenza e può diventare il nuovo riferimento", () => {
  firstReview();
  put("src/lib.rs", lib.replace('format!("Checks', 'format!("Check summary'));
  assert.match(run(suite, false), /2 passed; 1 failed/);
  assert.deepEqual(files(), [names.text, names.text + ".new", names.json]);
  const changed = expectedText.replace(/^Checks/, "Check summary");
  assert.equal(body(names.text + ".new"), changed);
  run(["cargo", "insta", "accept"]);
  assert.equal(body(names.text), changed);
  assert.match(run(suite, true, "no"), /3 passed; 0 failed/);
});
test("Solo run_id è mascherato: un cambio di conteggio in CI fallisce senza riscrivere i file", () => {
  firstReview();
  const changed = cases.replace('"run-17"', '"run-28"');
  put("tests/report.rs", changed);
  assert.match(run(suite, true, "no"), /3 passed; 0 failed/);
  put("tests/report.rs", changed.replace("&[true, false, true]", "&[false, false, true]"));
  assert.match(run(suite, false, "no"), /2 passed; 1 failed/);
  assert.deepEqual(files(), [names.text, names.json]);
  assert.deepEqual(JSON.parse(body(names.json)), expectedJson);
});
