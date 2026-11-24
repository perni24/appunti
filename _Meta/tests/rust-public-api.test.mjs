import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function* walk(node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}
const nodes = [...walk(parseNote("Programmazione/Rust/Pagine/Public API design.md").tree)];
function snippet(type, marker) {
  const matches = nodes.filter((n) => n.type === type && n.value.includes(marker));
  assert.equal(matches.length, 1, marker);
  return matches[0].value;
}
const facade = snippet("code", "pub use account::");
const model = snippet("code", "pub struct Username(");
const client = snippet("code", "fn preserves_valid_input");
const create = snippet("code", "cargo new").split(" ").slice(1);
const verify = snippet("code", "cargo test --test").split(" ").slice(1);
const checks = snippet("inlineCode", "cargo check --tests").split(" ").slice(1);

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const tmp = fs.mkdtempSync(path.join(root, "vault-rs-api-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(tmp)), root);
    assert.ok(path.basename(tmp).startsWith("vault-rs-api-"));
    fs.rmSync(tmp, { recursive: true, maxRetries: 3 });
  });
  let cwd = tmp;
  const cargo = (args, success = true) => {
    const r = spawnSync("cargo", args, {
      cwd, encoding: "utf8", windowsHide: true, timeout: 60000,
      env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(tmp, "target") },
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status === 0, success, r.stdout + r.stderr);
    return r.stdout + r.stderr;
  };
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(tmp, "names_api");
  const put = (name, data) => fs.writeFileSync(path.join(cwd, name), data + "\n");
  fs.mkdirSync(path.join(cwd, "tests"));
  put("src/lib.rs", facade);
  put("src/account.rs", model);
  put("tests/public_api.rs", client);
  function checkFailure(expected) {
    const output = cargo([...checks, "--message-format=json"], false);
    const messages = output.split(/\r?\n/).filter((s) => s.startsWith("{")).map((s) => JSON.parse(s));
    assert.ok(messages.some((m) => m.reason === "compiler-message" && m.target.name === "public_api"
      && m.message.code?.code === expected && m.message.level === "error"), output);
  }
  return { cwd, put, cargo, checkFailure };
}

test("Il client legge il testo originale e riceve un errore tipizzato per i nomi vuoti", (t) => {
  const { cargo } = project(t);
  assert.match(cargo(verify), /2 passed; 0 failed/);
  assert.match(cargo([...verify, "--release"]), /2 passed; 0 failed/);
});

test("Il modulo privato e il costruttore della tuple struct non sono accessibili al client", (t) => {
  const { put, checkFailure } = project(t);
  for (const [fragment, code] of [["let _ = names_api::account::", "E0603"], ["let _ = Username(", "E0423"]]) {
    put("tests/public_api.rs", client + "\n#[test]\nfn probe() { " + snippet("inlineCode", fragment) + " }");
    checkFailure(code);
  }
});

test("Un match esterno su UsernameError deve contemplare le varianti future", (t) => {
  const { put, cargo, checkFailure } = project(t);
  const match = "fn explain(e: UsernameError) -> &'static str { match e { UsernameError::Empty => \"empty\", ARMS } }";
  put("tests/public_api.rs", client + "\n" + match.replace("ARMS", ""));
  checkFailure("E0004");
  put("tests/public_api.rs", client + "\n" + match.replace("ARMS", '_ => "other",'));
  cargo(checks);
});

test("Spostare il modulo preserva il client; togliere il re-export pubblico lo rompe", (t) => {
  const { cwd, put, cargo, checkFailure } = project(t);
  fs.renameSync(path.join(cwd, "src/account.rs"), path.join(cwd, "src/identity.rs"));
  const moved = facade.replaceAll("account", "identity");
  put("src/lib.rs", moved);
  assert.match(cargo(verify), /2 passed; 0 failed/);
  put("src/lib.rs", moved.replace("pub use", "pub(crate) use"));
  cargo(["check", "--lib"]);
  checkFailure("E0603");
});

test("Box<str> mantiene il contratto; normalizzare gli spazi cambia il risultato, non i tipi", (t) => {
  const { put, cargo } = project(t);
  const boxed = model.replace("Username(String)", "Username(Box<str>)")
    .replace("Ok(Self(value))", snippet("inlineCode", "Ok(Self(value.into_boxed_str()))"));
  put("src/account.rs", boxed);
  assert.match(cargo(verify), /2 passed; 0 failed/);
  put("src/account.rs", model.replace("Ok(Self(value))", snippet("inlineCode", "Ok(Self(value.trim().to_owned()))")));
  cargo(checks);
  const out = cargo(verify, false);
  assert.match(out, /preserves_valid_input .*FAILED/);
  assert.match(out, /1 passed; 1 failed/);
});
