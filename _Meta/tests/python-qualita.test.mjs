import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, resolve, dirname, relative, isAbsolute } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tools = process.env.PYTHON_QUALITY_TOOLS;
assert.ok(tools, "Set PYTHON_QUALITY_TOOLS; see README.");
const python = join(
  tools,
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
const pyright = join(tools, "node/node_modules/pyright/index.js");
const names = ["Type Hinting", "Stile", "Testing", "Logging"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const code = (note, lang) =>
  notes[note].tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
const blocks = notes.map((_, i) => code(i, "python"));
const temp = spawnSync(
  python,
  [
    "-I",
    "-c",
    "from pathlib import Path; import tempfile; print(Path(tempfile.gettempdir()).resolve())",
  ],
  { encoding: "utf8", windowsHide: true },
);
assert.equal(temp.status, 0, temp.stderr);
const parent = realpathSync(temp.stdout.trim());
const root = mkdtempSync(join(parent, "appunti-python-quality-test-"));
const env = {
  ...process.env,
  PYTHONUTF8: "1",
  PYTEST_DISABLE_PLUGIN_AUTOLOAD: "1",
};
for (const key of Object.keys(env)) {
  if (
    /^(PYTHONPATH|PYTHONHOME|PYTHONOPTIMIZE|PYTEST_ADDOPTS|COVERAGE_RCFILE|COVERAGE_FILE|MYPYPATH)$/i.test(
      key,
    )
  )
    delete env[key];
}
let fixtureId = 0;
function workspace() {
  const dir = join(root, "case-" + fixtureId++);
  mkdirSync(dir);
  return dir;
}
function put(dir, name, content) {
  const target = resolve(dir, name);
  const rel = relative(root, target);
  assert.ok(rel && !rel.startsWith("..") && !isAbsolute(rel));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content + "\n", "utf8");
  return target;
}
after(() => {
  const target = realpathSync(root);
  assert.equal(dirname(target).toLowerCase(), parent.toLowerCase());
  assert.ok(
    target
      .toLowerCase()
      .startsWith(join(parent, "appunti-python-quality-test-").toLowerCase()),
  );
  rmSync(target, { recursive: true, force: true });
});
function cli(command, args, cwd = root, status = 0, input) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    input,
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 4 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(
    result.status,
    status,
    args.join(" ") + "\n" + result.stdout + result.stderr,
  );
  return {
    out: result.stdout.replace(/\r\n/g, "\n"),
    err: result.stderr.replace(/\r\n/g, "\n"),
  };
}
const bootstrap = String.raw`
import contextlib
import io
import json
import sys
import types
import unittest
assert sys.version_info[:2] == (3, 12) and not sys.flags.optimize
request = json.load(sys.stdin)
module = types.ModuleType("note_example")
sys.modules[module.__name__] = module
namespace = module.__dict__
namespace["expect"] = unittest.TestCase()
out, err = io.StringIO(), io.StringIO()
with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "probe", "exec"), namespace)
sys.stdout.write(json.dumps({"out": out.getvalue(), "err": err.getvalue()}))
`;
function runtime(note, block, probe = "pass") {
  return JSON.parse(
    cli(
      python,
      ["-I", "-X", "utf8", "-c", bootstrap],
      root,
      0,
      JSON.stringify({
        name: names[note] + ":" + block,
        code: blocks[note][block],
        probe,
      }),
    ).out,
  );
}
function check(source, checker, status = 0) {
  const dir = workspace();
  put(dir, "example.py", source);
  if (checker === "mypy")
    return cli(
      python,
      [
        "-m",
        "mypy",
        "--strict",
        "--python-version",
        "3.12",
        "--no-incremental",
        "example.py",
      ],
      dir,
      status,
    );
  put(dir, "pyrightconfig.json", code(0, "json")[0]);
  return cli(
    process.execPath,
    [
      pyright,
      "--project",
      "pyrightconfig.json",
      "--outputjson",
      "--pythonpath",
      python,
    ],
    dir,
    status,
  );
}
function project() {
  const dir = workspace();
  for (const [i, name] of [
    "ports.py",
    "tests/test_ports.py",
    "tests/test_ports_unittest.py",
    "tests/test_environment.py",
    "tests/test_notification.py",
  ].entries()) {
    put(dir, name, blocks[2][i]);
  }
  put(dir, "pyproject.toml", code(2, "toml")[0]);
  return dir;
}
test("baseline, versioni e numero di blocchi", () => {
  assert.deepEqual(
    blocks.map((b) => b.length),
    [8, 4, 5, 6],
  );
  const actual = JSON.parse(
    cli(python, [
      "-I",
      "-c",
      'import json,importlib.metadata as m; print(json.dumps({x:m.version(x) for x in ["mypy","ruff","black","pytest","coverage"]}))',
    ]).out,
  );
  assert.deepEqual(actual, {
    mypy: "2.4.0",
    ruff: "0.17.2",
    black: "26.10.1",
    pytest: "9.1.1",
    coverage: "7.17.0",
  });
  assert.match(cli(process.execPath, [pyright, "--version"]).out, /1\.1\.414/);
});
for (const [i, name] of names.entries()) {
  test("metadati, struttura e fonti: " + name, () => {
    const note = notes[i];
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.type, i === 1 ? "theory-note" : "technical-note");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Python");
    assert.equal(String(note.data.date), "2026-06-03");
    assert.equal(
      note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
        .length,
      1,
    );
    assert.ok(note.body.includes("# " + note.data.title));
    for (const title of i === 1
      ? [
          "Sintesi",
          "Problema che risolve",
          "Concetto chiave",
          "Dettagli importanti",
          "Esempio",
          "Limiti",
          "Errori comuni",
          "Checklist",
          "Collegamenti",
          "Fonti",
        ]
      : [
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
        ])
      assert.ok(note.body.includes("## " + title));
    assert.ok(note.body.includes("3.12.10"));
    assert.match(
      note.body,
      /https:\/\/(docs\.python\.org|peps\.python\.org)\//,
    );
  });
}
const expected = [
  [
    'assert find_user(1) == "Ada" and find_user(99) is None and message == "Unknown user"',
    'assert first([1,2]) == 1 and first(("a","b")) == "a" and point == (3,4)',
    'assert user == {"id":1,"name":"Ada"}',
    'assert sink.messages == ["ready"] and isinstance(sink,Sink)',
    'assert user_id == 7 and type(user_id) is int and can_edit("draft")',
    "assert claimed_text is value and type(claimed_text) is int",
    'assert decode("ok") == decode(b"ok") == "ok"',
    "assert add(2,3,offset=1) == 6",
  ],
  [
    'assert service.format_name(" Ada ") == "Ada"',
    'assert normalize_label(" First Draft ") == "First Draft"',
    'assert calc([{"p":250,"q":2}]) == 500',
    "assert calculate_order_total(items) == 600 and calculate_order_total([]) == 0",
  ],
  [],
  [
    "main()",
    'assert calls == ["computed"] and output.getvalue().strip() == "Processed 3 items"',
    'assert output.getvalue().strip() == "DEBUG ready"',
    'assert "Traceback" in logged and "ValueError" in logged',
    "pass",
    'assert generated == ["app.log","app.log.1","app.log.2"] and not path.exists()',
  ],
];
for (const [note, items] of expected.entries()) {
  for (const [block, probe] of items.entries())
    test(names[note] + ": blocco runtime " + (block + 1), () => {
      const result = runtime(note, block, probe);
      if (note === 3 && block === 0) {
        assert.equal(result.out, "");
        assert.match(result.err, /INFO .* Application started/);
        assert.match(result.err, /DEBUG .* Debug details enabled/);
        assert.match(result.err, /Processing order 42/);
      }
    });
}
for (const checker of ["mypy", "pyright"]) {
  for (const [block, source] of blocks[0].entries())
    test(checker + ": esempio typing " + (block + 1), () =>
      check(source, checker),
    );
}
const negatives = [
  [0, "greet(42)"],
  [1, "bad: str = first([1, 2])"],
  [
    2,
    'bad: UserData = {"id": 1}\nbad_null: UserData = {"id": 1, "name": "Ada", "nickname": None}',
  ],
  [
    3,
    'class Wrong:\n    def write(self, message: int, /) -> None:\n        pass\nnotify(Wrong(), "text")',
  ],
  [
    4,
    'def needs_id(value: UserId) -> int:\n    return value\nneeds_id(7)\ncan_edit("unknown")',
  ],
  [6, "decode(42)"],
  [7, 'add("bad", 3)'],
];
for (const checker of ["mypy", "pyright"]) {
  test(checker + ": rifiuta sette gruppi incompatibili", () => {
    for (const [block, probe] of negatives) {
      const result = check(blocks[0][block] + "\n" + probe, checker, 1);
      if (checker === "pyright")
        assert.ok(JSON.parse(result.out).summary.errorCount > 0);
      else assert.match(result.out, /error:/);
    }
  });
  test(checker + ": object non e Any; lista invariante", () => {
    check("from typing import Any\nvalue: Any = 42\nvalue.upper()\n", checker);
    check("value: object = 42\nvalue.upper()\n", checker, 1);
    check(
      "class Base:\n    pass\nclass Child(Base):\n    pass\nitems: list[Child] = [Child()]\nbase_items: list[Base] = items\n",
      checker,
      1,
    );
  });
}
test("TypedDict: controllo reale, copie, chiavi e None", () =>
  runtime(
    0,
    2,
    String.raw`
source = {"id": 2, "name": " Lin ", "nickname": ""}
result = parse_user(source)
assert result == {"id":2,"name":"Lin","nickname":""} and result is not source
assert source["name"] == " Lin "
for payload, error in [
    ({}, TypeError), ({"id":True,"name":"Ada"}, TypeError),
    ({"id":0,"name":"Ada"}, ValueError), ({"id":1,"name":" "}, ValueError),
    ({"id":1,"name":None}, TypeError),
    ({"id":1,"name":"Ada","nickname":None}, TypeError),
    ({"id":1,"name":"Ada","admin":True}, ValueError)
]:
    with expect.assertRaises(error):
        parse_user(payload)
raw = UserData(id=-1, name="")
assert type(raw) is dict and raw["id"] == -1
`,
  ));
