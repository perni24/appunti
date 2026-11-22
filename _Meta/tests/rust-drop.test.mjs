import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Drop Trait"];
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
const prefix = "appunti-rust-drop-";
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

const order = "Distruttore del tipo e distruzione dei campi";
const move = "Move, riassegnamento e rilascio anticipato";
const lock = "Una guardia mantiene il lock fino alla distruzione";
const batch = "Annullare aggiunte non confermate a un vettore";
const flush = "Cleanup fallibile con un'operazione esplicita";
const take = "Estrarre un campo lasciando uno stato valido";
const forget = "Sospendere la distruzione non equivale a liberare";
const unwind = "Unwinding e limiti del cleanup";
const direct = "Chiamare direttamente il metodo drop";
const copy = "Combinare Copy e Drop";
const field = "Muovere direttamente un campo non Copy";
const from = (heading) => source(0, heading);
function main(heading, body) {
  const original = from(heading);
  assert.equal(original.split("fn main(").length, 2);
  return (
    original.slice(0, original.indexOf("fn main(")) +
    "fn main() {\n" +
    body +
    "\n}"
  );
}

test("baseline reale e inventario: undici programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 11);
});
test("frontmatter invariato, struttura e fonti", () => {
  const file = "Programmazione/Rust/Pagine/Drop Trait.md";
  const head = launch("git", ["show", "HEAD:" + file], process.cwd());
  assert.equal(head.status, 0, head.stderr);
  const yaml = (s) =>
    s.replaceAll("\r\n", "\n").match(/^---\n([\s\S]*?)\n---/)[1];
  assert.equal(yaml(fs.readFileSync(file, "utf8")), yaml(head.stdout));
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
  ]) {
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === title),
      title,
    );
  }
  const content = fs.readFileSync(file, "utf8");
  assert.match(content, /doc\.rust-lang\.org\/reference\/destructors\.html/);
  assert.match(content, /edition-guide\/rust-2024/);
  for (const code of blocks[0].values())
    assert.doesNotMatch(code, /\bunsafe\s*\{|todo!|unimplemented!/);
});
for (const title of [order, move, lock, batch, flush, take, forget]) {
  test("programma originale: " + title, () => run(from(title)));
}
test("programma originale: unwinding e hook", () =>
  run(from(unwind), { args: ["-C", "panic=unwind"], stderr: /demo unwind/ }));
