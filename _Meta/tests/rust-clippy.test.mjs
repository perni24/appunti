import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippets(name, lang) {
  return parseNote(`Programmazione/Rust/Pagine/${name}.md`).tree.children
    .filter((b) => b.type === "code" && b.lang === lang).map((b) => b.value);
}
const source = snippets("Unit test", "rust").find((s) => s.includes("pub fn parse_percentage"));
const [manual, corrected, exception] = snippets("Clippy", "rust");
assert.ok(source.includes(corrected));
const commands = snippets("Clippy", "sh");
function command(prefix) {
  const matches = commands.filter((cmd) => cmd === prefix || cmd.startsWith(prefix + " "));
  assert.equal(matches.length, 1, prefix);
  return matches[0].split(/\s+/).slice(1);
}
const strict = command("cargo clippy --workspace");
const lint = command("cargo clippy --lib --");
const unit = command("cargo test --lib");

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-clippy-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-clippy-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  function put(name, value) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value + "\n");
  }
  put("Cargo.toml", '[package]\nname = "percentage_notes"\nversion = "0.1.0"\nedition = "2024"\n\n[features]\nfast-path = []');
  put("src/lib.rs", source);
  function cargo(args, ok = true) {
    const r = spawnSync("cargo", args, {
      cwd: dir, env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "target") },
      encoding: "utf8", windowsHide: true, timeout: 60000,
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status === 0, ok, r.stdout + r.stderr);
    return r.stdout + r.stderr;
  }
  // Il formato JSON evita di dipendere dalla lingua o dalla presentazione dei diagnostici.
  function diagnostics(args, ok = true) {
    const output = cargo([args[0], "--message-format=json", ...args.slice(1)], ok);
    return output.split(/\r?\n/).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line))
      .filter((record) => record.reason === "compiler-message")
      .map(({ message }) => [message.code?.code, message.level]);
  }
  return { put, cargo, diagnostics };
}
function has(messages, code, level) {
  assert.ok(messages.some(([c, l]) => c === code && l === level), JSON.stringify(messages));
}

test("Un lint può essere warning o errore a parità di cinque test verdi", (t) => {
  const { put, cargo, diagnostics } = project(t);
  put("src/lib.rs", source.replace(corrected, manual));
  assert.match(cargo(unit), /5 passed; 0 failed/);
  assert.ok(commands.includes("cargo clippy --lib"));
  has(diagnostics(["clippy", "--lib"]), "clippy::manual_clamp", "warning");
  has(diagnostics(lint, false), "clippy::manual_clamp", "error");
  put("src/lib.rs", source);
  diagnostics(strict);
  assert.match(cargo(command("cargo test --workspace")), /5 passed; 0 failed/);
});

test("Un massimo di 99 supera Clippy ma viola il contratto", (t) => {
  const { put, cargo, diagnostics } = project(t);
  put("src/lib.rs", source.replace(corrected, corrected.replace("100", "99")));
  diagnostics(strict);
  const out = cargo(unit, false);
  assert.match(out, /3 passed; 2 failed/);
  for (const name of ["clamps_at_both_limits", "clamps_after_parsing"]) {
    assert.match(out, new RegExp("tests::" + name + " .*FAILED"));
  }
});

test("expect copre otto parametri; una firma ridotta scopre l'eccezione obsoleta", (t) => {
  const { put, diagnostics } = project(t);
  const i = exception.indexOf("pub fn ipv6_segments");
  assert.ok(i > 0);
  put("src/lib.rs", exception.slice(i));
  has(diagnostics(strict, false), "clippy::too_many_arguments", "error");
  put("src/lib.rs", exception);
  diagnostics(strict);
  put("src/lib.rs", exception.slice(0, i) + "pub fn ipv6_segments(s: [u16; 8]) -> [u16; 8] { s }");
  has(diagnostics(strict, false), "unfulfilled_lint_expectations", "error");
});

test("Target di test, feature escluse e avvisi rustc hanno portate diverse", (t) => {
  const { put, diagnostics } = project(t);
  put("tests/api.rs", 'use percentage_notes::parse_percentage;\n#[test] fn api() { let unused = 12; assert_eq!(parse_percentage("42"), Ok(42)); }');
  diagnostics(lint);
  has(diagnostics(strict, false), "unused_variables", "error");
  put("tests/api.rs", '#[test] fn api() { assert_eq!(percentage_notes::parse_percentage("42"), Ok(42)); }');
  put("src/lib.rs", source + '\n#[cfg(not(feature = "fast-path"))]\n' + manual.replace("fn clamp_percentage", "pub fn fallback"));
  diagnostics(strict);
  has(diagnostics(strict.map((x) => x === "--all-features" ? "--no-default-features" : x), false), "clippy::manual_clamp", "error");
});
