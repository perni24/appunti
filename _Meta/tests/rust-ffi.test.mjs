import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const note = parseNote("Programmazione/Rust/Pagine/FFI.md");
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const win = process.platform === "win32";
const exe = win ? ".exe" : "";

function source(lang, marker) {
  const blocks = note.tree.children.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
  );
  assert.equal(blocks.length, 1, marker);
  return blocks[0].value;
}

function fixture(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rust-ffi-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rust-ffi-"));
    fs.rmSync(dir, { recursive: true });
  });
  return dir;
}

function run(cwd, tool, args) {
  const r = spawnSync(tool, args, {
    cwd,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status, 0, tool + ": " + r.stdout + r.stderr);
}

test("il wrapper usa abs della libreria C e rifiuta il minimo", (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, "main.rs"), source("rust", "fn native_abs"));
  for (const level of ["0", "3"]) {
    run(dir, rustc, ["--edition=2024", "-C", "opt-level=" + level, "main.rs"]);
    run(dir, path.join(dir, "main" + exe), []);
  }
});

test("un chiamante C compilato con l'header usa i simboli della cdylib", (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, "lib.rs"), source("rust", "fn app_is_ready"));
  fs.writeFileSync(path.join(dir, "app.h"), source("c", "#ifndef APP_H"));
  fs.writeFileSync(path.join(dir, "client.c"), source("c", "int main(void)"));
  run(dir, rustc, [
    "--edition=2024",
    "--crate-name",
    "note_ffi",
    "--crate-type=cdylib",
    "lib.rs",
  ]);
  if (win) {
    run(dir, "cl.exe", [
      "/nologo",
      "/W4",
      "/WX",
      "client.c",
      "/Feclient.exe",
      "/link",
      "note_ffi.dll.lib",
    ]);
  } else {
    run(dir, process.env.CC || "cc", [
      "-std=c99",
      "-Wall",
      "-Wextra",
      "-Werror",
      "client.c",
      "-L.",
      "-lnote_ffi",
      "-Wl,-rpath," + dir,
      "-o",
      "client",
    ]);
  }
  run(dir, path.join(dir, "client" + exe), []);
});
