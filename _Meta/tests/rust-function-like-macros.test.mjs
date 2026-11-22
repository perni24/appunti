import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const note = parseNote("Programmazione/Rust/Pagine/Function-like macros.md");
const files = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = node.children[0].value;
  if (node.type === "code" && ["toml", "rust"].includes(node.lang)) {
    assert.ok(!files.has(heading));
    files.set(heading, node.value);
  }
}
assert.deepEqual(
  [...files.keys()],
  ["Cargo.toml", "src/lib.rs", "examples/query.rs", "examples/maps.rs"],
);
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-function-like-";
const root = fs.mkdtempSync(path.join(parent, prefix));
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const cargo = path.isAbsolute(rustc)
  ? path.join(
      path.dirname(rustc),
      process.platform === "win32" ? "cargo.exe" : "cargo",
    )
  : "cargo";
const env = { ...process.env };
for (const key of Object.keys(env))
  if (/^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_)/i.test(key)) delete env[key];
Object.assign(env, {
  RUSTC: rustc,
  CARGO_HOME:
    process.env.RUST_PROC_TEST_CARGO_HOME || path.join(root, "cargo-home"),
  CARGO_TARGET_DIR: path.join(root, "target"),
  CARGO_NET_OFFLINE: "true",
});
if (process.env.RUST_PROC_TEST_TOOLS_BIN) {
  const key =
    Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
  env[key] = process.env.RUST_PROC_TEST_TOOLS_BIN + path.delimiter + env[key];
}
function invoke(...args) {
  const r = spawnSync(cargo, [...args, "--offline"], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 180000,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}
function ok(r) {
  assert.equal(r.status, 0, r.stderr + r.stdout);
  return r;
}
before(() => {
  for (const name of ["config", "config.toml"]) {
    assert.ok(!fs.existsSync(path.join(env.CARGO_HOME, name)));
    for (let dir = root; ; dir = path.dirname(dir)) {
      assert.ok(!fs.existsSync(path.join(dir, ".cargo", name)));
      if (dir === path.dirname(dir)) break;
    }
  }
  for (const [name, code] of files) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, code);
  }
  ok(invoke("generate-lockfile"));
  ok(invoke("check", "--locked", "--examples"));
});
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
for (const name of ["query", "maps"])
  test("esempio eseguito dal Markdown: " + name, () =>
    assert.equal(
      ok(invoke("run", "--quiet", "--locked", "--example", name)).stdout,
      "",
    ),
  );
const mapRules = files.get("examples/maps.rs").split("fn main() {")[0];
const caller = (body) => "use query_note::sql; fn main() { " + body + " }";
const probe = (code) =>
  fs.writeFileSync(path.join(root, "examples/probe.rs"), code);
test("hashmap: ordine chiave/valore e move di una String non Copy", () => {
  probe(
    mapRules +
      `fn main() {
    let mut seq=Vec::new();
    let moved=String::from("one");
    let m=hashmap!(
      {seq.push(1); "a"} => {seq.push(2); moved},
      {seq.push(3); "b"} => {seq.push(4); String::from("two")},
    );
    assert_eq!(seq,[1,2,3,4]); assert_eq!(m["a"],"one");
  }`,
  );
  ok(invoke("run", "--quiet", "--locked", "--example", "probe"));
});
for (const [name, code, error] of [
  [
    "colonna ripetuta",
    caller("let _ = sql!(SELECT id, id FROM t);"),
    /duplicate column/,
  ],
  [
    "token finali",
    caller("let _ = sql!(SELECT * FROM t WHERE active);"),
    /unexpected tokens after table name/,
  ],
  [
    "terminatore interno",
    caller("let _ = sql!(SELECT * FROM t;);"),
    /unexpected tokens after table name/,
  ],
  [
    "input come stringa",
    caller('let _ = sql!("SELECT * FROM t");'),
    /expected.*SELECT/,
  ],
  ["input vuoto", caller("let _ = sql!();"), /expected.*SELECT/],
  [
    "keyword minuscola",
    caller("let _ = sql!(select * FROM t);"),
    /expected.*SELECT/,
  ],
  [
    "virgola prima di FROM",
    caller("let _ = sql!(SELECT id, FROM t);"),
    /expected a lowercase ASCII name/,
  ],
  [
    "tabella con prefisso raw",
    caller("let _ = sql!(SELECT * FROM r#type);"),
    /expected a lowercase ASCII name/,
  ],
  [
    "colonne e wildcard insieme",
    caller("let _ = sql!(SELECT *, id FROM t);"),
    /expected.*FROM/,
  ],
  [
    "literal incompatibile col tipo atteso",
    caller("let _: u32 = sql!(SELECT * FROM t);"),
    "E0308",
  ],
  [
    "virgola isolata",
    mapRules + "fn main(){ let _: HashMap<u8,u8> = hashmap!(,); }",
    /no rules expected/,
  ],
  [
    "mappa senza contesto",
    mapRules + "fn main(){ let m = hashmap!(); }",
    "E0282",
  ],
])
  test(name, () => {
    probe(code);
    const r = invoke(
      "check",
      "--example",
      "probe",
      "--locked",
      "--message-format=json",
    );
    assert.notEqual(r.status, 0);
    const errors = r.stdout
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map(JSON.parse)
      .filter(
        (m) => m.reason === "compiler-message" && m.message.level === "error",
      )
      .map((m) => m.message);
    assert.ok(
      errors.some(
        (m) =>
          (typeof error === "string"
            ? m.code?.code === error
            : error.test(m.message)) &&
          m.spans.some(
            (s) =>
              s.is_primary &&
              s.file_name.replaceAll("\\", "/").endsWith("examples/probe.rs"),
          ),
      ),
      r.stdout + r.stderr,
    );
  });
