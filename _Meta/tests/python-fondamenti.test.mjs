import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Comandi base",
  "Sintassi e Variabili",
  "Operatori",
  "Strutture Condizionali",
  "Cicli",
  "Funzioni",
  "Argomenti Flessibili",
  "Error Handling",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = (i, lang = "python") =>
  notes[i].tree.children
    .filter((node) => node.type === "code" && node.lang === lang)
    .map((node) => node.value);

function launch(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    timeout: 60000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    ...options,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
const bootstrap = `
import contextlib
import io
import json
import sys
import unittest

assert sys.flags.optimize == 0
request = json.load(sys.stdin)
captured = io.StringIO()
namespace = {"__name__": "note_example", "expect": unittest.TestCase()}
with contextlib.redirect_stdout(captured):
    for index, block in enumerate(request["blocks"]):
        exec(compile(block, request["name"] + ":" + str(index), "exec"), namespace)
    namespace["captured"] = captured
    exec(compile(request["probe"], "note-test", "exec"), namespace)
sys.stdout.write(json.dumps({"output": captured.getvalue()}))
`;
function run(i, probe = "pass") {
  const result = launch(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({ name: names[i], blocks: blocks(i), probe }),
  });
  return JSON.parse(ok(result)).output;
}

test("baseline e 37 blocchi Python estratti dal Markdown", () => {
  const result = launch(python, [
    "-I",
    "-c",
    "import sys; print(sys.version); assert sys.version_info[:2] == (3, 12)",
  ]);
  ok(result);
  assert.deepEqual(
    names.map((_, i) => blocks(i).length),
    [1, 6, 4, 5, 5, 6, 5, 5],
  );
});
for (const [i, name] of names.entries()) {
  test("struttura e metadati: " + name, () => {
    const note = notes[i];
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Python");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.status, "non revisionato");
    assert.equal(String(note.data.date), "2026-06-03");
    assert.equal(note.data.type, i === 7 ? "theory-note" : "technical-note");
    assert.equal(
      note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
        .length,
      1,
    );
    assert.ok(note.body.includes("# " + note.data.title));
    const inline = new Set();
    const pending = [note.tree];
    while (pending.length) {
      const node = pending.pop();
      if (node.type === "inlineCode") inline.add(node.value);
      pending.push(...(node.children || []));
    }
    const requiredInline = {
      0: ["__pycache__", 'if __name__ == "__main__":'],
      5: ["*args", "**kwargs"],
      6: ["__wrapped__"],
      7: ["__cause__"],
    };
    for (const value of requiredInline[i] || []) {
      assert.ok(
        inline.has(value),
        "Nome speciale conservato come codice: " + value,
      );
    }
    for (const heading of [
      "Sintesi",
      "Errori comuni",
      "Checklist",
      "Collegamenti",
      "Fonti",
      "Navigazione",
    ]) {
      assert.ok(note.body.includes("## " + heading), heading);
    }
  });
  test("compilazione ed esecuzione dei blocchi: " + name, () => run(i));
}

test("Sintassi: alias, riassegnazione e copia superficiale", () =>
  run(
    1,
    `
assert original == ["uno", "due"]
assert alias == ["altro"] and alias is not original
assert copied is not rows and copied[0] is rows[0]
assert rows == [["iniziale", "aggiunto"]]
left = right = []
left.append(1)
assert right == [1] and left is right
`,
  ));
test("Sintassi: scope, UnboundLocalError e rami non eseguiti", () =>
  run(
    1,
    `
assert increment(10) == 11 and count == 10
with expect.assertRaises(UnboundLocalError):
    increment_bad()
scope = {}
exec("if True:\\n    visible = 3", scope)
assert scope["visible"] == 3
exec("if False:\\n    absent = 1", scope)
assert "absent" not in scope
`,
  ));
test("Sintassi: type hint non converte, docstring e f-string", () =>
  run(
    1,
    `
assert type(declared_age) is str
assert greet("Lin") == "Ciao Lin"
assert greet.__doc__ == "Restituisce un saluto senza modificare dati esterni."
name = "prima"
snapshot = f"{name}"
name = "dopo"
assert snapshot == "prima"
with expect.assertRaises(TypeError):
    "2" + 2
`,
  ));
