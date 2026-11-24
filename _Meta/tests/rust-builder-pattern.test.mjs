import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/Builder pattern.md").tree.children
  .filter((node) => node.type === "code");
const [library, consumer, borrowed] = blocks.filter((b) => b.lang === "rust").map((b) => b.value);
const [create, verify] = blocks.filter((b) => b.lang === "sh").map((b) => b.value.split(" ").slice(1));
const root = fs.realpathSync(os.tmpdir());
let temp, cwd;
const put = (file, source) => fs.writeFileSync(path.join(cwd, file), source + "\n");
function cargo(args, expected = 0) {
  const r = spawnSync("cargo", args, {
    cwd, windowsHide: true, encoding: "utf8", timeout: 60000,
    env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(temp, "target") },
  });
  assert.ifError(r.error);
  const output = r.stdout + r.stderr;
  assert.equal(r.status, expected, output);
  return output;
}
before(() => {
  temp = fs.mkdtempSync(path.join(root, "vault-rust-builder-"));
  cwd = temp;
  cargo([...create, "--vcs", "none"]);
  cwd = path.join(temp, create.at(-1));
  fs.mkdirSync(path.join(cwd, "tests"));
});
beforeEach(() => {
  put("src/lib.rs", library);
  put("tests/builder.rs", consumer);
});
after(() => {
  if (!temp) return;
  assert.equal(path.dirname(fs.realpathSync(temp)), root);
  assert.ok(path.basename(temp).startsWith("vault-rust-builder-"));
  fs.rmSync(temp, { recursive: true, maxRetries: 3 });
});

test("Configurazione predefinita, override condizionale e validazione dal client", () => {
  assert.match(cargo(verify), /3 passed; 0 failed/);
  assert.match(cargo([...verify, "--release"]), /3 passed; 0 failed/);
});

test("Il builder per riferimento conserva tutti gli argomenti senza eseguire comandi", () => {
  put("tests/builder.rs", consumer + "\n" + borrowed);
  assert.match(cargo(verify), /4 passed; 0 failed/);
});

test("Timeout uguali ammessi, zero e sforamento rifiutati; conta solo l'ultimo valore", () => {
  put("tests/builder.rs", consumer + `
#[test]
fn limits_and_order() -> Result<(), BuildError> {
    let a = Duration::from_nanos(1);
    let b = Duration::from_nanos(2);
    for cfg in [
        ClientConfig::builder().timeout(a).connect_timeout(a).build()?,
        ClientConfig::builder().connect_timeout(a).timeout(a).build()?,
        ClientConfig::builder().timeout(b).timeout(a).build()?,
        ClientConfig::builder().timeout(a).connect_timeout(b).connect_timeout(a).build()?,
    ] {
        assert_eq!((cfg.timeout(), cfg.connect_timeout()), (a, a));
    }
    assert_eq!(ClientConfig::builder().timeout(Duration::ZERO).build().unwrap_err(), BuildError::ZeroTimeout);
    assert_eq!(ClientConfig::builder().timeout(a).connect_timeout(b).build().unwrap_err(), BuildError::ConnectionExceedsTotal);
    Ok(())
}`);
  assert.match(cargo(verify), /4 passed; 0 failed/);
});

test("Un setter per valore senza riassegnazione e una seconda build usano un valore mosso", () => {
  for (const code of [
    consumer.replace("builder = builder.user_agent(name);", "builder.user_agent(name);"),
    consumer + `
#[test]
fn retry_build() {
    let builder = ClientConfig::builder().timeout(Duration::ZERO);
    assert!(builder.build().is_err());
    let _ = builder.build();
}`,
  ]) {
    put("tests/builder.rs", code);
    const out = cargo(["check", "--test", "builder", "--message-format=json"], 101);
    const diagnostics = out.split(/\r?\n/).filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
    assert.ok(diagnostics.some((m) => m.target?.name === "builder" && m.message?.code?.code === "E0382"), out);
  }
});

test("Congelare il default di connessione lascia compilare i tipi, ma rompe il timeout ereditato", () => {
  put("src/lib.rs", library.replace("unwrap_or(self.timeout)", "unwrap_or(Duration::from_secs(5))"));
  cargo(["check", "--test", "builder"]);
  const out = cargo(verify, 101);
  assert.match(out, /defaults_follow_the_final_total .*FAILED/);
  assert.match(out, /2 passed; 1 failed/);
});
