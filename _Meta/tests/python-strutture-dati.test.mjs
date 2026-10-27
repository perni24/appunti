import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Liste", "Tuple", "Set", "Dizionari", "Comprehensions"];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
const bootstrap = `
import contextlib
import io
import json
import sys
import unittest
assert sys.version_info[:2] == (3, 12)
assert sys.flags.optimize == 0
request = json.load(sys.stdin)
captured = io.StringIO()
namespace = {"__name__": "note_example", "expect": unittest.TestCase()}
with contextlib.redirect_stdout(captured):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "note-test", "exec"), namespace)
sys.stdout.write(json.dumps({"output": captured.getvalue(), "version": sys.version}))
`;
function run(note, block, probe = "pass") {
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
    `assert (first, last, removed) == ("apple", "pear", "grape")
assert items == ["apple", "lime", "kiwi", "orange", "plum"]`,
    `assert numbers == [0, 1, 2, 3, 4, 5]
assert changed == [0, 10, 20, 30, 3, 4, 5]`,
    `assert ordered == [("second", 1), ("first", 2), ("third", 2)]
assert records == [("first", 2), ("second", 1), ("third", 2)]
assert values == [3, 2, 1] and result is None`,
    `assert passing_average([18, 30, 24, 12, 28]) == 25.0
assert passing_average([]) is None`,
    `assert copied is not rows and copied[0] is rows[0]
assert repeated[0] is repeated[1] is repeated[2]
assert independent == [[1], [], []] and independent[0] is not independent[1]`,
  ],
  [
    `assert point == (10, 20) and single == (5,) and empty == ()
assert coordinates == (45.0, 9.0) and from_iterable == (1, 2, 3)
assert values.count(2) == 2 and values.index(3) == 3`,
    `assert (first, middle, last) == (10, [20, 30], 40)
assert head == 7 and tail == [] and isinstance(tail, list)
assert (left, right) == ("L", "R")`,
    `assert record == ("draft", ["python", "notes"])
assert stock[("warehouse-a", "sku-1")] == 4`,
    `assert (low, high) == (3, 12)
assert bounds((0,)) == (0, 0)`,
    `assert origin == (0, 0) and shifted == (10, 0)
assert type(shifted) is Point`,
  ],
  [
    `assert empty == set() and colors == {"blue", "green", "yellow"}
assert letters == {"a", "b"} and len({1, 1.0, True}) == 1`,
    `assert a | b == {1, 2, 3, 4, 5}
assert a & b == {3} and a - b == {1, 2} and a ^ b == {1, 2, 4, 5}
assert {1, 2} <= a and a.isdisjoint({8})
assert a.intersection([2, 9]) == {2}`,
    `assert required == {"read", "write"}
assert profiles[frozenset({"write", "read"})] == "editor"`,
    `assert to_add == {"reviewed"} and to_remove == {"draft"}
assert unchanged == {"python"} and current == {"python", "draft"}`,
    `assert unique_in_order(["blue", "red", "blue"]) == ["blue", "red"]
assert unique_in_order([]) == []`,
  ],
  [
    `assert email == "ada@example.com" and phone is None
assert nickname is missing and "nickname" not in user`,
    `assert list(keys) == ["theme", "size", "language"]
assert snapshot == [("theme", "light"), ("size", 12)]`,
    `assert list(merged.items()) == [("theme", "light"), ("size", 16), ("language", "it")]
assert defaults == {"theme": "light", "size": 12}
assert result is None and removed == "it" and fallback is None`,
    `assert shared["a"] is shared["b"] and shared == {"a": [1], "b": [1]}
assert separate["a"] is not separate["b"] and separate == {"a": [1], "b": []}`,
    `assert users_by_id == {1: {"id": 1, "email": "a@example.com"}, 2: {"id": 2, "email": "b@example.com"}}
assert users[0]["email"] == " a@example.com " and "internal" not in users_by_id[1]
assert users_by_id.get(99) is None`,
  ],
  [
    `assert squares == [4, 1, 0, 1, 4] and even_numbers == [-2, 0, 2]
assert labels == ["even", "odd", "even", "odd", "even"]`,
    `assert lengths == {"Ada": 3, "Lin": 3} and unique_lengths == {3}
assert last_value == {"mode": "ready"}`,
    `assert flattened == [1, 2, 3] and doubled == [0, 2, 4]
assert x == "outside"`,
    `assert active_labels(records) == ["Python", "Python"]`,
    `assert suffixes == [".md", ".png", "", "", ".gz"]
assert extensions == {".gz", ".md", ".png"}`,
    `assert list(squares) == []
assert sum(value * value for value in numbers) == 14`,
    `assert [function() for function in late] == [2, 2, 2]
assert [function() for function in bound] == [0, 1, 2]`,
  ],
];
test("27 blocchi autonomi e baseline CPython 3.12", () => {
  assert.deepEqual(
    blocks.map((items) => items.length),
    [5, 5, 5, 5, 7],
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
    assert.equal(note.data.type, "technical-note");
    assert.equal(String(note.data.date), "2026-06-03");
    assert.equal(
      note.tree.children.filter((n) => n.type === "heading" && n.depth === 1)
        .length,
      1,
    );
    assert.ok(note.body.includes("# " + note.data.title));
    for (const title of [
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
    ]) {
      assert.ok(note.body.includes("## " + title), title);
    }
    assert.ok(note.body.includes("https://docs.python.org/3.12/"));
  });
  for (const [j, probe] of expected[i].entries()) {
    test(name + ": blocco autonomo " + (j + 1) + " e risultato", () =>
      run(i, j, probe),
    );
  }
}
const cases = [
  [
    "Liste: append/extend, ritorni ed errori",
    0,
    0,
    `
values = [1, 2, 1]
assert values.append([3]) is None and values[-1] == [3]
assert values.extend("ab") is None and values[-2:] == ["a", "b"]
assert values.remove(1) is None and values == [2, 1, [3], "a", "b"]
assert values.index(1) == 1 and values.count(1) == 1
with expect.assertRaises(ValueError):
    values.remove("absent")
with expect.assertRaises(ValueError):
    values.index("absent")
with expect.assertRaises(IndexError):
    values[99]
with expect.assertRaises(IndexError):
    [].pop()
assert values.clear() is None and values == []
`,
  ],
  [
    "Liste: slicing, step e alias",
    0,
    1,
    `
assert numbers[20:30] == [] and numbers[-20:20] == numbers
assert numbers[::-1] == [5, 4, 3, 2, 1, 0] and numbers[:-1:-1] == []
with expect.assertRaises(ValueError):
    numbers[::0]
copy = numbers[:]
copy[::2] = [10, 20, 30]
assert copy == [10, 1, 20, 3, 30, 5]
with expect.assertRaises(ValueError):
    copy[::2] = [99]
alias = copy
copy[:] = [7]
assert alias == [7] and alias is copy
copy = []
assert alias == [7]
`,
  ],
  [
    "Liste: sort stabile, key una volta e riferimenti",
    0,
    2,
    `
calls = []
def key(row):
    calls.append(row)
    return row[1]
assert sorted(records, key=key, reverse=True) == [("first", 2), ("third", 2), ("second", 1)]
assert len(calls) == len(records)
rows = [{"rank": 2}, {"rank": 1}]
ordered_rows = sorted(rows, key=lambda row: row["rank"])
assert ordered_rows[0] is rows[1]
with expect.assertRaises(TypeError):
    sorted([1, "2"])
assert values.reverse() is None and values == [1, 2, 3]
`,
  ],
  [
    "Liste: media, vuoto, zero, errori e consumo parziale",
    0,
    3,
    `
assert passing_average([0, 12, 17]) is None
assert passing_average([18]) == 18.0
source = [0, 18, 30]
assert passing_average(source) == 24 and source == [0, 18, 30]
for invalid in [True, False, 18.0, "18", None, []]:
    with expect.assertRaises(TypeError):
        passing_average([invalid])
for invalid in [-1, 31]:
    with expect.assertRaises(ValueError):
        passing_average([invalid])
iterator = iter([18, "bad", 30])
with expect.assertRaises(TypeError):
    passing_average(iterator)
assert list(iterator) == [30]
`,
  ],
  [
    "Liste: deepcopy e alias interni",
    0,
    4,
    `
from copy import deepcopy
nested = [["x"]] * 2
clone = deepcopy(nested)
assert clone is not nested and clone[0] is not nested[0]
assert clone[0] is clone[1]
clone[0].append("y")
assert nested == [["x"], ["x"]] and clone == [["x", "y"], ["x", "y"]]
`,
  ],
  [
    "Tuple: virgola e errori di unpacking",
    1,
    1,
    `
assert type((5)) is int and type((5,)) is tuple
for text in ["a, b = (1,)", "a, b = (1, 2, 3)", "a, *b, c = (1,)"]:
    with expect.assertRaises(ValueError):
        exec(text, {})
with expect.assertRaises(TypeError):
    a, b = 42
assert type(middle) is list and type(tail) is list
`,
  ],
  [
    "Tuple: mutazione prima del TypeError con +=",
    1,
    2,
    `
inner = record[1]
with expect.assertRaises(TypeError):
    record[1] += ["extra"]
assert record[1] is inner and inner == ["python", "notes", "extra"]
with expect.assertRaises(TypeError):
    record[1] = []
assert record[1] is inner
`,
  ],
  [
    "Tuple: hashability e metodi",
    1,
    0,
    `
assert {("a", 1): "value"}[("a", True)] == "value"
with expect.assertRaises(TypeError):
    hash(("a", []))
with expect.assertRaises(ValueError):
    values.index(9)
with expect.assertRaises(IndexError):
    point[99]
with expect.assertRaises(AttributeError):
    point.append(1)
assert sorted((3, 1, 2)) == [1, 2, 3]
`,
  ],
  [
    "Tuple: bounds, generatore e errori",
    1,
    3,
    `
iterator = iter([9, -4, 0, 12])
assert bounds(iterator) == (-4, 12) and list(iterator) == []
with expect.assertRaises(ValueError):
    bounds([])
for invalid in [True, 1.0, "1", None]:
    with expect.assertRaises(TypeError):
        bounds([invalid])
with expect.assertRaises(TypeError):
    bounds(None)
`,
  ],
  [
    "Tuple: namedtuple non valida i tipi ne congela i contenuti",
    1,
    4,
    `
assert origin is not shifted
with expect.assertRaises(AttributeError):
    origin.x = 2
untyped = Point("text", [])
untyped.y.append(3)
assert untyped.x == "text" and untyped.y == [3]
`,
  ],
  [
    "Set: add/update, pop e hashability",
    2,
    0,
    `
values = set()
assert values.add("ab") is None and values.update("ab") is None
assert values == {"ab", "a", "b"}
assert values.discard("missing") is None
with expect.assertRaises(KeyError):
    values.remove("missing")
before = values.copy()
removed = values.pop()
assert removed in before and values == before - {removed}
with expect.assertRaises(KeyError):
    set().pop()
for value in [[], {}, set(), ([],)]:
    with expect.assertRaises(TypeError):
        values.add(value)
with expect.assertRaises(TypeError):
    values.discard([])
`,
  ],
  [
    "Set: operatori, iterabili e sottoinsiemi",
    2,
    1,
    `
assert a.intersection(iter([2, 9])) == {2}
with expect.assertRaises(TypeError):
    a & [2, 9]
assert not ({1} < {2, 3}) and {1} < {1, 2}
assert a - b != b - a
alias = a
a |= {9}
assert alias is a and 9 in alias
a.intersection_update([1, 9])
assert a == {1, 9}
`,
  ],
  [
    "Set: frozenset e tipo del primo operando",
    2,
    2,
    `
assert type(required | {"execute"}) is frozenset
assert type({"execute"} | required) is set
with expect.assertRaises(AttributeError):
    required.add("execute")
assert {required} == {frozenset({"write", "read"})}
`,
  ],
  [
    "Set: deduplica ordinata, uguaglianza e riferimenti",
    2,
    4,
    `
source = ["b", "a", "b", "c", "a"]
assert unique_in_order(iter(source)) == ["b", "a", "c"]
assert source == ["b", "a", "b", "c", "a"]
assert unique_in_order([1, True, 1.0, 2]) == [1, 2]
with expect.assertRaises(TypeError):
    unique_in_order([[]])
class Item:
    pass
item = Item()
assert unique_in_order([item, item])[0] is item
assert list(dict.fromkeys(source)) == unique_in_order(source)
`,
  ],
  [
    "Dizionari: sentinel, assenza e default eager",
    3,
    0,
    `
events = []
def default():
    events.append("called")
    return "fallback"
assert user.get("phone", default()) is None and events == ["called"]
assert "ada@example.com" not in user and "ada@example.com" in user.values()
with expect.assertRaises(KeyError):
    user["missing"]
assert nickname is missing and user["phone"] is None
`,
  ],
  [
    "Dizionari: ordine, uguaglianza e chiavi numeriche",
    3,
    2,
    `
data = {"a": 1, "b": 2}
data["a"] = 9
assert list(data) == ["a", "b"]
del data["a"]
data["a"] = 1
assert list(data) == ["b", "a"] and data == {"a": 1, "b": 2}
assert data.popitem() == ("a", 1)
numbers = {1: "int", 1.0: "float", True: "bool"}
assert len(numbers) == 1 and numbers[1] == "bool"
`,
  ],
  [
    "Dizionari: viste dinamiche e snapshot superficiale",
    3,
    1,
    `
assert "language" in keys
nested = {"items": []}
view = nested.items()
snapshot = list(view)
nested["items"].append(1)
nested["extra"] = True
assert len(view) == 2 and len(snapshot) == 1
assert snapshot[0][1] is nested["items"] and snapshot[0][1] == [1]
iterator = iter(nested)
next(iterator)
nested["new"] = 3
with expect.assertRaises(RuntimeError):
    next(iterator)
`,
  ],
  [
    "Dizionari: merge superficiale e update",
    3,
    2,
    `
left = {"nested": {"left": 1}, "shared": []}
right = {"nested": {"right": 2}}
joined = left | right
assert joined["nested"] is right["nested"] and joined["shared"] is left["shared"]
assert joined["nested"] == {"right": 2}
target = {}
assert target.update([("a", 1), ("a", 2)]) is None and target == {"a": 2}
with expect.assertRaises(TypeError):
    left | [("a", 1)]
copy = left.copy()
assert copy is not left and copy["shared"] is left["shared"]
`,
  ],
  [
    "Dizionari: factory, setdefault e proxy",
    3,
    3,
    `
from collections import defaultdict
from types import MappingProxyType
events = []
def factory():
    events.append("created")
    return []
groups = defaultdict(factory)
assert groups.get("a") is None and events == [] and "a" not in groups
groups["a"].append(1)
assert events == ["created"] and groups["a"] == [1]
assert groups.setdefault("a", factory()) == [1] and len(events) == 2
proxy = MappingProxyType(groups)
groups["b"] = []
assert "b" in proxy
proxy["b"].append(2)
assert groups["b"] == [2]
with expect.assertRaises(TypeError):
    proxy["c"] = []
`,
  ],
  [
    "Dizionari: indice indipendente, proiezione e duplicati",
    3,
    4,
    `
assert index_users([]) == {}
projected = index_users(iter(users))
assert list(projected) == [1, 2]
assert projected[1] is not users[0] and set(projected[1]) == {"id", "email"}
projected[1]["email"] = "changed"
assert users[0]["email"] == " a@example.com "
with expect.assertRaises(ValueError):
    index_users([users[0], users[0]])
assert index_users([{"id": 3, "email": "not-an-email"}])[3]["email"] == "not-an-email"
`,
  ],
  [
    "Dizionari: ID e email errati, consumo parziale",
    3,
    4,
    `
for bad in [None, [], {"email": "a"}, {"id": True, "email": "a"}, {"id": 1.0, "email": "a"}, {"id": 1}, {"id": 1, "email": 2}]:
    with expect.assertRaises(TypeError):
        index_users([bad])
for bad in [{"id": 0, "email": "a"}, {"id": -1, "email": "a"}, {"id": 1, "email": "  "}]:
    with expect.assertRaises(ValueError):
        index_users([bad])
iterator = iter([users[0], users[0], users[1]])
with expect.assertRaises(ValueError):
    index_users(iterator)
assert list(iterator) == [users[1]]
`,
  ],
  [
    "Comprehensions: filtri e ordine dei cicli",
    4,
    0,
    `
assert [10 // value for value in [0, 2, 5] if value] == [5, 2]
assert [(x, y) for x in [1, 2] for y in ["a", "b"]] == [(1, "a"), (1, "b"), (2, "a"), (2, "b")]
with expect.assertRaises(TypeError):
    {[] for _ in range(1)}
with expect.assertRaises(TypeError):
    {[]: value for value in range(1)}
`,
  ],
  [
    "Comprehensions: etichette, scarto e non mutazione",
    4,
    3,
    `
from copy import deepcopy
source = [{"label": " A ", "active": True}, {"label": "B", "active": 1}, {"label": "C", "active": "true"}, {}, None, {"label": "", "active": True}, {"label": " A ", "active": True}]
before = deepcopy(source)
assert active_labels(iter(source)) == ["A", "A"]
assert source == before and active_labels([]) == []
assert active_labels([{"label": "<b>text</b>", "active": True}]) == ["<b>text</b>"]
`,
  ],
  [
    "Comprehensions: suffissi nella baseline 3.12",
    4,
    4,
    `
assert PurePosixPath(".env").suffix == ""
assert PurePosixPath("name.").suffix == ""
assert PurePosixPath("archive.tar.gz").suffix == ".gz"
assert PurePosixPath("malware.jpg.exe").suffix == ".exe"
assert PurePosixPath("README").suffix == ""
`,
  ],
  [
    "Comprehensions: generatore, timing e errori",
    4,
    5,
    `
events = []
def source():
    events.append("source")
    return [1, 2]
factor = 2
iterator = (value * factor for value in source())
assert events == ["source"]
factor = 3
assert list(iterator) == [3, 6] and list(iterator) == []
with expect.assertRaises(TypeError):
    (value for value in None)
failing = (1 / value for value in [0])
with expect.assertRaises(ZeroDivisionError):
    next(failing)
assert tuple(value for value in range(3)) == (0, 1, 2)
`,
  ],
  [
    "Comprehensions: scope, closure e walrus",
    4,
    6,
    `
assert [function() for function in late] == [2, 2, 2]
assert [function() for function in bound] == [0, 1, 2]
state = []
captured = [lambda item=state: item for _ in range(2)]
state.append(1)
assert captured[0]() is state and captured[1]() == [1]
scope = {}
exec("values = [item for item in range(3)]", scope)
assert "item" not in scope
exec("values = [(last := item) for item in range(3)]", scope)
assert scope["last"] == 2
`,
  ],
  [
    "Comprehensions: riferimenti ed effetti non annullati",
    4,
    2,
    `
source = [{"items": []}]
selected = [record for record in source]
assert selected is not source and selected[0] is source[0]
events = []
def transform(value):
    events.append(value)
    if value == 2:
        raise ValueError("stop")
    return value
previous = ["unchanged"]
with expect.assertRaises(ValueError):
    previous = [transform(value) for value in [1, 2, 3]]
assert previous == ["unchanged"] and events == [1, 2]
`,
  ],
];
for (const [title, note, block, probe] of cases) {
  test(title, () => run(note, block, probe));
}
