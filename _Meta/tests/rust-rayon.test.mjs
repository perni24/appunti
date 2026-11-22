import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const notePath = "Programmazione/Rust/Pagine/Rayon e parallel iterators.md";
const note = parseNote(notePath);
const original = fs.readFileSync(notePath);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const n of note.tree.children) {
  if (n.type === "heading") heading = text(n);
  if (n.type === "code") {
    assert.ok(["rust", "toml"].includes(n.lang));
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, n.value);
  }
}
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-rayon-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  assert.deepEqual(fs.readFileSync(notePath), original);
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (
    /^(CARGO_|RUSTFLAGS$|RUSTDOCFLAGS$|RUSTC_|RUST_MIN_STACK$|RAYON_)/i.test(
      key,
    )
  )
    delete env[key];
}
Object.assign(env, {
  RUSTC: rustc,
  RUSTDOC: tool("rustdoc"),
  RUST_BACKTRACE: "0",
  RUST_LIB_BACKTRACE: "0",
  CARGO_HOME:
    process.env.RUST_RAYON_TEST_CARGO_HOME || path.join(root, "cargo-home"),
  CARGO_TARGET_DIR: path.join(root, "target"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
  RAYON_NUM_THREADS: "4",
});
for (let dir = root; ; dir = path.dirname(dir)) {
  for (const name of ["config", "config.toml"])
    assert.ok(
      !fs.existsSync(path.join(dir, ".cargo", name)),
      "Unexpected Cargo config: " + dir,
    );
  if (path.dirname(dir) === dir) break;
}
for (const name of ["config", "config.toml"])
  assert.ok(
    !fs.existsSync(path.join(env.CARGO_HOME, name)),
    "Unexpected cache configuration",
  );
let sequence = 0,
  dependencyDir,
  rayonLibrary;
function launch(executable, args, cwd = root, overrides = {}, timeout = 60000) {
  const r = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    timeout,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.signal, null);
  return r;
}
function ok(r) {
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
}
function source(name) {
  assert.ok(blocks.has(name), name);
  return blocks.get(name);
}
function prepare() {
  if (rayonLibrary) return;
  const project = path.join(root, "dependencies");
  fs.mkdirSync(path.join(project, "src"), { recursive: true });
  fs.writeFileSync(path.join(project, "Cargo.toml"), source("Cargo.toml"));
  fs.writeFileSync(path.join(project, "src/main.rs"), "fn main() {}\n");
  ok(
    launch(tool("cargo"), ["fetch"], project, {
      CARGO_NET_OFFLINE:
        process.env.RUST_RAYON_TEST_FETCH === "1" ? "false" : "true",
      CARGO_NET_RETRY: "0",
      CARGO_HTTP_TIMEOUT: "30",
    }),
  );
  const metadata = JSON.parse(
    ok(
      launch(
        tool("cargo"),
        ["metadata", "--format-version=1", "--locked", "--offline"],
        project,
      ),
    ).stdout,
  );
  const versions = metadata.packages
    .filter((p) => p.source)
    .map((p) => `${p.name}@${p.version}`)
    .sort();
  assert.ok(versions.includes("rayon@1.12.0"));
  console.log("Dependency baseline: " + versions.join(", "));
  ok(
    launch(
      tool("cargo"),
      ["build", "--locked", "--offline"],
      project,
      {},
      180000,
    ),
  );
  dependencyDir = path.join(env.CARGO_TARGET_DIR, "debug", "deps");
  const libraries = fs
    .readdirSync(dependencyDir)
    .filter((n) => /^librayon-[\da-f]+\.rlib$/.test(n));
  assert.equal(libraries.length, 1);
  rayonLibrary = path.join(dependencyDir, libraries[0]);
}
function run(code, options = {}) {
  prepare();
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const executable = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const compiled = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name=note_example",
      "--error-format=json",
      "--extern",
      "rayon=" + rayonLibrary,
      "-L",
      "dependency=" + dependencyDir,
      ...(options.flags || []),
      "main.rs",
      "-o",
      executable,
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
  ok(compiled);
  const result = ok(
    launch(executable, [], dir, {
      RAYON_NUM_THREADS: String(options.threads ?? 4),
    }),
  );
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
}
function main(name, body) {
  const code = source(name);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}