test("Protocol runtime non controlla la firma", () =>
  runtime(
    0,
    3,
    String.raw`
class Wrong:
    def write(self, message: int, /) -> int:
        return message + 1
bad = Wrong()
assert isinstance(bad, Sink)
with expect.assertRaises(TypeError):
    notify(bad, "text")
`,
  ));
test("NewType e Literal non sono validatori", () =>
  runtime(
    0,
    4,
    String.raw`
assert UserId(-1) == -1 and can_edit("unexpected") is False
for bad,error in [(True,TypeError),(-1,ValueError),(0,ValueError),(1.2,TypeError)]:
    with expect.assertRaises(error):
        make_user_id(bad)
`,
  ));
test("generico vuoto e overload con decoding errato", () => {
  runtime(0, 1, "with expect.assertRaises(ValueError):\n    first([])");
  runtime(
    0,
    6,
    'with expect.assertRaises(UnicodeDecodeError):\n    decode(b"\\xff")',
  );
});
test("ParamSpec conserva runtime, metadati e propagazione", () =>
  runtime(
    0,
    7,
    String.raw`
import inspect
assert inspect.signature(add) == inspect.signature(add.__wrapped__)
error = ValueError("same")
@traced
def fail(value):
    raise error
with expect.assertRaises(ValueError) as caught:
    fail(1)
assert caught.exception is error
with expect.assertRaises(TypeError):
    add(1,2,3)
`,
  ));
