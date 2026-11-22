import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["From Into TryFrom e TryInto"];
const notes = names.map((name) =>
  parseNote("Programmazione/Rust/Pagine/" + name + ".md"),
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
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-conversions-";
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
      ...(options.args ?? []),
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error || options.message) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) =>
          d.level === "error" &&
          (options.error
            ? d.code?.code === options.error
            : options.message.test(d.message)),
      ),
      compiled.stderr,
    );
    if (options.detail) assert.match(compiled.stderr, options.detail);
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, [], dir);
  if (options.panic) {
    assert.equal(execution.status, 101, execution.stdout + execution.stderr);
    assert.match(execution.stderr, options.panic);
    return;
  }
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
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
function probe(i, heading, extra) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + extra,
  );
}

const wrapper = "Una sola implementazione per ogni direzione";
const constructor = "Costruttore con Into senza conversioni anticipate";
const numeric = "Conversioni numeriche e bound fallibili";
const port = "Porta configurata con parsing e validazione separati";
const borrowed = "Conversione che restituisce una vista borrowed";
const recover = "Recuperare un input posseduto attraverso l'errore";
const overlap = "From e TryFrom in conflitto sulla stessa coppia";
const chain = "Le conversioni non sono concatenate automaticamente";
const from = (heading) => source(0, heading);
const portProbe = (code) =>
  replaceOnce(
    from(port),
    "fn main() -> Result<(), PortError> {",
    "fn main() -> Result<(), PortError> {\n" + code,
  );
const errorImpl = `impl From<ParseIntError> for PortError {
    fn from(error: ParseIntError) -> Self {
        Self::InvalidNumber(error)
    }
}`;

test("porta pubblica: anche il tipo di errore esposto deve essere pubblico", () => {
  const publicPort = replaceOnce(
    from(port),
    "struct Port(u16);",
    "pub struct Port(u16);",
  );
  run(publicPort, { error: "E0446" });
  run(replaceOnce(publicPort, "enum PortError {", "pub enum PortError {"));
});

test("toolchain e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});

test("metadati originali, template, fonti e generici inline", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/From Into TryFrom e TryInto.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "From, Into, TryFrom e TryInto",
  ]);
  for (const section of [
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
    assert(
      headings.some((n) => n.depth === 2 && text(n) === section),
      section,
    );
  }
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  const nodes = [];
  function walk(n) {
    nodes.push(n);
    for (const c of n.children ?? []) walk(c);
  }
  walk(note.tree);
  assert(!nodes.some((n) => n.type === "html"));
  for (const value of [
    "B: From<A>",
    "Result<B, B::Error>",
    "Result<B, A::Error>",
  ]) {
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  }
  for (const page of [
    "trait.From.html",
    "trait.TryFrom.html",
    "enum.Infallible.html",
  ])
    assert(
      note.source.includes("https://doc.rust-lang.org/std/convert/" + page),
    );
  assert.doesNotMatch(note.source, /@B[T]@/);
});

for (const [heading, code] of blocks[0]) {
  const errors = { [overlap]: "E0119", [chain]: "E0277" };
  test("nota: " + heading, () =>
    run(code, errors[heading] ? { error: errors[heading] } : {}),
  );
}
for (const heading of [numeric, port]) {
  test("ottimizzato: " + heading, () =>
    run(from(heading), { args: ["-C", "opt-level=3"] }),
  );
}

test("UserId: estremi, zero e blanket Infallible", () =>
  run(
    probe(
      0,
      wrapper,
      `
    for value in [0, 1, u64::MAX] {
        assert_eq!(UserId::from(value).0, value);
        let id: Result<UserId, std::convert::Infallible> = value.try_into();
        assert_eq!(id.unwrap().0, value);
    }
    for value in [i64::MIN, -1] { assert!(UserId::try_from(value).is_err()); }
    for value in [0, 1, i64::MAX] { assert_eq!(UserId::try_from(value).unwrap().0, value as u64); }
    assert_eq!(Into::<UserId>::into(1_u64).0, 1);
`,
    ),
  ));

test("UserId: direzione inversa non derivata", () =>
  run(
    probe(
      0,
      wrapper,
      `
    let _: u64 = UserId(1).into();
`,
    ),
    { error: "E0277" },
  ));

