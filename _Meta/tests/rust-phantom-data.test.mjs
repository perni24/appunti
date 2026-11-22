import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/PhantomData.md";
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
const prefix = "appunti-rust-phantom-data-";
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

const size = "Dimensione e assenza di un valore T";
const id = "Identificatori senza ownership di T";
const slice = "Descrittore legato a una slice";
const auto = "Verificare i bound senza avviare thread";
const variance = "Verificare la direzione della varianza";
const unused = "Parametro non usato nei campi";
const mix = "Mescolare identificatori";
const lifetime = "Far uscire una relazione di prestito";
const send = "Confondere marker Send con contenuto Send";
const derive = "Derive che richiede Copy al parametro";
const drop = "Ignorare la distruzione implicita";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}

test("baseline reale e undici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 11);
});
test("frontmatter invariato, titoli e fonti", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "PhantomData",
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
  assert.ok(table);
  assert.equal(tableForms.length, 8);
  for (const url of [
    "https://doc.rust-lang.org/std/marker/struct.PhantomData.html",
    "https://doc.rust-lang.org/nomicon/phantom-data.html",
    "https://doc.rust-lang.org/reference/subtyping.html",
    "https://doc.rust-lang.org/std/ops/trait.Drop.html#drop-check",
  ]) {
    assert.ok(originalBytes.toString().includes(url));
  }
  for (const code of blocks.values())
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
});
for (const title of [size, id, slice, auto, variance]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [unused, "E0392"],
  [mix, "E0308"],
  [lifetime, "E0515"],
  [send, "E0277"],
  [derive, "E0277"],
  [drop, "E0505"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}

// La tabella del Markdown e confrontata con sonde dei bound, senza avviare thread.
const patterns = [
  [
    "T",
    "covariant",
    {
      String: [true, true],
      "Rc<()>": [false, false],
      "Cell<u8>": [true, false],
    },
  ],
  [
    "&'static T",
    "covariant",
    {
      String: [true, true],
      "Rc<()>": [false, false],
      "Cell<u8>": [false, false],
    },
  ],
  [
    "&'static mut T",
    "invariant",
    {
      String: [true, true],
      "Rc<()>": [false, false],
      "Cell<u8>": [true, false],
    },
  ],
  [
    "*const T",
    "covariant",
    {
      String: [false, false],
      "Rc<()>": [false, false],
      "Cell<u8>": [false, false],
    },
  ],
  [
    "*mut T",
    "invariant",
    {
      String: [false, false],
      "Rc<()>": [false, false],
      "Cell<u8>": [false, false],
    },
  ],
  [
    "fn() -> T",
    "covariant",
    { String: [true, true], "Rc<()>": [true, true], "Cell<u8>": [true, true] },
  ],
  [
    "fn(T)",
    "contravariant",
    { String: [true, true], "Rc<()>": [true, true], "Cell<u8>": [true, true] },
  ],
  [
    "fn(T) -> T",
    "invariant",
    { String: [true, true], "Rc<()>": [true, true], "Cell<u8>": [true, true] },
  ],
];
// Il parser del vault e CommonMark: le tabelle GFM restano paragrafi.
const table = note.tree.children.find(
  (n) => n.type === "paragraph" && text(n).startsWith("| Campo |"),
);
const tableForms = (table?.children ?? [])
  .filter((n) => n.type === "inlineCode")
  .map(text);
for (const [i, [pattern, direction, cases]] of patterns.entries()) {
  test("tabella: Send e Sync di " + pattern, () => {
    const cell = tableForms[i];
    assert.equal(
      cell,
      "PhantomData<" + pattern.replaceAll("'static", "'a") + ">",
    );
    for (const [type, expected] of Object.entries(cases)) {
      for (const [index, trait] of ["Send", "Sync"].entries()) {
        const code =
          "use std::{marker::PhantomData, rc::Rc, cell::Cell}; fn require<T: " +
          trait +
          ">() {} fn main() { require::<PhantomData<" +
          pattern.replaceAll("T", type) +
          ">>(); }";
        run(code, expected[index] ? {} : { error: "E0277" });
      }
    }
  });
  test("tabella: varianza di " + pattern, () => {
    const marker = pattern.replaceAll("'static", "'a");
    const declaration =
      "use std::marker::PhantomData; struct Wrapper<'a, T: 'a> { value: PhantomData<" +
      marker +
      ">, borrow: PhantomData<&'a ()> }";
    const shorten =
      declaration +
      " fn change<'a, 'long: 'short, 'short: 'a>(x: Wrapper<'a, &'long str>) -> Wrapper<'a, &'short str> { x } fn main() {}";
    const lengthen =
      declaration +
      " fn change<'a, 'long: 'short, 'short: 'a>(x: Wrapper<'a, &'short str>) -> Wrapper<'a, &'long str> { x } fn main() {}";
    const fail = { message: /lifetime may not live long enough/ };
    run(shorten, direction === "covariant" ? {} : fail);
    run(lengthen, direction === "contravariant" ? {} : fail);
  });
}

test("Copy Clone e Default del marker non richiedono i trait a T", () => {
  run(
    "use std::marker::PhantomData; struct NoTraits; fn check<T: Copy + Clone + Default>() {} fn main() { check::<PhantomData<NoTraits>>(); check::<PhantomData<str>>(); }",
  );
});
test("marker non crea ne distrugge T", () => {
  run(
    "use std::{marker::PhantomData, sync::atomic::{AtomicUsize, Ordering}}; static DROPS: AtomicUsize = AtomicUsize::new(0); struct Tracked; impl Drop for Tracked { fn drop(&mut self) { DROPS.fetch_add(1, Ordering::SeqCst); } } struct Holder(PhantomData<Tracked>); fn main() { { let _holder = Holder(PhantomData); } assert_eq!(DROPS.load(Ordering::SeqCst), 0); let real = Tracked; drop(real); assert_eq!(DROPS.load(Ordering::SeqCst), 1); }",
  );
});
test("ID copia e clona soltanto il numero, anche ai limiti", () => {
  run(
    main(
      id,
      "for number in [0, u64::MAX] { let a = Id::<User>::new(number); let b = a; let c = a.clone(); assert_eq!(user_number(a), number); assert_eq!(user_number(b), number); assert_eq!(user_number(c), number); }",
    ),
  );
});
test("ID privo di valori T resta Send Sync con etichetta Rc", () => {
  run(
    main(id, "fn check<T: Send + Sync>() {} check::<Id<std::rc::Rc<()>>>();"),
  );
});
test("un vero campo Rc prevale sul marker function pointer", () => {
  run(
    "use std::{marker::PhantomData, rc::Rc}; struct Label<T> { actual: Rc<()>, kind: PhantomData<fn() -> T> } fn require<T: Send>() {} fn main() { require::<Label<String>>(); }",
    { error: "E0277" },
  );
});
test("descrittore: slice vuota, String e ZST senza dereferenziazione", () => {
  run(
    main(
      slice,
      'let empty: [u8; 0] = []; let view = SliceView::new(&empty); assert_eq!(view.len(), 0); assert_eq!(view.as_ptr(), empty.as_ptr()); let strings = [String::from("x")]; let view = SliceView::new(&strings); assert_eq!(view.len(), 1); assert_eq!(view.as_ptr(), strings.as_ptr()); let units = [(); 3]; let view = SliceView::new(&units); assert_eq!(view.len(), 3); assert_eq!(view.as_ptr(), units.as_ptr());',
    ),
  );
});
test("descrittore usato successivamente impedisce mutazione incompatibile", () => {
  run(
    main(
      slice,
      "let mut values = vec![1, 2]; let view = SliceView::new(&values); values.push(3); assert_eq!(view.len(), 2);",
    ),
    { error: "E0502" },
  );
});
test("descrittore usato successivamente impedisce drop del proprietario", () => {
  run(
    main(
      slice,
      "let values = vec![1, 2]; let view = SliceView::new(&values); drop(values); assert_eq!(view.len(), 2);",
    ),
    { error: "E0505" },
  );
});
test("campi privati impediscono costruzione dall'esterno del modulo", () => {
  run(
    main(
      slice,
      "let _invalid = SliceView { ptr: std::ptr::null::<u8>(), len: 1, _borrow: PhantomData };",
    ),
    { error: "E0451" },
  );
});
test("raw pointer nel descrittore resta non Send e non Sync", () => {
  for (const trait of ["Send", "Sync"]) {
    run(
      main(
        slice,
        "fn require<T: " +
          trait +
          ">() {} require::<SliceView<'static, u8>>();",
      ),
      { error: "E0277" },
    );
  }
});
test("puntatore estratto puo uscire dal prestito, senza essere dereferenziato", () => {
  run(
    main(
      slice,
      "let pointer = { let values = vec![1]; SliceView::new(&values).as_ptr() }; assert!(!pointer.is_null());",
    ),
  );
});
test("fine dell'uso del descrittore permette una mutazione successiva", () => {
  run(
    main(
      slice,
      "let mut values = vec![1, 2]; let view = SliceView::new(&values); assert_eq!(view.len(), 2); values.push(3); assert_eq!(values.len(), 3);",
    ),
  );
});
test("lifetime esterno di prestito mutabile resta covariante", () => {
  run(
    "use std::marker::PhantomData; struct View<'a, T>(PhantomData<&'a mut T>); fn shorter<'long: 'short, 'short>(x: View<'long, u8>) -> View<'short, u8> { x } fn main() { let _ = shorter(View::<'static, u8>(PhantomData)); }",
  );
});
test("Unpin distingue PhantomData T, function pointer e PhantomPinned", () => {
  run(
    "use std::marker::{PhantomData, PhantomPinned}; fn require<T: Unpin>() {} fn main() { require::<PhantomData<PhantomPinned>>(); }",
    { error: "E0277" },
  );
  run(
    "use std::marker::{PhantomData, PhantomPinned}; fn require<T: Unpin>() {} fn main() { require::<PhantomData<fn() -> PhantomPinned>>(); }",
  );
  run(
    "use std::marker::PhantomPinned; struct Pinned(PhantomPinned); fn require<T: Unpin>() {} fn main() { require::<Pinned>(); }",
    { error: "E0277" },
  );
});
test("correzione: parametro realmente usato in un marker", () => {
  run(
    replace(
      from(unused),
      "    value: u64,",
      "    value: u64,\n    kind: std::marker::PhantomData<fn() -> T>,",
    ),
  );
});
test("correzione: ID del dominio richiesto", () => {
  run(replace(from(mix), "let order = Id::<Order>", "let order = Id::<User>"));
});
test("correzione: prestito legato a dati statici reali", () => {
  run(
    replace(
      from(lifetime),
      "    let local = vec![1, 2, 3];\n    borrow(&local)",
      "    borrow(&[1, 2, 3])",
    ),
  );
});
test("correzione derive: implementazioni manuali senza bound T", () => {
  let code = replace(from(derive), "#[derive(Copy, Clone)]\n", "");
  code = replace(
    code,
    "fn require_copy<T: Copy>() {}",
    "impl<T> Copy for Id<T> {} impl<T> Clone for Id<T> { fn clone(&self) -> Self { *self } } fn require_copy<T: Copy>() {}",
  );
  run(code);
});
test("correzione: drop della guardia prima del proprietario", () => {
  run(
    replace(
      from(drop),
      "    drop(source);",
      "    drop(_guard);\n    drop(source);",
    ),
  );
});
test("senza Drop non si presume prestito vivo fino alla fine dello scope", () => {
  run(
    replace(
      from(drop),
      "impl Drop for Guard<'_> {\n    fn drop(&mut self) {}\n}\n",
      "",
    ),
  );
});
test("guardia con Drop richiede distruzione, marker da solo no", () => {
  run(
    main(
      drop,
      "assert!(std::mem::needs_drop::<Guard<'static>>()); assert!(!std::mem::needs_drop::<PhantomData<&'static str>>());",
    ),
  );
});
test("Drop generico conserva il prestito anche senza PhantomData", () => {
  run(
    'struct Guard<T>(*const T); impl<T> Drop for Guard<T> { fn drop(&mut self) {} } fn guard<T>(value: &T) -> Guard<T> { Guard(value) } fn main() { let source = String::from("data"); let reference = &source; let _guard = guard(&reference); drop(source); }',
    { error: "E0505" },
  );
});
