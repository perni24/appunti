import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Iterator API"];
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
const prefix = "appunti-rust-iterator-api-";
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

const state = "Stato residuo e lettura dalle due estremita";
const composition = "Comporre sorgenti senza collezioni intermedie";
const peek = "Peekable e consumo condizionale";
const words = "Parole uniche ordinate con una policy esplicita";
const sum = "Somma fallibile e posizione dopo l'errore";
const reversed = "Accettare un iterabile e restituire una pipeline";
const custom = "Implementare una sorgente finita";
const failure = "Chiedere len dopo un filtro";
const from = (heading) => source(0, heading);

test("toolchain e inventario: otto esempi completi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});

test("metadati originali, template, fonti e tabella", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Iterator API.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Iterator API",
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
  ]) {
    assert(
      headings.some((n) => n.depth === 2 && text(n) === section),
      section,
    );
  }
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  const nodes = [];
  function walk(n) {
    nodes.push(n);
    for (const c of n.children ?? []) walk(c);
  }
  walk(note.tree);
  assert(!nodes.some((n) => n.type === "html"));
  for (const type of ["Result<Vec<T>, E>", "Vec<T>", "&&T"]) {
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === type),
      type,
    );
  }
  for (const link of [
    "trait.Iterator.html",
    "trait.ExactSizeIterator.html",
    "struct.Peekable.html",
    "trait.DoubleEndedIterator.html",
  ]) {
    assert(note.source.includes("https://doc.rust-lang.org/std/iter/" + link));
  }
  assert.doesNotMatch(note.source, /@B[T]@/);
});

for (const [heading, code] of blocks[0]) {
  test("nota: " + heading, () =>
    run(code, heading === failure ? { error: "E0599" } : {}),
  );
}
for (const heading of [sum, custom]) {
  test("ottimizzato: " + heading, () =>
    run(from(heading), { args: ["-C", "opt-level=3"] }),
  );
}

test("Countdown: tutti i valori u8, hint, len e fine permanente", () =>
  run(
    probe(
      0,
      custom,
      `
    fn require_fused<T: FusedIterator>(_: &T) {}
    for n in 0..=u8::MAX {
        let mut c = Countdown { remaining: n };
        require_fused(&c);
        for expected in (1..=n).rev() {
            assert_eq!(c.size_hint(), (usize::from(expected), Some(usize::from(expected))));
            assert_eq!(c.len(), usize::from(expected));
            assert_eq!(c.next(), Some(expected));
        }
        assert_eq!(c.size_hint(), (0, Some(0)));
        assert_eq!(c.next(), None);
        assert_eq!(c.next(), None);
    }
`,
    ),
  ));

test("Countdown: for usa IntoIterator generico e count consuma", () =>
  run(
    probe(
      0,
      custom,
      `
    let mut output = Vec::new();
    for n in (Countdown { remaining: 4 }) { output.push(n); }
    assert_eq!(output, [4, 3, 2, 1]);
    assert_eq!(Countdown { remaining: 255 }.count(), 255);
`,
    ),
  ));

test("somma: grammatica, vuoto, confini e overflow del singolo numero", () =>
  run(
    probe(
      0,
      sum,
      `
    for (input, expected) in [
        (vec![], Ok(0)),
        (vec!["0", "+1", "0002"], Ok(3)),
        (vec!["65535", "0"], Ok(65535)),
        (vec!["65536"], Err("invalid number")),
        (vec!["-1"], Err("invalid number")),
        (vec![" 1"], Err("invalid number")),
        (vec!["1 "], Err("invalid number")),
        (vec![""], Err("invalid number")),
        (vec!["65535", "1"], Err("sum overflow")),
    ] {
        assert_eq!(sum_remaining(&mut input.into_iter()), expected);
    }
`,
    ),
  ));

test("somma: errore primo/ultimo, ripresa con accumulatore nuovo", () =>
  run(
    probe(
      0,
      sum,
      `
    let mut input = ["bad", "1", "2"].into_iter();
    assert_eq!(sum_remaining(&mut input), Err("invalid number"));
    assert_eq!(sum_remaining(&mut input), Ok(3));
    let mut last = ["1", "bad"].into_iter();
    assert_eq!(sum_remaining(&mut last), Err("invalid number"));
    assert_eq!(last.next(), None);
    let mut partial = ["10", "bad", "2"].into_iter();
    assert_eq!(sum_remaining(&mut partial), Err("invalid number"));
    assert_eq!(sum_remaining(&mut partial), Ok(2));
`,
    ),
  ));

test("somma: overflow wrapping rilevato dagli assert della nota", () =>
  run(
    replaceOnce(
      from(sum),
      'total.checked_add(value).ok_or("sum overflow")',
      "Ok(total.wrapping_add(value))",
    ),
    { panic: /assertion.*failed/ },
  ));