test("UserId: Into duplicato e conflitto", () =>
  run(
    from(wrapper) +
      `
impl Into<UserId> for u64 {
    fn into(self) -> UserId { UserId(self) }
}
`,
    { error: "E0119" },
  ));

test("costruttore: vuoto ammesso, copia da prestito indipendente", () =>
  run(
    probe(
      0,
      constructor,
      `
    assert_eq!(User::new("").name, "");
    assert_eq!(User::new(" \t").name, " \t");
    let mut source = String::from("Ada");
    let user = User::new(source.as_str());
    source.clear();
    assert_eq!(user.name, "Ada");
    assert_eq!(source, "");
`,
    ),
  ));

test("costruttore: String owned spostata", () =>
  run(
    probe(
      0,
      constructor,
      `
    let input = String::from("Ada");
    let _user = User::new(input);
    println!("{input}");
`,
    ),
    { error: "E0382" },
  ));

test("costruttore: into anticipato rende ambiguo l'input", () =>
  run(
    probe(
      0,
      constructor,
      `
    let _ = User::new("Ada".into());
`,
    ),
    { error: "E0283" },
  ));

test("into non ha parametri generici di metodo", () =>
  run(
    `
fn main() {
    let _ = "Ada".into::<String>();
}
`,
    { error: "E0107" },
  ));

test("numeri: tutti gli u16 verso u8", () =>
  run(
    probe(
      0,
      numeric,
      `
    for value in 0..=u16::MAX {
        let result = to_byte(value);
        if value <= u16::from(u8::MAX) {
            assert_eq!(result.unwrap(), value as u8);
        } else {
            assert!(result.is_err());
        }
    }
`,
    ),
  ));

test("bound TryInto: uso effettivo della impl diretta", () =>
  run(
    probe(
      0,
      numeric,
      `
    let result: Result<u8, &str> = to_byte(Custom(4));
    assert_eq!(result, Ok(4));
    assert_eq!(to_byte(Custom(0)), Err("zero"));
`,
    ) +
      `
struct Custom(u8);
impl TryInto<u8> for Custom {
    type Error = &'static str;
    fn try_into(self) -> Result<u8, Self::Error> {
        if self.0 == 0 { Err("zero") } else { Ok(self.0) }
    }
}
`,
  ));

test("float non convertibile tramite TryFrom standard", () =>
  run(
    `
fn main() { let _ = u8::try_from(1.0_f64); }
`,
    { error: "E0277" },
  ));

test("porta: tutti gli u16, parsing e TryInto equivalenti", () =>
  run(
    portProbe(`
    assert!(matches!(Port::try_from(0_u16), Err(PortError::Zero)));
    for value in 1..=u16::MAX {
        let from_number = Port::try_from(value)?;
        let text = value.to_string();
        let from_text: Port = text.parse()?;
        let via_try_into: Port = text.as_str().try_into()?;
        assert_eq!(from_number.0, value);
        assert_eq!(from_number, from_text);
        assert_eq!(from_number, via_try_into);
    }
`),
  ));

test("porta: grammatica ASCII, segno, whitespace e overflow", () =>
  run(
    portProbe(`
    for (text, value) in [("1", 1), ("+1", 1), ("00080", 80), ("65535", 65535)] {
        assert_eq!(Port::try_from(text)?.0, value);
    }
    for text in ["0", "+0", "000"] { assert!(matches!(Port::try_from(text), Err(PortError::Zero))); }
    for text in ["", " ", " 1", "1 ", "-1", "-0", "1_000", "0x50", "65536", "\u{ff11}", "\u{a0}80", "8.0"] {
        assert!(matches!(Port::try_from(text), Err(PortError::InvalidNumber(_))), "{text:?}");
    }
`),
  ));

test("porta: sorgente tipizzata, Display e causa non duplicata", () =>
  run(
    portProbe(`
    let err = Port::try_from("x").unwrap_err();
    assert_eq!(err.to_string(), "invalid port number");
    let source = err.source().unwrap().downcast_ref::<ParseIntError>().unwrap();
    assert_eq!(source.kind(), &std::num::IntErrorKind::InvalidDigit);
    let zero = Port::try_from(0_u16).unwrap_err();
    assert_eq!(zero.to_string(), "destination port must be nonzero");
    assert!(zero.source().is_none());
`),
  ));

test("porta: Error senza From non abilita question mark", () =>
  run(replaceOnce(from(port), errorImpl, ""), { error: "E0277" }));

