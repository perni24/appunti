import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = (name) => parseNote(`Programmazione/Rust/Pagine/${name}.md`).tree.children
  .filter((node) => node.type === "code");
const page = blocks("Doc test");
const [docs, interactive, rejected] = page.filter((b) => b.lang === "rust").map((b) => b.value);
const [doctest, all, render] = page.filter((b) => b.lang === "sh").map((b) => b.value.split(" ").slice(1));
const lib = blocks("Unit test").find((b) => b.lang === "rust" && b.value.includes("pub fn parse_percentage")).value;
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-dt-";
let dir, project;
function cargo(args, fails = false) {
  const r = spawnSync("cargo", args, {
    cwd: project, encoding: "utf8", timeout: 90000, windowsHide: true,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "t") },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, !fails, out);
  return out;
}
function install(...comments) {
  const source = lib.replace("pub fn parse_percentage", () => comments.join("\n///\n") + "\npub fn parse_percentage");
  fs.writeFileSync(path.join(project, "src/lib.rs"), source + "\n");
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, prefix));
  project = dir;
  cargo(["new", "--lib", "--vcs", "none", "percentage_notes"]);
  project = path.join(dir, "percentage_notes");
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});

test("I due esempi documentano saturazione ed errore; la suite completa comprende i cinque test unitari", () => {
  install(docs);
  assert.match(cargo(doctest), /2 passed; 0 failed/);
  const out = cargo(all);
  assert.match(out, /5 passed; 0 failed/);
  assert.match(out, /2 passed; 0 failed/);
});
test("Un risultato atteso sbagliato rompe il doc test ma non la generazione HTML o i test unitari", () => {
  install(docs.replace('(" 120 ")?, 100', '(" 120 ")?, 99'));
  cargo(render);
  const html = path.join(dir, "t/doc/percentage_notes/fn.parse_percentage.html");
  assert.ok(fs.readFileSync(html, "utf8").includes("InvalidDigit"));
  assert.match(cargo(["test", "--lib"]), /5 passed; 0 failed/);
  assert.match(cargo(doctest, true), /left: 100\s+right: 99/);
});
test("no_run accetta il lettore stdin ma rifiuta una chiamata con il tipo sbagliato", () => {
  install(interactive);
  assert.match(cargo(doctest), /1 passed; 0 failed/);
  install(interactive.replace("read_line(&mut line)", "read_line(&line)"));
  assert.match(cargo(doctest, true), /E0308/);
});
test("compile_fail passa con il Result non estratto e fallisce quando il valore diventa u8", () => {
  install(rejected);
  assert.match(cargo(doctest), /1 passed; 0 failed/);
  install(rejected.replace('parse_percentage("42");', 'parse_percentage("42").unwrap();'));
  assert.match(cargo(doctest, true), /compiled successfully/i);
});
