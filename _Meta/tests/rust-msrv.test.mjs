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
    exe && path.isAbsolute(exe),
    "Fornire i due percorsi assoluti di rustc",
  );
  assert.ok(fs.existsSync(exe), exe);
}
const rustup = process.env.RUSTUP_TEST_EXECUTABLE;
const rustupHome = process.env.RUSTUP_TEST_HOME;
assert.ok(rustup && path.isAbsolute(rustup) && fs.existsSync(rustup));
assert.ok(
  rustupHome && path.isAbsolute(rustupHome) && fs.existsSync(rustupHome),
);
const notePath =
  "Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version.md";
const note = parseNote(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^(cargo|rustc|rustup) [a-z0-9 +.-]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml", "md"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const manifest = blocks.get("Cargo.toml");
const library = blocks.get("src/lib.rs");
const fileNames = ["Cargo.toml", "src/lib.rs", "tests/even.rs"];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-msrv-";
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
const baseEnv = { ...process.env };
for (const key of Object.keys(baseEnv))
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|RUSTUP_)/i.test(
      key,
    )
  )
    delete baseEnv[key];
Object.assign(baseEnv, {
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
  RUSTUP_HOME: rustupHome,
  RUSTUP_AUTO_INSTALL: "0",
  RUST_BACKTRACE: "0",
});
const pathKey =
  Object.keys(baseEnv).find((key) => key.toUpperCase() === "PATH") || "PATH";
