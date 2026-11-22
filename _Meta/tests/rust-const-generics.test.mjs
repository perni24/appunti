import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const file = "Programmazione/Rust/Pagine/Const generics.md";
const originalBytes = fs.readFileSync(file);
const note = parseNote(file);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = new Map();
let heading;
for (const node of note.tree.children) {
  if (node.type === "heading") heading = text(node);
  if (node.type === "code" && node.lang === "rust") {
    assert.ok(heading && !blocks.has(heading));
    blocks.set(heading, node.value);
  }
}
const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const parent = fs.realpathSync(os.tmpdir());
const prefix = "appunti-rust-const-generics-";
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  try {
    assert.deepEqual(fs.readFileSync(file), originalBytes);
  } finally {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), parent);
    assert.ok(path.basename(resolved).startsWith(prefix));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});
const env = { ...process.env, RUST_BACKTRACE: "0" };
for (const key of [
  "RUSTFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
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
let sequence = 0;
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
      ...(options.rustcArgs || []),
      "main.rs",
      "-o",
      output,
    ],
    dir,
  );
  if (options.error || options.message) {
    assert.notEqual(compiled.status, 0);
    const errors = compiled.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      errors.some(
        (d) =>
          d.level === "error" &&
          (options.error
            ? d.code?.code === options.error
            : options.message.test(d.message)),
      ),
      compiled.stderr,
    );
    return;
  }
  assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr);
  const execution = launch(output, options.cliArgs || [], dir);
  assert.equal(
    execution.status,
    options.exitCode ?? 0,
    execution.stdout + execution.stderr,
  );
  if (options.stderr) assert.match(execution.stderr, options.stderr);
  else assert.equal(execution.stderr, "");
  return execution.stdout.replaceAll("\r\n", "\n");
}
function from(title) {
  assert.ok(blocks.has(title), title);
  return blocks.get(title);
}
function replace(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}

const buffer = "Buffer, impl e valore predefinito";
const first = "Funzione generica e inferenza";
const matrix = "Matrice con due dimensioni";
const noncopy = "Costruire elementi non Copy";
const utf8 = "FixedStr: lunghezza e UTF-8 sono invarianti diverse";
const slice = "Passare da una slice runtime a una dimensione fissata";
const bool = "Parametro booleano per una modalita";
const mismatch = "Confondere lunghezze diverse";
const runtime = "Usare una variabile locale come argomento const";
const expression = "Calcolare N + 1 dentro un tipo";
const forbidden = "Parametro const con tipo non ammesso";
function main(title, body) {
  const code = from(title);
  assert.equal(code.split("fn main(").length, 2);
  return (
    code.slice(0, code.indexOf("fn main(")) + "fn main() {\n" + body + "\n}"
  );
}
test("baseline reale e inventario di undici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks.size, 11);
});
test("frontmatter invariato, struttura, fonti e codice sicuro", () => {
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(originalBytes.toString()), yaml(head.stdout));
  assert.equal(note.data.status, "non revisionato");
  assert.equal(note.data.publish, true);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Const generics",
  ]);
  for (const title of [
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
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  }
  for (const url of [
    "https://doc.rust-lang.org/reference/items/generics.html",
    "https://doc.rust-lang.org/std/array/fn.from_fn.html",
    "https://blog.rust-lang.org/2025/08/07/Rust-1.89.0/",
    "https://doc.rust-lang.org/unstable-book/language-features/generic-const-exprs.html",
  ]) {
    assert.ok(originalBytes.toString().includes(url));
  }
  for (const code of blocks.values()) {
    assert.doesNotMatch(
      code,
      /unsafe\s*\{|todo!|unimplemented!|#!\[feature|process::exit/,
    );
  }
});
for (const title of [buffer, first, matrix, noncopy, utf8, slice, bool]) {
  test("programma originale: " + title, () =>
    assert.equal(run(from(title)), ""),
  );
}
test("controesempio: lunghezza errata", () =>
  run(from(mismatch), { error: "E0308" }));
test("controesempio: argomento locale non costante", () =>
  run(from(runtime), { error: "E0435" }));
test("controesempio: N + 1 in un tipo", () =>
  run(from(expression), {
    message: /generic parameters may not be used in const operations/,
  }));
test("controesempio: parametro str", () =>
  run(from(forbidden), {
    message: /forbidden as the type of a const generic parameter/,
  }));
