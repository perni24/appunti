import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Pattern Matching", "if let e while let", "Destructuring"];
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
const prefix = "appunti-rust-pattern-control-destructuring-";
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
function run(code, errorCode, panicPattern, extraArgs = [], edition = "2024") {
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
      "--edition=" + edition,
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
      ...extraArgs,
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

test("toolchain 1.99.1 e inventario di 24 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [8, 8, 8],
  );
});
for (const [i, note] of notes.entries()) {
  test(names[i] + ": metadati e gerarchia", () => {
    for (const [key, value] of Object.entries({
      area: "Programmazione",
      topic: "Rust",
      type: "technical-note",
      status: "non revisionato",
      publish: true,
      date: "2026-05-20",
    }))
      assert.equal(note.data[key], value);
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
    ])
      assert.ok(
        headings.some((n) => text(n) === title),
        title,
      );
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
const failures = new Map([
  ["Guardie senza fallback", "E0004"],
  ["Tipi incompatibili", "E0308"],
  ["Un else che non esce", "E0308"],
  ["Slice refutabile in let", "E0005"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(names[i] + ": " + heading, () => {
      if (failures.has(heading)) run(code, failures.get(heading));
      else assert.equal(run(code), "");
    });
  }
}
test("match: parsing ai confini e assenza distinta da zero", () => {
  run(
    probe(
      0,
      "Un valore dal match",
      `
    assert_eq!(parse_summary("65535"), "letto 65535");
    for raw in ["65536", "-1", "", " 42"] {
        assert!(parse_summary(raw).starts_with("non valido: "));
    }
    assert_ne!(describe(None), describe(Some(0)));
  `,
    ),
  );
});
test("match: guardie per estremi e confronto esterno", () => {
  run(
    probe(
      0,
      "Guardie e valori esterni",
      `
    assert_eq!(category(i32::MIN), "negativo");
    assert_eq!(category(i32::MAX), "positivo");
    assert!(equals_expected(Some(i32::MIN), i32::MIN));
    assert!(!equals_expected(Some(0), i32::MIN));
  `,
    ),
  );
});
test("match: scrutinee una volta e guardie in ordine", () => {
  run(`
    fn main() {
        let mut calls = 0;
        let mut guards = Vec::new();
        let result = match { calls += 1; 7 } {
            n if { guards.push("prima"); n < 0 } => 0,
            n if { guards.push("seconda"); n == 7 } => 1,
            _ => 2,
        };
        assert_eq!(calls, 1);
        assert_eq!(guards, vec!["prima", "seconda"]);
        assert_eq!(result, 1);
    }
  `);
});
test("match: binding omonimo non confronta il parametro", () => {
  run(`
    fn main() {
        let expected = 7;
        let matched = match Some(8) { Some(expected) => expected, None => 0 };
        assert_eq!(matched, 8);
        assert_eq!(expected, 7);
    }
  `);
});
test("match: guardia falsa lascia il payload al ramo successivo", () => {
  run(`
    fn main() {
        let value = Some(String::from("breve"));
        let length = match value {
            Some(text) if text.len() > 10 => text.len(),
            Some(text) => { assert_eq!(text, "breve"); text.len() },
            None => 0,
        };
        assert_eq!(length, 5);
    }
  `);
});
test("match: binding fuori scope", () => {
  run(
    `fn main() {
    match Some(1) { Some(n) => { let _ = n; }, None => {} }
    println!("{n}");
  }`,
    "E0425",
  );
});
test("match: prestito condiviso non modificabile", () => {
  run(
    replaceOnce(
      source(0, "Leggere e modificare in prestito"),
      "match &mut message",
      "match &message",
    ),
    "E0596",
  );
});
test("match: matches per valore puo muovere String", () => {
  run(
    replaceOnce(
      source(0, "Un predicato con matches!"),
      "matches!(&message,",
      "matches!(message,",
    ),
    "E0382",
  );
});
test("match: alternative senza binding coerenti", () => {
  run(
    `
    enum Event { Key(char), Close }
    fn main() {
        match Event::Close { Event::Key(c) | Event::Close => { let _ = c; } }
    }
  `,
    "E0408",
  );
});
test("match: variante aggiunta richiede gestione", () => {
  run(
    replaceOnce(
      source(0, "Eventi e alternative"),
      "    Close,",
      "    Close,\n    Resize,",
    ),
    "E0004",
  );
});
test("match: limiti dichiarati del demo eventi", () => {
  run(
    probe(
      0,
      "Eventi e alternative",
      String.raw`
    assert_eq!(handle(Event::Key('Q')), Action::Input('Q'));
    assert_eq!(handle(Event::Key('\u{e8}')), Action::Input('\u{e8}'));
    assert_eq!(handle(Event::Click { x: i32::MIN, y: i32::MAX }),
        Action::Select(i32::MIN, i32::MAX));
  `,
    ),
  );
});
test("match: coercizioni a slice e return divergente", () => {
  run(`
    fn values(flag: u8) -> &'static [u8] {
        match flag { 0 => &[1, 2], 1 => &[3], _ => return &[] }
    }
    fn main() {
        assert_eq!(values(0), &[1, 2]);
        assert_eq!(values(1), &[3]);
        assert!(values(2).is_empty());
    }
  `);
});
test("match: fallback non condizionato risolve E0004", () => {
  run(
    replaceOnce(
      source(0, "Guardie senza fallback"),
      'value if value >= 0 => "non negativo"',
      '_ => "non negativo"',
    ),
  );
});
test("if let: presente vuoto distinto da assente", () => {
  run(
    probe(
      1,
      "Un caso con fallback",
      `
    assert_eq!(label(&Some(String::new())), "presente: ");
    assert_eq!(label(&None), "assente");
  `,
    ),
  );
});
test("if let: payload String per valore impedisce il riuso", () => {
  run(
    `
    fn main() {
        let value = Some(String::from("testo"));
        if let Some(text) = value { assert_eq!(text, "testo"); }
        assert!(value.is_some());
    }
  `,
    "E0382",
  );
});
test("if let: valore non unit senza else", () => {
  run(
    `
    fn main() {
        let value = Some(1);
        let result = if let Some(n) = value { n };
        let _ = result;
    }
  `,
    "E0317",
  );
});
test("while let: prova finale della condizione e ordine pop", () => {
  run(`
    fn main() {
        let mut stack = vec![1, 2];
        let mut calls = 0;
        let mut values = Vec::new();
        while let Some(n) = { calls += 1; stack.pop() } { values.push(n); }
        assert_eq!(calls, 3);
        assert_eq!(values, vec![2, 1]);
    }
  `);
});
test("while let: coda vuota, exit immediato e nessun exit", () => {
  run(
    probe(
      1,
      "Una coda di comandi",
      `
    let mut empty = VecDeque::new();
    assert!(drain_until_exit(&mut empty).is_empty());
    let mut immediate = VecDeque::from([Command::Exit, Command::Print("later".into())]);
    assert!(drain_until_exit(&mut immediate).is_empty());
    assert_eq!(immediate.len(), 1);
    let mut normal = VecDeque::from([Command::Print("a".into()), Command::Print("b".into())]);
    assert_eq!(drain_until_exit(&mut normal), vec!["a", "b"]);
    assert!(normal.is_empty());
  `,
    ),
  );
});
test("if let: nuova variante cade nel fallback", () => {
  const changed = replaceOnce(
    source(1, "Una coda di comandi"),
    "    Exit,",
    "    Exit,\n    Pause,",
  );
  run(
    replaceOnce(
      changed,
      "fn main() {",
      "fn main() { assert!(!execute(Command::Pause, &mut Vec::new()));",
    ),
  );
});
test("while let: consuma il valore che interrompe", () => {
  run(`
    fn main() {
        let mut values = vec![9, 0, 2];
        let mut seen = Vec::new();
        while let Some(n @ 1..=3) = values.pop() { seen.push(n); }
        assert_eq!(seen, vec![2]);
        assert_eq!(values, vec![9]);
    }
  `);
});
test("while let: alternativa for con match prosegue dopo errore", () => {
  run(`
    fn main() {
        let mut accepted = Vec::new();
        let mut errors = Vec::new();
        for item in [Ok(1), Err("bad"), Ok(2)] {
            match item {
                Ok(n) => accepted.push(n),
                Err(error) => errors.push(error),
            }
        }
        assert_eq!(accepted, vec![1, 2]);
        assert_eq!(errors, vec!["bad"]);
    }
  `);
});
test("let else: scalare Unicode non grafema", () => {
  run(
    probe(
      1,
      "Uscita anticipata con let else",
      String.raw`
    assert_eq!(first_character(Some("\u{e8}")), Some('\u{e8}'));
    assert_eq!(first_character(Some("e\u{301}")), Some('e'));
  `,
    ),
  );
});
test("let else: return corregge ramo non divergente", () => {
  assert.equal(
    run(
      replaceOnce(
        source(1, "Un else che non esce"),
        'eprintln!("assente");',
        "return;",
      ),
    ),
    "",
  );
});
test("let chain: confini, whitespace e porta zero", () => {
  run(
    probe(
      1,
      "Catene di condizioni",
      `
    assert_eq!(configured_port(Some("65535")), Some(65535));
    assert_eq!(configured_port(Some("+1")), Some(1));
    for value in ["65536", "-1", "", " 80", "80 ", "0"] {
        assert_eq!(configured_port(Some(value)), None);
    }
  `,
    ),
  );
});
test("let chain: edition 2021 rifiutata dal compilatore attuale", () => {
  run(
    source(1, "Catene di condizioni"),
    /let chains are only allowed in Rust 2024 or later/,
    undefined,
    [],
    "2021",
  );
});
test("let chain: short circuit e binding successivi", () => {
  run(`
    fn main() {
        let mut calls = 0;
        if let Some(n) = None::<i32>
            && { calls += 1; n > 0 } { panic!("unreachable"); }
        assert_eq!(calls, 0);
        if let Some(n) = Some(3_i32)
            && { calls += 1; n == 3 }
            && let Some(m) = n.checked_add(1) { assert_eq!(m, 4); }
        assert_eq!(calls, 1);
    }
  `);
});
test("while let chain: estrazione prima della condizione falsa", () => {
  run(`
    fn main() {
        let mut items = [1, 0, 2].into_iter();
        let mut seen = Vec::new();
        while let Some(n) = items.next() && n > 0 { seen.push(n); }
        assert_eq!(seen, vec![1]);
        assert_eq!(items.next(), Some(2));
    }
  `);
});
function temporaryProbe(construct, expected) {
  const header = `
    use std::cell::Cell;
    use std::rc::Rc;
    struct Marker(Rc<Cell<bool>>);
    impl Drop for Marker { fn drop(&mut self) { self.0.set(true); } }
    fn make(state: &Rc<Cell<bool>>) -> (Option<i32>, Marker) {
        (None, Marker(Rc::clone(state)))
    }
    fn main() {
        let dropped = Rc::new(Cell::new(false));
  `;
  const branch =
    construct === "if"
      ? "if let (Some(_), _) = make(&dropped) { panic!(); } else { assert_eq!(dropped.get(), EXPECTED); }"
      : "match make(&dropped) { (Some(_), _) => panic!(), _ => assert_eq!(dropped.get(), EXPECTED), };";
  return (
    header +
    branch.replace("EXPECTED", String(expected)) +
    "assert!(dropped.get()); }"
  );
}
for (const edition of ["2021", "2024"]) {
  test("temporanei if let: ordine Drop edition " + edition, () => {
    run(
      temporaryProbe("if", edition === "2024"),
      undefined,
      undefined,
      [],
      edition,
    );
  });
  test("temporanei match: Drop dopo fallback edition " + edition, () => {
    run(temporaryProbe("match", false), undefined, undefined, [], edition);
  });
}
test("destructuring: struct intera inutilizzabile dopo move", () => {
  run(
    replaceOnce(
      source(2, "Rinominare e spostare campi"),
      "assert!(user.active);",
      "assert!(user.active); drop(user);",
    ),
    "E0382",
  );
});
test("destructuring: Drop impedisce move della String", () => {
  run(
    replaceOnce(
      source(2, "Rinominare e spostare campi"),
      "fn main() {",
      "impl Drop for User { fn drop(&mut self) {} }\nfn main() {",
    ),
    "E0509",
  );
});
test("destructuring: campi privati non aggirabili", () => {
  run(
    `
    mod data {
        pub struct Item { value: String }
        pub fn new() -> Item { Item { value: "secret".into() } }
    }
    fn main() { let data::Item { value } = data::new(); println!("{value}"); }
  `,
    "E0451",
  );
});
test("destructuring: prestito condiviso ancora in uso", () => {
  run(
    replaceOnce(
      source(2, "Prestiti condivisi ed esclusivi"),
      "*id = 8;",
      '*id = 8; println!("{borrowed_email}");',
    ),
    "E0502",
  );
});
test("destructuring: ref ridondante rifiutato in edition 2024", () => {
  run(
    `
    struct User { email: String }
    fn main() {
        let user = User { email: "a".into() };
        let User { ref email } = &user;
        assert_eq!(email, "a");
    }
  `,
    /binding modifiers may only be written when the default binding mode is.*move|cannot explicitly borrow within an implicitly-borrowing pattern/,
  );
});
test("destructuring: manhattan sulle combinazioni degli estremi", () => {
  run(
    probe(
      2,
      "Parametri e limiti numerici",
      `
    for x in [i32::MIN, -1, 0, 1, i32::MAX] {
        for y in [i32::MIN, -1, 0, 1, i32::MAX] {
            let expected = (i64::from(x).abs() + i64::from(y).abs()) as u64;
            assert_eq!(manhattan((x, y)), expected);
        }
    }
  `,
    ),
  );
});
test("destructuring: vecchio abs su MIN va in panic", () => {
  run(
    `
    fn old((x, y): (i32, i32)) -> i32 { x.abs() + y.abs() }
    fn main() { let _ = old((i32::MIN, 0)); }
  `,
    undefined,
    /overflow/,
    ["-C", "overflow-checks=yes"],
  );
});
test("destructuring: vecchia somma trabocca con abs validi", () => {
  run(
    `
    fn old((x, y): (i32, i32)) -> i32 { x.abs() + y.abs() }
    fn main() { let _ = old((i32::MAX, 1)); }
  `,
    undefined,
    /overflow/,
    ["-C", "overflow-checks=yes"],
  );
});
test("destructuring: body assente, vuoto e byte Unicode", () => {
  run(
    probe(
      2,
      "Separare una richiesta",
      String.raw`
    let make = |body| Request { method: "POST".into(), path: "/".into(), body };
    assert_eq!(summary(make(None)), "POST /: body assente");
    assert_eq!(summary(make(Some(String::new()))), "POST /: body presente, 0 byte");
    assert_eq!(summary(make(Some("\u{e8}".into()))), "POST /: body presente, 2 byte");
  `,
    ),
  );
});
test("destructuring: richiesta consumata dalla funzione", () => {
  run(
    replaceOnce(
      source(2, "Separare una richiesta"),
      'assert_eq!(summary(request), "POST /items: body presente, 2 byte");',
      'assert_eq!(summary(request), "POST /items: body presente, 2 byte"); drop(request);',
    ),
    "E0382",
  );
});
test("destructuring: slice singola e identita della vista", () => {
  run(
    probe(
      2,
      "Slice con una parte restante",
      `
    let only = [9];
    let (head, tail) = split_first(&only).unwrap();
    assert_eq!(*head, 9);
    assert!(tail.is_empty());
    let array = [4, 5, 6];
    let (head, tail) = split_first(&array).unwrap();
    assert!(std::ptr::eq(head, &array[0]));
    assert!(std::ptr::eq(tail.as_ptr(), array[1..].as_ptr()));
  `,
    ),
  );
});
test("destructuring: vista oltre la durata dell'input rifiutata", () => {
  run(
    replaceOnce(
      source(2, "Slice con una parte restante"),
      "fn main() {",
      `fn main() {
      let result;
      { let local = vec![1, 2]; result = split_first(&local); }
      println!("{result:?}");
    `,
    ),
    "E0597",
  );
});
test("destructuring: underscore nominato muove il campo", () => {
  run(
    replaceOnce(
      source(2, "Wildcard, binding e ref esplicito"),
      "let (_, right) = pair;",
      "let (_left, right) = pair;",
    ),
    "E0382",
  );
});
test("destructuring: temporaneo wildcard distrutto subito", () => {
  run(`
    use std::cell::Cell;
    struct Guard<'a>(&'a Cell<usize>);
    impl Drop for Guard<'_> {
        fn drop(&mut self) { self.0.set(self.0.get() + 1); }
    }
    fn main() {
        let drops = Cell::new(0);
        let _ = Guard(&drops);
        assert_eq!(drops.get(), 1);
        { let _guard = Guard(&drops); assert_eq!(drops.get(), 1); }
        assert_eq!(drops.get(), 2);
    }
  `);
});
test("destructuring: for non filtra pattern refutabili", () => {
  run(
    `fn main() {
    for Some(n) in [Some(1), None] { println!("{n}"); }
  }`,
    "E0005",
  );
});
test("destructuring: let else gestisce slice vuota", () => {
  run(
    replaceOnce(
      source(2, "Slice refutabile in let"),
      "let [first, ..] = values;",
      "let [first, ..] = values else { return; };",
    ),
  );
});
