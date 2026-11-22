import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Time Duration e Instant"];
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
const prefix = "appunti-rust-time-";
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
for (const key of Object.keys(env))
  if (
    ["APPUNTI_DEMO_INPUT", "APPUNTI_OS_TEST_CHILD"].includes(key.toUpperCase())
  )
    delete env[key];
let sequence = 0;
function launch(executable, args, cwd = root, extraEnv = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...extraEnv },
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
  options.prepare?.(dir);
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
  const execution = launch(
    output,
    options.programArgs ?? [],
    dir,
    options.childEnv,
  );
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
  options.verify?.(dir);
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

const units = "Creare durate e convertire le unita";
const arithmetic = "Calcolare senza nascondere errori";
const measure = "Misurare una funzione sincrona";
const deadline = "Gestire una scadenza e l'ordine degli istanti";
const epoch = "Ottenere un timestamp e gestire date precedenti all'epoch";
const sleep = "Attendere senza pretendere una precisione esatta";
const from = (heading) => source(0, heading);

test("baseline Rust e sei programmi indipendenti", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 6);
});
test("YAML invariato, template, gerarchia, generici e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Time Duration e Instant.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Time, Duration e Instant",
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
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === section),
      section,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  const nodes = [];
  function walk(n) {
    nodes.push(n);
    for (const c of n.children ?? []) walk(c);
  }
  walk(note.tree);
  assert.ok(!nodes.some((n) => n.type === "html"));
  for (const token of [
    "Option<Duration>",
    "Option<Instant>",
    "Result<Duration, SystemTimeError>",
    "Result<Duration, TryFromFloatSecsError>",
  ])
    assert.ok(
      nodes.some((n) => n.type === "inlineCode" && n.value === token),
      token,
    );
  for (const page of [
    "Duration",
    "Instant",
    "SystemTime",
    "SystemTimeError",
    "TryFromFloatSecsError",
  ])
    assert.ok(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url ===
            "https://doc.rust-lang.org/std/time/struct." + page + ".html",
      ),
      page,
    );
});

test("programma unita: normalizzazione, totale e formato esplicito", () => {
  assert.equal(run(from(units)), "2.500000000 s\n");
});
test("programma aritmetica: controlli, limite e input float", () => {
  assert.equal(run(from(arithmetic)), "");
});
test("programma misura: restituisce il risultato senza tempi fissi", () => {
  assert.match(run(from(measure)), /^\[1, 3, 5, 8\]; \d+\.\d{6} s\n$/);
});
test("programma scadenza: istanti costruiti senza attese", () => {
  assert.equal(run(from(deadline)), "");
});
test("programma epoch: timestamp e clock reale senza modificarlo", () => {
  assert.match(run(from(epoch)), /^Unix: \d+\.\d{9} s\n$/);
});
test("programma sleep: attesa reale breve, nessuna uguaglianza fragile", () => {
  assert.match(run(from(sleep)), /^Richiesti: 10ms; trascorsi: .+\n$/);
});