test("Sintassi: unpacking errato e tupla con elemento mutabile", () =>
  run(
    1,
    `
with expect.assertRaises(ValueError):
    a, b = [1]
container = ([],)
container[0].append("ok")
assert container == (["ok"],)
with expect.assertRaises(TypeError):
    container[0] = []
`,
  ));

test("Operatori: floor, resto, precedenza e tipi numerici", () => {
  const output = run(
    2,
    `
from decimal import Decimal
from fractions import Fraction
assert -7 // 2 == -4 and -7 % 2 == 1
assert type(7.0 // 2) is float
assert -2 ** 2 == -4 and (-2) ** 2 == 4
assert type(Decimal(3) / Decimal(2)) is Decimal
assert Fraction(3, 2) == Fraction(3) / Fraction(2)
for a in [-7, 0, 7]:
    for b in [-3, 2]:
        assert a == (a // b) * b + a % b
with expect.assertRaises(ZeroDivisionError):
    1 // 0
`,
  );
  assert.deepEqual(output.split("\n").slice(0, 6), [
    "3.5",
    "-4",
    "1",
    "3.0",
    "-4",
    "4",
  ]);
});
test("Operatori: short-circuit e default solo per None", () =>
  run(
    2,
    `
def fail():
    raise RuntimeError("must not run")
assert ("" and fail()) == ""
assert ("ok" or fail()) == "ok"
assert (0 or 100) == 100
assert (100 if 0 is None else 0) == 0
assert bool("False") is True
calls = []
def middle():
    calls.append(1)
    return 5
assert 0 < middle() < 10 and calls == [1]
`,
  ));
test("Operatori: identita, membership e consumo dell'iteratore", () =>
  run(
    2,
    `
assert first == second and first is not second and first is alias
assert "name" in record and "Ada" not in record
iterator = iter([1, 2, 3])
assert 2 in iterator
assert list(iterator) == [3]
with expect.assertRaises(TypeError):
    [] in record
`,
  ));
test("Operatori: pagina intera, limiti e numeri grandi", () =>
  run(
    2,
    `
for total, size, expected in [(0, 1, 0), (1, 10, 1), (20, 10, 2), (21, 10, 3)]:
    assert page_count(total, size) == expected
assert page_count(10 ** 100, 10) == 10 ** 99
for total, size in [(-1, 1), (1, 0), (1, -1)]:
    with expect.assertRaises(ValueError):
        page_count(total, size)
for total, size in [(True, 1), (1, False), ("1", 2), (1.0, 2), (1, None)]:
    with expect.assertRaises(TypeError):
        page_count(total, size)
`,
  ));

test("Condizioni: risultato iniziale, ternario e status", () =>
  run(
    3,
    `
assert status == "adult" and effective_limit == 0
assert describe_status(200) == "ok"
assert describe_status(400) == describe_status(404) == "client error"
assert describe_status(500) == "unknown"
assert (1 if True else 1 / 0) == 1
`,
  ));
test("Condizioni: filtro su dizionario, bool preciso e ruolo hashable", () =>
  run(
    3,
    `
assert can_access({"active": True, "role": "admin"}) is True
assert can_access({"active": True, "role": "editor"}) is True
for value in [None, [], "", {}, {"active": 1, "role": "admin"},
              {"active": "false", "role": "admin"},
              {"active": True, "role": []}, {"active": True, "role": "viewer"}]:
    assert can_access(value) is False
`,
  ));
test("Condizioni: pattern, guardia, bool escluso ed extra ammessi", () =>
  run(
    3,
    `
for steps in [1, 100]:
    assert parse_move({"action": "move", "steps": steps}) == ("move", steps)
for steps in [0, 101, True, 1.0, "1", None]:
    assert parse_move({"action": "move", "steps": steps}) is None
assert parse_move({"action": "stop", "extra": 1}) == ("stop", 0)
assert parse_move({"action": "move", "steps": 2, "extra": 1}) == ("move", 2)
for value in [None, [], "move", {}, {"action": "other"}]:
    assert parse_move(value) is None
`,
  ));
