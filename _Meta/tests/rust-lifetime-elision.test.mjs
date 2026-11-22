import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Lifetime elision"];
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
const prefix = "appunti-rust-lifetime-elision-";
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

const word = "Un input, due firme equivalenti";
const buffer = "Il receiver prevale sugli altri riferimenti";
const view = "Placeholder nei riferimenti e nei percorsi di tipo";
const practical = "Estensione di un percorso e frammento di un indirizzo";
const object = "Trait object: un default diverso dall'elision della funzione";
const callable = "Tipi di funzione e callable";
const ambiguous = "Due input non collegati e output ambiguo";
const receiver = "Restituire un altro input con il contratto del receiver";
const missing = "Nessun input da cui ricavare il lifetime";
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline Rust e inventario di nove programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 9);
});
test("frontmatter invariato, struttura, collegamenti e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/Lifetime elision.md";
  const head = launch("git", ["show", "HEAD:" + filename], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const frontmatter = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(
    frontmatter(fs.readFileSync(filename, "utf8")),
    frontmatter(head.stdout),
  );
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
  assert.match(
    notes[0].body,
    /doc\.rust-lang\.org\/reference\/lifetime-elision/,
  );
  assert.match(notes[0].body, /Path::extension/);
  assert.match(notes[0].body, /non valida email/i);
});
for (const heading of [
  word,
  buffer,
  view,
  practical,
  object,
  callable,
  ambiguous,
  receiver,
  missing,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === ambiguous || heading === missing
        ? { error: "E0106" }
        : heading === receiver
          ? { message: /lifetime may not live long enough/ }
          : {};
    const result = run(source(0, heading), options);
    if (!options.error && !options.message) assert.equal(result, "");
  });
}

test("first_word: Unicode, vuoto, punteggiatura e firme equivalenti", () =>
  run(
    extend(
      word,
      String.raw`
    for value in ["", " ", "\t\n", "\u{2003}Rust\u{00A0}note", "Ciao,", "\u{00E8}ra"] {
        assert_eq!(first_word(value),first_word_explicit(value));
    }
    assert_eq!(first_word("\u{2003}Rust\u{00A0}note"),"Rust");
    assert_eq!(first_word("Ciao, mondo"),"Ciao,");
`,
    ),
  ));
test("first_word: identita della vista e prestito fino all'ultimo uso", () =>
  run(
    extend(
      word,
      `
    let mut value=String::from("Rust note");
    let first=first_word(&value);
    assert!(std::ptr::eq(first,&value[..4]));
    value.push('!');
    assert_eq!(value,"Rust note!");
`,
    ),
  ));
test("first_word: mutazione incompatibile mentre la vista serve", () =>
  run(
    extend(
      word,
      `
    let mut value=String::from("Rust note");
    let first=first_word(&value);
    value.clear();
    println!("{first}");
`,
    ),
    { error: "E0502" },
  ));
test("first_word: anche il fallback vuoto conserva il contratto", () =>
  run(
    extend(
      word,
      `
    let result;
    { let value=String::new(); result=first_word(&value); }
    println!("{result}");
`,
    ),
    { error: "E0597" },
  ));
test("regole: ripetere lo stesso nome su due input non basta nella baseline", () =>
  run(
    `
fn choose<'a>(a:&'a str,b:&'a str)->&str {if a.is_empty(){b}else{a}}
fn main(){let a=String::from("a");let b=String::from("b");assert_eq!(choose(&a,&b),"a");}
`,
    { error: "E0106" },
  ));
test("regole: nome condiviso esplicito anche in output corregge la firma", () =>
  run(`
fn choose<'a>(a:&'a str,b:&'a str)->&'a str {if a.is_empty(){b}else{a}}
fn main(){let a=String::from("a");let b=String::from("b");assert_eq!(choose(&a,&b),"a");}
`));
test("regole: un solo input nominato consente l'output eliso", () =>
  run(`
fn pass<'a>(value:&'a str)->&str {value}
fn main(){let value=String::from("locale");assert_eq!(pass(&value),"locale");}
`));
test("regole: una tupla parametro contiene due lifetime indipendenti", () =>
  run(
    `
fn first(pair:(&str,&str))->&str {pair.0}
fn main(){}
`,
    { error: "E0106" },
  ));
test("regole: un riferimento annidato ha piu posizioni di lifetime", () =>
  run(
    `
fn inner(value:&&str)->&str {*value}
fn main(){}
`,
    { error: "E0106" },
  ));
test("regole: parametro numerico e due output con un solo lifetime", () =>
  run(`
fn parts(text:&str,index:usize)->Option<(&str,&str)> {text.split_at_checked(index)}
fn main(){let value=String::from("abcd");assert_eq!(parts(&value,2),Some(("ab","cd")));}
`));
test("regole: output posseduto non richiede legame tra input", () =>
  run(`
fn joined(a:&str,b:&str)->String {format!("{a}{b}")}
fn main(){
    let a=String::from("a");let result;
    {let b=String::from("b");result=joined(&a,&b);}
    assert_eq!(result,"ab");
}
`));
test("Buffer: firma espansa equivalente", () =>
  run(
    replaceOnce(
      source(0, buffer),
      "fn replace_text(&mut self, input: &str) -> &str",
      "fn replace_text<'s, 'i>(&'s mut self, input: &'i str) -> &'s str",
    ),
  ));