test("parole: duplicati non adiacenti, bordi e punteggiatura interna", () =>
  run(
    probe(
      0,
      words,
      `
    assert_eq!(unique_sorted_words("web api web API"), ["api", "web"]);
    assert_eq!(unique_sorted_words("___42___ l'API api/web"), ["42", "api/web", "l'api"]);
    assert_eq!(unique_sorted_words("\n\t"), Vec::<String>::new());
`,
    ),
  ));

test("parole: lowercase non e normalizzazione o case folding", () =>
  run(
    probe(
      0,
      words,
      `
    assert_eq!(unique_sorted_words("e\u{301}"), ["e"]);
    assert_eq!(unique_sorted_words("\u{e9} e\u{301}x"), ["e\u{301}x", "\u{e9}"]);
    assert_eq!(unique_sorted_words("STRASSE Stra\u{df}e"), ["strasse", "stra\u{df}e"]);
    assert_eq!(unique_sorted_words("\u{130}"), ["i\u{307}"]);
`,
    ),
  ));

test("parole: rimozione sort rilevata dagli assert della nota", () =>
  run(replaceOnce(from(words), "    words.sort();", ""), {
    panic: /assertion.*failed/,
  }));

test("API generica: vuoto, prestito mutabile e consumo parziale", () =>
  run(
    probe(
      0,
      reversed,
      `
    assert_eq!(reversed(Vec::<String>::new()).count(), 0);
    let mut values = [1, 2, 3];
    for value in reversed(&mut values) { *value *= 2; }
    assert_eq!(values, [2, 4, 6]);
    let mut range = 0..4;
    assert_eq!(range.next(), Some(0));
    assert_eq!(reversed(range).collect::<Vec<_>>(), [3, 2, 1]);
`,
    ),
  ));

test("API generica: output non espone len", () =>
  run(
    probe(
      0,
      reversed,
      `
    let pipeline = reversed([1, 2]);
    println!("{}", pipeline.len());
`,
    ),
    { error: "E0599" },
  ));

test("API generica: sorgente senza DoubleEndedIterator rifiutata", () =>
  run(
    probe(
      0,
      reversed,
      `
    let input = std::iter::from_fn(|| Some(1));
    let _ = reversed(input);
`,
    ),
    { error: "E0277" },
  ));

test("filter puo essere DoubleEndedIterator senza ExactSizeIterator", () =>
  run(`
fn main() {
    let mut even = (0..10).filter(|n| n % 2 == 0);
    assert_eq!(even.size_hint(), (0, Some(10)));
    assert_eq!(even.next_back(), Some(8));
    assert_eq!(even.by_ref().rev().collect::<Vec<_>>(), [6, 4, 2, 0]);
    assert_eq!(even.next(), None);
}
`));

test("chain di iteratori esatti non offre len", () =>
  run(
    `
fn main() {
    let chain = [1, 2].into_iter().chain([3, 4]);
    println!("{}", chain.len());
}
`,
    { error: "E0599" },
  ));

test("nth e position sono relativi allo stato corrente", () =>
  run(`
fn main() {
    let mut values = [10, 20, 30, 40, 50].into_iter();
    assert_eq!(values.next(), Some(10));
    assert_eq!(values.position(|v| v == 30), Some(1));
    assert_eq!(values.next(), Some(40));
    assert_eq!(values.nth(1), None);
    assert_eq!(values.next(), None);
}
`));

test("peek cache di riferimenti, next_if falso e take_while", () =>
  run(`
fn main() {
    let values = [1, 2, 3];
    let mut peek = values.iter().peekable();
    let first: Option<&&i32> = peek.peek();
    assert_eq!(first, Some(&&1));
    assert_eq!(peek.next_if(|&&n| n > 1), None);
    assert_eq!(peek.next(), Some(&1));
    let mut input = [1, 2, 3].into_iter();
    assert_eq!(input.by_ref().take_while(|n| *n < 2).collect::<Vec<_>>(), [1]);
    assert_eq!(input.next(), Some(3));
}
`));

test("enumerate prima/dopo il filtro e limite di lavoro", () =>
  run(`
use std::cell::Cell;
fn main() {
    let before: Vec<_> = [3, 4, 5, 6].into_iter().enumerate().filter(|(_, n)| n % 2 == 0).collect();
    let after: Vec<_> = [3, 4, 5, 6].into_iter().filter(|n| n % 2 == 0).enumerate().collect();
    assert_eq!(before, [(1, 4), (3, 6)]);
    assert_eq!(after, [(0, 4), (1, 6)]);
    let calls = Cell::new(0);
    let result: Vec<_> = (0..).take(10).filter(|_| { calls.set(calls.get()+1); false }).take(1).collect();
    assert!(result.is_empty());
    assert_eq!(calls.get(), 10);
}
`));