test("Condizioni: un nome semplice cattura; case irraggiungibile e SyntaxError", () =>
  run(
    3,
    `
scope = {"subject": 2, "ACTIVE": 1}
exec("match subject:\\n    case ACTIVE:\\n        result = ACTIVE", scope)
assert scope["ACTIVE"] == 2 and scope["result"] == 2
with expect.assertRaises(SyntaxError):
    compile("match 1:\\n    case ACTIVE: pass\\n    case _: pass", "bad-pattern", "exec")
`,
  ));

test("Cicli: primo pari, zero, None e generatore", () =>
  run(
    4,
    `
assert first_even([]) is None
assert first_even([None, 1, 3]) is None
assert first_even([None, 0, 2]) == 0
assert first_even([3, -2, 4]) == -2
assert first_even(x for x in [1, 3, 4]) == 4
`,
  ));
test("Cicli: else con zero iterazioni, continue e break", () =>
  run(
    4,
    `
events = []
for value in []:
    events.append("body")
else:
    events.append("empty")
for value in [1]:
    continue
else:
    events.append("normal")
for value in [1]:
    break
else:
    events.append("must not run")
while False:
    events.append("body")
else:
    events.append("while")
assert events == ["empty", "normal", "while"]
assert attempts == 3
`,
  ));
test("Cicli: return ed eccezione saltano else", () =>
  run(
    4,
    `
events = []
def early_return():
    for value in [1]:
        return value
    else:
        events.append("else")
assert early_return() == 1
with expect.assertRaises(ValueError):
    for value in [1]:
        raise ValueError("stop")
    else:
        events.append("else")
assert events == []
`,
  ));
test("Cicli: range, zip lazy e mismatch dopo coppie gia consumate", () =>
  run(
    4,
    `
assert list(range(1, 6, 2)) == [1, 3, 5]
with expect.assertRaises(ValueError):
    range(1, 5, 0)
assert list(zip([1, 2], ["a"])) == [(1, "a")]
zipped = zip([1, 2], ["a"], strict=True)
assert next(zipped) == (1, "a")
with expect.assertRaises(ValueError):
    next(zipped)
assert list(iterator) == []
`,
  ));
test("Cicli: raccolta mantiene ordine e duplicati senza mutare l'input", () =>
  run(
    4,
    `
import copy
values = [{"title": " A "}, {"title": None}, {}, [], {"title": "A"}, {"title": 0}]
original_values = copy.deepcopy(values)
assert collect_titles(values) == ["A", "A"]
assert values == original_values
assert collect_titles([]) == []
`,
  ));

test("Funzioni: return, tuple e None implicito", () =>
  run(
    5,
    `
assert add(2, 3) == 5
assert greet("Ada") == "Ciao Ada"
def only_print():
    print("output")
assert only_print() is None
def pair():
    return 1, 2
assert pair() == (1, 2)
`,
  ));
test("Funzioni: default condiviso e liste nuove quando omesse", () =>
  run(
    5,
    `
assert first_result is second_result
assert first_result == ["a", "b"]
a = append_item("a")
b = append_item("b")
assert a == ["a"] and b == ["b"] and a is not b
explicit = []
assert append_item("x", explicit) is explicit
assert explicit == ["x"]
`,
  ));
test("Funzioni: normalizzazione completa dei casi dichiarati", () =>
  run(
    5,
    `
assert normalized == ["Python", None, None, None, "Rust"]
for value in [None, "", "  ", "\\t\\n"]:
    assert normalize_label(value) is None
assert normalize_label(" A  B ") == "A  B"
assert normalize_label("<b>A</b>") == "<b>A</b>"
for value in [0, False, [], {}]:
    with expect.assertRaises(TypeError):
        normalize_label(value)
`,
  ));
