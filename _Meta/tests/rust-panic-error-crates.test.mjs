import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const tool = (name) =>
  path.isAbsolute(rustc)
    ? path.join(
        path.dirname(rustc),
        name + (process.platform === "win32" ? ".exe" : ""),
      )
    : name;
const cargo = process.env.CARGO_TEST_EXECUTABLE || tool("cargo");
const names = ["panic", "Error handling idiomatico", "thiserror e anyhow"];
const notes = names.map((name) =>
  parseNote("Programmazione/Rust/Pagine/" + name + ".md"),
);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  const found = new Map();
  let heading;
  for (const node of note.tree.children) {
    if (node.type === "heading") heading = text(node);
    if (node.type === "code" && ["rust", "toml"].includes(node.lang)) {
      assert.ok(heading);
      assert.ok(!found.has(heading), heading);
      found.set(heading, { lang: node.lang, code: node.value });
    }
  }
  return found;
});
const prefix = "appunti-rust-panic-error-crates-";
const parent = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(parent, prefix));
after(() => {
  const resolved = fs.realpathSync(root);
  assert.equal(path.dirname(resolved), parent);
  assert.ok(path.basename(resolved).startsWith(prefix));
  fs.rmSync(resolved, { recursive: true, force: true });
});
const env = {
  ...process.env,
  RUSTC: rustc,
  RUSTDOC: tool("rustdoc"),
  RUST_BACKTRACE: "0",
  RUST_LIB_BACKTRACE: "0",
  CARGO_HOME:
    process.env.RUST_ERROR_TEST_CARGO_HOME || path.join(root, "cargo-home"),
  CARGO_TARGET_DIR: path.join(root, "cargo-target"),
  CARGO_NET_OFFLINE: "true",
  CARGO_TERM_COLOR: "never",
};
for (const key of [
  "RUSTFLAGS",
  "RUSTDOCFLAGS",
  "CARGO_ENCODED_RUSTFLAGS",
  "CARGO_ENCODED_RUSTDOCFLAGS",
  "CARGO_BUILD_TARGET",
  "RUSTC_WRAPPER",
  "RUSTC_WORKSPACE_WRAPPER",
])
  delete env[key];
