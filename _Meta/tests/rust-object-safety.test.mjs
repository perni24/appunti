import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Object safety"];
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
const prefix = "appunti-rust-object-safety-";
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

const invalid = "Perche restituire Self e diverso da restituire un tipo noto";
const parser = "Parser con costruttore e helper esclusi";
const associated = "Tipi associati fissati nel contratto";
const parameters = "Parametri del trait e lifetime dei metodi";
const command = "Command con helper di boxing e consumo esplicito";
const native = "Async nativo non significa dyn-compatible";
const future = "Future restituito come trait object";
const extend = (heading, extra) => probe(0, heading, extra);

test("Pin: cancellare Unpin prima del costruttore e diverso dalla coercizione dopo", () => {
  const code = `
    use std::pin::Pin;
    trait Api {fn value(&self)->u32;}
    struct Value;
    impl Api for Value {fn value(&self)->u32 {7}}
    fn main(){
        let value=Value;
        let object:&dyn Api=&value;
        let pinned=Pin::new(object);
        assert_eq!(pinned.value(),7);
    }
  `;
  run(code, { error: "E0277" });
  run(
    replaceOnce(
      code,
      "let object:&dyn Api=&value;",
      "let object:&(dyn Api + Unpin)=&value;",
    ),
  );
});

test("toolchain reale e inventario: sette programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 7);
});
test("Object safety: metadati, struttura e fonti", () => {
  const note = notes[0];
  assert.equal(note.data.title, "Object safety");
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  assert.equal(note.data.date, "2026-05-21");
  assert.equal(note.data.topic, "Rust");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Object safety",
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
  ])
    assert(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(note.body, /doc\.rust-lang\.org\/reference\/items\/traits/);
});
for (const heading of [
  invalid,
  parser,
  associated,
  parameters,
  command,
  native,
  future,
]) {
  test("Programma della nota: " + heading, () => {
    const output = run(
      source(0, heading),
      [invalid, native].includes(heading) ? { error: "E0038" } : {},
    );
    if (![invalid, native].includes(heading)) assert.equal(output, "");
  });
}
test("CloneLike: il metodo concreto resta valido senza conversione dyn", () =>
  run(
    replaceOnce(
      source(0, invalid),
      "let _object: &dyn CloneLike = &token;",
      "",
    ),
  ));
test("CloneLike: escludere solo il metodo permette il trait object", () =>
  run(
    replaceOnce(
      source(0, invalid),
      "fn clone_like(&self) -> Self;",
      "fn clone_like(&self) -> Self where Self: Sized;",
    ),
  ));
test("Parser: tutti i caratteri ASCII, vuoto, Unicode e nessun limite numerico", () =>
  run(
    extend(
      parser,
      String.raw`
    let parser = AsciiDigits::new();
    for value in 0u8..=127 {
        let input = String::from_utf8(vec![value]).unwrap();
        let expected = (b'0'..=b'9').contains(&value);
        assert_eq!(run(&parser,&input),expected);
        assert_eq!(parser.accepts(input),expected);
    }
    for input in ["", " 12", "12 ", "+12", "-12", "1.2", "1_2", "\u{0661}", "\u{ff11}", "1\n", "\0"] {
        assert!(!run(&parser,input),"{input:?}");
    }
    assert!(run(&parser,&"9".repeat(10000)));
`,
    ),
  ));
test("Parser: costruttore senza Sized rende incompatibile tutto il trait", () =>
  run(
    replaceOnce(
      source(0, parser),
      "fn new() -> Self\n    where\n        Self: Sized;",
      "fn new() -> Self;",
    ),
    { error: "E0038" },
  ));
test("Parser: helper generico senza Sized rende incompatibile tutto il trait", () =>
  run(
    replaceOnce(
      source(0, parser),
      "fn accepts<T: AsRef<str>>(&self, input: T) -> bool\n    where\n        Self: Sized,",
      "fn accepts<T: AsRef<str>>(&self, input: T) -> bool",
    ),
    { error: "E0038" },
  ));
test("Parser: il Box non rende dispatchabile l'helper escluso", () =>
  run(
    extend(
      parser,
      `
    let boxed: Box<dyn Parser> = Box::new(AsciiDigits);
    let _ = boxed.accepts("12");
`,
    ),
    { message: /accepts.*cannot be invoked on a trait object/ },
  ));
