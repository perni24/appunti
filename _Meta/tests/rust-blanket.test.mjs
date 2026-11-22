import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Blanket implementations"];
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
const prefix = "appunti-rust-blanket-";
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

const summary = "Un'implementazione condizionale, non un supertrait";
const extension = "StringExt anche per str e trait object";
const save = "Validazione e scrittura su una destinazione esplicita";
const conversion = "From fornisce Into, senza implementarlo due volte";
const wrapper = "Un wrapper con un comportamento esplicito";
const conflict = "Un'impl specifica non sovrascrive quella generica";
const orphan = "Un tipo locale nell'impl non basta sempre";
const extend = (heading, extra) => probe(0, heading, extra);
test("Save: il parametro T puo essere direttamente str unsized", () =>
  run(
    extend(
      save,
      `
    impl Validate for str {fn validate(&self)->Result<(),&'static str>{Ok(())}}
    impl Record for str {fn record(&self)->String{self.to_owned()}}
    let mut bytes=Vec::new();
    <str as Save>::save("unsized",&mut bytes).unwrap();
    assert_eq!(bytes,b"unsized");
`,
    ),
  ));
test("baseline reale e inventario: sette programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 7);
});
test("Blanket: metadati, titoli e fonti", () => {
  const note = notes[0];
  for (const [key, value] of Object.entries({
    title: "Blanket implementations",
    area: "Programmazione",
    topic: "Rust",
    type: "technical-note",
    publish: true,
    status: "non revisionato",
    date: "2026-05-21",
  }))
    assert.equal(note.data[key], value);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Blanket implementations",
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
    assert(headings.some((n) => n.depth === 2 && text(n) === heading));
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(note.body, /doc\.rust-lang\.org\/reference\/glossary/);
});
for (const heading of [
  summary,
  extension,
  save,
  conversion,
  wrapper,
  conflict,
  orphan,
]) {
  test("Programma della nota: " + heading, () => {
    const error =
      heading === conflict ? "E0119" : heading === orphan ? "E0210" : null;
    const output = run(source(0, heading), error ? { error } : {});
    if (!error)
      assert.equal(output, heading === summary ? "article: Rust\n" : "");
  });
}
test("Summary: output reale, Unicode e prestito non consumato", () => {
  const output = run(
    extend(
      summary,
      String.raw`
    let input=Article(String::from("\u{e8}"));
    input.log();
    assert_eq!(input.0,"\u{e8}");
    let view:&dyn Summary=&input;
    Loggable::log(view);
`,
    ),
  );
  assert.equal(output, "article: \u00e8\narticle: \u00e8\narticle: Rust\n");
});
test("Summary: senza ?Sized il trait object non e coperto direttamente", () =>
  run(
    replaceOnce(
      extend(
        summary,
        'let view:&dyn Summary=&Article(String::from("x")); Loggable::log(view);',
      ),
      "impl<T: Summary + ?Sized> Loggable for T",
      "impl<T: Summary> Loggable for T",
    ),
    { error: "E0277" },
  ));
test("Summary: bound inverso non implicito", () =>
  run(
    `
  trait Summary{fn summary(&self)->String;}
  trait Loggable{fn log(&self);}
  impl<T:Summary> Loggable for T{fn log(&self){let _=self.summary();}}
  struct Manual;
  impl Loggable for Manual{fn log(&self){}}
  fn require_summary<T:Summary>(_:T){}
  fn main(){require_summary(Manual);}
`,
    { error: "E0277" },
  ));
test("Summary: autoderef del metodo non equivale a impl sul riferimento", () =>
  run(
    extend(
      summary,
      `
    fn require_loggable<T:Loggable>(_:T){}
    let article=Article(String::from("x"));
    require_loggable(&article);
`,
    ),
    { error: "E0277" },
  ));
test("Default: senza impl nessun trait viene assegnato al tipo", () => {
  const code =
    "trait Api {fn value(&self)->u32 {7}} struct Item; fn require<T:Api>(value:T){assert_eq!(value.value(),7);} fn main(){require(Item);}";
  run(code, { error: "E0277" });
  run("impl Api for Item {}\n" + code);
  run(
    "impl Api for Item {fn value(&self)->u32 {9}}\n" +
      replaceOnce(code, "value.value(),7", "value.value(),9"),
  );
});
test("Supertrait: requisito soddisfatto non genera l'impl derivata", () =>
  run(
    "trait Base {} trait Derived:Base {} struct Value; impl Base for Value {} fn need<T:Derived>(_:T){} fn main(){need(Value);}",
    { error: "E0277" },
  ));
