import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/CLI con clap.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
let root, dir, exe, env;

function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function launch(tool, args, code = 0, cwd = dir) {
  const r = spawnSync(tool, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(
    r.status,
    code,
    JSON.stringify(args) + "\n" + r.stdout + r.stderr,
  );
  return r;
}

before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-clap-"));
  dir = path.join(root, "notainfo");
  const target = path.join(root, "t");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: target,
    CARGO_TERM_COLOR: "never",
  };
  launch("cargo", snippet("sh", "cargo new").split(/\s+/).slice(1), 0, root);
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    snippet("toml", "clap =") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/main.rs"),
    snippet("rust", "fn main()") + "\n" + snippet("rust", "mod tests") + "\n",
  );
  launch("cargo", ["fetch"]);
  env.CARGO_NET_OFFLINE = "true";
  launch("cargo", ["build", "--locked"]);
  exe = path.join(
    target,
    "debug",
    process.platform === "win32" ? "notainfo.exe" : "notainfo",
  );
  fs.writeFileSync(
    path.join(dir, "prova note.txt"),
    snippet("text", "prima riga") + "\n",
  );
});
after(() => {
  if (!root) return;
  const actual = fs.realpathSync(root);
  assert.equal(path.dirname(actual), tmp);
  assert.ok(path.basename(actual).startsWith("vault-clap-"));
  fs.rmSync(actual, { recursive: true, maxRetries: 3 });
});

test("clap nella versione documentata e tre test del parser pubblicati", () => {
  assert.match(
    launch("cargo", ["tree", "--locked", "-p", "clap", "--depth", "0"]).stdout,
    /^clap v4\.5\.50\b/m,
  );
  const r = launch("cargo", ["test", "--locked"]);
  for (const name of [
    "schema_coerente",
    "opzione_globale_dopo_il_sottocomando",
    "valore_non_ammesso",
  ])
    assert.match(r.stdout, new RegExp(name + " \\.\\.\\. ok"));
});
test("help generale, help locale e versione su stdout", () => {
  for (const [args, pattern] of [
    [["--help"], /count/],
    [["count", "--help"], /--unit/],
    [["--version"], /notainfo 0\.1\.0/],
  ]) {
    const r = launch(exe, args);
    assert.match(r.stdout, pattern);
    assert.equal(r.stderr, "");
  }
});
test("spazi nel percorso, default e argomento globale prima o dopo il comando", () => {
  const file = "prova note.txt";
  const clean = launch(exe, ["count", file]);
  assert.equal(clean.stdout.trim(), "2");
  assert.equal(clean.stderr, "");
  for (const args of [
    ["-vv", "count", file, "--unit", "words"],
    ["count", file, "--unit", "words", "-vv"],
  ]) {
    const r = launch(exe, args);
    assert.equal(r.stdout.trim(), "3");
    assert.match(r.stderr, /verbose=2 input=prova note\.txt/);
  }
});
test("clap rifiuta input errati con codice 2 prima di aprire il file", () => {
  for (const args of [
    [],
    ["inesistente"],
    ["count"],
    ["count", "manca", "--unit", "caratteri"],
    ["bytes", "manca", "--unit", "words"],
  ]) {
    const r = launch(exe, args, 2);
    assert.equal(r.stdout, "");
    assert.notEqual(r.stderr.trim(), "");
  }
});
test("errori di I/O e byte non UTF-8 restano distinti dagli errori di parsing", () => {
  fs.writeFileSync(path.join(dir, "bin.dat"), Buffer.from([0xff, 0, 0x80]));
  for (const name of ["non-esiste.txt", "bin.dat"]) {
    const r = launch(exe, ["count", name], 1);
    assert.equal(r.stdout, "");
    assert.ok(r.stderr.includes(name + ":"));
  }
  const r = launch(exe, ["bytes", "bin.dat"]);
  assert.equal(r.stdout.trim(), "3");
  assert.equal(r.stderr, "");
});
test("file vuoto, CRLF, separatori Unicode e nome che inizia con trattino", () => {
  const file = path.join(dir, "-bozza.txt");
  fs.writeFileSync(file, "");
  assert.equal(launch(exe, ["count", "--", "-bozza.txt"]).stdout.trim(), "0");
  const data = "caffè\u2003nero\r\n\r\nfine\r\n";
  fs.writeFileSync(file, data);
  assert.equal(launch(exe, ["count", "--", "-bozza.txt"]).stdout.trim(), "3");
  assert.equal(
    launch(exe, ["count", "--unit", "words", "--", "-bozza.txt"]).stdout.trim(),
    "3",
  );
  assert.equal(
    launch(exe, ["bytes", "--", "-bozza.txt"]).stdout.trim(),
    String(Buffer.byteLength(data)),
  );
});
