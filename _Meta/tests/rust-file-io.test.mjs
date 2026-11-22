import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["File I O"];
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
const prefix = "appunti-rust-file-io-";
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
  options.verify?.(dir);
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

const config = "Leggere una configurazione facoltativa";
const report = "Creare un report senza sovrascrivere";
const lines = "Leggere righe senza accumulare il file";
const copyText = "Copiare testo UTF-8 con sostituzione esplicita";
const copyBytes = "Copiare byte in una destinazione nuova";
const directory = "Elencare una directory gestendo tutti gli errori";
const from = (heading) => source(0, heading);
function mainFor(heading, body) {
  const code = from(heading);
  assert.equal(code.split("fn main() -> io::Result<()> {").length, 2);
  return (
    code.split("fn main() -> io::Result<()> {")[0] +
    "fn main() -> io::Result<()> {\n" +
    body +
    "\nOk(())\n}"
  );
}
const put = (dir, name, data) => fs.writeFileSync(path.join(dir, name), data);
const get = (dir, name) => fs.readFileSync(path.join(dir, name));
const absent = (dir, name) =>
  assert.equal(fs.existsSync(path.join(dir, name)), false);

test("baseline e inventario: sei programmi completi", () => {
  const version = launch(rustc, ["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.match(version.stdout, /1\.99\.1\b/);
  assert.equal(blocks[0].size, 6);
});
test("YAML invariato, template, gerarchia, tipi e fonti", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/File I O.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "File I/O",
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
    assert.ok(
      headings.some((n) => n.depth === 2 && text(n) === section),
      section,
    );
  for (let i = 1; i < headings.length; i++)
    assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  const nodes = [];
  function walk(n) {
    nodes.push(n);
    for (const c of n.children ?? []) walk(c);
  }
  walk(note.tree);
  assert.ok(!nodes.some((n) => n.type === "html"));
  for (const token of ["Vec<u8>", "io::Result<String>", "buffer[..n]"])
    assert.ok(
      nodes.some((n) => n.type === "inlineCode" && n.value === token),
      token,
    );
  for (const page of [
    "fs/struct.File.html",
    "fs/struct.OpenOptions.html",
    "io/trait.Read.html",
    "io/trait.Write.html",
    "io/trait.BufRead.html",
    "io/struct.BufWriter.html",
    "fs/fn.read_dir.html",
  ])
    assert.ok(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url === "https://doc.rust-lang.org/std/" + page,
      ),
      page,
    );
});
test("programma configurazione: assenza e fallback, senza scritture", () => {
  assert.equal(
    run(from(config), { verify: (dir) => absent(dir, "config.toml") }),
    "config bytes: 16\n",
  );
});
for (const [label, data, bytes] of [
  ["vuoto", "", 0],
  ["Unicode", "x=\u00e8\n", 5],
]) {
  test("configurazione esistente: " + label, () => {
    assert.equal(
      run(from(config), {
        prepare: (dir) => put(dir, "config.toml", data),
        verify: (dir) => assert.equal(get(dir, "config.toml").toString(), data),
      }),
      "config bytes: " + bytes + "\n",
    );
  });
}
test("configurazione: UTF-8 invalido e directory non diventano default", () => {
  run(
    mainFor(
      config,
      String.raw`
    std::fs::write("invalid", [0xff])?;
    assert_eq!(read_optional("invalid").unwrap_err().kind(), ErrorKind::InvalidData);
    std::fs::create_dir("folder")?;
    assert!(read_optional("folder").is_err());
    assert_eq!(read_optional("missing/parent")?, "enabled = false\n");
  `,
    ),
  );
});
test("programma report: contenuto completo, LF e sincronizzazione", () => {
  assert.equal(
    run(from(report), {
      verify: (dir) =>
        assert.equal(get(dir, "report.txt").toString(), "value=10\nvalue=20\n"),
    }),
    "",
  );
});
test("report gia presente: errore e contenuto invariato", () => {
  run(from(report), {
    prepare: (dir) => put(dir, "report.txt", "original"),
    exitCode: 1,
    stderr: /AlreadyExists/,
    verify: (dir) =>
      assert.equal(get(dir, "report.txt").toString(), "original"),
  });
});
test("report: parent mancante, directory e doppia creazione", () => {
  run(
    mainFor(
      report,
      String.raw`
    assert!(write_report("missing/report").is_err());
    std::fs::create_dir("folder")?;
    assert!(write_report("folder").is_err());
    write_report("unique")?;
    assert!(write_report("unique").is_err());
    assert_eq!(std::fs::read("unique")?, b"value=10\nvalue=20\n");
  `,
    ),
  );
});
test("programma righe: CRLF, riga vuota, ultima senza newline", () => {
  assert.equal(
    run(from(lines), {
      prepare: (dir) => put(dir, "input.txt", "uno\r\n\r\n\u00e8"),
    }),
    "lines: 3\n",
  );
});
test("righe: vuoto, LF, CR, Unicode, spazi e lunga riga", () => {
  run(
    mainFor(
      lines,
      String.raw`
    for (text, expected) in [
        ("", Vec::<&str>::new()), ("\n", vec![""]), ("a\n", vec!["a"]),
        ("a\r\n\r\nb", vec!["a", "", "b"]), ("a\rb", vec!["a\rb"]),
        (" \u{e8} \nlast\r", vec![" \u{e8} ", "last\r"]),
    ] {
        std::fs::write("sample", text)?;
        assert_eq!(count_lines("sample")?, expected.len());
        assert_eq!(read_lines("sample")?, expected);
    }
    let long = "x".repeat(100_000);
    std::fs::write("sample", &long)?;
    assert_eq!(count_lines("sample")?, 1);
    assert_eq!(read_lines("sample")?, vec![long]);
  `,
    ),
  );
});
test("righe: errore dopo prima riga valida non viene scartato", () => {
  run(
    mainFor(
      lines,
      String.raw`
    std::fs::write("invalid", b"ok\n\xff\n")?;
    assert_eq!(count_lines("invalid").unwrap_err().kind(), io::ErrorKind::InvalidData);
    assert_eq!(read_lines("invalid").unwrap_err().kind(), io::ErrorKind::InvalidData);
    assert!(count_lines("absent").is_err());
  `,
    ),
  );
});
test("read_line aggiunge byte e terminatori; read_until non impone UTF-8", () => {
  run(String.raw`
use std::io::{self, BufRead, Cursor};
fn main() -> io::Result<()> {
    let mut input = Cursor::new("\u{e8}\r\nz".as_bytes());
    let mut text = String::from("prefix:");
    assert_eq!(input.read_line(&mut text)?, 4);
    assert_eq!(input.read_line(&mut text)?, 1);
    assert_eq!(text, "prefix:\u{e8}\r\nz");
    assert_eq!(input.read_line(&mut text)?, 0);
    text.clear();
    assert!(text.is_empty());
    let mut bytes = Vec::new();
    assert_eq!(Cursor::new(b"\xff\n").read_until(b'\n', &mut bytes)?, 2);
    assert_eq!(bytes, b"\xff\n");
    Ok(())
}
`);
});
test("programma copia testo: sostituisce e conserva CRLF e origine", () => {
  const text = "a\r\n\u00e8\n";
  assert.equal(
    run(from(copyText), {
      prepare: (dir) => {
        put(dir, "input.txt", text);
        put(dir, "copy.txt", "old content is longer");
      },
      verify: (dir) => {
        assert.equal(get(dir, "copy.txt").toString(), text);
        assert.equal(get(dir, "input.txt").toString(), text);
      },
    }),
    "",
  );
});
test("copia testo: errore prima della scrittura preserva il bersaglio", () => {
  run(
    mainFor(
      copyText,
      String.raw`
    std::fs::write("destination", "original")?;
    std::fs::write("invalid", [0xff])?;
    assert!(copy_text("invalid", "destination").is_err());
    assert!(copy_text("absent", "destination").is_err());
    assert_eq!(std::fs::read_to_string("destination")?, "original");
    assert!(copy_text("invalid", "never-created").is_err());
    assert!(!Path::new("never-created").exists());
    std::fs::write("empty", "")?;
    copy_text("empty", "destination")?;
    assert!(std::fs::read("destination")?.is_empty());
  `,
    ),
  );
});
test("programma copia byte: tutti i valori, NUL e file maggiore del buffer", () => {
  const data = Buffer.alloc(256 * 4096);
  for (let i = 0; i < data.length; i++) data[i] = i % 256;
  assert.equal(
    run(from(copyBytes), {
      prepare: (dir) => put(dir, "input.bin", data),
      verify: (dir) => {
        assert.deepEqual(get(dir, "copy.bin"), data);
        assert.deepEqual(get(dir, "input.bin"), data);
      },
    }),
    "copied bytes: " + data.length + "\n",
  );
});
test("copia byte: esistente, stesso file e hard link non vengono troncati", () => {
  run(
    mainFor(
      copyBytes,
      String.raw`
    std::fs::write("source", b"\xff\0data")?;
    std::fs::write("target", "original")?;
    assert!(copy_new("source", "target").is_err());
    assert!(copy_new("source", "source").is_err());
    std::fs::hard_link("source", "alias")?;
    assert!(copy_new("source", "alias").is_err());
    assert_eq!(std::fs::read("source")?, b"\xff\0data");
    assert_eq!(std::fs::read_to_string("target")?, "original");
  `,
    ),
  );
});
test("copia byte: origine assente, parent assente e file vuoto", () => {
  run(
    mainFor(
      copyBytes,
      String.raw`
    assert!(copy_new("absent", "never-created").is_err());
    assert!(!Path::new("never-created").exists());
    std::fs::write("empty", [])?;
    assert!(copy_new("empty", "missing/target").is_err());
    assert_eq!(copy_new("empty", "target")?, 0);
    assert!(std::fs::read("target")?.is_empty());
  `,
    ),
  );
});
test("programma directory: ordinamento e sottodirectory non espansa", () => {
  const output = run(from(directory), {
    prepare: (dir) => {
      const folder = path.join(dir, "input-dir");
      fs.mkdirSync(folder);
      put(folder, "z.txt", "z");
      put(folder, "a.txt", "a");
      fs.mkdirSync(path.join(folder, "middle"));
      put(path.join(folder, "middle"), "hidden.txt", "not visited");
    },
  });
  assert.equal(
    output.replaceAll("\\", "/"),
    "input-dir/a.txt\ninput-dir/middle\ninput-dir/z.txt\n",
  );
});
test("directory: vuota, Unicode, assente e file non directory", () => {
  run(
    mainFor(
      directory,
      String.raw`
    fs::create_dir("empty")?;
    assert!(list_entries("empty")?.is_empty());
    fs::create_dir("names")?;
    fs::write("names/\u{e8}.txt", "")?;
    assert_eq!(list_entries("names")?, vec![PathBuf::from("names/\u{e8}.txt")]);
    assert!(list_entries("missing").is_err());
    fs::write("file", "")?;
    assert!(list_entries("file").is_err());
  `,
    ),
  );
});
test("File::create tronca all'apertura; create(true) non tronca; sola lettura non scrive", () => {
  run(String.raw`
use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
fn main() -> io::Result<()> {
    fs::write("sample", "abcdefghij")?;
    let file = File::create("sample")?;
    assert_eq!(file.metadata()?.len(), 0);
    drop(file);
    fs::write("sample", "abcdefghij")?;
    let mut file = OpenOptions::new().write(true).create(true).open("sample")?;
    file.write_all(b"XYZ")?;
    drop(file);
    assert_eq!(fs::read("sample")?, b"XYZdefghij");
    fs::write("sample", "x")?;
    assert_eq!(fs::read("sample")?, b"x");
    assert!(OpenOptions::new().create(true).open("sample").is_err());
    let mut read_only = File::open("sample")?;
    assert!(read_only.write_all(b"no").is_err());
    assert_eq!(fs::read("sample")?, b"x");
    Ok(())
}
`);
});
test("append scrive in fondo anche dopo rewind", () => {
  run(String.raw`
use std::fs::{self, OpenOptions};
use std::io::{self, Seek, Write};
fn main() -> io::Result<()> {
    let mut file = OpenOptions::new().append(true).create(true).open("log")?;
    file.write_all(b"first\n")?;
    file.rewind()?;
    file.write_all(b"second\n")?;
    drop(file);
    assert_eq!(fs::read("log")?, b"first\nsecond\n");
    Ok(())
}
`);
});
test("read parziale, EOF, read_exact e rewind", () => {
  run(String.raw`
use std::io::{self, Cursor, Read, Seek};
fn main() -> io::Result<()> {
    let mut reader = Cursor::new(b"abc");
    let mut buffer = [9u8; 8];
    assert_eq!(reader.read(&mut buffer)?, 3);
    assert_eq!(&buffer[..3], b"abc");
    assert_eq!(&buffer[3..], &[9; 5]);
    assert_eq!(reader.read(&mut buffer)?, 0);
    reader.rewind()?;
    assert_eq!(reader.read(&mut [])?, 0);
    assert_eq!(reader.read_exact(&mut [0; 4]).unwrap_err().kind(), io::ErrorKind::UnexpectedEof);
    reader.rewind()?;
    let mut exact = [0; 3];
    reader.read_exact(&mut exact)?;
    assert_eq!(&exact, b"abc");
    Ok(())
}
`);
});
test("try_clone condivide la posizione", () => {
  run(String.raw`
use std::fs::{self, File};
use std::io::{self, Read, Seek};
fn main() -> io::Result<()> {
    fs::write("source", b"abcd")?;
    let mut first = File::open("source")?;
    let mut second = first.try_clone()?;
    let mut byte = [0; 1];
    first.read_exact(&mut byte)?;
    assert_eq!(&byte, b"a");
    second.read_exact(&mut byte)?;
    assert_eq!(&byte, b"b");
    second.rewind()?;
    first.read_exact(&mut byte)?;
    assert_eq!(&byte, b"a");
    Ok(())
}
`);
});
test("write_all gestisce Interrupted e scritture brevi; errore non ripristina", () => {
  run(String.raw`
use std::io::{self, Write};
struct Short { data: Vec<u8>, interrupted: bool, fail: bool }
impl Write for Short {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if !self.interrupted {
            self.interrupted = true;
            return Err(io::ErrorKind::Interrupted.into());
        }
        if self.fail && !self.data.is_empty() { return Err(io::Error::other("injected")); }
        let n = bytes.len().min(2);
        self.data.extend_from_slice(&bytes[..n]);
        Ok(n)
    }
    fn flush(&mut self) -> io::Result<()> { Ok(()) }
}
fn main() -> io::Result<()> {
    let mut writer = Short { data: Vec::new(), interrupted: false, fail: false };
    writer.write_all(b"abcdef")?;
    assert_eq!(writer.data, b"abcdef");
    let mut short = Short { data: Vec::new(), interrupted: true, fail: false };
    assert_eq!(short.write(b"abcdef")?, 2);
    assert_eq!(short.data, b"ab");
    let mut fail = Short { data: Vec::new(), interrupted: true, fail: true };
    assert!(fail.write_all(b"abcdef").is_err());
    assert_eq!(fail.data, b"ab");
    let mut full: &mut [u8] = &mut [];
    assert_eq!(full.write_all(b"x").unwrap_err().kind(), io::ErrorKind::WriteZero);
    Ok(())
}
`);
});
test("BufWriter: sync prima di flush non scarica il buffer Rust", () => {
  run(String.raw`
use std::fs::{self, OpenOptions};
use std::io::{self, BufWriter, Write};
fn main() -> io::Result<()> {
    let file = OpenOptions::new().write(true).create_new(true).open("buffered")?;
    let mut writer = BufWriter::with_capacity(1024, file);
    writer.write_all(b"pending")?;
    writer.get_ref().sync_all()?;
    assert_eq!(writer.get_ref().metadata()?.len(), 0);
    writer.flush()?;
    writer.get_ref().sync_all()?;
    assert_eq!(fs::read("buffered")?, b"pending");
    Ok(())
}
`);
});
test("BufWriter: errore segnalato da flush, non da Drop", () => {
  run(String.raw`
use std::io::{self, BufWriter, Write};
struct Fail;
impl Write for Fail {
    fn write(&mut self, _: &[u8]) -> io::Result<usize> { Err(io::Error::other("injected")) }
    fn flush(&mut self) -> io::Result<()> { Ok(()) }
}
fn main() -> io::Result<()> {
    let mut writer = BufWriter::with_capacity(1024, Fail);
    writer.write_all(b"pending")?;
    assert!(writer.flush().is_err());
    drop(writer);
    Ok(())
}
`);
});
test("BufReader: into_inner scarta i dati anticipati; rewind gestisce il buffer", () => {
  run(String.raw`
use std::io::{self, BufRead, BufReader, Cursor, Read, Seek};
fn main() -> io::Result<()> {
    let mut reader = BufReader::with_capacity(8, Cursor::new(b"one\ntwo\n"));
    let mut text = String::new();
    reader.read_line(&mut text)?;
    assert_eq!(reader.buffer(), b"two\n");
    let mut inner = reader.into_inner();
    let mut rest = String::new();
    inner.read_to_string(&mut rest)?;
    assert!(rest.is_empty());
    let mut reader = BufReader::new(Cursor::new(b"one\ntwo\n"));
    reader.read_line(&mut text)?;
    reader.rewind()?;
    text.clear();
    reader.read_line(&mut text)?;
    assert_eq!(text, "one\n");
    Ok(())
}
`);
});
test("io::copy: errore dopo byte validi lascia un file parziale", () => {
  run(String.raw`
use std::fs::{self, OpenOptions};
use std::io::{self, Read};
struct Fail { sent: bool }
impl Read for Fail {
    fn read(&mut self, bytes: &mut [u8]) -> io::Result<usize> {
        if bytes.is_empty() { return Ok(0); }
        if self.sent { return Err(io::Error::other("injected")); }
        bytes[0] = 0xff;
        self.sent = true;
        Ok(1)
    }
}
fn main() -> io::Result<()> {
    let mut output = OpenOptions::new().write(true).create_new(true).open("partial")?;
    assert!(io::copy(&mut Fail { sent: false }, &mut output).is_err());
    drop(output);
    assert_eq!(fs::read("partial")?, [0xff]);
    Ok(())
}
`);
});
test("trait Write mancante viene diagnosticato", () => {
  run(replaceOnce(from(report), "self, BufWriter, Write", "self, BufWriter"), {
    error: "E0599",
  });
});
test("mutazione: create invece di create_new viene rilevata", () => {
  let code = mainFor(
    report,
    String.raw`
    std::fs::write("existing", "original")?;
    assert!(write_report("existing").is_err());
  `,
  );
  run(replaceOnce(code, ".create_new(true)", ".create(true)"), {
    panic: /assertion failed/,
  });
});
