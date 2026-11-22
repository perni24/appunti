import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Iteratori", "Closure"];
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
const prefix = "appunti-rust-iterators-closures-";
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

test("toolchain reale e inventario: 18 programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
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
    assert.doesNotMatch(note.source, /@B[T]@/);
  });
  for (const [heading, code] of blocks[i]) {
    test(names[i] + ": " + heading, () =>
      run(
        code,
        [
          "Usare un iteratore dopo un consumatore per valore",
          "Chiamare due volte una closure che estrae la cattura",
        ].includes(heading)
          ? { error: "E0382" }
          : {},
      ),
    );
  }
}
test("Iteratori: Closure e correlata, non prerequisito successivo", () => {
  const target = "[[Programmazione/Rust/Pagine/Closure]]";
  assert.ok(!notes[0].data.prerequisites.includes(target));
  assert.ok(notes[0].data.related.includes(target));
});
test("lazy: argomento e cattura sono immediati, callback differita", () =>
  run(`
use std::cell::Cell;
struct Guard<'a>(&'a Cell<u32>);
impl Drop for Guard<'_> { fn drop(&mut self) { self.0.set(self.0.get() + 1); } }
fn main() {
    let built = Cell::new(0);
    let calls = Cell::new(0);
    let dropped = Cell::new(0);
    let guard = Guard(&dropped);
    let pipeline = {
        built.set(built.get() + 1);
        let calls_ref = &calls;
        (0..3).map(move |n| {
            let _ = &guard;
            calls_ref.set(calls_ref.get() + 1);
            n
        })
    };
    assert_eq!(built.get(), 1);
    assert_eq!(calls.get(), 0);
    assert_eq!(dropped.get(), 0);
    drop(pipeline);
    assert_eq!(calls.get(), 0);
    assert_eq!(dropped.get(), 1);
}
`));
test("iterazione: Vec owned consumato, riferimento borrowed riutilizzabile", () =>
  run(
    `
fn main() {
    let names = vec![String::from("api")];
    let refs: Vec<_> = (&names).into_iter().collect();
    assert_eq!(refs[0], "api");
    assert_eq!(names.len(), 1);
    let mut owned = names.into_iter();
    assert_eq!(owned.next().as_deref(), Some("api"));
    println!("{names:?}");
}
`,
    { error: "E0382" },
  ));
test("iterazione: borrow ancora usato impedisce il move", () =>
  run(
    replaceOnce(
      source(0, "Prestito, modifica e consumo"),
      'assert_eq!(owned, ["api!", "web!"]);',
      'assert_eq!(owned, ["api!", "web!"]); println!("{borrowed:?}");',
    ),
    { error: "E0505" },
  ));
test("iterazione: cloned produce String indipendenti", () =>
  run(`
fn main() {
    let source = vec![String::from("api")];
    let mut cloned: Vec<String> = source.iter().cloned().collect();
    cloned[0].push('!');
    assert_eq!(source[0], "api");
    assert_eq!(cloned[0], "api!");
}
`));
test("iterazione: copied non accetta String", () =>
  run(
    `
fn main() {
    let names = vec![String::from("api")];
    let _ = names.iter().copied();
}
`,
    { error: "E0277" },
  ));
test("filter: firma errata senza il secondo riferimento", () =>
  run(
    replaceOnce(
      source(0, "Tipo di Item e riferimenti nei predicati"),
      "|n: &&i32| **n % 2 == 0",
      "|n: &i32| *n % 2 == 0",
    ),
    { error: "E0631" },
  ));
test("collect: by_ref conserva il ricevente ma non lo riavvolge", () => {
  const output = run(
    replaceOnce(
      source(0, "Usare un iteratore dopo un consumatore per valore"),
      "iter.collect()",
      "iter.by_ref().collect()",
    ),
  );
  assert.equal(output, "[2, 4, 6]\nNone\n");
});
test("array into_iter: elementi owned in edition 2024", () =>
  run(`
fn main() {
    let names = [String::from("api")];
    let first: String = names.into_iter().next().unwrap();
    assert_eq!(first, "api");
}
`));
test("array into_iter: sintassi metodo borrowed in edition 2018", () =>
  run(
    `
fn main() {
    let names = [String::from("api")];
    let first: String = names.into_iter().next().unwrap();
    assert_eq!(first, "api");
}
`,
    { edition: "2018", error: "E0308" },
  ));
