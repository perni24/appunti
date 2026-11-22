import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Generics", "Traits", "Trait bounds"];
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
const prefix = "appunti-rust-generics-traits-";
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
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === options.error,
      ),
      compiled.stderr,
    );
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, [], dir);
  if (options.panic) {
    assert.equal(execution.status, 101, execution.stdout + execution.stderr);
    assert.match(execution.stderr, options.panic);
    return;
  }
  assert.equal(execution.status, 0, execution.stdout + execution.stderr);
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
function probe(i, heading, extra) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + extra,
  );
}

test("toolchain reale e inventario: 21 programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [7, 6, 8],
  );
});
const errors = new Map([
  ["Usare un'operazione non dichiarata", "E0369"],
  ["Implementare un trait esterno per un tipo esterno", "E0117"],
  ["Bound assente anche se la chiamata usa un tipo valido", "E0277"],
]);
for (const [i, note] of notes.entries()) {
  test(names[i] + ": metadati e gerarchia", () => {
    for (const [key, value] of Object.entries({
      area: "Programmazione",
      topic: "Rust",
      type: "technical-note",
      status: "non revisionato",
      publish: true,
      date: "2026-05-21",
    }))
      assert.equal(note.data[key], value);
    const headings = note.tree.children.filter((n) => n.type === "heading");
    assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
      note.data.title,
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
    ])
      assert.ok(
        headings.some((n) => n.depth === 2 && text(n) === section),
        section,
      );
    for (let j = 1; j < headings.length; j++)
      assert.ok(headings[j].depth <= headings[j - 1].depth + 1);
    assert.doesNotMatch(note.source, /@B[T]@/);
  });
  for (const [heading, code] of blocks[i])
    test(names[i] + ": " + heading, () =>
      run(code, errors.has(heading) ? { error: errors.get(heading) } : {}),
    );
}
test("identity: String spostata, non clonata", () =>
  run(
    replaceOnce(
      source(0, "Identita, inferenza e ownership"),
      'assert_eq!(returned, "rust");',
      'assert_eq!(returned, "rust"); println!("{original}");',
    ),
    { error: "E0382" },
  ));
test("identity: turbofish non converte u16 in u32", () =>
  run(
    probe(
      0,
      "Identita, inferenza e ownership",
      "let _ = identity::<u32>(20_u16);",
    ),
    { error: "E0308" },
  ));
test("identity: valore Copy e riferimento restano utilizzabili", () =>
  run(
    probe(
      0,
      "Identita, inferenza e ownership",
      `
    let number = 42_u32;
    assert_eq!(identity(number), number);
    let text = String::from("api");
    assert_eq!(identity(&text), "api");
    assert_eq!(text, "api");
  `,
    ),
  ));
test("same_pair: i tipi non possono essere indipendenti", () =>
  run(
    probe(
      0,
      "Un parametro condiviso o tipi indipendenti",
      'let _ = same_pair(1_u8, String::from("ready"));',
    ),
    { error: "E0308" },
  ));
test("Maybe: None senza contesto resta ambiguo", () =>
  run(
    probe(
      0,
      "Enum e informazione di tipo mancante",
      "let _missing = Maybe::None;",
    ),
    { error: "E0282" },
  ));
test("Wrapper: metodo concreto non disponibile per u8", () =>
  run(
    probe(
      0,
      "Struct e metodi generici",
      "let _ = Wrapper::new(7_u8).byte_len();",
    ),
    { error: "E0599" },
  ));
test("CacheEntry: il prestito ancora usato impedisce il move", () =>
  run(
    replaceOnce(
      source(0, "Una voce con chiave e valore indipendenti"),
      "let (key, value) = entry.into_parts();",
      'let (key, value) = entry.into_parts(); println!("{key_ref}:{value_ref}");',
    ),
    { error: "E0505" },
  ));