const sum = "Prima pipeline completa";
const ownership = "Prestito condiviso, mutabile e ownership";
const normalize = "Normalizzare stringhe senza lock";
const fold = "Accumulatori locali con fold e reduce";
const fallible = "Risultati fallibili";
const pool = "Pool dedicato e join";

test("baseline reale, manifest e otto programmi estratti", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 9);
  assert.match(source("Cargo.toml"), /rayon = "=1\.12\.0"/);
  prepare();
});
test("YAML invariato, template e gerarchia", () => {
  const head = ok(
    launch("git", ["show", "HEAD:" + notePath], process.cwd()),
  ).stdout;
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(head), yaml(note.source));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Rayon e parallel iterators",
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
});
for (const name of [sum, ownership, normalize, fold, fallible, pool]) {
  for (const threads of [1, 4])
    test(`${name}: RAYON_NUM_THREADS=${threads}`, () =>
      run(source(name), { threads }));
}
test("cattura mutabile rifiutata con E0596", () =>
  run(source("Mutare una cattura condivisa"), { error: "E0596" }));
test("filter perde indexed: enumerate rifiutato con E0599", () =>
  run(source("Enumerare dopo filter"), { error: "E0599" }));
test("Vec consumato non riutilizzabile", () =>
  run(
    main(
      ownership,
      `
    let values = vec![String::from("x")];
    let _: Vec<_> = values.into_par_iter().collect();
    drop(values);
  `,
    ),
    { error: "E0382" },
  ));
test("prestito via into_par_iter conserva il vettore", () =>
  run(
    main(
      ownership,
      `
    let values = vec![String::from("x"), String::from("y")];
    let refs: Vec<_> = (&values).into_par_iter().collect();
    assert_eq!(refs[0], "x");
    assert_eq!(values.len(), 2);
  `,
    ),
  ));
test("Cell Send ma non Sync: mutazione disgiunta consentita", () =>
  run(
    main(
      ownership,
      `
    use std::cell::Cell;
    let mut values = [Cell::new(1), Cell::new(2)];
    values.par_iter_mut().for_each(|v| v.set(v.get() + 1));
    assert_eq!(values.map(Cell::into_inner), [2, 3]);
  `,
    ),
  ));
test("Cell condivisa non soddisfa par_iter", () =>
  run(
    main(
      ownership,
      `
    let values = [std::cell::Cell::new(1)];
    values.par_iter().for_each(|v| v.set(2));
  `,
    ),
    { error: "E0599" },
  ));
test("Rc catturata non soddisfa Sync", () =>
  run(
    main(
      ownership,
      `
    let count = std::rc::Rc::new(2);
    let _: Vec<_> = [1, 2].par_iter().map(|n| n * *count).collect();
  `,
    ),
    { error: "E0277" },
  ));
test("pipeline lazy finche non viene consumata", () =>
  run(
    main(
      sum,
      `
    use std::sync::atomic::{AtomicUsize, Ordering};
    let calls = AtomicUsize::new(0);
    let pipeline = (0_usize..100).into_par_iter().map(|n| {
        calls.fetch_add(1, Ordering::Relaxed); n
    });
    assert_eq!(calls.load(Ordering::Relaxed), 0);
    assert_eq!(pipeline.sum::<usize>(), 4950);
    assert_eq!(calls.load(Ordering::Relaxed), 100);
  `,
    ),
  ));
