import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Box T"];
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
const prefix = "appunti-rust-box-";
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

const ownership = "Prestito, mutazione e trasferimento";
const clone = "Clone non significa condivisione del box";
const destruction = "Distruzione ordinaria e drop anticipato";
const slices = "Slice e testo posseduti";
const objects = "Trait object con una factory completa";
const list = "Lista ricorsiva con dimensione finita";
const expressions = "Albero di espressioni con overflow esplicito";
const pin = "Box ordinario e pinning non sono equivalenti";
const moved = "Riutilizzare il box dopo un move";
const borrowed = "Un box di riferimenti non possiede i dati riferiti";
const from = (heading) => source(0, heading);
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 10);
});
test("metadati: solo Deref da prerequisito a collegamento correlato", () => {
  const filename = "Programmazione/Rust/Pagine/Box T.md";
  const head = launch("git", ["show", "HEAD:" + filename], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  const expected = yaml(head.stdout).replace(
    '  - "[[Programmazione/Rust/Pagine/Deref Trait]]"\nrelated:\n',
    'related:\n  - "[[Programmazione/Rust/Pagine/Deref Trait]]"\n',
  );
  assert.equal(yaml(fs.readFileSync(filename, "utf8")), expected);
  assert(
    !notes[0].data.prerequisites.includes(
      "[[Programmazione/Rust/Pagine/Deref Trait]]",
    ),
  );
  assert(
    notes[0].data.related.includes(
      "[[Programmazione/Rust/Pagine/Deref Trait]]",
    ),
  );
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
});
test("struttura, fonti e nessun placeholder o blocco unsafe", () => {
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), ["Box<T>"]);
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
  ])
    assert(headings.some((n) => n.depth === 2 && text(n) === title));
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(notes[0].body, /doc\.rust-lang\.org\/std\/boxed/);
  for (const code of blocks[0].values())
    assert.doesNotMatch(code, /\bunsafe\b|\btodo!|\bunimplemented!/);
});
for (const heading of [
  ownership,
  clone,
  destruction,
  slices,
  objects,
  list,
  expressions,
  pin,
  moved,
  borrowed,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === moved
        ? { error: "E0382" }
        : heading === borrowed
          ? { error: "E0597" }
          : {};
    const result = run(from(heading), options);
    if (!options.error) assert.equal(result, "");
  });
}
test("ownership: leggere un contenuto Copy non consuma il box", () =>
  run(
    extend(
      ownership,
      `
    let boxed = Box::new(7_u32);
    let copied = *boxed;
    assert_eq!(copied, 7);
    assert_eq!(*boxed, 7);
  `,
    ),
  ));
test("ownership: mutazione esplicita con as_mut", () =>
  run(
    extend(
      ownership,
      `
    let mut boxed = Box::new(String::new());
    let view: &mut String = boxed.as_mut();
    view.push_str("rust");
    assert_eq!(text_len(&boxed), 4);
  `,
    ),
  ));
test("ownership: mutazione di un binding immutabile rifiutata", () =>
  run(replaceOnce(from(ownership), "let mut boxed =", "let boxed ="), {
    error: "E0596",
  }));
test("ownership: estrarre String rende inutilizzabile il vecchio box", () =>
  run(
    replaceOnce(
      from(ownership),
      'assert_eq!(text, "rust!");',
      'assert_eq!(text, "rust!");\n    assert_eq!(moved.as_str(), "rust!");',
    ),
    { error: "E0382" },
  ));
test("ownership: trasferire il box con un prestito ancora usato e vietato", () =>
  run(
    extend(
      ownership,
      `
    let boxed = Box::new(String::from("data"));
    let view = boxed.as_ref();
    let moved = boxed;
    assert_eq!(view, "data");
    drop(moved);
  `,
    ),
    { error: "E0505" },
  ));
test("ownership: T sized ha rappresentazione di un puntatore, anche se T e grande", () =>
  run(
    extend(
      ownership,
      `
    use std::mem::{size_of, size_of_val};
    assert_eq!(size_of::<Box<u64>>(), size_of::<*const u64>());
    assert_eq!(size_of::<Box<[u8; 4096]>>(), size_of::<*const [u8; 4096]>());
    let boxed = Box::new([5_u8; 4096]);
    assert_eq!(size_of_val(boxed.as_ref()), 4096);
    let address = std::ptr::from_ref(boxed.as_ref());
    let moved = boxed;
    assert_eq!(std::ptr::from_ref(moved.as_ref()), address);
    assert_eq!(moved[4095], 5);
  `,
    ),
  ));