test("porta: map_err esplicito sostituisce From", () =>
  run(
    replaceOnce(
      replaceOnce(from(port), errorImpl, ""),
      "let number = value.parse::<u16>()?;",
      "let number = value.parse::<u16>().map_err(PortError::InvalidNumber)?;",
    ),
  ));

test("porta: accettare zero viene rilevato", () =>
  run(replaceOnce(from(port), "if value == 0 {", "if false {"), {
    panic: /assertion failed/,
  }));

test("question mark non converte automaticamente il successo", () =>
  run(
    `
use std::convert::Infallible;
fn convert() -> Result<u16, Infallible> {
    let value: u16 = Ok::<u8, Infallible>(1)?;
    Ok(value)
}
fn main() { let _ = convert(); }
`,
    { error: "E0308" },
  ));

test("borrowed: trim Unicode e carattere invisibile non whitespace", () =>
  run(
    probe(
      0,
      borrowed,
      `
    assert_eq!(Label::try_from("\u{a0}Rust\u{2003}").unwrap().0, "Rust");
    assert_eq!(Label::try_from("\u{200b}").unwrap().0, "\u{200b}");
    assert!(Label::try_from("").is_err());
    let original = String::from(" Rust ");
    let view = Label::try_from(original.as_str()).unwrap();
    assert!(std::ptr::eq(view.0.as_ptr(), original[1..].as_ptr()));
`,
    ),
  ));

test("borrowed: restituire riferimento a String locale e vietato", () =>
  run(
    from(borrowed) +
      `
fn invalid<'a>() -> Label<'a> {
    let input = String::from("Rust");
    Label::try_from(input.as_str()).unwrap()
}
`,
    { error: "E0515" },
  ));

test("FromStr puo essere implementato su un tipo con lifetime non legato all'input", () =>
  run(`
use std::{marker::PhantomData, num::ParseIntError, str::FromStr};
struct Tagged<'a> { value: u32, marker: PhantomData<&'a ()> }
impl<'a> FromStr for Tagged<'a> {
    type Err = ParseIntError;
    fn from_str(input: &str) -> Result<Self, Self::Err> {
        Ok(Self {value: input.parse()?, marker: PhantomData})
    }
}
fn main() {
    let parsed: Tagged<'static> = {
        let text = String::from("7");
        text.parse().unwrap()
    };
    assert_eq!(parsed.value, 7);
}
`));

test("Vec fallito: input originale non riutilizzabile", () =>
  run(
    probe(
      0,
      recover,
      `
    let values = vec![String::from("one")];
    let _result: Result<[String; 2], _> = values.try_into();
    println!("{values:?}");
`,
    ),
    { error: "E0382" },
  ));

test("Vec e array: elementi senza Clone, recupero e array vuoto", () =>
  run(`
#[derive(Debug, PartialEq, Eq)]
struct Item(u8);
fn main() {
    let input = vec![Item(1)];
    let err: Result<[Item; 2], _> = input.try_into();
    let mut input = err.unwrap_err();
    assert_eq!(input, [Item(1)]);
    input.push(Item(2));
    let array: [Item; 2] = input.try_into().unwrap();
    assert_eq!(array, [Item(1), Item(2)]);
    let empty: [Item; 0] = Vec::<Item>::new().try_into().unwrap();
    assert_eq!(empty.len(), 0);
}
`));

test("conflitto: rimuovere From consente la sola conversione fallibile", () =>
  run(
    replaceOnce(
      replaceOnce(
        from(overlap),
        `impl From<u8> for Count {
    fn from(value: u8) -> Self {
        Self(value)
    }
}`,
        "",
      ),
      "fn main() {}",
      "fn main() { assert!(Count::try_from(0).is_err()); assert_eq!(Count::try_from(1).unwrap().0, 1); }",
    ),
  ));

test("catena: conversioni esplicite risolvono il controesempio", () =>
  run(
    replaceOnce(
      from(chain),
      "Raw(7).into()",
      "Final::from(Middle::from(Raw(7)))",
    ),
  ));

test("TryFrom non e nel prelude 2018", () =>
  run(from(wrapper), { edition: "2018", error: "E0405" }));
test("import esplicito rende il programma compatibile con edition 2018", () =>
  run("use std::convert::{TryFrom, TryInto};\n" + from(wrapper), {
    edition: "2018",
  }));
