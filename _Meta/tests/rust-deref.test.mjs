import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Deref Trait"];
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
const prefix = "appunti-rust-deref-";
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

const basic = "Un wrapper completo senza allocazione propria";
const coercions = "Coercizioni nei punti con tipo atteso";
const buffer = "Buffer con vista mutabile sulla slice";
const validated = "NonEmptyString con campo privato e aggiornamento validato";
const explicit = "AsRef esplicito per un contratto generico";
const methods = "Collisioni tra metodi del wrapper e del target";
const broken = "Controesempio: esporre String mutabile rompe la validazione";
const move = "Estrarre un valore non Copy tramite Deref";
const bound = "I trait del target non diventano trait del wrapper";
const borrow = "Il prestito iniziale non viene aggiunto a ogni argomento";
const from = (heading) => source(0, heading);
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e inventario: dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 10);
});
test("frontmatter invariato, struttura e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/Deref Trait.md";
  const head = launch("git", ["show", "HEAD:" + filename], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(fs.readFileSync(filename, "utf8")), yaml(head.stdout));
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), names);
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
  assert.match(notes[0].body, /doc\.rust-lang\.org\/std\/ops\/trait\.Deref/);
  for (const code of blocks[0].values())
    assert.doesNotMatch(code, /\bunsafe\b|\btodo!|\bunimplemented!/);
});
for (const heading of [
  basic,
  coercions,
  buffer,
  validated,
  explicit,
  methods,
  broken,
  move,
  bound,
  borrow,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === move
        ? { error: "E0507" }
        : heading === bound
          ? { error: "E0277" }
          : heading === borrow
            ? { error: "E0308" }
            : {};
    const result = run(from(heading), options);
    if (!options.error) assert.equal(result, "");
  });
}
test("MyBox: contiene direttamente T, senza una propria allocazione", () =>
  run(
    extend(
      basic,
      `
    let wrapped = MyBox::new([1_u8; 32]);
    assert_eq!(std::mem::size_of_val(&wrapped), 32);
    assert_eq!((*wrapped)[31], 1);
  `,
    ),
  ));
test("MyBox: into_inner trasferisce valori non Clone", () =>
  run(
    extend(
      basic,
      `
    struct NoClone(String);
    let wrapped = MyBox::new(NoClone(String::from("payload")));
    let moved = MyBox::into_inner(wrapped);
    assert_eq!(moved.0, "payload");
  `,
    ),
  ));
test("MyBox: lettura Copy non consuma il wrapper", () =>
  run(
    extend(
      basic,
      `
    let wrapped = MyBox::new(12_u32);
    let copied = *wrapped;
    assert_eq!(copied, *wrapped);
  `,
    ),
  ));
test("MyBox: un riferimento al contenuto non supera la vita del wrapper", () =>
  run(
    extend(
      basic,
      `
    let view;
    {
        let wrapped = MyBox::new(String::from("temporary"));
        view = &*wrapped;
    }
    assert_eq!(view, "temporary");
  `,
    ),
    { error: "E0597" },
  ));
test("MyBox: into_inner vietato se la vista resta in uso", () =>
  run(
    extend(
      basic,
      `
    let wrapped = MyBox::new(String::from("borrowed"));
    let view = &*wrapped;
    let owned = MyBox::into_inner(wrapped);
    assert_eq!(view, &owned);
  `,
    ),
    { error: "E0505" },
  ));
test("MyBox: i builtin reference dereferenziano anche senza implementazione custom", () =>
  run(
    extend(
      basic,
      `
    let number = 10;
    let reference = &number;
    assert_eq!(*reference, 10);
    let mut number = 20;
    let reference = &mut number;
    *reference = 30;
    assert_eq!(number, 30);
  `,
    ),
  ));
test("MyBox: Deref condiviso non impedisce interior mutability del target", () =>
  run(
    extend(
      basic,
      `
    let wrapped = MyBox::new(std::cell::Cell::new(1));
    wrapped.set(2);
    assert_eq!(wrapped.get(), 2);
  `,
    ),
  ));