test("StringExt: ASCII, Unicode e invisibili distinti", () =>
  run(
    extend(
      extension,
      String.raw`
    for value in 0u8..=127 {
        let input=String::from_utf8(vec![value]).unwrap();
        let expected=matches!(value,9..=13 | 32);
        assert_eq!(input.is_blank(),expected,"{value}");
        assert_eq!(<str as StringExt>::is_blank(&input),expected);
    }
    for input in ["", "\u{a0}", "\u{2003}", "\u{2028}", "\t \n"] {assert!(input.is_blank());}
    for input in ["\u{200b}","\u{feff}","\0"," a ","\u{e8}"] {assert!(!input.is_blank());}
`,
    ),
  ));
test("StringExt: import richiesto per la sintassi metodo", () =>
  run(replaceOnce(source(0, extension), "use text::StringExt;", ""), {
    error: "E0599",
  }));
test("StringExt: senza ?Sized str non soddisfa il contratto qualificato", () =>
  run(
    replaceOnce(
      source(0, extension),
      "impl<T: AsRef<str> + ?Sized> StringExt for T",
      "impl<T: AsRef<str>> StringExt for T",
    ),
    { error: "E0277" },
  ));
test("StringExt: preserva proprietario e buffer", () =>
  run(
    extend(
      extension,
      `
    let value=String::from("  text  ");
    let pointer=value.as_ptr();
    assert!(!value.is_blank());
    assert_eq!(value,"  text  ");
    assert_eq!(value.as_ptr(),pointer);
`,
    ),
  ));
test("StringExt: Deref non genera AsRef per il wrapper", () =>
  run(
    extend(
      extension,
      `
    struct View(String);
    impl std::ops::Deref for View {
        type Target=str;
        fn deref(&self)->&str{&self.0}
    }
    let value=View(String::from(" "));
    assert!(value.is_blank());
    let _=<View as StringExt>::is_blank(&value);
`,
    ),
    { error: "E0277" },
  ));
test("Save: policy, record UTF-8 e ordine di append", () =>
  run(
    extend(
      save,
      String.raw`
    let mut buffer=Vec::new();
    for text in ["a","\u{e8}","  keep  ","\0"] {
        Note(String::from(text)).save(&mut buffer).unwrap();
    }
    assert_eq!(buffer,"a\n\u{e8}\n  keep  \n\0\n".as_bytes());
    for (text,reason) in [("","empty"),("\u{a0}","empty"),("\n","empty"),("a\nb","line break"),("a\rb","line break")] {
        let before=buffer.clone();
        assert!(matches!(Note(String::from(text)).save(&mut buffer),Err(SaveError::Invalid(found)) if found==reason));
        assert_eq!(buffer,before);
    }
`,
    ),
  ));
test("Save: un invalido non costruisce il record e non chiama Write", () =>
  run(
    extend(
      save,
      `
    struct Invalid;
    impl Validate for Invalid {fn validate(&self)->Result<(),&'static str>{Err("invalid")}}
    impl Record for Invalid {fn record(&self)->String{panic!("record must not run")}}
    struct Never;
    impl Write for Never{
        fn write(&mut self,_:&[u8])->io::Result<usize>{panic!("write must not run")}
        fn flush(&mut self)->io::Result<()>{panic!("flush must not run")}
    }
    assert!(matches!(Invalid.save(&mut Never),Err(SaveError::Invalid("invalid"))));
`,
    ),
  ));
test("Save: write_all completa scritture brevi senza eseguire flush", () =>
  run(
    extend(
      save,
      `
    struct Short{bytes:Vec<u8>,calls:usize}
    impl Write for Short{
        fn write(&mut self,buf:&[u8])->io::Result<usize>{
            self.calls+=1; let count=buf.len().min(2);
            self.bytes.extend_from_slice(&buf[..count]); Ok(count)
        }
        fn flush(&mut self)->io::Result<()>{panic!("no automatic flush")}
    }
    let mut writer=Short{bytes:Vec::new(),calls:0};
    Note(String::from("abcde")).save(&mut writer).unwrap();
    assert_eq!(writer.bytes,b"abcde\n");
    assert_eq!(writer.calls,3);
`,
    ),
  ));
test("Save: errore conserva bytes parziali e causa originale", () =>
  run(
    extend(
      save,
      `
    struct Partial{bytes:Vec<u8>,calls:usize}
    impl Write for Partial{
        fn write(&mut self,buf:&[u8])->io::Result<usize>{
            self.calls+=1;
            if self.calls==1 {self.bytes.extend_from_slice(&buf[..2]);Ok(2)}
            else {Err(io::Error::new(io::ErrorKind::BrokenPipe,"simulated"))}
        }
        fn flush(&mut self)->io::Result<()>{panic!("no flush")}
    }
    let mut writer=Partial{bytes:Vec::new(),calls:0};
    let result=Note(String::from("abcdef")).save(&mut writer);
    let Err(SaveError::Io(error))=result else {panic!("expected I/O error")};
    assert_eq!(error.kind(),io::ErrorKind::BrokenPipe);
    assert_eq!(error.to_string(),"simulated");
    assert_eq!(writer.bytes,b"ab");
    assert_eq!(writer.calls,2);
`,
    ),
  ));
