import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["References e Borrowing", "Borrow checker", "Slices"];
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
const prefix = "appunti-rust-borrowing-slices-";
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

test("toolchain 1.99.1 e inventario di 21 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [7, 7, 7],
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
const failures = new Map([
  ["Prestito condiviso ancora usato", "E0502"],
  ["Riferimento a elemento e push", "E0502"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(`${names[i]}: ${heading}`, () => {
      const error = failures.get(heading);
      if (error) run(code, error);
      else
        assert.equal(
          run(code),
          heading === "Preparare un nome visualizzato" ? "utente: luca\n" : "",
        );
    });
  }
}
test("lettura di vuoto e Unicode: lunghezza in byte", () => {
  run(
    probe(
      0,
      "Lettura senza consumo",
      String.raw`assert_eq!(byte_len(""), 0); assert_eq!(byte_len("\u{00E8}"), 2); assert_eq!(byte_len("\u{1F600}"), 4);`,
    ),
  );
});
test("append mutabile su vuoto e Unicode conserva il contenuto", () => {
  run(
    probe(
      0,
      "Modifica tramite riferimento",
      String.raw`let mut empty = String::new(); append_marker(&mut empty); assert_eq!(empty, "!"); let mut text = String::from("\u{00E8}"); append_marker(&mut text); assert_eq!(text, "\u{00E8}!");`,
    ),
  );
});
test("uso successivo riapre il conflitto con il prestito mutabile", () => {
  run(
    replaceOnce(
      source(0, "Prestiti condivisi seguiti da esclusivo"),
      'assert_eq!(exclusive, "ciao!");',
      'assert_eq!(exclusive, "ciao!"); println!("{first}");',
    ),
    "E0502",
  );
});
test("binding mutabile di riferimento condiviso non rende mutabile il dato", () => {
  run(
    replaceOnce(
      source(0, "Mutabilita del binding e del dato"),
      "selected = &second;",
      "*selected = 2;",
    ),
    "E0594",
  );
});
test("reborrow sospende l'uso del riferimento padre ancora in conflitto", () => {
  run(
    replaceOnce(
      source(0, "Reborrow temporaneo"),
      "*shorter += 2;",
      "*reference += 1; *shorter += 2;",
    ),
    "E0503",
  );
});
test("primo elemento: vuoto, estremi e identita del riferimento", () => {
  run(
    probe(
      0,
      "Restituire un riferimento al chiamante",
      "let input = [i32::MIN, i32::MAX]; let first = first_value(&input).unwrap(); assert!(std::ptr::eq(first, &input[0])); assert_eq!(*first, i32::MIN);",
    ),
  );
});
test("riferimento restituito non puo sopravvivere al vettore", () => {
  run(
    probe(
      0,
      "Restituire un riferimento al chiamante",
      "let borrowed; { let local = vec![1]; borrowed = first_value(&local); } assert_eq!(borrowed, Some(&1));",
    ),
    "E0597",
  );
});
test("normalizzazione dimostrativa: vuoto, spazi Unicode e spazi interni", () => {
  run(
    probe(
      0,
      "Preparare un nome visualizzato",
      String.raw`
    for (input, expected) in [("", ""), (" \t\n", ""), ("\u{2003}ADA\u{2003}", "ada"), ("A  B", "a  b"), ("\u{200B}ADA", "\u{200B}ada")] {
      let mut name = input.to_owned(); normalize_name(&mut name); assert_eq!(name, expected);
    }`,
    ),
  );
});
test("lowercase puo espandere un carattere e non applica NFC", () => {
  run(
    probe(
      0,
      "Preparare un nome visualizzato",
      String.raw`
    let mut expanded = String::from("\u{0130}"); normalize_name(&mut expanded); assert_eq!(expanded, "i\u{0307}");
    let mut decomposed = String::from("E\u{0301}"); normalize_name(&mut decomposed); assert_eq!(decomposed, "e\u{0301}");`,
    ),
  );
});
test("trim solo non produce un valore indipendente da poter conservare dopo clear", () => {
  run(
    replaceOnce(
      source(0, "Preparare un nome visualizzato"),
      "name.trim().to_lowercase()",
      "name.trim()",
    ),
    "E0502",
  );
});
test("add_if_missing: confronto esatto, vuoto e duplicati preesistenti", () => {
  run(
    probe(
      1,
      "Separare ricerca e inserimento",
      `let mut names = Vec::new(); add_if_missing(&mut names, ""); add_if_missing(&mut names, ""); assert_eq!(names, [""]);
    let mut names = vec![String::from("Ada"), String::from("Ada")]; add_if_missing(&mut names, "Ada"); add_if_missing(&mut names, "ada"); assert_eq!(names, ["Ada", "Ada", "ada"]);`,
    ),
  );
});
test("reserve non risolve il prestito incompatibile con push", () => {
  run(
    replaceOnce(
      source(1, "Riferimento a elemento e push"),
      "let first = names.first();",
      "names.reserve(100); let first = names.first();",
    ),
    "E0502",
  );
});
test("clone intenzionale permette di conservare uno snapshot", () => {
  let code = replaceOnce(
    source(1, "Riferimento a elemento e push"),
    "names.first()",
    "names.first().cloned()",
  );
  code = replaceOnce(
    code,
    'println!("{first:?}");',
    'assert_eq!(first.as_deref(), Some("Ada"));',
  );
  run(code);
});
test("fine dell'uso condiviso prima della modifica corregge E0502", () => {
  let code = replaceOnce(
    source(1, "Prestito condiviso ancora usato"),
    "text.push('!');\n    println!(\"{borrowed}\");",
    'println!("{borrowed}");\n    text.push(\'!\');\n    assert_eq!(text, "rust!");',
  );
  assert.equal(run(code), "rust\n");
});
test("due prestiti mutabili allo stesso campo sono incompatibili", () => {
  run(
    replaceOnce(
      source(1, "Campi disgiunti"),
      "let rejected = &mut counters.rejected;",
      "let rejected = &mut counters.accepted;",
    ),
    "E0499",
  );
});
test("RefCell: ultimo uso non rilascia automaticamente la guardia", () => {
  run(
    replaceOnce(source(1, "Prestiti runtime di RefCell"), "drop(read);", ""),
    undefined,
    /already borrowed|BorrowMutError/,
  );
});
test("RefCell: borrow_mut in conflitto causa panic, non errore del compilatore", () => {
  run(
    replaceOnce(
      source(1, "Prestiti runtime di RefCell"),
      "assert!(values.try_borrow_mut().is_err());",
      "let _write = values.borrow_mut();",
    ),
    undefined,
    /already borrowed|BorrowMutError/,
  );
});
test("Cell permette modifica controllata attraverso riferimento condiviso", () => {
  run(
    "use std::cell::Cell; fn main() { let value = Cell::new(1); let shared = &value; let second = shared; second.set(2); assert_eq!(shared.get(), 2); }",
  );
});
test("slice e contenitore condividono gli elementi", () => {
  run(
    replaceOnce(
      source(2, "Porzione senza copia"),
      "assert_eq!(part.len(), 2);",
      "assert_eq!(part.len(), 2); assert!(std::ptr::eq(&part[0], &values[1]));",
    ),
  );
});
test("get: range validi, vuoti, inversi e fuori limite", () => {
  run(
    probe(
      2,
      "Accesso fallibile con get",
      `let input = [1, 2, 3];
    for start in 0..=4 { for end in 0..=4 {
      let result = input.get(start..end);
      if start <= end && end <= input.len() { assert_eq!(result.unwrap().len(), end-start); }
      else { assert!(result.is_none()); }
    } }
    let empty: &[i32] = &[]; assert_eq!(empty.get(0), None); assert_eq!(empty.get(0..0), Some(&[][..]));`,
    ),
  );
});
test("get_mut modifica solo l'elemento presente", () => {
  run(
    probe(
      2,
      "Slice mutabile",
      "let mut extra = [1, 2]; *extra.get_mut(1).unwrap() = 9; assert!(extra.get_mut(2).is_none()); assert_eq!(extra, [1, 9]);",
    ),
  );
});
test("sort su slice funziona anche per vuoto e duplicati", () => {
  run(
    probe(
      2,
      "Slice mutabile",
      "let mut empty: [i32; 0] = []; empty.sort(); let mut duplicates = [2, 1, 2, 1]; duplicates.sort(); assert_eq!(duplicates, [1, 1, 2, 2]);",
    ),
  );
});
test("indexing fuori range causa panic runtime", () => {
  run(
    replaceOnce(
      source(2, "Porzione senza copia"),
      "&values[1..3]",
      "&values[1..std::hint::black_box(5)]",
    ),
    undefined,
    /out of range|out of bounds/,
  );
});
test("slicing str a meta carattere causa panic runtime", () => {
  run(
    replaceOnce(
      source(2, "String slice e confini UTF-8"),
      "assert_eq!(text.get(0..5), None);",
      "let _invalid = &text[0..std::hint::black_box(5)];",
    ),
    undefined,
    /char boundary|character boundary/,
  );
});
test("UTF-8: get rifiuta confini interni, chars e grafemi sono distinti", () => {
  run(
    probe(
      2,
      "String slice e confini UTF-8",
      String.raw`
    let emoji = "\u{1F600}"; assert_eq!(emoji.len(), 4); assert_eq!(emoji.get(0..4), Some(emoji));
    for end in 1..4 { assert!(emoji.get(0..end).is_none()); }
    let combined = "e\u{0301}"; assert_eq!(combined.chars().count(), 2); assert_eq!(combined.get(0..1), Some("e"));
    let empty = ""; assert_eq!(empty.get(0..0), Some("")); assert!(empty.get(0..1).is_none());`,
    ),
  );
});
test("byte slice arbitraria non e necessariamente UTF-8", () => {
  run(
    'fn main() { let bytes = [255_u8]; assert!(std::str::from_utf8(&bytes).is_err()); let ascii = [65_u8, 66]; assert_eq!(std::str::from_utf8(&ascii), Ok("AB")); }',
  );
});
test("media: singolo elemento e valori negativi", () => {
  run(
    probe(
      2,
      "Media di una sequenza",
      "assert_eq!(mean(&[7.0]), Some(7.0)); assert_eq!(mean(&[-4.0, -2.0, 0.0]), Some(-2.0));",
    ),
  );
});
test("media: None non indica NaN, infinito o overflow della somma", () => {
  run(
    probe(
      2,
      "Media di una sequenza",
      "assert!(mean(&[f64::NAN]).unwrap().is_nan()); assert!(mean(&[f64::INFINITY]).unwrap().is_infinite()); assert!(mean(&[f64::MAX, f64::MAX]).unwrap().is_infinite());",
    ),
  );
});
test("split_at_mut: estremi ammessi con parte vuota", () => {
  run(
    probe(
      2,
      "Due porzioni mutabili disgiunte",
      "let mut empty: [i32; 0] = []; let (left, right) = empty.split_at_mut(0); assert!(left.is_empty() && right.is_empty()); for mid in [0, 3] { let mut input = [1, 2, 3]; let (left, right) = input.split_at_mut(mid); assert_eq!(left.len(), mid); assert_eq!(right.len(), 3-mid); }",
    ),
  );
});
test("split_at_mut oltre la lunghezza causa panic", () => {
  run(
    replaceOnce(
      source(2, "Due porzioni mutabili disgiunte"),
      "split_at_mut(2)",
      "split_at_mut(5)",
    ),
    undefined,
    /mid.*len|out of bounds/,
  );
});
test("due indicizzazioni mutabili non sono automaticamente disgiunte", () => {
  run(
    "fn main() { let mut values = [1, 2]; let first = &mut values[0]; let second = &mut values[1]; *first += 1; *second += 1; }",
    "E0499",
  );
});
test("to_vec produce elementi posseduti, non un'altra vista", () => {
  run(
    'fn main() { let original = [String::from("a")]; let view: &[String] = &original; let mut owned = view.to_vec(); owned[0].push(\'!\'); assert_eq!(original[0], "a"); assert_eq!(owned[0], "a!"); }',
  );
});
test("slice posseduta Box e vista str mutabile preservano i rispettivi contratti", () => {
  run(
    'fn main() { let owned: Box<[i32]> = vec![1, 2].into_boxed_slice(); assert_eq!(&*owned, &[1, 2]); let mut text = String::from("rust"); let view: &mut str = text.as_mut_str(); view.make_ascii_uppercase(); assert_eq!(text, "RUST"); }',
  );
});
