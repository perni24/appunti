import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Lifetimes avanzati"];
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
const prefix = "appunti-rust-advanced-lifetimes-";
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

const outlives = "Outlives esplicito e bound implicito";
const staticType = "Riferimento static e bound static sul tipo";
const reborrow = "Reborrow: riutilizzare il riferimento esclusivo";
const placeholder = "Placeholder: lifetime inferito, non cancellato";
const display = "BorrowedDisplay: vista generica e risultato posseduto";
const variance = "Varianza: quale parametro cambia";
const object = "Box e lifetime del trait object";
const phantom = "PhantomData: dipendenza senza un campo reference";
const slot = "Invarianza del contenuto dietro un riferimento mutabile";
const cell = "Interior mutability non conserva la covarianza";
const from = (heading) => source(0, heading);
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e inventario: dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 10);
});
test("frontmatter originale, struttura e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/Lifetimes avanzati.md";
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
  assert.match(notes[0].body, /doc\.rust-lang\.org\/reference\/subtyping/);
  for (const code of blocks[0].values())
    assert.doesNotMatch(code, /\bunsafe\b/);
});
for (const heading of [
  outlives,
  staticType,
  reborrow,
  placeholder,
  display,
  variance,
  object,
  phantom,
  slot,
  cell,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === slot
        ? { error: "E0597" }
        : heading === cell
          ? { message: /lifetime may not live long enough/ }
          : {};
    const output = run(from(heading), options);
    if (!options.error && !options.message) assert.equal(output, "");
  });
}
test("outlives: dati sized, str, slice e riferimenti locali contenuti", () =>
  run(
    extend(
      outlives,
      `
    let number=3;
    require_outlives(&number);
    let data=[1,2,3];
    inferred(&data[..]);
    let owner=String::from("locale");
    let refs=vec![owner.as_str()];
    inferred(&refs);
    assert!(std::ptr::eq(shorten(owner.as_str()),owner.as_str()));
`,
    ),
  ));
test("outlives: bound T a esplicito ridondante nella firma mostrata", () =>
  run(
    replaceOnce(
      from(outlives),
      "fn require_outlives<'a, T: ?Sized + 'a>",
      "fn require_outlives<'a, T: ?Sized>",
    ),
  ));
test("outlives: omettere il verso fra long e short e invalido", () =>
  run(replaceOnce(from(outlives), "where\n    'long: 'short,\n", ""), {
    message: /lifetime may not live long enough/,
  }));
test("outlives: invertire il verso non soddisfa il contratto", () =>
  run(replaceOnce(from(outlives), "'long: 'short,", "'short: 'long,"), {
    message: /lifetime may not live long enough/,
  }));
test("outlives: il bound implicito non fornisce Display", () =>
  run(
    from(outlives) +
      `
fn invalid<'a,T>(value:&'a T)->String{format!("{value}")}
`,
    { error: "E0277" },
  ));
test("outlives: shorten non consente di restituire una sorgente locale", () =>
  run(
    from(outlives) +
      `
fn invalid<'a>()->&'a str{
    let source=String::from("locale");
    shorten(source.as_str())
}
`,
    { error: "E0515" },
  ));
test("static: String e Vec String accettati con prestito esterno breve", () =>
  run(
    extend(
      staticType,
      `
    let data=vec!["a".to_owned(),"b".to_owned()];
    require_static(&data);
    drop(data);
    let mut value=String::from("owned");
    require_static(&value);
    value.clear();
    require_static(&value);
`,
    ),
  ));
test("static: T uguale a riferimento locale e rifiutato", () =>
  run(
    extend(
      staticType,
      `
    let owner=String::from("locale");
    let borrowed=owner.as_str();
    require_static(&borrowed);
`,
    ),
    { error: "E0597" },
  ));
test("static: possedere Vec non rende static i riferimenti negli elementi", () =>
  run(
    extend(
      staticType,
      `
    let owner=String::from("locale");
    let values=vec![owner.as_str()];
    require_static(&values);
`,
    ),
    { error: "E0597" },
  ));
test("static: distruttore effettivamente eseguito per il valore posseduto", () =>
  run(
    extend(
      staticType,
      `
    let count=std::rc::Rc::new(std::cell::Cell::new(0));
    let value=Tracked(count.clone());
    require_static(&value);
    drop(value);
    assert_eq!(count.get(),1);
`,
    ) +
      `
struct Tracked(std::rc::Rc<std::cell::Cell<usize>>);
impl Drop for Tracked {fn drop(&mut self){self.0.set(self.0.get()+1);}}
`,
  ));
