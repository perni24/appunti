import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Raw pointers.md";
const blocks = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(
    path.dirname(process.env.RUSTC_TEST_EXECUTABLE || "rustc"),
    "rustdoc",
  );

function run(args, count, input) {
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

test("i quattro doctest pubblicati passano senza e con ottimizzazioni", () => {
  assert.equal(blocks.length, 4);
  run([file], 4);
  run(["-C", "opt-level=3", file], 4);
});

function extended(needle, checks) {
  const hits = blocks.filter((b) => b.value.includes(needle));
  assert.equal(hits.length, 1, needle);
  const snippet = hits[0].value.replace("fn main()", "fn original_demo()");
  assert.notEqual(snippet, hits[0].value);
  // rustdoc interpreta stdin come una crate Rust con esempi nei commenti doc.
  const body = snippet + "\nfn main() { original_demo();\n" + checks + "\n}";
  return (
    "//! ```rust\n" +
    body
      .split("\n")
      .map((line) => "//! " + line)
      .join("\n") +
    "\n//! ```\n"
  );
}

test("il contenuto della nota rispetta i confini in modalità ottimizzata", () => {
  const lookup = extended(
    "fn copied_at<",
    `
    let data: Vec<u32> = (10..26).collect();
    for len in 0..=data.len() {
        let sub = &data[..len];
        for i in (0..=len + 1).chain([usize::MAX]) {
            assert_eq!(copied_at(sub, i), sub.get(i).copied());
        }
    }
    assert_eq!(copied_at(&[(); 3], 2), Some(()));
    assert_eq!(copied_at(&[(); 3], 3), None);`,
  );
  const ffi = extended(
    "fn first_or_null<",
    `
    let data = [11, 22, 33];
    for start in 0..=data.len() {
        for end in start..=data.len() {
            let sub = &data[start..end];
            let p = first_or_null(sub);
            if sub.is_empty() { assert!(p.is_null()); }
            else { assert_eq!(p, sub.as_ptr()); }
        }
    }`,
  );
  const packed = extended(
    "struct Header",
    `
    #[repr(C, align(4))]
    struct Storage(Header);
    assert_eq!(std::mem::offset_of!(Header, count), 1);
    for value in [0, 300, u32::MAX] {
        let s = Storage(Header { tag: 7, count: value });
        let p = &raw const s.0.count;
        // Le piattaforme che richiedono allineamento per u32 esercitano qui
        // il caso disallineato: offset 1 da una base allineata almeno a 4.
        if align_of::<u32>() > 1 { assert!(!p.is_aligned()); }
        // SAFETY: p indica il campo inizializzato della Storage ancora viva.
        assert_eq!(unsafe { p.read_unaligned() }, value);
    }`,
  );
  run(["-C", "opt-level=3", "-"], 3, [lookup, ffi, packed].join("//!\n"));
});
