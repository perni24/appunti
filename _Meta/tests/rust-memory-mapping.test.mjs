import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Memory mapping.md",
).tree.children.filter((b) => b.type === "code");
const root = fs.realpathSync(os.tmpdir());
let dir;
function source(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-rust-mapping-"));
  fs.mkdirSync(path.join(dir, "tests"));
  fs.writeFileSync(
    path.join(dir, "Cargo.toml"),
    '[package]\nname = "mapping_notes"\nversion = "0.1.0"\nedition = "2024"\n\n' +
      source("toml", "[dev-dependencies]") +
      "\n",
  );
  for (const [file, marker] of [
    ["header", "fn payload"],
    ["writeback", "fn shared_and_private_writes"],
  ]) {
    fs.writeFileSync(
      path.join(dir, "tests", file + ".rs"),
      source("rust", marker) + "\n",
    );
  }
});
after(() => {
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-rust-mapping-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function cargo(args, reject = false) {
  const r = spawnSync("cargo", args, {
    cwd: dir,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
    encoding: "utf8",
    timeout: 180000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, !reject, r.stdout + r.stderr);
  return r.stdout;
}
test("i tre test pubblicati usano i file generati dal Markdown", () => {
  const command = source("sh", "cargo test");
  const output = cargo(command.split(/\s+/).slice(1));
  for (const name of [
    "read_after_file_drop",
    "rejects_incomplete_or_inconsistent_records",
    "shared_and_private_writes",
  ]) {
    assert.ok(output.includes("test " + name + " ... ok"), output);
  }
});
test("un offset non allineato a pagina restituisce solo la finestra richiesta", () => {
  fs.writeFileSync(
    path.join(dir, "tests", "window.rs"),
    `
use memmap2::MmapOptions;
use std::io::{self, Write};
#[test]
fn window() -> io::Result<()> {
    let mut file = tempfile::tempfile()?;
    file.write_all(b"!NOTE?")?;
    // SAFETY: file privato completo, non ridimensionato o modificato durante la vista.
    let view = unsafe { MmapOptions::new().offset(1).len(4).map(&file)? };
    assert_eq!(&view[..], b"NOTE");
    Ok(())
}`,
  );
  assert.match(cargo(["test", "--test", "window"]), /test window \.\.\. ok/);
});
test("una slice non può uscire dalla durata della mappa proprietaria", () => {
  fs.mkdirSync(path.join(dir, "examples"));
  fs.writeFileSync(
    path.join(dir, "examples", "escape.rs"),
    `
fn escape() -> std::io::Result<&'static [u8]> {
    let view = memmap2::MmapMut::map_anon(4)?;
    Ok(&view[..])
}
fn main() {}`,
  );
  const messages = cargo(
    ["check", "--example", "escape", "--message-format=json"],
    true,
  )
    .trim()
    .split(/\r?\n/)
    .map(JSON.parse);
  assert.ok(
    messages.some((m) => m.message?.code?.code === "E0515"),
    JSON.stringify(messages),
  );
});
