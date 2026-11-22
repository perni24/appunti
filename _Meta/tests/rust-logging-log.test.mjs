import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Logging con log.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
const suffix = process.platform === "win32" ? ".exe" : "";
let root, dir, env, bin;
function snippet(lang, marker) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.includes(marker),
  );
  assert.equal(hits.length, 1, marker);
  return hits[0].value;
}
function run(tool, args, { status = 0, filter, cwd = dir } = {}) {
  const childEnv = { ...env };
  if (filter !== undefined) childEnv.RUST_LOG = filter;
  const r = spawnSync(tool, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    windowsHide: true,
    timeout: 180000,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  assert.equal(
    r.status,
    status,
    [tool, ...args, r.stdout, r.stderr].join("\n"),
  );
  return {
    out: r.stdout.replaceAll("\r\n", "\n"),
    err: r.stderr.replaceAll("\r\n", "\n"),
  };
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-log-"));
  dir = path.join(root, "note-log");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  for (const key of Object.keys(env))
    if (/^RUST_LOG(_STYLE)?$/i.test(key)) delete env[key];
  run("cargo", snippet("sh", "cargo new").split(/\s+/).slice(1), { cwd: root });
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    snippet("toml", "env_logger =") +
      '\n\n[features]\nsoglia-release = ["log/release_max_level_warn"]\n',
  );
  fs.mkdirSync(path.join(dir, "examples"));
  for (const [file, marker] of [
    ["src/lib.rs", "pub mod scan"],
    ["src/main.rs", "fn init_logging"],
    ["examples/senza_backend.rs", 'note_log::scan::count_nonempty("prima'],
  ])
    fs.writeFileSync(path.join(dir, file), snippet("rust", marker) + "\n");
  // Ogni ramo gira in un processo separato: il logger globale non si può azzerare tra test.
  fs.writeFileSync(
    path.join(dir, "examples/sonda.rs"),
    `
fn main() {
    log::error!("evento precedente");
    if std::env::args().nth(1).as_deref() == Some("plain") {
        env_logger::init();
    } else {
        env_logger::Builder::new().filter_level(log::LevelFilter::Trace).try_init().unwrap();
        assert!(env_logger::Builder::new().try_init().is_err());
    }
    log::info!("evento informativo");
    log::error!("evento successivo");
}
`,
  );
  fs.writeFileSync(
    path.join(dir, "esempio.txt"),
    snippet("text", "prima") + "\n",
  );
  fs.writeFileSync(path.join(dir, "vuoto.txt"), "");
  run("cargo", ["fetch"]);
  env.CARGO_NET_OFFLINE = "true";
  run("cargo", ["build", "--locked", "--bins", "--examples"]);
  bin = path.join(env.CARGO_TARGET_DIR, "debug", "note-log" + suffix);
});
after(() => {
  if (!root) return;
  const actual = fs.realpathSync(root);
  assert.equal(path.dirname(actual), tmp);
  assert.ok(path.basename(actual).startsWith("vault-log-"));
  fs.rmSync(actual, { recursive: true, maxRetries: 3 });
});

const info = "INFO note_log: scansione completata\n";
const debug = "DEBUG note_log::scan: righe non vuote: 2\n";
const trace = "TRACE note_log::scan: riga vuota: 2\n";
const warn = "WARN note_log::scan: nessuna riga non vuota\n";

test("default applicativo e soglie dei quattro livelli di verbosità", () => {
  for (const [flag, err] of [
    ["", ""],
    ["-v", info],
    ["-vv", debug + info],
    ["-vvv", trace + debug + info],
    ["-vvvv", trace + debug + info],
  ]) {
    assert.deepEqual(run(bin, flag ? [flag, "esempio.txt"] : ["esempio.txt"]), {
      out: "2\n",
      err,
    });
  }
});
test("RUST_LOG sceglie per target e il flag sostituisce le direttive", () => {
  const filter = "warn,note_log::scan=debug";
  assert.deepEqual(run(bin, ["esempio.txt"], { filter }), {
    out: "2\n",
    err: debug,
  });
  assert.deepEqual(run(bin, ["-v", "esempio.txt"], { filter }), {
    out: "2\n",
    err: info,
  });
  assert.deepEqual(
    run(bin, ["esempio.txt"], { filter: "note_log=info,note_log::scan=off" }),
    { out: "2\n", err: info },
  );
});
test("un warning non è un fallimento e off spegne solo i log", () => {
  assert.deepEqual(run(bin, ["vuoto.txt"]), { out: "0\n", err: warn });
  assert.deepEqual(run(bin, ["vuoto.txt"], { filter: "off" }), {
    out: "0\n",
    err: "",
  });
  const r = run(bin, ["assente.txt"], { filter: "off", status: 1 });
  assert.equal(r.out, "");
  assert.match(r.err, /assente\.txt:/);
});
test("anche a trace non si copia il testo dell'utente nella diagnostica", () => {
  fs.writeFileSync(
    path.join(dir, "privato.txt"),
    "esempio-da-non-ristampare\n \t\nseconda\n",
  );
  assert.deepEqual(run(bin, ["privato.txt"], { filter: "trace" }), {
    out: "2\n",
    err: trace + debug + info,
  });
});
test("il consumatore senza backend resta silenzioso anche con RUST_LOG=trace", () => {
  const exe = path.join(
    env.CARGO_TARGET_DIR,
    "debug",
    "examples",
    "senza_backend" + suffix,
  );
  assert.deepEqual(run(exe, [], { filter: "trace" }), { out: "2\n", err: "" });
});
test("logger globale: niente replay, seconda registrazione rifiutata, default del backend", () => {
  const probe = path.join(
    env.CARGO_TARGET_DIR,
    "debug",
    "examples",
    "sonda" + suffix,
  );
  const plain = run(probe, ["plain"]);
  assert.match(plain.err, /evento successivo/);
  assert.doesNotMatch(plain.err, /evento precedente|evento informativo/);
  const verbose = run(probe, []);
  assert.match(verbose.err, /evento informativo/);
  assert.match(verbose.err, /evento successivo/);
  assert.doesNotMatch(verbose.err, /evento precedente/);
});
test("una soglia in compilazione release non è aggirata dal filtro a runtime", () => {
  run("cargo", [
    "build",
    "--locked",
    "--release",
    "--features",
    "soglia-release",
    "--bin",
    "note-log",
  ]);
  const release = path.join(
    env.CARGO_TARGET_DIR,
    "release",
    "note-log" + suffix,
  );
  assert.deepEqual(run(release, ["-vvv", "esempio.txt"]), {
    out: "2\n",
    err: "",
  });
  assert.deepEqual(run(release, ["-vvv", "vuoto.txt"]), {
    out: "0\n",
    err: warn,
  });
});