let sequence = 0;
function directory() {
  const dir = path.join(root, String(sequence++));
  fs.mkdirSync(dir);
  return dir;
}
function write(dir, name, content) {
  const target = path.resolve(dir, name);
  assert.ok(target.startsWith(path.resolve(root) + path.sep));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
function launch(executable, args, cwd = root, overrides = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...overrides },
    encoding: "utf8",
    timeout: 180000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return {
    ...result,
    stdout: result.stdout.replaceAll("\r\n", "\n"),
    stderr: result.stderr.replaceAll("\r\n", "\n"),
  };
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function failed(result, expected) {
  assert.notEqual(result.status, 0);
  if (expected instanceof RegExp)
    assert.match(result.stdout + result.stderr, expected);
  else {
    const diagnostics = (result.stdout + "\n" + result.stderr)
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map(JSON.parse)
      .map((d) => (d.message?.level ? d.message : d));
    assert.ok(
      diagnostics.some((d) => d.level === "error" && d.code?.code === expected),
      result.stdout + result.stderr,
    );
  }
}
function source(i, heading) {
  assert.ok(blocks[i].has(heading), heading);
  return blocks[i].get(heading).code;
}
function replaceOnce(code, before, after) {
  assert.equal(code.split(before).length, 2, before);
  return code.replace(before, () => after);
}
function probe(i, heading, code) {
  return replaceOnce(source(i, heading), "fn main() {", "fn main() {\n" + code);
}
function mainFor(i, heading, body) {
  const code = source(i, heading),
    at = code.indexOf("fn main()");
  assert.ok(at >= 0);
  return code.slice(0, at) + "fn main() {\n" + body + "\n}";
}
function verify(executable, dir, options = {}) {
  const result = launch(executable, options.args || [], dir, options.env || {});
  assert.equal(
    result.status,
    options.status ?? 0,
    result.stdout + result.stderr,
  );
  assert.match(result.stderr, options.stderr || /^$/);
  if (options.stdout !== undefined) assert.equal(result.stdout, options.stdout);
  for (const [name, content] of Object.entries(options.files || {}))
    assert.deepEqual(
      fs.readFileSync(path.join(dir, name)),
      Buffer.from(content),
    );
  return result;
}
function run(code, options = {}) {
  const dir = directory();
  write(dir, "main.rs", code);
  for (const [name, content] of Object.entries(options.files || {}))
    write(dir, name, content);
  const exe = path.join(
    dir,
    process.platform === "win32" ? "demo.exe" : "demo",
  );
  const result = launch(
    rustc,
    [
      "--edition=2024",
      "--crate-name",
      "note_example",
      "--error-format=json",
      "main.rs",
      ...(options.flags || []),
      "-o",
      exe,
    ],
    dir,
  );
  if (options.compileError) {
    failed(result, options.compileError);
    return;
  }
  ok(result);
  if (options.compileOnly) return;
  return verify(exe, dir, options);
}
let lock, dependencyVersions;
function prepareCargo() {
  if (lock) return;
  const dir = directory();
  write(dir, "Cargo.toml", source(2, "Cargo.toml"));
  write(dir, "src/main.rs", "fn main() {}");
  const allow = process.env.RUST_ERROR_TEST_FETCH === "1";
  ok(
    launch(cargo, ["fetch"], dir, {
      CARGO_NET_OFFLINE: allow ? "false" : "true",
    }),
  );
  lock = fs.readFileSync(path.join(dir, "Cargo.lock"), "utf8");
  const meta = JSON.parse(
    ok(
      launch(
        cargo,
        ["metadata", "--format-version=1", "--locked", "--offline"],
        dir,
      ),
    ).stdout,
  );
  dependencyVersions = meta.packages
    .filter((p) => p.source)
    .map((p) => p.name + "@" + p.version)
    .sort();
  assert.ok(dependencyVersions.includes("thiserror@2.0.21"));
  assert.ok(dependencyVersions.includes("anyhow@1.0.104"));
}
function crate(code, options = {}) {
  prepareCargo();
  const dir = directory();
  write(dir, "Cargo.toml", source(2, "Cargo.toml"));
  write(dir, "Cargo.lock", lock);
  write(dir, "src/main.rs", code);
  for (const [name, content] of Object.entries(options.files || {}))
    write(dir, name, content);
  const result = launch(
    cargo,
    ["build", "--offline", "--locked", "--message-format=json"],
    dir,
  );
  if (options.compileError) {
    failed(result, options.compileError);
    return;
  }
  ok(result);
  return verify(
    path.join(
      env.CARGO_TARGET_DIR,
      "debug",
      process.platform === "win32" ? "error-guide.exe" : "error-guide",
    ),
    dir,
    options,
  );
}

test("toolchain e inventario: 13 programmi Rust e due blocchi TOML", () => {
  assert.match(ok(launch(rustc, ["--version"])).stdout, /1\.99\.1\b/);
  assert.deepEqual(
    blocks.map((b) => [...b.values()].filter((v) => v.lang === "rust").length),
    [6, 3, 4],
  );
});
for (const [i, note] of notes.entries())
  test(names[i] + ": metadati e struttura", () => {
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
test("panic: Error handling e approfondimento, non prerequisito successivo", () => {
  assert.ok(
    !notes[0].data.prerequisites.some((x) =>
      x.includes("Error handling idiomatico"),
    ),
  );
  assert.ok(
    notes[0].data.related.some((x) => x.includes("Error handling idiomatico")),
  );
});
const panicOptions = {
  "Panic esplicito": {
    status: 101,
    stderr: /internal queue invariant violated/,
    stdout: "",
  },
  "Intercettare un unwind a un confine controllato": {
    stderr: /demonstration panic/,
    stdout: "guard dropped\ncaller continues\n",
  },
  "Panic di un worker osservato con join": {
    stderr: /worker invariant violated/,
    stdout: "main continues\n",
  },
};
for (let i = 0; i < 2; i++)
  for (const [heading, { lang, code }] of blocks[i])
    if (lang === "rust")
      test(names[i] + ": " + heading, () =>
        run(code, panicOptions[heading] || { stdout: "" }),
      );
const percent = "Tipo con contratto documentato e alternativa fallibile";
const optional = "Assenza normale e errore di lettura";
const nameError = "Errore di dominio senza cause sottostanti";
const config = "Contesto del file e causa conservata";
const cliCode = () => source(2, "src/main.rs");

test("panic: percentuale tutti i 256 valori", () => {
  run(
    probe(
      0,
      percent,
      `
    for value in 0..=u8::MAX {
      match Percentage::try_new(value) {
        Ok(valid)=>{assert!(value<=100);assert_eq!(valid.value(),value);},
        Err(message)=>{assert!(value>100);assert_eq!(message,"percentage must be at most 100");}
      }
    }
  `,
    ),
  );
});
test("panic: new rifiuta 101 con messaggio previsto", () =>
  run(mainFor(0, percent, "let _=Percentage::new(101);"), {
    status: 101,
    stderr: /percentage must be at most 100/,
  }));
test("panic: due unit test realmente eseguiti", () => {
  const result = run(source(0, percent), {
    flags: ["--test"],
    args: ["--quiet"],
  });
  assert.match(result.stdout, /2 passed; 0 failed/);
});
test("panic: should_panic fallisce se il controllo viene rimosso", () => {
  const result = run(
    replaceOnce(
      source(0, percent),
      'assert!(value <= 100, "percentage must be at most 100");',
      "",
    ),
    { flags: ["--test"], args: ["--quiet"], status: 101 },
  );
  assert.match(result.stdout, /did not panic as expected/);
});
test("panic: should_panic expected rifiuta un panic estraneo", () => {
  const result = run(
    replaceOnce(
      source(0, percent),
      "Percentage::new(101);",
      'panic!("unrelated failure");',
    ),
    { flags: ["--test"], args: ["--quiet"], status: 101 },
  );
  assert.match(result.stdout, /did not contain expected string/);
});
test("panic: assert resta attivo senza debug assertions", () =>
  run(mainFor(0, percent, "let _=Percentage::new(255);"), {
    flags: ["-C", "opt-level=3", "-C", "debug-assertions=no"],
    status: 101,
    stderr: /percentage must be at most 100/,
  }));
for (const value of ["yes", "no"])
  test("panic: debug_assert configurabile " + value, () =>
    run(source(0, "assert e debug_assert non sono intercambiabili"), {
      flags: ["-C", "debug-assertions=" + value],
    }),
  );
test("panic: debug_assert resta type checked quando disabilitato", () =>
  run('fn main(){debug_assert!("not a bool");}', {
    flags: ["-C", "debug-assertions=no"],
    compileError: "E0600",
  }));
test("panic: expect fallisce se il literal non e valido", () =>
  run(
    replaceOnce(
      source(0, "expect deve spiegare una garanzia reale"),
      '"8080"',
      '"bad"',
    ),
    { status: 101, stderr: /hardcoded default port should be a valid u16/ },
  ));
test("panic: accesso fuori indice e alternativa get", () =>
  run(
    "fn main(){let v=vec![1,2,3];let i=std::hint::black_box(10);assert_eq!(v.get(i),None);let _=v[i];}",
    { status: 101, stderr: /index out of bounds/ },
  ));
test("panic: unwrap None ed Err riportano il fallimento", () => {
  run("fn main(){None::<u8>.unwrap();}", {
    status: 101,
    stderr: /Option::unwrap/,
  });
  run('fn main(){Err::<u8,_>("test failure").unwrap();}', {
    status: 101,
    stderr: /test failure/,
  });
});
test("panic: hook viene chiamato prima di Drop e catch", () => {
  run(`
    use std::sync::atomic::{AtomicUsize,Ordering};
    static STAGE:AtomicUsize=AtomicUsize::new(0);
    struct Guard;
    impl Drop for Guard{fn drop(&mut self){assert_eq!(STAGE.swap(2,Ordering::SeqCst),1);}}
    fn main(){
      let previous=std::panic::take_hook();
      std::panic::set_hook(Box::new(|_|{STAGE.store(1,Ordering::SeqCst);}));
      let result=std::panic::catch_unwind(||{let _g=Guard;panic!("demo");});
      std::panic::set_hook(previous);
      assert!(result.is_err());assert_eq!(STAGE.load(Ordering::SeqCst),2);
    }
  `);
});
test("panic: catch_unwind non annulla effetti precedenti", () => {
  run(
    `
    use std::sync::atomic::{AtomicUsize,Ordering};
    fn main(){
      let count=AtomicUsize::new(0);
      let result=std::panic::catch_unwind(||{count.fetch_add(1,Ordering::SeqCst);panic!("partial effect");});
      assert!(result.is_err());assert_eq!(count.load(Ordering::SeqCst),1);
    }
  `,
    { stderr: /partial effect/ },
  );
});
test("panic: prestito mutabile non e UnwindSafe", () =>
  run(
    "fn main(){let mut value=0;let _=std::panic::catch_unwind(||{value=1;});}",
    { compileError: "E0277" },
  ));
test("panic: payload testuale senza assumere la rappresentazione", () => {
  run(
    `
    fn main(){
      let payload=std::panic::catch_unwind(||panic!("payload example")).unwrap_err();
      let text=payload.downcast_ref::<&str>().copied()
          .or_else(||payload.downcast_ref::<String>().map(String::as_str));
      assert_eq!(text,Some("payload example"));
    }
  `,
    { stderr: /payload example/ },
  );
});
test("panic: abort compila ma il demo che abortirebbe non viene eseguito", () => {
  run(source(0, "Intercettare un unwind a un confine controllato"), {
    flags: ["-C", "panic=abort"],
    compileOnly: true,
  });
  run('fn main(){assert!(cfg!(panic="abort"));}', {
    flags: ["-C", "panic=abort"],
  });
});
test("panic: profilo Cargo release abort e test harness unwind", () => {
  const dir = directory();
  write(
    dir,
    "Cargo.toml",
    '[package]\nname="panic-profile"\nversion="0.1.0"\nedition="2024"\n' +
      source(0, "Strategia nel profilo Cargo"),
  );
  write(
    dir,
    "src/main.rs",
    'fn main(){assert!(cfg!(panic="abort"));}\n#[test] fn harness(){assert!(cfg!(panic="unwind"));}',
  );
  ok(launch(cargo, ["run", "--release", "--offline", "--quiet"], dir));
  const result = ok(
    launch(cargo, ["test", "--release", "--offline", "--quiet"], dir),
  );
  assert.match(result.stdout, /1 passed; 0 failed/);
});
test("panic: backtrace abilitato nel solo processo di prova", () => {
  const result = run(source(0, "Panic esplicito"), {
    status: 101,
    stderr: /stack backtrace:/,
    env: { RUST_BACKTRACE: "1" },
  });
  assert.match(result.stderr, /internal queue invariant violated/);
});

test("idiomatico: rami ErrorKind mantenuti", () => {
  run(
    probe(
      1,
      optional,
      `
    for kind in [io::ErrorKind::PermissionDenied,io::ErrorKind::InvalidData,io::ErrorKind::TimedOut] {
      assert_eq!(optional_read(Err(kind.into())).unwrap_err().kind(),kind);
    }
    assert_eq!(optional_read(Ok("data".into())).unwrap(),Some("data".into()));
  `,
    ),
  );
});
test("idiomatico: lettura reale vuota, Unicode, assente e non UTF-8", () => {
  run(
    probe(
      1,
      optional,
      `
    assert_eq!(read_optional(Path::new("empty.txt")).unwrap(),Some(String::new()));
    assert_eq!(read_optional(Path::new("utf8.txt")).unwrap(),Some("\u{e8}".into()));
    assert_eq!(read_optional(Path::new("absent.txt")).unwrap(),None);
    assert_eq!(read_optional(Path::new("invalid.txt")).unwrap_err().kind(),io::ErrorKind::InvalidData);
  `,
    ),
    {
      files: {
        "empty.txt": "",
        "utf8.txt": "\u00e8",
        "invalid.txt": Buffer.from([255]),
      },
    },
  );
});
test("idiomatico: nomi, Unicode scalare distinto da byte e grafema", () => {
  run(
    probe(
      1,
      nameError,
      `
    for input in ["","\u{a0}","\n\t"]{assert_eq!(validate_name(Some(input)),Err(NameError::Blank));}
    for input in ["a","ab","\u{e8}\u{e8}"]{assert_eq!(validate_name(Some(input)),Err(NameError::TooShort));}
    assert_eq!(validate_name(Some("\u{e8}\u{e8}\u{e8}")),Ok("\u{e8}\u{e8}\u{e8}"));
    assert_eq!(validate_name(Some("e\u{301}\u{301}")),Ok("e\u{301}\u{301}"));
    assert_eq!(validate_name(Some("a\0b")),Ok("a\0b"));
  `,
    ),
  );
});
test("idiomatico: vecchio controllo in byte accetta due scalari", () =>
  run(
    'fn main(){let s="\\u{e8}\\u{e8}";assert!(s.len()>=3);assert_eq!(s.chars().count(),2);}',
  ));
test("idiomatico: nome restituito resta una vista della sorgente", () =>
  run(
    probe(
      1,
      nameError,
      `
    let input=String::from(" Ada ");
    assert_eq!(validate_name(Some(&input)).unwrap().as_ptr(),input[1..4].as_ptr());
  `,
    ),
  ));
test("idiomatico: Error richiede Display e Debug", () =>
  run(
    replaceOnce(
      source(1, nameError),
      "impl Error for NameError {}",
      "struct MissingDisplay;\nimpl std::error::Error for MissingDisplay {}\nimpl Error for NameError {}",
    ),
    { compileError: "E0277" },
  ));
test("idiomatico: tutti i valori di porta e cause originali", () => {
  run(
    probe(
      1,
      config,
      `
    for value in 1..=u16::MAX {assert_eq!(parse_port(&value.to_string()).unwrap(),value);}
    for raw in ["+80"," 80\r\n"]{assert_eq!(parse_port(raw).unwrap(),80);}
    assert!(matches!(parse_port("0"),Err(ConfigError::ZeroPort)));
    for raw in ["","-1","65536","8_0"] {
      let error=parse_port(raw).unwrap_err();assert!(error.source().unwrap().is::<ParseIntError>());
    }
    assert!(ConfigError::ZeroPort.source().is_none());
  `,
    ),
  );
});
test("idiomatico: causa I/O e percorso mantenuti", () => {
  run(
    probe(
      1,
      config,
      `
    let path=Path::new("missing port.txt");let error=load_port(path).unwrap_err();
    assert_eq!(error.to_string(),"cannot read missing port.txt");
    match &error {
      ConfigError::Read{path:stored,source}=>{assert_eq!(stored,path);assert_eq!(source.kind(),io::ErrorKind::NotFound);},
      other=>panic!("{other:?}")
    }
    assert!(error.source().unwrap().is::<io::Error>());
  `,
    ),
  );
});
test("idiomatico: lettura valida, vuota, non UTF-8 e parsing senza path", () => {
  run(
    probe(
      1,
      config,
      `
    assert_eq!(load_port(Path::new("ok.txt")).unwrap(),8080);
    assert!(matches!(load_port(Path::new("bad.txt")),Err(ConfigError::InvalidPort(_))));
    assert!(matches!(load_port(Path::new("empty.txt")),Err(ConfigError::InvalidPort(_))));
    let error=load_port(Path::new("binary.txt")).unwrap_err();
    assert_eq!(error.source().unwrap().downcast_ref::<io::Error>().unwrap().kind(),io::ErrorKind::InvalidData);
  `,
    ),
    {
      files: {
        "ok.txt": " 8080\n",
        "bad.txt": "secret-payload",
        "empty.txt": "",
        "binary.txt": Buffer.from([255]),
      },
    },
  );
});
test("idiomatico: rimuovere From impedisce la propagazione", () => {
  const code = source(1, config),
    start = code.indexOf("impl From<"),
    end = code.indexOf("type ConfigResult");
  run(code.slice(0, start) + code.slice(end), { compileError: "E0277" });
});
test("idiomatico: source non contiene il testo sensibile del file", () => {
  run(
    probe(
      1,
      config,
      `
    let error=load_port(Path::new("bad.txt")).unwrap_err();
    let message=format!("{error:?}: {}",error.source().unwrap());
    assert!(!message.contains("private-token-123"));
  `,
    ),
    { files: { "bad.txt": "private-token-123" } },
  );
});

test("Cargo: versioni esatte e dipendenze in cache isolata", () => {
  prepareCargo();
  console.log("Dependency baseline: " + dependencyVersions.join(", "));
});
for (const [heading, { lang, code }] of blocks[2])
  if (lang === "rust")
    test("crate originale: " + heading, () =>
      crate(
        code,
        heading === "src/main.rs"
          ? { status: 1, stderr: /usage: error-guide <port-file>/, stdout: "" }
          : { stdout: "" },
      ),
    );
test("thiserror: tutti gli u8 e limiti del parser age", () => {
  crate(
    probe(
      2,
      "Esempio breve di From",
      `
    for age in 0..=u8::MAX {assert_eq!(parse_age(&age.to_string()).unwrap(),age);}
    assert_eq!(parse_age("+42").unwrap(),42);
    for raw in [" 42 ","-1","256",""]{assert!(parse_age(raw).is_err());}
  `,
    ),
  );
});
test("thiserror: from mantiene ParseIntError", () => {
  crate(
    probe(
      2,
      "Esempio breve di From",
      `
    let parse="bad".parse::<u8>().unwrap_err();let original=parse.clone();
    let error:ParseAgeError=parse.into();
    match error {ParseAgeError::Invalid(source)=>assert_eq!(source,original),}
  `,
    ),
  );
});
test("thiserror: from con path aggiuntivo rifiutato", () => {
  crate(
    `
    #[derive(Debug,thiserror::Error)]
    #[error("read failed")]
    struct ReadError{path:std::path::PathBuf,#[from] source:std::io::Error}
    fn main(){}
  `,
    {
      compileError:
        /deriving From requires no fields other than source|must not contain any other fields/,
    },
  );
});
test("thiserror: source da solo non genera From", () => {
  crate(
    `
    #[derive(Debug,thiserror::Error)]
    #[error("read failed")]
    struct ReadError{#[source] cause:std::io::Error}
    fn main(){let _:ReadError=std::io::Error::from(std::io::ErrorKind::NotFound).into();}
  `,
    { compileError: "E0277" },
  );
});
test("thiserror: campo source riconosciuto senza attributo", () => {
  crate(`
    use std::error::Error as _;
    #[derive(Debug,thiserror::Error)]
    #[error("read failed")]
    struct ReadError{source:std::io::Error}
    fn main(){let error=ReadError{source:std::io::ErrorKind::NotFound.into()};assert!(error.source().unwrap().is::<std::io::Error>());}
  `);
});
test("thiserror: transparent delega source senza aggiungere livello", () => {
  crate(`
    use std::error::Error as _;
    #[derive(Debug,thiserror::Error)]
    #[error("leaf")]
    struct Leaf;
    #[derive(Debug,thiserror::Error)]
    #[error(transparent)]
    struct Wrapper(#[from] Leaf);
    fn main(){let error:Wrapper=Leaf.into();assert_eq!(error.to_string(),"leaf");assert!(error.source().is_none());}
  `);
});
test("CLI: successo e file invariato con percorso contenente spazi", () =>
  crate(cliCode(), {
    args: ["port number.txt"],
    files: { "port number.txt": " +8080 \r\n" },
    stdout: "port: 8080\n",
  }));
test("CLI: porta massima", () =>
  crate(cliCode(), {
    args: ["port.txt"],
    files: { "port.txt": "65535" },
    stdout: "port: 65535\n",
  }));
for (const [label, content, pattern] of [
  ["vuoto", "", /loading port from port.txt: invalid port number:/],
  ["overflow", "65536", /loading port from port.txt: invalid port number:/],
  ["zero", "0", /loading port from port.txt: port must be nonzero/],
  [
    "non UTF-8",
    Buffer.from([255]),
    /loading port from port.txt: cannot read port file:.*(?:UTF-8|utf-8)/,
  ],
])
  test("CLI: " + label, () =>
    crate(cliCode(), {
      args: ["port.txt"],
      files: { "port.txt": content },
      status: 1,
      stderr: pattern,
      stdout: "",
    }),
  );
test("CLI: file assente e catena stampata una volta", () => {
  const result = crate(cliCode(), {
    args: ["missing.txt"],
    status: 1,
    stderr: /loading port from missing.txt: cannot read port file:/,
    stdout: "",
  });
  assert.equal(result.stderr.match(/loading port from/g).length, 1);
  assert.equal(result.stderr.match(/cannot read port file/g).length, 1);
});
test("CLI: input grezzo non divulgato", () => {
  const result = crate(cliCode(), {
    args: ["port.txt"],
    files: { "port.txt": "secret-token-123" },
    status: 1,
    stderr: /invalid port number/,
  });
  assert.ok(!result.stderr.includes("secret-token-123"));
});
test("crate: enum tipizzato mantiene path e causa I/O", () => {
  crate(
    mainFor(
      2,
      "src/main.rs",
      `
    use std::error::Error as _;
    let error=load_port(Path::new("absent.txt")).unwrap_err();
    match &error {
      ConfigError::Read{path,cause}=>{assert_eq!(path,Path::new("absent.txt"));assert_eq!(cause.kind(),io::ErrorKind::NotFound);},
      _=>panic!("wrong error")
    }
    assert!(error.source().unwrap().is::<io::Error>());
  `,
    ),
  );
});
test("anyhow: downcast originale distinto dalle cause annidate", () => {
  crate(
    mainFor(
      2,
      "src/main.rs",
      `
    use std::error::Error as _;
    let error=load_port(Path::new("bad.txt")).context("loading file").unwrap_err();
    let typed=error.downcast_ref::<ConfigError>().unwrap();
    assert!(matches!(typed,ConfigError::InvalidPort(_)));
    assert!(typed.source().unwrap().is::<ParseIntError>());
    assert!(error.downcast_ref::<ParseIntError>().is_none());
    assert!(error.chain().any(|cause|cause.is::<ParseIntError>()));
  `,
    ),
    { files: { "bad.txt": "bad" } },
  );
});
test("anyhow: context eager rispetto a with_context", () => {
  crate(`
    use anyhow::Context;
    fn main(){
      let mut calls=0;
      let _:anyhow::Result<u8>=Ok::<u8,std::io::Error>(7).context({calls+=1;"unused"});
      assert_eq!(calls,1);
      let _:anyhow::Result<u8>=Ok::<u8,std::io::Error>(7).with_context(||{calls+=1;"unused"});
      assert_eq!(calls,1);
      let failure=Err::<u8,_>(std::io::Error::from(std::io::ErrorKind::NotFound)).with_context(||{calls+=1;"needed"});
      assert!(failure.is_err());assert_eq!(calls,2);
    }
  `);
});
test("anyhow: contesto su Option non inventa causa tecnica", () =>
  crate(`
    use anyhow::Context;
    fn main(){let error=None::<u8>.context("required").unwrap_err();assert_eq!(error.to_string(),"required");assert_eq!(error.chain().count(),1);}
  `));
test("anyhow: conversione a stringa perde downcast", () =>
  crate(`
    fn main(){
      let source="bad".parse::<u8>().unwrap_err();
      let typed=anyhow::Error::new(source.clone());
      let string=anyhow::Error::msg(source.to_string());
      assert!(typed.downcast_ref::<std::num::ParseIntError>().is_some());
      assert!(string.downcast_ref::<std::num::ParseIntError>().is_none());
    }
  `));
test("anyhow: errore con Rc non soddisfa Send Sync", () =>
  crate(
    `
    #[derive(Debug,thiserror::Error)]
    #[error("local failure")]
    struct Local(std::rc::Rc<String>);
    fn run()->anyhow::Result<()>{Err(Local(std::rc::Rc::new("x".into())))?;Ok(())}
    fn main(){}
  `,
    { compileError: "E0277" },
  ));
test("anyhow: ensure controlla il dominio e precede bail", () =>
  crate(
    probe(
      2,
      "bail ed ensure non fanno panic",
      `
    for count in 1..=u8::MAX{assert_eq!(workers(count,false).unwrap(),count);}
    assert_eq!(workers(0,true).unwrap_err().to_string(),"worker count must be nonzero");
  `,
    ),
  ));
