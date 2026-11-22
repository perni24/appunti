import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Typestate pattern.md";
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
const prefix = "appunti-rust-typestate-pattern-";
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

const post = "Documento con transizione fallibile e recupero";
const builder = "Builder con dati nello stato";
const wrong = "Operazione non disponibile nello stato corrente";
const moved = "Riutilizzare lo stato consumato";
const branches = "Unire direttamente stati diversi";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}
test("baseline reale e cinque programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 5);
});
test("frontmatter invariato, struttura e fonti", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  function checkNoHtml(node) {
    assert.notEqual(node.type, "html", "Tipo generico interpretato come HTML");
    for (const child of node.children ?? []) checkNoHtml(child);
  }
  checkNoHtml(note.tree);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Typestate pattern",
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
    (n) => n.type === "paragraph" && text(n).startsWith("| Operazione |"),
  );
  assert.ok(table);
  assert.equal(text(table).split("\n").length, 7);
  for (const row of text(table).split("\n"))
    assert.equal(row.split("|").length, 4);
  for (const url of [
    "https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html#encoding-states-and-behavior-as-types",
    "https://doc.rust-lang.org/reference/visibility-and-privacy.html",
    "https://doc.rust-lang.org/std/net/struct.TcpStream.html#method.connect",
    "https://doc.rust-lang.org/std/io/trait.Write.html#method.write_all",
    "https://doc.rust-lang.org/reference/destructors.html",
  ])
    assert.ok(originalBytes.toString().includes(url));
  for (const code of blocks.values())
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|unsafe\s+impl|todo!|unimplemented!|#!\[feature/,
    );
});
for (const title of [post, builder]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
for (const [title, error] of [
  [wrong, "E0599"],
  [moved, "E0382"],
  [branches, "E0308"],
]) {
  test("controesempio: " + title, () => run(from(title), { error }));
}
test("post: titolo e corpo obbligatori, priorita del titolo", () => {
  run(
    main(
      post,
      'for (title, body, expected) in [("", "", PublishError::EmptyTitle), ("", "body", PublishError::EmptyTitle), ("title", "", PublishError::EmptyBody)] { let (_, error) = Post::new(title.to_owned(), body.to_owned()).publish().unwrap_err(); assert_eq!(error, expected); }',
    ),
  );
});
test("post: whitespace ASCII e Unicode rifiutato", () => {
  run(
    main(
      post,
      'for blank in [" ", "\\t\\n\\r", "\\u{a0}", "\\u{2003}", "\\u{3000}"] { assert_eq!(Post::new(blank.to_owned(), "b".to_owned()).publish().unwrap_err().1, PublishError::EmptyTitle); assert_eq!(Post::new("t".to_owned(), blank.to_owned()).publish().unwrap_err().1, PublishError::EmptyBody); }',
    ),
  );
});
test("post: U+200B e NUL non equivalgono a whitespace", () => {
  run(
    main(
      post,
      'for text in ["\\u{200b}", "\\0", "\\u{e8}"] { let p = Post::new(text.to_owned(), text.to_owned()).publish().unwrap(); assert_eq!(p.title(), text); assert_eq!(p.body(), text); }',
    ),
  );
});
test("post: validazione non effettua trim o normalizzazione", () => {
  run(
    main(
      post,
      'let p = Post::new("  Title  ".to_owned(), "\\n Body\\t".to_owned()).publish().unwrap(); assert_eq!(p.title(), "  Title  "); assert_eq!(p.body(), "\\n Body\\t");',
    ),
  );
});
test("post: publish e retract conservano i buffer", () => {
  run(
    main(
      post,
      'let title = String::from("Title"); let body = String::from("Body"); let tp = title.as_ptr(); let bp = body.as_ptr(); let mut p = Post::new(title, body).publish().unwrap(); for _ in 0..4 { assert_eq!(p.title().as_ptr(), tp); assert_eq!(p.body().as_ptr(), bp); p = p.retract().publish().unwrap(); }',
    ),
  );
});
test("post: errore recuperabile conserva il corpo e consente retry", () => {
  run(
    main(
      post,
      'let body = String::from("Body"); let pointer = body.as_ptr(); let (mut draft, e) = Post::new(" ".to_owned(), body).publish().unwrap_err(); assert_eq!(e, PublishError::EmptyTitle); draft.set_title("Title".to_owned()); let p = draft.publish().unwrap(); assert_eq!(p.body().as_ptr(), pointer); assert_eq!(p.title(), "Title");',
    ),
  );
});
test("post: recupero dopo corpo vuoto e nuovi tentativi", () => {
  run(
    main(
      post,
      'let (mut draft, e) = Post::new("Title".to_owned(), String::new()).publish().unwrap_err(); assert_eq!(e, PublishError::EmptyBody); draft.set_body(" ".to_owned()); let (mut draft, e) = draft.publish().unwrap_err(); assert_eq!(e, PublishError::EmptyBody); draft.set_body("Body".to_owned()); assert_eq!(draft.publish().unwrap().body(), "Body");',
    ),
  );
});
test("post: ritiro riabilita modifiche e nuova validazione", () => {
  run(
    main(
      post,
      'let p = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); let mut draft = p.retract(); draft.set_title(String::new()); assert_eq!(draft.publish().unwrap_err().1, PublishError::EmptyTitle);',
    ),
  );
});
test("post: Debug rende visibili anche i dati della bozza", () => {
  run(
    main(
      post,
      'let draft = Post::new("private-title".to_owned(), "private-body".to_owned()); let debug = format!("{draft:?}"); assert!(debug.contains("private-title")); assert!(debug.contains("private-body"));',
    ),
  );
});
test("post: Draft non espone title", () => {
  run(
    main(
      post,
      'let draft = Post::new("t".to_owned(), "b".to_owned()); let _ = draft.title();',
    ),
    { error: "E0599" },
  );
});
test("post: Published non espone setter", () => {
  run(
    main(
      post,
      'let mut p = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); p.set_body(String::new());',
    ),
    { error: "E0599" },
  );
});
test("post: costruttore new assente per Published", () => {
  run(
    main(
      post,
      'let _ = Post::<Published>::new("t".to_owned(), "b".to_owned());',
    ),
    { error: "E0599" },
  );
});
test("post: campo privato impedisce Published arbitrario", () => {
  run(
    main(
      post,
      "let _ = Post::<Published> { title: String::new(), body: String::new(), state: std::marker::PhantomData };",
    ),
    { error: "E0451" },
  );
});
test("post: publish consuma Draft anche se il Result e scartato", () => {
  run(
    main(
      post,
      'let mut draft = Post::new("t".to_owned(), "b".to_owned()); let _ = draft.publish(); draft.set_title("new".to_owned());',
    ),
    { error: "E0382" },
  );
});
test("post: retract consuma Published", () => {
  run(
    main(
      post,
      'let p = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); let _draft = p.retract(); let _ = p.body();',
    ),
    { error: "E0382" },
  );
});
test("post: Clone non disponibile", () => {
  run(
    main(
      post,
      'let draft = Post::new("t".to_owned(), "b".to_owned()); let _ = draft.clone();',
    ),
    { error: "E0599" },
  );
});
test("post: prestito ancora usato impedisce ritiro", () => {
  run(
    main(
      post,
      'let p = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); let title = p.title(); let _draft = p.retract(); assert_eq!(title, "t");',
    ),
    { error: "E0505" },
  );
});
test("post: fine del prestito permette la transizione successiva", () => {
  run(
    main(
      post,
      'let p = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); let title = p.title(); assert_eq!(title, "t"); let _draft = p.retract();',
    ),
  );
});
test("post: enum conserva stati misti e permette il match", () => {
  run(
    main(
      post,
      'let items = vec![StoredPost::Draft(Post::new("d".to_owned(), "b".to_owned())), StoredPost::Published(Post::new("p".to_owned(), "b".to_owned()).publish().unwrap())]; let mut count = 0; for item in items { let p = match item { StoredPost::Draft(d) => d.publish().unwrap(), StoredPost::Published(p) => p }; assert_eq!(p.body(), "b"); count += 1; } assert_eq!(count, 2);',
    ),
  );
});
test("post: assegnazione non cambia tipo, shadowing si", () => {
  run(
    main(
      post,
      'let mut draft = Post::new("t".to_owned(), "b".to_owned()); draft = draft.publish().unwrap();',
    ),
    { error: "E0308" },
  );
  run(
    main(
      post,
      'let post = Post::new("t".to_owned(), "b".to_owned()); let post = post.publish().unwrap(); assert_eq!(post.title(), "t");',
    ),
  );
});
test("builder: valori u8 e configurazione prima o dopo il nome", () => {
  run(
    main(
      builder,
      'for retries in 0..=u8::MAX { let job = Builder::new().retries(retries).name("job".to_owned()).unwrap_or_else(|_| panic!("valid")).build(); assert_eq!(job.retries(), retries); let job = Builder::new().name("job".to_owned()).unwrap_or_else(|_| panic!("valid")).retries(retries).build(); assert_eq!(job.retries(), retries); }',
    ),
  );
});
test("builder: nome vuoto recupera configurazione precedente", () => {
  run(
    main(
      builder,
      'for name in ["", " ", "\\u{a0}"] { let builder = Builder::new().retries(7); let (builder, error) = match builder.name(name.to_owned()) { Err(pair) => pair, Ok(_) => panic!("invalid") }; assert_eq!(error, jobs::EmptyName); let job = builder.name("fixed".to_owned()).unwrap_or_else(|_| panic!("valid")).build(); assert_eq!(job.retries(), 7); assert_eq!(job.name(), "fixed"); }',
    ),
  );
});
test("builder: preserva nome, buffer, Unicode e default dei retry", () => {
  run(
    main(
      builder,
      'for name in [" job ", "\\u{200b}", "\\u{e8}"] { let input = name.to_owned(); let pointer = input.as_ptr(); let job = Builder::new().name(input).unwrap_or_else(|_| panic!("valid")).build(); assert_eq!(job.name(), name); assert_eq!(job.name().as_ptr(), pointer); assert_eq!(job.retries(), 0); }',
    ),
  );
});
test("builder: Missing non espone build", () => {
  run(main(builder, "let _ = Builder::new().build();"), { error: "E0599" });
});
test("builder: Named non espone new", () => {
  run(main(builder, "let _ = Builder::<jobs::Named>::new();"), {
    error: "E0599",
  });
});
test("builder: campo privato di Named", () => {
  run(main(builder, "let _ = jobs::Named { name: String::new() };"), {
    error: "E0451",
  });
});
test("builder: campi privati impediscono creazione arbitraria", () => {
  run(main(builder, "let _ = Builder { state: jobs::Missing, retries: 0 };"), {
    error: "E0451",
  });
});
test("builder: name consuma Missing", () => {
  run(
    main(
      builder,
      'let b = Builder::new(); let _ = b.name("job".to_owned()); let _ = b.retries(2);',
    ),
    { error: "E0382" },
  );
});
test("builder: build consuma Named", () => {
  run(
    main(
      builder,
      'let b = Builder::new().name("job".to_owned()).unwrap_or_else(|_| panic!("valid")); let _ = b.build(); let _ = b.build();',
    ),
    { error: "E0382" },
  );
});
test("builder: name non disponibile una seconda volta", () => {
  run(
    main(
      builder,
      'let b = Builder::new().name("job".to_owned()).unwrap_or_else(|_| panic!("valid")); let _ = b.name("again".to_owned());',
    ),
    { error: "E0599" },
  );
});
test("Drop sul wrapper impedisce il move diretto dei campi", () => {
  const code = replace(
    from(post),
    "impl Post<Draft> {",
    "impl<S> Drop for Post<S> { fn drop(&mut self) {} }\n    impl Post<Draft> {",
  );
  run(code, { error: "E0509" });
});
test("Drop specializzato su uno stato e rifiutato", () => {
  run(
    "struct Draft; struct Published; struct Flow<S>(S); impl Drop for Flow<Published> { fn drop(&mut self) {} } fn main() {}",
    { error: "E0366" },
  );
});
test("campo RAII separato attraversa una transizione e viene distrutto", () => {
  run(
    "use std::{marker::PhantomData, sync::atomic::{AtomicUsize, Ordering}}; static DROPS: AtomicUsize = AtomicUsize::new(0); struct Resource; impl Drop for Resource { fn drop(&mut self) { DROPS.fetch_add(1, Ordering::SeqCst); } } struct A; struct B; struct Flow<S> { resource: Resource, state: PhantomData<fn() -> S> } impl Flow<A> { fn next(self) -> Flow<B> { Flow { resource: self.resource, state: PhantomData } } } fn main() { let flow = Flow::<A> { resource: Resource, state: PhantomData }; let next = flow.next(); assert_eq!(DROPS.load(Ordering::SeqCst), 0); drop(next); assert_eq!(DROPS.load(Ordering::SeqCst), 1); }",
  );
});
test("abbandonare il flusso non richiede una transizione finale", () => {
  run(
    main(
      post,
      'let draft = Post::new("t".to_owned(), "b".to_owned()); drop(draft); let b = Post::new("t".to_owned(), "b".to_owned()).publish().unwrap(); drop(b);',
    ),
  );
});
test("forget evita Drop di una sonda ZST senza risorse reali", () => {
  run(
    "use std::sync::atomic::{AtomicUsize, Ordering}; static DROPS: AtomicUsize = AtomicUsize::new(0); struct Guard; impl Drop for Guard { fn drop(&mut self) { DROPS.fetch_add(1, Ordering::SeqCst); } } fn main() { std::mem::forget(Guard); assert_eq!(DROPS.load(Ordering::SeqCst), 0); drop(Guard); assert_eq!(DROPS.load(Ordering::SeqCst), 1); }",
  );
});
test("write_all puo fallire dopo un prefisso scritto: writer simulato", () => {
  run(
    'use std::io::{self, Write}; struct Partial { bytes: Vec<u8>, fail: bool } impl Write for Partial { fn write(&mut self, bytes: &[u8]) -> io::Result<usize> { if self.fail { return Err(io::Error::other("simulated")); } let n = bytes.len().min(2); self.bytes.extend_from_slice(&bytes[..n]); self.fail = true; Ok(n) } fn flush(&mut self) -> io::Result<()> { Ok(()) } } fn main() { let mut writer = Partial { bytes: Vec::new(), fail: false }; assert!(writer.write_all(b"hello").is_err()); assert_eq!(writer.bytes, b"he"); writer.fail = false; assert!(writer.write_all(b"hello").is_err()); assert_eq!(writer.bytes, b"hehe"); }',
  );
});
test("correzione: metodo invocato sullo stato previsto", () => {
  run(
    replace(
      from(wrong),
      "let draft = Post::<Draft>",
      "let draft = Post::<Published>",
    ),
  );
});
test("correzione: usare il nuovo valore dopo la transizione", () => {
  run(
    replace(
      from(moved),
      "let _old_content = draft.0;",
      "let _new_content = _published.0;",
    ),
  );
});
test("correzione: enum per il risultato dei rami", () => {
  let code = replace(
    from(branches),
    "fn main() {",
    "enum Either { Draft(Post<Draft>), Published(Post<Published>) }\nfn main() {",
  );
  code = replace(
    code,
    "        Post::<Published>(PhantomData)",
    "        Either::Published(Post::<Published>(PhantomData))",
  );
  code = replace(
    code,
    "        Post::<Draft>(PhantomData)",
    "        Either::Draft(Post::<Draft>(PhantomData))",
  );
  run(code);
});
