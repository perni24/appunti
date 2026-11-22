import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Vec", "HashMap e HashSet", "VecDeque BTreeMap e BTreeSet"];
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
const prefix = "appunti-rust-collections-";
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
test("toolchain reale e inventario: 16 programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [6, 5, 5],
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
      assert.ok(
        headings.some((n) => n.depth === 2 && text(n) === section),
        section,
      );
    }
    for (let j = 1; j < headings.length; j++)
      assert.ok(headings[j].depth <= headings[j - 1].depth + 1);
    assert.doesNotMatch(note.source, /@BT@/);
  });
  for (const [heading, code] of blocks[i]) {
    test(names[i] + ": " + heading, () => {
      const output = run(
        code,
        heading === "Prestito ancora usato dopo push" ? { error: "E0502" } : {},
      );
      if (heading === "Conteggio di token con report riproducibile")
        assert.equal(output, "go: 1\nrust: 2\nrust,: 1\n");
      if (heading === "Elaborazione sequenziale con riepilogo ordinato")
        assert.equal(output, "download: 1\nparse: 2\n");
    });
  }
}
test("Vec: capacita zero, tipi zero-sized e nessuna crescita entro capacita", () =>
  run(`
fn main() {
    let empty: Vec<u32> = Vec::new();
    assert_eq!(empty.capacity(), 0);
    let units = vec![(); 10];
    assert_eq!(units.len(), 10);
    assert_eq!(units.capacity(), usize::MAX);
    let mut values: Vec<u32> = Vec::with_capacity(16);
    let capacity = values.capacity();
    let pointer = values.as_ptr();
    for n in 0..16 { values.push(n); }
    assert_eq!(values.capacity(), capacity);
    assert_eq!(values.as_ptr(), pointer);
}
`));
test("Vec: tipo non deducibile nel vecchio frammento", () =>
  run("fn main() { let c = Vec::with_capacity(100); }", { error: "E0282" }));
test("Vec: indicizzazione fuori limite provoca panic", () =>
  run(
    `
fn main() {
    let values = vec![1, 2];
    let index = values.len();
    println!("{}", values[index]);
}
`,
    { panic: /index out of bounds/ },
  ));
test("Vec: estrarre una String tramite indice non compila", () =>
  run(
    `
fn main() {
    let values = vec![String::from("text")];
    let value = values[0];
    println!("{value}");
}
`,
    { error: "E0507" },
  ));
test("Vec: iterazione per valore consuma il contenitore", () =>
  run(
    replaceOnce(
      source(0, "Leggere, modificare o consumare"),
      "assert_eq!(lengths, [4, 4]);",
      'assert_eq!(lengths, [4, 4]); println!("{:?}", names);',
    ),
    { error: "E0382" },
  ));
test("Vec: terminare il prestito prima della modifica compila", () =>
  run(
    replaceOnce(
      source(0, "Prestito ancora usato dopo push"),
      'values.push(String::from("second"));\n    println!("{first}");',
      'println!("{first}");\n    values.push(String::from("second"));',
    ),
  ));
test("Vec: filtro su tutti gli i16, duplicati, ordine e input invariato", () =>
  run(
    probe(
      0,
      "Filtrare senza consumare l'input",
      `
    let input: Vec<i32> = (i16::MIN..=i16::MAX).map(i32::from).collect();
    let output = filter_even(&input);
    assert_eq!(output.len(), 32768);
    for (position, value) in output.iter().enumerate() {
        assert_eq!(*value, i32::from(i16::MIN) + 2 * position as i32);
    }
    assert_eq!(filter_even(&[2, 2, -1, 0]), [2, 2, 0]);
    assert_eq!(filter_even(&[i32::MIN, i32::MAX]), [i32::MIN]);
    assert_eq!(input.len(), 65536);
  `,
    ),
  ));
test("Vec: rimozioni su ogni posizione di piccole sequenze", () =>
  run(`
fn main() {
    for len in 1..32 {
        for index in 0..len {
            let original: Vec<_> = (0..len).collect();
            let mut ordered = original.clone();
            let mut swapped = original.clone();
            assert_eq!(ordered.remove(index), index);
            assert_eq!(swapped.swap_remove(index), index);
            let expected: Vec<_> = original.into_iter().filter(|n| *n != index).collect();
            assert_eq!(ordered, expected);
            swapped.sort_unstable();
            assert_eq!(swapped, expected);
        }
    }
}
`));
test("Vec: reserve e relativo alla lunghezza, truncate non espande", () =>
  run(`
fn main() {
    let mut values = vec![1u8, 2, 3];
    values.reserve(10);
    assert!(values.capacity() >= 13);
    let capacity = values.capacity();
    values.truncate(100);
    assert_eq!(values.len(), 3);
    values.truncate(1);
    assert_eq!(values, [1]);
    values.clear();
    assert_eq!(values.capacity(), capacity);
    values.shrink_to_fit();
    assert!(values.capacity() <= capacity);
}
`));
test("Vec: overflow capacita restituito senza tentare una grande allocazione", () =>
  run(
    replaceOnce(
      source(0, "Riservare memoria in modo fallibile"),
      "assert_eq!(repeated(9, 3)?, [9, 9, 9]);",
      "assert!(repeated(9, usize::MAX).is_err());\n    assert_eq!(repeated(9, 3)?, [9, 9, 9]);",
    ),
  ));
