import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Higher-Ranked Trait Bounds (HRTB)"];
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
const prefix = "appunti-rust-hrtb-";
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

const explicit = "Callback esplicito ed eliso";
const collection = "Due contratti per visitare una collezione";
const custom = "Trait personalizzato valido per ogni input";
const temporary = "Dati temporanei e risultato indipendente";
const output = "Risultato collegato al lifetime dell'input";
const independent = "Due lifetime indipendenti";
const object = "Trait object e configurazione catturata";
const staticInput = "Callback limitato a riferimenti statici";
const escape = "Restituire il prestito del buffer temporaneo";
const inference = "Closure isolata senza il contesto richiesto";
const from = (heading) => source(0, heading);
const extend = (heading, extra) => probe(0, heading, extra);

test("baseline reale e inventario: dieci programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 10);
});
test("frontmatter originale, struttura e fonti", () => {
  const filename = "Programmazione/Rust/Pagine/" + names[0] + ".md";
  const head = launch("git", ["show", "HEAD:" + filename], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(fs.readFileSync(filename, "utf8")), yaml(head.stdout));
  assert.equal(notes[0].data.status, "non revisionato");
  assert.equal(notes[0].data.publish, true);
  const headings = notes[0].tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), names);
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
  ])
    assert(headings.some((n) => n.depth === 2 && text(n) === title));
  for (let i = 1; i < headings.length; i++)
    assert(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(notes[0].body, /doc\.rust-lang\.org\/reference\/trait-bounds/);
  assert.match(notes[0].body, /github\.com\/rust-lang\/rust\/issues\/86921/);
  for (const code of blocks[0].values())
    assert.doesNotMatch(code, /\bunsafe\b/);
});
for (const heading of [
  explicit,
  collection,
  custom,
  temporary,
  output,
  independent,
  object,
  staticInput,
  escape,
  inference,
]) {
  test("Programma della nota: " + heading, () => {
    const options =
      heading === staticInput
        ? { message: /implementation of .* is not general enough/ }
        : heading === escape || heading === inference
          ? { message: /lifetime may not live long enough/ }
          : {};
    const result = run(from(heading), options);
    if (!options.message) assert.equal(result, "");
  });
}
test("apply: binder prima del tipo nel predicato where", () =>
  run(
    replaceOnce(
      from(explicit),
      "F: for<'a> Fn(&'a str)",
      "for<'a> F: Fn(&'a str)",
    ),
  ));
test("apply: un lifetime esterno non copre la stringa locale", () => {
  let code = replaceOnce(from(explicit), "fn apply<F>", "fn apply<'a, F>");
  code = replaceOnce(code, "F: for<'a> Fn(&'a str)", "F: Fn(&'a str)");
  run(code, { error: "E0597" });
});
test("apply: Fn non permette la mutazione diretta della cattura", () =>
  run(
    extend(explicit, `let mut total = 0; apply(|text| total += text.len());`),
    { error: "E0594" },
  ));
test("apply: Fn non promette purezza, Cell permette effetti", () =>
  run(
    extend(
      explicit,
      `
    let total = std::cell::Cell::new(0);
    apply(|text| total.set(total.get() + text.len()));
    apply_elided(|text| total.set(total.get() + text.len()));
    assert_eq!(total.get(), 8);
  `,
    ),
  ));
test("apply: move di un valore posseduto puo ancora implementare Fn", () =>
  run(
    extend(
      explicit,
      `
    let expected = String::from("rust");
    let callback = move |input: &str| assert_eq!(input, expected);
    apply(&callback);
    apply_elided(&callback);
  `,
    ),
  ));
test("apply: catture Rc ammesse senza un requisito Send", () =>
  run(
    extend(
      explicit,
      `
    let expected = std::rc::Rc::new(String::from("rust"));
    apply(move |input| assert_eq!(input, expected.as_str()));
  `,
    ),
  ));
test("apply: il contratto accetta callback senza catture come fn pointer", () =>
  run(
    extend(
      explicit,
      `
    let callback: for<'a> fn(&'a str) = |input| assert_eq!(input, "rust");
    apply(callback);
    apply_elided(callback);
  `,
    ),
  ));