test("find: vuoto, posizione del primo match e resto", () =>
  run(`
fn main() {
    for len in 0..16 {
        for target in 0..=len {
            let mut iter = 0..len;
            let found = iter.find(|n| *n == target);
            assert_eq!(found, (target < len).then_some(target));
            let remainder: Vec<_> = iter.collect();
            let expected: Vec<_> = if target < len { (target + 1..len).collect() } else { Vec::new() };
            assert_eq!(remainder, expected);
        }
    }
}
`));
test("any e all: elemento decisivo consumato, vuoto non invoca predicato", () =>
  run(`
fn main() {
    let mut iter = [1, 2, 3].into_iter();
    assert!(iter.any(|n| n == 2));
    assert_eq!(iter.next(), Some(3));
    assert!(std::iter::empty::<i32>().all(|_| panic!("not called")));
    assert!(!std::iter::empty::<i32>().any(|_| panic!("not called")));
    assert_eq!(std::iter::empty::<i32>().sum::<i32>(), 0);
    assert_eq!(std::iter::empty::<i32>().fold(7, |a, n| a+n), 7);
}
`));
test("take_while consuma il primo rifiutato, filter invece prosegue", () =>
  run(`
fn main() {
    let mut iter = [1, 2, 0, 3].into_iter();
    assert_eq!(iter.by_ref().take_while(|n| *n > 0).collect::<Vec<_>>(), [1, 2]);
    assert_eq!(iter.next(), Some(3));
    assert_eq!([1, 2, 0, 3].into_iter().filter(|n| *n > 0).collect::<Vec<_>>(), [1, 2, 3]);
}
`));
test("zip: coppie limitate dalla sorgente piu corta", () =>
  run(`
fn main() {
    for a in 0..8 {
        for b in 0..8 {
            let pairs: Vec<_> = (0..a).zip(0..b).collect();
            assert_eq!(pairs.len(), a.min(b));
            for (n, pair) in pairs.into_iter().enumerate() { assert_eq!(pair, (n,n)); }
        }
    }
}
`));
test("enumerate: indice prima del filtro rispetto al rango dopo", () =>
  run(`
fn main() {
    let values = [9, 2, 9, 4];
    let original: Vec<_> = values.iter().enumerate().filter(|(_, n)| **n != 9).map(|(i, _)| i).collect();
    let ranks: Vec<_> = values.iter().filter(|n| **n != 9).enumerate().map(|(i, _)| i).collect();
    assert_eq!(original, [1, 3]);
    assert_eq!(ranks, [0, 1]);
}
`));
test("take: limitare la sorgente garantisce il limite di scansione del demo", () =>
  run(`
use std::cell::Cell;
fn main() {
    let visited = Cell::new(0);
    let mut pipeline = (0u32..).take(20).filter(|_| {
        visited.set(visited.get() + 1);
        false
    }).take(1);
    assert_eq!(pipeline.next(), None);
    assert_eq!(visited.get(), 20);
}
`));
test("for_each: return esce dalla callback, non dal ciclo o dalla funzione", () =>
  run(`
fn main() {
    let mut seen = Vec::new();
    (0..4).for_each(|n| {
        if n == 1 { return; }
        seen.push(n);
    });
    assert_eq!(seen, [0, 2, 3]);
}
`));
test("tag: whitespace Unicode, lowercase, duplicati e limiti dichiarati", () =>
  run(
    probe(
      0,
      "Preparare tag senza modificare la sorgente",
      `
    let input = ["\u{2003}API\u{2003}", "  ", "A  B", "Rust!", "\u{00c9}", "E\u{0301}", "\u{0130}", "\0", "api"]
        .map(str::to_owned);
    assert_eq!(normalize_tags(&input), [
        "api", "a  b", "rust!", "\u{00e9}", "e\u{0301}", "i\u{0307}", "\0", "api"
    ]);
    assert!(normalize_tags(&[]).is_empty());
  `,
    ),
  ));
test("tag: output posseduto sopravvive alla sorgente", () =>
  run(
    probe(
      0,
      "Preparare tag senza modificare la sorgente",
      `
    let result = {
        let input = vec![String::from(" OWNED ")];
        normalize_tags(&input)
    };
    assert_eq!(result, ["owned"]);
  `,
    ),
  ));
test("parse: tutti gli u16 e grammatica senza trim", () =>
  run(
    probe(
      0,
      "Propagare errori anziche scartarli",
      `
    for n in 0..=u16::MAX {
        let text = n.to_string();
        assert_eq!(parse_numbers(&[&text]).unwrap(), [n]);
    }
    assert_eq!(parse_numbers(&["+0", "+65535"]).unwrap(), [0, 65535]);
    assert!(parse_numbers(&[]).unwrap().is_empty());
    for text in ["", " 1", "1 ", "-1", "65536", "1.0", "\u{0661}"] {
        assert!(parse_numbers(&[text]).is_err(), "{text:?}");
    }
  `,
    ),
  ));
