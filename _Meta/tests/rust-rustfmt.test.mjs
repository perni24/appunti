import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/rustfmt.md").tree.children;
function snippet(lang, marker) {
  const found = blocks.filter((b) => b.type === "code" && b.lang === lang && b.value.includes(marker));
  assert.equal(found.length, 1, marker);
  return found[0].value;
}
const raw = snippet("rust", "mod tests");
const formatted = snippet("rust", "value: i32");
const demo = snippet("rust", "async fn");
const table = snippet("rust", "rustfmt::skip");
const config = snippet("toml", "style_edition");
const check = snippet("sh", "fmt --all --check");
const apply = "cargo fmt --all";
assert.ok(blocks.some((b) => b.type === "code" && b.value === apply));
const unit = snippet("sh", "test --lib");
const nl = (s) => s.replace(/\r\n/g, "\n");
const src = "src/lib.rs";

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rustfmt-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rustfmt-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  function put(name, content) {
    const file = path.join(dir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content + "\n");
  }
  const read = (name) => fs.readFileSync(path.join(dir, name), "utf8");
  function run(command, success = true) {
    const [program, ...args] = command.split(" ");
    const r = spawnSync(program, args, {
      cwd: dir, encoding: "utf8", windowsHide: true, timeout: 60000,
      env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TERM_COLOR: "never", CARGO_TARGET_DIR: path.join(dir, "target") },
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    assert.equal(r.status === 0, success, r.stdout + r.stderr);
    return r.stdout + r.stderr;
  }
  put("Cargo.toml", '[package]\nname = "format_notes"\nversion = "0.1.0"\nedition = "2024"');
  put(src, raw);
  return { put, read, run };
}

test("Il check mostra il diff senza scrivere; applicare il formato è idempotente", (t) => {
  const { read, run } = project(t);
  const before = read(src);
  assert.match(run(unit), /1 passed; 0 failed/);
  assert.match(run(check, false), /lib\.rs/);
  assert.equal(read(src), before);
  run(apply);
  const after = read(src);
  assert.notEqual(after, before);
  assert.ok(nl(after).startsWith(formatted + "\n"));
  run(check);
  run(apply);
  assert.equal(read(src), after);
  assert.match(run(unit), /1 passed; 0 failed/);
});

test("Lo stile non certifica i tipi, mentre una sintassi incompleta impedisce il controllo", (t) => {
  const { put, read, run } = project(t);
  run(apply);
  const original = read(src);
  assert.ok(original.includes("-> u8"));
  put(src, original.trimEnd().replace("-> u8", "-> bool"));
  run(check);
  assert.match(run(snippet("sh", "cargo check --lib"), false), /E0308/);
  put(src, "pub fn percentage(value: i32) -> u8 {");
  const broken = read(src);
  assert.match(run(check, false), /unclosed delimiter/);
  assert.equal(read(src), broken);
});

test("Un file separato distingue edizione di parsing e di stile senza scritture", (t) => {
  const { put, read, run } = project(t);
  run(apply);
  put("edition_demo.rs", demo);
  const original = read("edition_demo.rs");
  assert.match(run("rustfmt --check edition_demo.rs", false), /2015/);
  run(snippet("sh", "2024 --check edition_demo"));
  assert.match(run(snippet("sh", "--emit stdout")), /pair\.0 \.0/);
  put("rustfmt.toml", config);
  run("rustfmt --check edition_demo.rs");
  assert.equal(read("edition_demo.rs"), original);
  put("edition_demo.rs", "this is not a Rust item");
  run(check);
});

test("Il filtro per pacchetto non copre il secondo membro; skip preserva soltanto la tabella", (t) => {
  const { put, read, run } = project(t);
  put("Cargo.toml", read("Cargo.toml") + '\n[workspace]\nmembers = ["other"]\nresolver = "3"');
  put("other/Cargo.toml", '[package]\nname = "other"\nversion = "0.1.0"\nedition = "2024"');
  put(src, formatted);
  const other = "other/src/lib.rs";
  put(other, table + "\n\n" + raw);
  const before = read(other);
  run("cargo fmt -p format_notes --check");
  assert.match(run(check, false), /other[/\\]src[/\\]lib\.rs/);
  assert.equal(read(other), before);
  run(apply);
  const after = nl(read(other));
  assert.ok(after.startsWith(table + "\n"));
  assert.ok(after.includes(formatted));
  run(check);
});