test("ownership: ZST e box restano valori validi senza misurare allocazioni", () =>
  run(
    extend(
      ownership,
      `
    let boxed = Box::new(());
    assert_eq!(std::mem::size_of_val(boxed.as_ref()), 0);
    assert_eq!(std::mem::size_of_val(&boxed), std::mem::size_of::<*const ()>());
    assert_eq!(*boxed, ());
  `,
    ),
  ));
test("clone: Box di Rc clona il puntatore condiviso, non il valore finale", () =>
  run(
    extend(
      clone,
      `
    use std::cell::Cell;
    use std::rc::Rc;
    let first = Box::new(Rc::new(Cell::new(10)));
    let second = first.clone();
    assert!(!std::ptr::eq(first.as_ref(), second.as_ref()));
    assert!(Rc::ptr_eq(first.as_ref(), second.as_ref()));
    second.set(20);
    assert_eq!(first.get(), 20);
  `,
    ),
  ));
test("clone: contenuto non Clone non si clona automaticamente", () =>
  run(
    extend(
      clone,
      `
    struct NoClone;
    let original = Box::new(NoClone);
    let _copy = original.clone();
  `,
    ),
    { error: "E0599" },
  ));
test("clone: Box di riferimenti mantiene la dipendenza dal proprietario", () =>
  run(
    extend(
      clone,
      `
    let source = String::from("same");
    let original = Box::new(source.as_str());
    let copy = original.clone();
    assert_eq!(original.as_ptr(), copy.as_ptr());
    assert_eq!(*copy, "same");
  `,
    ),
  ));
test("drop: estrarre il contenuto ne trasferisce la distruzione", () =>
  run(
    extend(
      destruction,
      `
    let counter = Cell::new(0);
    let boxed = Box::new(Tracked { drops: &counter });
    let inner = *boxed;
    assert_eq!(counter.get(), 0);
    drop(inner);
    assert_eq!(counter.get(), 1);
  `,
    ),
  ));
test("drop: restituire un box non distrugge il suo contenuto al ritorno", () =>
  run(
    extend(
      destruction,
      `
    fn make(counter: &Cell<usize>) -> Box<Tracked<'_>> {
        Box::new(Tracked { drops: counter })
    }
    let counter = Cell::new(0);
    let owner = make(&counter);
    assert_eq!(counter.get(), 0);
    drop(owner);
    assert_eq!(counter.get(), 1);
  `,
    ),
  ));
test("drop: distruttore osservabile anche per un contenuto zero-sized", () =>
  run(
    extend(
      destruction,
      `
    use std::sync::atomic::{AtomicUsize, Ordering};
    static COUNT: AtomicUsize = AtomicUsize::new(0);
    struct Zero;
    impl Drop for Zero {
        fn drop(&mut self) { COUNT.fetch_add(1, Ordering::Relaxed); }
    }
    assert_eq!(std::mem::size_of::<Zero>(), 0);
    let boxed = Box::new(Zero);
    drop(boxed);
    assert_eq!(COUNT.load(Ordering::Relaxed), 1);
  `,
    ),
  ));
test("drop: trait object esegue il distruttore del tipo concreto", () =>
  run(
    extend(
      destruction,
      `
    trait Marker {}
    impl Marker for Tracked<'_> {}
    let counter = Cell::new(0);
    let owner: Box<dyn Marker + '_> = Box::new(Tracked { drops: &counter });
    drop(owner);
    assert_eq!(counter.get(), 1);
  `,
    ),
  ));
test("drop: un riferimento al box non ne trasferisce ownership", () =>
  run(
    extend(
      destruction,
      `
    let counter = Cell::new(0);
    let owner = Box::new(Tracked { drops: &counter });
    let reference = &owner;
    #[allow(dropping_references)]
    drop(reference);
    assert_eq!(counter.get(), 0);
    drop(owner);
    assert_eq!(counter.get(), 1);
  `,
    ),
  ));
