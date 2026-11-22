import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Unsafe functions.md";
const examples = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(path.dirname(rustc), "rustdoc");

function run(tool, args, input) {
  const r = spawnSync(tool, args, {
    input,
    encoding: "utf8",
    windowsHide: true,
    timeout: 60000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}

test("i quattro esempi della nota funzionano anche con ottimizzazioni", () => {
  assert.equal(examples.length, 4);
  for (const flags of [[], ["-C", "opt-level=3"]]) {
    const r = run(rustdoc, ["--test", "--edition=2024", ...flags, file]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /4 passed; 0 failed; 0 ignored/);
  }
});

function rejected(needle, caller, code) {
  const hits = examples.filter((b) => b.value.includes(needle));
  assert.equal(hits.length, 1);
  const r = run(
    rustc,
    [
      "--edition=2024",
      "--emit=metadata",
      "--error-format=json",
      "-o",
      "-",
      "-",
    ],
    hits[0].value + "\n" + caller,
  );
  assert.notEqual(r.status, 0);
  const errors = r.stderr
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse)
    .filter((d) => d.level === "error");
  assert.ok(
    errors.some((d) => d.code?.code === code),
    r.stderr,
  );
}

test("il prefisso non può sopravvivere al proprietario", () => {
  rejected(
    "fn prefix<",
    `
fn escaping() -> &'static [u8] {
    let source = vec![1, 2, 3];
    prefix(&source, 1).unwrap()
}`,
    "E0515",
  );
});

test("anche il caso vuoto documentato richiede una chiamata esplicita", () => {
  rejected(
    "unsafe fn copy_bytes(",
    `
fn missing_block() -> Vec<u8> {
    copy_bytes(std::ptr::null(), 0)
}`,
    "E0133",
  );
});
