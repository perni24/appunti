import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const leaks = "Memory Leaks";
const weak = "WeakMap e WeakSet";
function execute(note, marker, prefix = "") {
  const logs = [];
  const context = vm.createContext({
    console: { log: (...args) => logs.push(args) },
  });
  vm.runInContext(prefix + "\n" + snippet(note, marker), context);
  return { context, logs };
}

for (const [note, marker, expected] of [
  [leaks, "function createIdLogger", [["record-1"]]],
  [weak, "const first =", [["prima istanza"], [false]]],
  [weak, "const localKey", [["valore"]]],
  [
    weak,
    "const values =",
    [
      [undefined, true],
      [undefined, false],
      [true, false],
      [undefined, false],
    ],
  ],
  [weak, "const processed =", [[true], [true], [true, false]]],
  [weak, "function stateFor", [[1]]],
  [weak, "class User", [["Ada"], [[]]]],
]) {
  test(`Leak/weak: output dello snippet ${marker}`, () => {
    const { logs } = execute(note, marker);
    const normalized = logs.map((args) =>
      args.map((value) => (Array.isArray(value) ? Array.from(value) : value)),
    );
    assert.deepEqual(normalized, expected);
  });
}

test("Leak: globale accidentale solo nel realm classico non strict", () => {
  const { context } = execute(leaks, "function createAccidentalGlobal");
  vm.runInContext("createAccidentalGlobal()", context);
  assert.equal(context.accidentalRecord.id, "record-1");
  assert.equal(Object.hasOwn(globalThis, "accidentalRecord"), false);
  const strict = execute(
    leaks,
    "function createAccidentalGlobal",
    '"use strict";',
  ).context;
  assert.throws(() => vm.runInContext("createAccidentalGlobal()", strict), {
    name: "ReferenceError",
  });
  assert.equal(Object.hasOwn(strict, "accidentalRecord"), false);
});

test("Leak: logger conserva l'ID iniziale e non segue le mutazioni", () => {
  const { context, logs } = execute(leaks, "function createIdLogger");
  vm.runInContext(
    'const data = {id:"old"}; const log = createIdLogger(data); data.id = "new"; log();',
    context,
  );
  assert.deepEqual(logs, [["record-1"], ["old"]]);
});

function lru(limit) {
  return execute(leaks, "function createLruCache").context.createLruCache(
    limit,
  );
}

test("LRU: esempio di uso estratto dal Markdown", () => {
  const { context, logs } = execute(leaks, "function createLruCache");
  vm.runInContext(snippet(leaks, "const cache = createLruCache"), context);
  assert.deepEqual(logs, [[true, false, 2]]);
});

for (const limit of [
  0,
  -1,
  1.5,
  "2",
  NaN,
  Infinity,
  Number.MAX_SAFE_INTEGER + 1,
]) {
  test(`LRU: limite invalido ${String(limit)}`, () => {
    assert.throws(() => lru(limit), { name: "RangeError" });
  });
}

test("LRU: has non rinnova la recenza, get assente non altera le voci", () => {
  const cache = lru(2);
  cache.set("a", 1);
  cache.set("b", 2);
  assert.equal(cache.has("a"), true);
  assert.equal(cache.get("absent"), undefined);
  cache.set("c", 3);
  assert.equal(cache.has("a"), false);
  assert.equal(cache.get("b"), 2);
  assert.equal(cache.size, 2);
});

test("LRU: aggiornamento di una chiave rinnova recenza senza crescere", () => {
  const cache = lru(2);
  cache.set("a", 1);
  cache.set("b", 2);
  assert.equal(cache.set("a", 4), undefined);
  assert.equal(cache.size, 2);
  cache.set("c", 3);
  assert.equal(cache.has("b"), false);
  assert.equal(cache.get("a"), 4);
});

test("LRU: chiave e valore undefined, alias, delete e clear", () => {
  const cache = lru(1);
  cache.set(undefined, undefined);
  assert.equal(cache.has(undefined), true);
  assert.equal(cache.get(undefined), undefined);
  const record = { id: 1 };
  cache.set("record", record);
  assert.equal(cache.has(undefined), false);
  assert.equal(cache.get("record"), record);
  record.id = 2;
  assert.equal(cache.get("record").id, 2);
  assert.equal(cache.delete("record"), true);
  assert.equal(cache.delete("record"), false);
  cache.set("a", 1);
  cache.clear();
  cache.clear();
  assert.equal(cache.size, 0);
});