test("map_while fused termina ma la sorgente prestata e avanzata", () =>
  run(`
fn main() {
    let mut input = ["1", "bad", "3"].into_iter();
    {
        let mut prefix = input.by_ref().map_while(|s| s.parse::<u8>().ok()).fuse();
        assert_eq!(prefix.next(), Some(1));
        assert_eq!(prefix.next(), None);
        assert_eq!(prefix.next(), None);
    }
    assert_eq!(input.next(), Some("3"));
    let valid: Vec<_> = ["1", "bad", "3"].into_iter().filter_map(|s| s.parse::<u8>().ok()).collect();
    assert_eq!(valid, [1, 3]);
}
`));

test("scan mantiene lo stato e None interrompe la raccolta", () =>
  run(`
fn main() {
    let totals: Vec<_> = [1_u16, 2, 3].into_iter().scan(0_u16, |total, n| {
        *total += n;
        Some(*total)
    }).collect();
    assert_eq!(totals, [1, 3, 6]);
    let mut input = [1, 2, 3].into_iter();
    let prefix: Vec<_> = input.by_ref().scan((), |_, n| if n == 2 {None} else {Some(n)}).collect();
    assert_eq!(prefix, [1]);
    assert_eq!(input.next(), Some(3));
}
`));

test("try_for_each mantiene gli effetti precedenti e ControlFlow ferma", () =>
  run(`
use std::ops::ControlFlow;
fn main() {
    let mut visited = Vec::new();
    let mut input = [1, 2, 3, 4].into_iter();
    let result: Result<(), &str> = input.try_for_each(|n| {
        visited.push(n);
        if n == 3 { Err("stop") } else { Ok(()) }
    });
    assert_eq!(result, Err("stop"));
    assert_eq!(visited, [1, 2, 3]);
    assert_eq!(input.next(), Some(4));

    let mut values = [2, 4, 7, 8].into_iter();
    let found = values.try_for_each(|n| {
        if n % 2 == 1 { ControlFlow::Break(n) } else { ControlFlow::Continue(()) }
    });
    assert_eq!(found, ControlFlow::Break(7));
    assert_eq!(values.next(), Some(8));
}
`));

test("collect Result preserva errore, flatten lo perde", () =>
  run(`
fn main() {
    let mut input = [Ok(1), Err("bad"), Ok(3)].into_iter();
    let result: Result<Vec<_>, _> = input.by_ref().collect();
    assert_eq!(result, Err("bad"));
    assert_eq!(input.next(), Some(Ok(3)));
    let lost: Vec<_> = [Ok(1), Err("bad"), Ok(3)].into_iter().flatten().collect();
    assert_eq!(lost, [1, 3]);
    let nested = [vec![vec![1], vec![2]]];
    let one_level: Vec<Vec<i32>> = nested.into_iter().flatten().collect();
    assert_eq!(one_level, [vec![1], vec![2]]);
}
`));

test("partition, unzip, String e extend hanno destinazioni esplicite", () =>
  run(`
fn main() {
    let (even, odd): (Vec<_>, Vec<_>) = (1..=4).partition(|n| n % 2 == 0);
    assert_eq!(even, [2, 4]);
    assert_eq!(odd, [1, 3]);
    let (names, ports): (Vec<_>, Vec<_>) = [("api", 8000), ("web", 8001)].into_iter().unzip();
    assert_eq!(names, ["api", "web"]);
    assert_eq!(ports, [8000, 8001]);
    let word: String = ['a', 'p', 'i'].into_iter().collect();
    assert_eq!(word, "api");
    let mut values = vec![1];
    values.extend([2, 3]);
    assert_eq!(values, [1, 2, 3]);
}
`));

test("Vec immutabile non consente iter_mut", () =>
  run(
    `
fn main() {
    let values = vec![1, 2];
    for n in values.iter_mut() { *n += 1; }
}
`,
    { error: "E0596" },
  ));

test("callback filter e find prendono un riferimento a Item", () =>
  run(`
fn main() {
    let values = [1, 2, 3];
    let selected: Vec<&i32> = values.iter().filter(|n: &&i32| **n > 1).collect();
    assert_eq!(selected, [&2, &3]);
    let transformed: Vec<i32> = values.iter().map(|n: &i32| *n * 2).collect();
    assert_eq!(transformed, [2, 4, 6]);
    assert_eq!(values.iter().find(|n: &&i32| **n == 2), Some(&2));
}
`));
