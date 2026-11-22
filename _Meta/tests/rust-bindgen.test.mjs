import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const note = parseNote("Programmazione/Rust/Pagine/bindgen e cbindgen.md");
const blocks = note.tree.children.filter((n) => n.type === "code");

function project(t, files) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rust-bindgen-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rust-bindgen-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  for (const [relative, lang, marker] of files) {
    const found = blocks.filter(
      (b) => b.lang === lang && b.value.includes(marker),
    );
    assert.equal(found.length, 1, relative);
    const file = path.join(dir, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, found[0].value + "\n");
  }
  return dir;
}

function run(cwd, tool, args) {
  const r = spawnSync(tool, args, {
    cwd,
    env: { ...process.env, CARGO_TARGET_DIR: path.join(cwd, "target") },
    encoding: "utf8",
    timeout: 300000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, tool + ": " + r.stdout + r.stderr);
  return r.stdout;
}

test("bindgen legge l'header e Cargo esegue il wrapper collegato a C", (t) => {
  const dir = project(t, [
    ["Cargo.toml", "toml", "note_import"],
    ["native/note.h", "c", "#ifndef NOTE_H"],
    ["native/note.c", "c", "return a > b"],
    ["build.rs", "rust", "bindgen::Builder"],
    ["src/lib.rs", "rust", "pub fn maximum"],
  ]);
  assert.match(run(dir, "cargo", ["test"]), /test maximum_uses_c \.\.\. ok/);
});

test("cbindgen produce l'header con cui il client C usa la libreria Rust", (t) => {
  const dir = project(t, [
    ["Cargo.toml", "toml", "note_export"],
    ["src/lib.rs", "rust", "fn note_max_i32"],
    ["client.c", "c", '#include "note_export.h"'],
  ]);
  run(dir, process.env.CBINDGEN || "cbindgen", [
    "--lang",
    "c",
    "--crate",
    "note_export",
    "--output",
    "note_export.h",
  ]);
  run(dir, "cargo", ["build"]);
  const bin = path.join(dir, "target", "debug");
  if (process.platform === "win32") {
    run(dir, "cl", [
      "/nologo",
      "client.c",
      "/Fetarget\\debug\\client.exe",
      "/link",
      "target\\debug\\note_export.dll.lib",
    ]);
    run(dir, path.join(bin, "client.exe"), []);
  } else {
    const origin = process.platform === "darwin" ? "@loader_path" : "$ORIGIN";
    run(dir, process.env.CC || "cc", [
      "client.c",
      "-Ltarget/debug",
      "-lnote_export",
      "-Wl,-rpath," + origin,
      "-o",
      "target/debug/client",
    ]);
    run(dir, path.join(bin, "client"), []);
  }
});
