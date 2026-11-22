import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Error reporting.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
let root, dir, env, bin;
function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function run(tool, args, status = 0, cwd = dir) {
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
    status,
    [tool, ...args, r.stdout, r.stderr].join("\n"),
  );
  return {
    out: r.stdout.replaceAll("\r\n", "\n"),
    err: r.stderr.replaceAll("\r\n", "\n"),
  };
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-report-"));
  dir = path.join(root, "verifica-lista");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  run("cargo", snippet("sh", "cargo new").split(/\s+/).slice(1), 0, root);
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    snippet("toml", "anyhow =") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/main.rs"),
    snippet("rust", "fn main()") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/lib.rs"),
    snippet("rust", "pub enum CheckError") + "\n",
  );
  fs.writeFileSync(path.join(dir, "lista.txt"), snippet("text", "abc") + "\n");
  fs.mkdirSync(path.join(dir, "tests"));
  fs.writeFileSync(
    path.join(dir, "tests/cause.rs"),
    `
use anyhow::Context;
use std::{error::Error, num::ParseIntError, path::Path};
use verifica_lista::{check, CheckError};

#[test]
fn causa_tipizzata_e_catena() {
    let err = check(Path::new("lista.txt")).context("verifica").unwrap_err();
    let domain = err.downcast_ref::<CheckError>().unwrap();
    assert!(matches!(domain, CheckError::Quantity { line: 3, .. }));
    assert!(domain.source().unwrap().is::<ParseIntError>());
    assert_eq!(err.chain().count(), 3);
    assert_eq!(err.to_string(), "verifica");
    assert_eq!(format!("{err:#}"), format!("verifica: {domain}: {}", domain.source().unwrap()));
}
`,
  );
  run("cargo", ["fetch"]);
  env.CARGO_NET_OFFLINE = "true";
  run("cargo", ["build", "--locked"]);
  bin = path.join(
    env.CARGO_TARGET_DIR,
    "debug",
    "verifica-lista" + (process.platform === "win32" ? ".exe" : ""),
  );
});
after(() => {
  if (!root) return;
  const actual = fs.realpathSync(root);
  assert.equal(path.dirname(actual), tmp);
  assert.ok(path.basename(actual).startsWith("vault-report-"));
  fs.rmSync(actual, { recursive: true, maxRetries: 3 });
});
test("il report pubblicato coincide con stderr e non lascia risultati parziali", () => {
  const expected = snippet("text", "suggerimento:") + "\n";
  assert.deepEqual(run(bin, ["lista.txt"], 3), { out: "", err: expected });
  const { out, err } = run(bin, ["--verbose", "lista.txt"], 3);
  const [head, hint] = expected.trimEnd().split("\n");
  assert.equal(out, "");
  assert.ok(err.startsWith(head + ": "));
  assert.ok(err.endsWith("\n" + hint + "\n"));
  assert.equal(err.split(head).length, 2);
  assert.ok(!err.includes("abc"));
});
test("la causa rimane ParseIntError dopo with_context, non una stringa", () => {
  const { out } = run("cargo", ["test", "--locked", "--test", "cause"]);
  assert.match(out, /causa_tipizzata_e_catena \.\.\. ok/);
});
test("successo, righe vuote, CRLF e limite superiore", () => {
  const file = "dati validi.txt";
  for (const [text, n] of [
    ["", 0],
    ["\r\n \t\r\n", 0],
    ["12\r\n\r\n8\r\n", 2],
    [" 4294967295 \n", 1],
  ]) {
    fs.writeFileSync(path.join(dir, file), text);
    assert.deepEqual(run(bin, ["--verbose", file]), { out: n + "\n", err: "" });
  }
});
test("il primo errore mantiene la riga fisica, il codice e la riservatezza dei valori", () => {
  const file = "quantità.txt";
  for (const value of ["0", "4294967296", "-1", "dato-da-non-divulgare"]) {
    fs.writeFileSync(
      path.join(dir, file),
      "4\r\n \r\n" + value + "\r\naltro-errato",
    );
    for (const args of [[file], ["-v", file]]) {
      const { out, err } = run(bin, args, 3);
      assert.equal(out, "");
      assert.match(err, /quantità non valida alla riga 3/);
      assert.doesNotMatch(err, /dato-da-non-divulgare|altro-errato/);
    }
  }
});
test("file mancante: suggerimento dal tipo, non dalla lingua dell'errore di sistema", () => {
  const file = "non presente.txt";
  const short = run(bin, [file], 1);
  const long = run(bin, ["--verbose", file], 1);
  assert.equal(short.out, "");
  assert.equal(long.out, "");
  const [head, hint] = short.err.trimEnd().split("\n");
  assert.equal(
    head,
    "errore: controllo di non presente.txt: impossibile leggere il file",
  );
  assert.equal(hint, "suggerimento: verifica il percorso del file");
  assert.ok(long.err.startsWith(head + ": "));
  assert.ok(long.err.endsWith("\n" + hint + "\n"));
});
test("byte non UTF-8: errore nei dati e non errore di apertura", () => {
  fs.writeFileSync(path.join(dir, "bin.dat"), Buffer.from([0xff, 0xfe]));
  const { out, err } = run(bin, ["bin.dat"], 3);
  assert.equal(out, "");
  assert.match(err, /il file non è testo UTF-8/);
  assert.match(err, /converti il file in UTF-8/);
});
test("clap separa uso errato e help dai guasti del programma", () => {
  for (const args of [[], ["--opzione-inesistente", "manca"]]) {
    const { out, err } = run(bin, args, 2);
    assert.equal(out, "");
    assert.notEqual(err.trim(), "");
    assert.doesNotMatch(err, /errore: controllo di/);
  }
  const { out, err } = run(bin, ["--help"]);
  assert.match(out, /--verbose/);
  assert.equal(err, "");
});
