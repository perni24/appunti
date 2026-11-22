import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Memory layout e alignment.md";
const blocks = parseNote(file).tree.children.filter((n) => n.type === "code");
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const rustdoc =
  process.env.RUSTDOC_TEST_EXECUTABLE ||
  path.join(path.dirname(rustc), "rustdoc");
const win = process.platform === "win32";

function source(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}

function run(cmd, args, { cwd, input, reject = false } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    input,
    encoding: "utf8",
    windowsHide: true,
    timeout: 60000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, !reject, cmd + ": " + r.stdout + r.stderr);
  return r;
}

test("i tre esempi Rust sono eseguibili con e senza ottimizzazioni", () => {
  for (const level of ["0", "3"]) {
    const { stdout } = run(rustdoc, [
      "--test",
      "--edition=2024",
      "-C",
      "opt-level=" + level,
      file,
    ]);
    assert.match(stdout, /3 passed; 0 failed; 0 ignored/);
  }
});

test("dimensione, allineamento e tre offset coincidono tra C11 e Rust", (t) => {
  const root = fs.realpathSync(os.tmpdir());
  const cwd = fs.mkdtempSync(path.join(root, "vault-rust-layout-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(cwd)), root);
    assert.ok(path.basename(cwd).startsWith("vault-rust-layout-"));
    fs.rmSync(cwd, { recursive: true });
  });
  const exe = win ? ".exe" : "";
  fs.writeFileSync(path.join(cwd, "layout.c"), source("c", "offsetof"));
  run(rustc, ["--edition=2024", "-o", "rs_layout" + exe, "-"], {
    cwd,
    input: source("rust", "offset_of!(Header, kind)"),
  });
  if (win)
    run(
      "cl",
      ["/nologo", "/std:c11", "/W4", "/WX", "layout.c", "/Fec_layout.exe"],
      { cwd },
    );
  else
    run(
      process.env.CC || "cc",
      ["-std=c11", "-Wall", "-Wextra", "-Werror", "layout.c", "-o", "c_layout"],
      { cwd },
    );
  const values = run(path.join(cwd, "rs_layout" + exe), [], {
    cwd,
  }).stdout.trim();
  assert.equal(
    run(path.join(cwd, "c_layout" + exe), [], { cwd }).stdout.trim(),
    values,
  );
  if (win && process.arch === "x64") assert.equal(values, "12 4 0 4 8");
  t.diagnostic("size align kind len flags: " + values);
});

test("il campo packed è copiabile ma non prendibile in prestito per riferimento", () => {
  const input =
    source("rust", "struct Compact") +
    "\nfn borrow(r: &Compact) -> &u32 { &r.count }";
  const { stderr } = run(
    rustc,
    [
      "--edition=2024",
      "--emit=metadata",
      "--error-format=json",
      "-o",
      "-",
      "-",
    ],
    { input, reject: true },
  );
  const diagnostics = stderr.trim().split(/\r?\n/).map(JSON.parse);
  assert.ok(
    diagnostics.some((d) => d.code?.code === "E0793"),
    stderr,
  );
});

test("il parser convalida tutti i tag e richiede esattamente sette byte", () => {
  const src = source("rust", "fn decode_header").replace(
    "fn main()",
    "fn demo()",
  );
  const checks = `
fn main() {
    demo();
    for tag in 0..=u8::MAX {
        let input = [tag, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc];
        let expected = match tag {
            1 => Some(Kind::Data),
            2 => Some(Kind::Ack),
            _ => None,
        };
        assert_eq!(decode_header(&input), expected.map(|kind| Header {
            kind, len: 0x89abcdef, flags: 0xfedc,
        }));
    }
    for n in 0..=12 {
        assert_eq!(decode_header(&vec![1; n]).is_some(), n == 7);
    }
}`;
  const input = ["```rust", src + checks, "```"]
    .join("\n")
    .split("\n")
    .map((s) => "//! " + s)
    .join("\n");
  assert.match(
    run(rustdoc, ["--test", "--edition=2024", "-"], { input }).stdout,
    /1 passed; 0 failed/,
  );
});