test("normalizzazione: vuoti Unicode duplicati input invariato", () =>
  run(
    main(
      normalize,
      String.raw`
    let values: Vec<String> = ["", "\t\n", "\u{2003}CIAO\u{2003}", "A B", "\u{130}", "\u{00c9}", "E\u{301}", "CIAO"]
        .into_iter().map(String::from).collect();
    let before = values.clone();
    assert_eq!(normalize_all(&values), ["ciao", "a b", "i\u{307}", "\u{e9}", "e\u{301}", "ciao"]);
    assert_eq!(values, before);
    assert!(normalize_all(&[]).is_empty());
  `,
    ),
  ));
test("normalizzazione: ordine confrontato col sequenziale e diversi pool", () =>
  run(
    main(
      normalize,
      `
    let values: Vec<_> = (0..5000).map(|n| format!(" X{n} ")).collect();
    let expected: Vec<_> = values.iter().map(|s| s.trim().to_lowercase()).collect();
    for threads in [1, 2, 4] {
        let pool = rayon::ThreadPoolBuilder::new().num_threads(threads).build().unwrap();
        assert_eq!(pool.install(|| normalize_all(&values)), expected);
    }
  `,
    ),
  ));
test("fold: vuoto limiti e confronto sequenziale in release", () =>
  run(
    main(
      fold,
      `
    for values in [vec![], vec![0], vec![u32::MAX], (0..10001).collect()] {
        let mut expected = [0; 2];
        for n in &values { expected[(n % 2) as usize] += 1; }
        assert_eq!(parity_counts(&values), expected);
    }
  `,
    ),
    { flags: ["-O"] },
  ));
test("riduzioni vuote e non associativita floating point", () =>
  run(
    main(
      sum,
      `
    let values: [u64; 0] = [];
    assert_eq!(values.par_iter().copied().reduce(|| 0, |a, b| a + b), 0);
    assert_eq!(values.par_iter().copied().reduce_with(|a, b| a + b), None);
    let (a, b, c) = (1e16_f64, -1e16_f64, 1.0_f64);
    assert_ne!((a + b) + c, a + (b + c));
  `,
    ),
  ));
test("parse: vuoti limiti input invalido e piu errori", () =>
  run(
    main(
      fallible,
      `
    use std::num::IntErrorKind;
    assert_eq!(parse_all(&[]).unwrap(), Vec::<u32>::new());
    assert_eq!(parse_all(&["0", "4294967295"]).unwrap(), [0, u32::MAX]);
    for invalid in ["", " 1 ", "-1", "4294967296"] { assert!(parse_all(&[invalid]).is_err()); }
    let err = parse_all(&["bad", "4294967296"]).unwrap_err();
    assert!(matches!(err.kind(), IntErrorKind::InvalidDigit | IntErrorKind::PosOverflow));
  `,
    ),
  ));
test("report completo raccoglie tutti i Result in ordine", () =>
  run(
    main(
      fallible,
      `
    let report: Vec<Result<u32, _>> = ["bad", "12", "-1"].par_iter().map(|s| s.parse()).collect();
    assert_eq!(report.len(), 3);
    assert!(report[0].is_err()); assert_eq!(report[1], Ok(12)); assert!(report[2].is_err());
  `,
    ),
  ));
test("try_for_each Err non annulla l'effetto gia prodotto", () =>
  run(
    main(
      sum,
      `
    use std::sync::atomic::{AtomicUsize, Ordering};
    let effect = AtomicUsize::new(0);
    let result: Result<(), &str> = [1].par_iter().try_for_each(|_| {
        effect.store(1, Ordering::Relaxed); Err("failed")
    });
    assert_eq!(result, Err("failed"));
    assert_eq!(effect.load(Ordering::Relaxed), 1);
    assert_eq!([0_u32; 0].par_iter().try_for_each(|_| Ok::<(), ()>(())), Ok(()));
  `,
    ),
  ));
test("enumerate prima del filtro e rinumerazione dopo raccolta", () =>
  run(
    main(
      sum,
      `
    let values = [1, 2, 3, 4];
    let indexed: Vec<_> = values.par_iter().enumerate().filter(|(_, n)| **n % 2 == 0).collect();
    assert_eq!(indexed, [(1, &2), (3, &4)]);
    let filtered: Vec<_> = values.par_iter().copied().filter(|n| n % 2 == 0).collect();
    let renumbered: Vec<_> = filtered.into_par_iter().enumerate().collect();
    assert_eq!(renumbered, [(0, 2), (1, 4)]);
  `,
    ),
  ));
