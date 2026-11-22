import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const compilers = {
  "1.85.0": process.env.RUSTC_MSRV_TEST_EXECUTABLE,
  "1.99.1": process.env.RUSTC_TEST_EXECUTABLE,
};
const suffix = process.platform === "win32" ? ".exe" : "";
for (const exe of Object.values(compilers))
  assert.ok(
    exe && path.isAbsolute(exe) && fs.existsSync(exe),
    "Fornire i percorsi rustc",
  );
const notePath = "Programmazione/Rust/Pagine/Workspace dependencies.md";
const note = parseNote(notePath);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const originalHash = digest(fs.readFileSync(notePath));
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const files = new Map();
const commands = [];
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") commands.push(node.value);
  else if (/\.(toml|rs)$/.test(heading)) {
    assert.ok(!files.has(heading));
    files.set(heading, node.value + "\n");
  } else {
    assert.fail("Blocco non associato a un file: " + heading);
  }
}
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-workspace-deps-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  assert.equal(digest(fs.readFileSync(notePath)), originalHash);
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
for (let dir = parent; ; dir = path.dirname(dir)) {
  for (const file of ["config", "config.toml"])
    assert.ok(
      !fs.existsSync(path.join(dir, ".cargo", file)),
      "Configurazione antenata: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
const env = { ...process.env };
for (const key of Object.keys(env))
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUSTDOC$|RUSTC$|RUSTFMT$|CLIPPY_|GIT_|OUT_DIR$|HOST$|TARGET$)/i.test(
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
});
const pathKey =
  Object.keys(env).find((key) => key.toUpperCase() === "PATH") || "PATH";
