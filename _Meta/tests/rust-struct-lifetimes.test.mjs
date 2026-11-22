import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Lifetimes nelle struct"];
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
const prefix = "appunti-rust-struct-lifetimes-";
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

const excerpt = "Excerpt: metodo sui dati e fine del prestito";
const pair = "PairView e MixedView: scegliere il contratto";
const mutable = "Vista mutabile: reborrow oppure trasferimento";
const token = "Token sul buffer e conversione esplicita in owned";
const cow = "Struct mista con Cow";
const document = "Possedere il buffer e creare viste nei metodi";
const local = "Una vista non puo uscire da una sorgente locale";
const selfref =
  "Un parametro lifetime non crea un collegamento autoreferenziale";
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("frontmatter originale, struttura e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/Lifetimes nelle struct.md";
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
  assert.match(notes[0].body, /doc\.rust-lang\.org\/std\/borrow\/enum\.Cow/);
  assert.match(notes[0].body, /E0505 ed E0515/);
});
for (const heading of [
  excerpt,
  pair,
  mutable,
  token,
  cow,
  document,
  local,
  selfref,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === local
        ? { error: "E0515" }
        : heading === selfref
          ? { error: "E0505", detail: /"code":"E0515"/ }
          : {};
    const output = run(source(0, heading), options);
    if (!options.error) assert.equal(output, "");
  });
}
test("Excerpt: len in byte, vista senza copia, vuoto e Unicode", () =>
  run(
    extend(
      excerpt,
      String.raw`
    for value in ["","\u{00E8}","\u{1F600}","test"] {
        let owner=value.to_owned();
        let view=Excerpt{text:&owner};
        assert_eq!(view.len(),value.len());
        assert!(std::ptr::eq(view.as_str(),owner.as_str()));
    }
`,
    ),
  ));
test("Excerpt: uso dopo drop del proprietario rifiutato", () =>
  run(
    replaceOnce(
      source(0, excerpt),
      "    drop(source);",
      "    drop(source);\n    assert_eq!(view.len(),14);",
    ),
    { error: "E0505" },
  ));
test("Excerpt: as_str eliso lega il risultato alla vista", () =>
  run(
    replaceOnce(
      source(0, excerpt),
      "fn as_str(&self) -> &'a str",
      "fn as_str(&self) -> &str",
    ),
    { error: "E0597" },
  ));
test("Excerpt: derive Clone e Copy duplicano il riferimento", () =>
  run(
    extend(
      excerpt,
      `
    let owner=String::from("condiviso");
    let original=Excerpt{text:&owner};
    let copied=original;
    let cloned=original.clone();
    assert!(std::ptr::eq(copied.text,original.text));
    assert!(std::ptr::eq(cloned.text,owner.as_str()));
`,
    ).replace(
      "struct Excerpt<'a> {",
      "#[derive(Clone,Copy)]\nstruct Excerpt<'a> {",
    ),
  ));
test("Drop che legge i dati impedisce drop anticipato del proprietario", () =>
  run(
    source(0, excerpt) +
      `
impl Drop for Excerpt<'_> {fn drop(&mut self){assert!(!self.text.is_empty());}}
`,
    { error: "E0505" },
  ));
test("Drop: distruggere prima la vista rende valido il programma", () =>
  run(
    replaceOnce(
      source(0, excerpt),
      "    drop(source);",
      "    drop(view);\n    drop(source);",
    ) +
      `
impl Drop for Excerpt<'_> {fn drop(&mut self){assert!(!self.text.is_empty());}}
`,
  ));
test("Drop: anche un corpo vuoto puo conservare il vincolo nella baseline", () =>
  run(
    source(0, excerpt) + "\nimpl Drop for Excerpt<'_> {fn drop(&mut self){}}\n",
    { error: "E0505" },
  ));
test("PairView: un lifetime non richiede proprietari con durata identica", () =>
  run(
    extend(
      pair,
      `
    let long=String::from("lungo");
    {let short=String::from("breve");let view=PairView{left:&long,right:&short};
     assert_eq!(view.left,"lungo");assert_eq!(view.right,"breve");}
    assert_eq!(long,"lungo");
`,
    ),
  ));
test("MixedView: unificare i lifetime restringe il risultato title", () => {
  let code = source(0, pair);
  code = replaceOnce(
    code,
    "struct MixedView<'title, 'body> {",
    "struct MixedView<'title> {",
  );
  code = replaceOnce(code, "body: &'body str", "body: &'title str");
  code = replaceOnce(
    code,
    "impl<'title, 'body> MixedView<'title, 'body> {",
    "impl<'title> MixedView<'title> {",
  );
  run(code, { error: "E0597" });
});
test("MixedView: non conserva tutta la vista oltre la sorgente breve", () =>
  run(
    extend(
      pair,
      `
    let title=String::from("titolo");let result;
    {let body=String::from("breve");result=MixedView{title:&title,body:&body};}
    println!("{}",result.body);
`,
    ),
    { error: "E0597" },
  ));