test("visit: collezione vuota non invoca callback", () =>
  run(
    extend(
      collection,
      `
    let empty: Vec<String> = vec![];
    visit(&empty, |_| panic!("callback non atteso"));
    visit_borrowed(&empty, |_| panic!("callback non atteso"));
  `,
    ),
  ));
test("visit: ordine, vuoti e Unicode sono conservati", () =>
  run(
    extend(
      collection,
      String.raw`
    let values = vec![String::from(""), String::from("\u{03bb}"), String::from("a")];
    let mut owned = vec![];
    visit(&values, |text| owned.push(text.to_owned()));
    assert_eq!(owned, values);
    let mut borrowed = vec![];
    visit_borrowed(&values, |text| borrowed.push(text));
    assert_eq!(borrowed, ["", "\u{03bb}", "a"]);
  `,
    ),
  ));
test("visit: il callback universale non puo trattenere input in un Vec esterno", () =>
  run(
    extend(
      collection,
      `
    let values = vec![String::from("rust")];
    let mut borrowed: Vec<&str> = Vec::new();
    visit(&values, |text| borrowed.push(text));
    assert_eq!(borrowed[0], "rust");
  `,
    ),
    { error: "E0521" },
  ));
test("visit_borrowed: le viste non possono sopravvivere alla collezione", () =>
  run(
    extend(
      collection,
      `
    let mut borrowed: Vec<&str> = Vec::new();
    {
        let values = vec![String::from("rust")];
        visit_borrowed(&values, |text| borrowed.push(text));
    }
    assert_eq!(borrowed[0], "rust");
  `,
    ),
    { error: "E0597" },
  ));
test("visit: copie possedute indipendenti dalla collezione", () =>
  run(
    extend(
      collection,
      `
    let mut copies = vec![];
    {
        let values = vec![String::from("rust")];
        visit(&values, |text| copies.push(text.to_owned()));
    }
    assert_eq!(copies, ["rust"]);
  `,
    ),
  ));
test("visit_borrowed: mutare la collezione mentre si usano le viste e vietato", () =>
  run(
    extend(
      collection,
      `
    let mut values = vec![String::from("rust")];
    let mut borrowed = vec![];
    visit_borrowed(&values, |text| borrowed.push(text));
    values.clear();
    assert_eq!(borrowed[0], "rust");
  `,
    ),
    { error: "E0502" },
  ));
test("Visit: configurazione vuota e prefisso case-sensitive", () =>
  run(
    extend(
      custom,
      `
    let empty = String::new();
    assert_eq!(run(StartsWith { prefix: &empty }), (true, true));
    let uppercase = String::from("Ru");
    assert_eq!(run(StartsWith { prefix: &uppercase }), (false, false));
  `,
    ),
  ));
test("Visit: una sola implementazione static non basta", () =>
  run(
    extend(
      custom,
      `
    struct StaticVisitor;
    impl Visit<'static> for StaticVisitor {
        fn visit(&self, input: &'static str) -> bool { input.is_empty() }
    }
    run(StaticVisitor);
  `,
    ),
    { message: /implementation of .* is not general enough/ },
  ));
test("Visit: aggiungere static al visitor esclude la configurazione locale", () =>
  run(
    replaceOnce(
      from(custom),
      "V: for<'input> Visit<'input>,",
      "V: for<'input> Visit<'input> + 'static,",
    ),
    { error: "E0597" },
  ));
test("Visit: un unico valore gestisce input locali di scope diversi", () =>
  run(
    extend(
      custom,
      `
    let config = String::from("ru");
    let visitor = StartsWith { prefix: &config };
    {
        let short = String::from("rust");
        assert!(visitor.visit(&short));
    }
    let other = String::from("ruby");
    assert!(visitor.visit(&other));
  `,
    ),
  ));
test("with_temp: callback FnMut accettato e una sola chiamata", () =>
  run(
    extend(
      temporary,
      `
    let mut calls = 0;
    let count = with_temp(|text| { calls += 1; text.len() });
    assert_eq!((calls, count), (1, 10));
  `,
    ),
  ));
