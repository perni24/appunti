import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Lifetimes nei trait"];
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
const prefix = "appunti-rust-trait-lifetimes-";
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

const view = "View e Named: lifetime del metodo e elision";
const parser = "Parser: lifetime sul trait e associated type ordinario";
const field = "FieldReader: risultato legato alla riga, non al lettore";
const gat = "Source: GAT legato al prestito della chiamata";
const hrtb = "HRTB: usare il trait con una sorgente creata internamente";
const object = "Trait object: prestito del contenitore e bound dell'oggetto";
const wrongElision = "Elidere il risultato quando deriva dall'altro input";
const staticOnly = "Restringere l'implementazione a input static";
const extend = (heading, extra) => probe(0, heading, extra);
const from = (heading) => source(0, heading);

test("baseline reale e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("frontmatter originale, struttura e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/Lifetimes nei trait.md";
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
  assert.match(notes[0].body, /doc\.rust-lang\.org\/reference\/trait-bounds/);
  assert.match(notes[0].body, /Non e un parser CSV/);
});
for (const heading of [
  view,
  parser,
  field,
  gat,
  hrtb,
  object,
  wrongElision,
  staticOnly,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === wrongElision
        ? { message: /lifetime may not live long enough/ }
        : heading === staticOnly
          ? { error: "E0308" }
          : {};
    const output = run(from(heading), options);
    if (!options.error && !options.message) assert.equal(output, "");
  });
}
test("View e Named: Unicode, vuoto e identita della vista", () =>
  run(
    extend(
      view,
      String.raw`
    for text in ["", "\u{00E8}", "Rust"] {
        let owner=text.to_owned();
        let item=Borrowed{text:&owner};
        assert!(std::ptr::eq(item.view(),owner.as_str()));
        assert!(std::ptr::eq(item.name(),owner.as_str()));
    }
`,
    ),
  ));
test("View: output resta legato al receiver, non al campo", () =>
  run(
    extend(
      view,
      `
    let owner=String::from("lungo");let result;
    {let item=Borrowed{text:&owner};result=item.view();}
    println!("{result}");
`,
    ),
    { error: "E0597" },
  ));
test("Named: il proprietario non puo essere distrutto prima dell'uso del risultato", () =>
  run(
    extend(
      view,
      `
    let owner=String::from("nome");
    let item=Borrowed{text:&owner};
    let result=item.name();
    drop(owner);
    println!("{result}");
`,
    ),
    { error: "E0505" },
  ));
test("View: elision equivalente anche nell'impl e tramite dyn", () =>
  run(
    from(view).replaceAll(
      "fn view<'call>(&'call self) -> &'call str",
      "fn view(&self) -> &str",
    ),
  ));
test("Named: una implementazione con literal non rafforza il contratto generico", () =>
  run(
    from(view) +
      `
struct Literal;
impl Named for Literal {fn name(&self)->&str{"literal"}}
fn invalid<T:Named+?Sized>(value:&T)->&'static str{value.name()}
`,
    { message: /lifetime may not live long enough/ },
  ));
test("Parser: trim Unicode, vuoto e slice senza copia", () =>
  run(
    extend(
      parser,
      String.raw`
    for (input,expected) in [("", ""),(" \t\n",""),("\u{2003}\u{00E8}ra\u{00A0}","\u{00E8}ra"),("a b","a b")] {
        let owner=input.to_owned();
        let result=parse_with(&Trim,&owner);
        assert_eq!(result,expected);
        assert!(std::ptr::eq(result,owner.trim()));
    }
`,
    ),
  ));
const configured = `
struct Configured<'config>{prefix:&'config str}
impl<'input> Parser<'input> for Configured<'_> {
    type Output=&'input str;
    fn parse(&self,input:&'input str)->Self::Output {
        input.strip_prefix(self.prefix).unwrap_or(input)
    }
}
`;
test("Parser: parametro del trait non implica Self outlives input", () =>
  run(
    extend(
      parser,
      `
    let input=String::from("prefix:valore");let result;
    {let prefix=String::from("prefix:");
     let configured=Configured{prefix:&prefix};
     result=parse_with(&configured,&input);}
    assert_eq!(result,"valore");
`,
    ) + configured,
  ));