test("MixedView: restituire body con il contratto title e invalido", () =>
  run(
    replaceOnce(source(0, pair), "        self.title\n", "        self.body\n"),
    { message: /lifetime may not live long enough/ },
  ));
test("BytesMut: vista vuota, accessi distinti e trasferimento", () =>
  run(
    extend(
      mutable,
      `
    let mut empty=[];
    let mut view=BytesMut{bytes:&mut empty};
    assert!(view.as_mut().is_empty());
    assert!(view.into_inner().is_empty());
    let mut data=[0,0];
    let mut view=BytesMut{bytes:&mut data};
    view.as_mut().fill(1);
    let result=view.into_inner();
    result[0]=2;
    assert_eq!(data,[2,1]);
`,
    ),
  ));
test("BytesMut: due reborrow simultaneamente usati sono rifiutati", () =>
  run(
    extend(
      mutable,
      `
    let mut data=[1,2];
    let mut view=BytesMut{bytes:&mut data};
    let first=view.as_mut();
    let second=view.as_mut();
    first[0]=3;
    second[1]=4;
`,
    ),
    { error: "E0499" },
  ));
test("BytesMut: receiver legato ad a ostacola le chiamate successive", () =>
  run(
    replaceOnce(
      source(0, mutable),
      "fn as_mut(&mut self) -> &mut [u8]",
      "fn as_mut(&'a mut self) -> &'a mut [u8]",
    ),
    { error: "E0499" },
  ));