test("Buffer: copia testo vuoto e Unicode senza prestare il sorgente", () =>
  run(
    extend(
      buffer,
      String.raw`
    let mut b=Buffer{text:String::from("originale")};
    assert_eq!(b.replace_text(""),"");
    assert_eq!(b.replace_text("\u{00E8}"),"\u{00E8}");
    let result;
    {let temporary=String::from("indipendente");result=b.replace_text(&temporary);}
    assert_eq!(result,"indipendente");
`,
    ),
  ));
test("Buffer: non si puo modificare di nuovo prima dell'uso del risultato", () =>
  run(
    extend(
      buffer,
      `
    let mut b=Buffer{text:String::new()};
    let first=b.replace_text("uno");
    b.replace_text("due");
    println!("{first}");
`,
    ),
    { error: "E0499" },
  ));
test("Buffer: restituzione di input invece della vista viola la firma", () =>
  run(
    replaceOnce(
      source(0, buffer),
      "        self.text.push_str(input);\n        &self.text",
      "        self.text.push_str(input);\n        input",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("View: firma esplicita e placeholder equivalenti", () =>
  run(
    replaceOnce(
      source(0, view),
      "fn view(text: &'_ str) -> View<'_>",
      "fn view<'a>(text: &'a str) -> View<'a>",
    ),
  ));
test("View: uscire dallo scope del proprietario resta vietato", () =>
  run(
    extend(
      view,
      `
    let result;
    {let owner=String::from("breve");result=view(&owner);}
    println!("{}",result.text);
`,
    ),
    { error: "E0597" },
  ));
test("View: il campo &str senza parametro lifetime e invalido", () =>
  run(
    replaceOnce(
      source(0, view),
      "struct View<'a> {\n    text: &'a str,",
      "struct View {\n    text: &str,",
    ),
    { error: "E0106" },
  ));
test("placeholder ripetuto negli input non li unifica", () =>
  run(
    replaceOnce(
      source(0, ambiguous),
      "fn choose(first: &str, _second: &str) -> &str",
      "fn choose(first: &'_ str, _second: &'_ str) -> &'_ str",
    ),
    { error: "E0106" },
  ));
test("Path: matrice di nomi senza accesso al filesystem", () =>
  run(
    extend(
      practical,
      `
    for (name,expected) in [
        ("",None),("README",None),("dir.v1/README",None),(".gitignore",None),
        (".config.toml",Some("toml")),("archive.tar.gz",Some("gz")),
        ("file.",Some("")),("file..",Some("")),("UPPER.RS",Some("RS"))
    ] {
        assert_eq!(extension(Path::new(name)),expected.map(OsStr::new),"{name}");
    }
`,
    ),
  ));
test("regressione: la vecchia rsplit_once scambiava directory e dotfile", () =>
  run(
    extend(
      practical,
      `
    fn old(path:&str)->Option<&str>{path.rsplit_once('.').map(|(_,ext)|ext)}
    assert_eq!(old("notes.v1/README"),Some("v1/README"));
    assert_eq!(extension(Path::new("notes.v1/README")),None);
    assert_eq!(old(".env"),Some("env"));
    assert_eq!(extension(Path::new(".env")),None);
`,
    ),
  ));
test("Path: OsStr non Unicode preservato, distinto dall'assenza", () =>
  run(
    extend(
      practical,
      `
    #[cfg(windows)] {
        use std::ffi::OsString;
        use std::os::windows::ffi::OsStringExt;
        let name=OsString::from_wide(&[0x66,0x2e,0xD800]);
        let ext=extension(Path::new(&name)).unwrap();
        assert_eq!(ext.to_str(),None);
        assert_eq!(extension(Path::new(&name)).and_then(OsStr::to_str),None);
        assert_eq!(extension(Path::new("README")).and_then(OsStr::to_str),None);
    }
    #[cfg(unix)] {
        use std::os::unix::ffi::OsStrExt;
        let name=OsStr::from_bytes(&[b'f',b'.',0xFF]);
        let ext=extension(Path::new(name)).unwrap();
        assert_eq!(ext.to_str(),None);
    }
`,
    ),
  ));
test("Path: estensione non puo sopravvivere al PathBuf", () =>
  run(
    extend(
      practical,
      `
    let ext;
    {let path=std::path::PathBuf::from("file.rs");ext=extension(&path);}
    println!("{ext:?}");
`,
    ),
    { error: "E0597" },
  ));
test("Path: copia OsString conserva il risultato", () =>
  run(
    extend(
      practical,
      `
    let ext;
    {let path=std::path::PathBuf::from("file.rs");ext=extension(&path).map(OsStr::to_os_string);}
    assert_eq!(ext.as_deref(),Some(OsStr::new("rs")));
`,
    ),
  ));
test("User: split testuale non convalida email", () =>
  run(
    extend(
      practical,
      `
    for (email,expected) in [
        ("",None),("user",None),("user@",Some("")),("@host",Some("host")),
        ("u@@host",Some("@host")),("u@ host ",Some(" host ")),("a@b@c",Some("b@c"))
    ] {
        let user=User{email:email.to_owned()};
        assert_eq!(user.domain_fragment(),expected);
    }
`,
    ),
  ));
test("User: il risultato e una vista e la modifica resta vietata", () =>
  run(
    extend(
      practical,
      `
    let mut user=User{email:String::from("a@host")};
    let domain=user.domain_fragment().unwrap();
    assert!(std::ptr::eq(domain,&user.email[2..]));
    user.email.clear();
    println!("{domain}");
`,
    ),
    { error: "E0502" },
  ));
test("dyn: Box senza bound esplicito richiede static nella firma", () =>
  run(
    replaceOnce(source(0, object), "Box<dyn Display + '_>", "Box<dyn Display>"),
    { message: /lifetime may not live long enough/ },
  ));
test("dyn: firma completa con riferimento e bound esplicito", () =>
  run(
    replaceOnce(
      source(0, object),
      "fn borrowed(text: &String) -> &dyn Display",
      "fn borrowed<'a>(text: &'a String) -> &'a (dyn Display + 'a)",
    ),
  ));
test("dyn: bound locale inferito nelle espressioni", () =>
  run(
    extend(
      object,
      `
    let owner=String::from("locale");
    let local:Box<dyn Display>=Box::new(owner.as_str());
    assert_eq!(local.to_string(),"locale");
`,
    ),
  ));
test("dyn: Box non mantiene vivo il proprietario del riferimento", () =>
  run(
    extend(
      object,
      `
    let value;
    {let data=String::from("breve");value=boxed(&data);}
    println!("{value}");
`,
    ),
    { error: "E0597" },
  ));
test("callable: firma HRTB espansa equivalente", () =>
  run(
    replaceOnce(
      source(0, callable),
      "type Transform = fn(&str) -> &str;",
      "type Transform = for<'a> fn(&'a str) -> &'a str;",
    ),
  ));
test("callable: funzione limitata a static non soddisfa il contratto", () =>
  run(
    replaceOnce(
      source(0, callable),
      "fn trimmed(text: &str) -> &str",
      "fn trimmed(text: &'static str) -> &'static str",
    ),
    { error: "E0308" },
  ));
test("callable: bound Fn mantiene la relazione tra input e output", () =>
  run(
    extend(
      callable,
      `
    fn call<'a,F:Fn(&str)->&str>(f:F,text:&'a str)->&'a str {f(text)}
    let data=String::from("  valore ");
    assert_eq!(call(trimmed,&data),"valore");
`,
    ),
  ));
test("choose: firma corretta libera il secondo parametro", () =>
  run(
    replaceOnce(
      source(0, ambiguous),
      "fn choose(first: &str, _second: &str) -> &str",
      "fn choose<'a>(first: &'a str, _second: &str) -> &'a str",
    ).replace(
      "fn main() {}",
      `fn main(){
    let a=String::from("a");let result;
    {let b=String::from("b");result=choose(&a,&b);}
    assert_eq!(result,"a");
}`,
    ),
  ));
test("receiver: firma esplicita permette al risultato di sopravvivere al servizio", () =>
  run(
    replaceOnce(
      source(0, receiver),
      "fn echo(&self, input: &str) -> &str",
      "fn echo<'a>(&self, input: &'a str) -> &'a str",
    ).replace(
      "fn main() {}",
      `fn main(){
    let data=String::from("dato");let result;
    {let service=Service;result=service.echo(&data);}
    assert_eq!(result,"dato");
}`,
    ),
  ));
test("impl: un lifetime nell'header non sceglie l'output del metodo", () =>
  run(
    `
struct View<'a>(&'a str);
impl<'a> View<'a> {fn text(&self)->&str {self.0}}
fn main(){
    let owner=String::from("dato");let result;
    {let view=View(&owner);result=view.text();}
    println!("{result}");
}
`,
    { error: "E0597" },
  ));
test("label: output static esplicito corregge il literal", () =>
  run(
    replaceOnce(
      source(0, missing),
      "fn label() -> &str",
      "fn label() -> &'static str",
    ).replace("fn main() {}", 'fn main(){assert_eq!(label(),"pronto");}'),
  ));
test("const e static: default distinto dalla firma fn", () =>
  run(`
const LABEL:&str="pronto";
static STATE:&str="attivo";
fn main(){let _: &'static str=LABEL;let _: &'static str=STATE;}
`));
test("closure isolata: annotare &str non applica tutte le regole delle fn", () =>
  run(
    `
fn main(){let identity=|x:&str|->&str{x};let value=String::from("x");println!("{}",identity(&value));}
`,
    { message: /lifetime may not live long enough/ },
  ));
test("closure senza catture: contesto fn con contratto esplicito", () =>
  run(`
fn main(){let identity:fn(&str)->&str=|x|x;let value=String::from("x");assert_eq!(identity(&value),"x");}
`));
