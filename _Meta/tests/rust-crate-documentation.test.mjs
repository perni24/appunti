import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const { parse } = createRequire(new URL("../../site/package.json", import.meta.url))("parse5");
const blocks = parseNote("Programmazione/Rust/Pagine/Documentazione delle crate.md").tree.children
  .filter((b) => b.type === "code");
const [lib, example] = blocks.filter((b) => b.lang === "rust").map((b) => b.value);
const readme = blocks.find((b) => b.lang === "markdown").value;
const features = blocks.find((b) => b.lang === "toml").value;
const commands = blocks.filter((b) => b.lang === "sh").map((b) => {
  const [tool, ...args] = b.value.split(" ");
  assert.equal(tool, "cargo");
  return args;
});
const [create, run, baseTest, batchTest, baseDocs, batchDocs, contents] = commands;
assert.equal(commands.length, 7);
const parent = fs.realpathSync(os.tmpdir());
let root, cwd;
const put = (name, code) => fs.writeFileSync(path.join(cwd, name), code + "\n");
function cargo(args, status = 0) {
  const run = spawnSync("cargo", args, {
    cwd, windowsHide: true, encoding: "utf8", timeout: 90000,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(root, "target") },
  });
  assert.ifError(run.error);
  const out = run.stdout + run.stderr;
  assert.equal(run.status, status, out);
  return out;
}
before(() => {
  root = fs.mkdtempSync(path.join(parent, "vault-crate-docs-"));
  cwd = root;
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(root, create.at(-1));
  const manifest = fs.readFileSync(path.join(cwd, "Cargo.toml"), "utf8");
  put("Cargo.toml", manifest.replace("[package]", '[package]\nreadme = "README.md"') + "\n" + features);
  fs.mkdirSync(path.join(cwd, "examples"));
  put("examples/basic.rs", example);
});
beforeEach(() => {
  put("README.md", readme);
  put("src/lib.rs", lib);
});
after(() => {
  if (!root) return;
  assert.equal(path.dirname(fs.realpathSync(root)), parent);
  assert.ok(path.basename(root).startsWith("vault-crate-docs-"));
  fs.rmSync(root, { recursive: true, maxRetries: 3 });
});
function* nodes(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* nodes(child);
}
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const content = (n) => [...nodes(n)].map((el) => el.nodeName === "#text" ? el.value : "").join("");
function itemPage(dir, name) {
  return [...nodes(parse(fs.readFileSync(path.join(dir, name), "utf8")))];
}

test("Il quick start condiviso e gli esempi pubblici si eseguono nelle due configurazioni", () => {
  assert.match(cargo(baseTest), /2 passed; 0 failed/);
  assert.match(cargo(batchTest), /3 passed; 0 failed/);
  assert.equal(cargo(run).trim(), "release  notes");
});

test("Il primo utilizzo e i link arrivano nell'HTML pubblico; batch ha una pagina solo se attiva", () => {
  for (const [args, batch] of [[baseDocs, false], [batchDocs, true]]) {
    cargo(args);
    const dir = path.join(cwd, args[args.indexOf("--target-dir") + 1], "doc/text_labels");
    const index = itemPage(dir, "index.html");
    const intro = index.find((n) => attr(n, "class")?.split(" ").includes("docblock"));
    assert.ok(intro);
    assert.match(content(intro), /Primo utilizzo/);
    const hrefs = [...nodes(intro)].filter((n) => n.tagName === "a").map((n) => attr(n, "href"));
    assert.ok(hrefs.includes("fn.normalize.html"));
    assert.ok(hrefs.includes("struct.EmptyLabel.html"));
    assert.equal(hrefs.includes("fn.normalize_all.html"), batch);
    assert.equal(fs.existsSync(path.join(dir, "fn.normalize_all.html")), batch);
    assert.ok(fs.existsSync(path.join(dir, "struct.EmptyLabel.html")));
    for (const name of batch ? ["normalize", "normalize_all"] : ["normalize"]) {
      assert.ok(itemPage(dir, "fn." + name + ".html").some((n) => attr(n, "id") === "errors"));
    }
  }
});

test("Un README obsoleto produce HTML valido, ma fallisce il suo doc test", () => {
  const wrong = readme.replace('Ok("caffè  latte")', 'Ok("caffè latte")');
  assert.notEqual(wrong, readme);
  put("README.md", wrong);
  cargo(baseDocs);
  assert.equal(cargo(run).trim(), "release  notes");
  assert.match(cargo(baseTest, 101), /1 passed; 1 failed/);
  // Manifest metadata alone does not make README examples into doc tests.
  put("src/lib.rs", lib.replace('#![doc = include_str!("../README.md")]', ""));
  assert.match(cargo(baseTest), /1 passed; 0 failed/);
});

test("Un link incondizionato a normalize_all rompe solo la documentazione senza batch", () => {
  const openLink = lib.replace(/^#!\[cfg_attr\(feature = "batch", doc = (.+)\)\]$/m, "#![doc = $1]");
  assert.notEqual(openLink, lib);
  put("src/lib.rs", openLink);
  assert.match(cargo(baseDocs, 101), /unresolved link to `normalize_all`/);
  cargo(batchDocs);
});

test("Il contratto distingue spazi interni, forma Unicode e lista vuota", () => {
  fs.mkdirSync(path.join(cwd, "tests"), { recursive: true });
  put("tests/contract.rs", `use text_labels::{normalize, normalize_all, EmptyLabel};
#[test]
fn boundaries() {
    assert_eq!(normalize("  A  B  ").as_deref(), Ok("a  b"));
    assert_eq!(normalize("\\u{2003}"), Err(EmptyLabel));
    assert_eq!(normalize("E\\u{301}").as_deref(), Ok("e\\u{301}"));
    assert_eq!(normalize_all(&[]), Ok(Vec::<String>::new()));
    assert_eq!(normalize_all(&["x", " ", "y"]), Err(EmptyLabel));
}`);
  assert.match(cargo(["test", "--features", "batch", "--test", "contract"]), /1 passed; 0 failed/);
});

test("Il pacchetto contiene README, sorgente ed esempio senza pubblicare", () => {
  const listed = cargo(contents).split(/\r?\n/).map((s) => s.replaceAll("\\", "/"));
  for (const name of ["README.md", "src/lib.rs", "examples/basic.rs"]) assert.ok(listed.includes(name), name);
});
