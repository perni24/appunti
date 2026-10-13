import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
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
const namedError = (name) => (error) => error.name === name;
const plain = (value) => structuredClone(value);

// Fixtures use real ESM files extracted from the notes, with an isolated package per test.
async function modules(t, files) {
  const root = await realpath(tmpdir());
  const directory = await mkdtemp(join(root, "appunti-js-moderno-"));
  t.after(async () => {
    const target = await realpath(directory);
    assert.equal(dirname(target), root);
    assert.ok(basename(target).startsWith("appunti-js-moderno-"));
    await rm(target, { recursive: true, force: true });
  });
  for (const [name, body] of Object.entries({
    "package.json": JSON.stringify({ type: "module" }),
    ...files,
  })) {
    const target = resolve(directory, name);
    assert.ok(target.startsWith(directory + sep));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body, "utf8");
  }
  return (name) => import(pathToFileURL(join(directory, name)).href);
}

test("Arrow: callback completa e ritorno implicito di oggetto", () => {
  assert.deepEqual(
    plain(
      run(snippet("Arrow Functions", "const activeNames"), "activeNames").value,
    ),
    ["Ada"],
  );
  assert.deepEqual(
    plain(
      run(snippet("Arrow Functions", "const createUser"), 'createUser("Ada")')
        .value,
    ),
    { name: "Ada", active: true },
  );
});

test("Arrow: call non cambia this lessicale", () => {
  const { value } = run(
    snippet("Arrow Functions", "const owner"),
    'readName.call({ name: "Altro" })',
  );
  assert.equal(value, "Ada");
});

test("Arrow: arguments esterno e rest proprio sono distinti", () => {
  assert.equal(
    run(
      snippet("Arrow Functions", "function firstArgument"),
      'firstArgument("esterno")',
    ).value,
    "esterno",
  );
  assert.equal(
    run(snippet("Arrow Functions", "const sumAll"), "sumAll(1, 2, 3)").value,
    6,
  );
});

test("Arrow: Timer evita duplicati e rilascia la risorsa", () => {
  const callbacks = new Map();
  let nextId = 0;
  const { value: timer } = run(
    snippet("Arrow Functions", "class Timer"),
    "new Timer()",
    {
      setInterval(callback, delay) {
        assert.equal(delay, 1000);
        callbacks.set(++nextId, callback);
        return nextId;
      },
      clearInterval(id) {
        callbacks.delete(id);
      },
    },
  );
  timer.stop();
  timer.start();
  timer.start();
  assert.equal(callbacks.size, 1);
  callbacks.values().next().value();
  assert.equal(timer.seconds, 1);
  timer.stop();
  timer.stop();
  assert.equal(callbacks.size, 0);
  assert.equal(timer.intervalId, null);
  timer.start();
  assert.equal(callbacks.size, 1);
  timer.stop();
});

test("Arrow: il metodo errato fallisce al top-level ESM", async (t) => {
  const load = await modules(t, {
    "bad.js": snippet("Arrow Functions", "user.greet();"),
  });
  await assert.rejects(load("bad.js"), TypeError);
});

test("Template: tag conserva i tipi e restituisce un oggetto", () => {
  const { value } = run(
    snippet("Template Literals", "function tag("),
    "result",
  );
  assert.deepEqual(plain(value), { parts: ["Totale: ", " EUR"], values: [3] });
});

test("Template: backtick, interpolazione letterale e String.raw", () => {
  const { value } = run(
    snippet("Template Literals", "const escaped"),
    "[escaped, rawPath]",
  );
  assert.deepEqual(plain(value), [
    "Backtick: `; segnaposto: ${name}",
    "C:\\notes\\new",
  ]);
});

test("Template: formattazione con dati completi", () => {
  const { value } = run(
    snippet("Template Literals", "function formatUserLabel"),
    'formatUserLabel({name:"Ada",active:false})',
  );
  assert.equal(value, "Ada (non attivo)");
});

test("Default: soltanto undefined attiva il fallback", () => {
  const { output } = run(snippet("Default Parameters", "function show("));
  assert.deepEqual(plain(output), [["default"], ["default"], [null], [""]]);
});

test("Default: UUID valutato soltanto se serve", () => {
  let calls = 0;
  const { value } = run(
    snippet("Default Parameters", "function createUser("),
    '[createUser("fixed"), createUser(), createUser(null)]',
    {
      crypto: {
        randomUUID() {
          calls += 1;
          return "generated";
        },
      },
    },
  );
  assert.equal(calls, 1);
  assert.deepEqual(plain(value), [
    { id: "fixed" },
    { id: "generated" },
    { id: null },
  ]);
});

