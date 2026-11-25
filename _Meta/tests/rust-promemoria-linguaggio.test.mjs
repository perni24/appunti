import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const pages = [
  ["Sintassi essenziale", 7],
  ["Funzioni e closure", 4],
  ["Ownership e borrowing", 3],
  ["Stringhe e slice", 5],
  ["Collezioni", 5],
  ["Struct enum e pattern matching", 5],
  ["Option Result e errori", 4],
  ["Iteratori", 7],
  ["Generics e trait", 5],
  ["Lifetime", 5],
  ["Smart pointer", 5],
];
const source = (name) =>
  parseNote("Programmazione/Rust/Promemoria/Pagine/Rust - " + name + ".md")
    .tree.children.filter((n) => n.type === "code" && n.lang === "rust")
    .map((n) => n.value);
const parent = fs.realpathSync(os.tmpdir());
const suffix = process.platform === "win32" ? ".exe" : "";
let dir;
before(() => {
  dir = fs.mkdtempSync(path.join(parent, "vault-rs-memo-"));
});
after(() => {
  if (!dir) return;
  assert.equal(path.dirname(fs.realpathSync(dir)), parent);
  assert.ok(path.basename(dir).startsWith("vault-rs-memo-"));
  fs.rmSync(dir, { recursive: true, maxRetries: 3 });
});
function run(file, args, status = 0) {
  const r = spawnSync(file, args, {
    cwd: dir,
    windowsHide: true,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, status, r.stdout + r.stderr);
  return r;
}
function compile(name, code, args = [], status = 0) {
  fs.writeFileSync(path.join(dir, name + ".rs"), code);
  return run(
    "rustc",
    [
      "--edition=2024",
      "-Dwarnings",
      ...args,
      name + ".rs",
      "-o",
      name + suffix,
    ],
    status,
  );
}

for (const [i, [name, expected]] of pages.entries()) {
  test(
    name + ": ogni snippet compila ed esegue in uno scope indipendente",
    () => {
      const snippets = source(name);
      assert.equal(snippets.length, expected);
      const bin = "page" + i;
      const tests = snippets
        .map((block, j) => {
          if (block.startsWith("fn main()")) {
            compile("complete_main", block);
            assert.equal(
              run(path.join(dir, "complete_main" + suffix), []).stdout.trim(),
              "id=42",
            );
            return "";
          }
          return "#[test]\nfn snippet_" + j + "() {\n" + block + "\n}";
        })
        .filter(Boolean);
      compile(bin, tests.join("\n"), ["--test"]);
      const out = run(path.join(dir, bin + suffix), [
        "--test-threads=1",
      ]).stdout;
      assert.ok(out.includes(tests.length + " passed; 0 failed"), out);
    },
  );
}

function rejects(page, marker, change, code) {
  const blocks = source(page).filter((s) => s.includes(marker));
  assert.equal(blocks.length, 1);
  const broken = change(blocks[0]);
  assert.notEqual(broken, blocks[0]);
  const r = compile(
    "invalid",
    "fn main() {\n" + broken + "\n}",
    ["--error-format=json"],
    1,
  );
  const errors = r.stderr
    .trim()
    .split(/\r?\n/)
    .map((s) => JSON.parse(s));
  assert.ok(
    errors.some((m) => m.level === "error" && m.code?.code === code),
    r.stderr,
  );
}
test("Una riassegnazione richiede mut; un secondo let non la richiede", () => {
  rejects(
    "Sintassi essenziale",
    "const MAX_ITEMS",
    (s) => s.replace("let mut count", "let count"),
    "E0384",
  );
});
test("Riusare il ricevitore dopo into_name è diverso da richiamare una closure move che legge", () => {
  rejects(
    "Funzioni e closure",
    "fn into_name",
    (s) => s + '\nprintln!("{}", user.name());',
    "E0382",
  );
});
test("Un prestito condiviso usato dopo la modifica impedisce il prestito esclusivo", () => {
  rejects(
    "Ownership e borrowing",
    "fn add_dot",
    (s) => s + '\nprintln!("{view}");',
    "E0502",
  );
});
test("into_iter su Vec consuma il proprietario", () => {
  rejects(
    "Iteratori",
    "let mut names =",
    (s) => s + "\nlet _ = names.len();",
    "E0382",
  );
});
test("Il confronto generico richiede PartialEq", () => {
  rejects(
    "Generics e trait",
    "struct Pair",
    (s) => s.replace("where\n    T: PartialEq,", ""),
    "E0369",
  );
});
test("Un lifetime statico non salva il riferimento alla String locale", () => {
  rejects(
    "Lifetime",
    "fn make_title",
    (s) =>
      s.replace(
        '-> String { String::from("Guida") }',
        '-> &\'static str { let text = String::from("Guida"); &text }',
      ),
    "E0515",
  );
});
test("Arc non rende RefCell condivisibile tra thread", () => {
  rejects(
    "Smart pointer",
    "let text = Arc::new",
    (s) =>
      s
        .replace(
          'Arc::new(String::from("Guida"))',
          'Arc::new(std::cell::RefCell::new(String::from("Guida")))',
        )
        .replace("reader.len()", "reader.borrow().len()")
        .replace("text.as_str()", "text.borrow().as_str()"),
    "E0277",
  );
});