test("MyBox: da mut wrapper a target condiviso basta Deref", () =>
  run(
    extend(
      basic,
      `
    let mut wrapped = MyBox::new(String::from("shared"));
    let view: &String = &mut wrapped;
    assert_eq!(view, "shared");
  `,
    ),
  ));
test("MyBox: target mutabile richiede DerefMut", () =>
  run(
    extend(
      basic,
      `
    let mut wrapped = MyBox::new(String::from("shared"));
    let view: &mut String = &mut wrapped;
    view.clear();
  `,
    ),
    { error: "E0596" },
  ));
test("MyBox: gli operatori aritmetici non sono inoltrati", () =>
  run(
    extend(
      basic,
      `
    let wrapped = MyBox::new(1_i32);
    let _sum = wrapped + 2;
  `,
    ),
    { error: "E0369" },
  ));
test("MyBox: PartialEq non e ereditato dal contenuto", () =>
  run(
    extend(
      basic,
      `
    let left = MyBox::new(1_i32);
    let right = MyBox::new(1_i32);
    assert!(left == right);
  `,
    ),
    { error: "E0369" },
  ));
test("coercizioni: array annotato, campo e ritorno espongono viste dello stesso testo", () =>
  run(
    extend(
      coercions,
      `
    struct View<'a> { text: &'a str }
    let source = Box::new(String::from("rust"));
    let item = View { text: &source };
    assert_eq!(item.text.as_ptr(), source.as_ptr());
    assert_eq!(view(&source).as_ptr(), source.as_ptr());
    let parts: [&str; 2] = [&source, &source];
    assert_eq!(parts, ["rust", "rust"]);
  `,
    ),
  ));
test("coercizioni: il let non annotato resta riferimento al Box", () =>
  run(
    extend(
      coercions,
      `
    fn require_box(_: &Box<String>) {}
    let boxed = Box::new(String::from("rust"));
    let inferred = &boxed;
    require_box(inferred);
    assert_eq!(text_len(inferred), 4);
  `,
    ),
  ));
test("coercizioni: il prestito non diventa static", () =>
  run(
    extend(
      coercions,
      `
    let boxed = Box::new(String::from("rust"));
    let _view: &'static str = &boxed;
  `,
    ),
    { error: "E0597" },
  ));
test("coercizioni: vuoto e byte UTF-8", () =>
  run(
    extend(
      coercions,
      String.raw`
    for (text, expected) in [("",0),("\u{03bb}",2),("\u{1f600}",4)] {
        let value = Box::new(String::from(text));
        assert_eq!(text_len(&value), expected);
    }
  `,
    ),
  ));
test("Buffer: vuoto e mutazioni della slice", () =>
  run(
    extend(
      buffer,
      `
    let mut empty = Buffer(Vec::new());
    reset(&mut empty);
    assert!(empty.is_empty());
    let mut values = Buffer(vec![3,1,2]);
    values.sort_unstable();
    assert_eq!(&*values, &[1,2,3]);
    values.fill(9);
    assert_eq!(&*values, &[9,9,9]);
  `,
    ),
  ));
test("Buffer: nessuna crescita tramite target slice", () =>
  run(extend(buffer, `let mut value = Buffer(vec![1]); value.push(2);`), {
    error: "E0599",
  }));
test("Buffer: mutazione richiede un binding mutabile", () =>
  run(replaceOnce(from(buffer), "let mut buffer =", "let buffer ="), {
    error: "E0596",
  }));
test("Buffer: shared wrapper non si converte in target mutabile", () =>
  run(
    extend(
      buffer,
      `
    let value = Buffer(vec![1]);
    let _view: &mut [u8] = &value;
  `,
    ),
    { error: "E0308" },
  ));