test("Funzioni: mutazione distinta da riassegnazione", () =>
  run(
    5,
    `
values = ["start"]
result = touch_then_rebind(values)
assert values == ["start", "condiviso"]
assert result == ["solo locale"] and result is not values
`,
  ));
test("Funzioni: closure indipendenti e nonlocal", () =>
  run(
    5,
    `
a = make_counter()
b = make_counter()
assert (a(), a(), b(), a()) == (1, 2, 1, 3)
`,
  ));

test("Argomenti: raccolta, keyword-only e unpacking", () =>
  run(
    6,
    `
assert sum_all() == 0 and sum_all(1, 2, 3) == 6
assert description == {"text": "CIAO ADA", "labels": ("python", "appunti"), "metadata": {"language": "it"}}
assert multiply(*iter([2, 3, 4])) == 24
assert create_user("Ada", active=False)["active"] is False
with expect.assertRaises(TypeError):
    create_user("Ada", False)
with expect.assertRaises(TypeError):
    describe(prefix="Ciao", name="Ada")
with expect.assertRaises(TypeError):
    multiply(1, 2)
`,
  ));
test("Argomenti: collisioni e chiavi non stringa non sono merge", () =>
  run(
    6,
    `
with expect.assertRaises(TypeError):
    format_address("localhost", host="other", port=8000)
with expect.assertRaises(TypeError):
    format_address(**{"host": "a", "port": 1}, **{"port": 2})
with expect.assertRaises(TypeError):
    format_address(**{1: "a"})
assert {**{"port": 1}, **{"port": 2}} == {"port": 2}
`,
  ));
test("Argomenti: positional-only e kwargs possono avere lo stesso nome", () =>
  run(
    6,
    `
result = describe("Ciao", "Ada", prefix="metadata")
assert result["text"] == "Ciao Ada"
assert result["metadata"] == {"prefix": "metadata"}
nested = []
profile = create_profile("Ada", values=nested)
nested.append(1)
assert profile["metadata"]["values"] == [1]
`,
  ));
test("Argomenti: wrapper conserva risultato, metadati, firma e errori", () =>
  run(
    6,
    `
import inspect
assert add(3, b=4) == 7
assert add.__name__ == "add" and add.__doc__ == "Somma i due valori ricevuti."
assert str(inspect.signature(add)) == "(a, b)"
assert add.__wrapped__(1, 2) == 3
with expect.assertRaises(TypeError):
    add(1)
cause = ValueError("failed")
def failing():
    raise cause
with expect.assertRaises(ValueError) as caught:
    log_call(failing)()
assert caught.exception is cause
`,
  ));
test("Argomenti: wrapper sync non esegue coroutine o corpo di un generatore", () =>
  run(
    6,
    `
import asyncio
import inspect
events = []
async def later():
    events.append("async")
    return 8
wrapped = log_call(later)
assert not inspect.iscoroutinefunction(wrapped)
coroutine = wrapped()
assert events == []
assert asyncio.run(coroutine) == 8 and events == ["async"]
def values():
    events.append("generator")
    yield 1
iterator = log_call(values)()
assert events == ["async"]
assert next(iterator) == 1 and events == ["async", "generator"]
iterator.close()
`,
  ));

test("Errori: tipo e valore dell'eta", () =>
  run(
    7,
    `
assert set_age(0) == 0 and set_age(30) == 30
with expect.assertRaises(ValueError):
    set_age(-1)
for value in [True, 1.0, "1", None]:
    with expect.assertRaises(TypeError):
        set_age(value)
`,
  ));
test("Errori: timeout valido e politica esplicita", () =>
  run(
    7,
    `
for value, expected in [(1, 1), (3600, 3600), (" 30 ", 30), ("0001", 1), ("3600", 3600)]:
    assert read_timeout({"timeout": value, "extra": 1}) == expected
for value in [0, -1, 3601, True, False, 1.9, None, [], {}, "", " ", "+1", "-1", "1_0", "1.0", "00001", "\\u0661"]:
    with expect.assertRaises(InvalidConfigError):
        read_timeout({"timeout": value})
for value in [None, [], "config"]:
    with expect.assertRaises(InvalidConfigError):
        read_timeout(value)
`,
  ));
