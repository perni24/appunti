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
const note = parseNote("Programmazione/Rust/Pagine/Crates.io.md");
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^(cargo|tar) [a-zA-Z0-9 ./_-]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml", "markdown"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const manifest = blocks.get("Cargo.toml");
const fileNames = ["Cargo.toml", "src/lib.rs", "tests/lines.rs", "README.md"];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-crates-io-";
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
  const safe = [
    "--version",
    "metadata",
    "check",
    "build",
    "test",
    "doc",
    "fmt",
    "clippy",
    "package",
    "publish",
  ];
  assert.ok(safe.includes(args[0]), "Operazione non ammessa: " + args[0]);
  if (args[0] === "publish")
    assert.ok(args.includes("--dry-run"), "Upload vietato nei test");
  return launch(cargo, args, dir);
}
function command(source, dir) {
  assert.ok(commands.has(source), source);
  const [exe, ...args] = source.split(" ");
  return exe === "tar" ? launch("tar", args, dir) : run(dir, ...args);
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
    ok(run(dir, "metadata", "--no-deps", "--format-version", "1")).stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function withManifest(value) {
  return fixture({ "Cargo.toml": value });
}

const archiveName = "registry-demo-0.1.0";
const archivePath = (dir) =>
  path.join(dir, "target", "package", archiveName + ".crate");
const extracted = (dir) => {
  const resolved = fs.realpathSync(
    path.join(dir, "target", "package", archiveName),
  );
  assert.ok(resolved.startsWith(root + path.sep));
  return resolved;
};
const included = [
  "Cargo.lock",
  "Cargo.toml",
  "Cargo.toml.orig",
  "README.md",
  "src/lib.rs",
  "tests/lines.rs",
];
function packageList(dir) {
  return ok(command("cargo package --list --offline", dir))
    .stdout.trim()
    .split("\n")
    .map((name) => name.replaceAll("\\", "/"))
    .sort();
}
function archiveList(dir) {
  const entries = ok(
    command("tar -tf target/package/registry-demo-0.1.0.crate", dir),
  )
    .stdout.trim()
    .split("\n");
  for (const entry of entries) {
    assert.ok(entry.startsWith(archiveName + "/"));
    assert.ok(!entry.split("/").includes(".."));
    assert.ok(!path.isAbsolute(entry));
  }
  return entries.map((entry) => entry.slice(archiveName.length + 1)).sort();
}
function archiveFile(dir, name) {
  assert.ok(included.includes(name));
  return ok(
    launch("tar", ["-xOf", archivePath(dir), archiveName + "/" + name], dir),
  ).stdout;
}
function dep(dir) {
  write(
    dir,
    "helper/Cargo.toml",
    '[package]\nname="fixture-helper"\nversion="0.1.0"\nedition="2024"\n',
  );
  write(dir, "helper/src/lib.rs", "pub fn value() -> u32 { 42 }\n");
}

test("toolchain e inventario dei blocchi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /rustc 1\.99\.1\b/);
  assert.match(ok(run(root, "--version")).stdout, /cargo 1\.99\.1\b/);
  assert.match(ok(launch("tar", ["--version"])).stdout, /tar/);
  assert.equal(commands.size, 15);
  assert.deepEqual(
    [...blocks.keys()],
    ["Quali file finiscono nell'archivio", ...fileNames],
  );
});

