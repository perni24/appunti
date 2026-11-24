import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Compatibility e breaking changes.md").tree.children
  .filter((b) => b.type === "code");
const [v13, client, wrapper, policy, policyTest] = blocks.filter((b) => b.lang === "rust").map((b) => b.value);
const [create, verify, checkLib, checkClient] = blocks.filter((b) => b.lang === "sh")
  .map((b) => b.value.split(" ").slice(1));
const renamed = v13.replace("pub fn parse(", "pub fn parse_document(");
const v14 = renamed + "\n\n" + wrapper;
const migrated = client.replace("{parse,", "{parse_document as parse,");
const root = fs.realpathSync(os.tmpdir());
let temp, cwd, initialManifest;
const write = (name, data) => fs.writeFileSync(path.join(cwd, name), data + "\n");
const version = (v) => write("Cargo.toml", initialManifest.replace(/^version = "0\.1\.0"$/m, `version = "${v}"`));
function cargo(args, status = 0) {
  const r = spawnSync("cargo", args, {
    cwd, encoding: "utf8", windowsHide: true, timeout: 60000,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(temp, "target"), CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never" },
  });
  assert.ifError(r.error);
  const out = r.stdout + r.stderr;
  assert.equal(r.status, status, out);
  return out;
}
function expectDiagnostic(status, code, level) {
  const out = cargo([...checkClient, "--message-format=json"], status);
  const messages = out.split(/\r?\n/).filter((s) => s.startsWith("{")).map((s) => JSON.parse(s));
  assert.ok(messages.some((m) => m.reason === "compiler-message" && m.target.name === "downstream"
    && m.message.code?.code === code && m.message.level === level), out);
}
before(() => {
  temp = fs.mkdtempSync(path.join(root, "vault-rust-compat-"));
  cwd = temp;
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(temp, create.at(-1));
  initialManifest = fs.readFileSync(path.join(cwd, "Cargo.toml"), "utf8").replaceAll("\r\n", "\n").trimEnd();
  assert.match(initialManifest, /^version = "0\.1\.0"$/m);
  fs.mkdirSync(path.join(cwd, "tests"));
});
beforeEach(() => {
  version("1.4.0");
  write("src/lib.rs", v14);
  write("tests/downstream.rs", client);
});
after(() => {
  if (!temp) return;
  assert.equal(path.dirname(fs.realpathSync(temp)), root);
  assert.ok(path.basename(temp).startsWith("vault-rust-compat-"));
  fs.rmSync(temp, { recursive: true, maxRetries: 3 });
});

test("Lo stesso client distingue gli errori e conserva il valore sia in 1.3 sia in 1.4", () => {
  version("1.3.0");
  write("src/lib.rs", v13);
  assert.match(cargo(verify), /2 passed; 0 failed/);
  version("1.4.0");
  write("src/lib.rs", v14);
  expectDiagnostic(0, "deprecated", "warning");
  assert.match(cargo(verify), /2 passed; 0 failed/);
  assert.match(cargo([...verify, "--release"]), /2 passed; 0 failed/);
});

test("Negare le deprecazioni blocca il vecchio import; l'alias nuovo passa anche con quel lint", () => {
  write("tests/downstream.rs", "#![deny(deprecated)]\n" + client);
  expectDiagnostic(101, "deprecated", "error");
  write("tests/downstream.rs", "#![deny(deprecated)]\n" + migrated);
  assert.match(cargo(verify), /2 passed; 0 failed/);
});

test("Rimuovere il wrapper lascia verde la libreria ma rompe il client non migrato", () => {
  version("2.0.0");
  write("src/lib.rs", renamed);
  cargo(checkLib);
  expectDiagnostic(101, "E0432", "error");
  write("tests/downstream.rs", migrated);
  assert.match(cargo(verify), /2 passed; 0 failed/);
});

test("Una nuova variante o non_exhaustive tardivo rompono il match già esaustivo", () => {
  const extra = (s) => s.replace("    EmptyKey,", "    EmptyKey,\n    InvalidEscape,");
  const open = v14.replace("pub enum ParseError", "#[non_exhaustive]\npub enum ParseError");
  for (const src of [extra(v14), open]) {
    write("src/lib.rs", src);
    cargo(checkLib);
    expectDiagnostic(101, "E0004", "error");
  }
  write("tests/downstream.rs", client.replace('=> "insert a key",', '=> "insert a key",\n        _ => "other",'));
  assert.match(cargo(verify), /2 passed; 0 failed/);
  write("src/lib.rs", extra(open));
  assert.match(cargo(verify), /2 passed; 0 failed/);
});

test("Una rottura del formato non cambia le firme: solo l'asserzione sugli spazi la rileva", () => {
  write("src/lib.rs", v14.replace("Ok(Document { key, value })", "Ok(Document { key, value: value.trim() })"));
  cargo(checkLib);
  cargo(checkClient);
  const out = cargo(verify, 101);
  assert.match(out, /keeps_the_entire_value .*FAILED/);
  assert.match(out, /1 passed; 1 failed/);
});

test("Un nuovo campo pubblico rompe il literal esterno anche dopo aver adattato la libreria", () => {
  write("src/lib.rs", v14.replace("    pub key:", "    pub line: usize,\n    pub key:")
    .replace("Ok(Document { key, value })", "Ok(Document { line: 1, key, value })"));
  cargo(checkLib);
  expectDiagnostic(101, "E0063", "error");
});

test("Il setter conserva il default e copre 255 retry; un setter inerte non soddisfa i test", () => {
  write("tests/downstream.rs", client + "\n" + policyTest);
  write("src/lib.rs", v14 + "\n" + policy);
  assert.match(cargo(verify), /3 passed; 0 failed/);
  write("src/lib.rs", v14 + "\n" + policy.replace("self.retries = count;", "let _ = count;"));
  cargo(checkClient);
  const out = cargo(verify, 101);
  assert.match(out, /retries_are_opt_in .*FAILED/);
  assert.match(out, /2 passed; 1 failed/);
});
