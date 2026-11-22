import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const code = (name) => parseNote("Programmazione/Rust/Pagine/" + name + ".md")
  .tree.children.filter((block) => block.type === "code").map((block) => block.value);
const note = code("probe-rs"), project = code("Embedded Rust");
const cli = process.env.PROBE_RS_EXE || "probe-rs";
const chip = "STM32F401RETx", target = "thumbv7em-none-eabi";
function one(blocks, prefix) {
  const matches = blocks.filter((b) => b.startsWith(prefix));
  assert.equal(matches.length, 1, prefix);
  return matches[0];
}
function run(cmd, args, options = {}, expected = 0) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 180000, windowsHide: true, ...options });
  assert.ifError(r.error);
  assert.equal(r.status, expected, r.stderr + r.stdout);
  return r.stdout + r.stderr;
}
test("CLI e catalogo offline: modello, memoria e rifiuto di un modello ignoto", () => {
  assert.ok(note.includes("probe-rs --version"));
  assert.match(run(cli, ["--version"]), /probe-rs 0\.32\.0\b/);
  assert.ok(note.includes("probe-rs chip info " + chip));
  const info = run(cli, ["chip", "info", chip]);
  assert.match(info, /Armv7em/);
  assert.match(info, /NVM: 0x08000000\.\.0x08080000/);
  assert.match(info, /RAM: 0x20000000\.\.0x20018000/);
  assert.match(run(cli, ["chip", "info", "VAULT_NONEXISTENT_0000"], {}, 1), /not found/);
});
test("list, run e attach: solo help della CLI, nessuna connessione", () => {
  assert.ok(note.includes("probe-rs list"));
  for (const cmd of ["list", "run", "attach"]) {
    const help = run(cli, [cmd, "--help"]);
    assert.match(help, new RegExp("Usage: .* " + cmd + " "));
    if (cmd !== "list") {
      assert.match(help, /--chip <CHIP>/);
      assert.match(help, /--probe /);
      assert.ok(one(note, "probe-rs " + cmd).startsWith("probe-rs " + cmd + " --chip " + chip + " "));
    }
    if (cmd === "attach") assert.match(help, /not flashed or reset/);
  }
});
test("build senza runner; Cargo run consegna chip ed ELF al runner senza usare USB", (t) => {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-probe-runner-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-probe-runner-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  function write(file, contents) {
    const dest = path.join(dir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, contents + "\n");
  }
  for (const [file, marker] of [["Cargo.toml", "[package]"], ["src/lib.rs", "#![no_std]\n\n"],
    ["examples/blink.rs", "#![no_std]\n#![no_main]"], ["memory.x", "MEMORY"], ["build.rs", "fn main() {\n    println!"]]) {
    write(file, one(project, marker));
  }
  const config = one(note, "[target." + target + "]");
  const runner = JSON.parse(/^runner = (.+)$/m.exec(config)[1]);
  assert.deepEqual(runner, ["probe-rs", "run", "--chip", chip]);
  // Sostituiamo solo l'eseguibile: Cargo continua a scegliere il target e ad aggiungere il percorso.
  write("capture.cjs", 'require("node:fs").writeFileSync("args.json", JSON.stringify(process.argv.slice(2)))');
  write(".cargo/config.toml", config.replace(/^runner = .+$/m, "runner = " +
    JSON.stringify([process.execPath, path.join(dir, "capture.cjs"), ...runner.slice(1)])));
  const env = { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") };
  delete env.CARGO_TARGET_THUMBV7EM_NONE_EABI_RUNNER;
  const elf = one(note, "probe-rs run ").split(" ").at(-1);
  for (const action of ["build", "run"]) {
    const args = one(note, "cargo " + action + " ").split(" ").slice(1);
    assert.deepEqual(args, [action, "--release", "--example", "blink", "--target", target]);
    run("cargo", args, { cwd: dir, env });
    if (action === "build") {
      assert.equal(fs.existsSync(path.join(dir, "args.json")), false);
      assert.equal(fs.readFileSync(path.join(dir, elf)).subarray(0, 4).toString(), "\x7fELF");
    }
  }
  const args = JSON.parse(fs.readFileSync(path.join(dir, "args.json"), "utf8"));
  assert.deepEqual(args.slice(0, -1), runner.slice(1));
  assert.equal(path.resolve(dir, args.at(-1)), path.resolve(dir, elf));
});
