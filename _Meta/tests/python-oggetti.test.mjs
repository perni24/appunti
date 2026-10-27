import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const python = process.env.PYTHON_TEST_EXECUTABLE || "python";
const names = [
  "Classi e Istanze",
  "Dataclasses",
  "Enum",
  "Metodi Speciali",
  "Ereditarietà",
  "Incapsulamento",
  "Proprietà",
  "Metodi di classe e statici",
];
const notes = names.map((name) =>
  parseNote("Programmazione/Python/Pagine/" + name + ".md"),
);
const blocks = notes.map((note) =>
  note.tree.children
    .filter((node) => node.type === "code" && node.lang === "python")
    .map((node) => node.value),
);
// dataclasses can inspect annotations through the defining module in sys.modules.
const bootstrap = String.raw`
import contextlib
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
with contextlib.redirect_stdout(captured):
    exec(compile(request["code"], request["name"], "exec"), namespace)
    exec(compile(request["probe"], "note-test", "exec"), namespace)
sys.stdout.write(json.dumps({"output": captured.getvalue(), "version": sys.version}))
`;
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
    String.raw`assert first.active is False and second.active is True
assert (first.role, second.role, User.role) == ("editor", "user", "user")
assert first.deactivate.__self__ is first`,
    String.raw`assert left.tags is right.tags and right.tags == ["python"]
assert one is alias and one.tags == ["python", "notes"] and two.tags == []
assert one.tags is not two.tags`,
    'assert account.owner == "Ada" and account.balance_cents == 850',
  ],
  [
    String.raw`assert first.tags == ["python"] and second.tags == []
assert [item.name for item in fields(User)] == ["id", "name", "tags"]
assert first.category == second.category == "person"`,
    String.raw`assert sorted(points) == [Point(1, 2), Point(1, 9), Point(2, 0)]
assert Point(1, 2) == Point(1, 2)
assert len({Point(1, 2), Point(1, 2)}) == 1`,
    String.raw`assert line.total_cents == 2500 and changed.total_cents == 3750
assert line is not changed
assert asdict(line) == {"sku": "BOOK-1", "quantity": 2, "unit_price_cents": 1250}`,
    "assert policy.attempts == 0",
    'assert group.labels == ["python"]',
  ],
  [
    String.raw`assert status is Status.DRAFT is Status["DRAFT"]
assert status.name == "DRAFT" and status.value == "draft" and status.can_publish()
assert status != "draft"
assert json.loads(json.dumps({"status": status.value})) == {"status": "draft"}`,
    String.raw`assert Result.OK is Result.SUCCESS
assert [m.name for m in Result] == ["SUCCESS", "FAILURE"]
assert list(Result.__members__) == ["SUCCESS", "OK", "FAILURE"]
assert Result.OK.name == "SUCCESS"`,
    String.raw`assert Role.ADMIN == "admin" and str(Role.USER) == "user"
assert InternalLabel.READY.value == "ready"
assert ExitStatus.FAILED == 1 and type(ExitStatus.FAILED + 1) is int`,
    String.raw`assert Permission.READ in granted and Permission.WRITE in granted
assert not bool(Permission(0))`,
  ],
  [
    String.raw`assert total.amount == 250 and amount.amount == 200
assert repr(total) == "Money(250)" and str(total) == "250 units"
assert amount == Money(200) and amount != 200
assert Money.__hash__ is None`,
    String.raw`assert len(cart) == 2 and list(cart) == ["book", "pen"]
assert cart[-1] == "pen" and cart[:1] == ["book"]
assert type(cart[:1]) is list and not Cart([])`,
    "assert value.__len__() == 99 and len(value) == 2",
  ],
  [
    String.raw`assert notifier.prefix == "build"
assert isinstance(notifier, Notification) and issubclass(ConsoleNotification, Notification)`,
    String.raw`assert Combined().steps() == ["left", "right", "root"]
assert [cls.__name__ for cls in Combined.__mro__] == ["Combined", "Left", "Right", "Root", "object"]`,
    'assert recorder.messages == ["ready: monthly"]',
  ],
  [
    'assert example.tags == ["changed"] and example.tags is example._tags',
    String.raw`assert source == [" python ", "external"]
assert snapshot == ("python",) and collection.tags == ("python", "notes")`,
    String.raw`assert item.base_value() == "base" and item.child_value() == "child"
assert item._Base__value == "base"`,
  ],
  [
    "assert person.age == 21",
    "assert rectangle.width == 5 and rectangle.height == 4 and rectangle.area == 20",
    "assert stats.word_count == 3 and stats.computations == 2",
  ],
  [
    String.raw`assert item.instance_type() == Inspector.instance_type(item) == "DetailedInspector"
assert DetailedInspector.class_type() == item.class_type() == "DetailedInspector"
assert Inspector.join("a", "b") == item.join("a", "b") == "a:b"`,
    String.raw`assert type(label) is ImportantLabel and label.text == "Release"
assert raw == {"text": " Release "}`,
    String.raw`assert Counter.count == 0 and LocalCounter.count == 2
assert "count" in LocalCounter.__dict__`,
  ],
];
test("27 esempi autonomi sulla baseline CPython 3.12", () => {
  assert.deepEqual(
    blocks.map((items) => items.length),
    [3, 5, 4, 3, 3, 3, 3, 3],
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
    ]) {
      assert.ok(note.body.includes("## " + title), title);
    }
    assert.ok(note.body.includes("https://docs.python.org/3.12/"));
    assert.ok(note.body.includes("CPython 3.12.10"));
    assert.ok(
      note.body.includes(
        "[[Programmazione/Python/Indice Python|Indice Python]]",
      ),
    );
  });
  for (const [j, probe] of expected[i].entries()) {
    test(name + ": blocco autonomo " + (j + 1) + " e risultato", () =>
      run(i, j, probe),
    );
  }
}
const cases = [
  [
    "Classi: inizializzazione, binding e identita",
    0,
    0,
    String.raw`
third = User("ada@example.com")
assert third is not first and third != first
assert User.deactivate(third) is None and third.active is False
class InvalidInit:
    def __init__(self):
        return 1
with expect.assertRaises(TypeError):
    InvalidInit()
`,
  ],
  [
    "Classi: liste condivise, shadowing e alias",
    0,
    1,
    String.raw`
left.tags = ["local"]
assert left.tags == ["local"] and right.tags == ["python"]
assert SharedTags.tags is right.tags
alias.tags.append("shared-object")
assert one.tags[-1] == "shared-object" and two.tags == []
`,
  ],
  [
    "Conto: input e costruttore",
    0,
    2,
    String.raw`
for value in [True, False, 1.0, float("nan"), "1", None]:
    with expect.assertRaises(TypeError):
        BankAccount("Ada", value)
for value in [-1, -100]:
    with expect.assertRaises(ValueError):
        BankAccount("Ada", value)
for value in ["", "  "]:
    with expect.assertRaises(ValueError):
        BankAccount(value)
with expect.assertRaises(TypeError):
    BankAccount(None)
assert BankAccount(" Ada ").owner == "Ada"
assert BankAccount("Ada").balance_cents == 0
`,
  ],
  [
    "Conto: prelievi e depositi rifiutati senza mutazioni",
    0,
    2,
    String.raw`
for operation in [account.deposit, account.withdraw]:
    for value in [True, False, 1.0, float("nan"), float("inf"), "1", None]:
        before = account.balance_cents
        with expect.assertRaises(TypeError):
            operation(value)
        assert account.balance_cents == before
    for value in [0, -1, -100]:
        before = account.balance_cents
        with expect.assertRaises(ValueError):
            operation(value)
        assert account.balance_cents == before
with expect.assertRaises(ValueError):
    account.withdraw(851)
assert account.balance_cents == 850
assert account.withdraw(850) is None and account.balance_cents == 0
assert account.deposit(1) is None and account.balance_cents == 1
with expect.assertRaises(AttributeError):
    account.balance_cents = 100
`,
  ],
  [
    "Dataclass: annotazioni, factory e input condivisi",
    1,
    0,
    String.raw`
assert User("bad", 42).id == "bad"
shared = []
a = User(1, "A", shared)
b = User(2, "B", shared)
a.tags.append("shared")
assert b.tags is shared and b.tags == ["shared"]
with expect.assertRaises(TypeError):
    hash(first)
with expect.assertRaises(ValueError):
    @dataclass
    class BadDefault:
        values: list = []
`,
  ],
  [
    "Dataclass: hash, ordinamento e tipo concreto",
    1,
    1,
    String.raw`
from dataclasses import FrozenInstanceError
assert hash(Point(1, 2)) == hash(Point(1, 2))
with expect.assertRaises(FrozenInstanceError):
    points[0].x = 4
class SubPoint(Point):
    pass
assert Point(1, 2) != SubPoint(1, 2)
with expect.assertRaises(TypeError):
    Point(1, 2) < SubPoint(1, 2)
with expect.assertRaises(ValueError):
    @dataclass(order=True, eq=False)
    class BadOrder:
        value: int
`,
  ],
  [
    "Dataclass: riga ordine, kw-only e replace validato",
    1,
    2,
    String.raw`
from dataclasses import FrozenInstanceError
for values, error in [
    ({"sku": ""}, ValueError),
    ({"sku": " bad"}, ValueError),
    ({"sku": None}, TypeError),
    ({"quantity": 0}, ValueError),
    ({"quantity": -1}, ValueError),
    ({"quantity": True}, TypeError),
    ({"quantity": 2.0}, TypeError),
    ({"unit_price_cents": -1}, ValueError),
    ({"unit_price_cents": False}, TypeError),
]:
    with expect.assertRaises(error):
        replace(line, **values)
    assert line.total_cents == 2500
assert replace(line, unit_price_cents=0).total_cents == 0
with expect.assertRaises(TypeError):
    OrderLine("x", 1, 2)
with expect.assertRaises(FrozenInstanceError):
    line.quantity = 9
assert not hasattr(line, "__dict__")
`,
  ],
  [
    "Dataclass: asdict, repr e copia non profonda di replace",
    1,
    2,
    String.raw`
from dataclasses import field
@dataclass
class Payload:
    values: list
    internal: str = field(default="not-public", repr=False)
payload = Payload([{"x": 1}])
exported = asdict(payload)
cloned = replace(payload)
assert "not-public" not in repr(payload)
assert exported["internal"] == "not-public"
assert exported["values"] is not payload.values
assert exported["values"][0] is not payload.values[0]
assert cloned.values is payload.values
`,
  ],
  [
    "Dataclass: post-init non e validazione continua",
    1,
    3,
    String.raw`
assert RetryPolicy().attempts == 3
for value in [True, 3.0, None]:
    with expect.assertRaises(TypeError):
        RetryPolicy(attempts=value)
for value in [0, -1]:
    with expect.assertRaises(ValueError):
        RetryPolicy(attempts=value)
with expect.assertRaises(AttributeError):
    policy.extra = 1
policy.attempts = "unchecked"
assert policy.attempts == "unchecked"
`,
  ],
  [
    "Dataclass: frozen superficiale, InitVar e init manuale",
    1,
    4,
    String.raw`
from dataclasses import FrozenInstanceError, InitVar, fields
with expect.assertRaises(FrozenInstanceError):
    group.labels = []
with expect.assertRaises(TypeError):
    hash(group)
@dataclass
class WithInput:
    amount: int
    multiplier: InitVar[int]
    def __post_init__(self, multiplier):
        self.amount *= multiplier
assert WithInput(2, 3).amount == 6
assert [f.name for f in fields(WithInput)] == ["amount"]
@dataclass
class Manual:
    def __init__(self):
        self.checked = False
    def __post_init__(self):
        self.checked = True
assert Manual().checked is False
`,
  ],
  [
    "Dataclass: ereditarieta e super con slots sulla baseline",
    1,
    3,
    String.raw`
class Base:
    def __init__(self):
        self.base_ready = True
    def name(self):
        return "base"
@dataclass
class Child(Base):
    x: int
assert not hasattr(Child(1), "base_ready")
@dataclass(slots=True)
class Slotted(Base):
    def broken(self):
        return super().name()
    def working(self):
        return super(Slotted, self).name()
with expect.assertRaises(TypeError):
    Slotted().broken()
assert Slotted().working() == "base"
`,
  ],
  [
    "Enum: conversione rigorosa e serializzazione",
    2,
    0,
    String.raw`
for raw in [None, 0, True, []]:
    with expect.assertRaises(TypeError):
        parse_status(raw)
for raw in ["DRAFT", " draft ", "", "unknown"]:
    with expect.assertRaises(ValueError) as caught:
        parse_status(raw)
    assert isinstance(caught.exception.__cause__, ValueError)
with expect.assertRaises(KeyError):
    Status["missing"]
with expect.assertRaises(TypeError):
    json.dumps(Status.DRAFT)
assert not Status.PUBLISHED.can_publish()
assert "draft" in Status
assert "unknown" not in Status
`,
  ],
  [
    "Enum: alias, unique ed estensione vietata",
    2,
    1,
    String.raw`
from enum import unique
assert Result(0) is Result.OK
with expect.assertRaises(ValueError):
    unique(Result)
with expect.assertRaises(TypeError):
    class Extended(Result):
        NEW = 2
`,
  ],
  [
    "Enum: interoperabilita e perdita del tipo nelle operazioni",
    2,
    2,
    String.raw`
assert isinstance(Role.USER, str) and type(Role.USER) is not str
assert type(str(Role.USER)) is str
class OtherRole(StrEnum):
    USER = "user"
assert Role.USER == OtherRole.USER == "user"
assert type(ExitStatus.FAILED + 1) is int
assert type(Role.USER.upper()) is str
`,
  ],
  [
    "Enum: flag, zero e bit sconosciuti",
    2,
    3,
    String.raw`
from enum import IntFlag
assert granted & Permission.READ == Permission.READ
assert granted ^ Permission.WRITE == Permission.READ
with expect.assertRaises(ValueError):
    Permission(4)
class IntegerPermission(IntFlag):
    READ = 1
assert int(IntegerPermission(4)) == 4
`,
  ],
  [
    "Metodi speciali: operatori non supportati e hash",
    3,
    0,
    String.raw`
assert amount.__add__(1) is NotImplemented
assert amount.__eq__(200) is NotImplemented
for expression in [lambda: amount + 1, lambda: 1 + amount, lambda: amount < Money(300), lambda: hash(amount)]:
    with expect.assertRaises(TypeError):
        expression()
for value in [True, 1.0, "1"]:
    with expect.assertRaises(TypeError):
        Money(value)
class SubMoney(Money):
    pass
sub = SubMoney(200)
assert sub == sub and sub != amount
with expect.assertRaises(TypeError):
    sub + amount
`,
  ],
  [
    "Metodi speciali: fallback riflesso",
    3,
    0,
    String.raw`
class Right:
    def __radd__(self, other):
        return ("reflected", other.amount)
    def __eq__(self, other):
        return isinstance(other, Money)
assert amount + Right() == ("reflected", 200)
assert amount == Right()
`,
  ],
  [
    "Metodi speciali: carrello, iteratori e copie",
    3,
    1,
    String.raw`
for value in [None, "book", (1,), [1]]:
    with expect.assertRaises(TypeError):
        Cart(value)
with expect.assertRaises(IndexError):
    cart[99]
with expect.assertRaises(TypeError):
    cart["0"]
with expect.assertRaises(ValueError):
    cart[::0]
snapshot = cart[:]
snapshot.append("new")
assert len(cart) == 2
one, two = iter(cart), iter(cart)
assert one is not two and iter(one) is one
assert next(one) == "book" and list(one) == ["pen"]
assert list(two) == ["book", "pen"] and list(cart) == ["book", "pen"]
with expect.assertRaises(StopIteration):
    next(one)
`,
  ],
  [
    "Metodi speciali: ricerca sul tipo e contratti len/repr",
    3,
    2,
    String.raw`
Sized.__len__ = lambda self: 4
assert len(value) == 4 and value.__len__() == 99
class InvalidLength:
    def __len__(self):
        return -1
with expect.assertRaises(ValueError):
    len(InvalidLength())
class InvalidRepr:
    def __repr__(self):
        return 1
with expect.assertRaises(TypeError):
    repr(InvalidRepr())
`,
  ],
  [
    "Ereditarieta: ABC, obblighi e limiti",
    4,
    0,
    String.raw`
with expect.assertRaises(TypeError):
    Notification("x")
class Incomplete(Notification):
    pass
with expect.assertRaises(TypeError):
    Incomplete("x")
class Plain:
    def send(self):
        raise NotImplementedError
plain = Plain()
with expect.assertRaises(NotImplementedError):
    plain.send()
class WrongSignature(Notification):
    def send(self):
        return 3
wrong = WrongSignature("x")
with expect.assertRaises(TypeError):
    wrong.send("message")
class InheritedInit(ConsoleNotification):
    pass
assert InheritedInit().prefix == "info"
`,
  ],
  [
    "Ereditarieta: MRO, ordine basi e catena interrotta",
    4,
    1,
    String.raw`
class Reversed(Right, Left):
    pass
assert Reversed().steps() == ["right", "left", "root"]
assert super(Left, Combined()).steps() == ["right", "root"]
class Stop(Root):
    def steps(self):
        return ["stop"]
class Interrupted(Stop, Right):
    pass
assert Interrupted().steps() == ["stop"]
with expect.assertRaises(TypeError):
    class Inconsistent(Combined, Reversed):
        pass
`,
  ],
  [
    "Ereditarieta: composizione e collaboratore incompatibile",
    4,
    2,
    String.raw`
other = RecordingNotifier()
ReportService(other).finish("weekly")
assert other.messages == ["ready: weekly"] and recorder.messages == ["ready: monthly"]
bad = ReportService(object())
with expect.assertRaises(AttributeError):
    bad.finish("missing")
`,
  ],
  [
    "Incapsulamento: read-only non blocca la mutazione",
    5,
    0,
    String.raw`
with expect.assertRaises(AttributeError):
    example.tags = []
example.tags.append("still-mutable")
assert example.tags == ["changed", "still-mutable"]
example._tags = ["internal"]
assert example.tags == ["internal"]
`,
  ],
  [
    "Incapsulamento: snapshot e input separati",
    5,
    1,
    String.raw`
assert collection.tags == ("python", "notes")
assert snapshot == ("python",)
assert collection.tags is not snapshot
with expect.assertRaises(AttributeError):
    collection.tags = ()
with expect.assertRaises(AttributeError):
    collection.tags.append("bad")
collection.add("python")
assert collection.tags == ("python", "notes", "python")
assert source == [" python ", "external"]
`,
  ],
  [
    "Incapsulamento: input errati senza stato parziale",
    5,
    1,
    String.raw`
for value in [None, (), "python"]:
    with expect.assertRaises(TypeError):
        TagCollection(value)
for value, error in [(True, TypeError), (1, TypeError), (None, TypeError), ("", ValueError), ("  ", ValueError)]:
    before = collection.tags
    with expect.assertRaises(error):
        collection.add(value)
    assert collection.tags == before
    with expect.assertRaises(error):
        TagCollection(["valid", value])
`,
  ],
  [
    "Incapsulamento: mangling non e sicurezza",
    5,
    2,
    String.raw`
assert vars(item) == {"_Base__value": "base", "_Child__value": "child"}
with expect.assertRaises(AttributeError):
    item.__value
item._Base__value = "modified"
assert item.base_value() == "modified" and item.child_value() == "child"
`,
  ],
  [
    "Proprieta: validazione comune e stato invariato",
    6,
    0,
    String.raw`
for value, error in [(-1, ValueError), (True, TypeError), (1.0, TypeError), (None, TypeError), ("3", TypeError)]:
    with expect.assertRaises(error):
        Person(value)
    with expect.assertRaises(error):
        person.age = value
    assert person.age == 21
assert Person(0).age == 0
person.__dict__["age"] = 999
assert person.age == 21
with expect.assertRaises(AttributeError):
    del person.age
`,
  ],
  [
    "Proprieta: area, dimensioni e sola lettura",
    6,
    1,
    String.raw`
assert Rectangle(0, 4).area == 0
for name in ["width", "height"]:
    for value, error in [(-1, ValueError), (True, TypeError), (2.5, TypeError), (None, TypeError)]:
        before = (rectangle.width, rectangle.height)
        with expect.assertRaises(error):
            setattr(rectangle, name, value)
        assert (rectangle.width, rectangle.height) == before
with expect.assertRaises(AttributeError):
    rectangle.area = 5
rectangle.__dict__["area"] = 999
assert rectangle.area == 20
`,
  ],
  [
    "Proprieta: cached_property, invalidazione e assegnazione",
    6,
    2,
    String.raw`
sample = TextStats("a")
assert sample.word_count == 1 and sample.computations == 1
sample.text = "a b c"
assert sample.word_count == 1
sample.word_count = 50
assert sample.word_count == 50 and sample.computations == 1
del sample.word_count
assert sample.word_count == 3 and sample.computations == 2
class Slotted:
    __slots__ = ()
    @cached_property
    def number(self):
        return 1
with expect.assertRaises(TypeError):
    Slotted().number
`,
  ],
  [
    "Metodi: binding classe/istanza e staticmethod",
    7,
    0,
    String.raw`
assert item.instance_type.__self__ is item
assert item.class_type.__self__ is DetailedInspector
assert Inspector.class_type.__self__ is Inspector
assert not hasattr(item.join, "__self__")
with expect.assertRaises(TypeError):
    Inspector.instance_type()
`,
  ],
  [
    "Factory: tipi, schema e input non modificato",
    7,
    1,
    String.raw`
assert type(Label.from_dict({"text": " A "})) is Label
assert Label.from_dict({"text": " A ", "extra": 1}).text == "A"
for value in [None, [], "x"]:
    with expect.assertRaises(TypeError):
        Label.from_dict(value)
with expect.assertRaises(ValueError):
    Label.from_dict({})
for value, error in [("", ValueError), (" ", ValueError), (True, TypeError), (1, TypeError), (None, TypeError)]:
    raw_input = {"text": value}
    with expect.assertRaises(error):
        Label.from_dict(raw_input)
    assert raw_input == {"text": value}
    with expect.assertRaises(error):
        Label(value)
assert raw == {"text": " Release "}
`,
  ],
  [
    "Factory: classe effettiva e costruttori incompatibili",
    7,
    1,
    String.raw`
assert type(ImportantLabel("x").from_dict({"text": "y"})) is ImportantLabel
class NeedsPriority(Label):
    def __init__(self, text, priority):
        super().__init__(text)
        self.priority = priority
with expect.assertRaises(TypeError):
    NeedsPriority.from_dict({"text": "x"})
`,
  ],
  [
    "Metodi di classe: contatori e mutazione condivisa",
    7,
    2,
    String.raw`
Counter.increment()
assert Counter.count == 1 and LocalCounter.count == 2
class LateCounter(Counter):
    pass
LateCounter.increment()
assert LateCounter.count == 2 and Counter.count == 1
class Shared:
    items = []
    @classmethod
    def add(cls, value):
        cls.items.append(value)
class Child(Shared):
    pass
Child.add(1)
assert Child.items is Shared.items and Shared.items == [1]
`,
  ],
];
for (const [title, note, block, probe] of cases) {
  test(title, () => run(note, block, probe));
}