test("Save: write zero viene propagato come WriteZero", () =>
  run(
    extend(
      save,
      `
    struct Zero;
    impl Write for Zero{
        fn write(&mut self,_:&[u8])->io::Result<usize>{Ok(0)}
        fn flush(&mut self)->io::Result<()>{Ok(())}
    }
    assert!(matches!(Note(String::from("abc")).save(&mut Zero),
        Err(SaveError::Io(error)) if error.kind()==io::ErrorKind::WriteZero));
`,
    ),
  ));
test("Save: write_all riprova Interrupted senza duplicare il prefisso", () =>
  run(
    extend(
      save,
      `
    struct Interrupted{calls:usize,bytes:Vec<u8>}
    impl Write for Interrupted{
        fn write(&mut self,buf:&[u8])->io::Result<usize>{
            self.calls+=1;
            if self.calls==1 {Err(io::ErrorKind::Interrupted.into())}
            else {self.bytes.extend_from_slice(buf);Ok(buf.len())}
        }
        fn flush(&mut self)->io::Result<()>{Ok(())}
    }
    let mut writer=Interrupted{calls:0,bytes:Vec::new()};
    Note(String::from("abc")).save(&mut writer).unwrap();
    assert_eq!(writer.bytes,b"abc\n");assert_eq!(writer.calls,2);
`,
    ),
  ));
test("Save: writer dinamico e dati non static ammessi", () =>
  run(
    extend(
      save,
      `
    struct Borrowed<'a>(&'a str);
    impl Validate for Borrowed<'_>{fn validate(&self)->Result<(),&'static str>{Ok(())}}
    impl Record for Borrowed<'_>{fn record(&self)->String{self.0.to_owned()}}
    let text=String::from("borrowed");
    let mut bytes=Vec::new();
    let writer:&mut dyn Write=&mut bytes;
    Borrowed(&text).save(writer).unwrap();
    assert_eq!(bytes,b"borrowed");
`,
    ),
  ));
test("Save: entrambi i bound sono necessari", () =>
  run(
    extend(
      save,
      `
    struct OnlyValidate;
    impl Validate for OnlyValidate{fn validate(&self)->Result<(),&'static str>{Ok(())}}
    let _=OnlyValidate.save(&mut Vec::new());
`,
    ),
    { error: "E0599" },
  ));
test("Save: metodo generico non permette dyn Save", () =>
  run(
    extend(
      save,
      `
    let note=Note(String::from("x"));
    let _object:&dyn Save=&note;
`,
    ),
    { error: "E0038" },
  ));
test("From: trasferisce payload non Clone, buffer e ordine", () =>
  run(
    extend(
      conversion,
      `
    struct Payload(u32);
    let values=vec![Payload(1),Payload(2)];
    let pointer=values.as_ptr();
    let result:Vec<Payload>=Batch(values).into();
    assert_eq!(result.as_ptr(),pointer);
    assert_eq!(result.iter().map(|v|v.0).collect::<Vec<_>>(),[1,2]);
    let empty:Vec<Payload>=Batch(Vec::new()).into();
    assert!(empty.is_empty());
`,
    ),
  ));
test("From: l'input non Copy e consumato", () =>
  run(
    extend(
      conversion,
      `
    let batch=Batch(vec![String::from("x")]);
    let _:Vec<String>=batch.into();
    assert_eq!(batch.0.len(),1);
`,
    ),
    { error: "E0382" },
  ));
test("From: Into manuale e blanket standard entrano in conflitto", () =>
  run(
    source(0, conversion) +
      "\nimpl<T> Into<Vec<T>> for Batch<T>{fn into(self)->Vec<T>{self.0}}",
    { error: "E0119" },
  ));
test("Into manuale non genera automaticamente From", () => {
  const code =
    "struct Source; struct Target; impl Into<Target> for Source{fn into(self)->Target{Target}} fn main(){let _:Target=Source.into();}";
  run(code);
  run(replaceOnce(code, "Source.into()", "Target::from(Source)"), {
    error: "E0308",
  });
});
test("Newtype: aggiungere Display ripristina il conflitto", () =>
  run(
    source(0, wrapper) +
      `
    impl Display for VerboseNumber {
        fn fmt(&self,f:&mut std::fmt::Formatter<'_>)->std::fmt::Result{write!(f,"{}",self.0)}
    }
`,
    { error: "E0119" },
  ));