test("normalizzazione label: contratto ristretto, non email", () =>
  runtime(
    1,
    1,
    String.raw`
assert normalize_label(" A  B ") == "A  B"
for value in ("", " \t\n"):
    with expect.assertRaises(ValueError):
        normalize_label(value)
for value in (None, 1, True):
    with expect.assertRaises(TypeError):
        normalize_label(value)
`,
  ));
test("Ruff: check non modifica, fix e format separati", () => {
  const dir = workspace();
  put(dir, "pyproject.toml", code(1, "toml")[0]);
  const file = put(dir, "example.py", "import os\nx= 1\nprint(x)\n");
  const before = readFileSync(file, "utf8");
  assert.match(cli(python, ["-m", "ruff", "check", "."], dir, 1).out, /F401/);
  cli(python, ["-m", "ruff", "format", "--check", "."], dir, 1);
  assert.equal(readFileSync(file, "utf8"), before);
  cli(python, ["-m", "ruff", "check", "--fix", "."], dir);
  assert.ok(!readFileSync(file, "utf8").includes("import os"));
  cli(python, ["-m", "ruff", "format", "."], dir);
  cli(python, ["-m", "ruff", "check", "."], dir);
  cli(python, ["-m", "ruff", "format", "--check", "."], dir);
  assert.match(readFileSync(file, "utf8"), /x = 1/);
});
test("Ruff: format non ordina gli import, regola I si", () => {
  const dir = workspace();
  put(dir, "pyproject.toml", code(1, "toml")[0]);
  const file = put(
    dir,
    "example.py",
    "import sys\nimport os\n\nprint(sys.version, os.name)\n",
  );
  cli(python, ["-m", "ruff", "format", "."], dir);
  assert.match(cli(python, ["-m", "ruff", "check", "."], dir, 1).out, /I001/);
  cli(python, ["-m", "ruff", "check", "--fix", "."], dir);
  cli(python, ["-m", "ruff", "check", "."], dir);
  assert.ok(
    readFileSync(file, "utf8").indexOf("import os") <
      readFileSync(file, "utf8").indexOf("import sys"),
  );
});
test("Black: check/diff senza scrittura e formattazione reale", () => {
  const dir = workspace();
  const file = put(dir, "example.py", "x= 1\nprint( x )");
  const before = readFileSync(file, "utf8");
  const result = cli(python, ["-m", "black", "--check", "--diff", "."], dir, 1);
  assert.match(result.out, /---/);
  assert.equal(readFileSync(file, "utf8"), before);
  cli(python, ["-m", "black", "."], dir);
  cli(python, ["-m", "black", "--check", "."], dir);
  assert.match(readFileSync(file, "utf8"), /x = 1/);
});
test("pytest: progetto reale e 26 casi raccolti/eseguiti", () => {
  const dir = project();
  assert.match(
    cli(python, ["-m", "pytest", "--collect-only", "-q"], dir).out,
    /26 tests collected/,
  );
  assert.match(cli(python, ["-m", "pytest", "-q"], dir).out, /26 passed/);
  assert.match(
    cli(python, ["-m", "pytest", "tests/test_ports.py", "-q"], dir).out,
    /18 passed/,
  );
});
test("unittest: scoperta e due test reali", () => {
  const result = cli(
    python,
    [
      "-m",
      "unittest",
      "discover",
      "-s",
      "tests",
      "-p",
      "test_*unittest.py",
      "-v",
    ],
    project(),
  );
  assert.match(result.err, /Ran 2 tests/);
  assert.match(result.err, /\bOK\b/);
});
test("pytest: mutazione del limite rilevata dalla suite", () => {
  const dir = project();
  put(dir, "ports.py", blocks[2][0].replace("port <= 65535", "port <= 65536"));
  assert.match(cli(python, ["-m", "pytest", "-q"], dir, 1).out, /failed/);
});
test("pytest: nessun test non e un successo", () => {
  cli(python, ["-m", "pytest", "-q"], workspace(), 5);
});
test("coverage: branch, soglia e HTML del progetto", () => {
  const dir = project();
  cli(
    python,
    [
      "-m",
      "coverage",
      "run",
      "--branch",
      "--source=ports",
      "-m",
      "pytest",
      "-q",
    ],
    dir,
  );
  const report = cli(python, ["-m", "coverage", "report", "-m"], dir).out;
  assert.match(report, /100%/);
  cli(python, ["-m", "coverage", "report", "--fail-under=100"], dir);
  cli(python, ["-m", "coverage", "html"], dir);
  assert.ok(existsSync(join(dir, "htmlcov", "index.html")));
  assert.ok(existsSync(join(dir, ".coverage")));
});
test("coverage: soglia fallisce per percorsi incompleti", () => {
  const dir = workspace();
  put(dir, "ports.py", blocks[2][0]);
  put(
    dir,
    "test_no_assertions.py",
    'from ports import parse_port\n\ndef test_only_runs():\n    parse_port("8000")\n',
  );
  cli(
    python,
    [
      "-m",
      "coverage",
      "run",
      "--branch",
      "--source=ports",
      "-m",
      "pytest",
      "-q",
    ],
    dir,
  );
  cli(python, ["-m", "coverage", "report", "--fail-under=100"], dir, 2);
});
test("coverage al 100% anche senza verificare risultati", () => {
  const dir = workspace();
  put(dir, "ports.py", blocks[2][0]);
  put(
    dir,
    "test_no_assertions.py",
    String.raw`
from contextlib import suppress
from ports import load_port, parse_port

def test_only_runs(monkeypatch):
    for value in [None, "", "x", "\u0668", "0", "65536", "8000"]:
        with suppress(TypeError, ValueError):
            parse_port(value)
    monkeypatch.setenv("APP_PORT", "8000")
    load_port()
`,
  );
  cli(
    python,
    [
      "-m",
      "coverage",
      "run",
      "--branch",
      "--source=ports",
      "-m",
      "pytest",
      "-q",
    ],
    dir,
  );
  cli(python, ["-m", "coverage", "report", "--fail-under=100"], dir);
});
test("mock: autospec limita firma e attributi, non i tipi", () => {
  const dir = project();
  put(
    dir,
    "test_mock_contract.py",
    String.raw`
from unittest.mock import create_autospec
import pytest
from tests_transport import Transport

def test_contract():
    client = create_autospec(Transport, instance=True, spec_set=True)
    with pytest.raises(TypeError):
        client.send()
    with pytest.raises(AttributeError):
        client.unknown()
    client.send(42)
    client.send.assert_called_once_with(42)
`,
  );
  put(dir, "tests_transport.py", blocks[2][4]);
  cli(python, ["-m", "pytest", "test_mock_contract.py", "-q"], dir);
});
test("basicConfig: una volta, force e output separato", () => {
  const result = runtime(
    3,
    0,
    String.raw`
import io
first, second = io.StringIO(), io.StringIO()
logging.basicConfig(level=logging.INFO, stream=first)
logging.basicConfig(level=logging.DEBUG, stream=second)
logger.info("first")
logger.debug("hidden")
assert first.getvalue().endswith("first\n") and second.getvalue() == ""
logging.basicConfig(level=logging.DEBUG, stream=second, force=True)
logger.debug("second")
assert "second" in second.getvalue()
`,
  );
  assert.equal(result.out, "");
});
test("propagazione: soglia handler e duplicati", () =>
  runtime(
    3,
    2,
    String.raw`
output = io.StringIO()
handler = logging.StreamHandler(output)
handler.setLevel(logging.ERROR)
parent.addHandler(handler)
try:
    child.debug("hidden")
    child.error("once")
    assert output.getvalue().splitlines() == ["once"]
    child.addHandler(handler)
    child.error("twice")
    assert output.getvalue().splitlines() == ["once", "twice", "twice"]
finally:
    child.removeHandler(handler)
    parent.removeHandler(handler)
    handler.close()
`,
  ));
test("JSON: evento valido e newline serializzato", () => {
  const result = runtime(
    3,
    4,
    'logging.getLogger("demo.app").info("line\\nnext")',
  );
  const lines = result.err
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].message, "Loaded 3 records");
  assert.equal(lines[1].message, "line\nnext");
});
test("logging exception non rilancia l'errore", () => {
  const result = runtime(
    3,
    3,
    'assert "not-a-number" in logged\nprint("continued")',
  );
  assert.match(result.out, /continued/);
});
test("logging: formatter puo fallire con campi extra assenti", () =>
  runtime(
    3,
    4,
    String.raw`
record = logging.LogRecord("x", logging.INFO, "", 1, "ready", (), None)
formatter = logging.Formatter("%(request_id)s %(message)s")
with expect.assertRaises(ValueError):
    formatter.format(record)
record.request_id = "demo"
assert formatter.format(record) == "demo ready"
`,
  ));
