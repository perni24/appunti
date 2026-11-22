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
const rustfmt = process.env.RUSTFMT_TEST_EXECUTABLE || tool("rustfmt");
const note = parseNote("Programmazione/Rust/Pagine/Cargo.md");
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const files = new Map();
const commands = new Set();
let heading;
for (const n of note.tree.children) {
  if (n.type === "heading") heading = text(n);
  if (n.type !== "code") continue;
  if (n.lang === "bash") {
    assert.match(n.value, /^[a-zA-Z0-9_./ -]+$/);
    assert.ok(!commands.has(n.value), "Comando duplicato: " + n.value);
    commands.add(n.value);
  } else {
    assert.ok(["rust", "toml"].includes(n.lang));
    assert.ok(!files.has(heading));
    files.set(heading, n.value + "\n");
  }
}
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-cargo-";
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
      "Configurazione Cargo nel parent: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|RUSTUP_TOOLCHAIN$)/i.test(
      key,
    )
  )
    delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: rustdoc,
  RUSTFMT: rustfmt,
  CARGO: cargo,
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
  RUST_BACKTRACE: "0",
});
const pathKey =
  Object.keys(env).find((k) => k.toUpperCase() === "PATH") || "PATH";
if (path.isAbsolute(cargo))
  env[pathKey] = path.dirname(cargo) + path.delimiter + (env[pathKey] || "");
