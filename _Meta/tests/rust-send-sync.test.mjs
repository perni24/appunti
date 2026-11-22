import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const notePath = "Programmazione/Rust/Pagine/Send e Sync Traits.md";
const note = parseNote(notePath);
const originalBytes = fs.readFileSync(notePath);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type === "code") {
    assert.equal(node.lang, "rust");
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, node.value);
  }
}

const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-send-sync-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  assert.deepEqual(fs.readFileSync(notePath), originalBytes);
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of Object.keys(env))
  if (
    /^(RUSTFLAGS|RUST_MIN_STACK|RUST_LIB_BACKTRACE|CARGO_ENCODED_RUSTFLAGS|RUSTC_WRAPPER|RUSTC_WORKSPACE_WRAPPER)$/i.test(
      key,
    )
  )
    delete env[key];
let sequence = 0;
function launch(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 45000,
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
      "--edition=2024",
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
  if (options.error || options.errorText) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    if (options.error)
      assert.ok(
        diagnostics.some(
          (d) => d.level === "error" && d.code?.code === options.error,
        ),
        compiled.stderr,
      );
    if (options.errorText) assert.match(compiled.stderr, options.errorText);
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const result = launch(output, [], dir);
  assert.equal(
    result.status,
    options.exitCode ?? 0,
    result.stdout + result.stderr,
  );
  if (options.stderr) assert.match(result.stderr, options.stderr);
  else assert.equal(result.stderr, "");
  return result.stdout.replaceAll("\r\n", "\n");
}
function source(name) {
  assert.ok(blocks.has(name), name);
  return blocks.get(name);
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function main(name, body) {
  const code = source(name);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}

const auto = "Auto trait: nessun derive necessario";
const spawn = "Bound di una funzione che avvia un thread";
const object = "Trait object con Send esplicito";
const transfer = "Trasferire RefCell senza condividerla";
const share = "Condividere una String con Arc";
const future = "Future Send e dati conservati attraverso await";
const local = "Limitare gli auto trait su stable";
const rc = "Move non rende Rc trasferibile";
const scoped = "Uno scope non rende RefCell condivisibile";
const held = "Rc conservato nel future";

test("baseline e dieci programmi estratti", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 10);
});
test("frontmatter originale, template, gerarchia e fonti", () => {
  const original = launch("git", ["show", "HEAD:" + notePath], process.cwd());
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Send e Sync Traits",
  ]);
  for (const name of [
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
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(note.source, /Questo programma controlla il tipo/);
  assert.match(note.source, /negative_impls/);
  assert.match(note.source, /https:\/\/doc\.rust-lang\.org\/std\/marker/);
  assert.ok(!note.tree.children.some((n) => n.type === "html"));
});
for (const name of [auto, spawn, object, transfer, share, future, local])
  test("programma originale: " + name, () =>
    assert.equal(run(source(name)), ""),
  );
for (const name of [rc, scoped])
  test("controesempio E0277: " + name, () =>
    run(source(name), { error: "E0277" }),
  );
test("controesempio: future non Send", () =>
  run(source(held), {
    errorText: /future cannot be sent between threads safely/,
  }));

