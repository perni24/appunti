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
const notePath = "Programmazione/Rust/Pagine/Build profiles.md";
const note = parseNote(notePath);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const originalHash = digest(fs.readFileSync(notePath));
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const files = new Map();
const snippets = [];
const commands = [];
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type !== "code") continue;
  if (node.lang === "bash") commands.push(node.value);
  else if (["Cargo.toml", "src/lib.rs", "src/main.rs"].includes(heading)) {
    assert.ok(!files.has(heading));
    files.set(heading, node.value + "\n");
  } else {
    assert.equal(node.lang, "toml");
    snippets.push(node.value + "\n");
  }
}
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-build-profiles-";
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
function binary(items) {
  return items.find(
    (item) =>
      item.target.name === "profile-demo" && item.target.kind.includes("bin"),
  );
}
function expectRun(result, assertions, abort, sum = "None", wrapping = 4) {
  assert.equal(
    ok(result).stdout,
    "debug_assertions=" +
      assertions +
      "\npanic_abort=" +
      abort +
      "\nchecked=" +
      sum +
      "\nwrapping=" +
      wrapping +
      "\n",
  );
}
function passes(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((total, match) => total + Number(match[1]), 0);
}
const manifest = files.get("Cargo.toml");
const defaultManifest = manifest.slice(
  0,
  manifest.indexOf("[profile.release]"),
);
const probeMain =
  'fn main() { println!("debug_assertions={}", cfg!(debug_assertions)); }\n';

test("frontmatter, template e inventario dei blocchi", () => {
  assert.equal(note.data.title, "Build profiles");
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  assert.equal(note.data.date, "2026-05-22");
  assert.deepEqual(
    [...files.keys()],
    ["Cargo.toml", "src/lib.rs", "src/main.rs"],
  );
  assert.equal(commands.length, 12);
  assert.equal(new Set(commands).size, 12);
  assert.equal(snippets.length, 2);
  assert.equal(
    note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
      .length,
    1,
  );
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
      note.tree.children.some((n) => n.type === "heading" && text(n) === title),
    );
});

for (const version of Object.keys(compilers)) {
  test(
    version + ": laboratorio, cinque profili e tutti i comandi non-lint",
    () => {
      assert.match(
        ok(cargo(version, root, ["--version"])).stdout,
        new RegExp(version.replaceAll(".", "\\.")),
      );
      const dir = fixture();
      const before = [...files.keys()].map((name) =>
        digest(fs.readFileSync(path.join(dir, name))),
      );
      for (const [index, command] of commands.slice(0, 5).entries())
        expectRun(
          published(command, version, dir),
          index === 0 || index === 3,
          index === 4,
        );
      for (const command of commands.slice(5, 8))
        assert.equal(passes(published(command, version, dir)), 4);
      for (const command of commands.slice(8, 10))
        ok(published(command, version, dir));
      for (const profile of [
        "debug",
        "release",
        "profiling",
        "checked-release",
        "small",
      ])
        assert.ok(
          fs.existsSync(
            path.join(dir, "target", profile, "profile-demo" + suffix),
          ),
        );
      assert.ok(
        fs.existsSync(
          path.join(
            dir,
            "target",
            "profile-inspection",
            "profiling",
            "profile-demo" + suffix,
          ),
        ),
      );
      assert.ok(
        fs.existsSync(
          path.join(
            dir,
            "target",
            "profile-inspection",
            "cargo-timings",
            "cargo-timing.html",
          ),
        ),
      );
      assert.deepEqual(
        [...files.keys()].map((name) =>
          digest(fs.readFileSync(path.join(dir, name))),
        ),
        before,
      );
    },
  );

  test(
    version +
      ": default dev/release e test/bench, senza override del laboratorio",
    () => {
      const dir = fixture({ "Cargo.toml": defaultManifest });
      const dev = binary(artifacts(version, dir));
      assert.equal(dev.profile.opt_level, "0");
      assert.equal(dev.profile.debug_assertions, true);
      assert.equal(dev.profile.overflow_checks, true);
      const release = binary(artifacts(version, dir, ["--release"]));
      assert.equal(release.profile.opt_level, "3");
      assert.equal(release.profile.debug_assertions, false);
      assert.equal(release.profile.overflow_checks, false);
      const tests = records(
        cargo(version, dir, ["test", "--no-run", "--message-format=json"]),
      );
      const harness = tests.find(
        (a) => a.reason === "compiler-artifact" && a.profile.test,
      );
      assert.equal(harness.profile.opt_level, "0");
      assert.equal(harness.profile.debug_assertions, true);
      const benches = records(
        cargo(version, dir, ["bench", "--no-run", "--message-format=json"]),
      );
      assert.ok(
        benches.some(
          (a) =>
            a.reason === "compiler-artifact" &&
            a.profile.test &&
            a.profile.opt_level === "3",
        ),
      );
      const buildOnly = ok(cargo(version, dir, ["build", "--profile", "test"]));
      assert.doesNotMatch(buildOnly.stdout, /test result:/);
    },
  );

  test(
    version + ": debug info e assertions indipendenti, overflow ereditato",
    () => {
      const dir = fixture();
      const profiling = binary(
        artifacts(version, dir, ["--profile", "profiling"]),
      );
      assert.equal(profiling.profile.opt_level, "3");
      assert.equal(profiling.profile.debuginfo, 2);
      assert.equal(profiling.profile.debug_assertions, false);
      assert.equal(profiling.profile.overflow_checks, true);
      const checked = binary(
        artifacts(version, dir, ["--profile", "checked-release"]),
      );
      assert.equal(checked.profile.debug_assertions, true);
      assert.equal(checked.profile.overflow_checks, true);
    },
  );

  test(version + ": panic abort nel binario, unwind nel test harness", () => {
    const dir = fixture({
      "src/lib.rs":
        files.get("src/lib.rs") +
        '\n#[test]\nfn harness_uses_unwind() { assert!(cfg!(panic = "unwind")); }\n',
    });
    expectRun(
      cargo(version, dir, [
        "run",
        "--quiet",
        "--profile",
        "small",
        "--",
        "250",
        "10",
      ]),
      false,
      true,
    );
    assert.equal(
      passes(cargo(version, dir, ["test", "--profile", "small"])),
      5,
    );
  });
}

