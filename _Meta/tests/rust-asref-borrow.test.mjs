import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["AsRef AsMut e Borrow"];
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
const prefix = "appunti-rust-asref-borrow-";
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
  const execution = launch(output, options.runArgs ?? [], dir);
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

const owned = "Vista e ownership sono due decisioni distinte";
const mutable = "Una vista mutabile non svuota il contenitore";
const key = "Borrow per cercare la stessa chiave in un'altra forma";
const projection = "AsRef per una parte che non identifica tutto il valore";
const extension =
  "Controllare un'estensione senza convertire il percorso in testo";
const read = "Leggere testo da un percorso scelto esplicitamente";
const coercion = "Una coercizione non soddisfa automaticamente un bound";
const lifetime = "Il riferimento non puo uscire dal proprietario locale";
const from = (heading) => source(0, heading);
const inject = (heading, code) => probe(0, heading, code);
const readProbe = (code) =>
  replaceOnce(
    from(read),
    "fn main() -> io::Result<()> {",
    "fn main() -> io::Result<()> {\n" + code,
  );

test("toolchain e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("frontmatter invariato, struttura, fonti e generici preservati", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/AsRef AsMut e Borrow.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "AsRef, AsMut e Borrow",
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
  for (const value of ["AsRef<T>", "AsMut<T>", "Borrow<T>", "BorrowMut<T>"])
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  for (const page of [
    "trait.AsRef.html",
    "trait.AsMut.html",
    "trait.Borrow.html",
    "trait.BorrowMut.html",
    "struct.HashMap.html#method.get",
    "struct.Path.html#method.extension",
    "fn.read_to_string.html",
  ])
    assert(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url.startsWith("https://doc.rust-lang.org/std/") &&
          n.url.endsWith(page),
      ),
      page,
    );
});
for (const heading of [owned, mutable, key, projection, extension, read]) {
  test("programma completo: " + heading, () => {
    assert.equal(run(from(heading)), heading === owned ? "6\n" : "");
  });
}
test("controesempio: Deref non implica AsRef del target transitivo", () => {
  run(from(coercion), { error: "E0277", detail: /AsRef<str>/ });
});
test("controesempio: vista del proprietario locale", () => {
  run(from(lifetime), { error: "E0515" });
});
test("correzioni del bound: vista esplicita e as_str", () => {
  run(
    replaceOnce(
      from(coercion),
      "byte_len(boxed);",
      "assert_eq!(byte_len(view), 4);\n    assert_eq!(byte_len(boxed.as_str()), 4);",
    ),
  );
});
test("la funzione per valore sposta una String", () => {
  run(
    replaceOnce(
      from(owned),
      'println!("{}", byte_len(text));',
      'println!("{}", byte_len(text));\n    assert!(!text.is_empty());',
    ),
    { error: "E0382" },
  );
});
test("vista condivisa: stesso buffer, input str e dyn", () => {
  run(
    inject(
      owned,
      String.raw`
    let input = String::from("abc");
    assert_eq!(text_view(&input).as_ptr(), input.as_ptr());
    let object: &dyn AsRef<str> = &input;
    assert_eq!(text_view(object), "abc");
    assert_eq!(text_view::<str>("xyz"), "xyz");
    assert_eq!(byte_len(&&&input), 3);
  `,
    ),
  );
});
test("byte, scalari e stringhe vuote sono distinti", () => {
  run(
    inject(
      owned,
      String.raw`
    assert_eq!(byte_len(""), 0);
    assert_eq!(byte_len("\u{1f680}"), 4);
    assert_eq!("\u{1f680}".chars().count(), 1);
  `,
    ),
  );
});
test("una vista non sopravvive al proprietario borrowed", () => {
  run(
    inject(
      owned,
      String.raw`
    let view;
    {
        let local = String::from("local");
        view = text_view(&local);
    }
    assert_eq!(view, "local");
  `,
    ),
    { error: "E0597" },
  );
});
test("AsMut: Vec, array, vuoto e lunghezza conservata", () => {
  run(
    inject(
      mutable,
      String.raw`
    let mut values = vec![1_u8, 2, 3];
    let pointer = values.as_ptr();
    let capacity = values.capacity();
    clear_bytes(&mut values);
    assert_eq!(values.len(), 3);
    assert_eq!(values.capacity(), capacity);
    assert_eq!(values.as_ptr(), pointer);
    assert_eq!(values, [0, 0, 0]);
    let mut empty = Vec::<u8>::new();
    clear_bytes(&mut empty);
    let mut array = [1_u8, 2];
    clear_bytes(&mut array);
    assert_eq!(array, [0, 0]);
  `,
    ),
  );
});
test("AsMut: mut locale non rende mutabile un riferimento condiviso", () => {
  run(inject(mutable, "let shared = vec![1_u8]; clear_bytes(&shared);"), {
    error: "E0277",
  });
});
test("AsMut: passare il proprietario lo consuma", () => {
  run(
    inject(
      mutable,
      "let value = Buffer(vec![1]); clear_bytes(value); assert_eq!(value.0.len(), 1);",
    ),
    { error: "E0382" },
  );
});
test("AsMut: riuso del riferimento con reborrow esplicito", () => {
  run(
    inject(
      mutable,
      String.raw`
    let mut data = vec![1_u8, 2];
    let borrowed = &mut data;
    clear_bytes(&mut *borrowed);
    clear_bytes(&mut *borrowed);
    assert_eq!(borrowed.len(), 2);
  `,
    ),
  );
});
test("AsMut non richiede anche AsRef", () => {
  run(
    inject(
      mutable,
      String.raw`
    fn require<T: AsRef<[u8]>>(_: T) {}
    require(Buffer(vec![1]));
  `,
    ),
    { error: "E0277" },
  );
});
test("HashMap: chiave assente, Unicode e sostituzione", () => {
  run(
    inject(
      key,
      String.raw`
    let mut map = HashMap::new();
    assert_eq!(map.insert(UserName(String::from("caff\u{e8}")), 1), None);
    assert_eq!(map.insert(UserName(String::from("caff\u{e8}")), 2), Some(1));
    assert_eq!(map.len(), 1);
    assert_eq!(map.get("caff\u{e8}"), Some(&2));
    assert_eq!(map.get("missing"), None);
    let query = String::from("caff\u{e8}");
    assert_eq!(map.get(query.as_str()), Some(&2));
  `,
    ),
  );
});
test("Borrow: Eq Ord e Hash del wrapper concordano con str", () => {
  run(
    inject(
      key,
      String.raw`
    use std::hash::{DefaultHasher, Hash, Hasher};
    fn fingerprint<T: Hash + ?Sized>(value: &T) -> u64 {
        let mut hasher = DefaultHasher::new();
        value.hash(&mut hasher);
        hasher.finish()
    }
    for a in ["", "a", "A", "z", "caff\u{e8}"] {
        let left = UserName(a.to_owned());
        let view: &str = left.borrow();
        assert_eq!(fingerprint(&left), fingerprint(view));
        for b in ["", "a", "A", "z", "caff\u{e8}"] {
            let right = UserName(b.to_owned());
            assert_eq!(left == right, a == b);
            assert_eq!(left.cmp(&right), a.cmp(b));
        }
    }
  `,
    ),
  );
});
test("AsRef di un campo non abilita HashMap get con str", () => {
  const code = inject(
    projection,
    String.raw`
    let map = std::collections::HashMap::from([(Account { id: 1, name: "ada".into() }, 1)]);
    assert_eq!(map.get("ada"), Some(&1));
  `,
  );
  run(code, { error: "E0308" });
  run(replaceOnce(code, 'map.get("ada")', 'map.get::<str>("ada")'), {
    error: "E0277",
    detail: /Borrow<str>/,
  });
});
test("Borrow e BorrowMut riflessivi per un tipo locale", () => {
  run(String.raw`
    use std::borrow::{Borrow, BorrowMut};
    struct Value(u32);
    fn shared<T: Borrow<Value>>(value: &T) -> &Value { value.borrow() }
    fn exclusive<T: BorrowMut<Value>>(value: &mut T) -> &mut Value { value.borrow_mut() }
    fn main() {
        let mut value = Value(3);
        assert_eq!(shared(&value).0, 3);
        exclusive(&mut value).0 = 7;
        assert_eq!(value.0, 7);
    }
  `);
});
test("AsRef non e riflessivo per ogni tipo; impl locale esplicita", () => {
  const code = String.raw`
    struct Value(u32);
    fn view<T: AsRef<T>>(value: &T) -> &T { value.as_ref() }
    fn main() { assert_eq!(view(&Value(3)).0, 3); }
  `;
  run(code, { error: "E0277" });
  run(
    "impl AsRef<Value> for Value { fn as_ref(&self) -> &Self { self } }\n" +
      code,
  );
});
test("AsMut non e riflessivo per ogni tipo; impl locale esplicita", () => {
  const code = String.raw`
    struct Value(u32);
    fn change<T: AsMut<T>>(value: &mut T) -> &mut T { value.as_mut() }
    fn main() { let mut v = Value(3); change(&mut v).0 = 4; assert_eq!(v.0, 4); }
  `;
  run(code, { error: "E0277" });
  run(
    "impl AsMut<Value> for Value { fn as_mut(&mut self) -> &mut Self { self } }\n" +
      code,
  );
});
test("BorrowMut richiede anche Borrow del target", () => {
  run(
    String.raw`
    use std::borrow::BorrowMut;
    struct Buffer(Vec<u8>);
    impl BorrowMut<[u8]> for Buffer {
        fn borrow_mut(&mut self) -> &mut [u8] { &mut self.0 }
    }
    fn main() {}
  `,
    { error: "E0277" },
  );
});
test("AsRef e Borrow non hanno lo stesso inoltro da &String verso str", () => {
  const code = String.raw`
    use std::borrow::Borrow;
    fn len<T: Borrow<str>>(value: T) -> usize { value.borrow().len() }
    fn main() { let text = String::from("abc"); assert_eq!(len(&text), 3); }
  `;
  run(code, { error: "E0277" });
  run(replaceOnce(code, "len(&text)", "len(text.as_str())"));
});
test("AsRef ambiguo: tipi attesi diversi sulla stessa String", () => {
  run(
    inject(
      owned,
      String.raw`
    let text = String::from("abc");
    let bytes: &[u8] = text.as_ref();
    let value: &str = text.as_ref();
    assert_eq!(bytes, value.as_bytes());
  `,
    ),
  );
});
test("estensioni: ultimo punto, dotfile, case, vuoto e nessun I/O", () => {
  run(
    inject(
      extension,
      String.raw`
    assert!(!has_extension("", ""));
    assert!(!has_extension("README", ""));
    assert!(!has_extension(".", ""));
    assert!(!has_extension("..", ""));
    assert!(has_extension(".config.toml", "toml"));
    assert!(!has_extension("a.tar.gz", "tar.gz"));
    assert!(!has_extension("a.rs", ".rs"));
    assert!(has_extension("directory-that-does-not-exist/demo.rs", "rs"));
    assert!(has_extension("caff\u{e8}.rs", "rs"));
  `,
    ),
  );
});
test("percorso non Unicode: nessuna necessita di to_str", () => {
  assert.equal(process.platform, "win32", "La sonda usa OsStringExt Windows.");
  run(
    inject(
      extension,
      String.raw`
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    let path = PathBuf::from(OsString::from_wide(&[0xd800, 0x2e, 0x72, 0x73]));
    assert!(path.to_str().is_none());
    assert!(has_extension(&path, "rs"));
    let invalid_extension = PathBuf::from(OsString::from_wide(&[0x61, 0x2e, 0xd800]));
    assert!(invalid_extension.extension().unwrap().to_str().is_none());
    assert!(!has_extension(invalid_extension, "rs"));
  `,
    ),
  );
});
test("read_path: CLI su file UTF-8 esplicito, nessuna modifica al file", () => {
  const file = path.join(root, "testo con spazi.txt");
  const data = "prima riga\ncaff\u00e8\n";
  fs.writeFileSync(file, data);
  assert.equal(run(from(read), { runArgs: [file] }), data);
  assert.equal(fs.readFileSync(file, "utf8"), data);
});
test("read_path: contenuto non UTF-8 mantiene InvalidData", () => {
  const file = path.join(root, "binary.bin");
  fs.writeFileSync(file, Buffer.from([0xff, 0xfe]));
  run(
    readProbe(String.raw`
    let path = std::env::args_os().nth(1).unwrap();
    assert_eq!(read_path(PathBuf::from(path)).unwrap_err().kind(), io::ErrorKind::InvalidData);
    return Ok(());
  `),
    { runArgs: [file] },
  );
});
test("read_path: percorso assente mantiene NotFound", () => {
  run(
    readProbe(String.raw`
    let path = std::env::args_os().nth(1).unwrap();
    assert_eq!(read_path(PathBuf::from(path)).unwrap_err().kind(), io::ErrorKind::NotFound);
    return Ok(());
  `),
    { runArgs: [path.join(root, "missing.txt")] },
  );
});
test("read_path: CLI propaga l'errore anziche produrre testo vuoto", () => {
  run(from(read), {
    runArgs: [path.join(root, "missing-cli.txt")],
    exitCode: 1,
    stderr: /NotFound/,
  });
});
