import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Newtype pattern.md";
const originalBytes = fs.readFileSync(file);
const note = parseNote(file);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type === "code" && node.lang === "rust") {
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, node.value);
  }
}
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-newtype-pattern-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  try {
    assert.deepEqual(fs.readFileSync(file), originalBytes);
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of [
  "RUSTFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
function launch(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
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
let sequence = 0;
function run(code, options = {}) {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const compiled = launch(
    rustc,
    [
      "--edition=" + (options.edition || "2024"),
      "--crate-name",
      "note_example",
      "--error-format=json",
      ...(options.rustcArgs || []),
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error || options.message) {
    assert.notEqual(compiled.status, 0);
    const errors = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      errors.some(
        (d) =>
          d.level === "error" &&
          (options.error
            ? d.code?.code === options.error
            : options.message.test(d.message)),
      ),
      compiled.stderr,
    );
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, options.cliArgs || [], dir);
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
  return execution.stdout.replaceAll("\r\n", "\n");
}
function from(title) {
  assert.ok(blocks.has(title), title);
  return blocks.get(title);
}
function replace(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}

const ids = "Identificatori di dominio";
const nonempty = "Stringa non vuota con aggiornamento validato";
const temperatures = "Temperature intere senza troncamento silenzioso";
const display = "Trait esterno su wrapper locale";
const layout = "Layout esplicito con repr transparent";
const mix = "Confondere due identificatori";
const orphan = "Implementare un trait esterno su un tipo esterno";
const privacy = "Saltare il confine del modulo";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}
test("baseline reale e otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
});
test("frontmatter invariato, struttura e fonti", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Newtype pattern",
  ]);
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
    "Navigazione",
  ]) {
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  }
  const table = note.tree.children.find(
    (n) => n.type === "paragraph" && text(n).startsWith("| Scelta |"),
  );
  assert.ok(table);
  assert.equal(text(table).split("\n").length, 7);
  for (const row of text(table).split("\n"))
    assert.equal(row.split("|").length, 4);
  for (const url of [
    "https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence",
    "https://doc.rust-lang.org/reference/type-layout.html#the-transparent-representation",
    "https://doc.rust-lang.org/std/convert/trait.TryFrom.html",
    "https://doc.rust-lang.org/std/ops/trait.Deref.html",
  ])
    assert.ok(originalBytes.toString().includes(url));
  for (const code of blocks.values())
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
});
for (const title of [ids, nonempty, temperatures, display, layout]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [mix, "E0308"],
  [orphan, "E0117"],
  [privacy, "E0603"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}
test("ID: limiti, Copy Clone Eq Hash e Debug", () => {
  run(
    main(
      ids,
      'use std::collections::HashSet; for number in [0, 42, u64::MAX] { let id = UserId::new(number); let copied = id; let cloned = id.clone(); let mut set = HashSet::new(); set.insert(id); set.insert(copied); assert!(set.contains(&cloned)); assert_eq!(set.len(), 1); assert_eq!(cloned.get(), number); assert_eq!(format!("{id:?}"), format!("UserId({number})")); }',
    ),
  );
});
test("ID: API reale rifiuta OrderId", () => {
  run(
    main(ids, "let order = ids::OrderId::new(42); let _ = user_number(order);"),
    { error: "E0308" },
  );
});
test("ID: nessuna conversione implicita verso u64", () => {
  run(main(ids, "let _number: u64 = UserId::new(42);"), { error: "E0308" });
});
test("ID: alias non distingue il dominio", () => {
  run(
    "type UserId = u64; type OrderId = u64; fn load_user(id: UserId) -> u64 { id } fn main() { let order: OrderId = 42; assert_eq!(load_user(order), 42); }",
  );
});
test("NonEmptyString: vuoto rifiutato, spazi NUL e Unicode ammessi", () => {
  run(
    main(
      nonempty,
      'assert_eq!(NonEmptyString::try_from(String::new()), Err(EmptyStringError)); for input in [" ", "\\n", "\\0", "\\u{e8}", "\\u{200b}", "text"] { let value = NonEmptyString::try_from(input.to_owned()).unwrap(); assert_eq!(value.as_str(), input); }',
    ),
  );
});
test("NonEmptyString: successo conserva buffer e capacita", () => {
  run(
    main(
      nonempty,
      'let input = String::from("abc"); let ptr = input.as_ptr(); let capacity = input.capacity(); let value = NonEmptyString::try_from(input).unwrap(); assert_eq!(value.as_str().as_ptr(), ptr); let input = value.into_inner(); assert_eq!(input.as_ptr(), ptr); assert_eq!(input.capacity(), capacity);',
    ),
  );
});
test("NonEmptyString: rifiuto di aggiornamento mantiene buffer e valore", () => {
  run(
    main(
      nonempty,
      'let mut value = NonEmptyString::try_from("old".to_owned()).unwrap(); let pointer = value.as_str().as_ptr(); for _ in 0..3 { assert_eq!(value.try_replace(String::new()), Err(EmptyStringError)); assert_eq!(value.as_str(), "old"); assert_eq!(value.as_str().as_ptr(), pointer); } value.try_replace("new".to_owned()).unwrap(); assert_eq!(value.as_str(), "new");',
    ),
  );
});
test("NonEmptyString: Clone indipendente e conversione TryInto", () => {
  run(
    main(
      nonempty,
      'let value: NonEmptyString = String::from("old").try_into().unwrap(); let mut cloned = value.clone(); cloned.try_replace("new".to_owned()).unwrap(); assert_eq!(value.as_str(), "old"); assert_eq!(cloned.as_str(), "new");',
    ),
  );
});
test("NonEmptyString: AsRef esplicito anche in funzione generica", () => {
  run(
    main(
      nonempty,
      'fn byte_len<T: AsRef<str>>(value: T) -> usize { value.as_ref().len() } let value = NonEmptyString::try_from("\\u{e8}".to_owned()).unwrap(); assert_eq!(byte_len(&value), 2); assert_eq!(value.as_str().chars().count(), 1);',
    ),
  );
});
test("NonEmptyString: AsRef non fornisce deref coercion", () => {
  run(
    main(
      nonempty,
      'fn view(_: &str) {} let value = NonEmptyString::try_from("abc".to_owned()).unwrap(); view(&value);',
    ),
    { error: "E0308" },
  );
});
test("NonEmptyString: nessun metodo clear ereditato", () => {
  run(
    main(
      nonempty,
      'let mut value = NonEmptyString::try_from("abc".to_owned()).unwrap(); value.clear();',
    ),
    { error: "E0599" },
  );
});
test("NonEmptyString: campo privato", () => {
  run(main(nonempty, "let _ = text::NonEmptyString(String::new());"), {
    error: "E0603",
  });
});
test("NonEmptyString: non implementa Default", () => {
  run(main(nonempty, "let _ = NonEmptyString::default();"), { error: "E0599" });
});
test("NonEmptyString: aggiungere derive Default viola la policy", () => {
  run(
    replace(
      main(
        nonempty,
        "let invalid = NonEmptyString::default(); assert!(invalid.as_str().is_empty());",
      ),
      "#[derive(Debug, Clone, PartialEq, Eq)]",
      "#[derive(Debug, Clone, PartialEq, Eq, Default)]",
    ),
  );
});
test("NonEmptyString: vista condivisa non mutabile", () => {
  run(
    main(
      nonempty,
      'let value = NonEmptyString::try_from("abc".to_owned()).unwrap(); value.as_str().make_ascii_uppercase();',
    ),
    { error: "E0596" },
  );
});
test("NonEmptyString: into_inner consuma il wrapper", () => {
  run(
    main(
      nonempty,
      'let value = NonEmptyString::try_from("abc".to_owned()).unwrap(); let _text = value.into_inner(); let _ = value.as_str();',
    ),
    { error: "E0382" },
  );
});
test("NonEmptyString: String estratta puo diventare vuota", () => {
  run(
    main(
      nonempty,
      'let value = NonEmptyString::try_from("abc".to_owned()).unwrap(); let mut text = value.into_inner(); text.clear(); assert!(text.is_empty());',
    ),
  );
});
test("NonEmptyString: introdurre From causa conflitto con TryFrom", () => {
  run(
    main(
      nonempty,
      "impl From<String> for NonEmptyString { fn from(s: String) -> Self { NonEmptyString::try_from(s).unwrap() } }",
    ),
    { error: "E0119" },
  );
});
test("NonEmptyString: getter mutabile puo violare il contratto", () => {
  run(
    replace(
      main(
        nonempty,
        'let mut value = NonEmptyString::try_from("abc".to_owned()).unwrap(); value.as_mut_string().clear(); assert!(value.as_str().is_empty());',
      ),
      "pub fn as_str(&self) -> &str {",
      "pub fn as_mut_string(&mut self) -> &mut String { &mut self.0 }\n        pub fn as_str(&self) -> &str {",
    ),
  );
});
test("temperature: esempi esatti positivi negativi e zero", () => {
  run(
    main(
      temperatures,
      "for (c, f) in [(0,32), (100,212), (-40,-40), (-5,23), (5,41), (-300,-508)] { assert_eq!(Fahrenheit::try_from(Celsius::new(c)).unwrap().get(), f); }",
    ),
  );
});
test("temperature: frazioni rifiutate anche per input negativi", () => {
  run(
    main(
      temperatures,
      "for c in [-4,-3,-2,-1,1,2,3,4,i32::MIN,i32::MAX] { assert_eq!(Fahrenheit::try_from(Celsius::new(c)), Err(ConversionError::FractionalDegree)); }",
    ),
  );
});
test("temperature: overflow del risultato in entrambe le direzioni", () => {
  run(
    main(
      temperatures,
      "for c in [-2_000_000_000, 2_000_000_000] { assert_eq!(Fahrenheit::try_from(Celsius::new(c)), Err(ConversionError::OutOfRange)); }",
    ),
  );
});
const numericProbe =
  "fn check(c: i32) { let result = Fahrenheit::try_from(Celsius::new(c)); if c % 5 != 0 { assert_eq!(result, Err(ConversionError::FractionalDegree)); } else { let exact = i128::from(c / 5) * 9 + 32; match i32::try_from(exact) { Ok(expected) => assert_eq!(result.unwrap().get(), expected), Err(_) => assert_eq!(result, Err(ConversionError::OutOfRange)), } } }\nfor c in -10_000..=10_000 { check(c); }\nfor edge in [i32::MIN, i32::MAX] { check(edge); let bound = (i64::from(edge) - 32) * 5 / 9; for delta in -12..=12 { check(i32::try_from(bound + delta).unwrap()); } }";
test("temperature: campionamento e frontiere con oracle i128", () => {
  run(main(temperatures, numericProbe));
});
test("temperature: stessi esiti con ottimizzazione e overflow disabilitato", () => {
  run(main(temperatures, numericProbe), {
    rustcArgs: ["-C", "opt-level=3", "-C", "overflow-checks=no"],
  });
});
test("temperature: TryInto disponibile, From infallibile assente", () => {
  run(
    main(
      temperatures,
      "let f: Fahrenheit = Celsius::new(100).try_into().unwrap(); assert_eq!(f.get(), 212);",
    ),
  );
  run(main(temperatures, "let _f: Fahrenheit = Celsius::new(100).into();"), {
    error: "E0277",
  });
});
test("vecchia formula: troncamento e overflow osservabili", () => {
  run(
    "fn convert(c: i32) -> i32 { c * 9 / 5 + 32 } fn main() { assert_eq!(convert(1), 33); assert_eq!(convert(-1), 31); }",
  );
  run(
    "fn convert(c: i32) -> i32 { c * 9 / 5 + 32 } fn main() { let _ = convert(std::hint::black_box(i32::MAX)); }",
    {
      exitCode: 101,
      stderr: /overflow/,
      rustcArgs: ["-C", "overflow-checks=yes"],
    },
  );
});
test("DisplayList: vuoto singolo e testo Unicode senza escaping", () => {
  run(
    main(
      display,
      'let empty: [String; 0] = []; assert_eq!(format!("{}", DisplayList(&empty)), "[]"); let one = ["\\u{e8}, []".to_owned()]; assert_eq!(format!("{}", DisplayList(&one)), "[\\u{e8}, []]");',
    ),
  );
});
test("DisplayList: propaga errori del writer", () => {
  run(
    main(
      display,
      'use std::fmt::Write; struct Fail; impl fmt::Write for Fail { fn write_str(&mut self, _: &str) -> fmt::Result { Err(fmt::Error) } } let items = ["a".to_owned()]; assert!(write!(&mut Fail, "{}", DisplayList(&items)).is_err());',
    ),
  );
});
test("DisplayList: vista non puo sopravvivere ai dati locali", () => {
  run(
    main(
      display,
      'fn invalid() -> DisplayList<\'static> { let items = vec!["a".to_owned()]; DisplayList(&items) }',
    ),
    { error: "E0515" },
  );
});
test("DisplayList: wrapper non rende Vec direttamente Display", () => {
  run(
    main(
      display,
      'let items = vec!["a".to_owned()]; let _ = format!("{items}");',
    ),
    { error: "E0277" },
  );
});
test("alias di Vec non risolve orphan rule", () => {
  run(
    replace(
      from(orphan),
      "impl fmt::Display for Vec<String>",
      "type Names = Vec<String>;\nimpl fmt::Display for Names",
    ),
    { error: "E0117" },
  );
});
test("transparent: campo marker ZST compatibile", () => {
  run(
    "use std::{marker::PhantomData,mem::{size_of,align_of}}; #[repr(transparent)] struct Id<T>(u32, PhantomData<fn() -> T>); fn main() { assert_eq!(size_of::<Id<String>>(), size_of::<u32>()); assert_eq!(align_of::<Id<String>>(), align_of::<u32>()); }",
  );
});
test("transparent: due campi numerici rifiutati", () => {
  run(
    replace(
      from(layout),
      "struct Handle(u32);",
      "struct Handle(u32, u32);",
    ).replace("Handle(7)", "Handle(7, 0)"),
    { error: "E0690" },
  );
});
test("transparent: nessuna conversione implicita al tipo interno", () => {
  run(main(layout, "let _number: u32 = Handle(7);"), { error: "E0308" });
});
test("correzione: identificatore corretto", () => {
  run(
    replace(from(mix), "let order = OrderId(42);", "let order = UserId(42);"),
  );
});
test("controprova privacy: campo pubblico consente valore invalido", () => {
  run(
    replace(
      from(privacy),
      "pub struct NonEmptyString(String);",
      "pub struct NonEmptyString(pub String);",
    ),
  );
});
test("trait locali possono essere implementati su tipi esterni", () => {
  run(
    'trait Count { fn count(&self) -> usize; } impl Count for Vec<String> { fn count(&self) -> usize { self.len() } } fn main() { assert_eq!(vec!["x".to_owned()].count(), 1); }',
  );
});
