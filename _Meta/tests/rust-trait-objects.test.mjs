import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Trait objects e dyn Trait"];
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
const prefix = "appunti-rust-dyn-";
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

const shared = "Riferimenti a implementazioni diverse";
const owned = "Factory e collezione con ownership";
const lifetime = "Un Box puo possedere un oggetto che prende in prestito dati";
const logger = "Logger sostituibile, mutabile e fallibile";
const iterator = "Tipo associato fissato nell'interfaccia";
const arc = "Ownership condivisa e requisiti per i thread";
const invalid = "Un metodo che richiede il tipo concreto nel risultato";

function extend(heading, extra) {
  const signature =
    heading === logger ? "fn main() -> io::Result<()> {" : "fn main() {";
  return replaceOnce(source(0, heading), signature, signature + "\n" + extra);
}
test("toolchain reale e inventario: sette programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 7);
});
test("dyn: metadati, gerarchia, fonti e prerequisito non ciclico", () => {
  const note = notes[0];
  for (const [key, value] of Object.entries({
    area: "Programmazione",
    topic: "Rust",
    type: "technical-note",
    status: "non revisionato",
    publish: true,
    date: "2026-05-21",
  }))
    assert.equal(note.data[key], value);
  assert.deepEqual(note.data.prerequisites, [
    "[[Programmazione/Rust/Pagine/Traits]]",
  ]);
  assert.ok(
    note.data.related.includes("[[Programmazione/Rust/Pagine/Object safety]]"),
  );
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    note.data.title,
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
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === heading),
      heading,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(
    note.source,
    /https:\/\/doc\.rust-lang\.org\/reference\/types\/trait-object/,
  );
  assert.doesNotMatch(note.source, /@B[T]@/);
});
for (const [heading, code] of blocks[0])
  test("Programma della nota: " + heading, () => {
    const output = run(code, heading === invalid ? { error: "E0038" } : {});
    if (heading !== invalid)
      assert.equal(output, heading === logger ? "avvio\npronto\n" : "");
  });
test("dyn: vista condivisa e stesso buffer, senza copie del testo", () =>
  run(
    extend(
      shared,
      `
    for value in ["", "x", "\u{e8}", "a\nb"] {
        let button = Button { caption: value.into() };
        let object: &dyn Draw = &button;
        assert_eq!(render(object), value);
        assert_eq!(render(object).as_ptr(), button.caption.as_ptr());
        assert_eq!(std::mem::size_of_val(object), std::mem::size_of_val(&button));
    }
`,
    ),
  ));
test("dyn: una terza implementazione usa lo stesso consumer", () =>
  run(
    extend(
      shared,
      `
    struct Badge;
    impl Draw for Badge { fn draw(&self) -> &str { "badge" } }
    assert_eq!(render(&Badge), "badge");
`,
    ),
  ));
test("dyn: il prestito impedisce il move della sorgente ancora usata", () =>
  run(
    extend(
      shared,
      `
    let value = Button { caption: "local".into() };
    let object: &dyn Draw = &value;
    drop(value);
    assert_eq!(render(object), "local");
`,
    ),
    { error: "E0505" },
  ));
test("dyn: i campi concreti non sono esposti dal trait object", () =>
  run(
    extend(
      shared,
      `
    let value = Button { caption: "local".into() };
    let object: &dyn Draw = &value;
    println!("{}", object.caption);
`,
    ),
    { error: "E0609" },
  ));
test("dyn: i metodi inerenti non sono esposti dal trait object", () =>
  run(
    extend(
      shared,
      `
    impl Button { fn caption_len(&self) -> usize { self.caption.len() } }
    let value = Button { caption: "local".into() };
    let object: &dyn Draw = &value;
    println!("{}", object.caption_len());
`,
    ),
    { error: "E0599" },
  ));