test("Parser: il costruttore escluso non costruisce dyn Parser", () =>
  run(extend(parser, "let _ = <dyn Parser>::new();"), { error: "E0277" }));
test("Parser: Sized sull'intero trait impedisce dyn anche con receiver validi", () =>
  run(
    replaceOnce(source(0, parser), "trait Parser {", "trait Parser: Sized {"),
    { error: "E0038" },
  ));
test("Source: Item omesso non e un tipo arbitrario a ogni chiamata", () =>
  run(
    replaceOnce(
      source(0, associated),
      "dyn Source<Item = String>",
      "dyn Source",
    ),
    { error: "E0191" },
  ));
test("Source: Item sbagliato viene rifiutato", () =>
  run(
    replaceOnce(
      source(0, associated),
      "dyn Source<Item = String>",
      "dyn Source<Item = u32>",
    ),
    { error: "E0271" },
  ));
test("Source: next richiede un riferimento mutabile", () =>
  run(
    replaceOnce(
      source(0, associated),
      "let source: &mut dyn Source<Item = String> = &mut words;",
      "let source: &dyn Source<Item = String> = &words;",
    ),
    { error: "E0596" },
  ));
test("Source: ordine, duplicati, vuoto e fine ripetuta", () =>
  run(
    extend(
      associated,
      String.raw`
    for input in [vec![], vec![""], vec!["a","a","\u{e8}"]] {
        let expected: Vec<String> = input.into_iter().map(String::from).collect();
        let mut words = Words(expected.clone().into_iter());
        let object: &mut dyn Source<Item=String> = &mut words;
        for item in expected { assert_eq!(object.next(),Some(item)); }
        assert_eq!(object.next(),None);
        assert_eq!(object.next(),None);
    }
`,
    ),
  ));
test("Parametri: tipo fissato nel trait non accetta argomenti di altro tipo", () =>
  run(
    extend(
      parameters,
      'let object: &dyn Convert<u32> = &TextTools; let _ = object.convert(String::from("42"));',
    ),
    { error: "E0308" },
  ));
test("Lifetime: output sullo stesso input anche con whitespace Unicode", () =>
  run(
    extend(
      parameters,
      String.raw`
    let tools=TextTools;
    let object: &dyn Word=&tools;
    for (input,expected) in [
        ("",""),(" \n\t",""),("  uno due","uno"),
        ("\u{2003}caff\u{e8} altro","caff\u{e8}"),("\"due parole\"","\"due")
    ] {
        assert_eq!(object.first(input),expected);
    }
    let input=String::from("alpha beta");
    let result=object.first(&input);
    assert_eq!(result.as_ptr(),input.as_ptr());
`,
    ),
  ));
test("Lifetime: output puo durare piu del servizio", () =>
  run(
    extend(
      parameters,
      `
    let input=String::from("prima seconda");
    let result;
    {
        let tools=TextTools;
        let object: &dyn Word=&tools;
        result=object.first(&input);
    }
    assert_eq!(result,"prima");
`,
    ),
  ));
test("Lifetime: output non puo durare piu dell'input", () =>
  run(
    extend(
      parameters,
      `
    let tools=TextTools;
    let object: &dyn Word=&tools;
    let result;
    {
        let input=String::from("prima seconda");
        result=object.first(&input);
    }
    assert_eq!(result,"prima");
`,
    ),
    { error: "E0597" },
  ));
test("Command: messaggio preservato e consume equivalente a execute", () =>
  run(
    extend(
      command,
      String.raw`
    for text in ["","ciao","\u{e8}","a\nb","\0"] {
        let object=Message(String::from(text)).boxed();
        assert_eq!(object.name(),"message");
        let expected=format!("message: {text}");
        assert_eq!(object.execute(),expected);
        assert_eq!(object.finish(),expected);
    }
`,
    ),
  ));
test("Command: finish consuma il box", () =>
  run(
    extend(
      command,
      `
    let object=Message(String::from("one")).boxed();
    object.finish();
    object.execute();
`,
    ),
    { error: "E0382" },
  ));