test("frontmatter: rimosso il ciclo SemVer, nessuna approvazione simulata", () => {
  const old = ok(
    launch(
      "git",
      ["show", "HEAD:Programmazione/Rust/Pagine/Crates.io.md"],
      process.cwd(),
    ),
  ).stdout;
  const expected = YAML.parse(old.split("---")[1]);
  const semver = "[[Programmazione/Rust/Pagine/Semantic Versioning]]";
  expected.prerequisites = expected.prerequisites.filter(
    (link) => link !== semver,
  );
  if (!expected.related.includes(semver)) expected.related.unshift(semver);
  assert.deepEqual(note.data, expected);
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(headings.filter((node) => node.depth === 1).map(text), [
    "Crates.io",
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

test("protezione: nessun upload, login, yank o uso delle credenziali personali", () => {
  for (const cmd of [
    "login",
    "logout",
    "yank",
    "owner",
    "install",
    "add",
    "info",
    "search",
  ])
    assert.throws(() => run(root, cmd), /Operazione non ammessa/);
  assert.throws(
    () => run(root, "publish", "--registry", "crates-io"),
    /Upload vietato/,
  );
  assert.equal(env.CARGO_NET_OFFLINE, "true");
  assert.ok(env.CARGO_HOME.startsWith(root + path.sep));
  assert.ok(
    !Object.keys(env).some(
      (key) => /TOKEN|CREDENTIAL/i.test(key) && /^CARGO_/i.test(key),
    ),
  );
});

test("metadata: package didattico senza dipendenze, non pubblicabile", () => {
  const pkg = metadata(fixture()).packages[0];
  assert.equal(pkg.name, "registry-demo");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(pkg.edition, "2024");
  assert.deepEqual(pkg.publish, []);
  assert.deepEqual(pkg.dependencies, []);
  assert.equal(pkg.license, null);
  assert.equal(pkg.repository, null);
  assert.equal(pkg.readme, "README.md");
  assert.ok(
    pkg.targets.some(
      (t) => t.name === "registry_demo" && t.kind.includes("lib"),
    ),
  );
  assert.ok(
    pkg.targets.some((t) => t.name === "lines" && t.kind.includes("test")),
  );
});

test("fmt verifica senza modificare i quattro file", () => {
  const dir = fixture();
  ok(command("cargo fmt --all -- --check", dir));
  for (const name of fileNames)
    assert.equal(
      fs.readFileSync(path.join(dir, name), "utf8"),
      blocks.get(name),
    );
});

test("Clippy senza warning su tutti i target", () => {
  ok(
    command(
      "cargo clippy --all-targets --all-features -- -D warnings",
      fixture(),
    ),
  );
});

test("esempio originale: due integration test e un doctest", () => {
  assert.equal(passed(command("cargo test --all-features", fixture())), 3);
});

test("doc genera realmente la pagina della funzione", () => {
  const dir = fixture();
  ok(command("cargo doc --no-deps", dir));
  const html = fs.readFileSync(
    path.join(dir, "target/doc/registry_demo/fn.count_nonempty_lines.html"),
    "utf8",
  );
  assert.match(html, /count_nonempty_lines/);
  assert.match(html, /whitespace/);
});

test("package --list elenca i file senza creare l'archivio", () => {
  const dir = fixture();
  assert.deepEqual(packageList(dir), included);
  assert.ok(!fs.existsSync(archivePath(dir)));
});

test("package verifica la copia estratta; tar conferma contenuti e manifest originale", () => {
  const dir = fixture();
  const result = ok(command("cargo package --offline", dir));
  assert.match(result.stderr, /Verifying/);
  assert.match(result.stderr, /license/);
  assert.deepEqual(archiveList(dir), included);
  for (const name of ["README.md", "src/lib.rs", "tests/lines.rs"])
    assert.equal(archiveFile(dir, name), blocks.get(name));
  assert.equal(archiveFile(dir, "Cargo.toml.orig"), manifest);
  assert.notEqual(archiveFile(dir, "Cargo.toml"), manifest);
  assert.match(archiveFile(dir, "Cargo.lock"), /name = "registry-demo"/);
  const pkg = metadata(extracted(dir)).packages[0];
  assert.equal(pkg.name, "registry-demo");
  assert.deepEqual(pkg.publish, []);
  assert.equal(passed(run(extracted(dir), "test")), 3);
});

test("include esclude falsi dati privati e output generato", () => {
  const dir = fixture();
  write(dir, ".env", "NOT_A_SECRET=fixture\n");
  write(dir, "notes/private.txt", "Dati sintetici di prova\n");
  write(dir, "target/output.txt", "Output sintetico\n");
  assert.deepEqual(packageList(dir), included);
  ok(run(dir, "package", "--offline"));
  assert.deepEqual(archiveList(dir), included);
});

test("include prevale su exclude nella tabella package", () => {
  const value = replace(
    manifest,
    "[package]",
    '[package]\nexclude = ["src/**", "tests/**"]',
  );
  assert.deepEqual(packageList(withManifest(value)), included);
});

test("frammento exclude funziona nel package e non come dipendenza", () => {
  const value = replace(
    replace(manifest, 'include = ["src/**", "tests/**", "README.md"]\n', ""),
    "[package]",
    "[package]\n" + blocks.get("Quali file finiscono nell'archivio").trim(),
  );
  const dir = withManifest(value);
  write(dir, "notes/private.txt", "Dato sintetico\n");
  write(dir, "tests/fixtures/data.txt", "Fixture esclusa\n");
  write(dir, "data/keep.txt", "Fixture inclusa\n");
  const names = packageList(dir);
  assert.ok(names.includes("data/keep.txt"));
  assert.ok(
    !names.some(
      (name) => name.startsWith("notes/") || name.startsWith("tests/fixtures/"),
    ),
  );
  fails(
    run(
      withManifest(manifest + blocks.get("Quali file finiscono nell'archivio")),
      "check",
    ),
    /invalid type/,
  );
});

test("file richiesto escluso: build locale passa ma package fallisce; includerlo ripara", () => {
  const dir = fixture({
    "src/lib.rs":
      'pub const MESSAGE: &str = include_str!("../data/message.txt");\n',
  });
  write(dir, "data/message.txt", "Hello\n");
  ok(run(dir, "build"));
  fails(run(dir, "package", "--offline"), /message\.txt/);
  write(
    dir,
    "Cargo.toml",
    replace(manifest, '"src/**"', '"src/**", "data/**"'),
  );
  ok(run(dir, "package", "--offline"));
});

test("package fallisce su codice invalido; no-verify non lo corregge", () => {
  const dir = fixture({ "src/lib.rs": 'compile_error!("package probe");\n' });
  assert.deepEqual(packageList(dir), included);
  fails(run(dir, "package", "--offline"), /package probe/);
  ok(run(dir, "package", "--offline", "--no-verify"));
  assert.ok(fs.existsSync(archivePath(dir)));
  fails(run(dir, "check"), /package probe/);
});

test("package non esegue le asserzioni dei test di integrazione", () => {
  const dir = fixture({
    "tests/lines.rs": "#[test] fn failing() { assert_eq!(1, 2); }\n",
  });
  ok(run(dir, "package", "--offline"));
  fails(run(dir, "test", "--test", "lines"), /failing.*FAILED/);
});

test("package non esegue i doctest", () => {
  const dir = fixture({
    "src/lib.rs": replace(blocks.get("src/lib.rs"), ", 2);", ", 99);"),
  });
  ok(run(dir, "package", "--offline"));
  fails(run(dir, "test", "--doc"), /test result: FAILED/);
});

test("feature difettosa: package normale passa, all-features la rileva", () => {
  const dir = withManifest(manifest + "\n[features]\nbroken=[]\n");
  write(
    dir,
    "src/lib.rs",
    blocks.get("src/lib.rs") +
      '\n#[cfg(feature="broken")]\ncompile_error!("feature probe");\n',
  );
  ok(run(dir, "package", "--offline"));
  fails(run(dir, "package", "--offline", "--all-features"), /feature probe/);
});

test("publish false vieta anche il dry-run nella toolchain verificata", () => {
  fails(
    command("cargo publish --dry-run --registry crates-io", fixture()),
    /cannot be published|not allowed|publish.*false/s,
  );
});

test("dry-run autorizzato richiede metadati registry anche senza dipendenze", () => {
  const dir = withManifest(
    replace(manifest, "publish = false", 'publish = ["crates-io"]'),
  );
  fails(
    command("cargo publish --dry-run --registry crates-io", dir),
    /failed to update registry.*config\.json not found/s,
  );
  assert.ok(!fs.existsSync(archivePath(dir)));
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "credentials.toml")));
});

test("lista publish impedisce di usare un registry non autorizzato", () => {
  const dir = withManifest(
    replace(manifest, "publish = false", 'publish = ["private-registry"]'),
  );
  fails(
    command("cargo publish --dry-run --registry crates-io", dir),
    /not allowed|not found|not.*publish/i,
  );
});

test("path senza versione: build locale valida ma package rifiutato", () => {
  const dir = withManifest(manifest + 'fixture-helper={path="helper"}\n');
  dep(dir);
  ok(run(dir, "build"));
  fails(run(dir, "package", "--offline"), /version requirement/);
});

test("dev-dependency locale senza versione rimossa dal manifest distribuito", () => {
  const dir = withManifest(
    manifest + '\n[dev-dependencies]\nfixture-helper={path="helper"}\n',
  );
  dep(dir);
  write(
    dir,
    "tests/lines.rs",
    "#[test] fn helper() { assert_eq!(fixture_helper::value(), 42); }\n",
  );
  assert.equal(passed(run(dir, "test")), 2);
  ok(run(dir, "package", "--offline"));
  assert.deepEqual(metadata(extracted(dir)).packages[0].dependencies, []);
  fails(run(extracted(dir), "test"), /E0433/);
});

test("build script eseguito dal packaging, generazione soltanto in OUT_DIR", () => {
  const dir = withManifest(
    replace(manifest, '"src/**"', '"src/**", "build.rs"'),
  );
  write(
    dir,
    "build.rs",
    'fn main() { let out = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap()); std::fs::write(out.join("message.txt"), "generated").unwrap(); }\n',
  );
  write(
    dir,
    "src/lib.rs",
    'pub const MESSAGE: &str = include_str!(concat!(env!("OUT_DIR"), "/message.txt"));\n',
  );
  ok(run(dir, "package", "--offline"));
  const files = fs.readdirSync(path.join(dir, "target"), { recursive: true });
  assert.ok(
    files.some((name) =>
      name.replaceAll("\\", "/").endsWith("/out/message.txt"),
    ),
  );
});

test("semantica della funzione: CRLF, unicode whitespace, testo senza newline finale", () => {
  const dir = fixture({
    "tests/lines.rs": String.raw`#[test]
fn inputs() {
    for (input, expected) in [
        ("", 0), ("\n", 0), ("\r\n", 0), ("\u{2003}\n\t", 0),
        ("first\nsecond", 2), ("first\r\n\r\nsecond\r\n", 2),
        ("a\rb", 1), ("\u{200b}", 1),
    ] {
        assert_eq!(registry_demo::count_nonempty_lines(input), expected);
    }
}
`,
  });
  assert.equal(passed(run(dir, "test")), 2);
});

test("isolamento finale: nessuna credenziale e nessun download dal registry", () => {
  for (const name of [
    "credentials",
    "credentials.toml",
    "registry/cache",
    "registry/src",
  ])
    assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, name)), name);
});