test("reborrow: input vuoto e preesistente, chiamate ripetute", () =>
  run(
    extend(
      reborrow,
      `
    let mut empty=vec![];
    push_one(&mut empty);
    assert_eq!(empty,[1]);
    let mut data=vec![8];
    push_one(&mut data);
    push_one(&mut data);
    assert_eq!(data,[8,1,1]);
`,
    ),
  ));
test("reborrow: forma esplicita equivalente", () =>
  run(
    replaceOnce(
      from(reborrow),
      "let r: &mut Vec<i32> = v;",
      "let r = &mut *v;",
    ),
  ));
test("reborrow: let r uguale v senza tipo trasferisce il riferimento", () =>
  run(replaceOnce(from(reborrow), "let r: &mut Vec<i32> = v;", "let r = v;"), {
    error: "E0382",
  }));
test("reborrow: usare r dopo accesso a v mantiene il conflitto", () =>
  run(
    replaceOnce(
      from(reborrow),
      "assert!(!v.is_empty());",
      "assert!(!v.is_empty());\n    r.push(2);",
    ),
    { error: "E0502" },
  ));
test("reborrow: vista condivisa ancora usata impedisce modifica esclusiva", () =>
  run(
    extend(
      reborrow,
      `
    let mut data=vec![1];
    let original=&mut data;
    let shared=&*original;
    original.push(2);
    assert_eq!(shared.len(),1);
`,
    ),
    { error: "E0502" },
  ));
test("placeholder: vuoti, Unicode e separazione letterale non CSV", () =>
  run(
    extend(
      placeholder,
      String.raw`
    for (input,expected) in [
        ("",vec![""]),(",",vec!["",""]),("a,,b,",vec!["a","","b",""]),
        ("\u{00E8},x",vec!["\u{00E8}","x"]),("\"a,b\",c",vec!["\"a","b\"","c"])
    ]{assert_eq!(fields(input).collect::<Vec<_>>(),expected);}
`,
    ),
  ));
test("placeholder: parti riferite al medesimo buffer", () =>
  run(
    extend(
      placeholder,
      `
    let input=String::from("aa,bb");
    let parts:Vec<&str>=fields(&input).collect();
    assert!(std::ptr::eq(parts[0],&input[..2]));
    assert!(std::ptr::eq(parts[1],&input[3..]));
`,
    ),
  ));
test("placeholder: firma espansa equivalente", () =>
  run(
    replaceOnce(
      from(placeholder),
      "fn fields(input: &str) -> std::str::Split<'_, char>",
      "fn fields<'a>(input: &'a str) -> std::str::Split<'a, char>",
    ),
  ));
