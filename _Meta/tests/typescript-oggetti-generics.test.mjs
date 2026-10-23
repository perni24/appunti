import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { parseNote } from "../../site/scripts/vault.mjs";
import {
  ts,
  valid,
  invalid,
  run,
  hasName,
  typeChecks,
} from "./typescript-examples.mjs";

const notes = [
  "Classi",
  "Visibilita e modificatori di accesso",
  "Classi astratte",
  "Implementazione di interfacce",
  "Generics",
];
const blocks = new Map(
  notes.map((name) => [
    name,
    parseNote(`Programmazione/TypeScript/Pagine/${name}.md`)
      .tree.children.filter(
        (node) => node.type === "code" && node.lang === "ts",
      )
      .map((node) => node.value),
  ]),
);

function snippet(index, marker) {
  const found = blocks
    .get(notes[index])
    .filter((source) => source.includes(marker));
  assert.equal(found.length, 1, `${notes[index]}: unique marker ${marker}`);
  return found[0];
}

test("Toolchain: TypeScript 5.9.3", () => assert.equal(ts.version, "5.9.3"));

for (const [name, snippets] of blocks) {
  snippets.forEach((source, index) => {
    test(`${name}: blocco ${index + 1} compila in strict`, () => valid(source));
  });
}

test("Classi: istanza, costruttore, statici e oggetto strutturale", () => {
  const source = snippet(0, "class User {");
  assert.deepEqual(run(source).output, [["guest@example.com (guest)"]]);
  invalid(
    source.replace("// user.createGuest();", "user.createGuest();"),
    2576,
  );
  const compatible =
    source +
    `
const record: User = { id: "r", email: "x", label() { return "record"; } };
`;
  assert.equal(run(compatible, "record instanceof User").value, false);
  assert.equal(run(source, "Object.hasOwn(user, 'label')").value, false);
});

test("Classi: timer deterministico, partenza da zero e restart", () => {
  const { value: Timer, output } = run(snippet(0, "class Timer"), "Timer");
  assert.deepEqual(output, [[0], [45]]);
  let time = 0;
  const timer = new Timer(() => time);
  assert.equal(timer.elapsedMs(), 0);
  timer.start();
  time = 12.5;
  assert.equal(timer.elapsedMs(), 12.5);
  timer.start();
  assert.equal(timer.elapsedMs(), 0);
  time = 13;
  assert.equal(timer.elapsedMs(), 0.5);
});

test("Classi: default monotono disponibile e clock personalizzato non validato", () => {
  const { value: Timer } = run(snippet(0, "class Timer"), "Timer", {
    performance,
  });
  const real = new Timer();
  real.start();
  const duration = real.elapsedMs();
  assert.ok(Number.isFinite(duration) && duration >= 0);
  let time = 10;
  const custom = new Timer(() => time);
  custom.start();
  time = 5;
  assert.equal(custom.elapsedMs(), -5);
});

test("Classi: definite assignment non inizializza il campo", () => {
  const source = snippet(0, "class DeferredLabel");
  assert.deepEqual(run(source).output, [[undefined]]);
  invalid(source.replace("label!: string;", "label: string;"), 2564);
  valid(source.replace("label!: string;", "label: string;"), {
    strictPropertyInitialization: false,
  });
  assert.throws(
    () =>
      run(
        source.replace(
          "// deferred.label.toUpperCase();",
          "deferred.label.toUpperCase();",
        ),
      ),
    hasName("TypeError"),
  );
  invalid(
    "class Label { text: string; constructor() { this.init(); } init() { this.text = 'ready'; } }",
    2564,
  );
});

test("Classi: this statico, binding e arrow per istanza", () => {
  const source = snippet(0, "read(this: Counter)");
  const { value, output } = run(
    source,
    "({ Counter, counter, detached, bound, arrow })",
  );
  assert.deepEqual(output, [[2, 2]]);
  invalid(source.replace("// detached();", "detached();"), 2684);
  const detached = value.detached;
  assert.throws(() => detached(), hasName("TypeError"));
  value.counter.value = 5;
  assert.equal(value.bound(), 5);
  assert.equal(value.arrow(), 5);
  const other = new value.Counter();
  assert.equal(other.read, value.counter.read);
  assert.notEqual(other.readBound, value.counter.readBound);
});

