import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Error types pubblici.md").tree.children
  .filter((node) => node.type === "code");
const [library, consumer] = blocks.filter((b) => b.lang === "rust").map((b) => b.value);
const [create, verify] = blocks.filter((b) => b.lang === "sh").map((b) => b.value.split(" ").slice(1));
const port = blocks.find((b) => b.lang === "text").value;

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const tmp = fs.mkdtempSync(path.join(root, "vault-port-errors-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(tmp)), root);
    assert.ok(path.basename(tmp).startsWith("vault-port-errors-"));
    fs.rmSync(tmp, { recursive: true, maxRetries: 3 });
  });
  let cwd = tmp;
  function cargo(args, expected = 0) {
    const r = spawnSync("cargo", args, {
      cwd, encoding: "utf8", windowsHide: true, timeout: 60000,
      env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(tmp, "target") },
    });
    assert.ifError(r.error);
    const out = r.stdout + r.stderr;
    assert.equal(r.status, expected, out);
    return out;
  }
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(tmp, create.at(-1));
  const write = (name, data) => fs.writeFileSync(path.join(cwd, name), data);
  fs.mkdirSync(path.join(cwd, "tests"));
  write("src/lib.rs", library);
  write("tests/consumer.rs", consumer);
  write("tests/port.txt", port + "\n");
  return { cargo, write };
}

test("Il chiamante della nota usa il valore predefinito solo per un file assente", (t) => {
  const { cargo } = project(t);
  assert.match(cargo(verify), /3 passed; 0 failed/);
  assert.match(cargo([...verify, "--release"]), /3 passed; 0 failed/);
});

test("Valori limite, errori del parser ed errori UTF-8 non vengono confusi", (t) => {
  const { cargo, write } = project(t);
  for (const [file, value] of [["min"," 1\n"], ["max","65535"], ["zero","0"], ["big","65536"], ["empty",""], ["bytes",Buffer.from([0xff])]]) {
    write("tests/" + file, value);
  }
  write("tests/consumer.rs", consumer + `
#[test]
fn boundaries() {
    let dir = Path::new(ROOT).join("tests");
    for (file, value) in [("min", 1), ("max", 65535)] {
        assert_eq!(port_or_default(&dir.join(file)).unwrap(), value);
    }
    for file in ["zero", "big", "empty", "bytes"] {
        let e = port_or_default(&dir.join(file)).unwrap_err();
        assert_eq!(e.kind(), ConfigErrorKind::Invalid);
        let source = e.source().unwrap();
        if file == "bytes" {
            assert!(source.is::<std::str::Utf8Error>());
        } else {
            assert!(source.is::<std::num::ParseIntError>());
        }
    }
}`);
  assert.match(cargo(verify), /4 passed; 0 failed/);
});

test("Una directory non è un file mancante e l'errore I/O rimane ispezionabile", (t) => {
  const { cargo, write } = project(t);
  write("tests/consumer.rs", consumer + `
#[test]
fn io_causes() {
    use std::io::{Error as IoError, ErrorKind};
    let dir = Path::new(ROOT).join("tests");
    let e = port_or_default(&dir).unwrap_err();
    assert_eq!(e.kind(), ConfigErrorKind::Unreadable);
    assert!(e.source().unwrap().is::<IoError>());
    let missing = load_port(&dir.join("absent-port.txt")).unwrap_err();
    assert_eq!(missing.source().unwrap().downcast_ref::<IoError>().unwrap().kind(), ErrorKind::NotFound);
}`);
  assert.match(cargo(verify), /4 passed; 0 failed/);
});

test("Il match esterno richiede un ripiego, anche prima di aggiungere una categoria", (t) => {
  const { cargo, write } = project(t);
  const classifier = `
fn action(kind: ConfigErrorKind) -> &'static str {
    match kind {
        ConfigErrorKind::Missing => "default",
        ConfigErrorKind::Unreadable => "report",
        ConfigErrorKind::Invalid => "fix",
        FALLBACK
    }
}`;
  write("tests/consumer.rs", consumer + classifier.replace("FALLBACK", ""));
  const messages = cargo(["check", "--test", "consumer", "--message-format=json"], 101)
    .split(/\r?\n/).filter((line) => line.startsWith("{")).map((line) => JSON.parse(line));
  assert.ok(messages.some((m) => m.target?.name === "consumer" && m.message?.code?.code === "E0004"));
  write("tests/consumer.rs", consumer + classifier.replace("FALLBACK", '_ => "report",'));
  cargo(["check", "--test", "consumer"]);
  write("src/lib.rs", library.replace("    Missing,", "    Busy,\n    Missing,")
    .replace("ConfigErrorKind::Missing =>", 'ConfigErrorKind::Busy => "configuration is busy",\n            ConfigErrorKind::Missing =>'));
  assert.match(cargo(verify), /3 passed; 0 failed/);
});

test("Riclassificare un errore invalido come assenza compila ma attiva il default", (t) => {
  const { cargo, write } = project(t);
  write("src/lib.rs", library.replace("text.trim().parse().map_err(|e| ConfigError::new(Invalid, e))",
    "text.trim().parse().map_err(|e| ConfigError::new(Missing, e))"));
  cargo(["check", "--test", "consumer"]);
  const out = cargo(verify, 101);
  assert.match(out, /malformed_file_is_reported_with_a_cause .*FAILED/);
  assert.match(out, /8080/);
  assert.match(out, /2 passed; 1 failed/);
});