test("Vec: Clone ripetuto di Rc condivide il dato", () =>
  run(`
use std::cell::Cell;
use std::rc::Rc;
fn main() {
    let shared = Rc::new(Cell::new(0));
    let values = vec![Rc::clone(&shared); 3];
    values[0].set(7);
    assert_eq!(values[2].get(), 7);
    assert_eq!(Rc::strong_count(&shared), 4);
}
`));
test("HashMap: insert consuma la chiave String", () =>
  run(
    replaceOnce(
      source(1, "Inserire, cercare, aggiornare e rimuovere"),
      "assert_eq!(scores.len(), 1);",
      'assert_eq!(scores.len(), 1); println!("{key}");',
    ),
    { error: "E0382" },
  ));
test("HashMap: riferimento vivo vieta insert anche con capacita libera", () =>
  run(
    `
use std::collections::HashMap;
fn main() {
    let mut map = HashMap::with_capacity(10);
    map.insert("api", String::from("value"));
    let value = map.get("api").unwrap();
    map.insert("web", String::from("new"));
    println!("{value}");
}
`,
    { error: "E0502" },
  ));
test("HashMap: chiave borrowed non sopravvive alla sorgente", () =>
  run(
    `
use std::collections::HashMap;
fn main() {
    let mut map = HashMap::new();
    {
        let key = String::from("api");
        map.insert(key.as_str(), 1);
    }
    println!("{map:?}");
}
`,
    { error: "E0597" },
  ));
test("HashMap: chiave assente via indice provoca panic", () =>
  run(
    `
use std::collections::HashMap;
fn main() {
    let map = HashMap::from([("api", 1)]);
    println!("{}", map["missing"]);
}
`,
    { panic: /no entry found for key/ },
  ));
test("HashMap: or_insert valuta subito mentre and_modify richiede presenza", () =>
  run(`
use std::collections::HashMap;
fn main() {
    let mut map = HashMap::from([("api", 2)]);
    let mut created = 0;
    map.entry("api").or_insert({ created += 1; 9 });
    assert_eq!(created, 1);
    let mut modified = 0;
    map.entry("missing").and_modify(|_| modified += 1).or_insert(1);
    assert_eq!(modified, 0);
    assert_eq!(map.get("api"), Some(&2));
    assert_eq!(map.get("missing"), Some(&1));
}
`));
test("HashMap: collisioni non confondono chiavi diverse", () =>
  run(`
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
#[derive(PartialEq, Eq)]
struct Key(u32);
impl Hash for Key {
    fn hash<H: Hasher>(&self, state: &mut H) { 0u8.hash(state); }
}
fn main() {
    let mut map = HashMap::new();
    for n in 0..100 { map.insert(Key(n), n * 2); }
    assert_eq!(map.len(), 100);
    for n in 0..100 { assert_eq!(map.get(&Key(n)), Some(&(n * 2))); }
    assert_eq!(map.get(&Key(100)), None);
}
`));
test("HashMap: insert conserva la chiave equivalente gia memorizzata", () =>
  run(`
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
#[derive(Debug)]
struct Key { id: u32, label: &'static str }
impl PartialEq for Key { fn eq(&self, other: &Self) -> bool { self.id == other.id } }
impl Eq for Key {}
impl Hash for Key { fn hash<H: Hasher>(&self, state: &mut H) { self.id.hash(state); } }
fn main() {
    let mut map = HashMap::new();
    map.insert(Key { id: 1, label: "original" }, 10);
    assert_eq!(map.insert(Key { id: 1, label: "new" }, 20), Some(10));
    let (key, value) = map.get_key_value(&Key { id: 1, label: "query" }).unwrap();
    assert_eq!(key.label, "original");
    assert_eq!(*value, 20);
}
`));
test("HashSet: insert conserva il rappresentante, replace lo sostituisce", () =>
  run(`
use std::collections::HashSet;
fn main() {
    let mut set: HashSet<Vec<u8>> = HashSet::new();
    assert!(set.insert(Vec::new()));
    assert!(!set.insert(Vec::with_capacity(8)));
    assert_eq!(set.iter().next().unwrap().capacity(), 0);
    let old = set.replace(Vec::with_capacity(8)).unwrap();
    assert_eq!(old.capacity(), 0);
    assert!(set.iter().next().unwrap().capacity() >= 8);
    assert!(set.take(&[][..]).is_some());
    assert!(set.is_empty());
}
`));
test("HashSet: identita ResourceKey comprende entrambi i campi", () =>
  run(
    probe(
      1,
      "Chiavi personalizzate",
      `
    let mut items = HashSet::new();
    for project in 0..8 {
        for path in ["a", "b", "a"] {
            items.insert(ResourceKey { project, path: path.to_owned() });
        }
    }
    assert_eq!(items.len(), 16);
  `,
    ),
  ));
