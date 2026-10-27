import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Python - Sintassi essenziale", "Python - Funzioni"];
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
# Variants change only a declared top-level sample input, not the algorithm.
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
function run(i, heading, probe = "pass", inputs = {}) {
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
    [14, 10],
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
    "Variabili e tipi":
      'assert name == "Ada" and count == 0 and active is True and value is None\nassert output == "NoneType\\nTrue\\nTrue\\nTrue\\nFalse\\n"',
    "Assegnazione e alias":
      'assert items == ["a", "b"] and alias == ["c"] and items is not alias',
    Conversioni:
      'assert copied == values and copied is not values\nassert as_tuple == (1,2,2) and unique == {1,2}\nassert bool("False") is True',
    "Confronti e assenza":
      'assert output == "True\\nFalse\\nTrue\\nTrue\\nTrue\\nTrue\\n"',
    "Condizioni e scelta di un valore":
      'assert result == "B" and status == "offline"',
    "Logica e default": 'assert output == "100\\n0\\n\\nTrue\\n"',
    "For ed enumerate": 'assert output == "a\\nb\\n1 a\\n2 b\\n"',
    "Intervalli con range": 'assert output == "1\\n3\\n5\\n"',
    "While con avanzamento": "assert attempts == limit == 3",
    "Continue, break ed else del ciclo": "assert found == 0",
    Unpacking:
      "assert (first, second) == (10,20)\nassert (head,middle,tail) == (1,[2,3],4)\nassert type(middle) is list",
    "Espansione in liste e dizionari":
      'assert merged == {"timeout":5,"retries":2}\nassert defaults == {"timeout":10,"retries":2}\nassert combined == [1,2,3]\nassert first_list == [1,2] and combined is not first_list',
    "Walrus operator": 'assert match.group() == "42" and output == "42\\n"',
    "Pattern matching": 'assert result == "not found"',
  },
  {
    "Definizione e return": "assert result == 5 and add(2,3) == 5",
    "Valore predefinito":
      'assert greet() == "Ciao Utente"\nassert greet("Ada") == "Ciao Ada"',
    "Default mutabile evitato":
      'assert existing == ["c"] and result is existing',
    "Argomenti posizionali variabili":
      "assert total(1.5,2.5) == 4.0\nassert total() == 0.0 and type(total()) is float",
    "Argomenti nominati variabili":
      'assert settings == {"timeout":5,"retries":2}',
    "Solo posizionali e solo keyword":
      'assert options == {"host":"localhost","port":5432,"timeout":5}',
    "Unpacking nella chiamata":
      'assert add(*arguments) == 5\nassert settings == {"host":"localhost","port":5432,"timeout":5}',
    "Lambda come chiave di ordinamento":
      'assert [u["name"] for u in users] == ["Ada","Grace"]',
    "Restituire piu valori":
      "assert (minimum,maximum) == (1.0,4.0)\nassert type(bounds([2.0])) is tuple",
    "Funzione come argomento": "assert result == 10",
  },
];
for (const [i, group] of probes.entries()) {
  assert.deepEqual([...blocks[i].keys()], Object.keys(group));
  for (const [heading, probe] of Object.entries(group)) {
    test("snippet autonomo: " + heading, () => run(i, heading, probe));
  }
}
for (const [score, expected] of [
  [59, "C"],
  [60, "B"],
  [89, "B"],
  [90, "A"],
]) {
  test("condizioni: confine score=" + score, () =>
    run(
      0,
      "Condizioni e scelta di un valore",
      "assert result == " + JSON.stringify(expected),
      { score },
    ),
  );
}
test("condizione ternaria: ramo true", () =>
  run(0, "Condizioni e scelta di un valore", 'assert status == "online"', {
    active: true,
  }));
test("default: None distinto da falsy e short-circuit", () =>
  run(
    0,
    "Logica e default",
    String.raw`
assert (100 if None is None else None) == 100
for valid in (0, "", [], False):
    assert (100 if valid is None else valid) is valid
calls = []
def evaluate():
    calls.append(True)
    return 7
assert (0 and evaluate()) == 0
assert ("ready" or evaluate()) == "ready"
assert not calls
assert (0 or evaluate()) == 7
assert calls == [True]
`,
  ));
test("conversioni: input invalido, troncamento e iteratore consumato", () =>
  run(
    0,
    "Conversioni",
    String.raw`
with expect.assertRaises(ValueError):
    int("3.14")
assert int(3.9) == 3 and int(-3.9) == -3
it = iter([1,2])
assert list(it) == [1,2] and tuple(it) == ()
nested = [[1]]
shallow = list(nested)
assert shallow is not nested and shallow[0] is nested[0]
`,
  ));
test("unpacking: starred vuoto e numero errato", () =>
  run(
    0,
    "Unpacking",
    String.raw`
left, *rest, right = [1,2]
assert rest == []
with expect.assertRaises(ValueError):
    left, right = [1,2,3]
`,
  ));
