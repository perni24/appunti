import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Unsafe abstractions sicure.md";
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
function example(id) {
  const hits = blocks.filter((b) => b.value.includes(id));
  assert.equal(hits.length, 1, id);
  return hits[0].value;
}
function doctest(args, count, input) {
  const r = run(rustdoc, ["--test", "--edition=2024", ...args], input);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    r.stdout.includes(count + " passed; 0 failed; 0 ignored"),
    r.stdout,
  );
}
test("tre programmi della nota, senza e con ottimizzazioni", () => {
  assert.equal(blocks.length, 3);
  for (const flags of [[], ["-C", "opt-level=3"]]) doctest([...flags, file], 3);
});
function exercise(id, checks) {
  const src = example(id).replace("fn main()", "fn demo()");
  const body = src + "\nfn main() { demo();\n" + checks + "\n}";
  const doc = ["```rust", ...body.split("\n"), "```"]
    .map((line) => "//! " + line)
    .join("\n");
  doctest(["-C", "opt-level=3", "-"], 1, doc);
}
test("split controllato: confronto con la std, ZST e usize::MAX", () => {
  exercise(
    "pub fn split_at_mut_checked",
    `
    for n in 0..=16 {
        for mid in (0..=n + 1).chain([usize::MAX]) {
            let mut actual: Vec<_> = (0..n).map(|i| i.to_string()).collect();
            let mut expected = actual.clone();
            let apply = |parts: Option<(&mut [String], &mut [String])>| {
                parts.map(|(l, r)| {
                    for x in l.iter_mut() { x.push('L'); }
                    for x in r.iter_mut() { x.push('R'); }
                    (l.len(), r.len())
                })
            };
            assert_eq!(apply(split_at_mut_checked(&mut actual, mid)),
                       apply(expected.split_at_mut_checked(mid)));
            assert_eq!(actual, expected);
        }
    }
    let mut units = [(); 3];
    let (l, r) = split_at_mut_checked(&mut units, 1).unwrap();
    assert_eq!((l.len(), r.len()), (1, 2));`,
  );
});
test("RawBuffer comunica lunghezza inizializzata, non capacità", () => {
  exercise(
    "pub struct RawBuffer",
    `
    let mut b = RawBuffer::new(Vec::with_capacity(16));
    assert_eq!(b.as_ptr_len().1, 0);
    b.append(&[0, 99]);
    let (p, len) = b.as_ptr_len();
    assert_eq!(p, b.as_slice().as_ptr());
    assert_eq!(len, 2);
    assert_eq!(b.as_slice(), &[0, 99]);`,
  );
});
function rejects(id, caller, code) {
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
    example(id) + "\n" + caller,
  );
  assert.notEqual(r.status, 0);
  const errors = r.stderr.split(/\r?\n/).filter(Boolean).map(JSON.parse);
  assert.ok(
    errors.some((d) => d.level === "error" && d.code?.code === code),
    r.stderr,
  );
}
test("first non può sopravvivere ai dati originari", () => {
  rejects(
    "pub struct NonEmptySlice",
    `fn escape() -> &'static String {
      let data = vec![String::from("local")];
      NonEmptySlice::new(&data).unwrap().first()
    }`,
    "E0515",
  );
});
test("append rifiutata finché la slice condivisa è in uso", () => {
  rejects(
    "pub struct RawBuffer",
    `fn conflicting(b: &mut RawBuffer) {
      let borrowed = b.as_slice();
      b.append(&[3]);
      assert_eq!(borrowed.len(), 2);
    }`,
    "E0502",
  );
});