test("Command: boxed consuma il valore concreto", () =>
  run(
    extend(
      command,
      `
    let value=Message(String::from("one"));
    let _object=value.boxed();
    value.execute();
`,
    ),
    { error: "E0382" },
  ));
test("Command: Drop avviene dopo finish una sola volta", () =>
  run(
    extend(
      command,
      `
    use std::cell::Cell;
    use std::rc::Rc;
    struct Tracked(Rc<Cell<usize>>);
    impl Command for Tracked {
        fn name(&self)->&str { "tracked" }
        fn execute(&self)->String { String::from("ok") }
    }
    impl Drop for Tracked {
        fn drop(&mut self) { self.0.set(self.0.get()+1); }
    }
    let count=Rc::new(Cell::new(0));
    let object=Tracked(count.clone()).boxed();
    assert_eq!(count.get(),0);
    assert_eq!(object.finish(),"ok");
    assert_eq!(count.get(),1);
`,
    ),
  ));
test("Command: helper static rifiuta un prestito locale", () =>
  run(
    extend(
      command,
      `
    struct Borrowed<'a>(&'a str);
    impl Command for Borrowed<'_> {
        fn name(&self)->&str { "borrowed" }
        fn execute(&self)->String { self.0.to_owned() }
    }
    let text=String::from("local");
    let object=Borrowed(text.as_str()).boxed();
    assert_eq!(object.execute(),"local");
`,
    ),
    { error: "E0597" },
  ));
test("Async nativo: resta usabile su tipo concreto e future immediato", () =>
  run(
    replaceOnce(
      source(0, native),
      "let _object: &dyn NativeLookup = &service;",
      `
    use std::task::{Context,Poll,Waker};
    use std::future::Future;
    let mut context=Context::from_waker(Waker::noop());
    for (key,expected) in [("name",true),("",false)] {
        let mut future=Box::pin(service.find(key));
        assert_eq!(future.as_mut().poll(&mut context),Poll::Ready(expected));
    }
`,
    ),
  ));
test("Future erased: assenza, valore vuoto, Unicode e chiave esatta", () =>
  run(
    extend(
      future,
      String.raw`
    let mut context=Context::from_waker(Waker::noop());
    for text in ["","Ada","\u{e8}","\0"] {
        let memory=MemoryName(String::from(text));
        let service: &dyn Lookup=&memory;
        for key in ["name","","Name","name ","other"] {
            let mut future=service.find(key);
            let expected=if key=="name" {Some(text)} else {None};
            assert_eq!(future.as_mut().poll(&mut context),Poll::Ready(expected));
        }
    }
`,
    ),
  ));
test("Future erased: non promette Send", () =>
  run(
    extend(
      future,
      `
    fn require_send<T: Send>(_: T) {}
    let memory=MemoryName(String::from("Ada"));
    require_send(memory.find("name"));
`,
    ),
    { error: "E0277" },
  ));
test("Future erased: il servizio deve vivere fino all'ultimo uso", () =>
  run(
    extend(
      future,
      `
    let mut future;
    {
        let memory=MemoryName(String::from("local"));
        future=memory.find("name");
    }
    let mut cx=Context::from_waker(Waker::noop());
    let _=future.as_mut().poll(&mut cx);
`,
    ),
    { error: "E0597" },
  ));
test("Future erased: anche la chiave e prestata", () =>
  run(
    extend(
      future,
      `
    let memory=MemoryName(String::from("local"));
    let mut future;
    {
        let key=String::from("name");
        future=memory.find(&key);
    }
    let mut cx=Context::from_waker(Waker::noop());
    let _=future.as_mut().poll(&mut cx);
`,
    ),
    { error: "E0597" },
  ));
test("Future erased: risultato borrowed conserva il buffer del servizio", () =>
  run(
    extend(
      future,
      `
    let memory=MemoryName(String::from("local"));
    let mut future=memory.find("name");
    let mut cx=Context::from_waker(Waker::noop());
    let Poll::Ready(Some(result))=future.as_mut().poll(&mut cx) else {panic!("not ready")};
    assert_eq!(result.as_ptr(),memory.0.as_ptr());
`,
    ),
  ));