test("Buffer: prestito condiviso ancora usato impedisce mutazione", () =>
  run(
    extend(
      buffer,
      `
    let mut value = Buffer(vec![1]);
    let shared: &[u8] = &value;
    reset(&mut value);
    assert_eq!(shared, &[1]);
  `,
    ),
    { error: "E0502" },
  ));
test("Buffer: ultimo uso concluso permette un nuovo reborrow", () =>
  run(
    extend(
      buffer,
      `
    let mut value = Buffer(vec![1]);
    let shared: &[u8] = &value;
    assert_eq!(shared, &[1]);
    reset(&mut value);
    let exclusive: &mut [u8] = &mut value;
    exclusive[0] = 7;
    assert_eq!(&*value, &[7]);
  `,
    ),
  ));
test("DerefMut: il supertrait Deref e necessario", () => {
  const impl = `impl Deref for Buffer {
    type Target = [u8];

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}`;
  run(replaceOnce(from(buffer), impl, ""), { error: "E0277" });
});
test("Deref: non puo restituire una String temporanea", () => {
  let code = replaceOnce(
    from(bound),
    "self.0.as_str()",
    'String::from("temporary").as_str()',
  );
  code = replaceOnce(code, "render(&text)", "render(&*text)");
  run(code, { error: "E0515" });
});
test("NonEmptyString: vuoto distinto da whitespace, NUL e Unicode", () =>
  run(
    extend(
      validated,
      String.raw`
    assert!(NonEmptyString::new(String::new()).is_none());
    for value in [" ", "\n", "\0", "\u{03bb}", "\u{1f600}"] {
        let valid = NonEmptyString::new(String::from(value)).unwrap();
        assert_eq!(&*valid, value);
        assert_eq!(text_len(&valid), value.len());
    }
  `,
    ),
  ));
test("NonEmptyString: errore di sostituzione preserva contenuto e buffer", () =>
  run(
    extend(
      validated,
      `
    let mut value = NonEmptyString::new(String::from("keep")).unwrap();
    let address = value.as_ptr();
    for _ in 0..3 {
        assert_eq!(value.try_replace(String::new()), Err(String::new()));
        assert_eq!(&*value, "keep");
        assert_eq!(value.as_ptr(), address);
    }
  `,
    ),
  ));
test("NonEmptyString: sostituzioni valide ripetute e trasferimento del buffer", () =>
  run(
    extend(
      validated,
      String.raw`
    let mut value = NonEmptyString::new(String::from("start")).unwrap();
    for next in ["a", "\u{03bb}", "  "] {
        assert_eq!(value.try_replace(String::from(next)), Ok(()));
        assert_eq!(&*value, next);
    }
    let address = value.as_ptr();
    let inner = value.into_inner();
    assert_eq!(inner.as_ptr(), address);
    assert_eq!(inner, "  ");
  `,
    ),
  ));
test("NonEmptyString: costruttore tupla privato all'esterno del modulo", () =>
  run(extend(validated, `let _invalid = NonEmptyString(String::new());`), {
    error: "E0423",
  }));
test("NonEmptyString: il campo privato non e modificabile direttamente", () =>
  run(
    extend(
      validated,
      `
    let mut value = NonEmptyString::new(String::from("data")).unwrap();
    value.0.clear();
  `,
    ),
    { error: "E0616" },
  ));
test("NonEmptyString: clear non fa parte del target str", () =>
  run(
    extend(
      validated,
      `
    let mut value = NonEmptyString::new(String::from("data")).unwrap();
    value.clear();
  `,
    ),
    { error: "E0599" },
  ));
test("NonEmptyString: la vista mutabile non e esposta dalla API scelta", () =>
  run(
    extend(
      validated,
      `
    let mut value = NonEmptyString::new(String::from("data")).unwrap();
    value.make_ascii_uppercase();
  `,
    ),
    { error: "E0596" },
  ));