test("slice: vuota, elementi non Clone e conversione in Vec", () =>
  run(
    extend(
      slices,
      `
    struct Item(String);
    let empty: Box<[Item]> = Vec::new().into_boxed_slice();
    assert!(empty.is_empty());
    let items = vec![Item(String::from("a")), Item(String::from("b"))].into_boxed_slice();
    let pointer = items.as_ptr();
    let values = items.into_vec();
    assert_eq!(values.as_ptr(), pointer);
    assert_eq!(values[1].0, "b");
  `,
    ),
  ));
test("slice: eliminare capacita in eccesso conserva valori, non richiede lo stesso indirizzo", () =>
  run(
    extend(
      slices,
      `
    let mut values = Vec::with_capacity(32);
    values.extend([1, 2, 3]);
    let boxed = values.into_boxed_slice();
    assert_eq!(&*boxed, &[1, 2, 3]);
    let restored = boxed.into_vec();
    assert_eq!(restored.len(), 3);
    assert_eq!(restored.capacity(), 3);
  `,
    ),
  ));
test("slice: coercizione array-slice conserva l'allocazione", () =>
  run(
    extend(
      slices,
      `
    let fixed = Box::new([10_i32, 20, 30]);
    let pointer = fixed.as_ptr();
    let dynamic: Box<[i32]> = fixed;
    assert_eq!(dynamic.as_ptr(), pointer);
    assert_eq!(dynamic.len(), 3);
  `,
    ),
  ));
test("slice: Box di slice non espone push", () =>
  run(
    extend(
      slices,
      `
    let mut values: Box<[i32]> = vec![1].into_boxed_slice();
    values.push(2);
  `,
    ),
    { error: "E0599" },
  ));
test("testo: vuoto e conversione ASCII non trasformano tutti i caratteri Unicode", () =>
  run(
    extend(
      slices,
      String.raw`
    let empty: Box<str> = String::new().into_boxed_str();
    assert!(empty.is_empty());
    let mut text = String::from("rust-\u{03bb}").into_boxed_str();
    text.make_ascii_uppercase();
    assert_eq!(&*text, "RUST-\u{03bb}");
    assert_eq!(text.len(), 7);
  `,
    ),
  ));
test("testo: Box str non espone push_str", () =>
  run(
    extend(
      slices,
      `
    let mut text: Box<str> = String::from("a").into_boxed_str();
    text.push_str("b");
  `,
    ),
    { error: "E0599" },
  ));
test("testo: Box new di str borrowed non e Box str", () =>
  run(
    extend(
      slices,
      `
    let text: Box<str> = Box::new("borrowed");
    assert_eq!(&*text, "borrowed");
  `,
    ),
    { error: "E0308" },
  ));
test("dyn: factory tratta zero, massimo e label", () =>
  run(
    extend(
      objects,
      `
    assert_eq!(make_widget(Some(0)).draw(), "count=0");
    assert_eq!(make_widget(Some(u32::MAX)).draw(), "count=4294967295");
    assert_eq!(make_widget(None).draw(), "ready");
  `,
    ),
  ));
test("dyn: draw produce una String indipendente e non fa escaping", () =>
  run(
    extend(
      objects,
      `
    let result = {
        let label: Box<dyn Draw> = Box::new(Label(String::from("<raw>")));
        label.draw()
    };
    assert_eq!(result, "<raw>");
  `,
    ),
  ));
test("dyn: un semplice impl Trait non unifica due tipi concreti", () => {
  let code = replaceOnce(from(objects), "-> Box<dyn Draw>", "-> impl Draw");
  code = replaceOnce(code, "Box::new(Counter(value))", "Counter(value)");
  code = replaceOnce(
    code,
    'Box::new(Label(String::from("ready")))',
    'Label(String::from("ready"))',
  );
  run(code, { error: "E0308" });
});
test("dyn: contenuto borrowed ammesso con bound esplicito", () =>
  run(
    extend(
      objects,
      `
    struct Borrowed<'a>(&'a str);
    impl Draw for Borrowed<'_> {
        fn draw(&self) -> String { self.0.to_owned() }
    }
    fn make(text: &str) -> Box<dyn Draw + '_> {
        Box::new(Borrowed(text))
    }
    let source = String::from("local");
    assert_eq!(make(&source).draw(), "local");
  `,
    ),
  ));
