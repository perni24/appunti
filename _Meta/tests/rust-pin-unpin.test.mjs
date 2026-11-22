import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Pin e Unpin"];
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
const prefix = "appunti-rust-pin-unpin-";
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
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
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

const movable = "Unpin permette l'accesso mutabile ordinario";
const marker = "PhantomPinned non pinna il valore";
const local = "Pinning locale senza una nuova allocazione Box";
const future = "Wrapper di future con puntatore pinnato interno";
const replacement = "Sostituire non equivale a estrarre il vecchio valore";
const elements = "Collezione di proprietari pinnati";
const wrongNew = "Pin::new non pinna arbitrariamente un tipo non Unpin";
const lifetime = "Restituire una vista su storage locale";
const from = (heading) => source(0, heading);
function main(heading, body) {
  const original = from(heading);
  assert.equal(original.split("fn main(").length, 2);
  return (
    original.slice(0, original.indexOf("fn main(")) +
    "fn main() {\n" +
    body +
    "\n}"
  );
}
test("baseline e inventario degli otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Pin e Unpin.md";
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  const content = fs.readFileSync(file, "utf8");
  assert.equal(yaml(content), yaml(head.stdout));
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Pin e Unpin",
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
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  for (const url of [
    "std/pin/index.html",
    "std/pin/struct.Pin.html",
    "std/marker/trait.Unpin.html",
    "std/marker/struct.PhantomPinned.html",
    "std/pin/macro.pin.html",
    "std/future/trait.Future.html",
  ])
    assert.ok(content.includes("https://doc.rust-lang.org/" + url), url);
  const tableHeading = notes[0].tree.children.findIndex(
    (node) => node.type === "heading" && text(node) === "Operazioni principali",
  );
  assert.ok(tableHeading >= 0);
  // Il parser condiviso conserva la tabella come paragrafo CommonMark.
  const table = notes[0].tree.children[tableHeading + 1];
  assert.equal(table.type, "paragraph");
  assert.ok(text(table).startsWith("| Operazione |"));
  const nodes = [];
  function collect(node) {
    nodes.push(node);
    for (const child of node.children ?? []) collect(child);
  }
  collect(table);
  assert.ok(!nodes.some((node) => node.type === "html"));
  for (const type of ["Pin<Box<T>>", "Pin<&mut T>", "Pin<&T>", "P::Target"])
    assert.ok(
      nodes.some((node) => node.type === "inlineCode" && node.value === type),
      type,
    );
  for (const code of blocks[0].values())
    assert.doesNotMatch(
      code,
      /\bunsafe\s*\{|todo!|unimplemented!|thread::sleep|mem::forget/,
    );
});
for (const heading of [movable, marker, local, future, replacement, elements])
  test("programma originale: " + heading, () => run(from(heading)));
test("controesempio: Pin::new con !Unpin", () =>
  run(from(wrongNew), { error: "E0277" }));
test("controesempio: pin locale restituito", () =>
  run(from(lifetime), { error: "E0515" }));

for (const heading of [marker, future, replacement])
  test("programma ottimizzato: " + heading, () =>
    run(from(heading), { args: ["-C", "opt-level=3"] }),
  );
for (const [type, bound, valid] of [
  ["Entry", "Unpin", false],
  ["Box<Entry>", "Unpin", true],
  ["Pin<Box<Entry>>", "Unpin", true],
  ["Pin<&'static mut Entry>", "Unpin", true],
  ["Vec<Entry>", "Unpin", false],
  ["Vec<Pin<Box<Entry>>>", "Unpin", true],
  ["Pin<Box<Entry>>", "Send", true],
  ["Pin<Box<Entry>>", "Sync", false],
  ["PhantomPinned", "Send", true],
  ["PhantomPinned", "Sync", true],
  ["Pin<Box<std::rc::Rc<u32>>>", "Send", false],
  ["Pin<Box<std::cell::Cell<u32>>>", "Sync", false],
])
  test(bound + ": " + type, () =>
    run(
      main(
        marker,
        "fn require<T:" + bound + ">(){} require::<" + type + ">();",
      ),
      valid ? {} : { error: "E0277" },
    ),
  );
for (const [label, statement] of [
  [
    "get_mut",
    'let mut pinned=Box::pin(Entry::new("x"));let _value=pinned.as_mut().get_mut();',
  ],
  [
    "into_inner",
    'let pinned=Box::pin(Entry::new("x"));let _boxed=Pin::into_inner(pinned);',
  ],
  [
    "new su Box",
    'let boxed=Box::new(Entry::new("x"));let _pinned=Pin::new(boxed);',
  ],
])
  test("bound del contenuto: " + label, () =>
    run(main(marker, statement), { error: "E0277" }),
  );