test("buffer vuoto e default non sovrascrive una dimensione esplicita", () => {
  run(
    main(
      buffer,
      "let empty = Buffer::<0>::new([]); assert_eq!(empty.len(), 0); assert!(empty.as_slice().is_empty()); let other: Buffer<2> = Buffer::new([7, 8]); assert_eq!(other.as_slice(), &[7, 8]);",
    ),
  );
});
test("default in posizione di tipo richiede sedici elementi", () => {
  run(main(buffer, "let _value: Buffer = Buffer::new([0; 3]);"), {
    error: "E0308",
  });
});
test("argomenti con stesso valore producono lo stesso tipo", () => {
  run(
    main(
      buffer,
      "let value: Buffer<4> = Buffer::<{2 + 2}>::new([0; 4]); assert_eq!(value.len(), 4);",
    ),
  );
});
test("inferenza const dal tipo di destinazione", () => {
  run(
    "fn zeros<const N: usize>() -> [u8; N] { [0; _] } fn main() { let result: [u8; 4] = zeros::<_>(); assert_eq!(result, [0; 4]); }",
  );
});
test("inferenza senza contesto rifiutata", () => {
  run(
    "fn zeros<const N: usize>() -> [u8; N] { [0; N] } fn main() { let _result = zeros::<_>(); }",
    { error: "E0284" },
  );
});
test("dimensione inferita non ammessa nella firma", () => {
  run("fn zeros<const N: usize>() -> [u8; _] { [0; N] } fn main() {}", {
    error: "E0121",
  });
});
test("versione first per riferimento non richiede Copy", () => {
  run(
    'fn first<T, const N: usize>(items: &[T; N]) -> Option<&T> { items.first() } fn main() { let items = [String::from("one")]; assert_eq!(first(&items).unwrap(), "one"); assert_eq!(items[0], "one"); }',
  );
});
test("una slice non conserva la lunghezza come argomento const", () => {
  run(
    main(
      first,
      "let values = [1, 2, 3]; let view: &[i32] = &values; let _value = first(view);",
    ),
    { error: "E0308" },
  );
});
test("matrici con dimensioni zero conservano il tipo e non indicizzano", () => {
  run(
    main(
      matrix,
      "let rows: Matrix<u8, 0, 3> = Matrix::new([]); assert_eq!(rows.shape(), (0, 3)); assert_eq!(rows.get(0, 0), None); let columns: Matrix<u8, 2, 0> = Matrix::new([[], []]); assert_eq!(columns.shape(), (2, 0)); assert_eq!(columns.get(0, 0), None);",
    ),
  );
});
test("matrice con String senza Copy e senza Clone", () => {
  run(
    main(
      matrix,
      'let matrix = Matrix::new([[String::from("cell")]]); assert_eq!(matrix.get(0, 0).unwrap(), "cell");',
    ),
  );
});
test("from_fn invoca la closure in ordine e conserva lo stato", () => {
  run(
    'fn main() { let mut seen = Vec::new(); let values: [String; 4] = std::array::from_fn(|i| { seen.push(i); format!("v-{i}") }); assert_eq!(seen, vec![0, 1, 2, 3]); assert_eq!(values[3], "v-3"); }',
  );
});
test("ripetizione di String ordinaria rifiutata", () => {
  run('fn main() { let _values = [String::from("x"); 3]; }', {
    error: "E0277",
  });
});
test("ripetizione concreta zero e uno non richiede Copy ma valuta una volta", () => {
  run(
    'fn main() { let mut calls = 0; let empty: [String; 0] = [{ calls += 1; String::from("unused") }; 0]; assert!(empty.is_empty()); assert_eq!(calls, 1); let one = [String::from("only"); 1]; assert_eq!(one, ["only"]); }',
  );
});

test("ripetizione const vuota non valuta il panic", () => {
  run(
    'fn main() { let empty: [String; 0] = [const { panic!("must not run") }; 0]; assert!(empty.is_empty()); }',
  );
});

