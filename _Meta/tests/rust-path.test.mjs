import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Path e PathBuf"];
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
const prefix = "appunti-rust-path-";
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
  const execution = launch(output, options.programArgs ?? [], dir);
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

const view = "Vista borrowed e buffer posseduto";
const platforms = "Percorso relativo, assoluto e piattaforma";
const backup = "Costruire un nome di backup";
const components = "Componenti e prefissi non sono un confine di sicurezza";
const unicode = "Conservare un percorso non Unicode";
const io = "Percorso assoluto, canonico e lettura esplicita";
const dangling = "Restituire una vista su un buffer locale";
const mutation = "Modificare il buffer mentre la vista serve ancora";
const from = (heading) => source(0, heading);
const inject = (heading, extra) => probe(0, heading, extra);

test("baseline e inventario: sei programmi e due controesempi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 8);
});
test("metadati originali, template, tipi inline e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Path e PathBuf.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Path e PathBuf",
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
    "Option<&OsStr>",
    "Option<&Path>",
    "Result<&Path, StripPrefixError>",
    "io::Result<bool>",
    "Deref<Target = Path>",
  ])
    assert(
      nodes.some((n) => n.type === "inlineCode" && n.value === value),
      value,
    );
  for (const page of [
    "path/index.html",
    "path/struct.Path.html",
    "path/struct.PathBuf.html",
    "path/enum.Component.html",
    "path/enum.Prefix.html",
    "path/fn.absolute.html",
    "fs/fn.canonicalize.html",
    "env/fn.args_os.html",
    "fs/fn.read_to_string.html",
    "os/windows/ffi/trait.OsStringExt.html",
    "os/unix/ffi/trait.OsStringExt.html",
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
for (const heading of [view, platforms, backup, components, unicode, io]) {
  test("programma completo: " + heading, () => {
    const output = run(from(heading));
    if (heading === unicode) assert.equal(output, "\uFFFD.txt\n");
    else assert.equal(output, "");
  });
}
test("controesempio: vista sul buffer locale", () =>
  run(from(dangling), { error: "E0515" }));
test("controesempio: mutazione con prestito ancora usato", () =>
  run(from(mutation), { error: "E0502" }));
test("correzione: ritorno del percorso posseduto", () => {
  let code = replaceOnce(
    from(dangling),
    "fn config_path(base: &Path) -> &Path {",
    "fn config_path(base: &Path) -> PathBuf {",
  );
  code = replaceOnce(code, "    owned.as_path()", "    owned");
  code = replaceOnce(
    code,
    "fn main() {}",
    'fn main() { assert_eq!(config_path(Path::new("data")), Path::new("data/config.toml")); }',
  );
  run(code);
});
test("correzione: nome posseduto prima della mutazione", () => {
  const code = replaceOnce(
    from(mutation),
    "path.file_name().unwrap();",
    "path.file_name().unwrap().to_os_string();",
  );
  assert.equal(run(code), '"config.toml"\n');
});
test("Path new e vista; to_path_buf sopravvive al testo originale", () => {
  run(
    inject(
      view,
      String.raw`
    let owned = {
        let text = String::from("a/b");
        let path = Path::new(&text);
        assert_eq!(path.as_os_str().as_encoded_bytes().as_ptr(), text.as_ptr());
        path.to_path_buf()
    };
    assert_eq!(owned, Path::new("a/b"));
  `,
    ),
  );
});
test("AsRef per valore puo consumare il PathBuf", () => {
  run(
    inject(
      backup,
      String.raw`
    let moved = PathBuf::from("config.toml");
    let _ = backup_path(moved);
    println!("{moved:?}");
  `,
    ),
    { error: "E0382" },
  );
});
test("backup: nomi, estensioni multiple, dotfile e Unicode", () => {
  run(
    inject(
      backup,
      String.raw`
    for (input, replaced, appended) in [
        ("report", "report.bak", "report.bak"),
        ("report.", "report.bak", "report..bak"),
        (".gitignore", ".gitignore.bak", ".gitignore.bak"),
        ("archive.tar.gz", "archive.tar.bak", "archive.tar.gz.bak"),
        ("dati/\u{00E8}.TXT", "dati/\u{00E8}.bak", "dati/\u{00E8}.TXT.bak"),
        ("config.bak", "config.bak", "config.bak.bak"),
    ] {
        assert_eq!(backup_path(input), Some(PathBuf::from(replaced)));
        assert_eq!(appended_backup(Path::new(input)), Some(PathBuf::from(appended)));
    }
  `,
    ),
  );
});
test("backup: assenza di nome, radice e directory lessicale", () => {
  run(
    inject(
      backup,
      String.raw`
    for input in ["", ".", "..", "dir/.."] {
        assert!(backup_path(input).is_none(), "{input}");
        assert!(appended_backup(Path::new(input)).is_none(), "{input}");
    }
    #[cfg(windows)]
    for input in [r"C:\", "C:"] {
        assert!(backup_path(input).is_none());
    }
    assert_eq!(backup_path("directory/"), Some(PathBuf::from("directory.bak")));
  `,
    ),
  );
});
test("estensione vuota e parent relativo vuoto", () => {
  run(
    inject(
      backup,
      String.raw`
    assert_eq!(Path::new(".gitignore").extension(), None);
    assert_eq!(Path::new("report.").extension(), Some(OsStr::new("")));
    assert_eq!(Path::new("config.toml").parent(), Some(Path::new("")));
    assert_eq!(Path::new("").parent(), None);
    let mut path = PathBuf::from("archive.tar.gz");
    assert!(path.set_extension(""));
    assert_eq!(path, Path::new("archive.tar"));
    assert!(path.set_extension(""));
    assert_eq!(path, Path::new("archive"));
  `,
    ),
  );
});
test("pop rimuove componenti, non interpreta parent come cd", () => {
  run(
    inject(
      view,
      String.raw`
    let mut path = PathBuf::from("a/b/..");
    assert!(path.pop());
    assert_eq!(path, Path::new("a/b"));
    assert!(path.pop());
    assert_eq!(path, Path::new("a"));
    assert!(path.pop());
    assert_eq!(path, Path::new(""));
    assert!(!path.pop());
  `,
    ),
  );
});
test("prefix Windows: UNC, drive relative e verbatim senza accesso al disco", () => {
  assert.equal(
    process.platform,
    "win32",
    "Sonda specifica Windows: non simulare con cfg",
  );
  run(
    inject(
      platforms,
      String.raw`
    use std::path::{Component, Prefix};
    let unc = Path::new(r"\\server\share\folder");
    assert!(unc.is_absolute());
    assert!(matches!(unc.components().next(), Some(Component::Prefix(p)) if matches!(p.kind(), Prefix::UNC(_, _))));
    let mut pushed = Path::new(r"C:\data").to_path_buf();
    pushed.push("D:child");
    assert_eq!(pushed, Path::new("D:child"));
    let verbatim = Path::new(r"\\?\C:\data");
    assert_eq!(verbatim.join(r"..\other"), Path::new(r"\\?\C:\other"));
    assert_eq!(Path::new(r"C:\data"), Path::new(r"c:\data"));
    assert_ne!(Path::new(r"C:\Data"), Path::new(r"C:\data"));
    assert_eq!(Path::new(r"\\?\C:\data/file").components().count(), 3);
  `,
    ),
  );
});
test("prefissi: componenti interi, dot iniziale e parent conservato", () => {
  run(
    inject(
      components,
      String.raw`
    assert!(!Path::new("data2/x").starts_with("data"));
    assert_eq!(Path::new("data//./x").strip_prefix("data").unwrap(), Path::new("x"));
    assert_eq!(Path::new("data").strip_prefix("data").unwrap(), Path::new(""));
    assert!(Path::new("./data").components().any(|c| c == Component::CurDir));
    assert_ne!(Path::new("./data"), Path::new("data"));
    assert!(Path::new("data/../x").components().any(|c| c == Component::ParentDir));
  `,
    ),
  );
});
test("sostituire starts_with con prefisso stringa e un errore rilevato", () => {
  const code = replaceOnce(
    from(components),
    'Path::new("database/file.txt").starts_with(base)',
    '"database/file.txt".starts_with("data")',
  );
  run(code, { panic: /assertion failed/ });
});
test("variabili e tilde non vengono espanse", () => {
  run(
    inject(
      view,
      String.raw`
    for literal in ["~", "$HOME", "%USERPROFILE%"] {
        assert_eq!(Path::new(literal).as_os_str(), OsStr::new(literal));
        assert_eq!(Path::new(literal).components().count(), 1);
    }
  `,
    ),
  );
});
test("nomi non Unicode: conservazione nel backup", () => {
  const functions = from(backup)
    .split("fn main() {")[0]
    .replace("use std::ffi::OsStr;\n", "")
    .replace("use std::path::{Path, PathBuf};\n", "use std::path::Path;\n");
  run(
    functions +
      inject(
        unicode,
        String.raw`
    #[cfg(any(windows, unix))]
    {
        let input = PathBuf::from(unusual_name());
        let replaced = backup_path(&input).unwrap();
        let appended = appended_backup(&input).unwrap();
        assert!(replaced.to_str().is_none());
        assert!(appended.to_str().is_none());
        assert_eq!(replaced.extension(), Some(OsStr::new("bak")));
        assert_eq!(appended.file_stem(), input.file_name());
    }
  `,
      ),
  );
});
test("nomi Windows distinti possono avere lo stesso output lossy", () => {
  assert.equal(process.platform, "win32");
  run(
    inject(
      unicode,
      String.raw`
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    let left = PathBuf::from(OsString::from_wide(&[0xD800]));
    let right = PathBuf::from(OsString::from_wide(&[0xD801]));
    assert_ne!(left, right);
    assert_eq!(left.to_string_lossy(), right.to_string_lossy());
    assert_eq!(left.as_os_str().encode_wide().collect::<Vec<_>>(), vec![0xD800]);
  `,
    ),
  );
});
test("to_str unwrap fallisce su percorso non Unicode", () => {
  run(
    inject(
      unicode,
      String.raw`
    #[cfg(any(windows, unix))]
    PathBuf::from(unusual_name()).to_str().unwrap();
  `,
    ),
    { panic: /Option::unwrap/ },
  );
});
test("PathBuf non implementa Display direttamente", () => {
  run(
    inject(
      view,
      String.raw`
    let path = PathBuf::from("data");
    println!("{path}");
  `,
    ),
    { error: "E0277" },
  );
});
test("display mostra il testo senza espansione o escaping shell", () => {
  const output = run(
    inject(
      view,
      String.raw`
    println!("{}", Path::new("$HOME; echo test").display());
  `,
    ),
  );
  assert.equal(output, "$HOME; echo test\n");
});

const cliPrepare = (dir, content) => {
  fs.mkdirSync(path.join(dir, "input"));
  fs.writeFileSync(path.join(dir, "input", "file con spazi.txt"), content);
};
test("CLI: percorso relativo con spazi e contenuto Unicode, input invariato", () => {
  let fixture;
  const contents = "riga \u00E8\nseconda riga\n";
  const output = run(from(io), {
    prepare: (dir) => {
      fixture = dir;
      cliPrepare(dir, contents);
    },
    programArgs: ["input/file con spazi.txt"],
  });
  const lines = output.split("\n");
  assert.match(lines[0], /^absolute: /);
  assert.match(lines[1], /^canonical: /);
  assert.equal(lines.slice(2).join("\n"), contents);
  assert.equal(
    fs.readFileSync(path.join(fixture, "input", "file con spazi.txt"), "utf8"),
    contents,
  );
});
test("CLI: file vuoto", () => {
  const output = run(from(io), {
    prepare: (dir) => cliPrepare(dir, ""),
    programArgs: ["input/file con spazi.txt"],
  });
  assert.match(output, /^absolute: .+\ncanonical: .+\n$/);
});
test("CLI: file mancante propaga errore", () => {
  run(from(io), {
    programArgs: ["missing.txt"],
    exitCode: 1,
    stderr: /Error:/,
  });
});
test("CLI: contenuto non UTF-8 propaga errore", () => {
  run(from(io), {
    prepare: (dir) => cliPrepare(dir, Buffer.from([0xff])),
    programArgs: ["input/file con spazi.txt"],
    exitCode: 1,
    stderr: /Error:/,
  });
});
test("CLI: directory non viene letta come file", () => {
  run(from(io), {
    prepare: (dir) => fs.mkdirSync(path.join(dir, "input")),
    programArgs: ["input"],
    exitCode: 1,
    stderr: /Error:/,
  });
});
test("absolute senza esistenza, canonicalize e try_exists con assenza", () => {
  run(String.raw`
use std::path::{self, Path};
fn main() {
    let missing = Path::new("missing.txt");
    assert!(path::absolute(missing).unwrap().is_absolute());
    assert!(!missing.exists());
    assert_eq!(missing.try_exists().unwrap(), false);
    assert!(missing.canonicalize().is_err());
    assert!(path::absolute("").is_err());
}
`);
});
test("PathBuf accetta NUL, interrogazione fallisce e exists nasconde l'errore", () => {
  run(String.raw`
use std::path::PathBuf;
fn main() {
    let invalid = PathBuf::from("bad\0name");
    assert!(invalid.as_os_str().as_encoded_bytes().contains(&0));
    assert!(invalid.try_exists().is_err());
    assert!(!invalid.exists());
    assert!(invalid.canonicalize().is_err());
}
`);
});
test("percorso relativo non cattura la directory corrente", () => {
  run(
    String.raw`
use std::{env, fs, path::PathBuf};
fn main() {
    let root = env::current_dir().unwrap();
    let relative = PathBuf::from("value.txt");
    env::set_current_dir(root.join("first")).unwrap();
    assert_eq!(fs::read_to_string(&relative).unwrap(), "first");
    env::set_current_dir(root.join("second")).unwrap();
    assert_eq!(fs::read_to_string(&relative).unwrap(), "second");
}
`,
    {
      prepare: (dir) => {
        for (const name of ["first", "second"]) {
          fs.mkdirSync(path.join(dir, name));
          fs.writeFileSync(path.join(dir, name, "value.txt"), name);
        }
      },
    },
  );
});
test("junction locale: prefisso lessicale presente, destinazione fuori dalla base", () => {
  assert.equal(process.platform, "win32");
  run(
    String.raw`
use std::path::Path;
fn main() {
    let base = Path::new("base").canonicalize().unwrap();
    let candidate = base.join("link").join("value.txt");
    assert!(candidate.starts_with(&base));
    let resolved = candidate.canonicalize().unwrap();
    assert!(!resolved.starts_with(&base));
    assert_eq!(std::fs::read_to_string(resolved).unwrap(), "outside");
}
`,
    {
      prepare: (dir) => {
        const outside = path.join(dir, "outside");
        const base = path.join(dir, "base");
        fs.mkdirSync(outside);
        fs.mkdirSync(base);
        fs.writeFileSync(path.join(outside, "value.txt"), "outside");
        fs.symlinkSync(outside, path.join(base, "link"), "junction");
      },
    },
  );
});