function environment(version, extra = {}) {
  const bin = path.dirname(compilers[version]);
  return {
    ...env,
    [pathKey]: bin + path.delimiter + (env[pathKey] || ""),
    RUSTC: compilers[version],
    RUSTDOC: path.join(bin, "rustdoc" + suffix),
    ...extra,
  };
}
let sequence = 0;
function write(dir, name, value) {
  const dest = path.resolve(dir, name);
  assert.ok(dest.startsWith(root + path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, value);
}
function fixture(overrides = {}) {
  const dir = path.join(root, String(sequence++));
  for (const [name, value] of files) write(dir, name, overrides[name] ?? value);
  return dir;
}
function execute(exe, args, cwd, childEnv) {
  const result = spawnSync(exe, args, {
    cwd,
    env: childEnv,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  result.stdout = result.stdout.replaceAll("\r\n", "\n");
  return result;
}
function cargo(version, dir, args, extra = {}) {
  return execute(
    path.join(path.dirname(compilers[version]), "cargo" + suffix),
    args,
    dir,
    environment(version, extra),
  );
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function fails(result, pattern) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, pattern);
}
function published(command, version, dir) {
  assert.ok(commands.includes(command));
  const [name, ...args] = command.split(" ");
  assert.equal(name, "cargo");
  return cargo(version, dir, args);
}
function records(result) {
  return ok(result)
    .stdout.trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
function artifacts(version, dir, args = [], extra = {}) {
  return records(
    cargo(version, dir, ["build", "--message-format=json", ...args], extra),
  ).filter((item) => item.reason === "compiler-artifact");
}

const manifest = files.get("Cargo.toml");
const cliManifest = files.get("crates/note-cli/Cargo.toml");
const exportManifest = files.get("crates/note-export/Cargo.toml");
const coreManifest = files.get("crates/format-core/Cargo.toml");
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function read(dir, name) {
  return fs.readFileSync(path.join(dir, name), "utf8");
}
function change(dir, name, before, after) {
  write(dir, name, replace(read(dir, name), before, after));
}
function metadata(version, dir) {
  return JSON.parse(
    ok(cargo(version, dir, ["metadata", "--format-version", "1", "--no-deps"]))
      .stdout,
  );
}
function pkg(meta, name) {
  const result = meta.packages.find((p) => p.name === name);
  assert.ok(result, name);
  return result;
}
function coreArtifacts(items) {
  return items.filter(
    (a) => a.target.name === "format_core" && a.target.kind.includes("lib"),
  );
}
function features(items) {
  const matches = coreArtifacts(items);
  assert.equal(matches.length, 1);
  return matches[0].features;
}
function passes(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((total, match) => total + Number(match[1]), 0);
}
const normal = "name=Rust\nfeatures=(true, false)\n";
const enriched = "name=Rust\nfeatures=(true, true)\n";

test("frontmatter, template e inventario: sette file e diciassette comandi", () => {
  assert.equal(note.data.title, "Workspace dependencies");
  assert.equal(note.data.date, "2026-05-22");
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  assert.equal(files.size, 7);
  assert.equal(commands.length, 17);
  assert.equal(new Set(commands).size, 17);
  assert.equal(
    note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
      .length,
    1,
  );
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
      note.tree.children.some((n) => n.type === "heading" && text(n) === name),
    );
});

for (const version of Object.keys(compilers)) {
  test(
    version + ": tutti i comandi del laboratorio, eccetto lint della MSRV",
    () => {
      assert.match(
        ok(cargo(version, root, ["--version"])).stdout,
        new RegExp(version.replaceAll(".", "\\.")),
      );
      const dir = fixture();
      const hashes = [...files.keys()].map((name) =>
        digest(fs.readFileSync(path.join(dir, name))),
      );
      const expectedTests = new Map([
        ["cargo test --workspace --all-features", 4],
        ["cargo test -p format-core --no-default-features", 2],
        ["cargo test -p format-core --no-default-features --features plain", 3],
        [
          "cargo test -p format-core --no-default-features --features pretty",
          3,
        ],
        ["cargo test -p format-core --all-features", 4],
        ["cargo test --workspace --all-features --locked", 4],
      ]);
      for (const command of commands) {
        if (/^cargo (fmt|clippy) /.test(command)) continue;
        const result = published(command, version, dir);
        if (expectedTests.has(command))
          assert.equal(passes(result), expectedTests.get(command));
        else ok(result);
        if (command === commands[0]) assert.equal(result.stdout, normal);
        if (command === commands[1])
          assert.equal(result.stdout, "export disabled\n");
        if (command === commands[2])
          assert.equal(result.stdout, "[Rust]\nfeatures=(true, true)\n");
        if (command.includes("-e features"))
          assert.match(result.stdout, /format-core/);
        if (command.includes("--duplicates"))
          assert.equal(result.stdout.trim(), "");
      }
      assert.ok(fs.existsSync(path.join(dir, "Cargo.lock")));
      assert.deepEqual(
        [...files.keys()].map((name) =>
          digest(fs.readFileSync(path.join(dir, name))),
        ),
        hashes,
      );
    },
  );

  test(
    version + ": metadata ereditati, dipendenze esplicite e default-members",
    () => {
      const dir = fixture();
      const meta = metadata(version, dir);
      assert.equal(meta.resolve, null);
      assert.equal(meta.packages.length, 3);
      assert.deepEqual(meta.workspace_default_members, [
        pkg(meta, "note-cli").id,
      ]);
      for (const p of meta.packages) {
        assert.equal(p.edition, "2024");
        assert.equal(p.rust_version, "1.85");
        assert.equal(p.version, "0.1.0");
        assert.equal(p.license, "MIT");
        assert.deepEqual(p.publish, []);
      }
      const cli = pkg(meta, "note-cli").dependencies[0];
      assert.deepEqual(cli.features, ["plain"]);
      assert.equal(cli.optional, false);
      assert.equal(cli.uses_default_features, false);
      assert.equal(
        fs.realpathSync(cli.path),
        fs.realpathSync(path.join(dir, "crates/format-core")),
      );
      const exporter = pkg(meta, "note-export").dependencies[0];
      assert.equal(exporter.optional, true);
      assert.deepEqual([...exporter.features].sort(), ["plain", "pretty"]);
      assert.equal(pkg(meta, "format-core").dependencies.length, 0);
    },
  );

  test(
    version +
      ": optional inattiva, unificazione congiunta e nuova invocazione isolata",
    () => {
      const dir = fixture();
      assert.equal(
        coreArtifacts(artifacts(version, dir, ["-p", "note-export"])).length,
        0,
      );
      const joint = artifacts(version, dir, [
        "-p",
        "note-cli",
        "-p",
        "note-export",
        "--features",
        "note-export/pretty",
      ]);
      assert.deepEqual(features(joint), ["plain", "pretty"]);
      const cli = joint.find(
        (a) => a.target.name === "note-cli" && a.executable,
      );
      assert.equal(
        ok(execute(cli.executable, [], dir, environment(version))).stdout,
        enriched,
      );
      assert.equal(ok(published(commands[0], version, dir)).stdout, normal);
      const all = artifacts(version, dir, ["--workspace"]);
      assert.deepEqual(features(all), ["default", "plain", "pretty"]);
    },
  );

  test(
    version + ": default-features locale false, edition 2024 e differenza 1.99",
    () => {
      const dir = fixture({
        "Cargo.toml": replace(
          manifest,
          "default-features = false",
          "default-features = true",
        ),
        "crates/note-cli/Cargo.toml": replace(
          cliManifest,
          "format-core.workspace = true",
          "format-core = { workspace = true, default-features = false }",
        ),
      });
      const result = published(commands[0], version, dir);
      if (version === "1.85.0")
        fails(result, /default-features.*cannot override/s);
      else assert.equal(ok(result).stdout, normal);
    },
  );

  test(
    version + ": default-features locale false ignorato nella edition 2021",
    () => {
      const dir = fixture({
        "Cargo.toml": replace(
          manifest,
          "default-features = false",
          "default-features = true",
        ),
        "crates/note-cli/Cargo.toml": replace(
          replace(cliManifest, "edition.workspace = true", 'edition = "2021"'),
          "format-core.workspace = true",
          "format-core = { workspace = true, default-features = false }",
        ),
      });
      const result = ok(cargo(version, dir, ["run", "-p", "note-cli"]));
      assert.equal(result.stdout, enriched);
      assert.match(result.stderr, /default-features.*ignored/s);
    },
  );

  test(
    version +
      ": membro riabilita i default e --no-default-features non li vieta alla dipendenza",
    () => {
      const dir = fixture({
        "crates/note-cli/Cargo.toml": replace(
          cliManifest,
          "format-core.workspace = true",
          "format-core = { workspace = true, default-features = true }",
        ),
      });
      assert.equal(
        ok(
          cargo(version, dir, [
            "run",
            "--quiet",
            "-p",
            "note-cli",
            "--no-default-features",
          ]),
        ).stdout,
        enriched,
      );
      assert.deepEqual(features(artifacts(version, dir, ["-p", "note-cli"])), [
        "default",
        "plain",
        "pretty",
      ]);
    },
  );
}

test("rustfmt e Clippy: comandi pubblicati, sorgenti invariati", () => {
  const dir = fixture();
  for (const command of commands.filter((c) => /^cargo (fmt|clippy) /.test(c)))
    ok(published(command, "1.99.1", dir));
  for (const [name, value] of files) assert.equal(read(dir, name), value);
});

test("dichiarazione centrale inutilizzata non crea un collegamento; adesione mancante fallisce", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml": replace(
      cliManifest,
      "format-core.workspace = true",
      "",
    ),
  });
  change(
    dir,
    "Cargo.toml",
    "[workspace.dependencies]",
    '[workspace.dependencies]\nunused = { path = "not-present" }',
  );
  assert.equal(pkg(metadata("1.99.1", dir), "note-cli").dependencies.length, 0);
  fails(cargo("1.99.1", dir, ["check", "-p", "note-cli"]), /format_core/);
  write(dir, "crates/note-cli/Cargo.toml", cliManifest);
  change(dir, "Cargo.toml", "format-core = {", "different-key = {");
  fails(
    cargo("1.99.1", dir, ["check", "-p", "note-cli"]),
    /workspace.*dependencies|inheriting/s,
  );
});