const bounds = [
  ["Send", "std::cell::Cell<u32>", true],
  ["Sync", "std::cell::Cell<u32>", false],
  ["Send", "std::cell::RefCell<String>", true],
  ["Sync", "std::cell::RefCell<String>", false],
  ["Send", "std::rc::Rc<String>", false],
  ["Sync", "std::rc::Rc<String>", false],
  ["Send", "std::sync::Arc<String>", true],
  ["Sync", "std::sync::Arc<String>", true],
  ["Send", "std::sync::Arc<std::cell::RefCell<String>>", false],
  ["Sync", "std::sync::Arc<std::cell::RefCell<String>>", false],
  ["Send", "std::sync::Mutex<std::cell::Cell<u32>>", true],
  ["Sync", "std::sync::Mutex<std::cell::Cell<u32>>", true],
  ["Send", "std::sync::Mutex<std::rc::Rc<u32>>", false],
  ["Sync", "std::sync::Mutex<std::rc::Rc<u32>>", false],
  ["Send", "std::sync::RwLock<std::cell::Cell<u32>>", true],
  ["Sync", "std::sync::RwLock<std::cell::Cell<u32>>", false],
  ["Send", "*const u32", false],
  ["Sync", "*const u32", false],
  ["Send", "*mut u32", false],
  ["Sync", "*mut u32", false],
  ["Send", "std::sync::MutexGuard<'static, String>", false],
  ["Sync", "std::sync::MutexGuard<'static, String>", true],
  ["Send", "&'static std::cell::Cell<u32>", false],
  ["Send", "&'static mut std::cell::Cell<u32>", true],
  ["Sync", "&'static mut std::cell::Cell<u32>", false],
  ["Send", "&'static String", true],
  ["Sync", "&'static String", true],
  ["Sync", "&'static mut String", true],
  ["Send", "Vec<std::cell::RefCell<String>>", true],
  ["Sync", "Vec<std::cell::RefCell<String>>", false],
  ["Send", "Box<std::cell::RefCell<String>>", true],
  ["Sync", "Box<std::cell::RefCell<String>>", false],
];
for (const [trait, type, valid] of bounds) {
  test(trait + " per " + type, () =>
    run(
      "fn requires<T: " +
        trait +
        " + ?Sized>() {}\nfn main() { requires::<" +
        type +
        ">(); }",
      valid ? {} : { error: "E0277" },
    ),
  );
}
test("wrapper auto trait: il campo Rc impedisce Send", () => {
  run(main(auto, "assert_send::<Packet<std::rc::Rc<String>>>();"), {
    error: "E0277",
  });
});
test("wrapper auto trait: il campo RefCell impedisce Sync", () => {
  run(main(auto, "assert_sync::<Packet<RefCell<String>>>();"), {
    error: "E0277",
  });
});
test("helper spawn: anche il risultato deve essere Send", () => {
  run(main(spawn, "let _worker = spawn_work(|| std::rc::Rc::new(1));"), {
    error: "E0277",
  });
});
test("helper spawn: un riferimento locale resta non static", () => {
  run(
    main(
      spawn,
      `
    let text = String::from("local");
    let borrowed = &text;
    let worker = spawn_work(move || borrowed.len());
    worker.join().unwrap();
  `,
    ),
    { error: "E0597" },
  );
});
test("helper spawn esegue sul worker e restituisce un risultato", () => {
  run(
    main(
      spawn,
      `
    let original = thread::current().id();
    let worker = spawn_work(|| (thread::current().id(), 7));
    let (actual, value) = worker.join().unwrap();
    assert_ne!(actual, original);
    assert_eq!(value, 7);
  `,
    ),
  );
});
test("let underscore non forza la cattura di Rc", () => {
  run(`
    use std::{rc::Rc, thread};
    fn main() {
        let data = Rc::new(String::from("local"));
        let worker = thread::spawn(move || { let _ = data; });
        worker.join().unwrap();
        assert_eq!(data.as_str(), "local");
        assert_eq!(Rc::strong_count(&data), 1);
    }
  `);
});
test("trait object: omettere Send perde il requisito", () => {
  run(replaceOnce(source(object), " + Send + 'static", " + 'static"), {
    error: "E0277",
  });
});
test("trait object: aggiungere Send rifiuta una cattura Rc", () => {
  run(
    replaceOnce(
      source(object),
      'let text = String::from("ready");',
      'let text = std::rc::Rc::new(String::from("ready"));',
    ),
    { error: "E0277" },
  );
});
test("RefCell trasferita non puo essere riusata dal mittente", () => {
  run(
    replaceOnce(
      source(transfer),
      "let items = worker.join().unwrap();",
      "assert_eq!(items.borrow().len(), 1); let items = worker.join().unwrap();",
    ),
    { error: "E0382" },
  );
});
test("scope: mut reference di Cell si trasferisce senza richiedere Sync", () => {
  run(`
    use std::{cell::Cell, thread};
    fn main() {
        let mut value = Cell::new(1);
        thread::scope(|scope| {
            let borrowed = &mut value;
            scope.spawn(move || borrowed.set(7)).join().unwrap();
        });
        assert_eq!(value.get(), 7);
    }
  `);
});
test("future: helper non esegue il corpo, un poll esplicito produce il valore", () => {
  let code = main(
    future,
    `
    let pending = requires_send(name_length());
    assert!(!ENTERED.load(std::sync::atomic::Ordering::SeqCst));
    drop(pending);
    assert!(!ENTERED.load(std::sync::atomic::Ordering::SeqCst));
    let mut pending = std::pin::pin!(requires_send(name_length()));
    let mut context = std::task::Context::from_waker(std::task::Waker::noop());
    assert_eq!(pending.as_mut().poll(&mut context), std::task::Poll::Ready(5));
    assert!(ENTERED.load(std::sync::atomic::Ordering::SeqCst));
  `,
  );
  code =
    "static ENTERED: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);\n" +
    code;
  code = replaceOnce(
    code,
    "let length = {",
    "ENTERED.store(true, std::sync::atomic::Ordering::SeqCst); let length = {",
  );
  run(code);
});
test("future: Rc catturato dall'esterno fallisce anche senza await", () => {
  run(
    main(
      future,
      `
    let data = Rc::new(String::from("local"));
    drop(requires_send(async move { drop(data); }));
  `,
    ),
    { errorText: /cannot be sent between threads safely/ },
  );
});
test("future: parametro Rc resta non Send prima del primo poll", () => {
  run(
    `
    use std::{future::{self, Future}, rc::Rc};
    fn require_send<F: Future + Send>(_: F) {}
    async fn work(data: Rc<String>) {
        drop(data);
        future::ready(()).await;
    }
    fn main() { require_send(work(Rc::new(String::from("local")))); }
  `,
    { errorText: /cannot be sent between threads safely/ },
  );
});
test("future Send puo restituire un output Rc", () => {
  run(
    main(
      future,
      `
    let mut pending = std::pin::pin!(requires_send(async { Rc::new(7) }));
    let mut context = std::task::Context::from_waker(std::task::Waker::noop());
    match pending.as_mut().poll(&mut context) {
        std::task::Poll::Ready(value) => assert_eq!(*value, 7),
        std::task::Poll::Pending => panic!("ready expected"),
    }
  `,
    ),
  );
});
test("future: un bound Send sull'output rifiuta Rc", () => {
  let code = main(future, "drop(requires_send(async { Rc::new(7) }));");
  code = replaceOnce(
    code,
    "F: Future + Send + 'static,",
    "F: Future + Send + 'static, F::Output: Send,",
  );
  run(code, { error: "E0277" });
});
test("future Send non deve essere Sync: RefCell posseduta", () => {
  run(
    main(
      future,
      `
    let data = std::cell::RefCell::new(7);
    let mut pending = std::pin::pin!(requires_send(async move {
        future::ready(()).await;
        data.into_inner()
    }));
    let mut context = std::task::Context::from_waker(std::task::Waker::noop());
    assert_eq!(pending.as_mut().poll(&mut context), std::task::Poll::Ready(7));
  `,
    ),
  );
});
test("marker LocalToken impedisce Send e Sync", () => {
  for (const trait of ["Send", "Sync"]) {
    run(
      main(
        local,
        "fn requires<T: " + trait + ">() {} requires::<LocalToken>();",
      ),
      { error: "E0277" },
    );
  }
});
test("marker PhantomData non alloca un Rc", () => {
  run(
    main(
      local,
      `
    assert_eq!(std::mem::size_of::<PhantomData<Rc<()>>>(), 0);
    assert_eq!(std::mem::align_of::<PhantomData<Rc<()>>>(), 1);
  `,
    ),
  );
});
test("negative impl non disponibile su stable", () => {
  run("struct Local; impl !Send for Local {} fn main() {}", { error: "E0658" });
});
test("Send non e un derive standard", () => {
  run("#[derive(Send)] struct Packet(u32); fn main() {}", {
    errorText: /cannot find derive macro.*Send/,
  });
});