test("NonEmptyString: into_inner consuma il wrapper", () =>
  run(
    extend(
      validated,
      `
    let value = NonEmptyString::new(String::from("data")).unwrap();
    let _inner = value.into_inner();
    assert_eq!(&*value, "data");
  `,
    ),
    { error: "E0382" },
  ));
test("NonEmptyString: copie esplicite non cambiano il dato originale", () =>
  run(
    extend(
      validated,
      `
    let value = NonEmptyString::new(String::from("data")).unwrap();
    let mut copy: String = value.to_owned();
    copy.clear();
    assert_eq!(&*value, "data");
  `,
    ),
  ));
test("NonEmptyString: mut str puo conservare la sola invariante di non-vuoto", () => {
  let code = replaceOnce(
    from(validated),
    "\n}\n\nuse non_empty::NonEmptyString;",
    `
    impl std::ops::DerefMut for NonEmptyString {
        fn deref_mut(&mut self) -> &mut str { self.0.as_mut_str() }
    }
}

use non_empty::NonEmptyString;`,
  );
  code = replaceOnce(
    code,
    "fn main() {",
    `fn main() {
    let mut value = NonEmptyString::new(String::from("rust")).unwrap();
    value.make_ascii_uppercase();
    assert_eq!(&*value, "RUST");
    assert_eq!(value.len(), 4);`,
  );
  run(code);
});
test("AsRef: rimuovere l'impl lascia Deref ma non soddisfa il bound", () => {
  const impl = `impl AsRef<str> for Label {
    fn as_ref(&self) -> &str {
        self.0.as_str()
    }
}`;
  run(replaceOnce(from(explicit), impl, ""), { error: "E0277" });
});
test("AsRef: una chiamata di metodo via autoderef non prova il bound sul wrapper", () => {
  const impl = `impl AsRef<str> for Label {
    fn as_ref(&self) -> &str {
        self.0.as_str()
    }
}`;
  let code = replaceOnce(from(explicit), impl, "");
  code = replaceOnce(
    code,
    "assert_eq!(byte_len(&label), 4);",
    `
    let borrowed: &str = label.as_ref();
    assert_eq!(byte_len(borrowed), 4);
  `,
  );
  run(code);
});
test("AsRef: passare il wrapper per valore lo consuma", () =>
  run(
    extend(
      explicit,
      `
    let label = Label(String::from("rust"));
    assert_eq!(byte_len(label), 4);
    assert_eq!(label.len(), 4);
  `,
    ),
    { error: "E0382" },
  ));
test("AsRef: contratto sufficiente anche senza Deref", () => {
  const impl = `impl Deref for Label {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_str()
    }
}`;
  let code = replaceOnce(from(explicit), impl, "");
  code = replaceOnce(
    code,
    "assert_eq!(label.len(), 4);",
    "assert_eq!(label.as_ref().len(), 4);",
  );
  run(code);
});
test("metodi: rimuovere il metodo wrapper espone quello del target", () => {
  const impl = `impl Wrapper {
    fn name(&self) -> &str {
        "wrapper"
    }
}`;
  let code = replaceOnce(from(methods), impl, "");
  code = replaceOnce(
    code,
    'assert_eq!(wrapped.name(), "wrapper");',
    'assert_eq!(wrapped.name(), "target");',
  );
  run(code);
});
test("metodi: ordine dei receiver puo preferire il trait shared all'inherent mutabile", () =>
  run(
    extend(
      methods,
      `
    trait Shared { fn choose(&self) -> &'static str; }
    impl Shared for Wrapper {
        fn choose(&self) -> &'static str { "trait" }
    }
    impl Wrapper {
        fn choose(&mut self) -> &'static str { "inherent" }
    }
    let mut value = Wrapper(Target);
    assert_eq!(value.choose(), "trait");
    assert_eq!(Wrapper::choose(&mut value), "inherent");
  `,
    ),
  ));