test("dyn: un consumer generico con ?Sized puo accettare il valore erased", () =>
  run(
    extend(
      shared,
      `
    fn generic<D: Draw + ?Sized>(item: &D) -> &str { item.draw() }
    let value = Button { caption: "local".into() };
    let object: &dyn Draw = &value;
    assert_eq!(generic(object), "local");
`,
    ),
  ));
test("dyn: Sized implicito del consumer generico rifiuta dyn Draw", () =>
  run(
    extend(
      shared,
      `
    fn generic<D: Draw>(item: &D) -> &str { item.draw() }
    let value = Button { caption: "local".into() };
    let object: &dyn Draw = &value;
    assert_eq!(generic(object), "local");
`,
    ),
    { error: "E0277" },
  ));
test("dyn: un parametro per valore non puo avere il tipo unsized", () =>
  run(
    extend(shared, "fn invalid_value(item: dyn Draw) { let _ = item.draw(); }"),
    { error: "E0277" },
  ));
test("dyn: Vec richiede elementi Sized, non dyn Draw diretto", () =>
  run(extend(shared, "let _items: Vec<dyn Draw> = Vec::new();"), {
    error: "E0277",
  }));
test("dyn: alternare factory conserva ordine e scelta delle implementazioni", () =>
  run(
    extend(
      owned,
      `
    let flags = [false, true, true, false, false];
    let items: Vec<Box<dyn Draw>> = flags.into_iter().map(boxed).collect();
    for (item, flag) in items.iter().zip(flags) {
        assert_eq!(render(item.as_ref()), if flag { "button" } else { "text" });
    }
`,
    ),
  ));
test("dyn: Box possiede il tipo concreto e ne esegue Drop una sola volta", () =>
  run(
    extend(
      owned,
      `
    use std::cell::Cell;
    use std::rc::Rc;
    struct Tracked { drops: Rc<Cell<usize>> }
    impl Draw for Tracked { fn draw(&self) -> &str { "tracked" } }
    impl Drop for Tracked {
        fn drop(&mut self) { self.drops.set(self.drops.get() + 1); }
    }
    let drops = Rc::new(Cell::new(0));
    let object: Box<dyn Draw> = Box::new(Tracked { drops: Rc::clone(&drops) });
    assert_eq!(object.draw(), "tracked");
    assert_eq!(drops.get(), 0);
    drop(object);
    assert_eq!(drops.get(), 1);
`,
    ),
  ));
test("dyn: Box consente i metodi via Deref ma non implementa automaticamente Draw", () =>
  run(
    extend(
      owned,
      `
    fn consume<D: Draw>(_item: D) {}
    consume(boxed(true));
`,
    ),
    { error: "E0277" },
  ));
test("dyn: impl Trait non unifica Button e Text", () =>
  run(
    extend(
      owned,
      `
    fn opaque(use_button: bool) -> impl Draw {
        if use_button { Button("b".into()) } else { Text("t".into()) }
    }
`,
    ),
    { error: "E0308" },
  ));
test("dyn: lifetime del box segue il dato prestato, anche vuoto o Unicode", () =>
  run(
    extend(
      lifetime,
      `
    for input in ["", "locale", "\u{e8}", "\u{1f680}"] {
        let text = String::from(input);
        let label = make_label(&text);
        assert_eq!(label.label(), input);
        assert_eq!(label.label().as_ptr(), text.as_ptr());
    }
`,
    ),
  ));
