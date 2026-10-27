import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = ["Python - Stringhe e regex", "Python - Numeri e date"];
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
import builtins
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
    exec(compile(request.get("setup", "pass"), "setup", "exec"), namespace)
    compiled = compile(tree, request["heading"], "exec")
    if request.get("expectedError"):
        with namespace["expect"].assertRaises(getattr(builtins, request["expectedError"])):
            exec(compiled, namespace)
    else:
        exec(compiled, namespace)
    namespace["output"] = captured.getvalue()
    exec(compile(request["probe"], "probe", "exec"), namespace)
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
  return JSON.parse(
    launch(
      ["-c", bootstrap],
      JSON.stringify({
        source: blocks[i].get(heading),
        heading,
        probe,
        inputs,
        expectedError,
        setup,
      }),
    ),
  ).output;
}
test("baseline CPython, tzdata e 27 snippet autonomi", () => {
  const versions = JSON.parse(
    launch([
      "-c",
      "import sys,json,tzdata; print(json.dumps([list(sys.version_info[:3]), tzdata.__version__]))",
    ]),
  );
  assert.deepEqual(versions, [[3, 12, 10], "2026.5"]);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [13, 14],
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
    "Accesso e slicing": String.raw`assert output == "6 P n\nyth nohtyP\n\n" and text == "Python"`,
    "Maiuscole e confronto": String.raw`assert output == "hello python\nHELLO PYTHON\nHello Python\nTrue\n"
assert text == "hello PYTHON"`,
    "Spazi, prefissi e suffissi": String.raw`assert text == "  report.csv  "
assert output == "'report.csv'\n'report.csv  '\n'  report.csv'\nreport.csv\nreport\n"`,
    "Cercare e sostituire": String.raw`assert changed == "Python.txt" and text == "Python.py"
assert output == "True True\n2 -1\n2\nPython.txt Python.py\n"`,
    "Dividere e unire": String.raw`assert words == ["alpha","beta"] and fields == ["a","","b",""]
assert output == "['alpha', 'beta']\n['a', '', 'b', '']\nalpha beta\n"`,
    Righe: String.raw`assert lines == ["first","second"] and with_endings == ["first\r\n","second\n"]
assert output == "['first', 'second']\n['first\\r\\n', 'second\\n']\n"`,
    Formattazione: String.raw`assert message == "Ciao Ada, hai 3 messaggi"
assert price_label == "19.90 EUR" and identifier == "0007"
assert price == 19.9 and number == 7`,
    "Verifiche Unicode": String.raw`assert output == "True\nTrue\nTrue\nTrue\nTrue\nFalse\n"`,
    "Validare un identificatore ASCII": "assert is_valid is True",
    "Cercare le corrispondenze": String.raw`assert first == "12" and numbers == ["12","7"]
assert spans == [(3,5),(12,13)] and match.group(0) == first`,
    "Gruppi nominati": String.raw`assert year == "2024" and parts == {"year":"2024","month":"02","day":"29"}`,
    "Sostituire spazi": String.raw`assert result == "alpha beta gamma" and "\n" in text`,
    "Testo letterale in una regex": String.raw`assert result == r"\1 e aaab" and needle == "a+b"`,
  },
  {
    "Conversioni e aggregazioni": String.raw`assert output == "42 3.14 10\n2 6 12\n256 (3, 2)\n"`,
    "Arrotondare float": String.raw`assert output == "3.14\n2 4\n2.67\n"`,
    "Funzioni math": String.raw`assert output == "-4 -3\n4.0\n"`,
    "Confronto tollerante e valori finiti": String.raw`assert output == "False\nTrue\nTrue\nFalse\n"`,
    "Decimali e arrotondamento": String.raw`assert total == Decimal("24.2780") and rounded == Decimal("24.28")
assert str(total) == "24.2780" and str(rounded) == "24.28"`,
    "Valori pseudocasuali": String.raw`assert type(roll) is int and 1 <= roll <= 6
assert selected in ["a","b","c"] and sorted(items) == ["a","b","c"] and result is None
assert output == "True True True\n"`,
    "Token casuali": String.raw`import base64
assert len(base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))) == 32
assert token.isascii() and output == "True\n" and token not in output`,
    "Data e ora correnti": String.raw`assert now_utc.tzinfo is timezone.utc
assert datetime.fromisoformat(iso_value) == now_utc
assert output == "0.0\nTrue\n"`,
    "Parsing ISO": String.raw`assert day == date(2024,2,29)
assert instant.utcoffset().total_seconds() == 0
assert instant.hour == 12 and instant.minute == 30`,
    "Formattazione e formato noto": String.raw`assert label == "01/07/2024 12:30 +0000"
assert parsed.isoformat() == "2026-07-30" and type(parsed).__name__ == "date"`,
    Durate: String.raw`assert tomorrow == date(2024,3,1)
assert expires_at.hour == 12 and expires_at.minute == 30
assert elapsed == timedelta(minutes=30) and output == "2024-03-01\n1800.0\n"`,
    "Fusi orari": String.raw`assert rome.isoformat() == "2024-07-01T14:00:00+02:00"
assert rome.timestamp() == instant.timestamp()`,
    Timestamp: String.raw`assert restored == instant and restored.tzinfo is timezone.utc
assert timestamp == 1719835200.0 and output == "True\n"`,
    "Misurare un intervallo": "assert result == 499500 and elapsed >= 0",
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
    "immutabilita e code point",
    String.raw`
with expect.assertRaises(TypeError): text[0] = "p"
with expect.assertRaises(IndexError): _ = ""[0]
assert len("e\u0301") == 2 and len("\u00e9") == 1
assert len("\u00e9".encode("utf-8")) == 2
`,
  ],
  [
    0,
    "Maiuscole e confronto",
    "casefold non normalizza",
    String.raw`
import unicodedata
assert "e\u0301".casefold() != "\u00e9".casefold()
assert unicodedata.normalize("NFC","e\u0301") == "\u00e9"
`,
  ],
  [
    0,
    "Spazi, prefissi e suffissi",
    "strip tratta un insieme e removeprefix un testo",
    String.raw`
assert "Arthur:".lstrip("Arthur:") == ""
assert "Arthur:".removeprefix("Arthur:") == ""
assert "Arthur".lstrip("Arthur:") == ""
assert "Arthur".removeprefix("Arthur:") == "Arthur"
assert "report.csv".removesuffix(".txt") == "report.csv"
`,
  ],
  [
    0,
    "Cercare e sostituire",
    "find zero e meno uno, count non sovrapposto",
    String.raw`
assert text.find("Python") == 0 and not bool(text.find("Python"))
assert text.find("missing") == -1 and bool(text.find("missing"))
assert "Python" in text and "missing" not in text
assert "aaa".count("aa") == 1
assert "aaa".replace("a","b",1) == "baa"
`,
  ],
  [
    0,
    "Dividere e unire",
    "vuoti, separatori e tipi",
    String.raw`
assert "".split() == [] and "".split(",") == [""]
assert "  ".split() == [] and "a,,b".split(",") == ["a","","b"]
assert "a,b,c".split(",",1) == ["a","b,c"]
with expect.assertRaises(ValueError): text.split("")
with expect.assertRaises(TypeError): ",".join(["a",1])
assert ",".join([]) == ""
`,
  ],
  [
    0,
    "Righe",
    "input vuoto e terminatore finale",
    String.raw`
assert "".splitlines() == [] and "\n".splitlines() == [""]
assert "a\n".splitlines() == ["a"] and "a\n".split("\n") == ["a",""]
assert "a\u2028b".splitlines() == ["a","b"]
`,
  ],
  [
    0,
    "Formattazione",
    "ampiezza minima, tipi e nessun escaping",
    String.raw`
assert f"{12345:04d}" == "12345" and f"{-7:04d}" == "-007"
with expect.assertRaises(ValueError): _ = f'{"7":04d}'
name = "<script>"
assert f"{name}" == "<script>"
`,
  ],
  [
    0,
    "Verifiche Unicode",
    "cifre non convertibili e vuoti",
    String.raw`
assert "\u00b2".isdigit()
with expect.assertRaises(ValueError): int("\u00b2")
assert "\u0661".isdigit() and int("\u0661") == 1
assert not "-12".isdigit() and int("-12") == -12
assert all(not getattr("",name)() for name in ("isalpha","isdigit","isalnum","isspace"))
`,
  ],
  [
    0,
    "Validare un identificatore ASCII",
    "controprova IGNORECASE senza ASCII",
    String.raw`
old = re.compile(r"[a-z0-9_-]+", re.IGNORECASE)
for value in ("\u0130","\u0131","\u017f","\u212a"):
    assert old.fullmatch(value) is not None
    assert pattern.fullmatch(value) is None
`,
  ],
  [
    0,
    "Cercare le corrispondenze",
    "assenza e stringa vuota",
    String.raw`
assert first is None and numbers == spans == []
`,
    { text: "" },
  ],
  [
    0,
    "Cercare le corrispondenze",
    "search match fullmatch e forma findall",
    String.raw`
assert re.search(r"\d+","x12") and re.match(r"\d+","x12") is None
assert re.fullmatch(r"\d+","12x") is None
assert re.findall(r"\d+","\u0661") == ["\u0661"]
assert re.findall(r"[0-9]+","\u0661") == []
assert re.findall(r"([a-z])(\d)","a1 b2") == [("a","1"),("b","2")]
assert re.findall(r"[a-z](\d)","a1 b2") == ["1","2"]
assert re.findall(r"(?:[a-z])\d","a1 b2") == ["a1","b2"]
with expect.assertRaises(re.error): re.compile("[")
`,
  ],
  [
    0,
    "Gruppi nominati",
    "forma non conforme",
    "assert year is None and parts == {}",
    { value: "29/02/2024" },
  ],
  [
    0,
    "Gruppi nominati",
    "calendario non validato dalla regex",
    String.raw`
from datetime import date
assert parts == {"year":"2024","month":"99","day":"99"}
with expect.assertRaises(ValueError): date.fromisoformat(value)
`,
    { value: "2024-99-99" },
  ],
  [
    0,
    "Sostituire spazi",
    "whitespace Unicode e input vuoto",
    String.raw`
assert re.sub(r"\s+"," ","a\u00a0b\nc") == "a b c"
assert re.sub(r"\s+"," "," \t\n ").strip() == ""
`,
  ],
  [
    0,
    "Testo letterale in una regex",
    "pattern e rimpiazzo con ruoli distinti",
    String.raw`
assert re.search(re.escape(needle),"aaab") is None
with expect.assertRaises(re.error): re.sub(re.escape(needle),replacement,text)
assert re.sub(re.escape(needle),lambda m: replacement,"no match") == "no match"
`,
  ],
  [
    1,
    "Conversioni e aggregazioni",
    "parsing, troncamento e aggregazioni vuote",
    String.raw`
with expect.assertRaises(ValueError): int("3.14")
with expect.assertRaises(ValueError): float("3,14")
assert int(-3.9) == -3
with expect.assertRaises(ValueError): min([])
with expect.assertRaises(ValueError): max([])
assert min([],default=None) is None and sum([]) == 0
assert divmod(-17,5) == (-4,3)
with expect.assertRaises(ZeroDivisionError): divmod(1,0)
`,
  ],
  [
    1,
    "Arrotondare float",
    "pareggi negativi e rappresentazione binaria",
    String.raw`
assert round(-2.5) == -2 and round(-3.5) == -4
assert round(2.675,2) == 2.67
assert round(1.25,1) == 1.2 and type(round(2.5)) is int
`,
  ],
  [
    1,
    "Funzioni math",
    "negativi e dominio della radice",
    String.raw`
assert math.floor(-3.9) == -4 and math.ceil(-3.9) == int(-3.9) == -3
with expect.assertRaises(ValueError): math.sqrt(-1)
`,
  ],
  [
    1,
    "Confronto tollerante e valori finiti",
    "zero, NaN, infinito e tolleranza invalida",
    String.raw`
assert not math.isclose(1e-12,0.0)
assert math.isclose(1e-12,0.0,abs_tol=1e-9)
assert math.isfinite(0.0) and not math.isfinite(float("inf"))
assert not math.isclose(float("nan"),float("nan"))
assert math.isclose(float("inf"),float("inf"))
with expect.assertRaises(ValueError): math.isclose(1,1,abs_tol=-1)
`,
  ],
  [
    1,
    "Decimali e arrotondamento",
    "contesto locale, float e modalita esplicita",
    String.raw`
from decimal import getcontext, ROUND_HALF_EVEN
assert getcontext().rounding == ROUND_HALF_EVEN and getcontext().prec == 28
assert Decimal("0.1") != Decimal(0.1)
assert Decimal("2.675").quantize(Decimal("0.01"),rounding=ROUND_HALF_UP) == Decimal("2.68")
assert Decimal("-2.675").quantize(Decimal("0.01"),rounding=ROUND_HALF_UP) == Decimal("-2.68")
assert not Decimal("NaN").is_finite()
with expect.assertRaises(TypeError): Decimal("1") + 0.1
`,
  ],
  [
    1,
    "Valori pseudocasuali",
    "seed isolato e input vuoto",
    String.raw`
control = random.Random(42)
expected_roll = control.randint(1,6)
expected_selected = control.choice(["a","b","c"])
expected_items = ["a","b","c"]
control.shuffle(expected_items)
assert (roll,selected,items) == (expected_roll,expected_selected,expected_items)
with expect.assertRaises(IndexError): rng.choice([])
with expect.assertRaises(ValueError): rng.randint(2,1)
assert rng.shuffle([]) is None
`,
  ],
  [
    1,
    "Token casuali",
    "API chiamata con 32 byte senza pubblicare il token",
    String.raw`
import re
assert re.fullmatch(r"[A-Za-z0-9_-]+",token) is not None
assert token not in output
`,
  ],
  [
    1,
    "Data e ora correnti",
    "naive e aware non si ordinano o sottraggono",
    String.raw`
naive = now_utc.replace(tzinfo=None)
with expect.assertRaises(TypeError): _ = now_utc - naive
with expect.assertRaises(TypeError): _ = now_utc < naive
assert naive != now_utc
`,
  ],
  [
    1,
    "Parsing ISO",
    "date impossibili e forme aggiuntive",
    String.raw`
with expect.assertRaises(ValueError): date.fromisoformat("2023-02-29")
with expect.assertRaises(ValueError): date.fromisoformat("2024-04-31")
assert date.fromisoformat("20240229") == day
assert datetime.fromisoformat("2024-07-01T12:30:00Z") == instant
`,
  ],
  [
    1,
    "Formattazione e formato noto",
    "parsing naive e calendario",
    String.raw`
assert datetime.strptime("30/07/2026","%d/%m/%Y").tzinfo is None
with expect.assertRaises(ValueError): datetime.strptime("31/04/2026","%d/%m/%Y")
assert datetime.strptime("2024-07-01 +0200","%Y-%m-%d %z").utcoffset().total_seconds() == 7200
`,
  ],
  [
    1,
    "Durate",
    "durate negative e componente seconds",
    String.raw`
delta = timedelta(seconds=-1)
assert delta.days == -1 and delta.seconds == 86399 and delta.total_seconds() == -1
assert timedelta(days=2,seconds=1).total_seconds() == 172801
assert date(2024,12,31) + timedelta(days=1) == date(2025,1,1)
with expect.assertRaises(TypeError): timedelta(months=1)
`,
  ],
  [
    1,
    "Fusi orari",
    "conversione invernale e replace non converte",
    String.raw`
winter = datetime(2024,1,1,12,tzinfo=timezone.utc).astimezone(ZoneInfo("Europe/Rome"))
assert winter.isoformat() == "2024-01-01T13:00:00+01:00"
relabelled = instant.replace(tzinfo=ZoneInfo("Europe/Rome"))
assert relabelled.hour == 12 and relabelled.timestamp() != instant.timestamp()
`,
  ],
  [
    1,
    "Fusi orari",
    "DST fold e durata UTC",
    String.raw`
from datetime import timedelta
zone = ZoneInfo("Europe/Rome")
first = datetime(2024,10,27,2,30,tzinfo=zone,fold=0)
second = first.replace(fold=1)
assert first.utcoffset() == timedelta(hours=2)
assert second.utcoffset() == timedelta(hours=1)
assert second - first == timedelta(0)
assert second.astimezone(timezone.utc) - first.astimezone(timezone.utc) == timedelta(hours=1)
`,
  ],
  [
    1,
    "Fusi orari",
    "database mancante produce errore, nessuno skip",
    String.raw`
import sys
import zoneinfo
from unittest.mock import patch
ZoneInfo.clear_cache()
zoneinfo.reset_tzpath(())
blocked = {name: None for name in sys.modules if name == "tzdata" or name.startswith("tzdata.")}
with patch.dict(sys.modules,blocked):
    with expect.assertRaises(zoneinfo.ZoneInfoNotFoundError):
        ZoneInfo("Europe/Rome")
`,
  ],
  [
    1,
    "Timestamp",
    "epoch, round-trip frazioni e naive locale",
    String.raw`
assert datetime.fromtimestamp(0,tz=timezone.utc).isoformat() == "1970-01-01T00:00:00+00:00"
value = instant.replace(microsecond=123456)
assert datetime.fromtimestamp(value.timestamp(),tz=timezone.utc) == value
assert datetime.fromtimestamp(timestamp).tzinfo is None
assert timestamp * 1000 != timestamp
`,
  ],
  [
    1,
    "Misurare un intervallo",
    "contatore monotono",
    String.raw`
from time import get_clock_info
assert get_clock_info("perf_counter").monotonic
assert elapsed >= 0 and result == 499500
`,
  ],
];
for (const [i, heading, label, probe, inputs] of edges)
  test("caso limite: " + label, () => run(i, heading, probe, inputs));
