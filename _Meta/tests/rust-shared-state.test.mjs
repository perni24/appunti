import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const notePath = "Programmazione/Rust/Pagine/Shared state.md";
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
const prefix = "appunti-rust-shared-state-";
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
      "--edition=" + (options.edition ?? "2024"),
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

const readonly = "Condividere dati immutabili senza Arc";
const update = "Aggiornamento e snapshot";
const counter = "Contatore con attesa di tutti i worker";
const inventory = "Proteggere una invariante applicativa";
const config = "RwLock per snapshot di configurazione";
const atomic = "Atomico per un contatore indipendente";
const wrong = "Check-then-act: codice sicuro ma logicamente sbagliato";

test("baseline e sette programmi estratti", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 7);
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
    "Shared state",
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
  ]) {
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === name),
      name,
    );
  }
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(note.source, /Controesempio intenzionalmente errato/);
  assert.match(note.source, /https:\/\/doc\.rust-lang\.org\/std\/sync/);
  assert.ok(!note.tree.children.some((n) => n.type === "html"));
});
for (const [name, output] of [
  [readonly, ""],
  [update, "ready\n"],
  [counter, "400\n"],
  [inventory, ""],
  [config, ""],
  [atomic, ""],
  [wrong, ""],
])
  test("programma della nota: " + name, () =>
    assert.equal(run(source(name)), output),
  );

