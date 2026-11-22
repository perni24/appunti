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
const note = parseNote("Programmazione/Rust/Pagine/Semantic Versioning.md");
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
    assert.ok(["rust", "toml", "text"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const manifest = blocks.get("Cargo.toml");
const fileNames = [
  "Cargo.toml",
  "src/main.rs",
  "number-parser/Cargo.toml",
  "number-parser/src/lib.rs",
  "number-parser/tests/parse.rs",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-semver-";
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
  assert.ok(
    ["--version", "metadata", "check", "run", "test", "fmt", "update"].includes(
      args[0],
    ),
  );
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
    ok(run(dir, "metadata", "--format-version", "1", "--offline")).stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
const libraryManifest = blocks.get("number-parser/Cargo.toml");
const library = blocks.get("number-parser/src/lib.rs");
const minor = blocks.get("Evoluzione compatibile: 1.3.0");
const major = blocks.get("Evoluzione incompatibile: 2.0.0");
const migrated = blocks.get("Consumer adattato alla 2.0.0");
// Il parser del vault conserva le tabelle come paragrafi: usa i nodi inline,
// senza introdurre un secondo parser o reinterpretare la sintassi dei requisiti.
const table = note.tree.children.find(
  (node) => node.type === "paragraph" && text(node).startsWith("| Requisito |"),
);
assert.ok(table);
const cells = table.children
  .filter((node) => node.type === "inlineCode")
  .map(text);
assert.equal(cells.length, 25);
const rows = [];
for (let i = 0; i < cells.length - 1; i += 2) rows.push(cells.slice(i, i + 2));
assert.match(
  text(table.children.at(-1)).trim(),
  /^\| Tutte le release stabili \|$/,
);
rows.push([cells.at(-1), "Tutte le release stabili"]);
const byRequirement = new Map(rows);
function version(dir, value) {
  write(
    dir,
    "number-parser/Cargo.toml",
    replace(libraryManifest, 'version = "1.2.3"', 'version = "' + value + '"'),
  );
}
function requirement(dir, value) {
  write(
    dir,
    "Cargo.toml",
    replace(manifest, 'version = "1.2.3"', 'version = "' + value + '"'),
  );
}
function resolution(dir) {
  return run(dir, "metadata", "--format-version", "1", "--offline");
}
function selected(dir) {
  return metadata(dir).packages.find((pkg) => pkg.name === "number-parser")
    .version;
}
function satisfies(req, ver, accepted) {
  const dir = fixture();
  requirement(dir, req);
  version(dir, ver);
  const result = resolution(dir);
  if (accepted) {
    const pkg = JSON.parse(ok(result).stdout).packages.find(
      (p) => p.name === "number-parser",
    );
    assert.equal(pkg.version, ver, req + " / " + ver);
  } else fails(result, /failed to select a version/, req + " / " + ver);
}
function majorFixture() {
  const dir = fixture({ "number-parser/src/lib.rs": major });
  version(dir, "2.0.0");
  return dir;
}
function lock(dir) {
  return fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8");
}

// Catalogo sintetico e locale: il resolver e Cargo, non un'imitazione in JavaScript.
function catalog(req = "1.2.3") {
  const dir = fixture();
  write(
    dir,
    "Cargo.toml",
    '[package]\nname="catalog-client"\nversion="0.1.0"\nedition="2024"\npublish=false\n[dependencies]\nnumber-parser=' +
      JSON.stringify(req) +
      "\n",
  );
  write(
    dir,
    ".cargo/config.toml",
    '[source.crates-io]\nreplace-with="fixture-vendor"\n[source.fixture-vendor]\ndirectory="vendor"\n',
  );
  return dir;
}
function release(dir, value, source = library) {
  const files = {
    "Cargo.toml": replace(
      libraryManifest,
      'version = "1.2.3"',
      'version = "' + value + '"',
    ),
    "src/lib.rs": source,
  };
  const checksums = {};
  for (const [name, content] of Object.entries(files)) {
    write(dir, "vendor/number-parser-" + value + "/" + name, content);
    checksums[name] = createHash("sha256").update(content).digest("hex");
  }
  write(
    dir,
    "vendor/number-parser-" + value + "/.cargo-checksum.json",
    JSON.stringify({ files: checksums, package: null }),
  );
}

test("toolchain, inventario e struttura della tabella", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /rustc 1\.99\.1\b/);
  assert.match(ok(run(root, "--version")).stdout, /cargo 1\.99\.1\b/);
  assert.equal(commands.size, 7);
  assert.deepEqual(
    [...blocks.keys()],
    [
      "Intervalli per le release stabili",
      "Prerelease e build metadata",
      ...fileNames,
      "Evoluzione compatibile: 1.3.0",
      "Evoluzione incompatibile: 2.0.0",
      "Consumer adattato alla 2.0.0",
    ],
  );
  assert.equal(rows.length, 13);
  assert.equal(byRequirement.size, 13);
});
test("frontmatter invariato, template tecnico e comandi singoli", () => {
  const old = ok(
    launch(
      "git",
      ["show", "HEAD:Programmazione/Rust/Pagine/Semantic Versioning.md"],
      process.cwd(),
    ),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Semantic Versioning",
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
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  for (const cmd of commands) assert.ok(!cmd.includes("\n"));
});
test("metadata: package version distinta da requirement, due membri non pubblicabili", () => {
  const data = metadata(fixture());
  const app = data.packages.find((p) => p.name === "semver-client");
  const lib = data.packages.find((p) => p.name === "number-parser");
  assert.equal(app.version, "0.1.0");
  assert.equal(lib.version, "1.2.3");
  assert.equal(app.dependencies[0].req, "^1.2.3");
  assert.ok(app.dependencies[0].path);
  assert.deepEqual(app.publish, []);
  assert.deepEqual(lib.publish, []);
  assert.equal(data.workspace_members.length, 2);
});
test("manifest illustrativo: sola lettura dei sei requisiti, nessun download", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    '[package]\nname="metadata-demo"\nversion="0.1.0"\nedition="2024"\n' +
      blocks.get("Intervalli per le release stabili"),
  );
  write(dir, "src/main.rs", "fn main() {}\n");
  const data = JSON.parse(
    ok(run(dir, "metadata", "--format-version", "1", "--no-deps")).stdout,
  );
  const deps = Object.fromEntries(
    data.packages[0].dependencies.map((d) => [d.name, d.req]),
  );
  assert.deepEqual(deps, {
    crate_a: "^1.2.3",
    crate_b: "~1.2",
    crate_c: ">=1.2, <2.0",
    "my-crate": "^0.3.2",
    serde: "^1",
    tokio: "^1.37",
  });
});
test("esempio iniziale: fmt, check, run 42 e integration test reale", () => {
  const dir = fixture();
  ok(command("cargo fmt --all -- --check", dir));
  for (const name of fileNames)
    assert.equal(
      fs.readFileSync(path.join(dir, name), "utf8"),
      blocks.get(name),
    );
  ok(command("cargo check --workspace --all-targets", dir));
  assert.equal(ok(command("cargo run -p semver-client", dir)).stdout, "42\n");
  assert.equal(passed(command("cargo test --workspace", dir)), 1);
});
test("minor: consumer e test originali invariati, nuova funzione utilizzabile", () => {
  const dir = fixture({ "number-parser/src/lib.rs": minor });
  version(dir, "1.3.0");
  assert.equal(selected(dir), "1.3.0");
  assert.equal(ok(command("cargo run -p semver-client", dir)).stdout, "42\n");
  assert.equal(passed(command("cargo test --workspace", dir)), 1);
  write(
    dir,
    "number-parser/tests/strict.rs",
    '#[test] fn strict() { assert_eq!(number_parser::parse_strict("42").unwrap(), 42); assert!(number_parser::parse_strict(" 42 ").is_err()); }\n',
  );
  assert.equal(passed(run(dir, "test", "--workspace")), 2);
  ok(
    command(
      "cargo fmt --all -- --check",
      fixture({ "number-parser/src/lib.rs": minor }),
    ),
  );
});
test("stessa firma e requirement valido non garantiscono il comportamento", () => {
  const dir = fixture({
    "number-parser/src/lib.rs": replace(
      library,
      "input.trim().parse()",
      "input.parse()",
    ),
  });
  ok(command("cargo check --workspace --all-targets", dir));
  fails(command("cargo run -p semver-client", dir), /input valido/);
  fails(command("cargo test --workspace", dir), /public_contract.*FAILED/);
});
test("major: requisito originale rifiuta la versione prima di compilare", () => {
  fails(
    command("cargo check -p semver-client", majorFixture()),
    /failed to select a version/,
  );
});
test("breaking change etichettato minor: resolver accetta, rustc rifiuta E0061", () => {
  const dir = fixture({ "number-parser/src/lib.rs": major });
  version(dir, "1.3.0");
  assert.equal(selected(dir), "1.3.0");
  fails(command("cargo check -p semver-client", dir), /E0061/);
});
test("requisito aggiornato a 2: non migra automaticamente il chiamante", () => {
  const dir = majorFixture();
  requirement(dir, "2");
  assert.equal(selected(dir), "2.0.0");
  fails(command("cargo check -p semver-client", dir), /E0061/);
});
test("consumer 2.0 adattato: run riuscito ma vecchi test ancora incompatibili", () => {
  const dir = majorFixture();
  requirement(dir, "2");
  write(dir, "src/main.rs", migrated);
  assert.equal(ok(command("cargo run -p semver-client", dir)).stdout, "42\n");
  fails(command("cargo test --workspace", dir), /E0061/);
  let tests = blocks.get("number-parser/tests/parse.rs");
  for (const arg of ['" 42 "', '"0"', '""', '"-1"', '"4294967296"'])
    tests = replace(
      tests,
      "number_parser::parse(" + arg + ")",
      "number_parser::parse(" + arg + ", false)",
    );
  write(dir, "number-parser/tests/parse.rs", tests);
  assert.equal(passed(command("cargo test --workspace", dir)), 1);
  ok(command("cargo fmt --all -- --check", dir));
});
test("nuova API: minimo dichiarato troppo basso ammette una versione senza la funzione", () => {
  const dir = fixture({
    "src/main.rs": replace(
      blocks.get("src/main.rs"),
      'parse(" 42 ")',
      'parse_strict("42")',
    ),
  });
  assert.equal(selected(dir), "1.2.3");
  fails(command("cargo check -p semver-client", dir), /E0425/);
  version(dir, "1.3.0");
  write(dir, "number-parser/src/lib.rs", minor);
  assert.equal(ok(command("cargo run -p semver-client", dir)).stdout, "42\n");
  requirement(dir, "1.3.0");
  version(dir, "1.2.3");
  fails(resolution(dir), /failed to select a version/);
});

