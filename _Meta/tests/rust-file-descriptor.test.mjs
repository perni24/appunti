import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/File descriptor.md",
).tree.children.filter((b) => b.type === "code" && b.lang === "rust");
const root = fs.realpathSync(os.tmpdir());
const win = process.platform === "win32";
const nightly = process.env.RUST_FD_MIRI_TOOLCHAIN;
const linux = "x86_64-unknown-linux-gnu";
let dir;

before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-rust-fd-"));
  fs.writeFileSync(
    path.join(dir, "Cargo.toml"),
    '[package]\nname = "fd_notes"\nversion = "0.1.0"\nedition = "2024"\n',
  );
  fs.mkdirSync(path.join(dir, "tests"));
  for (const [file, marker] of [
    ["offset", "cloned_file_shares_offset"],
    ["ownership", "transfer_keeps_number"],
  ]) {
    const hits = blocks.filter((b) => b.value.includes(marker));
    assert.equal(hits.length, 1);
    fs.writeFileSync(
      path.join(dir, "tests", file + ".rs"),
      hits[0].value + "\n",
    );
  }
});
after(() => {
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-rust-fd-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function run(tool, args, input, reject = false) {
  const env = {
    ...process.env,
    CARGO_TARGET_DIR: path.join(dir, "target"),
    CARGO_NET_OFFLINE: "true",
  };
  delete env.MIRIFLAGS;
  const r = spawnSync(tool, args, {
    cwd: dir,
    env,
    input,
    encoding: "utf8",
    timeout: 90000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status === 0, !reject, r.stdout + r.stderr);
  return r;
}
function checkPipeTests(args) {
  const { stdout } = run("cargo", [...args, "--test", "ownership"]);
  assert.match(stdout, /test duplicate_outlives_original \.\.\. ok/);
  assert.match(stdout, /test transfer_keeps_number \.\.\. ok/);
  assert.match(stdout, /2 passed; 0 failed/);
}
test("cursore condiviso e seconda apertura indipendente, su host", () => {
  const { stdout } = run("cargo", ["test", "--test", "offset"]);
  assert.match(stdout, /test cloned_file_shares_offset \.\.\. ok/);
});
test("due prove su pipe Unix native", { skip: win && "host Windows" }, () =>
  checkPipeTests(["test"]),
);
test(
  "duplicazione, trasferimento ed EOF interpretati per Linux",
  { skip: !nightly && "Miri opzionale" },
  () => {
    checkPipeTests(["+" + nightly, "miri", "test", "--target", linux]);
  },
);
test(
  "il proprietario non può essere distrutto durante un prestito né riusato dopo il move",
  { skip: win && !nightly },
  () => {
    for (const [body, code] of [
      ["let fd = file.as_fd(); drop(file); std::hint::black_box(fd);", "E0505"],
      ["let _: OwnedFd = file.into(); std::hint::black_box(file);", "E0382"],
    ]) {
      const r = run(
        "rustc",
        [
          ...(nightly ? ["+" + nightly, "--target", linux] : []),
          "--edition=2024",
          "--emit=metadata",
          "--crate-type=lib",
          "--error-format=json",
          "-o",
          "probe.rmeta",
          "-",
        ],
        "use std::{fs::File, os::fd::{AsFd, OwnedFd}}; fn probe(file: File) {" +
          body +
          "}",
        true,
      );
      const diagnostics = r.stderr.trim().split(/\r?\n/).map(JSON.parse);
      assert.ok(
        diagnostics.some((d) => d.code?.code === code),
        r.stderr,
      );
    }
  },
);
