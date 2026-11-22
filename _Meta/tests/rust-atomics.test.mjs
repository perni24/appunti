import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const notePath = "Programmazione/Rust/Pagine/Mutex RwLock e Atomics.md";
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
const prefix = "appunti-rust-atomics-";
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

const locks = "Lock per stato composto";
const api = "Operazioni su un singolo atomico";
const stop = "Flag di arresto cooperativo";
const publish = "Pubblicare un valore con Release e Acquire";
const cas = "Consumare una quota con compare_exchange_weak";
const update = "Aggiornamento condizionale con try_update";
const split = "SeqCst non rende atomico load piu store";
const invalid = "Ordering non ammesso";

test("baseline reale e otto programmi estratti", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 8);
});
test("YAML originale, template, gerarchia e riferimenti", () => {
  const original = launch("git", ["show", "HEAD:" + notePath], process.cwd());
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Mutex, RwLock e Atomics",
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
  assert.match(note.source, /logic[ao]mente errato/);
  assert.match(note.source, /fetch_update/);
  assert.match(note.source, /https:\/\/doc\.rust-lang\.org\/std\/sync\/atomic/);
  assert.ok(!note.tree.children.some((n) => n.type === "html"));
});
for (const name of [locks, api, stop, publish, cas, update, split])
  test("programma originale: " + name, () =>
    assert.equal(run(source(name)), ""),
  );
test("controesempio: load Release rifiutato", () =>
  run(source(invalid), { error: "invalid_atomic_ordering" }));

