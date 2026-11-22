import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Option", "Result", "Operatore"];
const notes = names.map((name) =>
  parseNote(`Programmazione/Rust/Pagine/${name}.md`),
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
const prefix = "appunti-rust-option-result-question-";
const parent = fs.realpathSync(os.tmpdir());
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
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function run(
  code,
  errorCode,
  panicPattern,
  extraArgs = [],
  edition = "2024",
  runArgs = [],
  files = {},
  exitError,
) {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  for (const [name, content] of Object.entries(files)) {
    assert.equal(path.basename(name), name);
    fs.writeFileSync(path.join(dir, name), content);
  }
  fs.writeFileSync(path.join(dir, "main.rs"), code);
  const output = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const result = launch(
    rustc,
    [
      "--edition=" + edition,
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
      ...extraArgs,
      "-o",
      output,
    ],
    dir,
  );
  if (errorCode) {
    assert.notEqual(result.status, 0);
    if (errorCode instanceof RegExp) {
      assert.match(result.stderr, errorCode);
      return;
    }
    const diagnostics = result.stderr
      .split(/\r?\n/)
      .filter(Boolean)
      .map(JSON.parse);
    assert.ok(
      diagnostics.some(
        (d) => d.level === "error" && d.code?.code === errorCode,
      ),
      result.stderr,
    );
    return;
  }
  ok(result);
  const execution = launch(output, runArgs, dir);
  for (const [name, content] of Object.entries(files)) {
    assert.deepEqual(
      fs.readFileSync(path.join(dir, name)),
      Buffer.from(content),
    );
  }
  if (exitError) {
    assert.equal(execution.status, 1, execution.stdout + execution.stderr);
    assert.match(execution.stderr, exitError);
    return execution.stdout;
  }
  if (panicPattern) {
    assert.equal(execution.status, 101, execution.stdout + execution.stderr);
    assert.match(execution.stderr, panicPattern);
    return;
  }
  ok(execution);
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
function probe(i, heading, assertions) {
  return replaceOnce(
    source(i, heading),
    "fn main() {",
    "fn main() {\n" + assertions,
  );
}

test("toolchain 1.99.1 e inventario di 25 programmi", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [8, 9, 8],
  );
});
for (const [i, note] of notes.entries()) {
  test(names[i] + ": metadati e gerarchia", () => {
    for (const [key, value] of Object.entries({
      area: "Programmazione",
      topic: "Rust",
      type: "technical-note",
      status: "non revisionato",
      publish: true,
      date: "2026-05-20",
    }))
      assert.equal(note.data[key], value);
    const headings = note.tree.children.filter((n) => n.type === "heading");
    assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
      note.data.title,
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
    ])
      assert.ok(
        headings.some((n) => text(n) === title),
        title,
      );
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
const failures = new Map([
  ["Riutilizzare un Option consumato", "E0382"],
  ["Consumare due volte il risultato", "E0382"],
  ["Ignorare must_use", /unused.*Result|unused_must_use/],
  ["Option non diventa Result automaticamente", "E0277"],
  ["main con ritorno unit", "E0277"],
]);
for (const [i, list] of blocks.entries()) {
  for (const [heading, code] of list) {
    test(names[i] + ": " + heading, () => {
      if (failures.has(heading)) run(code, failures.get(heading));
      else assert.equal(run(code), "");
    });
  }
}
function mainFor(i, heading, body) {
  const code = source(i, heading);
  const at = code.indexOf("fn main()");
  assert.ok(at >= 0);
  return code.slice(0, at) + "fn main() {\n" + body + "\n}";
}
const optDomain = "Ricerca e propagazione dell'assenza";
const resultDivision = "Divisione senza panic aritmetici";
const resultPort = "Configurazione di una porta obbligatoria";
const questionCli = "Leggere una porta da un file";
function cli(args, files = {}, exitError) {
  return run(
    source(2, questionCli),
    null,
    null,
    [],
    "2024",
    args,
    files,
    exitError,
  );
}

test("Option: alcuni valori vuoti o falsi restano presenti", () => {
  run(
    probe(
      0,
      "Presente non significa non vuoto",
      `
    assert_eq!(describe(Some(" ")), "present");
    assert!(Some(false).is_some());
    assert!(Some(Vec::<u8>::new()).is_some());
    assert!(Some(None::<u8>).is_some());
  `,
    ),
  );
});
test("Option: None isolato richiede il tipo", () => {
  run("fn main() { let absent = None; assert!(absent.is_none()); }", "E0282");
});
test("Option: map in prestito corregge il move", () => {
  run(
    replaceOnce(
      source(0, "Riutilizzare un Option consumato"),
      "title.map(",
      "title.as_ref().map(",
    ),
  );
});
test("Option: riferimento non puo sopravvivere al proprietario", () => {
  run(
    `
    fn invalid() -> Option<&'static str> {
      let title = Some(String::from("notes"));
      title.as_deref()
    }
    fn main() {}
  `,
    "E0515",
  );
});
test("Option: copied con tipo Copy e cloned con String", () => {
  run(`
    fn main() {
      let number = 7;
      let borrowed = Some(&number);
      let owned = borrowed.copied();
      assert_eq!(owned,Some(7));
      let text = String::from("notes");
      let cloned = Some(&text).cloned();
      drop(text);
      assert_eq!(cloned.as_deref(),Some("notes"));
    }
  `);
});
test("Option: copied rifiuta String", () => {
  run(
    `
    fn main() {
      let text = String::from("notes");
      let _ = Some(&text).copied();
    }
  `,
    "E0277",
  );
});
test("Option: checked_mul copre tutti gli u8", () => {
  run(
    probe(
      0,
      "Trasformare e concatenare",
      `
    for n in 0..=u8::MAX {
      let expected = if n<=127 {Some(n*2)} else {None};
      assert_eq!(doubled(Some(n)),expected);
    }
    assert_eq!(first_character("e\u{301}"),Some('e'));
  `,
    ),
  );
});
test("Option: closure saltate su None e map annidato", () => {
  run(`
    fn main() {
      assert_eq!(None::<u8>.map(|_| panic!("unexpected")), None::<u8>);
      assert_eq!(None::<u8>.and_then(|_| panic!("unexpected")), None::<u8>);
      assert_eq!(None::<u8>.filter(|_| panic!("unexpected")), None);
      let nested: Option<Option<u8>>=Some(7).map(Some);
      assert_eq!(nested,Some(Some(7)));
    }
  `);
});
test("Option: fallback eager puo fare panic anche con Some", () => {
  run(
    `
    fn fallback() -> u8 { panic!("eager fallback"); }
    fn main() { let _ = Some(1).unwrap_or(fallback()); }
  `,
    null,
    /eager fallback/,
  );
});
test("Option: ok_or_else e or_else differiti", () => {
  run(`
    fn main() {
      let mut calls=0;
      assert_eq!(Some(1).ok_or_else(|| {calls+=1; "missing"}),Ok(1));
      assert_eq!(calls,0);
      assert_eq!(None::<u8>.ok_or_else(|| {calls+=1; "missing"}),Err("missing"));
      assert_eq!(calls,1);
      assert_eq!(Some(1).or_else(|| panic!("unexpected")),Some(1));
      assert_eq!(None.or_else(||Some(2)),Some(2));
    }
  `);
});
test("Option: ricerca vuota, duplicati e limiti dichiarati email", () => {
  run(
    probe(
      0,
      optDomain,
      `
    assert_eq!(domain_for(&[],1),None);
    let rows=[
      User{id:7,email:Some("a@".into())},
      User{id:7,email:Some("a@later".into())},
      User{id:8,email:Some("a@b@c".into())},
      User{id:9,email:Some("@domain".into())},
      User{id:10,email:Some("".into())}
    ];
    assert_eq!(domain_for(&rows,7),Some(""));
    assert_eq!(domain_for(&rows,8),Some("b@c"));
    assert_eq!(domain_for(&rows,9),Some("domain"));
    assert_eq!(domain_for(&rows,10),None);
  `,
    ),
  );
});
test("Option: dominio in prestito e copia indipendente", () => {
  run(
    probe(
      0,
      optDomain,
      `
    let rows=[User{id:1,email:Some("a@domain".into())}];
    let expected=&rows[0].email.as_ref().unwrap()[2..];
    let actual=domain_for(&rows,1).unwrap();
    assert_eq!(actual.as_ptr(),expected.as_ptr());
    let owned=domain_for(&rows,1).map(str::to_owned);
    drop(rows);
    assert_eq!(owned.as_deref(),Some("domain"));
  `,
    ),
  );
});
test("Option: get_or_insert_with non esegue closure su Some", () => {
  run(`
    fn main(){
      let mut value=Some(String::from("old"));
      assert_eq!(value.get_or_insert_with(||panic!("unexpected")),"old");
      assert_eq!(value.take(),Some(String::from("old")));
      assert_eq!(value.replace(String::from("new")),None);
      assert_eq!(value.as_deref(),Some("new"));
    }
  `);
});
test("Option: transpose conserva errori e confini del parsing", () => {
  run(
    probe(
      0,
      "Assenza ed errore con transpose",
      `
    use std::num::IntErrorKind;
    assert_eq!(optional_number(Some("65535")),Ok(Some(65535)));
    assert_eq!(optional_number(Some("+1")),Ok(Some(1)));
    assert_eq!(optional_number(Some("")).unwrap_err().kind(),&IntErrorKind::Empty);
    assert_eq!(optional_number(Some("65536")).unwrap_err().kind(),&IntErrorKind::PosOverflow);
    assert_eq!(optional_number(Some(" 1 ")).unwrap_err().kind(),&IntErrorKind::InvalidDigit);
    let nested=Some(Some(Some(7)));
    let once: Option<Option<u8>>=nested.flatten();
    assert_eq!(once,Some(Some(7)));
    let absent: Option<Result<u8,&str>>=None;
    assert_eq!(absent.transpose(),Ok(None));
    assert_eq!(Some(Err::<u8,&str>("bad")).transpose(),Err("bad"));
  `,
    ),
  );
});
test("Option: expect su None e panic, non fallback", () => {
  run(
    'fn main(){None::<u8>.expect("required for this invariant");}',
    null,
    /required for this invariant/,
  );
});

test("Result: divisione tutti i segni e gli estremi", () => {
  run(
    probe(
      1,
      resultDivision,
      `
    let values=[i32::MIN,i32::MIN+1,-7,-1,0,1,2,7,i32::MAX];
    for a in values { for b in values {
      let actual=divide(a,b);
      if b==0 {assert_eq!(actual,Err(DivisionError::ZeroDivisor));}
      else {
        let expected=(i64::from(a)/i64::from(b)).try_into();
        match expected {
          Ok(value)=>assert_eq!(actual,Ok(value)),
          Err(_)=>assert_eq!(actual,Err(DivisionError::Overflow))
        }
      }
    }}
  `,
    ),
  );
});
test("Result: vecchia divisione overflow anche senza overflow checks", () => {
  run(
    `
    fn divide(a:i32,b:i32)->Result<i32,String>{
      if b==0 {Err("zero".into())} else {Ok(a/b)}
    }
    fn main(){let _=divide(i32::MIN,-1);}
  `,
    null,
    /divide with overflow/,
    ["-C", "overflow-checks=no"],
  );
});
test("Result: trasformazione tutti gli u8 e source del parsing", () => {
  run(
    probe(
      1,
      "map, map_err e and_then",
      `
    use std::num::IntErrorKind;
    for n in 0..=u8::MAX {
      let expected=if n<=127 {Ok(n*2)} else {Err(CountError::Overflow)};
      assert_eq!(doubled_count(&n.to_string()),expected);
    }
    match doubled_count("256") {
      Err(CountError::Invalid(error))=>assert_eq!(error.kind(),&IntErrorKind::PosOverflow),
      other=>panic!("{other:?}")
    }
  `,
    ),
  );
});
test("Result: closure eseguite solo nella variante appropriata", () => {
  run(`
    fn main(){
      assert_eq!(Err::<u8,_>("bad").map(|_|panic!("map")),Err::<u8,_>("bad"));
      assert_eq!(Err::<u8,_>("bad").and_then(|_|panic!("and_then")),Err::<u8,_>("bad"));
      assert_eq!(Ok::<u8,&str>(7).map_err(|_|panic!("map_err")),Ok::<u8,&str>(7));
      assert_eq!(Ok::<u8,&str>(7).or_else(|_|panic!("or_else")),Ok::<u8,&str>(7));
      let result=Err::<u8,_>("fatal").or_else(|e|if e=="missing"{Ok(1)}else{Err(e)});
      assert_eq!(result,Err("fatal"));
    }
  `);
});
test("Result: map fallibile annida, and_then concatena", () => {
  run(`
    fn main(){
      let nested=Ok::<u8,&str>(7).map(|n|Ok::<u8,&str>(n));
      assert_eq!(nested,Ok(Ok(7)));
      let flat=Ok::<u8,&str>(7).and_then(|n|Ok::<u8,&str>(n));
      assert_eq!(flat,Ok(7));
    }
  `);
});
test("Result: as_ref corregge il consumo", () => {
  run(
    replaceOnce(
      source(1, "Consumare due volte il risultato"),
      "parsed.unwrap_or(0)",
      "*parsed.as_ref().unwrap_or(&0)",
    ),
  );
});
test("Result: Copy solo quando T ed E lo sono", () => {
  run(`
    fn assert_copy<T:Copy>() {}
    fn main(){assert_copy::<Result<u8,&str>>(); let r=Ok::<u8,&str>(7); let _=r.map(|n|n); assert_eq!(r,Ok(7));}
  `);
  run(
    "fn assert_copy<T:Copy>() {} fn main(){assert_copy::<Result<u8,String>>();}",
    "E0277",
  );
});
test("Result: fallback eager puo fare panic su Ok", () => {
  run(
    `
    fn fallback()->u8{panic!("eager result");}
    fn main(){let _=Ok::<u8,&str>(7).unwrap_or(fallback());}
  `,
    null,
    /eager result/,
  );
});
test("Result: porta tutti gli u16 e grammatica dichiarata", () => {
  run(
    probe(
      1,
      resultPort,
      `
    for port in 1..=u16::MAX {assert_eq!(parse_port(Some(&port.to_string())),Ok(port));}
    assert_eq!(parse_port(Some("+80")),Ok(80));
    assert_eq!(parse_port(Some("00080")),Ok(80));
    for raw in [" 80 ","-1","80\n","8_0","0x50","\u{ff18}\u{ff10}"] {
      assert!(matches!(parse_port(Some(raw)),Err(ConfigError::InvalidPort(_))),"{raw}");
    }
  `,
    ),
  );
});
test("Result: errori specifici del parser non vengono persi", () => {
  run(
    probe(
      1,
      resultPort,
      `
    use std::num::IntErrorKind;
    for (raw,kind) in [("",IntErrorKind::Empty),("65536",IntErrorKind::PosOverflow),("bad",IntErrorKind::InvalidDigit)] {
      match parse_port(Some(raw)) {
        Err(ConfigError::InvalidPort(source))=>assert_eq!(source.kind(),&kind),
        other=>panic!("{other:?}")
      }
    }
  `,
    ),
  );
});
test("Result: enum didattico non implementa automaticamente Error", () => {
  run(
    mainFor(
      1,
      resultPort,
      `
    fn needs_error<E:std::error::Error>(){}
    needs_error::<ConfigError>();
  `,
    ),
    "E0277",
  );
});
test("Result: validazione unit non normalizza e non fa altri controlli", () => {
  run(
    probe(
      1,
      "Successo senza payload utile",
      `
    for raw in ["","\t\r\n","\u{a0}"] {assert!(validate_name(raw).is_err());}
    assert_eq!(validate_name(" notes "),Ok(()));
    assert_eq!(validate_name("\0"),Ok(()));
  `,
    ),
  );
});
test("Result: collect si ferma al primo errore e mantiene effetti", () => {
  run(`
    fn main(){
      let mut visits=0;
      let input=[Ok(1),Err("first"),Err("second"),Ok(4)];
      let result:Result<Vec<_>,_>=input.into_iter().inspect(|_|visits+=1).collect();
      assert_eq!(result,Err("first"));
      assert_eq!(visits,2);
      let first:Result<Vec<u8>,_>=[Err("first"),Ok(1)].into_iter().collect();
      assert_eq!(first,Err("first"));
      let all:Result<Vec<u8>,&str>=[Ok(1),Ok(2)].into_iter().collect();
      assert_eq!(all,Ok(vec![1,2]));
    }
  `);
});
test("Result: ok perde errore, transpose inverso conserva i tre stati", () => {
  run(`
    fn main(){
      assert_eq!(Err::<u8,_>("cause").ok(),None);
      assert_eq!(Ok::<u8,&str>(7).err(),None);
      assert_eq!(Err::<u8,_>("cause").err(),Some("cause"));
      let missing:Result<Option<u8>,&str>=Ok(None);
      assert_eq!(missing.transpose(),None);
      assert_eq!(Ok::<_,&str>(Some(7)).transpose(),Some(Ok(7)));
      assert_eq!(Err::<Option<u8>,_>("bad").transpose(),Some(Err("bad")));
    }
  `);
});
test("Result: let underscore sopprime must_use senza correggere l'errore", () => {
  run(
    replaceOnce(
      source(1, "Ignorare must_use"),
      "    check();",
      "    let _ = check();",
    ),
  );
});
test("Result: senza deny il risultato ignorato compila", () => {
  const code = source(1, "Ignorare must_use").replace(
    "#![deny(unused_must_use)]",
    "",
  );
  assert.equal(run(code), "");
});
test("Result: expect su Err fa panic", () => {
  run(
    'fn main(){Err::<u8,_>("cause").expect("required success");}',
    null,
    /required success.*cause/,
  );
});

test("?: equivalenza con match ai limiti u64", () => {
  run(
    probe(
      2,
      "Equivalenza con match per Result",
      `
    for raw in ["18446744073709551615","+0","00"," 1 ","1_0","\u{ff11}"] {
      assert_eq!(parse_id(raw),parse_id_explicit(raw));
    }
    assert_eq!(parse_id("18446744073709551615"),Ok(u64::MAX));
  `,
    ),
  );
});
test("?: senza From la conversione non esiste", () => {
  const code = source(2, "Conversione dell'errore con From");
  const start = code.indexOf("impl From<");
  const end = code.indexOf("fn parse_number");
  run(code.slice(0, start) + code.slice(end), "E0277");
});
test("?: map_err locale sostituisce From", () => {
  const code = source(2, "Conversione dell'errore con From");
  const start = code.indexOf("impl From<");
  const end = code.indexOf("fn parse_number");
  run(
    replaceOnce(
      code.slice(0, start) + code.slice(end),
      "raw.parse::<u32>()?",
      "raw.parse::<u32>().map_err(ReadError::InvalidNumber)?",
    ),
  );
});
test("?: errore convertito conserva ParseIntError", () => {
  run(
    probe(
      2,
      "Conversione dell'errore con From",
      `
    let Err(ReadError::InvalidNumber(source))=parse_number("4294967296") else {panic!("expected error");};
    assert_eq!(source.kind(),&std::num::IntErrorKind::PosOverflow);
  `,
    ),
  );
});
test("?: Ok finale necessario quando risultato atteso e Result", () => {
  run(
    replaceOnce(
      source(2, "Equivalenza con match per Result"),
      "    let id = raw.parse::<u64>()?;\n    Ok(id)",
      "    raw.parse::<u64>()?",
    ),
    "E0308",
  );
});
test("?: ok_or corregge la conversione Option Result", () => {
  run(
    replaceOnce(
      source(2, "Option non diventa Result automaticamente"),
      "raw?",
      'raw.ok_or("missing value")?',
    ),
  );
});
test("?: result.ok propaga None e scarta errore intenzionalmente", () => {
  run(`
    fn number(raw:&str)->Option<u8>{Some(raw.parse::<u8>().ok()?)}
    fn main(){assert_eq!(number("7"),Some(7));assert_eq!(number("bad"),None);}
  `);
});
test("?: blocco ordinario non delimita il ritorno", () => {
  run(`
    fn work(log:&mut Vec<u8>)->Result<(),&'static str>{
      { log.push(1); Err("stop")?; }
      log.push(2);
      Ok(())
    }
    fn main(){let mut log=Vec::new();assert_eq!(work(&mut log),Err("stop"));assert_eq!(log,vec![1]);}
  `);
});
test("?: Drop osservabile ma nessun rollback", () => {
  run(`
    use std::cell::Cell;
    struct Guard<'a>(&'a Cell<usize>);
    impl Drop for Guard<'_>{fn drop(&mut self){self.0.set(self.0.get()+1);}}
    fn work(drops:&Cell<usize>,values:&mut Vec<u8>)->Result<(),&'static str>{
      let _guard=Guard(drops);
      values.push(1);
      Err("stop")?;
      values.push(2);
      Ok(())
    }
    fn main(){let drops=Cell::new(0);let mut values=vec![];assert_eq!(work(&drops,&mut values),Err("stop"));assert_eq!(drops.get(),1);assert_eq!(values,vec![1]);}
  `);
});
test("?: append vuoto, primo errore, successo e residui", () => {
  run(
    probe(
      2,
      "Uscita anticipata non significa rollback",
      `
    let mut values=vec![9];
    assert_eq!(append_numbers(&mut values,&[]),Ok(()));
    assert!(append_numbers(&mut values,&["bad","1"]).is_err());
    assert_eq!(values,vec![9]);
    assert_eq!(append_numbers(&mut values,&["0","255"]),Ok(()));
    assert_eq!(values,vec![9,0,255]);
    assert!(append_numbers(&mut values,&["1","256"]).is_err());
    assert_eq!(values,vec![9,0,255,1]);
  `,
    ),
  );
});
test("?: validare prima impedisce effetti di parsing parziali", () => {
  run(`
    fn append(output:&mut Vec<u8>,raw:&[&str])->Result<(),std::num::ParseIntError>{
      let parsed:Result<Vec<u8>,_>=raw.iter().map(|s|s.parse()).collect();
      output.extend(parsed?); Ok(())
    }
    fn main(){let mut v=vec![9];assert!(append(&mut v,&["1","bad"]).is_err());assert_eq!(v,vec![9]);assert_eq!(append(&mut v,&["1","2"]),Ok(()));assert_eq!(v,vec![9,1,2]);}
  `);
});
test("?: for_each con closure unit rifiutato", () => {
  run(
    `
    fn main(){["1"].into_iter().for_each(|raw|{let _=raw.parse::<u8>()?;});}
  `,
    "E0277",
  );
});
test("?: try_for_each interrompe al primo errore", () => {
  run(`
    fn main(){
      let mut v=vec![];
      let result:Result<(),std::num::ParseIntError>=["1","bad","2"].into_iter().try_for_each(|raw|{v.push(raw.parse::<u8>()?);Ok(())});
      assert!(result.is_err());assert_eq!(v,vec![1]);
    }
  `);
});
test("?: ControlFlow supportato su stable", () => {
  run(`
    use std::ops::ControlFlow;
    fn visit(log:&mut Vec<u8>)->ControlFlow<&'static str>{
      log.push(1);
      ControlFlow::<&str,()>::Break("stop")?;
      log.push(2);
      ControlFlow::Continue(())
    }
    fn main(){let mut log=vec![];assert_eq!(visit(&mut log),ControlFlow::Break("stop"));assert_eq!(log,vec![1]);}
  `);
});
test("?: await prima di propagare, future eseguito realmente", () => {
  run(`
    use std::{future::Future,pin::pin,sync::Arc,task::{Context,Poll,Wake,Waker}};
    struct Noop; impl Wake for Noop{fn wake(self:Arc<Self>){}}
    async fn number(raw:&str)->Result<u8,std::num::ParseIntError>{
      let value=async {raw.parse::<u8>()}.await?;
      Ok(value)
    }
    fn main(){
      let waker=Waker::from(Arc::new(Noop));let mut cx=Context::from_waker(&waker);
      assert_eq!(pin!(number("7")).as_mut().poll(&mut cx),Poll::Ready(Ok(7)));
      assert!(matches!(pin!(number("bad")).as_mut().poll(&mut cx),Poll::Ready(Err(_))));
    }
  `);
});
test("?: Try personalizzato non e stabile", () => {
  run(
    `
    use std::ops::Try;
    fn main(){}
  `,
    "E0658",
  );
});
test("?: CLI legge percorso con spazi senza alterare il file", () => {
  assert.equal(
    cli(["port number.txt"], { "port number.txt": "  +8080 \r\n" }),
    "port: 8080\n",
  );
});
test("?: CLI limite massimo porta", () => {
  assert.equal(cli(["port.txt"], { "port.txt": "65535" }), "port: 65535\n");
});
test("?: CLI file assente restituisce errore, non panic", () => {
  assert.equal(
    cli(["absent.txt"], {}, /Error:.*(?:NotFound|cannot find|not found)/i),
    "",
  );
});
test("?: CLI file vuoto conserva errore di parsing", () => {
  assert.equal(
    cli(["port.txt"], { "port.txt": "" }, /ParseIntError.*Empty/),
    "",
  );
});
test("?: CLI fuori range conserva errore di parsing", () => {
  assert.equal(
    cli(["port.txt"], { "port.txt": "65536" }, /ParseIntError.*PosOverflow/),
    "",
  );
});
test("?: CLI zero rifiutato dalla policy", () => {
  assert.equal(
    cli(["port.txt"], { "port.txt": "0" }, /port must be nonzero/),
    "",
  );
});
test("?: CLI UTF-8 invalido come errore I/O", () => {
  assert.equal(
    cli(
      ["port.txt"],
      { "port.txt": Buffer.from([0xff, 0xfe]) },
      /valid UTF-8|InvalidData/i,
    ),
    "",
  );
});
test("?: Box conserva tipo concreto dell'errore", () => {
  run(
    mainFor(
      2,
      questionCli,
      `
    fs::write("bad.txt","bad").unwrap();
    let error=read_port(Path::new("bad.txt")).unwrap_err();
    assert!(error.downcast_ref::<std::num::ParseIntError>().is_some());
    let error=read_port(Path::new("absent.txt")).unwrap_err();
    assert_eq!(error.downcast_ref::<io::Error>().unwrap().kind(),io::ErrorKind::NotFound);
  `,
    ),
  );
});