test("BytesMut: ritorno lungo non ottenibile dal solo reborrow breve", () =>
  run(
    replaceOnce(
      source(0, mutable),
      "fn as_mut(&mut self) -> &mut [u8]",
      "fn as_mut(&mut self) -> &'a mut [u8]",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("BytesMut: non si puo derivare Copy sul riferimento esclusivo", () =>
  run(
    source(0, mutable).replace(
      "struct BytesMut<'a> {",
      "#[derive(Clone,Copy)]\nstruct BytesMut<'a> {",
    ),
    { error: "E0204" },
  ));
test("BytesMut: into_inner consuma la vista", () =>
  run(
    replaceOnce(
      source(0, mutable),
      "    let bytes = view.into_inner();",
      "    let bytes = view.into_inner();\n    view.as_mut();",
    ),
    { error: "E0382" },
  ));
test("BytesMut: il dato sorgente non e leggibile durante un uso successivo della vista", () =>
  run(
    extend(
      mutable,
      `
    let mut data=[1,2];
    let mut view=BytesMut{bytes:&mut data};
    assert_eq!(data[0],1);
    view.as_mut()[0]=3;
`,
    ),
    { error: "E0502" },
  ));
test("Token: whitespace Unicode, vuoto, punteggiatura e testo multibyte", () =>
  run(
    extend(
      token,
      String.raw`
    assert!(first_word("").is_none());
    assert!(first_word("\u{2003}\u{00A0}").is_none());
    for (value,expected) in [("\u{2003}\u{00E8}ra oggi","\u{00E8}ra"),("Ciao, mondo","Ciao,")] {
        let result=first_word(value).unwrap();
        assert_eq!(result.kind,"word");
        assert_eq!(result.text,expected);
    }
`,
    ),
  ));
test("Token: slice nello stesso buffer, copia owned indipendente", () =>
  run(
    extend(
      token,
      `
    let mut data=String::from("  Rust note");
    let borrowed=first_word(&data).unwrap();
    assert!(std::ptr::eq(borrowed.text,&data[2..6]));
    let owned=borrowed.into_owned();
    data.clear();
    assert_eq!(owned.text,"Rust");
`,
    ),
  ));
test("Token: spostare la vista non rende owned il testo", () =>
  run(
    extend(
      token,
      `
    let result;
    {let data=String::from("breve");let borrowed=first_word(&data).unwrap();result=borrowed;}
    println!("{}",result.text);
`,
    ),
    { error: "E0597" },
  ));
test("Token: kind static non estende il lifetime del testo", () =>
  run(
    extend(
      token,
      `
    let data=String::from("locale");
    let _token:Token<'static>=first_word(&data).unwrap();
`,
    ),
    { error: "E0597" },
  ));
test("campo static senza parametro generico accetta literal e rifiuta dati locali", () => {
  assert.equal(
    run(`struct Label{name:&'static str}
fn main(){let label=Label{name:"literal"};assert_eq!(label.name,"literal");}`),
    "",
  );
  run(
    `struct Label{name:&'static str}
fn main(){let data=String::from("locale");let label=Label{name:&data};println!("{}",label.name);}`,
    { error: "E0597" },
  );
});
test("Cow: conversione dal ramo borrowed dopo la fine dello scope", () =>
  run(
    extend(
      cow,
      `
    let saved;
    {let text=String::from("temporaneo");
     let page=Page{title:"T".to_owned(),body:Cow::Borrowed(&text)};
     saved=page.into_owned();}
    assert_eq!(saved.body.as_ref(),"temporaneo");
    assert!(matches!(&saved.body,Cow::Owned(_)));
`,
    ),
  ));
test("Cow: conversione owned trasferisce la String esistente", () =>
  run(
    extend(
      cow,
      `
    let text=String::from("nessuna copia richiesta");
    let original=text.as_ptr();
    let page=Page{title:"T".to_owned(),body:Cow::Owned(text)};
    let saved=page.into_owned();
    assert_eq!(saved.body.as_ptr(),original);
    assert_eq!(saved.body.as_ref(),"nessuna copia richiesta");
`,
    ),
  ));
test("Cow: to_mut gia owned riusa il buffer senza crescita", () =>
  run(
    extend(
      cow,
      `
    let mut page=Page{title:String::new(),body:Cow::Owned("test".to_owned())};
    let original=page.body.as_ptr();
    page.body.to_mut().make_ascii_uppercase();
    assert_eq!(page.body.as_ptr(),original);
    assert_eq!(page.body.as_ref(),"TEST");
`,
    ),
  ));
test("Cow: case ASCII non trasforma lettere Unicode", () =>
  run(
    extend(
      cow,
      String.raw`
    let text=String::from("\u{00E8}ra");
    let mut page=Page{title:String::new(),body:Cow::Borrowed(&text)};
    page.body.to_mut().make_ascii_uppercase();
    assert_eq!(page.body.as_ref(),"\u{00E8}RA");
    assert_eq!(text,"\u{00E8}ra");
`,
    ),
  ));
test("Cow: to_mut non basta a eliminare il lifetime dal tipo", () =>
  run(
    replaceOnce(
      source(0, cow),
      "    let saved = page.into_owned();",
      "    let saved = page;",
    ),
    { error: "E0505" },
  ));
test("Cow: conversione esplicita rende il tipo static ma non immortale", () =>
  run(
    extend(
      cow,
      `
    fn static_type<T:'static>(_:&T){}
    let text=String::from("locale");
    let saved=Page{title:String::new(),body:Cow::Borrowed(&text)}.into_owned();
    static_type(&saved);
    drop(text);
    drop(saved);
`,
    ),
  ));
test("Document: viste su Unicode, vuoto e proprieta trasferita", () =>
  run(
    extend(
      document,
      String.raw`
    let empty=Document::new(String::new());
    assert_eq!(empty.first_word(),None);
    let owner=Document::new("\u{2003}\u{00E8}ra oggi".to_owned());
    assert_eq!(owner.first_word(),Some("\u{00E8}ra"));
    let moved=owner;
    assert_eq!(moved.first_word(),Some("\u{00E8}ra"));
`,
    ),
  ));
test("Document: move vietato mentre il risultato e ancora usato", () =>
  run(
    extend(
      document,
      `
    let owner=Document::new("Rust note".to_owned());
    let word=owner.first_word().unwrap();
    let _moved=owner;
    println!("{word}");
`,
    ),
    { error: "E0505" },
  ));
test("Document: modifica vietata mentre il risultato e ancora usato", () =>
  run(
    extend(
      document,
      `
    let mut owner=Document::new("Rust note".to_owned());
    let word=owner.first_word().unwrap();
    owner.text.clear();
    println!("{word}");
`,
    ),
    { error: "E0502" },
  ));
test("vista locale: ricevere la sorgente dal chiamante corregge il ritorno", () => {
  let code = source(0, local);
  code = replaceOnce(
    code,
    "fn invalid<'a>() -> Excerpt<'a> {\n    let source = String::from(\"locale\");",
    "fn invalid<'a>(source: &'a str) -> Excerpt<'a> {",
  );
  code = replaceOnce(
    code,
    "Excerpt { text: &source }",
    "Excerpt { text: source }",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main(){let data=String::from("valido");assert_eq!(invalid(&data).text,"valido");}',
  );
  assert.equal(run(code), "");
});
test("vista locale: static non ripara il riferimento al proprietario locale", () =>
  run(
    replaceOnce(
      source(0, local),
      "fn invalid<'a>() -> Excerpt<'a>",
      "fn invalid() -> Excerpt<'static>",
    ),
    { error: "E0515" },
  ));
test("autoreferenziale: separare il proprietario dalla vista e valido", () =>
  run(`
struct View<'a>{text:&'a str}
fn main(){let text=String::from("esterno");let view=View{text:&text};assert_eq!(view.text,"esterno");}
`));