test("with_temp: un riferimento statico e un risultato indipendente valido", () =>
  run(
    extend(
      temporary,
      `
    let literal: &'static str = with_temp(|_| "statico");
    assert_eq!(literal, "statico");
  `,
    ),
  ));
test("with_temp: R puo unire riferimento esterno e dato posseduto", () =>
  run(
    extend(
      temporary,
      `
    let external = String::from("config");
    let (borrowed, owned) = with_temp(|text| (external.as_str(), text.to_owned()));
    assert_eq!(borrowed, "config");
    assert_eq!(owned, "temporaneo");
  `,
    ),
  ));
test("with_temp: FnOnce consente una cattura consumata, FnMut no", () =>
  run(
    replaceOnce(from(temporary), "FnOnce(&'a str) -> R", "FnMut(&'a str) -> R"),
    { error: "E0507" },
  ));
test("with_temp: un bound FnOnce non permette due invocazioni", () =>
  run(
    replaceOnce(
      from(temporary),
      "f(temp.as_str())",
      "let _ = f(temp.as_str());\n    f(temp.as_str())",
    ),
    { error: "E0382" },
  ));
test("with_temp: il risultato esterno mantiene il borrow del suo proprietario", () =>
  run(
    extend(
      temporary,
      `
    let mut external = String::from("config");
    let retained = with_temp(|_| external.as_str());
    external.clear();
    assert_eq!(retained, "config");
  `,
    ),
    { error: "E0502" },
  ));