test("Errori: chiave assente conserva la causa, guasto inatteso si propaga", () =>
  run(
    7,
    `
with expect.assertRaises(InvalidConfigError) as caught:
    read_timeout({})
assert isinstance(caught.exception.__cause__, KeyError)
cause = OSError("unavailable")
class BrokenDict(dict):
    def __getitem__(self, key):
        raise cause
with expect.assertRaises(OSError) as failure:
    read_timeout(BrokenDict())
assert failure.exception is cause
`,
  ));
test("Errori: else e cleanup su successo, errore atteso e TypeError", () =>
  run(
    7,
    `
events = []
assert divide(6, 2, events) == 3.0
assert events == ["success", "cleanup"]
events = []
assert divide(6, 0, events) is None
assert events == ["zero", "cleanup"]
events = []
with expect.assertRaises(TypeError):
    divide("x", 2, events)
assert events == ["cleanup"]
`,
  ));
test("Errori: file presente, assente, vuoto e UTF-8 invalido", () =>
  run(
    7,
    `
import pathlib
import tempfile
with tempfile.TemporaryDirectory(prefix="appunti-python-read-") as folder:
    root = pathlib.Path(folder).resolve()
    assert root.parent == pathlib.Path(tempfile.gettempdir()).resolve()
    assert read_optional_text(root / "missing.txt") == ""
    file = root / "data.txt"
    file.write_text("", encoding="utf-8")
    assert read_optional_text(file) == ""
    file.write_text("Caff\\u00e8", encoding="utf-8")
    assert read_optional_text(file) == "Caff\\u00e8"
    file.write_bytes(b"\\xff")
    with expect.assertRaises(UnicodeDecodeError):
        read_optional_text(file)
`,
  ));
test("Errori: file chiuso su errore e PermissionError non nascosto", () =>
  run(
    7,
    `
from unittest.mock import patch, mock_open
handle = mock_open()
handle.return_value.read.side_effect = OSError("read failed")
with patch("builtins.open", handle):
    with expect.assertRaises(OSError):
        read_optional_text("fixture.txt")
handle.return_value.__exit__.assert_called_once()
cause = PermissionError("denied")
with patch("builtins.open", side_effect=cause):
    with expect.assertRaises(PermissionError) as caught:
        read_optional_text("fixture.txt")
assert caught.exception is cause
`,
  ));
test("Errori: Exception non intercetta interruzioni e else ha un confine distinto", () =>
  run(
    7,
    `
assert not issubclass(KeyboardInterrupt, Exception)
assert not issubclass(SystemExit, Exception)
events = []
with expect.assertRaises(ValueError):
    try:
        pass
    except ValueError:
        events.append("caught")
    else:
        raise ValueError("from else")
assert events == []
`,
  ));
test("Errori: finally puo sopprimere un errore, from None non elimina il contesto", () =>
  run(
    7,
    `
def bad_finally():
    try:
        raise ValueError("lost")
    finally:
        return 1
assert bad_finally() == 1
try:
    try:
        raise ValueError("original")
    except ValueError:
        raise RuntimeError("public") from None
except RuntimeError as error:
    assert error.__cause__ is None
    assert isinstance(error.__context__, ValueError)
    assert error.__suppress_context__ is True
`,
  ));

// Only generated fixtures are written, outside the repository.
const temp = fs.realpathSync(os.tmpdir());
const root = fs.mkdtempSync(path.join(temp, "appunti-python-foundations-"));
after(() => {
  assert.equal(path.dirname(fs.realpathSync(root)), temp);
  assert.ok(path.basename(root).startsWith("appunti-python-foundations-"));
  fs.rmSync(root, { recursive: true, force: true });
});
const locate = (name) => {
  const file = path.resolve(root, name);
  assert.ok(file.startsWith(root + path.sep));
  return file;
};
const cli = (...args) =>
  launch(python, ["-E", "-s", "-X", "utf8", ...args], { cwd: root });