test("CacheEntry: tipi non Clone e Drop senza copie", () =>
  run(
    probe(
      0,
      "Una voce con chiave e valore indipendenti",
      `
    use std::cell::Cell;
    struct Payload<'a>(&'a Cell<u32>);
    impl Drop for Payload<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }
    let drops = Cell::new(0);
    let entry = CacheEntry::new((), Payload(&drops));
    assert_eq!(drops.get(), 0);
    let (_, payload) = entry.into_parts();
    assert_eq!(drops.get(), 0);
    drop(payload);
    assert_eq!(drops.get(), 1);
  `,
    ),
  ));
test("View: il lifetime non prolunga la sorgente", () =>
  run(
    probe(
      0,
      "Parametri lifetime e const",
      `
    let dangling;
    {
        let temporary = vec![1_u8];
        dangling = View { values: &temporary };
    }
    assert_eq!(dangling.values.len(), 1);
  `,
    ),
    { error: "E0597" },
  ));
test("Batch: lunghezze const diverse sono tipi diversi", () =>
  run(
    probe(
      0,
      "Parametri lifetime e const",
      "let _wrong: Batch<u8, 3> = Batch { values: [1_u8, 2] };",
    ),
    { error: "E0308" },
  ));
test("greater: il bound risolve il confronto, NaN resta incomparabile", () => {
  let code = replaceOnce(
    source(0, "Usare un'operazione non dichiarata"),
    "fn greater<T>",
    "fn greater<T: PartialOrd>",
  );
  code = replaceOnce(
    code,
    "fn main() {",
    `fn main() {
    assert!(!greater(f64::NAN, 1.0));
    assert!(!greater(1.0, f64::NAN));
    for left in 0..=255_u16 {
        for right in 0..=255_u16 {
            assert_eq!(greater(left as u8, right as u8), left > right);
        }
    }
  `,
  );
  run(code);
});
test("Summary: metodo omonimo non basta per il trait", () =>
  run(
    probe(
      1,
      "Definire, implementare e importare",
      `
    struct Lookalike;
    impl Lookalike { fn summarize(&self) -> String { String::from("fake") } }
    print_summary(&Lookalike);
  `,
    ),
    { error: "E0277" },
  ));
test("Summary: l'import del trait serve per il metodo", () =>
  run(
    replaceOnce(
      source(1, "Definire, implementare e importare"),
      "use content::{Article, Summary};",
      "use content::Article;\nuse content::Summary as OtherName;\n// Alias ancora in scope: rimosso nella controprova.",
    )
      .replace("use content::Summary as OtherName;", "")
      .replaceAll("&impl Summary", "&impl content::Summary")
      .replaceAll("as Summary>", "as content::Summary>"),
    { error: "E0599" },
  ));
test("Named: implementazione incompleta rifiutata", () =>
  run(
    probe(
      1,
      "Metodi richiesti, default e forwarding",
      "struct Missing; impl Named for Missing {}",
    ),
    { error: "E0046" },
  ));
test("Named: un metodo estraneo non appartiene all'impl del trait", () =>
  run(
    replaceOnce(
      source(1, "Metodi richiesti, default e forwarding"),
      "impl Named for Project {",
      "impl Named for Project { fn extra(&self) {}",
    ),
    { error: "E0407" },
  ));
test("Named: default usa il metodo richiesto", () =>
  run(
    probe(
      1,
      "Metodi richiesti, default e forwarding",
      `
    struct DefaultProject;
    impl Named for DefaultProject {
        fn name(&self) -> &str { "plain" }
    }
    assert_eq!(label(&DefaultProject), "name=plain");
    assert_eq!(label(&Box::new(DefaultProject)), "name=plain");
  `,
    ),
  ));
test("Named: non inoltrare label cambia il risultato del Box", () => {
  let code = replaceOnce(
    source(1, "Metodi richiesti, default e forwarding"),
    `    fn label(&self) -> String {
        (**self).label()
    }`,
    "",
  );
  code = replaceOnce(
    code,
    'assert_eq!(label(&boxed), "project=vault");',
    'assert_eq!(label(&boxed), "name=vault");',
  );
  code = replaceOnce(
    code,
    'assert_eq!(label(&erased), "project=vault");',
    'assert_eq!(label(&erased), "name=vault");',
  );
  run(code);
});
test("TextBuffer: ricevente self consuma la String", () =>
  run(
    replaceOnce(
      source(1, "Riceventi e ownership"),
      'assert_eq!(text, "api ready");',
      'assert_eq!(text, "api ready"); println!("{buffer}");',
    ),
    { error: "E0382" },
  ));