for (const [value, expected] of [
  ["", false],
  ["abc\n", false],
  [" a", false],
  ["a/b", false],
  ["a+b", false],
  ["\u212a", false],
  ["A-0_", true],
  ["123", true],
])
  test("identificatore ASCII: " + JSON.stringify(value), () =>
    run(
      0,
      "Validare un identificatore ASCII",
      "assert is_valid is " + (expected ? "True" : "False"),
      { value },
    ),
  );
for (const value of [
  "2024-07-01T12:30:00",
  "2024-02-30T12:30:00+00:00",
  "not a date",
])
  test("ISO rifiuta: " + value, () =>
    run(1, "Parsing ISO", "pass", { text: value }, "ValueError"),
  );
test("Decimal ripristina il contesto esterno personalizzato", () =>
  run(
    1,
    "Decimali e arrotondamento",
    'assert getcontext().prec == 6 and getcontext().rounding == ROUND_DOWN\nassert total == Decimal("24.2780") and rounded == Decimal("24.28")',
    {},
    undefined,
    "from decimal import getcontext, ROUND_DOWN\ngetcontext().prec = 6\ngetcontext().rounding = ROUND_DOWN",
  ));

test("ISO conserva l'offset esplicito senza imporre UTC", () =>
  run(1, "Parsing ISO", "assert instant.utcoffset().total_seconds() == 7200", {
    text: "2024-07-01T14:30:00+02:00",
  }));
