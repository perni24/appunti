import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const note = parseNote("Programmazione/Rust/Pagine/Hygiene.md");
const files = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = node.children[0].value;
  if (node.type === "code" && ["toml", "rust"].includes(node.lang)) {
    if (heading === "Una prova con tre nomi") heading = "examples/locals.rs";
    assert.ok(!files.has(heading));
    files.set(heading, node.value);
  }
}
assert.deepEqual(
  [...files.keys()],
  [
    "examples/locals.rs",
    "Cargo.toml",
    "rules/Cargo.toml",
    "rules/src/lib.rs",
    "spans/Cargo.toml",
    "spans/src/lib.rs",
    "src/main.rs",
  ],
);
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-hygiene-";
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
  ok(invoke("check", "--locked", "--all-targets"));
});
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
test("locali alla definizione, item alla chiamata e binding esposto", () => {
  assert.equal(
    ok(invoke("run", "--locked", "--quiet", "--example", "locals")).stdout,
    "",
  );
});
test("crate rinominata, omonimi e confronto dei due span", () => {
  assert.equal(ok(invoke("run", "--locked", "--quiet")).stdout, "");
});
function probe(code) {
  fs.writeFileSync(path.join(root, "examples/probe.rs"), code);
}
function fails(expected) {
  const r = invoke(
    "check",
    "--locked",
    "--example",
    "probe",
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
    errors.some((m) => m.code?.code === expected),
    r.stdout + r.stderr,
  );
}
test("span: nome diverso e invocazioni ripetute", () => {
  probe(`use hygiene_spans::{pair_call,pair_mixed}; fn main() {
    let other=10_u8;
    assert_eq!(pair_call!(other),(10,1)); assert_eq!(pair_mixed!(other),(10,1));
    for temp in [0_u8, 7, 255] {
      assert_eq!(pair_call!(temp),(1,1)); assert_eq!(pair_mixed!(temp),(temp,1));
    }
  }`);
  ok(invoke("run", "--locked", "--quiet", "--example", "probe"));
});
test("binding in blocco aggiuntivo: nome non piu accessibile", () => {
  probe(
    files
      .get("examples/locals.rs")
      .replace("=> { let $name = $value; };", "=> {{ let $name = $value; }};"),
  );
  fails("E0425");
});
test("due espansioni non condividono le loro temporanee", () => {
  probe(`fn main(){ macro_rules! step {
    (init) => { let temp=7; }; (read) => { temp };
  } step!(init); let _=step!(read); }`);
  fails("E0425");
});
test("gli item generati possono ancora collidere", () => {
  probe(`macro_rules! declare { () => { fn generated() {} }; }
    declare!(); declare!(); fn main() {}`);
  fails("E0428");
});
test("bail_if: messaggio lazy, condizione singola, return dalla closure", () => {
  probe(`fn main() {
    let (mut checks,mut messages,mut tails)=(0,0,0);
    for invalid in [false,true] {
      let r=(|| -> Result<u8,String> {
        kit::bail_if!({ checks+=1; invalid }, { messages+=1; "bad" });
        tails+=1; Ok(3)
      })();
      assert_eq!(r, if invalid { Err("bad".to_owned()) } else { Ok(3) });
    }
    assert_eq!((checks,messages,tails),(2,1,1));
  }`);
  ok(invoke("run", "--locked", "--quiet", "--example", "probe"));
});
test("$crate non rende pubblico un costruttore privato", () => {
  probe("fn main(){ let _=kit::make_value!(3); }");
  const name = "rules/src/lib.rs",
    file = path.join(root, name),
    original = files.get(name);
  try {
    fs.writeFileSync(file, original.replace("Value(pub u8)", "Value(u8)"));
    fails("E0603");
  } finally {
    fs.writeFileSync(file, original);
  }
});
test("crate invece di $crate risolve Value nel chiamante", () => {
  const name = "rules/src/lib.rs",
    file = path.join(root, name),
    original = files.get(name);
  probe(
    `struct Value(u8); fn main(){ let x: Value=kit::make_value!(5); assert_eq!(x.0,5); }`,
  );
  try {
    fs.writeFileSync(
      file,
      original.replace("$crate::Value($n)", "crate::Value($n)"),
    );
    ok(invoke("run", "--locked", "--quiet", "--example", "probe"));
  } finally {
    fs.writeFileSync(file, original);
  }
});
test("bail_if non rende compatibile un tipo di ritorno arbitrario", () => {
  probe('fn value() -> u8 { kit::bail_if!(true,"bad"); 1 } fn main() {}');
  fails("E0308");
});