fs.writeFileSync(locate("main.py"), blocks(0)[0]);
test("Toolchain: script e modulo hanno output e codice di uscita attesi", () => {
  assert.equal(ok(cli("main.py", "Ada")).trim(), "Ciao Ada");
  assert.equal(ok(cli("-m", "main", "Ada")).trim(), "Ciao Ada");
  for (const args of [[], [""], ["  "], ["Ada", "Lin"]]) {
    const result = cli("main.py", ...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Uso: python main.py NOME/);
  }
});
test("Toolchain: import non avvia la CLI e main restituisce exit code", () => {
  assert.equal(
    ok(cli("-c", "import main; print('imported')")).trim(),
    "imported",
  );
  run(0, 'assert main([" Ada "]) == 0');
});
test("Toolchain: py_compile controlla sintassi ma non il comportamento", () => {
  ok(cli("-m", "py_compile", "main.py"));
  assert.ok(
    fs
      .readdirSync(locate("__pycache__"))
      .some((name) => name.startsWith("main.")),
  );
  fs.writeFileSync(
    locate("broken.py"),
    "raise RuntimeError('runtime failure')\n",
  );
  ok(cli("-m", "py_compile", "broken.py"));
  assert.notEqual(cli("broken.py").status, 0);
  fs.writeFileSync(locate("invalid.py"), "if True print('bad')\n");
  assert.notEqual(cli("-m", "py_compile", "invalid.py").status, 0);
});
test("Toolchain: -O disabilita assert, non e validazione di input", () => {
  assert.notEqual(cli("-c", "assert False; print('continued')").status, 0);
  assert.equal(
    ok(cli("-O", "-c", "assert False; print('continued')")).trim(),
    "continued",
  );
});
test("Toolchain: comandi indipendenti e attivazione distinta per shell", () => {
  for (const lang of ["text", "powershell", "bat", "bash"]) {
    for (const block of blocks(0, lang))
      assert.equal(block.split("\n").length, 1, block);
  }
  assert.ok(blocks(0, "powershell").some((b) => b.includes("Activate.ps1")));
  assert.ok(blocks(0, "bat").some((b) => b.includes("activate.bat")));
  assert.ok(
    blocks(0, "bash").some((b) => b.includes("source .venv/bin/activate")),
  );
  assert.ok(notes[0].body.includes("Sovrascrive requirements.txt"));
});
test("Toolchain: ambiente virtuale reale con pip e CLI, senza attivazione o rete", () => {
  ok(cli("-m", "venv", ".venv"));
  const virtualPython = locate(
    process.platform === "win32"
      ? ".venv/Scripts/python.exe"
      : ".venv/bin/python",
  );
  const venv = (...args) =>
    launch(virtualPython, ["-E", "-s", "-X", "utf8", ...args], {
      cwd: root,
      env: { ...process.env, PIP_DISABLE_PIP_VERSION_CHECK: "1" },
    });
  const info = JSON.parse(
    ok(
      venv(
        "-c",
        "import json, sys; print(json.dumps({'active': sys.prefix != sys.base_prefix, 'prefix': sys.prefix, 'executable': sys.executable}))",
      ),
    ),
  );
  assert.equal(info.active, true);
  assert.equal(fs.realpathSync(info.prefix), fs.realpathSync(locate(".venv")));
  assert.equal(ok(venv("main.py", "Ada")).trim(), "Ciao Ada");
  assert.match(ok(venv("-m", "pip", "--version")), /pip/);
  const packages = JSON.parse(ok(venv("-m", "pip", "list", "--format=json")));
  assert.deepEqual(
    packages.map((p) => p.name.toLowerCase()),
    ["pip"],
  );
  assert.equal(ok(venv("-m", "pip", "freeze")).trim(), "");
  assert.match(ok(venv("-m", "pip", "freeze", "--all")), /pip==/);
  assert.match(ok(venv("-m", "pip", "check")), /No broken requirements found/);
});
