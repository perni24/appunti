import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["OsStr e OsString"];
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
const prefix = "appunti-rust-os-string-";
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
for (const key of Object.keys(env))
  if (
    ["APPUNTI_DEMO_INPUT", "APPUNTI_OS_TEST_CHILD"].includes(key.toUpperCase())
  )
    delete env[key];
let sequence = 0;
function launch(executable, args, cwd = root, extraEnv = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...env, ...extraEnv },
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
  options.prepare?.(dir);
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
  const execution = launch(
    output,
    options.programArgs ?? [],
    dir,
    options.childEnv,
  );
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

const view = "Vista, copia e proprieta";
const conversion = "Conversione controllata e conversione lossy";
const extension = "Confrontare un'estensione senza conversione Unicode";
const cli = "Scegliere un percorso da argomenti e ambiente";
const lists = "Liste di percorsi senza separatori scritti a mano";
const native = "Rappresentazioni native e terminatori";
const dangling = "Restituire una vista sul proprietario locale";
const moved = "Riusare un valore dopo into_string";
const from = (heading) => source(0, heading);
const inject = (heading, code) => probe(0, heading, code);
const selectionProbe = (code) =>
  from(cli).split("fn main() ->")[0] + "fn main() {\n" + code + "\n}";
const unusualHelper = () =>
  from(conversion).slice(
    from(conversion).indexOf("#[cfg(windows)]"),
    from(conversion).indexOf("fn main() {"),
  );

