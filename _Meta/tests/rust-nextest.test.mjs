import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = (name) => parseNote(`Programmazione/Rust/Pagine/${name}.md`).tree.children.filter((b) => b.type === "code");
const page = blocks("cargo-nextest"), integration = blocks("Integration test");
function rust(snippets, marker) {
  const found = snippets.filter((b) => b.lang === "rust" && b.value.includes(marker));
  assert.equal(found.length, 1, marker);
  return found[0].value;
}
const commands = page.filter((b) => b.lang === "sh").map((b) =>
  b.value.match(/'[^']*'|[^\s']+/g).map((arg) => arg.replace(/^'|'$/g, "")));
const [, version, list, partial, listExact, runExact, full, doc, ci] = commands;
const config = page.find((b) => b.lang === "toml").value, cfgPath = ".config/nextest.toml";
const comments = rust(blocks("Doc test"), "IntErrorKind::InvalidDigit");
const lib = rust(blocks("Unit test"), "pub fn parse_percentage").replace("pub fn parse_percentage", () => comments + "\npub fn parse_percentage");
const cli = rust(integration, "fn run(args:");
const root = fs.realpathSync(os.tmpdir()), prefix = "vault-nx-";
let dir, cwd, env;
function run([program, ...args], ok = true) {
  const r = spawnSync(program, args, { cwd, env, windowsHide: true, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  const out = r.stdout + r.stderr;
  assert.equal(r.status === 0, ok, out);
  return out;
}
function put(file, source) {
  const dest = path.join(cwd, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, source + "\n");
}
function junit() {
  const xml = fs.readFileSync(path.join(cwd, "target/nextest/ci/junit.xml"));
  const parse = "import json,sys,xml.etree.ElementTree as E; cases=E.fromstring(sys.stdin.buffer.read()).findall('.//testcase'); print(json.dumps([[c.get('name'), c.find('failure') is not None or c.find('error') is not None] for c in cases]))";
  const r = spawnSync("python", ["-c", parse], { input: xml, encoding: "utf8", windowsHide: true });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
before(() => {
  cwd = dir = fs.mkdtempSync(path.join(root, prefix));
  env = { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "t") };
  assert.match(run(version), /cargo-nextest 0\.9\.152\b/);
  run(["cargo", "new", "--lib", "--vcs", "none", "percentage_notes"]);
  cwd = path.join(dir, "percentage_notes");
  put("src/lib.rs", lib);
  put("src/bin/percent.rs", rust(integration, "fn main()"));
  put("tests/common/mod.rs", rust(integration, "pub const ABOVE_MAX"));
  put("tests/api.rs", rust(integration, "fn clamps_numeric_input"));
  put("tests/cli.rs", cli);
  put(cfgPath, config);
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), root);
  assert.ok(path.basename(dir).startsWith(prefix));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
test("Il nome breve seleziona due casi; binario e nome esatto ne selezionano uno", () => {
  const all = run(list);
  assert.match(all, /tests::rejects_percent_suffix/);
  assert.match(all, /^percentage_notes::api\s+rejects_percent_suffix\s*$/m);
  assert.match(run(partial), /2 tests run: 2 passed/);
  const one = run(listExact);
  assert.match(one, /rejects_percent_suffix/);
  assert.doesNotMatch(one, /tests::rejects_percent_suffix/);
  assert.match(run(runExact), /1 test run: 1 passed/);
});
test("Un errore nel solo doc test lascia verdi i dieci test ordinari", () => {
  assert.match(run(doc), /2 passed; 0 failed/);
  const wrong = lib.replace('(" 120 ")?, 100', '(" 120 ")?, 99');
  assert.notEqual(wrong, lib);
  put("src/lib.rs", wrong);
  try {
    assert.match(run(full), /10 tests run: 10 passed/);
    assert.match(run(doc, false), /left: 100\s+right: 99/);
  } finally { put("src/lib.rs", lib); }
});
test("Il JUnit del profilo CI distingue i dieci casi e registra il singolo fallimento della CLI", () => {
  const main = rust(integration, "fn main()");
  assert.match(run(ci), /10 tests run: 10 passed/);
  const green = junit();
  assert.equal(green.length, 10);
  assert.ok(green.every(([, failed]) => !failed));
  const wrong = main.replace('eprintln!("invalid percentage");\n        ExitCode::from(2)', 'eprintln!("invalid percentage");\n        ExitCode::SUCCESS');
  assert.notEqual(wrong, main);
  put("src/bin/percent.rs", wrong);
  try {
    run(ci, false);
    const red = junit();
    assert.equal(red.length, 10);
    assert.deepEqual(red.filter(([, failed]) => failed), [["invalid_input_is_a_process_error", true]]);
  } finally { put("src/bin/percent.rs", main); }
});
test("Una soglia semplice segnala lentezza; terminate-after fa fallire il caso", () => {
  const exact = [...ci, "-E", "binary(=cli) & test(=requires_one_argument)"];
  const original = '{ period = "30s", terminate-after = 2 }';
  assert.ok(config.includes(original));
  put("tests/cli.rs", cli.replace("fn requires_one_argument() {", "fn requires_one_argument() {\n    std::thread::sleep(std::time::Duration::from_secs(2));"));
  try {
    put(cfgPath, config.replace(original, '"200ms"'));
    const out = run(exact);
    assert.match(out, /1 test run: 1 passed/);
    assert.match(out, /\bslow\b/i);
    put(cfgPath, config.replace(original, '{ period = "200ms", terminate-after = 2 }'));
    assert.match(run(exact, false), /\bTIMEOUT\b/);
  } finally { put(cfgPath, config); put("tests/cli.rs", cli); }
});
