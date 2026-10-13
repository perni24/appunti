import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const fp = (marker) => snippet("Functional Programming", marker);
const pattern = (marker) => snippet("Design Patterns", marker);
const namedError = (name) => (error) => error.name === name;
const plain = (value) => structuredClone(value);

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

test("FP: somma pura e accumulatore con stato hanno contratti diversi", () => {
  const source = fp("function add(") + "\n" + fp("function addToTotal");
  const { value } = run(
    source,
    "[add(2, 3), add(2, 3), addToTotal(2), addToTotal(2)]",
  );
  assert.deepEqual(plain(value), [5, 5, 2, 4]);
});

test("FP: aggiornamento superficiale lascia invariato l'input", () => {
  const { value } = run(
    fp("const updatedUser"),
    "[user.age, updatedUser.age, user === updatedUser]",
  );
  assert.deepEqual(plain(value), [30, 31, false]);
});

test("FP: aggiornamento annidato copia i livelli modificati e condivide gli altri", () => {
  const { value: moveUser, output } = run(fp("function moveUser"), "moveUser");
  assert.deepEqual(plain(output), [["Roma"], [false]]);
  const metadata = { source: "test" };
  const address = Object.freeze({ city: "Roma", metadata });
  const user = Object.freeze({ name: "Luca", address });
  const result = moveUser(user, "Milano");
  assert.notEqual(result, user);
  assert.notEqual(result.address, address);
  assert.equal(result.address.metadata, metadata);
  assert.equal(user.address.city, "Roma");
});

test("FP: higher-order function, currying e applicazione parziale", () => {
  assert.deepEqual(plain(run(fp("function withTax")).output), [[122]]);
  assert.deepEqual(plain(run(fp("const multiply =")).output), [[10]]);
  assert.deepEqual(plain(run(fp("const multiplyPair")).output), [[15]]);
  assert.equal(
    run(fp("function withPrefix"), 'withPrefix("ID:")(7)').value,
    "ID:7",
  );
});

test("FP: map filter reduce producono i risultati senza cambiare i numeri", () => {
  const { value } = run(
    fp("const numbers ="),
    "[numbers, doubled, even, total]",
  );
  assert.deepEqual(plain(value), [[1, 2, 3, 4], [2, 4, 6, 8], [2, 4], 10]);
});

test("FP: il controesempio map modifica l'oggetto condiviso", () => {
  assert.deepEqual(plain(run(fp("const records =")).output), [[2], [true]]);
});

test("FP: composizione annidata e pipeline normalizzano stringhe", () => {
  assert.equal(run(fp("const trim ="), 'normalize("  CIAO  ")').value, "ciao");
  assert.equal(
    run(fp("const normalize = (value) => value.trim()"), 'normalize(" CIAO ")')
      .value,
    "ciao",
  );
  assert.deepEqual(plain(run(fp("function pipe")).output), [["ciao"]]);
});

test("FP: pipe conserva ordine, identita con zero passi e singolo argomento", () => {
  const { value: pipe } = run(fp("function pipe"), "pipe");
  const calls = [];
  const result = pipe(
    (...args) => {
      calls.push(args);
      return args[0] + 2;
    },
    (...args) => {
      calls.push(args);
      return args[0] * 3;
    },
  )(4);
  assert.equal(result, 18);
  assert.deepEqual(calls, [[4], [6]]);
  const input = {};
  assert.equal(pipe()(input), input);
});

test("FP: pipe rifiuta passi invalidi e si ferma al primo errore", () => {
  const { value: pipe } = run(fp("function pipe"), "pipe");
  for (const invalid of [null, undefined, 1, "fn", {}]) {
    assert.throws(() => pipe((x) => x, invalid), namedError("TypeError"));
  }
  const failure = new Error("stop");
  let reached = false;
  assert.throws(
    () =>
      pipe(
        () => {
          throw failure;
        },
        () => {
          reached = true;
        },
      )(1),
    (e) => e === failure,
  );
  assert.equal(reached, false);
});

