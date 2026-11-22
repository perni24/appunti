import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Zero-cost abstractions.md",
).tree.children.filter((b) => b.type === "code");
const temp = fs.realpathSync(os.tmpdir());
let root, dir;

function source(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function command(marker) {
  const hits = blocks.filter(
    (b) =>
      b.lang === "sh" &&
      (b.value === marker || b.value.split(" ")[0] === marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function run(cmd, cwd = dir) {
  const [exe, ...args] = cmd.split(/\s+/);
  const r = spawnSync(exe, args, {
    cwd,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
    env: {
      ...process.env,
      CARGO_TARGET_DIR: path.join(root, "t"),
      CARGO_NET_OFFLINE: "true",
    },
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status, 0, cmd + "\n" + r.stdout + r.stderr);
  return r.stdout;
}
before(() => {
  root = fs.mkdtempSync(path.join(temp, "vault-rust-zc-"));
  dir = path.join(root, "costi");
  run(command("cargo new --lib --vcs none costi"), root);
  fs.mkdirSync(path.join(dir, "tests"));
  for (const [file, marker] of [
    ["src/lib.rs", "pub fn sum_even_loop"],
    ["tests/dispatch.rs", "fn count_with"],
    ["tests/layout.rs", "struct TicketId"],
  ])
    fs.writeFileSync(path.join(dir, file), source("rust", marker) + "\n");
});
after(() => {
  if (!root) return;
  assert.equal(path.dirname(fs.realpathSync(root)), temp);
  assert.ok(path.basename(root).startsWith("vault-rust-zc-"));
  fs.rmSync(root, { recursive: true, maxRetries: 3 });
});

for (const cmd of [
  "cargo test",
  "cargo test --release",
  "cargo test --release --tests",
]) {
  test(cmd + ": contratti verificati dal codice della nota", () => {
    const out = run(command(cmd));
    for (const name of [
      "somma_pari_modulare",
      "stesso_predicato_in_prestito",
      "id_opzionale_senza_tag_aggiuntivo",
    ]) {
      assert.match(out, new RegExp(name + " \\.\\.\\. ok"));
    }
  });
}

test("ciclo e pipeline coincidono anche su slice più lunghe con overflow ripetuti", () => {
  fs.writeFileSync(
    path.join(dir, "tests/sweep.rs"),
    `
use costi::{sum_even_iter, sum_even_loop};
#[test]
fn verifica_prefissi() {
    let mut state = 17_u64;
    let mut xs = Vec::new();
    let mut exact = 0_u128;
    for _ in 0..512 {
        state = state.wrapping_mul(6364136223846793005).wrapping_add(1);
        xs.push(state);
        if state % 2 == 0 { exact += u128::from(state); }
        assert_eq!(sum_even_loop(&xs), exact as u64);
        assert_eq!(sum_even_iter(&xs), exact as u64);
    }
    assert!(exact > u128::from(u64::MAX));
}
`,
  );
  for (const cmd of [
    "cargo test --test sweep",
    "cargo test --release --test sweep",
  ]) {
    assert.match(run(cmd), /verifica_prefissi \.\.\. ok/);
  }
});

test("il comando rustc produce assembly ispezionabile per entrambe le funzioni", (t) => {
  run(command("rustc"));
  const asm = fs.readFileSync(path.join(dir, "confronto.s"), "utf8");
  for (const name of ["sum_even_loop", "sum_even_iter"])
    assert.ok(asm.includes(name), name);
  const lines = asm
    .split(/\r?\n/)
    .filter((l) => l.includes("sum_even_iter") && l.includes("sum_even_loop"));
  t.diagnostic(
    lines.length
      ? "Riferimento tra i due simboli: " + lines[0].trim()
      : "Nessun rinvio diretto tra i simboli sulla stessa riga.",
  );
});