test("Validator: confini 0..82, Unicode e priorita errori", () =>
  run(
    probe(
      1,
      "Validazione con una policy dichiarata",
      `
    for unit in ["a", "\u{e9}", "\u{1f600}"] {
        for length in 0..=82 {
            let user = User { display_name: unit.repeat(length) };
            let expected = if length == 0 { Err(ValidationError::EmptyName) }
                else if length > 80 { Err(ValidationError::NameTooLong) }
                else { Ok(()) };
            assert_eq!(check_before_save(&user), expected);
        }
    }
    assert_eq!(check_before_save(&User { display_name: "\u{2003}".repeat(81) }),
        Err(ValidationError::EmptyName));
    assert_eq!(check_before_save(&User { display_name: format!("{}\n", "a".repeat(80)) }),
        Err(ValidationError::NameTooLong));
    assert_eq!(check_before_save(&User { display_name: "\n".into() }),
        Err(ValidationError::EmptyName));
  `,
    ),
  ));
test("Validator: intervalli di controllo ASCII e C1", () =>
  run(
    probe(
      1,
      "Validazione con una policy dichiarata",
      `
    for code in 0..=159 {
        let c = char::from_u32(code).unwrap();
        let user = User { display_name: format!("a{c}b") };
        let is_control = code < 32 || (127..=159).contains(&code);
        let expected = if is_control { Err(ValidationError::ControlCharacter) } else { Ok(()) };
        assert_eq!(check_before_save(&user), expected, "{code}");
    }
  `,
    ),
  ));
test("Validator: non normalizza, non escapa, non modifica", () =>
  run(
    probe(
      1,
      "Validazione con una policy dichiarata",
      `
    for text in ["  Luca  ", "<script>", "e\u{301}", "\u{200b}"] {
        let user = User { display_name: text.into() };
        assert_eq!(check_before_save(&user), Ok(()));
        assert_eq!(user.display_name, text);
    }
    assert_eq!(check_before_save(&User { display_name: "e\u{301}".repeat(41) }),
        Err(ValidationError::NameTooLong));
    assert!("@".contains('@'));
  `,
    ),
  ));
test("Validator: il compilatore non dimostra la policy", () =>
  run(
    probe(
      1,
      "Validazione con una policy dichiarata",
      `
    struct AlwaysValid;
    impl Validator for AlwaysValid {
        fn validate(&self) -> Result<(), ValidationError> { Ok(()) }
    }
    assert_eq!(check_before_save(&AlwaysValid), Ok(()));
  `,
    ),
  ));
test("coherence: un tipo locale nel Vec non rende locale il Vec", () =>
  run(
    `
use std::fmt;
struct Local;
impl fmt::Display for Vec<Local> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "local") }
}
fn main() {}
`,
    { error: "E0117" },
  ));
test("coherence: tipo locale nell'argomento del trait esterno e ammesso", () =>
  run(`
struct Local(u8);
impl From<Local> for String {
    fn from(value: Local) -> Self { format!("{}", value.0) }
}
fn main() { assert_eq!(String::from(Local(7)), "7"); }
`));
test("coherence: parametro non coperto prima del tipo locale rifiutato", () =>
  run(
    `
struct Local;
impl<T> From<Local> for T { fn from(_: Local) -> Self { panic!("not executed") } }
fn main() {}
`,
    { error: "E0210" },
  ));
test("coherence: impl sovrapposte non sono override", () =>
  run(
    `
trait Label { fn label(&self) -> &'static str { "default" } }
impl<T> Label for T {}
impl Label for u8 { fn label(&self) -> &'static str { "byte" } }
fn main() {}
`,
    { error: "E0119" },
  ));
test("supertrait: l'implementazione del requisito non viene generata", () =>
  run(
    `
trait Named { fn name(&self) -> &str; }
trait Detailed: Named {}
struct Item;
impl Detailed for Item {}
fn main() {}
`,
    { error: "E0277" },
  ));
