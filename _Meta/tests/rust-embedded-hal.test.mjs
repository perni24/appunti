import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/embedded-hal.md",
).tree.children.filter((n) => n.type === "code");
function block(lang, prefix) {
  const matches = blocks.filter(
    (b) => b.lang === lang && b.value.startsWith(prefix),
  );
  assert.equal(matches.length, 1, prefix);
  return matches[0].value;
}

const gpio = `use core::cell::RefCell;
use embedded_hal::{delay::DelayNs, digital::{ErrorKind, ErrorType, OutputPin}};
use sonda_hal::pulse_high;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Step { High, Wait(u32), Low }
struct Pin<'a>(&'a RefCell<Vec<Step>>, Option<Step>);
impl ErrorType for Pin<'_> { type Error = ErrorKind; }
impl Pin<'_> {
    fn command(&self, op: Step) -> Result<(), ErrorKind> {
        self.0.borrow_mut().push(op);
        if self.1 == Some(op) { Err(ErrorKind::Other) } else { Ok(()) }
    }
}
impl OutputPin for Pin<'_> {
    fn set_high(&mut self) -> Result<(), ErrorKind> { self.command(Step::High) }
    fn set_low(&mut self) -> Result<(), ErrorKind> { self.command(Step::Low) }
}
struct Timer<'a>(&'a RefCell<Vec<Step>>);
impl DelayNs for Timer<'_> {
    fn delay_ns(&mut self, ns: u32) { self.0.borrow_mut().push(Step::Wait(ns)) }
}

#[test]
fn ordine_durata_e_propagazione() {
    use Step::*;
    for (failure, expected) in [(None, vec![High, Wait(12000), Low]),
        (Some(High), vec![High]), (Some(Low), vec![High, Wait(12000), Low])] {
        let trace = RefCell::new(Vec::new());
        let result = pulse_high(&mut Pin(&trace, failure), &mut Timer(&trace), 12);
        assert_eq!(result, failure.map_or(Ok(()), |_| Err(ErrorKind::Other)));
        assert_eq!(trace.into_inner(), expected);
    }
}`;

test("embedded-hal: contratto SPI, impulso GPIO e compilazione ARM", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-embedded-hal-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const write = (name, body) =>
    fs.writeFileSync(path.join(dir, name), body + "\n");
  fs.mkdirSync(path.join(dir, "src"));
  fs.mkdirSync(path.join(dir, "tests"));
  write("Cargo.toml", block("toml", "[package]"));
  const lib = block("rust", "#![no_std]");
  write("src/lib.rs", lib);
  write("tests/protocollo.rs", block("rust", "use embedded_hal::spi"));
  write("tests/gpio.rs", gpio);
  function cargo(args, expectedOK = true) {
    const r = spawnSync("cargo", args, {
      cwd: dir,
      env: { ...process.env, CARGO_TARGET_DIR: path.join(dir, "target") },
      encoding: "utf8",
      windowsHide: true,
      timeout: 120000,
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status === 0, expectedOK, r.stdout + r.stderr);
    return r.stdout;
  }
  await t.test(
    "il test pubblico copre identità corretta, ID inatteso ed errore SPI",
    () => {
      const args = block("sh", "cargo test ").split(" ").slice(1);
      assert.match(cargo(args), /1 passed; 0 failed/);
    },
  );
  await t.test(
    "impulso: high, attesa in microsecondi, low ed errori GPIO",
    () => {
      assert.match(
        cargo(["test", "--locked", "--offline", "--test", "gpio"]),
        /1 passed; 0 failed/,
      );
    },
  );
  await t.test("rlib no_std per ARM dal comando pubblicato", () => {
    const args = block("sh", "cargo build ").split(" ").slice(1);
    const events = cargo([
      ...args,
      "--locked",
      "--offline",
      "--message-format=json",
    ])
      .trim()
      .split(/\r?\n/)
      .map(JSON.parse);
    assert.ok(
      events.some(
        (e) =>
          e.reason === "compiler-artifact" &&
          e.target.name === "sonda_hal" &&
          e.filenames.some((f) => f.endsWith(".rlib") && fs.existsSync(f)),
      ),
    );
  });
  await t.test(
    "il test pubblico respinge scrittura e lettura in due transazioni",
    () => {
      const wrong = lib.replace(
        "self.device\n            .transaction(&mut [Operation::Write(&[0x8f]), Operation::Read(&mut id)])",
        "self.device.write(&[0x8f]).map_err(ProbeError::Bus)?;\n        self.device.read(&mut id)",
      );
      assert.notEqual(wrong, lib);
      write("src/lib.rs", wrong);
      assert.match(
        cargo(["test", "--locked", "--offline", "--test", "protocollo"], false),
        /attesa una scrittura seguita da una lettura/,
      );
    },
  );
});
