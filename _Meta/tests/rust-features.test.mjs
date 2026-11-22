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
const notePath = "Programmazione/Rust/Pagine/Cargo features.md";
const note = parseNote(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node).split(":")[0];
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^cargo [a-zA-Z0-9 _,=./-]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const fileNames = [
  "Cargo.toml",
  "src/lib.rs",
  "tests/api.rs",
  "checksum-core/Cargo.toml",
  "checksum-core/src/lib.rs",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-features-";
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
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|GIT_)/i.test(
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
      "tree",
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
const configurations = [
  ["cargo test", 4, ["std"]],
  ["cargo test --no-default-features", 2, []],
  ["cargo test --no-default-features --features hex", 2, ["hex"]],
  ["cargo test --no-default-features --features checksum", 4, ["checksum"]],
  [
    "cargo test --no-default-features --features checksum,hex",
    6,
    ["checksum", "hex"],
  ],
  ["cargo test --all-features", 8, ["checksum", "hex", "std"]],
];
function artifacts(version, dir, ...flags) {
  const result = ok(
    run(version, dir, "build", "--message-format=json", ...flags),
  );
  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((message) => message.reason === "compiler-artifact");
}
function libraryArtifacts(messages, name) {
  return messages.filter(
    (message) =>
      message.reason === "compiler-artifact" &&
      message.target.name === name &&
      message.target.kind.includes("lib"),
  );
}
function features(messages, name) {
  const matches = libraryArtifacts(messages, name);
  assert.equal(matches.length, 1, JSON.stringify(matches));
  return matches[0].features;
}
function manifestChange(dir, before, after) {
  write(dir, "Cargo.toml", replace(read(dir, "Cargo.toml"), before, after));
}
function standaloneManifest(name, dependencies = "") {
  return (
    '[package]\nname="' +
    name +
    '"\nversion="0.1.0"\nedition="2024"\n[dependencies]\n' +
    dependencies
  );
}
function dependency(dir, flags = "") {
  return '{path="' + dir.replaceAll("\\", "/") + '"' + flags + "}";
}
function consumer(provider, featureNames = [], defaultFeatures = false) {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    standaloneManifest(
      "consumer",
      "feature-demo=" +
        dependency(
          provider,
          ",default-features=" +
            defaultFeatures +
            ",features=" +
            JSON.stringify(featureNames),
        ) +
        "\n",
    ),
  );
  write(
    dir,
    "src/main.rs",
    'fn main() { assert_eq!(feature_demo::byte_len("Rust"), 4); }\n',
  );
  return dir;
}
const baselines = new Map();
const digest = createHash("sha256")
  .update(fs.readFileSync(notePath))
  .digest("hex");

