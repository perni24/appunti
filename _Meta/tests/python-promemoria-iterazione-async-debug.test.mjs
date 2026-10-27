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
import { join, dirname, basename } from "node:path";
import { test, after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Python - Comprehension iteratori e generatori",
  "Python - Asyncio e concorrenza",
  "Python - Eccezioni log e debug",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Promemoria/Pagine/" + name + ".md"),
);
const text = (n) => n.value ?? (n.children ?? []).map(text).join("");
const blocks = notes.map((note) => {
  let heading;
  const result = new Map();
  for (const n of note.tree.children) {
    if (n.type === "heading") heading = text(n);
    if (n.type === "code" && n.lang === "python") {
      assert.ok(!result.has(heading), heading);
      result.set(heading, n.value);
    }
  }
  return result;
});
const parent = realpathSync(tmpdir());
const root = mkdtempSync(join(parent, "appunti-python-final-memos-"));
after(() => {
  const actual = realpathSync(root);
  assert.equal(dirname(actual), parent);
  assert.ok(basename(actual).startsWith("appunti-python-final-memos-"));
  assert.equal(actual, root);
  rmSync(actual, { recursive: true, force: true });
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
from unittest.mock import patch

assert not sys.flags.optimize
request = json.load(sys.stdin)
expect = unittest.TestCase()
tempfile.tempdir = str(Path.cwd() / "files")
source = request["source"]
tree = ast.parse(source)
# Only sample-data assignments are replaced; operations remain the note's code.
for name, value in request.get("inputs", {}).items():
    targets = [
        node for node in tree.body
        if isinstance(node, ast.Assign) and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name) and node.targets[0].id == name
    ]
    assert len(targets) == 1, name
    targets[0].value = ast.parse(repr(value), mode="eval").body
ast.fix_missing_locations(tree)
namespace = {
    "__name__": "__main__", "expect": expect, "Path": Path,
    "patch": patch, "source_code": source,
}
out, err = io.StringIO(), io.StringIO()
with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
    exec(request.get("setup", "pass"), namespace)
    if request.get("expectedError"):
        with expect.assertRaises(getattr(builtins, request["expectedError"])):
            exec(compile(tree, "note-snippet", "exec"), namespace)
    else:
        exec(compile(tree, "note-snippet", "exec"), namespace)
    namespace.update(captured_output=out.getvalue(), captured_error=err.getvalue())
    exec(request["probe"], namespace)
assert not list(Path(tempfile.tempdir).iterdir()), "Snippet left temporary resources"
print(json.dumps({"output": out.getvalue(), "error": err.getvalue()}))
`;
let counter = 0;
function run(
  i,
  heading,
  probe = "pass",
  { inputs = {}, setup = "pass", expectedError } = {},
) {
  const source = blocks[i].get(heading);
  assert.ok(source, heading);
  const cwd = join(root, String(counter++));
  mkdirSync(cwd);
  mkdirSync(join(cwd, "files"));
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    cwd,
    input: JSON.stringify({ source, probe, inputs, setup, expectedError }),
    encoding: "utf8",
    windowsHide: true,
    timeout: 20000,
    maxBuffer: 2 ** 21,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
function cases(i, heading, rows) {
  for (const [name, probe, options] of rows)
    test(heading + ": " + name, () => run(i, heading, probe, options));
}
test("baseline e copertura dei 33 blocchi", () => {
  const r = spawnSync(python, ["--version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /3\.12\.10/);
  assert.deepEqual(
    blocks.map((b) => b.size),
    [14, 8, 11],
  );
});
for (const [i, name] of names.entries())
  test(name + ": metadati e struttura", () => {
    const n = notes[i];
    assert.equal(n.data.type, "operational-note");
    assert.equal(n.data.status, "non revisionato");
    assert.equal(n.data.publish, true);
    assert.equal(String(n.data.date), "2026-07-30");
    const headings = n.tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    assert.equal(text(headings[0]), n.data.title);
    for (const label of [
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
        headings.some((n) => text(n) === label),
        label,
      );
    for (let j = 1; j < headings.length; j++)
      assert.ok(headings[j].depth <= headings[j - 1].depth + 1);
  });
const expected = [
  [
    "List comprehension",
    "assert squares == [4,1,0,1,4] and even == [-2,0,2]\nassert labels == ['even','odd','even','odd','even']",
  ],
  [
    "Dict comprehension",
    "assert by_id[1] is users[-1] and by_id[1]['name'] == 'Lin'",
  ],
  ["Set comprehension", "assert unique_lengths == {1,2}"],
  ["Comprehension annidata", "assert flat == [1,2,3]"],
  ["Enumerate", "assert captured_output == '1 Ada\\n2 Lin\\n'"],
  ["Zip rigoroso", "assert pairs == [('Ada',10),('Lin',20)]"],
  [
    "Iteratore e sentinella",
    "assert first is None\nassert next(iterator,missing) is missing",
  ],
  [
    "Generatore",
    "assert list(ids) == []\nassert list(read_ids(rows)) == [10,20]",
  ],
  ["Generator expression", "assert captured_output == '14\\n0\\n'"],
  ["Yield from", "assert list(flatten([[1],[],[2]])) == [1,2]"],
  [
    "Concatenare con chain",
    "assert list(combined) == [] and first == [1,2] and second == [3]",
  ],
  [
    "Limitare con islice",
    "assert first_ten == list(range(10))\nassert next(values) == 11",
  ],
  [
    "Raggruppare con groupby",
    "assert [(r,len(g)) for r,g in groups] == [('admin',2),('reader',1)]",
  ],
  [
    "Chiudere dopo un consumo parziale",
    "assert events == ['closed']\nassert list(values) == []",
  ],
];
for (const [h, probe] of expected)
  test("snippet iterazione: " + h, () => run(0, h, probe));
cases(0, "List comprehension", [
  [
    "input vuoto",
    "assert squares == even == labels == []",
    { inputs: { values: [] } },
  ],
  [
    "variabile del ciclo non esce nello scope",
    "assert 'value' not in globals()",
  ],
]);
cases(0, "Dict comprehension", [
  [
    "alias del valore",
    "users[-1]['name']='changed'\nassert by_id[1]['name'] == 'changed'",
  ],
  [
    "chiave non hashable",
    "pass",
    {
      inputs: { users: [{ id: [1], name: "Ada" }] },
      expectedError: "TypeError",
    },
  ],
  [
    "campo mancante",
    "pass",
    { inputs: { users: [{ name: "Ada" }] }, expectedError: "KeyError" },
  ],
]);
cases(0, "Comprehension annidata", [
  ["gruppi vuoti", "assert flat == []", { inputs: { groups: [[], []] } }],
  [
    "un livello soltanto",
    "assert flat == [[1],[2]]",
    { inputs: { groups: [[[1]], [[2]]] } },
  ],
  [
    "stringhe diventano caratteri",
    "assert flat == ['a','b','c']",
    { inputs: { groups: ["ab", "c"] } },
  ],
]);
cases(0, "Zip rigoroso", [
  [
    "lunghezze diverse",
    "pass",
    { inputs: { scores: [10] }, expectedError: "ValueError" },
  ],
  [
    "entrambi vuoti",
    "assert pairs == []",
    { inputs: { names: [], scores: [] } },
  ],
  [
    "errore differito e consumo parziale",
    "it=zip(['a','b'],[1],strict=True)\nassert next(it)==('a',1)\nwith expect.assertRaises(ValueError): next(it)",
  ],
]);
cases(0, "Iteratore e sentinella", [
  ["input vuoto", "assert first is missing", { inputs: { items: [] } }],
  [
    "default non nasconde altri errori",
    "def broken():\n    raise ValueError('bad')\n    yield\nwith expect.assertRaises(ValueError): next(broken(),missing)",
  ],
]);
cases(0, "Generatore", [
  [
    "errore al consumo dopo un elemento",
    "g=read_ids([{'id':'1'},{'id':'bad'}])\nassert next(g)==1\nwith expect.assertRaises(ValueError): next(g)\nassert list(g)==[]",
  ],
  [
    "input originale monouso non rigenerato",
    "rows=iter([{'id':'1'}])\nassert list(read_ids(rows)) == [1]\nassert list(read_ids(rows)) == []",
  ],
  [
    "conversione non e vincolo positivo",
    "assert list(read_ids([{'id':'-1'},{'id':True}])) == [-1,1]",
  ],
]);
cases(0, "Generator expression", [
  [
    "input vuoto",
    "assert captured_output=='0\\n0\\n'",
    { inputs: { values: [] } },
  ],
  [
    "variabile libera letta al consumo",
    "factor=2\ng=(n*factor for n in [1,2])\nfactor=3\nassert list(g)==[3,6]",
  ],
]);
cases(0, "Yield from", [
  ["nessun gruppo", "assert list(flatten([])) == []"],
  [
    "gruppo non iterabile",
    "with expect.assertRaises(TypeError): list(flatten([1]))",
  ],
]);
cases(0, "Limitare con islice", [
  [
    "indici negativi rifiutati",
    "with expect.assertRaises(ValueError): list(islice([1,2],-1))",
  ],
  [
    "infinito limitato",
    "from itertools import count\nassert list(islice(count(5),3)) == [5,6,7]",
  ],
]);
cases(0, "Raggruppare con groupby", [
  [
    "senza ordinamento gruppi consecutivi",
    "assert [k for k,g in groupby(users,key=key)] == ['admin','reader','admin']",
  ],
  [
    "gruppi condividono la sorgente",
    "saved=list(groupby(['a','a','b']))\nassert list(saved[0][1]) == []",
  ],
  ["input vuoto", "assert groups == []", { inputs: { users: [] } }],
]);
cases(0, "Chiudere dopo un consumo parziale", [
  [
    "chiusura prima dell'avvio",
    "events.clear()\ng=stream()\ng.close()\nassert events == []",
  ],
  [
    "break senza close",
    "events.clear()\ng=stream()\nfor x in g: break\nassert events==[]\ng.close()\nassert events==['closed']",
  ],
]);

for (const [h, out] of [
  ["Avvio", "done\n"],
  ["Coroutine e await", "{'id': 1}\n"],
  ["Operazioni concorrenti con gather", "[1, 2]\n"],
  ["TaskGroup", "(1, 2)\n"],
  ["Timeout", "['cleanup', 'timeout']\n"],
  ["Eseguire codice bloccante con to_thread", "demo\n"],
  ["Cancellare e attendere un task", "['cleanup', 'cancelled']\n"],
  ["Coda limitata", "[2, 4, 6]\n"],
])
  test("snippet async: " + h, () => {
    const r = run(1, h, "assert captured_error == ''");
    assert.equal(r.output, out);
  });
cases(1, "Coroutine e await", [
  [
    "coroutine creata ma non avviata",
    "import inspect\nc=load_entity(2)\nassert inspect.getcoroutinestate(c)=='CORO_CREATED'\nc.close()",
  ],
  [
    "riuso rifiutato",
    "async def check():\n    c=load_entity(2)\n    assert await c == {'id':2}\n    with expect.assertRaises(RuntimeError): await c\nasyncio.run(check())",
  ],
]);
cases(1, "Operazioni concorrenti con gather", [
  [
    "ordine di input diverso da completamento",
    String.raw`
async def check():
    ready=asyncio.Event()
    completed=[]
    async def replacement(n):
        if n==1: await ready.wait()
        completed.append(n)
        if n==2: ready.set()
        return n
    globals()['load_entity']=replacement
    assert await main() == [1,2]
    assert completed == [2,1]
asyncio.run(check())
`,
  ],
  [
    "errore non cancella il fratello e cleanup della prova",
    String.raw`
async def check():
    ready,release=asyncio.Event(),asyncio.Event()
    siblings=[]
    async def replacement(n):
        if n==1:
            await ready.wait()
            raise ValueError('expected')
        siblings.append(asyncio.current_task())
        ready.set()
        await release.wait()
        return n
    globals()['load_entity']=replacement
    try:
        with expect.assertRaises(ValueError): await main()
        assert not siblings[0].done()
    finally:
        release.set()
        await asyncio.gather(*siblings,return_exceptions=True)
asyncio.run(check())
`,
  ],
]);
cases(1, "TaskGroup", [
  [
    "errore cancella fratello e attende cleanup",
    String.raw`
async def check():
    ready=asyncio.Event()
    events=[]
    async def replacement(n):
        if n==1:
            await ready.wait()
            raise ValueError('expected')
        try:
            ready.set()
            await asyncio.Event().wait()
        finally:
            events.append('cleaned')
    globals()['load_entity']=replacement
    with expect.assertRaises(ExceptionGroup) as error: await main()
    assert len(error.exception.exceptions)==1
    assert isinstance(error.exception.exceptions[0],ValueError)
    assert events==['cleaned']
asyncio.run(check())
`,
  ],
]);
cases(1, "Timeout", [
  [
    "timeout lascia solo il task chiamante",
    "async def check():\n    assert await main()==['cleanup','timeout']\n    assert asyncio.all_tasks()=={asyncio.current_task()}\nasyncio.run(check())",
  ],
]);
cases(1, "Eseguire codice bloccante con to_thread", [
  [
    "funzione eseguita in un altro thread",
    "import threading\nseen=[]\nclass FakePath:\n    def read_text(self,encoding):\n        seen.append(threading.get_ident())\n        assert encoding=='utf-8'\n        return 'thread'\nassert asyncio.run(read_text(FakePath()))=='thread'\nassert seen[0]!=threading.get_ident()",
  ],
  [
    "cancellare l'attesa non interrompe il thread",
    String.raw`
import threading
started,release,finished=threading.Event(),threading.Event(),threading.Event()
class FakePath:
    def read_text(self,encoding):
        started.set()
        if not release.wait(3): raise RuntimeError('test did not release worker')
        finished.set()
        return 'done'
async def check():
    task=asyncio.create_task(read_text(FakePath()))
    try:
        assert await asyncio.to_thread(started.wait,2)
        task.cancel()
        with expect.assertRaises(asyncio.CancelledError): await task
        assert not finished.is_set()
    finally:
        release.set()
asyncio.run(check())
assert finished.is_set()
`,
  ],
]);
cases(1, "Cancellare e attendere un task", [
  [
    "gerarchia e assenza di task residui",
    "assert issubclass(asyncio.CancelledError,BaseException)\nassert not issubclass(asyncio.CancelledError,Exception)\nasync def check():\n    assert await main()==['cleanup','cancelled']\n    assert asyncio.all_tasks()=={asyncio.current_task()}\nasyncio.run(check())",
  ],
]);
cases(1, "Coda limitata", [
  [
    "input vuoto e singolo",
    "assert asyncio.run(main([]))==[]\nassert asyncio.run(main([4]))==[8]",
  ],
  [
    "contabilita include sentinella",
    String.raw`
original=asyncio.Queue
queues=[]
class Tracked(original):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.completed=0
        queues.append(self)
    def task_done(self):
        super().task_done()
        self.completed+=1
with patch.object(asyncio,'Queue',Tracked):
    assert asyncio.run(main([1,2,3]))==[2,4,6]
assert queues[0].maxsize==2 and queues[0].completed==4
`,
  ],
  [
    "errore worker propaga senza bloccare producer",
    "async def check():\n    with expect.assertRaises(ExceptionGroup) as error:\n        await asyncio.wait_for(main([object(),2,3,4,5]),2)\n    assert isinstance(error.exception.exceptions[0],TypeError)\n    assert asyncio.all_tasks()=={asyncio.current_task()}\nasyncio.run(check())",
  ],
]);

cases(2, "Generare un errore", [
  [
    "demo e assenza",
    "assert captured_output==\"{'id': 1}\\n\"\nwith expect.assertRaises(ValueError): require_user(None)",
  ],
  [
    "nessuna validazione implicita dello schema",
    "assert require_user({}) == {} and require_user(False) is False",
  ],
]);
cases(2, "Try, except, else e finally", [
  [
    "successo, fallback e zero",
    "assert captured_output=='42\\nNone\\n'\nassert parse_number('0')==0\nassert parse_number('bad') is None",
  ],
  [
    "chiusura su entrambi i ritorni",
    String.raw`
original=StringIO
streams=[]
def tracked(text):
    stream=original(text)
    streams.append(stream)
    return stream
globals()['StringIO']=tracked
assert parse_number('2')==4
assert parse_number('bad') is None
assert len(streams)==2 and all(s.closed for s in streams)
`,
  ],
  [
    "errore nell'else non intercettato ma chiude",
    String.raw`
from unittest.mock import Mock
stream=StringIO('2')
globals()['StringIO']=lambda _:stream
class Number:
    def __mul__(self,other): raise ValueError('from else')
globals()['int']=lambda _:Number()
with expect.assertRaisesRegex(ValueError,'from else'): parse_number('2')
assert stream.closed
`,
  ],
]);
cases(2, "File opzionale assente", [
  [
    "assente e vuoto distinti",
    "assert read_optional('absent.txt') is None\nPath('empty.txt').write_text('',encoding='utf-8')\nassert read_optional('empty.txt')==''",
  ],
  [
    "permessi simulati propagano",
    "with patch.object(Path,'read_text',side_effect=PermissionError):\n    with expect.assertRaises(PermissionError): read_optional('file.txt')",
  ],
  [
    "decoding invalido reale",
    "Path('bad.bin').write_bytes(b'\\xff')\nwith expect.assertRaises(UnicodeDecodeError): read_optional('bad.bin')",
  ],
]);
cases(2, "Conservare la causa", [
  [
    "file reale e causa preservata",
    "Path('valid.txt').write_text('demo',encoding='utf-8')\nassert read_required('valid.txt')=='demo'\nwith expect.assertRaises(RuntimeError) as error: read_required('absent.txt')\nassert isinstance(error.exception.__cause__,FileNotFoundError)",
  ],
  [
    "decoding distinto da OSError",
    "Path('bad.bin').write_bytes(b'\\xff')\nwith expect.assertRaises(UnicodeDecodeError): read_required('bad.bin')",
  ],
]);
cases(2, "Eccezione personalizzata", [
  [
    "presente, None e assente",
    "assert captured_output=='demo\\n'\nassert get_entity({1:None},1) is None\nwith expect.assertRaises(EntityNotFoundError) as error: get_entity({},2)\nassert isinstance(error.exception.__cause__,KeyError)",
  ],
  [
    "chiave non hashable non mascherata",
    "with expect.assertRaises(TypeError): get_entity({},[])",
  ],
]);
cases(2, "Ignorare un errore specifico", [
  [
    "assenza tollerata e cleanup",
    "assert captured_output=='False\\n'\nassert not path.parent.exists()",
  ],
  [
    "PermissionError non soppresso",
    "with expect.assertRaises(PermissionError):\n    with suppress(FileNotFoundError): raise PermissionError('denied')",
  ],
]);
cases(2, "Logging", [
  [
    "livelli e destinazione",
    "assert captured_output==''\nassert 'Details' not in captured_error\nassert 'INFO __main__: Processed 3 items' in captured_error\nassert 'WARNING' in captured_error and 'ERROR' in captured_error",
  ],
  [
    "basicConfig non rimpiazza handler esistenti",
    "assert 'Processed' not in captured_error\nassert 'Example failure' in captured_error\nassert logging.getLogger().level==logging.ERROR",
    { setup: "import logging\nlogging.basicConfig(level=logging.ERROR)" },
  ],
  [
    "import non configura root",
    "assert captured_output == captured_error == ''\nassert logging.getLogger().level == logging.WARNING\nassert len(logging.getLogger().handlers) == 1\nassert isinstance(logging.getLogger().handlers[0], logging.NullHandler)",
    {
      setup:
        "import logging\nlogging.getLogger().addHandler(logging.NullHandler())\n__name__='imported_note'",
    },
  ],
  [
    "argomenti debug valutati comunque",
    "events=[]\ndef expensive():\n    events.append('computed')\n    return 1\nlogger.debug('Value %s',expensive())\nif logger.isEnabledFor(logging.DEBUG): logger.debug('Value %s',expensive())\nassert events==['computed']",
  ],
]);
cases(2, "Loggare lo stack trace", [
  [
    "errore corrente e risultato False",
    "assert captured_output=='False\\n'\nassert 'Traceback (most recent call last)' in captured_error\nassert 'ValueError' in captured_error",
  ],
]);
cases(2, "Debug interattivo", [
  [
    "hook esplicito evita interazione nel test unitario",
    "assert debug_hits==[True]\nassert captured_output=='6\\n'",
    {
      setup:
        "import sys\ndebug_hits=[]\nsys.breakpointhook=lambda *args,**kwargs:debug_hits.append(True)",
    },
  ],
]);
cases(2, "Ispezionare valori", [
  [
    "repr, tipo e attributi",
    "assert repr(value)==\"'line\\\\nnext'\"\nassert type(value) is str\nassert vars(record)=={'id':1,'name':'Ada'}",
  ],
  [
    "vars non supportato su int e alias del dict",
    "with expect.assertRaises(TypeError): vars(1)\nvars(record)['id']=2\nassert record.id==2",
  ],
]);
cases(2, "Asserzioni", [
  [
    "invariante ordinaria",
    "assert captured_output=='2.0\\n'\nwith expect.assertRaises(AssertionError): half(-2)\nassert half(0)==0",
  ],
]);

test("assert rimosso dal vero interprete con -O", () => {
  const source = blocks[2].get("Asserzioni") + "\nprint(half(-4))";
  const r = spawnSync(python, ["-I", "-O", "-X", "utf8", "-c", source], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 10000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.replace(/\r/g, ""), "2.0\n-2.0\n");
});
const debugFile = join(root, "debug_demo.py");
writeFileSync(debugFile, blocks[2].get("Debug interattivo"));
test("breakpoint reale: ispezione e continuazione pdb", () => {
  const r = spawnSync(python, ["-I", "-X", "utf8", debugFile], {
    cwd: root,
    input: "p value\nc\n",
    encoding: "utf8",
    windowsHide: true,
    timeout: 10000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\(Pdb\) 3/);
  assert.match(r.stdout, /\(Pdb\) 6/);
  assert.equal(r.stderr, "");
});
test("CLI python -m pdb sullo script della nota", () => {
  const command = notes[2].tree.children.find(
    (n) => n.type === "code" && n.lang === "text",
  ).value;
  assert.equal(command, "python -m pdb debug_demo.py");
  const r = spawnSync(python, ["-I", "-X", "utf8", "-m", "pdb", debugFile], {
    cwd: root,
    input: "c\np value\nc\nq\n",
    encoding: "utf8",
    windowsHide: true,
    timeout: 10000,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\(Pdb\) 3/);
  assert.match(r.stdout, /6/);
  assert.equal(r.stderr, "");
});
