import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Aliasing rules.md";
const blocks = parseNote(file).tree.children.filter(
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
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}

test("quattro esempi della nota eseguiti normalmente e con ottimizzazioni", () => {
  assert.equal(blocks.length, 4);
  for (const flags of [[], ["-C", "opt-level=3"]]) {
    const r = run(rustdoc, ["--test", "--edition=2024", ...flags, file]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /4 passed; 0 failed; 0 ignored/);
  }
});

function example(needle) {
  const hits = blocks.filter((b) => b.value.includes(needle));
  assert.equal(hits.length, 1, needle);
  return hits[0].value;
}
function rejectsChange(before, after, code) {
  const source = example(before).replace(before, after);
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
    source,
  );
  assert.notEqual(r.status, 0);
  const errors = r.stderr.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  assert.ok(
    errors.some((d) => d.level === "error" && d.code?.code === code),
    r.stderr,
  );
}
test("prestito originale non leggibile durante l'uso esclusivo derivato", () => {
  rejectsChange(
    "*child += 2;",
    "let _observed = *parent;\n    *child += 2;",
    "E0503",
  );
});
test("indicizzazioni separate non provano la disgiunzione", () => {
  rejectsChange(
    "let (a, b) = split_two(&mut values).unwrap();",
    "let a = &mut values[0];\n    let b = &mut values[1];",
    "E0499",
  );
});
test("split_two conserva la coda su elementi non Copy e accetta due ZST", () => {
  const source = example("fn split_two<T>").replace("fn main()", "fn demo()");
  const extended =
    source +
    `
fn main() {
    demo();
    for n in 0..=8 {
        let mut values: Vec<_> = (0..n).map(|i| i.to_string()).collect();
        let mut expected = values.clone();
        if let Some((a, b)) = split_two(&mut values) {
            assert!(n >= 2);
            std::mem::swap(a, b);
            expected.swap(0, 1);
        } else { assert!(n < 2); }
        assert_eq!(values, expected);
    }
    assert!(split_two(&mut [(); 2]).is_some());
}`;
  const doc = ["```rust", ...extended.split("\n"), "```"]
    .map((line) => "//! " + line)
    .join("\n");
  const r = run(
    rustdoc,
    ["--test", "--edition=2024", "-C", "opt-level=3", "-"],
    doc,
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /1 passed; 0 failed; 0 ignored/);
});
