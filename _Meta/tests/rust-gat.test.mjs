import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Generic Associated Types (GAT)"];
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
const prefix = "appunti-rust-gat-";
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

const textView = "Una vista parametrizzata dal prestito";
const rows = "Lo stesso contratto con risultato preso in prestito o posseduto";
const windows = "Finestre mutabili sovrapposte, una alla volta";
const batch = "Parametri di tipo e costante";
const missing = "Omettere il bound richiesto dal receiver";
const conflict = "Usare la prima vista dopo un secondo prestito mutabile";
const errors = new Map([
  [missing, { message: /missing required bound on `Item`/ }],
  [conflict, { error: "E0499" }],
]);

test("toolchain reale e inventario: sei programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 6);
});
test("GAT: metadati, fonti e gerarchia", () => {
  const note = notes[0];
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
  for (const heading of [
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
      headings.some((n) => n.depth === 2 && text(n) === heading),
      heading,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(note.source, /https:\/\/doc\.rust-lang\.org\/reference/);
  assert.match(note.source, /https:\/\/blog\.rust-lang\.org\/2022/);
  assert.doesNotMatch(note.source, /@B[T]@/);
});
for (const [heading, code] of blocks[0])
  test("Programma della nota: " + heading, () =>
    run(code, errors.get(heading)),
  );

test("GAT: aggiungere il bound richiesto rende valido il trait", () =>
  run(
    replaceOnce(
      source(0, missing),
      "type Item<'a>;",
      "type Item<'a> where Self: 'a;",
    ),
  ));
test("GAT: ultimo uso prima del secondo prestito rende valido il programma", () =>
  run(
    replaceOnce(
      source(0, conflict),
      "let second = buffer.view();\n    first[0] = second[1];",
      "first[0] = 9;\n    let second = buffer.view();\n    assert_eq!(second, &[9, 2]);",
    ),
  ));
test("GAT: la vista condivisa punta alla stessa stringa, non a una copia", () =>
  run(
    probe(
      0,
      textView,
      `
    let value = Text(String::from("prova"));
    assert_eq!(value.get().as_ptr(), value.0.as_ptr());
    let first = value.get();
    let second = value.get();
    assert_eq!((first, second), ("prova", "prova"));
`,
    ),
  ));
test("GAT: una vista presa in prestito impedisce di spostare la sorgente", () =>
  run(
    probe(
      0,
      textView,
      `
    let value = Text(String::from("prova"));
    let view = value.get();
    drop(value);
    println!("{view}");
`,
    ),
    { error: "E0505" },
  ));
test("GAT: una vista non puo uscire dalla durata della sorgente", () =>
  run(
    probe(
      0,
      textView,
      `
    let view;
    {
        let value = Text(String::from("prova"));
        view = value.get();
    }
    println!("{view}");
`,
    ),
    { error: "E0597" },
  ));
test("GAT: il bound non consente di prestare una String locale", () =>
  run(
    replaceOnce(
      source(0, textView),
      "self.0.as_str()",
      'let local = String::from("temporary");\n        local.as_str()',
    ),
    { error: "E0515" },
  ));
test("GAT: un risultato semplice puo essere espresso senza famiglia associata", () =>
  run(`
trait View {
    type Target: ?Sized;
    fn get(&self) -> &Self::Target;
}
struct Text(String);
impl View for Text {
    type Target = str;
    fn get(&self) -> &str { &self.0 }
}
fn main() {
    let text = Text(String::from("appunti"));
    assert_eq!(text.get(), "appunti");
}
`));
test("GAT: lunghezza UTF-8, stringa vuota e assenza restano distinte", () =>
  run(
    probe(
      0,
      rows,
      `
    for input in ["", "x", "\u{e8}", "\u{1f680}", "a,b\n"] {
        let a = CsvRow { line: input.into() };
        let b = SnapshotRow { line: Some(input.into()) };
        assert_eq!(current_byte_len(&a), Some(input.len()));
        assert_eq!(current_byte_len(&b), Some(input.len()));
        assert_eq!(a.current(), Some(input));
        assert_eq!(b.current().as_deref(), Some(input));
    }
    assert_eq!(current_byte_len(&SnapshotRow { line: None }), None);
`,
    ),
  ));
test("GAT: lo snapshot resta indipendente da modifiche e distruzione della sorgente", () =>
  run(
    probe(
      0,
      rows,
      `
    let mut value = SnapshotRow { line: Some("original".into()) };
    let snapshot = value.current().unwrap();
    value.line.as_mut().unwrap().push_str("-changed");
    assert_eq!(snapshot, "original");
    assert_eq!(value.current().as_deref(), Some("original-changed"));
    drop(value);
    assert_eq!(snapshot, "original");
`,
    ),
  ));
test("GAT: la vista CsvRow condivide i byte originali", () =>
  run(
    probe(
      0,
      rows,
      `
    let value = CsvRow { line: String::from("42,ok") };
    assert_eq!(value.current().unwrap().as_ptr(), value.line.as_ptr());
`,
    ),
  ));
test("GAT: un impl non puo ignorare il bound sul risultato", () =>
  run(
    replaceOnce(
      source(0, rows),
      "type Row<'a> = String where Self: 'a;",
      "type Row<'a> = usize where Self: 'a;",
    ),
    { error: "E0277" },
  ));

test("WindowsMut: matrice di lunghezze e larghezze, inclusi vuoto e zero", () =>
  run(
    probe(
      0,
      windows,
      `
    for len in 0..=12usize {
        for width in 0..=14usize {
            let mut values: Vec<usize> = (0..len).collect();
            let source_ptr = values.as_mut_ptr();
            let candidate = WindowsMut::new(&mut values, width);
            if width == 0 {
                assert!(candidate.is_none());
                continue;
            }
            let mut cursor = candidate.unwrap();
            let mut count = 0;
            while let Some(view) = cursor.next() {
                assert_eq!(view.len(), width);
                assert_eq!(view.as_mut_ptr(), source_ptr.wrapping_add(count));
                for (offset, value) in view.iter().enumerate() {
                    assert_eq!(*value, count + offset);
                }
                count += 1;
            }
            let expected = if width <= len { len - width + 1 } else { 0 };
            assert_eq!(count, expected);
            assert!(cursor.next().is_none());
            assert!(cursor.next().is_none());
        }
    }
`,
    ),
  ));
test("WindowsMut: modifiche sulle sovrapposizioni con conteggio atteso", () =>
  run(
    probe(
      0,
      windows,
      `
    for len in 1..=9usize {
        for width in 1..=len {
            let mut values = vec![0usize; len];
            {
                let mut cursor = WindowsMut::new(&mut values, width).unwrap();
                while let Some(view) = cursor.next() {
                    for value in view { *value += 1; }
                }
            }
            for (index, count) in values.iter().enumerate() {
                let expected = (0..=len-width)
                    .filter(|start| *start <= index && index < *start + width)
                    .count();
                assert_eq!(*count, expected);
            }
        }
    }
`,
    ),
  ));
test("WindowsMut: width usize::MAX e overflow della posizione non causano panic", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2];
    let mut cursor = WindowsMut::new(&mut values, usize::MAX).unwrap();
    assert!(cursor.next().is_none());
    assert!(cursor.next().is_none());
    // Sonda interna: esercita checked_add anche con stato non raggiungibile dall'API.
    cursor.position = 1;
    assert!(cursor.next().is_none());
`,
    ),
  ));
test("WindowsMut: usa elementi non Copy e non Clone", () =>
  run(
    probe(
      0,
      windows,
      `
    struct Entry(String);
    let mut entries = [Entry("a".into()), Entry("b".into()), Entry("c".into())];
    {
        let mut cursor = WindowsMut::new(&mut entries, 2).unwrap();
        cursor.next().unwrap()[1].0.push('!');
        assert_eq!(cursor.next().unwrap()[0].0, "b!");
        assert!(cursor.next().is_none());
    }
    assert_eq!(entries[1].0, "b!");
`,
    ),
  ));
test("WindowsMut: due finestre ancora utilizzate si sovrapporrebbero", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2, 3];
    let mut cursor = WindowsMut::new(&mut values, 2).unwrap();
    let first = cursor.next().unwrap();
    let second = cursor.next().unwrap();
    assert_eq!(first[1], second[0]);
`,
    ),
    { error: "E0499" },
  ));
