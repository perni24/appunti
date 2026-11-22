import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Lifetime annotations"];
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
const prefix = "appunti-rust-lifetime-annotations-";
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
  assert.equal(execution.status, 0, execution.stdout + execution.stderr);
  assert.equal(execution.stderr, "");
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

const longest = "Scegliere tra due riferimenti";
const independent = "Legare l'output solo al primo input";
const view = "Struct e metodo: prestito dei dati e prestito di self";
const bounds = "Outlives tra lifetime e tra tipo e lifetime";
const choose = "Testo configurato oppure valore di riserva";
const owned = "Riferimento static, bound static e risultato posseduto";
const expired = "Usare il risultato dopo la fine di uno dei prestiti";
const local = "Restituire un riferimento a una String locale";
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("metadati originali, struttura e fonti ufficiali", () => {
  const filename = "Programmazione/Rust/Pagine/Lifetime annotations.md";
  const head = launch("git", ["show", "HEAD:" + filename], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const frontmatter = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(
    frontmatter(fs.readFileSync(filename, "utf8")),
    frontmatter(head.stdout),
  );
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), names);
  for (const heading of [
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
    assert(headings.some((n) => n.depth === 2 && text(n) === heading));
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(notes[0].body, /doc\.rust-lang\.org\/reference\/trait-bounds/);
  assert.match(notes[0].body, /E0597/);
  assert.match(notes[0].body, /E0515/);
});
for (const heading of [
  longest,
  independent,
  view,
  bounds,
  choose,
  owned,
  expired,
  local,
]) {
  test("Programma della nota: " + heading, () => {
    const error =
      heading === expired ? "E0597" : heading === local ? "E0515" : null;
    const output = run(source(0, heading), error ? { error } : {});
    if (!error) assert.equal(output, heading === bounds ? '"dato"\n' : "");
  });
}

test("longest: vuoto, parita e byte UTF-8", () =>
  run(
    extend(
      longest,
      String.raw`
    assert_eq!(longest("", ""), "");
    assert_eq!(longest("", "a"), "a");
    assert_eq!(longest("abc", ""), "abc");
    assert_eq!(longest("\u{1F600}", "abc"), "\u{1F600}");
    assert_eq!(longest("\u{00E8}", "ab"), "ab");
`,
    ),
  ));
test("longest: il risultato e una vista sull'input selezionato", () =>
  run(
    extend(
      longest,
      `
    let a=String::from("uno");
    let b=String::from("quattro");
    assert!(std::ptr::eq(longest(&a,&b),b.as_str()));
    assert!(std::ptr::eq(longest(&b,&a),b.as_str()));
`,
    ),
  ));
test("longest: prestito finito prima dello scope del binding", () =>
  run(
    extend(
      longest,
      `
    let mut a=String::from("abcd");
    let b=String::from("x");
    let r=longest(&a,&b);
    assert_eq!(r,"abcd");
    a.push('!');
    assert_eq!(a,"abcd!");
`,
    ),
  ));
test("longest: mutazione prima dell'ultimo uso rifiutata", () =>
  run(
    extend(
      longest,
      `
    let mut a=String::from("abcd");
    let b=String::from("x");
    let r=longest(&a,&b);
    a.push('!');
    assert_eq!(r,"abcd");
`,
    ),
    { error: "E0502" },
  ));
test("longest: move del proprietario prima dell'ultimo uso rifiutato", () =>
  run(
    extend(
      longest,
      `
    let a=String::from("abcd");
    let b=String::from("x");
    let r=longest(&a,&b);
    drop(a);
    println!("{r}");
`,
    ),
    { error: "E0505" },
  ));
test("due input: elision ambigua anche con corpo semplice", () =>
  run(
    replaceOnce(
      source(0, independent),
      "fn first_with_label<'a>(text: &'a str, _label: &str) -> &'a str",
      "fn first_with_label(text: &str, _label: &str) -> &str",
    ),
    { error: "E0106" },
  ));
test("indipendenza: secondo lifetime esplicito equivalente", () =>
  run(
    replaceOnce(
      source(0, independent),
      "fn first_with_label<'a>(text: &'a str, _label: &str)",
      "fn first_with_label<'a, 'b>(text: &'a str, _label: &'b str)",
    ),
  ));
test("vincolo superfluo sulla label limita il chiamante", () =>
  run(replaceOnce(source(0, independent), "_label: &str", "_label: &'a str"), {
    error: "E0597",
  }));
test("ritorno della label viola il contratto sul primo parametro", () =>
  run(replaceOnce(source(0, independent), "    text\n}", "    _label\n}"), {
    error: "E0621",
  }));
test("View: output eliso vincolato al receiver", () =>
  run(
    replaceOnce(
      source(0, view),
      "fn text(&self) -> &'a str",
      "fn text(&self) -> &str",
    ),
    { error: "E0597" },
  ));
test("View: lifetime esplicito del receiver indipendente", () =>
  run(
    replaceOnce(
      source(0, view),
      "fn text(&self) -> &'a str",
      "fn text<'s>(&'s self) -> &'a str",
    ),
  ));
test("View: i dati non possono essere distrutti prima dell'uso", () =>
  run(
    extend(
      view,
      `
    let borrowed;
    {
        let data=String::from("breve");
        let v=View {text:&data};
        borrowed=v.text();
    }
    println!("{borrowed}");
`,
    ),
    { error: "E0597" },
  ));
test("View: non alloca e restituisce lo stesso riferimento", () =>
  run(
    extend(
      view,
      `
    let data=String::from("test");
    let v=View {text:&data};
    assert!(std::ptr::eq(v.text(),data.as_str()));
`,
    ),
  ));
test("T outlives a: bound gia implicato da &a T", () => {
  assert.equal(
    run(
      replaceOnce(
        source(0, bounds),
        "T: Debug + ?Sized + 'a,",
        "T: Debug + ?Sized,",
      ),
    ),
    '"dato"\n',
  );
});
test("Debug non e un implied bound", () =>
  run(
    replaceOnce(
      source(0, bounds),
      "T: Debug + ?Sized + 'a,",
      "T: ?Sized + 'a,",
    ),
    { error: "E0277" },
  ));
test("str richiede ?Sized in questo generic", () =>
  run(
    replaceOnce(source(0, bounds), "T: Debug + ?Sized + 'a,", "T: Debug + 'a,"),
    { error: "E0277" },
  ));
test("shorten: rimuovere outlives rende la firma invalida", () =>
  run(replaceOnce(source(0, bounds), "    'long: 'short,", ""), {
    message: /lifetime may not live long enough/,
  }));
test("shorten: invertire outlives non mantiene il contratto", () =>
  run(
    replaceOnce(source(0, bounds), "    'long: 'short,", "    'short: 'long,"),
    { message: /lifetime may not live long enough/ },
  ));
test("shorten: un literal puo avere un prestito piu breve", () =>
  run(
    extend(
      bounds,
      `
    fn alongside<'s>(other:&'s str)->&'s str {
        let result: &'s str=shorten("static");
        assert!(!other.is_empty());
        result
    }
    let value=String::from("breve");
    assert_eq!(alongside(&value),"static");
`,
    ),
  ));

test("choose: casi vuoti, spazi Unicode e aliasing senza copie", () =>
  run(
    extend(
      choose,
      String.raw`
    let primary=String::from("\u{2003}");
    let fallback=String::from("riserva");
    assert!(std::ptr::eq(choose_non_empty(&primary,&fallback),primary.as_str()));
    assert!(std::ptr::eq(choose_non_empty(primary.trim(),&fallback),fallback.as_str()));
    assert_eq!(choose_non_empty("\u{00E8}", "x"), "\u{00E8}");
`,
    ),
  ));
test("choose: il ramo primario non libera il prestito del fallback", () =>
  run(
    extend(
      choose,
      `
    let a=String::from("presente");
    let mut b=String::from("riserva");
    let result=choose_non_empty(&a,&b);
    b.clear();
    println!("{result}");
`,
    ),
    { error: "E0502" },
  ));
test("choose: togliere to_owned impedisce di conservare la vista", () =>
  run(
    replaceOnce(
      source(0, choose),
      'choose_non_empty("", &temporary).to_owned()',
      'choose_non_empty("", &temporary)',
    ),
    { error: "E0597" },
  ));
test("errore di durata: copiare prima della distruzione lo corregge", () => {
  assert.equal(
    run(
      replaceOnce(
        source(0, expired),
        "result = choose_non_empty(&primary, &fallback);",
        "result = choose_non_empty(&primary, &fallback).to_owned();",
      ),
    ),
    "persistente\n",
  );
});
test("static: valori String e contenitori posseduti non sono immortali", () =>
  run(
    extend(
      owned,
      `
    let items=accepts_static(vec![String::from("a")]);
    assert_eq!(items[0],"a");
    drop(items);
`,
    ),
  ));
test("static: prendere in prestito una String locale non basta", () =>
  run(
    extend(
      owned,
      `
    let data=String::from("locale");
    let value=accepts_static(&data);
    assert_eq!(value,"locale");
`,
    ),
    { error: "E0597" },
  ));
test("static: Vec posseduto con elementi in prestito non basta", () =>
  run(
    extend(
      owned,
      `
    let data=String::from("locale");
    let values=accepts_static(vec![data.as_str()]);
    assert_eq!(values[0],"locale");
`,
    ),
    { error: "E0597" },
  ));
test("static: un risultato String e trasferito, non preso in prestito", () =>
  run(
    extend(
      owned,
      `
    let result;
    { result=build_message(); }
    assert_eq!(result,"nuovo testo");
`,
    ),
  ));
test("locale: aggiungere static non ripara il riferimento", () =>
  run(
    replaceOnce(
      source(0, local),
      "fn invalid<'a>() -> &'a str",
      "fn invalid() -> &'static str",
    ),
    { error: "E0515" },
  ));
test("locale: anche un parametro ricevuto per valore e posseduto localmente", () =>
  run(
    replaceOnce(
      source(0, local),
      "fn invalid<'a>() -> &'a str {\n    let text = String::from(\"locale\");",
      "fn invalid<'a>(text: String) -> &'a str {",
    ),
    { error: "E0515" },
  ));
test("locale: trasferire la String invece di restituire il prestito", () => {
  let code = source(0, local);
  code = replaceOnce(
    code,
    "fn invalid<'a>() -> &'a str",
    "fn invalid() -> String",
  );
  code = replaceOnce(code, "    &text", "    text");
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main() {assert_eq!(invalid(),"locale");}',
  );
  assert.equal(run(code), "");
});