test("Newtype: blanket incondizionata copre anche il wrapper", () =>
  run(
    replaceOnce(
      source(0, wrapper),
      "impl<T: Display> Label for T {\n    fn label(&self) -> String { self.to_string() }\n}",
      'impl<T> Label for T {fn label(&self)->String {String::from("generic")}}',
    ),
    { error: "E0119" },
  ));
test("Overlap: due bound differenti possono intersecarsi", () =>
  run(
    `
    trait A{} trait B{} trait Out{}
    impl<T:A> Out for T{}
    impl<T:B> Out for T{}
    fn main(){}
`,
    { error: "E0119" },
  ));
test("Overlap: modulo diverso non isola l'impl", () =>
  run(
    replaceOnce(
      source(0, conflict),
      'impl Label for u32 {\n    fn label(&self) -> String { format!("number={self}") }\n}',
      'mod other {impl super::Label for u32 {fn label(&self)->String {String::from("specific")}}}',
    ),
    { error: "E0119" },
  ));
test("Overlap: assenza attuale di un impl upstream non prova disgiunzione", () =>
  run(
    `
    use std::fmt::Display;
    trait Out{}
    impl<T:Display> Out for T{}
    impl Out for Vec<u8>{}
    fn main(){}
`,
    { error: "E0119", detail: /upstream crates may add/ },
  ));
test("Orphan: into_inner evita l'impl generica vietata", () =>
  run(`
    struct Wrapper<T>(T);
    impl<T> Wrapper<T>{fn into_inner(self)->T{self.0}}
    fn main(){assert_eq!(Wrapper(String::from("owned")).into_inner(),"owned");}
`));
test("Orphan: Vec di tipo locale non e locale", () =>
  run(
    `
    struct Local;
    impl std::fmt::Display for Vec<Local>{
        fn fmt(&self,f:&mut std::fmt::Formatter<'_>)->std::fmt::Result{write!(f,"items")}
    }
    fn main(){}
`,
    { error: "E0117" },
  ));
test("Orphan: alias di tipo esterno non diventa locale", () =>
  run(
    `
    type LocalName=Vec<u8>;
    impl std::fmt::Display for LocalName{
        fn fmt(&self,f:&mut std::fmt::Formatter<'_>)->std::fmt::Result{write!(f,"items")}
    }
    fn main(){}
`,
    { error: "E0117" },
  ));
test("Orphan: Box del tipo locale segue la regola fondamentale", () =>
  run(`
    struct Local;
    impl std::fmt::Display for Box<Local>{
        fn fmt(&self,f:&mut std::fmt::Formatter<'_>)->std::fmt::Result{write!(f,"local")}
    }
    fn main(){assert_eq!(Box::new(Local).to_string(),"local");}
`));
test("Parametro where non determinato: E0207", () =>
  run(
    "trait LocalTrait {} impl<T,U> LocalTrait for T where U:Default {} fn main(){}",
    { error: "E0207" },
  ));
test("Parametro determinato dal trait: implementazioni distinte sono valide", () =>
  run(`
    trait Make<U>{fn make(&self)->U;}
    impl<T,U:Default> Make<U> for T {fn make(&self)->U{U::default()}}
    fn main(){let value=();let a:u32=value.make();let b:String=value.make();assert_eq!(a,0);assert!(b.is_empty());}
`));
test("Specialization: default fn non e stable", () =>
  run(
    `
    trait Api{fn value(&self)->u32;}
    impl<T> Api for T {default fn value(&self)->u32 {0}}
    fn main(){}
`,
    { error: "E0658" },
  ));
test("Compatibilita: nuova blanket upstream rompe un consumer valido", () => {
  const dir = path.join(root, "cross-crate");
  fs.mkdirSync(dir);
  const before =
    "pub trait Summary{fn summary(&self)->String;} pub trait Loggable{fn log(&self)->String;}";
  const after =
    before +
    "impl<T:Summary> Loggable for T{fn log(&self)->String{self.summary()}}";
  const client = `
    use library::{Summary,Loggable};
    struct Article;
    impl Summary for Article{fn summary(&self)->String {String::from("summary")}}
    impl Loggable for Article{fn log(&self)->String {String::from("custom")}}
    fn main(){assert_eq!(Article.log(),"custom");}
  `;
  for (const [version, code] of [
    ["before", before],
    ["after", after],
  ]) {
    const input = path.join(dir, version + ".rs");
    const output = path.join(dir, "lib_" + version + ".rlib");
    fs.writeFileSync(input, code);
    const result = launch(
      rustc,
      [
        "--edition=2024",
        "--crate-type=rlib",
        "--crate-name=library",
        input,
        "-o",
        output,
      ],
      dir,
    );
    assert.equal(result.status, 0, result.stderr);
    run(client, {
      args: ["--extern", "library=" + output],
      ...(version === "after" ? { error: "E0119" } : {}),
    });
  }
});