for (const [label, items, expected] of [
  ["vuoto", [], null],
  ["senza pari", [1, 3], null],
  ["solo None", [null], null],
  ["prima corrispondenza", [null, 3, 8, 10], 8],
]) {
  test("ciclo: " + label, () =>
    run(
      0,
      "Continue, break ed else del ciclo",
      "assert found == " + (expected === null ? "None" : expected),
      { items },
    ),
  );
}
test("while: zero iterazioni", () =>
  run(0, "While con avanzamento", "assert attempts == 0", { limit: 0 }));
test("walrus: nessuna corrispondenza", () =>
  run(0, "Walrus operator", 'assert match is None and output == ""', {
    text: "nessun numero",
  }));
for (const [code, expected] of [
  [200, "ok"],
  [503, "error"],
]) {
  test("match: stato " + code, () =>
    run(0, "Pattern matching", "assert result == " + JSON.stringify(expected), {
      status_code: code,
    }),
  );
}
test("type hints non validano a runtime", () =>
  run(
    1,
    "Definizione e return",
    String.raw`
assert add("a","b") == "ab"
with expect.assertRaises(TypeError):
    add(1,"b")
`,
  ));
test("default lista: chiamate indipendenti, None e mutazione esplicita", () =>
  run(
    1,
    "Default mutabile evitato",
    String.raw`
first = append_value("a")
second = append_value("b")
assert first == ["a"] and second == ["b"] and first is not second
passed = []
assert append_value("x", passed) is passed
assert passed == ["x"]
assert append_value("x", None) == ["x"]
`,
  ));
test("default valutato alla definizione, non alla chiamata", () =>
  run(
    1,
    "Valore predefinito",
    String.raw`
assert greet.__defaults__ == ("Utente",)
label = "prima"
def frozen(value=label):
    return value
label = "dopo"
assert frozen() == "prima"
`,
  ));
test("kwargs: refusi accettati e oggetti annidati condivisi", () =>
  run(
    1,
    "Argomenti nominati variabili",
    String.raw`
assert configure(timout=5) == {"timout":5}
source = {"nested":[]}
result = configure(**source)
assert result is not source and result["nested"] is source["nested"]
`,
  ));
test("firma: errori di binding e valori predefiniti", () =>
  run(
    1,
    "Solo posizionali e solo keyword",
    String.raw`
assert connection_options("host") == {"host":"host","port":5432,"timeout":10}
assert connection_options("host",8000)["port"] == 8000
with expect.assertRaises(TypeError):
    connection_options(host="host")
with expect.assertRaises(TypeError):
    connection_options("host",5432,5)
with expect.assertRaises(TypeError):
    connection_options("host",5432,port=8000)
`,
  ));
test("unpacking chiamata: duplicati, chiavi non stringa e consumo", () =>
  run(
    1,
    "Unpacking nella chiamata",
    String.raw`
with expect.assertRaises(TypeError):
    connection_options("host",port=5432,**{"port":8000})
with expect.assertRaises(TypeError):
    connection_options("host",**{1:8000})
values = iter([2,3])
assert add(*values) == 5 and list(values) == []
assert {**{"port":5432},**{"port":8000}} == {"port":8000}
`,
  ));
test("sort muta e restituisce None, sorted crea una lista", () =>
  run(
    1,
    "Lambda come chiave di ordinamento",
    String.raw`
original = [{"name":"Z"},{"name":"A"}]
ordered = sorted(original,key=lambda user:user["name"])
assert ordered is not original and original[0]["name"] == "Z"
assert original.sort(key=lambda user:user["name"]) is None
assert original == ordered
`,
  ));
test("bounds: lista/tupla, singleton, input vuoto", () =>
  run(
    1,
    "Restituire piu valori",
    String.raw`
assert bounds((3.0,-2.0,0.0)) == (-2.0,3.0)
assert bounds([2.0]) == (2.0,2.0)
with expect.assertRaises(ValueError):
    bounds([])
with expect.assertRaises(ValueError):
    bounds(())
`,
  ));
test("bounds: controprova del generatore escluso dal contratto", () =>
  run(
    1,
    "Restituire piu valori",
    String.raw`
values = iter([3.0,1.0,4.0])
with expect.assertRaises(ValueError):
    bounds(values)
assert list(values) == []
`,
  ));
test("callback: una chiamata, risultato identico ed eccezioni propagate", () =>
  run(
    1,
    "Funzione come argomento",
    String.raw`
calls = []
marker = object()
def operation(value):
    calls.append(value)
    return marker
assert apply(5,operation) is marker and calls == [5]
def broken(value):
    raise ValueError("test")
with expect.assertRaisesRegex(ValueError,"test"):
    apply(5,broken)
`,
  ));
