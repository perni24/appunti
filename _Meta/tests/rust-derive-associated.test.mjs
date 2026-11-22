import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Derive traits", "Associated types"];
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
const prefix = "appunti-rust-derive-associated-";
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

test("toolchain reale e inventario: 17 programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [9, 8],
  );
});
const errors = new Map([
  ["Un campo f64 non soddisfa Eq", "E0277"],
  ["Il campo e clonabile ma il derive impone un bound in piu", "E0277"],
  ["Omettere il tipo richiesto nell'impl", "E0046"],
  ["Dare un default al tipo associato su stable", "E0658"],
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
test("UserId: Clone non rende Copy il contenitore", () =>
  run(
    probe(
      0,
      "Il derive genera un contratto concreto",
      `
    let id = UserId(1);
    let moved = id;
    assert_eq!(id, moved);
  `,
    ),
    { error: "E0382" },
  ));
test("Wrapper: esistenza del tipo non implica Clone", () =>
  run(
    probe(
      0,
      "Implementazione condizionale sui generici",
      `
    fn require_clone<T: Clone>(_: &T) {}
    require_clone(&Wrapper { value: NotClone });
  `,
    ),
    { error: "E0277" },
  ));
test("derive: Ord non genera i supertrait", () =>
  run(
    `
#[derive(Ord)]
struct Id(u32);
fn main() {}
`,
    { error: "E0277" },
  ));
test("derive: Copy non disponibile per String", () =>
  run(
    `
#[derive(Clone, Copy)]
struct Text(String);
fn main() {}
`,
    { error: "E0204" },
  ));
test("derive: Copy incompatibile con Drop", () =>
  run(
    `
#[derive(Clone, Copy)]
struct Handle(u32);
impl Drop for Handle { fn drop(&mut self) {} }
fn main() {}
`,
    { error: "E0184" },
  ));
test("Point: confronto lessicografico su 81 punti ed estremi", () =>
  run(
    probe(
      0,
      "I nove derive standard",
      `
    let values = [i32::MIN, -10, -2, -1, 0, 1, 2, 10, i32::MAX];
    for x1 in values { for y1 in values {
        for x2 in values { for y2 in values {
            let a = Point { x: x1, y: y1 };
            let b = Point { x: x2, y: y2 };
            assert_eq!(a.cmp(&b), (x1, y1).cmp(&(x2, y2)));
            assert_eq!(a.partial_cmp(&b), Some(a.cmp(&b)));
            assert_eq!(a == b, x1 == x2 && y1 == y2);
        }}
    }}
  `,
    ),
  ));
test("derive: cambiare ordine dei campi cambia ordinamento", () =>
  run(
    probe(
      0,
      "I nove derive standard",
      `
    #[derive(PartialEq, Eq, PartialOrd, Ord)]
    struct YFirst { y: i32, x: i32 }
    let a = Point { x: 1, y: 9 };
    let b = Point { x: 2, y: 0 };
    assert!(a < b);
    assert!(YFirst { y: a.y, x: a.x } > YFirst { y: b.y, x: b.x });
  `,
    ),
  ));
test("enum: discriminante prima del payload per tutti gli u8", () =>
  run(
    probe(
      0,
      "Ordinamento degli enum",
      `
    for a in 0..=255_u8 {
        assert!(Phase::Queued(a) < Phase::Done);
        for b in 0..=255_u8 {
            assert_eq!(Phase::Queued(a).cmp(&Phase::Queued(b)), a.cmp(&b));
        }
    }
  `,
    ),
  ));
test("Default: non chiama new o validatori", () =>
  run(`
#[derive(Default)]
struct Options { attempts: u8 }
impl Options { fn new() -> Self { Self { attempts: 3 } } }
fn main() {
    assert_eq!(Options::default().attempts, 0);
    assert_eq!(Options::new().attempts, 3);
}
`));
test("Default: variante unitaria non richiede Default agli altri payload", () =>
  run(
    probe(
      0,
      "Default di un enum",
      `
    for _ in 0..3 { assert!(matches!(State::default(), State::Open)); }
    let value = State::WithData(Payload(String::new()));
    assert!(matches!(value, State::WithData(_)));
  `,
    ),
  ));
test("HashSet: deduplicazione di 65536 ID senza ordine assunto", () =>
  run(
    probe(
      0,
      "Deduplicare identificativi con HashSet",
      `
    let mut all = HashSet::new();
    for n in 0..=u16::MAX { assert!(all.insert(UserId(u64::from(n)))); }
    for n in 0..=u16::MAX { assert!(!all.insert(UserId(u64::from(n)))); }
    assert_eq!(all.len(), 65536);
    assert!(all.contains(&UserId(0)));
    assert!(all.insert(UserId(u64::MAX)));
  `,
    ),
  ));
test("Eq/Hash: chiavi uguali hanno hash uguale senza golden values", () =>
  run(
    probe(
      0,
      "Deduplicare identificativi con HashSet",
      `
    use std::hash::{DefaultHasher, Hash, Hasher};
    fn hash<T: Hash>(value: &T) -> u64 {
        let mut h = DefaultHasher::new();
        value.hash(&mut h);
        h.finish()
    }
    for n in [0, 1, 2, u64::MAX] {
        let a = UserId(n);
        let b = UserId(n);
        assert_eq!(a, b);
        assert_eq!(hash(&a), hash(&b));
    }
  `,
    ),
  ));
test("HashSet: Copy non e necessario", () =>
  run(
    replaceOnce(
      source(0, "Deduplicare identificativi con HashSet"),
      "Debug, Clone, Copy, PartialEq, Eq, Hash",
      "Debug, PartialEq, Eq, Hash",
    ),
  ));
test("derive: Clone di un campo Rc conserva condivisione", () =>
  run(`
use std::cell::Cell;
use std::rc::Rc;
#[derive(Clone)]
struct State { shared: Rc<Cell<u32>> }
fn main() {
    let a = State { shared: Rc::new(Cell::new(1)) };
    let b = a.clone();
    b.shared.set(9);
    assert_eq!(a.shared.get(), 9);
    assert!(Rc::ptr_eq(&a.shared, &b.shared));
}
`));
test("Shared manuale: clone non duplica il payload, Drop una sola volta", () =>
  run(
    probe(
      0,
      "Implementazione manuale per bound meno restrittivi",
      `
    use std::cell::Cell;
    struct Payload<'a>(&'a Cell<u32>);
    impl Drop for Payload<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }
    let dropped = Cell::new(0);
    let first = Shared(Rc::new(Payload(&dropped)));
    let second = first.clone();
    drop(first);
    assert_eq!(dropped.get(), 0);
    drop(second);
    assert_eq!(dropped.get(), 1);
  `,
    ),
  ));
test("derive: impl manuale dello stesso trait crea un conflitto", () =>
  run(
    `
#[derive(Clone)]
struct Item;
impl Clone for Item { fn clone(&self) -> Self { Item } }
fn main() {}
`,
    { error: "E0119" },
  ));
test("Debug: campo privato incluso, non test di formato stabile", () =>
  run(`
mod data {
    #[derive(Debug)]
    pub struct Record { secret: String }
    pub fn example() -> Record { Record { secret: String::from("demo-not-a-real-secret") } }
}
fn main() {
    let output = format!("{:?}", data::example());
    assert!(output.contains("demo-not-a-real-secret"));
}
`));
test("f64: PartialEq senza Eq ammette NaN non riflessivo", () =>
  run(
    replaceOnce(
      source(0, "Un campo f64 non soddisfa Eq"),
      "PartialEq, Eq",
      "PartialEq",
    ).replace(
      "fn main() {}",
      `
fn main() {
    let reading = Measurement(f64::NAN);
    assert!(reading != reading);
    assert!(Measurement(1.0) == Measurement(1.0));
}
`,
    ),
  ));
test("Counter: tutte le 676 coppie 0..25, inclusi intervalli vuoti", () =>
  run(
    probe(
      1,
      "Un producer finito, anche al limite numerico",
      `
    for start in 0..=25_u32 {
        for end in 0..=25_u32 {
            let mut counter = Counter::new(start, end);
            let mut actual = Vec::new();
            for _ in 0..=26 {
                match counter.next() {
                    Some(value) => actual.push(value),
                    None => break,
                }
            }
            let expected: Vec<_> = if start <= end { (start..=end).collect() } else { vec![] };
            assert_eq!(actual, expected);
            assert_eq!(counter.next(), None);
            assert_eq!(counter.next(), None);
        }
    }
  `,
    ),
  ));
test("Counter: ultimi tre u32 e nessun wraparound", () =>
  run(
    probe(
      1,
      "Un producer finito, anche al limite numerico",
      `
    let mut edge = Counter::new(u32::MAX - 2, u32::MAX);
    assert_eq!(first(&mut edge), Some(u32::MAX - 2));
    assert_eq!(first(&mut edge), Some(u32::MAX - 1));
    assert_eq!(first(&mut edge), Some(u32::MAX));
    assert_eq!(first(&mut edge), None);
    let mut empty = Counter::new(u32::MAX, 0);
    assert_eq!(first(&mut empty), None);
  `,
    ),
  ));
test("Producer: non diventa Iterator automaticamente", () =>
  run(
    probe(
      1,
      "Un producer finito, anche al limite numerico",
      "let _ = Counter::new(0, 2).map(|n| n);",
    ),
    { error: "E0599" },
  ));
test("Producer: una seconda impl con Item diverso e un conflitto", () =>
  run(
    source(1, "Un producer finito, anche al limite numerico") +
      `
impl Producer for Counter {
    type Item = String;
    fn next(&mut self) -> Option<Self::Item> { None }
}
`,
    { error: "E0119" },
  ));
test("debug_items: Debug del contenitore non garantisce Debug dell'Item", () =>
  run(
    probe(
      1,
      "Richiedere una capacita del tipo associato",
      `
    struct Hidden;
    #[derive(Debug)]
    struct Once;
    impl Iterator for Once {
        type Item = Hidden;
        fn next(&mut self) -> Option<Self::Item> { None }
    }
    let _ = debug_items(Once);
  `,
    ),
    { error: "E0277" },
  ));
test("associated type con bound: implementazione deve soddisfarlo", () =>
  run(
    `
trait Source { type Item: std::fmt::Debug; }
struct Hidden;
struct SourceImpl;
impl Source for SourceImpl { type Item = Hidden; }
fn main() {}
`,
    { error: "E0277" },
  ));
test("Item=String: riferimento a String non accettato", () =>
  run(
    replaceOnce(
      source(1, "Imporre un tipo esatto"),
      "borrowed.iter().cloned()",
      "borrowed.iter()",
    ),
    { error: "E0271" },
  ));
test("collect_strings: vuoto, Unicode e ordine, copie indipendenti", () =>
  run(
    probe(
      1,
      "Imporre un tipo esatto",
      `
    assert!(collect_strings(std::iter::empty::<String>()).is_empty());
    let source = vec![String::from("\u{e8}"), String::from(""), String::from("\0")];
    let mut cloned = collect_strings(source.iter().cloned());
    assert_eq!(cloned, source);
    cloned[0].push('!');
    assert_eq!(source[0], "\u{e8}");
  `,
    ),
  ));
test("Convert: input seleziona Output, tipi estremi e disambiguazione", () =>
  run(
    probe(
      1,
      "Un trait generico puo avere un output diverso per ogni input",
      `
    let f = Formatter;
    for n in [0, 1, u32::MAX] {
        let result: String = <Formatter as Convert<u32>>::convert(&f, n);
        assert_eq!(result, format!("id={n}"));
    }
    let enabled: &'static str = <Formatter as Convert<bool>>::convert(&f, true);
    assert_eq!(enabled, "enabled");
  `,
    ),
  ));
test("Convert: non si seleziona un altro Output dalla variabile di ritorno", () =>
  run(
    probe(
      1,
      "Un trait generico puo avere un output diverso per ogni input",
      "let _wrong: String = Formatter.convert(true);",
    ),
    { error: "E0308" },
  ));
test("Convert: secondo Output per lo stesso input non ammesso", () =>
  run(
    source(1, "Un trait generico puo avere un output diverso per ogni input") +
      `
impl Convert<u32> for Formatter {
    type Output = u64;
    fn convert(&self, input: u32) -> Self::Output { u64::from(input) }
}
`,
    { error: "E0119" },
  ));
test("Repository: ID 0, mancanti, estremi e nome vuoto non validato", () =>
  run(
    probe(
      1,
      "Repository in memoria con risultato reale",
      `
    let repo = MemoryUsers { users: BTreeMap::from([
        (0, User { name: String::from("unreachable") }),
        (u64::MAX, User { name: String::new() }),
    ]) };
    assert_eq!(repo.find(0), Err(FindError::InvalidId));
    assert_eq!(repo.find(1), Ok(None));
    assert_eq!(find_name(&repo, u64::MAX), Ok(Some(String::new())));
    assert_eq!(repo.users.len(), 2);
  `,
    ),
  ));
test("Repository: risultato owned indipendente e valido dopo il drop", () =>
  run(
    probe(
      1,
      "Repository in memoria con risultato reale",
      `
    let repo = MemoryUsers { users: BTreeMap::from([
        (1, User { name: String::from("Ada") }),
    ]) };
    let mut user = repo.find(1).unwrap().unwrap();
    user.name.push('!');
    assert_eq!(find_name(&repo, 1), Ok(Some(String::from("Ada"))));
    drop(repo);
    assert_eq!(user.name, "Ada!");
  `,
    ),
  ));
test("Repository: il consumer preserva un altro tipo di errore", () =>
  run(
    probe(
      1,
      "Repository in memoria con risultato reale",
      `
    struct Unavailable;
    impl Repository for Unavailable {
        type Entity = User;
        type Error = &'static str;
        fn find(&self, _: u64) -> Result<Option<User>, Self::Error> {
            Err("test-source-unavailable")
        }
    }
    assert_eq!(find_name(&Unavailable, 1), Err("test-source-unavailable"));
  `,
    ),
  ));
test("Repository: Entity=User richiesto dal consumer", () =>
  run(
    probe(
      1,
      "Repository in memoria con risultato reale",
      `
    struct Numbers;
    impl Repository for Numbers {
        type Entity = u32;
        type Error = ();
        fn find(&self, _: u64) -> Result<Option<u32>, ()> { Ok(Some(1)) }
    }
    let _ = find_name(&Numbers, 1);
  `,
    ),
    { error: "E0271" },
  ));
test("Repository: il nome Error non implementa std::error::Error", () =>
  run(
    probe(
      1,
      "Repository in memoria con risultato reale",
      `
    fn require_error<T: std::error::Error>() {}
    require_error::<<MemoryUsers as Repository>::Error>();
  `,
    ),
    { error: "E0277" },
  ));
test("View: togliere ?Sized impedisce Target=str", () =>
  run(
    replaceOnce(
      source(1, "Tipo associato unsized restituito per riferimento"),
      "type Target: ?Sized;",
      "type Target;",
    ),
    { error: "E0277" },
  ));
test("View: il risultato non sopravvive al proprietario", () =>
  run(
    probe(
      1,
      "Tipo associato unsized restituito per riferimento",
      `
    let borrowed;
    {
        let owner = Text(String::from("temporary"));
        borrowed = owner.view();
    }
    assert_eq!(borrowed, "temporary");
  `,
    ),
    { error: "E0597" },
  ));
test("View: il riferimento punta al buffer originale", () =>
  run(
    probe(
      1,
      "Tipo associato unsized restituito per riferimento",
      `
    let original = Text(String::from("api"));
    assert_eq!(original.view().as_ptr(), original.0.as_ptr());
    assert_eq!(original.view().len(), original.0.len());
  `,
    ),
  ));
test("stable: alias in impl inerente rifiutato", () =>
  run(
    `
struct Item;
impl Item { type Value = u32; }
fn main() {}
`,
    { error: "E0658" },
  ));
test("dyn: Item fissato per Iterator e Producer", () =>
  run(
    probe(
      1,
      "Un producer finito, anche al limite numerico",
      `
    let mut source = Counter::new(0, 1);
    let erased: &mut dyn Producer<Item = u32> = &mut source;
    assert_eq!(erased.next(), Some(0));
    assert_eq!(erased.next(), Some(1));
    assert_eq!(erased.next(), None);

    let mut values = [5_u8, 6].into_iter();
    let iter: &mut dyn Iterator<Item = u8> = &mut values;
    assert_eq!(iter.next(), Some(5));
  `,
    ),
  ));
test("projection: sintassi qualificata disambigua lo stesso nome", () =>
  run(`
trait Left { type Item; }
trait Right { type Item; }
struct Both;
impl Left for Both { type Item = u8; }
impl Right for Both { type Item = String; }
fn check<T: Left<Item = u8> + Right<Item = String>>() {
    let a: <T as Left>::Item = 7;
    let b: <T as Right>::Item = String::from("api");
    assert_eq!(a, 7);
    assert_eq!(b, "api");
}
fn main() { check::<Both>(); }
`));