test("find_first e find_any con ordine significativo", () =>
  run(
    main(
      sum,
      `
    let values = [9, 2, 7, 4, 6];
    assert_eq!(values.par_iter().find_first(|&&n| n % 2 == 0), Some(&2));
    let found = values.par_iter().find_any(|&&n| n % 2 == 0).unwrap();
    assert!([2, 4, 6].contains(found));
    assert_eq!(values.par_iter().find_any(|&&n| n == 100), None);
  `,
    ),
  ));
test("install riusa il pool scelto e join funziona con un worker", () =>
  run(
    main(
      sum,
      `
    for threads in [1, 2, 4] {
        let pool = rayon::ThreadPoolBuilder::new().num_threads(threads).build().unwrap();
        let input = [10_u32, 20];
        let values = pool.install(|| rayon::join(
            || { assert_eq!(rayon::current_num_threads(), threads); input[0] },
            || { assert_eq!(rayon::current_num_threads(), threads); input[1] },
        ));
        assert_eq!(values, (10, 20));
    }
  `,
    ),
  ));
test("join con panic esegue anche il secondo ramo e propaga", () =>
  run(
    main(
      sum,
      `
    use std::sync::atomic::{AtomicBool, Ordering};
    std::panic::set_hook(Box::new(|_| {}));
    let done = AtomicBool::new(false);
    let pool = rayon::ThreadPoolBuilder::new().num_threads(1).build().unwrap();
    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| pool.install(|| {
        rayon::join(|| panic!("first"), || done.store(true, Ordering::Relaxed));
    })));
    assert!(outcome.is_err());
    assert!(done.load(Ordering::Relaxed));
  `,
    ),
  ));
test("pool globale inizializzabile una volta per processo", () =>
  run(
    main(
      sum,
      `
    rayon::ThreadPoolBuilder::new().num_threads(1).build_global().unwrap();
    assert_eq!(rayon::current_num_threads(), 1);
    assert!(rayon::ThreadPoolBuilder::new().num_threads(2).build_global().is_err());
  `,
    ),
  ));
test("chunks disgiunti, ultimo corto e minimo indexed", () =>
  run(
    main(
      sum,
      `
    let mut values = [0; 7];
    values.par_chunks_mut(3).enumerate().for_each(|(i, chunk)| chunk.fill(i));
    assert_eq!(values, [0, 0, 0, 1, 1, 1, 2]);
    let copy: Vec<_> = values.par_iter().with_min_len(3).copied().collect();
    assert_eq!(copy, values);
    std::panic::set_hook(Box::new(|_| {}));
    assert!(std::panic::catch_unwind(|| { let mut v = [0]; let _ = v.par_chunks_mut(0); }).is_err());
  `,
    ),
  ));
test("bridge verifica contenuti senza assumere ordine", () =>
  run(
    main(
      sum,
      `
    let mut values: Vec<_> = (0_u32..100).filter(|n| n % 3 == 0).par_bridge().map(|n| n * 2).collect();
    values.sort_unstable();
    assert_eq!(values, (0_u32..100).filter(|n| n % 3 == 0).map(|n| n * 2).collect::<Vec<_>>());
  `,
    ),
  ));
test("sort stabile conserva l'ordine delle chiavi uguali", () =>
  run(
    main(
      sum,
      `
    let mut values = [(2, "a"), (1, "b"), (2, "c")];
    values.par_sort_by_key(|item| item.0);
    assert_eq!(values, [(1, "b"), (2, "a"), (2, "c")]);
    let mut numbers = [3, 1, 2]; numbers.par_sort_unstable();
    assert_eq!(numbers, [1, 2, 3]);
  `,
    ),
  ));
