import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Python - Liste tuple e set", "Python - Dizionari"];
const titles = ["Python - Liste, tuple e set", "Python - Dizionari"];
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
function launch(args, input) {
  const result = spawnSync(python, ["-I", "-X", "utf8", ...args], {
    input,
    encoding: "utf8",
    timeout: 20000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}
const bootstrap = String.raw`
import ast
import contextlib
import io
import json
import sys
import unittest

assert not sys.flags.optimize
request = json.load(sys.stdin)
tree = ast.parse(request["source"], filename=request["heading"])
# Variants replace only explicit top-level sample inputs.
for name, value in request.get("inputs", {}).items():
    assignments = [
        node for node in tree.body
        if isinstance(node, ast.Assign) and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == name
    ]
    assert len(assignments) == 1, name
    assignments[0].value = ast.parse(repr(value), mode="eval").body
ast.fix_missing_locations(tree)
captured = io.StringIO()
namespace = {"__name__": "note_example", "expect": unittest.TestCase()}
with contextlib.redirect_stdout(captured):
    exec(compile(tree, request["heading"], "exec"), namespace)
    namespace["output"] = captured.getvalue()
    exec(compile(request["probe"], "probe", "exec"), namespace)
print(json.dumps({"output": captured.getvalue()}))
`;
function run(i, heading, probe, inputs = {}) {
  assert.ok(blocks[i].has(heading), heading);
  return JSON.parse(
    launch(
      ["-c", bootstrap],
      JSON.stringify({
        source: blocks[i].get(heading),
        heading,
        probe,
        inputs,
      }),
    ),
  ).output;
}
test("baseline CPython e 24 snippet autonomi", () => {
  assert.match(launch(["--version"]), /3\.12\.10/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [12, 12],
  );
});
for (const [i, name] of names.entries()) {
  test(name + ": metadati e struttura operativa", () => {
    const n = notes[i];
    assert.equal(n.data.title, titles[i]);
    assert.equal(n.data.type, "operational-note");
    assert.equal(n.data.status, "non revisionato");
    assert.equal(n.data.publish, true);
    assert.equal(n.data.topic, "Promemoria Python");
    assert.equal(String(n.data.date), "2026-07-30");
    const headings = n.tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    assert.equal(text(headings.find((n) => n.depth === 1)), titles[i]);
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
    "Accesso e slicing": String.raw`assert output == "10 30 3\n[20, 30]\n[30, 20, 10]\n[]\n"`,
    "Aggiungere elementi": "assert items == [0,10,[20,30],40,50]",
    "Cercare e rimuovere": String.raw`assert items == [10,20] and last == 30
assert output == "True 1 2\n[10, 20] 30\n"`,
    "Svuotare una lista": "assert items == [] and alias is items",
    Ordinare: String.raw`assert ordered == items == [10,20,30] and ordered is not items
assert descending == [30,20,10] and result is None
assert output == "[30, 10, 20] [10, 20, 30]\n[30, 20, 10]\n[10, 20, 30] None\n"`,
    "Ordinare per campo": String.raw`assert [u["name"] for u in by_name] == ["Ada","Grace"]
assert by_name[0] is users[1]
assert [u["name"] for u in users] == ["Grace","Ada"]`,
    "Copie e riferimenti annidati": String.raw`assert items == [[10,99],[20]]
assert copied == [[10,99],[20],[30]]
assert copied is not items and sliced is not items and copied is not sliced
assert copied[0] is items[0] is sliced[0]`,
    "Tuple e unpacking": String.raw`assert (x,y) == point == (10,20)
assert type(single) is tuple and single == (42,)
assert record == ("Ada",["admin"])`,
    "Creare e modificare un set": String.raw`assert ids == {1,2,4}
assert output == "[1, 2, 4]\nTrue\n"`,
    "Operazioni tra set": String.raw`assert left == {1,2} and right == {2,3}
assert output == "[1, 2, 3]\n[2]\n[1]\n[1, 3]\nTrue\nFalse\n"`,
    "Eliminare duplicati": String.raw`assert in_order == ["b","a"] and set(unordered) == {"a","b"}
assert len(unordered) == 2 and values == ["b","a","b"]`,
    "Liste annidate indipendenti": String.raw`assert rows == [[1],[],[]]
assert len({id(row) for row in rows}) == 3`,
  },
  {
    "Accesso e presenza": String.raw`assert len(user) == 4 and "role" not in user
assert output == "Ada\nuser\nNone\nTrue True 4\n"`,
    "Distinguere assenza da None": String.raw`assert result == "not provided" and phone is None
assert missing is not None`,
    "Inserire e aggiornare": String.raw`assert user == {"name":"Ada","active":False,"role":"admin","city":"Roma"}
assert list(user) == ["name","active","role","city"] and result is None`,
    "Unire dizionari": String.raw`assert defaults == settings == overrides and defaults is not settings
assert settings["headers"] is overrides["headers"]
assert output == "10 5\n{'X-Client': 'demo'}\nTrue\n"`,
    "Rimuovere elementi": String.raw`assert role == "admin" and (key,value) == ("active",True) and user == {}`,
    "Iterare su chiavi e coppie": String.raw`assert output == "id\nname\nid 1\nname Ada\n"`,
    "Viste dinamiche e snapshot": String.raw`assert list(keys) == ["name","role"]
assert list(values) == ["Ada","admin"]
assert list(pairs) == [("name","Ada"),("role","admin")]
assert snapshot == [("name","Ada")]`,
    "Raggruppare con setdefault": String.raw`assert groups == {"admin": users}
assert groups["admin"] is not users and groups["admin"][0] is users[0]`,
    "Contare occorrenze": String.raw`assert counts == {"api":2,"db":1} and words == ["api","db","api"]`,
    "Comprehension e filtri": String.raw`assert squares == {1:1,2:4,3:9}
assert active_users == {1:{"active":True}}
assert active_users[1] is users[1] and 2 in users`,
    "Copia superficiale": String.raw`assert user["name"] == "Ada" and copied["name"] == "Grace"
assert copied is not user and expanded is not user and copied is not expanded
assert user["roles"] == ["reader","editor"]
assert copied["roles"] is user["roles"] is expanded["roles"]`,
    "Valori mutabili indipendenti": String.raw`assert groups == {"admin":["Ada"],"reader":[]}
assert groups["admin"] is not groups["reader"]`,
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
    "Accesso e slicing",
    "indici, slice vuote e passo zero",
    String.raw`
assert items[:100] == items and items[100:] == []
assert [] == items[1:1]
with expect.assertRaises(IndexError): _ = items[3]
with expect.assertRaises(IndexError): _ = [][-1]
with expect.assertRaises(ValueError): _ = items[::0]
`,
  ],
  [
    0,
    "Aggiungere elementi",
    "mutatori restituiscono None ed extend itera le stringhe",
    String.raw`
assert items.append(60) is None
assert items.extend("ab") is None and items[-2:] == ["a","b"]
assert items.insert(0, -1) is None and items[0] == -1
assert items.remove(-1) is None
assert items.reverse() is None
assert items.clear() is None and items == []
`,
  ],
  [
    0,
    "Cercare e rimuovere",
    "assenza e pop vuoto",
    String.raw`
assert 99 not in items and items.count(99) == 0
with expect.assertRaises(ValueError): items.index(99)
with expect.assertRaises(ValueError): items.remove(99)
with expect.assertRaises(IndexError): items.pop(99)
assert items.pop(0) == 10 and items == [20]
items.clear()
with expect.assertRaises(IndexError): items.pop()
`,
  ],
  [
    0,
    "Svuotare una lista",
    "nuova assegnazione distinta da clear",
    String.raw`
items = [1]
alias = items
items = []
assert alias == [1] and alias is not items
`,
  ],
  [
    0,
    "Ordinare",
    "input vuoto, iterabile e tipi non ordinabili",
    String.raw`
assert sorted([]) == [] and sorted((3,1)) == [1,3]
with expect.assertRaises(TypeError): sorted([1,"2"])
it = iter([3,1])
assert sorted(it) == [1,3] and list(it) == []
`,
  ],
  [
    0,
    "Ordinare per campo",
    "stabilita a parita di chiave",
    String.raw`
assert [u["id"] for u in by_name] == [2,3,1]
`,
    {
      users: [
        { name: "B", id: 1 },
        { name: "A", id: 2 },
        { name: "A", id: 3 },
      ],
    },
  ],
  [
    0,
    "Copie e riferimenti annidati",
    "copia profonda separata e alias esplicito",
    String.raw`
from copy import deepcopy
deep = deepcopy(items)
deep[0].append(7)
assert items == [[10,99],[20]]
assert deep[0] is not items[0]
alias = items
assert alias is items
`,
  ],
  [
    0,
    "Tuple e unpacking",
    "immutabilita, hashability e arita",
    String.raw`
assert type((42)) is int and type((42,)) is tuple
assert {point:"ok"}[(10,20)] == "ok"
with expect.assertRaises(TypeError): record[0] = "Grace"
with expect.assertRaises(TypeError): hash(record)
with expect.assertRaises(ValueError): a,b,c = point
`,
  ],
  [
    0,
    "Creare e modificare un set",
    "assenza, elementi non hashable e pop",
    String.raw`
assert type({}) is dict and type(set()) is set
assert ids.discard(99) is None
with expect.assertRaises(KeyError): ids.remove(99)
with expect.assertRaises(TypeError): ids.add([])
with expect.assertRaises(TypeError): _ = ids[0]
before = ids.copy()
picked = ids.pop()
assert picked in before and ids == before - {picked}
with expect.assertRaises(KeyError): set().pop()
`,
  ],
  [
    0,
    "Operazioni tra set",
    "unione non mutante e aggiornamento in place",
    String.raw`
merged = left | right
assert merged is not left and left == {1,2}
alias = left
left |= right
assert alias is left and left == {1,2,3}
assert not left.isdisjoint({3}) and left.isdisjoint(set())
assert left <= left and not left < left
`,
  ],
  [
    0,
    "Eliminare duplicati",
    "input vuoto",
    "assert in_order == unordered == []",
    { values: [] },
  ],
  [
    0,
    "Eliminare duplicati",
    "duplicati numerici uguali",
    "assert in_order == [True] and type(in_order[0]) is bool\nassert len(unordered) == 1",
    { values: [true, 1, 1.0] },
  ],
  [
    0,
    "Eliminare duplicati",
    "elementi non hashable rifiutati",
    String.raw`
with expect.assertRaises(TypeError): list(set([[1]]))
with expect.assertRaises(TypeError): list(dict.fromkeys([[1]]))
`,
  ],
  [
    0,
    "Liste annidate indipendenti",
    "moltiplicazione condivide la lista interna",
    String.raw`
shared = [[]] * 3
shared[0].append(1)
assert shared == [[1],[1],[1]]
assert shared[0] is shared[1] is shared[2]
`,
  ],
  [
    1,
    "Accesso e presenza",
    "KeyError, get e falsy",
    String.raw`
with expect.assertRaises(KeyError): _ = user["missing"]
assert user.get("missing") is None and "missing" not in user
assert "Ada" not in user and "Ada" in user.values()
for valid in (None,0,False,"",[]):
    data = {"key":valid}
    assert data.get("key","fallback") is valid
`,
  ],
  [
    1,
    "Distinguere assenza da None",
    "chiave assente",
    'assert result == "absent" and phone is missing',
    { user: {} },
  ],
  [
    1,
    "Distinguere assenza da None",
    "valore presente",
    'assert result == "123" and phone == "123"',
    { user: { phone: "123" } },
  ],
  [
    1,
    "Inserire e aggiornare",
    "reinserimento e chiavi uguali",
    String.raw`
del user["name"]
user["name"] = "Ada"
assert list(user)[-1] == "name"
data = {1:"first", True:"second", 1.0:"third"}
assert len(data) == 1 and data[1] == "third"
with expect.assertRaises(TypeError): user[[]] = "bad"
`,
  ],
  [
    1,
    "Unire dizionari",
    "ordine e alias dell'aggiornamento",
    String.raw`
first = {"a":1,"b":2}
second = {"a":3,"c":4}
merged = first | second
assert list(merged) == ["a","b","c"] and merged == {"a":3,"b":2,"c":4}
assert first == {"a":1,"b":2}
alias = first
first |= second
assert first is alias and first == merged
`,
  ],
  [
    1,
    "Rimuovere elementi",
    "assenza e LIFO di inserimento",
    String.raw`
assert user.pop("missing",None) is None
with expect.assertRaises(KeyError): user.pop("missing")
with expect.assertRaises(KeyError): del user["missing"]
with expect.assertRaises(KeyError): user.popitem()
data = {"a":1,"b":2}
data["a"] = 9
assert data.popitem() == ("b",2)
`,
  ],
  [
    1,
    "Iterare su chiavi e coppie",
    "cambio dimensione durante iterazione",
    String.raw`
iterator = iter(user)
next(iterator)
user["new"] = 3
with expect.assertRaises(RuntimeError): next(iterator)
`,
  ],
  [
    1,
    "Viste dinamiche e snapshot",
    "snapshot superficiale e valori aggiornati",
    String.raw`
user["name"] = "Grace"
assert list(values) == ["Grace","admin"]
assert list(pairs)[0] == ("name","Grace")
assert snapshot == [("name","Ada")]
data = {"roles":[]}
snapshot2 = list(data.items())
data["roles"].append("admin")
assert snapshot2[0][1] is data["roles"] and snapshot2[0][1] == ["admin"]
`,
  ],
  [
    1,
    "Raggruppare con setdefault",
    "piu gruppi indipendenti",
    String.raw`
assert groups == {"admin":[users[0],users[2]],"reader":[users[1]]}
assert groups["admin"] is not groups["reader"]
`,
    {
      users: [
        { name: "Ada", role: "admin" },
        { name: "Grace", role: "reader" },
        { name: "Linus", role: "admin" },
      ],
    },
  ],
  [
    1,
    "Raggruppare con setdefault",
    "None esistente e valutazione del default",
    String.raw`
data = {"a":None}
with expect.assertRaises(AttributeError): data.setdefault("a",[]).append(1)
assert data["a"] is None
calls = []
def factory():
    calls.append(True)
    return []
data = {"a":[]}
assert data.setdefault("a",factory()) is data["a"] and calls == [True]
`,
  ],
  [
    1,
    "Contare occorrenze",
    "input vuoto",
    "assert counts == {}",
    { words: [] },
  ],
  [
    1,
    "Comprehension e filtri",
    "vuoto, duplicati e campo obbligatorio",
    String.raw`
assert {v:v*v for v in []} == {}
records = [(1,"first"),(1,"last")]
assert {key:value for key,value in records} == {1:"last"}
users[1]["active"] = False
assert active_users[1]["active"] is False
with expect.assertRaises(KeyError): _ = {}["active"]
`,
  ],
  [
    1,
    "Copia superficiale",
    "copie esterne separate",
    String.raw`
copied["new"] = True
assert "new" not in user and "new" not in expanded
del expanded["roles"]
assert "roles" in user and "roles" in copied
`,
  ],
  [
    1,
    "Valori mutabili indipendenti",
    "fromkeys condivide il default mutabile",
    String.raw`
shared = dict.fromkeys(keys,[])
shared["admin"].append("Ada")
assert shared["reader"] == ["Ada"]
assert shared["reader"] is shared["admin"]
assert groups["reader"] == []
`,
  ],
];
for (const [i, heading, label, probe, inputs] of edges)
  test("caso limite: " + label, () => run(i, heading, probe, inputs));