test("baseline e inventario: otto programmi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("metadati originali, template, tipi inline e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/OsStr e OsString.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "OsStr e OsString",
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
    "Option<&str>",
    "Result<String, OsString>",
    "Cow<'_, str>",
    "Option<OsString>",
    "Deref<Target = OsStr>",
    "Result<String, VarError>",
  ])
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  for (const page of [
    "ffi/struct.OsString.html",
    "ffi/struct.OsStr.html",
    "env/fn.args_os.html",
    "env/fn.args.html",
    "env/fn.var_os.html",
    "env/fn.var.html",
    "env/fn.split_paths.html",
    "env/fn.join_paths.html",
    "os/windows/ffi/trait.OsStrExt.html",
    "os/windows/ffi/trait.OsStringExt.html",
    "os/unix/ffi/trait.OsStrExt.html",
    "os/unix/ffi/trait.OsStringExt.html",
    "ffi/struct.CString.html",
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
for (const heading of [view, conversion, extension, cli, lists, native])
  test("programma completo: " + heading, () => {
    const output = run(from(heading));
    assert.equal(output, heading === cli ? "path: input.txt\n" : "");
  });
test("controesempio: riferimento al proprietario locale", () =>
  run(from(dangling), { error: "E0515" }));
test("controesempio: into_string consuma il valore", () =>
  run(from(moved), { error: "E0382" }));
test("correzione: ritorno di OsString posseduta", () => {
  let code = replaceOnce(
    from(dangling),
    "fn label(input: &OsStr) -> &OsStr {",
    "fn label(input: &OsStr) -> OsString {",
  );
  code = replaceOnce(code, "    owned.as_os_str()", "    owned");
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main() { assert_eq!(label(OsStr::new("demo")), OsStr::new("demo")); }',
  );
  run(code);
});
test("correzione: to_str prende in prestito e consente il riuso", () => {
  assert.equal(
    run(replaceOnce(from(moved), "name.into_string()", "name.to_str()")),
    '"demo" Some("demo")\n',
  );
});
test("vista senza copia, copia indipendente e String per valore", () => {
  run(
    inject(
      view,
      String.raw`
    let original = String::from("demo");
    let borrowed = OsStr::new(&original);
    assert_eq!(borrowed.as_encoded_bytes().as_ptr(), original.as_ptr());
    let mut copied = borrowed.to_os_string();
    copied.push(".bak");
    assert_eq!(original, "demo");
    let owned = {
        let local = String::from("persist");
        OsStr::new(&local).to_os_string()
    };
    assert_eq!(owned, OsStr::new("persist"));
  `,
    ),
  );
  run(
    inject(
      view,
      String.raw`
    let original = String::from("demo");
    let _os = OsString::from(original);
    println!("{original}");
  `,
    ),
    { error: "E0382" },
  );
});
test("prestito attivo impedisce push; nome copiato consente la modifica", () => {
  const code = String.raw`
use std::ffi::OsString;
fn main() {
    let mut owned = OsString::from("a");
    let borrowed = owned.as_os_str();
    owned.push("b");
    assert_eq!(borrowed, "a");
}
`;
  run(code, { error: "E0502" });
  run(
    replaceOnce(
      code,
      "owned.as_os_str();",
      "owned.as_os_str().to_os_string();",
    ),
  );
});
test("conversioni: vuoto, NUL, Unicode e lunghezza in byte", () => {
  run(
    inject(
      conversion,
      String.raw`
    for text in ["", "\0", "a\0b", "\u{00E8}", "\u{1F680}", "e\u{0301}"] {
        let value = OsString::from(text);
        assert_eq!(value.to_str(), Some(text));
        assert_eq!(value.len(), text.len());
        assert_eq!(value.into_string().unwrap(), text);
    }
    assert_ne!(OsStr::new("\u{00E8}"), OsStr::new("e\u{0300}"));
  `,
    ),
  );
});
test("with_capacity e concatenazione preservano dati, non aggiungono separatori", () => {
  run(
    inject(
      view,
      String.raw`
    let left = OsStr::new("one");
    let right = OsStr::new("\u{00E8}");
    let mut value = OsString::with_capacity(left.len() + right.len());
    let capacity = value.capacity();
    assert!(capacity >= 5);
    value.push(left);
    value.push(right);
    assert_eq!(value, OsStr::new("one\u{00E8}"));
    assert_eq!(value.capacity(), capacity);
    assert_eq!(value.len(), 5);
  `,
    ),
  );
});
test("Windows: tutte le code unit u16 fanno roundtrip senza perdita", () => {
  assert.equal(process.platform, "win32");
  run(
    inject(
      conversion,
      String.raw`
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    for unit in 0..=u16::MAX {
        let value = OsString::from_wide(&[unit]);
        assert_eq!(value.encode_wide().collect::<Vec<_>>(), vec![unit]);
        let valid = !(0xD800..=0xDFFF).contains(&unit);
        assert_eq!(value.to_str().is_some(), valid);
        match value.into_string() {
            Ok(text) => assert_eq!(text.encode_utf16().collect::<Vec<_>>(), vec![unit]),
            Err(original) => assert_eq!(original.encode_wide().collect::<Vec<_>>(), vec![unit]),
        }
    }
    let pair = OsString::from_wide(&[0xD83D, 0xDE80]);
    assert_eq!(pair.into_string().unwrap(), "\u{1F680}");
  `,
    ),
  );
});
test("conversione lossy: valori distinti, stessa visualizzazione", () => {
  assert.equal(process.platform, "win32");
  run(
    inject(
      conversion,
      String.raw`
    use std::os::windows::ffi::OsStringExt;
    let a = OsString::from_wide(&[0xD800]);
    let b = OsString::from_wide(&[0xD801]);
    assert_ne!(a, b);
    assert_eq!(a.to_string_lossy(), b.to_string_lossy());
    assert_eq!(format!("{}", a.display()), "\u{FFFD}");
  `,
    ),
  );
});
test("to_str unwrap fallisce sul valore non Unicode", () => {
  run(inject(conversion, "unusual().to_str().unwrap();"), {
    panic: /Option::unwrap/,
  });
});
test("OsString non implementa Display direttamente", () => {
  run(inject(view, 'println!("{}", OsString::from("demo"));'), {
    error: "E0277",
  });
});
test("display non effettua escaping HTML o shell", () => {
  assert.equal(
    run(inject(view, 'println!("{}", OsStr::new("<b>$HOME</b>").display());')),
    "<b>$HOME</b>\n",
  );
});
test("ASCII ignore case non e normalizzazione Unicode", () => {
  run(
    inject(
      extension,
      String.raw`
    assert!(OsStr::new("RS").eq_ignore_ascii_case("rs"));
    assert!(!OsStr::new("\u{00C8}").eq_ignore_ascii_case("\u{00E8}"));
    assert!(Path::new("main.RS").extension().unwrap().eq_ignore_ascii_case("rs"));
  `,
    ),
  );
});
test("estensione: nome non Unicode, ultimo punto e confronto esatto", () => {
  const helpers = unusualHelper();
  const code =
    "use std::ffi::OsString;\n" +
    helpers +
    inject(
      extension,
      String.raw`
    let mut name = unusual();
    name.push(".rs");
    assert!(is_rust_file(Path::new(&name)));
    assert!(!is_rust_file(Path::new("report.rs.")));
    assert!(!is_rust_file(Path::new("report.rs.bak")));
  `,
    );
  run(code);
});
test("selezione: priorita, fallback, default e rifiuto del vuoto", () => {
  run(
    selectionProbe(String.raw`
    assert_eq!(select_input(None, None).unwrap(), PathBuf::from("input.txt"));
    assert_eq!(select_input(None, Some("env.txt".into())).unwrap(), PathBuf::from("env.txt"));
    assert_eq!(select_input(Some("arg.txt".into()), Some("env.txt".into())).unwrap(), PathBuf::from("arg.txt"));
    assert!(select_input(Some(OsString::new()), Some("env.txt".into())).is_err());
    assert!(select_input(None, Some(OsString::new())).is_err());
    assert_eq!(select_input(Some(" ".into()), None).unwrap(), PathBuf::from(" "));
  `),
  );
});
test("selezione preserva il valore OS originale", () => {
  run(
    unusualHelper() +
      selectionProbe(String.raw`
    let input = unusual();
    let selected = select_input(Some(input.clone()), None).unwrap();
    assert_eq!(selected.into_os_string(), input);
  `),
  );
});
test("mutazione che tratta vuoto come assenza viene rilevata", () => {
  let code = selectionProbe(String.raw`
    assert!(select_input(Some(OsString::new()), Some("fallback".into())).is_err());
  `);
  code = replaceOnce(
    code,
    ".or(fallback)",
    ".filter(|value| !value.is_empty()).or(fallback)",
  );
  run(code, { panic: /assertion failed/ });
});
test("CLI: argomento con spazi e Unicode prevale sull'ambiente", () => {
  const output = run(from(cli), {
    programArgs: ["nome con \u00E8.txt"],
    childEnv: { APPUNTI_DEMO_INPUT: "fallback.txt" },
  });
  assert.equal(output, "path: nome con \u00E8.txt\n");
});
test("CLI: fallback ambiente e input vuoto", () => {
  assert.equal(
    run(from(cli), { childEnv: { APPUNTI_DEMO_INPUT: "env input.txt" } }),
    "path: env input.txt\n",
  );
  run(from(cli), {
    childEnv: { APPUNTI_DEMO_INPUT: "" },
    exitCode: 1,
    stderr: /input path is empty/,
  });
  run(from(cli), {
    programArgs: [""],
    childEnv: { APPUNTI_DEMO_INPUT: "fallback.txt" },
    exitCode: 1,
    stderr: /input path is empty/,
  });
});
function nativeChildCli(mode) {
  let code = replaceOnce(
    from(cli),
    "fn main() -> Result<(), &'static str> {",
    "fn cli_main() -> Result<(), &'static str> {",
  );
  const check =
    mode === "argument"
      ? "assert_eq!(std::env::args_os().nth(1), Some(unusual()));"
      : 'assert_eq!(std::env::var_os("APPUNTI_DEMO_INPUT"), Some(unusual()));\nassert!(matches!(std::env::var("APPUNTI_DEMO_INPUT"), Err(std::env::VarError::NotUnicode(value)) if value == unusual()));';
  const setup =
    mode === "argument"
      ? "command.arg(unusual());"
      : 'command.env("APPUNTI_DEMO_INPUT", unusual());';
  return (
    unusualHelper() +
    code +
    String.raw`
fn main() {
    if std::env::var_os("APPUNTI_OS_TEST_CHILD").is_some() {
        CHECK
        cli_main().unwrap();
        return;
    }
    assert!(std::env::var_os("APPUNTI_DEMO_INPUT").is_none());
    let mut command = std::process::Command::new(std::env::current_exe().unwrap());
    command.env("APPUNTI_OS_TEST_CHILD", "1");
    SETUP
    let result = command.output().unwrap();
    assert!(result.status.success(), "{:?}", result);
    assert_eq!(result.stdout, "path: n\u{FFFD}\n".as_bytes());
    assert!(result.stderr.is_empty());
    assert!(std::env::var_os("APPUNTI_DEMO_INPUT").is_none());
}
`
      .replace("CHECK", check)
      .replace("SETUP", setup)
  );
}
test("CLI reale: argomento non Unicode passato senza shell", () =>
  run(nativeChildCli("argument")));
test("CLI reale: ambiente non Unicode e VarError nel solo figlio", () =>
  run(nativeChildCli("environment")));
test("args panica sull'argomento non Unicode durante l'iterazione", () => {
  const code =
    "use std::ffi::OsString;\n" +
    unusualHelper() +
    String.raw`
fn main() {
    if std::env::var_os("APPUNTI_OS_TEST_CHILD").is_some() {
        let _ = std::env::args().nth(1);
        return;
    }
    let result = std::process::Command::new(std::env::current_exe().unwrap())
        .env("APPUNTI_OS_TEST_CHILD", "1")
        .arg(unusual())
        .output().unwrap();
    assert_eq!(result.status.code(), Some(101));
    assert!(String::from_utf8_lossy(&result.stderr).contains("panicked"));
}
`;
  run(code);
});
test("var_os distingue Some vuoto ma non diagnostica un nome invalido", () => {
  run(String.raw`
fn main() {
    assert!(std::env::var_os("APPUNTI_DEMO_INPUT").is_none());
    for key in ["BAD=KEY", "BAD\0KEY"] {
        assert!(std::env::var_os(key).is_none());
        assert!(matches!(std::env::var(key), Err(std::env::VarError::NotPresent)));
    }
}
`);
});
test("liste PATH: spazi, Unicode, punto e virgola Windows e errore quoting", () => {
  assert.equal(process.platform, "win32");
  run(String.raw`
use std::{env, path::PathBuf};
fn main() {
    let paths = [PathBuf::from("semi;colon"), PathBuf::from("spazi \u{00E8}")];
    let encoded = env::join_paths(&paths).unwrap();
    assert_eq!(env::split_paths(&encoded).collect::<Vec<_>>(), paths);
    assert!(env::join_paths([r#"bad"quote"#]).is_err());
}
`);
});
test("liste PATH preservano nomi non Unicode", () => {
  const code =
    "use std::ffi::OsString;\n" +
    unusualHelper() +
    String.raw`
fn main() {
    let input = unusual();
    let encoded = std::env::join_paths([&input]).unwrap();
    let decoded: Vec<_> = std::env::split_paths(&encoded).collect();
    assert_eq!(decoded.len(), 1);
    assert_eq!(decoded[0].as_os_str(), input);
}
`;
  run(code);
});
test("wide_terminated: vuoto, Unicode e NUL in ogni posizione", () => {
  assert.equal(process.platform, "win32");
  run(
    inject(
      native,
      String.raw`
    assert_eq!(wide_terminated(OsStr::new("")).unwrap(), vec![0]);
    assert_eq!(wide_terminated(OsStr::new("\u{1F680}")).unwrap(), vec![0xD83D, 0xDE80, 0]);
    for value in ["\0", "\0a", "a\0", "a\0b"] {
        assert!(wide_terminated(OsStr::new(value)).is_err());
    }
  `,
    ),
  );
});
test("CString e terminata ma non richiede UTF-8", () => {
  run(
    inject(
      native,
      String.raw`
    let value = CString::new(vec![0xFF]).unwrap();
    assert_eq!(value.as_bytes_with_nul(), &[0xFF, 0]);
    assert!(value.to_str().is_err());
  `,
    ),
  );
});
test("mutazione che omette il terminatore wide e rilevata", () => {
  run(replaceOnce(from(native), "    units.push(0);", ""), {
    panic: /assertion.*failed/,
  });
});
for (const call of [
  'std::env::set_var("APPUNTI_DEMO_INPUT", "x");',
  'std::env::remove_var("APPUNTI_DEMO_INPUT");',
])
  test("edition 2024 richiede unsafe: " + call, () =>
    run("fn main() { " + call + " }", { error: "E0133" }),
  );