test("optional nella radice e rifiutato", () => {
  const dir = fixture({
    "Cargo.toml": replace(
      manifest,
      'features = ["plain"]',
      'features = ["plain"], optional = true',
    ),
  });
  fails(cargo("1.99.1", dir, ["check", "-p", "note-cli"]), /optional/);
});

test("features vuote nel membro non sottraggono quelle centrali", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml": replace(
      cliManifest,
      "format-core.workspace = true",
      "format-core = { workspace = true, features = [] }",
    ),
  });
  assert.equal(ok(published(commands[0], "1.99.1", dir)).stdout, normal);
});

test("path centrale relativo alla radice, anche invocando Cargo dal membro", () => {
  const dir = fixture();
  assert.equal(
    ok(cargo("1.99.1", path.join(dir, "crates/note-cli"), ["run", "--quiet"]))
      .stdout,
    normal,
  );
  change(
    dir,
    "Cargo.toml",
    'path = "crates/format-core"',
    'path = "../format-core"',
  );
  fails(
    cargo("1.99.1", dir, ["check", "-p", "note-cli"]),
    /failed to load manifest|failed to read/s,
  );
});

test("metadata opt-in: valore locale ammesso, valore centrale mancante rifiutato", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml": replace(
      cliManifest,
      "license.workspace = true",
      'license = "Apache-2.0"',
    ),
  });
  assert.equal(pkg(metadata("1.99.1", dir), "note-cli").license, "Apache-2.0");
  change(dir, "Cargo.toml", 'license = "MIT"\n', "");
  fails(
    cargo("1.99.1", dir, ["check", "-p", "note-cli"]),
    /license.*(not defined|not found)|inheriting/s,
  );
});