const cases = [
  ["1.2.3", ">=1.2.3, <2.0.0", ["1.2.3", "1.3.0"], ["1.2.2", "2.0.0"]],
  ["^1.2.3", ">=1.2.3, <2.0.0", ["1.2.3", "1.9.0"], ["1.2.2", "2.0.0"]],
  ["1.0", ">=1.0.0, <2.0.0", ["1.0.0", "1.9.0"], ["0.9.9", "2.0.0"]],
  ["~1.2.3", ">=1.2.3, <1.3.0", ["1.2.3", "1.2.9"], ["1.2.2", "1.3.0"]],
  ["~1", ">=1.0.0, <2.0.0", ["1.0.0", "1.9.0"], ["0.9.9", "2.0.0"]],
  ["1.2.*", ">=1.2.0, <1.3.0", ["1.2.0", "1.2.9"], ["1.1.9", "1.3.0"]],
  ["=1.2.3", "=1.2.3", ["1.2.3"], ["1.2.2", "1.2.4", "1.3.0"]],
  [">=1.2, <2.0", ">=1.2.0, <2.0.0", ["1.2.0", "1.9.0"], ["1.1.9", "2.0.0"]],
  ["0.3.2", ">=0.3.2, <0.4.0", ["0.3.2", "0.3.9"], ["0.3.1", "0.4.0"]],
  ["0.0.3", ">=0.0.3, <0.0.4", ["0.0.3"], ["0.0.2", "0.0.4"]],
  ["0.0", ">=0.0.0, <0.1.0", ["0.0.0", "0.0.9"], ["0.1.0"]],
  ["0", ">=0.0.0, <1.0.0", ["0.0.0", "0.9.9"], ["1.0.0"]],
  [
    "*",
    "Tutte le release stabili",
    ["0.0.0", "1.2.3", "9.0.0"],
    ["1.3.0-alpha.1"],
  ],
];
for (const [req, interval, accepted, rejected] of cases) {
  test("tabella: " + req + " e limiti dichiarati", () => {
    assert.equal(byRequirement.get(req), interval);
    for (const version of accepted) satisfies(req, version, true);
    for (const version of rejected) satisfies(req, version, false);
    if (req !== "*") {
      for (const version of accepted) satisfies(interval, version, true);
      for (const version of rejected) satisfies(interval, version, false);
    }
  });
}
test("confronti in AND, intervallo impossibile e OR non valido", () => {
  for (const version of ["1.0.0", "2.0.0"])
    satisfies(">=2, <1", version, false);
  const dir = fixture();
  requirement(dir, "1 || 2");
  fails(resolution(dir), /failed to parse|unexpected/);
});
test("prerelease: opt-in della stessa base e successive release stabili compatibili", () => {
  satisfies("1.2.3", "1.3.0-alpha.1", false);
  for (const version of ["1.2.3-alpha.2", "1.2.3-beta.1", "1.2.3", "1.4.0"])
    satisfies("1.2.3-alpha.1", version, true);
  for (const version of ["1.2.3-alpha.0", "1.2.4-alpha.1", "2.0.0"])
    satisfies("1.2.3-alpha.1", version, false);
});
test("prerelease esatta non ammette beta o release finale", () => {
  satisfies("=1.2.3-alpha.1", "1.2.3-alpha.1", true);
  for (const version of ["1.2.3-alpha.2", "1.2.3-beta.1", "1.2.3"])
    satisfies("=1.2.3-alpha.1", version, false);
});
test("build metadata non restringono il requisito a una build specifica", () => {
  satisfies("=1.2.3+build.8", "1.2.3+build.7", true);
  satisfies("=1.2.3", "1.2.3+build.8", true);
});
test("versione del package: forma completa e assenza di zeri iniziali", () => {
  for (const value of ["1.2", "1.02.3", "1.2.3-alpha.01"]) {
    const dir = fixture();
    version(dir, value);
    fails(resolution(dir), /invalid|unexpected/);
  }
});
test("precedenza illustrata: risoluzione reale su catalogo locale", () => {
  const order = blocks
    .get("Prerelease e build metadata")
    .split("\n")[0]
    .split(" < ");
  assert.deepEqual(order, [
    "1.2.3-alpha.2",
    "1.2.3-alpha.10",
    "1.2.3-beta.1",
    "1.2.3-rc.1",
    "1.2.3",
  ]);
  const dir = catalog("1.2.3-alpha.1");
  for (const value of order) {
    release(dir, value);
    ok(run(dir, "update", "-p", "number-parser"));
    assert.equal(selected(dir), value);
  }
});
test("catalogo: lock conserva la versione; update dry-run non modifica, update sceglie minor", () => {
  const dir = catalog();
  release(dir, "1.2.3");
  assert.equal(selected(dir), "1.2.3");
  const initial = lock(dir);
  release(dir, "1.3.0", minor);
  release(dir, "2.0.0", major);
  assert.equal(selected(dir), "1.2.3");
  assert.equal(lock(dir), initial);
  ok(run(dir, "update", "-p", "number-parser", "--dry-run"));
  assert.equal(lock(dir), initial);
  ok(run(dir, "update", "-p", "number-parser"));
  assert.equal(selected(dir), "1.3.0");
  assert.equal(ok(run(dir, "run")).stdout, "42\n");
});
test("requirement esatto della diretta non blocca la sua transitiva", () => {
  const dir = catalog("=1.2.3");
  release(dir, "1.2.3");
  const rel = "vendor/number-parser-1.2.3/Cargo.toml";
  const content =
    fs.readFileSync(path.join(dir, rel), "utf8") +
    '\n[dependencies]\nfixture-helper="1"\n';
  write(dir, rel, content);
  const checksumPath = "vendor/number-parser-1.2.3/.cargo-checksum.json";
  const checksum = JSON.parse(
    fs.readFileSync(path.join(dir, checksumPath), "utf8"),
  );
  checksum.files["Cargo.toml"] = createHash("sha256")
    .update(content)
    .digest("hex");
  write(dir, checksumPath, JSON.stringify(checksum));
  function helper(value) {
    const files = {
      "Cargo.toml":
        '[package]\nname="fixture-helper"\nversion="' +
        value +
        '"\nedition="2024"\n',
      "src/lib.rs": "pub fn value() -> u32 { 42 }\n",
    };
    const sums = {};
    for (const [name, source] of Object.entries(files)) {
      write(dir, "vendor/fixture-helper-" + value + "/" + name, source);
      sums[name] = createHash("sha256").update(source).digest("hex");
    }
    write(
      dir,
      "vendor/fixture-helper-" + value + "/.cargo-checksum.json",
      JSON.stringify({ files: sums, package: null }),
    );
  }
  helper("1.0.0");
  assert.equal(
    metadata(dir).packages.find((p) => p.name === "fixture-helper").version,
    "1.0.0",
  );
  helper("1.1.0");
  ok(run(dir, "update"));
  const packages = metadata(dir).packages;
  assert.equal(
    packages.find((p) => p.name === "number-parser").version,
    "1.2.3",
  );
  assert.equal(
    packages.find((p) => p.name === "fixture-helper").version,
    "1.1.0",
  );
});
test("input del parser: limiti u32, spazi, unicode e testo non numerico", () => {
  const dir = fixture();
  write(
    dir,
    "number-parser/tests/inputs.rs",
    String.raw`
#[test]
fn inputs() {
    assert_eq!(number_parser::parse("4294967295").unwrap(), u32::MAX);
    assert_eq!(number_parser::parse("\u{2003}42\t\n").unwrap(), 42);
    assert_eq!(number_parser::parse("+42").unwrap(), 42);
    for input in [" ", "4 2", "4,2", "1_000", "-1", "4294967296"] {
        assert!(number_parser::parse(input).is_err());
    }
}
`,
  );
  assert.equal(passed(command("cargo test --workspace", dir)), 2);
});
test("isolamento: nessuna credenziale, archivio scaricato o pubblicazione", () => {
  assert.equal(env.CARGO_NET_OFFLINE, "true");
  for (const name of [
    "credentials",
    "credentials.toml",
    "registry/src",
    "registry/cache",
  ])
    assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, name)));
  assert.throws(() => run(root, "publish"));
  assert.throws(() => run(root, "login"));
  assert.throws(() => run(root, "yank"));
});