test("FP: pipe non attende Promise e passa il valore originale", async () => {
  const { value: pipe } = run(fp("function pipe"), "pipe");
  const pending = Promise.resolve(4);
  let seen;
  assert.equal(
    pipe(
      () => pending,
      (value) => {
        seen = value;
        return value;
      },
    )(0),
    pending,
  );
  assert.equal(seen, pending);
  assert.equal(await pending, 4);
});

test("FP: scadenza deterministica, uguaglianza e timestamp invalidi", () => {
  const { value: isExpired } = run(fp("function isExpired"), "isExpired");
  assert.equal(isExpired(2000, 1999), false);
  assert.equal(isExpired(2000, 2000), true);
  assert.equal(isExpired(2000, 2001), true);
  for (const value of [NaN, Infinity, -Infinity, "2000", null, undefined]) {
    assert.throws(() => isExpired(value, 0), namedError("TypeError"));
    assert.throws(() => isExpired(0, value), namedError("TypeError"));
  }
});

test("FP: utenti attivi, trim, duplicati e ordinamento UTF-16", () => {
  const { value: names } = run(
    fp("function getActiveUserNames"),
    "getActiveUserNames",
  );
  const users = ["Sara", " anna ", "Anna", "Sara", "   "].map((name) =>
    Object.freeze({ name, active: true }),
  );
  users.push(Object.freeze({ name: "Luca", active: false }));
  Object.freeze(users);
  const before = structuredClone(users);
  const first = names(users);
  assert.deepEqual(plain(first), ["Anna", "Sara", "Sara", "anna"]);
  assert.deepEqual(users, before);
  assert.notEqual(first, names(users));
  assert.deepEqual(plain(names([])), []);
});

test("FP: schema utenti invalido e array sparsi non vengono ignorati", () => {
  const { value: names } = run(
    fp("function getActiveUserNames"),
    "getActiveUserNames",
  );
  for (const invalid of [
    null,
    {},
    "users",
    [null],
    [[]],
    [{}],
    new Array(1),
    [{ name: 1, active: false }],
    [{ name: "Luca", active: "false" }],
  ]) {
    assert.throws(() => names(invalid), namedError("TypeError"));
  }
});

test("FP: esempio completo di selezione conserva i nomi originali", () => {
  const source = fp("function getActiveUserNames") + "\n" + fp("const users =");
  assert.deepEqual(plain(run(source).output), [[["Anna", "Sara"]], [" Sara "]]);
});

test("Pattern: simple factory crea oggetti distinti e rifiuta tipi ignoti", () => {
  const { value: createTransport } = run(
    pattern("function createTransport"),
    "createTransport",
  );
  assert.deepEqual(plain(createTransport("car")), { type: "car", wheels: 4 });
  assert.deepEqual(plain(createTransport("bike")), { type: "bike", wheels: 2 });
  assert.notEqual(createTransport("car"), createTransport("car"));
  for (const value of ["boat", "constructor", null, 2])
    assert.throws(() => createTransport(value), namedError("Error"));
});

test("Pattern: modulo ES condiviso per URL, identita distinta con un altro fragment", async () => {
  const code = pattern("export const config");
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  const first = await import(`${url}#patterns-first`);
  const second = await import(`${url}#patterns-first`);
  const separate = await import(`${url}#patterns-second`);
  assert.equal(first.config, second.config);
  assert.notEqual(first.config, separate.config);
  assert.equal(Object.isFrozen(first.config), true);
  assert.throws(() => {
    first.config.apiUrl = "changed";
  }, TypeError);
});

test("Pattern: module pattern mantiene stato nella propria closure", () => {
  const { value } = run(
    pattern("const counter ="),
    "[counter.getValue(), counter.increment(), counter.getValue(), counter.value]",
  );
  assert.deepEqual(plain(value), [0, undefined, 1, undefined]);
});