test("HashMap: token vuoti, Unicode, punteggiatura e chiavi possedute", () =>
  run(
    probe(
      1,
      "Conteggio di token con report riproducibile",
      `
    assert!(count_words(" \t\n\u{2003}").is_empty());
    let input = String::from("API\tapi\napi,");
    let owned = count_words(&input);
    drop(input);
    assert_eq!(owned.get("api"), Some(&2));
    assert_eq!(owned.get("api,"), Some(&1));
    let unicode = count_words("\u{00c9} \u{00e9} e\u{0301} \u{00df} SS");
    assert_eq!(unicode.get("\u{00e9}"), Some(&2));
    assert_eq!(unicode.get("e\u{0301}"), Some(&1));
    assert_eq!(unicode.get("\u{00df}"), Some(&1));
    assert_eq!(unicode.get("ss"), Some(&1));
  `,
    ),
  ));
test("HashMap: clear mantiene capacita, values_mut non muta chiavi", () =>
  run(`
use std::collections::HashMap;
fn main() {
    let mut map = HashMap::with_capacity(16);
    map.insert(String::from("api"), 1);
    for value in map.values_mut() { *value += 1; }
    assert_eq!(map.get("api"), Some(&2));
    let capacity = map.capacity();
    map.clear();
    assert!(map.is_empty());
    assert_eq!(map.capacity(), capacity);
}
`));
test("HashSet: operazioni su tutte le coppie di sottoinsiemi di quattro elementi", () =>
  run(`
use std::collections::HashSet;
fn main() {
    for a in 0..16 {
        for b in 0..16 {
            let left: HashSet<_> = (0..4).filter(|n| a & (1 << n) != 0).collect();
            let right: HashSet<_> = (0..4).filter(|n| b & (1 << n) != 0).collect();
            let union: HashSet<_> = left.union(&right).copied().collect();
            let intersection: HashSet<_> = left.intersection(&right).copied().collect();
            let difference: HashSet<_> = left.difference(&right).copied().collect();
            let symmetric: HashSet<_> = left.symmetric_difference(&right).copied().collect();
            for n in 0..4 {
                assert_eq!(union.contains(&n), left.contains(&n) || right.contains(&n));
                assert_eq!(intersection.contains(&n), left.contains(&n) && right.contains(&n));
                assert_eq!(difference.contains(&n), left.contains(&n) && !right.contains(&n));
                assert_eq!(symmetric.contains(&n), left.contains(&n) != right.contains(&n));
            }
        }
    }
}
`));
test("VecDeque: FIFO dopo interleaving e crescita oltre capacita richiesta", () =>
  run(`
use std::collections::VecDeque;
fn main() {
    let mut queue = VecDeque::with_capacity(2);
    let mut expected = 0;
    for n in 0..1000 {
        queue.push_back(n);
        if n % 3 == 0 {
            assert_eq!(queue.pop_front(), Some(expected));
            expected += 1;
        }
    }
    assert!(queue.len() > 2);
    while let Some(n) = queue.pop_front() {
        assert_eq!(n, expected);
        expected += 1;
    }
    assert_eq!(expected, 1000);
    assert_eq!(queue.front(), None);
    assert_eq!(queue.back(), None);
    assert_eq!(queue.get(0), None);
    assert_eq!(queue.pop_back(), None);
}
`));
test("VecDeque: make_contiguous conserva ordine su rotazioni e vuoto", () =>
  run(`
use std::collections::VecDeque;
fn main() {
    for len in 0..32 {
        for shift in 0..=len {
            let mut queue: VecDeque<_> = (0..len).collect();
            queue.rotate_left(shift);
            let before: Vec<_> = queue.iter().copied().collect();
            let capacity = queue.capacity();
            let (a, b) = queue.as_slices();
            assert_eq!(a.iter().chain(b).copied().collect::<Vec<_>>(), before);
            assert_eq!(queue.make_contiguous(), before.as_slice());
            assert!(queue.as_slices().1.is_empty());
            assert_eq!(queue.capacity(), capacity);
        }
    }
}
`));
test("VecDeque: prestito degli estremi incompatibile con pop", () =>
  run(
    `
use std::collections::VecDeque;
fn main() {
    let mut queue = VecDeque::from([String::from("job")]);
    let first = queue.front().unwrap();
    queue.pop_front();
    println!("{first}");
}
`,
    { error: "E0502" },
  ));
