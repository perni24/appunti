import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Static dispatch vs dynamic dispatch"];
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
const prefix = "appunti-rust-dispatch-";
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
      "-C",
      "opt-level=" + (options.optimization ?? 0),
      "--crate-name",
      "note_example",
      "--error-format=json",
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

const printing = "Stampa con lo stesso contratto di prestito";
const task = "Parametro nominato, impl Trait in input e dyn Trait";
const opaque = "impl Trait in ritorno nasconde un tipo concreto";
const handler = "Handler equivalenti e scelta runtime tramite riferimento";
const enumeration = "Scelta runtime con un enum e un ritorno opaco";
const pointer = "Un puntatore a funzione puo variare senza dyn";
const invalid = "Restituire due tipi diversi con impl Trait";
function extend(heading, extra) {
  return probe(0, heading, extra);
}
test("toolchain reale e inventario: sette programmi", () => {
  const result = launch(rustc, ["--version"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 7);
});
test("dispatch: metadati, gerarchia e fonti", () => {
  const note = notes[0];
  for (const [key, value] of Object.entries({
    area: "Programmazione",
    topic: "Rust",
    type: "technical-note",
    status: "non revisionato",
    publish: true,
    date: "2026-05-21",
  }))
    assert.equal(note.data[key], value);
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    note.data.title,
  ]);
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
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === heading),
      heading,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  assert.match(
    note.source,
    /https:\/\/doc\.rust-lang\.org\/reference\/types\/impl-trait/,
  );
  assert.doesNotMatch(note.source, /@B[T]@/);
});
for (const [heading, code] of blocks[0]) {
  test("Programma della nota: " + heading, () => {
    const output = run(code, heading === invalid ? { error: "E0308" } : {});
    if (heading !== invalid)
      assert.equal(output, heading === printing ? "7\n7\nnote\nnote\n" : "");
  });
  if (heading !== invalid)
    test("Risultati invariati con opt-level=3: " + heading, () => {
      const output = run(code, { optimization: 3 });
      assert.equal(output, heading === printing ? "7\n7\nnote\nnote\n" : "");
    });
}
test("stampa: stesso output per Unicode, vuoto e valori negativi", () => {
  const output = run(
    extend(
      printing,
      `
    let value = String::from("\u{e8}");
    stampa(&value);
    stampa_dyn(&value);
    stampa(&String::new());
    stampa_dyn(&String::new());
    stampa(&-42i32);
    stampa_dyn(&-42i32);
    assert_eq!(value, "\u{e8}");
`,
    ),
  );
  assert.equal(output, "\u00e8\n\u00e8\n\n\n-42\n-42\n7\n7\nnote\nnote\n");
});
test("Task: input non Copy, UTF-8 e riutilizzo dopo tutte le chiamate", () =>
  run(
    extend(
      task,
      `
    for text in ["", "abc", "\u{e8}", "e\u{301}", "\u{1f680}"] {
        let value = TextSize(text.to_owned());
        assert_eq!(run_generic(&value), text.len());
        assert_eq!(run_impl(&value), text.len());
        assert_eq!(run_dyn(&value), text.len());
        assert_eq!(value.0, text);
    }
`,
    ),
  ));
test("Task: turbofish non disponibile per il parametro anonimo", () =>
  run(
    replaceOnce(
      source(0, task),
      "run_impl(&task)",
      "run_impl::<TextSize>(&task)",
    ),
    { error: "E0107" },
  ));
test("Task: due parametri impl Trait possono avere tipi diversi", () =>
  run(
    extend(
      task,
      `
    struct Fixed;
    impl Task for Fixed { fn execute(&self) -> usize { 9 } }
    fn pair(left: &impl Task, right: &impl Task) -> (usize, usize) {
        (left.execute(), right.execute())
    }
    assert_eq!(pair(&TextSize("x".into()), &Fixed), (1,9));
`,
    ),
  ));
test("Task: ripetere T impone lo stesso tipo ai due parametri", () =>
  run(
    extend(
      task,
      `
    struct Fixed;
    impl Task for Fixed { fn execute(&self) -> usize { 9 } }
    fn pair<T: Task>(left: &T, right: &T) -> (usize, usize) {
        (left.execute(), right.execute())
    }
    let _ = pair(&TextSize("x".into()), &Fixed);
`,
    ),
    { error: "E0308" },
  ));
test("Task: ?Sized non e implicito nel parametro impl Trait", () =>
  run(
    extend(
      task,
      `
    let value = TextSize("x".into());
    let object: &dyn Task = &value;
    run_impl(object);
`,
    ),
    { error: "E0277" },
  ));
test("Task: Box concreto e prestito del tipo concreto sono separati dal dispatch", () =>
  run(
    extend(
      task,
      `
    let value = Box::new(TextSize("boxed".into()));
    assert_eq!(run_generic(value.as_ref()), 5);
    assert_eq!(run_dyn(value.as_ref()), 5);
    assert_eq!(value.0, "boxed");
`,
    ),
  ));