test("Default: array nuovo per chiamata, array fornito modificato", () => {
  const { value: addItem } = run(
    snippet("Default Parameters", "function addItem("),
    "addItem",
  );
  assert.deepEqual(plain(addItem("X")), ["X"]);
  assert.deepEqual(plain(addItem("Y")), ["Y"]);
  const existing = [];
  assert.equal(addItem("Z", existing), existing);
  assert.deepEqual(existing, ["Z"]);
});

test("Default: parametri successivi e scope del corpo generano ReferenceError", () => {
  assert.throws(
    () => run(snippet("Default Parameters", "function example(")),
    namedError("ReferenceError"),
  );
  assert.throws(
    () =>
      run(
        snippet("Default Parameters", "function invalidDefault("),
        "invalidDefault()",
      ),
    namedError("ReferenceError"),
  );
  assert.equal(
    run(
      snippet("Default Parameters", "function invalidDefault("),
      "invalidDefault(4)",
    ).value,
    4,
  );
});

test("Default: oggetto opzioni assente, valori falsy e null", () => {
  const { value: create } = run(
    snippet("Default Parameters", "function createServiceUrl("),
    "createServiceUrl",
  );
  assert.equal(create(), "http://localhost:8080");
  assert.equal(
    create({ host: "example.test", secure: true, port: 443 }),
    "https://example.test:443",
  );
  assert.equal(create({ secure: false, port: 0 }), "http://localhost:0");
  assert.throws(() => create(null), namedError("TypeError"));
});

test("Default: configurazione richiesta, header distinti e timeout valido", () => {
  const { value: create } = run(
    snippet("Default Parameters", "function createRequest("),
    "createRequest",
  );
  assert.deepEqual(plain(create("/api")), {
    url: "/api",
    method: "GET",
    headers: {},
    timeoutMs: 5000,
  });
  assert.notEqual(create("/api").headers, create("/api").headers);
  assert.equal(create("/api", { timeoutMs: 0 }).timeoutMs, 0);
  for (const timeoutMs of [-1, NaN, Infinity, "5000", null]) {
    assert.throws(
      () => create("/api", { timeoutMs }),
      namedError("RangeError"),
    );
  }
});

test("Destructuring: Set iterabile e riassegnazione parentetica", () => {
  assert.deepEqual(
    plain(
      run(
        snippet("Destructuring", "const [firstColor"),
        "[firstColor, secondColor]",
      ).value,
    ),
    ["red", "green"],
  );
  assert.equal(run(snippet("Destructuring", "let name;"), "name").value, "Ada");
});

test("Destructuring: utente assente, ruolo default e struttura invalida", () => {
  const { value: render } = run(
    snippet("Destructuring", "function renderUserCard("),
    "renderUserCard",
  );
  for (const response of [
    undefined,
    null,
    {},
    { data: null },
    { data: { user: null } },
  ]) {
    assert.equal(render(response), "Utente non disponibile");
  }
  assert.equal(render({ data: { user: { name: "Ada" } } }), "Ada - reader");
  assert.equal(render({ data: { user: { name: "Ada", role: "" } } }), "Ada - ");
  for (const user of [1, [], {}, { name: 7 }, { name: "Ada", role: null }]) {
    assert.throws(() => render({ data: { user } }), namedError("TypeError"));
  }
});

test("Spread: merge con undefined e spread oggetto senza iteratore", () => {
  const merged = run(snippet("Spread & Rest Operators", "const defaults"));
  assert.deepEqual(plain(merged.output), [[{ limit: undefined }]]);
  const { value } = run(
    snippet("Spread & Rest Operators", "const plain"),
    "[copy, empty]",
  );
  assert.deepEqual(plain(value), [{ count: 2 }, {}]);
});

test("Spread: copia superficiale conserva riferimenti annidati", () => {
  const { value } = run(
    snippet("Spread & Rest Operators", "const original"),
    "[copy !== original, copy.user === original.user, original.user.name]",
  );
  assert.deepEqual(plain(value), [true, true, "Marco"]);
});

test("Rest: rimuovere passwordHash non rimuove altri segreti", () => {
  const { value: omit } = run(
    snippet("Spread & Rest Operators", "function omitPasswordHash("),
    "omitPasswordHash",
  );
  const source = { id: 1, passwordHash: "hash", apiKey: "still-secret" };
  assert.deepEqual(plain(omit(source)), { id: 1, apiKey: "still-secret" });
  assert.equal(source.passwordHash, "hash");
});