test("metodi: clone del target disponibile quando il wrapper non e Clone", () =>
  run(
    extend(
      basic,
      `
    let value = MyBox::new(String::from("data"));
    let copied: String = value.clone();
    assert_eq!(copied, "data");
    assert_eq!(value.len(), 4);
  `,
    ),
  ));
test("metodi: derive Clone rende il clone del wrapper il candidato scelto", () =>
  run(
    replaceOnce(
      extend(
        basic,
        `
    let value = MyBox::new(String::from("data"));
    let copied: MyBox<String> = value.clone();
    assert_eq!(copied.len(), 4);
  `,
      ),
      "struct MyBox<T>(T);",
      "#[derive(Clone)]\nstruct MyBox<T>(T);",
    ),
  ));
test("metodi: un metodo consuming del target non autorizza il move dal wrapper", () =>
  run(
    extend(
      basic,
      `
    let value = MyBox::new(String::from("data"));
    let _bytes = value.into_bytes();
  `,
    ),
    { error: "E0507" },
  ));
test("Deref puo fare panic: il tipo del metodo non garantisce infallibilita", () =>
  run(
    extend(
      basic,
      `
    struct Failing;
    impl Deref for Failing {
        type Target = u32;
        fn deref(&self) -> &u32 { panic!("deref failed"); }
    }
    let value = Failing;
    assert_eq!(*value, 1);
  `,
    ),
    { panic: /deref failed/ },
  ));
test("wrapper errato: mem take aggira il costruttore nonostante il campo privato", () =>
  run(
    extend(
      broken,
      `
    let mut value = broken::BrokenNonEmptyString::new(String::from("data")).unwrap();
    let inner: &mut String = &mut value;
    let taken = std::mem::take(inner);
    assert_eq!(taken, "data");
    assert!(value.is_empty());
  `,
    ),
  ));
test("wrapper errato: assegnare una String vuota tramite dereferenziazione", () =>
  run(
    extend(
      broken,
      `
    let mut value = broken::BrokenNonEmptyString::new(String::from("data")).unwrap();
    *value = String::new();
    assert!(value.is_empty());
  `,
    ),
  ));
test("wrapper errato: il costruttore iniziale continua a rifiutare vuoto", () =>
  run(
    extend(
      broken,
      `assert!(broken::BrokenNonEmptyString::new(String::new()).is_none());`,
    ),
  ));
test("move: prendere in prestito il contenuto corregge il caso", () =>
  run(
    replaceOnce(
      from(move),
      "let owned: String = *wrapped;",
      "let owned: &String = &*wrapped;",
    ),
  ));
test("move: clone esplicito del target produce un risultato posseduto", () =>
  run(
    replaceOnce(
      from(move),
      "let owned: String = *wrapped;",
      "let owned: String = (*wrapped).clone();",
    ),
  ));
test("move: Box standard ha una regola speciale di estrazione", () =>
  run(
    replaceOnce(
      from(move),
      'let wrapped = MyBox(String::from("rust"));',
      'let wrapped = Box::new(String::from("rust"));',
    ),
  ));
test("bound: vista esplicita seleziona str che implementa Display", () =>
  run(replaceOnce(from(bound), "render(&text)", "render(&*text)")));
test("bound: tipo generico esplicito crea il tipo atteso per la coercizione", () =>
  run(replaceOnce(from(bound), "render(&text)", "render::<str>(&text)")));
test("bound: implementazione Display sul wrapper soddisfa il contratto", () =>
  run(
    replaceOnce(
      from(bound),
      "fn main() {",
      `
impl Display for Text {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.0.as_str())
    }
}
fn main() {`,
    ),
  ));
test("argomento: aggiungere il prestito corregge la chiamata", () =>
  run(replaceOnce(from(borrow), "text_len(text)", "text_len(&text)")));
test("receiver: la chiamata di metodo usa il proprio autoref", () =>
  run(replaceOnce(from(borrow), "text_len(text)", "text.len()")));
