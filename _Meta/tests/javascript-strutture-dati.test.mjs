import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { snippet } from "./note-examples.mjs";

function run(source, expression = "undefined", globals = {}) {
  const output = [];
  const context = vm.createContext({
    console: {
      log: (...args) => output.push(args),
      error: (...args) => output.push(args),
    },
    ...globals,
  });
  const value = vm.runInContext(`${source}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output };
}
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;

test("Array: map crea un nuovo contenitore, filter conserva oggetti condivisi", () => {
  const mapped = run(
    snippet("Array Methods", "const doubled"),
    "[numbers, doubled, numbers === doubled]",
  );
  assert.deepEqual(plain(mapped.value), [[1, 2, 3], [2, 4, 6], false]);
  const filtered = run(
    snippet("Array Methods", "const source"),
    "[source[0].name, source[0] === selected[0]]",
  );
  assert.deepEqual(plain(filtered.value), ["Grace", true]);
});

test("Array: parseInt come callback riceve involontariamente la base", () => {
  const { output } = run(snippet("Array Methods", "values.map(parseInt)"));
  assert.deepEqual(plain(output), [[[10, NaN, 2]], [[10, 10, 10]]]);
});

test("Array: buchi saltati da every e map, espansione in undefined", () => {
  const { value, output } = run(
    snippet("Array Methods", "const sparse"),
    "sparse.map(() => 1)",
  );
  assert.equal(output[0][0], true);
  assert.equal(output[1][0], false);
  assert.equal(value.length, 2);
  assert.equal(Object.hasOwn(value, 0), false);
});

test("Array: reduce gestisce input vuoto e chiavi ereditate senza collisioni", () => {
  const { value: count } = run(
    snippet("Array Methods", "function countUsersByRole"),
    "countUsersByRole",
  );
  assert.equal(Object.getPrototypeOf(count([])), null);
  assert.deepEqual(Object.keys(count([])), []);
  const result = count(
    ["__proto__", "constructor", "toString", "__proto__"].map((role) => ({
      role,
    })),
  );
  assert.equal(result.__proto__, 2);
  assert.equal(result.constructor, 1);
  assert.equal(result.toString, 1);
  assert.equal(Object.getPrototypeOf(result), null);
});

test("Array: ordinamento numerico e lessicografico restano distinti", () => {
  assert.deepEqual(
    plain(run(snippet("Array Methods", "numbers.sort((a"), "numbers").value),
    [2, 10, 30],
  );
  const lexical = run(
    snippet("Array Methods", "numbers.sort();"),
    "numbers",
  ).value;
  assert.deepEqual(plain(lexical), [10, 2, 30]);
  assert.equal(typeof lexical[0], "number");
});

test("Array: slice preserva il sorgente, splice rimuove e inserisce", () => {
  const { value } = run(
    snippet("Array Methods", "const letters"),
    "[part, removed, letters]",
  );
  assert.deepEqual(plain(value), [
    ["B", "C"],
    ["B", "C"],
    ["A", "X", "D"],
  ]);
});

test("Array: fill condivide un oggetto, Array.from crea istanze distinte", () => {
  const { value } = run(
    snippet("Array Methods", "const shared"),
    "[shared[0] === shared[1], independent[0] === independent[1], independent[1].done]",
  );
  assert.deepEqual(plain(value), [true, false, false]);
});

test("Array: esempio nomi completo, originale non modificato", () => {
  const { value } = run(
    snippet("Array Methods", "const names = users"),
    "[names, users[0].name, users.length]",
  );
  assert.deepEqual(plain(value), [["Ada", "Sara"], " Sara ", 4]);
});

test("Array: Promise.all conserva l'ordine anche con completamento inverso", async () => {
  const pending = new Map();
  const source = snippet("Array Methods", "const users = await Promise.all");
  const { value } = run("", `(async () => { ${source}\nreturn users; })()`, {
    ids: [1, 2],
    fetchUser: (id) => new Promise((resolve) => pending.set(id, resolve)),
  });
  assert.deepEqual([...pending.keys()], [1, 2]);
  pending.get(2)({ id: 2 });
  pending.get(1)({ id: 1 });
  assert.deepEqual(plain(await value), [{ id: 1 }, { id: 2 }]);
});

test("Oggetti: hasOwn distingue ereditati, propri e valori undefined", () => {
  const { output } = run(
    snippet("Oggetti Avanzati", "const record = Object.create"),
  );
  assert.deepEqual(plain(output), [[false], [true], [true]]);
});

test("Oggetti: freeze e superficiale e blocca la riassegnazione in strict", () => {
  const source = snippet("Oggetti Avanzati", "const settings = Object.freeze");
  assert.equal(run(source, "settings.nested.enabled").value, false);
  assert.throws(
    () => run('"use strict";\n' + source, 'settings.theme = "dark"'),
    namedError("TypeError"),
  );
});

test("Oggetti: pulizia preserva falsy validi, spazi e riferimenti annidati", () => {
  const { value: clean } = run(
    snippet("Oggetti Avanzati", "function removeEmptyFields"),
    "removeEmptyFields",
  );
  const nested = { empty: "" };
  const original = {
    zero: 0,
    active: false,
    spaces: " ",
    nested,
    empty: "",
    absent: null,
    missing: undefined,
  };
  const result = clean(original);
  assert.deepEqual(Object.keys(result), ["zero", "active", "spaces", "nested"]);
  assert.equal(result.zero, 0);
  assert.equal(result.active, false);
  assert.equal(result.nested, nested);
  assert.equal(original.empty, "");
  for (const input of [null, undefined, [], 1, "abc"])
    assert.throws(() => clean(input), namedError("TypeError"));
});

test("Oggetti: pulizia esclude simboli, non enumerabili ed ereditati", () => {
  const { value: clean } = run(
    snippet("Oggetti Avanzati", "function removeEmptyFields"),
    "removeEmptyFields",
  );
  const source = Object.create({ inherited: 1 });
  source.visible = 2;
  source[Symbol("hidden")] = 3;
  Object.defineProperty(source, "secret", { value: 4 });
  assert.deepEqual(plain(clean(source)), { visible: 2 });
});

test("Map: chiave oggetto per identita, non uguaglianza di campi", () => {
  const { output } = run(snippet("Map e Set", "const cache"));
  assert.deepEqual(plain(output), [["dati utente"], [undefined]]);
});

test("Set: deduplicazione per id conserva l'ultimo utente", () => {
  const { value } = run(
    snippet("Map e Set", "const uniqueUsers"),
    "[uniqueUsers, uniqueUsers[0] === users[1]]",
  );
  assert.deepEqual(plain(value), [[{ id: 1, name: "Grace" }], true]);
});

test("Set: intersection non modifica i due insiemi", () => {
  const { value } = run(
    snippet("Map e Set", "const common = selected.intersection"),
    "[[...common], [...selected], [...allowed]]",
  );
  assert.deepEqual(plain(value), [[2], [1, 2], [2, 3]]);
});

test("Map: round trip JSON tramite coppie preserva chiavi numeriche", () => {
  const { value } = run(
    snippet("Map e Set", "const restored"),
    '[restored.size, restored.get(2), restored.get("2")]',
  );
  assert.deepEqual(plain(value), [2, "editor", undefined]);
});

test("Map: raggruppamento con chiavi arbitrarie e oggetti condivisi", () => {
  const { value: groupByRole } = run(
    snippet("Map e Set", "function groupByRole"),
    "groupByRole",
  );
  const first = { role: "__proto__" };
  const groups = groupByRole([
    first,
    { role: "__proto__" },
    { role: "constructor" },
  ]);
  assert.deepEqual([...groups.keys()], ["__proto__", "constructor"]);
  assert.equal(groups.get("__proto__").length, 2);
  assert.equal(groups.get("__proto__")[0], first);
  assert.equal(groupByRole([]).size, 0);
  for (const users of [null, {}, [null], [{}], [{ role: 1 }], new Array(2)]) {
    assert.throws(() => groupByRole(users), namedError("TypeError"));
  }
});

test("JSON: stringify omette undefined e converte numeri non finiti", () => {
  const { output } = run(snippet("JSON", "const data = { missing"));
  assert.deepEqual(plain(output), [
    ['{"values":[null,null],"count":null}'],
    [undefined],
  ]);
});

test("JSON: risultato di parsing distingue sintassi e tipo dell'input", () => {
  const { value: parse } = run(
    snippet("JSON", "function parseJsonSafe"),
    "parseJsonSafe",
  );
  for (const [text, expected] of [
    ["null", null],
    ["42", 42],
    ["true", true],
    ["[]", []],
  ]) {
    const result = parse(text);
    assert.equal(result.ok, true);
    assert.deepEqual(plain(result.value), expected);
  }
  for (const text of ['{"x":1,}', "{invalid}", "", "// comment"]) {
    const result = parse(text);
    assert.equal(result.ok, false);
    assert.equal(result.error.name, "SyntaxError");
  }
  for (const text of [null, 42, undefined, {}])
    assert.equal(parse(text).error.name, "TypeError");
});

test("JSON: schema preferenze rifiuta forme errate e seleziona campi ammessi", () => {
  const source =
    snippet("JSON", "function parseJsonSafe") +
    "\n" +
    snippet("JSON", "function readPreferences");
  const { value: read } = run(source, "readPreferences");
  assert.deepEqual(
    plain(
      read(
        '{"theme":"light","pageSize":1,"token":"secret","__proto__":{"admin":true}}',
      ),
    ),
    { theme: "light", pageSize: 1 },
  );
  assert.equal(read('{"theme":"dark","pageSize":100}').pageSize, 100);
  for (const text of [
    "null",
    "[]",
    "true",
    "{}",
    '{"theme":"blue","pageSize":20}',
    '{"theme":"dark","pageSize":"20"}',
    '{"theme":"dark","pageSize":0}',
    '{"theme":"dark","pageSize":101}',
    '{"theme":"dark","pageSize":1.5}',
  ]) {
    assert.throws(() => read(text), namedError("TypeError"));
  }
  assert.throws(() => read("{invalid}"), namedError("SyntaxError"));
});

test("JSON: reviver accetta solo istanti canonici e lascia gli altri campi", () => {
  const { value: revive } = run(
    snippet("JSON", "function reviveCreatedAt"),
    "reviveCreatedAt",
  );
  assert.equal(
    revive("createdAt", "2026-05-13T10:00:00.000Z").toISOString(),
    "2026-05-13T10:00:00.000Z",
  );
  assert.equal(revive("label", "2026-05-13"), "2026-05-13");
  assert.throws(() => revive("createdAt", null), namedError("TypeError"));
  for (const date of [
    "invalid",
    "2026-02-30T10:00:00.000Z",
    "2026-05-13T10:00:00+00:00",
  ]) {
    assert.throws(() => revive("createdAt", date), namedError("RangeError"));
  }
});

test("JSON HTTP: POST codifica il corpo e controlla lo stato", async () => {
  const source = snippet("JSON", 'fetch("/api/users",');
  let request;
  const { value } = run("", `(async () => { ${source} })()`, {
    fetch: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 204 };
    },
  });
  await value;
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(request.options.body), { name: "Luca" });
  const failed = run("", `(async () => { ${source} })()`, {
    fetch: async () => ({ ok: false, status: 500 }),
  });
  await assert.rejects(failed.value, /HTTP 500/);
});

test("JSON HTTP: GET distingue successo, HTTP e corpo non JSON", async () => {
  const source = snippet("JSON", 'fetch("/api/users/1")');
  const load = (fetch) =>
    run("", `(async () => { ${source}\nreturn user; })()`, { fetch }).value;
  assert.deepEqual(
    await load(async () => ({ ok: true, json: async () => ({ id: 1 }) })),
    { id: 1 },
  );
  await assert.rejects(
    load(async () => ({
      ok: false,
      status: 404,
      json: () => assert.fail("must not parse"),
    })),
    /HTTP 404/,
  );
  await assert.rejects(
    load(async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("empty body");
      },
    })),
    SyntaxError,
  );
  await assert.rejects(
    load(async () => {
      throw new TypeError("network");
    }),
    TypeError,
  );
});

test("Date: parser UTC canonico, bisestili e formato ristretto", () => {
  const { value: parse } = run(
    snippet("Date & Time", "function parseUtcInstant"),
    "parseUtcInstant",
  );
  for (const text of [
    "2024-02-29T00:00:00.000Z",
    "2026-05-13T10:00:00.000Z",
    "0000-01-01T00:00:00.000Z",
  ]) {
    assert.equal(parse(text).toISOString(), text);
  }
  for (const text of [
    "2026-02-29T00:00:00.000Z",
    "2026-02-30T00:00:00.000Z",
    "2026-13-01T00:00:00.000Z",
    "2026-01-01T24:00:00.000Z",
  ]) {
    assert.throws(() => parse(text), namedError("RangeError"));
  }
  for (const text of [
    null,
    0,
    "2026-05-13",
    "2026-05-13T10:00:00Z",
    "2026-05-13T10:00:00.000+00:00",
    "2026-05-13T10:00:00.000Z\n",
  ]) {
    assert.throws(() => parse(text), namedError("TypeError"));
  }
});

test("Date: misura con orologio iniettato, risultato e rifiuto del job", async () => {
  const { value: measure } = run(
    snippet("Date & Time", "async function measureJob"),
    "measureJob",
    { performance: { now: () => 10 } },
  );
  const ticks = [100, 107.5];
  assert.deepEqual(
    plain(
      await measure(
        async () => "done",
        () => ticks.shift(),
      ),
    ),
    { value: "done", durationMs: 7.5 },
  );
  assert.deepEqual(plain(await measure(() => 42)), {
    value: 42,
    durationMs: 0,
  });
  await assert.rejects(measure(null), namedError("TypeError"));
  const failure = new Error("job failed");
  await assert.rejects(
    measure(() => Promise.reject(failure)),
    (error) => error === failure,
  );
});

// Separate processes set TZ before evaluating the original examples, without changing the user's timezone.
for (const timeZone of ["UTC", "Europe/Rome", "America/New_York"]) {
  test(`Date: calendario locale e output esplicito in ${timeZone}`, () => {
    const source =
      snippet("Date & Time", "const after24Hours") +
      "\n" +
      snippet("Date & Time", "function parseUtcInstant") +
      "\n" +
      snippet("Date & Time", "function formatCreatedAt");
    const expression =
      '[after24Hours.getHours(), nextLocalDay.getHours(), (nextLocalDay-start)/3600000, start.getDate(), formatCreatedAt("2026-05-13T10:00:00.000Z"), new Date("2026-06-05").toISOString(), new Date("2026-06-05T00:00:00").getHours()]';
    const code = `import vm from 'node:vm'; const context=vm.createContext({console:{log(){}}}); process.stdout.write(JSON.stringify(vm.runInContext(${JSON.stringify(source + "\n;(" + expression + ")")},context,{timeout:1000})));`;
    const child = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", code],
      {
        env: { ...process.env, TZ: timeZone },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    assert.equal(child.status, 0, child.stderr || child.error?.message);
    const values = JSON.parse(child.stdout);
    assert.deepEqual(
      values.slice(0, 4),
      timeZone === "Europe/Rome" ? [13, 12, 23, 28] : [12, 12, 24, 28],
    );
    assert.match(values[4], /13 maggio 2026/);
    assert.match(values[4], /12:00/);
    assert.equal(values[5], "2026-06-05T00:00:00.000Z");
    assert.equal(values[6], 0);
  });
}

test("Regex: esempio js corretto e costruttore con doppio escape", () => {
  assert.deepEqual(
    plain(
      run(snippet("Regular Expressions", 'pattern.test("JavaScript")')).output,
    ),
    [[false], [true]],
  );
  assert.deepEqual(
    plain(run(snippet("Regular Expressions", "const constructed")).output),
    [[true, true]],
  );
});

test("Regex: g aggiorna lastIndex, matchAll estrae i gruppi", () => {
  assert.deepEqual(
    plain(run(snippet("Regular Expressions", "const pattern = /a/g")).output),
    [
      [true, 1],
      [false, 0],
    ],
  );
  assert.deepEqual(
    plain(
      run(
        snippet("Regular Expressions", "const ids = [...text.matchAll"),
        "ids",
      ).value,
    ),
    ["12", "34"],
  );
});

test("Regex: categorie Unicode ammettono forme composte e decomposte", () => {
  assert.deepEqual(
    plain(run(snippet("Regular Expressions", "const letters =")).output),
    [[true], [true]],
  );
});

test("Regex: escape tratta letteralmente metacaratteri dell'input", () => {
  assert.deepEqual(
    plain(
      run(snippet("Regular Expressions", 'const searchTerm = "a+b.js"')).output,
    ),
    [[true], [false]],
  );
});

test("Regex: codice prodotto richiede tipo, ancore e formato completo", () => {
  const { value: valid } = run(
    snippet("Regular Expressions", "function isProductCode"),
    "isProductCode",
  );
  assert.equal(valid("AB-0123"), true);
  for (const input of [
    null,
    123,
    "ab-0123",
    "AB-123",
    "AB-01234",
    "xAB-0123",
    "AB-0123\n",
    { toString: () => "AB-0123" },
  ]) {
    assert.equal(valid(input), false);
  }
});