function environment(version, proxy = false) {
  const env = { ...baseEnv };
  const bin = proxy ? path.dirname(rustup) : path.dirname(compilers[version]);
  env[pathKey] = bin + path.delimiter + (baseEnv[pathKey] || "");
  if (!proxy) {
    env.RUSTC = compilers[version];
    env.RUSTDOC = path.join(bin, "rustdoc" + suffix);
  }
  return env;
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
function fixture(overrides = {}) {
  const dir = directory();
  for (const name of fileNames)
    write(dir, name, overrides[name] ?? blocks.get(name));
  return dir;
}
function launch(exe, args, cwd, env) {
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
function run(version, dir, ...args) {
  assert.ok(
    ["--version", "metadata", "check", "test", "fmt"].includes(args[0]),
  );
  const bin = path.dirname(compilers[version]);
  return launch(
    path.join(bin, "cargo" + suffix),
    args,
    dir,
    environment(version),
  );
}
function command(source, dir) {
  assert.ok(commands.has(source), source);
  const [name, ...args] = source.split(" ");
  // Non installare/aggiornare toolchain e non usare un canale mobile durante i test.
  if (name === "rustup") assert.deepEqual(args, ["show", "active-toolchain"]);
  else {
    assert.ok(["cargo", "rustc"].includes(name));
    assert.ok(["+1.85.0", "+1.99.1"].includes(args[0]));
    assert.ok(["--version", "test", "check"].includes(args[1]));
  }
  return launch(
    path.join(path.dirname(rustup), name + suffix),
    args,
    dir,
    environment(null, true),
  );
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
function metadata(version, dir, noDeps = true) {
  return JSON.parse(
    ok(
      run(
        version,
        dir,
        "metadata",
        "--format-version",
        "1",
        ...(noDeps ? ["--no-deps"] : []),
      ),
    ).stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function minimum(value) {
  return replace(
    manifest,
    'rust-version = "1.85"',
    'rust-version = "' + value + '"',
  );
}
function lock(dir) {
  return fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8");
}
const newerLibrary = replace(
  library,
  "value % 2 == 0",
  "value.is_multiple_of(2)",
);

// Registro sostituito da sorgenti locali con checksum: nessuna richiesta di rete.
function registryFixture({
  requirement = "1",
  mode,
  versions = [
    ["1.0.0", "1.85"],
    ["1.1.0", "1.87"],
  ],
  newerCode = false,
} = {}) {
  const dir = fixture({
    "Cargo.toml": replace(
      manifest,
      "[dependencies]",
      '[dependencies]\nfixture-dep = "' + requirement + '"',
    ),
  });
  write(
    dir,
    ".cargo/config.toml",
    '[source.crates-io]\nreplace-with="local"\n[source.local]\ndirectory="vendor"\n' +
      (mode ? '[resolver]\nincompatible-rust-versions="' + mode + '"\n' : ""),
  );
  for (const [version, min] of versions) {
    const folder = "vendor/fixture-dep-" + version + "/";
    const files = {
      "Cargo.toml":
        '[package]\nname="fixture-dep"\nversion="' +
        version +
        '"\nedition="2024"\nrust-version="' +
        min +
        '"\n',
      "src/lib.rs": newerCode
        ? "pub fn even(x: u32) -> bool { x.is_multiple_of(2) }\n"
        : "pub fn value() -> u32 { 42 }\n",
    };
    for (const [name, value] of Object.entries(files))
      write(dir, folder + name, value);
    write(
      dir,
      folder + ".cargo-checksum.json",
      JSON.stringify({
        package: null,
        files: Object.fromEntries(
          Object.entries(files).map(([name, value]) => [
            name,
            createHash("sha256").update(value).digest("hex"),
          ]),
        ),
      }),
    );
  }
  return dir;
}
function selected(version, dir) {
  return metadata(version, dir, false).packages.find(
    (pkg) => pkg.name === "fixture-dep",
  ).version;
}

test("toolchain reali, proxy rustup e inventario dei blocchi", () => {
  for (const [version, exe] of Object.entries(compilers)) {
    assert.match(
      ok(launch(exe, ["--version"], root, environment(version))).stdout,
      new RegExp("rustc " + version.replaceAll(".", "\\.")),
    );
    assert.match(
      ok(run(version, root, "--version")).stdout,
      new RegExp("cargo " + version.replaceAll(".", "\\.")),
    );
  }
  const installed = ok(
    launch(rustup, ["toolchain", "list"], root, environment(null, true)),
  ).stdout;
  for (const version of Object.keys(compilers))
    assert.ok(installed.includes(version + "-"));
  assert.match(
    ok(command("rustc +1.85.0 --version", root)).stdout,
    /rustc 1\.85\.0\b/,
  );
  assert.match(
    ok(command("cargo +1.85.0 --version", root)).stdout,
    /cargo 1\.85\.0\b/,
  );
  assert.equal(commands.size, 12);
  assert.equal(blocks.size, 6);
});

test("YAML invariato, titolo e struttura tecnica, comandi indipendenti", () => {
  const old = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd(), baseEnv),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(headings.filter((node) => node.depth === 1).map(text), [
    "MSRV: Minimum Supported Rust Version",
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

test("metadata su entrambe le versioni: MSRV edition feature e publish", () => {
  for (const version of Object.keys(compilers)) {
    const pkg = metadata(version, fixture()).packages[0];
    assert.equal(pkg.rust_version, "1.85");
    assert.equal(pkg.edition, "2024");
    assert.deepEqual(pkg.publish, []);
    assert.deepEqual(pkg.features, { default: ["labels"], labels: [] });
    assert.deepEqual(pkg.dependencies, []);
  }
});

test("comandi copiati: Rust minimo, tre configurazioni e doctest", () => {
  const dir = fixture();
  assert.equal(passed(command("cargo +1.85.0 test --all-features", dir)), 3);
  const before = lock(dir);
  assert.equal(passed(run("1.85.0", dir, "test", "--locked")), 3);
  ok(command("cargo +1.85.0 check --all-targets --all-features --locked", dir));
  assert.equal(
    passed(command("cargo +1.85.0 test --no-default-features --locked", dir)),
    2,
  );
  assert.equal(
    passed(command("cargo +1.85.0 test --doc --all-features --locked", dir)),
    1,
  );
  assert.equal(lock(dir), before);
});

test("comandi copiati: confronto corrente con lo stesso lockfile", () => {
  const dir = fixture();
  ok(run("1.85.0", dir, "check"));
  const before = lock(dir);
  assert.equal(
    passed(command("cargo +1.99.1 test --all-features --locked", dir)),
    3,
  );
  ok(command("cargo +1.99.1 check --all-targets --all-features --locked", dir));
  assert.equal(
    passed(run("1.99.1", dir, "test", "--no-default-features", "--locked")),
    2,
  );
  assert.equal(lock(dir), before);
});

test("rustfmt corrente verifica i due file Rust senza modificarli", () => {
  ok(run("1.99.1", fixture(), "fmt", "--", "--check"));
});

test("rust-toolchain seleziona sviluppo, +versione ha precedenza", () => {
  const dir = fixture();
  write(
    dir,
    "rust-toolchain.toml",
    blocks.get("rust-toolchain.toml opzionale"),
  );
  assert.match(
    ok(command("rustup show active-toolchain", dir)).stdout,
    /1\.99\.1-/,
  );
  assert.match(
    ok(
      launch(
        path.join(path.dirname(rustup), "cargo" + suffix),
        ["--version"],
        dir,
        environment(null, true),
      ),
    ).stdout,
    /cargo 1\.99\.1\b/,
  );
  assert.match(
    ok(command("cargo +1.85.0 --version", dir)).stdout,
    /cargo 1\.85\.0\b/,
  );
  assert.equal(passed(command("cargo +1.85.0 test --all-features", dir)), 3);
});

test("MSRV futura: Cargo rifiuta la dichiarazione senza installare nulla", () => {
  const dir = fixture({ "Cargo.toml": minimum("1.999") });
  assert.equal(metadata("1.99.1", dir).packages[0].rust_version, "1.999");
  fails(run("1.99.1", dir, "check"), /requires rustc 1\.999/);
});

test("minimo dichiarato 1.87: vecchio Cargo rifiuta anche codice compatibile", () => {
  const dir = fixture({ "Cargo.toml": minimum("1.87") });
  fails(run("1.85.0", dir, "check"), /requires rustc 1\.87/);
  ok(run("1.99.1", dir, "check", "--locked"));
  ok(run("1.85.0", dir, "check", "--ignore-rust-version", "--locked"));
});

test("controesempio esatto: dichiarare 1.85 non impedisce API 1.87", () => {
  const dir = fixture({ "src/lib.rs": newerLibrary });
  assert.equal(
    passed(
      command("cargo +1.99.1 test --all-features --locked", generateLock(dir)),
    ),
    3,
  );
  fails(command("cargo +1.85.0 test --all-features", dir), /E0658/);
});
function generateLock(dir) {
  metadata("1.99.1", dir, false);
  return dir;
}

test("ignore-rust-version non rende stabile l'API nel vecchio compilatore", () => {
  const dir = fixture({
    "Cargo.toml": minimum("1.87"),
    "src/lib.rs": newerLibrary,
  });
  fails(run("1.85.0", dir, "check"), /requires rustc 1\.87/);
  fails(run("1.85.0", dir, "check", "--ignore-rust-version"), /E0658/);
  assert.equal(passed(run("1.99.1", dir, "test")), 3);
});

test("rimuovere rust-version non elimina l'incompatibilita del codice", () => {
  const dir = fixture({
    "Cargo.toml": replace(manifest, 'rust-version = "1.85"\n', ""),
    "src/lib.rs": newerLibrary,
  });
  assert.equal(metadata("1.85.0", dir).packages[0].rust_version, null);
  fails(run("1.85.0", dir, "check"), /E0658/);
});

test("API nuova nascosta da feature: senza default passa, all-features fallisce", () => {
  const dir = fixture({
    "src/lib.rs": replace(
      library,
      "if is_even(value)",
      "if value.is_multiple_of(2)",
    ),
  });
  assert.equal(passed(run("1.85.0", dir, "test", "--no-default-features")), 2);
  fails(run("1.85.0", dir, "check", "--all-features"), /E0658/);
  assert.equal(passed(run("1.99.1", dir, "test", "--all-features")), 3);
});

test("test di integrazione incompatibile: check lib non lo vede, all-targets si", () => {
  const dir = fixture({
    "tests/even.rs":
      "#[test] fn newer() { assert!(42_u32.is_multiple_of(2)); }\n",
  });
  ok(run("1.85.0", dir, "check"));
  fails(run("1.85.0", dir, "check", "--all-targets"), /E0658/);
});

test("doctest incompatibile: check all-targets passa, test doc fallisce", () => {
  const dir = fixture({
    "src/lib.rs": replace(
      library,
      "/// assert!(msrv_demo::is_even(42));",
      "/// assert!(42_u32.is_multiple_of(2));",
    ),
  });
  ok(run("1.85.0", dir, "check", "--all-targets", "--all-features"));
  fails(run("1.85.0", dir, "test", "--doc"), /E0658/);
  assert.equal(passed(run("1.99.1", dir, "test", "--doc")), 1);
});

test("check non esegue asserzioni errate", () => {
  const dir = fixture({
    "tests/even.rs": "#[test] fn wrong() { assert_eq!(1, 2); }\n",
  });
  ok(run("1.85.0", dir, "check", "--all-targets"));
  fails(run("1.85.0", dir, "test"), /wrong.*FAILED/);
});

test("rust-version rifiuta operatori canali e prerelease", () => {
  for (const value of [">=1.85", "stable", "1.85.0-beta.1"])
    fails(
      run(
        "1.99.1",
        fixture({ "Cargo.toml": minimum(value) }),
        "metadata",
        "--no-deps",
        "--format-version",
        "1",
      ),
      /rust-version|version/,
    );
});

test("edition 2024 impone il suo minimo anche con compilatore recente", () => {
  for (const value of ["1.74", "1.84"])
    fails(
      run("1.99.1", fixture({ "Cargo.toml": minimum(value) }), "check"),
      /incompatible.*1\.85\.0.*edition \(2024\)/s,
    );
  const dir = fixture({
    "Cargo.toml": replace(
      minimum("1.74"),
      'edition = "2024"',
      'edition = "2021"',
    ),
  });
  assert.equal(metadata("1.99.1", dir).packages[0].rust_version, "1.74");
  ok(run("1.99.1", dir, "check"));
  // Nessuna prova su 1.74: il test precedente certifica solo la validita del manifest.
});

test("resolver 3 preferisce la MSRV dichiarata anche con compilatore recente", () => {
  for (const version of Object.keys(compilers)) {
    const dir = registryFixture();
    assert.equal(selected(version, dir), "1.0.0");
    ok(run(version, dir, "check", "--locked"));
  }
});

test("fallback esplicito nella configurazione mantiene la preferenza MSRV", () => {
  const dir = registryFixture();
  write(
    dir,
    ".cargo/config.toml",
    fs.readFileSync(path.join(dir, ".cargo/config.toml"), "utf8") +
      blocks.get(".cargo/config.toml opzionale"),
  );
  assert.equal(selected("1.99.1", dir), "1.0.0");
  ok(run("1.85.0", dir, "check", "--locked"));
});

test("allow seleziona dipendenza recente, build vecchia rifiutata", () => {
  const dir = registryFixture({ mode: "allow" });
  assert.equal(selected("1.99.1", dir), "1.1.0");
  ok(run("1.99.1", dir, "check", "--locked"));
  fails(run("1.85.0", dir, "check", "--locked"), /requires rustc 1\.87/);
});

test("fallback non vieta una dipendenza incompatibile se e l'unica ammessa", () => {
  const dir = registryFixture({ requirement: "1.1", mode: "fallback" });
  assert.equal(selected("1.85.0", dir), "1.1.0");
  fails(run("1.85.0", dir, "check", "--locked"), /requires rustc 1\.87/);
});

test("lockfile gia risolto prevale sulla nuova preferenza fallback", () => {
  const dir = registryFixture({ mode: "allow" });
  assert.equal(selected("1.99.1", dir), "1.1.0");
  const before = lock(dir);
  const config = fs.readFileSync(path.join(dir, ".cargo/config.toml"), "utf8");
  write(dir, ".cargo/config.toml", replace(config, '"allow"', '"fallback"'));
  assert.equal(selected("1.85.0", dir), "1.1.0");
  fails(run("1.85.0", dir, "check", "--locked"), /requires rustc 1\.87/);
  assert.equal(lock(dir), before);
});

test("dipendenza dichiara MSRV troppo bassa: resolver accetta, rustc rifiuta", () => {
  const dir = registryFixture({
    versions: [["1.0.0", "1.85"]],
    newerCode: true,
  });
  assert.equal(selected("1.85.0", dir), "1.0.0");
  fails(run("1.85.0", dir, "check"), /E0658/);
  ok(run("1.99.1", dir, "check", "--locked"));
});

test("workspace.package richiede ereditarieta esplicita", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    '[workspace]\nmembers=["a","b"]\nresolver="3"\n[workspace.package]\nrust-version="1.85"\n',
  );
  for (const name of ["a", "b"]) {
    write(
      dir,
      name + "/Cargo.toml",
      '[package]\nname="' +
        name +
        '"\nversion="0.1.0"\nedition="2024"\n' +
        (name === "a" ? "rust-version.workspace=true\n" : ""),
    );
    write(dir, name + "/src/lib.rs", "pub fn value() -> u32 { 42 }\n");
  }
  const packages = metadata("1.85.0", dir).packages;
  assert.equal(packages.find((pkg) => pkg.name === "a").rust_version, "1.85");
  assert.equal(packages.find((pkg) => pkg.name === "b").rust_version, null);
  ok(run("1.85.0", dir, "check", "--workspace"));
});

test("formato lockfile: quello prodotto qui da Cargo recente e leggibile dal minimo", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "check"));
  const before = lock(dir);
  assert.match(before, /^version = 4$/m);
  ok(run("1.85.0", dir, "check", "--locked"));
  assert.equal(lock(dir), before);
  write(dir, "Cargo.lock", replace(before, "version = 4", "version = 999"));
  fails(run("1.85.0", dir, "check", "--locked"), /lock file version.*999/s);
});

test("README limita la copertura; installazioni e stable restano documentali", () => {
  const readme = blocks.get("Esempio di dichiarazione nel README");
  assert.match(readme, /Rust 1\.85\.0, edition 2024/);
  assert.match(readme, /x86_64-pc-windows-gnu/);
  assert.match(readme, /senza default e con tutte le feature/);
  for (const version of Object.keys(compilers))
    assert.match(
      ok(launch(compilers[version], ["-vV"], root, environment(version)))
        .stdout,
      /host: x86_64-pc-windows-gnu/,
    );
  assert.throws(() =>
    command("rustup toolchain install 1.85.0 --profile minimal", root),
  );
  assert.throws(() =>
    command("cargo +stable test --all-features --locked", root),
  );
  assert.equal(baseEnv.CARGO_NET_OFFLINE, "true");
  assert.equal(baseEnv.RUSTUP_AUTO_INSTALL, "0");
  assert.ok(!fs.existsSync(path.join(baseEnv.CARGO_HOME, "credentials.toml")));
  assert.ok(!fs.existsSync(path.join(baseEnv.CARGO_HOME, "registry", "cache")));
});
