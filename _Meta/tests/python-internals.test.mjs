import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Memory Management",
  "Global Interpreter Lock",
  "Introspezione",
  "Data model",
  "Descriptor protocol",
  "Metaclassi",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
const bootstrap = String.raw`
import contextlib, io, json, sys, types, unittest
assert sys.version_info[:2] == (3, 12)
assert sys.implementation.name == "cpython"
assert not sys.flags.optimize
request = json.load(sys.stdin)
stdout, stderr = io.StringIO(), io.StringIO()
module = types.ModuleType("note_example")
sys.modules[module.__name__] = module
scope = module.__dict__
with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
    exec(compile(request["code"], request["name"], "exec"), scope)
    scope.update(expect=unittest.TestCase(), captured_output=stdout,
                 captured_error=stderr, source_code=request["code"])
    exec(compile(request["probe"], "probe", "exec"), scope)
print(json.dumps({"output": stdout.getvalue(), "errors": stderr.getvalue(), "version":sys.version}))
`;
function run(note, block, probe = "pass") {
  const result = spawnSync(python, ["-I", "-X", "utf8", "-c", bootstrap], {
    input: JSON.stringify({
      code: blocks[note][block],
      probe,
      name: names[note] + ":" + block,
    }),
    encoding: "utf8",
    windowsHide: true,
    timeout: 45000,
    maxBuffer: 2 ** 20,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
const expected = [
  [
    'assert alias == [1,2,3,4] and "numbers" not in globals()',
    "assert first_ref() is None and second_ref() is None",
    "assert items[0] is items[1] and container_bytes > 0 and payload_bytes >= 100000",
    'assert first == "alpha" and list(lines) == [] and not path.exists()',
    "assert (info.hits,info.misses,info.currsize) == (1,3,2) and compute_report.cache_info().currsize == 0",
    "assert current > 0 and peak >= current and changes and not tracemalloc.is_tracing()",
  ],
  [
    "assert results == [4999950000,4999950000]",
    "assert lost_update == 1 and counter == 2000 and not lock.locked()",
    "assert gil_enabled is None and probe is None",
    "assert callable(main) and count(10) == 45",
  ],
  [
    'assert type(user) is Admin and isinstance(user,User) and vars(user) == {"name":"Luca"}',
    "assert isinstance(raw,property) and report.reads == 2",
    'assert created == {"name":"Luca","age":18} and bound.arguments["age"] == 18',
    'assert load_user(user_id=7) == {"id":7}',
  ],
  [
    "assert first == [1,2,3] and second == [1,2] and container[0] is first",
    "assert item.__len__() == 99 and len(item) == 3",
    'assert list(sequence) == ["a","b"] and not isinstance(sequence,Iterable)',
    'assert list(bag) == ["a","b"] and list(left) == ["b"] and list(right) == ["b"]',
  ],
  [
    'assert item.label == "from descriptor" and item.fixed == "from property"',
    "assert method.__self__ is greeter and method.__func__ is function",
    'assert not hasattr(first,"price") and first.weight == 2 and second.price == 20',
    'assert Late().label == "label"',
  ],
  [
    'assert type(plugin) is Plugin and Dynamic().category == "demo"',
    'assert events == ["prepare","body","meta-new","set-name","init-subclass","meta-init","decorator"]',
    'assert CsvPlugin.key == "csv" and type(CsvPlugin) is type',
    'assert RegistryMeta.registry == {"csv":CsvPlugin}',
  ],
];
for (let i = 0; i < notes.length; i++) {
  test(names[i] + ": struttura, fonti e conteggio esempi", () => {
    assert.equal(blocks[i].length, expected[i].length);
    assert.equal(notes[i].data.status, "non revisionato");
    assert.equal(notes[i].data.publish, true);
    assert.equal(
      notes[i].data.type,
      i === 2 ? "technical-note" : "theory-note",
    );
    const headings = notes[i].tree.children.filter((n) => n.type === "heading");
    assert.equal(headings.filter((n) => n.depth === 1).length, 1);
    assert.match(notes[i].body, /3\.12\.10/);
    assert.match(notes[i].body, /## Fonti/);
    assert.match(
      notes[i].body,
      i === 2 ? /## API \/ Sintassi/ : /## Concetto chiave/,
    );
  });
  for (let j = 0; j < expected[i].length; j++)
    test(names[i] + ": blocco " + (j + 1), () => run(i, j, expected[i][j]));
}
const cases = [
  [
    "memoria: del non elimina oggetti ancora raggiungibili",
    0,
    0,
    String.raw`
import gc, weakref
class Box:
    pass
box = Box()
reference = weakref.ref(box)
retained = [box]
del box
gc.collect()
assert reference() is retained[0]
retained.clear()
gc.collect()
assert reference() is None
`,
  ],
  [
    "memoria: un ciclo con root non viene raccolto",
    0,
    1,
    String.raw`
node = Node()
node.other = node
reference = weakref.ref(node)
gc.collect()
assert reference() is node
del node
gc.collect()
assert reference() is None
`,
  ],
  [
    "memoria: collector disabilitato, raccolta esplicita e ripristino",
    0,
    1,
    String.raw`
enabled = gc.isenabled()
try:
    gc.disable()
    left, right = make_cycle()
    assert left() is not None and right() is not None
    gc.collect()
    assert left() is None and right() is None
finally:
    if enabled:
        gc.enable()
assert gc.isenabled() == enabled
`,
  ],
  [
    "memoria: generatori chiusi anche su uscita con eccezione",
    0,
    3,
    String.raw`
import inspect
with TemporaryDirectory() as directory:
    path = Path(directory) / "input.txt"
    path.write_text(" x \nnext\n",encoding="utf-8")
    with expect.assertRaises(RuntimeError):
        with closing(read_lines(path)) as lines:
            assert next(lines) == " x "
            raise RuntimeError("stop")
    assert inspect.getgeneratorstate(lines) == inspect.GEN_CLOSED
`,
  ],
  [
    "memoria: cache LRU espelle la voce meno recente",
    0,
    4,
    String.raw`
compute_report.cache_clear()
for key in [1,2,1,3]:
    compute_report(key)
before = compute_report.cache_info()
compute_report(2)
after = compute_report.cache_info()
assert before.hits == 1 and after.misses == before.misses+1 and after.currsize == 2
compute_report.cache_clear()
`,
  ],
  [
    "memoria: cache trattiene risultati mutabili e riferimenti",
    0,
    4,
    String.raw`
import gc, weakref
class Box:
    pass
@lru_cache(maxsize=1)
def load_box(key):
    return Box()
box = load_box(1)
reference = weakref.ref(box)
box.value = "shared"
assert load_box(1).value == "shared"
del box
gc.collect()
assert reference() is not None
load_box.cache_clear()
gc.collect()
assert reference() is None
`,
  ],
  [
    "GIL: risultati del calcolo, non una prova di velocita",
    1,
    0,
    String.raw`
assert count(0) == 0 and count(1) == 0 and count(100) == 4950
`,
  ],
  [
    "GIL: race riproducibile e lock su piu esecuzioni",
    1,
    1,
    String.raw`
for _ in range(3):
    counter = 0
    barrier.reset()
    with ThreadPoolExecutor(max_workers=2) as executor:
        jobs = [executor.submit(unsafe_increment) for _ in range(2)]
        for job in jobs:
            job.result()
    assert counter == 1
    counter = 0
    with ThreadPoolExecutor(max_workers=2) as executor:
        jobs = [executor.submit(safe_increments) for _ in range(2)]
        for job in jobs:
            job.result()
    assert counter == 2000
`,
  ],
  [
    "GIL: ProcessPool spawn dallo script estratto",
    1,
    3,
    String.raw`
import ast, subprocess, sys
from pathlib import Path
from tempfile import TemporaryDirectory
with TemporaryDirectory() as directory:
    script = Path(directory)/"parallel_sum.py"
    script.write_text(source_code,encoding="utf-8")
    result = subprocess.run([sys.executable,"-I",str(script)],capture_output=True,
                            text=True,timeout=30)
    assert result.returncode == 0, result.stderr
    assert ast.literal_eval(result.stdout.strip()) == [4999950000,4999950000]
`,
  ],
  [
    "GIL: import del modulo non avvia processi",
    1,
    3,
    String.raw`
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
with TemporaryDirectory() as directory:
    script = Path(directory)/"parallel_sum.py"
    script.write_text(source_code,encoding="utf-8")
    spec = importlib.util.spec_from_file_location("parallel_sum",script)
    module = importlib.util.module_from_spec(spec)
    with patch("concurrent.futures.ProcessPoolExecutor",side_effect=AssertionError("pool on import")):
        spec.loader.exec_module(module)
    assert module.count(5) == 10
`,
  ],
  [
    "introspezione: vars live, slots e mapping di classe",
    2,
    0,
    String.raw`
state = vars(user)
state["name"] = "Anna"
assert user.name == "Anna"
with expect.assertRaises(TypeError):
    vars(Admin)["new"] = 1
class Slotted:
    __slots__ = ("value",)
slotted = Slotted()
with expect.assertRaises(TypeError):
    vars(slotted)
`,
  ],
  [
    "introspezione: dir e personalizzabile, callable non valida la firma",
    2,
    0,
    String.raw`
class Odd:
    def __dir__(self):
        return ["invented"]
    def __call__(self, required):
        return required
odd = Odd()
assert dir(odd) == ["invented"] and not hasattr(odd,"invented") and callable(odd)
with expect.assertRaises(TypeError):
    odd()
`,
  ],
  [
    "introspezione: hasattr sopprime AttributeError del getter, non ValueError",
    2,
    1,
    String.raw`
class Broken:
    @property
    def absent(self):
        raise AttributeError("internal failure")
    @property
    def invalid(self):
        raise ValueError("invalid")
broken = Broken()
assert hasattr(broken,"absent") is False
assert getattr(broken,"absent","fallback") == "fallback"
with expect.assertRaises(ValueError):
    hasattr(broken,"invalid")
assert isinstance(inspect.getattr_static(broken,"absent"),property)
`,
  ],
  [
    "introspezione: getmembers_static non esegue le property",
    2,
    1,
    String.raw`
before = report.reads
members = dict(inspect.getmembers_static(report))
assert isinstance(members["summary"],property) and report.reads == before
dict(inspect.getmembers(report))
assert report.reads == before+1
`,
  ],
  [
    "introspezione: bind controlla firma ma non type hint",
    2,
    2,
    String.raw`
with expect.assertRaises(TypeError):
    signature.bind(name="Luca")
with expect.assertRaises(TypeError):
    signature.bind("Luca",20)
partial = signature.bind_partial()
assert partial.arguments == {}
bound = signature.bind(7,age="not an int")
assert create_user(*bound.args,**bound.kwargs) == {"name":7,"age":"not an int"}
`,
  ],
  [
    "introspezione: require_keyword rifiuta posizionale, omissione e duplicati",
    2,
    3,
    String.raw`
with expect.assertRaises(TypeError):
    load_user(7)
with expect.assertRaises(TypeError):
    load_user()
with expect.assertRaises(TypeError):
    load_user(7,user_id=8)
assert load_user(user_id="text") == {"id":"text"}
`,
  ],
  [
    "introspezione: decorator valida il parametro durante la definizione",
    2,
    3,
    String.raw`
def positional(value,/):
    return value
def flexible(*args,**kwargs):
    return args
for function,name in [(positional,"value"),(flexible,"kwargs"),(load_user,"missing")]:
    with expect.assertRaises(ValueError):
        require_keyword(name)(function)
`,
  ],
  [
    "introspezione: default non equivale a keyword esplicita",
    2,
    3,
    String.raw`
@require_keyword("limit")
def limited(limit=10):
    return limit
with expect.assertRaises(TypeError):
    limited()
assert limited(limit=3) == 3
assert inspect.signature(limited).parameters["limit"].default == 10
assert tuple(inspect.signature(limited,follow_wrapped=False).parameters) == ("args","kwargs")
assert inspect.unwrap(limited)() == 10
`,
  ],
  [
    "introspezione: wrapper conserva risultato, metadati ed eccezione",
    2,
    3,
    String.raw`
failure = RuntimeError("expected")
@require_keyword("value")
def operation(value):
    """Demo docstring."""
    raise failure
assert operation.__name__ == "operation" and operation.__doc__ == "Demo docstring."
with expect.assertRaises(RuntimeError) as error:
    operation(value=1)
assert error.exception is failure
`,
  ],
  [
    "data model: hash coerente e classe con eq non hashable",
    3,
    0,
    String.raw`
class Value:
    def __init__(self,value):
        self.value=value
    def __eq__(self,other):
        if not isinstance(other,Value):
            return NotImplemented
        return self.value == other.value
a,b=Value(1),Value(1)
assert a == b and a is not b and Value.__hash__ is None
with expect.assertRaises(TypeError):
    hash(a)
assert a != 1
`,
  ],
  [
    "data model: protocollo cerca sul tipo, non sul normale getter",
    3,
    1,
    String.raw`
class Loud:
    def __getattribute__(self,name):
        if name == "__len__":
            raise AssertionError("ordinary lookup")
        return super().__getattribute__(name)
    def __len__(self):
        return 4
assert len(Loud()) == 4
with expect.assertRaises(AssertionError):
    Loud().__len__()
`,
  ],
  [
    "data model: __len__ e __bool__ hanno contratti rigorosi",
    3,
    1,
    String.raw`
class Negative:
    def __len__(self):
        return -1
class WrongBool:
    def __bool__(self):
        return 1
with expect.assertRaises(ValueError):
    len(Negative())
with expect.assertRaises(TypeError):
    bool(WrongBool())
`,
  ],
  [
    "data model: iterabile legacy termina con IndexError",
    3,
    2,
    String.raw`
iterator = iter(sequence)
assert next(iterator) == "a" and next(iterator) == "b"
with expect.assertRaises(StopIteration):
    next(iterator)
with expect.assertRaises(StopIteration):
    next(iterator)
`,
  ],
  [
    "Bag: snapshot, indici, slice, membership e input errati",
    3,
    3,
    String.raw`
for value in ["abc", b"abc", ["ok",1], [None]]:
    with expect.assertRaises(TypeError):
        Bag(value)
assert list(Bag(iter(["x","y"]))) == ["x","y"]
assert bag[-1] == "b" and bag[::-1] == ("b","a") and "a" in bag
assert len(Bag([])) == 0 and not Bag([])
with expect.assertRaises(IndexError):
    bag[99]
with expect.assertRaises(TypeError):
    bag["a"]
assert repr(bag) == "Bag(['a', 'b'])"
`,
  ],
  [
    "Bag: iterazione riutilizzabile, uguaglianza non definita e privacy convenzionale",
    3,
    3,
    String.raw`
assert iter(bag) is not iter(bag)
assert list(bag) == list(bag)
assert Bag(["a"]) != Bag(["a"])
bag._items = ("changed",)
assert list(bag) == ["changed"]
`,
  ],
  [
    "descriptor: data prevale sull'istanza, non-data no",
    4,
    0,
    String.raw`
item.label = "override"
assert item.label == "override"
with expect.assertRaises(AttributeError):
    item.fixed = "override"
item.extra = NonData()
assert isinstance(item.extra,NonData)
`,
  ],
  [
    "descriptor: un attributo di sottoclasse nasconde la property base",
    4,
    0,
    String.raw`
class Child(Example):
    fixed = "child"
child = Child()
child.fixed = "instance"
assert child.fixed == "instance"
`,
  ],
  [
    "descriptor: binding di metodo, staticmethod e classmethod",
    4,
    1,
    String.raw`
assert greeter.greet.__self__ is greeter
assert Greeter.greet is function
assert function(greeter,"Anna") == "Ciao Anna"
class Base:
    @classmethod
    def owner(cls):
        return cls
    @staticmethod
    def echo(value):
        return value
class Child(Base):
    pass
assert Child.owner() is Child and Child().owner() is Child
assert Child.echo(4) == 4
`,
  ],
  [
    "Positive: invalidi non alterano il valore precedente",
    4,
    2,
    String.raw`
product = Product(10,2)
for value in [0,-1,-0.0,float("nan"),float("inf"),-float("inf")]:
    with expect.assertRaises(ValueError):
        product.price = value
    assert product.price == 10
for value in [True,False,"3",None,complex(1,0)]:
    with expect.assertRaises(TypeError):
        product.price = value
    assert product.price == 10
product.price = 10**1000
assert product.price == 10**1000
`,
  ],
  [
    "Positive: stato isolato per campo e istanza, classe restituisce descriptor",
    4,
    2,
    String.raw`
a,b=Product(1,2),Product(3,4)
a.price=5
assert (a.price,a.weight,b.price,b.weight)==(5,2,3,4)
assert Product.price is Product.__dict__["price"]
assert Product.price is not Product.weight
assert a.__dict__ == {"_price":5,"_weight":2}
`,
  ],
  [
    "Positive: cancellazione, attributo mancante e riassegnazione",
    4,
    2,
    String.raw`
product=Product(1,2)
del product.price
with expect.assertRaises(AttributeError):
    product.price
with expect.assertRaises(AttributeError):
    del product.price
product.price=3
assert product.price == 3
assert not hasattr(Product.__new__(Product),"price")
`,
  ],
  [
    "Positive: __dict__ aggira la validazione e slots non sono supportati",
    4,
    2,
    String.raw`
product=Product(1,2)
product.__dict__["price"] = 99
assert product.price == 1
product.__dict__["_price"] = -1
assert product.price == -1
class Slotted:
    __slots__=()
    price=Positive()
with expect.assertRaises(AttributeError):
    Slotted().price=2
`,
  ],
  [
    "descriptor: set_name non automatico per attributi aggiunti dopo",
    4,
    3,
    String.raw`
late_descriptor=Named()
class Another:
    pass
Another.name=late_descriptor
assert not hasattr(late_descriptor,"name")
late_descriptor.__set_name__(Another,"name")
assert Another().name == "name"
`,
  ],
  [
    "descriptor: ereditarieta non richiama set_name e riuso cambia i metadati",
    4,
    3,
    String.raw`
events=[]
class Tracking(Named):
    def __set_name__(self,owner,name):
        events.append((owner,name))
        super().__set_name__(owner,name)
class Base:
    field=Tracking()
class Child(Base):
    pass
assert events == [(Base,"field")]
shared=Named()
class Reused:
    first=shared
    second=shared
assert Reused().first == "second"
`,
  ],
  [
    "metaclassi: chiamata della classe crea istanze, non la classe",
    5,
    1,
    String.raw`
before = events.copy()
instance = Example()
assert type(instance) is Example and events == before
`,
  ],
  [
    "metaclassi: init_subclass richiede key e non accetta valori invalidi",
    5,
    2,
    String.raw`
with expect.assertRaises(TypeError):
    class Missing(NamedPlugin):
        pass
for key in ["", " ", None, 3]:
    with expect.assertRaises(ValueError):
        class Invalid(NamedPlugin,key=key):
            pass
class Specialized(CsvPlugin,key="special"):
    pass
assert Specialized.key == "special" and CsvPlugin.key == "csv"
`,
  ],
  [
    "metaclassi: registro senza base, duplicati e chiavi non valide",
    5,
    3,
    String.raw`
assert "Plugin" not in RegistryMeta.registry and "SpecializedCsv" not in RegistryMeta.registry
with expect.assertRaises(ValueError):
    class Duplicate(Plugin):
        plugin_key="csv"
assert RegistryMeta.registry == {"csv":CsvPlugin}
for key in [""," ",1,False]:
    with expect.assertRaises(ValueError):
        class Invalid(Plugin):
            plugin_key=key
assert RegistryMeta.registry == {"csv":CsvPlugin}
`,
  ],
  [
    "metaclassi: namespace e __classcell__ preservati per super",
    5,
    3,
    String.raw`
class Base(Plugin):
    def label(self):
        return "base"
class Child(Base):
    plugin_key="child"
    def label(self):
        return super().label()+":child"
assert Child().label() == "base:child"
assert RegistryMeta.registry["child"] is Child
`,
  ],
  [
    "metaclassi: registro non segue modifiche tardive o class decorator",
    5,
    3,
    String.raw`
CsvPlugin.plugin_key="renamed"
assert RegistryMeta.registry["csv"] is CsvPlugin and "renamed" not in RegistryMeta.registry
originals=[]
def replace_class(cls):
    originals.append(cls)
    return type("Replacement",(),{})
@replace_class
class Replaced(Plugin):
    plugin_key="replaced"
assert RegistryMeta.registry["replaced"] is originals[0]
assert RegistryMeta.registry["replaced"] is not Replaced
`,
  ],
  [
    "metaclassi: conflitto e risoluzione strutturale esplicita",
    5,
    0,
    String.raw`
class LeftMeta(type):
    pass
class RightMeta(type):
    pass
class Left(metaclass=LeftMeta):
    pass
class Right(metaclass=RightMeta):
    pass
with expect.assertRaises(TypeError):
    class Conflict(Left,Right):
        pass
class CombinedMeta(LeftMeta,RightMeta):
    pass
class Combined(Left,Right,metaclass=CombinedMeta):
    pass
assert isinstance(Combined,CombinedMeta)
`,
  ],
  [
    "metaclassi: effetti del corpo non annullati da creazione fallita",
    5,
    3,
    String.raw`
effects=[]
with expect.assertRaises(ValueError):
    class Duplicate(Plugin):
        effects.append("body ran")
        plugin_key="csv"
assert effects == ["body ran"] and RegistryMeta.registry == {"csv":CsvPlugin}
`,
  ],
];
for (const [name, note, block, probe] of cases)
  test(name, () => run(note, block, probe));
