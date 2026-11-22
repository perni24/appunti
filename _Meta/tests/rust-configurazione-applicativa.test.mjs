import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Configurazione applicativa.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
let root, dir, env, exe;
function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function launch(tool, args, code = 0, overrides = {}, cwd = dir) {
  const r = spawnSync(tool, args, {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(r.status, code, [tool, ...args, r.stdout, r.stderr].join("\n"));
  return r;
}
function result(args, expected, vars = {}) {
  const r = launch(exe, args, 0, vars);
  assert.equal(r.stdout.trim(), expected);
  assert.equal(r.stderr, "");
}
function failure(args, code, pattern, vars = {}) {
  const r = launch(exe, args, code, vars);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, pattern);
  return r.stderr;
}

before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-cfg-"));
  dir = path.join(root, "config-demo");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  for (const key of Object.keys(env)) {
    if (/^APP_(CONNECT|TOTAL)_SECS$/i.test(key)) delete env[key];
  }
  launch(
    "cargo",
    snippet("sh", "cargo new").split(/\s+/).slice(1),
    0,
    {},
    root,
  );
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    snippet("toml", "clap =") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src/main.rs"),
    snippet("rust", "fn main()") + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "app.toml"),
    snippet("toml", "connect_secs = 5") + "\n",
  );
  launch("cargo", ["fetch"]);
  env.CARGO_NET_OFFLINE = "true";
  launch("cargo", ["build", "--locked"]);
  exe = path.join(
    env.CARGO_TARGET_DIR,
    "debug",
    process.platform === "win32" ? "config-demo.exe" : "config-demo",
  );
});
after(() => {
  if (!root) return;
  const actual = fs.realpathSync(root);
  assert.equal(path.dirname(actual), tmp);
  assert.ok(path.basename(actual).startsWith("vault-cfg-"));
  fs.rmSync(actual, { recursive: true, maxRetries: 3 });
});

test("il file non è obbligatorio né implicito; i quattro passaggi della nota", () => {
  result([], "connect=3s total=30s");
  const file = ["--config", "app.toml"];
  result(file, "connect=5s total=40s");
  result(file, "connect=5s total=60s", { APP_TOTAL_SECS: "60" });
  result([...file, "--total-secs", "90"], "connect=5s total=90s", {
    APP_TOTAL_SECS: "60",
  });
});
test("precedenza di entrambi i campi su tutte le combinazioni di fonti opzionali", () => {
  for (let mask = 0; mask < 64; mask++) {
    const toml = [],
      args = ["--config", "partial.toml"],
      vars = {};
    if (mask & 1) toml.push("connect_secs = 4");
    if (mask & 2) toml.push("total_secs = 40");
    if (mask & 4) vars.APP_CONNECT_SECS = "5";
    if (mask & 8) vars.APP_TOTAL_SECS = "50";
    if (mask & 16) args.push("--connect-secs", "6");
    if (mask & 32) args.push("--total-secs", "60");
    fs.writeFileSync(path.join(dir, "partial.toml"), toml.join("\n"));
    result(
      args,
      `connect=${mask & 16 ? 6 : mask & 4 ? 5 : mask & 1 ? 4 : 3}s total=${mask & 32 ? 60 : mask & 8 ? 50 : mask & 2 ? 40 : 30}s`,
      vars,
    );
  }
});
test("path, TOML, schema e tipo errati non vengono ignorati da un override", () => {
  failure(["--config", "missing.toml"], 1, /missing\.toml:/);
  for (const input of [
    "[",
    "totla_secs = 12",
    'total_secs = "12"',
    "total_secs = 0",
    "total_secs = -2",
  ]) {
    fs.writeFileSync(path.join(dir, "bad.toml"), input);
    failure(
      ["--config", "bad.toml", "--total-secs", "12"],
      1,
      /bad\.toml: TOML o schema non valido/,
    );
  }
});
test("ambiente assente, vuoto, non numerico e fuori intervallo sono distinti", () => {
  result(["--total-secs", "90"], "connect=3s total=90s");
  for (const raw of ["", "abc", "0", "-1", "18446744073709551616"]) {
    failure(
      ["--total-secs", "90"],
      1,
      /APP_TOTAL_SECS: atteso un intero positivo/,
      { APP_TOTAL_SECS: raw },
    );
  }
});
test("gli errori indicano la fonte senza ricopiare i dati forniti", () => {
  const marker = "esempio-da-non-ristampare";
  const file = path.join(dir, "prova config.toml");
  fs.writeFileSync(file, `total_secs = "${marker}"\n`);
  const toml = failure(
    ["--config", file],
    1,
    /prova config\.toml: TOML o schema non valido/,
  );
  const variable = failure([], 1, /APP_CONNECT_SECS:/, {
    APP_CONNECT_SECS: marker,
  });
  assert.ok(!toml.includes(marker));
  assert.ok(!variable.includes(marker));
  fs.writeFileSync(file, Buffer.from([0xff, 0xfe]));
  failure(["--config", file], 1, /prova config\.toml:/);
});
test("clap segnala uso errato prima di leggere le altre fonti", () => {
  failure(
    ["--config", "missing.toml", "--total-secs", "0"],
    2,
    /--total-secs/,
    { APP_TOTAL_SECS: "abc" },
  );
});
test("il vincolo riguarda i valori finali e consente l'uguaglianza", () => {
  fs.writeFileSync(
    path.join(dir, "pair.toml"),
    "connect_secs = 20\ntotal_secs = 10\n",
  );
  const args = ["--config", "pair.toml"];
  failure(args, 1, /connect_secs non può superare total_secs/);
  result([...args, "--total-secs", "25"], "connect=20s total=25s");
  result(args, "connect=10s total=10s", { APP_CONNECT_SECS: "10" });
});
