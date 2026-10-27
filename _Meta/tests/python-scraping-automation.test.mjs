import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

assert.ok(
  process.env.PYTHON_AUTOMATION_TOOLS,
  "Set PYTHON_AUTOMATION_TOOLS; see README.",
);
const python = join(
  process.env.PYTHON_AUTOMATION_TOOLS,
  "Scripts",
  "python.exe",
);
const temp = realpathSync(tmpdir());
const root = mkdtempSync(join(temp, "appunti-python-automation-test-"));
const env = { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" };
delete env.PYTHONPATH;
delete env.PYTHONHOME;
after(() => {
  const actual = realpathSync(root),
    rel = relative(temp, actual);
  assert.ok(
    rel &&
      !rel.startsWith("..") &&
      !isAbsolute(rel) &&
      actual.includes("appunti-python-automation-test-"),
  );
  rmSync(actual, { recursive: true, force: true });
});
const names = ["Scraping con BeautifulSoup", "Automazione file e script"];
const notes = names.map((n) =>
  parseNote("Programmazione/Python/Pagine/" + n + ".md"),
);
const dirs = names.map((_, i) => join(root, String(i)));
dirs.forEach((d) => mkdirSync(d));
const files = [
  ["extract_page.py", "fetch_page.py"],
  ["rename_texts.py", "automation_demo.py"],
];
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
for (let i = 0; i < 2; i++)
  for (const file of files[i]) {
    const nodes = notes[i].tree.children;
    const at = nodes.findIndex((n) => n.type === "heading" && text(n) === file);
    assert.ok(at >= 0, file);
    const code = nodes.slice(at + 1).find((n) => n.type === "code");
    assert.equal(code.lang, "python");
    writeFileSync(join(dirs[i], file), code.value + "\n");
  }
function py(i, args, status = 0) {
  const result = spawnSync(python, ["-X", "utf8", ...args], {
    cwd: dirs[i],
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 2 ** 20,
  });
  assert.ifError(result.error);
  assert.equal(result.status, status, result.stdout + result.stderr);
  return result;
}
function probe(i, code) {
  return py(i, ["-c", "import unittest\nexpect=unittest.TestCase()\n" + code]);
}
function cases(i, setup, rows) {
  for (const [label, code] of rows)
    test(names[i] + ": " + label, () => probe(i, setup + "\n" + code));
}
test("baseline e versioni", () =>
  probe(
    0,
    String.raw`
import sys, importlib.metadata as m
assert sys.version_info[:3] == (3, 12, 10)
for name, version in {"beautifulsoup4":"4.15.0", "soupsieve":"3.0.4", "requests":"2.34.2"}.items():
    assert m.version(name) == version
`,
  ));
test("quattro blocchi completi e gerarchia Markdown", () => {
  for (const note of notes) {
    assert.equal(
      note.tree.children.filter((n) => n.type === "code" && n.lang === "python")
        .length,
      2,
    );
    const headings = note.tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    for (let i = 1; i < headings.length; i++)
      assert.ok(headings[i].depth <= headings[i - 1].depth + 1);
  }
});
test("demo parser offline", () => {
  const result = JSON.parse(py(0, ["extract_page.py"]).stdout);
  assert.equal(result.title, "Guida Python");
  assert.deepEqual(
    result.links.map((l) => l.url),
    ["https://example.org/intro", "https://docs.python.org/3/"],
  );
});
test("help downloader", () =>
  assert.match(py(0, ["fetch_page.py", "--help"]).stdout, /url/));
test("downloader rifiuta URL prima della rete", () =>
  assert.match(
    py(0, ["fetch_page.py", "file:///secret"], 1).stderr,
    /ValueError/,
  ));
test("laboratorio filesystem temporaneo", () =>
  assert.match(py(1, ["automation_demo.py"]).stdout, /inventory verified/));
test("help rinomina", () =>
  assert.match(py(1, ["rename_texts.py", "--help"]).stdout, /--apply/));
test("CLI errore directory mancante", () =>
  assert.match(py(1, ["rename_texts.py", "missing"], 1).stderr, /STOP/));
test("CLI argomenti mancanti", () => py(1, ["rename_texts.py"], 2));
cases(0, String.raw`from extract_page import *`, [
  [
    "titolo assente e vuoto distinti",
    String.raw`
assert extract_page(b"", "https://example.org") == {"title":None,"links":[]}
assert extract_page("<h1> </h1>", "https://example.org")["title"] == ""
`,
  ],
  [
    "testo annidato ed entita",
    String.raw`
assert extract_page("<h1>A <b>B</b> &amp; C</h1>", "https://example.org")["title"] == "A B & C"
`,
  ],
  [
    "attributi assenti, schemi e frammenti scartati",
    String.raw`
html = '<a>X</a><a href="">X</a><a href="#x">X</a><a href="javascript:alert(1)">X</a><a href="mailto:a@b">X</a>'
assert extract_page(html, "https://example.org")["links"] == []
`,
  ],
  [
    "URL relativi, duplicati e query",
    String.raw`
html='<a href="../x?q=1#a">First</a><a href="../x?q=1#b">Second</a><a href="../x?q=2"></a>'
assert extract_page(html, "https://example.org/a/page")["links"] == [
    {"text":"First","url":"https://example.org/x?q=1"},
    {"text":"","url":"https://example.org/x?q=2"}]
`,
  ],
  [
    "link esterni conservati senza visite",
    String.raw`
links=extract_page('<a href="//other.example/a">Other</a>', "https://example.org")["links"]
assert links[0]["url"] == "https://other.example/a"
`,
  ],
  [
    "primo base href e risoluzione relativa",
    String.raw`
html='<base href="/docs/"><base href="https://ignored.example/"><a href="intro">Intro</a>'
assert extract_page(html, "https://example.org/a")["links"][0]["url"] == "https://example.org/docs/intro"
`,
  ],
  [
    "base non valida produce errore",
    String.raw`
with expect.assertRaises(ValueError):
    extract_page('<base href="javascript:alert(1)">', "https://example.org")
`,
  ],
  [
    "porta e credenziali rifiutate",
    String.raw`
for url in ["file:///tmp/x", "/relative", "http://", "https://a:bad/x", "http://a:0", "http://a:99999", "https://u:p@a", "https://exa mple.org"]:
    with expect.assertRaises(ValueError, msg=url):
        web_url(url)
`,
  ],
  [
    "link malformato ignorato",
    String.raw`
html='<a href="http://[">Bad</a><a href="/good">Good</a>'
assert len(extract_page(html, "https://example.org")["links"]) == 1
`,
  ],
  [
    "charset esplicito",
    String.raw`
assert extract_page(b"<h1>Caf\xe9</h1>", "https://example.org", encoding="windows-1252")["title"] == "Caf\u00e9"
`,
  ],
  [
    "meta charset utf8",
    String.raw`
html=b'<meta charset="utf-8"><h1>Caf\xc3\xa9</h1>'
assert extract_page(html, "https://example.org")["title"] == "Caf\u00e9"
`,
  ],
  [
    "JavaScript non eseguito",
    String.raw`
html='<script>document.write("<h1>Dynamic</h1>")</script>'
assert extract_page(html, "https://example.org")["title"] is None
`,
  ],
]);
const httpSetup = String.raw`
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import gzip
import requests
from fetch_page import fetch_page

@contextmanager
def local_server():
    hits=[]
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass
        def do_GET(self):
            hits.append(self.path)
            status=200
            content_type="text/html; charset=utf-8"
            body=b'<h1>Local</h1><a href="next">Next</a>'
            if self.path == "/bad":
                status=503
            elif self.path == "/empty":
                status=204
                body=b""
            elif self.path == "/redirect":
                status=302
            elif self.path == "/json":
                content_type="application/json"
                body=b"{}"
            elif self.path == "/missing-type":
                content_type=None
            elif self.path == "/latin":
                content_type='text/html; charset="windows-1252"'
                body=b"<h1>Caf\xe9</h1>"
            elif self.path == "/meta":
                content_type="text/html"
                body=b'<meta charset="utf-8"><h1>Caf\xc3\xa9</h1>'
            elif self.path == "/gzip":
                body=gzip.compress(b"<h1>" + b"a"*20000 + b"</h1>")
            self.send_response(status)
            if content_type:
                self.send_header("Content-Type", content_type)
            if self.path == "/redirect":
                self.send_header("Location", "/followed")
            if self.path == "/gzip":
                self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
    server=ThreadingHTTPServer(("127.0.0.1",0), Handler)
    thread=Thread(target=lambda: server.serve_forever(poll_interval=0.01))
    thread.start()
    try:
        with requests.Session() as session:
            session.trust_env=False
            yield f"http://127.0.0.1:{server.server_port}", hits, session
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
        assert not thread.is_alive()
`;
cases(0, httpSetup, [
  [
    "GET reale e URL relativo alla risposta",
    String.raw`
with local_server() as (base, hits, session):
    result=fetch_page(session, base+"/guide/page")
    assert result == {"title":"Local","links":[{"text":"Next","url":base+"/guide/next"}]}
    assert hits == ["/guide/page"]
`,
  ],
  [
    "HTTP 503 propagato",
    String.raw`
with local_server() as (base, hits, session):
    with expect.assertRaises(requests.HTTPError):
        fetch_page(session, base+"/bad")
`,
  ],
  [
    "HTTP 204 non accettato",
    String.raw`
with local_server() as (base, hits, session):
    with expect.assertRaisesRegex(ValueError, "204"):
        fetch_page(session, base+"/empty")
`,
  ],
  [
    "redirect non seguito",
    String.raw`
with local_server() as (base, hits, session):
    with expect.assertRaisesRegex(ValueError, "302"):
        fetch_page(session, base+"/redirect")
    assert hits == ["/redirect"]
`,
  ],
  [
    "JSON e Content-Type assente rifiutati",
    String.raw`
with local_server() as (base, hits, session):
    for path in ["/json", "/missing-type"]:
        with expect.assertRaisesRegex(ValueError, "Content-Type"):
            fetch_page(session, base+path)
`,
  ],
  [
    "charset HTTP e meta nel body",
    String.raw`
with local_server() as (base, hits, session):
    for path in ["/latin", "/meta"]:
        assert fetch_page(session, base+path)["title"] == "Caf\u00e9"
`,
  ],
  [
    "limite esatto accettato e superamento rifiutato",
    String.raw`
with local_server() as (base, hits, session):
    size=len(b'<h1>Local</h1><a href="next">Next</a>')
    assert fetch_page(session, base, max_bytes=size)["title"] == "Local"
    with expect.assertRaisesRegex(ValueError, "too large"):
        fetch_page(session, base, max_bytes=size-1)
`,
  ],
  [
    "limite sui byte decompressi",
    String.raw`
with local_server() as (base, hits, session):
    with expect.assertRaisesRegex(ValueError, "too large"):
        fetch_page(session, base+"/gzip", max_bytes=1000)
`,
  ],
]);
cases(
  0,
  String.raw`
from unittest.mock import MagicMock
import requests
from fetch_page import fetch_page
`,
  [
    [
      "limite invalido prima della richiesta",
      String.raw`
session=MagicMock()
for value in [0, -1, True, 1.5, "10"]:
    with expect.assertRaises(ValueError):
        fetch_page(session, "https://example.org", max_bytes=value)
session.get.assert_not_called()
`,
    ],
    [
      "timeout configurato e risposta chiusa dopo errore",
      String.raw`
session=MagicMock()
response=session.get.return_value.__enter__.return_value
response.status_code=200
response.headers={"Content-Type":"text/html"}
response.iter_content.return_value=iter([b"x"*11])
with expect.assertRaises(ValueError):
    fetch_page(session, "https://example.org", max_bytes=10)
session.get.assert_called_once_with("https://example.org", timeout=(3.05,10), allow_redirects=False, stream=True)
session.get.return_value.__exit__.assert_called_once()
`,
    ],
    [
      "errore di rete non trasformato in lista vuota",
      String.raw`
session=MagicMock()
session.get.side_effect=requests.Timeout("simulated")
with expect.assertRaises(requests.Timeout):
    fetch_page(session, "https://example.org")
`,
    ],
  ],
);
const fsSetup = String.raw`
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import errno
import os
import stat
from rename_texts import *
from automation_demo import empty_logs
`;
cases(1, fsSetup, [
  [
    "dry-run conserva nomi e byte",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    original=b"\x00\xffabc"
    (root/"a.txt").write_bytes(original)
    assert add_prefix(root, "done_") == 1
    assert list(root.iterdir()) == [root/"a.txt"]
    assert (root/"a.txt").read_bytes() == original
`,
  ],
  [
    "apply e seconda esecuzione idempotente",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"a.txt").write_bytes(b"content")
    assert add_prefix(root, "done_", apply=True) == 1
    assert add_prefix(root, "done_", apply=True) == 0
    assert (root/"done_a.txt").read_bytes() == b"content"
    assert not (root/"a.txt").exists()
`,
  ],
  [
    "selezione non ricorsiva, ordinata e suffisso case-insensitive",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    for name in ["b.txt", "a.TXT", "ignore.csv", "done_c.txt"]:
        (root/name).touch()
    (root/"dir.txt").mkdir()
    (root/"dir.txt"/"nested.txt").touch()
    resolved, plan=plan_prefix(root, "done_")
    assert resolved == root.resolve()
    assert [src.name for src,dst in plan] == ["a.TXT","b.txt"]
`,
  ],
  [
    "collisione rilevata prima di qualsiasi rinomina",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    for name in ["a.txt","b.txt","done_b.txt"]:
        (root/name).write_text(name)
    with expect.assertRaises(FileExistsError):
        add_prefix(root,"done_",apply=True)
    assert sorted(p.name for p in root.iterdir()) == ["a.txt","b.txt","done_b.txt"]
    assert (root/"done_b.txt").read_text() == "done_b.txt"
`,
  ],
  [
    "directory di destinazione occupata",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"a.txt").touch()
    (root/"done_a.txt").mkdir()
    with expect.assertRaises(FileExistsError):
        plan_prefix(root,"done_")
`,
  ],
  [
    "prefissi vuoti, traversal e caratteri fuori contratto",
    String.raw`
with TemporaryDirectory() as temporary:
    for prefix in ["", "../", "/tmp/", "x\\", ".", "..", "a:b", "a"*33, "\u00e8", " leading"]:
        with expect.assertRaises(ValueError, msg=prefix):
            plan_prefix(temporary,prefix)
`,
  ],
  [
    "directory inesistente, file e root rifiutati",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    with expect.assertRaises(FileNotFoundError):
        checked_directory(root/"missing")
    (root/"file").touch()
    with expect.assertRaises(NotADirectoryError):
        checked_directory(root/"file")
    with expect.assertRaises(ValueError):
        checked_directory(Path(root.anchor))
`,
  ],
  [
    "nessun candidato e un successo",
    String.raw`
with TemporaryDirectory() as temporary:
    assert add_prefix(temporary,"done_",apply=True) == 0
`,
  ],
  [
    "occupied usa lstat anche per link rotti (simulazione)",
    String.raw`
with patch.object(Path,"lstat",return_value=os.stat_result((stat.S_IFLNK,)*10)):
    assert occupied(Path("broken"))
with patch.object(Path,"lstat",side_effect=PermissionError):
    with expect.assertRaises(PermissionError):
        occupied(Path("denied"))
`,
  ],
  [
    "sorgente symlink ignorata tramite lstat (simulazione)",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    source=root/"a.txt"
    source.touch()
    original=Path.lstat
    def fake(path):
        if path == source:
            return os.stat_result((stat.S_IFLNK,)*10)
        return original(path)
    with patch.object(Path,"lstat",fake):
        assert plan_prefix(root,"done_")[1] == []
`,
  ],
  [
    "collisione comparsa dopo il piano fermata al ricontrollo",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    source=root/"a.txt"
    source.write_text("source")
    resolved, plan=plan_prefix(root,"done_")
    plan[0][1].write_text("existing")
    with patch("rename_texts.plan_prefix",return_value=(resolved,plan)):
        with expect.assertRaises(FileExistsError):
            add_prefix(root,"done_",apply=True)
    assert source.read_text() == "source"
    assert plan[0][1].read_text() == "existing"
`,
  ],
  [
    "sorgente rimossa dopo il piano causa errore",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"a.txt").touch()
    resolved,plan=plan_prefix(root,"done_")
    (root/"a.txt").unlink()
    with patch("rename_texts.plan_prefix",return_value=(resolved,plan)):
        with expect.assertRaises(FileNotFoundError):
            add_prefix(root,"done_",apply=True)
`,
  ],
  [
    "errore intermedio lascia operazioni gia completate e log DONE",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"a.txt").touch()
    (root/"b.txt").touch()
    original=Path.rename
    def fail_second(source,target):
        if source.name == "b.txt":
            raise PermissionError(errno.EACCES,"simulated")
        return original(source,target)
    with expect.assertLogs("rename_texts",level="INFO") as captured:
        with patch.object(Path,"rename",fail_second):
            with expect.assertRaises(PermissionError):
                add_prefix(root,"done_",apply=True)
    assert (root/"done_a.txt").exists() and (root/"b.txt").exists()
    assert any("DONE" in row and "a.txt" in row for row in captured.output)
`,
  ],
  [
    "inventario log non modifica ne scende nelle directory",
    String.raw`
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"empty.LOG").touch()
    (root/"active.log").write_text("data")
    (root/"other.txt").touch()
    (root/"nested.log").mkdir()
    (root/"nested.log"/"inner.log").touch()
    assert [p.name for p in empty_logs(root)] == ["empty.LOG"]
    assert (root/"empty.LOG").exists()
    assert (root/"active.log").read_text() == "data"
`,
  ],
  [
    "CLI reale dry-run, apply e ripetizione",
    String.raw`
import subprocess, sys
with TemporaryDirectory() as temporary:
    root=Path(temporary).resolve()
    (root/"a.txt").write_text("data")
    command=[sys.executable,"rename_texts.py",str(root),"--prefix","done_"]
    first=subprocess.run(command,capture_output=True,text=True,check=True)
    assert "PLAN" in first.stderr and (root/"a.txt").exists()
    second=subprocess.run(command+["--apply"],capture_output=True,text=True,check=True)
    assert "DONE" in second.stderr and (root/"done_a.txt").read_text()=="data"
    third=subprocess.run(command+["--apply"],capture_output=True,text=True,check=True)
    assert "candidates: 0" in third.stderr
`,
  ],
]);
test("junction reale rifiutata come directory di lavoro", () => {
  const target = join(root, "junction-target"),
    link = join(root, "junction-link");
  mkdirSync(target);
  symlinkSync(target, link, "junction");
  probe(
    1,
    "from rename_texts import checked_directory\nwith expect.assertRaises(ValueError):\n    checked_directory(" +
      JSON.stringify(link) +
      ")",
  );
});
