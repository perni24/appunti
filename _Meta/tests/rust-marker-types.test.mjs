import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Marker types.md";
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
const prefix = "appunti-rust-marker-types-";
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

const inhabited = "Marker abitabile e marker non abitabile";
const units = "Quantita con unita distinte";
const names = "Validazione con transizione controllata";
const buffer = "Trait marker con insieme di implementazioni chiuso";
const mix = "Mescolare unita diverse";
const wrongState = "Chiamare un metodo nello stato sbagliato";
const propagation = "Aspettarsi la propagazione di un trait ordinario";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}

test("baseline reale e sette programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 7);
});
test("frontmatter invariato, struttura tecnica e fonti", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Marker types",
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
  // Il parser del vault e CommonMark: la tabella GFM resta un paragrafo.
  const table = note.tree.children.find(
    (n) => n.type === "paragraph" && text(n).startsWith("| Concetto |"),
  );
  assert.ok(table);
  const rows = text(table).split("\n");
  assert.equal(rows.length, 7);
  for (const row of rows) assert.equal(row.split("|").length, 4);
  for (const url of [
    "https://doc.rust-lang.org/rust-by-example/generics/phantom.html",
    "https://doc.rust-lang.org/reference/special-types-and-traits.html#auto-traits",
    "https://doc.rust-lang.org/reference/visibility-and-privacy.html",
    "https://rust-lang.github.io/api-guidelines/future-proofing.html#sealed-traits-protect-against-downstream-implementations-c-sealed",
  ])
    assert.ok(originalBytes.toString().includes(url));
  for (const code of blocks.values())
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
});
for (const title of [inhabited, units, names, buffer]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [mix, "E0308"],
  [wrongState, "E0599"],
  [propagation, "E0277"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}

test("unit struct costruibile e marker vuoto senza valore Pending", () => {
  run(
    main(
      inhabited,
      "let _ = Ready; let tag = Tagged::<Pending>(PhantomData); assert_eq!(std::mem::size_of_val(&tag), 0); assert!(!std::mem::needs_drop::<Tagged<Pending>>());",
    ),
  );
});
test("un alias non introduce unita distinte", () => {
  run(
    "type Meters = f64; type Seconds = f64; fn distance(value: Meters) -> f64 { value } fn main() { let duration: Seconds = 10.0; assert_eq!(distance(duration), 10.0); }",
  );
});
test("unita: zero, zero negativo, subnormali e massimo finito", () => {
  run(
    main(
      units,
      "for value in [0.0, -0.0, f64::from_bits(1), f64::MIN_POSITIVE, 1.5, f64::MAX] { let q = Quantity::<Meters>::new(value).unwrap(); assert_eq!(q.value().to_bits(), value.to_bits()); }",
    ),
  );
});
test("unita: negativi, NaN e infinita rifiutati", () => {
  run(
    main(
      units,
      "for value in [-1.0, f64::MIN, f64::NAN, f64::INFINITY, f64::NEG_INFINITY] { assert!(Quantity::<Meters>::new(value).is_none()); }",
    ),
  );
});
test("unita: somma finita e overflow controllato", () => {
  run(
    main(
      units,
      "let sum = Quantity::<Meters>::new(1.25).unwrap().checked_add(Quantity::new(2.5).unwrap()).unwrap(); assert_eq!(sum.value(), 3.75); assert!(Quantity::<Meters>::new(f64::MAX).unwrap().checked_add(Quantity::new(f64::MAX).unwrap()).is_none());",
    ),
  );
});
test("unita: conversione cambia valore e rifiuta overflow", () => {
  run(
    main(
      units,
      "for (km, meters) in [(0.0, 0.0), (1.5, 1500.0), (2.0, 2000.0)] { assert_eq!(Quantity::<Kilometers>::new(km).unwrap().into_meters().unwrap().value(), meters); } assert!(Quantity::<Kilometers>::new(f64::MAX).unwrap().into_meters().is_none());",
    ),
  );
});
test("unita: API reale rifiuta somma fra marker diversi", () => {
  run(
    main(
      units,
      "let meters = Quantity::<Meters>::new(1.0).unwrap(); let seconds = Quantity::<units::Seconds>::new(1.0).unwrap(); let _ = meters.checked_add(seconds);",
    ),
    { error: "E0308" },
  );
});
test("unita: campi privati impediscono di saltare la policy", () => {
  run(
    main(
      units,
      "let _ = Quantity::<Meters> { value: -1.0, _unit: std::marker::PhantomData };",
    ),
    { error: "E0451" },
  );
});
test("unita: la conversione consuma il valore precedente", () => {
  run(
    main(
      units,
      "let km = Quantity::<Kilometers>::new(1.0).unwrap(); let _ = km.into_meters(); let _ = km.value();",
    ),
    { error: "E0382" },
  );
});
test("nomi: limiti inclusivi 3 e 32 e contenuto invariato", () => {
  run(
    main(
      names,
      'for value in ["aZ0".to_owned(), "_".repeat(32), "Luca_42".to_owned()] { let valid = Username::<Raw>::new(value.clone()).validate().unwrap_or_else(|_| panic!("valid")); assert_eq!(valid.as_str(), value); }',
    ),
  );
});
test("nomi: lunghezze 0, 2 e 33 rifiutate", () => {
  run(
    main(
      names,
      'for length in [0, 2, 33] { let input = "a".repeat(length); let (original, error) = match Username::<Raw>::new(input.clone()).validate() { Err(pair) => pair, Ok(_) => panic!("invalid") }; assert_eq!(error, ValidationError::Length); assert_eq!(original.into_inner(), input); }',
    ),
  );
});
test("nomi: tutti i byte ASCII rispettano la policy dichiarata", () => {
  run(
    main(
      names,
      "for byte in 0u8..=127 { let input = format!(\"a{}b\", char::from(byte)); let result = Username::<Raw>::new(input.clone()).validate(); let allowed = matches!(byte, b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'_'); assert_eq!(result.is_ok(), allowed, \"{byte}\"); if let Err((original, error)) = result { assert_eq!(error, ValidationError::Characters); assert_eq!(original.into_inner(), input); } }",
    ),
  );
});
test("nomi: spazi e Unicode rifiutati senza normalizzazione", () => {
  run(
    main(
      names,
      'for input in [" abc", "abc ", "a@b", "a\\u{e8}b", "a\\u{1f600}b", "a\\nb"] { let (original, error) = match Username::<Raw>::new(input.to_owned()).validate() { Err(pair) => pair, Ok(_) => panic!("invalid") }; assert_eq!(error, ValidationError::Characters); assert_eq!(original.into_inner(), input); }',
    ),
  );
});
test("nomi: lunghezza in byte e controllo Length prioritario", () => {
  run(
    main(
      names,
      'let input = "\\u{e8}".repeat(17); assert_eq!(input.len(), 34); let (_, error) = match Username::<Raw>::new(input).validate() { Err(pair) => pair, Ok(_) => panic!("invalid") }; assert_eq!(error, ValidationError::Length);',
    ),
  );
});
test("nomi: successo sposta la stessa allocazione String", () => {
  run(
    main(
      names,
      'let input = String::from("Luca_42"); let pointer = input.as_ptr(); let capacity = input.capacity(); let valid = Username::<Raw>::new(input).validate().unwrap_or_else(|_| panic!("valid")); assert_eq!(valid.as_str().as_ptr(), pointer); let inner = valid.into_inner(); assert_eq!(inner.capacity(), capacity); assert_eq!(inner, "Luca_42");',
    ),
  );
});
test("nomi: errore restituisce l'input senza perdere il buffer", () => {
  run(
    main(
      names,
      'let input = String::from("a@b"); let pointer = input.as_ptr(); let (raw, _) = match Username::<Raw>::new(input).validate() { Err(pair) => pair, Ok(_) => panic!("invalid") }; let mut input = raw.into_inner(); assert_eq!(input.as_ptr(), pointer); input.replace_range(1..2, "_"); let valid = Username::<Raw>::new(input).validate().unwrap_or_else(|_| panic!("valid")); assert_eq!(valid.as_str(), "a_b");',
    ),
  );
});
test("nomi: Raw non espone as_str", () => {
  run(
    main(
      names,
      'let raw = Username::<Raw>::new("abc".to_owned()); let _ = raw.as_str();',
    ),
    { error: "E0599" },
  );
});
test("nomi: nessun costruttore new per Validated", () => {
  run(
    main(
      names,
      'let _ = Username::<names::Validated>::new("bad@name".to_owned());',
    ),
    { error: "E0599" },
  );
});
test("nomi: campi privati impediscono un Validated arbitrario", () => {
  run(
    main(
      names,
      'let _ = Username::<names::Validated> { value: "@".to_owned(), _state: std::marker::PhantomData };',
    ),
    { error: "E0451" },
  );
});
test("nomi: as_str non consente mutazione", () => {
  run(
    main(
      names,
      'let valid = Username::<Raw>::new("abc".to_owned()).validate().unwrap_or_else(|_| panic!("valid")); valid.as_str().make_ascii_uppercase();',
    ),
    { error: "E0596" },
  );
});
test("nomi: validate consuma Raw", () => {
  run(
    main(
      names,
      'let raw = Username::<Raw>::new("abc".to_owned()); let _ = raw.validate(); let _ = raw.into_inner();',
    ),
    { error: "E0382" },
  );
});
test("nomi: into_inner rimuove il contratto e consente modifiche", () => {
  run(
    main(
      names,
      'let valid = Username::<Raw>::new("abc".to_owned()).validate().unwrap_or_else(|_| panic!("valid")); let mut text = valid.into_inner(); text.push(\'@\'); assert_eq!(text, "abc@");',
    ),
  );
});
test("buffer: vuoto, append ripetuti e Unicode senza policy sul testo", () => {
  run(
    main(
      buffer,
      'let empty = Buffer::<Writable>::new().freeze(); assert_eq!(empty.contents(), ""); let mut b = Buffer::<Writable>::new(); for text in ["Rust", " ", "\\u{e8}", ""] { b.append(text); } let pointer = b.contents().as_ptr(); let frozen = b.freeze(); assert_eq!(frozen.contents(), "Rust \\u{e8}"); assert_eq!(frozen.contents().as_ptr(), pointer);',
    ),
  );
});
test("buffer: ReadOnly non permette append", () => {
  run(
    main(
      buffer,
      'let mut frozen = Buffer::<Writable>::new().freeze(); frozen.append("x");',
    ),
    { error: "E0599" },
  );
});
test("buffer: freeze consuma il vecchio stato", () => {
  run(
    main(
      buffer,
      'let mut b = Buffer::<Writable>::new(); let _ = b.freeze(); b.append("x");',
    ),
    { error: "E0382" },
  );
});
test("buffer: campi privati", () => {
  run(
    main(
      buffer,
      "let _ = Buffer::<Writable> { data: String::new(), _mode: std::marker::PhantomData };",
    ),
    { error: "E0451" },
  );
});
test("buffer: implementazione CanWrite esterna impedita dal supertrait", () => {
  run(main(buffer, "struct External; impl buffers::CanWrite for External {}"), {
    error: "E0277",
  });
});
test("buffer: modulo sealed non accessibile dall'esterno", () => {
  run(
    main(
      buffer,
      "struct External; impl buffers::sealed::Sealed for External {}",
    ),
    { error: "E0603" },
  );
});
test("buffer: scelta runtime fra due stati richiede tipo comune", () => {
  run(
    main(
      buffer,
      "let b = Buffer::<Writable>::new(); let flag = true; let _state = if flag { b } else { b.freeze() };",
    ),
    { error: "E0308" },
  );
});
test("buffer: enum conserva dinamicamente stati diversi", () => {
  run(
    main(
      buffer,
      'enum State { Open(Buffer<Writable>), Closed(Buffer<buffers::ReadOnly>) } for flag in [false, true] { let b = Buffer::<Writable>::new(); let state = if flag { State::Open(b) } else { State::Closed(b.freeze()) }; match state { State::Open(mut b) => { b.append("x"); assert_eq!(b.contents(), "x"); }, State::Closed(b) => assert_eq!(b.contents(), "") } }',
    ),
  );
});
test("correzione: dato nel dominio atteso", () => {
  run(replace(from(mix), "Quantity::<Seconds>", "Quantity::<Meters>"));
});
test("correzione: il frammento ridotto usa lo stato che espone il metodo", () => {
  run(replace(from(wrongState), "Name::<Raw>", "Name::<Validated>"));
});
test("correzione: trait ordinario implementato esplicitamente", () => {
  run(
    replace(
      from(propagation),
      "struct Wrapper(Inner);",
      "struct Wrapper(Inner);\nimpl Trusted for Wrapper {}",
    ),
  );
});
