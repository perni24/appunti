import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const rustc = process.env.RUSTC_TEST_EXECUTABLE || "rustc";
const names = ["Process e Command"];
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
const prefix = "appunti-rust-process-";
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
  if (key.toUpperCase().startsWith("GIT_") || key.toUpperCase() === "RUSTC")
    delete env[key];
env.RUSTC = rustc;
env.GIT_CONFIG_NOSYSTEM = "1";
env.GIT_CONFIG_GLOBAL = path.join(root, "absent-gitconfig");
env.GIT_TERMINAL_PROMPT = "0";
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

const status = "Mostrare lo stato di un comando";
const capture = "Catturare e decodificare un risultato";
const literal = "Passare argomenti letterali e ambiente locale al figlio";
const gitHash = "Leggere il commit Git senza nascondere il fallimento";
const pipe = "Inviare input e chiudere la pipe";
const stop = "Terminare e raccogliere un figlio controllato";
const from = (heading) => source(0, heading);

function git(dir, args) {
  const result = launch("git", args, dir);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout.trim();
}
function initRepo(dir, format = "sha1", commit = true) {
  const template = path.join(dir, "empty-template");
  fs.mkdirSync(template);
  git(dir, [
    "init",
    "-q",
    "--object-format=" + format,
    "--template=" + template,
    ".",
  ]);
  if (commit)
    git(dir, [
      "-c",
      "user.name=Note Tests",
      "-c",
      "user.email=notes@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=" + template,
      "commit",
      "-q",
      "--allow-empty",
      "-m",
      "temporary fixture",
    ]);
  return commit ? git(dir, ["rev-parse", "--verify", "HEAD^{commit}"]) : null;
}
function selfProcess(child, parent) {
  return String.raw`
use std::ffi::OsStr;
use std::io::{self, Read, Write};
use std::process::{Command, Stdio, ExitCode};
use std::path::PathBuf;
fn main() -> io::Result<()> {
    if std::env::args_os().nth(1).as_deref() == Some(OsStr::new("--test-child")) {
CHILD
        return Ok(());
    }
    let exe = std::env::current_exe()?;
PARENT
    Ok(())
}
`
    .replace("CHILD", child)
    .replace("PARENT", parent);
}
function simulatedCapture(child) {
  let code = replaceOnce(
    from(capture),
    'let compiler = std::env::var_os("RUSTC")\n        .unwrap_or_else(|| "rustc".into());',
    "let compiler = std::env::current_exe()?;",
  );
  code = replaceOnce(code, "fn main()", "fn run()");
  return (
    code +
    String.raw`
fn main() -> Result<(), Box<dyn Error>> {
    if std::env::args().nth(1).as_deref() == Some("--version") {
CHILD
        return Ok(());
    }
    run()
}
`.replace("CHILD", child)
  );
}
function simulatedGit(child) {
  let code = replaceOnce(
    from(gitHash),
    'Command::new("git")',
    "Command::new(std::env::current_exe()?)",
  );
  code = replaceOnce(code, "fn main()", "fn run()");
  return (
    code +
    String.raw`
fn main() -> Result<(), Box<dyn Error>> {
    if std::env::args().nth(1).as_deref() == Some("rev-parse") {
CHILD
        return Ok(());
    }
    run()
}
`.replace("CHILD", child)
  );
}