test("WindowsMut: ultimo uso prima di next permette il riutilizzo senza blocchi", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2, 3];
    let mut cursor = WindowsMut::new(&mut values, 2).unwrap();
    let first = cursor.next().unwrap();
    first[1] = 8;
    let second = cursor.next().unwrap();
    assert_eq!(second[0], 8);
`,
    ),
  ));
test("WindowsMut: il nome next non implementa IntoIterator", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2, 3];
    let cursor = WindowsMut::new(&mut values, 2).unwrap();
    for _ in cursor {}
`,
    ),
    { error: "E0277" },
  ));
test("WindowsMut: snapshot posseduti possono essere raccolti esplicitamente", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2, 3];
    let mut cursor = WindowsMut::new(&mut values, 2).unwrap();
    let mut snapshots = Vec::new();
    while let Some(view) = cursor.next() {
        snapshots.push(view.to_vec());
    }
    assert_eq!(snapshots, vec![vec![1, 2], vec![2, 3]]);
`,
    ),
  ));
test("GAT: Container non e dyn-compatible", () =>
  run(
    probe(
      0,
      textView,
      `
    let value = Text(String::from("x"));
    let _object: &dyn Container<Ref<'static> = &'static str> = &value;
`,
    ),
    { error: "E0038" },
  ));
test("GAT: fissare Item static non rende dyn-compatible LendingIterator", () =>
  run(
    probe(
      0,
      windows,
      `
    let mut values = [1, 2, 3];
    let mut cursor = WindowsMut::new(&mut values, 2).unwrap();
    let _object: &mut dyn LendingIterator<Item<'static> = &'static mut [i32]>
        = &mut cursor;