test("Task: wrapper concreto puo inoltrare a un trait object interno", () =>
  run(
    extend(
      task,
      `
    struct Delegate<'a>(&'a dyn Task);
    impl Task for Delegate<'_> {
        fn execute(&self) -> usize { self.0.execute() }
    }
    let value = TextSize("forward".into());
    let wrapper = Delegate(&value);
    assert_eq!(run_generic(&wrapper), 7);
`,
    ),
  ));
test("opaque: tutti i limiti u8, sequenza, cardinalita e fine", () =>
  run(
    extend(
      opaque,
      `
    for end in 0..=u8::MAX {
        let result: Vec<u8> = values(end).collect();
        assert_eq!(result.len(), usize::from(end));
        for (index, value) in result.iter().enumerate() {
            assert_eq!(usize::from(*value), index);
        }
        let mut empty = values(0);
        assert_eq!(empty.next(), None);
        assert_eq!(empty.next(), None);
    }
`,
    ),
  ));
test("opaque: il payload non Copy viene trasferito, non clonato", () =>
  run(
    extend(
      opaque,
      `
    let value = String::from("moved");
    let _iterator = single(value);
    println!("{value}");
`,
    ),
    { error: "E0382" },
  ));
test("opaque: Once conserva il valore e termina dopo un elemento", () =>
  run(
    extend(
      opaque,
      `
    struct Value(String);
    let mut iterator = single(Value("payload".into()));
    assert_eq!(iterator.next().unwrap().0, "payload");
    assert!(iterator.next().is_none());
    assert!(iterator.next().is_none());
`,
    ),
  ));
test("opaque: la scelta del tipo nascosto non appartiene al chiamante", () =>
  run(extend(opaque, "let _value: std::iter::Once<u32> = single(7u32);"), {
    error: "E0308",
  }));
test("opaque: bound non esposto non utilizzabile anche se il tipo concreto lo ha", () =>
  run(extend(opaque, "let _reversed = values(3).rev();"), { error: "E0277" }));
test("opaque: restituire un riferimento non prolunga la sorgente", () =>
  run(
    extend(
      opaque,
      `
    let iterator;
    {
        let local = String::from("local");
        iterator = single(local.as_str());
    }
    assert_eq!(iterator.collect::<Vec<_>>(), ["local"]);
`,
    ),
    { error: "E0597" },
  ));
test("Handler: tutte le interfacce concordano su byte e valori scalari", () =>
  run(
    extend(
      handler,
      String.raw`
    let cases = [
        ("",0,0), ("abc",3,3), ("\u{e8}",2,1),
        ("e\u{301}",3,2), ("\u{1f680}",4,1), ("\r\n",2,2), ("\0",1,1),
    ];
    for (input, byte_count, scalar_count) in cases {
        assert_eq!(static_run(&ByteCount,input),byte_count);
        assert_eq!(dynamic_run(&ByteCount,input),byte_count);
        assert_eq!(static_run(&ScalarCount,input),scalar_count);
        assert_eq!(dynamic_run(&ScalarCount,input),scalar_count);
        for unicode in [false,true] {
            let bytes=ByteCount;
            let scalars=ScalarCount;
            let chosen=select(unicode,&bytes,&scalars);
            assert_eq!(dynamic_run(chosen,input),if unicode {scalar_count} else {byte_count});
        }
    }
`,
    ),
  ));
test("Handler: batch vuoto, ordine e duplicati per concreto e dyn", () =>
  run(
    extend(
      handler,
      `
    let inputs=["", "a", "\u{e8}", "a", "e\u{301}"];
    let bytes=ByteCount;
    let scalars=ScalarCount;
    assert_eq!(process_batch(&bytes,&inputs),[0,1,2,1,3]);
    assert_eq!(process_batch(&scalars,&inputs),[0,1,1,1,2]);
    for unicode in [false,true] {
        let selected=select(unicode,&bytes,&scalars);
        assert_eq!(process_batch(selected,&inputs),
            if unicode {vec![0,1,1,1,2]} else {vec![0,1,2,1,3]});
        assert!(process_batch(selected,&[]).is_empty());
    }
`,
    ),
  ));
test("Handler: batch conserva proprietario e buffer dell'input", () =>
  run(
    extend(
      handler,
      `
    let original=String::from("text");
    let before=original.as_ptr();
    let output=process_batch(&ByteCount,&[original.as_str()]);
    assert_eq!(output,[4]);
    assert_eq!(original,"text");
    assert_eq!(original.as_ptr(),before);
`,
    ),
  ));
test("Handler: estensione con terza implementazione e chiamate osservabili", () =>
  run(
    extend(
      handler,
      `
    use std::cell::Cell;
    struct Spy(Cell<usize>);
    impl Handler for Spy {
        fn handle(&self,input:&str)->usize {
            self.0.set(self.0.get()+1);
            input.len()
        }
    }
    let spy=Spy(Cell::new(0));
    let object: &dyn Handler=&spy;
    assert_eq!(process_batch(object,&["a","bb",""]),[1,2,0]);
    assert_eq!(spy.0.get(),3);
    assert!(process_batch(object,&[]).is_empty());
    assert_eq!(spy.0.get(),3);
`,
    ),
  ));
