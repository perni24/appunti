import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const notePath = "Programmazione/Rust/Pagine/Threads.md";
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
const prefix = "appunti-rust-threads-";
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
  if (options.error) {
    assert.notEqual(compiled.status, 0);
    const diagnostics = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === options.error,
      ),
      compiled.stderr,
    );
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
const owned = "Trasferire dati e ricevere un risultato";
const result = "Distinguere un errore applicativo da un panic";
const panic = "Osservare un panic senza rilanciarlo";
const builder = "Configurare nome, stack e fallimento di creazione";
const sum = "Sommare pochi blocchi con ownership separata";
const scoped = "Prestare dati locali con thread scoped";
const borrow = "Spostare un riferimento non lo rende statico";
const rc = "Spostare Rc non lo rende Send";

test("baseline reale e inventario di otto programmi", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
});

test("YAML originale, template, gerarchia e fonti", () => {
  const original = launch("git", ["show", "HEAD:" + notePath], process.cwd());
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Threads",
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
  const nodes = [];
  function walk(node) {
    nodes.push(node);
    for (const child of node.children ?? []) walk(child);
  }
  walk(note.tree);
  assert.ok(!nodes.some((n) => n.type === "html"));
  for (const suffix of [
    "fn.spawn.html",
    "struct.JoinHandle.html",
    "fn.scope.html",
    "struct.Builder.html",
    "fn.available_parallelism.html",
  ])
    assert.ok(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url === "https://doc.rust-lang.org/std/thread/" + suffix,
      ),
    );
});

