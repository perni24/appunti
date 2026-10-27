import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Python - File e percorsi", "Python - JSON e CSV"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Promemoria/Pagine/" + name + ".md"),
);
const text = (node) => node.value ?? (node.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  let heading;
  const result = new Map();
  for (const node of note.tree.children) {
    if (node.type === "heading") heading = text(node);
    if (node.type === "code" && node.lang === "python") {
      assert.ok(heading);
      assert.ok(!result.has(heading), heading);
      result.set(heading, node.value);
    }
  }
  return result;
});
const bootstrap = String.raw`
import ast
import builtins
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

assert not sys.flags.optimize
request = json.load(sys.stdin)
root = Path(__file__).resolve().parent
source_path = root / "scripts" / "example.py"
tempfile.tempdir = str(root / "files")
source = source_path.read_text(encoding="utf-8")
tree = ast.parse(source, filename=str(source_path))
# Variants replace sample data, not the operations being tested.
for name, value in request.get("inputs", {}).items():
    assignments = [
        node for node in tree.body
        if isinstance(node, ast.Assign) and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name) and node.targets[0].id == name
    ]
    assert len(assignments) == 1, name
    assignments[0].value = ast.parse(repr(value), mode="eval").body
ast.fix_missing_locations(tree)
captured = io.StringIO()
namespace = {
    "__name__": "__main__", "__file__": str(source_path),
    "expect": unittest.TestCase(), "fixture_root": root,
}
with contextlib.redirect_stdout(captured):
    exec(compile(request.get("setup", "pass"), "setup", "exec"), namespace)
    compiled = compile(tree, str(source_path), "exec")
    if request.get("expectedError"):
        with namespace["expect"].assertRaises(getattr(builtins, request["expectedError"])):
            exec(compiled, namespace)
    else:
        exec(compiled, namespace)
    namespace["output"] = captured.getvalue()
    exec(compile(request["probe"], "probe", "exec"), namespace)
assert not list((root / "files").iterdir()), "Temporary files were not cleaned up"
assert not list((root / "work").iterdir()), "Unexpected files in cwd"
print(json.dumps({"output": captured.getvalue()}))
`;
function run(
  i,
  heading,
  probe = "pass",
  inputs = {},
  expectedError,
  setup = "pass",
) {
  assert.ok(blocks[i].has(heading), heading);
  const parent = realpathSync(tmpdir());
  const root = mkdtempSync(join(parent, "appunti-python-file-data-"));
  try {
    for (const dir of ["scripts", "work", "files"]) mkdirSync(join(root, dir));
    writeFileSync(
      join(root, "scripts", "example.py"),
      blocks[i].get(heading),
      "utf8",
    );
    writeFileSync(join(root, "driver.py"), bootstrap, "utf8");
    const result = spawnSync(
      python,
      ["-I", "-X", "utf8", join(root, "driver.py")],
      {
        input: JSON.stringify({ probe, inputs, expectedError, setup }),
        cwd: join(root, "work"),
        encoding: "utf8",
        timeout: 20000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout).output;
  } finally {
    const resolved = realpathSync(root);
    assert.equal(dirname(resolved), parent);
    assert.ok(basename(resolved).startsWith("appunti-python-file-data-"));
    assert.equal(resolved, root);
    rmSync(resolved, { recursive: true, force: true });
  }
}
test("baseline CPython e 23 snippet autonomi", () => {
  const version = spawnSync(python, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.ifError(version.error);
  assert.equal(version.status, 0);
  assert.match(version.stdout, /3\.12\.10/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [13, 10],
  );
});
for (const [i, name] of names.entries()) {
  test(name + ": metadati e struttura operativa", () => {
    const n = notes[i];
    assert.equal(n.data.title, name);
    assert.equal(n.data.type, "operational-note");
    assert.equal(n.data.status, "non revisionato");
    assert.equal(n.data.publish, true);
    assert.equal(n.data.topic, "Promemoria Python");
    assert.equal(String(n.data.date), "2026-07-30");
    const headings = n.tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    assert.equal(text(headings.find((n) => n.depth === 1)), name);
    for (const h of [
      "Obiettivo",
      "Quando usarlo",
      "Procedura",
      "Snippet",
      "Adattamenti comuni",
      "Debug rapido",
      "Checklist finale",
      "Collegamenti",
      "Fonti",
    ])
      assert.ok(
        headings.some((n) => text(n) === h),
        h,
      );
    for (let at = 1; at < headings.length; at++)
      assert.ok(headings[at].depth <= headings[at - 1].depth + 1);
  });
}
const probes = [
  {
    "Creare un percorso dalla cartella dello script": String.raw`
assert base_dir == Path(__file__).resolve().parent
assert Path(__file__).is_file()
assert Path.cwd().resolve() == fixture_root / "work" and base_dir != Path.cwd().resolve()
assert file_path == base_dir / "data" / "users.txt" and not file_path.exists()
assert output == "users.txt data\nTrue\n"
`,
    "Verificare e scomporre": String.raw`
assert output == "True True False\narchive.tar.gz archive.tar .gz\nTrue\n"
assert not file_path.exists()
`,
    "Leggere e riscrivere testo": String.raw`
assert content == "prima\n" and output == "'prima\\n' 'dopo\\n'\n"
assert not file_path.exists()
`,
    "Creare senza sovrascrivere": 'assert file.closed and output == "True\\n"',
    "Aprire con with e aggiungere": String.raw`
assert content == "first\nsecond\n" and file.closed
assert output == "'first\\nsecond\\n' True\n"
`,
    "Leggere riga per riga": String.raw`
assert output == "'  alpha  '\n'beta'\n" and file.closed
`,
    "File binari": String.raw`assert data == b"\x00\xff\r\n" and output == "True 4\n"`,
    Directory: String.raw`assert output == "['result.txt']\n" and not directory.exists()`,
    "Cercare file": String.raw`
assert [p.name for p in direct] == ["a.md"]
assert sorted(p.relative_to(directory).as_posix() for p in recursive) == ["a.md","nested/b.md"]
`,
    "Rinominare e rimuovere": String.raw`
assert output == "False True\nFalse\n"
assert old_path.name == "old.txt" and new_path.name == "new.txt"
assert not new_path.exists() and not directory.exists()
`,
    "Copiare e spostare": String.raw`
assert output == "True False demo\n"
assert not any(p.exists() for p in (source,copied,destination))
`,
    "Directory temporanea e cleanup": String.raw`assert output == "True\nFalse\n" and not path.exists()`,
    "File opzionale assente": String.raw`assert content is None and output == "None\n"`,
  },
  {
    "JSON da stringa": String.raw`
assert data == {"id":1,"active":True,"note":None}
assert json.loads(encoded) == data and output == "1 True None\nTrue\n"
`,
    "JSON formattato": String.raw`
assert json.loads(text) == data
assert text == '{\n  "city": "Forl\u00ec",\n  "z": 1\n}'
assert r"\u00ec" not in text and output == text + "\n"
`,
    "Leggere un file JSON": String.raw`assert data == {"id":1} and file.closed and not path.exists()`,
    "Scrivere un file JSON": String.raw`assert output == "True\n" and file.closed and not path.exists()`,
    "Gestire JSON non valido": String.raw`assert data is None and output == "1 12\n"`,
    "Validare i campi JSON": String.raw`assert enabled is True and output == "True\n"`,
    "Leggere CSV da file": String.raw`
assert users == [{"id":"1","name":"Ada, L."},{"id":"2","name":"Grace\nHopper"}]
assert file.closed and not path.exists()
`,
    "Scrivere CSV": String.raw`
assert users == [{"id":1,"name":"Ada, L."}]
assert restored == [{"id":"1","name":"Ada, L."}] and file.closed
`,
    "Separatore personalizzato": String.raw`assert users == [{"id":"1","name":"Ada; L."}] and file.closed`,
    "Validare colonne e righe CSV": String.raw`assert users == [{"id":1,"name":"Ada"}] and file.closed`,
  },
];
for (const [i, group] of probes.entries()) {
  assert.deepEqual([...blocks[i].keys()], Object.keys(group));
  for (const [heading, probe] of Object.entries(group))
    test("snippet autonomo: " + heading, () => run(i, heading, probe));
}
const edges = [
  [
    0,
    "Creare un percorso dalla cartella dello script",
    "base corrente e componente assoluta",
    String.raw`
relative = Path("data/users.txt")
assert not relative.is_absolute()
assert relative.resolve() == Path.cwd().resolve() / "data" / "users.txt"
absolute = fixture_root / "files"
assert (base_dir / absolute) == absolute
assert (base_dir / "..").resolve() == fixture_root
`,
  ],
  [
    0,
    "Verificare e scomporre",
    "osservazione precedente non garantisce apertura",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "sample.txt"
    path.touch()
    assert path.exists()
    path.unlink()
    with expect.assertRaises(FileNotFoundError): path.read_text(encoding="utf-8")
`,
  ],
  [
    0,
    "Leggere e riscrivere testo",
    "encoding errato e genitore assente",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "bad.txt"
    path.write_bytes(b"\xff")
    with expect.assertRaises(UnicodeDecodeError): path.read_text(encoding="utf-8")
    with expect.assertRaises(FileNotFoundError):
        (Path(directory) / "missing" / "new.txt").write_text("data",encoding="utf-8")
`,
  ],
  [
    0,
    "Creare senza sovrascrivere",
    "x preserva un file esistente",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "existing.txt"
    path.write_text("keep",encoding="utf-8")
    with expect.assertRaises(FileExistsError):
        with path.open("x",encoding="utf-8") as f: f.write("lost")
    assert path.read_text(encoding="utf-8") == "keep"
`,
  ],
  [
    0,
    "Creare senza sovrascrivere",
    "w tronca e with chiude senza rollback",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "existing.txt"
    path.write_text("old",encoding="utf-8")
    with expect.assertRaises(RuntimeError):
        with path.open("w",encoding="utf-8") as f:
            raise RuntimeError("after truncation")
    assert f.closed and path.read_bytes() == b""
    with expect.assertRaises(RuntimeError):
        with path.open("w",encoding="utf-8") as f:
            f.write("partial")
            raise RuntimeError("after write")
    assert f.closed and path.read_bytes() == b"partial"
`,
  ],
  [
    0,
    "Aprire con with e aggiungere",
    "append crea e non aggiunge newline",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "events.txt"
    with path.open("a",encoding="utf-8") as f: f.write("a")
    with path.open("a",encoding="utf-8") as f: f.write("b")
    assert path.read_bytes() == b"ab"
`,
  ],
  [
    0,
    "Leggere riga per riga",
    "newline universali, spazi e ultima riga",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "mixed.txt"
    path.write_bytes(b" a \r\nb\rc\nlast")
    with path.open(encoding="utf-8") as f:
        rows = [line.removesuffix("\n") for line in f]
    assert rows == [" a ","b","c","last"]
    path.write_bytes(b"")
    with path.open(encoding="utf-8") as f: assert list(f) == []
`,
  ],
  [
    0,
    "File binari",
    "write_bytes sostituisce e xb rifiuta",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "data.bin"
    path.write_bytes(b"12345")
    path.write_bytes(b"\x00")
    assert path.read_bytes() == b"\x00"
    with expect.assertRaises(FileExistsError): path.open("xb")
    with path.open("rb") as f: assert f.read() == b"\x00"
`,
  ],
  [
    0,
    "Directory",
    "exist_ok non tollera un file e parents crea cartelle",
    String.raw`
with TemporaryDirectory() as directory:
    root = Path(directory)
    path = root / "a" / "b"
    path.mkdir(parents=True,exist_ok=True)
    path.mkdir(parents=True,exist_ok=True)
    assert path.is_dir()
    collision = root / "file"
    collision.touch()
    with expect.assertRaises(FileExistsError): collision.mkdir(exist_ok=True)
`,
  ],
  [
    0,
    "Cercare file",
    "glob include directory e ricerca vuota",
    String.raw`
with TemporaryDirectory() as directory:
    root = Path(directory)
    (root / "folder.md").mkdir()
    assert list(root.glob("*.md")) == [root / "folder.md"]
    assert [p for p in root.glob("*.md") if p.is_file()] == []
    assert list(root.rglob("*.csv")) == []
`,
  ],
  [
    0,
    "Rinominare e rimuovere",
    "rinomina conserva old_path, rmdir non ricorsivo",
    String.raw`
with TemporaryDirectory() as directory:
    root = Path(directory)
    old = root / "old.txt"
    old.write_text("keep",encoding="utf-8")
    new = old.rename(root / "new.txt")
    old.unlink(missing_ok=True)
    assert new.read_text(encoding="utf-8") == "keep"
    with expect.assertRaises(OSError): root.rmdir()
    new.unlink()
    with expect.assertRaises(FileNotFoundError): new.unlink()
    new.unlink(missing_ok=True)
`,
  ],
  [
    0,
    "Rinominare e rimuovere",
    "collisione rename sulla piattaforma corrente",
    String.raw`
import os
with TemporaryDirectory() as directory:
    root = Path(directory)
    first, second = root / "first", root / "second"
    first.write_text("one",encoding="utf-8")
    second.write_text("two",encoding="utf-8")
    if os.name == "nt":
        with expect.assertRaises(FileExistsError): first.rename(second)
        assert first.read_text(encoding="utf-8") == "one"
        assert second.read_text(encoding="utf-8") == "two"
    else:
        first.rename(second)
        assert second.read_text(encoding="utf-8") == "one"
`,
  ],
  [
    0,
    "Copiare e spostare",
    "copy2 sovrascrive e rifiuta la stessa sorgente",
    String.raw`
with TemporaryDirectory() as directory:
    root = Path(directory)
    source, target = root / "source", root / "target"
    source.write_bytes(b"source")
    target.write_bytes(b"old")
    copy2(source,target)
    assert target.read_bytes() == b"source" and source.exists()
    # Native CopyFile2 on Windows can raise PermissionError instead of SameFileError.
    with expect.assertRaises(OSError): copy2(source,source)
    assert source.read_bytes() == b"source"
    folder = root / "archive"
    folder.mkdir()
    result = Path(move(target,folder))
    assert result == folder / "target" and result.read_bytes() == b"source"
    assert source.exists() and not target.exists()
`,
  ],
  [
    0,
    "Directory temporanea e cleanup",
    "cleanup anche su eccezione",
    String.raw`
with expect.assertRaises(RuntimeError):
    with TemporaryDirectory() as directory:
        file = Path(directory) / "temporary.txt"
        file.write_text("demo",encoding="utf-8")
        raise RuntimeError("test")
assert not Path(directory).exists()
`,
  ],
  [
    1,
    "JSON da stringa",
    "tipi trasformati e radici non dict",
    String.raw`
assert json.loads("[1,null]") == [1,None]
assert json.loads("true") is True
assert json.loads(json.dumps((1,2))) == [1,2]
assert json.loads(json.dumps({1:"one"})) == {"1":"one"}
with expect.assertRaises(TypeError): json.dumps({1,2})
`,
  ],
  [
    1,
    "JSON formattato",
    "NaN e infinito rifiutati solo nella scrittura",
    String.raw`
import math
for value in (float("nan"),float("inf"),float("-inf")):
    with expect.assertRaises(ValueError): json.dumps(value,allow_nan=False)
assert math.isnan(json.loads("NaN"))
assert math.isinf(json.loads("Infinity"))
assert json.loads('{"id":1,"id":2}') == {"id":2}
`,
  ],
  [
    1,
    "Leggere un file JSON",
    "file mancante, encoding e BOM",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "missing.json"
    with expect.assertRaises(FileNotFoundError): path.open(encoding="utf-8")
    path.write_bytes(b"\xff")
    with path.open(encoding="utf-8") as f:
        with expect.assertRaises(UnicodeDecodeError): json.load(f)
    path.write_bytes(b"\xef\xbb\xbf{\"id\":1}")
    with path.open(encoding="utf-8") as f:
        with expect.assertRaises(json.JSONDecodeError): json.load(f)
    with path.open(encoding="utf-8-sig") as f: assert json.load(f) == {"id":1}
`,
  ],
  [
    1,
    "Scrivere un file JSON",
    "destinazione esistente e output parziale",
    String.raw`
with TemporaryDirectory() as directory:
    path = Path(directory) / "data.json"
    path.write_text("keep",encoding="utf-8")
    with expect.assertRaises(FileExistsError): path.open("x",encoding="utf-8")
    assert path.read_text(encoding="utf-8") == "keep"
    path.unlink()
    with expect.assertRaises(TypeError):
        with path.open("x",encoding="utf-8") as f:
            json.dump({"ok":1,"bad":object()},f)
    assert f.closed and path.read_text(encoding="utf-8").startswith('{"ok": 1')
    with expect.assertRaises(json.JSONDecodeError): json.loads(path.read_text(encoding="utf-8"))
`,
  ],
  [
    1,
    "Scrivere un file JSON",
    "dump ripetuto non crea un documento JSON",
    String.raw`
from io import StringIO
with StringIO() as stream:
    json.dump({"id":1},stream)
    json.dump({"id":2},stream)
    with expect.assertRaises(json.JSONDecodeError): json.loads(stream.getvalue())
`,
  ],
  [
    1,
    "Gestire JSON non valido",
    "input vuoto e forma valida non conforme allo schema",
    String.raw`
with expect.assertRaises(json.JSONDecodeError): json.loads("")
assert json.loads('{"enabled":"true"}') == {"enabled":"true"}
`,
  ],
  [
    1,
    "Leggere CSV da file",
    "nessuna conversione automatica e righe incomplete",
    String.raw`
from io import StringIO
with StringIO("id,name\n1\n2,Ada,extra\n",newline="") as f:
    rows = list(csv.DictReader(f))
assert rows == [{"id":"1","name":None},{"id":"2","name":"Ada",None:["extra"]}]
assert all(type(row["id"]) is str for row in rows)
`,
  ],
  [
    1,
    "Scrivere CSV",
    "campi mancanti, None ed extra",
    String.raw`
from io import StringIO
with StringIO(newline="") as f:
    w = csv.DictWriter(f,fieldnames=["id","name"])
    w.writeheader()
    w.writerows([{"id":1},{"id":2,"name":None}])
    f.seek(0)
    assert list(csv.DictReader(f)) == [{"id":"1","name":""},{"id":"2","name":""}]
    with expect.assertRaises(ValueError): w.writerow({"id":3,"extra":True})
`,
  ],
  [
    1,
    "Scrivere CSV",
    "virgolette, virgole, CRLF e formule non neutralizzate",
    String.raw`
from io import StringIO
values = [{"id":1,"name":'Ada, "L"\r\nnew'},{"id":2,"name":"=1+1"}]
with StringIO(newline="") as f:
    w = csv.DictWriter(f,fieldnames=["id","name"])
    w.writeheader()
    w.writerows(values)
    f.seek(0)
    rows = list(csv.DictReader(f))
assert rows[0]["name"] == values[0]["name"] and rows[1]["name"] == "=1+1"
`,
  ],
  [
    1,
    "Separatore personalizzato",
    "BOM e dialetto non sono schema",
    String.raw`
with StringIO("\ufeffid;name\n1;Ada\n",newline="") as f:
    assert csv.DictReader(f,delimiter=";").fieldnames == ["\ufeffid","name"]
assert b"\xef\xbb\xbfid".decode("utf-8-sig") == "id"
with StringIO("id;name\n1;Ada\n",newline="") as f:
    assert csv.DictReader(f).fieldnames == ["id;name"]
`,
  ],
];
for (const [i, heading, label, probe] of edges)
  test("caso limite: " + label, () => run(i, heading, probe));

for (const value of [
  "[]",
  "null",
  "true",
  "{}",
  '{"enabled":1}',
  '{"enabled":"true"}',
  '{"enabled":null}',
  '{"enabled":true,"extra":1}',
])
  test("schema JSON rifiuta: " + value, () =>
    run(1, "Validare i campi JSON", "pass", { text: value }, "ValueError"),
  );
test("schema JSON accetta false", () =>
  run(1, "Validare i campi JSON", "assert enabled is False", {
    text: '{"enabled":false}',
  }));
test("schema del demo non rifiuta chiavi JSON duplicate", () =>
  run(1, "Validare i campi JSON", "assert enabled is True", {
    text: '{"enabled":false,"enabled":true}',
  }));
for (const [label, value] of [
  ["vuoto", ""],
  ["colonne invertite", "name,id\nAda,1\n"],
  ["intestazione duplicata", "id,id\n1,2\n"],
  ["colonne extra", "id,name,extra\n1,Ada,x\n"],
  ["campo mancante", "id,name\n1\n"],
  ["campo extra", "id,name\n1,Ada,x\n"],
  ["ID vuoto", "id,name\n,Ada\n"],
  ["ID decimale", "id,name\n1.2,Ada\n"],
  ["ID zero", "id,name\n0,Ada\n"],
  ["ID negativo", "id,name\n-1,Ada\n"],
  ["nome vuoto", "id,name\n1,   \n"],
])
  test("schema CSV rifiuta: " + label, () =>
    run(
      1,
      "Validare colonne e righe CSV",
      "pass",
      { text: value },
      "ValueError",
    ),
  );
for (const [label, value, probe] of [
  ["sola intestazione", "id,name\n", "assert users == []"],
  [
    "spazi e segno",
    "id,name\n +1 , Ada \n",
    'assert users == [{"id":1,"name":"Ada"}]',
  ],
  [
    "ID duplicato",
    "id,name\n1,Ada\n1,Grace\n",
    "assert len(users) == 2 and users[0]['id'] == users[1]['id'] == 1",
  ],
])
  test("schema CSV accetta: " + label, () =>
    run(1, "Validare colonne e righe CSV", probe, { text: value }),
  );
test("file opzionale non nasconde PermissionError simulato", () =>
  run(
    0,
    "File opzionale assente",
    "pass",
    {},
    "PermissionError",
    'from unittest.mock import patch\npatcher=patch("pathlib.Path.read_text",side_effect=PermissionError("blocked"))\npatcher.start()',
  ));