test("Box ordinario permette di estrarre !Unpin", () => {
  run(
    main(
      marker,
      'let boxed=Box::new(Entry::new("x"));let entry=*boxed;let moved=entry;assert_eq!(moved.name,"x");',
    ),
  );
});
test("scambiare i proprietari non sposta le allocazioni", () => {
  run(
    main(
      marker,
      'let mut first=Box::pin(Entry::new("first"));let mut second=Box::pin(Entry::new("second"));let a=first.as_ref().get_ref() as *const Entry;let b=second.as_ref().get_ref() as *const Entry;std::mem::swap(&mut first,&mut second);assert_eq!(a,second.as_ref().get_ref() as *const Entry);assert_eq!(b,first.as_ref().get_ref() as *const Entry);assert_eq!(first.name,"second");',
    ),
  );
});
test("reborrow pinnato e ulteriore accesso al proprietario", () => {
  run(
    main(
      marker,
      'let mut entry=Box::pin(Entry::new("x"));{let view=entry.as_mut();view.as_ref().activate();}entry.as_ref().activate();assert!(entry.active.get());',
    ),
  );
});
test("marcatore non impedisce un impl Unpin esplicito", () => {
  run(
    main(
      wrongNew,
      "impl Unpin for Entry {} let mut value=Entry{_pin:PhantomPinned};let pinned=Pin::new(&mut value);let _exclusive=pinned.get_mut();",
    ),
  );
});
test("correzione: pin locale", () => {
  run(
    replaceOnce(
      from(wrongNew),
      "Pin::new(&mut value)",
      "std::pin::pin!(value)",
    ),
  );
});
test("correzione: Box::pin", () => {
  run(replaceOnce(from(wrongNew), "Pin::new(&mut value)", "Box::pin(value)"));
});
test("correzione lifetime: restituzione del proprietario", () => {
  let code = replaceOnce(
    from(lifetime),
    "Pin<&'static mut String>",
    "Pin<Box<String>>",
  );
  code = replaceOnce(
    code,
    'pin!(String::from("temporary"))',
    'Box::pin(String::from("temporary"))',
  );
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main(){let value=make();assert_eq!(&**value,"temporary");}',
  );
  run(code);
});
test("pin locale non puo uscire dal blocco proprietario", () => {
  run(
    'use std::pin::pin; fn main(){let value={let pinned=pin!(String::from("local"));pinned};assert_eq!(&**value,"local");}',
    { error: "E0716" },
  );
});
test("set chiama ogni Drop una volta nello storage locale", () => {
  run(
    main(
      replacement,
      'let log=RefCell::new(Vec::new());{let mut pinned=std::pin::pin!(Tracked{id:"first",log:&log,_pin:PhantomPinned});pinned.as_mut().set(Tracked{id:"second",log:&log,_pin:PhantomPinned});pinned.as_mut().set(Tracked{id:"third",log:&log,_pin:PhantomPinned});assert_eq!(*log.borrow(),vec!["first","second"]);}assert_eq!(*log.borrow(),vec!["first","second","third"]);',
    ),
  );
});
test("set non converte il tipo del contenuto", () => {
  run(
    main(
      replacement,
      'let log=RefCell::new(Vec::new());let mut pinned=Box::pin(Tracked{id:"first",log:&log,_pin:PhantomPinned});pinned.as_mut().set(1);',
    ),
    { error: "E0308" },
  );
});
test("Drop riceve ancora l'indirizzo del valore pinnato", () => {
  run(
    "use std::{cell::Cell,marker::PhantomPinned};struct Item<'a>{dropped_at:&'a Cell<usize>,_pin:PhantomPinned}impl Drop for Item<'_>{fn drop(&mut self){self.dropped_at.set(self as *const Self as usize);}}fn main(){let at=Cell::new(0);let item=Box::pin(Item{dropped_at:&at,_pin:PhantomPinned});let address=item.as_ref().get_ref() as *const Item<'_> as usize;drop(item);assert_eq!(at.get(),address);}",
  );
});
test("collezione: riordino e crescita mantengono i destinatari", () => {
  run(
    main(
      elements,
      'let a=Box::pin(Item{value:"a".into(),_pin:PhantomPinned});let b=Box::pin(Item{value:"b".into(),_pin:PhantomPinned});let pa=a.as_ref().get_ref() as *const Item;let pb=b.as_ref().get_ref() as *const Item;let mut items=vec![a,b];items.reserve(1024);items.swap(0,1);assert_eq!(items[0].as_ref().get_ref() as *const Item,pb);assert_eq!(items[1].as_ref().get_ref() as *const Item,pa);assert_eq!(items.pop().unwrap().value,"a");',
    ),
  );
});
test("collezione: pop non autorizza estrazione di Item", () => {
  run(
    main(
      elements,
      'let mut items=vec![Box::pin(Item{value:"a".into(),_pin:PhantomPinned})];let _item=*items.pop().unwrap();',
    ),
    { error: "E0507" },
  );
});
test("il future async non soddisfa Unpin", () => {
  run(
    probe(
      0,
      future,
      "fn require<T:Unpin>(_:&T){} let generated=async{42}; require(&generated);",
    ),
    { error: "E0277" },
  );
});
test("il wrapper e Unpin anche con future async non Unpin", () => {
  run(
    probe(
      0,
      future,
      "fn require<T:Unpin>(_:&T){} let generated=Stored::new(async{42}); require(&generated);",
    ),
  );
});
test("campo F diretto richiede proiezione o bound diverso", () => {
  let code = replaceOnce(from(future), "inner: Pin<Box<F>>", "inner: F");
  code = replaceOnce(
    code,
    "Self { inner: Box::pin(future) }",
    "Self { inner: future }",
  );
  code = replaceOnce(
    code,
    "self.get_mut().inner.as_mut().poll(cx)",
    "Pin::new(&mut self.get_mut().inner).poll(cx)",
  );
  run(code, { error: "E0277" });
});
test("il test rileva la mancata richiesta di wake", () => {
  run(replaceOnce(from(future), "cx.waker().wake_by_ref();", ""), {
    panic: /assertion.*failed/s,
  });
});
test("il test rileva Ready anticipato", () => {
  run(
    replaceOnce(
      from(future),
      "            Poll::Pending",
      "            Poll::Ready(())",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("wrapper con future immediatamente pronto e output non Copy", () => {
  run(
    main(
      future,
      'let mut value=Stored::new(std::future::ready(String::from("ready")));let mut cx=Context::from_waker(Waker::noop());assert_eq!(Pin::new(&mut value).poll(&mut cx),Poll::Ready(String::from("ready")));',
    ),
  );
});
test("wrapper conserva lifetime locali senza imporre static", () => {
  run(
    main(
      future,
      'let text=String::from("borrowed");let view=text.as_str();let mut value=Stored::new(async{view});let mut cx=Context::from_waker(Waker::noop());assert_eq!(Pin::new(&mut value).poll(&mut cx),Poll::Ready("borrowed"));',
    ),
  );
});
test("boxing non rende Send un future con Rc", () => {
  run(
    main(
      future,
      "fn require<T:Send>(_:&T){}let data=std::rc::Rc::new(7);let value=Stored::new(async move{YieldOnce{yielded:false}.await;*data});require(&value);",
    ),
    {
      message: /future cannot be sent between threads safely/,
      detail: /Rc<i32>/,
    },
  );
});
test("wrapper con Arc conserva Send del future", () => {
  run(
    main(
      future,
      "fn require<T:Send>(_:&T){}let data=Arc::new(7);let value=Stored::new(async move{YieldOnce{yielded:false}.await;*data});require(&value);",
    ),
  );
});
test("drop prima del polling non esegue il corpo async", () => {
  run(
    main(
      future,
      "let calls=std::cell::Cell::new(0);let value=Stored::new(async{calls.set(1);});drop(value);assert_eq!(calls.get(),0);",
    ),
  );
});
test("drop dopo Pending distrugge i locali senza rollback degli effetti", () => {
  run(
    main(
      future,
      "struct Token<'a>(&'a std::cell::Cell<u32>);impl Drop for Token<'_>{fn drop(&mut self){self.0.set(self.0.get()+1);}}let dropped=std::cell::Cell::new(0);let effects=std::cell::Cell::new(0);let mut value=Stored::new(async{let token=Token(&dropped);effects.set(1);YieldOnce{yielded:false}.await;drop(token);effects.set(2);});let mut cx=Context::from_waker(Waker::noop());assert_eq!(Pin::new(&mut value).poll(&mut cx),Poll::Pending);drop(value);assert_eq!(dropped.get(),1);assert_eq!(effects.get(),1);",
    ),
  );
});
test("trait object future con lifetime esplicito", () => {
  run(
    main(
      future,
      'let name=String::from("local");let mut future:Pin<Box<dyn Future<Output=&str> + \'_>>=Box::pin(async{name.as_str()});let mut cx=Context::from_waker(Waker::noop());assert_eq!(future.as_mut().poll(&mut cx),Poll::Ready("local"));',
    ),
  );
});