test("Weak: oggetti, funzioni e simboli non registrati sono ammessi", () => {
  const map = new WeakMap();
  const set = new WeakSet();
  for (const key of [{}, () => {}, Symbol("local")]) {
    assert.equal(map.set(key, 1), map);
    assert.equal(set.add(key), set);
    assert.equal(map.get(key), 1);
    assert.equal(set.has(key), true);
    assert.equal(map.delete(key), true);
    assert.equal(set.delete(key), true);
  }
});

for (const [label, key] of [
  ["null", null],
  ["undefined", undefined],
  ["stringa", "id"],
  ["numero", 1],
  ["booleano", false],
  ["bigint", 1n],
  ["simbolo registrato", Symbol.for("test")],
]) {
  test(`Weak: ${label} rifiutato in scrittura, assente in lettura`, () => {
    const map = new WeakMap();
    const set = new WeakSet();
    assert.throws(() => map.set(key, 1), TypeError);
    assert.throws(() => set.add(key), TypeError);
    assert.equal(map.get(key), undefined);
    assert.equal(map.has(key), false);
    assert.equal(map.delete(key), false);
    assert.equal(set.has(key), false);
    assert.equal(set.delete(key), false);
  });
}

test("Weak: nessuna enumerazione, dimensione o clear", () => {
  for (const collection of [new WeakMap(), new WeakSet()]) {
    for (const property of [
      "size",
      "clear",
      "forEach",
      "keys",
      "values",
      "entries",
      Symbol.iterator,
    ]) {
      assert.equal(collection[property], undefined);
    }
    assert.throws(() => [...collection], TypeError);
  }
});

test("WeakMap: il valore con rimando alla chiave e un dato ordinario condiviso", () => {
  const { context } = execute(weak, "let key =");
  assert.equal(vm.runInContext("key", context), null);
  assert.equal(
    vm.runInContext(
      `
    const live = {};
    const state = {owner: live};
    metadata.set(live, state);
    metadata.get(live) === state && state.owner === live;
  `,
      context,
    ),
    true,
  );
});

test("WeakMap: fallback stateFor conserva identita e inizializza chiavi distinte", () => {
  const { context } = execute(
    weak,
    "function stateFor",
    "WeakMap.prototype.getOrInsertComputed = undefined;",
  );
  assert.equal(
    vm.runInContext(
      `
    const one = {}, two = {};
    stateFor(one).visits = 3;
    stateFor(one) === stateFor(one) && stateFor(two).visits === 0 && stateFor(one).visits === 3;
  `,
      context,
    ),
    true,
  );
  assert.throws(() => vm.runInContext('stateFor("id")', context), {
    name: "TypeError",
  });
});

test("WeakMap: stato privato, input e receiver della classe", () => {
  const { context } = execute(weak, "class User");
  assert.equal(vm.runInContext('new User("Lin").getName()', context), "Lin");
  assert.throws(() => vm.runInContext("new User(1)", context), {
    name: "TypeError",
  });
  assert.throws(
    () => vm.runInContext("User.prototype.getName.call({})", context),
    { name: "TypeError" },
  );
  assert.equal(
    vm.runInContext("Object.freeze(user).getName()", context),
    "Ada",
  );
});

test("WeakSet: grafo con ciclo e nodo ripetuto, visita in ordine", () => {
  const { context, logs } = execute(weak, "function collectNodeNames");
  vm.runInContext(snippet(weak, "const root ="), context);
  assert.deepEqual(Array.from(logs[0][0]), ["root", "child"]);
  const shared = { name: "same", children: [] };
  const root = {
    name: "root",
    children: [shared, { name: "same", children: [] }, shared],
  };
  assert.deepEqual(Array.from(context.collectNodeNames(root)), [
    "root",
    "same",
    "same",
  ]);
  assert.equal(root.children.length, 3);
});

test("WeakSet: visita profonda iterativa e input invalidi", () => {
  const { context } = execute(weak, "function collectNodeNames");
  let node = { name: "end", children: [] };
  for (let i = 0; i < 12000; i++) node = { name: String(i), children: [node] };
  const result = context.collectNodeNames(node);
  assert.equal(result.length, 12001);
  assert.equal(result.at(-1), "end");
  for (const invalid of [
    null,
    1,
    {},
    { name: "x", children: null },
    { name: "x", children: [undefined] },
  ]) {
    assert.throws(() => context.collectNodeNames(invalid), {
      name: "TypeError",
    });
  }
});
