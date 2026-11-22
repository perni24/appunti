import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const YAML = require("yaml");
const suffix = process.platform === "win32" ? ".exe" : "";
const compilers = {
  "1.85.0": process.env.RUSTC_MSRV_TEST_EXECUTABLE,
  "1.99.1": process.env.RUSTC_TEST_EXECUTABLE,
};
for (const exe of Object.values(compilers)) {
  assert.ok(
    exe && path.isAbsolute(exe) && fs.existsSync(exe),
    "Fornire entrambi i percorsi rustc",
  );
}
const notePath = "Programmazione/Rust/Pagine/Build scripts.md";
const note = parseNote(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
const powershell = [];
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node).split(":")[0];
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^cargo [a-zA-Z0-9 _,=./-]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else if (node.lang === "powershell") {
    powershell.push(node.value);
  } else {
    assert.ok(["rust", "toml", "text"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const fileNames = [
  "Cargo.toml",
  "settings/max-items.txt",
  "build.rs",
  "src/lib.rs",
  "src/main.rs",
  "tests/config.rs",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-build-scripts-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
for (let dir = parent; ; dir = path.dirname(dir)) {
  for (const name of ["config", "config.toml"])
    assert.ok(
      !fs.existsSync(path.join(dir, ".cargo", name)),
      "Config parent: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
const env = { ...process.env };
for (const key of Object.keys(env))
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|GIT_|APP_BUILD_ID$|DEMO_BUILD_ID$|OUT_DIR$|HOST$|TARGET$)/i.test(
      key,
    )
  )
    delete env[key];
Object.assign(env, {
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
  RUSTUP_AUTO_INSTALL: "0",
  RUST_BACKTRACE: "0",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: path.join(root, "empty-gitconfig"),
  GIT_TERMINAL_PROMPT: "0",
});
fs.writeFileSync(env.GIT_CONFIG_GLOBAL, "");
fs.mkdirSync(path.join(root, "empty-hooks"));
const pathKey =
  Object.keys(env).find((key) => key.toUpperCase() === "PATH") || "PATH";
function environment(version) {
  const bin = path.dirname(compilers[version]);
  return {
    ...env,
    [pathKey]: bin + path.delimiter + (env[pathKey] || ""),
    RUSTC: compilers[version],
    RUSTDOC: path.join(bin, "rustdoc" + suffix),
  };
}
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, name, value) {
  const dest = path.resolve(dir, name);
  assert.ok(dest.startsWith(root + path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, value);
}
function read(dir, name) {
  return fs.readFileSync(path.join(dir, name), "utf8");
}
function fixture(overrides = {}) {
  const dir = directory();
  for (const name of fileNames)
    write(dir, name, overrides[name] ?? blocks.get(name));
  return dir;
}
function launch(exe, args, cwd, processEnv = env) {
  const result = spawnSync(exe, args, {
    cwd,
    env: processEnv,
    encoding: "utf8",
    windowsHide: true,
    timeout: 90000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  result.stdout = result.stdout.replaceAll("\r\n", "\n");
  return result;
}
function run(version, dir, ...args) {
  assert.ok(
    [
      "--version",
      "metadata",
      "check",
      "test",
      "run",
      "fmt",
      "build",
      "rustc",
      "clippy",
    ].includes(args[0]),
  );
  return launch(
    path.join(path.dirname(compilers[version]), "cargo" + suffix),
    args,
    dir,
    environment(version),
  );
}
function command(source, version, dir) {
  assert.ok(commands.has(source), source);
  const [name, ...args] = source.split(" ");
  return name === "cargo"
    ? run(version, dir, ...args)
    : launch(compilers[version], args, dir, environment(version));
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function fails(result, pattern) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, pattern);
  return result;
}
function passed(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((sum, match) => sum + Number(match[1]), 0);
}
function metadata(version, dir) {
  return JSON.parse(
    ok(run(version, dir, "metadata", "--no-deps", "--format-version", "1"))
      .stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}

function matrix(callback) {
  for (const version of Object.keys(compilers)) callback(version);
}
function cargo(version, dir, values, ...args) {
  return launch(
    path.join(path.dirname(compilers[version]), "cargo" + suffix),
    args,
    dir,
    { ...environment(version), ...values },
  );
}
function records(result) {
  ok(result);
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
function build(version, dir, values = {}, ...args) {
  const messages = records(
    cargo(version, dir, values, "build", "--message-format=json", ...args),
  );
  const scripts = messages.filter(
    (message) => message.reason === "build-script-executed",
  );
  assert.equal(scripts.length, 1, JSON.stringify(messages));
  return { messages, script: scripts[0] };
}
function instrumented() {
  const marker = [
    '    let count_path = out_dir.join("probe-runs.txt");',
    '    let previous = fs::read_to_string(&count_path).unwrap_or_else(|_| String::from("0"));',
    "    let count: u32 = previous.parse()?;",
    "    fs::write(count_path, (count + 1).to_string())?;",
    "",
  ].join("\n");
  return fixture({
    "build.rs": replace(
      blocks.get("build.rs"),
      "    let generated =",
      marker + "    let generated =",
    ),
  });
}
function runCount(info) {
  const dir = fs.realpathSync(info.script.out_dir);
  assert.ok(dir.startsWith(root + path.sep));
  return Number(fs.readFileSync(path.join(dir, "probe-runs.txt"), "utf8"));
}
function generated(info) {
  const dir = fs.realpathSync(info.script.out_dir);
  assert.ok(dir.startsWith(root + path.sep));
  return fs.readFileSync(path.join(dir, "limits.rs"), "utf8");
}
function expected(id = "dev", limit = 32) {
  return (
    "build_id=" +
    id +
    "\nmax_items=" +
    limit +
    "\nlarge_limit=" +
    (limit >= 64) +
    "\n"
  );
}
function executable(info) {
  const binary = info.messages.find(
    (message) =>
      message.reason === "compiler-artifact" &&
      message.target.kind.includes("bin"),
  );
  assert.ok(binary?.executable);
  const resolved = fs.realpathSync(binary.executable);
  assert.ok(resolved.startsWith(root + path.sep));
  return resolved;
}
function hash(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function changeScript(dir, before, after) {
  write(dir, "build.rs", replace(read(dir, "build.rs"), before, after));
}
function settleMtime() {
  return new Promise((resolve) => setTimeout(resolve, 1100));
}
const baselines = new Map();
const noteDigest = hash(notePath);

test("YAML, template e inventario: sei file, sette comandi Cargo e tre PowerShell", () => {
  const old = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  assert.deepEqual([...blocks.keys()], fileNames);
  assert.equal(commands.size, 7);
  assert.deepEqual(powershell, [
    "$savedDemoBuildId = $env:APP_BUILD_ID",
    "$env:APP_BUILD_ID = 'release-42'",
    "$env:APP_BUILD_ID = $savedDemoBuildId",
  ]);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Build scripts",
  ]);
  for (const title of [
    "Sintesi",
    "Quando usarlo",
    "Come funziona",
    "API / Sintassi",
    "Esempio pratico",
    "Varianti",
    "Errori comuni",
    "Checklist",
    "Collegamenti",
    "Fonti",
  ])
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
});

test("toolchain reali e versioni abbinate", () => {
  matrix((version) => {
    const pattern = new RegExp(version.replaceAll(".", "\\."));
    assert.match(
      ok(launch(compilers[version], ["--version"], root, environment(version)))
        .stdout,
      pattern,
    );
    assert.match(ok(run(version, root, "--version")).stdout, pattern);
  });
});

for (const version of Object.keys(compilers)) {
  test("progetto e comandi estratti su Rust " + version, () => {
    const dir = fixture();
    assert.equal(
      ok(command("cargo run --quiet", version, dir)).stdout,
      expected(),
    );
    assert.equal(passed(command("cargo test", version, dir)), 4);
    ok(command("cargo check --all-targets", version, dir));
    assert.equal(passed(command("cargo test --doc", version, dir)), 1);
    ok(command("cargo build -vv", version, dir));
    const info = build(version, dir);
    assert.equal(generated(info), "pub const MAX_ITEMS: usize = 32;\n");
    assert.deepEqual(info.script.cfgs, []);
    assert.deepEqual(info.script.env, [["DEMO_BUILD_ID", "dev"]]);
    const pkg = metadata(version, dir).packages[0];
    assert.equal(pkg.edition, "2024");
    assert.equal(pkg.rust_version, "1.85");
    assert.deepEqual(pkg.publish, []);
    assert.ok(
      pkg.targets.some((target) => target.kind.includes("custom-build")),
    );
    baselines.set(version, dir);
  });
}

test("rustfmt controlla senza riscrivere i sorgenti", () => {
  const dir = baselines.get("1.99.1");
  const before = fileNames.map((name) => read(dir, name));
  ok(command("cargo fmt --all -- --check", "1.99.1", dir));
  assert.deepEqual(
    fileNames.map((name) => read(dir, name)),
    before,
  );
});

test("Clippy corrente su tutti i target", () => {
  ok(
    command(
      "cargo clippy --all-targets -- -D warnings",
      "1.99.1",
      baselines.get("1.99.1"),
    ),
  );
});

test("passaggi PowerShell reali: valore precedente presente o assente ripristinato", () => {
  assert.equal(
    process.platform,
    "win32",
    "Questa verifica richiede PowerShell Windows",
  );
  for (const initial of [undefined, "before-7"]) {
    const dir = fixture();
    const script = [
      "$ErrorActionPreference = 'Stop'",
      powershell[0],
      powershell[1],
      "cargo run --quiet",
      "if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }",
      powershell[2],
      initial === undefined
        ? "if (Test-Path Env:APP_BUILD_ID) { throw 'Ambiente non ripristinato' }"
        : "if ($env:APP_BUILD_ID -ne 'before-7') { throw 'Ambiente non ripristinato' }",
    ].join("\n");
    const childEnv = environment("1.99.1");
    if (initial !== undefined) childEnv.APP_BUILD_ID = initial;
    assert.equal(
      ok(
        launch(
          "powershell.exe",
          ["-NoProfile", "-NonInteractive", "-Command", script],
          dir,
          childEnv,
        ),
      ).stdout,
      expected("release-42"),
    );
    assert.equal(
      ok(command("cargo run --quiet", "1.99.1", dir)).stdout,
      expected(),
    );
  }
});

test("env! resta incorporato: ambiente runtime diverso non cambia il binario", () => {
  matrix((version) => {
    const dir = fixture();
    const info = build(version, dir, { APP_BUILD_ID: "compiled-42" });
    const result = ok(
      launch(executable(info), [], dir, {
        ...environment(version),
        APP_BUILD_ID: "runtime-other",
        DEMO_BUILD_ID: "runtime-other",
      }),
    );
    assert.equal(result.stdout, expected("compiled-42"));
  });
});

test("anche check esegue il build script quando l'output manca", () => {
  const dir = instrumented();
  const data = records(
    run("1.99.1", dir, "check", "--message-format=json", "--all-targets"),
  );
  const script = data.find(
    (message) => message.reason === "build-script-executed",
  );
  assert.ok(script);
  assert.equal(runCount({ script }), 1);
  assert.match(generated({ script }), /MAX_ITEMS/);
});

test("build invariata riusa output: evento JSON non dimostra una nuova esecuzione", () => {
  const dir = instrumented();
  const first = build("1.99.1", dir);
  assert.equal(runCount(first), 1);
  const second = build("1.99.1", dir);
  assert.equal(runCount(second), 1);
  assert.equal(first.script.out_dir, second.script.out_dir);
  assert.ok(
    second.messages
      .filter((message) => message.reason === "compiler-artifact")
      .every((message) => message.fresh),
  );
});

test("file osservato: 32 -> 128 -> 32 aggiorna generazione e rimuove il cfg", async () => {
  for (const version of Object.keys(compilers)) {
    const dir = instrumented();
    const first = build(version, dir);
    assert.equal(runCount(first), 1);
    await settleMtime();
    write(dir, "settings/max-items.txt", "128\n");
    const large = build(version, dir);
    assert.equal(runCount(large), 2);
    assert.deepEqual(large.script.cfgs, ["has_large_limit"]);
    assert.match(generated(large), /= 128;/);
    assert.equal(
      ok(command("cargo run --quiet", version, dir)).stdout,
      expected("dev", 128),
    );
    assert.equal(passed(command("cargo test", version, dir)), 4);
    await settleMtime();
    write(dir, "settings/max-items.txt", "32\n");
    const small = build(version, dir);
    assert.equal(runCount(small), 3);
    assert.deepEqual(small.script.cfgs, []);
    assert.equal(
      ok(command("cargo run --quiet", version, dir)).stdout,
      expected(),
    );
  }
});

test("variabile osservata: cambiamento, valore invariato e rimozione", () => {
  const dir = instrumented();
  assert.equal(runCount(build("1.99.1", dir)), 1);
  const changed = build("1.99.1", dir, { APP_BUILD_ID: "release-42" });
  assert.equal(runCount(changed), 2);
  assert.deepEqual(changed.script.env, [["DEMO_BUILD_ID", "release-42"]]);
  assert.equal(
    runCount(build("1.99.1", dir, { APP_BUILD_ID: "release-42" })),
    2,
  );
  assert.equal(runCount(build("1.99.1", dir)), 3);
});

test("sorgente Rust modificato ricompila la crate senza rieseguire il generatore", async () => {
  const dir = instrumented();
  assert.equal(runCount(build("1.99.1", dir)), 1);
  await settleMtime();
  write(
    dir,
    "src/lib.rs",
    read(dir, "src/lib.rs") + "\n// Modifica della sola libreria.\n",
  );
  const changed = build("1.99.1", dir);
  assert.equal(runCount(changed), 1);
  assert.ok(
    changed.messages.some(
      (message) =>
        message.reason === "compiler-artifact" &&
        message.target.kind.includes("lib") &&
        !message.fresh,
    ),
  );
});

test("osservare solo build.rs lascia obsoleto un input file non dichiarato", async () => {
  const dir = instrumented();
  changeScript(
    dir,
    "cargo::rerun-if-changed=settings/max-items.txt",
    "cargo::rerun-if-changed=build.rs",
  );
  assert.equal(runCount(build("1.99.1", dir)), 1);
  await settleMtime();
  write(dir, "settings/max-items.txt", "128\n");
  const stale = build("1.99.1", dir);
  assert.equal(runCount(stale), 1);
  assert.match(generated(stale), /= 32;/);
});

test("senza rerun-if-env-changed resta il precedente input procedurale", () => {
  const dir = instrumented();
  changeScript(
    dir,
    '    println!("cargo::rerun-if-env-changed=APP_BUILD_ID");\n',
    "",
  );
  assert.equal(runCount(build("1.99.1", dir)), 1);
  const stale = build("1.99.1", dir, { APP_BUILD_ID: "new-42" });
  assert.equal(runCount(stale), 1);
  assert.deepEqual(stale.script.env, [["DEMO_BUILD_ID", "dev"]]);
});

test("OUT_DIR persiste: lo script non cancella file estranei al proprio output", () => {
  const dir = instrumented();
  const first = build("1.99.1", dir);
  const output = fs.realpathSync(first.script.out_dir);
  assert.ok(output.startsWith(root + path.sep));
  fs.writeFileSync(
    path.join(output, "retained.txt"),
    "Residuo della fixture\n",
  );
  const second = build("1.99.1", dir, { APP_BUILD_ID: "second" });
  assert.equal(first.script.out_dir, second.script.out_dir);
  assert.equal(
    fs.readFileSync(path.join(output, "retained.txt"), "utf8"),
    "Residuo della fixture\n",
  );
  assert.equal(runCount(second), 2);
});

test("limiti validi, spazi e CRLF vengono interpretati dal parser numerico", () => {
  for (const [input, value] of [
    ["1\n", 1],
    ["1024\n", 1024],
    [" 64\r\n", 64],
  ]) {
    const dir = fixture({ "settings/max-items.txt": input });
    assert.equal(
      ok(command("cargo run --quiet", "1.99.1", dir)).stdout,
      expected("dev", value),
    );
    assert.equal(passed(command("cargo test", "1.99.1", dir)), 4);
  }
});

test("numeri invalidi o fuori intervallo fermano la build", () => {
  for (const [input, pattern] of [
    ["0", /compreso tra/],
    ["1025", /compreso tra/],
    ["65536", /PosOverflow/],
    ["-1", /InvalidDigit/],
    ["abc", /InvalidDigit/],
    ["", /Empty/],
    ['32; panic!("injected")', /InvalidDigit/],
  ]) {
    const dir = fixture({ "settings/max-items.txt": input });
    fails(run("1.99.1", dir, "build"), pattern);
    assert.ok(
      !fs.existsSync(
        path.join(dir, "target", "debug", "build-script-demo" + suffix),
      ),
    );
  }
});

test("identificativi invalidi e injection di una direttiva sono rifiutati", () => {
  for (const value of [
    "",
    "a".repeat(65),
    "with space",
    "x\ncargo::rustc-cfg=injected",
    "x\r",
    "caf\u00e9",
  ]) {
    const dir = fixture();
    const result = fails(
      cargo("1.99.1", dir, { APP_BUILD_ID: value }, "build"),
      /APP_BUILD_ID: usare/,
    );
    assert.doesNotMatch(result.stdout, /cargo::rustc-cfg=injected/);
  }
});

test("identificativi ASCII validi: punteggiatura ammessa e limite di 64 byte", () => {
  for (const value of ["Release_42-v1.0", "a".repeat(64)]) {
    const dir = fixture();
    assert.equal(
      ok(cargo("1.99.1", dir, { APP_BUILD_ID: value }, "run", "--quiet"))
        .stdout,
      expected(value),
    );
  }
});

test("input mancante o non UTF-8 e un errore, non un fallback", () => {
  const missing = fixture();
  fs.unlinkSync(path.join(missing, "settings", "max-items.txt"));
  fails(
    run("1.99.1", missing, "check"),
    /kind: NotFound/,
  );
  const invalid = fixture();
  write(invalid, "settings/max-items.txt", Buffer.from([0xff]));
  fails(run("1.99.1", invalid, "check"), /UTF-8|Utf8|valid utf/i);
});

test("cargo run fallito non esegue il vecchio binario rimasto sul disco", async () => {
  const dir = fixture();
  const info = build("1.99.1", dir);
  const binary = executable(info);
  const before = hash(binary);
  await settleMtime();
  write(dir, "settings/max-items.txt", "0\n");
  const result = fails(
    command("cargo run --quiet", "1.99.1", dir),
    /compreso tra/,
  );
  assert.doesNotMatch(result.stdout, /build_id=/);
  assert.equal(hash(binary), before);
});

test("build.rs viene rilevato anche senza package.build", () => {
  const dir = fixture({
    "Cargo.toml": replace(blocks.get("Cargo.toml"), 'build = "build.rs"\n', ""),
  });
  assert.equal(
    ok(command("cargo run --quiet", "1.99.1", dir)).stdout,
    expected(),
  );
});

test("package.build=false disabilita lo script, non produce i suoi output", () => {
  const dir = fixture({
    "Cargo.toml": replace(
      blocks.get("Cargo.toml"),
      'build = "build.rs"',
      "build = false",
    ),
  });
  assert.ok(
    !metadata("1.99.1", dir).packages[0].targets.some((target) =>
      target.kind.includes("custom-build"),
    ),
  );
  fails(run("1.99.1", dir, "check"), /OUT_DIR|DEMO_BUILD_ID/);
});

test("script con percorso esplicito usa comunque la directory del package", () => {
  const dir = fixture({
    "Cargo.toml": replace(
      blocks.get("Cargo.toml"),
      'build = "build.rs"',
      'build = "tools/generate.rs"',
    ),
  });
  write(dir, "tools/generate.rs", blocks.get("build.rs"));
  write(
    dir,
    "build.rs",
    'compile_error!("Il vecchio percorso non deve essere compilato");\n',
  );
  assert.equal(
    ok(command("cargo run --quiet", "1.99.1", dir)).stdout,
    expected(),
  );
});

test("manifest-path da un'altra directory non cambia la base degli input dello script", () => {
  const dir = fixture();
  assert.equal(
    ok(
      run(
        "1.99.1",
        root,
        "run",
        "--quiet",
        "--manifest-path",
        path.join(dir, "Cargo.toml"),
      ),
    ).stdout,
    expected(),
  );
});

test("env! OUT_DIR nel build script stesso non e disponibile in compilazione", () => {
  const dir = fixture();
  changeScript(
    dir,
    'PathBuf::from(env::var_os("OUT_DIR").ok_or("OUT_DIR assente")?)',
    'PathBuf::from(env!("OUT_DIR"))',
  );
  fails(run("1.99.1", dir, "check"), /OUT_DIR.*not defined at compile time/);
});

test("custom cfg non dichiarato viene rilevato anche quando e falso", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "rustc", "--lib", "--", "-D", "unexpected_cfgs"));
  changeScript(
    dir,
    '    println!("cargo::rustc-check-cfg=cfg(has_large_limit)");\n',
    "",
  );
  fails(
    run("1.99.1", dir, "rustc", "--lib", "--", "-D", "unexpected_cfgs"),
    /unexpected .*cfg|unexpected_cfgs/,
  );
});

test("check-cfg da solo non attiva il cfg: la controprova fallisce nei test", () => {
  const dir = fixture({ "settings/max-items.txt": "128\n" });
  changeScript(
    dir,
    '    if max_items >= 64 {\n        println!("cargo::rustc-cfg=has_large_limit");\n    }\n',
    "",
  );
  const info = build("1.99.1", dir);
  assert.deepEqual(info.script.cfgs, []);
  fails(
    command("cargo test", "1.99.1", dir),
    /cfg_matches_generated_limit|assertion .* failed/,
  );
});

test("direttive legacy cargo: funzionano sulle due toolchain disponibili", () => {
  matrix((version) => {
    const dir = fixture({
      "build.rs": blocks.get("build.rs").replaceAll("cargo::", "cargo:"),
    });
    assert.equal(
      ok(command("cargo run --quiet", version, dir)).stdout,
      expected(),
    );
    assert.equal(passed(command("cargo test", version, dir)), 4);
  });
});

test("HOST, TARGET e CARGO_CFG_TARGET_OS letti durante lo script nativo", () => {
  const dir = fixture();
  const extra = [
    '    println!("cargo::rustc-env=OBSERVED_HOST={}", env::var("HOST")?);',
    '    println!("cargo::rustc-env=OBSERVED_TARGET={}", env::var("TARGET")?);',
    '    println!("cargo::rustc-env=OBSERVED_OS={}", env::var("CARGO_CFG_TARGET_OS")?);',
    '    println!("cargo::rustc-env=OBSERVED_ROOT={}", env::var("CARGO_MANIFEST_DIR")?);',
    "",
  ].join("\n");
  changeScript(dir, "    Ok(())", extra + "    Ok(())");
  const values = Object.fromEntries(build("1.99.1", dir).script.env);
  assert.equal(values.OBSERVED_HOST, values.OBSERVED_TARGET);
  assert.equal(
    values.OBSERVED_OS,
    process.platform === "win32" ? "windows" : process.platform,
  );
  assert.equal(fs.realpathSync(values.OBSERVED_ROOT), fs.realpathSync(dir));
});

test("Cargo non modifica i sei sorgenti estratti e la nota originale", () => {
  for (const dir of baselines.values())
    assert.deepEqual(
      fileNames.map((name) => read(dir, name)),
      fileNames.map((name) => blocks.get(name)),
    );
  assert.equal(hash(notePath), noteDigest);
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "registry", "src")));
});
