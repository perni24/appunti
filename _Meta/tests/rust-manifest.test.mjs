import assert from "node:assert/strict";
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
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const cargo = process.env.CARGO_TEST_EXECUTABLE || tool("cargo");
const rustdoc = process.env.RUSTDOC_TEST_EXECUTABLE || tool("rustdoc");
const note = parseNote("Programmazione/Rust/Pagine/Cargo.toml.md");
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^cargo [a-z0-9 -]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const manifest = blocks.get("Cargo.toml");
const fileNames = ["Cargo.toml", "src/lib.rs", "src/main.rs", "tests/label.rs"];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-manifest-";
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
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|RUSTUP_TOOLCHAIN$)/i.test(
      key,
    )
  )
    delete env[key];
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: rustdoc,
  CARGO: cargo,
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
  RUST_BACKTRACE: "0",
});
const pathKey =
  Object.keys(env).find((key) => key.toUpperCase() === "PATH") || "PATH";
if (path.isAbsolute(cargo))
  env[pathKey] = path.dirname(cargo) + path.delimiter + (env[pathKey] || "");
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, name, source) {
  const dest = path.resolve(dir, name);
  assert.ok(dest.startsWith(root + path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, source);
}
function fixture(overrides = {}) {
  const dir = directory();
  for (const name of fileNames)
    write(dir, name, overrides[name] ?? blocks.get(name));
  return dir;
}
function launch(exe, args, cwd = root) {
  const result = spawnSync(exe, args, {
    cwd,
    env,
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
function run(dir, ...args) {
  return launch(cargo, args, dir);
}
function command(source, dir) {
  assert.ok(commands.has(source), source);
  return run(dir, ...source.split(" ").slice(1));
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function fails(result, pattern) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  if (pattern) assert.match(result.stdout + result.stderr, pattern);
  return result;
}
function passed(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((sum, match) => sum + Number(match[1]), 0);
}
function metadata(dir) {
  return JSON.parse(
    ok(command("cargo metadata --no-deps --format-version 1", dir)).stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function withManifest(value) {
  return fixture({ "Cargo.toml": value });
}

// Sonde sintetiche: questa crate locale non imita API di librerie esterne.
function dependency(dir) {
  write(
    dir,
    "helper/Cargo.toml",
    '[package]\nname="fixture-helper"\nversion="1.2.4"\nedition="2024"\n',
  );
  write(dir, "helper/src/lib.rs", "pub fn value() -> u32 { 42 }\n");
}
function withDependency(section) {
  const dir = withManifest(
    manifest + "\n[" + section + ']\nfixture-helper = { path = "helper" }\n',
  );
  dependency(dir);
  return dir;
}
const callHelper = "pub fn helper_value() -> u32 { fixture_helper::value() }\n";
const buildHelper = "fn main() { assert_eq!(fixture_helper::value(), 42); }\n";

test("toolchain e inventario dei blocchi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /rustc 1\.99\.1\b/);
  assert.match(ok(run(root, "--version")).stdout, /cargo 1\.99\.1\b/);
  assert.equal(commands.size, 7);
  assert.deepEqual(
    [...blocks.keys()],
    ["Manifest alternativo con librerie esterne", ...fileNames],
  );
});
test("frontmatter invariato, struttura tecnica e comandi singoli", () => {
  const old = ok(
    launch(
      "git",
      ["show", "HEAD:Programmazione/Rust/Pagine/Cargo.toml.md"],
      process.cwd(),
    ),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(headings.filter((node) => node.depth === 1).map(text), [
    "Cargo.toml",
  ]);
  for (const name of [
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
    "Navigazione",
  ])
    assert.ok(
      headings.some((node) => node.depth === 2 && text(node) === name),
      name,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  for (const cmd of commands) assert.ok(!cmd.includes("\n"));
});
test("metadata: package, libreria e binario hanno identita distinte", () => {
  const pkg = metadata(fixture()).packages[0];
  assert.equal(pkg.name, "cli-notes");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(pkg.edition, "2024");
  assert.equal(pkg.default_run, "notes");
  assert.deepEqual(pkg.publish, []);
  assert.deepEqual(pkg.features, { default: [], uppercase: [] });
  assert.deepEqual(pkg.dependencies, []);
  for (const [name, kind, suffix] of [
    ["notes_core", "lib", "src/lib.rs"],
    ["notes", "bin", "src/main.rs"],
    ["label", "test", "tests/label.rs"],
  ]) {
    const target = pkg.targets.find((target) => target.name === name);
    assert.ok(target.kind.includes(kind));
    assert.ok(target.src_path.replaceAll("\\", "/").endsWith(suffix));
  }
});
test("progetto originale: check, run e test nelle due configurazioni", () => {
  const dir = fixture();
  ok(command("cargo check --all-targets", dir));
  for (const cmd of ["cargo run", "cargo run --bin notes"])
    assert.equal(ok(command(cmd, dir)).stdout, "Note: Rust\n");
  assert.equal(
    ok(command("cargo run --features uppercase", dir)).stdout,
    "Note: RUST\n",
  );
  assert.equal(passed(command("cargo test", dir)), 1);
  assert.equal(passed(command("cargo test --features uppercase", dir)), 1);
  assert.ok(fs.existsSync(path.join(dir, "Cargo.lock")));
});
test("manifest registry: sola lettura metadata, nessuna risoluzione/download", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    blocks.get("Manifest alternativo con librerie esterne"),
  );
  write(dir, "src/main.rs", "fn main() {}\n");
  const pkg = metadata(dir).packages[0];
  const map = new Map(pkg.dependencies.map((dep) => [dep.name, dep]));
  assert.equal(map.size, 6);
  for (const name of ["clap", "anyhow", "serde"])
    assert.equal(map.get(name).kind, null);
  for (const name of ["tempfile", "pretty_assertions"])
    assert.equal(map.get(name).kind, "dev");
  assert.equal(map.get("cc").kind, "build");
  for (const name of ["serde", "clap"]) {
    assert.deepEqual(map.get(name).features, ["derive"]);
    assert.equal(map.get(name).uses_default_features, true);
  }
  assert.equal(map.get("clap").req, "^4");
  assert.equal(pkg.license, "MIT OR Apache-2.0");
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "registry")));
});
test("metadata riuscito non dimostra che i sorgenti compilino", () => {
  const dir = fixture({ "src/main.rs": "fn main() { unresolved(); }\n" });
  assert.equal(metadata(dir).packages[0].name, "cli-notes");
  fails(run(dir, "check"), /E0425/);
});
test("check e metadata non eseguono le asserzioni dei test", () => {
  const dir = fixture({
    "tests/label.rs": "#[test] fn wrong() { assert_eq!(1, 2); }\n",
  });
  metadata(dir);
  ok(command("cargo check --all-targets", dir));
  fails(command("cargo test", dir), /wrong.*FAILED/);
});
test("version ed edition omesse hanno default indipendenti dal cargo installato", () => {
  const dir = directory();
  write(dir, "Cargo.toml", '[package]\nname="minimal"\n');
  write(dir, "src/main.rs", "fn main() {}\n");
  const pkg = metadata(dir).packages[0];
  assert.equal(pkg.version, "0.0.0");
  assert.equal(pkg.edition, "2015");
  ok(run(dir, "check"));
});
test("metadati da soli non bastano: package senza target", () => {
  const dir = directory();
  write(dir, "Cargo.toml", '[package]\nname="empty"\n');
  fails(
    run(dir, "metadata", "--no-deps", "--format-version", "1"),
    /no targets specified/,
  );
});
test("tabelle duplicate e bin non array sono errori", () => {
  for (const [value, pattern] of [
    [manifest + "\n[package]\n", /duplicate/],
    [replace(manifest, "[[bin]]", "[bin]"), /invalid type/],
    [replace(manifest, 'version = "0.1.0"', "version = 1"), /invalid type/],
  ])
    fails(run(withManifest(value), "check"), pattern);
});
test("chiave nella tabella sbagliata: warning, non impostazione applicata", () => {
  let value = replace(manifest, 'edition = "2024"\n', "");
  value = replace(value, "[lib]", '[lib]\nedition = "2024"');
  const dir = withManifest(value);
  const pkg = metadata(dir).packages[0];
  assert.equal(pkg.edition, "2015");
  assert.equal(
    pkg.targets.find((target) => target.kind.includes("lib")).edition,
    "2024",
  );
  // La chiave esiste anche per i target: metterla in [lib] non cambia il package.
  const wrong = withManifest(manifest + "\n[build]\njobs = 1\n");
  const result = ok(run(wrong, "check"));
  assert.match(result.stderr, /unused manifest key: build/);
});
test("rust-version e un vincolo, non una selezione o installazione", () => {
  const future = withManifest(
    replace(
      manifest,
      'edition = "2024"',
      'edition = "2024"\nrust-version = "1.999"',
    ),
  );
  assert.equal(metadata(future).packages[0].rust_version, "1.999");
  fails(run(future, "check"), /requires rustc 1\.999/);
  const invalid = withManifest(
    replace(
      manifest,
      'edition = "2024"',
      'edition = "2024"\nrust-version = "1.80"',
    ),
  );
  fails(
    run(invalid, "check"),
    /rust-version 1\.80 is incompatible.*1\.85\.0.*edition \(2024\)/s,
  );
});
test("nome importato errato e path sorgente errato vengono rifiutati", () => {
  fails(
    run(
      fixture({
        "src/main.rs":
          'fn main() { println!("{}", cli_notes::label("Rust")); }\n',
      }),
      "check",
    ),
    /E0433/,
  );
  fails(
    run(
      withManifest(
        replace(manifest, 'path = "src/lib.rs"', 'path = "src/missing.rs"'),
      ),
      "check",
    ),
    /missing\.rs/,
  );
});
test("default-run e --bin selezionano un target esistente", () => {
  fails(
    run(
      withManifest(
        replace(manifest, 'default-run = "notes"', 'default-run = "absent"'),
      ),
      "run",
    ),
    /default-run.*target|target.*default-run/s,
  );
  fails(run(fixture(), "run", "--bin", "cli-notes"), /no bin target named/);
});
test("bin esplicito non disattiva autodiscovery; autobins false la disattiva", () => {
  const dir = fixture();
  write(dir, "src/bin/extra.rs", 'fn main() { println!("extra"); }\n');
  assert.ok(
    metadata(dir).packages[0].targets.some((target) => target.name === "extra"),
  );
  assert.equal(ok(run(dir, "run")).stdout, "Note: Rust\n");
  assert.equal(ok(run(dir, "run", "--bin", "extra")).stdout, "extra\n");
  write(
    dir,
    "Cargo.toml",
    replace(manifest, "[package]", "[package]\nautobins = false"),
  );
  assert.ok(
    !metadata(dir).packages[0].targets.some(
      (target) => target.name === "extra",
    ),
  );
  fails(run(dir, "run", "--bin", "extra"), /no bin target named/);
});
test("feature predefinite, no-default e nomi inesistenti", () => {
  const dir = withManifest(
    replace(manifest, "default = []", 'default = ["uppercase"]'),
  );
  assert.equal(ok(run(dir, "run")).stdout, "Note: RUST\n");
  assert.equal(
    ok(run(dir, "run", "--no-default-features")).stdout,
    "Note: Rust\n",
  );
  fails(
    run(dir, "check", "--features", "missing"),
    /does not contain this feature/,
  );
});
test("all-targets non abilita tutte le feature", () => {
  const dir = fixture({
    "src/lib.rs":
      blocks.get("src/lib.rs") +
      '\n#[cfg(feature = "uppercase")]\ncompile_error!("feature probe");\n',
  });
  ok(command("cargo check --all-targets", dir));
  fails(run(dir, "check", "--all-targets", "--all-features"), /feature probe/);
});
test("feature senza codice condizionale non trasforma il programma", () => {
  const dir = fixture({
    "src/lib.rs":
      'pub fn label(title: &str) -> String { format!("Note: {title}") }\n',
  });
  assert.equal(
    ok(command("cargo run --features uppercase", dir)).stdout,
    "Note: Rust\n",
  );
  fails(
    command("cargo test --features uppercase", dir),
    /label_follows_feature.*FAILED/,
  );
});
test("lint del manifest: unsafe vietato, nessun codice unsafe eseguito", () => {
  const dir = fixture({
    "src/lib.rs": blocks.get("src/lib.rs") + "\npub unsafe fn forbidden() {}\n",
  });
  fails(run(dir, "check"), /declaration of an.*unsafe.*function/);
});
test("dipendenza normale: utilizzabile dal codice ma non dal build script", () => {
  const dir = withManifest(
    replace(
      manifest,
      "[dependencies]",
      '[dependencies]\nfixture-helper = { path = "helper" }',
    ),
  );
  dependency(dir);
  write(dir, "src/lib.rs", blocks.get("src/lib.rs") + callHelper);
  ok(run(dir, "check", "--all-targets"));
  write(dir, "build.rs", buildHelper);
  fails(run(dir, "check"), /E0433/);
});
test("build-dependency: utilizzabile dal build script ma non dalla libreria", () => {
  const dir = withDependency("build-dependencies");
  write(dir, "build.rs", buildHelper);
  ok(run(dir, "check"));
  write(dir, "src/lib.rs", blocks.get("src/lib.rs") + callHelper);
  fails(run(dir, "check"), /E0433/);
});
test("dev-dependency: utilizzabile dai test e dagli esempi ma non dal codice normale", () => {
  const dir = withDependency("dev-dependencies");
  write(
    dir,
    "tests/helper.rs",
    "#[test] fn helper() { assert_eq!(fixture_helper::value(), 42); }\n",
  );
  write(
    dir,
    "examples/helper.rs",
    "fn main() { assert_eq!(fixture_helper::value(), 42); }\n",
  );
  assert.equal(passed(run(dir, "test")), 2);
  ok(run(dir, "run", "--example", "helper"));
  write(dir, "src/lib.rs", blocks.get("src/lib.rs") + callHelper);
  fails(run(dir, "check"), /E0433/);
});
test("dev-dependency non viene compilata dal consumer della libreria", () => {
  const dir = withDependency("dev-dependencies");
  write(
    dir,
    "helper/src/lib.rs",
    'compile_error!("dev dependency compiled");\n',
  );
  const consumer = directory();
  write(
    consumer,
    "Cargo.toml",
    '[package]\nname="consumer"\nversion="0.1.0"\nedition="2024"\n[dependencies]\ncli-notes={path=' +
      JSON.stringify(dir.replaceAll("\\", "/")) +
      "}\n",
  );
  write(
    consumer,
    "src/main.rs",
    'fn main() { println!("{}", notes_core::label("Rust")); }\n',
  );
  assert.equal(ok(run(consumer, "run")).stdout, "Note: Rust\n");
  fails(run(dir, "test"), /dev dependency compiled/);
});
test("path relativo, rinomina, caret ed exact su dipendenza locale reale", () => {
  const declaration =
    'support = { package = "fixture-helper", path = "helper", version = "1.2.3" }';
  const value = replace(
    manifest,
    "[dependencies]",
    "[dependencies]\n" + declaration,
  );
  const dir = withManifest(value);
  dependency(dir);
  write(
    dir,
    "src/main.rs",
    'fn main() { println!("{}", support::value()); }\n',
  );
  assert.equal(ok(run(dir, "run")).stdout, "42\n");
  const dep = metadata(dir).packages[0].dependencies[0];
  assert.equal(dep.rename, "support");
  assert.equal(dep.req, "^1.2.3");
  write(
    dir,
    "Cargo.toml",
    replace(value, 'version = "1.2.3"', 'version = "=1.2.3"'),
  );
  fails(run(dir, "check"), /failed to select a version/);
});
test("dipendenze target cfg vengono applicate alla piattaforma reale", () => {
  const active = process.platform === "win32" ? "windows" : "unix";
  const inactive = process.platform === "win32" ? "unix" : "windows";
  const dir = withDependency("target.'cfg(" + active + ")'.dependencies");
  write(dir, "src/lib.rs", blocks.get("src/lib.rs") + callHelper);
  ok(run(dir, "check"));
  const value = fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8");
  write(
    dir,
    "Cargo.toml",
    replace(value, "cfg(" + active + ")", "cfg(" + inactive + ")"),
  );
  fails(run(dir, "check"), /E0433/);
});
test("lints del package non vietano unsafe nelle dipendenze", () => {
  const dir = withManifest(
    replace(
      manifest,
      "[dependencies]",
      '[dependencies]\nfixture-helper = { path = "helper" }',
    ),
  );
  dependency(dir);
  write(dir, "helper/src/lib.rs", "pub unsafe fn unused() {}\n");
  ok(run(dir, "check"));
});
test("metadata esterni non configurano build e publish false non oscura i file", () => {
  const dir = withManifest(
    manifest + "\n[package.metadata.example]\nbuild-jobs = 2\n",
  );
  const pkg = metadata(dir).packages[0];
  assert.deepEqual(pkg.metadata, { example: { "build-jobs": 2 } });
  assert.deepEqual(pkg.publish, []);
  assert.ok(fs.existsSync(pkg.manifest_path));
  ok(run(dir, "check"));
});
test("workspace dependencies richiede adesione esplicita dei membri", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    '[workspace]\nmembers=["app"]\nexclude=["helper"]\nresolver="3"\n[workspace.dependencies]\nfixture-helper={path="helper"}\n',
  );
  dependency(dir);
  write(
    dir,
    "app/Cargo.toml",
    '[package]\nname="app"\nversion="0.1.0"\nedition="2024"\n',
  );
  write(
    dir,
    "app/src/main.rs",
    'fn main() { println!("{}", fixture_helper::value()); }\n',
  );
  fails(run(dir, "check"), /E0433/);
  write(
    dir,
    "app/Cargo.toml",
    '[package]\nname="app"\nversion="0.1.0"\nedition="2024"\n[dependencies]\nfixture-helper.workspace=true\n',
  );
  assert.equal(ok(run(dir, "run")).stdout, "42\n");
});