test("lint condiviso applicato solo ai membri che aderiscono", () => {
  const dir = fixture();
  write(
    dir,
    "crates/format-core/src/lib.rs",
    files.get("crates/format-core/src/lib.rs") +
      "\npub unsafe fn marker() {}\n",
  );
  fails(cargo("1.99.1", dir, ["check", "-p", "format-core"]), /unsafe/);
  change(
    dir,
    "crates/format-core/Cargo.toml",
    "[lints]\nworkspace = true\n",
    "",
  );
  ok(cargo("1.99.1", dir, ["check", "-p", "format-core"]));
});

test("dep: elimina la feature implicita e il cfg locale non osserva quello della libreria", () => {
  const dir = fixture();
  fails(
    cargo("1.99.1", dir, [
      "check",
      "-p",
      "note-export",
      "--features",
      "format-core",
    ]),
    /does not have.*feature|does not contain.*feature/s,
  );
  change(
    dir,
    "crates/note-export/src/main.rs",
    'println!("export disabled");',
    'println!("export disabled");\n    println!("local_pretty={}", cfg!(feature = "pretty"));',
  );
  const items = artifacts("1.99.1", dir, ["--workspace"]);
  assert.ok(features(items).includes("pretty"));
  const exporter = items.find(
    (a) => a.target.name === "note-export" && a.executable,
  );
  assert.equal(
    ok(execute(exporter.executable, [], dir, environment("1.99.1"))).stdout,
    "export disabled\nlocal_pretty=false\n",
  );
});

test("rinomina: si eredita la chiave alias, il nome del package resta distinto", () => {
  const dir = fixture();
  change(
    dir,
    "Cargo.toml",
    "[workspace.dependencies]",
    '[workspace.dependencies]\nfmt = { package = "format-core", path = "crates/format-core", default-features = false, features = ["plain"] }',
  );
  change(
    dir,
    "crates/note-cli/Cargo.toml",
    "format-core.workspace = true",
    "fmt.workspace = true",
  );
  write(
    dir,
    "crates/note-cli/src/main.rs",
    files.get("crates/note-cli/src/main.rs").replaceAll("format_core", "fmt"),
  );
  assert.equal(ok(published(commands[0], "1.99.1", dir)).stdout, normal);
  const dependency = pkg(metadata("1.99.1", dir), "note-cli").dependencies[0];
  assert.equal(dependency.name, "format-core");
  assert.equal(dependency.rename, "fmt");
});

