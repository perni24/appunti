import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Zero-sized types.md";
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
const prefix = "appunti-rust-zero-sized-types-";
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

const layout = "Misurare dimensione e allineamento";
const format = "Marker di formato senza serializzazione implicita";
const drop = "Collezioni, Box e distruttori";
const empty = "Un tipo non abitabile in un contesto abitabile";
const moved = "Assumere Copy perche non ci sono dati";
const choice = "Confondere marker distinti con valori intercambiabili";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}

test("baseline reale e sei programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 6);
});
test("frontmatter invariato, struttura, fonti e nessun HTML accidentale", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  function noHtml(n) {
    assert.notEqual(n.type, "html", "Generico interpretato come HTML");
    for (const child of n.children ?? []) noHtml(child);
  }
  noHtml(note.tree);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Zero-sized types",
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
  const table = note.tree.children.find(
    (n) => n.type === "paragraph" && text(n).startsWith("| API |"),
  );
  assert.ok(table);
  assert.equal(text(table).split("\n").length, 7);
  for (const row of text(table).split("\n"))
    assert.equal(row.split("|").length, 4);
  for (const url of [
    "https://doc.rust-lang.org/reference/type-layout.html",
    "https://doc.rust-lang.org/std/marker/struct.PhantomData.html",
    "https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees",
    "https://doc.rust-lang.org/std/boxed/struct.Box.html#method.new",
    "https://doc.rust-lang.org/reference/items/enumerations.html#zero-variant-enums",
  ])
    assert.ok(originalBytes.toString().includes(url));
  for (const code of blocks.values()) {
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
  }
});
for (const title of [layout, format, drop, empty]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [moved, "E0382"],
  [choice, "E0308"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}

test("layout: array di marker e array vuoti conservano allineamento", () => {
  run(
    main(
      layout,
      "assert_eq!(size_of::<[Marker; 4096]>(), 0); assert_eq!(size_of::<[Aligned; 7]>(), 0); assert_eq!(align_of::<[Aligned; 7]>(), 64); assert_eq!(size_of::<[Aligned; 0]>(), 0); assert_eq!(align_of::<[Aligned; 0]>(), 64);",
    ),
  );
});
test("layout: il campo ZST allineato aumenta padding e offset", () => {
  run(
    main(
      layout,
      "assert_eq!(std::mem::offset_of!(Envelope, byte), 0); assert_eq!(std::mem::offset_of!(Envelope, marker), 64); assert_eq!(size_of::<[Envelope; 3]>(), 192);",
    ),
  );
});
test("layout: wrapper con PhantomData non eredita allineamento del parametro", () => {
  run(
    main(
      layout,
      "struct Plain { byte: u8, marker: PhantomData<Aligned> } assert_eq!(align_of::<Plain>(), 1); assert_eq!(size_of::<Plain>(), 1);",
    ),
  );
});
test("layout: riferimenti ZST validi, non nulli e allineati", () => {
  run(
    main(
      layout,
      "let a = Aligned; let pointer = &a as *const Aligned; assert!(!pointer.is_null()); assert_eq!(pointer.addr() % align_of::<Aligned>(), 0); assert_eq!(size_of::<&Aligned>(), size_of::<usize>());",
    ),
  );
});
test("format: nomi vuoti, separatori e Unicode non vengono validati", () => {
  run(
    main(
      format,
      'for stem in ["", "../settings", "a/b", "\\u{e8}"] { let f = FileName::<Json>::new(stem.to_owned()); assert_eq!(f.render(), format!("{stem}.json")); }',
    ),
  );
});
test("format: rendering ripetuto e indipendenza della String restituita", () => {
  run(
    main(
      format,
      'let f = FileName::<Toml>::new("config".to_owned()); let mut s = f.render(); s.clear(); assert_eq!(f.render(), "config.toml"); assert_eq!(f.stem, "config");',
    ),
  );
});
test("format: stem trasferito senza duplicare il buffer", () => {
  run(
    main(
      format,
      'let s = String::from("settings"); let p = s.as_ptr(); let f = FileName::<Json>::new(s); assert_eq!(f.stem.as_ptr(), p);',
    ),
  );
});
test("format: i wrapper restano tipi distinti", () => {
  run(
    main(
      format,
      'let _: FileName<Json> = FileName::<Toml>::new("x".to_owned());',
    ),
    { error: "E0308" },
  );
});
test("format: servono implementazioni del trait anche per uno ZST", () => {
  run(
    main(
      format,
      'struct Other; let _ = FileName::<Other>::new("x".to_owned());',
    ),
    { error: "E0599" },
  );
});
test("format: PhantomData non istanzia e non distrugge F", () => {
  run(
    main(
      format,
      'struct Loud; impl Drop for Loud { fn drop(&mut self) { panic!("must not run"); } } impl Format for Loud { fn name() -> &\'static str { "loud" } } drop(FileName::<Loud>::new("x".to_owned()));',
    ),
  );
});
test("Vec: capacita massima anche se la lunghezza iniziale e zero", () => {
  run(
    main(
      drop,
      "let v = Vec::<Ticket>::with_capacity(usize::MAX); assert_eq!(v.len(), 0); assert_eq!(v.capacity(), usize::MAX); drop(v); assert_eq!(DROPS.with(Cell::get), 0);",
    ),
  );
});
test("Vec: clear distrugge ogni valore, poi il contenitore e riutilizzabile", () => {
  run(
    main(
      drop,
      "let mut v = Vec::new(); v.resize_with(5, || Ticket); v.clear(); assert_eq!(DROPS.with(Cell::get), 5); assert_eq!(v.len(), 0); v.push(Ticket); drop(v); assert_eq!(DROPS.with(Cell::get), 6);",
    ),
  );
});
test("Vec: truncate, remove e iteratori mantengono elementi logici", () => {
  run(
    main(
      drop,
      "let mut v = Vec::new(); v.resize_with(5, || Ticket); v.truncate(3); assert_eq!(DROPS.with(Cell::get), 2); let t = v.remove(1); assert_eq!(v.len(), 2); assert_eq!(DROPS.with(Cell::get), 2); drop(t); assert_eq!(v.iter().count(), 2); drop(v); assert_eq!(DROPS.with(Cell::get), 5);",
    ),
  );
});
test("Vec: iteratore consumato parzialmente distrugge i valori rimasti", () => {
  run(
    main(
      drop,
      "let mut v = Vec::new(); v.resize_with(4, || Ticket); let mut it = v.into_iter(); drop(it.next().unwrap()); assert_eq!(DROPS.with(Cell::get), 1); drop(it); assert_eq!(DROPS.with(Cell::get), 4);",
    ),
  );
});
test("slice: lunghezza positiva e dimensione zero non eliminano le chiamate", () => {
  run(
    main(
      drop,
      "let mut v = Vec::new(); v.resize_with(9, || Ticket); let slice = &v[2..7]; let mut calls = 0; for _ in slice { calls += 1; } assert_eq!(calls, 5); assert_eq!(size_of_val(slice), 0); assert!(size_of_val(&slice) > 0); drop(v); assert_eq!(DROPS.with(Cell::get), 9);",
    ),
  );
});
test("puntatori: tutti gli elementi di un array ZST condividono l'indirizzo", () => {
  run(
    main(
      layout,
      "let values = [Aligned, Aligned, Aligned]; let p = &values[0] as *const Aligned; for item in &values { assert_eq!(item as *const Aligned, p); }",
    ),
  );
});
test("Box: conserva allineamento elevato per un contenuto zero-sized", () => {
  run(
    main(
      layout,
      "let b = Box::new(Aligned); let p = b.as_ref() as *const Aligned; assert!(!p.is_null()); assert_eq!(p.addr() % 64, 0); assert_eq!(std::mem::size_of_val(b.as_ref()), 0); drop(b);",
    ),
  );
});
test("Drop: un move non anticipa la distruzione", () => {
  run(
    main(
      drop,
      "let a = Ticket; let b = a; assert_eq!(DROPS.with(Cell::get), 0); drop(b); assert_eq!(DROPS.with(Cell::get), 1);",
    ),
  );
});
test("Drop: forget sopprime il distruttore del solo marker", () => {
  run(
    main(
      drop,
      "std::mem::forget(Ticket); assert_eq!(DROPS.with(Cell::get), 0);",
    ),
  );
});
test("Drop: PhantomData non esegue Drop del parametro", () => {
  run(
    main(
      drop,
      "let p = std::marker::PhantomData::<Ticket>; assert!(!needs_drop::<std::marker::PhantomData<Ticket>>()); let _ = p; assert_eq!(DROPS.with(Cell::get), 0);",
    ),
  );
});
test("Drop: Copy non e ammesso neppure per uno ZST", () => {
  run(
    replace(
      from(drop),
      "struct Ticket;",
      "#[derive(Clone, Copy)]\nstruct Ticket;",
    ),
    { error: "E0184" },
  );
});
test("vuoto: match infallibile conserva tutti i valori u16", () => {
  run(
    main(
      empty,
      "for n in 0..=u16::MAX { assert_eq!(unwrap_infallible(Ok(n)), n); }",
    ),
  );
});
test("vuoto: assenza del valore e dimensione sono indipendenti", () => {
  run(
    main(
      empty,
      "let o: Option<Void> = None; assert!(o.is_none()); let result: Result<u16, Void> = Ok(42); assert_eq!(unwrap_infallible(result), 42); let marker = PhantomData::<Void>; let _ = marker; let _again = marker;",
    ),
  );
});
test("vuoto: Void non ha un costruttore come una struct", () => {
  run(main(empty, "let _value = Void {};"), { error: "E0574" });
});
test("enum: una variante senza dati e piu varianti non sono equivalenti", () => {
  run(
    main(
      empty,
      "enum One { Value } enum Choice { First, Second } assert_eq!(size_of::<One>(), 0); assert!(size_of::<Choice>() > 0); assert!(size_of::<Option<()>>() > 0);",
    ),
  );
});
test("closure e function item: ZST distinti dal function pointer", () => {
  run(
    "fn work() -> usize { 7 } fn main() { let closure = || work(); assert_eq!(std::mem::size_of_val(&closure), 0); assert_eq!(closure(), 7); let item = work; assert_eq!(std::mem::size_of_val(&item), 0); let pointer: fn() -> usize = item; assert!(std::mem::size_of_val(&pointer) > 0); assert_eq!(pointer(), 7); }",
  );
});
test("correzione Copy: duplicazione dichiarata esplicitamente", () => {
  run(
    replace(
      from(moved),
      "struct Marker;",
      "#[derive(Clone, Copy)]\nstruct Marker;",
    ),
  );
});
test("correzione borrowing: due prestiti non consumano il marker", () => {
  run(
    replace(
      replace(from(moved), "fn consume(_: Marker)", "fn consume(_: &Marker)"),
      "    consume(marker);\n    consume(marker);",
      "    consume(&marker);\n    consume(&marker);",
    ),
  );
});
test("correzione scelta runtime: enum e due rami verificati", () => {
  run(
    'enum FormatChoice { Json, Toml } fn main() { for use_json in [true, false] { let value = if use_json { FormatChoice::Json } else { FormatChoice::Toml }; let name = match value { FormatChoice::Json => "json", FormatChoice::Toml => "toml" }; assert_eq!(name, if use_json { "json" } else { "toml" }); } }',
  );
});
