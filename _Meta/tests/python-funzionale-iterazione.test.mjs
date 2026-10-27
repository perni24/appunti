import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Funzioni Lambda",
  "Higher-order Functions",
  "Decoratori",
  "Generatori",
  "Iteratori",
  "Context Managers",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
const bootstrap = String.raw`import contextlib
import io
import json
import sys
import types
import unittest
assert sys.version_info[:2] == (3, 12)
assert sys.flags.optimize == 0
request = json.load(sys.stdin)
module = types.ModuleType("note_example")
sys.modules[module.__name__] = module
namespace = module.__dict__
namespace["expect"] = unittest.TestCase()
captured = io.StringIO()
namespace["captured"] = captured
with contextlib.redirect_stdout(captured):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "note-test", "exec"), namespace)
sys.stdout.write(json.dumps({"output": captured.getvalue(), "version": sys.version}))`;
function run(note, block, probe = "pass") {
  assert.equal(typeof blocks[note][block], "string");
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({
      name: names[note] + ":" + block,
      code: blocks[note][block],
      probe,
    }),
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
const expected = [
  [
    String.raw`assert add_expression(2, 3) == add(2, 3) == 5
assert add_expression(2) == add(2) == 3`,
    String.raw`assert [u["name"] for u in ordered] == ["Anna", "Lin", "Luca"]
assert youngest is users[1]
assert ordered[1] is users[2]
assert [u["name"] for u in users] == ["Luca", "Anna", "Lin"]`,
    String.raw`assert squares == squares_comprehension == [1, 4, 9, 16]
assert even == even_comprehension == [2, 4]`,
    String.raw`assert [row["title"] for row in rows_by_priority] == ["security patch", "backup", "cleanup"]
assert [row["title"] for row in rows] == ["backup", "security patch", "cleanup"]`,
    String.raw`assert [f() for f in late] == [2, 2, 2]
assert [f() for f in bound] == [0, 1, 2]
assert read_state() is state and state == ["changed"]`,
  ],
  [
    String.raw`assert result == [2, 4, 6] and numbers == [1, 2, 3]`,
    String.raw`assert double(10) == 20 and triple(10) == 30
assert double is not triple`,
    String.raw`assert first == "ANNA" and rest == ["LUCA"]
assert events == ["anna", "luca"] and list(mapped) == []
assert odd == [1, 3, 5]`,
    String.raw`assert (total, product, empty_total) == (10, 24, 0)`,
    String.raw`assert not long_enough("cat") and long_enough("notes")
assert min_length(0)("")`,
    String.raw`assert info("ready") == "worker [INFO] ready"
assert info("ready", prefix="api") == "api [INFO] ready"`,
  ],
  [
    String.raw`assert add(2, 3, offset=1) == 6
assert add.__name__ == "add" and add.__doc__ == add.__wrapped__.__doc__`,
    String.raw`assert result == 3 and events == ["hello"] * 3`,
    String.raw`assert build_report() == 999000`,
    String.raw`assert result == "done"
assert events == ["factory outer", "factory inner", "decorate inner", "decorate outer", "call outer", "call inner", "body"]`,
    String.raw`import inspect
assert inspect.iscoroutinefunction(load_count)
assert asyncio.run(load_count()) == 42`,
  ],
  [
    String.raw`assert list(counter) == [] and list(count_to(3)) == [1, 2, 3]`,
    String.raw`assert events == ["source"] and list(scaled) == []
assert "[6, 12]" in captured.getvalue()`,
    String.raw`assert list(pipeline) == []
assert list(squares(chain([1, 2], [3, 4]))) == [1, 4, 9, 16]`,
    String.raw`assert lines.gi_frame is None
assert captured.getvalue().strip() == "FIRST"
assert not path.exists()`,
    String.raw`assert events == ["acquire", "release"] and values.gi_frame is None`,
    String.raw`assert finished == 7 and list(stream) == []`,
  ],
  [
    String.raw`assert numbers == [10, 20, 30] and list(iterator) == []
assert iter(iterator) is iterator`,
    String.raw`assert list(one_shot) == []
assert list(reusable) == list(reusable) == [1, 2, 3]`,
    String.raw`assert list(delays) == []
assert list(RetryDelays(4, 500, 2000)) == [500, 1000, 2000, 2000]`,
    String.raw`assert chunks == [b"abcd", b"ef"] and source.closed`,
    String.raw`assert sample == [10, 15, 20] and joined == [1, 2, 3]
assert pairs == [(10, 20), (20, 30)] and batches == [(0, 1), (2, 3), (4,)]`,
    String.raw`assert groups == [("a", ["a"] * 3), ("b", ["b"] * 2), ("a", ["a"])]
assert first["value"] == 9
assert next(left) is next(right)`,
  ],
  [
    String.raw`assert events == ["acquire", ("release", "ValueError")]
assert resource == {"ready": True}`,
    String.raw`assert total == 999000`,
    String.raw`assert copied == "FIRST\nSECOND\n" and source.closed and target.closed
assert not source_path.exists() and not target_path.exists()`,
    String.raw`assert not first.exists() and not second.exists()
assert captured.getvalue().strip() == "['one', 'two']"`,
    String.raw`assert asyncio.run(demo()) == ["acquire", "resource", 1, "generator closed", "release"]`,
  ],
];
test("33 esempi autonomi sulla baseline CPython 3.12", () => {
  assert.deepEqual(
    blocks.map((items) => items.length),
    [5, 6, 5, 6, 6, 5],
  );
  assert.match(run(0, 0).version, /^3\.12\./);
});
for (const [i, name] of names.entries()) {
  test("struttura, metadati e fonti: " + name, () => {
    const note = notes[i];
    assert.equal(note.data.area, "Programmazione");
    assert.equal(note.data.topic, "Python");
    assert.equal(note.data.status, "non revisionato");
    assert.equal(note.data.publish, true);
    assert.equal(note.data.type, i === 1 ? "theory-note" : "technical-note");
    assert.equal(String(note.data.date), "2026-06-03");
    assert.equal(
      note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
        .length,
      1,
    );
    assert.ok(note.body.includes("# " + note.data.title));
    const sections =
      i === 1
        ? [
            "Sintesi",
            "Problema che risolve",
            "Concetto chiave",
            "Dettagli importanti",
            "Esempio",
            "Limiti",
          ]
        : [
            "Sintesi",
            "Quando usarlo",
            "Come funziona",
            "API / Sintassi",
            "Esempio pratico",
            "Varianti",
          ];
    for (const title of [
      ...sections,
      "Errori comuni",
      "Checklist",
      "Collegamenti",
      "Fonti",
    ]) {
      assert.ok(note.body.includes("## " + title), name + ": " + title);
    }
    assert.match(note.body, /https:\/\/docs\.python\.org\/3\.12\//);
    assert.ok(note.body.includes("3.12.10"));
  });
  for (const [block, probe] of expected[i].entries()) {
    test(name + ": esempio " + (block + 1), () => run(i, block, probe));
  }
}
const cases = [
  {
    note: 0,
    block: 0,
    title: "lambda: stessi parametri, eccezioni e risultato di def",
    probe: String.raw`for function in (add, add_expression):
    assert function(left=4, right=2) == 6
    with expect.assertRaises(TypeError):
        function()
    with expect.assertRaises(TypeError):
        function(1, 2, 3)
    with expect.assertRaises(TypeError):
        function(1, "x")`,
  },
  {
    note: 0,
    block: 1,
    title: "sort stabile, chiavi mancanti e min vuoto",
    probe: String.raw`assert min([], default=None) is None
with expect.assertRaises(ValueError):
    min([])
with expect.assertRaises(KeyError):
    sorted([{}], key=lambda user: user["age"])
with expect.assertRaises(TypeError):
    sorted([{"age": 1}, {"age": "2"}], key=lambda user: user["age"])
ordered[0]["age"] = 25
assert users[1]["age"] == 25`,
  },
  {
    note: 0,
    block: 4,
    title: "default cattura il riferimento, non una copia",
    probe: String.raw`state.append("later")
assert read_state() == ["changed", "later"]
assert bound[0](99) == 99
assert [f() for f in late] == [2, 2, 2]`,
  },
  {
    note: 1,
    block: 0,
    title: "callback eager: consumo parziale ed effetti non annullati",
    probe: String.raw`items = iter([1, 2, 3])
seen = []
error = ValueError("stop")
def transform(value):
    seen.append(value)
    if value == 2:
        raise error
    return value * 2
with expect.assertRaises(ValueError) as raised:
    apply_to_all(items, transform)
assert raised.exception is error and seen == [1, 2]
assert list(items) == [3]
source = [{}]
assert apply_to_all(source, lambda x: x)[0] is source[0]`,
  },
  {
    note: 1,
    block: 0,
    title: "callback async: nessun await implicito",
    probe: String.raw`import inspect
seen = []
async def transform(value):
    seen.append(value)
    return value
coroutines = apply_to_all([1, 2], transform)
try:
    assert seen == [] and all(inspect.iscoroutine(c) for c in coroutines)
finally:
    for coroutine in coroutines:
        coroutine.close()`,
  },
  {
    note: 1,
    block: 2,
    title: "map e filter lazy; short circuit",
    probe: String.raw`events.clear()
lazy = map(upper, ["one", "two", "three"])
assert events == []
assert next(lazy) == "ONE" and events == ["one"]
assert any(lazy) and events == ["one", "two"]
assert list(lazy) == ["THREE"]
assert list(map(lambda x, y: x + y, [1, 2], [10])) == [11]
assert list(filter(None, [0, "", None, False, [], "yes", 3])) == ["yes", 3]`,
  },
  {
    note: 1,
    block: 3,
    title: "reduce: iniziale, input vuoto e associazione a sinistra",
    probe: String.raw`with expect.assertRaises(TypeError):
    reduce(add, [])
assert reduce(lambda x, y: x - y, [10, 3, 2]) == 5
assert reduce(mul, [], 1) == 1`,
  },
  {
    note: 1,
    block: 4,
    title: "regola configurabile: validazione e limiti del predicato",
    probe: String.raw`for bad in (True, 1.5, None, "4"):
    with expect.assertRaises(TypeError):
        min_length(bad)
with expect.assertRaises(ValueError):
    min_length(-1)
for bad in ([], None, 4):
    with expect.assertRaises(TypeError):
        long_enough(bad)
assert long_enough("    ")
assert min_length(2)("e\u0301")
assert not min_length(2)("\u00e9")`,
  },
  {
    note: 1,
    block: 5,
    title: "partial: keyword sostituibile e collisione posizionale",
    probe: String.raw`assert info("ok", prefix="new") == "new [INFO] ok"
assert info.keywords == {"prefix": "worker"} and info.args == ("INFO",)
with expect.assertRaises(TypeError):
    info("ready", level="DEBUG")
state = []
read = partial(lambda value: value, state)
state.append(1)
assert read() is state and read() == [1]`,
  },
  {
    note: 2,
    block: 0,
    title: "wraps: metadata, firma, binding e identita dell'errore",
    probe: String.raw`import inspect
assert inspect.signature(add) == inspect.signature(add.__wrapped__)
assert add.__annotations__ == add.__wrapped__.__annotations__
assert str(inspect.signature(add, follow_wrapped=False)).startswith("(*args, **kwargs)")
error = ValueError("same")
@log_call
def fail():
    raise error
with expect.assertRaises(ValueError) as raised:
    fail()
assert raised.exception is error
class Calculator:
    @log_call
    def add(self, value):
        return value + 1
assert Calculator().add(2) == 3
with expect.assertRaises(TypeError):
    add(1, 2, 3)`,
  },
  {
    note: 2,
    block: 1,
    title: "repeat: configurazione e stop al primo errore",
    probe: String.raw`for bad in (True, 1.5, None):
    with expect.assertRaises(TypeError):
        repeat(bad)
for bad in (0, -1):
    with expect.assertRaises(ValueError):
        repeat(bad)
calls = []
@repeat(3)
def fail():
    calls.append(1)
    raise ValueError("stop")
with expect.assertRaises(ValueError):
    fail()
assert calls == [1]`,
  },
  {
    note: 2,
    block: 2,
    title: "timer sincrono: finally anche in errore",
    probe: String.raw`import contextlib
import io
ticks = iter([10.0, 10.25])
perf_counter = lambda: next(ticks)
error = ValueError("stop")
@timed
def fail():
    raise error
out = io.StringIO()
with contextlib.redirect_stdout(out):
    with expect.assertRaises(ValueError) as raised:
        fail()
assert raised.exception is error and out.getvalue() == "fail: 0.250000s\n"`,
  },
  {
    note: 2,
    block: 2,
    title: "wrapper sincrono non consuma coroutine o generatori",
    probe: String.raw`seen = []
@timed
def values():
    seen.append("generator")
    yield 1
@timed
async def value():
    seen.append("coroutine")
    return 1
generator = values()
coroutine = value()
try:
    assert seen == []
    assert next(generator) == 1 and seen == ["generator"]
finally:
    generator.close()
    coroutine.close()`,
  },
  {
    note: 2,
    block: 3,
    title: "decoratori: factory una volta, wrapper a ogni chiamata",
    probe: String.raw`events.clear()
assert work() == "done"
assert events == ["call outer", "call inner", "body"]
events.clear()
assert work.__wrapped__.__wrapped__() == "done" and events == ["body"]`,
  },
  {
    note: 2,
    block: 4,
    title: "wrapper async: risultato, eccezione e cancellazione",
    probe: String.raw`import contextlib
import io
error = ValueError("async")
@timed_async
async def fail():
    raise error
async def verify():
    with expect.assertRaises(ValueError) as raised:
        await fail()
    assert raised.exception is error
    started = asyncio.Event()
    @timed_async
    async def blocked():
        started.set()
        await asyncio.Future()
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        task = asyncio.create_task(blocked())
        await started.wait()
        task.cancel()
        with expect.assertRaises(asyncio.CancelledError):
            await task
    assert "blocked: " in out.getvalue() and task.cancelled()
asyncio.run(verify())`,
  },
  {
    note: 3,
    block: 0,
    title: "generatore: validazione differita e stati",
    probe: String.raw`import inspect
for bad, error in [(True, TypeError), (1.5, TypeError), (-1, ValueError)]:
    values = count_to(bad)
    assert inspect.getgeneratorstate(values) == "GEN_CREATED"
    with expect.assertRaises(error):
        next(values)
    assert inspect.getgeneratorstate(values) == "GEN_CLOSED"
assert list(count_to(0)) == []
values = count_to(2)
assert iter(values) is values and next(values) == 1
assert inspect.getgeneratorstate(values) == "GEN_SUSPENDED"
assert values.close() is None
assert inspect.getgeneratorstate(values) == "GEN_CLOSED"`,
  },
  {
    note: 3,
    block: 1,
    title: "generator expression: primo iterabile immediato, corpo differito",
    probe: String.raw`events.clear()
factor = 4
values = (n * factor for n in source())
assert events == ["source"]
factor = 5
assert list(values) == [10, 20]
with expect.assertRaises(TypeError):
    (n for n in None)
values = (1 / n for n in [0])
with expect.assertRaises(ZeroDivisionError):
    next(values)`,
  },
  {
    note: 3,
    block: 2,
    title: "yield from e consumo singolo",
    probe: String.raw`source = iter([1, 2])
assert list(chain(source, source)) == [1, 2]
assert list(squares([])) == []
values = squares(chain([2], [3]))
assert next(values) == 4 and list(values) == [9]
assert list(islice(count(1), 3)) == [1, 2, 3]`,
  },
  {
    note: 3,
    block: 3,
    title: "file del generatore: apertura differita e chiusura anticipata",
    probe: String.raw`import builtins
opened = []
def tracked_open(*args, **kwargs):
    handle = builtins.open(*args, **kwargs)
    opened.append(handle)
    return handle
open = tracked_open
with TemporaryDirectory(prefix="appunti-generator-test-") as directory:
    path = Path(directory) / "lines.txt"
    path.write_text("\n first \nsecond\n", encoding="utf-8")
    values = non_empty_lines(path)
    assert opened == []
    assert next(values) == "first" and not opened[0].closed
    values.close()
    assert opened[0].closed
    assert list(non_empty_lines(path)) == ["first", "second"]
    assert all(handle.closed for handle in opened)
    missing = non_empty_lines(Path(directory) / "missing.txt")
    with expect.assertRaises(FileNotFoundError):
        next(missing)
    path.write_bytes(b"\xff")
    with expect.assertRaises(UnicodeDecodeError):
        list(non_empty_lines(path))
    assert all(handle.closed for handle in opened)`,
  },
  {
    note: 3,
    block: 4,
    title: "break non chiude; close prima dell'avvio non entra nel corpo",
    probe: String.raw`events.clear()
values = tracked_values()
values.close()
assert events == []
values = tracked_values()
for value in values:
    break
assert events == ["acquire"]
values.close()
assert events == ["acquire", "release"]
events.clear()
assert list(tracked_values()) == [1, 2] and events == ["acquire", "release"]
events.clear()
values = tracked_values()
next(values)
error = ValueError("stop")
with expect.assertRaises(ValueError) as raised:
    values.throw(error)
assert raised.exception is error and events == ["acquire", "release"]`,
  },
  {
    note: 3,
    block: 5,
    title: "send: priming, return e delega",
    probe: String.raw`values = accumulator()
with expect.assertRaises(TypeError):
    values.send(2)
assert next(values) == 0 and values.send(-2) == -2
with expect.assertRaises(StopIteration) as stopped:
    values.send(None)
assert stopped.exception.value == -2
with expect.assertRaises(StopIteration) as stopped:
    next(values)
assert stopped.exception.value is None
def delegated():
    result = yield from accumulator()
    yield ("result", result)
values = delegated()
assert next(values) == 0 and values.send(3) == 3
assert values.send(None) == ("result", 3)
values.close()
for bad in (True, "3", 2.5):
    values = accumulator()
    next(values)
    with expect.assertRaises(TypeError):
        values.send(bad)
    assert list(values) == []`,
  },
  {
    note: 3,
    block: 5,
    title: "StopIteration accidentale diventa RuntimeError",
    probe: String.raw`def broken():
    yield 1
    next(iter([]))
values = broken()
assert next(values) == 1
with expect.assertRaises(RuntimeError) as raised:
    next(values)
assert isinstance(raised.exception.__cause__, StopIteration)`,
  },
  {
    note: 4,
    block: 1,
    title:
      "iteratore e contenitore: esaurimento stabile e passate indipendenti",
    probe: String.raw`for cls in (CountTo, CountRange):
    for bad in (True, 1.2, "2"):
        with expect.assertRaises(TypeError):
            cls(bad)
    with expect.assertRaises(ValueError):
        cls(-1)
    assert list(cls(0)) == []
values = CountTo(2)
assert next(values) == 1 and iter(values) is values
assert next(values) == 2
for _ in range(3):
    with expect.assertRaises(StopIteration):
        next(values)
left, right = iter(reusable), iter(reusable)
assert left is not right
assert next(left) == 1 and next(left) == 2 and next(right) == 1
with expect.assertRaises(TypeError):
    next(reusable)`,
  },
  {
    note: 4,
    block: 2,
    title: "retry delays: limiti, cap e configurazioni invalide",
    probe: String.raw`from itertools import islice
assert list(RetryDelays(0, 1, 1)) == []
assert list(RetryDelays(5, 3, 7)) == [3, 6, 7, 7, 7]
assert list(islice(RetryDelays(10**9, 3, 7), 4)) == [3, 6, 7, 7]
for args in [(-1, 1, 2), (1, 0, 2), (1, 3, 2)]:
    with expect.assertRaises(ValueError):
        RetryDelays(*args)
for position in range(3):
    args = [1, 1, 2]
    args[position] = True
    with expect.assertRaises(TypeError):
        RetryDelays(*args)
values = RetryDelays(1, 1, 1)
assert next(values) == 1
for _ in range(2):
    with expect.assertRaises(StopIteration):
        next(values)`,
  },
  {
    note: 4,
    block: 3,
    title: "iter con sentinella: confronto per uguaglianza e propagazione",
    probe: String.raw`with BytesIO(b"abc") as source:
    assert list(iter(partial(source.read, 0), b"")) == [] and source.tell() == 0
source = iter([[1], [], [2]])
values = iter(lambda: next(source), [])
assert list(values) == [[1]] and list(source) == [[2]]
def fail():
    raise ValueError("not StopIteration")
with expect.assertRaises(ValueError):
    next(iter(fail, None), "default")`,
  },
  {
    note: 4,
    block: 4,
    title: "itertools nella baseline 3.12",
    probe: String.raw`assert list(batched([], 2)) == []
with expect.assertRaises(ValueError):
    batched([1], 0)
with expect.assertRaises(TypeError):
    batched([1], 2, strict=True)
values = iter(range(8))
assert list(islice(values, 1, 5, 2)) == [1, 3]
assert next(values) == 5
assert list(pairwise([1])) == []`,
  },
  {
    note: 4,
    block: 5,
    title: "groupby condivide il consumo; tee condivide i valori",
    probe: String.raw`outer = groupby("aabb")
key, first_group = next(outer)
assert key == "a"
key, second_group = next(outer)
assert key == "b" and list(first_group) == [] and list(second_group) == ["b", "b"]
left, right = tee(iter([{}, {}]))
first = next(left)
first["changed"] = True
assert next(right) is first and first == {"changed": True}
assert next(left) is next(right)`,
  },
  {
    note: 5,
    block: 0,
    title: "enter fallito, assegnazione as fallita, return e soppressione",
    probe: String.raw`events.clear()
error = ValueError("enter")
class FailedEnter(ManagedResource):
    def __enter__(self):
        self.events.append("failed acquire")
        raise error
with expect.assertRaises(ValueError) as raised:
    with FailedEnter(events):
        raise AssertionError("unreachable")
assert raised.exception is error and events == ["failed acquire"]
events.clear()
with expect.assertRaises(ValueError):
    with ManagedResource(events) as (left, right):
        pass
assert events == ["acquire", ("release", "ValueError")]
events.clear()
def early():
    with ManagedResource(events):
        return 42
assert early() == 42 and events == ["acquire", ("release", None)]
class Suppress(ManagedResource):
    def __exit__(self, *args):
        super().__exit__(*args)
        return True
with Suppress([]):
    raise ValueError("suppressed")`,
  },
  {
    note: 5,
    block: 0,
    title: "cleanup che fallisce non nasconde il contesto dell'errore",
    probe: String.raw`original = ValueError("body")
cleanup = RuntimeError("cleanup")
class FailedExit(ManagedResource):
    def __exit__(self, *args):
        raise cleanup
with expect.assertRaises(RuntimeError) as raised:
    with FailedExit([]):
        raise original
assert raised.exception is cleanup and cleanup.__context__ is original`,
  },
  {
    note: 5,
    block: 1,
    title: "contextmanager: finally, eccezioni e un solo yield",
    probe: String.raw`import contextlib
import io
ticks = iter([1.0, 1.5])
perf_counter = lambda: next(ticks)
out = io.StringIO()
error = ValueError("body")
with contextlib.redirect_stdout(out):
    with expect.assertRaises(ValueError) as raised:
        with timer("failed"):
            raise error
assert raised.exception is error and out.getvalue() == "failed: 0.500000s\n"
@contextmanager
def empty():
    if False:
        yield
@contextmanager
def twice():
    yield
    yield
for factory in (empty, twice):
    with expect.assertRaises(RuntimeError):
        with factory():
            pass`,
  },
  {
    note: 5,
    block: 3,
    title: "ExitStack: file precedenti chiusi se il successivo fallisce",
    probe: String.raw`import builtins
opened = []
def tracked_open(*args, **kwargs):
    handle = builtins.open(*args, **kwargs)
    opened.append(handle)
    return handle
open = tracked_open
assert read_first_lines([]) == []
with TemporaryDirectory(prefix="appunti-stack-test-") as directory:
    path = Path(directory) / "valid.txt"
    path.write_text("first\nsecond\n", encoding="utf-8")
    assert read_first_lines([path]) == ["first"]
    with expect.assertRaises(FileNotFoundError):
        read_first_lines([path, Path(directory) / "missing.txt"])
    assert all(handle.closed for handle in opened)
    invalid = Path(directory) / "invalid.txt"
    invalid.write_bytes(b"\xff")
    with expect.assertRaises(UnicodeDecodeError):
        read_first_lines([path, invalid])
    assert all(handle.closed for handle in opened)
events = []
with ExitStack() as stack:
    stack.callback(events.append, "first")
    stack.callback(events.append, "second")
assert events == ["second", "first"]`,
  },
  {
    note: 5,
    block: 4,
    title: "async context: errore e cancellazione rilasciano la risorsa",
    probe: String.raw`async def verify():
    events = []
    error = ValueError("body")
    with expect.assertRaises(ValueError) as raised:
        async with async_resource(events):
            raise error
    assert raised.exception is error and events == ["acquire", "release"]
    events.clear()
    started = asyncio.Event()
    async def blocked():
        async with async_resource(events):
            started.set()
            await asyncio.Future()
    task = asyncio.create_task(blocked())
    await started.wait()
    task.cancel()
    with expect.assertRaises(asyncio.CancelledError):
        await task
    assert events == ["acquire", "release"]
asyncio.run(verify())`,
  },
  {
    note: 5,
    block: 4,
    title: "async generator: break e aclose esplicito",
    probe: String.raw`async def verify():
    events = []
    values = async_values(events)
    async for value in values:
        break
    assert value == 1 and events == []
    await values.aclose()
    assert events == ["generator closed"]
    events.clear()
    values = async_values(events)
    await values.aclose()
    assert events == []
asyncio.run(verify())`,
  },
];
for (const { note, block, title, probe } of cases) {
  test(title, () => run(note, block, probe));
}
