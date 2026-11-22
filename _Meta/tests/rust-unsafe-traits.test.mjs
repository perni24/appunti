import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Unsafe traits.md";
const blocks = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(path.dirname(rustc), "rustdoc");

function launch(tool, args, input) {
  const r = spawnSync(tool, args, {
    input,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}

test("tre esempi estratti dal Markdown, anche con ottimizzazioni", () => {
  assert.equal(blocks.length, 3);
  for (const flags of [[], ["-C", "opt-level=3"]]) {
    const r = launch(rustdoc, ["--test", "--edition=2024", ...flags, file]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /3 passed; 0 failed; 0 ignored/);
  }
});

// Cambia una sola dichiarazione o un solo bound del programma pubblicato.
function rejectsChange(from, to, code) {
  const hits = blocks.filter((b) => b.value.includes(from));
  assert.equal(hits.length, 1, from);
  const r = launch(
    rustc,
    [
      "--edition=2024",
      "--emit=metadata",
      "--error-format=json",
      "-o",
      "-",
      "-",
    ],
    hits[0].value.replace(from, to),
  );
  assert.notEqual(r.status, 0);
  const errors = r.stderr.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  assert.ok(
    errors.some((d) => d.level === "error" && d.code?.code === code),
    r.stderr,
  );
}

test("implementare NonEmptyBytes richiede unsafe impl", () => {
  rejectsChange(
    "unsafe impl NonEmptyBytes for Header",
    "impl NonEmptyBytes for Header",
    "E0200",
  );
});

test("trasferire Cell non implica poter condividere &Cell", () => {
  rejectsChange(
    "needs_sync::<Owned<u32>>();",
    "needs_sync::<Owned<Cell<u32>>>();",
    "E0277",
  );
});

test("il wrapper Box non rende trasferibile un Rc", () => {
  rejectsChange(
    "needs_send::<Owned<Cell<u32>>>();",
    "needs_send::<Owned<std::rc::Rc<u32>>>();",
    "E0277",
  );
});
