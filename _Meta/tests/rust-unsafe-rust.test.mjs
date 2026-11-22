import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Unsafe Rust.md";
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const blocks = parseNote(file).tree.children.filter(
  (n) => n.type === "code" && n.lang === "rust",
);
function example(definition) {
  const found = blocks.filter((b) => b.value.includes(definition));
  assert.equal(found.length, 1, definition);
  return found[0].value;
}
const read = example("unsafe fn read_unchecked(");
const split = example("fn split_at_mut_safe<T>(");

function launch(cmd, args, input) {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    input,
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}
function rejects(source, diagnostic) {
  // Solo analisi dei tipi: i programmi rifiutati non vengono eseguiti.
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
    source,
  );
  assert.notEqual(r.status, 0);
  assert.ok(
    r.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse)
      .some((d) => d.level === "error" && d.code?.code === diagnostic),
    r.stderr,
  );
}

test("i tre esempi completi della nota si eseguono con rustdoc", () => {
  const rustdoc =
    process.env.RUSTDOC_TEST_EXECUTABLE ||
    path.join(
      path.dirname(rustc),
      process.platform === "win32" ? "rustdoc.exe" : "rustdoc",
    );
  assert.equal(blocks.length, 3);
  const r = launch(rustdoc, ["--test", "--edition=2024", file]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /3 passed; 0 failed; 0 ignored/);
});

test("dereferenziazione nel corpo: warning di default, errore con deny", () => {
  const body = read.replace("unsafe { *ptr }", "*ptr");
  assert.notEqual(body, read);
  const withoutDeny = body.replace("#![deny(unsafe_op_in_unsafe_fn)]", "");
  const r = launch(
    rustc,
    ["--edition=2024", "--emit=metadata", "-o", "-", "-"],
    withoutDeny,
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /warning\[E0133\]/);
  rejects(body, "E0133");
});

test("anche il chiamante deve riconoscere la precondizione", () => {
  const code = read.replace(
    "unsafe { read_unchecked(ptr) }",
    "read_unchecked(ptr)",
  );
  assert.notEqual(code, read);
  rejects(code, "E0133");
});

test("il wrapper non permette di riusare l'originale durante il prestito", () => {
  rejects(
    split +
      `
fn overlapping() {
    let mut values = [1, 2];
    let (left, _) = split_at_mut_safe(&mut values, 1);
    let again = &mut values;
    left[0] = again[0];
}`,
    "E0499",
  );
});

test("release: confronto con la std, tipi non Copy, ZST e panic di confine", (t) => {
  const parent = fs.realpathSync(os.tmpdir());
  const prefix = "appunti-rust-unsafe-";
  const dir = fs.mkdtempSync(path.join(parent, prefix));
  t.after(() => {
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const out = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const r = launch(
    rustc,
    ["--edition=2024", "--test", "-O", "-o", out, "-"],
    split +
      `
#[test]
fn matches_std() {
    for len in 0..=16 {
        for mid in 0..=len {
            let mut actual: Vec<_> = (0..len).map(|i| i.to_string()).collect();
            let mut expected = actual.clone();
            for (left, right) in [split_at_mut_safe(&mut actual, mid), expected.split_at_mut(mid)] {
                assert_eq!((left.len(), right.len()), (mid, len - mid));
                for x in left { x.push('L'); }
                for x in right { x.push('R'); }
            }
            assert_eq!(actual, expected);
        }
    }
    let mut zst = [(); 4];
    let (a, b) = split_at_mut_safe(&mut zst, 2);
    assert_eq!((a.len(), b.len()), (2, 2));
}
#[test]
#[should_panic(expected = "mid <= len")]
fn rejects_out_of_bounds() { split_at_mut_safe(&mut [1, 2], 3); }`,
  );
  assert.equal(r.status, 0, r.stderr);
  const result = launch(out, []);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /2 passed; 0 failed/);
});