test("Classi: ordine campi e noImplicitOverride separato da strict", () => {
  const source = snippet(0, "class BaseLabel");
  assert.deepEqual(run(source).output, [["base"], ["custom"]]);
  const implicit = source.replace("override label", "label");
  valid(implicit);
  invalid(implicit, 4114, { noImplicitOverride: true });
  valid(source, { noImplicitOverride: true });
  invalid(
    "class Base {} class Child extends Base { constructor() { console.log(this); super(); } }",
    17009,
  );
});

test("Classi: declare preserva il campo della base senza emissione propria", () => {
  const source = snippet(0, "class DetailedHolder");
  assert.deepEqual(run(source).output, [["Appunti"]]);
  assert.match(
    valid(source).js,
    /class DetailedHolder extends EntryHolder \{\s*constructor/,
  );
  const overwritten = source.replace(
    "declare entry: DetailedEntry;",
    'override entry: DetailedEntry = { id: "reset", title: "Reset" };',
  );
  assert.deepEqual(run(overwritten).output, [["Reset"]]);
  invalid(source + '\nnew DetailedHolder({ id: "missing" });', 2345);
});

test("Visibilita: range controllato, privato, protetto e readonly statici", () => {
  const source = snippet(1, "class Progress {");
  const { value: ProgressSummary, output } = run(source, "ProgressSummary");
  assert.deepEqual(output, [["import: 25%"]]);
  const progress = new ProgressSummary("test");
  for (const delta of [-1, NaN, Infinity, -Infinity, 101]) {
    assert.throws(() => progress.advance(delta), hasName("RangeError"));
    assert.equal(progress.summary(), "test: 0%");
  }
  progress.advance(100);
  progress.advance(0);
  assert.equal(progress.summary(), "test: 100%");
  assert.throws(() => progress.advance(1), hasName("RangeError"));
  invalid(source.replace("// progress.value;", "progress.value;"), 2341);
  invalid(source.replace("// progress.label();", "progress.label();"), 2445);
  invalid(
    source.replace('// progress.id = "other";', 'progress.id = "other";'),
    2540,
  );
});

test("Visibilita: private non e privacy runtime, bracket access consentito", () => {
  const source = snippet(1, "class Progress {");
  assert.equal(
    run(source + '\nconst read = progress["value"];', "read").value,
    25,
  );
  const { value: progress } = run(source, "progress");
  assert.equal(progress.value, 25);
  assert.ok(Object.keys(progress).includes("value"));
  progress.value = 500;
  assert.equal(progress.summary(), "import: 500%");
});

test("Visibilita: factory locale, limiti stringa e costruttore privato", () => {
  const source = snippet(1, "class NoteTitle");
  const { value: NoteTitle, output } = run(source, "NoteTitle");
  assert.deepEqual(output, [["Appunti"]]);
  for (const input of ["", " \n ", "x".repeat(121)]) {
    assert.throws(() => NoteTitle.create(input), hasName("RangeError"));
  }
  assert.equal(NoteTitle.create("x".repeat(120)).value.length, 120);
  assert.equal(NoteTitle.create("\u{1F600}".repeat(60)).value.length, 120);
  assert.throws(
    () => NoteTitle.create("\u{1F600}".repeat(61)),
    hasName("RangeError"),
  );
  invalid(
    source.replace('// new NoteTitle("bypass");', 'new NoteTitle("bypass");'),
    2673,
  );
  assert.equal(
    new NoteTitle("").value,
    "",
    "Emitted JS constructor remains callable",
  );
  invalid(source, 1294, { erasableSyntaxOnly: true });
});

test("Visibilita: campi # non enumerati, receiver errato e chiave stringa distinta", () => {
  const source = snippet(1, "class PrivateCounter");
  const { value: counter, output } = run(source, "counter");
  assert.deepEqual(output, [[1], [[]], ["{}"]]);
  assert.throws(() => counter.read.call({}), hasName("TypeError"));
  counter["#value"] = 999;
  assert.equal(counter.read(), 1);
  assert.throws(
    () => new Function("counter", "return counter.#value;"),
    SyntaxError,
  );
  invalid(
    source +
      "\nclass Derived extends PrivateCounter { readOther() { return this.#value; } }",
    18013,
  );
});

test("Visibilita: readonly superficiale ed eliminato nel JavaScript", () => {
  const source = snippet(1, "class Preferences");
  const { value: preferences, output } = run(source, "preferences");
  assert.deepEqual(output, [[false]]);
  assert.equal(preferences.options.compact, true);
  invalid(
    source.replace(
      "// preferences.options = { compact: false };",
      "preferences.options = { compact: false };",
    ),
    2540,
  );
  preferences.options = { compact: false };
  assert.equal(preferences.options.compact, false);
});

test("Visibilita: origini private distinte e receiver protected", () => {
  invalid(
    "class A { private value = 1; } class B { private value = 1; } const a: A = new B();",
    2322,
  );
  valid(
    "class A { private value = 1; } class B extends A {} const a: A = new B();",
  );
  invalid(
    "class A { protected value = 1; } class B extends A { read(a: A) { return a.value; } }",
    2446,
  );
});

test("Astratte: new vietato e obbligo per la derivata concreta", () => {
  const source = snippet(2, "abstract class Repository<T>");
  invalid(
    source.replace("// new Repository<string>();", "new Repository<string>();"),
    2511,
  );
  invalid(source + "\nclass Missing extends Repository<string> {}", 2515);
  valid(source + "\nabstract class Deferred extends Repository<string> {}");
});

test("Astratte: emissione senza metodo astratto o blocco runtime", async () => {
  const { value: Repository } = run(
    snippet(2, "abstract class Repository<T>"),
    "Repository",
  );
  assert.equal(typeof Repository, "function");
  assert.equal(Object.hasOwn(Repository.prototype, "findById"), false);
  const base = new Repository();
  await assert.rejects(base.exists("x"), hasName("TypeError"));
});

test("Astratte: ricerca locale, assenza, confronto esatto e riuso del metodo base", async () => {
  const source = snippet(2, "class InMemoryUserRepository");
  const { value: api } = run(
    source,
    "({ demo, repository, InMemoryUserRepository })",
  );
  assert.equal(await api.demo(), "u_1");
  assert.equal(await api.repository.findByEmail("missing"), null);
  assert.equal(await api.repository.findByEmail("LUCA@example.com"), null);
  await assert.rejects(
    api.repository.requireByEmail("missing"),
    /User not found/,
  );
  const user = { id: "a", email: "a@example.com" };
  const repository = new api.InMemoryUserRepository([user]);
  assert.equal(await repository.requireByEmail(user.email), user);
  const empty = new api.InMemoryUserRepository([]);
  assert.equal(await empty.findByEmail("x"), null);
});

test("Astratte: errore adapter propagato, non trasformato in assenza", async () => {
  const { value: UserRepository } = run(
    snippet(2, "class InMemoryUserRepository"),
    "UserRepository",
  );
  const failure = new Error("Adapter unavailable");
  class Failing extends UserRepository {
    async findByEmail() {
      throw failure;
    }
  }
  await assert.rejects(
    new Failing().requireByEmail("x"),
    (error) => error === failure,
  );
});

test("Astratte: firme new e abstract new distinte", () => {
  const source = snippet(2, "abstract class Renderer");
  assert.deepEqual(run(source).output, [["contenuto"]]);
  invalid(
    source.replace("// createRenderer(Renderer);", "createRenderer(Renderer);"),
    2345,
  );
  invalid(
    source.replace("// new RendererType();", "new RendererType();"),
    2511,
  );
});

test("Astratte: controprova hook nel costruttore prima dei campi derivati", () => {
  const source = `
abstract class Base {
  constructor() { this.render(); }
  abstract render(): string;
}
class Derived extends Base {
  text = "ready";
  render(): string { return this.text.toUpperCase(); }
}
`;
  const { value: Derived } = run(source, "Derived");
  assert.throws(() => new Derived(), hasName("TypeError"));
});

test("Interfacce: logger e implementazione strutturale senza classe", () => {
  const messages = [];
  const { value: ConsoleLogger } = run(
    snippet(3, "interface Logger"),
    "ConsoleLogger",
    {
      console: {
        log: (message) => messages.push(["info", message]),
        error: (message) => messages.push(["error", message]),
      },
    },
  );
  const logger = new ConsoleLogger();
  logger.info("start");
  logger.error("failed");
  assert.deepEqual(messages, [
    ["info", "start"],
    ["error", "failed"],
  ]);
  const source = snippet(3, "interface Logger");
  valid(
    source +
      "\nconst logger: Logger = { info(message) {}, error(message) {} };",
  );
  invalid(
    source + "\nclass Missing implements Logger { info(message: string) {} }",
    2420,
  );
  invalid(source + "\nconst check = {} instanceof Logger;", 2693);
});

test("Interfacce: test double registra, senza trasporto, e notify attende", async () => {
  const { value: api } = run(
    snippet(3, "class RecordingEmailSender"),
    "({ demo, notify, sender })",
  );
  assert.equal(await api.demo(), 1);
  assert.deepEqual(structuredClone(api.sender.messages), [
    { to: "luca@example.com", subject: "Benvenuto" },
  ]);
  let release;
  let finished = false;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const notified = api.notify({ send: () => pending }).then(() => {
    finished = true;
  });
  await Promise.resolve();
  assert.equal(finished, false);
  release();
  await notified;
  assert.equal(finished, true);
  const failure = new Error("Simulated adapter failure");
  await assert.rejects(
    api.notify({
      send: async () => {
        throw failure;
      },
    }),
    (error) => error === failure,
  );
});

test("Interfacce: parametri non inferiti e campo opzionale non creato", () => {
  const source = snippet(3, "interface NameChecker");
  const { value: checker, output } = run(source, "checker");
  assert.deepEqual(output, [[false], [undefined]]);
  assert.equal(checker.check("Luca"), true);
  assert.equal(Object.hasOwn(checker, "description"), false);
  invalid(
    source.replace("check(name: string): boolean {", "check(name): boolean {"),
    7006,
  );
  invalid(
    source.replace("// checker.description;", "checker.description;"),
    2339,
  );
  valid(
    source +
      typeChecks +
      "\ntype Description = Expect<Equal<typeof contract.description, string | undefined>>;",
  );
});

test("Interfacce: firma del costruttore separata dai membri dell'istanza", () => {
  const source = snippet(3, "interface FormatterConstructor");
  assert.deepEqual(run(source).output, [["Nota: TypeScript"]]);
  invalid(
    source.replace(
      "implements Formatter {",
      "implements FormatterConstructor {",
    ),
    2420,
  );
  invalid(
    source.replace(
      "new (prefix: string): Formatter;",
      "new (prefix: number): Formatter;",
    ),
    2322,
  );
});

test("Interfacce: controprova bivarianza metodi e proprieta funzione", () => {
  const source = `
interface Handler { handle(value: string | number): void; }
class NarrowHandler implements Handler {
  handle(value: string): void { value.toUpperCase(); }
}
const handler: Handler = new NarrowHandler();
`;
  assert.throws(
    () => run(source + "\nhandler.handle(42);"),
    hasName("TypeError"),
  );
  invalid(
    source.replace(
      "interface Handler { handle(value: string | number): void; }",
      "interface Handler { handle: (value: string | number) => void; }",
    ),
    2416,
  );
});

test("Generics: identity conserva il valore, i literal e il tipo esplicito", () => {
  const source = snippet(4, "function identity<T>");
  assert.deepEqual(run(source).output, [["ciao", 42]]);
  valid(
    source +
      typeChecks +
      `
type Text = Expect<Equal<typeof text, "ciao">>;
type Count = Expect<Equal<typeof count, 42>>;
const widened = identity<string>("ciao");
type Widened = Expect<Equal<typeof widened, string>>;
`,
  );
  invalid(
    source.replace('// identity<number>("42");', 'identity<number>("42");'),
    2345,
  );
  const { value: identity } = run(source, "identity");
  const object = { id: "a" };
  assert.equal(identity(object), object);
});

test("Generics: unwrap non copia, non interpreta HTTP e non valida", () => {
  const source = snippet(4, "type ApiResponse<T>");
  const { value: api, output } = run(source, "({ unwrap, response, user })");
  assert.deepEqual(output, [["luca@example.com"]]);
  assert.equal(api.user, api.response.data);
  assert.equal(api.unwrap({ status: 500, data: "error" }), "error");
  const unvalidated =
    source +
    `
const fake = JSON.parse('{"id":1}') as User;
const value: User = unwrap<User>({ status: 200, data: fake });
`;
  assert.equal(run(unvalidated, "value.email").value, undefined);
});

test("Generics: first gestisce vuoto anche senza noUncheckedIndexedAccess", () => {
  const source = snippet(4, "function first<T>");
  assert.deepEqual(run(source).output, [["Luca", undefined]]);
  valid(source, { noUncheckedIndexedAccess: true });
  invalid(source + '\nconst required: string = first(["x"]);', 2322);
  const wrong = source.replace("): T | undefined {", "): T {");
  assert.notEqual(wrong, source);
  assert.equal(run(wrong, "first([])").value, undefined);
  invalid(wrong, 2322, { noUncheckedIndexedAccess: true });
});

test("Generics: controesempio spread viola il literal del sottotipo", () => {
  const source = snippet(4, "function withUpdatedId");
  const counterexample =
    source +
    `
const narrowed = withUpdatedId({ id: "old" } as const, "new");
const promised: "old" = narrowed.id;
`;
  assert.equal(run(counterexample, "promised").value, "new");
});

test("Generics: constraint usa id preservando campi e identita", () => {
  const source = snippet(4, "function requireId");
  const { value: requireId, output } = run(source, "requireId");
  assert.deepEqual(output, [["Appunti"]]);
  const record = Object.freeze({ id: "a", title: "A" });
  assert.equal(requireId(record), record);
  assert.throws(() => requireId({ id: "" }), /ID vuoto/);
  assert.equal(
    requireId({ id: " " }).id,
    " ",
    "No format validation is promised",
  );
  invalid(
    source.replace(
      '// requireId({ title: "Appunti" });',
      'requireId({ title: "Appunti" });',
    ),
    2353,
  );
  invalid(
    source + '\nconst missingId = { title: "Appunti" }; requireId(missingId);',
    2345,
  );
  invalid(
    "function wrong<T extends { id: string }>(): T { return { id: 'x' }; }",
    2322,
  );
});

test("Generics: slot vuoto, tipo per istanza, statici e cancellazione dei tipi", () => {
  const source = snippet(4, "class Slot<T>");
  assert.deepEqual(run(source).output, [[undefined], ["pronto"]]);
  invalid(source.replace("// slot.set(42);", "slot.set(42);"), 2345);
  invalid(
    source.replace(
      "  #value: T | undefined;",
      "  #value: T | undefined;\n  static defaultValue: T;",
    ),
    2302,
  );
  const withNumbers = source + "\nconst numbers = new Slot<number>();";
  assert.equal(
    run(withNumbers, "slot.constructor === numbers.constructor").value,
    true,
  );
  invalid("function create<T>(): T { return new T(); }", 2693);
});