test("BTreeMap: limiti assenti e range vuoti validi", () =>
  run(`
use std::collections::BTreeMap;
fn main() {
    let map = BTreeMap::from([(10, 1), (20, 2), (30, 3)]);
    assert_eq!(map.range(11..29).map(|(&k, _)| k).collect::<Vec<_>>(), [20]);
    assert_eq!(map.range(20..20).count(), 0);
    assert_eq!(map.range(20..=20).count(), 1);
    assert_eq!(map.range(31..).count(), 0);
    assert_eq!(map.range(..10).count(), 0);
}
`));
test("BTreeMap: intervallo invertito provoca panic", () =>
  run(
    `
use std::collections::BTreeMap;
fn main() {
    let map = BTreeMap::from([(10, 1), (20, 2)]);
    let start = 20;
    let end = 10;
    let _ = map.range(start..end);
}
`,
    { panic: /range start is greater than range end/ },
  ));
test("BTreeMap: due limiti uguali esclusi provocano panic", () =>
  run(
    `
use std::collections::BTreeMap;
use std::ops::Bound::Excluded;
fn main() {
    let map = BTreeMap::from([(10, 1), (20, 2)]);
    let _ = map.range((Excluded(10), Excluded(10)));
}
`,
    { panic: /range start and end are equal and excluded/ },
  ));
test("BTreeSet: intervallo invertito provoca panic", () =>
  run(
    `
use std::collections::BTreeSet;
fn main() {
    let set = BTreeSet::from([1, 2]);
    let start = 2;
    let end = 1;
    let _ = set.range(start..end);
}
`,
    { panic: /range start is greater than range end/ },
  ));
test("BTreeMap: stringhe in ordine lessicografico e lookup borrowed", () =>
  run(`
use std::collections::BTreeMap;
fn main() {
    let map = BTreeMap::from([(String::from("2"), 2), (String::from("10"), 10)]);
    assert_eq!(map.keys().map(String::as_str).collect::<Vec<_>>(), ["10", "2"]);
    assert_eq!(map.get("2"), Some(&2));
}
`));
test("BTreeSet: f64 non implementa Ord", () =>
  run(
    `
use std::collections::BTreeSet;
fn main() {
    let mut set = BTreeSet::new();
    set.insert(1.0f64);
}
`,
    { error: "E0277" },
  ));
test("BTreeMap: split_off include il limite e gestisce chiave non presente", () =>
  run(`
use std::collections::BTreeMap;
fn main() {
    for boundary in [0, 10, 15, 20, 40] {
        let mut map = BTreeMap::from([(10, 1), (20, 2), (30, 3)]);
        let right = map.split_off(&boundary);
        assert!(map.keys().all(|key| *key < boundary));
        assert!(right.keys().all(|key| *key >= boundary));
        assert_eq!(map.len() + right.len(), 3);
    }
}
`));
test("BTreeSet: algebra ordinata anche con input vuoti", () =>
  run(`
use std::collections::BTreeSet;
fn main() {
    for a in 0..16 {
        for b in 0..16 {
            let left: BTreeSet<_> = (0..4).filter(|n| a & (1 << n) != 0).collect();
            let right: BTreeSet<_> = (0..4).filter(|n| b & (1 << n) != 0).collect();
            let union: Vec<_> = left.union(&right).copied().collect();
            let expected: Vec<_> = (0..4).filter(|n| (a | b) & (1 << n) != 0).collect();
            assert_eq!(union, expected);
            assert!(left.intersection(&right).copied().collect::<Vec<_>>().is_sorted());
            assert!(left.difference(&right).copied().collect::<Vec<_>>().is_sorted());
        }
    }
}
`));
test("BTreeMap: riepilogo vuoto, duplicati e report senza consumo", () =>
  run(
    probe(
      2,
      "Elaborazione sequenziale con riepilogo ordinato",
      `
    assert!(summarize(VecDeque::new()).is_empty());
    for len in 0..32 {
        let queue = (0..len).map(|n| if n % 2 == 0 { "a" } else { "b" }.to_owned()).collect();
        let counts = summarize(queue);
        assert_eq!(counts.values().sum::<usize>(), len);
        if len > 0 { assert_eq!(counts.get("a"), Some(&((len + 1) / 2))); }
        if len > 1 { assert_eq!(counts.get("b"), Some(&(len / 2))); }
    }
  `,
    ),
  ));
test("BTreeMap: summarize consuma la coda", () =>
  run(
    replaceOnce(
      source(2, "Elaborazione sequenziale con riepilogo ordinato"),
      "let counts = summarize(queue);",
      'let counts = summarize(queue); println!("{:?}", queue);',
    ),
    { error: "E0382" },
  ));
