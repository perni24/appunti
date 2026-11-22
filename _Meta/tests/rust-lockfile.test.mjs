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
const note = parseNote("Programmazione/Rust/Pagine/Cargo.lock.md");
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^(cargo|git) [a-zA-Z0-9. /-]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const manifest = blocks.get("Cargo.toml");
const fileNames = [
  "Cargo.toml",
  "src/main.rs",
  "label-core/Cargo.toml",
  "label-core/src/lib.rs",
  "tests/label.rs",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-lockfile-";
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
  const [exe, ...args] = source.split(" ");
  if (exe === "git") {
    assert.equal(args[0], "diff");
    return launch("git", args, dir);
  }
  return run(dir, ...args);
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
    ok(run(dir, "metadata", "--format-version", "1", "--locked")).stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function lock(dir) {
  return fs
    .readFileSync(path.join(dir, "Cargo.lock"), "utf8")
    .replaceAll("\r\n", "\n");
}
function generate(dir) {
  return ok(command("cargo generate-lockfile --offline", dir));
}
function versions(dir) {
  return Object.fromEntries(
    metadata(dir).packages.map((pkg) => [pkg.name, pkg.version]),
  );
}
function assertLocked(dir, before) {
  assert.equal(lock(dir), before);
}
function changedLocalVersion(dir) {
  write(
    dir,
    "label-core/Cargo.toml",
    replace(
      blocks.get("label-core/Cargo.toml"),
      'version = "0.1.0"',
      'version = "0.1.1"',
    ),
  );
}

// Catalogo sintetico per il resolver reale, non copie di crate pubbliche.
// Il replacement e confinato alla fixture e non e una ricetta per registry privati.
const replacement =
  '[source.crates-io]\nreplace-with="fixture-vendor"\n[source.fixture-vendor]\ndirectory="vendor"\n';
const catalogEntries = new Map();
function packageSource(dir, name, version, dependencies = {}) {
  if (!catalogEntries.has(dir)) catalogEntries.set(dir, new Map());
  catalogEntries
    .get(dir)
    .set(name + "-" + version, { name, version, dependencies });
  const rel = "vendor/" + name + "-" + version;
  const manifestText =
    "[package]\nname=" +
    JSON.stringify(name) +
    "\nversion=" +
    JSON.stringify(version) +
    '\nedition="2024"\n[dependencies]\n' +
    Object.entries(dependencies)
      .map(([key, value]) => key + "=" + JSON.stringify(value))
      .join("\n") +
    "\n";
  const source =
    "pub fn version() -> &" +
    "'static str { " +
    JSON.stringify(version) +
    " }\n" +
    (name === "fixture-engine"
      ? "pub fn core_version() -> &'static str { fixture_core::version() }\n"
      : "");
  const files = { "Cargo.toml": manifestText, "src/lib.rs": source };
  const checksums = {};
  for (const [file, content] of Object.entries(files)) {
    write(dir, rel + "/" + file, content);
    checksums[file] = createHash("sha256").update(content).digest("hex");
  }
  write(
    dir,
    rel + "/.cargo-checksum.json",
    JSON.stringify({ files: checksums, package: null }),
  );
}
function catalog() {
  const dir = directory();
  write(dir, ".cargo/config.toml", replacement);
  write(
    dir,
    "Cargo.toml",
    '[package]\nname="resolver-demo"\nversion="0.1.0"\nedition="2024"\n[dependencies]\nfixture-engine="1"\nfixture-other="1"\n',
  );
  write(
    dir,
    "src/main.rs",
    'fn main() { println!("{} {}", fixture_engine::version(), fixture_engine::core_version()); }\n',
  );
  packageSource(dir, "fixture-core", "1.0.0");
  packageSource(dir, "fixture-engine", "1.0.0", { "fixture-core": "1" });
  packageSource(dir, "fixture-other", "1.0.0");
  generate(dir);
  return dir;
}
function newer(dir, coreRequirement = "1") {
  packageSource(dir, "fixture-core", "1.1.0");
  packageSource(dir, "fixture-engine", "1.1.0", {
    "fixture-core": coreRequirement,
  });
  packageSource(dir, "fixture-other", "1.1.0");
  packageSource(dir, "fixture-engine", "2.0.0", { "fixture-core": "1" });
}
function expectVersions(dir, engine, core, other) {
  const current = versions(dir);
  assert.equal(current["fixture-engine"], engine);
  assert.equal(current["fixture-core"], core);
  assert.equal(current["fixture-other"], other);
}

// Per verificare --precise sulle versioni usiamo un registry con indice e archivi.
function localRegistry(dir) {
  const registry = path.join(dir, "local-registry");
  fs.mkdirSync(registry, { recursive: true });
  const indexes = new Map();
  for (const [folder, entry] of catalogEntries.get(dir)) {
    const archive = path.join(registry, folder + ".crate");
    if (!fs.existsSync(archive))
      ok(
        launch(
          "tar",
          [
            "-czf",
            archive,
            "-C",
            path.join(dir, "vendor"),
            folder + "/Cargo.toml",
            folder + "/src/lib.rs",
          ],
          dir,
        ),
      );
    const record = {
      name: entry.name,
      vers: entry.version,
      deps: Object.entries(entry.dependencies).map(([name, req]) => ({
        name,
        req,
        features: [],
        optional: false,
        default_features: true,
        target: null,
        kind: "normal",
        registry: null,
      })),
      cksum: createHash("sha256")
        .update(fs.readFileSync(archive))
        .digest("hex"),
      features: {},
      yanked: false,
    };
    if (!indexes.has(entry.name)) indexes.set(entry.name, []);
    indexes.get(entry.name).push(record);
  }
  for (const [name, entries] of indexes)
    write(
      dir,
      "local-registry/index/" +
        name.slice(0, 2) +
        "/" +
        name.slice(2, 4) +
        "/" +
        name,
      entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n",
    );
  write(
    dir,
    ".cargo/config.toml",
    '[source.crates-io]\nreplace-with="fixture-local"\n[source.fixture-local]\nlocal-registry="local-registry"\n',
  );
}

test("toolchain reale, blocchi e struttura della nota", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /rustc 1\.99\.1\b/);
  assert.match(ok(run(root, "--version")).stdout, /cargo 1\.99\.1\b/);
  assert.equal(commands.size, 16);
  assert.deepEqual([...blocks.keys()], [...fileNames, "Cargo.lock generato"]);
  const headings = note.tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(headings.filter((node) => node.depth === 1).map(text), [
    "Cargo.lock",
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
});
test("frontmatter invariato e comandi indipendenti", () => {
  const previous = ok(
    launch(
      "git",
      ["show", "HEAD:Programmazione/Rust/Pagine/Cargo.lock.md"],
      process.cwd(),
    ),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(previous.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  for (const cmd of commands) assert.ok(!cmd.includes("\n"));
  for (const cmd of [
    "cargo update -p serde",
    "cargo update -p tokio",
    "cargo tree -i tokio --locked",
    "git diff -- Cargo.toml Cargo.lock",
  ])
    assert.ok(commands.has(cmd));
});
test("esempio originale: lockfile uguale al blocco, run e test reali", () => {
  const dir = fixture();
  generate(dir);
  assert.equal(lock(dir), blocks.get("Cargo.lock generato"));
  assert.ok(!fs.existsSync(path.join(dir, "target")));
  const before = lock(dir);
  assert.equal(ok(command("cargo run --locked", dir)).stdout, "Note: Rust\n");
  assert.equal(passed(command("cargo test --frozen", dir)), 1);
  assertLocked(dir, before);
  assert.deepEqual(versions(dir), {
    "label-core": "0.1.0",
    "lock-demo": "0.1.0",
  });
});
test("lockfile mancante: locked e frozen falliscono senza crearlo", () => {
  for (const cmd of [
    "cargo build --locked",
    "cargo build --frozen",
    "cargo test --locked",
  ]) {
    const dir = fixture();
    fails(command(cmd, dir), /lock file|lockfile/i);
    assert.ok(!fs.existsSync(path.join(dir, "Cargo.lock")));
  }
});
test("offline puo creare il lockfile, poi locked/frozen/fetch lo conservano", () => {
  const dir = fixture();
  ok(command("cargo build --offline", dir));
  const before = lock(dir);
  for (const cmd of [
    "cargo build --locked",
    "cargo build --frozen",
    "cargo fetch --locked",
    "cargo test --locked",
  ])
    ok(command(cmd, dir));
  assertLocked(dir, before);
});
test("versione locale cambiata: locked fallisce, update mirato la registra", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  changedLocalVersion(dir);
  fails(command("cargo build --locked", dir), /lock file|lockfile/i);
  assertLocked(dir, before);
  ok(command("cargo update -p label-core --offline", dir));
  assert.equal(versions(dir)["label-core"], "0.1.1");
  assert.equal(passed(command("cargo test --frozen", dir)), 1);
});
test("offline puo anche aggiornare un lockfile esistente", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  changedLocalVersion(dir);
  ok(command("cargo build --offline", dir));
  assert.notEqual(lock(dir), before);
  assert.equal(versions(dir)["label-core"], "0.1.1");
});
test("sorgenti path modificati: locked riuscito, stesso lock ma output e test diversi", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  write(
    dir,
    "label-core/src/lib.rs",
    replace(blocks.get("label-core/src/lib.rs"), "Note:", "Memo:"),
  );
  assert.equal(ok(command("cargo run --locked", dir)).stdout, "Memo: Rust\n");
  fails(command("cargo test --frozen", dir), /formats_label.*FAILED/);
  assertLocked(dir, before);
});
test("lockfile aggiornabile anche con sorgenti non compilabili", () => {
  const dir = fixture({ "src/main.rs": "fn main() { missing(); }\n" });
  generate(dir);
  ok(command("cargo update", dir));
  fails(command("cargo build --locked", dir), /E0425/);
});
test("fetch scarica/prepara sorgenti, non compila ne esegue i test", () => {
  const dir = fixture({ "src/main.rs": "fn main() { missing(); }\n" });
  generate(dir);
  ok(command("cargo fetch --locked", dir));
  assert.ok(!fs.existsSync(path.join(dir, "target")));
  fails(command("cargo build --frozen", dir), /E0425/);
});
test("sorgente locale mancante impedisce la build anche con lockfile", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  const dest = path.resolve(dir, "label-core/src/lib.rs");
  assert.ok(dest.startsWith(root + path.sep));
  fs.unlinkSync(dest);
  fails(command("cargo build --frozen", dir), /no targets specified|lib\.rs/);
  assertLocked(dir, before);
});
test("tree e inverse tree descrivono i dipendenti, non cambiano il lockfile", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  assert.match(
    ok(command("cargo tree --locked", dir)).stdout,
    /lock-demo.*\n.*label-core/s,
  );
  const result = ok(run(dir, "tree", "-i", "label-core", "--locked"));
  assert.match(result.stdout, /label-core.*\n.*lock-demo/s);
  assertLocked(dir, before);
});
test("locked non significa test superati: build riuscito e assert fallita", () => {
  const dir = fixture({
    "tests/label.rs": "#[test] fn wrong() { assert!(false); }\n",
  });
  generate(dir);
  ok(command("cargo build --locked", dir));
  fails(command("cargo test --locked", dir), /wrong.*FAILED/);
});
test("frozen non impedisce l'esecuzione di un build script locale", () => {
  const dir = fixture();
  write(
    dir,
    "build.rs",
    'fn main() { println!("cargo::warning=offline-script-ran"); }\n',
  );
  generate(dir);
  assert.match(
    ok(command("cargo build --frozen", dir)).stderr,
    /offline-script-ran/,
  );
});
test("stesso lockfile, feature del comando diversa e comportamento diverso", () => {
  const dir = fixture({
    "Cargo.toml": manifest + "\n[features]\nalternate=[]\n",
    "src/main.rs":
      'fn main() { println!("{}", if cfg!(feature="alternate") { "alternate" } else { "default" }); }\n',
  });
  generate(dir);
  const before = lock(dir);
  assert.equal(ok(run(dir, "run", "--frozen")).stdout, "default\n");
  assert.equal(
    ok(run(dir, "run", "--frozen", "--features", "alternate")).stdout,
    "alternate\n",
  );
  assertLocked(dir, before);
});
test("formato troppo nuovo o file corrotto non vengono accettati", () => {
  const dir = fixture();
  generate(dir);
  const before = lock(dir);
  write(dir, "Cargo.lock", replace(before, "version = 4", "version = 999"));
  fails(
    command("cargo build --locked", dir),
    /lock file version.*999|lockfile version.*999/is,
  );
  write(dir, "Cargo.lock", "not valid toml [");
  fails(command("cargo build --locked", dir), /parse|invalid/i);
});
test("workspace: lockfile unico nella root anche dal membro", () => {
  const dir = directory();
  write(dir, "Cargo.toml", '[workspace]\nmembers=["a","b"]\nresolver="3"\n');
  for (const name of ["a", "b"]) {
    write(
      dir,
      name + "/Cargo.toml",
      '[package]\nname="' + name + '"\nversion="0.1.0"\nedition="2024"\n',
    );
    write(dir, name + "/src/lib.rs", "pub fn value() -> u8 { 1 }\n");
  }
  ok(run(path.join(dir, "a"), "generate-lockfile", "--offline"));
  assert.ok(fs.existsSync(path.join(dir, "Cargo.lock")));
  for (const name of ["a", "b"])
    assert.ok(!fs.existsSync(path.join(dir, name, "Cargo.lock")));
  assert.equal(metadata(dir).workspace_members.length, 2);
  ok(run(dir, "check", "--workspace", "--frozen"));
});
test("catalogo locale: build conserva le versioni registrate anche se esistono nuove", () => {
  const dir = catalog();
  const before = lock(dir);
  newer(dir);
  assert.equal(ok(run(dir, "run", "--frozen")).stdout, "1.0.0 1.0.0\n");
  expectVersions(dir, "1.0.0", "1.0.0", "1.0.0");
  assertLocked(dir, before);
});
test("dry-run mostra cambiamenti senza scrivere il lockfile", () => {
  const dir = catalog();
  const before = lock(dir);
  newer(dir);
  const result = ok(command("cargo update --dry-run", dir));
  assert.match(result.stdout + result.stderr, /fixture-engine.*1\.1\.0/);
  assertLocked(dir, before);
});
test("update generale seleziona versioni compatibili, non major incompatibili", () => {
  const dir = catalog();
  newer(dir);
  const before = fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8");
  ok(command("cargo update", dir));
  expectVersions(dir, "1.1.0", "1.1.0", "1.1.0");
  assert.equal(fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8"), before);
  assert.equal(ok(run(dir, "run", "--frozen")).stdout, "1.1.0 1.1.0\n");
});
test("update mirato conserva le transitive se ancora compatibili", () => {
  const dir = catalog();
  newer(dir);
  ok(run(dir, "update", "-p", "fixture-engine"));
  expectVersions(dir, "1.1.0", "1.0.0", "1.0.0");
});
test("update mirato cambia la transitiva quando necessario", () => {
  const dir = catalog();
  newer(dir, "1.1");
  ok(run(dir, "update", "-p", "fixture-engine"));
  expectVersions(dir, "1.1.0", "1.1.0", "1.0.0");
});
test("recursive aggiorna anche transitive compatibili che non richiedevano modifiche", () => {
  const dir = catalog();
  newer(dir);
  ok(run(dir, "update", "-p", "fixture-engine", "--recursive"));
  expectVersions(dir, "1.1.0", "1.1.0", "1.0.0");
});
test("precise seleziona e puo retrocedere, senza aggirare requisiti incompatibili", () => {
  const dir = catalog();
  localRegistry(dir);
  generate(dir);
  newer(dir);
  packageSource(dir, "fixture-engine", "1.0.1", { "fixture-core": "1" });
  localRegistry(dir);
  ok(run(dir, "update", "-p", "fixture-engine", "--precise", "1.0.1"));
  expectVersions(dir, "1.0.1", "1.0.0", "1.0.0");
  ok(run(dir, "update", "-p", "fixture-engine", "--precise", "1.0.0"));
  expectVersions(dir, "1.0.0", "1.0.0", "1.0.0");
  const before = lock(dir);
  fails(
    run(dir, "update", "-p", "fixture-engine", "--precise", "2.0.0"),
    /failed to select a version/,
  );
  assertLocked(dir, before);
});
test("generate-lockfile su file esistente ricostruisce e aggiorna", () => {
  const dir = catalog();
  newer(dir);
  generate(dir);
  expectVersions(dir, "1.1.0", "1.1.0", "1.1.0");
});
test("requisito incompatibile con lockfile: locked rifiuta, build ordinario aggiorna", () => {
  const dir = catalog();
  const before = lock(dir);
  newer(dir);
  const old = fs.readFileSync(path.join(dir, "Cargo.toml"), "utf8");
  write(
    dir,
    "Cargo.toml",
    replace(old, 'fixture-engine="1"', 'fixture-engine="1.1"'),
  );
  fails(command("cargo build --locked", dir), /lock file|lockfile/i);
  assertLocked(dir, before);
  ok(command("cargo build --offline", dir));
  expectVersions(dir, "1.1.0", "1.0.0", "1.0.0");
});
test("consumer risolve autonomamente, senza usare il lockfile della libreria", () => {
  const library = catalog();
  write(
    library,
    "src/lib.rs",
    "pub fn engine_version() -> &'static str { fixture_engine::version() }\n",
  );
  const before = lock(library);
  newer(library);
  const consumer = directory();
  write(
    consumer,
    ".cargo/config.toml",
    replacement.replace(
      'directory="vendor"',
      "directory=" +
        JSON.stringify(path.join(library, "vendor").replaceAll("\\", "/")),
    ),
  );
  write(
    consumer,
    "Cargo.toml",
    '[package]\nname="consumer"\nversion="0.1.0"\nedition="2024"\n[dependencies]\nresolver-demo={path=' +
      JSON.stringify(library.replaceAll("\\", "/")) +
      "}\n",
  );
  write(
    consumer,
    "src/main.rs",
    'fn main() { println!("{}", resolver_demo::engine_version()); }\n',
  );
  assert.equal(ok(run(consumer, "run", "--offline")).stdout, "1.1.0\n");
  assert.equal(versions(consumer)["fixture-engine"], "1.1.0");
  assertLocked(library, before);
  expectVersions(library, "1.0.0", "1.0.0", "1.0.0");
});
test("integrita della directory source: modifica non accompagnata dal checksum rifiutata", () => {
  const dir = catalog();
  write(
    dir,
    "vendor/fixture-core-1.0.0/src/lib.rs",
    "pub fn version() -> &" + '\'static str { "changed" }\n',
  );
  fails(command("cargo build --frozen", dir), /checksum|has changed/i);
});
test("dipendenza di un'altra piattaforma risolta ma non compilata sulla piattaforma corrente", () => {
  const inactive = process.platform === "win32" ? "unix" : "windows";
  const dir = fixture({
    "Cargo.toml":
      manifest +
      "\n[target.'cfg(" +
      inactive +
      ')\'.dependencies]\nother-platform={path="other-platform"}\n',
  });
  write(
    dir,
    "other-platform/Cargo.toml",
    '[package]\nname="other-platform"\nversion="0.1.0"\nedition="2024"\n',
  );
  write(
    dir,
    "other-platform/src/lib.rs",
    'compile_error!("inactive platform compiled");\n',
  );
  generate(dir);
  assert.equal(versions(dir)["other-platform"], "0.1.0");
  ok(command("cargo build --frozen", dir));
});
test("cache Cargo isolata: solo archivi sintetici e nessun checkout Git", () => {
  assert.equal(env.CARGO_NET_OFFLINE, "true");
  assert.ok(fs.realpathSync(env.CARGO_HOME).startsWith(root + path.sep));
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "git")));
  // Il solo contenitore registry puo esistere anche senza download.
  for (const entry of fs.readdirSync(env.CARGO_HOME, {
    recursive: true,
    withFileTypes: true,
  }))
    if (entry.isFile() && entry.name.endsWith(".crate"))
      assert.match(entry.name, /^fixture-(core|engine|other)-/);
});
