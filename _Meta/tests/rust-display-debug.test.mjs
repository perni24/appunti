import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Display e Debug"];
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
const prefix = "appunti-rust-display-debug-";
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

const user = "Due rappresentazioni dello stesso valore";
const port = "Conservare le opzioni nel wrapper numerico";
const secret = "Debug che omette un segreto";
const writers = "Scrivere in testo o byte senza confondere i trait Write";
const error = "Un errore con messaggio e causa distinti";
const adapter = "Adapter borrowed per una seconda rappresentazione";
const collection = "Il Debug di una collection non fornisce Display";
const runtime = "Il formato non e una stringa runtime";
const from = (heading) => source(0, heading);
const inject = (heading, code) => probe(0, heading, code);
const writerProbe = (code) =>
  replaceOnce(
    from(writers),
    "fn main() -> Result<(), Box<dyn std::error::Error>> {",
    "fn main() -> Result<(), Box<dyn std::error::Error>> {\n" + code,
  );

test("baseline e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("metadati invariati, sezioni, gerarchia e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Display e Debug.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Display e Debug",
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
  for (const value of [
    "Result<(), fmt::Error>",
    "Vec<u8>",
    "dyn Display",
    'format!("{value:X}")',
    'format!("{value:b}")',
    'format!("{value:p}")',
  ])
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  for (const page of [
    "fmt/trait.Display.html",
    "fmt/trait.Debug.html",
    "fmt/struct.Formatter.html",
    "fmt/struct.Error.html",
    "macro.write.html",
    "fmt/trait.Write.html",
    "error/trait.Error.html",
    "string/trait.ToString.html",
    "macro.dbg.html",
  ])
    assert(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url === "https://doc.rust-lang.org/std/" + page,
      ),
      page,
    );
});
for (const heading of [user, port, secret, writers, error, adapter]) {
  test("programma completo: " + heading, () => {
    const output = run(from(heading));
    if (heading === user) assert.equal(output, "Ada (7)\n");
    else if (heading === port) {
      assert.match(output, /^debug: .*5432/);
      assert.match(output, /\ndisplay: 5432\n$/);
    } else assert.equal(output, "");
  });
}
test("controesempio: Vec non implementa Display", () =>
  run(from(collection), { error: "E0277", detail: /Display/ }));
test("controesempio: formato runtime non ammesso", () =>
  run(from(runtime), { message: /format argument must be a string literal/ }));