test("Parser: aggiungere Self outlives input restringe l'impl borrowed", () =>
  run(
    replaceOnce(
      from(parser) + configured,
      "trait Parser<'input> {",
      "trait Parser<'input>: 'input {",
    ),
    { error: "E0478" },
  ));
test("Parser: Output puo anche essere posseduto", () =>
  run(
    extend(
      parser,
      `
    let result;
    {let input=String::from("  copia  ");result=parse_with(&Owned,&input);}
    assert_eq!(result,"copia");
`,
    ) +
      `
struct Owned;
impl<'input> Parser<'input> for Owned {
    type Output=String;
    fn parse(&self,input:&'input str)->String{input.trim().to_owned()}
}
`,
  ));
test("Parser: parse_with accetta dyn con tipo Output specificato", () =>
  run(
    extend(
      parser,
      `
    let input=String::from("  locale  ");
    let erased:&dyn Parser<'_,Output=&str>=&Trim;
    assert_eq!(parse_with(erased,&input),"locale");
`,
    ),
  ));
test("Parser: rimuovere ?Sized esclude il trait object", () =>
  run(
    replaceOnce(
      extend(
        parser,
        `
    let input=String::from("  locale  ");
    let erased:&dyn Parser<'_,Output=&str>=&Trim;
    assert_eq!(parse_with(erased,&input),"locale");
`,
      ),
      "P: Parser<'input> + ?Sized,",
      "P: Parser<'input>,",
    ),
    { error: "E0277" },
  ));