test("dyn: default static della firma impedisce un prestito esterno non static", () =>
  run(
    extend(
      objects,
      `
    struct Borrowed<'a>(&'a str);
    impl Draw for Borrowed<'_> {
        fn draw(&self) -> String { self.0.to_owned() }
    }
    fn make(text: &str) -> Box<dyn Draw> {
        Box::new(Borrowed(text))
    }
  `,
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("thread: Box String soddisfa Send e Sync", () =>
  run(
    extend(
      ownership,
      `
    fn require<T: Send + Sync>() {}
    require::<Box<String>>();
  `,
    ),
  ));
test("thread: Box di Rc non diventa Send", () =>
  run(
    extend(
      ownership,
      `
    fn require<T: Send>() {}
    require::<Box<std::rc::Rc<i32>>>();
  `,
    ),
    { error: "E0277" },
  ));
test("thread: Box Cell puo essere Send ma non Sync", () => {
  const code = extend(
    ownership,
    `
    fn require<T: Send>() {}
    require::<Box<std::cell::Cell<i32>>>();
  `,
  );
  run(code);
  run(replaceOnce(code, "fn require<T: Send>()", "fn require<T: Sync>()"), {
    error: "E0277",
  });
});
test("thread: dyn Draw non implica Send, anche se i concreti lo supportano", () =>
  run(
    extend(
      objects,
      `
    fn require<T: Send>(_: T) {}
    require(make_widget(Some(1)));
  `,
    ),
    { error: "E0277" },
  ));
test("thread: bound Send esplicito conserva il requisito nel trait object", () =>
  run(
    replaceOnce(
      extend(
        objects,
        `
    fn require<T: Send>(_: T) {}
    require(make_widget(Some(1)));
  `,
      ),
      "-> Box<dyn Draw>",
      "-> Box<dyn Draw + Send>",
    ),
  ));
test("List: vuota, prepend e ordine dei valori", () =>
  run(
    extend(
      list,
      `
    assert_eq!(List::Nil.len(), 0);
    let list = List::Nil.prepend(3).prepend(2).prepend(1);
    let mut cursor = &list;
    for expected in [1, 2, 3] {
        match cursor {
            List::Cons(value, next) => {
                assert_eq!(*value, expected);
                cursor = next.as_ref();
            }
            List::Nil => panic!("fine inattesa"),
        }
    }
    assert!(matches!(cursor, List::Nil));
    assert_eq!(list.len(), 3);
  `,
    ),
  ));
test("List: molteplici lunghezze limitate e nessun consumo nella lettura", () =>
  run(
    extend(
      list,
      `
    for length in 0..32 {
        let mut list = List::Nil;
        for value in 0..length { list = list.prepend(value as i32); }
        assert_eq!(list.len(), length);
        assert_eq!(list.len(), length);
        assert_eq!(list.first(), (length > 0).then(|| length as i32 - 1));
    }
  `,
    ),
  ));
test("List: rimuovere l'indirezione rende infinita la dimensione", () =>
  run(replaceOnce(from(list), "Cons(i32, Box<List>)", "Cons(i32, List)"), {
    error: "E0072",
  }));
test("eval: estremi, numeri negativi e overflow/underflow", () =>
  run(
    extend(
      expressions,
      `
    assert_eq!(eval(&Expr::Number(i64::MIN)), Some(i64::MIN));
    assert_eq!(eval(&Expr::Number(i64::MAX)), Some(i64::MAX));
    for (left, right, expected) in [
        (0, 0, Some(0)), (-10, 3, Some(-7)),
        (i64::MAX, i64::MIN, Some(-1)),
        (i64::MAX, 1, None), (i64::MIN, -1, None),
    ] {
        let expr = Expr::Add(Box::new(Expr::Number(left)), Box::new(Expr::Number(right)));
        assert_eq!(eval(&expr), expected);
        assert_eq!(eval(&expr), expected);
    }
  `,
    ),
  ));
test("eval: overflow intermedio propagato anche se una somma matematica finale rientrerebbe", () =>
  run(
    extend(
      expressions,
      `
    let expr = Expr::Add(
        Box::new(Expr::Add(
            Box::new(Expr::Number(i64::MAX)),
            Box::new(Expr::Number(1)),
        )),
        Box::new(Expr::Number(-1)),
    );
    assert_eq!(eval(&expr), None);
    let right = Expr::Add(Box::new(Expr::Number(0)), Box::new(expr));
    assert_eq!(eval(&right), None);
  `,
    ),
  ));
test("eval: checked_add conserva gli esiti con ottimizzazioni e overflow checks disabilitati", () =>
  run(from(expressions), {
    args: ["-C", "opt-level=3", "-C", "overflow-checks=off"],
  }));
test("Expr: rimuovere i box non conserva un tipo finito", () =>
  run(
    replaceOnce(
      from(expressions),
      "Add(Box<Expr>, Box<Expr>)",
      "Add(Expr, Expr)",
    ),
    { error: "E0072" },
  ));
test("Pin: un Box ordinario di tipo non Unpin permette anche replace", () =>
  run(
    extend(
      pin,
      `
    let mut boxed = Box::new(Entry { text: String::from("old"), _pin: PhantomPinned });
    let previous = std::mem::replace(boxed.as_mut(), Entry {
        text: String::from("new"), _pin: PhantomPinned,
    });
    assert_eq!(previous.text, "old");
    assert_eq!(boxed.text, "new");
  `,
    ),
  ));
test("Pin: into_inner rifiutato sul contenuto non Unpin", () =>
  run(
    extend(
      pin,
      `
    let pinned = Box::pin(Entry { text: String::from("fixed"), _pin: PhantomPinned });
    let _boxed = Pin::into_inner(pinned);
  `,
    ),
    { error: "E0277" },
  ));
test("Pin: estrarre il contenuto non Copy da Pin Box e rifiutato", () =>
  run(
    extend(
      pin,
      `
    let pinned = Box::pin(Entry { text: String::from("fixed"), _pin: PhantomPinned });
    let _entry = *pinned;
  `,
    ),
    { error: "E0507" },
  ));
test("Pin: il wrapper resta trasferibile senza spostare il contenuto", () =>
  run(
    extend(
      pin,
      `
    let pinned = Box::pin(Entry { text: String::from("fixed"), _pin: PhantomPinned });
    let address = std::ptr::from_ref(pinned.as_ref().get_ref());
    let moved = pinned;
    assert_eq!(std::ptr::from_ref(moved.as_ref().get_ref()), address);
    assert_eq!(moved.text, "fixed");
  `,
    ),
  ));
test("lifetime: trasferire String nel box corregge il prestito locale", () => {
  let code = replaceOnce(
    from(borrowed),
    "Box::new(local.as_str())",
    "Box::new(local)",
  );
  code = replaceOnce(
    code,
    'assert_eq!(*boxed, "temporaneo");',
    'assert_eq!(boxed.as_ref(), "temporaneo");',
  );
  run(code);
});
test("lifetime: convertire in Box str rende posseduti i byte", () => {
  let code = replaceOnce(
    from(borrowed),
    "Box::new(local.as_str())",
    "local.into_boxed_str()",
  );
  code = replaceOnce(
    code,
    'assert_eq!(*boxed, "temporaneo");',
    'assert_eq!(boxed.as_ref(), "temporaneo");',
  );
  run(code);
});
test("lifetime: clonare Box str borrowed non risolve il proprietario scaduto", () =>
  run(
    replaceOnce(
      from(borrowed),
      "Box::new(local.as_str())",
      "Box::new(local.as_str()).clone()",
    ),
    { error: "E0597" },
  ));
test("lifetime: leak non rende statici i prestiti contenuti", () =>
  run(
    extend(
      ownership,
      `
    let local = String::from("borrowed");
    let _: &'static mut &str = Box::leak(Box::new(local.as_str()));
  `,
    ),
    { error: "E0597" },
  ));
test("API: into_inner e ancora feature-gated sulla baseline", () =>
  run(extend(ownership, `let _value = Box::into_inner(Box::new(1));`), {
    error: "E0658",
  }));
test("API: try_new e ancora feature-gated sulla baseline", () =>
  run(extend(ownership, `let _value = Box::try_new(1);`), { error: "E0658" }));
test("API: from_raw non puo essere chiamata senza un blocco unsafe", () =>
  run(
    extend(
      ownership,
      `
    let pointer = Box::into_raw(Box::new(1));
    let _owner = Box::from_raw(pointer);
  `,
    ),
    { error: "E0133" },
  ));