test("Pattern: Observer sincrono in ordine di iscrizione e cleanup ripetibile", () => {
  const { value: Subject } = run(pattern("class Subject"), "Subject");
  const subject = new Subject();
  const events = [];
  const off = subject.subscribe((value) => events.push(["first", value]));
  subject.subscribe((value) => events.push(["second", value]));
  subject.notify(1);
  assert.equal(off(), true);
  assert.equal(off(), false);
  subject.notify(2);
  assert.deepEqual(events, [
    ["first", 1],
    ["second", 1],
    ["second", 2],
  ]);
});

test("Pattern: iscrizioni duplicate indipendenti e callback invalide", () => {
  const { value: Subject } = run(pattern("class Subject"), "Subject");
  const subject = new Subject();
  for (const value of [null, 3, {}, "fn"])
    assert.throws(() => subject.subscribe(value), namedError("TypeError"));
  let count = 0;
  const listener = () => {
    count += 1;
  };
  const first = subject.subscribe(listener);
  const second = subject.subscribe(listener);
  subject.notify();
  first();
  subject.notify();
  second();
  subject.notify();
  assert.equal(count, 3);
});

test("Pattern: Observer rinvia nuove iscrizioni e salta quelle rimosse", () => {
  const { value: Subject } = run(pattern("class Subject"), "Subject");
  const subject = new Subject();
  const events = [];
  let offFirst;
  let offSecond;
  offFirst = subject.subscribe(() => {
    events.push("first");
    offFirst();
    offSecond();
    subject.subscribe(() => events.push("new"));
  });
  offSecond = subject.subscribe(() => events.push("second"));
  subject.notify();
  assert.deepEqual(events, ["first"]);
  subject.notify();
  assert.deepEqual(events, ["first", "new"]);
});

test("Pattern: errore Observer interrompe la notifica senza rollback", () => {
  const { value: Subject } = run(pattern("class Subject"), "Subject");
  const subject = new Subject();
  const events = [];
  const failure = new Error("listener");
  subject.subscribe(() => events.push(1));
  subject.subscribe(() => {
    throw failure;
  });
  subject.subscribe(() => events.push(3));
  assert.throws(
    () => subject.notify(),
    (e) => e === failure,
  );
  assert.deepEqual(events, [1]);
});

test("Pattern: Observer condivide il payload e non attende Promise", async () => {
  const { value: Subject } = run(pattern("class Subject"), "Subject");
  const subject = new Subject();
  const payload = {};
  const events = [];
  let seen;
  const completion = Promise.resolve().then(() => events.push("later"));
  subject.subscribe((value) => {
    seen = value;
    events.push("now");
    return completion;
  });
  assert.equal(subject.notify(payload), undefined);
  assert.equal(seen, payload);
  assert.deepEqual(events, ["now"]);
  await completion;
  assert.deepEqual(events, ["now", "later"]);
});

test("Pattern: esempio Observer non notifica dopo unsubscribe", () => {
  const source = pattern("class Subject") + "\n" + pattern("const subject =");
  assert.deepEqual(plain(run(source).output), [["pronto"]]);
});

test("Pattern: strategie sconto e limiti inclusivi", () => {
  const { value: discount } = run(
    pattern("const discountStrategies"),
    "applyDiscount",
  );
  assert.equal(discount(100, "percent", 0.2), 80);
  assert.equal(discount(100, "percent", 1), 0);
  assert.equal(discount(100, "percent", 0), 100);
  assert.equal(discount(100, "fixed", 30), 70);
  assert.equal(discount(100, "fixed", 100), 0);
  assert.equal(discount(0, "fixed", 0), 0);
});

test("Pattern: input sconto e strategie sconosciute sono rifiutati", () => {
  const { value: discount } = run(
    pattern("const discountStrategies"),
    "applyDiscount",
  );
  for (const value of ["10", null, undefined, NaN, Infinity]) {
    assert.throws(() => discount(value, "fixed", 0), namedError("TypeError"));
    assert.throws(() => discount(100, "fixed", value), namedError("TypeError"));
  }
  assert.throws(() => discount(-1, "fixed", 0), namedError("TypeError"));
  for (const type of [
    "unknown",
    "constructor",
    "toString",
    "__proto__",
    null,
  ]) {
    assert.throws(() => discount(100, type, 0), namedError("RangeError"));
  }
  for (const [type, value] of [
    ["percent", -0.1],
    ["percent", 1.1],
    ["fixed", -1],
    ["fixed", 101],
  ]) {
    assert.throws(() => discount(100, type, value), namedError("RangeError"));
  }
});

