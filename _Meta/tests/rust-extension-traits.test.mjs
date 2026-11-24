import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Extension traits.md").tree.children
  .filter((node) => node.type === "code");
const [library, report, client] = blocks.filter((b) => b.lang === "rust").map((b) => b.value);
const [create, verify] = blocks.filter((b) => b.lang === "sh").map((b) => b.value.split(" ").slice(1));
const root = fs.realpathSync(os.tmpdir());
let temp, cwd;
const put = (name, code) => fs.writeFileSync(path.join(cwd, name), code + "\n");
function cargo(args, status = 0) {
  const proc = spawnSync("cargo", args, {
    cwd, windowsHide: true, encoding: "utf8", timeout: 60000,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(temp, "target") },
  });
  assert.ifError(proc.error);
  const output = proc.stdout + proc.stderr;
  assert.equal(proc.status, status, output);
  return output;
}
function rejected(target, expected) {
  const args = target === "note_ext" ? ["--lib"] : ["--test", target];
  const out = cargo(["check", ...args, "--message-format=json"], 101);
  const messages = out.split(/\r?\n/).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line));
  assert.ok(messages.some((m) => m.target?.name === target && m.message?.code?.code === expected), out);
}
before(() => {
  temp = fs.mkdtempSync(path.join(root, "vault-extension-"));
  cwd = temp;
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(temp, create.at(-1));
  fs.mkdirSync(path.join(cwd, "tests"));
  put("src/report.rs", report);
});
beforeEach(() => {
  put("src/lib.rs", library);
  put("tests/extensions.rs", client);
});
after(() => {
  if (!temp) return;
  assert.equal(path.dirname(fs.realpathSync(temp)), root);
  assert.ok(path.basename(temp).startsWith("vault-extension-"));
  fs.rmSync(temp, { recursive: true, maxRetries: 3 });
});

test("I tre esempi della nota funzionano da una crate esterna in debug e release", () => {
  assert.match(cargo(verify), /3 passed; 0 failed/);
  assert.match(cargo([...verify, "--release"]), /3 passed; 0 failed/);
});

test("Il vecchio predicato per valore non soddisfa la firma di filter", () => {
  put("src/lib.rs", library.replace("FnMut(&Self::Item)", "FnMut(Self::Item)"));
  rejected("note_ext", "E0277");
});

test("Prestare e limitare l'iteratore lascia la coda; consumarlo direttamente impedisce il riuso", () => {
  const probe = `
#[test]
fn string_items() {
    let mut iter = vec![String::new(), String::from("tail")].into_iter();
    assert_eq!(iter.by_ref().take(1).count_where(String::is_empty), 1);
    assert_eq!(iter.next().as_deref(), Some("tail"));
    assert_eq!(iter.count_where(String::is_empty), 0);
}`;
  put("tests/extensions.rs", client + probe);
  assert.match(cargo(verify), /4 passed; 0 failed/);
  put("tests/extensions.rs", client + probe.replace("iter.by_ref().take(1)", "iter"));
  rejected("extensions", "E0382");
});

test("Import assente o metodi ambigui: la chiamata qualificata seleziona il trait", () => {
  const probe = '#[test]\nfn blank() { assert!(String::from(" ").is_blank()); }';
  put("tests/extensions.rs", probe);
  rejected("extensions", "E0599");
  put("tests/extensions.rs", probe.replace('String::from(" ").is_blank()', '<str as note_ext::StringExt>::is_blank(" ")'));
  assert.match(cargo(verify), /1 passed; 0 failed/);
  const conflicting = `
use note_ext::StringExt;
trait OtherTextExt { fn is_blank(&self) -> bool; }
impl OtherTextExt for String { fn is_blank(&self) -> bool { self.is_empty() } }
#[test]
fn select() {
    let name = String::from(" ");
    assert!(name.is_blank());
    assert!(!OtherTextExt::is_blank(&name));
}`;
  put("tests/extensions.rs", conflicting);
  rejected("extensions", "E0034");
  put("tests/extensions.rs", conflicting.replace("assert!(name.is_blank())", "assert!(StringExt::is_blank(&name))"));
  assert.match(cargo(verify), /1 passed; 0 failed/);
});

test("Il trait locale funziona su String ma non autorizza impl intrinseci o sovrapposti", () => {
  put("src/lib.rs", library + "\nimpl String { pub fn is_note_blank(&self) -> bool { self.is_empty() } }");
  rejected("note_ext", "E0116");
  put("src/lib.rs", library + "\nimpl StringExt for String { fn is_blank(&self) -> bool { false } }");
  rejected("note_ext", "E0119");
});

test("ResultExt richiede una causa Error, non un semplice messaggio String", () => {
  const probe = `
#[test]
fn message_only() {
    let r: Result<(), String> = Err(String::from("offline"));
    let _ = r.map_message("reading limit");
}`;
  put("tests/extensions.rs", client + probe);
  rejected("extensions", "E0599");
});
