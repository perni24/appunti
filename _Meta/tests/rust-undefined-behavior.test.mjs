import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Undefined behavior.md";
const programs = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(
    path.dirname(process.env.RUSTC_TEST_EXECUTABLE || "rustc"),
    "rustdoc",
  );

function doctest(args, count, input) {
  const r = spawnSync(rustdoc, ["--test", "--edition=2024", ...args], {
    input,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(
    r.stdout.includes(count + " passed; 0 failed; 0 ignored"),
    r.stdout,
  );
}

test("tre programmi pubblicati con e senza ottimizzazioni", () => {
  assert.equal(programs.length, 3);
  for (const flags of [[], ["-C", "opt-level=3"]]) doctest([...flags, file], 3);
});

function checkCases(needle, cases) {
  const hits = programs.filter((b) => b.value.includes(needle));
  assert.equal(hits.length, 1, needle);
  const src = hits[0].value.replace("fn main()", "fn demo()");
  const body = src + "\nfn main() { demo();\n" + cases + "\n}";
  const doc = ["```rust", ...body.split("\n"), "```"]
    .map((line) => "//! " + line)
    .join("\n");
  doctest(["-C", "opt-level=3", "-"], 1, doc);
}

test("il flag distingue ogni byte e un campo mancante", () => {
  checkCases(
    "fn read_flag(",
    `
    for byte in 0_u8..=255 {
        let actual = read_flag(&[0, byte], 1);
        if byte <= 1 {
            assert_eq!(actual, Ok(byte == 1));
        } else {
            assert_eq!(actual, Err(FlagError::Invalid(byte)));
        }
    }
    assert_eq!(read_flag(&[], 0), Err(FlagError::Missing));
    assert_eq!(read_flag(&[1], usize::MAX), Err(FlagError::Missing));`,
  );
});

test("accesso safe oltre il limite: None oppure panic, anche in release", () => {
  checkCases(
    "fn byte_at(",
    `
    let data = [10_u8, 20];
    for i in [data.len(), usize::MAX] {
        assert_eq!(data.get(i), None);
        assert!(std::panic::catch_unwind(|| byte_at(&data, i)).is_err());
    }`,
  );
});
