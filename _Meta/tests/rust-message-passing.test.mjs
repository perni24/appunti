import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const notePath = "Programmazione/Rust/Pagine/Message passing.md";
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
const prefix = "appunti-rust-message-passing-";
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

const transfer = "Trasferire una String e attendere il produttore";
const states = "Distinguere vuoto, timeout e disconnessione";
const full = "Gestire una coda piena senza perdere il valore";
const rendezvous = "Usare un canale senza buffer";
const producers = "Raccogliere messaggi da piu produttori";
const worker = "Definire comandi e arrestare un worker";
const reply = "Richiesta e risposta esplicita";
const moved = "Riutilizzare una String dopo send";
const receiver = "Clonare il receiver standard";

test("baseline Rust e nove programmi estratti", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 9);
});
test("frontmatter invariato, template, gerarchia e fonti", () => {
  const original = launch("git", ["show", "HEAD:" + notePath], process.cwd());
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Message passing",
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
    "fn.channel.html",
    "fn.sync_channel.html",
    "struct.Sender.html",
    "struct.Receiver.html",
    "struct.SyncSender.html",
    "enum.TrySendError.html",
    "enum.TryRecvError.html",
    "enum.RecvTimeoutError.html",
  ])
    assert.ok(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url === "https://doc.rust-lang.org/std/sync/mpsc/" + suffix,
      ),
      suffix,
    );
});

for (const [name, output] of [
  [transfer, "received=ciao\n"],
  [states, "empty -> timeout -> value -> disconnected\n"],
  [full, "full handled; pending value retained\n"],
  [rendezvous, "rendezvous completed\n"],
  [producers, "received=6\n"],
  [worker, "job 7\njob 9\nprocessed=2\n"],
  [reply, "processed characters=4\n"],
])
  test("programma originale: " + name, () =>
    assert.equal(run(source(name)), output),
  );