for (const [title, error] of [
  [direct, "E0040"],
  [copy, "E0184"],
  [field, "E0509"],
]) {
  test("controesempio originale: " + title, () => run(from(title), { error }));
}
test("ordine: rimuovere Drop del wrapper non elimina i distruttori dei campi", () => {
  let code = from(order).replace(
    /impl Drop for Envelope<'_> \{[\s\S]*?\n\}\n/,
    "",
  );
  code = replaceOnce(
    code,
    '["envelope", "first", "second", "local"]',
    '["first", "second", "local"]',
  );
  run(code);
});
test("ordine: contano le dichiarazioni dei campi, non gli initializer", () => {
  let code = replaceOnce(
    from(order),
    "    first: Tracked<'a>,\n    second: Tracked<'a>,",
    "    second: Tracked<'a>,\n    first: Tracked<'a>,",
  );
  code = replaceOnce(
    code,
    '["envelope", "first", "second", "local"]',
    '["envelope", "second", "first", "local"]',
  );
  run(code);
});
test("ordine: scope interno, tuple, array ed enum", () => {
  run(
    main(
      order,
      `
    let events=RefCell::new(Vec::new());
    {
      let _outer=Tracked {name:"outer",events:&events};
      {
        let _inner=Tracked {name:"inner",events:&events};
      }
      assert_eq!(*events.borrow(), ["inner"]);
      let tuple=(Tracked{name:"t0",events:&events},Tracked{name:"t1",events:&events});
      drop(tuple);
      let array=[Tracked{name:"a0",events:&events},Tracked{name:"a1",events:&events}];
      drop(array);
      enum Pair<'a> { Both(Tracked<'a>, Tracked<'a>) }
      let pair=Pair::Both(Tracked{name:"e0",events:&events},Tracked{name:"e1",events:&events});
      drop(pair);
    }
    assert_eq!(*events.borrow(),["inner","t0","t1","a0","a1","e0","e1","outer"]);
  `,
    ),
  );
});
test("ordine: move parziale senza Drop lascia solo i campi rimasti", () => {
  run(
    main(
      order,
      `
    let events=RefCell::new(Vec::new());
    let extracted;
    {
      let pair=(Tracked{name:"moved",events:&events},Tracked{name:"remaining",events:&events});
      extracted=pair.0;
    }
    assert_eq!(*events.borrow(),["remaining"]);
    drop(extracted);
    assert_eq!(*events.borrow(),["remaining","moved"]);
  `,
    ),
  );
});
test("cleanup dei campi non implica che il wrapper soddisfi T Drop", () => {
  run(
    `struct Wrapper(String);
fn requires_drop<T: Drop>(_: T) {}
fn main() { requires_drop(Wrapper(String::from("rust"))); }`,
    { error: "E0277" },
  );
});
test("move: proprietario consumato da drop non riutilizzabile", () => {
  run(
    main(
      move,
      `let drops=Cell::new(0); let value=Counted(&drops); drop(value); drop(value);`,
    ),
    { error: "E0382" },
  );
});
test("move: prestito ancora usato impedisce drop del proprietario", () => {
  run(
    main(
      move,
      `let drops=Cell::new(0); let value=Counted(&drops); let view=&value; drop(value); assert_eq!(view.0.get(),0);`,
    ),
    { error: "E0505" },
  );
});
test("move: wildcard su binding esistente non lo consuma", () => {
  run(
    main(
      move,
      `
    let drops=Cell::new(0);
    let guard=Counted(&drops);
    let _=guard;
    assert_eq!(drops.get(),0);
    drop(guard);
    assert_eq!(drops.get(),1);
  `,
    ),
  );
});
test("move: riferimento mutabile non distrugge il referente", () => {
  run(
    main(
      move,
      `let drops=Cell::new(0); let mut guard=Counted(&drops); drop(&mut guard); assert_eq!(drops.get(),0); drop(guard); assert_eq!(drops.get(),1);`,
    ),
  );
});
test("move: drop di Copy lascia disponibile il valore originale", () => {
  run("fn main() { let value=7_u32; drop(value); assert_eq!(value,7); }");
});
test("move: ritorno trasferisce il valore prima del cleanup del chiamante", () => {
  run(
    main(
      move,
      `
    fn make(drops:&Cell<usize>)->Counted<'_> { Counted(drops) }
    let drops=Cell::new(0);
    let value=make(&drops);
    assert_eq!(drops.get(),0);
    drop(value);
    assert_eq!(drops.get(),1);
  `,
    ),
  );
});
test("guardia: drop di un riferimento non sblocca il mutex", () => {
  run(
    main(
      lock,
      `let counter=Mutex::new(0); let guard=counter.lock().unwrap(); drop(&guard); assert!(matches!(counter.try_lock(),Err(TryLockError::WouldBlock))); drop(guard); assert!(counter.try_lock().is_ok());`,
    ),
  );
});
test("guardia: underscore nominato mantiene il lock, blocco lo rilascia", () => {
  run(
    main(
      lock,
      `let counter=Mutex::new(0); { let _guard=counter.lock().unwrap(); assert!(matches!(counter.try_lock(),Err(TryLockError::WouldBlock))); } assert!(counter.try_lock().is_ok());`,
    ),
  );
});
test("guardia: let wildcard su temporaneo rilascia subito con lint esplicitamente ammesso", () => {
  run(
    main(
      lock,
      `#[allow(let_underscore_lock)] let _=Mutex::new(0).lock().unwrap(); let counter=Mutex::new(0); #[allow(let_underscore_lock)] let _=counter.lock().unwrap(); assert!(counter.try_lock().is_ok());`,
    ),
  );
});
test("guardia: il lint predefinito segnala wildcard su un nuovo lock", () => {
  run(main(lock, `let counter=Mutex::new(0); let _=counter.lock().unwrap();`), {
    message: /non-binding let on a synchronization lock/,
  });
});
test("batch: vuoto, zero, duplicati, estremi e rollback per ogni posizione", () => {
  run(
    main(
      batch,
      `
    for prefix in [vec![], vec![i32::MIN,10], vec![1,1]] {
      let mut target=prefix.clone();
      assert_eq!(append_nonnegative(&mut target,&[]),Ok(()));
      assert_eq!(target,prefix);
      assert_eq!(append_nonnegative(&mut target,&[0,i32::MAX,0]),Ok(()));
      assert_eq!(&target[prefix.len()..],&[0,i32::MAX,0]);
      for position in 0..4 {
        let before=target.clone();
        let mut input=vec![1,2,3,4];
        input[position]=i32::MIN;
        assert_eq!(append_nonnegative(&mut target,&input),Err("negative value"));
        assert_eq!(target,before);
      }
    }
  `,
    ),
  );
});
test("batch: ripetizioni alternano rollback e commit senza perdere il prefisso", () => {
  run(
    main(
      batch,
      `let mut target=vec![7]; for i in 0..16 { assert!(append_nonnegative(&mut target,&[i,-1]).is_err()); assert_eq!(target.len(),i as usize+1); assert!(append_nonnegative(&mut target,&[i]).is_ok()); } assert_eq!(target,[vec![7],(0..16).collect()].concat());`,
    ),
  );
});
test("batch: ritorno tramite question mark esegue rollback", () => {
  run(
    main(
      batch,
      `
    fn fallible(target:&mut Vec<i32>)->Result<(),&'static str> {
      let mut transaction=AppendTransaction::new(target);
      transaction.push(99);
      Err("failure")?;
      transaction.commit();
      Ok(())
    }
    let mut target=vec![1];
    assert_eq!(fallible(&mut target),Err("failure"));
    assert_eq!(target,[1]);
  `,
    ),
  );
});
test("batch: rollback anche durante unwinding, non una promessa su abort", () => {
  run(
    main(
      batch,
      `
    let mut target=vec![1];
    let result=std::panic::catch_unwind(std::panic::AssertUnwindSafe(||{
      let mut transaction=AppendTransaction::new(&mut target);
      transaction.push(2);
      panic!("batch unwind");
    }));
    assert!(result.is_err());
    assert_eq!(target,[1]);
  `,
    ),
    { args: ["-C", "panic=unwind"], stderr: /batch unwind/ },
  );
});
test("batch: commit consuma la guardia", () => {
  run(
    main(
      batch,
      `let mut target=vec![]; let mut tx=AppendTransaction::new(&mut target); tx.commit(); tx.push(1);`,
    ),
    { error: "E0382" },
  );
});
test("batch: il prestito esclusivo vieta modifiche concorrenti del target", () => {
  run(
    main(
      batch,
      `let mut target=vec![]; let mut tx=AppendTransaction::new(&mut target); target.push(1); tx.push(2);`,
    ),
    { error: "E0499" },
  );
});
test("batch: campo privato non permette di disattivare il rollback dall'esterno", () => {
  run(
    main(
      batch,
      `let mut target=vec![]; let mut tx=AppendTransaction::new(&mut target); tx.committed=true;`,
    ),
    { error: "E0616" },
  );
});
test("batch: forget lascia davvero le aggiunte non confermate", () => {
  run(
    main(
      batch,
      `let mut target=vec![1]; let mut tx=AppendTransaction::new(&mut target); tx.push(2); std::mem::forget(tx); assert_eq!(target,[1,2]);`,
    ),
  );
});
test("batch: il rollback non ripristina la capacita", () => {
  run(
    main(
      batch,
      `
    let mut target=Vec::new();
    { let mut tx=AppendTransaction::new(&mut target); for value in 0..32 { tx.push(value); } }
    assert!(target.is_empty());
    assert!(target.capacity()>=32);
  `,
    ),
  );
});
test("batch: una commit che non marca lo stato e rilevata dagli esempi", () => {
  run(
    replaceOnce(
      from(batch),
      "self.committed = true;",
      "self.committed = false;",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("batch: togliere truncate e rilevato dagli esempi", () => {
  run(
    replaceOnce(
      from(batch),
      "self.target.truncate(self.initial_len);",
      "let _ = self.initial_len;",
    ),
    { panic: /assertion.*failed/s },
  );
});
test("writer: errore esplicito di flush propagato dopo i byte scritti", () => {
  run(
    main(
      flush,
      `
    #[derive(Default)] struct Sink { bytes:Vec<u8>, flushes:usize }
    impl Write for Sink {
      fn write(&mut self,data:&[u8])->io::Result<usize>{self.bytes.extend_from_slice(data);Ok(data.len())}
      fn flush(&mut self)->io::Result<()> {self.flushes+=1;Err(io::Error::other("flush failed"))}
    }
    let mut sink=Sink::default();
    assert_eq!(write_report(&mut sink).unwrap_err().to_string(),"flush failed");
    assert_eq!(sink.bytes,b"result=ok\n");
    assert_eq!(sink.flushes,1);
  `,
    ),
  );
});
test("writer: errore di scrittura propagato con effetti parziali e retry del drop", () => {
  run(
    main(
      flush,
      `
    #[derive(Default)] struct Sink { bytes:Vec<u8>, calls:usize }
    impl Write for Sink {
      fn write(&mut self,data:&[u8])->io::Result<usize>{
        self.calls+=1;
        if self.calls==2 {return Err(io::Error::other("write failed"));}
        let count=if self.calls==1 {2} else {data.len()};
        self.bytes.extend_from_slice(&data[..count]); Ok(count)
      }
      fn flush(&mut self)->io::Result<()> {Ok(())}
    }
    let mut sink=Sink::default();
    assert_eq!(write_report(&mut sink).unwrap_err().to_string(),"write failed");
    assert_eq!(sink.bytes,b"result=ok\n");
    assert_eq!(sink.calls,3);
  `,
    ),
  );
});
test("writer: WriteZero non viene trasformato in successo", () => {
  run(
    main(
      flush,
      `struct Sink; impl Write for Sink {fn write(&mut self,_:&[u8])->io::Result<usize>{Ok(0)} fn flush(&mut self)->io::Result<()>{Ok(())}} assert_eq!(write_report(Sink).unwrap_err().kind(),io::ErrorKind::WriteZero);`,
    ),
  );
});
test("writer: Drop da solo ignora l'errore del buffer e non chiama inner flush", () => {
  run(
    main(
      flush,
      `
    #[derive(Default)] struct Sink { writes:usize, flushes:usize }
    impl Write for Sink {
      fn write(&mut self,_:&[u8])->io::Result<usize>{self.writes+=1;Err(io::Error::other("write failed"))}
      fn flush(&mut self)->io::Result<()>{self.flushes+=1;Err(io::Error::other("flush failed"))}
    }
    let mut sink=Sink::default();
    { let mut writer=BufWriter::new(&mut sink); writer.write_all(b"abc").unwrap(); }
    assert_eq!(sink.writes,1);
    assert_eq!(sink.flushes,0);
  `,
    ),
  );
});
test("writer: output identico con destinazione che accetta un byte per volta", () => {
  run(
    main(
      flush,
      `
    #[derive(Default)] struct Sink(Vec<u8>);
    impl Write for Sink {
      fn write(&mut self,data:&[u8])->io::Result<usize>{let n=usize::from(!data.is_empty());self.0.extend_from_slice(&data[..n]);Ok(n)}
      fn flush(&mut self)->io::Result<()>{Ok(())}
    }
    let mut sink=Sink::default(); write_report(&mut sink).unwrap(); assert_eq!(sink.0,b"result=ok\n");
  `,
    ),
  );
});
test("take: vuoto e Unicode, buffer trasferito e Drop vede lo stato sostitutivo", () => {
  run(
    main(
      take,
      `
    for text in ["", "caff\u{e8}", "rust"] {
      let text=String::from(text);
      let pointer=text.as_ptr();
      let remaining=Cell::new(999);
      let payload=Payload{text,remaining:&remaining};
      let owned=payload.into_inner();
      assert_eq!(owned.as_ptr(),pointer);
      assert_eq!(remaining.get(),0);
    }
  `,
    ),
  );
});
test("take: Drop ordinario vede la lunghezza in byte del contenuto", () => {
  run(
    main(
      take,
      `let remaining=Cell::new(999); drop(Payload{text:String::from("caff\u{e8}"),remaining:&remaining}); assert_eq!(remaining.get(),6);`,
    ),
  );
});
test("take: il sostituto non vuoto con replace e visto dal distruttore", () => {
  let code = replaceOnce(
    from(take),
    "mem::take(&mut self.text)",
    'mem::replace(&mut self.text, String::from("replacement"))',
  );
  code = replaceOnce(
    code,
    "assert_eq!(remaining.get(), 0);",
    "assert_eq!(remaining.get(), 11);",
  );
  run(code);
});
test("take: Option permette estrazione di T non Clone e non Default", () => {
  run(`
    struct Resource(u32);
    struct Holder(Option<Resource>);
    impl Drop for Holder {fn drop(&mut self) {assert!(self.0.is_none());}}
    impl Holder {fn into_inner(mut self)->Option<Resource>{self.0.take()}}
    fn main(){let value=Holder(Some(Resource(7))).into_inner().unwrap();assert_eq!(value.0,7);}
  `);
});
test("forget: ownership resta consumata anche senza distruttore", () => {
  run(
    main(
      forget,
      `let drops=Cell::new(0); let guard=Counted(&drops); mem::forget(guard); drop(guard);`,
    ),
    { error: "E0382" },
  );
});
test("ManuallyDrop: il wrapper non droppa il contenuto nemmeno come campo", () => {
  run(
    main(
      forget,
      `struct Holder<'a>{value:ManuallyDrop<Counted<'a>>} let drops=Cell::new(0); drop(Holder{value:ManuallyDrop::new(Counted(&drops))}); assert_eq!(drops.get(),0);`,
    ),
  );
});
test("ManuallyDrop: chiamata manuale richiede unsafe", () => {
  run(
    main(
      forget,
      `let drops=Cell::new(0); let mut value=ManuallyDrop::new(Counted(&drops)); ManuallyDrop::drop(&mut value);`,
    ),
    { error: "E0133" },
  );
});
test("ManuallyDrop: drop sul wrapper e negato dal lint predefinito", () => {
  run(
    main(
      forget,
      `let drops=Cell::new(0); let value=ManuallyDrop::new(Counted(&drops)); drop(value);`,
    ),
    { error: "undropped_manually_drops" },
  );
});
test("ManuallyDrop: ammettere il lint non esegue il distruttore interno", () => {
  run(
    main(
      forget,
      `let drops=Cell::new(0); let value=ManuallyDrop::new(Counted(&drops)); #[allow(undropped_manually_drops)] drop(value); assert_eq!(drops.get(),0);`,
    ),
  );
});
test("ManuallyDrop: take manuale richiede unsafe", () => {
  run(
    main(
      forget,
      `let drops=Cell::new(0); let mut value=ManuallyDrop::new(Counted(&drops)); let _=ManuallyDrop::take(&mut value);`,
    ),
    { error: "E0133" },
  );
});
test("unwind: uscita normale non richiede panic per il cleanup", () => {
  run(
    main(
      unwind,
      `let drops=AtomicUsize::new(0); {let _guard=Guard(&drops);} assert_eq!(drops.load(Ordering::Relaxed),1);`,
    ),
  );
});
test("unwind: piu guardie vengono distrutte durante lo stesso unwind", () => {
  let code = replaceOnce(
    from(unwind),
    "let _guard = Guard(&drops);",
    "let _guard = Guard(&drops);\nlet _second = Guard(&drops);",
  );
  code = replaceOnce(
    code,
    "assert_eq!(drops.load(Ordering::Relaxed), 1);",
    "assert_eq!(drops.load(Ordering::Relaxed), 2);",
  );
  run(code, { args: ["-C", "panic=unwind"], stderr: /demo unwind/ });
});
test("exit nel solo processo fixture non esegue il distruttore locale", () => {
  assert.equal(
    run(
      `struct Guard; impl Drop for Guard {fn drop(&mut self){println!("dropped");}} fn main(){let _guard=Guard; std::process::exit(0);}`,
    ),
    "",
  );
});
test("static: il valore globale non e distrutto alla fine di main", () => {
  assert.equal(
    run(
      `struct Guard; impl Drop for Guard {fn drop(&mut self){println!("dropped");}} static GUARD:Guard=Guard; fn main(){let _=&GUARD;}`,
    ),
    "",
  );
});
test("metodo Drop: anche la forma qualificata e vietata", () => {
  run(replaceOnce(from(direct), "marker.drop();", "Drop::drop(&mut marker);"), {
    error: "E0040",
  });
});
test("metodo Drop: funzione drop risolve il controesempio", () => {
  run(replaceOnce(from(direct), "marker.drop();", "drop(marker);"));
});
test("Clone e Drop possono coesistere senza Copy", () => {
  run(replaceOnce(from(copy), "#[derive(Clone, Copy)]", "#[derive(Clone)]"));
});
test("campo: take risolve E0509 con sostituto valido", () => {
  let code = replaceOnce(
    from(field),
    "fn into_inner(self) -> String",
    "fn into_inner(mut self) -> String",
  );
  code = replaceOnce(
    code,
    "        self.text",
    "        std::mem::take(&mut self.text)",
  );
  run(code);
});
test("campo: clone deliberato risolve E0509 conservando il campo fino al Drop", () => {
  run(
    replaceOnce(from(field), "        self.text", "        self.text.clone()"),
  );
});
test("campo Copy leggibile anche quando il wrapper implementa Drop", () => {
  run(
    `struct Holder(u32); impl Drop for Holder {fn drop(&mut self){assert_eq!(self.0,7);}} fn main(){let holder=Holder(7);let number=holder.0;assert_eq!(number,7);drop(holder);}`,
  );
});
const borrowed = `
struct Observer<'a>(&'a String);
impl Drop for Observer<'_>{fn drop(&mut self){assert!(!self.0.is_empty());}}
fn main(){let mut text=String::from("rust");let observer=Observer(&text);text.push('!');}
`;
test("drop check: il distruttore usa il prestito dopo l'ultimo uso esplicito", () =>
  run(borrowed, { error: "E0502" }));
test("drop check: rilascio prima della mutazione risolve il conflitto", () =>
  run(
    replaceOnce(borrowed, "text.push('!');", "drop(observer);text.push('!');"),
  ));
test("drop check: senza Drop quel binding non trattiene il prestito fino allo scope", () =>
  run(
    borrowed.replace(
      "impl Drop for Observer<'_>{fn drop(&mut self){assert!(!self.0.is_empty());}}",
      "",
    ),
  ));
const temporary = `
use std::cell::RefCell;
fn main(){
 let value=RefCell::new(None::<i32>);
 if let Some(_)=*value.borrow(){unreachable!();}
 else {assert_eq!(value.try_borrow_mut().is_ok(), EXPECTED);};
}
`;
test("edition 2024: temporaneo if let rilasciato prima di else", () =>
  run(temporary.replace("EXPECTED", "true")));
test("edition 2021: temporaneo if let ancora vivo in else", () =>
  run(temporary.replace("EXPECTED", "false"), { edition: "2021" }));
const tail = `use std::cell::RefCell;fn count()->usize {let value=RefCell::new(String::from("rust"));value.borrow().len()}fn main(){assert_eq!(count(),4);}`;
test("edition 2024: temporaneo tail prima del proprietario locale", () =>
  run(tail));
test("edition 2021: tail equivalente richiede binding intermedio", () =>
  run(tail, { edition: "2021", error: "E0597" }));
test("edition 2021: binding intermedio rende esplicito lo scope del temporaneo", () =>
  run(
    tail.replace("value.borrow().len()", "let size=value.borrow().len();size"),
    { edition: "2021" },
  ));