test("Spread: risposta pubblica usa campi ammessi e non muta l'utente", () => {
  const { value: toPublic } = run(
    snippet("Spread & Rest Operators", "function toPublicUser("),
    "toPublicUser",
  );
  const user = {
    id: 1,
    name: "Ada",
    passwordHash: "hash",
    apiKey: "secret",
    profile: { token: "secret" },
  };
  assert.deepEqual(plain(toPublic(user)), { id: 1, name: "Ada" });
  assert.equal(user.apiKey, "secret");
});

test("Moduli: cache, binding vivo e snapshot via destructuring", async (t) => {
  const load = await modules(t, {
    "counter.js": snippet("Moduli", "// counter.js"),
    "consumer.js":
      snippet("Moduli", "// counter-consumer.js") + "\nexport { count };",
  });
  const counter = await load("counter.js");
  const { count: snapshot } = counter;
  const consumer = await load("consumer.js");
  assert.equal(counter, await load("counter.js"));
  assert.equal(snapshot, 0);
  assert.equal(consumer.count, 1);
  counter.increment();
  assert.equal(consumer.count, 2);
  assert.throws(() => {
    counter.count = 10;
  }, TypeError);
});

test("Moduli: re-export nominati e default su file reali", async (t) => {
  const load = await modules(t, {
    "math.js": snippet("Moduli", "// math.js"),
    "logger.js": snippet("Moduli", "// logger.js"),
    "index.js": snippet("Moduli", "// index.js"),
  });
  const api = await load("index.js");
  assert.equal(api.sum(2, 3), 5);
  assert.equal(typeof api.log, "function");
  assert.equal(api.log, (await load("logger.js")).default);
});

test("Moduli: esempio email importa la dipendenza e rifiuta valori non stringa", async (t) => {
  const load = await modules(t, {
    "validators.js": snippet("Moduli", "// validators.js"),
    "signup.js": snippet("Moduli", "// signup.js"),
    "check-signup.js": snippet("Moduli", "// check-signup.js"),
  });
  const { hasSignupEmail } = await load("signup.js");
  assert.equal(hasSignupEmail({ email: "ada@example.test" }), true);
  for (const email of [
    null,
    undefined,
    12,
    "@",
    "a b@example.test",
    { toString: () => "ada@example.test" },
  ]) {
    assert.equal(hasSignupEmail({ email }), false);
  }
  assert.equal(hasSignupEmail(null), false);
  await load("check-signup.js");
});

test("Dynamic import: mappa chiusa, chiavi ereditate rifiutate e import reale", async (t) => {
  const load = await modules(t, {
    "loader.js":
      snippet("Dynamic Import", "const featureLoaders", "javascript") +
      "\nexport { loadFeatureByName };",
    "features/chart.js": snippet("Moduli", "// counter.js"),
  });
  const { loadFeatureByName } = await load("loader.js");
  for (const name of [
    "toString",
    "constructor",
    "__proto__",
    "unknown",
    undefined,
  ]) {
    await assert.rejects(loadFeatureByName(name), RangeError);
  }
  assert.equal((await loadFeatureByName("chart")).count, 0);
  await assert.rejects(loadFeatureByName("editor"), {
    code: "ERR_MODULE_NOT_FOUND",
  });
});

test("Dynamic import: report completo, input invalidi, buchi e overflow", async (t) => {
  const load = await modules(t, {
    "report.js": snippet("Dynamic Import", "// report.js"),
  });
  const { formatReport } = await load("report.js");
  assert.equal(formatReport([4, 8, 2]), "3 valori, totale 14");
  assert.equal(formatReport([]), "0 valori, totale 0");
  for (const values of [
    null,
    "123",
    [1, "2"],
    [NaN],
    [Infinity],
    new Array(2),
  ]) {
    assert.throws(() => formatReport(values), TypeError);
  }
  assert.throws(
    () => formatReport([Number.MAX_VALUE, Number.MAX_VALUE]),
    RangeError,
  );
});

test("Dynamic import: catch intercetta il rifiuto della funzione esportata", async (t) => {
  const load = await modules(t, {
    "loader.js":
      snippet("Dynamic Import", "async function loadFeature()", "javascript") +
      "\nexport { loadFeature };",
    "feature.js":
      'export async function run() { throw new Error("fixture failure"); }',
  });
  const { loadFeature } = await load("loader.js");
  const logged = t.mock.method(console, "error", () => {});
  await loadFeature();
  assert.equal(logged.mock.callCount(), 1);
  assert.equal(logged.mock.calls[0].arguments[1].message, "fixture failure");
});