test("programma move: dati posseduti e risultato", () => {
  assert.equal(run(source(owned)), "RUST: 4\n");
});
test("programma Result: parsing valido", () => {
  assert.equal(run(source(result)), "value=42\n");
});
test("programma panic: hook visibile ma main prosegue", () => {
  assert.equal(
    run(source(panic), { stderr: /demo worker failure/ }),
    "panic observed; main continues\n",
  );
});
test("programma Builder: nome, stack richiesto e risultato", () => {
  assert.equal(run(source(builder)), "total=6\n");
});
test("programma somma: percorso valido, vuoto e overflow", () => {
  assert.equal(run(source(sum)), "sum=21; empty=0; overflow detected\n");
});
test("programma scoped: prestiti mutabili disgiunti e riuso", () => {
  assert.equal(run(source(scoped)), "[11, 12, 6, 8]\n");
});
test("controesempio: move di un riferimento locale resta E0597", () => {
  run(source(borrow), { error: "E0597" });
});
test("controesempio: Rc non Send resta E0277", () => {
  run(source(rc), { error: "E0277" });
});
test("errore applicativo resta nel Result interno", () => {
  assert.match(
    run(replaceOnce(source(result), '"42"', '"bad"')),
    /^invalid input: /,
  );
});
test("panic nel worker raggiunge il ramo esterno", () => {
  assert.equal(
    run(
      replaceOnce(
        source(result),
        '"42".parse::<u32>()',
        '{ panic!("parse worker failed"); #[allow(unreachable_code)] "42".parse::<u32>() }',
      ),
      { stderr: /parse worker failed[\s\S]*worker panicked/ },
    ),
    "",
  );
});
test("il valore mosso non torna accessibile tramite join", () => {
  run(
    replaceOnce(
      source(owned),
      'println!("{text}: {count}");',
      'println!("{data}");',
    ),
    { error: "E0382" },
  );
});
test("anche il risultato del thread deve essere Send", () => {
  run(
    "fn main() { let h = std::thread::spawn(|| std::rc::Rc::new(1)); h.join().unwrap(); }",
    { error: "E0277" },
  );
});
test("join consuma l'handle e non puo essere ripetuto", () => {
  run(
    replaceOnce(
      source(owned),
      'println!("{text}: {count}");',
      "handle.join().unwrap();",
    ),
    { error: "E0382" },
  );
});
test("correzione del prestito: trasferire la String posseduta", () => {
  assert.equal(
    run(
      replaceOnce(
        source(borrow),
        "let borrowed = &data;",
        "let borrowed = data;",
      ),
    ),
    "",
  );
});
test("correzione del prestito: scope e risultato che prende in prestito", () => {
  assert.equal(
    run(`use std::thread;
fn main() {
    let data = String::from("rust");
    let borrowed = thread::scope(|s| s.spawn(|| data.as_str()).join().unwrap());
    assert_eq!(borrowed, "rust");
    assert_eq!(data, "rust");
}`),
    "",
  );
});
test("correzione Rc: Arc<String> si puo trasferire", () => {
  let code = replaceOnce(source(rc), "rc::Rc", "sync::Arc");
  code = replaceOnce(code, "Rc::new", "Arc::new");
  assert.equal(run(code), "");
});
test("scope non permette due prestiti mutabili sovrapposti", () => {
  run(
    `fn main() {
    let mut value = 0;
    std::thread::scope(|s| {
        s.spawn(|| value += 1);
        s.spawn(|| value += 2);
    });
}`,
    { error: "E0499" },
  );
});
test("somma: input vuoti, limite e segni", () => {
  assert.equal(
    run(
      main(
        sum,
        `
    assert_eq!(parallel_sum(vec![vec![], vec![]]), Ok(0));
    assert_eq!(parallel_sum(vec![vec![1]; 4]), Ok(4));
    assert_eq!(parallel_sum(vec![vec![]; 5]), Err(SumError::TooManyWorkers));
    assert_eq!(parallel_sum(vec![vec![-4, 1], vec![2]]), Ok(-1));
    assert_eq!(parallel_sum(vec![vec![i64::MIN], vec![i64::MAX]]), Ok(-1));
`,
      ),
    ),
    "",
  );
});
test("somma: overflow locale, totale e compensazione tardiva", () => {
  const code = main(
    sum,
    `
    assert_eq!(parallel_sum(vec![vec![i64::MAX, 1]]), Err(SumError::Overflow));
    assert_eq!(parallel_sum(vec![vec![i64::MIN], vec![-1]]), Err(SumError::Overflow));
    assert_eq!(parallel_sum(vec![vec![i64::MAX, 1, -1]]), Err(SumError::Overflow));
`,
  );
  assert.equal(run(code), "");
  assert.equal(
    run(code, { args: ["-C", "opt-level=3", "-C", "overflow-checks=no"] }),
    "",
  );
});
test("somma: panic del worker restituito dopo i join", () => {
  let code = main(
    sum,
    "assert_eq!(parallel_sum(vec![vec![-999], vec![1]]), Err(SumError::WorkerPanicked));",
  );
  code = replaceOnce(
    code,
    "scope.spawn(move || {",
    'scope.spawn(move || { if chunk.first() == Some(&-999) { panic!("injected worker panic"); }',
  );
  assert.equal(run(code, { stderr: /injected worker panic/ }), "");
});
test("scope attende automaticamente anche senza conservare gli handle", () => {
  assert.equal(
    run(`fn main() {
    let mut result = String::new();
    std::thread::scope(|s| { s.spawn(|| result.push_str("completed")); });
    assert_eq!(result, "completed");
}`),
    "",
  );
});
test("panic scoped automatico propaga; join esplicito lo gestisce", () => {
  run(
    'fn main() { std::thread::scope(|s| { s.spawn(|| panic!("scoped failure")); }); }',
    { exitCode: 101, stderr: /scoped failure[\s\S]*scoped thread panicked/ },
  );
  assert.equal(
    run(
      'fn main() { std::thread::scope(|s| { assert!(s.spawn(|| panic!("handled failure")).join().is_err()); }); println!("continued"); }',
      { stderr: /handled failure/ },
    ),
    "continued\n",
  );
});
test("drop di JoinHandle non cancella: protocollo senza sleep", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (release, wait) = mpsc::channel();
    let (done, result) = mpsc::channel();
    let handle = thread::spawn(move || {
        wait.recv_timeout(Duration::from_secs(10)).unwrap();
        done.send(42).unwrap();
    });
    drop(handle);
    release.send(()).unwrap();
    assert_eq!(result.recv_timeout(Duration::from_secs(10)).unwrap(), 42);
}`),
    "",
  );
});
test("main termina il processo anche con un worker ancora attivo", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (ready, wait) = mpsc::channel();
    let _handle = thread::spawn(move || {
        ready.send(()).unwrap();
        loop { thread::park(); }
    });
    wait.recv_timeout(Duration::from_secs(10)).unwrap();
    println!("main exits");
}`),
    "main exits\n",
  );
});
test("is_finished osserva un worker bloccato senza liberarlo", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (release, wait) = mpsc::channel();
    let handle = thread::spawn(move || {
        wait.recv_timeout(Duration::from_secs(10)).unwrap(); 7
    });
    assert!(!handle.is_finished());
    release.send(()).unwrap();
    assert_eq!(handle.join().unwrap(), 7);
}`),
    "",
  );
});
test("Builder con nome nullo causa panic, non io::Error", () => {
  run(
    replaceOnce(
      source(builder),
      'String::from("sum-worker")',
      'String::from("bad\\0name")',
    ),
    { exitCode: 101, stderr: /null bytes|nul byte/ },
  );
});
test("Builder distingue il panic del worker dall'errore di creazione", () => {
  assert.equal(
    run(
      replaceOnce(
        source(builder),
        "(1..=3).sum::<u32>()",
        'panic!("builder worker failure"); #[allow(unreachable_code)] 6_u32',
      ),
      { exitCode: 1, stderr: /builder worker failure[\s\S]*worker panicked/ },
    ),
    "",
  );
});
test("available_parallelism: stima positiva o fallback limitato", () => {
  assert.equal(
    run(`fn main() {
    let workers = std::thread::available_parallelism().map(|n| n.get()).unwrap_or(1).min(4);
    assert!((1..=4).contains(&workers));
}`),
    "",
  );
});
