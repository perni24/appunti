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
const notePath = "Programmazione/Rust/Pagine/Edition migration.md";
const note = parseNote(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node).split(":")[0];
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^(cargo|rustc|git) [^\n]+$/);
    assert.ok(!commands.has(node.value));
    commands.add(node.value);
  } else {
    assert.ok(["rust", "toml", "gitignore"].includes(node.lang));
    assert.ok(!blocks.has(heading));
    blocks.set(heading, node.value + "\n");
  }
}
const fileNames = [
  "Cargo.toml",
  "src/lib.rs",
  "src/extra.rs",
  "tests/api.rs",
  ".gitignore",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-edition-migration-";
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
      "fix",
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
  if (source === 'git commit -m "Baseline prima della migrazione"')
    return git(dir, "commit", "-m", "Baseline prima della migrazione");
  const [name, ...args] = source.split(" ");
  if (name === "git") return git(dir, ...args);
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
function git(dir, ...args) {
  assert.ok(dir.startsWith(root + path.sep));
  assert.ok(
    ["init", "add", "commit", "status", "diff", "switch", "branch"].includes(
      args[0],
    ),
  );
  return launch(
    "git",
    [
      "-c",
      "core.hooksPath=" + path.join(root, "empty-hooks"),
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.autocrlf=false",
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      ...args,
    ],
    dir,
  );
}
function snapshot(dir, initialize = false) {
  if (initialize) ok(git(dir, "init", "--quiet"));
  ok(git(dir, "add", "."));
  ok(git(dir, "commit", "--quiet", "-m", "Fixture snapshot"));
}
function cleanFixture(version = "1.99.1", overrides = {}) {
  const dir = fixture(overrides);
  ok(run(version, dir, "check", "--all-targets", "--all-features"));
  snapshot(dir, true);
  assert.equal(ok(git(dir, "status", "--short")).stdout, "");
  return dir;
}
function edition2024(dir) {
  write(
    dir,
    "Cargo.toml",
    replace(read(dir, "Cargo.toml"), 'edition = "2021"', 'edition = "2024"'),
  );
}
function docs2024(dir) {
  for (const name of ["src/lib.rs", "src/extra.rs"]) {
    const old =
      name === "src/lib.rs"
        ? "migration_demo::gen(41)"
        : "migration_demo::extra::gen(21)";
    const value = old.replace("::gen(", "::r#gen(");
    write(dir, name, replace(read(dir, name), old, value));
  }
}
const fixedCommand =
  "cargo fix --edition --all-targets --all-features --locked";
const completed = new Map();

test("YAML invariato, template, cinque file e venti comandi singoli", () => {
  const old = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(commands.size, 20);
  assert.deepEqual([...blocks.keys()], fileNames);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Edition migration",
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
  ])
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  assert.match(text(note.tree), /fuori dal vault/);
  assert.match(text(note.tree), /Una branch non e un backup/);
});

test("toolchain abbinate e comando rustc --version", () => {
  matrix((version) => {
    assert.match(
      ok(command("rustc --version", version, root)).stdout,
      new RegExp("rustc " + version.replaceAll(".", "\\.")),
    );
    assert.match(
      ok(command("cargo --version", version, root)).stdout,
      new RegExp("cargo " + version.replaceAll(".", "\\.")),
    );
  });
});