test("YAML conservato, template, cinque file, quattordici comandi e controesempio", () => {
  const old = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  assert.deepEqual([...blocks.keys()], [...fileNames, "Controesempio cfg!"]);
  assert.equal(commands.size, 14);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Cargo features",
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

test("versioni reali di rustc e Cargo abbinate", () => {
  matrix((version) => {
    const expected = new RegExp(version.replaceAll(".", "\\."));
    assert.match(
      ok(launch(compilers[version], ["--version"], root, environment(version)))
        .stdout,
      expected,
    );
    assert.match(ok(run(version, root, "--version")).stdout, expected);
  });
});

for (const version of Object.keys(compilers)) {
  test("matrice completa e risultati della nota su Rust " + version, () => {
    const dir = fixture();
    for (const [source, count, active] of configurations) {
      assert.equal(passed(command(source, version, dir)), count, source);
      const flags = source.split(" ").slice(2);
      const built = artifacts(version, dir, ...flags);
      const actual = features(built, "feature_demo")
        .filter((name) => name !== "default")
        .sort();
      assert.deepEqual(actual, [...active].sort(), source);
      assert.equal(
        libraryArtifacts(built, "checksum_core").length,
        active.includes("checksum") ? 1 : 0,
      );
      if (active.includes("checksum"))
        assert.deepEqual(
          features(built, "checksum_core"),
          active.includes("hex") ? ["hex"] : [],
        );
    }
    assert.equal(
      passed(command("cargo test --workspace --all-features", version, dir)),
      10,
    );
    ok(command("cargo check --all-targets --all-features", version, dir));
    assert.equal(
      passed(command("cargo test --doc --all-features", version, dir)),
      4,
    );
    const manifest = metadata(version, dir);
    assert.equal(manifest.workspace_members.length, 2);
    assert.equal(manifest.workspace_default_members.length, 1);
    for (const pkg of manifest.packages) {
      assert.equal(pkg.edition, "2024");
      assert.equal(pkg.rust_version, "1.85");
      assert.deepEqual(pkg.publish, []);
    }
    baselines.set(version, dir);
  });
}

test("tree senza dipendenza, con feature e grafo invertito", () => {
  matrix((version) => {
    const dir = baselines.get(version);
    const empty = ok(
      command(
        "cargo tree --no-default-features --features hex -e features",
        version,
        dir,
      ),
    ).stdout;
    assert.match(empty, /feature-demo/);
    assert.doesNotMatch(empty, /checksum-core/);
    const active = ok(
      command(
        "cargo tree --no-default-features --features checksum,hex -e features",
        version,
        dir,
      ),
    ).stdout;
    assert.match(active, /checksum-core/);
    const inverted = ok(
      command(
        "cargo tree --no-default-features --features checksum,hex -e features -i checksum-core",
        version,
        dir,
      ),
    ).stdout;
    assert.match(inverted, /checksum-core feature "hex"/);
    assert.match(inverted, /feature-demo feature "checksum"/);
    assert.match(inverted, /feature-demo feature "hex"/);
  });
});

test("rustfmt controlla tutti i file senza riscritture", () => {
  const dir = baselines.get("1.99.1");
  const before = fileNames.map((name) => read(dir, name));
  ok(command("cargo fmt --all -- --check", "1.99.1", dir));
  assert.deepEqual(
    fileNames.map((name) => read(dir, name)),
    before,
  );
});

test("Clippy corrente su tutto il workspace, zero warning", () => {
  ok(
    command(
      "cargo clippy --workspace --all-targets --all-features -- -D warnings",
      "1.99.1",
      baselines.get("1.99.1"),
    ),
  );
});

test("metadata distingue dipendenza opzionale, feature pubbliche e inoltro debole", () => {
  const dir = baselines.get("1.99.1");
  const pkg = metadata("1.99.1", dir).packages.find(
    (pkg) => pkg.name === "feature-demo",
  );
  assert.deepEqual(pkg.features, {
    checksum: ["dep:checksum-core"],
    default: ["std"],
    hex: ["checksum-core?/hex"],
    std: [],
  });
  assert.equal(pkg.dependencies[0].optional, true);
  assert.equal(pkg.dependencies[0].uses_default_features, false);
});

test("dep: sopprime la feature implicita checksum-core", () => {
  const dir = fixture();
  fails(
    run(
      "1.99.1",
      dir,
      "check",
      "--no-default-features",
      "--features",
      "checksum-core",
    ),
    /does not have|does not contain|implicit feature/i,
  );
});

test("senza dep: la dipendenza opzionale espone la feature implicita", () => {
  const dir = fixture();
  manifestChange(
    dir,
    'checksum = ["dep:checksum-core"]',
    'checksum = ["checksum-core"]',
  );
  const data = metadata("1.99.1", dir).packages.find(
    (pkg) => pkg.name === "feature-demo",
  );
  assert.deepEqual(data.features["checksum-core"], ["dep:checksum-core"]);
  const built = artifacts(
    "1.99.1",
    dir,
    "--no-default-features",
    "--features",
    "checksum-core",
  );
  assert.deepEqual(features(built, "checksum_core"), []);
  assert.ok(!features(built, "feature_demo").includes("checksum"));
});

test("inoltro senza ? abilita la dipendenza anche con solo hex", () => {
  matrix((version) => {
    const dir = fixture();
    manifestChange(
      dir,
      'hex = ["checksum-core?/hex"]',
      'hex = ["checksum-core/hex"]',
    );
    const built = artifacts(
      version,
      dir,
      "--no-default-features",
      "--features",
      "hex",
    );
    assert.deepEqual(features(built, "checksum_core"), ["hex"]);
    assert.ok(!features(built, "feature_demo").includes("checksum"));
  });
});

test("feature della dipendenza non equivale a quella del package principale", () => {
  const dir = fixture();
  const built = artifacts(
    "1.99.1",
    dir,
    "--no-default-features",
    "--features",
    "checksum,checksum-core/hex",
  );
  assert.deepEqual(features(built, "checksum_core"), ["hex"]);
  assert.deepEqual(features(built, "feature_demo"), ["checksum"]);
  assert.equal(
    passed(
      run(
        "1.99.1",
        dir,
        "test",
        "--no-default-features",
        "--features",
        "checksum,checksum-core/hex",
      ),
    ),
    4,
  );
});

test("cfg! originale rifiutato senza dipendenza, valido quando e attiva", () => {
  matrix((version) => {
    const dir = fixture({
      "src/lib.rs":
        blocks.get("src/lib.rs") + "\n" + blocks.get("Controesempio cfg!"),
    });
    fails(
      run(version, dir, "check", "--no-default-features"),
      /E0433|unresolved module|unlinked crate/,
    );
    ok(
      run(
        version,
        dir,
        "check",
        "--no-default-features",
        "--features",
        "checksum",
      ),
    );
  });
});

test("senza attributo no_std il nome std della feature non cambia il prelude", () => {
  const source = "pub fn unexpected_std() -> String { String::new() }\n";
  const dir = fixture({ "src/lib.rs": blocks.get("src/lib.rs") + source });
  fails(
    run("1.99.1", dir, "check", "--no-default-features"),
    /cannot find type .String|undeclared type .String/,
  );
  write(
    dir,
    "src/lib.rs",
    replace(
      read(dir, "src/lib.rs"),
      '#![cfg_attr(not(feature = "std"), no_std)]\n',
      "",
    ),
  );
  ok(run("1.99.1", dir, "check", "--no-default-features"));
});

test("all-features nasconde una chiamata non protetta a un'API std", () => {
  const dir = fixture({
    "tests/api.rs":
      blocks.get("tests/api.rs") +
      '\n#[test]\nfn unguarded() { assert_eq!(feature_demo::owned_text("Rust"), "Rust"); }\n',
  });
  ok(run("1.99.1", dir, "check", "--all-targets", "--all-features"));
  fails(
    run("1.99.1", dir, "check", "--all-targets", "--no-default-features"),
    /cannot find function .owned_text/,
  );
});

test("no-default-features non disattiva i default della dipendenza", () => {
  const dir = fixture({
    "checksum-core/Cargo.toml": replace(
      blocks.get("checksum-core/Cargo.toml"),
      "default = []",
      'default = ["hex"]',
    ),
  });
  assert.deepEqual(
    features(
      artifacts(
        "1.99.1",
        dir,
        "--no-default-features",
        "--features",
        "checksum",
      ),
      "checksum_core",
    ),
    [],
  );
  manifestChange(dir, ", default-features = false", "");
  const enabled = features(
    artifacts("1.99.1", dir, "--no-default-features", "--features", "checksum"),
    "checksum_core",
  );
  assert.ok(enabled.includes("hex"));
  assert.ok(enabled.includes("default"));
});

test("altro consumer riattiva i default: false non e un veto globale", () => {
  const provider = fixture();
  const app = consumer(provider);
  write(
    app,
    "src/main.rs",
    'fn main() { assert_eq!(feature_demo::owned_text("Rust"), "Rust"); }\n',
  );
  fails(run("1.99.1", app, "check"), /cannot find function .owned_text/);
  const bridge = directory();
  write(
    bridge,
    "Cargo.toml",
    standaloneManifest("bridge", "feature-demo=" + dependency(provider) + "\n"),
  );
  write(
    bridge,
    "src/lib.rs",
    'pub fn count() -> usize { feature_demo::byte_len("Rust") }\n',
  );
  write(
    app,
    "Cargo.toml",
    read(app, "Cargo.toml") + "bridge=" + dependency(bridge) + "\n",
  );
  ok(run("1.99.1", app, "run", "--quiet", "--no-default-features"));
  assert.ok(
    features(
      artifacts("1.99.1", app, "--no-default-features"),
      "feature_demo",
    ).includes("std"),
  );
});

test("due percorsi normali unificano checksum e hex", () => {
  const provider = fixture();
  const app = consumer(provider, ["hex"]);
  write(
    app,
    "src/main.rs",
    'fn main() { assert_eq!(feature_demo::checksum_hex(b"ABC"), *b"c6"); }\n',
  );
  fails(run("1.99.1", app, "check"), /cannot find function .checksum_hex/);
  const bridge = directory();
  write(
    bridge,
    "Cargo.toml",
    standaloneManifest(
      "bridge",
      "feature-demo=" +
        dependency(provider, ',default-features=false,features=["checksum"]') +
        "\n",
    ),
  );
  write(
    bridge,
    "src/lib.rs",
    'pub fn sum() -> u8 { feature_demo::checksum(b"ABC") }\n',
  );
  write(
    app,
    "Cargo.toml",
    read(app, "Cargo.toml") + "bridge=" + dependency(bridge) + "\n",
  );
  ok(run("1.99.1", app, "run", "--quiet"));
  assert.deepEqual(features(artifacts("1.99.1", app), "feature_demo"), [
    "checksum",
    "hex",
  ]);
});

test("lockfile include la dipendenza opzionale non compilata", () => {
  const dir = fixture();
  const built = artifacts("1.99.1", dir, "--no-default-features");
  assert.equal(libraryArtifacts(built, "checksum_core").length, 0);
  assert.match(read(dir, "Cargo.lock"), /name = "checksum-core"/);
  const lock = read(dir, "Cargo.lock");
  ok(run("1.99.1", dir, "check", "--all-features", "--locked"));
  assert.equal(read(dir, "Cargo.lock"), lock);
});

test("selezione esplicita del package e doctest separati da all-targets", () => {
  const dir = baselines.get("1.99.1");
  assert.equal(
    passed(
      run("1.99.1", dir, "test", "-p", "checksum-core", "--features", "hex"),
    ),
    2,
  );
  assert.equal(
    passed(run("1.99.1", dir, "test", "--all-targets", "--all-features")),
    4,
  );
  assert.equal(
    passed(command("cargo test --doc --all-features", "1.99.1", dir)),
    4,
  );
});

test("controllo di tutti i 256 valori e input vuoto", () => {
  const dir = fixture();
  write(
    dir,
    "tests/edges.rs",
    [
      "#[test]",
      "fn edges() {",
      '    assert_eq!(feature_demo::checksum_hex(b""), *b"00");',
      "    for byte in 0..=255u8 {",
      '        let expected = format!("{byte:02x}");',
      "        assert_eq!(feature_demo::checksum_hex(&[byte]).as_slice(), expected.as_bytes());",
      "    }",
      "}",
      "",
    ].join("\n"),
  );
  assert.equal(
    passed(run("1.99.1", dir, "test", "--test", "edges", "--all-features")),
    1,
  );
});

test("rimuovere std dai default rompe un consumer dell'API predefinita", () => {
  const provider = fixture();
  const app = consumer(provider, [], true);
  write(
    app,
    "src/main.rs",
    'fn main() { assert_eq!(feature_demo::owned_text("Rust"), "Rust"); }\n',
  );
  ok(run("1.99.1", app, "run", "--quiet"));
  manifestChange(provider, 'default = ["std"]', "default = []");
  fails(run("1.99.1", app, "check"), /cannot find function .owned_text/);
});

test("nome feature inesistente rifiutato", () => {
  fails(
    run("1.99.1", fixture(), "check", "--features", "cheksum"),
    /does not contain|does not have/i,
  );
});

test("combinazioni esclusive artificiali: all-features puo fallire", () => {
  const source =
    blocks.get("src/lib.rs") +
    '\n#[cfg(all(feature = "checksum", feature = "hex"))]\ncompile_error!("Combinazione esclusa dalla sonda");\n';
  const dir = fixture({ "src/lib.rs": source });
  ok(run("1.99.1", dir, "check", "--features", "checksum"));
  fails(
    run("1.99.1", dir, "check", "--all-features"),
    /Combinazione esclusa dalla sonda/,
  );
});

test("cargo check non esegue test con asserzione errata", () => {
  const dir = fixture({
    "tests/api.rs": replace(
      blocks.get("tests/api.rs"),
      'feature_demo::byte_len(""), 0',
      'feature_demo::byte_len(""), 1',
    ),
  });
  ok(command("cargo check --all-targets --all-features", "1.99.1", dir));
  fails(
    command("cargo test --all-features", "1.99.1", dir),
    /assertion .* failed/,
  );
});

test("resolver 2 e 3 non unificano dev-dependencies durante una normale build", () => {
  for (const resolver of ["2", "3"]) {
    const dir = fixture();
    manifestChange(dir, 'resolver = "3"', 'resolver = "' + resolver + '"');
    write(
      dir,
      "Cargo.toml",
      read(dir, "Cargo.toml") +
        '\n[dev-dependencies]\nchecksum-core = { path = "checksum-core", default-features = false, features = ["hex"] }\n',
    );
    assert.deepEqual(
      features(
        artifacts(
          "1.99.1",
          dir,
          "--no-default-features",
          "--features",
          "checksum",
        ),
        "checksum_core",
      ),
      [],
    );
    const output = ok(
      run(
        "1.99.1",
        dir,
        "test",
        "--no-run",
        "--message-format=json",
        "--no-default-features",
        "--features",
        "checksum",
      ),
    ).stdout;
    const messages = output
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    assert.ok(
      libraryArtifacts(messages, "checksum_core").some((message) =>
        message.features.includes("hex"),
      ),
    );
    manifestChange(dir, 'resolver = "' + resolver + '"', 'resolver = "1"');
    assert.ok(
      features(
        artifacts(
          "1.99.1",
          dir,
          "--no-default-features",
          "--features",
          "checksum",
        ),
        "checksum_core",
      ).includes("hex"),
    );
  }
});

test("resolver 3 separa feature di build-dependencies e dipendenze normali", () => {
  const dir = fixture();
  write(
    dir,
    "Cargo.toml",
    read(dir, "Cargo.toml") +
      '\n[build-dependencies]\nchecksum-core = { path = "checksum-core", default-features = false, features = ["hex"] }\n',
  );
  write(
    dir,
    "build.rs",
    'fn main() { assert_eq!(checksum_core::hex(b"ABC"), *b"c6"); }\n',
  );
  const separate = libraryArtifacts(
    artifacts("1.99.1", dir, "--no-default-features", "--features", "checksum"),
    "checksum_core",
  );
  assert.deepEqual(
    separate.map((message) => message.features.join(",")).sort(),
    ["", "hex"],
  );
  manifestChange(dir, 'resolver = "3"', 'resolver = "1"');
  assert.deepEqual(
    features(
      artifacts(
        "1.99.1",
        dir,
        "--no-default-features",
        "--features",
        "checksum",
      ),
      "checksum_core",
    ),
    ["hex"],
  );
});

test("resolver 3 non attiva feature di un altro sistema operativo", () => {
  const dir = fixture();
  const other = process.platform === "win32" ? "unix" : "windows";
  write(
    dir,
    "Cargo.toml",
    read(dir, "Cargo.toml") +
      "\n[target.'cfg(" +
      other +
      ")'.dependencies]\n" +
      'checksum-core = { path = "checksum-core", optional = true, default-features = false, features = ["hex"] }\n',
  );
  assert.deepEqual(
    features(
      artifacts(
        "1.99.1",
        dir,
        "--no-default-features",
        "--features",
        "checksum",
      ),
      "checksum_core",
    ),
    [],
  );
  manifestChange(dir, 'resolver = "3"', 'resolver = "1"');
  assert.deepEqual(
    features(
      artifacts(
        "1.99.1",
        dir,
        "--no-default-features",
        "--features",
        "checksum",
      ),
      "checksum_core",
    ),
    ["hex"],
  );
});

test("workspace completo puo abilitare std nella libreria controllata isolatamente", () => {
  const dir = fixture();
  manifestChange(
    dir,
    'members = ["checksum-core"]',
    'members = ["checksum-core", "consumer"]',
  );
  write(
    dir,
    "consumer/Cargo.toml",
    standaloneManifest(
      "workspace-consumer",
      'feature-demo={path="..",default-features=false,features=["std"]}\n',
    ),
  );
  write(
    dir,
    "consumer/src/lib.rs",
    'pub fn text() -> String { feature_demo::owned_text("Rust") }\n',
  );
  assert.deepEqual(
    features(
      artifacts("1.99.1", dir, "-p", "feature-demo", "--no-default-features"),
      "feature_demo",
    ),
    [],
  );
  assert.deepEqual(
    features(
      artifacts("1.99.1", dir, "--workspace", "--no-default-features"),
      "feature_demo",
    ),
    ["std"],
  );
});

test("dipendenza rinominata: dep e forwarding usano l'alias locale", () => {
  const dir = fixture();
  const original = read(dir, "Cargo.toml");
  const renamed = original
    .replace("dep:checksum-core", "dep:codec")
    .replace("checksum-core?/hex", "codec?/hex")
    .replace(
      "checksum-core = { path",
      'codec = { package = "checksum-core", path',
    );
  write(dir, "Cargo.toml", renamed);
  write(
    dir,
    "src/lib.rs",
    blocks.get("src/lib.rs").replaceAll("checksum_core::", "codec::"),
  );
  assert.equal(passed(run("1.99.1", dir, "test", "--all-features")), 8);
  manifestChange(dir, "dep:codec", "dep:checksum-core");
  fails(
    run("1.99.1", dir, "check", "--all-features"),
    /not listed|not a dependency|does not have|neither a dependency/,
  );
});

test("manifest e sorgenti originali invariati dalle fixture", () => {
  assert.equal(
    createHash("sha256").update(fs.readFileSync(notePath)).digest("hex"),
    digest,
  );
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "registry", "src")));
});
