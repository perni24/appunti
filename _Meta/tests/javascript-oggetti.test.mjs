import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

function run(source, expression = "undefined") {
  const output = [];
  const context = vm.createContext({
    console: { log: (...args) => output.push(args) },
  });
  const value = vm.runInContext(`${source}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output };
}
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;
const privateCode = (marker) =>
  snippet("Private Fields e Static Blocks", marker);
const descriptorCode = (marker) =>
  snippet("Property Descriptors", marker, "javascript");
const inheritanceCode = (marker) => snippet("Ereditariet\u00e0", marker);

test("Classi: creazione con new e divieto di chiamata ordinaria", () => {
  const source = snippet("Classi", "class Task");
  assert.deepEqual(plain(run(source).output), [["Leggere gli appunti"]]);
  assert.throws(() => run(source, 'Task("altro")'), namedError("TypeError"));
});

test("Classi: metodi condivisi non enumerabili, campi propri indipendenti", () => {
  const { value } = run(
    snippet("Classi", "class Counter"),
    `(() => {
    const first = new Counter(); const second = new Counter();
    first.increment();
    return [first.count, second.count, first.increment === second.increment,
      Object.hasOwn(first, "count"), Object.getOwnPropertyDescriptor(Counter.prototype, "increment").enumerable];
  })()`,
  );
  assert.deepEqual(plain(value), [1, 0, true, true, false]);
});

test("Classi: il metodo estratto perde this, la funzione bound lo conserva", () => {
  const source =
    snippet("Classi", "class Counter") +
    "\n" +
    snippet("Classi", "const boundIncrement");
  assert.deepEqual(plain(run(source).output), [[1]]);
  assert.throws(() => run(source, "increment()"), namedError("TypeError"));
});

test("Classi: metodo statico assente dalle istanze", () => {
  const { value, output } = run(
    snippet("Classi", "class MathUtils"),
    "new MathUtils().sum",
  );
  assert.deepEqual(plain(output), [[5]]);
  assert.equal(value, undefined);
});

test("Classi: getter e setter di Rectangle, stato invariato dopo input invalido", () => {
  const { value: rectangle, output } = run(
    snippet("Classi", "class Rectangle"),
    "rectangle",
  );
  assert.deepEqual(plain(output), [[12], [25]]);
  for (const value of [0, -1, "2", null, undefined, NaN, Infinity]) {
    assert.throws(() => {
      rectangle.size = value;
    }, namedError("RangeError"));
    assert.deepEqual(
      [rectangle.width, rectangle.height, rectangle.area],
      [5, 5, 25],
    );
  }
});

test("Classi: costruttore Rectangle rifiuta dimensioni invalide e area infinita", () => {
  const { value: Rectangle } = run(
    snippet("Classi", "class Rectangle"),
    "Rectangle",
  );
  for (const value of [0, -1, "2", NaN, Infinity]) {
    assert.throws(() => new Rectangle(value, 1), namedError("RangeError"));
    assert.throws(() => new Rectangle(1, value), namedError("RangeError"));
  }
  assert.throws(
    () => new Rectangle(Number.MAX_VALUE, 2).area,
    namedError("RangeError"),
  );
});

test("Classi: presenza token e logout non simulano autenticazione remota", () => {
  const { value: session } = run(
    snippet("Classi", "class UserSession"),
    "session",
  );
  assert.equal(session.hasToken, false);
  assert.throws(() => session.getAuthHeader(), namedError("Error"));
  session.login("AZaz09-._~+/==");
  assert.equal(session.hasToken, true);
  assert.equal(session.getAuthHeader(), "Bearer AZaz09-._~+/==");
  session.logout();
  session.logout();
  assert.equal(session.hasToken, false);
});

test("Classi: token invalidi non alterano la sessione esistente", () => {
  const { value: session } = run(
    snippet("Classi", "class UserSession"),
    "session",
  );
  session.login("example-token");
  for (const value of [
    undefined,
    null,
    0,
    "",
    "a b",
    "=",
    "a=b",
    "abc\n",
    "abc\r\n",
    "abc\u2028",
  ]) {
    assert.throws(() => session.login(value), namedError("TypeError"));
    assert.equal(session.getAuthHeader(), "Bearer example-token");
  }
});

test("Ereditarieta: comportamento ereditato e due catene di prototipi", () => {
  const source =
    inheritanceCode("class Document") +
    "\n" +
    inheritanceCode("Object.getPrototypeOf(Report.prototype)");
  assert.deepEqual(plain(run(source).output), [
    ["Documento: Vendite"],
    ["report"],
    [true],
    [true],
  ]);
});

test("Ereditarieta: super inizializza la base e override riusa il receiver", () => {
  const base = inheritanceCode("class Document");
  const constructor = inheritanceCode("constructor(title, period)");
  assert.deepEqual(
    plain(
      run(
        base,
        `(() => { ${constructor}
    const r = new Report("Ricavi", "2026"); return [r.title, r.period, r.describe()]; })()`,
      ).value,
    ),
    ["Ricavi", "2026", "Documento: Ricavi"],
  );
  const override = inheritanceCode("super.describe()");
  assert.equal(
    run(
      base,
      `(() => { ${override}
    return new Report("Ricavi").describe(); })()`,
    ).value,
    "Documento: Ricavi (report)",
  );
});

test("Ereditarieta: super legge metodi della base, non i campi dell'istanza", () => {
  assert.deepEqual(plain(run(inheritanceCode("class BaseView")).output), [
    [["detail", undefined]],
  ]);
});

test("Ereditarieta: composizione con logger sostituibile", () => {
  const { value: createJob, output } = run(
    inheritanceCode("function createJob"),
    "createJob",
  );
  assert.deepEqual(plain(output), [["[jobs] Esecuzione: backup"]]);
  const messages = [];
  const job = createJob("test", { log: (message) => messages.push(message) });
  assert.equal(job.run(), "test");
  assert.deepEqual(messages, ["Esecuzione: test"]);
});

test("Ereditarieta: Error custom conserva status, gerarchia e cause", () => {
  const { value: ApiError, output } = run(
    inheritanceCode("class ApiError"),
    "ApiError",
  );
  assert.deepEqual(plain(output), [[true], [true], [404], [true]]);
  for (const status of [200, 399, 600, "404", NaN, 400.5]) {
    assert.throws(
      () => new ApiError("Errore", status),
      namedError("RangeError"),
    );
  }
  assert.equal(new ApiError("Errore", 500).status, 500);
});

test("Ereditarieta: metodo base accede al proprio campo privato nella derivata", () => {
  assert.deepEqual(plain(run(inheritanceCode("getValue()")).output), [[1]]);
});

for (const note of ["Incapsulamento", "Private Fields e Static Blocks"]) {
  test(`${note}: deposito in centesimi, controlli e overflow atomico`, () => {
    const { value: BankAccount } = run(
      snippet(note, "class BankAccount"),
      "BankAccount",
    );
    const account = new BankAccount();
    account.deposit(100);
    for (const amount of [0, -1, 0.1, "100", null, NaN, Infinity]) {
      assert.throws(() => account.deposit(amount), namedError("RangeError"));
      assert.equal(account.getBalance(), 100);
    }
    account.deposit(Number.MAX_SAFE_INTEGER - 100);
    assert.throws(() => account.deposit(1), namedError("RangeError"));
    assert.equal(account.getBalance(), Number.MAX_SAFE_INTEGER);
  });
}

test("Incapsulamento: underscore pubblico, binding di closure non esposto", () => {
  assert.equal(
    run(
      snippet("Incapsulamento", "class Account"),
      "(new Account(10))._balance",
    ).value,
    10,
  );
  const { value: createCounter } = run(
    snippet("Incapsulamento", "function createCounter"),
    "createCounter",
  );
  const first = createCounter();
  const second = createCounter();
  first.increment();
  assert.deepEqual(
    [first.getCount(), second.getCount(), first.count],
    [1, 0, undefined],
  );
});

test("Incapsulamento: setter eta accetta solo interi non negativi", () => {
  const { value: user } = run(
    snippet("Incapsulamento", "#age = 0"),
    "new User()",
  );
  user.age = 20;
  for (const value of [-1, 1.5, "20", null, NaN, Infinity]) {
    assert.throws(() => {
      user.age = value;
    }, namedError("RangeError"));
    assert.equal(user.age, 20);
  }
});

test("Incapsulamento: il carrello minimo dimostra il riferimento condiviso", () => {
  const source = snippet("Incapsulamento", "total + item.price, 0");
  const { value: Cart } = run(source, "Cart");
  const cart = new Cart();
  const item = { price: 10 };
  cart.addItem(item);
  item.price = 2;
  assert.equal(cart.getTotal(), 2);
});

test("Incapsulamento: carrello copia input, output e soli campi ammessi", () => {
  const { value: Cart, output } = run(
    snippet("Incapsulamento", "priceCents });"),
    "Cart",
  );
  assert.deepEqual(plain(output), [[1200]]);
  const cart = new Cart();
  cart.addItem({ id: "free", priceCents: 0, extra: { secret: true } });
  const items = cart.getItems();
  items.push({ id: "injected", priceCents: 1 });
  items[0].id = "changed";
  assert.deepEqual(plain(cart.getItems()), [{ id: "free", priceCents: 0 }]);
  assert.equal(cart.getTotal(), 0);
});

test("Incapsulamento: carrello rifiuta record invalidi senza modifiche parziali", () => {
  const { value: cart } = run(
    snippet("Incapsulamento", "priceCents });"),
    "new Cart()",
  );
  for (const item of [
    null,
    [],
    "x",
    {},
    { id: " " },
    { id: "x", priceCents: "10" },
    { id: "x", priceCents: NaN },
    { id: "x", priceCents: -1 },
  ]) {
    assert.throws(() => cart.addItem(item));
    assert.equal(cart.getItems().length, 0);
  }
  cart.addItem({ id: "max", priceCents: Number.MAX_SAFE_INTEGER });
  assert.throws(
    () => cart.addItem({ id: "overflow", priceCents: 1 }),
    namedError("RangeError"),
  );
  assert.equal(cart.getItems().length, 1);
  assert.equal(cart.getTotal(), Number.MAX_SAFE_INTEGER);
});

test("Private fields: campo pubblico bypassa il setter, assegnazione lo chiama", () => {
  assert.deepEqual(plain(run(privateCode("class BaseSettings")).output), [
    [["assignment"]],
    [true],
    [false],
  ]);
});

test("Private fields: accessi esterni e dalla sottoclasse sono errori di sintassi", () => {
  assert.throws(
    () => run(privateCode("console.log(account.#balance)")),
    namedError("SyntaxError"),
  );
  assert.throws(
    () => run(privateCode("return this.#secret; // SyntaxError")),
    namedError("SyntaxError"),
  );
});

test("Private methods: validatore dimostrativo gestisce input non stringa", () => {
  const { value: validator } = run(
    privateCode("class PasswordValidator"),
    "validator",
  );
  assert.equal(validator.validate("abc12345"), true);
  for (const input of [null, 1, {}, "abc", "abcdefgh"])
    assert.equal(validator.validate(input), false);
});

test("Private accessors: prezzo copiato e limite del setter privato", () => {
  const { value: cart, output } = run(
    privateCode("get #total()"),
    "new Cart()",
  );
  const item = { priceCents: 50 };
  cart.add(item);
  item.priceCents = 1;
  cart.printTotal();
  assert.deepEqual(plain(output), [[50]]);
  for (const item of [null, {}, { priceCents: "5" }, { priceCents: -1 }])
    assert.throws(() => cart.add(item), namedError("RangeError"));
  const { value: counter } = run(
    privateCode("class LimitedCounter"),
    "new LimitedCounter()",
  );
  for (let value = 1; value <= 10; value++)
    assert.equal(counter.increment(), value);
  assert.throws(() => counter.increment(), namedError("RangeError"));
});

test("Static private: riferimento alla classe condivide la sequenza tra sottoclassi", () => {
  const { value, output } = run(
    privateCode("class IdGenerator"),
    `(() => {
    class OtherIds extends IdGenerator {}
    return [OtherIds.createId(), IdGenerator.createId()];
  })()`,
  );
  assert.deepEqual(plain(output), [[1], [2]]);
  assert.deepEqual(plain(value), [3, 4]);
});

test("Static private: usare this con receiver derivato genera TypeError", () => {
  assert.throws(
    () => run(privateCode("class BaseSequence")),
    namedError("TypeError"),
  );
});

test("Static blocks: una valutazione, piu istanze e ordine della derivata", () => {
  assert.deepEqual(
    plain(run(privateCode("class Example"), "new Example()").output),
    [["static block"], ["constructor"], ["constructor"]],
  );
  assert.deepEqual(plain(run(privateCode("const events = []")).output), [
    [
      [
        "before super",
        "base field",
        "base constructor",
        "derived field",
        "after super",
      ],
    ],
  ]);
});

test("Static registry: selezione campi, copie e record congelati", () => {
  const { value: Registry } = run(privateCode("static #items;"), "Registry");
  assert.equal(Registry.get("missing"), undefined);
  const data = { enabled: false, extra: true };
  Registry.set("search", data);
  data.enabled = true;
  assert.deepEqual(plain(Registry.get("search")), { enabled: false });
  assert.equal(Reflect.set(Registry.get("search"), "enabled", true), false);
  for (const value of [null, [], {}, { enabled: "true" }])
    assert.throws(() => Registry.set("search", value), namedError("TypeError"));
  assert.throws(
    () => Registry.set(" ", { enabled: true }),
    namedError("TypeError"),
  );
  assert.equal(Registry.get("search").enabled, false);
});

test("Private brand: null, primitivi, oggetti con solo prototype e proxy", () => {
  const { value: User } = run(privateCode("static isUser(value)"), "User");
  assert.equal(User.isUser(new User(1)), true);
  for (const value of [
    null,
    undefined,
    1,
    "x",
    {},
    () => {},
    Object.create(User.prototype),
    new Proxy(new User(1), {}),
  ]) {
    assert.equal(User.isUser(value), false);
  }
});

test("Private counter: limiti numerici e receiver con campo assente", () => {
  const { value: Counter } = run(
    privateCode("constructor(initialValue = 0)"),
    "Counter",
  );
  const counter = new Counter(Number.MAX_SAFE_INTEGER - 1);
  assert.equal(counter.increment(), Number.MAX_SAFE_INTEGER);
  assert.throws(() => counter.increment(), namedError("RangeError"));
  for (const value of [-1, "0", NaN, Infinity])
    assert.throws(() => new Counter(value), namedError("RangeError"));
  assert.throws(
    () => Counter.prototype.increment.call({}),
    namedError("TypeError"),
  );
  assert.throws(
    () => new Proxy(new Counter(), {}).increment(),
    namedError("TypeError"),
  );
});

test("Private counter: freeze e serializzazione non operano sul campo privato", () => {
  const source =
    privateCode("constructor(initialValue = 0)") +
    "\n" +
    privateCode("const counter = new Counter()");
  assert.deepEqual(plain(run(source).output), [[1], [[]], ["{}"]]);
  assert.throws(
    () => run('"use strict";\n' + source, "counter.value = 2"),
    namedError("TypeError"),
  );
});

test("Descriptors: snapshot modificato non cambia la proprieta fino a defineProperty", () => {
  assert.deepEqual(plain(run(descriptorCode("const stateDescriptor")).output), [
    ["pending"],
    ["done"],
  ]);
});

test("Descriptors: aggiornamento con attributi omessi conserva i flag", () => {
  assert.deepEqual(
    plain(run(descriptorCode("const options = { retries")).output),
    [[true, true, true]],
  );
});

test("Descriptors: readonly strict e delete non configurabile generano TypeError", () => {
  assert.throws(
    () => run(descriptorCode('settings.apiUrl = "https://evil.example.com"')),
    namedError("TypeError"),
  );
  assert.throws(
    () => run(descriptorCode("delete user.id")),
    namedError("TypeError"),
  );
});

test("Descriptors: non configurabile puo restare scrivibile, blocco irreversibile", () => {
  const source = descriptorCode("const lockable");
  assert.deepEqual(plain(run(source).output), [[2]]);
  assert.throws(
    () =>
      run(
        source,
        'Object.defineProperty(lockable, "value", { writable: true })',
      ),
    namedError("TypeError"),
  );
  assert.equal(
    run(source, 'Reflect.defineProperty(lockable, "value", {value: 3})').value,
    false,
  );
  assert.equal(
    run(source, 'Reflect.defineProperty(lockable, "value", {value: 2})').value,
    true,
  );
});

test("Descriptors: getter non enumerabile rimane leggibile", () => {
  const { value, output } = run(
    descriptorCode('// ["firstName", "lastName"]'),
    'Object.getOwnPropertyDescriptor(user, "fullName")',
  );
  assert.deepEqual(plain(output), [
    ["Luca Bellini"],
    [["firstName", "lastName"]],
  ]);
  assert.equal(value.enumerable, false);
  assert.equal(value.set, undefined);
});

test("Descriptors: setter valida saldo ma underscore resta pubblico", () => {
  const { value: account } = run(descriptorCode("_balance: 0"), "account");
  for (const value of [-1, "100", NaN, Infinity])
    assert.throws(() => {
      account.balance = value;
    }, namedError("RangeError"));
  assert.equal(account.balance, 100);
  account._balance = -1;
  assert.equal(account.balance, -1);
});

test("Descriptors: data e accessor incompatibili, non ReferenceError da obj assente", () => {
  assert.throws(
    () => run(descriptorCode("const obj = {}")),
    namedError("TypeError"),
  );
});

test("Descriptors: defineProperties non annulla modifiche precedenti", () => {
  assert.deepEqual(plain(run(descriptorCode("const target = {}")).output), [
    ["TypeError"],
    [true, 1],
  ]);
});

test("Descriptors: copia preserva getter e prototipo, spread li materializza", () => {
  const { value, output } = run(
    descriptorCode("let reads = 0"),
    `[
    Object.getOwnPropertyDescriptor(preserved, "displayName").get === Object.getOwnPropertyDescriptor(source, "displayName").get,
    Object.getOwnPropertyDescriptor(spreadCopy, "displayName").value,
    Object.getOwnPropertyDescriptor(preserved, "id").writable,
    Object.hasOwn(spreadCopy, "id"), preserved.details === source.details]`,
  );
  assert.deepEqual(plain(output), [[0], [1], ["profile", 1], [true]]);
  assert.deepEqual(plain(value), [true, "Ada", false, false, true]);
});

test("Descriptors: JSON replacer puo includere una proprieta non enumerabile", () => {
  const { value, output } = run(
    descriptorCode('value: "secret"'),
    'JSON.stringify(user, ["name", "password"])',
  );
  assert.deepEqual(plain(output), [['{"name":"Luca"}']]);
  assert.equal(value, '{"name":"Luca","password":"secret"}');
});

test("Descriptors: freeze non disabilita il setter che cambia una closure", () => {
  assert.deepEqual(plain(run(descriptorCode("let backingValue")).output), [
    [2],
  ]);
});