test("prestito scoped di dati non Copy e proprietario ancora utilizzabile", () => {
  run(
    main(
      readonly,
      `
    let values = vec![String::from("alpha"), String::from("beta")];
    thread::scope(|scope| {
        let a = scope.spawn(|| values[0].len());
        let b = scope.spawn(|| values[1].len());
        assert_eq!((a.join().unwrap(), b.join().unwrap()), (5, 4));
    });
    assert_eq!(values.join(","), "alpha,beta");
  `,
    ),
  );
});
test("update accetta anche un Mutex senza Arc, stringhe vuote e Unicode", () => {
  run(
    main(
      update,
      `
    let items = Mutex::new(Vec::new());
    update(&items, String::new()).unwrap();
    update(&items, String::from("\\u{e8}")).unwrap();
    assert_eq!(*items.lock().unwrap(), ["", "\\u{e8}"]);
  `,
    ),
  );
});
test("snapshot indipendente e guard rilasciata prima del lavoro esterno", () => {
  run(
    main(
      update,
      `
    let items = Mutex::new(vec![String::from("old")]);
    let snapshot = { let guard = items.lock().unwrap(); guard.clone() };
    assert!(items.try_lock().is_ok());
    update(&items, String::from("new")).unwrap();
    assert_eq!(snapshot, ["old"]);
    assert_eq!(items.lock().unwrap().len(), 2);
  `,
    ),
  );
});
test("update rifiuta mutex poisoned e non cancella il segnale", () => {
  run(
    main(
      update,
      `
    std::panic::set_hook(Box::new(|_| {}));
    let items = Mutex::new(vec![String::from("old")]);
    assert!(std::panic::catch_unwind(|| {
        let _guard = items.lock().unwrap();
        panic!("test");
    }).is_err());
    assert_eq!(update(&items, String::from("new")), Err("mutex poisoned"));
    assert!(items.is_poisoned());
    assert_eq!(*items.lock().unwrap_err().into_inner(), ["old"]);
  `,
    ),
  );
});
test("counter: zero, limiti, diverse quantita e numero di worker", () => {
  run(
    main(
      counter,
      `
    for workers in 0..=8 {
        for increments in [0, 1, 17, 200] {
            assert_eq!(count_parallel(workers, increments),
                       Ok((workers * increments) as u64));
        }
    }
    assert_eq!(count_parallel(usize::MAX, 0), Err("too many workers"));
  `,
    ),
  );
});
test("counter: snapshot esplicito funziona anche in edition 2021", () => {
  assert.equal(run(source(counter), { edition: "2021" }), "400\n");
});
test("counter: overflow propagato senza wrapping anche in release", () => {
  const code = replaceOnce(
    main(counter, 'assert_eq!(count_parallel(2, 1), Err("counter overflow"));'),
    "Mutex::new(0_u64)",
    "Mutex::new(u64::MAX)",
  );
  run(code, { args: ["-O", "-C", "overflow-checks=off"] });
});
test("counter: panic worker distinto da risultato applicativo", () => {
  let code = main(
    counter,
    `
    std::panic::set_hook(Box::new(|_| {}));
    assert_eq!(count_parallel(4, 1), Err("worker panicked"));
  `,
  );
  code = replaceOnce(
    code,
    "for _ in 0..increments {",
    'panic!("test worker"); for _ in 0..increments {',
  );
  run(code);
});
test("inventario: prenotazione esatta e successivo rifiuto senza modifiche", () => {
  run(
    main(
      inventory,
      `
    let inventory = Inventory::new(10);
    assert_eq!(inventory.reserve(10), Ok(()));
    let before = inventory.snapshot().unwrap();
    assert_eq!(before, Stock { available: 0, reserved: 10 });
    assert_eq!(inventory.reserve(1), Err(ReserveError::InsufficientStock));
    assert_eq!(inventory.snapshot().unwrap(), before);
  `,
    ),
  );
});
test("inventario: quantita zero e input oltre la disponibilita", () => {
  run(
    main(
      inventory,
      `
    let inventory = Inventory::new(0);
    assert_eq!(inventory.reserve(0), Ok(()));
    assert_eq!(inventory.reserve(u32::MAX), Err(ReserveError::InsufficientStock));
    assert_eq!(inventory.snapshot().unwrap(), Stock { available: 0, reserved: 0 });
  `,
    ),
  );
});
test("inventario: limite u32 senza overflow", () => {
  run(
    main(
      inventory,
      `
    let inventory = Inventory::new(u32::MAX);
    assert_eq!(inventory.reserve(u32::MAX), Ok(()));
    assert_eq!(inventory.snapshot().unwrap(), Stock { available: 0, reserved: u32::MAX });
    assert_eq!(inventory.reserve(0), Ok(()));
  `,
    ),
  );
});
test("inventario: overflow difensivo su stato sintetico non modifica i campi", () => {
  run(
    main(
      inventory,
      `
    let before = Stock { available: 1, reserved: u32::MAX };
    let inventory = Inventory { state: Mutex::new(before) };
    assert_eq!(inventory.reserve(1), Err(ReserveError::Overflow));
    assert_eq!(inventory.snapshot().unwrap(), before);
    assert!(!inventory.state.is_poisoned());
  `,
    ),
  );
});
test("inventario: reserve e snapshot rifiutano poisoning", () => {
  run(
    main(
      inventory,
      `
    std::panic::set_hook(Box::new(|_| {}));
    let inventory = Inventory::new(10);
    assert!(std::panic::catch_unwind(|| {
        let _guard = inventory.state.lock().unwrap();
        panic!("test");
    }).is_err());
    assert_eq!(inventory.reserve(0), Err(ReserveError::Poisoned));
    assert_eq!(inventory.snapshot(), Err(ReserveError::Poisoned));
    assert!(inventory.state.is_poisoned());
  `,
    ),
  );
});
test("inventario: concorrenza su una singola unita, un solo successo", () => {
  run(
    main(
      inventory,
      `
    let inventory = Inventory::new(1);
    thread::scope(|scope| {
        let mut handles = Vec::new();
        for _ in 0..8 {
            handles.push(scope.spawn(|| inventory.reserve(1)));
        }
        let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
        assert_eq!(outcomes.into_iter().filter(|o| o.as_ref().unwrap().is_ok()).count(), 1);
    });
    assert_eq!(inventory.snapshot().unwrap(), Stock { available: 0, reserved: 1 });
  `,
    ),
  );
});
test("inventario: snapshot e disponibile dopo errore applicativo", () => {
  run(
    main(
      inventory,
      `
    let inventory = Inventory::new(2);
    assert_eq!(inventory.reserve(3), Err(ReserveError::InsufficientStock));
    assert!(inventory.state.try_lock().is_ok());
    assert_eq!(inventory.snapshot().unwrap(), Stock { available: 2, reserved: 0 });
    inventory.reserve(2).unwrap();
  `,
    ),
  );
});
test("Result Err non produce rollback ne poisoning", () => {
  run(`
    use std::sync::Mutex;
    fn bad_update(state: &Mutex<i32>) -> Result<(), ()> {
        *state.lock().unwrap() = -1;
        Err(())
    }
    fn main() {
        let state = Mutex::new(1);
        assert_eq!(bad_update(&state), Err(()));
        assert!(!state.is_poisoned());
        assert_eq!(*state.lock().unwrap(), -1);
    }
  `);
});
test("RwLock: snapshot distinto e guard rilasciata prima della scrittura", () => {
  run(
    main(
      config,
      `
    let settings = RwLock::new(Settings { label: String::from("old"), enabled: false });
    let snapshot = { let guard = settings.read().unwrap(); guard.clone() };
    {
        let mut guard = settings.try_write().unwrap();
        guard.label = String::from("new");
        guard.enabled = true;
    }
    assert_eq!(snapshot, Settings { label: String::from("old"), enabled: false });
    assert!(settings.read().unwrap().enabled);
  `,
    ),
  );
});
test("RwLock: try_write non riesce mentre una read guard e viva", () => {
  run(`
    use std::sync::{RwLock, TryLockError};
    fn main() {
        let state = RwLock::new(1);
        let reader = state.read().unwrap();
        assert!(matches!(state.try_write(), Err(TryLockError::WouldBlock)));
        assert_eq!(*reader, 1);
        drop(reader);
        *state.try_write().unwrap() = 2;
        assert_eq!(*state.read().unwrap(), 2);
    }
  `);
});
test("atomico: fetch_add restituisce il valore precedente e fa wrapping", () => {
  run(
    main(
      atomic,
      `
    let value = AtomicUsize::new(usize::MAX);
    assert_eq!(value.fetch_add(1, Ordering::Relaxed), usize::MAX);
    assert_eq!(value.load(Ordering::Relaxed), 0);
  `,
    ),
  );
});
test("atomico: load seguito da store puo perdere un incremento", () => {
  run(
    main(
      atomic,
      `
    let value = AtomicUsize::new(0);
    let read = std::sync::Barrier::new(2);
    thread::scope(|scope| {
        for _ in 0..2 {
            let value = &value;
            let read = &read;
            scope.spawn(move || {
                let old = value.load(Ordering::Relaxed);
                read.wait();
                value.store(old + 1, Ordering::Relaxed);
            });
        }
    });
    assert_eq!(value.load(Ordering::Relaxed), 1);
  `,
    ),
  );
});
test("check-then-act: controesempio riproducibile senza sleep", () => {
  let code = source(wrong);
  code = replaceOnce(code, "fn main() {", "fn demonstrate() {");
  code += "\nfn main() { for _ in 0..20 { demonstrate(); } }";
  run(code);
});
test("check-then-act: correzione con controllo e modifica sotto la stessa guard", () => {
  const code = replaceOnce(
    source(wrong),
    `let can_reserve = *remaining.lock().unwrap() > 0;
                checked.wait();

                if can_reserve {
                    *remaining.lock().unwrap() -= 1;
                }`,
    `checked.wait();
                let mut value = remaining.lock().unwrap();
                if *value > 0 {
                    *value -= 1;
                }`,
  );
  run(replaceOnce(code, "unwrap(), -1)", "unwrap(), 0)"));
});
