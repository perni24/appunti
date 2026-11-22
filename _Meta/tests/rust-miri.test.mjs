import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Miri.md",
).tree.children.filter((n) => n.type === "code");
const commands = blocks.filter((b) => b.lang === "sh").map((b) => b.value);
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-miri-";
const root = fs.mkdtempSync(path.join(parent, prefix));
const crate = path.join(root, "miri-demo");

after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});

function cargo(command, cwd = crate) {
  assert.ok(
    commands.includes(command),
    "Comando assente dalla nota: " + command,
  );
  const env = {
    ...process.env,
    CARGO_NET_OFFLINE: "true",
    CARGO_TERM_COLOR: "never",
    CARGO_TARGET_DIR: path.join(root, "target"),
  };
  delete env.MIRIFLAGS;
  const r = spawnSync(
    process.env.CARGO_TEST_EXECUTABLE || "cargo",
    command.split(" ").slice(1),
    {
      cwd,
      env,
      encoding: "utf8",
      timeout: 180000,
      windowsHide: true,
    },
  );
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r.stdout + r.stderr;
}
before(() => {
  const sources = blocks.filter((b) => b.lang === "rust");
  assert.equal(sources.length, 1);
  cargo("cargo new --lib miri-demo --vcs none", root);
  fs.writeFileSync(path.join(crate, "src", "lib.rs"), sources[0].value + "\n");
});
function fullSuite(output) {
  assert.match(
    output,
    /2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out/,
  );
  for (const name of ["handles_empty", "reads_last_byte"])
    assert.ok(output.includes("test tests::" + name + " ... ok"), output);
}
test("Cargo esegue i due unit test realmente presenti in src/lib.rs", () => {
  fullSuite(cargo("cargo test --lib"));
});
test(
  "Miri interpreta la suite completa e il singolo test esatto",
  {
    skip:
      process.env.RUN_MIRI_NOTE_TEST !== "1" &&
      "richiede nightly con Miri e sysroot già preparato",
  },
  () => {
    assert.match(cargo("cargo +nightly miri --version"), /miri \S+/);
    fullSuite(cargo("cargo +nightly miri test --lib"));
    const result = cargo(
      "cargo +nightly miri test --lib -- tests::reads_last_byte --exact",
    );
    assert.match(
      result,
      /1 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out/,
    );
    assert.ok(result.includes("test tests::reads_last_byte ... ok"));
  },
);
