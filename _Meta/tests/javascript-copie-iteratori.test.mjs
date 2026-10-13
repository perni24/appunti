import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const copy = (marker, language = "javascript") =>
  snippet("Immutabilita e Copia degli Oggetti", marker, language);
const iterator = (marker) => snippet("Generators e Iterators", marker);
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;

function run(source, expression = "undefined", globals = {}) {
  const output = [];
  const context = vm.createContext({
    structuredClone,
    URL,
    AbortController,
    AbortSignal,
    Response,
    console: { log: (...args) => output.push(args) },
    ...globals,
  });
  const value = vm.runInContext(`${source}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output, context };
}

test("Copie: alias, riassegnazione del parametro e copia superficiale", () => {
  assert.deepEqual(plain(run(copy('const a = { name: "Luca" }')).output), [
    ["Sara"],
  ]);
  assert.deepEqual(plain(run(copy("function replaceUser")).output), [
    ["Luca", "Sara"],
  ]);
  assert.deepEqual(plain(run(copy('copy.name = "Sara"')).output), [
    ["Luca"],
    ["Milano"],
  ]);
});

test("Copie: spread legge getter, include Symbol e perde descrittori", () => {
  const { value } = run(
    "",
    `(() => {
    const key = Symbol("key"); let reads = 0;
    const original = { get name() { reads++; return "Luca"; }, [key]: 1 };
    Object.defineProperty(original, "hidden", {value: 2});
    const cloned = {...original};
    return [reads, cloned[key], Object.hasOwn(cloned, "hidden"), Object.getOwnPropertyDescriptor(cloned, "name").writable];
  })()`,
  );
  assert.deepEqual(plain(value), [1, 1, false, true]);
});

test("Copie: spread array materializza i buchi e non copia proprieta custom", () => {
  const { value } = run(
    "",
    `(() => {
    const source = [1, , 3]; source.extra = 4;
    const cloned = [...source];
    return [Object.hasOwn(source, 1), Object.hasOwn(cloned, 1), cloned[1], cloned.extra];
  })()`,
  );
  assert.deepEqual(plain(value), [false, true, undefined, undefined]);
});

test("Copie: assign attiva setter e conserva scritture precedenti a un errore", () => {
  const target = Object.defineProperty({}, "blocked", {
    value: 0,
    writable: false,
  });
  let seen;
  Object.defineProperty(target, "name", {
    set(value) {
      seen = value;
    },
  });
  assert.throws(
    () => Object.assign(target, { name: "Luca", first: 1, blocked: 2 }),
    TypeError,
  );
  assert.equal(seen, "Luca");
  assert.equal(target.first, 1);
  assert.equal(target.blocked, 0);
});

test("Copie: structuredClone separa i dati e preserva cicli e alias interni", () => {
  assert.deepEqual(plain(run(copy("const copy = structuredClone(user);")).output), [
    ["Roma"],
  ]);
  assert.deepEqual(plain(run(copy("obj.self = obj")).output), [[true]]);
  const child = { value: 1 };
  const source = { a: child, b: child };
  const result = structuredClone(source);
  assert.equal(result.a, result.b);
  assert.notEqual(result.a, child);
});

test("Copie: clone Date Map Set, prototipo e stato frozen", () => {
  const { value } = run(copy("map: new Map"), "copy");
  assert.ok(value.date instanceof Date);
  assert.equal(value.map.get("a"), 1);
  assert.deepEqual([...value.set], [1, 2, 3]);
  class Record {
    constructor() {
      this.name = "Luca";
    }
  }
  const result = structuredClone(Object.freeze(new Record()));
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.isFrozen(result), false);
  result.name = "Sara";
  assert.equal(result.name, "Sara");
});

test("Copie: clone legge accessor ma omette proprieta non enumerabili e Symbol", () => {
  let reads = 0;
  const key = Symbol("key");
  const source = {
    get name() {
      reads++;
      return "Luca";
    },
    [key]: 1,
  };
  Object.defineProperty(source, "hidden", { value: 2 });
  const result = structuredClone(source);
  assert.equal(reads, 1);
  assert.equal(Object.getOwnPropertyDescriptor(result, "name").value, "Luca");
  assert.deepEqual(Reflect.ownKeys(result), ["name"]);
  for (const invalid of [
    Symbol("value"),
    () => {},
    new WeakMap(),
    new WeakSet(),
    new Proxy({}, {}),
  ]) {
    assert.throws(() => structuredClone(invalid), namedError("DataCloneError"));
  }
  assert.deepEqual(plain(run(copy("run() {")).output), [["DataCloneError"]]);
});

test("Copie: transfer distacca il buffer originale", () => {
  const { output } = run(copy("const transferred ="));
  assert.deepEqual(plain(output), [[0], [[10, 20, 30]]]);
});

test("Copie: SharedArrayBuffer clonato condivide ancora i byte", () => {
  const source = new SharedArrayBuffer(4);
  const result = structuredClone(source);
  new Uint8Array(result)[0] = 7;
  assert.notEqual(result, source);
  assert.equal(new Uint8Array(source)[0], 7);
  assert.throws(() => structuredClone(source, { transfer: [source] }));
});

test("Copie: JSON perde tipi e riferimenti e non clona BigInt o cicli", () => {
  const shared = { n: 1 };
  const result = JSON.parse(
    JSON.stringify({
      date: new Date(0),
      map: new Map([[1, 2]]),
      set: new Set([1]),
      missing: undefined,
      values: [undefined, NaN, Infinity],
      a: shared,
      b: shared,
    }),
  );
  assert.equal(result.date, "1970-01-01T00:00:00.000Z");
  assert.deepEqual(result.map, {});
  assert.deepEqual(result.set, {});
  assert.equal(Object.hasOwn(result, "missing"), false);
  assert.deepEqual(result.values, [null, null, null]);
  assert.notEqual(result.a, result.b);
  assert.throws(() => JSON.stringify(1n), TypeError);
  const circular = {};
  circular.self = circular;
  assert.throws(() => JSON.stringify(circular), TypeError);
});

test("Copie: freeze impedisce scritture ma resta superficiale", () => {
  assert.deepEqual(
    plain(run(copy('config.apiUrl = "https://other.example.com"')).output),
    [["TypeError"], ["TypeError"]],
  );
  assert.deepEqual(
    plain(run(copy('config.api.url = "https://other.example.com"')).output),
    [["https://other.example.com"]],
  );
  assert.deepEqual(plain(run(copy("const settings =")).output), [["dark"]]);
});

test("Copie: freeze non blocca accessor, Date e byte del DataView", () => {
  let stored = 0;
  const source = Object.freeze({
    get value() {
      return stored;
    },
    set value(value) {
      stored = value;
    },
  });
  source.value = 4;
  assert.equal(source.value, 4);
  const date = Object.freeze(new Date(0));
  date.setTime(1000);
  assert.equal(date.getTime(), 1000);
  assert.throws(() => Object.freeze(new Uint8Array(1)), TypeError);
  const view = Object.freeze(new DataView(new ArrayBuffer(1)));
  view.setUint8(0, 8);
  assert.equal(view.getUint8(0), 8);
});

test("Copie: deepFreeze tratta cicli, array, alias, Symbol e non enumerabili", () => {
  const { value } = run(
    copy("function deepFreeze"),
    `(() => {
    const key = Symbol("child"); const child = {n: 1};
    const root = {a: child, list: [child], [key]: {hidden: true}};
    root.self = root;
    Object.defineProperty(root, "extra", {value: {n: 2}});
    const result = deepFreeze(root);
    return [result === root, root.a === root.list[0], root.self === root,
      ...[root, child, root.list, root[key], root.extra].map(Object.isFrozen)];
  })()`,
  );
  assert.deepEqual(plain(value), [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
});

test("Copie: deepFreeze attraversa oggetti gia frozen e prototipi null", () => {
  const { value } = run(
    copy("function deepFreeze"),
    `(() => {
    const child = Object.create(null); child.n = 1;
    const root = Object.freeze({child});
    deepFreeze(root);
    return [Object.isFrozen(child), Object.getPrototypeOf(child), deepFreeze(null), deepFreeze(7)];
  })()`,
  );
  assert.deepEqual(plain(value), [true, null, null, 7]);
});

test("Copie: deepFreeze rifiuta getter senza eseguirli e senza congelare parzialmente", () => {
  const { value } = run(
    copy("function deepFreeze"),
    `(() => {
    let reads = 0; const valid = {};
    const root = {valid, get bad() {reads++; return {};}};
    let error;
    try {deepFreeze(root);} catch (failure) {error = failure.name;}
    return [error, reads, Object.isFrozen(root), Object.isFrozen(valid)];
  })()`,
  );
  assert.deepEqual(plain(value), ["TypeError", 0, false, false]);
});

test("Copie: deepFreeze rifiuta funzioni e oggetti con stato non supportato", () => {
  const { value } = run(
    copy("function deepFreeze"),
    `(() => {
    return [() => {}, new Map(), new Date(), new Uint8Array(1), Object.create({})].map(value => {
      try {deepFreeze({value}); return "unexpected";} catch (error) {return error.name;}
    });
  })()`,
  );
  assert.deepEqual(plain(value), Array(5).fill("TypeError"));
});

test("Copie: seal e preventExtensions, writable puo essere ridotto una sola volta", () => {
  assert.deepEqual(plain(run(copy("Object.seal(user);")).output), [
    ["TypeError"],
    ["TypeError"],
  ]);
  assert.deepEqual(plain(run(copy("Object.preventExtensions(user);")).output), [
    ["TypeError"],
  ]);
  const sealed = Object.seal({ name: "Luca" });
  Object.defineProperty(sealed, "name", { writable: false });
  assert.throws(
    () => Object.defineProperty(sealed, "name", { writable: true }),
    TypeError,
  );
  const limited = Object.preventExtensions({ name: "Luca" });
  assert.equal(delete limited.name, true);
  assert.throws(() => Object.setPrototypeOf(limited, {}), TypeError);
});

test("Copie: updateUser conserva input e identita degli elementi non aggiornati", () => {
  const { value: updateUser } = run(
    copy("function updateUser(users", "js"),
    "updateUser",
  );
  const address = { city: "Roma" };
  const users = Object.freeze([
    Object.freeze({ id: 1, name: "Luca", active: true }),
    Object.freeze({ id: 2, name: "Sara", active: false, address }),
  ]);
  const result = updateUser(users, 2, { active: true });
  assert.notEqual(result, users);
  assert.equal(result[0], users[0]);
  assert.notEqual(result[1], users[1]);
  assert.equal(result[1].address, address);
  assert.equal(users[1].active, false);
  assert.equal(result[1].active, true);
});

test("Copie: updateUser senza cambiamento riusa l'array, patch arbitraria rifiutata", () => {
  const { value: updateUser } = run(
    copy("function updateUser(users", "js"),
    "updateUser",
  );
  const users = [{ id: 1, name: "Luca", active: true }];
  assert.equal(updateUser(users, 2, { active: false }), users);
  assert.equal(updateUser(users, 1, {}), users);
  assert.equal(updateUser(users, 1, { active: true }), users);
  for (const patch of [
    { id: 2 },
    { role: "admin" },
    { name: 3 },
    { active: "false" },
    { [Symbol()]: 1 },
    JSON.parse('{"__proto__":{}}'),
  ]) {
    assert.throws(() => updateUser(users, 1, patch), namedError("TypeError"));
  }
  for (const data of [new Array(1), [null], [{ id: 1, name: "Luca" }]]) {
    assert.throws(() => updateUser(data, 99, {}), namedError("TypeError"));
  }
  assert.throws(
    () => updateUser([users[0], users[0]], 1, {}),
    namedError("RangeError"),
  );
});

test("Iteratori: iterator manuale non iterable e completamento persistente", () => {
  const { value: it } = run(iterator("const iterator ="), "iterator");
  assert.deepEqual(
    plain([it.next(), it.next(), it.next(), it.next(), it.next()]),
    [
      { value: 1, done: false },
      { value: 2, done: false },
      { value: 3, done: false },
      { value: undefined, done: true },
      { value: undefined, done: true },
    ],
  );
  assert.throws(() => [...it], TypeError);
  assert.throws(() => {
    const [first] = it;
    return first;
  }, TypeError);
  const { current } = it;
  assert.equal(current, 3);
});

test("Iteratori: iterable crea cursori indipendenti", () => {
  const { value: range, output } = run(iterator("const range ="), "range");
  assert.deepEqual(plain(output), [[1], [2], [3]]);
  const first = range[Symbol.iterator]();
  const second = range[Symbol.iterator]();
  first.next();
  first.next();
  assert.equal(second.next().value, 1);
  assert.deepEqual([...range], [1, 2, 3]);
  assert.deepEqual([...range], [1, 2, 3]);
});

test("Generatori: cursore monouso, nuovo cursore a ogni chiamata", () => {
  const { value: numbers } = run(iterator("function* numbers"), "numbers");
  const cursor = numbers();
  assert.equal(cursor[Symbol.iterator](), cursor);
  assert.deepEqual([...cursor], [1, 2, 3]);
  assert.deepEqual([...cursor], []);
  assert.deepEqual([...numbers()], [1, 2, 3]);
});

test("Generatori: next in ingresso e return finale non emesso da for-of", () => {
  const { output, value: conversation } = run(
    iterator("function* conversation"),
    "conversation",
  );
  assert.deepEqual(plain(output), [
    [{ value: "domanda", done: false }],
    [{ value: "risposta: si", done: true }],
    [{ value: undefined, done: true }],
  ]);
  assert.deepEqual([...conversation()], ["domanda"]);
});

test("Generatori: range valida al primo next e gestisce estremi sicuri", () => {
  const { value: range } = run(iterator("function* range("), "range");
  assert.deepEqual([...range(-2, 1)], [-2, -1, 0, 1]);
  assert.deepEqual([...range(4, 3)], []);
  assert.deepEqual(
    [...range(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER)],
    [Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER],
  );
  for (const invalid of [
    NaN,
    Infinity,
    1.5,
    "2",
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const cursor = range(invalid, 3);
    assert.throws(() => cursor.next(), namedError("TypeError"));
    assert.equal(cursor.next().done, true);
  }
});

test("Generatori: finally su break, errore consumatore, esaurimento e return", () => {
  const { value: tracked } = run(
    iterator("function* trackedNumbers"),
    "trackedNumbers",
  );
  let calls = 0;
  const onClose = () => {
    calls++;
  };
  for (const value of tracked(onClose)) {
    assert.equal(value, 1);
    break;
  }
  const failure = new Error("consumer");
  assert.throws(
    () => {
      for (const _ of tracked(onClose)) throw failure;
    },
    (e) => e === failure,
  );
  assert.deepEqual([...tracked(onClose)], [1, 2]);
  const manual = tracked(onClose);
  manual.next();
  manual.return();
  manual.return();
  assert.equal(calls, 4);
  const neverStarted = tracked(onClose);
  neverStarted.return();
  assert.equal(calls, 4);
});

test("Generatori: next manuale che fallisce non attiva return nel ciclo", () => {
  let closed = false;
  const failure = new Error("next");
  const iterable = {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      throw failure;
    },
    return() {
      closed = true;
      return { done: true };
    },
  };
  assert.throws(
    () => {
      for (const _ of iterable) {
      }
    },
    (e) => e === failure,
  );
  assert.equal(closed, false);
});

test("Generatori: yield nel finally puo rinviare il completamento di return", () => {
  function* cleanup() {
    try {
      yield 1;
    } finally {
      yield "cleanup";
    }
  }
  const cursor = cleanup();
  cursor.next();
  assert.deepEqual(cursor.return("stop"), { value: "cleanup", done: false });
  assert.deepEqual(cursor.next(), { value: "stop", done: true });
});

test("Generatori: throw puo essere catturato oppure chiudere il cursore", () => {
  const { value: recoverable, output } = run(
    iterator("function* recoverable"),
    "recoverable",
  );
  assert.deepEqual(plain(output), [
    [{ value: "recuperato: stop", done: false }],
    [{ value: undefined, done: true }],
  ]);
  const cursor = recoverable();
  const failure = new Error("before start");
  assert.throws(
    () => cursor.throw(failure),
    (e) => e === failure,
  );
  assert.equal(cursor.next().done, true);
});

test("Generatori: yield delegato emette elementi e helper restano lazy", () => {
  const { value: combined } = run(iterator("function* combined"), "combined");
  assert.deepEqual([...combined()], [1, 2, 3, 4]);
  const source =
    iterator("function* range(") + "\n" + iterator("const firstDoubles");
  assert.deepEqual(plain(run(source).output), [[[1, 2, 3]], [[2, 4, 6]]]);
});

test("Generatori async: nessun timer prima di next e una attesa per valore", async () => {
  const timers = [];
  const { value: stream } = run(iterator("const wait ="), "streamItems", {
    setTimeout: (fn, ms) => {
      timers.push({ fn, ms });
    },
  });
  const cursor = stream([1, 2]);
  assert.equal(timers.length, 0);
  const first = cursor.next();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, 100);
  timers[0].fn();
  assert.deepEqual(plain(await first), { value: 1, done: false });
  const second = cursor.next();
  timers[1].fn();
  assert.deepEqual(plain(await second), { value: 2, done: false });
  assert.deepEqual(plain(await cursor.next()), {
    value: undefined,
    done: true,
  });
  assert.equal(timers.length, 2);
});

function pagesFixture(responses) {
  const calls = [];
  const { value: fetchPages } = run(
    iterator("async function* fetchPages"),
    "fetchPages",
    {
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (responses.length === 0) throw new Error("Richiesta inattesa");
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return typeof response === "function"
          ? response(url, options)
          : response;
      },
    },
  );
  return { fetchPages, calls };
}
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });

test("Pagine: avvio lazy, query conservata e arresto solo con items vuoto", async () => {
  const { fetchPages, calls } = pagesFixture([
    json({ items: [{ id: 1, name: "A", secret: "omit" }] }),
    json({ items: [{ id: 2, name: "B" }] }),
    json({ items: [] }),
  ]);
  const cursor = fetchPages("https://example.test/api?category=books&page=99");
  assert.equal(calls.length, 0);
  const values = [];
  for await (const items of cursor) values.push(items);
  assert.deepEqual(plain(values), [
    [{ id: 1, name: "A" }],
    [{ id: 2, name: "B" }],
  ]);
  assert.deepEqual(
    calls.map(({ url }) => new URL(url).searchParams.get("page")),
    ["1", "2", "3"],
  );
  assert.ok(
    calls.every(
      ({ url }) => new URL(url).searchParams.get("category") === "books",
    ),
  );
  assert.equal(calls[0].options.headers.Accept, "application/json");
});

test("Pagine: break non avvia richieste successive", async () => {
  const { fetchPages, calls } = pagesFixture([
    json({ items: [{ id: 1, name: "A" }] }),
  ]);
  const cursor = fetchPages("https://example.test/api");
  for await (const items of cursor) {
    assert.equal(items.length, 1);
    break;
  }
  assert.equal(calls.length, 1);
  assert.equal((await cursor.next()).done, true);
});

test("Pagine: limite esplicito senza dichiarare una fine non confermata", async () => {
  const { fetchPages, calls } = pagesFixture([
    json({ items: [{ id: 1, name: "A" }] }),
  ]);
  const cursor = fetchPages("https://example.test/api", { maxPages: 1 });
  assert.equal((await cursor.next()).done, false);
  await assert.rejects(cursor.next(), namedError("RangeError"));
  assert.equal(calls.length, 1);
});

test("Pagine: HTTP parsing schema e rete sono errori, non fine sequenza", async () => {
  for (const [response, name, status] of [
    [new Response("not found", { status: 404 }), "Error", 404],
    [new Response("bad JSON"), "SyntaxError"],
    [json(null), "TypeError"],
    [json({ items: {} }), "TypeError"],
    [json({ items: [{ id: 0, name: "A" }] }), "TypeError"],
    [json({ items: [{ id: 1, name: 2 }] }), "TypeError"],
    [new TypeError("network"), "TypeError"],
  ]) {
    const { fetchPages } = pagesFixture([response]);
    await assert.rejects(
      fetchPages("https://example.test/api").next(),
      (error) => error.name === name && error.status === status,
    );
  }
});

test("Pagine: limiti URL e signal invalidi falliscono prima di Fetch", async () => {
  for (const options of [
    { maxPages: 0 },
    { maxPages: 10001 },
    { maxPages: 1.5 },
    { maxPages: "2" },
    { signal: {} },
  ]) {
    const { fetchPages, calls } = pagesFixture([]);
    await assert.rejects(
      fetchPages("https://example.test/api", options).next(),
    );
    assert.equal(calls.length, 0);
  }
  for (const url of [
    "/relative",
    "file:///tmp/file",
    "https://user:pass@example.test/api",
  ]) {
    const { fetchPages, calls } = pagesFixture([]);
    await assert.rejects(fetchPages(url).next(), namedError("TypeError"));
    assert.equal(calls.length, 0);
  }
});

test("Pagine: abort prima della prima richiesta o tra due pagine", async () => {
  const controller = new AbortController();
  controller.abort(0);
  const empty = pagesFixture([]);
  await assert.rejects(
    empty
      .fetchPages("https://example.test/api", { signal: controller.signal })
      .next(),
    (error) => error === 0,
  );
  assert.equal(empty.calls.length, 0);
  const active = new AbortController();
  const { fetchPages, calls } = pagesFixture([
    json({ items: [{ id: 1, name: "A" }] }),
  ]);
  const cursor = fetchPages("https://example.test/api", {
    signal: active.signal,
  });
  await cursor.next();
  active.abort(null);
  await assert.rejects(cursor.next(), (error) => error === null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.signal, active.signal);
});

test("Pagine: return non interrompe da solo una lettura pendente, abort si", async () => {
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const controller = new AbortController();
  const fixture = pagesFixture([
    (_url, { signal }) => {
      started();
      return new Promise((_resolve, reject) =>
        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        }),
      );
    },
  ]);
  const cursor = fixture.fetchPages("https://example.test/api", {
    signal: controller.signal,
  });
  const pending = cursor.next();
  await ready;
  const closing = cursor.return();
  assert.equal(controller.signal.aborted, false);
  const failure = new Error("cancelled");
  const rejected = assert.rejects(pending, (error) => error === failure);
  controller.abort(failure);
  await rejected;
  assert.equal((await closing).done, true);
});

test("Pagine: annullamento durante json impedisce la consegna del risultato", async () => {
  const controller = new AbortController();
  const { fetchPages } = pagesFixture([
    {
      ok: true,
      json: async () => {
        controller.abort("stop");
        return { items: [{ id: 1, name: "A" }] };
      },
    },
  ]);
  await assert.rejects(
    fetchPages("https://example.test/api", {
      signal: controller.signal,
    }).next(),
    (error) => error === "stop",
  );
});
