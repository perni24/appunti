import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { run as compileRun } from "./typescript-examples.mjs";

const siteRequire = createRequire(new URL("../../site/package.json", import.meta.url));
const pkgDir = name => path.dirname(siteRequire.resolve(name + "/package.json"));
const yaml = siteRequire("yaml");
const coverage = "Coverage", mutation = "Mutation testing";
function blocks(note, lang) {
  return parseNote("Programmazione/Clean Code/Pagine/" + note + ".md").tree.children
    .filter(n => n.type === "code" && n.lang === lang).map(n => n.value);
}
function fixture(t) {
  const parent = realpathSync(tmpdir());
  const cwd = mkdtempSync(path.join(parent, "clean-code-tools-"));
  t.after(() => {
    const actual = realpathSync(cwd);
    assert.equal(path.dirname(actual), parent);
    assert.ok(path.basename(actual).startsWith("clean-code-tools-"));
    rmSync(actual, { recursive: true, force: true });
  });
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !/^(GIT_|NODE_TEST_CONTEXT$|NODE_V8_COVERAGE$|NODE_OPTIONS$)/i.test(name)));
  Object.assign(env, { GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(cwd, "unused-git-config") });
  function run(bin, args, expected = 0) {
    const r = spawnSync(bin, args, { cwd, env, encoding: "utf8", timeout: 30000, windowsHide: true });
    assert.ifError(r.error);
    assert.equal(r.status, expected, [bin, ...args].join(" ") + "\n" + r.stdout + r.stderr);
    return r.stdout + r.stderr;
  }
  const file = name => path.join(cwd, name);
  const put = (name, source) => writeFileSync(file(name), source + "\n", "utf8");
  const read = name => readFileSync(file(name), "utf8");
  const node = (args, expected) => run(process.execPath, args, expected);
  return { run, node, cwd, file, put, read };
}
function command(text, prefix) {
  const words = text.split(" ");
  assert.deepEqual(words.slice(0, prefix.length), prefix);
  return words.slice(prefix.length);
}
function tariff(f, { mutant = false, boundary = false } = {}) {
  const [original, weak] = blocks(coverage, "js"), [changed, extra] = blocks(mutation, "js");
  f.put("shipping.mjs", mutant ? changed : original);
  f.put("shipping.test.mjs", boundary ? weak + "\n" + extra : weak);
}

test("Formatter: check non scrive, write stabilizza e il costo alla soglia non cambia", async t => {
  const f = fixture(t), note = "Formatter", [source] = blocks(note, "js");
  const cli = path.join(pkgDir("prettier"), "bin", "prettier.cjs");
  const [check, write] = blocks(note, "sh").map(s => command(s, ["npx", "--no-install", "prettier"]));
  const load = s => import("data:text/javascript," + encodeURIComponent(s));
  f.put("shipping.mjs", source);
  f.node([cli, ...check], 1);
  assert.equal(f.read("shipping.mjs"), source + "\n");
  f.node([cli, ...write]);
  const formatted = f.read("shipping.mjs");
  assert.notEqual(formatted, source + "\n");
  f.node([cli, ...check]); f.node([cli, ...write]);
  assert.equal(f.read("shipping.mjs"), formatted);
  for (const s of [source, formatted]) {
    const { shippingCents } = await load(s);
    assert.deepEqual([1999, 2000, 2001].map(shippingCents), [350, 0, 0]);
  }
});

test("Linter: regola, gravità e soglia sono tre cose diverse", t => {
  const f = fixture(t), [config, faulty] = blocks("Linter", "js");
  const root = process.env.ESLINT_TOOLS_DIR || path.join(tmpdir(), "appunti-eslint-tools");
  const cli = path.resolve(root, "node_modules/eslint/bin/eslint.js");
  assert.ok(existsSync(cli), "Impostare ESLINT_TOOLS_DIR alla fixture con ESLint 10");
  f.put("eslint.config.mjs", config);
  const args = command(blocks("Linter", "sh")[0], ["npx", "--no-install", "eslint"]);
  f.put("shipping.mjs", faulty);
  const bad = f.node([cli, ...args], 1);
  assert.match(bad, /no-undef/); assert.match(bad, /prefer-const/);
  const named = faulty.replace(" : fees", " : fee");
  f.put("shipping.mjs", named);
  const warning = f.node([cli, ...args], 1);
  assert.match(warning, /prefer-const/); assert.doesNotMatch(warning, /no-undef/);
  f.node([cli, "shipping.mjs"]);
  const good = named.replace("let fee", "const fee");
  f.put("shipping.mjs", good); f.node([cli, ...args]);
  f.put("shipping.mjs", good.replace(">=", ">")); f.node([cli, ...args]);
});

