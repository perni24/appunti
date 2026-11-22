import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Invariants.md";
const examples = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(path.dirname(rustc), "rustdoc");
function launch(cmd, args, input) {
  const r = spawnSync(cmd, args, {
    input,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}
function example(id) {
  const hits = examples.filter((b) => b.value.includes(id));
  assert.equal(hits.length, 1, id);
  return hits[0].value;
}
function doctest(args, count, input) {
  const r = launch(rustdoc, ["--test", "--edition=2024", ...args], input);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    r.stdout.includes(count + " passed; 0 failed; 0 ignored"),
    r.stdout,
  );
}
function probe(id, code) {
  const body =
    example(id).replace("fn main()", "fn demo()") +
    "\nfn main() { demo();\n" +
    code +
    "\n}";
  return ["```rust", ...body.split("\n"), "```"]
    .map((line) => "//! " + line)
    .join("\n");
}

test("tre esempi del Markdown con e senza ottimizzazioni", () => {
  assert.equal(examples.length, 3);
  for (const flags of [[], ["-C", "opt-level=3"]]) doctest([...flags, file], 3);
});

test("panic prima della sostituzione e rimozione ripetuta", () => {
  const doc = probe(
    "pub struct NonEmptyVec",
    `
    use std::panic::{catch_unwind, AssertUnwindSafe};
    let mut v = NonEmptyVec::new(vec![String::from("first"), String::from("last")]).unwrap();
    let failed = catch_unwind(AssertUnwindSafe(|| v.replace_first_with(|_| panic!("stop"))));
    assert!(failed.is_err());
    assert_eq!(v.pop_if_multiple().as_deref(), Some("last"));
    assert_eq!(v.pop_if_multiple(), None);
    assert_eq!(v.first(), "first");`,
  );
  doctest(["-C", "opt-level=3", "-"], 1, doc);
});

test("set accetta l'intero dominio u8 e non modifica Percent su Err", () => {
  const doc = probe(
    "struct Percent",
    `
    for start in 0..=100 {
        for value in u8::MIN..=u8::MAX {
            let mut p = Percent::new(start).unwrap();
            if value <= 100 {
                assert_eq!(p.set(value), Ok(()));
                assert_eq!(p.get(), value);
            } else {
                assert!(Percent::new(value).is_none());
                assert_eq!(p.set(value), Err(value));
                assert_eq!(p.get(), start);
            }
        }
    }`,
  );
  doctest(["-C", "opt-level=3", "-"], 1, doc);
});

function rejects(id, code, diagnostic) {
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
    example(id) + "\n" + code,
  );
  assert.notEqual(r.status, 0);
  const errors = r.stderr.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  assert.ok(
    errors.some((d) => d.level === "error" && d.code?.code === diagnostic),
    r.stderr,
  );
}
test("il Vec non è mutabile direttamente fuori dal modulo", () => {
  rejects(
    "pub struct NonEmptyVec",
    "fn clear(v: &mut NonEmptyVec<i32>) { v.inner.clear(); }",
    "E0616",
  );
});
test("l'elemento preso dal cursore non sopravvive ai dati", () => {
  rejects(
    "struct SliceCursor",
    `fn escape() -> &'static i32 {
    let data = vec![42];
    SliceCursor::new(&data).take_first().unwrap()
}`,
    "E0515",
  );
});