test("ripetizione con inline const non richiede Copy", () => {
  run(
    "fn main() { let mut values = [const { String::new() }; 3]; values[0].push('x'); assert_eq!(values[0], \"x\"); assert!(values[1].is_empty()); assert!(values[2].is_empty()); }",
  );
});
test("FixedStr vuota e testo multibyte senza modifiche dei byte", () => {
  run(
    main(
      utf8,
      'let empty = FixedStr::from_bytes([]).unwrap(); assert_eq!(empty.as_str(), ""); let text = FixedStr::from_bytes([0x61, 0xc3, 0xa8]).unwrap(); assert_eq!(text.as_str().chars().count(), 2); assert_eq!(text.as_bytes(), &[0x61, 0xc3, 0xa8]);',
    ),
  );
});
for (const bytes of [
  "[0xc3]",
  "[0x80]",
  "[0xc0, 0xaf]",
  "[0xed, 0xa0, 0x80]",
]) {
  test("FixedStr rifiuta UTF-8 non valido: " + bytes, () => {
    run(main(utf8, "assert!(FixedStr::from_bytes(" + bytes + ").is_err());"));
  });
}
test("campo privato impedisce UTF-8 non validato", () => {
  run(main(utf8, "let _invalid = FixedStr { bytes: [0xff] };"), {
    error: "E0451",
  });
});
test("as_bytes non permette una mutazione che invalidi UTF-8", () => {
  run(
    main(
      utf8,
      'let value = FixedStr::from_bytes(*b"rust").unwrap(); value.as_bytes()[0] = 0xff;',
    ),
    { error: "E0594" },
  );
});
test("conversione slice rifiuta lunghezze zero, tre e cinque", () => {
  run(
    main(
      slice,
      "for length in [0, 3, 5] { let input = vec![0; length]; assert!(four_bytes(&input).is_err()); }",
    ),
  );
});
test("conversione slice preserva il prestito anche dentro un buffer piu grande", () => {
  run(
    main(
      slice,
      "let input = [0, 1, 2, 3, 4, 5]; let fixed = four_bytes(&input[1..5]).unwrap(); assert_eq!(fixed, &[1, 2, 3, 4]); assert_eq!(fixed.as_ptr(), input[1..].as_ptr());",
    ),
  );
});
test("riferimento convertito non puo uscire dal proprietario", () => {
  let code = from(slice).slice(0, from(slice).indexOf("fn main("));
  code +=
    "fn invalid() -> &'static [u8; 4] { let data = vec![1, 2, 3, 4]; four_bytes(&data).unwrap() } fn main() {}";
  run(code, { error: "E0515" });
});
test("bool const varia la formattazione ma non il valore runtime", () => {
  run(
    main(
      bool,
      'assert_eq!(format_id::<true>(0), "00"); assert_eq!(format_id::<false>(255), "ff");',
    ),
  );
});
test("tutti i quattordici tipi ammessi come parametri const", () => {
  const types = [
    "u8",
    "u16",
    "u32",
    "u64",
    "u128",
    "usize",
    "i8",
    "i16",
    "i32",
    "i64",
    "i128",
    "isize",
    "char",
    "bool",
  ];
  const declarations = types.map(
    (type, i) => "struct Value" + i + "<const V: " + type + ">;",
  );
  const uses = types.map(
    (type, i) =>
      "let _value = Value" +
      i +
      "::<" +
      (type === "char" ? "'x'" : type === "bool" ? "true" : "1") +
      ">;",
  );
  run(declarations.join("\n") + "\nfn main() { " + uses.join("\n") + " }");
});
test("float non ammesso come parametro const", () => {
  run("struct Value<const N: f64>; fn main() {}", {
    message: /forbidden as the type of a const generic parameter/,
  });
});
test("correzione: dimensione concreta compatibile", () => {
  run(replace(from(mismatch), "[0; 3]", "[0; 4]"));
});
test("correzione: valore locale dichiarato const", () => {
  run(replace(from(runtime), "let size = 3;", "const size: usize = 3;"));
});
for (const form of ["{ N + 1 }", "const { N + 1 }", "next(N)"]) {
  test("N + 1 non aggirabile con: " + form, () => {
    let code = from(expression);
    assert.equal(code.split("N + 1").length, 3);
    code = code.replaceAll("N + 1", form);
    if (form === "next(N)")
      code = "const fn next(n: usize) -> usize { n + 1 }\n" + code;
    run(code, {
      message: /generic parameters may not be used in const operations/,
    });
  });
}
test("array annidato evita il prodotto generico nella lunghezza", () => {
  run(
    "fn matrix<const R: usize, const C: usize>() -> [[u8; C]; R] { [[0; C]; R] } fn main() { assert_eq!(matrix::<2, 3>(), [[0; 3]; 2]); }",
  );
});
test("item annidato non cattura N", () => {
  run(
    "fn outer<const N: usize>() { const VALUE: usize = N; } fn main() { outer::<3>(); }",
    { error: "E0401" },
  );
});
test("Default standard per trentadue ma non trentatre elementi", () => {
  run(
    "fn main() { let values: [u8; 32] = Default::default(); assert_eq!(values, [0; 32]); }",
  );
  run("fn main() { let _values: [u8; 33] = Default::default(); }", {
    error: "E0277",
  });
});
