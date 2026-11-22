import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Structs", "Tuple structs", "Enums"];
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
const prefix = "appunti-rust-structs-enums-";
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
function run(code, errorCode, panicPattern, extraArgs = []) {
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

test("toolchain 1.99.1 e inventario di 19 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [6, 6, 7],
  );
});
for (const [i, note] of notes.entries()) {
  test(names[i] + ": metadati e gerarchia", () => {
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Rust");
    assert.equal(note.data.type, "technical-note");
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
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
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
test("Enums: prerequisito Pattern base, non circolo con Pattern Matching", () => {
  assert.ok(
    notes[2].data.prerequisites.includes(
      "[[Programmazione/Rust/Pagine/Pattern base]]",
    ),
  );
  assert.ok(
    !notes[2].data.prerequisites.includes(
      "[[Programmazione/Rust/Pagine/Pattern Matching]]",
    ),
  );
});
const failures = new Map([
  ["Campo mancante", "E0063"],
  ["Due wrapper non sono intercambiabili", "E0308"],
  ["Caso non coperto", "E0004"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(names[i] + ": " + heading, () => {
      const error = failures.get(heading);
      if (error) run(code, error);
      else assert.equal(run(code), "");
    });
  }
}

test("struct: shorthand sposta String", () => {
  run(
    replaceOnce(
      source(0, "Definire, costruire e leggere"),
      "assert_eq!(user.id, 1);",
      'assert_eq!(user.id, 1); println!("{email}");',
    ),
    "E0382",
  );
});
test("struct: campo mutato richiede accesso mutabile", () => {
  run(
    replaceOnce(
      source(0, "Definire, costruire e leggere"),
      "let mut user",
      "let user",
    ),
    "E0594",
  );
});
test("struct: receiver self consuma il valore", () => {
  run(
    replaceOnce(
      source(0, "Funzioni associate e receiver"),
      "let email = user.into_email();",
      'let email = user.into_email(); println!("{}", user.email());',
    ),
    "E0382",
  );
});
test("struct: ordine del literal e indipendente dalla dichiarazione", () => {
  run(
    replaceOnce(
      source(0, "Definire, costruire e leggere"),
      "User { id: 1, email, active: true }",
      "User { active: true, email, id: 1 }",
    ),
  );
});
test("struct update: campo String spostato non leggibile", () => {
  run(
    replaceOnce(
      source(0, "Aggiornare senza clonare implicitamente"),
      "assert_eq!(original.id, 1);",
      'assert_eq!(original.id, 1); println!("{}", original.email);',
    ),
    "E0382",
  );
});
test("struct update: valore completo non prestabile dopo move parziale", () => {
  run(
    replaceOnce(
      source(0, "Aggiornare senza clonare implicitamente"),
      "assert_eq!(original.id, 1);",
      "assert_eq!(original.id, 1); let _whole = &original;",
    ),
    "E0382",
  );
});
test("struct update: soli campi Copy lasciano la base completa valida", () => {
  run(
    replaceOnce(
      source(0, "Aggiornare senza clonare implicitamente"),
      "assert!(moved.active);",
      "assert!(moved.active); let whole = &moved; assert_eq!(whole.id, 2);",
    ),
  );
});
test("struct update: Drop sul contenitore vieta move del campo", () => {
  run(
    probe(
      0,
      "Aggiornare senza clonare implicitamente",
      "impl Drop for User { fn drop(&mut self) {} }",
    ),
    "E0509",
  );
});
test("Config: campi privati non leggibili dal main", () => {
  run(
    probe(
      0,
      "Configurazione con costruzione controllata",
      'let config = settings::Config::new("host", 1).unwrap(); println!("{}", config.host);',
    ),
    "E0616",
  );
});
test("Config: literal esterno non aggira new", () => {
  run(
    probe(
      0,
      "Configurazione con costruzione controllata",
      "let _invalid = settings::Config { host: String::new(), port: 0, debug: false };",
    ),
    "E0451",
  );
});
test("Config: validazione limitata e testo conservato", () => {
  run(
    probe(
      0,
      "Configurazione con costruzione controllata",
      String.raw`
for host in ["", " \t\n", "\u{00A0}"] {
 assert!(settings::Config::new(host, 1).is_err());
}
for host in [" host ", "::1", "not a dns name"] {
 let config = settings::Config::new(host, u16::MAX).unwrap();
 assert_eq!(config.endpoint(), (host, u16::MAX));
}
`,
    ),
  );
});
test("Config: testo posseduto anche dopo fine input borrowed", () => {
  run(
    probe(
      0,
      "Configurazione con costruzione controllata",
      String.raw`
let config;
{ let input = String::from("localhost"); config = settings::Config::new(input.as_str(), 1).unwrap(); }
assert_eq!(config.endpoint(), ("localhost", 1));
`,
    ),
  );
});
test("Config: clone e setter, Debug non e segretezza", () => {
  run(
    probe(
      0,
      "Configurazione con costruzione controllata",
      String.raw`
let first = settings::Config::new(String::from("private-host"), 1).unwrap();
let mut second = first.clone(); second.set_debug(true);
assert!(!first.debug_enabled()); assert!(second.debug_enabled());
assert!(format!("{first:?}").contains("private-host"));
`,
    ),
  );
});
test("struct update: un campo privato omesso impedisce la costruzione esterna", () => {
  run(
    String.raw`mod data {
 pub struct Value { pub count: u32, hidden: bool }
 pub fn new() -> Value { Value { count: 1, hidden: true } }
}
fn main() { let original = data::new(); let _updated = data::Value { count: 2, ..original }; }`,
    "E0451",
  );
});
test("View non sopravvive al proprietario", () => {
  run(
    probe(
      0,
      "Marker, generici e viste",
      'let view; { let owner = String::from("rust"); view = View { text: &owner }; } println!("{}", view.text);',
    ),
    "E0597",
  );
});
test("campo mancante: inizializzazione esplicita corregge il demo", () => {
  assert.equal(
    run(
      replaceOnce(
        source(0, "Campo mancante"),
        "Point { x: 1 }",
        "Point { x: 1, y: 2 }",
      ),
    ),
    "1\n",
  );
});

test("alias numerici restano intercambiabili", () => {
  run(
    "type UserId = u64; type OrderId = u64; fn load_user(id: UserId) -> u64 { id } fn main() { let order: OrderId = 42; assert_eq!(load_user(order), 42); }",
  );
});
test("UserId: costruttore tuple privato", () => {
  run(
    probe(
      1,
      "Identificativo con campo privato",
      "let _invalid = ids::UserId(0);",
    ),
    "E0603",
  );
});
test("UserId: campo interno privato", () => {
  run(
    probe(
      1,
      "Identificativo con campo privato",
      "let id = ids::UserId::new(1).unwrap(); let _raw = id.0;",
    ),
    "E0616",
  );
});
test("UserId: Hash ed Eq funzionano insieme, estremi validi", () => {
  run(
    probe(
      1,
      "Identificativo con campo privato",
      String.raw`
let maximum = ids::UserId::new(u64::MAX).unwrap();
assert_eq!(maximum.get(), u64::MAX);
let mut ids = std::collections::HashSet::new();
assert!(ids.insert(ids::UserId::new(1).unwrap()));
assert!(!ids.insert(ids::UserId::new(1).unwrap()));
assert!(ids.insert(maximum));
assert_eq!(ids.len(), 2);
`,
    ),
  );
});
test("UserId: get self consuma se Copy viene rimosso", () => {
  run(
    replaceOnce(
      source(1, "Identificativo con campo privato"),
      "Debug, Copy, Clone, PartialEq, Eq, Hash",
      "Debug, Clone, PartialEq, Eq, Hash",
    ),
    "E0382",
  );
});
test("tuple struct: destructuring per valore sposta il contenuto", () => {
  run(
    replaceOnce(
      source(1, "Destructuring e ownership"),
      "let Label(owned) = label;",
      'let Label(owned) = label; println!("{}", label.0);',
    ),
    "E0382",
  );
});
test("wrapper non inoltra metodi del campo", () => {
  run(
    probe(
      1,
      "Destructuring e ownership",
      'let value = Label(String::from("x")); let _len = value.len();',
    ),
    "E0599",
  );
});
test("temperature: valori comuni, negativi e zero", () => {
  run(
    probe(
      1,
      "Unita di misura distinte",
      String.raw`
for (input, expected) in [(0.0, 32.0), (100.0, 212.0), (-40.0, -40.0), (-300.0, -508.0)] {
 let result = celsius_to_fahrenheit(Celsius(input)).unwrap();
 assert!((result.0 - expected).abs() < 1e-10);
}
`,
    ),
  );
});
test("temperature: non finiti e overflow del risultato", () => {
  run(
    probe(
      1,
      "Unita di misura distinte",
      String.raw`
for value in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY, f64::MAX, f64::MIN] {
 assert_eq!(celsius_to_fahrenheit(Celsius(value)), None);
}
`,
    ),
  );
});
test("temperature: f64 grezzo non accettato", () => {
  run(
    probe(
      1,
      "Unita di misura distinte",
      "let _result = celsius_to_fahrenheit(20.0);",
    ),
    "E0308",
  );
});
test("temperature: Eq su f64 non derivabile", () => {
  run(
    replaceOnce(
      source(1, "Unita di misura distinte"),
      "#[derive(Debug, Copy, Clone, PartialEq)]\nstruct Celsius",
      "#[derive(Debug, Copy, Clone, PartialEq, Eq)]\nstruct Celsius",
    ),
    "E0277",
  );
});
test("Display produce testo, non valida o fa escaping", () => {
  run(
    probe(
      1,
      "Esporre un comportamento scelto",
      String.raw`assert_eq!(Username(String::from("<x>\n")).to_string(), "utente: <x>\n");`,
    ),
  );
});
test("repr transparent: dimensione e allineamento del singolo campo", () => {
  run(String.raw`#[repr(transparent)] struct Id(u64);
fn main() {
 assert_eq!(std::mem::size_of::<Id>(), std::mem::size_of::<u64>());
 assert_eq!(std::mem::align_of::<Id>(), std::mem::align_of::<u64>());
}`);
});

test("enum: descrizione borrowed non consuma e non valida ricevute", () => {
  run(
    probe(
      2,
      "Tre forme nello stesso tipo",
      String.raw`
let paid = OrderState::Paid { receipt: String::new() };
assert_eq!(describe(&paid), "pagato: ");
assert_eq!(describe(&paid), "pagato: ");
`,
    ),
  );
});
test("Message: tutti i rami non testuali e modifiche ripetute", () => {
  run(
    probe(
      2,
      "Metodi, modifica e consumo",
      String.raw`
for mut value in [Message::Quit, Message::Move { x: i32::MIN, y: i32::MAX }, Message::ChangeColor(0, 255, 0)] {
 value.append_marker(); assert!(value.into_text().is_none());
}
let mut empty = Message::Write(String::new());
empty.append_marker(); empty.append_marker();
assert_eq!(empty.into_text(), Some(String::from("!!")));
`,
    ),
  );
});
test("Message: into_text trasferisce la proprieta del buffer", () => {
  run(
    probe(
      2,
      "Metodi, modifica e consumo",
      String.raw`
let payload = String::from("rust"); let pointer = payload.as_ptr();
let value = Message::Write(payload);
let text = value.into_text().unwrap();
assert_eq!(text.as_ptr(), pointer);
`,
    ),
  );
});
test("Message: dopo consumo non utilizzabile", () => {
  run(
    probe(
      2,
      "Metodi, modifica e consumo",
      'let value = Message::Write(String::from("x")); let _text = value.into_text(); println!("{}", value.kind());',
    ),
    "E0382",
  );
});
test("enum: nuova variante richiede aggiornamento match esplicito", () => {
  run(
    replaceOnce(
      source(2, "Tre forme nello stesso tipo"),
      "    Cancelled,",
      "    Cancelled,\n    Returned,",
    ),
    "E0004",
  );
});
test("enum: variante unitaria non accetta payload", () => {
  run(
    probe(
      2,
      "Comandi con dati pertinenti",
      "let _invalid = Command::List(42);",
    ),
    "E0618",
  );
});
test("Command: riepilogo non valida titolo o id", () => {
  run(
    probe(
      2,
      "Comandi con dati pertinenti",
      String.raw`
assert_eq!(command_summary(Command::Add { title: String::new() }), "aggiungo ");
assert_eq!(command_summary(Command::Remove(0)), "rimuovo 0");
`,
    ),
  );
});
test("enum pubblico: payload e varianti accessibili", () => {
  run(String.raw`mod api { pub enum Event { Data { text: String }, Empty } }
fn main() {
 let event = api::Event::Data { text: String::from("x") };
 match event { api::Event::Data { text } => assert_eq!(text, "x"), api::Event::Empty => panic!() }
}`);
});
test("Option Result: assenza distinta da zero, vuoto e fuori range", () => {
  run(
    probe(
      2,
      "Enum generici gia disponibili",
      String.raw`
assert_eq!(parse_limit(Some("0")).unwrap(), Some(0));
assert_eq!(parse_limit(Some("4294967295")).unwrap(), Some(u32::MAX));
for input in ["", " ", "-1", "4294967296", "12x"] { assert!(parse_limit(Some(input)).is_err()); }
`,
    ),
  );
});
test("enum ricorsivo: indirezione necessaria", () => {
  run("enum List { Empty, Node(i32, List) } fn main() {}", "E0072");
});
test("enum ricorsivo: catena piccola, payload conservato", () => {
  run(
    probe(
      2,
      "Ricorsione con indirezione",
      String.raw`
let mut values = List::Empty;
for value in 0..8 { values = List::Node(value, Box::new(values)); }
assert_eq!(values.len(), 8);
match &values { List::Node(value, _) => assert_eq!(*value, 7), List::Empty => panic!() }
`,
    ),
  );
});
test("enum con String non puo derivare Copy", () => {
  run(
    replaceOnce(
      source(2, "Comandi con dati pertinenti"),
      "#[derive(Debug)]",
      "#[derive(Debug, Clone, Copy)]",
    ),
    "E0204",
  );
});
test("discriminanti: cast inverso numerico non valido", () => {
  run(
    probe(2, "Discriminanti espliciti", "let _priority = 1_u8 as Priority;"),
    "E0605",
  );
});
test("discriminanti: codici duplicati rifiutati", () => {
  run(
    replaceOnce(source(2, "Discriminanti espliciti"), "High = 2", "High = 1"),
    "E0081",
  );
});
test("non_exhaustive non cambia match dentro la crate", () => {
  let code = replaceOnce(
    source(2, "Caso non coperto"),
    "enum State",
    "#[non_exhaustive]\nenum State",
  );
  code = replaceOnce(
    code,
    "State::Ready => true,",
    "State::Ready => true,\n        State::Busy => false,",
  );
  run(code);
});
test("non_exhaustive: consumer in crate separata richiede wildcard", () => {
  const dir = path.join(root, "external-api");
  fs.mkdirSync(dir);
  const lib = path.join(dir, "libapi.rlib");
  fs.writeFileSync(
    path.join(dir, "lib.rs"),
    "#[non_exhaustive] pub enum State { Ready, Busy }",
  );
  ok(
    launch(
      rustc,
      [
        "--edition=2024",
        "--crate-name",
        "api",
        "--crate-type",
        "rlib",
        "lib.rs",
        "-o",
        lib,
      ],
      dir,
    ),
  );
  const consumer =
    "use api::State; fn ready(value: State) -> bool { match value { State::Ready => true, State::Busy => false } } fn main() { assert!(ready(State::Ready)); assert!(!ready(State::Busy)); }";
  run(consumer, "E0004", undefined, ["--extern", "api=" + lib]);
  run(
    replaceOnce(
      consumer,
      "State::Busy => false",
      "State::Busy => false, _ => false",
    ),
    undefined,
    undefined,
    ["--extern", "api=" + lib],
  );
});