test("bound: Debug non implica Clone", () =>
  run(
    probe(
      2,
      "Bound inline e where",
      "#[derive(Debug)] struct NoClone; let _ = clone_where(&NoClone);",
    ),
    { error: "E0277" },
  ));
test("bound: i due clone producono dati indipendenti", () =>
  run(
    probe(
      2,
      "Bound inline e where",
      `
    let original = vec![String::from("api")];
    let mut a = clone_inline(&original);
    let b = clone_where(&original);
    a[0].push('!');
    assert_eq!(original[0], "api");
    assert_eq!(b[0], "api");
  `,
    ),
  ));
test("impl Trait: parametro anonimo non ha turbofish nominabile", () =>
  run(probe(2, "impl Trait nei parametri", "let _ = render_anon::<u32>(&7);"), {
    error: "E0107",
  }));
test("impl Trait: T condiviso non accetta u32 e str insieme", () =>
  run(
    probe(2, "impl Trait nei parametri", 'let _ = same_type(&7_u32, &"api");'),
    { error: "E0308" },
  ));
test("Slot: render assente per Vec", () =>
  run(
    probe(
      2,
      "Bound solo sul metodo che ne ha bisogno",
      "let _ = Slot::new(vec![1_u8]).render();",
    ),
    { error: "E0599" },
  ));
test("Sized: togliere il rilassamento esclude str e dyn Display", () =>
  run(
    replaceOnce(
      source(2, "Rilassare Sized attraverso un riferimento"),
      "Display + ?Sized",
      "Display",
    ),
    { error: "E0277" },
  ));
test("Sized: non rende Display facoltativo", () =>
  run(
    probe(
      2,
      "Rilassare Sized attraverso un riferimento",
      "let _ = render(&vec![1_u8]);",
    ),
    { error: "E0277" },
  ));
test("associated item: contenitore non Display ma elementi Display", () =>
  run(
    probe(
      2,
      "Vincolo sul tipo di elemento",
      `
    assert_eq!(render_items(0..3), ["0", "1", "2"]);
    assert!(render_items(std::iter::empty::<u32>()).is_empty());
  `,
    ),
  ));
test("associated item: elemento senza Display rifiutato", () =>
  run(
    probe(
      2,
      "Vincolo sul tipo di elemento",
      "let _ = render_items([vec![1_u8]]);",
    ),
    { error: "E0277" },
  ));
test("join_display: tutte le lunghezze 0..64, separatori e Unicode", () =>
  run(
    probe(
      2,
      "Unire valori mostrabili",
      `
    for length in 0..=64 {
        let values: Vec<u16> = (0..length).collect();
        for separator in ["", ",", "::", "\u{e8}", "\0", "\n"] {
            let mut expected = String::new();
            for (i, value) in values.iter().enumerate() {
                if i > 0 { expected.push_str(separator); }
                expected.push_str(&format!("{value}"));
            }
            assert_eq!(join_display(&values, separator), expected);
        }
    }
  `,
    ),
  ));
test("join_display: non richiede Clone o Copy, non escapa", () =>
  run(
    probe(
      2,
      "Unire valori mostrabili",
      `
    struct NonClone(String);
    impl Display for NonClone {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.0)
        }
    }
    let values = [NonClone(String::from("<b>")), NonClone(String::from("a,b"))];
    assert_eq!(join_display(&values, ","), "<b>,a,b");
    assert_eq!(values[0].0, "<b>");
  `,
    ),
  ));
test("impl Trait risultato: due tipi diversi non bastano", () =>
  run(
    replaceOnce(
      source(2, "impl Trait nel risultato"),
      'String::from("pending")',
      '"pending"',
    ),
    { error: "E0308" },
  ));
test("static: un valore owned puo essere distrutto immediatamente", () =>
  run(`
fn consume<T: 'static>(value: T) { drop(value); }
fn main() { consume(String::from("api")); }
`));
test("static: un prestito locale non soddisfa il bound", () =>
  run(
    `
fn consume<T: 'static>(value: T) { drop(value); }
fn main() { let text = String::from("api"); consume(&text); }
`,
    { error: "E0597" },
  ));