test("Pattern: logging conserva this, argomenti e risultato senza loggare i dati", () => {
  const { value: wrap } = run(pattern("function withLogging"), "withLogging");
  const logs = [];
  const receiver = { prefix: "ID:" };
  const result = {};
  let received;
  const wrapped = wrap(
    function (...args) {
      received = [this, args];
      return result;
    },
    (...args) => logs.push(args),
  );
  assert.equal(wrapped.call(receiver, "secret", 7), result);
  assert.deepEqual(received, [receiver, ["secret", 7]]);
  assert.deepEqual(logs, [["Invocazione"]]);
});

test("Pattern: wrapper propaga errore funzione e errore logger prima dell'invocazione", () => {
  const { value: wrap } = run(pattern("function withLogging"), "withLogging");
  const failure = new Error("failure");
  const log = [];
  assert.throws(
    () =>
      wrap(
        () => {
          throw failure;
        },
        (message) => log.push(message),
      )(),
    (e) => e === failure,
  );
  assert.deepEqual(log, ["Invocazione"]);
  let called = false;
  assert.throws(
    () =>
      wrap(
        () => {
          called = true;
        },
        () => {
          throw failure;
        },
      )(),
    (e) => e === failure,
  );
  assert.equal(called, false);
  assert.throws(() => wrap(null, () => {}), namedError("TypeError"));
  assert.throws(() => wrap(() => {}, null), namedError("TypeError"));
});

test("Pattern: wrapper restituisce la stessa Promise, anche rifiutata", async () => {
  const { value: wrap } = run(pattern("function withLogging"), "withLogging");
  const success = Promise.resolve(7);
  assert.equal(
    wrap(
      () => success,
      () => {},
    )(),
    success,
  );
  assert.equal(await success, 7);
  const failure = new Error("async");
  const rejected = Promise.reject(failure);
  assert.equal(
    wrap(
      () => rejected,
      () => {},
    )(),
    rejected,
  );
  await assert.rejects(rejected, (e) => e === failure);
});

test("Pattern: esempio servizio decorato conserva il receiver", () => {
  const source =
    pattern("function withLogging") + "\n" + pattern("const service =");
  assert.deepEqual(plain(run(source).output), [["Invocazione"], ["ID:7"]]);
});

test("Pattern: validazione testuale, vincoli vuoti, spazi e tipi invalidi", () => {
  const { value: validate, output } = run(
    pattern("const validators ="),
    "validate",
  );
  assert.deepEqual(plain(output), [[true], [false]]);
  assert.equal(validate("x", []), true);
  assert.equal(validate("abc", ["required"]), true);
  for (const value of ["", "  ", null, undefined, 1, {}])
    assert.equal(validate(value, ["required"]), false);
  for (const value of [
    "a",
    "a@b",
    " x@y.z ",
    "x@@y.z",
    "x@y.z\n",
    "x".repeat(255) + "@y.z",
    4,
  ]) {
    assert.equal(validate(value, ["emailShape"]), false);
  }
});

test("Pattern: controllo completo della configurazione prima dello short-circuit", () => {
  const { value: validate } = run(pattern("const validators ="), "validate");
  for (const rule of [
    "unknown",
    "constructor",
    "toString",
    "__proto__",
    3,
    null,
  ]) {
    assert.throws(
      () => validate("", ["required", rule]),
      namedError("RangeError"),
    );
  }
  for (const rules of [null, {}, "required", new Array(1)]) {
    assert.throws(() => validate("", rules), namedError("TypeError"));
  }
});