test("AST: import diretti assoluti, commenti, import relativi e errore sintattico", t => {
  const f = fixture(t), [code] = blocks("Static analysis", "python");
  f.run(process.env.PYTHON_TEST_EXECUTABLE || "python", ["-I", "-c", code + String.raw`
sample = "# import sqlite3\n'import sqlite3'\nimport os, sqlite3 as db\nfrom sqlite3 import connect\nfrom .sqlite3 import local\nif False:\n    import sqlite3.dbapi2"
assert direct_sqlite_imports(sample) == [3, 4, 7]
assert direct_sqlite_imports("from store import fetch") == []
try: direct_sqlite_imports("import")
except SyntaxError: pass
else: raise AssertionError("sintassi ignorata")`]);
});

test("Tipi: nessun emit, rifiuto statico della stringa e validazione runtime separata", t => {
  const f = fixture(t), [code] = blocks("Type checking", "ts");
  const cli = path.join(pkgDir("typescript"), "bin", "tsc");
  const args = command(blocks("Type checking", "sh")[0], ["npx", "--no-install", "tsc"]);
  f.put("user-id.ts", code + '\nuserPath(parseUserId("007"));\nparseUserId(7);');
  f.node([cli, ...args]);
  assert.equal(existsSync(f.file("user-id.js")), false);
  f.put("user-id.ts", code + '\nuserPath("007");');
  assert.match(f.node([cli, ...args], 2), /TS2345/);
  const { value } = compileRun(code, "({ parseUserId, userPath })");
  assert.equal(value.userPath(value.parseUserId("007")), "/users/007");
  for (const bad of [7, null, "", "7\n", "1".repeat(17)]) assert.throws(() => value.parseUserId(bad), /UserId/);
});

test("Coverage: Node misura entrambi i rami con la suite senza il valore di soglia", t => {
  const f = fixture(t); tariff(f);
  const args = command(blocks(coverage, "sh")[0], ["node"]);
  const report = f.node(args);
  assert.match(report, /shipping\.mjs\s*\|\s*100(?:\.0+)?\s*\|\s*100(?:\.0+)?\s*\|\s*100/);
  assert.doesNotMatch(report, /shipping\.test\.mjs\s*\|/);
});

test("Mutazione: matrice originale/mutante per la suite debole e quella con il confine", t => {
  const f = fixture(t), args = command(blocks(mutation, "sh")[0], ["node"]);
  for (const mutant of [false, true]) for (const boundary of [false, true]) {
    tariff(f, { mutant, boundary });
    const fails = mutant && boundary;
    const out = f.node(args, fails ? 1 : 0);
    if (fails) assert.match(out, /350 !== 0/);
  }
});

test("Gate: YAML di esempio per PR, sola lettura, sintassi verde e test bloccante", t => {
  const f = fixture(t), wf = yaml.parse(blocks("Code quality gates", "yaml")[0]);
  assert.deepEqual(wf.on, ["pull_request"]);
  assert.deepEqual(wf.permissions, { contents: "read" });
  const job = wf.jobs["tariff-contract"];
  assert.equal(job.name, "tariff-contract");
  assert.equal(job.steps[1].with["node-version"], "24");
  const commands = job.steps.filter(s => s.run).map(s => command(s.run, ["node"]));
  assert.equal(commands.length, 2);
  tariff(f, { boundary: true });
  for (const cmd of commands) f.node(cmd);
  tariff(f, { boundary: true, mutant: true });
  f.node(commands[0]); assert.match(f.node(commands[1], 1), /350 !== 0/);
});

test("Hook Git: working tree pulita non salva staging errato, e vale anche il contrario", t => {
  const f = fixture(t), [script, chmod, add, configure] = blocks("Pre-commit hooks", "sh");
  const git = (a, expected) => f.run("git", a, expected);
  git(["init", "--quiet"]);
  for (const [k, v] of [["user.name", "Test"], ["user.email", "test@example.invalid"], ["core.autocrlf", "false"], ["commit.gpgsign", "false"]]) git(["config", "--local", k, v]);
  mkdirSync(f.file(".githooks"));
  f.put(".githooks/pre-commit", script);
  if (process.platform !== "win32") f.run("chmod", command(chmod, ["chmod"]));
  git(command(add, ["git"])); git(command(configure, ["git"]));
  f.put("sample.txt", "base"); git(["add", "--", "sample.txt"]); git(["commit", "-qm", "base"]);
  const initial = git(["rev-parse", "HEAD"]).trim();
  f.put("sample.txt", "base\nchange  "); git(["add", "--", "sample.txt"]);
  f.put("sample.txt", "base\nchange");
  assert.match(git(["commit", "-qm", "rifiutato"], 1), /trailing whitespace/);
  assert.equal(git(["rev-parse", "HEAD"]).trim(), initial);
  git(["add", "--", "sample.txt"]); f.put("sample.txt", "base\nchange  ");
  git(["commit", "-qm", "consentito"]);
  assert.equal(git(["show", "HEAD:sample.txt"]).replaceAll("\r\n", "\n"), "base\nchange\n");
  assert.equal(f.read("sample.txt"), "base\nchange  \n");
});