test("rustfmt e Clippy sul laboratorio senza modificare i sorgenti", () => {
  const dir = fixture();
  for (const command of commands.slice(10))
    ok(published(command, "1.99.1", dir));
  for (const [name, value] of files)
    assert.equal(fs.readFileSync(path.join(dir, name), "utf8"), value);
});

test("CLI: limiti u8, somma valida e input errati come Result anche in small", () => {
  const version = "1.99.1";
  const dir = fixture();
  for (const profile of ["dev", "small"]) {
    const item = binary(artifacts(version, dir, ["--profile", profile]));
    const run = (...args) =>
      execute(item.executable, args, dir, environment(version));
    expectRun(
      run("20", "22"),
      profile === "dev",
      profile === "small",
      "Some(42)",
      42,
    );
    expectRun(
      run("0", "0"),
      profile === "dev",
      profile === "small",
      "Some(0)",
      0,
    );
    expectRun(
      run("255", "0"),
      profile === "dev",
      profile === "small",
      "Some(255)",
      255,
    );
    for (const args of [
      [],
      ["2"],
      ["x", "1"],
      ["256", "1"],
      ["-1", "1"],
      ["1", "2", "3"],
    ]) {
      const result = run(...args);
      fails(result, /Error:/);
      assert.doesNotMatch(result.stderr, /panicked at/);
    }
  }
});

test("overflow ordinario a runtime: default dev panic, release wrapping, override controllato", () => {
  const dir = fixture({
    "Cargo.toml": defaultManifest,
    "src/main.rs":
      'fn main() { let value: u8 = std::env::args().nth(1).unwrap().parse().unwrap(); println!("{}", value + 1); }\n',
  });
  fails(cargo("1.99.1", dir, ["run", "--quiet", "--", "255"]), /overflow/);
  assert.equal(
    ok(cargo("1.99.1", dir, ["run", "--quiet", "--release", "--", "255"]))
      .stdout,
    "0\n",
  );
  write(dir, "Cargo.toml", manifest);
  fails(
    cargo("1.99.1", dir, ["run", "--quiet", "--release", "--", "255"]),
    /overflow/,
  );
});

test("debug_assert non esegue gli effetti disabilitati; assert resta attivo in release", () => {
  const dir = fixture({
    "src/main.rs":
      'fn main() { let mut calls = 0; debug_assert!({ calls += 1; true }); println!("{calls}"); }\n',
  });
  assert.equal(ok(cargo("1.99.1", dir, ["run", "--quiet"])).stdout, "1\n");
  assert.equal(
    ok(cargo("1.99.1", dir, ["run", "--quiet", "--release"])).stdout,
    "0\n",
  );
  write(
    dir,
    "src/main.rs",
    'fn main() { assert!(std::env::args().len() == 0, "always checked"); }\n',
  );
  fails(
    cargo("1.99.1", dir, ["run", "--quiet", "--release"]),
    /always checked/,
  );
});

test("config file, ambiente e --config prevalgono sulle impostazioni del manifest", () => {
  const dir = fixture({ "src/main.rs": probeMain });
  write(
    dir,
    ".cargo/config.toml",
    "[profile.release]\ndebug-assertions = true\n",
  );
  assert.equal(
    ok(cargo("1.99.1", dir, ["run", "--quiet", "--release"])).stdout,
    "debug_assertions=true\n",
  );
  assert.equal(
    ok(
      cargo("1.99.1", dir, ["run", "--quiet", "--release"], {
        CARGO_PROFILE_RELEASE_DEBUG_ASSERTIONS: "false",
      }),
    ).stdout,
    "debug_assertions=false\n",
  );
  assert.equal(
    ok(
      cargo(
        "1.99.1",
        dir,
        [
          "run",
          "--quiet",
          "--release",
          "--config",
          "profile.release.debug-assertions=true",
        ],
        { CARGO_PROFILE_RELEASE_DEBUG_ASSERTIONS: "false" },
      ),
    ).stdout,
    "debug_assertions=true\n",
  );
});