test("baseline e sei programmi", () => {
  assert.match(launch(rustc, ["--version"]).stdout, /1\.99\.1\b/);
  assert.match(launch("git", ["--version"]).stdout, /git version /);
  assert.equal(blocks[0].size, 6);
});
test("YAML invariato, gerarchia, template e fonti ufficiali", () => {
  const note = notes[0];
  const original = launch(
    "git",
    ["show", "HEAD:Programmazione/Rust/Pagine/Process e Command.md"],
    process.cwd(),
  );
  assert.equal(original.status, 0, original.stderr);
  const yaml = (s) => s.replaceAll("\r\n", "\n").split("\n---\n")[0];
  assert.equal(yaml(note.source), yaml(original.stdout));
  assert.equal(note.data.status, "non revisionato");
  const headings = note.tree.children.filter((n) => n.type === "heading");
  assert.deepEqual(headings.filter((n) => n.depth === 1).map(text), [
    "Process e Command",
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
  for (const token of [
    "io::Result<ExitStatus>",
    "io::Result<Output>",
    "io::Result<Child>",
    "Option<i32>",
    "io::Result<Option<ExitStatus>>",
  ])
    assert.ok(
      nodes.some((n) => n.type === "inlineCode" && n.value === token),
      token,
    );
  for (const page of ["Command", "Child", "Stdio", "Output", "ExitStatus"])
    assert.ok(
      nodes.some(
        (n) =>
          n.type === "link" &&
          n.url ===
            "https://doc.rust-lang.org/std/process/struct." + page + ".html",
      ),
      page,
    );
});
test("programma status: git --version reale senza modifiche al vault", () => {
  assert.match(run(from(status)), /^git version /);
});
test("programma output: rustc --version reale dal percorso configurato", () => {
  assert.match(run(from(capture)), /^rustc 1\.99\.1\b/);
});
test("programma argomenti e ambiente: nessuna espansione o modifica del padre", () => {
  assert.equal(
    run(from(literal), { childEnv: { APPUNTI_MODE: "parent" } }),
    "",
  );
});
for (const format of ["sha1", "sha256"]) {
  test("programma Git: repository temporaneo " + format, () => {
    let expected;
    const output = run(from(gitHash), {
      prepare: (dir) => {
        expected = initRepo(dir, format);
      },
    });
    assert.equal(output, expected + "\n");
    assert.equal(expected.length, format === "sha1" ? 40 : 64);
  });
}
test("Git: percorso con spazi e Unicode, override ambiente ignorati", () => {
  let expected;
  const name = "repo con spazi \u00e8";
  const output = run(from(gitHash), {
    programArgs: [name],
    childEnv: { GIT_DIR: "wrong-path", GIT_WORK_TREE: "wrong-worktree" },
    prepare: (dir) => {
      const repo = path.join(dir, name);
      fs.mkdirSync(repo);
      expected = initRepo(repo);
    },
  });
  assert.equal(output, expected + "\n");
});
test("Git: repository senza commit e cartella non repository producono errore", () => {
  run(from(gitHash), {
    prepare: (dir) => initRepo(dir, "sha1", false),
    exitCode: 1,
    stderr: /git rev-parse failed/,
  });
  run(from(gitHash), { exitCode: 1, stderr: /git rev-parse failed/ });
});
test("Git: directory assente conserva errore I/O", () => {
  const functions = from(gitHash).split("fn main()")[0];
  run(
    functions +
      `
fn main() {
    let error = git_commit_hash(Path::new("missing-dir")).unwrap_err();
    assert!(error.downcast_ref::<std::io::Error>().is_some());
}
`,
  );
});
test("Git: errore di comando non diventa Ok(None)", () => {
  run(simulatedGit('eprintln!("controlled failure"); std::process::exit(7);'), {
    exitCode: 1,
    stderr: /git rev-parse failed.*controlled failure/,
  });
});
test("Git: UTF-8 invalido e identificatore inatteso sono rifiutati", () => {
  run(
    simulatedGit(
      "std::io::Write::write_all(&mut std::io::stdout(), &[0xff])?;",
    ),
    {
      exitCode: 1,
      stderr: /FromUtf8Error/,
    },
  );
  for (const output of ["", "abc xyz", " abc", "abc\nxyz"])
    run(simulatedGit("print!(" + JSON.stringify(output) + ");"), {
      exitCode: 1,
      stderr: /invalid object id/,
    });
});
test("Git: elimina solo CRLF finali, non fissa 40 caratteri", () => {
  assert.equal(run(simulatedGit('print!("abcdef\\r\\n");')), "abcdef\n");
});
test("programma pipe: roundtrip e EOF, figlio raccolto", () => {
  assert.equal(run(from(pipe)), "");
});
test("programma stop: solo il figlio creato viene terminato e raccolto", () => {
  assert.match(run(from(stop)), /^child collected: /);
});
test("cattura: esito non zero e stderr; UTF-8 invalido non diventa testo lossy", () => {
  run(
    simulatedCapture(
      'eprintln!("bad compiler option"); std::process::exit(9);',
    ),
    {
      exitCode: 1,
      stderr: /rustc failed.*bad compiler option/,
    },
  );
  run(
    simulatedCapture(
      "std::io::Write::write_all(&mut std::io::stdout(), &[0xff])?;",
    ),
    {
      exitCode: 1,
      stderr: /FromUtf8Error/,
    },
  );
});
test("errore di avvio distinto da exit status 7", () => {
  run(
    selfProcess(
      "std::process::exit(7);",
      String.raw`
    assert!(Command::new("missing-directory/not-a-program").output().is_err());
    let output = Command::new(&exe).arg("--test-child").output()?;
    assert!(!output.status.success());
    assert_eq!(output.status.code(), Some(7));
  `,
    ),
  );
});
test("output cattura byte arbitrari e stderr separati", () => {
  run(
    selfProcess(
      String.raw`
    io::stdout().write_all(&[0xff, 0, b'x'])?;
    io::stderr().write_all(b"diagnostic")?;
  `,
      String.raw`
    let output = Command::new(&exe).arg("--test-child").output()?;
    assert!(output.status.success());
    assert_eq!(output.stdout, [0xff, 0, b'x']);
    assert_eq!(output.stderr, b"diagnostic");
    assert!(String::from_utf8(output.stdout.clone()).is_err());
    assert_eq!(String::from_utf8_lossy(&output.stdout), "\u{fffd}\0x");
  `,
    ),
  );
});
test("argomenti: vuoto, quote, backslash, opzione e Unicode restano distinti", () => {
  const values = String.raw`["", "two words", "\"quoted\"", r"back\slash\", "--not-an-option-here", "\u{e8}"]`;
  run(
    selfProcess(
      "let expected = " +
        values +
        "; assert_eq!(std::env::args().skip(2).collect::<Vec<_>>(), expected);",
      'let result = Command::new(&exe).arg("--test-child").args(' +
        values +
        ').output()?; assert!(result.status.success(), "{:?}", result);',
    ),
  );
});
test("builder: argomenti accumulati e configurazione riusabile", () => {
  run(
    selfProcess(
      String.raw`
    println!("{}", std::env::args_os().skip(2).count());
  `,
      String.raw`
    let mut command = Command::new(&exe);
    command.arg("--test-child").arg("a");
    assert_eq!(command.output()?.stdout, b"1\n");
    command.arg("b");
    assert_eq!(command.output()?.stdout, b"2\n");
    assert_eq!(command.get_args().count(), 3);
  `,
    ),
  );
});
test("current_dir cambia solo il figlio; eseguibile assoluto", () => {
  run(
    selfProcess(
      String.raw`
    assert_eq!(std::env::current_dir()?, PathBuf::from(std::env::var_os("EXPECTED_DIR").unwrap()));
  `,
      String.raw`
    let original = std::env::current_dir()?;
    let child_dir = original.join("child dir");
    std::fs::create_dir(&child_dir)?;
    let output = Command::new(&exe).arg("--test-child")
        .current_dir(&child_dir).env("EXPECTED_DIR", &child_dir).output()?;
    assert!(output.status.success(), "{:?}", output);
    assert_eq!(std::env::current_dir()?, original);
    assert!(Command::new(&exe).current_dir("absent").output().is_err());
  `,
    ),
  );
});
test("env_remove e env_clear non modificano il padre", () => {
  run(
    selfProcess(
      String.raw`
    assert!(std::env::var_os("APPUNTI_MODE").is_none());
    assert_eq!(std::env::var("ONLY_FOR_CHILD").as_deref(), Ok("yes"));
  `,
      String.raw`
    let original = std::env::var_os("APPUNTI_MODE");
    for clear in [false, true] {
        let mut command = Command::new(&exe);
        command.arg("--test-child");
        if clear { command.env_clear(); } else { command.env_remove("APPUNTI_MODE"); }
        let output = command.env("ONLY_FOR_CHILD", "yes").output()?;
        assert!(output.status.success(), "{:?}", output);
    }
    assert_eq!(std::env::var_os("APPUNTI_MODE"), original);
  `,
    ),
    { childEnv: { APPUNTI_MODE: "parent" } },
  );
});
test("output chiude stdin predefinito e raccoglie EOF", () => {
  run(
    selfProcess(
      String.raw`
    let mut bytes = Vec::new();
    io::stdin().read_to_end(&mut bytes)?;
    assert!(bytes.is_empty());
    println!("eof");
  `,
      String.raw`
    let output = Command::new(&exe).arg("--test-child").output()?;
    assert!(output.status.success());
    assert_eq!(output.stdout, b"eof\n");
  `,
    ),
  );
});
test("wait chiude stdin posseduto; try_wait non lo chiude", () => {
  run(
    selfProcess(
      String.raw`
    let mut bytes = Vec::new();
    io::stdin().read_to_end(&mut bytes)?;
  `,
      String.raw`
    let mut child = Command::new(&exe).arg("--test-child")
        .stdin(Stdio::piped()).stdout(Stdio::null()).stderr(Stdio::null()).spawn()?;
    let before = child.try_wait()?;
    let result = child.wait()?;
    assert!(before.is_none());
    assert!(result.success());
    assert_eq!(child.wait()?, result);
    assert_eq!(child.try_wait()?, Some(result));
  `,
    ),
  );
});
test("stdin estratto e chiuso esplicitamente prima di wait_with_output", () => {
  run(
    selfProcess(
      String.raw`
    let mut bytes = Vec::new();
    io::stdin().read_to_end(&mut bytes)?;
    io::stdout().write_all(&bytes)?;
  `,
      String.raw`
    let mut child = Command::new(&exe).arg("--test-child")
        .stdin(Stdio::piped()).stdout(Stdio::piped()).spawn()?;
    let mut input = child.stdin.take().unwrap();
    let sent = input.write_all(b"\0\xff");
    drop(input);
    let output = child.wait_with_output()?;
    sent?;
    assert!(output.status.success());
    assert_eq!(output.stdout, b"\0\xff");
  `,
    ),
  );
});
test("wait_with_output drena entrambi i flussi oltre la capacita delle pipe", () => {
  run(
    selfProcess(
      String.raw`
    let bytes = vec![b'x'; 1024 * 1024];
    io::stdout().write_all(&bytes)?;
    io::stderr().write_all(&bytes)?;
  `,
      String.raw`
    let child = Command::new(&exe).arg("--test-child")
        .stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()?;
    let output = child.wait_with_output()?;
    assert!(output.status.success());
    assert_eq!(output.stdout, vec![b'x'; 1024 * 1024]);
    assert_eq!(output.stderr, vec![b'x'; 1024 * 1024]);
  `,
    ),
  );
});
test("output rediretto a file non compare nella cattura", () => {
  run(
    selfProcess(
      'io::stdout().write_all(b"file output")?;',
      String.raw`
    let file = std::fs::OpenOptions::new().write(true).create_new(true).open("result")?;
    let output = Command::new(&exe).arg("--test-child").stdout(file).output()?;
    assert!(output.status.success());
    assert!(output.stdout.is_empty());
    assert_eq!(std::fs::read("result")?, b"file output");
  `,
    ),
  );
});
test("stdout estratto non viene raccolto da wait_with_output", () => {
  run(
    selfProcess(
      'io::stdout().write_all(b"small output")?;',
      String.raw`
    let mut child = Command::new(&exe).arg("--test-child").stdout(Stdio::piped()).spawn()?;
    let mut stdout = child.stdout.take().unwrap();
    let mut bytes = Vec::new();
    let read_result = stdout.read_to_end(&mut bytes);
    drop(stdout);
    let output = child.wait_with_output()?;
    read_result?;
    assert!(output.status.success());
    assert!(output.stdout.is_empty());
    assert_eq!(bytes, b"small output");
  `,
    ),
  );
});
test("wait_with_output consuma Child e non consente riuso", () => {
  run(
    String.raw`
use std::process::Child;
fn collect(mut child: Child) {
    let _output = child.wait_with_output();
    let _ = child.wait();
}
fn main() {}
`,
    { error: "E0382" },
  );
});
test("mutazione: virgolette aggiunte a un argomento sono rilevate", () => {
  const code = replaceOnce(
    from(literal),
    '.args(["--inspect-child", "nome con spazi * $HOME | >"])',
    '.args(["--inspect-child", "\\"nome con spazi * $HOME | >\\""])',
  );
  run(code, { panic: /assertion failed/ });
});
