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
const notePath = "Programmazione/Rust/Pagine/Rust 2018 2021 e 2024.md";
const note = parseNote(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
const commands = new Set();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node).split(":")[0];
  if (node.type !== "code") continue;
  if (node.lang === "bash") {
    assert.match(node.value, /^(cargo|rustc) [a-z0-9 =_.-]+$/);
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
  "legacy/Cargo.toml",
  "legacy/src/lib.rs",
  "domain/Cargo.toml",
  "domain/src/lib.rs",
  "app/Cargo.toml",
  "app/src/main.rs",
];
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-editions-";
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
    ["--version", "metadata", "check", "test", "run", "fmt", "fix"].includes(
      args[0],
    ),
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
    ok(command("cargo metadata --no-deps --format-version 1", version, dir))
      .stdout,
  );
}
function replace(source, before, after) {
  assert.equal(source.split(before).length, 2, before);
  return source.replace(before, () => after);
}
function compile(version, edition, source, metadataOnly = false, extra = []) {
  const dir = directory();
  write(dir, "probe.rs", source);
  const executable = path.join(dir, "probe" + suffix);
  const args = [
    "--edition=" + edition,
    "--crate-name",
    "edition_probe",
    "probe.rs",
  ];
  if (metadataOnly)
    args.push(
      "--crate-type=lib",
      "--emit=metadata",
      "-o",
      path.join(dir, "probe.rmeta"),
    );
  else args.push("-o", executable);
  return {
    dir,
    executable,
    result: launch(
      compilers[version],
      [...args, ...extra],
      dir,
      environment(version),
    ),
  };
}
function execute(probe) {
  ok(probe.result);
  return ok(launch(probe.executable, [], probe.dir));
}
function matrix(callback) {
  for (const version of Object.keys(compilers)) callback(version);
}
function git(dir, ...args) {
  assert.ok(dir.startsWith(root + path.sep));
  assert.ok(["init", "add", "commit", "status"].includes(args[0]));
  return launch(
    "git",
    [
      "-c",
      "core.hooksPath=" + path.join(root, "empty-hooks"),
      "-c",
      "commit.gpgsign=false",
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
  if (initialize) {
    write(dir, ".gitignore", "target/\n");
    ok(git(dir, "init", "--quiet", "--initial-branch=main"));
  }
  ok(git(dir, "add", "."));
  ok(git(dir, "commit", "--quiet", "-m", "Fixture snapshot"));
}
function standalone(name) {
  const dir = directory();
  write(dir, name, blocks.get(name));
  return dir;
}

test("toolchain reali e 22 blocchi estratti", () => {
  matrix((version) => {
    assert.match(
      ok(launch(compilers[version], ["--version"], root, environment(version)))
        .stdout,
      new RegExp("rustc " + version.replaceAll(".", "\\.")),
    );
    assert.match(
      ok(run(version, root, "--version")).stdout,
      new RegExp("cargo " + version.replaceAll(".", "\\.")),
    );
  });
  assert.equal(commands.size, 12);
  assert.equal(blocks.size, 10);
  assert.deepEqual(
    [...blocks.keys()],
    [...fileNames, "array_probe.rs", "keyword_probe.rs", "drop_probe.rs"],
  );
});

test("YAML invariato e struttura coerente col template tecnico", () => {
  const old = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  assert.deepEqual(note.data, YAML.parse(old.split("---")[1]));
  assert.equal(note.data.status, "non revisionato");
  assert.match(
    text(note.tree),
    /Una semplice copia senza controllo versione non basta/,
  );
  const headings = note.tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(headings.filter((node) => node.depth === 1).map(text), [
    "Rust 2018, 2021 e 2024",
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
  for (const source of commands) assert.ok(!source.includes("\n"));
});

test("metadata: tre edition nella stessa build, MSRV distinta e path locali", () => {
  matrix((version) => {
    const data = metadata(version, fixture());
    assert.equal(data.workspace_members.length, 3);
    for (const [name, edition] of [
      ["legacy-text", "2018"],
      ["note-domain", "2021"],
      ["edition-app", "2024"],
    ]) {
      const pkg = data.packages.find((pkg) => pkg.name === name);
      assert.equal(pkg.edition, edition);
      assert.equal(pkg.rust_version, "1.85");
      assert.deepEqual(pkg.publish, []);
      for (const dep of pkg.dependencies) {
        assert.equal(dep.source, null);
        assert.ok(dep.path.startsWith(root));
      }
    }
  });
});

test("workspace originale: check, due unit test, due doctest e run sulle due versioni", () => {
  matrix((version) => {
    const dir = fixture();
    ok(command("cargo check --workspace --all-targets", version, dir));
    const before = read(dir, "Cargo.lock");
    assert.equal(passed(command("cargo test --workspace", version, dir)), 4);
    assert.equal(
      ok(command("cargo run -p edition-app", version, dir)).stdout,
      "Nota: Rust\n",
    );
    assert.equal(read(dir, "Cargo.lock"), before);
    assert.ok(fs.existsSync(path.join(dir, "target")));
  });
});

test("fmt corrente: i sorgenti pubblicati sono gia formattati", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "fmt", "--all", "--", "--check"));
  const before = fileNames.map((name) => read(dir, name));
  ok(command("cargo fmt --all", "1.99.1", dir));
  assert.deepEqual(
    fileNames.map((name) => read(dir, name)),
    before,
  );
});

test("consumer: spazio Unicode, input vuoto e testo interno conservato", () => {
  const dir = fixture({
    "app/src/main.rs":
      'fn main() {\nassert_eq!(note_domain::title("\\u{2003}Rust book\\u{2003}"), Some("Nota: Rust book".to_owned()));\nassert_eq!(note_domain::title(""), None);\nassert_eq!(note_domain::title("0"), Some("Nota: 0".to_owned()));\n}\n',
  });
  matrix((version) => ok(run(version, dir, "run", "-p", "edition-app")));
});

test("edition omessa usa 2015 anche col compilatore recente", () => {
  const value = replace(
    blocks.get("domain/Cargo.toml"),
    'edition = "2021"\n',
    "",
  );
  const dir = fixture({ "domain/Cargo.toml": value });
  assert.equal(
    metadata("1.99.1", dir).packages.find((pkg) => pkg.name === "note-domain")
      .edition,
    "2015",
  );
  write(
    dir,
    "domain/src/lib.rs",
    blocks.get("domain/src/lib.rs") + "\npub async fn probe() {}\n",
  );
  fails(run("1.99.1", dir, "check", "--workspace"), /E0670/);
});

test("resolver omesso nel workspace virtuale non eredita 2024 dai membri", () => {
  const dir = fixture({
    "Cargo.toml": replace(blocks.get("Cargo.toml"), 'resolver = "3"\n', ""),
  });
  const result = ok(
    command("cargo metadata --no-deps --format-version 1", "1.99.1", dir),
  );
  assert.match(result.stderr, /resolver.*1/s);
  const pkg = JSON.parse(result.stdout).packages.find(
    (pkg) => pkg.name === "edition-app",
  );
  assert.equal(pkg.edition, "2024");
});

test("edition inesistente e opzione Cargo build/check non valida sono rifiutate", () => {
  const dir = fixture({
    "app/Cargo.toml": replace(blocks.get("app/Cargo.toml"), '"2024"', '"2025"'),
  });
  fails(run("1.99.1", dir, "check"), /edition/);
  fails(
    run("1.99.1", fixture(), "check", "--edition=2024"),
    /unexpected argument/,
  );
});

test("async richiede edition 2018 o successiva, non coincide con la versione attiva", () => {
  const source = "pub async fn value() -> u32 { 42 }\n";
  matrix((version) => {
    fails(compile(version, "2015", source, true).result, /E0670/);
    for (const edition of ["2018", "2021", "2024"])
      ok(compile(version, edition, source, true).result);
  });
});

test("TryInto esiste in 2018 ma richiede import, dal 2021 e nel prelude", () => {
  const source =
    "fn main() { let value: u8 = 42_u16.try_into().unwrap(); assert_eq!(value, 42); }\n";
  matrix((version) => {
    fails(compile(version, "2018", source).result, /E0599/);
    execute(compile(version, "2018", "use std::convert::TryInto;\n" + source));
    for (const edition of ["2021", "2024"])
      execute(compile(version, edition, source));
  });
});

test("Future e IntoFuture nel prelude 2024, senza eseguire una future", () => {
  const source =
    "fn accept<F: Future<Output = u32>>(_: F) {}\nfn main() { accept(std::future::ready(42).into_future()); }\n";
  matrix((version) => {
    fails(compile(version, "2021", source).result, /E0405/);
    execute(
      compile(
        version,
        "2021",
        "use std::future::{Future, IntoFuture};\n" + source,
      ),
    );
    execute(compile(version, "2024", source));
  });
});

test("cattura disgiunta: move di un campo lascia disponibile l'altro dal 2021", () => {
  const source =
    'fn main() { let pair = (String::from("a"), String::from("b")); let take = move || pair.0; assert_eq!(pair.1, "b"); assert_eq!(take(), "a"); }\n';
  matrix((version) => {
    fails(compile(version, "2018", source).result, /E0382/);
    for (const edition of ["2021", "2024"])
      execute(compile(version, edition, source));
  });
});

test("array originale: comando 2018 riesce con warning e asserzioni passano", () => {
  matrix((version) => {
    const dir = standalone("array_probe.rs");
    const result = ok(
      command("rustc --edition=2018 array_probe.rs", version, dir),
    );
    assert.match(result.stderr, /array_into_iter/);
    ok(launch(path.join(dir, "array_probe" + suffix), [], dir));
  });
});

test("array originale: comando 2021 e compilazione 2024 rifiutano String come &String", () => {
  matrix((version) => {
    fails(
      command(
        "rustc --edition=2021 array_probe.rs",
        version,
        standalone("array_probe.rs"),
      ),
      /E0308/,
    );
    fails(
      compile(version, "2024", blocks.get("array_probe.rs")).result,
      /E0308/,
    );
  });
});

test("array.iter mantiene il prestito nelle tre edition", () => {
  const source = replace(
    blocks.get("array_probe.rs"),
    "words.into_iter()",
    "words.iter()",
  );
  matrix((version) => {
    for (const edition of ["2018", "2021", "2024"])
      execute(compile(version, edition, source));
  });
});

test("IntoIterator qualificato consuma l'array anche in edition 2018", () => {
  let source = replace(
    blocks.get("array_probe.rs"),
    "let first: &String",
    "let first: String",
  );
  source = replace(
    source,
    "words.into_iter()",
    "IntoIterator::into_iter(words)",
  );
  const reused = source;
  source = replace(source, '    assert_eq!(words[1], "Cargo");\n', "");
  matrix((version) => {
    for (const edition of ["2018", "2021", "2024"])
      execute(compile(version, edition, source));
    fails(compile(version, "2018", reused).result, /E0382/);
  });
});

test("compilazione fallita puo lasciare un vecchio eseguibile, che non viene eseguito", () => {
  const dir = standalone("array_probe.rs");
  ok(command("rustc --edition=2018 array_probe.rs", "1.99.1", dir));
  const executable = path.join(dir, "array_probe" + suffix);
  const digest = () =>
    createHash("sha256").update(fs.readFileSync(executable)).digest("hex");
  const before = digest();
  fails(command("rustc --edition=2021 array_probe.rs", "1.99.1", dir), /E0308/);
  assert.equal(digest(), before);
});

test("gen: comandi originali, valido 2021 e riservato 2024", () => {
  matrix((version) => {
    const dir = standalone("keyword_probe.rs");
    ok(command("rustc --edition=2021 keyword_probe.rs", version, dir));
    ok(launch(path.join(dir, "keyword_probe" + suffix), [], dir));
    fails(
      command("rustc --edition=2024 keyword_probe.rs", version, dir),
      /reserved keyword.*gen|expected identifier.*gen/s,
    );
  });
});

test("raw identifier conserva la funzione nelle tre edition", () => {
  const source = blocks.get("keyword_probe.rs").replaceAll("gen()", "r#gen()");
  matrix((version) => {
    for (const edition of ["2018", "2021", "2024"])
      execute(compile(version, edition, source));
  });
});

test("Drop: entrambi i comandi compilano ma l'ordine nel ramo else cambia", () => {
  matrix((version) => {
    for (const [edition, expected] of [
      ["2021", "else\ndrop\nend\n"],
      ["2024", "drop\nelse\nend\n"],
    ]) {
      const dir = standalone("drop_probe.rs");
      ok(
        command("rustc --edition=" + edition + " drop_probe.rs", version, dir),
      );
      assert.equal(
        ok(launch(path.join(dir, "drop_probe" + suffix), [], dir)).stdout,
        expected,
      );
    }
  });
});

test("Drop nel ramo Some: il temporaneo dura fino alla fine del ramo", () => {
  const source = replace(
    blocks.get("drop_probe.rs"),
    "        None",
    "        Some(7)",
  );
  matrix((version) => {
    for (const edition of ["2021", "2024"])
      assert.equal(
        execute(compile(version, edition, source)).stdout,
        "7\ndrop\nend\n",
      );
  });
});

test("match esplicito conserva il vecchio ordine del ramo fallito", () => {
  const source = replace(
    blocks.get("drop_probe.rs"),
    '    if let Some(value) = Guard.value() {\n        println!("{value}");\n    } else {\n        println!("else");\n    }',
    '    match Guard.value() {\n        Some(value) => println!("{value}"),\n        None => println!("else"),\n    }',
  );
  matrix((version) => {
    for (const edition of ["2021", "2024"])
      assert.equal(
        execute(compile(version, edition, source)).stdout,
        "else\ndrop\nend\n",
      );
  });
});

test("RPIT: lifetime catturato implicitamente nel 2024; use<> limita la cattura", () => {
  const source =
    'fn value(_: &str) -> impl std::fmt::Display { 42 }\nfn main() { let text = String::from("x"); let result = value(&text); drop(text); println!("{result}"); }\n';
  matrix((version) => {
    assert.equal(execute(compile(version, "2021", source)).stdout, "42\n");
    fails(compile(version, "2024", source).result, /E0505/);
    const precise = replace(
      source,
      "impl std::fmt::Display",
      "impl std::fmt::Display + use<>",
    );
    for (const edition of ["2021", "2024"])
      assert.equal(execute(compile(version, edition, precise)).stdout, "42\n");
  });
});

test("pattern: ref ridondante rifiutato nel 2024, binding implicito coerente", () => {
  const source =
    "fn main() { let [ref value] = &[42]; assert_eq!(*value, 42); }\n";
  matrix((version) => {
    execute(compile(version, "2021", source));
    fails(
      compile(version, "2024", source).result,
      /binding modifier|binding mode/,
    );
    execute(
      compile(version, "2024", replace(source, "[ref value]", "[value]")),
    );
  });
});

test("extern e attributi unsafe: sola compilazione metadata, nessuna chiamata FFI", () => {
  matrix((version) => {
    for (const [source, fixed, error] of [
      [
        'extern "C" {}\n',
        'unsafe extern "C" {}\n',
        /extern blocks must be unsafe/,
      ],
      [
        '#[no_mangle]\npub extern "C" fn appunti_unique_edition_probe() {}\n',
        '#[unsafe(no_mangle)]\npub extern "C" fn appunti_unique_edition_probe() {}\n',
        /unsafe attribute/,
      ],
    ]) {
      ok(compile(version, "2021", source, true).result);
      fails(compile(version, "2024", source, true).result, error);
      for (const edition of ["2021", "2024"])
        ok(compile(version, edition, fixed, true).result);
    }
  });
});

test("unsafe_op_in_unsafe_fn e warning di default, non errore obbligatorio", () => {
  const source = "pub unsafe fn read(p: *const u8) -> u8 { *p }\n";
  matrix((version) => {
    assert.doesNotMatch(
      ok(compile(version, "2021", source, true).result).stderr,
      /unsafe_op_in_unsafe_fn/,
    );
    assert.match(
      ok(compile(version, "2024", source, true).result).stderr,
      /unsafe_op_in_unsafe_fn/,
    );
    fails(
      compile(version, "2024", source, true, ["-D", "unsafe_op_in_unsafe_fn"])
        .result,
      /E0133/,
    );
    const fixed = replace(source, "{ *p }", "{ unsafe { *p } }");
    assert.doesNotMatch(
      ok(compile(version, "2024", fixed, true).result).stderr,
      /unsafe_op_in_unsafe_fn/,
    );
  });
});

test("macro expr: cambia il braccio scelto; expr_2021 conserva il precedente", () => {
  const source =
    'macro_rules! classify { ($e:expr) => { "expr" }; (const $e:expr) => { "const" }; }\nfn main() { println!("{}", classify!(const { 42 })); }\n';
  matrix((version) => {
    assert.equal(execute(compile(version, "2021", source)).stdout, "const\n");
    assert.equal(execute(compile(version, "2024", source)).stdout, "expr\n");
    assert.equal(
      execute(
        compile(version, "2024", source.replaceAll(":expr", ":expr_2021")),
      ).stdout,
      "const\n",
    );
  });
});

test("macro esportata: il matcher segue l'edition della definizione", () => {
  const macro =
    '\n#[macro_export]\nmacro_rules! classify { ($e:expr) => { "expr" }; (const $e:expr) => { "const" }; }\n';
  const dir = fixture({
    "legacy/src/lib.rs": blocks.get("legacy/src/lib.rs") + macro,
    "app/Cargo.toml":
      blocks.get("app/Cargo.toml") + '\nlegacy-text = { path = "../legacy" }\n',
    "app/src/main.rs":
      'fn main() { println!("{}", legacy_text::classify!(const { 42 })); }\n',
  });
  matrix((version) =>
    assert.equal(
      ok(run(version, dir, "run", "-p", "edition-app")).stdout,
      "const\n",
    ),
  );
});

test("cargo fix protegge un progetto senza VCS", () => {
  fails(
    command("cargo fix --edition -p legacy-text", "1.99.1", fixture()),
    /no VCS found|version control/i,
  );
});

test("migrazione reale in due tappe: sorgenti corretti, manifest mai cambiato da fix", () => {
  const extra =
    '\npub fn first_word() -> String {\n    let words = [String::from("Rust"), String::from("Cargo")];\n    words.into_iter().next().unwrap().clone()\n}\n\npub fn gen() -> u32 { 42 }\n';
  matrix((version) => {
    const dir = fixture({
      "legacy/src/lib.rs": blocks.get("legacy/src/lib.rs") + extra,
    });
    ok(run(version, dir, "check", "--workspace"));
    snapshot(dir, true);
    const oldManifest = read(dir, "legacy/Cargo.toml");
    ok(command("cargo fix --edition -p legacy-text", version, dir));
    assert.equal(read(dir, "legacy/Cargo.toml"), oldManifest);
    assert.match(read(dir, "legacy/src/lib.rs"), /words\.iter\(\)/);
    assert.match(read(dir, "legacy/src/lib.rs"), /fn gen\(\)/);
    write(dir, "legacy/Cargo.toml", replace(oldManifest, '"2018"', '"2021"'));
    assert.equal(passed(run(version, dir, "test", "--workspace")), 4);
    snapshot(dir);
    const intermediate = read(dir, "legacy/Cargo.toml");
    ok(command("cargo fix --edition -p legacy-text", version, dir));
    assert.equal(read(dir, "legacy/Cargo.toml"), intermediate);
    assert.match(read(dir, "legacy/src/lib.rs"), /fn r#gen\(\)/);
    write(dir, "legacy/Cargo.toml", replace(intermediate, '"2021"', '"2024"'));
    assert.equal(passed(run(version, dir, "test", "--workspace")), 4);
    assert.equal(
      ok(run(version, dir, "run", "-p", "edition-app")).stdout,
      "Nota: Rust\n",
    );
  });
});

test("cargo fix rifiuta modifiche non salvate nel repository temporaneo", () => {
  const dir = fixture();
  ok(run("1.99.1", dir, "check", "--workspace"));
  snapshot(dir, true);
  const changed = blocks.get("legacy/src/lib.rs") + "\npub fn extra() {}\n";
  write(dir, "legacy/src/lib.rs", changed);
  fails(
    command("cargo fix --edition -p legacy-text", "1.99.1", dir),
    /uncommitted changes|dirty/i,
  );
  assert.equal(read(dir, "legacy/src/lib.rs"), changed);
});

test("fix non migra doctest: il controllo serve dopo il cambio edition", () => {
  const dir = fixture({
    "legacy/Cargo.toml": replace(
      blocks.get("legacy/Cargo.toml"),
      '"2018"',
      '"2021"',
    ),
    "legacy/src/lib.rs": replace(
      blocks.get("legacy/src/lib.rs"),
      '/// assert_eq!(legacy_text::normalize(" Rust "), "Rust");',
      "/// fn gen() -> u32 { 42 }\n/// assert_eq!(gen(), 42);",
    ),
  });
  ok(run("1.99.1", dir, "check", "--workspace"));
  snapshot(dir, true);
  const old = read(dir, "legacy/src/lib.rs");
  ok(command("cargo fix --edition -p legacy-text", "1.99.1", dir));
  assert.equal(read(dir, "legacy/src/lib.rs"), old);
  write(
    dir,
    "legacy/Cargo.toml",
    replace(read(dir, "legacy/Cargo.toml"), '"2021"', '"2024"'),
  );
  ok(run("1.99.1", dir, "check", "--workspace", "--all-targets"));
  fails(
    run("1.99.1", dir, "test", "--doc", "-p", "legacy-text"),
    /gen.*reserved|reserved.*gen/s,
  );
  write(dir, "legacy/src/lib.rs", old.replaceAll("gen()", "r#gen()"));
  assert.equal(
    passed(run("1.99.1", dir, "test", "--doc", "-p", "legacy-text")),
    1,
  );
});

test("mixed-edition non autorizza cicli fra dipendenze normali", () => {
  const dir = fixture({
    "legacy/Cargo.toml":
      blocks.get("legacy/Cargo.toml") +
      '\n[dependencies]\nnote-domain={path="../domain"}\n',
  });
  fails(
    run("1.99.1", dir, "check", "--workspace"),
    /cyclic package dependency/,
  );
});

test("isolamento: nessuna cache registry, credenziale o configurazione Git globale usata", () => {
  assert.equal(env.CARGO_NET_OFFLINE, "true");
  assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
  assert.equal(env.GIT_CONFIG_GLOBAL, path.join(root, "empty-gitconfig"));
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "registry", "cache")));
  assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, "credentials.toml")));
});