for (const version of Object.keys(compilers)) {
  test("procedura integrale estratta dalla nota su Rust " + version, () => {
    const dir = fixture();
    ok(command("git init", version, dir));
    ok(command("cargo check --all-targets --all-features", version, dir));
    assert.equal(passed(command("cargo test --all-features", version, dir)), 4);
    assert.equal(metadata(version, dir).packages[0].edition, "2021");
    ok(
      command(
        "git add Cargo.toml Cargo.lock .gitignore src tests",
        version,
        dir,
      ),
    );
    ok(
      command('git commit -m "Baseline prima della migrazione"', version, dir),
    );
    ok(command("git switch -c codex/rust-2024-edition", version, dir));
    assert.equal(
      ok(git(dir, "branch", "--show-current")).stdout.trim(),
      "codex/rust-2024-edition",
    );
    assert.equal(ok(command("git status --short", version, dir)).stdout, "");
    const manifest = read(dir, "Cargo.toml");
    const lock = read(dir, "Cargo.lock");
    ok(command(fixedCommand, version, dir));
    for (const name of ["src/lib.rs", "src/extra.rs"]) {
      assert.match(read(dir, name), /pub fn r#gen/);
      assert.match(
        read(dir, name),
        /\/\/\/ assert_eq!\(migration_demo::(?:extra::)?gen\(/,
      );
    }
    assert.match(read(dir, "tests/api.rs"), /use migration_demo::r#gen;/);
    assert.match(read(dir, "tests/api.rs"), /extra::r#gen\(u32::MAX\)/);
    assert.equal(read(dir, "Cargo.toml"), manifest);
    assert.equal(read(dir, "Cargo.lock"), lock);
    assert.match(
      ok(command("git diff -- src tests", version, dir)).stdout,
      /\+pub fn r#gen/,
    );
    assert.equal(
      ok(command("git diff -- Cargo.toml Cargo.lock", version, dir)).stdout,
      "",
    );

    edition2024(dir);
    ok(
      command(
        "cargo check --all-targets --all-features --locked",
        version,
        dir,
      ),
    );
    fails(
      command("cargo test --doc --all-features --locked", version, dir),
      /reserved keyword .*gen/,
    );
    docs2024(dir);
    assert.equal(
      passed(command("cargo test --doc --all-features --locked", version, dir)),
      2,
    );
    assert.equal(
      passed(command("cargo test --all-features --locked", version, dir)),
      4,
    );
    assert.equal(
      passed(
        command("cargo test --no-default-features --locked", version, dir),
      ),
      2,
    );
    const pkg = metadata(version, dir).packages[0];
    assert.equal(pkg.edition, "2024");
    assert.equal(pkg.rust_version, "1.85");
    assert.equal(pkg.version, "0.1.0");
    assert.equal(read(dir, "Cargo.lock"), lock);
    ok(command("git diff --check", version, dir));
    completed.set(version, dir);
  });
}

test("rustfmt riscrive il layout ma non il manifest; check idempotente", () => {
  const dir = completed.get("1.99.1");
  const manifest = read(dir, "Cargo.toml");
  write(
    dir,
    "src/lib.rs",
    read(dir, "src/lib.rs").replace(
      "value.checked_add(1)",
      "value . checked_add ( 1 )",
    ),
  );
  fails(command("cargo fmt --all -- --check", "1.99.1", dir), /Diff in/);
  ok(command("cargo fmt --all", "1.99.1", dir));
  const formatted = read(dir, "src/lib.rs");
  ok(command("cargo fmt --all -- --check", "1.99.1", dir));
  assert.equal(read(dir, "src/lib.rs"), formatted);
  assert.equal(read(dir, "Cargo.toml"), manifest);
  assert.equal(
    passed(command("cargo test --all-features --locked", "1.99.1", dir)),
    4,
  );
});

test("Clippy corrente con warning come errori e nessuna riscrittura", () => {
  const dir = completed.get("1.99.1");
  const before = read(dir, "src/lib.rs");
  ok(
    command(
      "cargo clippy --all-targets --all-features --locked -- -D warnings",
      "1.99.1",
      dir,
    ),
  );
  assert.equal(read(dir, "src/lib.rs"), before);
});

test("all-targets esegue gli integration test, non i doctest", () => {
  matrix((version) => {
    const dir = completed.get(version);
    assert.equal(
      passed(
        run(
          version,
          dir,
          "test",
          "--all-targets",
          "--all-features",
          "--locked",
        ),
      ),
      2,
    );
    assert.equal(
      passed(run(version, dir, "test", "--doc", "--all-features", "--locked")),
      2,
    );
  });
});

test("test di confine: checked_add e checked_mul non vanno in overflow", () => {
  matrix((version) => {
    const dir = completed.get(version);
    write(
      dir,
      "tests/boundaries.rs",
      [
        "#[test]",
        "fn boundaries() {",
        "    assert_eq!(migration_demo::r#gen(0), Some(1));",
        "    assert_eq!(migration_demo::r#gen(u32::MAX - 1), Some(u32::MAX));",
        "    assert_eq!(migration_demo::extra::r#gen(0), Some(0));",
        "    assert_eq!(migration_demo::extra::r#gen(u32::MAX / 2), Some(u32::MAX - 1));",
        "    assert_eq!(migration_demo::extra::r#gen(u32::MAX / 2 + 1), None);",
        "}",
        "",
      ].join("\n"),
    );
    assert.equal(
      passed(
        run(
          version,
          dir,
          "test",
          "--test",
          "boundaries",
          "--all-features",
          "--locked",
        ),
      ),
      1,
    );
  });
});

test("raw identifier conserva la chiamata da un consumer edition 2021", () => {
  matrix((version) => {
    const dir = directory();
    const dependency = completed.get(version).replaceAll("\\", "/");
    write(
      dir,
      "Cargo.toml",
      '[package]\nname="consumer"\nversion="0.1.0"\nedition="2021"\n[dependencies]\nmigration-demo={path="' +
        dependency +
        '", features=["extra"]}\n',
    );
    write(
      dir,
      "src/main.rs",
      "fn main() { assert_eq!(migration_demo::gen(41), Some(42)); assert_eq!(migration_demo::extra::gen(21), Some(42)); }\n",
    );
    ok(run(version, dir, "run", "--quiet"));
  });
});

test("cambiare solo edition prima del fix produce errori", () => {
  matrix((version) => {
    const dir = fixture();
    edition2024(dir);
    fails(
      run(version, dir, "check", "--all-targets", "--all-features"),
      /reserved keyword .*gen/,
    );
  });
});

test("fix senza all-features lascia intatto il file opzionale", () => {
  matrix((version) => {
    const dir = cleanFixture(version);
    ok(run(version, dir, "fix", "--edition", "--locked"));
    assert.match(read(dir, "src/lib.rs"), /pub fn r#gen/);
    assert.equal(read(dir, "src/extra.rs"), blocks.get("src/extra.rs"));
    edition2024(dir);
    ok(run(version, dir, "check", "--locked"));
    fails(
      run(version, dir, "check", "--all-features", "--locked"),
      /reserved keyword .*gen/,
    );
  });
});

test("fix limitato alla libreria non aggiorna i test di integrazione", () => {
  const dir = cleanFixture();
  ok(
    run(
      "1.99.1",
      dir,
      "fix",
      "--edition",
      "--lib",
      "--all-features",
      "--locked",
    ),
  );
  assert.equal(read(dir, "tests/api.rs"), blocks.get("tests/api.rs"));
  edition2024(dir);
  ok(run("1.99.1", dir, "check", "--lib", "--all-features", "--locked"));
  fails(
    run("1.99.1", dir, "check", "--all-targets", "--all-features", "--locked"),
    /reserved keyword .*gen/,
  );
});

test("cargo check non esegue un'asserzione errata negli integration test", () => {
  const dir = fixture({
    "tests/api.rs": replace(
      blocks.get("tests/api.rs"),
      "assert_eq!(gen(41), Some(42));",
      "assert_eq!(gen(41), Some(0));",
    ),
  });
  ok(command("cargo check --all-targets --all-features", "1.99.1", dir));
  fails(
    command("cargo test --all-features", "1.99.1", dir),
    /assertion .* failed/,
  );
});

test("senza VCS fix rifiuta di scrivere", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "check"));
  fails(
    command(fixedCommand, "1.99.1", dir),
    /no VCS|no version control|allow-no-vcs/i,
  );
  assert.equal(read(dir, "src/lib.rs"), blocks.get("src/lib.rs"));
});

test("allow-no-vcs permette i fix ma non crea un repository", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "check"));
  ok(
    run(
      "1.99.1",
      dir,
      "fix",
      "--edition",
      "--all-targets",
      "--all-features",
      "--locked",
      "--allow-no-vcs",
    ),
  );
  assert.match(read(dir, "src/lib.rs"), /pub fn r#gen/);
  assert.ok(!fs.existsSync(path.join(dir, ".git")));
});

test("working tree modificata: fix normale rifiutato", () => {
  const dir = cleanFixture();
  const changed = read(dir, "src/lib.rs") + "\n// Lavoro precedente.\n";
  write(dir, "src/lib.rs", changed);
  fails(command(fixedCommand, "1.99.1", dir), /dirty|uncommitted|allow-dirty/i);
  assert.equal(read(dir, "src/lib.rs"), changed);
});

test("area di staging modificata: fix normale rifiutato", () => {
  const dir = cleanFixture();
  write(dir, "src/lib.rs", read(dir, "src/lib.rs") + "\n// Gia in staging.\n");
  ok(git(dir, "add", "src/lib.rs"));
  fails(
    command(fixedCommand, "1.99.1", dir),
    /staged|uncommitted|allow-staged/i,
  );
  assert.doesNotMatch(read(dir, "src/lib.rs"), /pub fn r#gen/);
});

test("allow-staged accetta lo staging senza nascondere il nuovo diff", () => {
  const dir = cleanFixture();
  write(dir, "src/lib.rs", read(dir, "src/lib.rs") + "\n// Gia in staging.\n");
  ok(git(dir, "add", "src/lib.rs"));
  ok(
    run(
      "1.99.1",
      dir,
      "fix",
      "--edition",
      "--all-targets",
      "--all-features",
      "--locked",
      "--allow-staged",
    ),
  );
  assert.match(
    ok(git(dir, "diff", "--cached", "--", "src/lib.rs")).stdout,
    /Gia in staging/,
  );
  assert.match(
    ok(git(dir, "diff", "--", "src/lib.rs")).stdout,
    /\+pub fn r#gen/,
  );
});

test("allow-dirty combina fix e lavoro precedente nel file", () => {
  const dir = cleanFixture();
  write(
    dir,
    "src/lib.rs",
    read(dir, "src/lib.rs") + "\n// Lavoro precedente.\n",
  );
  ok(
    run(
      "1.99.1",
      dir,
      "fix",
      "--edition",
      "--all-targets",
      "--all-features",
      "--locked",
      "--allow-dirty",
    ),
  );
  assert.match(read(dir, "src/lib.rs"), /pub fn r#gen/);
  assert.match(read(dir, "src/lib.rs"), /Lavoro precedente/);
});

test("all-features non rappresenta tutte le combinazioni di feature", () => {
  const dir = fixture();
  write(
    dir,
    "src/lib.rs",
    '#[cfg(not(feature = "extra"))]\ncompile_error!("Percorso senza extra non verificato");\n' +
      blocks.get("src/lib.rs"),
  );
  ok(run("1.99.1", dir, "check", "--all-features"));
  fails(
    run("1.99.1", dir, "check", "--no-default-features"),
    /Percorso senza extra non verificato/,
  );
});

test("all-targets non attiva il codice di un altro sistema operativo", () => {
  const dir = cleanFixture();
  const other = process.platform === "win32" ? "unix" : "windows";
  write(
    dir,
    "src/lib.rs",
    blocks.get("src/lib.rs") + "\n#[cfg(" + other + ")]\nmod other_platform;\n",
  );
  write(dir, "src/other_platform.rs", "pub fn gen() -> u32 { 42 }\n");
  snapshot(dir);
  ok(command(fixedCommand, "1.99.1", dir));
  assert.equal(
    read(dir, "src/other_platform.rs"),
    "pub fn gen() -> u32 { 42 }\n",
  );
  edition2024(dir);
  ok(
    run("1.99.1", dir, "check", "--all-targets", "--all-features", "--locked"),
  );
});

test("locked rifiuta un lockfile mancante invece di crearlo", () => {
  const dir = fixture();
  fails(
    run("1.99.1", dir, "check", "--locked"),
    /lock file|lockfile|--locked/i,
  );
  assert.ok(!fs.existsSync(path.join(dir, "Cargo.lock")));
});

test("stessa risoluzione senza dipendenze, nessun aggiornamento implicito della versione", () => {
  matrix((version) => {
    const dir = completed.get(version);
    const pkg = metadata(version, dir).packages[0];
    assert.equal(pkg.dependencies.length, 0);
    assert.deepEqual(pkg.publish, []);
    assert.equal(pkg.name, "migration-demo");
    assert.equal(pkg.version, "0.1.0");
  });
});

test("Clippy -D warnings puo fallire per un lint senza riscrivere il codice", () => {
  const dir = fixture();
  write(
    dir,
    "src/lib.rs",
    blocks.get("src/lib.rs") + "\npub fn redundant() -> u32 { return 42; }\n",
  );
  ok(run("1.99.1", dir, "check", "--all-features"));
  const before = read(dir, "src/lib.rs");
  fails(
    command(
      "cargo clippy --all-targets --all-features --locked -- -D warnings",
      "1.99.1",
      dir,
    ),
    /needless_return|unneeded.*return|unnecessary.*return/i,
  );
  assert.equal(read(dir, "src/lib.rs"), before);
});

test("git diff --check segnala spaziatura, non errori semantici", () => {
  const dir = cleanFixture();
  write(
    dir,
    "src/lib.rs",
    blocks.get("src/lib.rs") + "\n// spazio finale   \n",
  );
  fails(command("git diff --check", "1.99.1", dir), /trailing whitespace/i);
});

test("esempi originali immutati: solo le fixture sono state migrate", () => {
  const current = fs.readFileSync(notePath, "utf8").replaceAll("\r\n", "\n");
  assert.match(current, /edition = "2021"/);
  assert.match(current, /pub fn gen\(value: u32\)/);
  assert.equal(createHash("sha256").update(current).digest("hex"), noteDigest);
});
const noteDigest = createHash("sha256")
  .update(fs.readFileSync(notePath, "utf8").replaceAll("\r\n", "\n"))
  .digest("hex");