test("Handler: senza ?Sized batch rifiuta il trait object", () =>
  run(replaceOnce(source(0, handler), "H: Handler + ?Sized", "H: Handler"), {
    error: "E0277",
  }));
test("Handler: il risultato della selezione non supera la vita dei candidati", () =>
  run(
    extend(
      handler,
      `
    let chosen;
    {
        let bytes=ByteCount;
        let scalars=ScalarCount;
        chosen=select(true,&bytes,&scalars);
    }
    assert_eq!(dynamic_run(chosen,"x"),1);
`,
    ),
    { error: "E0597" },
  ));
test("Enum: varianti diverse restano lo stesso tipo opaco", () =>
  run(
    extend(
      enumeration,
      `
    let hidden=[make_handler(false),make_handler(true)];
    assert_eq!(hidden[0].handle("\u{1f680}"),4);
    assert_eq!(hidden[1].handle("\u{1f680}"),1);
    let objects: [&dyn Handler;2]=[&hidden[0],&hidden[1]];
    assert_eq!(objects[0].handle("\u{e8}"),2);
    assert_eq!(objects[1].handle("\u{e8}"),1);
`,
    ),
  ));
test("Enum: risultati per vuoto, ASCII e Unicode senza cambiare contratto", () =>
  run(
    extend(
      enumeration,
      `
    for (input,bytes,scalars) in [("",0,0),("abc",3,3),("\u{e8}",2,1),("e\u{301}",3,2)] {
        assert_eq!(make_handler(false).handle(input),bytes);
        assert_eq!(make_handler(true).handle(input),scalars);
    }
`,
    ),
  ));
test("Enum: aggiungere una variante richiede aggiornare il match esaustivo", () =>
  run(
    replaceOnce(
      source(0, enumeration),
      "    Scalars,\n}",
      "    Scalars,\n    Other,\n}",
    ),
    { error: "E0004" },
  ));
test("Puntatori: la selezione cambia funzione conservando la firma", () =>
  run(
    extend(
      pointer,
      `
    for (input,bytes,scalars) in [("",0,0),("abc",3,3),("\u{e8}",2,1),("e\u{301}",3,2)] {
        for unicode in [false,true] {
            let selected=select_counter(unicode);
            assert_eq!(apply(selected,input),if unicode {scalars} else {bytes});
        }
    }
`,
    ),
  ));
test("Function item: due funzioni diverse non hanno lo stesso tipo nominale", () =>
  run(
    extend(
      pointer,
      `
    fn same<F: Fn(&str)->usize>(_first:F,_second:F) {}
    same(byte_len,scalar_len);
`,
    ),
    { error: "E0308" },
  ));
test("Function pointer: la coercizione esplicita fornisce il tipo comune", () =>
  run(
    extend(
      pointer,
      `
    fn same<F: Fn(&str)->usize>(first:F,second:F)->(usize,usize) {
        (first("\u{e8}"),second("\u{e8}"))
    }
    assert_eq!(same(byte_len as fn(&str)->usize,scalar_len as fn(&str)->usize),(2,1));
`,
    ),
  ));
test("Closure senza catture: convertibile in fn pointer", () =>
  run(
    extend(
      pointer,
      `
    let count:fn(&str)->usize=|text|text.len();
    assert_eq!(apply(count,"abc"),3);
`,
    ),
  ));
test("Closure con catture: non convertibile in fn pointer", () =>
  run(
    extend(
      pointer,
      `
    let offset=1usize;
    let _count:fn(&str)->usize=|text|text.len()+offset;
`,
    ),
    { error: "E0308" },
  ));
test("Closure con catture: accettata dal parametro generico Fn", () =>
  run(
    extend(
      pointer,
      `
    let suffix=String::from("!");
    let count=|text:&str|text.len()+suffix.len();
    assert_eq!(apply(count,"abc"),4);
    assert_eq!(suffix,"!");
`,
    ),
  ));
test("Ritorno opaco: due rami con lo stesso tipo concreto sono ammessi", () =>
  run(replaceOnce(source(0, invalid), "(1u8..=3).rev()", "3u8..=3")));
test("Ritorno dinamico: boxare i due iteratori preserva entrambe le sequenze", () => {
  let code = replaceOnce(
    source(0, invalid),
    "impl Iterator<Item = u8>",
    "Box<dyn Iterator<Item = u8>>",
  );
  code = replaceOnce(code, "(1u8..=3).rev()", "Box::new((1u8..=3).rev())");
  code = replaceOnce(code, "        1u8..=3", "        Box::new(1u8..=3)");
  code = replaceOnce(
    code,
    "let _ = values(true);",
    "assert_eq!(values(true).collect::<Vec<_>>(), [3,2,1]);\n    assert_eq!(values(false).collect::<Vec<_>>(), [1,2,3]);",
  );
  run(code);
});
