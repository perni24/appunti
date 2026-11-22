import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

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
const names = [
  "Pattern base",
  "Moduli crate e package",
  "Workspace",
  "Visibilita pub use e mod",
];
const notes = names.map((name) =>
  parseNote(`Programmazione/Rust/Pagine/${name}.md`),
);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  const result = new Map();
  let heading;
  for (const node of note.tree.children) {
    if (node.type === "heading") heading = text(node);
    if (node.type === "code" && ["rust", "toml"].includes(node.lang)) {
      assert.ok(heading);
      assert.ok(!result.has(heading));
      result.set(heading, node.value);
    }
  }
  return result;
});
const prefix = "appunti-rust-pattern-moduli-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = {
  ...process.env,
  RUSTC: rustc,
  RUSTDOC: rustdoc,
  RUST_BACKTRACE: "0",
  CARGO_HOME: path.join(root, "cargo-home"),
  CARGO_NET_OFFLINE: "true",
};
for (const key of [
  "RUSTFLAGS",
  "RUSTDOCFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "CARGO_ENCODED_RUSTDOCFLAGS",
  "CARGO_TARGET_DIR",
  "CARGO_BUILD_TARGET",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, name, code) {
  const target = path.resolve(dir, name);
  assert.ok(target.startsWith(path.resolve(root) + path.sep));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, code);
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading);
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function fixture(i, overrides = {}) {
  const dir = directory();
  for (const [name, code] of blocks[i]) {
    assert.match(name, /^(?:Cargo\.toml|[a-zA-Z0-9_/-]+\.(?:toml|rs))$/);
    if (overrides[name] !== null) write(dir, name, overrides[name] ?? code);
  }
  return dir;
}
function launch(exe, args, cwd = root) {
  const result = spawnSync(exe, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 90000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function failed(result, code) {
  assert.notEqual(result.status, 0);
  if (code) {
    const messages = (result.stdout + result.stderr)
      .split(/\r?\n/)
      .filter((line) => line.startsWith("{"))
      .map(JSON.parse)
      .map((entry) => (entry.message?.level ? entry.message : entry));
    assert.ok(
      messages.some((m) => m.level === "error" && m.code?.code === code),
      result.stdout + result.stderr,
    );
  }
  return result;
}
function compile(code, errorCode) {
  const dir = directory();
  write(dir, "main.rs", code);
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const result = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (errorCode) return failed(result, errorCode);
  ok(result);
  return ok(launch(output, [], dir));
}
function cargoCheck(dir, errorCode) {
  const result = launch(
    cargo,
    ["check", "--all-targets", "--message-format=json"],
    dir,
  );
  return errorCode ? failed(result, errorCode) : ok(result);
}
function passed(result) {
  ok(result);
  return [
    ...result.stdout.matchAll(/test result: ok\. (\d+) passed; 0 failed/g),
  ].reduce((sum, match) => sum + Number(match[1]), 0);
}
function metadata(dir) {
  return JSON.parse(
    ok(launch(cargo, ["metadata", "--no-deps", "--format-version", "1"], dir))
      .stdout,
  );
}

test("toolchain reale e inventario: sette esempi e tre progetti completi", () => {
  for (const exe of [rustc, cargo, rustdoc])
    assert.match(ok(launch(exe, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [7, 7, 5, 4],
  );
});
for (const [i, note] of notes.entries()) {
  test(`${names[i]}: metadati e gerarchia`, () => {
    assert.equal(note.data.type, "technical-note");
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Rust");
    assert.equal(String(note.data.date), "2026-05-20");
    const headings = note.tree.children.filter((n) => n.type === "heading");
    assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
      note.data.title,
    ]);
    for (const h of [
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
        headings.some((n) => text(n) === h),
        h,
      );
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
for (const [heading, code] of blocks[0]) {
  test(`Pattern originale: ${heading}`, () => {
    if (heading === "Pattern refutabile in un normale let")
      compile(code, "E0005");
    else assert.equal(compile(code).stdout, "");
  });
}
test("range e alternative: estremi esclusi e inclusi", () => {
  compile(
    replaceOnce(
      source(0, "Letterali, alternative e range"),
      "fn main() {",
      `fn main() {
    for x in [1, 2] { assert_eq!(category(x), "piccolo"); }
    for x in [3, 4, 5] { assert_eq!(category(x), "medio"); }
    for x in [i32::MIN, -1, 6, i32::MAX] { assert_eq!(category(x), "altro"); }`,
    ),
  );
});
test("match per valore sposta la String", () => {
  let code = replaceOnce(
    source(0, "Un solo caso con if let"),
    "= &name",
    "= name",
  );
  code = replaceOnce(
    code,
    "let borrowed: &String = text;",
    "let borrowed: &String = &text;",
  );
  compile(code, "E0382");
});
test("underscore con nome e un binding che sposta", () => {
  compile(
    replaceOnce(
      source(0, "Wildcard e nome con underscore"),
      'assert_eq!(_owned, "Ada");',
      'assert_eq!(name, "Ada");',
    ),
    "E0382",
  );
});
test("un binding nel pattern nasconde il parametro invece di confrontarlo", () => {
  let code = replaceOnce(
    source(0, "Binding nuovo o confronto con un valore esistente"),
    "Some(actual) if actual == expected",
    "Some(expected)",
  );
  code = replaceOnce(
    code,
    "assert!(!matches_expected(Some(9), 4));",
    "assert!(matches_expected(Some(9), 4));",
  );
  compile(code);
});
test("let else corregge il pattern refutabile", () => {
  const code = replaceOnce(
    source(0, "Pattern refutabile in un normale let"),
    "let Some(number) = value;",
    "let Some(number) = value else { return; };",
  );
  assert.equal(compile(code).stdout.trim(), "7");
  assert.equal(
    compile(
      replaceOnce(
        code,
        "let value = Some(7);",
        "let value: Option<i32> = None;",
      ),
    ).stdout,
    "",
  );
});
test("let else senza divergenza non compila", () => {
  compile(
    replaceOnce(
      source(0, "Pattern refutabile in un normale let"),
      "let Some(number) = value;",
      'let Some(number) = value else { println!("missing"); };',
    ),
    "E0308",
  );
});
test("parametro e for richiedono pattern irrefutabili", () => {
  compile("fn f(Some(x): Option<i32>) {} fn main() {}", "E0005");
  compile("fn main() { for Some(x) in [Some(1), None] {} }", "E0005");
});
test("ref ridondante vietato con binding inferito in edition 2024", () => {
  const dir = directory();
  write(
    dir,
    "main.rs",
    replaceOnce(
      source(0, "Un solo caso con if let"),
      "Some(text)",
      "Some(ref text)",
    ),
  );
  const result = failed(
    launch(rustc, ["--edition=2024", "--emit=metadata", "main.rs"], dir),
  );
  assert.match(result.stderr, /explicit `ref` binding modifier not allowed/);
});

test("package originale: check, integration test e binario", () => {
  const dir = fixture(1);
  cargoCheck(dir);
  assert.equal(passed(launch(cargo, ["test"], dir)), 1);
  assert.equal(
    ok(
      launch(cargo, ["run", "--quiet", "--bin", "note-app"], dir),
    ).stdout.trim(),
    'Some("Ada")',
  );
  const data = metadata(dir);
  assert.equal(data.packages.length, 1);
  const targets = data.packages[0].targets;
  assert.deepEqual(targets.map((t) => [t.name, t.kind[0]]).sort(), [
    ["note-app", "bin"],
    ["note_app", "lib"],
    ["public_api", "test"],
  ]);
});
test("modulo dichiarato ma file assente", () => {
  cargoCheck(fixture(1, { "src/users.rs": null }), "E0583");
});
test("file presente senza dichiarazione mod non viene importato", () => {
  cargoCheck(
    fixture(1, {
      "src/lib.rs": replaceOnce(source(1, "src/lib.rs"), "pub mod users;", ""),
    }),
    "E0432",
  );
});
test("due layout contemporanei sono ambigui", () => {
  const dir = fixture(1);
  write(dir, "src/users/mod.rs", source(1, "src/users.rs"));
  cargoCheck(dir, "E0761");
});
test("layout users/mod.rs usa lo stesso percorso per il figlio", () => {
  const dir = fixture(1, { "src/users.rs": null });
  write(dir, "src/users/mod.rs", source(1, "src/users.rs"));
  assert.equal(passed(launch(cargo, ["test"], dir)), 1);
});
test("crate nel binario non indica la libreria del package", () => {
  cargoCheck(
    fixture(1, {
      "src/main.rs": replaceOnce(
        source(1, "src/main.rs"),
        "note_app::",
        "crate::",
      ),
    }),
    "E0432",
  );
});
test("repository privato non e API esterna", () => {
  cargoCheck(
    fixture(1, {
      "src/main.rs": "fn main() { note_app::users::repository::find_user(7); }",
    }),
    "E0603",
  );
});
test("pub(crate) non e accessibile dal binario dello stesso package", () => {
  cargoCheck(
    fixture(1, {
      "src/lib.rs": replaceOnce(
        source(1, "src/lib.rs"),
        "mod config;",
        "pub mod config;",
      ),
      "src/main.rs": "fn main() { let _ = note_app::config::DEFAULT_USER_ID; }",
    }),
    "E0603",
  );
});

test("workspace originale: tutti i comandi e metadata ereditati", () => {
  const dir = fixture(2);
  ok(launch(cargo, ["check", "--workspace", "--all-targets"], dir));
  assert.equal(passed(launch(cargo, ["test", "--workspace"], dir)), 1);
  ok(launch(cargo, ["check", "-p", "note-core"], dir));
  assert.equal(
    ok(launch(cargo, ["run", "-p", "note-cli", "--quiet"], dir)).stdout.trim(),
    "Some(42)",
  );
  const data = metadata(dir);
  assert.equal(data.packages.length, 2);
  assert.equal(data.workspace_members.length, 2);
  const cli = data.packages.find((p) => p.name === "note-cli");
  assert.deepEqual(data.workspace_default_members, [cli.id]);
  for (const pkg of data.packages) {
    assert.equal(pkg.edition, "2024");
    assert.equal(pkg.version, "0.1.0");
    assert.deepEqual(pkg.publish, []);
  }
  assert.equal(path.resolve(data.target_directory), path.join(dir, "target"));
  assert.ok(fs.existsSync(path.join(dir, "Cargo.lock")));
  assert.equal(
    fs.existsSync(path.join(dir, "crates/note-core/Cargo.lock")),
    false,
  );
  assert.equal(
    path.resolve(cli.dependencies[0].path),
    path.join(dir, "crates/note-core"),
  );
});
test("default-members non esegue gli unit test della dipendenza", () => {
  const dir = fixture(2);
  assert.equal(passed(launch(cargo, ["test"], dir)), 0);
  assert.equal(passed(launch(cargo, ["test", "--workspace"], dir)), 1);
  write(
    dir,
    "crates/note-core/src/lib.rs",
    replaceOnce(
      source(2, "crates/note-core/src/lib.rs"),
      "Some(42)",
      "Some(99)",
    ),
  );
  assert.equal(passed(launch(cargo, ["test"], dir)), 0);
  assert.match(
    failed(launch(cargo, ["test", "--workspace"], dir)).stdout,
    /FAILED/,
  );
});
test("workspace virtuale senza default-members seleziona tutti i membri", () => {
  const dir = fixture(2, {
    "Cargo.toml": replaceOnce(
      source(2, "Cargo.toml"),
      'default-members = ["tools/note-cli"]',
      "",
    ),
  });
  assert.equal(passed(launch(cargo, ["test"], dir)), 1);
  const data = metadata(dir);
  assert.deepEqual(
    [...data.workspace_default_members].sort(),
    [...data.workspace_members].sort(),
  );
});
test("esecuzione dalla directory membro conserva la root condivisa", () => {
  const dir = fixture(2);
  const member = path.join(dir, "crates/note-core");
  assert.equal(passed(launch(cargo, ["test"], member)), 1);
  assert.equal(path.resolve(metadata(member).workspace_root), dir);
});
test("workspace.dependencies non aggiunge dipendenze ai membri", () => {
  const dir = fixture(2, {
    "tools/note-cli/Cargo.toml": replaceOnce(
      source(2, "tools/note-cli/Cargo.toml"),
      "note-core.workspace = true",
      "",
    ),
  });
  cargoCheck(dir, "E0433");
});
test("path diretto del membro e relativo al suo Cargo.toml", () => {
  const dir = fixture(2, {
    "tools/note-cli/Cargo.toml": replaceOnce(
      source(2, "tools/note-cli/Cargo.toml"),
      "note-core.workspace = true",
      'note-core = { path = "../../crates/note-core" }',
    ),
  });
  assert.equal(
    ok(launch(cargo, ["run", "-p", "note-cli", "--quiet"], dir)).stdout.trim(),
    "Some(42)",
  );
});
test("resolver 2 resta valido: non e un errore di sintassi", () => {
  cargoCheck(
    fixture(2, {
      "Cargo.toml": replaceOnce(
        source(2, "Cargo.toml"),
        'resolver = "3"',
        'resolver = "2"',
      ),
    }),
  );
});

test("visibilita originale: re-export, alias e getter", () => {
  const dir = fixture(3);
  cargoCheck(dir);
  assert.equal(
    ok(launch(cargo, ["run", "--quiet"], dir)).stdout.trim(),
    "ID: 9",
  );
});
for (const [title, main, code] of [
  [
    "campo privato non leggibile",
    "fn main() { let u = public_api_demo::User::new(7, String::new()); let _ = u.email; }",
    "E0616",
  ],
  [
    "campo privato non scrivibile",
    "fn main() { let mut u = public_api_demo::User::new(7, String::new()); u.email = String::new(); }",
    "E0616",
  ],
  [
    "literal esterno vietato con campo privato",
    "fn main() { let _ = public_api_demo::User { id: 7, email: String::new() }; }",
    "E0451",
  ],
  [
    "modulo di implementazione resta privato",
    "use public_api_demo::users::User; fn main() {}",
    "E0603",
  ],
]) {
  test(title, () => cargoCheck(fixture(3, { "src/main.rs": main }), code));
}
test("pub struct non rende automaticamente pubblici i metodi", () => {
  cargoCheck(
    fixture(3, {
      "src/users.rs": replaceOnce(
        source(3, "src/users.rs"),
        "pub fn new",
        "fn new",
      ),
    }),
    "E0624",
  );
});
test("re-export non puo rendere pubblico un tipo pub(crate)", () => {
  cargoCheck(
    fixture(3, {
      "src/users.rs": replaceOnce(
        source(3, "src/users.rs"),
        "pub struct",
        "pub(crate) struct",
      ),
    }),
    "E0365",
  );
});
test("alias e tipo originale sono assegnabili senza conversione", () => {
  const main = replaceOnce(
    source(3, "src/main.rs"),
    'println!("ID: {}", account.id);',
    "let original: public_api_demo::User = account; assert_eq!(original.id, 9);",
  );
  assert.equal(
    ok(launch(cargo, ["run", "--quiet"], fixture(3, { "src/main.rs": main })))
      .stdout,
    "",
  );
});
test("pub(in) deve indicare un antenato, non un fratello", () => {
  compile(
    "mod left {} mod right { pub(in crate::left) fn f() {} } fn main() {}",
    "E0742",
  );
});
test("privato accessibile ai discendenti ma non al genitore", () => {
  compile(
    "mod parent { fn secret() -> u8 { 7 } pub mod child { pub fn value() -> u8 { super::secret() } } } fn main() { assert_eq!(parent::child::value(), 7); }",
  );
  compile(
    "mod parent { fn secret() {} } fn main() { parent::secret(); }",
    "E0603",
  );
});
test("scope pub(in) comprende i discendenti dell'antenato", () => {
  compile(
    "mod domain { pub mod internal { pub(in crate::domain) fn value() -> u8 { 7 } } pub mod consumer { pub fn value() -> u8 { super::internal::value() } } } fn main() { assert_eq!(domain::consumer::value(), 7); }",
  );
  compile(
    "mod domain { pub mod internal { pub(in crate::domain) fn value() {} } } fn main() { domain::internal::value(); }",
    "E0603",
  );
});
test("use e glob non ereditano nomi e non aggirano la privacy", () => {
  compile(
    "use std::collections::HashMap; mod child { fn f() { let _: HashMap<u8, u8> = HashMap::new(); } } fn main() {}",
    "E0425",
  );
  compile(
    "use std::collections::HashMap; mod child { pub fn f() { let _: super::HashMap<u8, u8> = super::HashMap::new(); } } fn main() { child::f(); }",
  );
  compile(
    "mod hidden { fn private() {} } use hidden::*; fn main() { private(); }",
    "E0425",
  );
});
test("varianti di enum pubblico accessibili senza pub aggiuntivo", () => {
  compile(
    "mod domain { pub enum Status { Ready, Waiting } } fn main() { assert!(matches!(domain::Status::Ready, domain::Status::Ready)); }",
  );
});
