import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = [
  "Stringhe String e &str",
  "Stack e Heap",
  "Mutabilita",
  "Lifetime impliciti",
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
    if (node.type === "code" && node.lang === "rust") {
      assert.ok(heading);
      assert.ok(!result.has(heading));
      result.set(heading, node.value);
    }
  }
  return result;
});
const prefix = "appunti-rust-stringhe-memoria-lifetime-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of [
  "RUSTFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
let sequence = 0;
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
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function run(code, errorCode, panicPattern) {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
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
  if (errorCode) {
    assert.notEqual(result.status, 0);
    if (errorCode instanceof RegExp) {
      assert.match(result.stderr, errorCode);
      return;
    }
    const diagnostics = result.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === errorCode,
      ),
      result.stderr,
    );
    return;
  }
  ok(result);
  const execution = launch(output, [], dir);
  if (panicPattern) {
    assert.equal(execution.status, 101, execution.stdout + execution.stderr);
    assert.match(execution.stderr, panicPattern);
    return;
  }
  ok(execution);
  assert.equal(execution.stderr, "");
  return execution.stdout.replaceAll("\r\n", "\n");
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading);
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function probe(i, heading, assertions) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + assertions,
  );
}

test("toolchain 1.99.1 e inventario di 26 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [7, 5, 6, 8],
  );
});
for (const [i, note] of notes.entries()) {
  test(names[i] + ": metadati e struttura", () => {
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
        headings.some((n) => text(n) === title),
        title,
      );
    }
    for (let at = 1; at < headings.length; at++) {
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
    }
  });
}
const failures = new Map([
  ["Due input e output ambiguo", "E0106"],
  ["Un riferimento locale resta invalido", "E0515"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(names[i] + ": " + heading, () => {
      const error = failures.get(heading);
      if (error) run(code, error);
      else
        assert.equal(
          run(code),
          heading === "Distruzione osservabile del contenuto"
            ? "prima\nrilasciata\ndopo\n"
            : "",
        );
    });
  }
}

test("String: vuoto, byte multibyte e literal", () => {
  run(
    probe(
      0,
      "Leggere senza consumare",
      String.raw`assert_eq!(byte_len(""), 0); assert_eq!(byte_len("\u{1F600}"), 4);`,
    ),
  );
});
test("String: il lato sinistro di + viene consumato", () => {
  run(
    replaceOnce(
      source(0, "Concatenare e formattare"),
      "let joined = prefix + &suffix;",
      'let joined = prefix + &suffix; println!("{prefix}");',
    ),
    "E0382",
  );
});
test("String: indice intero non supportato", () => {
  run(
    'fn main() { let text = String::from("rust"); println!("{}", text[0]); }',
    "E0277",
  );
});
test("String: un intervallo che taglia UTF-8 genera panic", () => {
  run(
    String.raw`fn main() { let text = "caff\u{00E8}"; let end = std::hint::black_box(5); println!("{}", &text[..end]); }`,
    undefined,
    /not a char boundary/,
  );
});
test("String: lossy prende in prestito UTF-8 valido, possiede testo corretto", () => {
  run(String.raw`use std::borrow::Cow;
fn main() {
 let valid = [0xC3, 0xA8];
 assert!(matches!(String::from_utf8_lossy(&valid), Cow::Borrowed(_)));
 let invalid = [0xFF];
 let repaired = String::from_utf8_lossy(&invalid);
 assert!(matches!(&repaired, Cow::Owned(_)));
 assert_eq!(repaired, "\u{FFFD}");
 assert!(std::str::from_utf8(&valid).is_ok());
 assert!(std::str::from_utf8(&invalid).is_err());
}`);
});
test("slug: solo spazi ASCII interni, nessuna sanificazione", () => {
  run(
    probe(
      0,
      "Trasformazione semplice di un titolo",
      String.raw`
assert_eq!(slug(" A  B "), "a--b");
assert_eq!(slug("A\tB"), "a\tb");
assert_eq!(slug("A\u{00A0}B"), "a\u{00A0}b");
assert_eq!(slug("A/B? "), "a/b?");
assert_eq!(slug(" \t\n "), "");
`,
    ),
  );
});
test("slug: lowercase puo espandere, non normalizza Unicode", () => {
  run(
    probe(
      0,
      "Trasformazione semplice di un titolo",
      String.raw`
assert_eq!(slug("\u{0130}"), "i\u{0307}");
assert_eq!(slug("E\u{0301}"), "e\u{0301}");
assert_ne!(slug("E\u{0301}"), "\u{00E9}");
`,
    ),
  );
});
test("String: clone indipendente, vista senza copia e mutazione ASCII", () => {
  run(String.raw`fn main() {
 let text = String::from("rust");
 let view = text.as_str();
 assert_eq!(view.as_ptr(), text.as_ptr());
 let mut copy = text.clone();
 copy.as_mut_str().make_ascii_uppercase();
 assert_eq!(copy, "RUST"); assert_eq!(text, "rust");
}`);
});
test("Box<str> non offre push", () => {
  run(
    "fn main() { let mut text = String::from(\"rust\").into_boxed_str(); text.push('!'); }",
    "E0599",
  );
});
test("String: conservare un riferimento con proprietario ancora vivo", () => {
  run(String.raw`struct Label<'a> { text: &'a str }
fn make_label(text: &str) -> Label<'_> { Label { text } }
fn main() { let owner = String::from("rust"); let label = make_label(&owner); assert_eq!(label.text, "rust"); }`);
});

test("memoria: size_of del proprietario non conta il buffer", () => {
  run(String.raw`fn main() {
 let short = String::from("x");
 let long = "x".repeat(4096);
 assert_eq!(std::mem::size_of_val(&short), std::mem::size_of_val(&long));
 assert_eq!(std::mem::size_of_val(long.as_str()), 4096);
 let nested = vec![short, long];
 assert_eq!(std::mem::size_of_val(nested.as_slice()), 2 * std::mem::size_of::<String>());
}`);
});
test("memoria: contenitori vuoti e dimensione zero", () => {
  run(String.raw`fn main() {
 let empty = Vec::<u8>::new();
 assert_eq!(empty.capacity(), 0);
 let zero = vec![(); 10];
 assert_eq!(zero.len(), 10);
 assert_eq!(std::mem::size_of_val(zero.as_slice()), 0);
 let boxed = Box::new(());
 assert_eq!(std::mem::size_of_val(&*boxed), 0);
}`);
});
test("messaggi: zero, uno e ordine degli elementi", () => {
  run(
    probe(
      1,
      "Creare messaggi e trasferirli al chiamante",
      String.raw`
assert_eq!(create_messages(0), Vec::<String>::new());
assert_eq!(create_messages(1), ["messaggio-0"]);
let many = create_messages(12);
assert_eq!(many.len(), 12); assert_eq!(many[11], "messaggio-11");
`,
    ),
  );
});
test("memoria: spostare un Box non sposta il buffer posseduto", () => {
  run(String.raw`fn make() -> Box<[u8]> { vec![1, 2, 3].into_boxed_slice() }
fn main() { let original = make(); let pointer = original.as_ptr(); let moved = original; assert_eq!(moved.as_ptr(), pointer); assert_eq!(&*moved, &[1, 2, 3]); }`);
});
test("memoria: errore di capacita gestito senza tentare allocazioni enormi", () => {
  run(
    String.raw`fn main() { let mut values = Vec::<u8>::new(); assert!(values.try_reserve(usize::MAX).is_err()); assert!(values.is_empty()); }`,
  );
});
test("memoria: clear distrugge elementi ma conserva capacita", () => {
  run(String.raw`use std::cell::Cell;
struct Item<'a>(&'a Cell<usize>);
impl Drop for Item<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }
fn main() {
 let drops = Cell::new(0); let mut values = Vec::with_capacity(2);
 values.push(Item(&drops)); values.push(Item(&drops));
 let cap = values.capacity();
 values.clear(); assert_eq!(drops.get(), 2); assert_eq!(values.capacity(), cap);
 drop(values); assert_eq!(drops.get(), 2);
}`);
});

test("mutabilita: mut sul riferimento condiviso non autorizza scritture", () => {
  run(
    replaceOnce(
      source(2, "Cambiare riferimento o modificare il destinatario"),
      "selected = &second;",
      "*selected = 2;",
    ),
    "E0594",
  );
});
test("mutabilita: parametro posseduto senza mut non riassegnabile", () => {
  run(
    replaceOnce(
      source(2, "Parametro posseduto e parametro in prestito"),
      "mut number: i32",
      "number: i32",
    ),
    "E0384",
  );
});
test("mutabilita: metodo &mut self richiede accesso mutabile", () => {
  run(
    replaceOnce(
      source(2, "Campi e metodi mutabili"),
      "let mut config",
      "let config",
    ),
    "E0596",
  );
});
test("mutabilita: incrementare MAX non e una gestione overflow", () => {
  run(
    probe(
      2,
      "Parametro posseduto e parametro in prestito",
      "increment_owned(std::hint::black_box(i32::MAX));",
    ),
    undefined,
    /attempt to add with overflow/,
  );
});
test("normalize_tag: vuoto, spazi Unicode e interni", () => {
  run(
    probe(
      2,
      "Sostituire il testo del chiamante",
      String.raw`
for (input, expected) in [("", ""), (" \t\n ", ""), ("\u{00A0}RUST\u{00A0}", "rust"), (" A  B ", "a  b"), ("\u{0130}", "i\u{0307}"), ("E\u{0301}", "e\u{0301}")] {
 let mut actual = input.to_owned(); normalize_tag(&mut actual); assert_eq!(actual, expected);
}
`,
    ),
  );
});
test("mutabilita: parametro String consuma il precedente proprietario", () => {
  run(
    replaceOnce(
      source(2, "Nuovo proprietario, nuova mutabilita"),
      'assert_eq!(updated, "rust!");',
      'assert_eq!(updated, "rust!"); println!("{original}");',
    ),
    "E0382",
  );
});
test("mutabilita: parametro posseduto puo contenere stato condiviso", () => {
  run(String.raw`use std::{cell::Cell, rc::Rc};
fn change(value: Rc<Cell<bool>>) { value.set(true); }
fn main() { let state = Rc::new(Cell::new(false)); change(Rc::clone(&state)); assert!(state.get()); }`);
});
test("Cell non soddisfa Sync", () => {
  run(
    "fn requires_sync<T: Sync>() {} fn main() { requires_sync::<std::cell::Cell<bool>>(); }",
    "E0277",
  );
});

test("first_scalar: Unicode, nul e identita della vista", () => {
  run(
    probe(
      3,
      "Un input e una vista restituita",
      String.raw`
for input in ["", "abc", "\u{00E8}ra", "\u{1F600}!", "\0x", "e\u{0301}"] {
 match input.chars().next() {
  None => assert_eq!(first_scalar(input), None),
  Some(first) => {
   let part = first_scalar(input).unwrap();
   assert_eq!(part, first.to_string());
   assert_eq!(part.as_ptr(), input.as_ptr());
   assert_eq!(part.len(), first.len_utf8());
  }
 }
}
assert_eq!(first_scalar("e\u{0301}"), Some("e"));
`,
    ),
  );
});
for (const [label, literal, pattern] of [
  ["vuoto", '""', /out of bounds/],
  ["multibyte", '"\\u{00E8}"', /not a char boundary/],
]) {
  test("regressione: vecchio slicing ..1 fallisce su " + label, () => {
    run(
      "fn main() { let text = " +
        literal +
        '; let end = std::hint::black_box(1); println!("{}", &text[..end]); }',
      undefined,
      pattern,
    );
  });
}
test("first_word: whitespace Unicode, punteggiatura e assenza", () => {
  run(
    probe(
      3,
      "Prima parola senza copiare",
      String.raw`
assert_eq!(first_word(""), "");
assert_eq!(first_word("\u{00A0}ciao,\tmondo"), "ciao,");
assert_eq!(first_word("uno-due tre"), "uno-due");
`,
    ),
  );
});
test("first_word: un uso successivo impedisce push", () => {
  run(
    replaceOnce(
      source(3, "Prima parola senza copiare"),
      "sentence.push('!');",
      "sentence.push('!'); println!(\"{word}\");",
    ),
    "E0502",
  );
});
test("first_scalar: vista non sopravvive alla String", () => {
  run(
    probe(
      3,
      "Un input e una vista restituita",
      'let view; { let owner = String::from("rust"); view = first_scalar(&owner); } println!("{view:?}");',
    ),
    "E0597",
  );
});
test("first_word: anche il fallback vuoto segue il contratto di input", () => {
  run(
    probe(
      3,
      "Prima parola senza copiare",
      'let empty; { let owner = String::new(); empty = first_word(&owner); } println!("{empty}");',
    ),
    "E0597",
  );
});
test("metodo: restituire label viola il lifetime eliso del receiver", () => {
  run(
    replaceOnce(
      source(3, "Metodo con receiver"),
      "fn view_with_label(&self, _label: &str) -> &str {\n        &self.text",
      "fn view_with_label(&self, _label: &str) -> &str {\n        _label",
    ),
    /lifetime may not live long enough/,
  );
});
test("choose: legare anche second restringe inutilmente il risultato", () => {
  run(
    replaceOnce(
      source(3, "Legare il risultato a un input specifico"),
      "_second: &str",
      "_second: &'a str",
    ),
    "E0597",
  );
});
test("lifetime static non salva un riferimento locale", () => {
  run(
    replaceOnce(
      source(3, "Un riferimento locale resta invalido"),
      "fn invalid<'a>() -> &'a str",
      "fn invalid() -> &'static str",
    ),
    "E0515",
  );
});
test("bound static non impedisce drop di un valore posseduto", () => {
  assert.equal(
    run(String.raw`struct Resource;
impl Drop for Resource { fn drop(&mut self) { println!("drop"); } }
fn consume<T: 'static>(value: T) { drop(value); }
fn main() { consume(Resource); println!("dopo"); }`),
    "drop\ndopo\n",
  );
});
test("total_bytes: input con durate differenti, risultato indipendente", () => {
  run(
    probe(
      3,
      "Piu input senza output in prestito",
      'let outer = String::from("ab"); let total; { let inner = String::from("cd"); total = total_bytes(&outer, &inner); } assert_eq!(total, Some(4));',
    ),
  );
});
