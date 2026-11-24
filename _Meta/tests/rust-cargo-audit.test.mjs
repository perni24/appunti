import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const commands = parseNote("Programmazione/Rust/Pagine/cargo audit.md").tree.children
  .filter((b) => b.type === "code" && b.lang === "sh").map((b) => b.value);
function args(command) {
  assert.ok(commands.includes(command), command);
  return command.split(" ").slice(1);
}
const audit = args("cargo audit --file Cargo.lock");
const report = args("cargo audit --file Cargo.lock --json");
const deny = args("cargo audit --file Cargo.lock --deny warnings");
const tree = args("cargo tree --locked -i notes-codec@1.2.0");
const update = args("cargo update -p notes-codec@1.2.0 --precise 1.2.1");
const verify = args("cargo test --locked");
const id = "RUSTSEC-2099-0001"; // Solo nel database sintetico temporaneo.

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rsaudit-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rsaudit-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  const file = (name) => path.join(dir, name);
  function put(name, content) {
    fs.mkdirSync(path.dirname(file(name)), { recursive: true });
    fs.writeFileSync(file(name), content);
  }
  function cargo(args, success = true) {
    const r = spawnSync("cargo", args, {
      cwd: dir, windowsHide: true, encoding: "utf8", timeout: 60000,
      env: { ...process.env, CARGO_TERM_COLOR: "never", CARGO_NET_OFFLINE: "true", CARGO_HOME: file("cargo-home"), CARGO_TARGET_DIR: file("target") },
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status === 0, success, r.stdout + r.stderr);
    return r;
  }
  function codec(version) {
    const files = {
      "Cargo.toml": `[package]\nname = "notes-codec"\nversion = "${version}"\nedition = "2024"\n`,
      "src/lib.rs": "pub fn answer() -> u8 { 42 }\n",
    };
    const checksums = {};
    for (const [name, content] of Object.entries(files)) {
      put(`vendor/notes-codec-${version}/${name}`, content);
      checksums[name] = createHash("sha256").update(content).digest("hex");
    }
    put(`vendor/notes-codec-${version}/.cargo-checksum.json`, JSON.stringify({ files: checksums, package: null }));
  }
  function advisory(info = false) {
    const meta = info ? 'informational = "unmaintained"\n' : "";
    const patched = info ? "[]" : '[">= 1.2.1"]';
    put(`db/crates/notes-codec/${id}.md`, `\`\`\`toml\n[advisory]\nid = "${id}"\npackage = "notes-codec"\ndate = "2099-01-01"\n${meta}\n[versions]\npatched = ${patched}\n\`\`\`\n\n# Synthetic local fixture\n\nOnly test metadata; both crate versions are harmless.\n`);
  }
  fs.mkdirSync(file("db/crates"), { recursive: true });
  // Only fixture metadata is scanned. No live index, user configuration or remote registry.
  put(".cargo/config.toml", '[source.crates-io]\nreplace-with = "fixture"\n[source.fixture]\ndirectory = "vendor"\n');
  put(".cargo/audit.toml", '[database]\npath = "db"\nfetch = false\nstale = false\n[yanked]\nenabled = false\n[advisories]\ninformational_warnings = ["unmaintained"]\n');
  put("Cargo.toml", '[package]\nname = "notes-app"\nversion = "0.1.0"\nedition = "2024"\n[dependencies]\nnotes-reader = { path = "reader" }\n');
  put("src/lib.rs", "#[test] fn reads_answer() { assert_eq!(notes_reader::answer(), 42); }\n");
  put("reader/Cargo.toml", '[package]\nname = "notes-reader"\nversion = "0.1.0"\nedition = "2024"\n[dependencies]\nnotes-codec = "1.2"\n');
  put("reader/src/lib.rs", "pub use notes_codec::answer;\n");
  codec("1.2.0");
  assert.match(cargo(args("cargo audit --version")).stdout, /\b0\.23\.0\b/);
  return { file, cargo, codec, advisory, put };
}

test("Un advisory nuovo segnala la versione transitiva senza cambiare il lockfile o rompere il test", (t) => {
  const { cargo, file, advisory } = project(t);
  cargo(["generate-lockfile"]);
  const lock = fs.readFileSync(file("Cargo.lock"));
  assert.equal(JSON.parse(cargo(report).stdout).vulnerabilities.count, 0);
  advisory();
  const list = JSON.parse(cargo(report, false).stdout).vulnerabilities.list;
  assert.deepEqual(list.map((v) => [v.advisory.id, v.package.name, v.package.version]), [[id, "notes-codec", "1.2.0"]]);
  assert.match(cargo(tree).stdout, /notes-codec v1\.2\.0[\s\S]*notes-reader[\s\S]*notes-app/);
  assert.match(cargo(verify).stdout, /1 passed; 0 failed/);
  assert.deepEqual(fs.readFileSync(file("Cargo.lock")), lock);
});

test("L'aggiornamento mirato corregge il report, ma non può violare un requisito esatto", (t) => {
  const { cargo, codec, advisory, file, put } = project(t);
  cargo(["generate-lockfile"]);
  codec("1.2.1");
  advisory();
  const manifest = fs.readFileSync(file("reader/Cargo.toml"), "utf8");
  put("reader/Cargo.toml", manifest.replace('"1.2"', '"=1.2.0"'));
  cargo(update);
  assert.match(cargo(["tree", "--locked"]).stdout, /notes-codec v1\.2\.0/);
  assert.equal(JSON.parse(cargo(report, false).stdout).vulnerabilities.count, 1);
  put("reader/Cargo.toml", manifest);
  cargo(update);
  assert.match(cargo(verify).stdout, /1 passed; 0 failed/);
  assert.equal(JSON.parse(cargo(report).stdout).vulnerabilities.count, 0);
  assert.match(cargo(["tree", "--locked"]).stdout, /notes-codec v1\.2\.1/);
});

test("Un avviso unmaintained è distinto da una vulnerabilità e può bloccare la CI", (t) => {
  const { cargo, advisory } = project(t);
  cargo(["generate-lockfile"]);
  advisory(true);
  const data = JSON.parse(cargo(report).stdout);
  assert.equal(data.vulnerabilities.count, 0);
  assert.equal(data.warnings.unmaintained[0].package.name, "notes-codec");
  cargo(deny, false);
});

test("Il file richiesto esplicitamente manca: nessun report; il comando implicito può generarlo", (t) => {
  const { cargo, file } = project(t);
  const r = cargo(report, false);
  assert.equal(r.stdout.trim(), "");
  assert.match(r.stderr, /Cargo\.lock/);
  assert.ok(!fs.existsSync(file("Cargo.lock")));
  cargo(["audit"]);
  assert.ok(fs.existsSync(file("Cargo.lock")));
  cargo(audit);
});