test("API: store e load con tutti gli ordering ammessi", () => {
  run(
    main(
      api,
      `
    for store in [Ordering::Relaxed, Ordering::Release, Ordering::SeqCst] {
        for load in [Ordering::Relaxed, Ordering::Acquire, Ordering::SeqCst] {
            let value = AtomicUsize::new(0);
            value.store(7, store);
            assert_eq!(value.load(load), 7);
        }
    }
  `,
    ),
  );
});
test("API: swap e fetch_add con tutti e cinque gli ordering", () => {
  run(
    main(
      api,
      `
    for order in [Ordering::Relaxed, Ordering::Acquire, Ordering::Release,
                  Ordering::AcqRel, Ordering::SeqCst] {
        let value = AtomicUsize::new(5);
        assert_eq!(value.swap(7, order), 5);
        assert_eq!(value.fetch_add(2, order), 7);
        assert_eq!(value.load(Ordering::Relaxed), 9);
    }
  `,
    ),
  );
});
test("CAS: tutte le combinazioni ammesse di successo e fallimento", () => {
  run(
    main(
      api,
      `
    for success in [Ordering::Relaxed, Ordering::Acquire, Ordering::Release,
                    Ordering::AcqRel, Ordering::SeqCst] {
        for failure in [Ordering::Relaxed, Ordering::Acquire, Ordering::SeqCst] {
            let value = AtomicUsize::new(1);
            assert_eq!(value.compare_exchange(1, 2, success, failure), Ok(1));
            assert_eq!(value.compare_exchange(1, 3, success, failure), Err(2));
            assert_eq!(value.load(Ordering::Relaxed), 2);
        }
    }
  `,
    ),
  );
});
for (const [operation, order] of [
  ["load", "Release"],
  ["load", "AcqRel"],
  ["store", "Acquire"],
  ["store", "AcqRel"],
]) {
  test(operation + " con " + order + ": panic a runtime", () => {
    const call =
      operation === "load" ? "value.load(order);" : "value.store(2, order);";
    run(
      main(
        api,
        `
      std::panic::set_hook(Box::new(|_| {}));
      let value = AtomicUsize::new(1);
      let order = std::hint::black_box(Ordering::${order});
      assert!(std::panic::catch_unwind(|| { ${call} }).is_err());
      assert_eq!(value.load(Ordering::Relaxed), 1);
    `,
      ),
    );
  });
}
for (const method of [
  "compare_exchange",
  "compare_exchange_weak",
  "try_update",
]) {
  for (const order of ["Release", "AcqRel"]) {
    test(method + " con failure " + order + ": panic a runtime", () => {
      const call =
        method === "try_update"
          ? "value.try_update(Ordering::Relaxed, failure, |v| Some(v + 1));"
          : "value." + method + "(1, 2, Ordering::Relaxed, failure);";
      run(
        main(
          api,
          `
        std::panic::set_hook(Box::new(|_| {}));
        let value = AtomicUsize::new(1);
        let failure = std::hint::black_box(Ordering::${order});
        assert!(std::panic::catch_unwind(|| { let _ = { ${call} }; }).is_err());
        assert_eq!(value.load(Ordering::Relaxed), 1);
      `,
        ),
      );
    });
  }
}
test("fetch_add e fetch_sub fanno wrapping anche con overflow-checks", () => {
  run(
    main(
      api,
      `
    let value = AtomicUsize::new(usize::MAX);
    assert_eq!(value.fetch_add(1, Ordering::Relaxed), usize::MAX);
    assert_eq!(value.load(Ordering::Relaxed), 0);
    assert_eq!(value.fetch_sub(1, Ordering::Relaxed), 0);
    assert_eq!(value.load(Ordering::Relaxed), usize::MAX);
  `,
    ),
    { args: ["-C", "overflow-checks=on"] },
  );
});
test("CAS: valori uguali dopo A-B-A non rivelano la storia", () => {
  run(
    main(
      api,
      `
    let value = AtomicUsize::new(1);
    let expected = value.load(Ordering::Relaxed);
    value.store(2, Ordering::Relaxed);
    value.store(1, Ordering::Relaxed);
    assert_eq!(value.compare_exchange(expected, 3, Ordering::SeqCst, Ordering::SeqCst), Ok(1));
  `,
    ),
  );
});
test("StopFlag: default, richiesta e richieste ripetute", () => {
  run(
    main(
      stop,
      `
    let flag = StopFlag::default();
    assert!(!flag.is_stopped());
    flag.stop();
    flag.stop();
    assert!(flag.is_stopped());
  `,
    ),
  );
});
test("StopFlag: richiesta prima dello spawn lascia zero lavoro", () => {
  run(
    replaceOnce(
      source(stop),
      "let worker_stop = Arc::clone(&stop);",
      "stop.stop(); let worker_stop = Arc::clone(&stop);",
    ).replace("assert!(processed <= 1_000);", "assert_eq!(processed, 0);"),
  );
});
test("StopFlag: senza richiesta il worker completa il lavoro limitato", () => {
  run(
    replaceOnce(source(stop), "    stop.stop();", "")
      .replace("assert!(stop.is_stopped());", "assert!(!stop.is_stopped());")
      .replace("assert!(processed <= 1_000);", "assert_eq!(processed, 1_000);"),
  );
});
test("StopFlag: condivisione dell'istanza e attesa distinta dal flag", () => {
  run(
    main(
      stop,
      `
    let flag = Arc::new(StopFlag::default());
    let worker_flag = Arc::clone(&flag);
    let worker = thread::spawn(move || worker_flag.stop());
    worker.join().unwrap();
    assert!(flag.is_stopped());
  `,
    ),
  );
});
test("pubblicazione: la lettura protetta precede il join", () => {
  const code = source(publish);
  assert.ok(
    code.indexOf("assert_eq!(result.load") < code.indexOf("writer.join()"),
  );
  assert.ok(code.indexOf("result.store") < code.indexOf("ready.store"));
  assert.match(code, /ready\.store\(true, Ordering::Release\)/);
  assert.match(code, /ready\.load\(Ordering::Acquire\)/);
});
for (const value of ["0", "1", "usize::MAX"]) {
  test("pubblicazione del valore " + value, () =>
    run(source(publish).replaceAll("42", value)),
  );
}
test("pubblicazione ripetuta su istanze sempre nuove, anche ottimizzata", () => {
  const code =
    replaceOnce(source(publish), "fn main() {", "fn demonstrate() {") +
    "\nfn main() { for _ in 0..30 { demonstrate(); } }";
  run(code, { args: ["-O"] });
});
for (const name of [cas, update]) {
  test(name + ": vuoto, limite e consumi sequenziali", () => {
    run(
      main(
        name,
        `
      let empty = AtomicUsize::new(0);
      assert!(!try_take(&empty));
      assert_eq!(empty.load(Ordering::Relaxed), 0);
      let full = AtomicUsize::new(usize::MAX);
      assert!(try_take(&full));
      assert_eq!(full.load(Ordering::Relaxed), usize::MAX - 1);
      for initial in 0..=8 {
          let quota = AtomicUsize::new(initial);
          let accepted = (0..10).filter(|_| try_take(&quota)).count();
          assert_eq!(accepted, initial);
          assert_eq!(quota.load(Ordering::Relaxed), 0);
      }
    `,
      ),
      { args: ["-O", "-C", "overflow-checks=off"] },
    );
  });
  test(name + ": quota contesa e numero esatto di successi", () => {
    run(
      main(
        name,
        `
      for initial in [0, 1, 3, 7, 8, 12] {
          let quota = AtomicUsize::new(initial);
          let accepted = std::thread::scope(|scope| {
              let mut handles = Vec::new();
              for _ in 0..8 { handles.push(scope.spawn(|| try_take(&quota))); }
              let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
              outcomes.into_iter().map(|r| usize::from(r.unwrap())).sum::<usize>()
          });
          assert_eq!(accepted, initial.min(8));
          assert_eq!(quota.load(Ordering::Relaxed), initial.saturating_sub(8));
      }
    `,
      ),
    );
  });
}
test("try_update: Some restituisce il valore precedente, None non scrive", () => {
  run(
    main(
      update,
      `
    let value = AtomicUsize::new(7);
    assert_eq!(value.try_update(Ordering::Relaxed, Ordering::Relaxed, |v| Some(v + 1)), Ok(7));
    assert_eq!(value.try_update(Ordering::Relaxed, Ordering::Relaxed, |_| None), Err(8));
    assert_eq!(value.load(Ordering::Relaxed), 8);
  `,
    ),
  );
});
test("try_update: la closure viene ripetuta dopo modifica interposta", () => {
  run(
    main(
      update,
      `
    let value = AtomicUsize::new(3);
    let mut calls = 0;
    let outcome = value.try_update(Ordering::Relaxed, Ordering::Relaxed, |current| {
        calls += 1;
        if calls == 1 { value.store(5, Ordering::Relaxed); }
        current.checked_sub(1)
    });
    assert!(calls >= 2);
    assert_eq!(outcome, Ok(5));
    assert_eq!(value.load(Ordering::Relaxed), 4);
  `,
    ),
  );
});
test("try_update: un panic nella closure non avvelena l'atomico", () => {
  run(
    main(
      update,
      `
    std::panic::set_hook(Box::new(|_| {}));
    let value = AtomicUsize::new(2);
    assert!(std::panic::catch_unwind(|| {
        let _ = value.try_update(Ordering::Relaxed, Ordering::Relaxed, |_| panic!("test"));
    }).is_err());
    assert_eq!(value.load(Ordering::Relaxed), 2);
    assert!(try_take(&value));
  `,
    ),
  );
});
test("fetch_update e deprecato nella baseline", () => {
  run(
    main(
      update,
      `
    let value = AtomicUsize::new(1);
    let _ = value.fetch_update(Ordering::Relaxed, Ordering::Relaxed, |v| v.checked_sub(1));
  `,
    ),
    { args: ["-D", "deprecated"], error: "deprecated" },
  );
});
test("fetch_update resta compatibile quando la deprecazione e ammessa", () => {
  run(source(update).replace(".try_update(", ".fetch_update("), {
    args: ["-A", "deprecated"],
  });
});
test("controesempio SeqCst ripetibile senza sleep", () => {
  const code =
    replaceOnce(source(split), "fn main() {", "fn demonstrate() {") +
    "\nfn main() { for _ in 0..20 { demonstrate(); } }";
  run(code);
});
test("correzione SeqCst: singolo fetch_add conserva entrambi gli incrementi", () => {
  const code = replaceOnce(
    source(split),
    `let old = counter.load(Ordering::SeqCst);
                read.wait();
                counter.store(old + 1, Ordering::SeqCst);`,
    `read.wait();
                counter.fetch_add(1, Ordering::SeqCst);`,
  );
  run(
    replaceOnce(
      code,
      "counter.load(Ordering::SeqCst), 1",
      "counter.load(Ordering::SeqCst), 2",
    ),
  );
});
