import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Subprocess",
  "CLI con argparse",
  "SQLite con sqlite3",
  "Networking base",
  "Configurazione e Variabili d Ambiente",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
const bootstrap = String.raw`
import contextlib, io, json, os, sys, types, unittest
from pathlib import Path
from tempfile import TemporaryDirectory
assert sys.version_info[:2] == (3, 12)
assert not sys.flags.optimize
request = json.load(sys.stdin)
output, errors = io.StringIO(), io.StringIO()
module = types.ModuleType("note_example")
sys.modules[module.__name__] = module
namespace = module.__dict__
namespace.update(expect=unittest.TestCase(), Path=Path, TemporaryDirectory=TemporaryDirectory,
                 contextlib=contextlib, io=io, source_code=request["code"],
                 captured_output=output, original_env=dict(os.environ), os=os, sys=sys)
with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "probe", "exec"), namespace)
print(json.dumps({"output": output.getvalue(), "errors": errors.getvalue(), "version": sys.version}))
`;
function run(note, block, probe = "pass") {
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({
      code: blocks[note][block],
      probe,
      name: names[note] + ":" + block,
    }),
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 2 ** 20,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
const expected = [
  [
    "assert result.stdout.strip() == message and result.returncode == 0",
    'assert mode == "preview" and received == "contenuto\\n"',
    "pass",
    "assert callable(current_branch)",
    "assert process.poll() is not None and process.stdout.closed and process.stderr.closed",
  ],
  [
    "assert args.limit == 3 and args.verbose and args.color is False",
    'assert args.handler(args) == "run: demo"',
    "assert callable(main) and callable(convert_file)",
  ],
  [
    'assert rows == [("draft",)]\\nwith expect.assertRaises(sqlite3.ProgrammingError): connection.execute("SELECT 1")',
    'assert count == 1 and dict(row)["name"] == "Luca"',
    'assert saved == ("backup",) and not target.exists()',
  ],
  [
    'assert url.endswith("?q=python+%26+sqlite&page=2")',
    "assert callable(get_json)",
    "assert callable(fetch_message)",
    "assert callable(is_port_open)",
  ],
  [
    'assert bool("false") and example["DEBUG"] == ""',
    "assert callable(load_settings)",
  ],
];
for (let i = 0; i < notes.length; i++) {
  test(names[i] + ": metadati, fonti e numero degli esempi", () => {
    assert.equal(blocks[i].length, expected[i].length);
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.equal(notes[i].data.type, "technical-note");
    assert.equal(notes[i].data.title, names[i]);
    assert.match(notes[i].body, /## Fonti/);
    assert.match(notes[i].body, /3\.12\.10/);
  });
  for (let j = 0; j < expected[i].length; j++) {
    test(names[i] + ": esegue blocco " + (j + 1), () =>
      run(i, j, expected[i][j].replaceAll("\\nwith", "\nwith")),
    );
  }
}
const cases = [
  [
    "processo: errore non zero e diagnostica catturata",
    0,
    2,
    String.raw`
assert "7\ninvalid input\n" in captured_output.getvalue()
`,
  ],
  [
    "processo: errore di avvio distinto da exit code",
    0,
    0,
    String.raw`
with TemporaryDirectory() as directory:
    with expect.assertRaises(FileNotFoundError):
        subprocess.run([str(Path(directory) / "missing-executable")], check=True, timeout=2)
`,
  ],
  [
    "processo: env sostitutivo e stdin non alterano il genitore",
    0,
    1,
    String.raw`
assert child_env is not os.environ
assert Path.cwd().resolve() != Path(child_cwd).resolve()
assert dict(os.environ) == original_env
`,
  ],
  [
    "Git: branch, HEAD detached, repository assente",
    0,
    3,
    String.raw`
import os
git = shutil.which("git")
assert git is not None
with TemporaryDirectory() as directory:
    root = Path(directory)
    repository = root / "repo"
    clean = os.environ.copy()
    clean["GIT_CONFIG_NOSYSTEM"] = "1"
    clean["GIT_CONFIG_GLOBAL"] = os.devnull
    def git_run(*args):
        return subprocess.run([git, "-C", str(repository), *args], check=True,
                              capture_output=True, env=clean, timeout=5)
    subprocess.run([git, "init", "-q", "--initial-branch=main", str(repository)],
                   check=True, capture_output=True, env=clean, timeout=5)
    assert current_branch(repository) == "main"
    git_run("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
            "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture")
    git_run("switch", "--detach", "-q", "HEAD")
    assert current_branch(repository) is None
    with expect.assertRaises(subprocess.CalledProcessError):
        current_branch(root)
`,
  ],
  [
    "CLI: errori di parsing, help e nessuna abbreviazione",
    1,
    0,
    String.raw`
for argv in [[], ["in", "--limit", "0"], ["in", "--limit", "x"],
             ["in", "--format", "xml"], ["in", "--verb"]]:
    with expect.assertRaises(SystemExit) as error:
        build_parser().parse_args(argv)
    assert error.exception.code == 2
with expect.assertRaises(SystemExit) as error:
    build_parser().parse_args(["--help"])
assert error.exception.code == 0
args = build_parser().parse_args(["--", "-file"])
assert str(args.path) == "-file" and args.limit == 10 and args.color
assert positive_int("+1") == 1 and positive_int("1_0") == 10
`,
  ],
  [
    "CLI: sottocomando obbligatorio e dispatch check",
    1,
    1,
    String.raw`
with expect.assertRaises(SystemExit) as error:
    build_parser().parse_args([])
assert error.exception.code == 2
args = build_parser().parse_args(["check"])
assert args.handler(args) == "check: ok"
`,
  ],
  [
    "CLI: exit_on_error e distinto dall'uscita per help",
    1,
    0,
    String.raw`
parser = argparse.ArgumentParser(exit_on_error=False)
parser.add_argument("--count", type=int)
with expect.assertRaises(argparse.ArgumentError):
    parser.parse_args(["--count", "x"])
with expect.assertRaises(argparse.ArgumentError):
    parser.parse_args(["--unknown"])
with expect.assertRaises(SystemExit) as error:
    parser.parse_args(["--help"])
assert error.exception.code == 0
`,
  ],
  [
    "CLI: conversione, target esistente e overwrite esplicito",
    1,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    source.write_text("Straße\n", encoding="utf-8")
    assert main([str(source), str(target)]) == 0
    assert target.read_text(encoding="utf-8") == "STRASSE\n"
    target.write_text("keep", encoding="utf-8")
    assert main([str(source), str(target)]) == 1
    assert target.read_text(encoding="utf-8") == "keep"
    assert main([str(source), str(target), "--overwrite"]) == 0
    assert target.read_text(encoding="utf-8") == "STRASSE\n"
`,
  ],
  [
    "CLI: stesso percorso e hard link non troncano il sorgente",
    1,
    2,
    String.raw`
import os
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "alias"
    source.write_text("keep", encoding="utf-8")
    assert main([str(source), str(source), "--overwrite"]) == 1
    os.link(source, target)
    assert main([str(source), str(target), "--overwrite"]) == 1
    assert source.read_text(encoding="utf-8") == "keep"
`,
  ],
  [
    "CLI: input mancante, UTF-8 errato e directory non creano output",
    1,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    source, target = Path(directory) / "in", Path(directory) / "out"
    assert main([str(source), str(target)]) == 1 and not target.exists()
    source.write_bytes(b"\xff")
    assert main([str(source), str(target)]) == 1 and not target.exists()
    assert main([directory, str(target)]) == 1 and not target.exists()
`,
  ],
  [
    "CLI: entry point reale e codici di uscita",
    1,
    2,
    String.raw`
import subprocess, sys
with TemporaryDirectory() as directory:
    script = Path(directory) / "uppercase.py"
    script.write_text(source_code, encoding="utf-8")
    result = subprocess.run([sys.executable, "-I", str(script), "--help"],
                            capture_output=True, text=True, timeout=5)
    assert result.returncode == 0 and "--overwrite" in result.stdout
    result = subprocess.run([sys.executable, "-I", str(script)],
                            capture_output=True, text=True, timeout=5)
    assert result.returncode == 2 and result.stderr
`,
  ],
  [
    "SQLite: vincoli UNIQUE, CHECK, NOT NULL e foreign key",
    2,
    1,
    String.raw`
with closing(open_database()) as db:
    with db:
        create_schema(db)
        uid = create_user(db, "A", "a@example.com")
    for name, email in [("B", "a@example.com"), (" ", "b@example.com"),
                        (None, "c@example.com"), ("C", None)]:
        with expect.assertRaises(sqlite3.IntegrityError):
            with db:
                create_user(db, name, email)
    with expect.assertRaises(sqlite3.IntegrityError):
        with db:
            db.execute("INSERT INTO tasks(user_id,title) VALUES (?,?)", (uid+1, "bad"))
    with db:
        db.execute("INSERT INTO tasks(user_id,title) VALUES (?,?)", (uid, "ok"))
    assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 1
`,
  ],
  [
    "SQLite: parametri preservano SQL come dati e fetchone assente",
    2,
    1,
    String.raw`
with closing(open_database()) as db:
    with db:
        create_schema(db)
        name = "x'); DROP TABLE users;--"
        uid = create_user(db, name, "x@example.com")
    assert db.execute("SELECT name FROM users WHERE id=?", (uid,)).fetchone()[0] == name
    assert db.execute("SELECT id FROM users WHERE id=:id", {"id": -1}).fetchone() is None
`,
  ],
  [
    "SQLite: commit persiste, close non conferma scritture",
    2,
    1,
    String.raw`
with TemporaryDirectory() as directory:
    path = str(Path(directory) / "app.db")
    with closing(open_database(path)) as db:
        with db:
            create_schema(db)
            create_user(db, "A", "a@example.com")
        create_user(db, "B", "b@example.com")
    with closing(open_database(path)) as db:
        assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 1
`,
  ],
  [
    "SQLite: with non chiude, autocommit True non annulla un gruppo",
    2,
    0,
    String.raw`
with closing(sqlite3.connect(":memory:", autocommit=True)) as db:
    db.execute("CREATE TABLE sample(value TEXT)")
    with expect.assertRaises(RuntimeError):
        with db:
            db.execute("INSERT INTO sample VALUES ('kept')")
            raise RuntimeError("failure")
    assert db.execute("SELECT count(*) FROM sample").fetchone()[0] == 1
`,
  ],
  [
    "SQLite: foreign_keys dentro una transazione non si abilita",
    2,
    1,
    String.raw`
with closing(sqlite3.connect(":memory:", autocommit=True)) as db:
    db.execute("PRAGMA foreign_keys = OFF")
    db.autocommit = False
    db.execute("PRAGMA foreign_keys = ON")
    assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 0
`,
  ],
  [
    "SQLite: errore soppresso nel blocco puo confermare la prima scrittura",
    2,
    1,
    String.raw`
with closing(open_database()) as db:
    with db:
        create_schema(db)
    with db:
        create_user(db, "A", "a@example.com")
        try:
            create_user(db, "B", "a@example.com")
        except sqlite3.IntegrityError:
            pass
    assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 1
`,
  ],
  [
    "SQLite: connessione di sola lettura impedisce scritture",
    2,
    2,
    String.raw`
with TemporaryDirectory() as directory:
    file = Path(directory) / "app.db"
    with closing(sqlite3.connect(file, autocommit=True)) as db:
        db.execute("CREATE TABLE sample(value TEXT)")
    with closing(sqlite3.connect(file.resolve().as_uri()+"?mode=ro", uri=True,
                                 autocommit=True)) as db:
        with expect.assertRaises(sqlite3.OperationalError):
            db.execute("INSERT INTO sample VALUES ('bad')")
`,
  ],
  [
    "TCP: recv_exact gestisce frammentazione deterministica e EOF",
    3,
    2,
    String.raw`
class Fragments:
    def __init__(self, data):
        self.data = bytearray(data)
    def recv(self, size):
        data = self.data[:min(size, 1)]
        del self.data[:len(data)]
        return bytes(data)
assert recv_exact(Fragments(b"abcd"), 4) == b"abcd"
assert recv_exact(Fragments(b""), 0) == b""
with expect.assertRaises(EOFError):
    recv_exact(Fragments(b"x"), 2)
with expect.assertRaises(ValueError):
    recv_exact(Fragments(b""), -1)
`,
  ],
  [
    "config: default e immutabilita senza stampare URL",
    4,
    1,
    String.raw`
from dataclasses import FrozenInstanceError
env = {"DATABASE_URL": "postgresql://secret-value"}
settings = load_settings(env)
assert settings.port == 8000 and settings.debug is False
assert "secret-value" not in repr(settings)
assert env == {"DATABASE_URL": "postgresql://secret-value"}
with expect.assertRaises(FrozenInstanceError):
    settings.port = 9000
`,
  ],
  [
    "config: booleani riconosciuti e input errati",
    4,
    1,
    String.raw`
for value in ["true", "1", "YES", " on "]:
    assert parse_bool(value) is True
for value in ["false", "0", "No", " off "]:
    assert parse_bool(value) is False
for value in ["", "tru", "2", "none"]:
    with expect.assertRaises(ValueError):
        parse_bool(value)
`,
  ],
  [
    "config: limiti e formato ASCII delle porte",
    4,
    1,
    String.raw`
for value, expected in [("1",1), ("65535",65535), ("0080",80)]:
    assert parse_port(value) == expected
for value in ["0", "65536", "-1", "+1", " 80", "80 ", "1_0", "８０", ""]:
    with expect.assertRaises(ValueError):
        parse_port(value)
`,
  ],
  [
    "config: obbligatorieta, valori vuoti e nessun segreto negli errori",
    4,
    1,
    String.raw`
for env in [{}, {"DATABASE_URL": ""}, {"DATABASE_URL": "  "},
            {"DATABASE_URL": "secret", "PORT": ""},
            {"DATABASE_URL": "secret", "DEBUG": "invalid"}]:
    with expect.assertRaises(ValueError) as error:
        load_settings(env)
    assert "secret" not in str(error.exception)
`,
  ],
  [
    "config: CLI prevale anche con False e ambiente non valido",
    4,
    1,
    String.raw`
env = {"DATABASE_URL": "demo", "DEBUG": "typo", "PORT": "invalid"}
settings = load_settings(env, cli_debug=False, cli_port="9000")
assert settings.debug is False and settings.port == 9000
assert main(["--no-debug", "--port", "9000"], env) == 0
assert main([], {}) == 2
assert "port=9000 debug=False" in captured_output.getvalue()
`,
  ],
  [
    "config: entry point eredita ambiente e non carica .env",
    4,
    1,
    String.raw`
import subprocess
with TemporaryDirectory() as directory:
    script = Path(directory) / "app.py"
    script.write_text(source_code, encoding="utf-8")
    (Path(directory) / ".env").write_text("DATABASE_URL=not-automatic\n", encoding="utf-8")
    env = os.environ.copy()
    for key in ["DATABASE_URL", "DEBUG", "PORT"]:
        env.pop(key, None)
    result = subprocess.run([sys.executable, "-I", str(script)], cwd=directory,
                            env=env, capture_output=True, text=True, timeout=5)
    assert result.returncode == 2
    env.update(DATABASE_URL="secret", DEBUG="true", PORT="8000")
    result = subprocess.run([sys.executable, "-I", str(script), "--no-debug"],
                            cwd=directory, env=env, capture_output=True, text=True, timeout=5)
    assert result.returncode == 0 and result.stdout.strip() == "port=8000 debug=False"
    assert "secret" not in result.stdout + result.stderr
`,
  ],
];
for (const [name, note, block, probe] of cases)
  test(name, () => run(note, block, probe));

const httpFixture = String.raw`
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

@contextlib.contextmanager
def http_fixture(body=b'{"ok":true}', status=200, content_type="application/json",
                 encoding="identity", wait=False):
    release = threading.Event()
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if wait:
                release.wait(3)
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Encoding", encoding)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
        def log_message(self, *args):
            pass
    with ThreadingHTTPServer(("127.0.0.1", 0), Handler) as server:
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01})
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}/"
        finally:
            release.set()
            server.shutdown()
            thread.join(5)
            assert not thread.is_alive()
os.environ["no_proxy"] = "*"
`;
const httpCases = [
  [
    "HTTP JSON: successo e limite esatto",
    String.raw`
with http_fixture() as url:
    assert get_json(url, max_bytes=11) == {"ok": True}
`,
  ],
  [
    "HTTP JSON: corpo grande, tipo e compressione non ammessi",
    String.raw`
with http_fixture() as url:
    with expect.assertRaises(ValueError):
        get_json(url, max_bytes=10)
for options in [{"content_type":"text/plain"}, {"encoding":"gzip"}]:
    with http_fixture(**options) as url:
        with expect.assertRaises(ValueError):
            get_json(url)
`,
  ],
  [
    "HTTP JSON: errori HTTP distinti da connessione",
    String.raw`
with http_fixture(status=404) as url:
    with expect.assertRaisesRegex(RuntimeError, "HTTP 404") as error:
        get_json(url)
    assert isinstance(error.exception.__cause__, HTTPError)
    assert error.exception.__cause__.fp.closed
import socket
with socket.socket() as reserved:
    reserved.bind(("127.0.0.1", 0))
    url = f"http://127.0.0.1:{reserved.getsockname()[1]}/"
    with expect.assertRaisesRegex(RuntimeError, "Connessione") as error:
        get_json(url, timeout=0.1)
    assert isinstance(error.exception.__cause__, URLError)
`,
  ],
  [
    "HTTP JSON: JSON/UTF-8/schema errati e protocollo vietato",
    String.raw`
for body in [b"[]", b"null", b"broken", b"\xff"]:
    with http_fixture(body=body) as url:
        with expect.assertRaises((ValueError, UnicodeError)):
            get_json(url)
with expect.assertRaises(ValueError):
    get_json("file:///private")
with expect.assertRaises(ValueError):
    get_json("https://example.invalid", max_bytes=0)
`,
  ],
  [
    "HTTP JSON: timeout reale senza richiesta esterna",
    String.raw`
with http_fixture(wait=True) as url:
    with expect.assertRaises((TimeoutError, URLError, RuntimeError)):
        get_json(url, timeout=0.05)
`,
  ],
];
for (const [name, probe] of httpCases)
  test(name, () => run(3, 1, httpFixture + probe));

const tcpFixture = String.raw`
import threading
@contextlib.contextmanager
def tcp_fixture(payload, wait=False):
    release = threading.Event()
    failures = []
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        server.listen(1)
        server.settimeout(3)
        def serve():
            try:
                conn, address = server.accept()
                with conn:
                    conn.settimeout(3)
                    request = bytearray()
                    while not request.endswith(b"\n"):
                        part = conn.recv(4)
                        if not part:
                            return
                        request.extend(part)
                    assert request == b"GET\n"
                    if wait:
                        release.wait(3)
                    else:
                        for part in payload:
                            conn.sendall(part)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
            except BaseException as error:
                failures.append(error)
        thread = threading.Thread(target=serve)
        thread.start()
        try:
            yield server.getsockname()
        finally:
            release.set()
            thread.join(5)
            assert not thread.is_alive()
            assert not failures, failures
`;
const tcpCases = [
  [
    "TCP reale: framing, Unicode e messaggio vuoto",
    String.raw`
data = "città".encode("utf-8")
with tcp_fixture([len(data).to_bytes(4,"big"), data[:5], data[5:]]) as address:
    assert fetch_message(*address) == "città"
with tcp_fixture([b"\0\0\0\0"]) as address:
    assert fetch_message(*address) == ""
`,
  ],
  [
    "TCP reale: EOF prematuro nell'header e nel corpo",
    String.raw`
for payload in [[b"\0\0"], [(4).to_bytes(4,"big"), b"hi"]]:
    with tcp_fixture(payload) as address:
        with expect.assertRaises(EOFError):
            fetch_message(*address)
`,
  ],
  [
    "TCP reale: limite e decodifica",
    String.raw`
with tcp_fixture([(100).to_bytes(4,"big")]) as address:
    with expect.assertRaisesRegex(ValueError, "grande"):
        fetch_message(*address, max_bytes=10)
with tcp_fixture([(1).to_bytes(4,"big"), b"\xff"]) as address:
    with expect.assertRaises(UnicodeDecodeError):
        fetch_message(*address)
`,
  ],
  [
    "TCP reale: timeout e rilascio",
    String.raw`
with tcp_fixture([], wait=True) as address:
    with expect.assertRaises(TimeoutError):
        fetch_message(*address, timeout=0.05)
`,
  ],
];
for (const [name, probe] of tcpCases)
  test(name, () => run(3, 2, tcpFixture + probe));
test("diagnostica TCP: porta in ascolto e non in ascolto", () =>
  run(
    3,
    3,
    String.raw`
with socket.socket() as listener:
    listener.bind(("127.0.0.1", 0))
    listener.listen(1)
    assert is_port_open(*listener.getsockname(), timeout=1)
    conn, _ = listener.accept()
    conn.close()
with socket.socket() as reserved:
    reserved.bind(("127.0.0.1", 0))
    assert is_port_open(*reserved.getsockname(), timeout=0.05) is False
`,
  ));
