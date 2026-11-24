import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(new URL("../../site/package.json", import.meta.url));
const { parse } = require("parse5");
const blocks = parseNote("Programmazione/Rust/Pagine/rustdoc.md").tree.children.filter((b) => b.type === "code");
const source = blocks.find((b) => b.lang === "rust").value;
function command(text) {
  const matches = blocks.filter((b) => b.lang === "sh" && b.value === text);
  assert.equal(matches.length, 1, text);
  return matches[0].value.split(/\s+/).slice(1);
}
const create = command("cargo new --lib --edition 2024 quota_notes");
const render = command("cargo doc --lib --no-deps");
const internal = command("cargo doc --lib --no-deps --document-private-items --target-dir target/internal");
const strict = command("cargo rustdoc --lib -- -D rustdoc::broken_intra_doc_links");
const doctest = command("cargo test --doc");

function fixture(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rustdoc-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rustdoc-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  let cwd = dir;
  function cargo(args, success = true) {
    const r = spawnSync("cargo", args, {
      cwd, windowsHide: true, encoding: "utf8", timeout: 90000,
      env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(cwd, "target") },
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    const out = r.stdout + r.stderr;
    assert.equal(r.status === 0, success, out);
    return out;
  }
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(dir, "quota_notes");
  const write = (content) => fs.writeFileSync(path.join(cwd, "src/lib.rs"), content + "\n");
  write(source);
  return { cargo, write, cwd };
}

function* nodes(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* nodes(child);
}
const attr = (node, key) => node.attrs?.find((a) => a.name === key)?.value;
function page(dir, name) {
  return [...nodes(parse(fs.readFileSync(path.join(dir, name), "utf8")))];
}
const href = (nodes, filename) => nodes.some((n) => n.tagName === "a" && attr(n, "href") === filename);

test("Il link introduttivo porta all'API; solo la vista interna espone la pagina dell'helper", (t) => {
  const { cargo, cwd } = fixture(t);
  cargo(render);
  const dir = path.join(cwd, "target/doc/quota_notes");
  const index = page(dir, "index.html");
  const intro = index.find((n) => attr(n, "class")?.split(" ").includes("docblock"));
  assert.ok(intro);
  assert.ok(href([...nodes(intro)], "fn.percentage.html"));
  const api = page(dir, "fn.percentage.html");
  for (const section of ["examples", "errors"]) assert.ok(api.some((n) => attr(n, "id") === section));
  assert.ok(!href(index, "fn.scaled.html"));
  cargo(internal);
  const privateDir = path.join(cwd, "target/internal/doc/quota_notes");
  assert.ok(href(page(privateDir, "index.html"), "fn.scaled.html"));
  assert.ok(fs.statSync(path.join(privateDir, "fn.scaled.html")).isFile());
  assert.ok(!fs.existsSync(path.join(dir, "fn.scaled.html")));
});

test("Un link sbagliato dà un avviso, diventa bloccante con deny e non cambia i due doc test", (t) => {
  const { cargo, write } = fixture(t);
  const broken = source.replace("[`percentage`]", "[`percentage_typo`]");
  assert.notEqual(source, broken);
  write(broken);
  assert.match(cargo(render), /warning: unresolved link to `percentage_typo`/);
  assert.match(cargo(strict, false), /error: unresolved link to `percentage_typo`/);
  assert.match(cargo(doctest), /2 passed; 0 failed/);
});

test("Un valore atteso sbagliato lascia valido il link ma rompe un doc test", (t) => {
  const { cargo, write } = fixture(t);
  assert.match(cargo(doctest), /2 passed; 0 failed/);
  assert.match(cargo([...doctest, "--release"]), /2 passed; 0 failed/);
  const wrong = source.replace("Ok(33)", "Ok(34)");
  assert.notEqual(source, wrong);
  write(wrong);
  cargo(render);
  cargo(strict);
  const out = cargo(doctest, false);
  assert.match(out, /left: Ok\(33\)\s+right: Ok\(34\)/);
  assert.match(out, /1 passed; 1 failed/);
});

test("missing_docs intercetta un elemento pubblico privo di commento, separatamente dai link", (t) => {
  const { cargo, write } = fixture(t);
  write(source + "\npub const BASIS: u64 = 100;");
  cargo(strict);
  assert.match(cargo([...strict, "-D", "missing_docs"], false), /missing documentation for a constant/);
  write(source + "\n/// Base della percentuale.\npub const BASIS: u64 = 100;");
  cargo([...strict, "-D", "missing_docs"]);
});