test("correzione collection con Debug", () => {
  assert.equal(
    run(replaceOnce(from(collection), "{values}", "{values:?}")),
    "[1, 2, 3]\n",
  );
});
test("correzione runtime: stampa letterale, non espansione del template", () => {
  assert.equal(
    run(
      replaceOnce(
        from(runtime),
        "println!(pattern, 7);",
        'println!("{pattern}");',
      ),
    ),
    "value: {}\n",
  );
});
test("formatter borrowed e helper con str e dyn Display", () => {
  const output = run(
    inject(
      user,
      String.raw`
    let owned=String::from("borrowed");
    assert_eq!(format!("{owned}"),"borrowed");
    assert_eq!(owned,"borrowed");
    print_user::<str>("text");
    let object: &dyn fmt::Display=&7_u32;
    print_user(object);
  `,
    ),
  );
  assert.equal(output, "text\n7\nAda (7)\n");
});
test("helper per valore puo consumare anche se fmt prende un riferimento", () => {
  run(
    String.raw`
    fn print<T: std::fmt::Display>(value:T){println!("{value}");}
    fn main(){let value=String::from("x");print(value);assert_eq!(value,"x");}
  `,
    { error: "E0382" },
  );
});
test("ToString e gia fornito da Display: seconda impl in conflitto", () => {
  run(
    from(port) +
      String.raw`
    impl ToString for Port {
        fn to_string(&self)->String { String::from("port") }
    }
  `,
    { error: "E0119" },
  );
});
test("Port: tutti gli u16 hanno la stessa resa del numero sottostante", () => {
  run(
    inject(
      port,
      String.raw`
    for value in 0..=u16::MAX {
        let p=Port(value);
        assert_eq!(p.to_string(),value.to_string());
        assert_eq!(format!("{p:08}"),format!("{value:08}"));
    }
    let p=Port(42);
    assert_eq!(format!("{p:+08}"),"+0000042");
    assert_eq!(format!("{p:*>8}"),"******42");
    assert_eq!(format!("{p:^8}"),"   42   ");
    assert_eq!(format!("{p:1}"),"42");
  `,
    ),
  );
});
test("Port: nuova specifica write perde i flag esterni e gli assert lo rilevano", () => {
  run(
    replaceOnce(
      from(port),
      "fmt::Display::fmt(&self.0, f)",
      'write!(f, "{}", self.0)',
    ),
    { panic: /assertion .* failed/ },
  );
});
test("Display non implementa automaticamente LowerHex; delega esplicita", () => {
  const code = inject(port, 'assert_eq!(format!("{:x}",Port(255)),"ff");');
  run(code, { error: "E0277", detail: /LowerHex/ });
  run(
    code +
      String.raw`
    impl fmt::LowerHex for Port {
        fn fmt(&self,f:&mut fmt::Formatter<'_>)->fmt::Result {
            fmt::LowerHex::fmt(&self.0,f)
        }
    }
  `,
  );
});
test("User: Unicode, campo vuoto e testo non escapato per HTML", () => {
  run(
    inject(
      user,
      String.raw`
    for name in ["","caff\u{e8}","<b>demo</b>","line\nnext"] {
        let value=User{id:u64::MAX,name:name.to_owned()};
        assert_eq!(value.to_string(),format!("{name} ({})",u64::MAX));
    }
    let value=User{id:1,name:"a".into()};
    assert_eq!(format!("{value:>20}"),"a (1)");
  `,
    ),
  );
});
test("Debug derivato non protegge un campo privato", () => {
  run(String.raw`
    mod private {
        #[derive(Debug)]
        pub struct Record { token:String }
        impl Record {pub fn new()->Self{Self{token:"EXAMPLE_NOT_REAL".into()}}}
    }
    fn main(){
        let value=private::Record::new();
        assert!(format!("{value:?}").contains("EXAMPLE_NOT_REAL"));
        assert!(format!("{value:#?}").contains("EXAMPLE_NOT_REAL"));
    }
  `);
});
test("oscuramento: token diversi, nesting e pretty printing", () => {
  run(
    inject(
      secret,
      String.raw`
    #[derive(Debug)]
    struct Envelope { credentials: Credentials }
    for token in ["TOKEN_ALPHA","TOKEN_\u{e8}_BETA","TOKEN\nMULTILINE"] {
        let envelope=Envelope{credentials:Credentials{user:"demo".into(),token:token.into()}};
        for value in [format!("{envelope:?}"),format!("{envelope:#?}")] {
            assert!(value.contains("<redacted>"));
            assert!(!value.contains(token));
            assert!(!value.contains("TOKEN"));
        }
        assert_eq!(envelope.credentials.token,token);
    }
  `,
    ),
  );
});
test("oscuramento: esporre il campo invece del marker e rilevato", () => {
  run(
    replaceOnce(
      from(secret),
      '.field("token", &"<redacted>")',
      '.field("token", &self.token)',
    ),
    { panic: /assertion failed/ },
  );
});
test("String e Vec byte: scrittura Unicode e appending conservano i dati", () => {
  run(
    writerProbe(String.raw`
    let mut target=String::from("prefix\n");
    append_line(&mut target,"caff\u{e8}")?;
    append_line(&mut target,"")?;
    assert_eq!(target,"prefix\nitem: caff\u{e8}\nitem: \n");
    let mut raw=Vec::new();
    write!(&mut raw,"caff\u{e8}")?;
    assert_eq!(raw,"caff\u{e8}".as_bytes());
  `),
  );
});
test("String richiede fmt Write in scope per write", () => {
  run(
    replaceOnce(
      from(writers),
      "use std::fmt::{self, Write as _};",
      "use std::fmt;",
    ),
    { error: "E0599" },
  );
});
const limited = String.raw`
struct Limited { text:String, limit:usize }
impl std::fmt::Write for Limited {
    fn write_str(&mut self,s:&str)->std::fmt::Result {
        let mut end=self.limit.saturating_sub(self.text.len()).min(s.len());
        while !s.is_char_boundary(end) {end-=1;}
        self.text.push_str(&s[..end]);
        if end==s.len(){Ok(())}else{Err(std::fmt::Error)}
    }
}
`;
test("fmt Write: prefisso parziale UTF-8 e propagazione a ogni limite", () => {
  run(
    limited +
      writerProbe(String.raw`
    for label in ["rust","caff\u{e8}",""] {
        let expected=format!("item: {label}\n");
        for limit in 0..=expected.len()+1 {
            let mut sink=Limited{text:String::new(),limit};
            let result=append_line(&mut sink,label);
            assert_eq!(result.is_ok(),limit>=expected.len());
            assert!(expected.starts_with(&sink.text));
            assert!(sink.text.len()<=limit);
            if result.is_ok(){assert_eq!(sink.text,expected);}
        }
    }
  `),
  );
});
test("Display propaga il fallimento del formatter senza cancellare il prefisso", () => {
  run(
    limited +
      inject(
        user,
        String.raw`
    let value=User{id:9,name:"abcdef".into()};
    let mut sink=Limited{text:String::new(),limit:3};
    assert!(fmt::write(&mut sink,format_args!("{value}")).is_err());
    assert_eq!(sink.text,"abc");
  `,
      ),
  );
});
test("Debug builder propaga il fallimento della destinazione", () => {
  run(
    limited +
      inject(
        secret,
        String.raw`
    let value=Credentials{user:"demo".into(),token:"HIDDEN".into()};
    let mut sink=Limited{text:String::new(),limit:0};
    assert!(fmt::write(&mut sink,format_args!("{value:?}")).is_err());
    assert!(sink.text.is_empty());
  `,
      ),
  );
});
test("io Write conserva io Error anziche restituire fmt Error", () => {
  run(
    writerProbe(String.raw`
    struct Broken;
    impl std::io::Write for Broken {
        fn write(&mut self,_:&[u8])->std::io::Result<usize>{
            Err(std::io::Error::new(std::io::ErrorKind::BrokenPipe,"sink failed"))
        }
        fn flush(&mut self)->std::io::Result<()>{Ok(())}
    }
    let failure=write!(&mut Broken,"item {}",7).unwrap_err();
    assert_eq!(failure.kind(),std::io::ErrorKind::BrokenPipe);
    assert_eq!(failure.to_string(),"sink failed");
  `),
  );
});
test("fmt Error inventato da Display viola il contratto e to_string fa panic", () => {
  run(
    String.raw`
    struct Invalid;
    impl std::fmt::Display for Invalid {
        fn fmt(&self,_:&mut std::fmt::Formatter<'_>)->std::fmt::Result {
            Err(std::fmt::Error)
        }
    }
    fn main(){let _=Invalid.to_string();}
  `,
    { panic: /Display.*error/i },
  );
});
test("errore: causa tipizzata conservata, nessuna dipendenza dal suo messaggio", () => {
  run(
    inject(
      error,
      String.raw`
    use std::num::IntErrorKind;
    for (text,kind) in [
        ("",IntErrorKind::Empty),
        ("abc",IntErrorKind::InvalidDigit),
        ("4294967296",IntErrorKind::PosOverflow),
    ] {
        let outer=parse_count(text).unwrap_err();
        assert_eq!(outer.to_string(),"invalid item count");
        let cause=outer.source().unwrap().downcast_ref::<ParseIntError>().unwrap();
        assert_eq!(cause.kind(),&kind);
    }
    assert_eq!(parse_count("+8").unwrap(),8);
    assert_eq!(parse_count("4294967295").unwrap(),u32::MAX);
    assert!(parse_count(" 8 ").is_err());
  `,
    ),
  );
});
test("Error richiede davvero Debug", () => {
  run(replaceOnce(from(error), "#[derive(Debug)]\n", ""), {
    error: "E0277",
    detail: /Debug/,
  });
});
test("Error richiede davvero Display", () => {
  run(
    'struct Missing; impl std::fmt::Debug for Missing {fn fmt(&self,f:&mut std::fmt::Formatter<\'_>)->std::fmt::Result{f.write_str("Missing")}} impl std::error::Error for Missing {} fn main(){}',
    { error: "E0277", detail: /Display/ },
  );
});
test("assert_eq richiede Debug anche per operandi uguali", () => {
  run(
    "#[derive(PartialEq)] struct Value(u32); fn main(){assert_eq!(Value(1),Value(1));}",
    { error: "E0277", detail: /Debug/ },
  );
});
test("adapter: estremi numerici, formato indipendente e valore non consumato", () => {
  run(
    inject(
      adapter,
      String.raw`
    for x in [i32::MIN,-1,0,1,i32::MAX] {
        for y in [i32::MIN,-1,0,1,i32::MAX] {
            let point=Point{x,y};
            let view=point.as_csv();
            assert_eq!(view.to_string(),format!("{x},{y}"));
            assert_eq!(point.to_string(),format!("({x}, {y})"));
            assert_eq!(point.x,x);
        }
    }
  `,
    ),
  );
});
test("adapter borrowed non sopravvive al proprietario", () => {
  run(
    inject(
      adapter,
      String.raw`
    let view;
    {let point=Point{x:0,y:0};view=point.as_csv();}
    println!("{view}");
  `,
    ),
    { error: "E0597" },
  );
});
test("due impl Display sullo stesso tipo sono in conflitto", () => {
  run(
    from(adapter) +
      String.raw`
    impl fmt::Display for Point {
        fn fmt(&self,f:&mut fmt::Formatter<'_>)->fmt::Result { f.write_str("other") }
    }
  `,
    { error: "E0119" },
  );
});
test("dbg prende ownership e restituisce il valore; prestito conserva il proprietario", () => {
  run(
    String.raw`
    fn main(){
        let value=String::from("diagnostic");
        let view=dbg!(&value);
        assert_eq!(view,"diagnostic");
        let moved=dbg!(value);
        assert_eq!(moved,"diagnostic");
    }
  `,
    { stderr: /diagnostic/ },
  );
});
test("dbg consuming impedisce riuso del valore non Copy", () => {
  run(
    'fn main(){let value=String::from("x");let _=dbg!(value);assert_eq!(value,"x");}',
    { error: "E0382" },
  );
});
test("dbg resta attivo con ottimizzazione release", () => {
  run("fn main(){assert_eq!(dbg!(7),7);}", {
    args: ["-C", "opt-level=3"],
    stderr: /7 = 7/,
  });
});
test("format_args borrowed non puo uscire dalla vita del valore", () => {
  run(
    String.raw`
    fn main(){
        let arguments;
        {let local=String::from("x"); arguments=format_args!("{local}");}
        println!("{arguments}");
    }
  `,
    { error: "E0597" },
  );
});