test("override nominativo pubblicato e wildcard: un membro non e una dipendenza esterna", () => {
  const dir = fixture({ "Cargo.toml": manifest + "\n" + snippets[0] });
  assert.equal(binary(artifacts("1.99.1", dir)).profile.opt_level, "1");
  write(
    dir,
    "Cargo.toml",
    manifest + '\n[profile.dev.package."*"]\nopt-level = 2\n',
  );
  assert.equal(binary(artifacts("1.99.1", dir)).profile.opt_level, "0");
  write(
    dir,
    "Cargo.toml",
    manifest + '\n[profile.dev.package."*"]\nopt-level = 2\n' + snippets[0],
  );
  assert.equal(binary(artifacts("1.99.1", dir)).profile.opt_level, "1");
});

test("workspace: il profilo nel membro e ignorato a favore della radice", () => {
  const dir = fixture();
  for (const [name, value] of files) write(dir, "member/" + name, value);
  write(
    dir,
    "Cargo.toml",
    '[workspace]\nmembers = ["member"]\nresolver = "3"\n\n[profile.release]\ndebug-assertions = true\n',
  );
  const result = ok(
    cargo("1.99.1", dir, [
      "run",
      "-p",
      "profile-demo",
      "--release",
      "--",
      "250",
      "10",
    ]),
  );
  expectRun(result, true, false);
  assert.match(
    result.stderr,
    /profiles for the non root package will be ignored/,
  );
});

test("build-override pubblicato aggiunge debug info allo script, senza cambiare il programma", () => {
  const dir = fixture({ "Cargo.toml": manifest + "\n" + snippets[1] });
  write(
    dir,
    "build.rs",
    'fn main() { println!("cargo::rerun-if-changed=build.rs"); }\n',
  );
  const items = artifacts("1.99.1", dir);
  const script = items.find((a) => a.target.kind.includes("custom-build"));
  assert.ok(script);
  assert.equal(script.profile.debuginfo, 2);
  assert.equal(binary(items).profile.opt_level, "0");
  write(
    dir,
    "Cargo.toml",
    manifest + "\n[profile.dev.build-override]\nopt-level = 2\n" + snippets[0],
  );
  const overridden = artifacts("1.99.1", dir);
  assert.equal(
    overridden.find((a) => a.target.kind.includes("custom-build")).profile
      .opt_level,
    "1",
  );
});

test("profili invalidi: inherits mancante, nome inesistente e opzioni vietate negli override", () => {
  const missing = fixture({
    "Cargo.toml": defaultManifest + "\n[profile.custom]\nopt-level = 1\n",
  });
  fails(cargo("1.99.1", missing, ["build", "--profile", "custom"]), /inherits/);
  const unknown = fixture();
  fails(
    cargo("1.99.1", unknown, ["build", "--profile", "unknown"]),
    /not defined/,
  );
  for (const [key, value] of [
    ["panic", '"abort"'],
    ["lto", "true"],
    ["rpath", "true"],
  ]) {
    const dir = fixture({
      "Cargo.toml":
        defaultManifest +
        "\n[profile.dev.package.profile-demo]\n" +
        key +
        " = " +
        value +
        "\n",
    });
    fails(
      cargo("1.99.1", dir, ["build"]),
      new RegExp(key + ".*not.*specified", "s"),
    );
  }
});

test("LTO e debug: varianti compilabili senza dedurre prestazioni o dimensioni", () => {
  const dir = fixture();
  for (const lto of ['"off"', '"thin"', "true"]) {
    write(
      dir,
      "Cargo.toml",
      manifest +
        '\n[profile.experiment]\ninherits = "release"\nlto = ' +
        lto +
        '\ncodegen-units = 1\ndebug = "line-tables-only"\nstrip = "none"\n',
    );
    const result = ok(
      cargo("1.99.1", dir, ["build", "--profile", "experiment", "-vv"]),
    );
    assert.match(result.stderr, /codegen-units=1/);
    assert.match(result.stderr, /debuginfo=line-tables-only/);
    assert.match(
      result.stderr,
      lto === '"off"'
        ? /lto=off/
        : lto === '"thin"'
          ? /lto=thin/
          : /-C lto(?:\s|")/,
    );
  }
});

test("artefatti riutilizzati e CARGO_INCREMENTAL distinto dalla cache Cargo", () => {
  const dir = fixture();
  assert.ok(binary(artifacts("1.99.1", dir)).fresh === false);
  assert.ok(binary(artifacts("1.99.1", dir)).fresh === true);
  const result = ok(
    cargo(
      "1.99.1",
      dir,
      ["build", "--target-dir", "target/no-incremental", "-vv"],
      { CARGO_INCREMENTAL: "0" },
    ),
  );
  assert.doesNotMatch(result.stderr, /-C incremental=/);
  assert.ok(
    binary(
      artifacts("1.99.1", dir, ["--target-dir", "target/no-incremental"], {
        CARGO_INCREMENTAL: "0",
      }),
    ).fresh,
  );
});