test("Duration: round trip esatto anche ai limiti", () => {
  run(
    probe(
      0,
      units,
      String.raw`
    for value in [Duration::ZERO, Duration::from_nanos(1), Duration::from_secs(u64::MAX), Duration::MAX] {
        assert_eq!(Duration::new(value.as_secs(), value.subsec_nanos()), value);
        assert!(value.subsec_nanos() < 1_000_000_000);
    }
`,
    ),
  );
});
test("Duration: totale, frazione e perdita delle unita inferiori", () => {
  run(
    probe(
      0,
      units,
      String.raw`
    let value = Duration::new(7, 123_456_789);
    assert_eq!(value.as_secs(), 7);
    assert_eq!(value.subsec_millis(), 123);
    assert_eq!(value.as_millis(), 7_123);
    assert_eq!(value.as_micros(), 7_123_456);
    assert_eq!(value.as_nanos(), 7_123_456_789);
    assert!(Duration::from_millis(value.as_millis().try_into().unwrap()) < value);
`,
    ),
  );
});
test("Duration: TryFrom rifiuta il totale che non entra in u64", () => {
  run(
    probe(
      0,
      units,
      String.raw`
    assert!(u64::try_from(Duration::MAX.as_millis()).is_err());
    assert_eq!(u64::try_from(Duration::from_nanos(u64::MAX).as_nanos()), Ok(u64::MAX));
`,
    ),
  );
});
test("Duration::new: normalizzazione fuori range causa panic", () => {
  run(probe(0, units, "let _ = Duration::new(u64::MAX, 1_000_000_000);"), {
    panic: /overflow/,
  });
});
test("Duration non implementa Display", () => {
  run(probe(0, units, 'println!("{}", Duration::ZERO);'), { error: "E0277" });
});
test("checked: overflow, underflow, divisione nulla e zero valido", () => {
  run(
    probe(
      0,
      arithmetic,
      String.raw`
    let nanosecond = Duration::from_nanos(1);
    assert_eq!(Duration::MAX.checked_mul(2), None);
    assert_eq!(Duration::ZERO.checked_sub(nanosecond), None);
    assert_eq!(Duration::ZERO.checked_add(nanosecond), Some(nanosecond));
    assert_eq!(nanosecond.checked_div(2), Some(Duration::ZERO));
    assert_eq!(Duration::ZERO.checked_div(0), None);
`,
    ),
  );
});
test("saturating: limite di dominio, cap nullo e durata iniziale nulla", () => {
  run(
    probe(
      0,
      arithmetic,
      String.raw`
    let cap = Duration::from_millis(900);
    for value in [Duration::ZERO, Duration::from_millis(1), cap, Duration::MAX] {
        assert!(next_delay(value, cap) <= cap);
        assert_eq!(next_delay(value, Duration::ZERO), Duration::ZERO);
    }
    assert_eq!(next_delay(Duration::ZERO, cap), Duration::ZERO);
    assert_eq!(Duration::ZERO.saturating_sub(cap), Duration::ZERO);
    assert_eq!(Duration::MAX.saturating_add(cap), Duration::MAX);
`,
    ),
  );
});
test("float: input non finiti, negativi e fuori range rifiutati", () => {
  run(
    probe(
      0,
      arithmetic,
      String.raw`
    for value in [f64::NEG_INFINITY, f64::INFINITY, f64::NAN, -1.0, f64::MAX] {
        assert!(Duration::try_from_secs_f64(value).is_err());
    }
    assert_eq!(Duration::try_from_secs_f64(-0.0).unwrap(), Duration::ZERO);
`,
    ),
  );
});
test("float: valore positivo puo arrotondare a zero", () => {
  run(
    probe(
      0,
      arithmetic,
      String.raw`
    assert_eq!(Duration::try_from_secs_f64(0.000_000_000_1).unwrap(), Duration::ZERO);
    assert_eq!(Duration::try_from_secs_f64(0.000_000_001_4).unwrap(), Duration::from_nanos(1));
`,
    ),
  );
});
test("operatore Duration: sottrazione negativa causa panic", () => {
  run(
    probe(0, arithmetic, "let _ = Duration::ZERO - Duration::from_nanos(1);"),
    { panic: /overflow/ },
  );
});
test("operatore Duration: overflow resta panic nel programma ottimizzato", () => {
  run(
    probe(0, arithmetic, "let _ = Duration::MAX + Duration::from_nanos(1);"),
    {
      args: ["-C", "opt-level=3", "-C", "overflow-checks=no"],
      panic: /overflow/,
    },
  );
});
test("measure: esegue una sola volta e restituisce un prestito mutabile", () => {
  run(
    probe(
      0,
      measure,
      String.raw`
    let mut calls = 0;
    let (value, _) = measure(|| { calls += 1; &mut calls });
    assert_eq!(*value, 1);
    *value += 2;
    assert_eq!(calls, 3);
`,
    ),
  );
});
test("measure: FnOnce consuma la cattura e conserva Err", () => {
  run(
    probe(
      0,
      measure,
      String.raw`
    let message = String::from("failed");
    let (result, _) = measure(move || Err::<(), _>(message));
    assert_eq!(result, Err(String::from("failed")));
`,
    ),
  );
});
test("measure: il panic della closure non viene convertito in risultato", () => {
  run(probe(0, measure, 'measure(|| panic!("measurement failed"));'), {
    panic: /measurement failed/,
  });
});
test("Instant: prima, uguale e dopo hanno esiti distinti", () => {
  run(
    probe(
      0,
      deadline,
      String.raw`
    let base = Instant::now();
    let later = base.checked_add(Duration::from_secs(1)).unwrap();
    assert_eq!(base.checked_duration_since(base), Some(Duration::ZERO));
    assert_eq!(base.checked_duration_since(later), None);
    assert_eq!(remaining(base, later), Duration::ZERO);
    assert_eq!(later.checked_sub(Duration::from_secs(1)), Some(base));
`,
    ),
  );
});
test("Instant: saturazione attuale di elapsed, duration_since e sottrazione", () => {
  run(
    probe(
      0,
      deadline,
      String.raw`
    let base = Instant::now();
    let later = base.checked_add(Duration::from_secs(1)).unwrap();
    assert_eq!(base.duration_since(later), Duration::ZERO);
    assert_eq!(base - later, Duration::ZERO);
    let future = base.checked_add(Duration::from_secs(86_400)).unwrap();
    assert_eq!(future.elapsed(), Duration::ZERO);
`,
    ),
  );
});
test("Instant: checked_add e checked_sub gestiscono range della piattaforma", () => {
  run(
    probe(
      0,
      deadline,
      String.raw`
    let base = Instant::now();
    assert_eq!(base.checked_add(Duration::ZERO), Some(base));
    assert_eq!(base.checked_sub(Duration::ZERO), Some(base));
    if let Some(far) = base.checked_add(Duration::MAX) {
        assert_eq!(far.checked_duration_since(base), Some(Duration::MAX));
    }
    if let Some(far) = base.checked_sub(Duration::MAX) {
        assert_eq!(base.checked_duration_since(far), Some(Duration::MAX));
    }
`,
    ),
  );
});
test("SystemTime: epoch esatta e frazioni in entrambi i versi", () => {
  run(
    probe(
      0,
      epoch,
      String.raw`
    assert_eq!(unix_parts(UNIX_EPOCH).unwrap(), (0, 0));
    let before = UNIX_EPOCH.checked_sub(Duration::from_millis(750)).unwrap();
    assert_eq!(unix_parts(before).unwrap_err().duration(), Duration::from_millis(750));
    let after = UNIX_EPOCH.checked_add(Duration::from_millis(750)).unwrap();
    assert_eq!(unix_parts(after).unwrap(), (0, 750_000_000));
`,
    ),
  );
});
test("SystemTimeError conserva la distanza positiva opposta", () => {
  run(
    probe(
      0,
      epoch,
      String.raw`
    let a = UNIX_EPOCH.checked_add(Duration::from_secs(10)).unwrap();
    let b = UNIX_EPOCH.checked_add(Duration::from_secs(13)).unwrap();
    assert_eq!(b.duration_since(a).unwrap(), Duration::from_secs(3));
    assert_eq!(a.duration_since(b).unwrap_err().duration(), Duration::from_secs(3));
    assert_eq!(a.duration_since(a).unwrap(), Duration::ZERO);
`,
    ),
  );
});
test("SystemTime: checked verifica il range senza modificare l'orologio", () => {
  run(
    probe(
      0,
      epoch,
      String.raw`
    assert_eq!(UNIX_EPOCH.checked_add(Duration::ZERO), Some(UNIX_EPOCH));
    if let Some(far) = UNIX_EPOCH.checked_add(Duration::MAX) {
        assert_eq!(far.duration_since(UNIX_EPOCH).unwrap(), Duration::MAX);
    }
    if let Some(far) = UNIX_EPOCH.checked_sub(Duration::MAX) {
        assert_eq!(UNIX_EPOCH.duration_since(far).unwrap(), Duration::MAX);
    }
`,
    ),
  );
});