`,
    ),
    { error: "E0038" },
  ));
test("GAT: HRTB con sorgente locale riproduce il limite sulla baseline 1.99.1", () =>
  run(
    probe(
      0,
      windows,
      `
    fn inspect<I: LendingIterator>(mut cursor: I)
    where for<'a> I::Item<'a>: std::fmt::Debug
    {
        while let Some(view) = cursor.next() { println!("{view:?}"); }
    }
    let mut values = [1, 2, 3];
    inspect(WindowsMut::new(&mut values, 2).unwrap());
`,
    ),
    { error: "E0597", detail: /'static/ },
  ));
test("GAT: bound Debug nel trait evita quel caso HRTB, restringendo il contratto", () =>
  run(
    probe(
      0,
      windows,
      `
    trait DebugLender {
        type Item<'a>: std::fmt::Debug where Self: 'a;
        fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
    }
    impl<T: std::fmt::Debug> DebugLender for WindowsMut<'_, T> {
        type Item<'a> = &'a mut [T] where Self: 'a;
        fn next<'a>(&'a mut self) -> Option<Self::Item<'a>> {
            LendingIterator::next(self)
        }
    }
    fn inspect<I: DebugLender>(mut cursor: I) -> usize {
        let mut count = 0;
        while let Some(view) = DebugLender::next(&mut cursor) {
            assert!(!format!("{view:?}").is_empty());
            count += 1;
        }
        count
    }
    let mut values = [1, 2, 3];
    assert_eq!(inspect(WindowsMut::new(&mut values, 2).unwrap()), 2);
`,
    ).replaceAll("windows.next()", "LendingIterator::next(&mut windows)"),
  ));
test("BatchFamily: array vuoti e tipi senza Clone o Copy", () =>
  run(
    probe(
      0,
      batch,
      `
    struct Entry(u32);
    let empty_inline = Inline::pack::<Entry, 0>([]);
    let empty_boxed = Boxed::pack::<Entry, 0>([]);
    assert_eq!(empty_inline.len(), 0);
    assert_eq!(empty_boxed.len(), 0);
    let inline = Inline::pack([Entry(8), Entry(9)]);
    let boxed = Boxed::pack([Entry(10)]);
    assert_eq!(inline[1].0, 9);
    assert_eq!(boxed[0].0, 10);
`,
    ),
  ));
test("BatchFamily: pack trasferisce l'array, non lo clona", () =>
  run(
    probe(
      0,
      batch,
      `
    let values = [String::from("a")];
    let _packed = Inline::pack(values);
    println!("{}", values[0]);
`,
    ),
    { error: "E0382" },
  ));
test("BatchFamily: una famiglia puo contenere riferimenti non static", () =>
  run(
    probe(
      0,
      batch,
      `
    let value = String::from("local");
    let inline = Inline::pack([value.as_str()]);
    let boxed = Boxed::pack([value.as_str()]);
    assert_eq!(inline[0], boxed[0]);
    assert_eq!(boxed[0], "local");
`,
    ),
  ));