test("collect Result: primo errore, effetti precedenti e resto", () =>
  run(`
use std::cell::Cell;
fn main() {
    let calls = Cell::new(0);
    let mut inputs = ["10", "bad", "20"].into_iter();
    let result: Result<Vec<u16>, _> = inputs.by_ref().map(|text| {
        calls.set(calls.get() + 1);
        text.parse::<u16>()
    }).collect();
    assert!(result.is_err());
    assert_eq!(calls.get(), 2);
    assert_eq!(inputs.next(), Some("20"));
    let values: Vec<_> = ["10", "bad", "20"].into_iter().filter_map(|s| s.parse::<u16>().ok()).collect();
    assert_eq!(values, [10, 20]);
}
`));
test("fuse e for: arresto al primo None, sorgente non fused riprendibile", () =>
  run(
    probe(
      0,
      "Fine stabile con fuse",
      `
    let mut source = intermittent();
    let prefix: Vec<_> = source.by_ref().collect();
    assert_eq!(prefix, [1]);
    assert_eq!(source.next(), Some(3));
    assert_eq!(source.next(), None);
    let mut fused = intermittent().fuse();
    assert_eq!(fused.by_ref().collect::<Vec<_>>(), [1]);
    for _ in 0..10 { assert_eq!(fused.next(), None); }
  `,
    ),
  ));
test("collect: destinazione diversa non clona implicitamente String", () =>
  run(
    `
fn main() {
    let values = vec![String::from("api")];
    let _: Vec<String> = values.iter().collect();
}
`,
    { error: "E0277" },
  ));
test("closure: inferenza fissa String, non generica su ogni chiamata", () =>
  run(
    replaceOnce(
      source(1, "Sintassi e inferenza"),
      'assert_eq!(identity(String::from("text")), "text");',
      'assert_eq!(identity(String::from("text")), "text"); let _ = identity(5);',
    ),
    { error: "E0308" },
  ));
test("closure: vecchio formatter inutilizzato non ha tipo di parametro deducibile", () =>
  run(
    `
fn main() {
    let prefix = String::from("id-");
    let format_id = |id| format!("{prefix}{id}");
}
`,
    { error: "E0282" },
  ));
test("closure: formula double valida a entrambi gli estremi i32", () =>
  run(
    probe(
      1,
      "Sintassi e inferenza",
      `
    let double = |n: i32| i64::from(n) * 2;
    for value in [i32::MIN, -1, 0, 1, i32::MAX] {
        assert_eq!(double(value), 2 * i64::from(value));
    }
  `,
    ),
  ));
test("closure: prestito condiviso ancora usato vieta mutazione esterna", () =>
  run(
    `
fn main() {
    let mut text = String::from("api");
    let read = || text.len();
    text.push('!');
    println!("{}", read());
}
`,
    { error: "E0502" },
  ));
test("closure: cattura mutabile ancora usata vieta lettura esterna", () =>
  run(
    `
fn main() {
    let mut text = String::from("api");
    let mut append = || text.push('!');
    println!("{text}");
    append();
}
`,
    { error: "E0502" },
  ));
test("closure: FnMut locale richiede binding mutabile", () =>
  run(
    replaceOnce(
      source(1, "Prestiti sulle catture"),
      "let mut append",
      "let append",
    ),
    { error: "E0596" },
  ));
test("closure: move String impedisce riuso della variabile originale", () =>
  run(
    replaceOnce(
      source(1, "move non significa chiamata singola"),
      "assert_eq!(length(), 6);",
      'assert_eq!(length(), 6); println!("{name}");',
    ),
    { error: "E0382" },
  ));
test("closure: Fn accettata anche come FnMut e FnOnce", () =>
  run(`
fn read<F: Fn() -> usize>(f: &F) -> usize { f() }
fn mutate<F: FnMut() -> usize>(mut f: F) -> usize { f() }
fn consume<F: FnOnce() -> usize>(f: F) -> usize { f() }
fn main() {
    let text = String::from("owned");
    let callback = move || text.len();
    assert_eq!(read(&callback), 5);
    assert_eq!(mutate(&callback), 5);
    assert_eq!(consume(callback), 5);
}
`));
test("closure: FnMut non soddisfa un bound Fn", () =>
  run(
    `
fn invoke<F: Fn()>(f: F) { f(); }
fn main() {
    let mut counter = 0;
    let callback = || counter += 1;
    invoke(callback);
}
`,
    { error: "E0525" },
  ));
test("closure: FnOnce-only non soddisfa FnMut", () =>
  run(
    `
fn invoke<F: FnMut() -> String>(mut f: F) { let _ = f(); }
fn main() {
    let text = String::from("owned");
    let callback = || text;
    invoke(callback);
}
`,
    { error: "E0525" },
  ));
