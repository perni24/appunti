import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Default"];
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
const prefix = "appunti-rust-default-";
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

const derived = "Derive e costruzione esplicita";
const mode = "Enum con una variante iniziale dichiarata";
const queue = "Generici senza bound superflui";
const config = "Valori di dominio e opzioni personalizzate";
const fallback = "Valori mancanti e inserimento nelle mappe";
const take = "Estrarre un campo lasciando un valore valido";
const bound = "Derive troppo restrittivo sul parametro generico";
const variant = "Una variante con dati non puo usare questo derive";
const from = (heading) => source(0, heading);
const inject = (heading, code) => probe(0, heading, code);

test("baseline e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("metadati invariati, struttura tecnica e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Default.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Default",
  ]);
  for (const section of [
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
      headings.some((n) => n.depth === 2 && text(n) === section),
      section,
    );
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  const nodes = [];
  function walk(n) {
    nodes.push(n);
    for (const c of n.children ?? []) walk(c);
  }
  walk(note.tree);
  assert(!nodes.some((n) => n.type === "html"));
  for (const value of ["T: Default", "Option<T>", "Vec<T>::default()"])
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  for (const page of [
    "trait.Default.html",
    "struct-expr.html#functional-update-syntax",
    "enum.Option.html",
    "enum.Entry.html#method.or_default",
    "enum.Result.html#method.unwrap_or_default",
    "fn.take.html",
    "fn.replace.html",
  ])
    assert(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url.startsWith("https://doc.rust-lang.org/") &&
          n.url.endsWith(page),
      ),
      page,
    );
});
for (const heading of [derived, mode, queue, config, fallback, take])
  test("programma completo: " + heading, () =>
    assert.equal(run(from(heading)), ""),
  );
test("controesempio: derive aggiunge Job Default", () =>
  run(from(bound), { error: "E0277", detail: /Job.*Default/ }));
test("controesempio: default su variante con dati", () =>
  run(from(variant), { message: /unit.*variant/ }));