for (const [name, declaration] of [
  [
    "Self in altro argomento",
    "trait Api { fn same(&self, other:&Self)->bool; }",
  ],
  ["Self nel ritorno boxed", "trait Api { fn copy(&self)->Box<Self>; }"],
  ["parametro di tipo", "trait Api { fn apply<T>(&self, value:T); }"],
  ["parametro const", "trait Api { fn apply<const N:usize>(&self); }"],
  [
    "impl Trait in input",
    "trait Api { fn apply(&self, value:impl std::fmt::Display); }",
  ],
  ["funzione associata", "trait Api { fn version()->u32; }"],
  ["costante associata", "trait Api { const VERSION:u32=1; }"],
  ["supertrait Clone", "trait Api: Clone { fn value(&self)->u32; }"],
  [
    "Self nel parametro del supertrait",
    "trait Base<T:?Sized>{} trait Api: Base<Self>{}",
  ],
  ["GAT disponibile", "trait Api { type Item<'a> where Self:'a; }"],
  [
    "ritorno impl Trait",
    "trait Api { fn values(&self)->impl Iterator<Item=u8>; }",
  ],
  ["supertrait incompatibile", "trait Base {const N:u32;} trait Api:Base {}"],
  [
    "receiver annidato non supportato",
    "trait Api {fn nested(self:std::rc::Rc<Box<Self>>);}",
  ],
])
  test("Regola dyn: " + name, () =>
    run(declaration + "\nfn accept(_: &dyn Api) {}\nfn main() {}", {
      error: "E0038",
    }),
  );

test("Self per valore: costruire dyn e valido, invocare consume no", () => {
  const code =
    "trait Api {fn consume(self);} struct Value; impl Api for Value {fn consume(self){}}\nfn main(){let object:Box<dyn Api>=Box::new(Value); drop(object);}";
  run(code);
  run(replaceOnce(code, "drop(object);", "object.consume();"), {
    error: "E0161",
  });
});
test("GAT escluso con Sized: il trait puo esporre altri metodi via dyn", () =>
  run(`
    trait Api {
        type Item<'a> where Self:'a, Self:Sized;
        fn name(&self)->&str;
    }
    struct Value(String);
    impl Api for Value {
        type Item<'a>=&'a str;
        fn name(&self)->&str { &self.0 }
    }
    fn main(){
        let value=Value(String::from("ok"));
        let object:&dyn Api=&value;
        assert_eq!(object.name(),"ok");
    }
`));
test("Metodo async escluso: trait object possibile ma metodo resta concreto", () =>
  run(`
    trait Api {
        fn name(&self)->&str;
        async fn ready(&self)->u32 where Self:Sized {7}
    }
    struct Value;
    impl Api for Value {fn name(&self)->&str {"value"}}
    fn main(){
        let object:&dyn Api=&Value;
        assert_eq!(object.name(),"value");
    }
`));
test("Costante sostituita da metodo: valore accessibile dinamicamente", () =>
  run(`
    trait Api {fn version(&self)->u32;}
    struct V1;
    impl Api for V1 {fn version(&self)->u32 {1}}
    fn main(){let object:&dyn Api=&V1; assert_eq!(object.version(),1);}
`));
test("Receiver supportati: Rc, Arc e Pin di riferimento", () =>
  run(`
    use std::{rc::Rc,sync::Arc,pin::Pin};
    trait Api {
        fn by_rc(self:Rc<Self>)->u32;
        fn by_arc(self:Arc<Self>)->u32;
        fn by_pin(self:Pin<&Self>)->u32;
    }
    struct Value(u32);
    impl Api for Value {
        fn by_rc(self:Rc<Self>)->u32 {self.0}
        fn by_arc(self:Arc<Self>)->u32 {self.0}
        fn by_pin(self:Pin<&Self>)->u32 {self.0}
    }
    fn main(){
        let rc:Rc<dyn Api>=Rc::new(Value(1));
        let arc:Arc<dyn Api>=Arc::new(Value(2));
        let value=Value(3);
        let concrete=Pin::new(&value);
        let pin:Pin<&dyn Api>=concrete;
        assert_eq!(rc.by_rc(),1);
        assert_eq!(arc.by_arc(),2);
        assert_eq!(pin.by_pin(),3);
    }
`));