test("closure: FnOnce non obbliga l'API a chiamare la callback", () =>
  run(`
fn discard<F: FnOnce()>(_: F) {}
fn main() {
    let text = String::from("owned");
    discard(|| { drop(text); panic!("never called"); });
}
`));
test("closure: solo bound FnOnce non consente due chiamate", () =>
  run(
    `
fn invoke<F: FnOnce() -> String>(f: F) {
    let _ = f();
    let _ = f();
}
fn main() { invoke(|| String::from("text")); }
`,
    { error: "E0382" },
  ));
test("closure: callback borrowed mutabile riutilizzata dopo API", () =>
  run(
    probe(
      1,
      "Scegliere il bound della callback",
      `
    let mut total = 0;
    let mut callback = || total += 1;
    run_twice(&mut callback);
    callback();
    assert_eq!(total, 3);
  `,
    ),
  ));
test("closure: formatter restituito possiede input, anche vuoto e Unicode", () =>
  run(
    probe(
      1,
      "Restituire una closure con configurazione posseduta",
      `
    for prefix in ["", "x-", "\u{00e8}-", " a "] {
        let expected = format!("{prefix}{}", u32::MAX);
        let callback = formatter(prefix.to_owned());
        assert_eq!(callback(u32::MAX), expected);
        assert_eq!(callback(0), format!("{prefix}0"));
    }
  `,
    ),
  ));
test("closure: factory senza move restituisce prestito locale", () =>
  run(
    replaceOnce(
      source(1, "Restituire una closure con configurazione posseduta"),
      "move |id|",
      "|id|",
    ),
    { error: "E0373" },
  ));
test("closure: move di riferimento non soddisfa static", () =>
  run(
    `
fn needs_static<F: Fn() -> usize + 'static>(f: F) { assert_eq!(f(), 3); }
fn main() {
    let text = String::from("api");
    let borrowed = &text;
    needs_static(move || borrowed.len());
}
`,
    { error: "E0597" },
  ));
test("closure: move di Rc non soddisfa Send", () =>
  run(
    `
use std::rc::Rc;
fn needs_send<F: Fn() -> usize + Send>(f: F) { assert_eq!(f(), 3); }
fn main() {
    let text = Rc::new(String::from("api"));
    needs_send(move || text.len());
}
`,
    { error: "E0277" },
  ));
test("closure: filter mantiene ordine e duplicati per soglie estreme", () =>
  run(
    probe(
      1,
      "Filtrare con una soglia catturata",
      `
    let values = [i32::MIN, 0, i32::MAX, -1, 0];
    for threshold in [i32::MIN, -1, 0, 1, i32::MAX] {
        let expected: Vec<_> = values.into_iter().filter(|n| *n >= threshold).collect();
        assert_eq!(filter_at_least(&values, threshold), expected);
    }
    let all: Vec<i32> = (i16::MIN..=i16::MAX).map(i32::from).collect();
    let nonnegative = filter_at_least(&all, 0);
    assert_eq!(nonnegative.len(), 32768);
    assert_eq!(nonnegative.first(), Some(&0));
    assert_eq!(nonnegative.last(), Some(&32767));
  `,
    ),
  ));
test("closure: cattura impedisce coercizione a function pointer", () =>
  run(
    `
fn main() {
    let offset = 1i64;
    let callback: fn(i32) -> i64 = |n| i64::from(n) + offset;
    println!("{}", callback(1));
}
`,
    { error: "E0308" },
  ));
test("closure: espressioni diverse hanno tipi distinti anche con stessa firma", () =>
  run(
    `
fn main() {
    let offset = 1;
    let left = |n: i32| n + offset;
    let right = |n: i32| n + offset;
    let _callbacks = vec![left, right];
}
`,
    { error: "E0308" },
  ));
test("closure: clone esplicito cambia il contratto one-shot", () => {
  const output = run(
    replaceOnce(
      source(1, "Chiamare due volte una closure che estrae la cattura"),
      "let take = || text;",
      "let take = || text.clone();",
    ),
  );
  assert.equal(output, "one-shot\none-shot\n");
});
test("closure: Fn con Cell puo essere chiamata tramite riferimento condiviso", () =>
  run(
    probe(
      1,
      "Fn non significa funzione pura",
      `
    let state = Cell::new(0u32);
    let callback = || { state.set(state.get() + 1); state.get() };
    assert_eq!(observe_twice(&callback), (1, 2));
    assert_eq!(observe_twice(&callback), (3, 4));
  `,
    ),
  ));
