import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote("Programmazione/Rust/Pagine/cargo deny.md").tree.children.filter((b) => b.type === "code");
const snippet = (lang, marker) => {
  const found = blocks.filter((b) => b.lang === lang && b.value.includes(marker));
  assert.equal(found.length, 1, marker);
  return found[0].value;
};
const manifest = snippet("toml", "[package]");
const policy = snippet("toml", "[licenses]");
const licenses = snippet("sh", "check licenses"), sources = snippet("sh", "check sources");
const bans = snippet("sh", "--locked check bans"), allBans = snippet("sh", "--all-features check bans");
const lock = snippet("sh", "generate-lockfile");

function project(t) {
  const root = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(root, "vault-rsdeny-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), root);
    assert.ok(path.basename(dir).startsWith("vault-rsdeny-"));
    fs.rmSync(dir, { recursive: true, maxRetries: 3 });
  });
  const app = path.join(dir, "policy-notes"), legacy = path.join(dir, "notes-legacy");
  const file = (name) => path.join(app, name);
  const put = (name, content) => fs.writeFileSync(file(name), content + "\n");
  const read = (name) => fs.readFileSync(file(name), "utf8");
  function run(program, args, { ok = true, cwd = app, mirror } = {}) {
    const r = spawnSync(program, args, {
      cwd, windowsHide: true, encoding: "utf8", timeout: 60000,
      env: { ...process.env, CARGO_HOME: path.join(dir, "cargo-home"), CARGO_NET_OFFLINE: mirror ? "false" : "true", CARGO_TERM_COLOR: "never",
        GIT_TERMINAL_PROMPT: "0", GIT_ALLOW_PROTOCOL: "file",
        ...(mirror && { CARGO_NET_GIT_FETCH_WITH_CLI: "true", GIT_CONFIG_COUNT: "1",
          GIT_CONFIG_KEY_0: `url.${pathToFileURL(legacy).href}.insteadOf`, GIT_CONFIG_VALUE_0: mirror }) },
    });
    assert.ifError(r.error);
    assert.equal(r.signal, null);
    const out = r.stdout + r.stderr;
    assert.equal(r.status === 0, ok, out);
    return out;
  }
  function cargo(command, options) {
    const [program, ...args] = command.split(" ");
    if (args[0] === "deny" && args.includes("check")) args.splice(1, 0, "--offline");
    return run(program, args, options);
  }
  assert.match(cargo("cargo deny --version", { cwd: dir }), /cargo-deny 0\.22\.0\b/);
  for (const name of ["policy-notes", "notes-legacy"]) cargo(snippet("sh", "--vcs none " + name), { cwd: dir });
  put("Cargo.toml", manifest);
  put("../notes-legacy/Cargo.toml", read("../notes-legacy/Cargo.toml").replace("[package]", '[package]\nlicense = "MIT OR Apache-2.0"'));
  put("deny.toml", policy);
  cargo(lock);
  return { app, dir, legacy, put, read, run, cargo };
}

test("Con la sola MIT ammessa, OR passa e AND richiede anche Apache-2.0", (t) => {
  const { put, read, cargo } = project(t);
  cargo(licenses);
  const name = "../notes-legacy/Cargo.toml";
  put(name, read(name).replace("MIT OR Apache-2.0", "MIT AND Apache-2.0"));
  assert.match(cargo(licenses, { ok: false }), /error\[rejected\]/);
  put("deny.toml", policy.replace('allow = ["MIT"]', 'allow = ["MIT", "Apache-2.0"]'));
  cargo(licenses);
});

test("Il divieto segue la feature, a lockfile e policy invariati", (t) => {
  const { read, cargo } = project(t);
  const before = read("Cargo.lock");
  cargo(bans);
  const out = cargo(allBans, { ok: false });
  assert.match(out, /error\[banned\]/);
  assert.match(out, /notes-legacy/);
  cargo(licenses);
  cargo(sources);
  assert.equal(read("Cargo.lock"), before);
});

test("Due versioni della stessa crate sono un avviso o un errore di bans", (t) => {
  const { dir, put, cargo } = project(t);
  for (const v of [1, 2]) {
    const loc = "../codec-" + v;
    fs.mkdirSync(path.join(dir, "codec-" + v, "src"), { recursive: true });
    put(loc + "/Cargo.toml", `[package]\nname = "notes-codec"\nversion = "${v}.0.0"\nedition = "2024"\nlicense = "MIT"`);
    put(loc + "/src/lib.rs", "");
  }
  put("Cargo.toml", manifest + '\ncodec1 = { package = "notes-codec", path = "../codec-1" }\ncodec2 = { package = "notes-codec", path = "../codec-2" }');
  cargo(lock);
  const tree = cargo("cargo tree --duplicates");
  assert.match(tree, /notes-codec v1\.0\.0/);
  assert.match(tree, /notes-codec v2\.0\.0/);
  assert.match(cargo(bans), /warning\[duplicate\]/);
  put("deny.toml", policy.replace('multiple-versions = "warn"', 'multiple-versions = "deny"'));
  assert.match(cargo(bans, { ok: false }), /error\[duplicate\]/);
});

test("Una directory path non equivale a un'origine Git approvata", (t) => {
  const { dir, legacy, put, run, cargo } = project(t);
  cargo(sources);
  const git = (...args) => run("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
    "-c", "core.hooksPath=" + path.join(dir, "no-hooks"), ...args], { cwd: legacy });
  git("init", "--quiet", "--template=");
  git("add", "--", "Cargo.toml", "src/lib.rs");
  git("commit", "--quiet", "--no-gpg-sign", "-m", "Fixture");
  const url = "https://fixtures.invalid/notes-legacy";
  put("Cargo.toml", manifest.replace('path = "../notes-legacy"', `git = "${url}"`));
  // Cargo registra l'URL del manifest; Git legge solo il mirror file:// della fixture.
  cargo(lock, { mirror: url });
  const out = cargo(sources, { ok: false });
  assert.match(out, /error\[source-not-allowed\]/);
  assert.match(out, /notes-legacy/);
  put("deny.toml", policy + `\nallow-git = ["${url}"]`);
  cargo(sources);
});

test("Il check completo non equivale ai soli controlli locali quando manca il database degli advisory", (t) => {
  const { put, cargo } = project(t);
  put("deny.toml", policy.split("\n").filter((line) => !line.startsWith("deny =")).join("\n"));
  cargo(allBans);
  cargo(licenses);
  cargo(sources);
  const out = cargo(snippet("sh", "--workspace --locked"), { ok: false });
  assert.match(out, /advisory[- ]db|advisory databases?/i);
});