test("dyn: omettere il bound nella firma richiede una lifetime static", () =>
  run(
    replaceOnce(
      source(0, lifetime),
      "-> Box<dyn Label + 'a>",
      "-> Box<dyn Label>",
    ),
    { message: /lifetime may not live long enough/, detail: /'static/ },
  ));
test("dyn: il box prestato non puo uscire dal blocco della sorgente", () =>
  run(
    extend(
      lifetime,
      `
    let label;
    {
        let local = String::from("local");
        label = make_label(&local);
    }
    assert_eq!(label.label(), "local");
`,
    ),
    { error: "E0597" },
  ));
test("dyn: il box non consente di modificare la stringa mentre la vista e usata", () =>
  run(
    extend(
      lifetime,
      `
    let mut local = String::from("local");
    let label = make_label(&local);
    local.push('!');
    assert_eq!(label.label(), "local");
`,
    ),
    { error: "E0502" },
  ));
test("dyn: possedere i dati consente Box static anche dopo drop dell'input", () =>
  run(
    extend(
      lifetime,
      `
    struct OwnedLabel(String);
    impl Label for OwnedLabel { fn label(&self) -> &str { &self.0 } }
    fn owned(text: &str) -> Box<dyn Label> { Box::new(OwnedLabel(text.into())) }
    let input = String::from("local");
    let result = owned(&input);
    drop(input);
    assert_eq!(result.label(), "local");
`,
    ),
  ));
test("dyn: un riferimento a trait object puo prestare dati non static", () =>
  run(
    extend(
      lifetime,
      `
    fn view(item: &dyn Label) -> &str { item.label() }
    let input = String::from("local");
    let concrete = BorrowedLabel(&input);
    assert_eq!(view(&concrete), "local");
`,
    ),
  ));
test("Logger: memoria preserva ordine, duplicati e testo senza sanitizzarlo", () =>
  run(
    extend(
      logger,
      `
    let mut memory = MemoryLogger::default();
    for message in ["", "x", "x", "a\nb", "\u{e8}", "\0"] {
        memory.log(message)?;
    }
    assert_eq!(memory.messages, ["", "x", "x", "a\nb", "\u{e8}", "\0"]);
`,
    ),
  ));
for (const failureAt of [0, 1])
  test(
    "Logger: errore alla chiamata " +
      (failureAt + 1) +
      " propagato senza rollback",
    () =>
      run(
        extend(
          logger,
          `
    struct Failing { calls: usize, fail_at: usize, messages: Vec<String> }
    impl Logger for Failing {
        fn log(&mut self, message: &str) -> io::Result<()> {
            let current = self.calls;
            self.calls += 1;
            if current == self.fail_at {
                return Err(io::Error::new(io::ErrorKind::PermissionDenied, "denied"));
            }
            self.messages.push(message.to_owned());
            Ok(())
        }
    }
    let mut failing = Failing { calls: 0, fail_at: ${failureAt}, messages: Vec::new() };
    let error = run(&mut failing).unwrap_err();
    assert_eq!(error.kind(), io::ErrorKind::PermissionDenied);
    assert_eq!(error.to_string(), "denied");
    assert_eq!(failing.calls, ${failureAt + 1});
    assert_eq!(failing.messages, vec!["avvio"; ${failureAt}]);
`,
        ),
      ),
  );
test("Logger: receiver condiviso non consente la mutazione del trait", () =>
  run(
    extend(
      logger,
      `
    let value = MemoryLogger::default();
    let object: &dyn Logger = &value;
    object.log("x")?;
`,
    ),
    { error: "E0596" },
  ));
test("Logger: il consumer richiede un riferimento mutabile", () =>
  run(
    extend(
      logger,
      `
    let value = MemoryLogger::default();
    run(&value)?;
`,
    ),
    { error: "E0308" },
  ));
test("Logger: due prestiti mutabili ancora usati vengono rifiutati", () =>
  run(
    extend(
      logger,
      `
    let mut value = MemoryLogger::default();
    let first: &mut dyn Logger = &mut value;
    let second: &mut dyn Logger = &mut value;
    first.log("a")?;
    second.log("b")?;
`,
    ),
    { error: "E0499" },
  ));
test("Iterator erased: consumo parziale e fine ripetuta preservati", () =>
  run(
    extend(
      iterator,
      `
    for reverse in [false,true] {
        let mut values = numbers(reverse);
        assert_eq!(values.next(), Some(if reverse {3} else {1}));
        let rest: Vec<u32> = values.by_ref().collect();
        assert_eq!(rest, if reverse {vec![2,1]} else {vec![2,3]});
        assert_eq!(values.next(), None);
        assert_eq!(values.next(), None);
    }
`,
    ),
  ));
test("Iterator erased: Item non puo essere omesso", () =>
  run(
    replaceOnce(
      source(0, iterator),
      "dyn Iterator<Item = u32>",
      "dyn Iterator",
    ),
    { error: "E0191" },
  ));
test("Iterator erased: Item richiesto deve coincidere con l'implementazione", () =>
  run(
    replaceOnce(
      source(0, iterator),
      "dyn Iterator<Item = u32>",
      "dyn Iterator<Item = i32>",
    ),
    { error: "E0271" },
  ));
for (const marker of ["Send", "Sync"])
  test(
    "Arc erased: omettere " + marker + " impedisce il trasferimento al thread",
    () =>
      run(
        replaceOnce(
          source(0, arc),
          "dyn Label + Send + Sync",
          marker === "Send" ? "dyn Label + Sync" : "dyn Label + Send",
        ),
        { error: "E0277" },
      ),
  );
test("Arc erased: il marker non rende Send o Sync un contenuto Rc", () => {
  let code = replaceOnce(
    source(0, arc),
    "struct Name(String);",
    "struct Name(std::rc::Rc<String>);",
  );
  code = replaceOnce(
    code,
    'Name(String::from("worker"))',
    'Name(std::rc::Rc::new(String::from("worker")))',
  );
  run(code, { error: "E0277" });
});
test("Arc erased: clone condivide l'istanza e Drop aspetta l'ultimo proprietario", () =>
  run(
    extend(
      arc,
      `
    use std::sync::atomic::{AtomicUsize, Ordering};
    struct Tracked(Arc<AtomicUsize>);
    impl Label for Tracked { fn label(&self) -> &str { "tracked" } }
    impl Drop for Tracked {
        fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); }
    }
    let drops = Arc::new(AtomicUsize::new(0));
    let original: Arc<dyn Label + Send + Sync> =
        Arc::new(Tracked(Arc::clone(&drops)));
    let cloned = Arc::clone(&original);
    assert!(Arc::ptr_eq(&original, &cloned));
    let worker = thread::spawn(move || assert_eq!(cloned.label(), "tracked"));
    worker.join().unwrap();
    assert_eq!(drops.load(Ordering::SeqCst), 0);
    drop(original);
    assert_eq!(drops.load(Ordering::SeqCst), 1);
`,
    ),
  ));
test("dyn compatibility: Self Sized sul metodo consente il trait object", () =>
  run(
    replaceOnce(
      source(0, invalid),
      "fn create(&self) -> Self;",
      "fn create(&self) -> Self where Self: Sized;",
    ),
  ));
test("dyn compatibility: il metodo escluso non e chiamabile sul trait object", () => {
  let code = replaceOnce(
    source(0, invalid),
    "fn create(&self) -> Self;",
    "fn create(&self) -> Self where Self: Sized;",
  );
  code = replaceOnce(
    code,
    "let _factory: &dyn Factory = &item;",
    "let factory: &dyn Factory = &item;\n    factory.create();",
  );
  run(code, { message: /cannot be invoked on a trait object/ });
});
test("dyn: due trait ordinari non si sommano direttamente", () =>
  run(
    `
use std::io::{Read, Write};
fn consume(_value: &mut (dyn Read + Write)) {}
fn main() {}
`,
    { error: "E0225" },
  ));
test("dyn: un trait base con supertrait compatibili espone le due interfacce", () =>
  run(`
use std::io::{Cursor, Read, Write};
trait ReadWrite: Read + Write {}
impl<T: Read + Write> ReadWrite for T {}
fn main() {
    let mut data = Cursor::new(vec![0u8; 3]);
    {
        let object: &mut dyn ReadWrite = &mut data;
        object.write_all(b"abc").unwrap();
    }
    data.set_position(0);
    let object: &mut dyn ReadWrite = &mut data;
    let mut bytes = [0u8;3];
    object.read_exact(&mut bytes).unwrap();
    assert_eq!(&bytes, b"abc");
}
`));