test("correzione: implementazione generica senza Job Default", () => {
  const valid = from(queue).slice(0, from(queue).indexOf("struct Job"));
  const original = from(bound);
  run(valid + original.slice(original.indexOf("struct Job")));
});
test("correzione: default manuale con dati", () => {
  const code = from(variant)
    .replace("#[derive(Default)]\n", "")
    .replace("    #[default]\n", "");
  run(
    replaceOnce(
      code,
      "fn main() {}",
      String.raw`
    impl Default for Mode {
        fn default() -> Self { Self::Custom(3) }
    }
    fn main() { assert!(matches!(Mode::default(), Mode::Custom(3))); }
  `,
    ),
  );
});
test("derive e impl manuale dello stesso Default sono in conflitto", () => {
  run(
    replaceOnce(
      from(config),
      "#[derive(Debug, PartialEq)]",
      "#[derive(Debug, PartialEq, Default)]",
    ),
    { error: "E0119" },
  );
});
test("Default non riempie campi omessi senza base", () => {
  run(inject(derived, "let _ = Config { debug: true };"), { error: "E0063" });
});
test("Default generico ha bisogno del relativo bound", () => {
  run(replaceOnce(from(derived), "fn make<T: Default>()", "fn make<T>()"), {
    error: "E0599",
  });
});
test("Default senza tipo inferibile non sceglie una struct", () => {
  run("fn main() { let _value = Default::default(); }", { error: "E0790" });
});
test("derive non chiama un new omonimo", () => {
  const code =
    from(derived) +
    "\nimpl Config { fn new() -> Self { Self { debug: true, retries: 99 } } }\n";
  run(
    replaceOnce(
      code,
      "fn main() {",
      "fn main() {\nassert_eq!(Config::new().retries, 99);\nassert_eq!(Config::default().retries, 0);",
    ),
  );
});
test("Queue manuale: Option e Vec non richiedono Default o Clone degli elementi", () => {
  run(
    inject(
      queue,
      String.raw`
    let empty: Option<Job> = Default::default();
    let values: Vec<Job> = Default::default();
    assert!(empty.is_none());
    assert!(values.is_empty());
    let mut first = Queue::<Job>::default();
    first.items.push(Job { id: 42 });
    let second = Queue::<Job>::default();
    assert!(second.items.is_empty());
    let moved = std::mem::take(&mut first.items);
    assert_eq!(moved[0].id, 42);
    assert!(first.items.is_empty());
  `,
    ),
  );
});
test("enum: omettere default non seleziona la prima variante", () => {
  run(replaceOnce(from(mode), "    #[default]\n", ""), { error: "E0665" });
});
test("enum: due varianti default sono rifiutate", () => {
  run(replaceOnce(from(mode), "    Debug,", "    #[default]\n    Debug,"), {
    message: /multiple.*default/i,
  });
});
test("enum: default e non_exhaustive sulla stessa variante sono incompatibili", () => {
  run(
    replaceOnce(
      from(mode),
      "    #[default]",
      "    #[default]\n    #[non_exhaustive]",
    ),
    { message: /default variant must be exhaustive/ },
  );
});
test("enum: non_exhaustive sull'enum intero non vieta il derive", () => {
  run(replaceOnce(from(mode), "enum Mode {", "#[non_exhaustive]\nenum Mode {"));
});
test("config: default non impedisce una modifica non valida per il dominio", () => {
  run(
    inject(
      config,
      String.raw`
    let custom = ServerConfig { workers: 0, ..Default::default() };
    assert_eq!(custom.workers, 0);
    let mut changed = ServerConfig::default();
    changed.workers = 0;
    assert_eq!(changed.workers, 0);
  `,
    ),
  );
});
test("config: update sposta host, base non resta utilizzabile interamente", () => {
  run(
    replaceOnce(
      from(config),
      "assert_eq!(base.port, 8080);",
      'assert_eq!(base.port, 8080);\n    println!("{:?}", base);',
    ),
    { error: "E0382" },
  );
});
test("config: sostituendo host dalla base si copiano soltanto campi Copy", () => {
  run(
    inject(
      config,
      String.raw`
    let base = ServerConfig::default();
    let updated = ServerConfig { host: "localhost".into(), ..base };
    assert_eq!(updated.host, "localhost");
    assert_eq!(base, ServerConfig::default());
  `,
    ),
  );
});
test("update non aggira i campi privati di un altro modulo", () => {
  run(
    String.raw`
    mod settings {
        #[derive(Default)]
        pub struct Config { pub debug: bool, private: u32 }
    }
    fn main() {
        let _ = settings::Config { debug: true, ..Default::default() };
    }
  `,
    { error: "E0451" },
  );
});
test("update esegue tutto Default anche se sostituisce il campo costoso", () => {
  run(String.raw`
    use std::sync::atomic::{AtomicUsize, Ordering};
    static CREATED: AtomicUsize = AtomicUsize::new(0);
    static DROPPED: AtomicUsize = AtomicUsize::new(0);
    struct Cost;
    impl Default for Cost {
        fn default() -> Self { CREATED.fetch_add(1, Ordering::SeqCst); Self }
    }
    impl Drop for Cost {
        fn drop(&mut self) { DROPPED.fetch_add(1, Ordering::SeqCst); }
    }
    #[derive(Default)]
    struct Settings { cost: Cost, enabled: bool }
    fn main() {
        let value = Settings { cost: Cost, ..Default::default() };
        assert_eq!(CREATED.load(Ordering::SeqCst), 1);
        assert_eq!(DROPPED.load(Ordering::SeqCst), 1);
        assert!(!value.enabled);
        let _ = &value.cost;
        drop(value);
        assert_eq!(DROPPED.load(Ordering::SeqCst), 2);
    }
  `);
});
test("Option: fallback vuoto, Unicode e trasferimento della String", () => {
  run(
    inject(
      fallback,
      String.raw`
    for input in ["", "caff\u{e8}", "a\0b", " "] {
        let text = String::from(input);
        let ptr = text.as_ptr();
        let result = label_or_empty(Some(text));
        assert_eq!(result, input);
        assert_eq!(result.as_ptr(), ptr);
    }
  `,
    ),
  );
});
const counted = String.raw`
    use std::sync::atomic::{AtomicUsize, Ordering};
    static CALLS: AtomicUsize = AtomicUsize::new(0);
    struct Value(u32);
    impl Default for Value {
        fn default() -> Self { CALLS.fetch_add(1, Ordering::SeqCst); Self(0) }
    }
`;
test("Option: unwrap_or e eager, unwrap_or_default ed else sono lazy", () => {
  run(
    counted +
      String.raw`
    fn main() {
        let value = Some(Value(7)).unwrap_or(Value::default());
        assert_eq!(value.0, 7);
        assert_eq!(CALLS.load(Ordering::SeqCst), 1);
        assert_eq!(Some(Value(8)).unwrap_or_default().0, 8);
        assert_eq!(Some(Value(9)).unwrap_or_else(Value::default).0, 9);
        assert_eq!(CALLS.load(Ordering::SeqCst), 1);
        assert_eq!(None::<Value>.unwrap_or_default().0, 0);
        assert_eq!(None::<Value>.unwrap_or_else(Value::default).0, 0);
        assert_eq!(CALLS.load(Ordering::SeqCst), 3);
        let empty: Option<Value> = Default::default();
        assert!(empty.is_none());
        assert_eq!(CALLS.load(Ordering::SeqCst), 3);
    }
  `,
  );
});
test("Entry: default solo per chiave assente, vecchio valore conservato", () => {
  run(
    counted +
      String.raw`
    fn main() {
        let mut map = std::collections::HashMap::<&str, Value>::new();
        map.entry("a").or_default().0 = 7;
        assert_eq!(map.entry("a").or_default().0, 7);
        assert_eq!(CALLS.load(Ordering::SeqCst), 1);
        assert_eq!(map.entry("b").or_default().0, 0);
        assert_eq!(CALLS.load(Ordering::SeqCst), 2);
    }
  `,
  );
});
test("Result: unwrap_or_default scarta Err e non costruisce fallback per Ok", () => {
  run(
    counted +
      String.raw`
    fn main() {
        let ok: Result<Value, &str> = Ok(Value(7));
        assert_eq!(ok.unwrap_or_default().0, 7);
        assert_eq!(CALLS.load(Ordering::SeqCst), 0);
        let error: Result<Value, &str> = Err("invalid");
        assert_eq!(error.unwrap_or_default().0, 0);
        assert_eq!(CALLS.load(Ordering::SeqCst), 1);
    }
  `,
  );
});
test("Result non implementa Default solo perche T ed E lo implementano", () => {
  run("fn main() { let _: Result<String, String> = Default::default(); }", {
    error: "E0277",
  });
});
test("mem take trasferisce allocazione, clear la conserva nel vecchio Vec", () => {
  run(
    inject(
      take,
      String.raw`
    let mut batch = Batch::default();
    batch.pending.reserve(16);
    batch.pending.push("owned".into());
    let pointer = batch.pending.as_ptr();
    let capacity = batch.pending.capacity();
    let mut old = batch.take_pending();
    assert_eq!(old.as_ptr(), pointer);
    assert_eq!(old.capacity(), capacity);
    assert_eq!(batch.pending.capacity(), 0);
    old.clear();
    assert_eq!(old.capacity(), capacity);
    assert_eq!(old.as_ptr(), pointer);
    assert!(batch.take_pending().is_empty());
  `,
    ),
  );
});
test("mem take non richiede Clone e non distrugge gli elementi estratti", () => {
  run(String.raw`
    use std::cell::Cell;
    struct Item<'a>(&'a Cell<u32>);
    impl Drop for Item<'_> { fn drop(&mut self) { self.0.set(self.0.get()+1); } }
    fn main() {
        let count = Cell::new(0);
        let mut values = vec![Item(&count)];
        let old = std::mem::take(&mut values);
        assert!(values.is_empty());
        assert_eq!(count.get(), 0);
        drop(old);
        assert_eq!(count.get(), 1);
    }
  `);
});
test("mem replace e Option take funzionano senza Default del contenuto", () => {
  run(String.raw`
    struct Required(u32);
    fn main() {
        let mut value = Required(1);
        let old = std::mem::replace(&mut value, Required(2));
        assert_eq!(old.0, 1);
        assert_eq!(value.0, 2);
        let mut optional = Some(Required(3));
        assert_eq!(optional.take().unwrap().0, 3);
        assert!(optional.is_none());
    }
  `);
});
test("mem take del contenuto stesso richiede Default", () => {
  run(
    "struct Required(u32); fn main() { let mut v = Required(1); let _ = std::mem::take(&mut v); }",
    { error: "E0277" },
  );
});
test("Default non e dyn compatible", () => {
  run("fn inspect(_: &dyn Default) {} fn main() {}", { error: "E0038" });
});
test("default puo fare panic: la firma non garantisce successo", () => {
  run(
    'struct Bad; impl Default for Bad { fn default() -> Self { panic!("default failed"); } } fn main() { let _ = Bad::default(); }',
    { panic: /default failed/ },
  );
});
test("mutazione: un default retries errato viene rilevato dagli assert", () => {
  run(replaceOnce(from(config), "retries: 3,", "retries: 0,"), {
    panic: /assertion .* failed/,
  });
});