test("placeholder: sostituire static all'output non estende l'input", () =>
  run(
    replaceOnce(
      from(placeholder),
      "fn fields(input: &str) -> std::str::Split<'_, char>",
      "fn fields(input: &str) -> std::str::Split<'static, char>",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("placeholder: usare parts dopo drop input e vietato", () =>
  run(
    replaceOnce(
      from(placeholder),
      "    drop(input);",
      "    drop(input);\n    assert_eq!(parts.len(),4);",
    ),
    { error: "E0505" },
  ));
test("placeholder: collect non rende indipendente Vec di riferimenti", () =>
  run(
    extend(
      placeholder,
      `
    let saved;
    {let owner=String::from("a,b");saved=fields(&owner).collect::<Vec<_>>();}
    assert_eq!(saved,["a","b"]);
`,
    ),
    { error: "E0597" },
  ));
test("placeholder: literal puo fornire un iteratore static", () =>
  run(
    extend(
      placeholder,
      `
    let view:std::str::Split<'static,char>=fields("a,b");
    assert_eq!(view.collect::<Vec<_>>(),["a","b"]);
`,
    ),
  ));
test("BorrowedDisplay: vuoto, Unicode e testo senza escaping", () =>
  run(
    extend(
      display,
      String.raw`
    for value in ["","\u{00E8}","<b>test</b>"] {
        let owned=value.to_owned();
        assert_eq!(BorrowedDisplay{value:owned.as_str()}.render(),value);
    }
`,
    ),
  ));
test("BorrowedDisplay: String formattata indipendente dalla sorgente", () =>
  run(
    extend(
      display,
      `
    let mut source=String::from("originale");
    let saved=BorrowedDisplay{value:source.as_str()}.render();
    source.clear();
    drop(source);
    assert_eq!(saved,"originale");
`,
    ),
  ));
test("BorrowedDisplay: Display custom borrowed non richiede static", () =>
  run(
    extend(
      display,
      `
    let calls=std::cell::Cell::new(0);
    let counted=Counted(&calls);
    let view=BorrowedDisplay{value:&counted};
    assert_eq!(view.render(),"conteggio");
    assert_eq!(view.render(),"conteggio");
    assert_eq!(calls.get(),2);
`,
    ) +
      `
struct Counted<'a>(&'a std::cell::Cell<usize>);
impl Display for Counted<'_> {
    fn fmt(&self,f:&mut std::fmt::Formatter<'_>)->std::fmt::Result {
        self.0.set(self.0.get()+1);
        f.write_str("conteggio")
    }
}
`,
  ));
test("BorrowedDisplay: togliere ?Sized esclude str e dyn", () =>
  run(from(display).replaceAll("Display + ?Sized", "Display"), {
    error: "E0277",
  }));
test("BorrowedDisplay: Display fallibile scorretto causa panic di format", () =>
  run(
    extend(display, `let _saved=BorrowedDisplay{value:&Broken}.render();`) +
      `
struct Broken;
impl Display for Broken {
    fn fmt(&self,_f:&mut std::fmt::Formatter<'_>)->std::fmt::Result{Err(std::fmt::Error)}
}
`,
    { panic: /formatting trait implementation returned an error/ },
  ));
test("varianza: Vec trasferito senza clone del buffer", () =>
  run(
    extend(
      variance,
      `
    let data=vec!["a","b"];
    let ptr=data.as_ptr();
    let moved=shorter_vec(data);
    assert_eq!(moved.as_ptr(),ptr);
    assert_eq!(moved,["a","b"]);
    assert!(shorter_vec(Vec::new()).is_empty());
`,
    ),
  ));
test("varianza: accorciamento del prestito mutabile esterno", () =>
  run(
    extend(
      variance,
      `
    let mut value=10;
    {let borrowed=shorter_mut(&mut value);*borrowed+=5;}
    assert_eq!(value,15);
`,
    ),
  ));
test("varianza: Vec non permette di allungare il lifetime", () => {
  let code = replaceOnce(
    from(variance),
    "values: Vec<&'long str>",
    "values: Vec<&'short str>",
  );
  code = replaceOnce(code, ") -> Vec<&'short str>", ") -> Vec<&'long str>");
  run(code, { message: /lifetime may not live long enough/ });
});
test("varianza: mut e invariante sul riferimento contenuto", () =>
  run(
    from(variance) +
      `
fn invalid<'long:'short,'short>(value:&'short mut &'long str)->&'short mut &'short str{value}
`,
    { message: /lifetime may not live long enough/ },
  ));
test("varianza: il verso opposto per l'input del function pointer e rifiutato", () => {
  let code = replaceOnce(
    from(variance),
    "handler: fn(&'short str)",
    "handler: fn(&'long str)",
  );
  code = replaceOnce(code, ") -> fn(&'long str)", ") -> fn(&'short str)");
  run(code, { message: /lifetime may not live long enough/ });
});
test("varianza: risultato del function pointer covariante", () =>
  run(
    from(variance) +
      `
fn shorter_output<'long:'short,'short>(f:fn()->&'long str)->fn()->&'short str{f}
`,
  ));
test("varianza: Box covariante, RefCell invariante", () => {
  run(
    from(variance) +
      `
fn narrow<'long:'short,'short>(value:Box<&'long str>)->Box<&'short str>{value}
`,
  );
  run(
    from(variance) +
      `
fn narrow<'long:'short,'short>(value:std::cell::RefCell<&'long str>)->std::cell::RefCell<&'short str>{value}
`,
    { message: /lifetime may not live long enough/ },
  );
});
test("varianza: campi co e contravarianti rendono il parametro invariante", () =>
  run(
    from(variance) +
      `
struct Both<'a>{read:fn(&'a str),value:&'a str}
fn narrow<'long:'short,'short>(value:Both<'long>)->Both<'short>{value}
`,
    { message: /lifetime may not live long enough/ },
  ));
test("trait object: Unicode e input vuoto con prestito locale", () =>
  run(
    extend(
      object,
      String.raw`
    for text in ["","\u{00E8}","a b"]{
        let owner=text.to_owned();
        assert_eq!(boxed(&owner).to_string(),text);
    }
`,
    ),
  ));
test("trait object: default static nella firma impedisce ritorno borrowed", () =>
  run(
    replaceOnce(
      from(object),
      "-> Box<dyn Display + 'a>",
      "-> Box<dyn Display>",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("trait object: Box non permette di liberare la sorgente prima dell'uso", () =>
  run(
    extend(
      object,
      `
    let owner=String::from("locale");
    let value=boxed(&owner);
    drop(owner);
    assert_eq!(value.to_string(),"locale");
`,
    ),
    { error: "E0505" },
  ));
test("trait object: copiare i dati prima di inscatolarli rende owned il risultato", () =>
  run(
    extend(
      object,
      `
    fn owned(value:&str)->Box<dyn Display>{Box::new(value.to_owned())}
    let saved;
    {let source=String::from("locale");saved=owned(&source);}
    assert_eq!(saved.to_string(),"locale");
`,
    ),
  ));
test("PhantomData: ricerca vuota, assente, Unicode e offset in byte", () =>
  run(
    extend(
      phantom,
      String.raw`
    assert!(locate("",':').is_none());
    assert!(locate("testo",':').is_none());
    let text=String::from("\u{00E8}\u{1F600}:x:y");
    let position=locate(&text,':').unwrap();
    assert_eq!(position.offset(),6);
    assert!(text.is_char_boundary(position.offset()));
    assert_eq!(&text[position.offset()..],":x:y");
    assert_eq!(locate(&text,'\u{1F600}').unwrap().offset(),2);
    assert_eq!(std::mem::size_of::<PhantomData<&str>>(),0);
    assert_eq!(std::mem::align_of::<PhantomData<&str>>(),1);
`,
    ),
  ));
test("PhantomData: mutazione vietata mentre Position resta usata", () =>
  run(
    extend(
      phantom,
      `
    let mut source=String::from("a:b");
    let position=locate(&source,':').unwrap();
    source.clear();
    assert_eq!(position.offset(),1);
`,
    ),
    { error: "E0502" },
  ));
test("PhantomData: marker non mantiene vivo il proprietario", () =>
  run(
    extend(
      phantom,
      `
    let source=String::from("a:b");
    let position=locate(&source,':').unwrap();
    drop(source);
    assert_eq!(position.offset(),1);
`,
    ),
    { error: "E0505" },
  ));
test("PhantomData: Position locale non puo essere restituita oltre la sorgente", () =>
  run(
    from(phantom) +
      `
fn invalid<'a>()->Position<'a>{
    let source=String::from("a:b");
    locate(&source,':').unwrap()
}
`,
    { error: "E0515" },
  ));
test("PhantomData: usize estratto non conserva il prestito", () =>
  run(
    extend(
      phantom,
      `
    let offset;
    {let source=String::from("a:b");offset=locate(&source,':').unwrap().offset();}
    assert_eq!(offset,1);
`,
    ),
  ));
test("PhantomData: Position covariante nel lifetime della sorgente", () =>
  run(
    from(phantom) +
      `
fn narrow<'long:'short,'short>(value:Position<'long>)->Position<'short>{value}
`,
  ));
test("PhantomData: la forma reference influenza Send senza dati runtime", () => {
  run(`
use std::marker::PhantomData;
fn require_send<T:Send>(_:T){}
fn main(){require_send(PhantomData::<&i32>);}
`);
  run(
    `
use std::marker::PhantomData;
fn require_send<T:Send>(_:T){}
fn main(){require_send(PhantomData::<&std::cell::Cell<i32>>);}
`,
    { error: "E0277" },
  );
});
test("slot: assegnazione da altro dato static valida", () => {
  let code = replaceOnce(
    from(slot),
    "replace(&mut slot, local.as_str());",
    'replace(&mut slot, "static");',
  );
  code = replaceOnce(
    code,
    'assert_eq!(slot, "temporaneo");',
    'assert_eq!(slot, "static");',
  );
  assert.equal(run(code), "");
});
test("slot: contenuto String posseduto risolve senza prestiti static", () => {
  let code = replaceOnce(
    from(slot),
    'let mut slot: &\'static str = "iniziale";',
    'let mut slot = String::from("iniziale");',
  );
  code = replaceOnce(
    code,
    "replace(&mut slot, local.as_str());",
    "replace(&mut slot, local);",
  );
  assert.equal(run(code), "");
});
test("slot: un riferimento non static puo usare una regione comune valida", () => {
  const code = replaceOnce(
    from(slot),
    "let mut slot: &'static str",
    "let mut slot: &str",
  );
  assert.equal(run(code), "");
});
test("Cell: estrazione e ricostruzione esplicita accorcia il riferimento", () => {
  let code = replaceOnce(
    from(cell),
    "    value\n",
    "    Cell::new(value.into_inner())\n",
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    `
fn main(){
    let cell=Cell::new("dato");
    let ptr=cell.get().as_ptr();
    let result=shorter_cell(cell);
    assert_eq!(result.get(),"dato");
    assert_eq!(result.get().as_ptr(),ptr);
}
`,
  );
  assert.equal(run(code), "");
});