test("with_temp: move non permette di restituire il riferimento temporaneo", () =>
  run(
    replaceOnce(
      from(escape),
      "with_temp(|text| text)",
      "with_temp(move |text| text)",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("with_temp: un R static non permette di far uscire temp", () =>
  run(
    replaceOnce(
      from(escape),
      "fn with_temp<F, R>",
      "fn with_temp<F, R: 'static>",
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("with_temp: slice esterna con proprietario gia distrutto respinta", () =>
  run(
    extend(
      temporary,
      `
    let result;
    {
        let external = String::from("config");
        result = with_temp(|_| external.as_str());
    }
    assert_eq!(result, "config");
  `,
    ),
    { error: "E0597" },
  ));
test("transform: trim Unicode restituisce una vista della stessa allocazione", () =>
  run(
    extend(
      output,
      String.raw`
    let source = String::from("\u{2003}Rust\u{2003}");
    let result = transform(&source, str::trim);
    assert_eq!(result, "Rust");
    assert_eq!(result.as_ptr(), source.as_bytes()[3..].as_ptr());
  `,
    ),
  ));
test("transform: la vista non puo sopravvivere al proprietario dell'input", () =>
  run(
    extend(
      output,
      `
    let result;
    {
        let source = String::from(" rust ");
        result = transform(&source, str::trim);
    }
    assert_eq!(result, "rust");
  `,
    ),
    { error: "E0597" },
  ));
test("transform: contratto eliso equivalente per input e output", () =>
  run(
    replaceOnce(
      from(output),
      "F: for<'a> Fn(&'a str) -> &'a str",
      "F: Fn(&str) -> &str",
    ),
  ));
test("transform: un literal statico puo essere abbreviato al lifetime dell'input", () =>
  run(
    extend(
      output,
      `
    let source = String::from("locale");
    assert_eq!(transform(&source, |_| "fisso"), "fisso");
  `,
    ),
  ));
test("transform: restituire una cattura locale non soddisfa il bound universale", () =>
  run(
    extend(
      output,
      `
    let captured = String::from("config");
    let source = String::from("input");
    let result = transform(&source, |_| captured.as_str());
    assert_eq!(result, "config");
  `,
    ),
    { error: "E0597" },
  ));
test("transform: un callback solo static non accetta ogni input", () =>
  run(
    extend(
      output,
      `
    fn static_identity(text: &'static str) -> &'static str { text }
    let source = String::from("rust");
    transform(&source, static_identity);
  `,
    ),
    { message: /implementation of .* is not general enough/ },
  ));
test("transform: contesto fn pointer risolve la closure identita", () =>
  run(
    replaceOnce(
      from(inference),
      "let identity = |text: &str| -> &str { text };",
      "let identity: for<'a> fn(&'a str) -> &'a str = |text| text;",
    ),
  ));
test("transform: funzione nominata con lifetime esplicito", () =>
  run(
    replaceOnce(
      from(inference),
      "let identity = |text: &str| -> &str { text };",
      "fn identity<'a>(text: &'a str) -> &'a str { text }",
    ),
  ));
test("transform: la closure con catture non si converte in fn pointer", () =>
  run(
    extend(
      output,
      `
    let allow = true;
    let callback: for<'a> fn(&'a str) -> &'a str =
        |text| if allow { text.trim() } else { text };
    assert_eq!(callback(" rust "), "rust");
  `,
    ),
    { error: "E0308" },
  ));
test("select_left: il secondo parametro non limita il prestito restituito", () =>
  run(
    extend(
      independent,
      `
    let source = String::from("first");
    let result = select_left(&source, |first, _second| first);
    assert_eq!(result.as_ptr(), source.as_ptr());
  `,
    ),
  ));
test("select_left: imporre lo stesso lifetime ai due input restringe il contratto", () =>
  run(
    extend(
      independent,
      `
    fn common<'a>(first: &'a str, _second: &'a str) -> &'a str { first }
    let source = String::from("first");
    select_left(&source, common);
  `,
    ),
    { message: /implementation of .* is not general enough/ },
  ));
test("select_left: restituire il secondo argomento non rispetta il contratto", () =>
  run(
    extend(
      independent,
      `
    let source = String::from("first");
    select_left(&source, |_first, second| second);
  `,
    ),
    { message: /lifetime may not live long enough/ },
  ));
test("select_left: il risultato resta legato al primo proprietario", () =>
  run(
    extend(
      independent,
      `
    let result;
    {
        let source = String::from("first");
        result = select_left(&source, left);
    }
    assert_eq!(result, "first");
  `,
    ),
    { error: "E0597" },
  ));
test("checker: input di piu scope e prefissi Unicode", () =>
  run(
    extend(
      object,
      String.raw`
    let prefix = String::from("\u{03bb}");
    let checker = make_checker(&prefix);
    for value in ["\u{03bb}x", "\u{03bb}"] {
        let local = String::from(value);
        assert!(checker(&local));
    }
    assert!(!checker("x"));
  `,
    ),
  ));
test("checker: omettere il bound env introduce il default static", () =>
  run(replaceOnce(from(object), " -> bool + 'env>", " -> bool>"), {
    message: /lifetime may not live long enough/,
  }));
test("checker: il move del riferimento non estende la vita del proprietario", () =>
  run(
    extend(
      object,
      `
    let checker;
    {
        let prefix = String::from("ru");
        checker = make_checker(&prefix);
    }
    assert!(checker("rust"));
  `,
    ),
    { error: "E0597" },
  ));
test("checker: non si puo modificare la configurazione ancora presa in prestito", () =>
  run(
    extend(
      object,
      `
    let mut config = String::from("ru");
    let checker = make_checker(&config);
    config.clear();
    assert!(checker("rust"));
  `,
    ),
    { error: "E0502" },
  ));
test("checker: possedere la configurazione consente un trait object static", () =>
  run(
    extend(
      object,
      `
    fn make_owned(prefix: String) -> Box<dyn for<'a> Fn(&'a str) -> bool> {
        Box::new(move |input| input.starts_with(prefix.as_str()))
    }
    let checker = make_owned(String::from("ru"));
    let input = String::from("rust");
    assert!(checker(&input));
  `,
    ),
  ));
test("checker: elisione dell'argomento conserva il contratto universale", () =>
  run(
    replaceOnce(
      from(object),
      "dyn for<'a> Fn(&'a str) -> bool + 'env",
      "dyn Fn(&str) -> bool + 'env",
    ),
  ));
test("checker: dopo drop del checker il proprietario torna modificabile", () =>
  run(
    extend(
      object,
      `
    let mut config = String::from("ru");
    let checker = make_checker(&config);
    assert!(checker("rust"));
    drop(checker);
    config.clear();
    assert!(config.is_empty());
  `,
    ),
  ));