const newBin = "cargo new hello-rust --bin --edition 2024 --vcs none";
const newLib = "cargo new libreria --lib --edition 2024 --vcs none";
const denied = "cargo clippy --all-targets -- -D warnings";
const fmtCheck = "cargo fmt --all -- --check";
const metadataCommand = "cargo metadata --no-deps --format-version 1";
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, name, source) {
  const target = path.resolve(dir, name);
  assert.ok(target.startsWith(root + path.sep));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
function populate(dir, overrides = {}) {
  for (const [name, source] of files)
    write(dir, name, overrides[name] ?? source);
  return dir;
}
function fixture(overrides = {}) {
  return populate(directory(), overrides);
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
function command(source, cwd) {
  assert.ok(commands.has(source), source);
  // Le note usano solo comandi a riga singola senza quoting o operatori shell.
  const [exe, ...args] = source.split(" ");
  assert.ok(
    ["cargo", "rustc"].includes(exe),
    "Non eseguibile dalla suite: " + source,
  );
  assert.ok(!["publish", "install"].includes(args[0]));
  assert.ok(
    !["cargo add serde", "cargo add tokio --features full"].includes(source),
  );
  return launch(exe === "cargo" ? cargo : rustc, args, cwd);
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function fails(result, message) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  if (message) assert.match(result.stdout + result.stderr, message);
  return result;
}
function passed(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((sum, m) => sum + Number(m[1]), 0);
}
function metadata(dir) {
  return JSON.parse(ok(command(metadataCommand, dir)).stdout);
}
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
const suffix = process.platform === "win32" ? ".exe" : "";

test("toolchain reale, componenti e inventario", () => {
  assert.match(ok(command("cargo --version")).stdout, /cargo 1\.99\.1\b/);
  assert.match(ok(command("rustc --version")).stdout, /rustc 1\.99\.1\b/);
  assert.match(ok(launch(rustfmt, ["--version"])).stdout, /rustfmt 1\.10\.0/);
  assert.match(
    ok(launch(tool("clippy-driver"), ["--version"])).stdout,
    /clippy 0\.1\.99/,
  );
  assert.equal(commands.size, 31);
  assert.deepEqual(
    [...files.keys()],
    ["Cargo.toml", "src/lib.rs", "src/main.rs", "tests/greeting.rs"],
  );
});
test("YAML preservato salvo collegamenti, template e comandi separati", () => {
  const source = ok(
    launch(
      "git",
      ["show", "HEAD:Programmazione/Rust/Pagine/Cargo.md"],
      process.cwd(),
    ),
  ).stdout;
  const previous = YAML.parse(source.split("---")[1]);
  const {
    prerequisites: oldPrerequisites,
    related: oldRelated,
    ...oldData
  } = previous;
  const { prerequisites, related, ...data } = note.data;
  assert.deepEqual(data, oldData);
  assert.deepEqual(prerequisites, [
    "[[Programmazione/Rust/Pagine/Moduli crate e package]]",
  ]);
  for (const link of [
    "[[Programmazione/Rust/Pagine/Cargo.toml]]",
    "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]",
  ])
    assert.ok(related.includes(link));
  assert.equal(data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), ["Cargo"]);
  for (const label of [
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
      headings.some((n) => n.depth === 2 && text(n) === label),
      label,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  for (const source of commands) assert.ok(!source.includes("\n"));
  assert.match(
    note.body,
    /https:\/\/doc.rust-lang.org\/cargo\/commands\/cargo-check.html/,
  );
});
test("cargo new bin: crea il package, non un repository o gitignore", () => {
  const dir = directory();
  ok(command(newBin, dir));
  const project = path.join(dir, "hello-rust");
  assert.ok(fs.existsSync(path.join(project, "Cargo.toml")));
  assert.ok(fs.existsSync(path.join(project, "src/main.rs")));
  assert.ok(!fs.existsSync(path.join(project, ".git")));
  assert.ok(!fs.existsSync(path.join(project, ".gitignore")));
  fails(command(newBin, dir), /already exists/);
});
test("cargo new lib: template e root di libreria", () => {
  const dir = directory();
  ok(command(newLib, dir));
  const project = path.join(dir, "libreria");
  assert.ok(fs.existsSync(path.join(project, "src/lib.rs")));
  assert.ok(!fs.existsSync(path.join(project, "src/main.rs")));
  const pkg = metadata(project).packages.find((p) => p.name === "libreria");
  assert.equal(pkg.edition, "2024");
  assert.deepEqual(pkg.targets[0].kind, ["lib"]);
});
test("percorso completo: new, file estratti, build, run, fmt, clippy e tre test", () => {
  const parent = directory();
  ok(command(newBin, parent));
  assert.ok(commands.has("cd hello-rust"));
  const dir = populate(path.join(parent, "hello-rust"));
  for (const c of [
    "cargo check",
    "cargo check --all-targets",
    "cargo build",
    "cargo fmt",
    fmtCheck,
    "cargo clippy --all-targets",
    denied,
  ])
    ok(command(c, dir));
  assert.equal(ok(command("cargo run", dir)).stdout, "Ciao, mondo!\n");
  assert.equal(
    ok(command("cargo run --bin hello-rust -- Ada", dir)).stdout,
    "Ciao, Ada!\n",
  );
  assert.equal(passed(command("cargo test", dir)), 3);
});
test("metadata: package, crate, binario, edition e publish false", () => {
  const dir = fixture();
  const meta = metadata(dir);
  const pkg = meta.packages.find((p) => p.name === "hello-rust");
  assert.equal(pkg.edition, "2024");
  assert.deepEqual(pkg.publish, []);
  assert.equal(meta.resolve, null);
  assert.deepEqual(
    pkg.targets.map((t) => [t.name, t.kind]),
    [
      ["hello_rust", ["lib"]],
      ["hello-rust", ["bin"]],
      ["greeting", ["test"]],
    ],
  );
  assert.equal(path.resolve(meta.target_directory), path.join(dir, "target"));
});
test("check non crea il binario finale ma build lo crea", () => {
  const dir = fixture();
  ok(command("cargo check", dir));
  const exe = path.join(dir, "target/debug/hello-rust" + suffix);
  assert.ok(!fs.existsSync(exe));
  ok(command("cargo build", dir));
  assert.ok(fs.existsSync(exe));
  assert.equal(ok(launch(exe, [], dir)).stdout, "Ciao, mondo!\n");
});
test("check ordinario non controlla codice cfg(test), all-targets si", () => {
  const dir = fixture({
    "src/lib.rs":
      files.get("src/lib.rs") +
      '\n#[cfg(test)] fn invalid() { let _: u32 = "wrong"; }\n',
  });
  ok(command("cargo check", dir));
  fails(command("cargo check --all-targets", dir), /E0308/);
});
test("asserzione falsa: check, build e no-run passano, test fallisce", () => {
  const dir = fixture({
    "tests/greeting.rs": replaceOnce(
      files.get("tests/greeting.rs"),
      '"Ciao, Ada Lovelace!"',
      '"wrong"',
    ),
  });
  ok(command("cargo check --all-targets", dir));
  ok(command("cargo build", dir));
  ok(command("cargo test --no-run", dir));
  fails(command("cargo test", dir), /public_api_keeps_the_name.*FAILED/s);
});
test("doctest errato: doc e check passano, test --doc fallisce", () => {
  const dir = fixture({
    "src/lib.rs": replaceOnce(
      files.get("src/lib.rs"),
      '"Ciao, Ada!"',
      '"wrong"',
    ),
  });
  ok(command("cargo check --all-targets", dir));
  ok(command("cargo doc --no-deps", dir));
  fails(command("cargo test --doc", dir), /FAILED/);
});
test("test --doc esegue un esempio, --test greeting un integration test", () => {
  const dir = fixture();
  assert.equal(passed(command("cargo test --doc", dir)), 1);
  assert.equal(
    passed(command("cargo test --test greeting -- --nocapture", dir)),
    1,
  );
});
test("selezionare un integration test non esegue gli unit test errati", () => {
  const dir = fixture({
    "src/lib.rs": replaceOnce(
      files.get("src/lib.rs"),
      '"Ciao, Rust!"',
      '"wrong"',
    ),
  });
  assert.equal(
    passed(command("cargo test --test greeting -- --nocapture", dir)),
    1,
  );
  fails(command("cargo test", dir), /greets_a_name.*FAILED/s);
});
test("CLI: argomenti dopo --, vuoto e spazi, nessun parser di opzioni", () => {
  const dir = fixture();
  for (const name of ["", "Ada Lovelace", "--release", "caff\u00e8"]) {
    assert.equal(
      ok(
        launch(
          cargo,
          ["run", "--bin", "hello-rust", "--", name, "ignored"],
          dir,
        ),
      ).stdout,
      "Ciao, " + name + "!\n",
    );
  }
  fails(launch(cargo, ["run", "--bin", "absent"], dir), /no bin target/);
});
test("manifest-path seleziona il progetto senza cambiare cwd del binario", () => {
  const dir = fixture({
    "src/main.rs":
      'fn main() { println!("{}", std::env::current_dir().unwrap().display()); }\n',
  });
  const outside = directory();
  const result = ok(
    launch(
      cargo,
      ["run", "--manifest-path", path.join(dir, "Cargo.toml")],
      outside,
    ),
  );
  assert.equal(path.resolve(result.stdout.trim()), outside);
});
test("fmt --check non modifica; fmt corregge la sola fixture", () => {
  const dir = fixture({ "src/main.rs": 'fn main(){println!("ok");}\n' });
  const file = path.join(dir, "src/main.rs");
  const before = fs.readFileSync(file, "utf8");
  fails(command(fmtCheck, dir));
  assert.equal(fs.readFileSync(file, "utf8"), before);
  ok(command("cargo fmt", dir));
  assert.notEqual(fs.readFileSync(file, "utf8"), before);
  ok(command(fmtCheck, dir));
});
test("Clippy: warning non fatale, -D warnings lo rende bloccante", () => {
  const dir = fixture({
    "src/lib.rs":
      files.get("src/lib.rs") +
      "\npub fn identity(n: u32) -> u32 { return n; }\n",
  });
  const warned = ok(command("cargo clippy --all-targets", dir));
  assert.match(warned.stderr, /needless_return/);
  fails(command(denied, dir), /needless_return/);
});
test("Cargo 1.99: build.warnings deny funziona anche con warning cached", () => {
  const dir = fixture({
    "src/lib.rs":
      files.get("src/lib.rs") +
      "\npub fn identity(n: u32) -> u32 { return n; }\n",
  });
  ok(command("cargo clippy --all-targets", dir));
  fails(
    launch(
      cargo,
      ["clippy", "--all-targets", "--config", 'build.warnings="deny"'],
      dir,
    ),
    /warning/,
  );
  write(dir, ".cargo/config.toml", '[build]\nwarnings = "deny"\n');
  fails(command("cargo clippy --all-targets", dir), /warning/);
});
test("Clippy: deny include i warning rustc e all-targets include cfg(test)", () => {
  const dir = fixture({
    "src/lib.rs":
      files.get("src/lib.rs") + "\n#[cfg(test)] fn unused_helper() {}\n",
  });
  ok(launch(cargo, ["clippy", "--", "-D", "warnings"], dir));
  fails(command(denied, dir), /dead_code/);
});
test("release produce il binario ottimizzato ma non esegue test falsi", () => {
  const dir = fixture({
    "tests/greeting.rs": replaceOnce(
      files.get("tests/greeting.rs"),
      '"Ciao, Ada Lovelace!"',
      '"wrong"',
    ),
  });
  ok(command("cargo build --release", dir));
  const exe = path.join(dir, "target/release/hello-rust" + suffix);
  assert.equal(ok(launch(exe, ["Ada"], dir)).stdout, "Ciao, Ada!\n");
});
test("doc produce HTML della libreria senza aprire un browser", () => {
  const dir = fixture();
  ok(command("cargo doc --no-deps", dir));
  assert.match(
    fs.readFileSync(path.join(dir, "target/doc/hello_rust/index.html"), "utf8"),
    /greeting/,
  );
  assert.ok(
    fs.existsSync(path.join(dir, "target/doc/hello_rust/fn.greeting.html")),
  );
});
test("locked e frozen rifiutano lockfile assente senza crearlo", () => {
  for (const c of ["cargo build --locked", "cargo build --frozen"]) {
    const dir = fixture();
    fails(command(c, dir), /lock file|lockfile/i);
    assert.ok(!fs.existsSync(path.join(dir, "Cargo.lock")));
  }
});
test("offline puo generare il lockfile; locked, frozen e fetch lo preservano", () => {
  const dir = fixture();
  ok(command("cargo build --offline", dir));
  const file = path.join(dir, "Cargo.lock");
  const lock = fs.readFileSync(file, "utf8");
  for (const c of [
    "cargo build --locked",
    "cargo build --frozen",
    "cargo fetch --locked",
  ]) {
    ok(command(c, dir));
    assert.equal(fs.readFileSync(file, "utf8"), lock);
  }
});
test("lockfile da aggiornare: locked fallisce, offline lo aggiorna", () => {
  const dir = fixture();
  ok(command("cargo build --offline", dir));
  const before = fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8");
  write(
    dir,
    "Cargo.toml",
    replaceOnce(
      files.get("Cargo.toml"),
      'version = "0.1.0"',
      'version = "0.2.0"',
    ),
  );
  fails(command("cargo build --locked", dir), /lock file|lockfile/i);
  assert.equal(fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8"), before);
  ok(command("cargo build --offline", dir));
  assert.notEqual(
    fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8"),
    before,
  );
});
test("add --path: modifica manifest e lockfile, nessuna dipendenza remota", () => {
  const parent = directory();
  ok(command(newBin, parent));
  ok(command(newLib, parent));
  const dir = populate(path.join(parent, "hello-rust"));
  ok(command("cargo add --path ../libreria", dir));
  const pkg = metadata(dir).packages.find((p) => p.name === "hello-rust");
  assert.equal(pkg.dependencies.length, 1);
  assert.equal(pkg.dependencies[0].name, "libreria");
  assert.equal(
    path.resolve(pkg.dependencies[0].path),
    path.join(parent, "libreria"),
  );
  assert.ok(fs.existsSync(path.join(dir, "Cargo.lock")));
  ok(command("cargo build --frozen", dir));
});
test("offline con dipendenza registry non disponibile fallisce", () => {
  const dir = fixture({
    "Cargo.toml": files.get("Cargo.toml") + 'serde = "1"\n',
  });
  fails(command("cargo build --offline", dir), /serde/);
});
test("check esegue il build script locale; offline non lo impedisce", () => {
  const dir = fixture();
  write(
    dir,
    "build.rs",
    String.raw`fn main() {
    let out = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
    std::fs::write(out.join("ran.txt"), "executed").unwrap();
    println!("cargo::rustc-env=DEMO_CHECK=present");
}`,
  );
  write(
    dir,
    "src/main.rs",
    'fn main() { assert_eq!(env!("DEMO_CHECK"), "present"); }\n',
  );
  ok(command("cargo check", dir));
  const markers = fs
    .readdirSync(path.join(dir, "target/debug/build"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, "target/debug/build", e.name, "out/ran.txt"))
    .filter((file) => fs.existsSync(file));
  assert.equal(markers.length, 1);
  assert.equal(fs.readFileSync(markers[0], "utf8"), "executed");
});
test("workspace: default-members puo escludere test che --workspace esegue", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    '[workspace]\nmembers=["app","other"]\ndefault-members=["app"]\nresolver="3"\n',
  );
  populate(path.join(dir, "app"));
  write(
    dir,
    "other/Cargo.toml",
    '[package]\nname="other"\nversion="0.1.0"\nedition="2024"\n',
  );
  write(
    dir,
    "other/src/lib.rs",
    '#[test] fn fails() { panic!("workspace probe"); }\n',
  );
  assert.equal(passed(command("cargo test", dir)), 3);
  fails(command("cargo test --workspace", dir), /workspace probe/);
});
test("clean elimina output verificato, conserva manifest e sorgenti", () => {
  const dir = fixture();
  ok(command("cargo build", dir));
  const meta = metadata(dir);
  const target = fs.realpathSync(meta.target_directory);
  assert.equal(path.dirname(target), fs.realpathSync(dir));
  assert.equal(path.basename(target), "target");
  assert.ok(target.startsWith(fs.realpathSync(root) + path.sep));
  const sentinel = path.join(target, "manual.txt");
  fs.writeFileSync(sentinel, "generated fixture");
  const before = fs.readFileSync(path.join(dir, "src/lib.rs"), "utf8");
  ok(command("cargo clean", dir));
  assert.ok(!fs.existsSync(target));
  assert.equal(fs.readFileSync(path.join(dir, "src/lib.rs"), "utf8"), before);
  assert.ok(fs.existsSync(path.join(dir, "Cargo.toml")));
});