test("Parser: Output static non ottenibile dal trim di input locale", () =>
  run(
    replaceOnce(
      from(parser),
      "type Output = &'input str;",
      "type Output = &'static str;",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("Parser: risultato non sopravvive alla sorgente", () =>
  run(
    extend(
      parser,
      `
    let result;
    {let input=String::from("  locale  ");result=parse_with(&Trim,&input);}
    println!("{result}");
`,
    ),
    { error: "E0597" },
  ));
test("FieldReader: vuoto, separatori, spazi, Unicode e colonne mancanti", () =>
  run(
    extend(
      field,
      String.raw`
    for (row,expected) in [("",""),(",",""),("a,","a"),(" a , b "," a "),("\u{00E8},x","\u{00E8}"),("solo","solo")] {
        assert_eq!(FirstField.field(row),Some(expected));
        assert_eq!(Column{index:0}.field(row),Some(expected));
    }
    assert_eq!(Column{index:1}.field("a,"),Some(""));
    assert_eq!(Column{index:2}.field("a,"),None);
    assert_eq!(Column{index:1}.field(""),None);
    assert_eq!(Column{index:usize::MAX}.field("a,b"),None);
`,
    ),
  ));
test("FieldReader: virgolette e newline non sono parsing CSV", () =>
  run(
    extend(
      field,
      String.raw`
    assert_eq!(FirstField.field("\"a,b\",c"),Some("\"a"));
    assert_eq!(Column{index:1}.field("\"a,b\",c"),Some("b\""));
    assert_eq!(FirstField.field("a\nb,c"),Some("a\nb"));
`,
    ),
  ));
test("FieldReader: riferimenti nello stesso buffer anche via generic e dyn", () =>
  run(
    extend(
      field,
      `
    fn read<'a,R:FieldReader+?Sized>(reader:&R,row:&'a str)->Option<&'a str>{reader.field(row)}
    let row=String::from("Ada,Rust");
    let col=Column{index:1};
    let erased:&dyn FieldReader=&col;
    assert!(std::ptr::eq(read(erased,&row).unwrap(),&row[4..]));
`,
    ),
  ));
test("FieldReader: mutazione della riga vietata prima dell'ultimo uso", () =>
  run(
    extend(
      field,
      `
    let mut row=String::from("a,b");
    let result=FirstField.field(&row);
    row.clear();
    println!("{result:?}");
`,
    ),
    { error: "E0502" },
  ));
test("FieldReader: la vista non sopravvive alla riga", () =>
  run(
    extend(
      field,
      `
    let result;
    {let row=String::from("locale");result=FirstField.field(&row);}
    println!("{result:?}");
`,
    ),
    { error: "E0597" },
  ));
test("FieldReader: contenuto di self non garantito per il lifetime di row", () =>
  run(
    from(field) +
      `
struct Cached(String);
impl FieldReader for Cached {
    fn field<'row>(&self,_row:&'row str)->Option<&'row str>{Some(&self.0)}
}
`,
    { message: /lifetime may not live long enough/ },
  ));
test("FieldReader: un literal static puo soddisfare la firma senza estenderla", () =>
  run(
    extend(
      field,
      `
    let row=String::from("locale");
    assert_eq!(Constant.field(&row),Some("costante"));
`,
    ) +
      `
struct Constant;
impl FieldReader for Constant {
    fn field<'row>(&self,_row:&'row str)->Option<&'row str>{Some("costante")}
}
`,
  ));
test("Source: vuoto, Unicode, ordine e fine stabile", () =>
  run(
    extend(
      gat,
      String.raw`
    let mut empty=Rows{items:vec![],index:0};
    assert_eq!(empty.next(),None);
    assert_eq!(empty.next(),None);
    let mut rows=Rows{items:vec!["".to_owned(),"\u{00E8}".to_owned()],index:0};
    assert_eq!(rows.next(),Some(""));
    assert_eq!(rows.next(),Some("\u{00E8}"));
    assert_eq!(rows.next(),None);
    let mut past=Rows{items:vec!["x".to_owned()],index:usize::MAX};
    assert_eq!(past.next(),None);
`,
    ),
  ));
test("Source: due risultati usati dopo il secondo prestito rifiutati", () =>
  run(
    extend(
      gat,
      `
    let mut rows=Rows{items:vec!["a".to_owned(),"b".to_owned()],index:0};
    let first=rows.next();
    let second=rows.next();
    println!("{first:?}{second:?}");
`,
    ),
    { error: "E0499" },
  ));
test("Source: distruzione del proprietario vietata mentre la vista serve", () =>
  run(
    extend(
      gat,
      `
    let mut rows=Rows{items:vec!["a".to_owned()],index:0};
    let first=rows.next();
    drop(rows);
    println!("{first:?}");
`,
    ),
    { error: "E0505" },
  ));
test("Source: Self outlives call e richiesto sulla dichiarazione del GAT", () =>
  run(
    replaceOnce(
      from(gat),
      "type Item<'call>\n    where\n        Self: 'call;",
      "type Item<'call>;",
    ),
    { message: /missing required bound on `Item`/ },
  ));
test("Source: il GAT non diventa dyn compatible scegliendo static", () =>
  run(
    extend(
      gat,
      `
    let rows=Rows{items:vec![],index:0};
    let _erased:&dyn Source<Item<'static>=&'static str>=&rows;
`,
    ),
    { error: "E0038" },
  ));
test("Source: metodo con output fisso evita il GAT quando basta str", () => {
  let code = replaceOnce(
    from(gat),
    "    type Item<'call>\n    where\n        Self: 'call;\n\n",
    "",
  );
  code = replaceOnce(
    code,
    "    type Item<'call> = &'call str where Self: 'call;\n\n",
    "",
  );
  code = code.replaceAll("Option<Self::Item<'call>>", "Option<&'call str>");
  assert.equal(run(code), "");
});
test("Source: Rows non implementa automaticamente Iterator", () =>
  run(
    extend(
      gat,
      `
    fn require_iterator<I:Iterator>(_:I){}
    require_iterator(Rows{items:vec![],index:0});
`,
    ),
    { error: "E0277" },
  ));
test("HRTB: input Unicode, vuoto e copia dopo distruzione del buffer", () =>
  run(
    extend(
      hrtb,
      String.raw`
    let saved=parse_owned(&Trim,"\u{2003}\u{00E8}ra\u{00A0}".to_owned());
    assert_eq!(saved,"\u{00E8}ra");
    assert_eq!(parse_owned(&Trim," \n\t".to_owned()),"");
`,
    ),
  ));
test("HRTB: implementazione static-only non e sufficientemente generale", () =>
  run(
    extend(
      hrtb,
      `
    let _saved=parse_owned(&StaticOnly,String::from("locale"));
`,
    ) +
      `
struct StaticOnly;
impl Parser<'static> for StaticOnly {
    type Output=&'static str;
    fn parse(&self,input:&'static str)->Self::Output{input}
}
`,
    { message: /implementation of .* is not general enough/ },
  ));
test("HRTB: parametro lifetime esterno non copre il prestito locale", () => {
  let code = replaceOnce(
    from(hrtb),
    "fn parse_owned<P>",
    "fn parse_owned<'input,P>",
  );
  code = replaceOnce(
    code,
    "P: for<'input> Parser<'input, Output = &'input str>,",
    "P: Parser<'input, Output = &'input str>,",
  );
  run(code, { error: "E0597" });
});
test("HRTB: non consente un risultato borrowed sul buffer locale", () =>
  run(
    from(hrtb) +
      `
fn invalid<'a,P>(parser:&P)->&'a str
where P:for<'input> Parser<'input,Output=&'input str> {
    let local=String::from("temporaneo");
    parser.parse(&local)
}
`,
    { error: "E0515" },
  ));
test("HRTB: l'uguaglianza Output esclude una implementazione owned", () =>
  run(
    extend(hrtb, `let _saved=parse_owned(&Owned,String::from("locale"));`) +
      `
struct Owned;
impl<'input> Parser<'input> for Owned {
    type Output=String;
    fn parse(&self,input:&'input str)->Self::Output{input.to_owned()}
}
`,
    { error: "E0271" },
  ));
test("HRTB su Fn: cattura locale consentita se output deriva dall'input", () =>
  run(`
fn apply<F>(f:F) where F:for<'a> Fn(&'a str)->&'a str {
    let local=String::from("  locale  ");
    assert_eq!(f(&local),"locale");
}
fn main(){
    let config=String::from("attivo");
    apply(|text|{assert!(!config.is_empty());text.trim()});
    assert_eq!(config,"attivo");
}
`));
test("dyn: rimuovere il bound dalla firma della factory richiede static", () =>
  run(
    replaceOnce(from(object), "-> Box<dyn Named + 'data>", "-> Box<dyn Named>"),
    { message: /lifetime may not live long enough/ },
  ));
test("dyn: Box non mantiene vivo il proprietario del testo", () =>
  run(
    extend(
      object,
      `
    let text=String::from("locale");
    let value=boxed_name(&text);
    drop(text);
    println!("{}",value.name());
`,
    ),
    { error: "E0505" },
  ));
test("dyn: il risultato di name_of non sopravvive al box", () =>
  run(
    extend(
      object,
      `
    let text=String::from("locale");let result;
    {let value=boxed_name(&text);result=name_of(value.as_ref());}
    println!("{result}");
`,
    ),
    { error: "E0597" },
  ));
test("dyn: bound dell'oggetto non e il lifetime del risultato del metodo", () =>
  run(replaceOnce(from(object), ") -> &'borrow str {", ") -> &'object str {"), {
    message: /lifetime may not live long enough/,
  }));
test("dyn: bound locale inferito anche con annotazione Box dyn Named", () =>
  run(
    extend(
      object,
      `
    let text=String::from("locale");
    let value:Box<dyn Named>=Box::new(BorrowedName(&text));
    assert_eq!(value.name(),"locale");
`,
    ),
  ));
test("dyn: implementazione owned soddisfa static ed e distrutta normalmente", () =>
  run(
    extend(
      object,
      `
    fn make()->Box<dyn Named>{Box::new(OwnedName("posseduto".to_owned()))}
    let value=make();
    assert_eq!(value.name(),"posseduto");
    drop(value);
`,
    ) +
      `
struct OwnedName(String);
impl Named for OwnedName {fn name(&self)->&str{&self.0}}
`,
  ));
test("elision errata: firma corretta nel trait e nell'impl", () => {
  let code = from(wrongElision).replaceAll(
    "fn field(&self, row: &str) -> Option<&str>",
    "fn field<'row>(&self, row: &'row str) -> Option<&'row str>",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main(){let row=String::from("a,b");assert_eq!(FirstField.field(&row),Some("a"));}',
  );
  assert.equal(run(code), "");
});
test("impl static-only: generalizzare la firma permette input locali", () => {
  let code = replaceOnce(
    from(staticOnly),
    "fn field(&self, row: &'static str) -> Option<&'static str>",
    "fn field<'row>(&self, row: &'row str) -> Option<&'row str>",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main(){let row=String::from("locale");assert_eq!(StaticOnly.field(&row),Some("locale"));}',
  );
  assert.equal(run(code), "");
});
