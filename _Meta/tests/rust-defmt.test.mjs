import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = (name) => parseNote("Programmazione/Rust/Pagine/" + name + ".md")
  .tree.children.filter((n) => n.type === "code").map((n) => n.value);
const page = blocks("defmt"), board = blocks("Embedded Rust");
function one(source, prefix) {
  const matches = source.filter((b) => b.startsWith(prefix));
  assert.equal(matches.length, 1, prefix);
  return matches[0];
}
const root = fs.realpathSync(os.tmpdir()), target = "thumbv7em-none-eabi";
let dir, fw, reader, elf, objdump, infoTable;
function run(cmd, args, { cwd = fw, level, fail = false } = {}) {
  const env = { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") };
  delete env.DEFMT_LOG;
  if (level) env.DEFMT_LOG = level;
  const r = spawnSync(cmd, args, { cwd, env, encoding: "utf8", windowsHide: true, timeout: 240000 });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  if (fail) assert.notEqual(r.status, 0, out);
  else assert.equal(r.status, 0, out);
  return out;
}
const args = one(page, "cargo build ").split(" ").slice(1);
before(() => {
  dir = fs.mkdtempSync(path.join(root, "vault-defmt-"));
  fw = path.join(dir, "fw");
  reader = path.join(dir, "reader");
  for (const [file, source, prefix] of [
    ["Cargo.toml", page, "[package]"], [".cargo/config.toml", page, "[target."],
    ["src/main.rs", page, "#![no_std]"], ["memory.x", board, "MEMORY"],
    ["build.rs", board, "fn main() {\n    println!"],
  ]) {
    const dest = path.join(fw, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, one(source, prefix) + "\n");
  }
  assert.deepEqual(args, ["build", "--release", "--target", target]);
  run("cargo", args);
  elf = path.join(dir, one(page, "probe-rs run ").split(" ").at(-1));
  const host = /^host: (.+)$/m.exec(run("rustc", ["-vV"]))[1].trim();
  objdump = path.join(run("rustc", ["--print", "sysroot"]).trim(), "lib", "rustlib", host, "bin",
    process.platform === "win32" ? "llvm-objdump.exe" : "llvm-objdump");
  infoTable = run(objdump, ["-t", elf]);
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith("vault-defmt-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function indexOf(table, format) {
  const row = table.split(/\r?\n/).find((line) => line.includes(".defmt") && line.includes(format));
  return row ? parseInt(row.trim().split(/\s+/)[0], 16) : null;
}
test("ELF ARM con tabella defmt, blocco RTT e messaggi del filtro info", () => {
  assert.match(run(objdump, ["-f", elf]), /elf32-littlearm/i);
  assert.match(infoTable, /\b_SEGGER_RTT\b/);
  assert.notEqual(indexOf(infoTable, "supply={=u16} mV"), null);
  assert.notEqual(indexOf(infoTable, "supply below threshold"), null);
  assert.equal(indexOf(infoTable, "sample={}"), null);
  assert.equal(one(page, "probe-rs attach ").split(" ").at(-1), one(page, "probe-rs run ").split(" ").at(-1));
});
test("Il decoder host ricostruisce i due messaggi e respinge un payload incompleto", () => {
  fs.mkdirSync(path.join(reader, "src"), { recursive: true });
  fs.writeFileSync(path.join(reader, "Cargo.toml"),
    '[package]\nname="check-frames"\nversion="0.1.0"\nedition="2024"\n[dependencies]\ndefmt-decoder="=1.2.0"\n');
  fs.writeFileSync(path.join(reader, "src/main.rs"), `use defmt_decoder::{DecodeError, Table};
fn main() {
    let mut args = std::env::args().skip(1);
    let elf = std::fs::read(args.next().unwrap()).unwrap();
    let table = Table::parse(&elf).unwrap().unwrap();
    let mut ids = args.map(|s| s.parse::<u16>().unwrap().to_le_bytes());
    let info = ids.next().unwrap();
    let warn = ids.next().unwrap();
    // Payload grezzo dopo il deframing, non byte catturati via RTT.
    let mut data = info.to_vec();
    data.extend_from_slice(&2980u16.to_le_bytes());
    assert!(matches!(table.decode(&data[..3]), Err(DecodeError::UnexpectedEof)));
    for payload in [&data[..], &warn[..]] {
        let (frame, read) = table.decode(payload).unwrap();
        assert_eq!(read, payload.len());
        println!("{} {}", frame.level().unwrap().as_str().to_uppercase(), frame.display_message());
    }
}`);
  const indices = ["supply={=u16} mV", "supply below threshold"].map((s) => {
    const id = indexOf(infoTable, s);
    assert.ok(Number.isInteger(id));
    return String(id);
  });
  const output = run("cargo", ["run", "--quiet", "--", elf, ...indices], { cwd: reader });
  assert.equal(output.trim().replaceAll("\r\n", "\n"), one(page, "INFO supply="));
});
test("Ricompilare con DEFMT_LOG=debug aggiunge il messaggio per Reading", () => {
  run("cargo", args, { level: "debug" });
  assert.notEqual(indexOf(run(objdump, ["-t", elf]), "sample={}"), null);
});
test("Senza il logger globale il link del firmware fallisce", () => {
  const src = one(page, "#![no_std]");
  assert.ok(src.includes("use defmt_rtt as _;"));
  fs.writeFileSync(path.join(fw, "src/main.rs"), src.replace("use defmt_rtt as _;", ""));
  assert.match(run("cargo", args, { fail: true }), /undefined symbol: _defmt_(acquire|write|release)/);
});
