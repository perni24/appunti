import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Control flow avanzato", "Pattern matching avanzato"];
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
const prefix = "appunti-rust-advanced-control-patterns-";
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
function run(
  code,
  errorCode,
  panicPattern,
  extraArgs = [],
  edition = "2024",
  runArgs = [],
) {
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
  const execution = launch(output, runArgs, dir);
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

test("toolchain 1.99.1 e inventario di 18 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [9, 9],
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
  ["Break con valore in for", "E0571"],
  ["Option in una funzione Result", "E0277"],
  ["Alternative con binding diversi", "E0408"],
  ["Due proprietari dello stesso campo", "E0382"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(names[i] + ": " + heading, () => {
      if (failures.has(heading)) run(code, failures.get(heading));
      else assert.equal(run(code), "");
    });
  }
}
function mainFor(i, heading, body) {
  const code = source(i, heading);
  const at = code.indexOf("fn main()");
  assert.ok(at >= 0);
  return code.slice(0, at) + "fn main() {\n" + body + "\n}";
}
test("loop: break unit incompatibile con risultato u32", () => {
  run(
    replaceOnce(
      source(0, "Loop con risultato"),
      "attempts += 1;",
      "attempts += 1; if attempts == 1 { break; }",
    ),
    "E0308",
  );
});
test("label: continue semplice riguarda solo il ciclo interno", () => {
  let code = replaceOnce(
    source(0, "Label con break e continue"),
    "continue 'rows;",
    "continue;",
  );
  code = replaceOnce(
    code,
    "vec![(0, 0), (1, 0), (2, 0)]",
    "vec![(0, 0), (0, 2), (1, 0), (1, 2), (2, 0)]",
  );
  run(code);
});
test("label: break semplice non termina il ciclo esterno", () => {
  let code = replaceOnce(
    source(0, "Label con break e continue"),
    "row in 0..3",
    "row in 0..4",
  );
  code = replaceOnce(code, "break 'rows;", "break;");
  code = replaceOnce(
    code,
    "vec![(0, 0), (1, 0), (2, 0)]",
    "vec![(0, 0), (1, 0), (2, 0), (3, 0)]",
  );
  run(code);
});
test("blocco: ricerca vuota, duplicati, righe irregolari e estremi", () => {
  run(
    probe(
      0,
      "Un blocco etichettato restituisce un valore",
      `
    assert_eq!(find_position(&[], 1), None);
    assert_eq!(find_position(&[&[], &[]], 1), None);
    assert_eq!(find_position(&[&[], &[4, 4], &[4]], 4), Some((1, 0)));
    assert_eq!(find_position(&[&[i32::MIN, i32::MAX]], i32::MAX), Some((0, 1)));
  `,
    ),
  );
});
test("blocco: continue a blocco non ciclico rifiutato", () => {
  run(
    `
    fn main() { 'target: { continue 'target; } }
  `,
    /continue.*labeled block|cannot.*continue/,
  );
});
test("blocco: codice esterno prosegue dopo break con valore", () => {
  run(`
    fn main() {
        let mut visited = Vec::new();
        let result = 'target: {
            visited.push(1);
            if visited.len() == 1 { break 'target 7; }
            9
        };
        visited.push(2);
        assert_eq!(result, 7);
        assert_eq!(visited, vec![1, 2]);
    }
  `);
});
test("let else: zero non e assenza, tutte None non fanno lavoro", () => {
  let code = replaceOnce(
    source(0, "Let else e uscita locale"),
    "[Some(0), None, Some(7)]",
    "[None::<i32>, None, None]",
  );
  code = replaceOnce(
    code,
    "assert_eq!(present, vec![0, 7]);",
    "assert!(present.is_empty());",
  );
  run(code);
});
test("lettura: UTF-8, file vuoto, mancante e byte invalidi", () => {
  run(
    mainFor(
      0,
      "Propagare errori di lettura",
      String.raw`
    std::fs::write("fixture.txt", "ciao \u{e8}").unwrap();
    assert_eq!(load_text(Path::new("fixture.txt")).unwrap(), "ciao \u{e8}");
    std::fs::write("empty.txt", b"").unwrap();
    assert_eq!(load_text(Path::new("empty.txt")).unwrap(), "");
    assert_eq!(load_text(Path::new("missing.txt")).unwrap_err().kind(),
        std::io::ErrorKind::NotFound);
    std::fs::write("invalid.txt", [0xFF]).unwrap();
    assert_eq!(load_text(Path::new("invalid.txt")).unwrap_err().kind(),
        std::io::ErrorKind::InvalidData);
  `,
    ),
  );
});
test("lettura: CLI reale con percorso contenente spazi", () => {
  const code = replaceOnce(
    source(0, "Propagare errori di lettura"),
    "fn main() -> std::io::Result<()> {",
    'fn main() -> std::io::Result<()> {\nstd::fs::write("sample file.txt", "abc")?;',
  );
  assert.equal(
    run(code, undefined, undefined, [], "2024", ["sample file.txt"]),
    "3 byte\n",
  );
});
test("porta: estremi validi, errori distinti e sintassi non normalizzata", () => {
  run(
    probe(
      0,
      "Validare una porta senza confondere gli errori",
      `
    assert_eq!(parse_port(Some("1")), Ok(1));
    assert_eq!(parse_port(Some("+1")), Ok(1));
    assert_eq!(parse_port(Some("65535")), Ok(65535));
    for raw in ["65536", "-1", "", " 80", "80 "] {
        assert!(matches!(parse_port(Some(raw)), Err(PortError::Invalid(_))));
    }
    assert_eq!(parse_port(Some("000")), Err(PortError::Zero));
    assert_eq!(parse_port(None), Err(PortError::Missing));
  `,
    ),
  );
});
test("porta: map_err conserva il tipo di errore di parsing", () => {
  run(
    probe(
      0,
      "Validare una porta senza confondere gli errori",
      `
    match parse_port(Some("65536")) {
        Err(PortError::Invalid(error)) =>
            assert_eq!(error.kind(), &std::num::IntErrorKind::PosOverflow),
        _ => panic!("expected parse overflow"),
    }
  `,
    ),
  );
});
test("propagazione: ok_or converte Option in Result", () => {
  let code = replaceOnce(
    source(0, "Option in una funzione Result"),
    "let number = input?;",
    'let number = input.ok_or("mancante")?;',
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    `fn main() {
    assert_eq!(value(Some(0)), Ok(0));
    assert_eq!(value(None), Err("mancante"));
  }`,
  );
  run(code);
});
test("propagazione: conversione From compatibile su errore", () => {
  run(`
    use std::num::ParseIntError;
    #[derive(Debug)]
    struct Error(ParseIntError);
    impl From<ParseIntError> for Error {
        fn from(error: ParseIntError) -> Self { Self(error) }
    }
    fn parse(raw: &str) -> Result<u16, Error> { Ok(raw.parse::<u16>()?) }
    fn main() {
        assert_eq!(parse("12").unwrap(), 12);
        assert_eq!(parse("x").unwrap_err().0.kind(), &std::num::IntErrorKind::InvalidDigit);
    }
  `);
});
test("propagazione: ? nel loop esce dalla funzione al primo errore", () => {
  run(`
    use std::cell::Cell;
    fn parse_all(calls: &Cell<usize>) -> Result<Vec<u16>, std::num::ParseIntError> {
        let mut values = Vec::new();
        for raw in ["1", "bad", "2"] {
            calls.set(calls.get() + 1);
            values.push(raw.parse::<u16>()?);
        }
        Ok(values)
    }
    fn main() {
        let calls = Cell::new(0);
        assert!(parse_all(&calls).is_err());
        assert_eq!(calls.get(), 2);
    }
  `);
});
test("propagazione: ? nella closure non esce dalla funzione esterna", () => {
  run(`
    fn main() {
        let results: Vec<Result<u16, std::num::ParseIntError>> =
            ["1", "bad", "2"].into_iter().map(|raw| {
                let number = raw.parse::<u16>()?;
                Ok(number)
            }).collect();
        assert_eq!(results.len(), 3);
        assert_eq!(results[0], Ok(1));
        assert!(results[1].is_err());
        assert_eq!(results[2], Ok(2));
    }
  `);
});
test("uscita: Drop eseguito ma effetti esterni al blocco non annullati", () => {
  run(`
    use std::cell::RefCell;
    struct Guard<'a>(&'a RefCell<Vec<&'static str>>, &'static str);
    impl Drop for Guard<'_> {
        fn drop(&mut self) { self.0.borrow_mut().push(self.1); }
    }
    fn work(log: &RefCell<Vec<&'static str>>) -> Result<(), &'static str> {
        let _outer = Guard(log, "outer");
        {
            let _inner = Guard(log, "inner");
            log.borrow_mut().push("effect");
            Err("stop")?;
        }
        Ok(())
    }
    fn main() {
        let log = RefCell::new(Vec::new());
        assert_eq!(work(&log), Err("stop"));
        assert_eq!(*log.borrow(), vec!["effect", "inner", "outer"]);
    }
  `);
});
test("ControlFlow: primo negativo e valori limite", () => {
  run(
    probe(
      0,
      "Interrompere una visita con ControlFlow",
      `
    assert_eq!(first_negative(&[i32::MIN, -1]), Some(i32::MIN));
    assert_eq!(first_negative(&[i32::MAX, 0]), None);
    assert_eq!(first_negative(&[-1]), Some(-1));
  `,
    ),
  );
});
test("ControlFlow: la visita si ferma prima dei valori successivi", () => {
  run(`
    use std::ops::ControlFlow;
    fn main() {
        let mut seen = Vec::new();
        let result = [1, -2, -3].into_iter().try_for_each(|n| {
            seen.push(n);
            if n < 0 { ControlFlow::Break(n) } else { ControlFlow::Continue(()) }
        });
        assert_eq!(seen, vec![1, -2]);
        assert_eq!(result, ControlFlow::Break(-2));
    }
  `);
});
test("for_each: return nella callback non ferma la visita", () => {
  run(`
    fn main() {
        let mut calls = 0;
        let mut accepted = Vec::new();
        [1, -2, 3].into_iter().for_each(|n| {
            calls += 1;
            if n < 0 { return; }
            accepted.push(n);
        });
        assert_eq!(calls, 3);
        assert_eq!(accepted, vec![1, 3]);
    }
  `);
});
test("risultato: punto e virgola produce unit invece del numero", () => {
  run(
    `
    fn result() -> u32 { let value = if true { 1_u32; } else { 2_u32; }; value }
    fn main() {}
  `,
    "E0308",
  );
});

test("pattern: ASCII non e una classificazione Unicode", () => {
  run(
    probe(
      1,
      "Alternative e intervalli",
      String.raw`
    assert_eq!(character_kind('A'), "altra lettera ASCII");
    assert_eq!(character_kind('\u{e8}'), "altro");
    assert_eq!(character_kind('\u{660}'), "altro");
    for digit in '0'..='9' { assert_eq!(character_kind(digit), "cifra ASCII"); }
  `,
    ),
  );
});
test("pattern: binding @ verificato su tutti i 256 valori u8", () => {
  run(
    probe(
      1,
      "Binding con @ e parentesi",
      `
    for number in 0..=u8::MAX {
        let expected = if (1..=5).contains(&number) || number == 10 {
            Some(number)
        } else { None };
        assert_eq!(selected(number), expected);
    }
  `,
    ),
  );
});
test("pattern: @ senza parentesi non lega tutte le alternative", () => {
  run(
    replaceOnce(
      source(1, "Binding con @ e parentesi"),
      "number @ (1..=5 | 10)",
      "number @ 1..=5 | 10",
    ),
    "E0408",
  );
});
test("pattern: alternative con binding di tipi differenti", () => {
  run(
    `
    enum Value { Small(u8), Large(u16) }
    fn main() {
        match Value::Small(1) {
            Value::Small(n) | Value::Large(n) => { let _ = n; }
        }
    }
  `,
    "E0308",
  );
});
test("pattern: alternative con modi di binding differenti", () => {
  run(
    `
    fn main() {
        let pair = (1, 2);
        match pair {
            (ref value, 0) | (0, value) => { let _ = value; }
            _ => {}
        }
    }
  `,
    "E0409",
  );
});
test("pattern: guardia riguarda ogni alternativa", () => {
  run(
    probe(
      1,
      "Guardia applicata a tutte le alternative",
      `
    for number in 1..=3 {
        assert!(allowed(number, true));
        assert!(!allowed(number, false));
    }
    assert!(!above_limit(None, 0));
    assert!(above_limit(Some(i32::MAX), i32::MIN));
  `,
    ),
  );
});
test("pattern: alternative sovrapposte possono rivalutare la guardia", () => {
  run(`
    fn main() {
        let mut calls = 0;
        match (1, 1) {
            (1, _) | (_, 1) if { calls += 1; false } => panic!("unreachable"),
            _ => {}
        }
        assert_eq!(calls, 2);
    }
  `);
});
test("pattern: guardia non puo consumare il payload posseduto", () => {
  run(
    `
    fn consume(text: String) -> bool { !text.is_empty() }
    fn main() {
        match Some(String::from("a")) {
            Some(text) if consume(text) => {}
            _ => {}
        }
    }
  `,
    "E0507",
  );
});
test("pattern: ref mut richiede accesso mutabile", () => {
  run(
    replaceOnce(
      source(1, "Ref, ref mut e reference pattern"),
      "let mut message",
      "let message",
    ),
    "E0596",
  );
});
test("pattern: reference pattern non puo estrarre String da &String", () => {
  run(
    `
    fn main() {
        let value = String::from("a");
        let &owned = &value;
        drop(owned);
    }
  `,
    "E0507",
  );
});
test("pattern: prefisso completamente esplicito permette ref in edition 2024", () => {
  run(`
    fn main() {
        let value = Some(String::from("a"));
        if let &Some(ref text) = &value { assert_eq!(text, "a"); }
        assert_eq!(value.as_deref(), Some("a"));
    }
  `);
});
test("pattern: ref ridondante dopo ergonomics rifiutato", () => {
  run(
    replaceOnce(
      source(1, "Ref, ref mut e reference pattern"),
      "if let Some(ref text) = message",
      "if let Some(ref text) = &message",
    ),
    /binding modifiers may only be written when the default binding mode is.*move|cannot explicitly borrow within an implicitly-borrowing pattern/,
  );
});
test("pattern: frame corti, bordi errati e tag sconosciuto", () => {
  run(
    probe(
      1,
      "Pattern annidati e slice",
      `
    for data in [&[][..], &[0xAA][..], &[0xFF][..], &[0xAA, 0][..], &[0, 0xFF][..]] {
        assert_eq!(payload((1, data)), None);
    }
    assert_eq!(payload((0, &[0xAA, 0xFF])), None);
    assert_eq!(payload((255, &[0xAA, 0xFF])), None);
  `,
    ),
  );
});
test("pattern: payload vista senza copia e dati interni non validati", () => {
  run(
    probe(
      1,
      "Pattern annidati e slice",
      `
    let data = [0xAA, 0xFF, 0xAA, 0xFF];
    let body = payload((1, &data)).unwrap();
    assert_eq!(body, &[0xFF, 0xAA]);
    assert!(std::ptr::eq(body.as_ptr(), data[1..].as_ptr()));
  `,
    ),
  );
});
test("pattern: payload non sopravvive all'input", () => {
  run(
    probe(
      1,
      "Pattern annidati e slice",
      `
    let result;
    { let data = vec![0xAA, 1, 0xFF]; result = payload((1, &data)); }
    println!("{result:?}");
  `,
    ),
    "E0597",
  );
});
test("token: confini numerici e lessico volutamente incompleto", () => {
  run(
    probe(
      1,
      "Classificare token gia costruiti",
      `
    for value in [0, 9] { assert_eq!(classify(&Token::Number(value)), "cifra"); }
    for value in [i64::MIN, -1, 10, i64::MAX] {
        assert_eq!(classify(&Token::Number(value)), "numero");
    }
    for name in ["", "match", "FN", "not an identifier"] {
        assert_eq!(classify(&Token::Ident(name.into())), "identificatore");
    }
    assert_eq!(classify(&Token::Ident("let".into())), "keyword");
    for symbol in ['(', ')', '{', '}'] {
        assert_eq!(classify(&Token::Symbol(symbol)), "delimitatore");
    }
    assert_eq!(classify(&Token::Symbol('[')), "simbolo");
  `,
    ),
  );
});
test("token: nuova variante richiede aggiornamento del match", () => {
  run(
    replaceOnce(
      source(1, "Classificare token gia costruiti"),
      "    Symbol(char),",
      "    Symbol(char),\n    End,",
    ),
    "E0004",
  );
});
test("pattern: forma ref esplicita per intero e campo condivisi", () => {
  run(
    replaceOnce(
      source(1, "Valore intero e campi in prestito"),
      "let whole @ Pair { left, .. } = &pair;",
      "let ref whole @ Pair { ref left, .. } = pair;",
    ),
  );
});
test("pattern: prestiti mutabili sovrapposti restano vietati", () => {
  run(
    `
    struct Pair { left: String }
    fn main() {
        let mut pair = Pair { left: "a".into() };
        let ref mut whole @ Pair { left: ref mut field } = pair;
        field.push('b');
        whole.left.push('c');
    }
  `,
    "E0499",
  );
});
test("pattern: prestito corregge il doppio move", () => {
  assert.equal(
    run(
      replaceOnce(
        source(1, "Due proprietari dello stesso campo"),
        "let whole @ Pair { left, .. } = pair;",
        "let whole @ Pair { left, .. } = &pair;",
      ),
    ),
    "due uno\n",
  );
});
test("pattern: due rest nello stesso pattern sono ambigui", () => {
  run(
    `fn main() { let (first, .., .., last) = (1, 2, 3, 4); let _ = (first, last); }`,
    /can only be used once/,
  );
});