test("controesempio: messaggio mosso, E0382", () => {
  run(source(moved), { error: "E0382" });
});
test("controesempio: Receiver non Clone, E0599", () => {
  run(source(receiver), { error: "E0599" });
});
test("correzione: clonare esplicitamente il messaggio", () => {
  assert.equal(
    run(
      replaceOnce(
        source(moved),
        "tx.send(message)",
        "tx.send(message.clone())",
      ),
    ),
    "job\n",
  );
});
test("correzione: clonare il sender, non il receiver", () => {
  assert.equal(
    run(replaceOnce(source(receiver), "rx.clone()", "_tx.clone()")),
    "",
  );
});
for (const constructor of ["mpsc::channel()", "mpsc::sync_channel(1)"]) {
  test("recuperare il valore da SendError: " + constructor, () => {
    assert.equal(
      run(`use std::sync::mpsc;
fn main() {
    let (tx, rx) = ${constructor};
    drop(rx);
    let message = String::from("retained");
    let returned = tx.send(message).unwrap_err().0;
    assert_eq!(returned, "retained");
}`),
      "",
    );
  });
}
test("tutti i cloni tengono aperta la ricezione dopo il drenaggio", () => {
  assert.equal(
    run(`use std::sync::mpsc::{self, TryRecvError};
fn main() {
    let (tx, rx) = mpsc::channel();
    let clone = tx.clone();
    tx.send(3).unwrap();
    drop(tx);
    assert_eq!(rx.recv(), Ok(3));
    assert_eq!(rx.try_recv(), Err(TryRecvError::Empty));
    clone.send(4).unwrap();
    drop(clone);
    assert_eq!(rx.recv(), Ok(4));
    assert_eq!(rx.try_recv(), Err(TryRecvError::Disconnected));
}`),
    "",
  );
});
test("try_iter non attende e non significa fine del flusso", () => {
  assert.equal(
    run(`use std::sync::mpsc;
fn main() {
    let (tx, rx) = mpsc::channel();
    assert!(rx.try_iter().collect::<Vec<i32>>().is_empty());
    tx.send(1).unwrap();
    tx.send(2).unwrap();
    assert_eq!(rx.try_iter().collect::<Vec<_>>(), [1, 2]);
    tx.send(3).unwrap();
    drop(tx);
    assert_eq!(rx.into_iter().collect::<Vec<_>>(), [3]);
}`),
    "",
  );
});
test("invio buffered riuscito non implica lettura: drop dei messaggi", () => {
  assert.equal(
    run(`use std::sync::{mpsc, Arc, atomic::{AtomicUsize, Ordering}};
#[derive(Debug)]
struct Message(Arc<AtomicUsize>);
impl Drop for Message {
    fn drop(&mut self) { self.0.fetch_add(1, Ordering::SeqCst); }
}
fn main() {
    let dropped = Arc::new(AtomicUsize::new(0));
    let (tx, rx) = mpsc::channel();
    tx.send(Message(Arc::clone(&dropped))).unwrap();
    assert_eq!(dropped.load(Ordering::SeqCst), 0);
    drop(rx);
    assert_eq!(dropped.load(Ordering::SeqCst), 1);
    let returned = tx.send(Message(Arc::clone(&dropped))).unwrap_err().0;
    assert_eq!(dropped.load(Ordering::SeqCst), 1);
    drop(returned);
    assert_eq!(dropped.load(Ordering::SeqCst), 2);
}`),
    "",
  );
});
test("coda piena: invio termina dopo che il consumatore libera spazio", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (tx, rx) = mpsc::sync_channel(1);
    tx.send(1).unwrap();
    let (ready, started) = mpsc::channel();
    let (done, completed) = mpsc::channel();
    let h = thread::spawn(move || {
        ready.send(()).unwrap();
        tx.send(2).unwrap();
        done.send(()).unwrap();
    });
    started.recv_timeout(Duration::from_secs(10)).unwrap();
    assert!(matches!(completed.try_recv(), Err(mpsc::TryRecvError::Empty)));
    assert_eq!(rx.recv(), Ok(1));
    assert_eq!(rx.recv(), Ok(2));
    completed.recv_timeout(Duration::from_secs(10)).unwrap();
    h.join().unwrap();
}`),
    "",
  );
});
test("drop del receiver libera il tentativo di invio su coda piena", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (tx, rx) = mpsc::sync_channel(1);
    tx.send(String::from("queued")).unwrap();
    let (ready, started) = mpsc::channel();
    let h = thread::spawn(move || {
        ready.send(()).unwrap();
        tx.send(String::from("pending")).unwrap_err().0
    });
    started.recv_timeout(Duration::from_secs(10)).unwrap();
    drop(rx);
    assert_eq!(h.join().unwrap(), "pending");
}`),
    "",
  );
});
test("rendezvous senza ricevitore in attesa: try_send Full", () => {
  assert.equal(
    run(`use std::sync::mpsc::{self, TrySendError};
fn main() {
    let (tx, rx) = mpsc::sync_channel(0);
    assert_eq!(tx.try_send(7), Err(TrySendError::Full(7)));
    drop(rx);
    assert_eq!(tx.try_send(8), Err(TrySendError::Disconnected(8)));
}`),
    "",
  );
});
test("rendezvous riuscito non significa elaborazione completata", () => {
  assert.equal(
    run(`use std::{sync::{mpsc, Arc, atomic::{AtomicBool, Ordering}}, thread, time::Duration};
fn main() {
    let processed = Arc::new(AtomicBool::new(false));
    let state = Arc::clone(&processed);
    let (tx, rx) = mpsc::sync_channel(0);
    let (release, wait) = mpsc::channel();
    let h = thread::spawn(move || {
        assert_eq!(rx.recv(), Ok(7));
        wait.recv_timeout(Duration::from_secs(10)).unwrap();
        state.store(true, Ordering::SeqCst);
    });
    tx.send(7).unwrap();
    assert!(!processed.load(Ordering::SeqCst));
    release.send(()).unwrap();
    h.join().unwrap();
    assert!(processed.load(Ordering::SeqCst));
}`),
    "",
  );
});
test("timeout non cancella il produttore: messaggio successivo ricevuto", () => {
  assert.equal(
    run(`use std::{sync::mpsc, thread, time::Duration};
fn main() {
    let (tx, rx) = mpsc::channel();
    let (release, wait) = mpsc::channel();
    let h = thread::spawn(move || {
        wait.recv_timeout(Duration::from_secs(10)).unwrap();
        tx.send(42).unwrap();
    });
    assert_eq!(rx.recv_timeout(Duration::ZERO), Err(mpsc::RecvTimeoutError::Timeout));
    release.send(()).unwrap();
    assert_eq!(rx.recv_timeout(Duration::from_secs(10)), Ok(42));
    h.join().unwrap();
}`),
    "",
  );
});
test("worker: chiusura senza Stop drena tutti i comandi", () => {
  assert.equal(
    run(
      main(
        worker,
        `
    let (tx, rx) = mpsc::channel();
    tx.send(Command::Work(4)).unwrap();
    tx.send(Command::Work(5)).unwrap();
    drop(tx);
    assert_eq!(worker(rx), 2);
`,
      ),
    ),
    "job 4\njob 5\n",
  );
});
test("worker: Stop interrompe la lettura dei comandi successivi", () => {
  assert.equal(
    run(
      main(
        worker,
        `
    let (tx, rx) = mpsc::channel();
    tx.send(Command::Work(4)).unwrap();
    tx.send(Command::Stop).unwrap();
    tx.send(Command::Work(5)).unwrap();
    drop(tx);
    assert_eq!(worker(rx), 1);
`,
      ),
    ),
    "job 4\n",
  );
});
test("worker: canale vuoto e disconnesso termina con zero lavori", () => {
  assert.equal(
    run(
      main(
        worker,
        `
    let (tx, rx) = mpsc::channel();
    drop(tx);
    assert_eq!(worker(rx), 0);
`,
      ),
    ),
    "",
  );
});
test("worker completo anche con capacita zero o uno", () => {
  for (const size of [0, 1])
    assert.equal(
      run(
        replaceOnce(
          source(worker),
          "mpsc::sync_channel(2)",
          "mpsc::sync_channel(" + size + ")",
        ),
      ),
      "job 7\njob 9\nprocessed=2\n",
    );
});
test("richiesta: risposta misura caratteri, non byte UTF-8", () => {
  let code = replaceOnce(
    source(reply),
    'String::from("rust")',
    'String::from("\\u{e8}abc")',
  );
  assert.equal(run(code), "processed characters=4\n");
});
test("richiesta: reply receiver abbandonato prima dell'invio", () => {
  let code = replaceOnce(
    source(reply),
    "let (reply_tx, reply_rx) = mpsc::channel();",
    "let (reply_tx, reply_rx) = mpsc::channel();\n    drop(reply_rx);",
  );
  code = replaceOnce(code, "let response = reply_rx.recv();", "");
  code = replaceOnce(
    code,
    'assert_eq!(response.expect("worker did not reply"), 4);',
    "",
  );
  code = replaceOnce(code, 'println!("processed characters=4");', "");
  assert.equal(run(code, { stderr: /requester no longer waiting/ }), "");
});
test("clone del sender non richiede Clone del messaggio", () => {
  assert.equal(
    run(`use std::sync::mpsc;
struct Message(u8);
fn main() {
    let (tx, rx) = mpsc::channel();
    let clone = tx.clone();
    clone.send(Message(9)).unwrap();
    assert_eq!(rx.recv().unwrap().0, 9);
}`),
    "",
  );
});
for (const [bound, type, error] of [
  ["Send", "std::sync::mpsc::Receiver<String>", null],
  ["Sync", "std::sync::mpsc::Receiver<String>", "E0277"],
  ["Send", "std::sync::mpsc::Sender<std::rc::Rc<u8>>", "E0277"],
  ["Send + Sync", "std::sync::mpsc::Sender<String>", null],
  ["Send + Sync", "std::sync::mpsc::SyncSender<String>", null],
])
  test("bound " + bound + ": " + type, () => {
    run(
      "fn require<T: " +
        bound +
        ">() {} fn main() { require::<" +
        type +
        ">(); }",
      error ? { error } : {},
    );
  });
test("Rc puo attraversare un canale senza attraversare thread", () => {
  assert.equal(
    run(`use std::{rc::Rc, sync::mpsc};
fn main() {
    let (tx, rx) = mpsc::channel();
    tx.send(Rc::new(3)).unwrap();
    assert_eq!(*rx.recv().unwrap(), 3);
}`),
    "",
  );
});
test("panic del produttore chiude il canale ma join conserva il panic", () => {
  assert.equal(
    run(
      `use std::{sync::mpsc, thread};
fn main() {
    let (tx, rx) = mpsc::channel();
    let h = thread::spawn(move || {
        tx.send(1).unwrap();
        panic!("producer failed");
    });
    assert_eq!(rx.into_iter().collect::<Vec<_>>(), [1]);
    assert!(h.join().is_err());
}`,
      { stderr: /producer failed/ },
    ),
    "",
  );
});