test("build-dependency ereditata: feature host separate dalla dipendenza normale", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml":
      cliManifest +
      '\n[build-dependencies]\nformat-core = { workspace = true, features = ["pretty"] }\n',
  });
  write(
    dir,
    "crates/note-cli/build.rs",
    'fn main() { assert_eq!(format_core::pretty_label(" Rust "), "[Rust]"); println!("cargo::rerun-if-changed=build.rs"); }\n',
  );
  const items = coreArtifacts(artifacts("1.99.1", dir, ["-p", "note-cli"]));
  assert.deepEqual(items.map((a) => a.features.join(",")).sort(), [
    "plain",
    "plain,pretty",
  ]);
  assert.equal(ok(published(commands[0], "1.99.1", dir)).stdout, normal);
});

test("dev-dependency ereditata: non arricchisce una build normale, ma serve nei test", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml":
      cliManifest +
      '\n[dev-dependencies]\nformat-core = { workspace = true, features = ["pretty"] }\n',
  });
  write(
    dir,
    "crates/note-cli/tests/format.rs",
    '#[test]\nfn formatting() { assert_eq!(format_core::pretty_label(" Rust "), "[Rust]"); }\n',
  );
  assert.deepEqual(features(artifacts("1.99.1", dir, ["-p", "note-cli"])), [
    "plain",
  ]);
  assert.equal(passes(cargo("1.99.1", dir, ["test", "-p", "note-cli"])), 1);
});

test("dipendenza condizionata da target inattivo non aggiunge feature alla build nativa", () => {
  const dir = fixture({
    "crates/note-cli/Cargo.toml":
      cliManifest +
      '\n[target.\'cfg(target_os = "none")\'.dependencies]\nformat-core = { workspace = true, features = ["pretty"] }\n',
  });
  assert.deepEqual(features(artifacts("1.99.1", dir, ["-p", "note-cli"])), [
    "plain",
  ]);
});

test("locked non crea il lockfile e rifiuta una risoluzione cambiata", () => {
  const dir = fixture();
  fails(
    cargo("1.99.1", dir, ["test", "--workspace", "--all-features", "--locked"]),
    /cannot (?:create|update) the lock ?file.*--locked|lock ?file.*needs to be updated/s,
  );
  ok(cargo("1.99.1", dir, ["generate-lockfile"]));
  const hash = digest(fs.readFileSync(path.join(dir, "Cargo.lock")));
  assert.equal(
    passes(
      cargo("1.99.1", dir, [
        "test",
        "--workspace",
        "--all-features",
        "--locked",
      ]),
    ),
    4,
  );
  assert.equal(digest(fs.readFileSync(path.join(dir, "Cargo.lock"))), hash);
  change(dir, "Cargo.toml", 'version = "0.1.0"', 'version = "0.2.0"');
  fails(
    cargo("1.99.1", dir, ["check", "--workspace", "--locked"]),
    /cannot (?:create|update) the lock ?file.*--locked|lock ?file.*needs to be updated/s,
  );
  assert.equal(digest(fs.readFileSync(path.join(dir, "Cargo.lock"))), hash);
});

test("path con requisito di versione: requisito rispettato, non semplice annotazione", () => {
  const dir = fixture({
    "Cargo.toml": replace(
      manifest,
      'path = "crates/format-core"',
      'path = "crates/format-core", version = "0.1"',
    ),
  });
  const declaration = pkg(metadata("1.99.1", dir), "note-cli").dependencies[0];
  assert.equal(declaration.req, "^0.1");
  ok(cargo("1.99.1", dir, ["check", "-p", "note-cli"]));
  change(
    dir,
    "crates/format-core/Cargo.toml",
    "\nversion.workspace = true\n",
    '\nversion = "0.2.0"\n',
  );
  fails(
    cargo("1.99.1", dir, ["check", "-p", "note-cli"]),
    /failed to select a version/,
  );
});
