import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
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

const hasName = (name) => (error) => error?.name === name;

test("Variabili: conta gli utenti attivi con dati locali", () => {
  const { value, output } = run(
    snippet("Variabili", "let activeCount"),
    "activeCount",
  );
  assert.equal(value, 2);
  assert.deepEqual(output, [[2]]);
});

test("Variabili: const permette mutazione, non riassegnazione", () => {
  const source = snippet("Variabili", 'user.name = "Marco"; // Valido');
  assert.equal(run(source, "user.name").value, "Marco");
  assert.throws(() => run(source, "user = {}"), hasName("TypeError"));
});

test("Variabili: var e let hanno inizializzazione diversa", () => {
  assert.deepEqual(
    run(snippet("Variabili", "console.log(count); // undefined")).output,
    [[undefined]],
  );
  const tdz = snippet("Variabili", "// console.log(count); // ReferenceError");
  assert.throws(
    () => run(tdz.replace("// console.log(count);", "console.log(count);")),
    hasName("ReferenceError"),
  );
});

test("Tipi: BigInt consente confronti misti ma non addizione mista", () => {
  const source = snippet("Tipi di Dati", "console.log(2n > 1)");
  assert.deepEqual(run(source).output, [[true], [false], [true], [2n]]);
  const invalid = snippet("Tipi di Dati", "// 1n + 1;").replace(
    "// 1n + 1;",
    "1n + 1;",
  );
  assert.throws(() => run(invalid), hasName("TypeError"));
});

test("Tipi: confronto degli oggetti per identita", () => {
  assert.deepEqual(
    run(snippet("Tipi di Dati", "console.log({} === {})")).output,
    [[false], [true]],
  );
});

test("Tipi: parseAge accetta solo il formato dichiarato", () => {
  const { value: parseAge } = run(
    snippet("Tipi di Dati", "function parseAge("),
    "parseAge",
  );
  for (const [input, expected] of [
    [0, 0],
    [30, 30],
    [" 30 ", 30],
    ["00", 0],
    [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
  ]) {
    assert.equal(parseAge(input), expected);
  }
});

test("Tipi: parseAge non trasforma input vuoti o booleani in eta zero", () => {
  const { value: parseAge } = run(
    snippet("Tipi di Dati", "function parseAge("),
    "parseAge",
  );
  for (const input of [
    "",
    " \t",
    null,
    undefined,
    false,
    true,
    [],
    {},
    1n,
    "0x20",
    "1e2",
    "2.5",
    "-1",
  ]) {
    assert.throws(() => parseAge(input), hasName("TypeError"));
  }
  for (const input of [
    -1,
    2.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "9007199254740993",
  ]) {
    assert.throws(() => parseAge(input), hasName("RangeError"));
  }
});

test("Operatori: paginazione zero-based e default nullish", () => {
  const { value: createPagination } = run(
    snippet("Operatori", "function createPagination("),
    "createPagination",
  );
  assert.deepEqual(structuredClone(createPagination()), {
    page: 0,
    pageSize: 20,
  });
  assert.deepEqual(
    structuredClone(createPagination({ page: 0, pageSize: 1 })),
    { page: 0, pageSize: 1 },
  );
  assert.deepEqual(
    structuredClone(createPagination({ page: null, pageSize: null })),
    { page: 0, pageSize: 20 },
  );
});

test("Operatori: paginazione rifiuta numeri invalidi e stringhe numeriche", () => {
  const { value: createPagination } = run(
    snippet("Operatori", "function createPagination("),
    "createPagination",
  );
  for (const input of [
    { page: -1 },
    { page: "0" },
    { page: NaN },
    { page: 1.5 },
    { page: 2 ** 53 },
    { pageSize: 0 },
    { pageSize: -1 },
    { pageSize: Infinity },
  ]) {
    assert.throws(() => createPagination(input), hasName("RangeError"));
  }
  assert.throws(() => createPagination(null), hasName("TypeError"));
});

test("Operatori: short-circuit conserva zero ed evita effetti collaterali", () => {
  assert.deepEqual(run(snippet("Operatori", "const keepZero")).output, [
    [0, 1, 1],
    ["fallback"],
  ]);
});

test("Operatori: optional chaining non protegge accessi non opzionali", () => {
  const source = snippet("Operatori", "const customer =");
  assert.deepEqual(run(source).output, [[undefined]]);
  assert.throws(
    () => run(source, "(customer?.profile).name"),
    hasName("TypeError"),
  );
  assert.throws(() => run(source, "customer.notify?.()"), hasName("TypeError"));
  assert.throws(
    () => run(source, "missingCustomer?.name"),
    hasName("ReferenceError"),
  );
});

test("Operatori: precedenza e valore restituito da incremento", () => {
  assert.deepEqual(run(snippet("Operatori", "const before = count++")).output, [
    [14],
    [20],
    [1, 3, 3],
  ]);
});

test("Condizioni: guard clause e active booleano", () => {
  const { value: getDiscount } = run(
    snippet("Strutture Condizionali", "function getDiscount("),
    "getDiscount",
  );
  for (const [user, expected] of [
    [null, 0],
    [{ active: false }, 0],
    [{ active: "false" }, 0],
    [{ active: true, role: "premium" }, 0.2],
    [{ active: true, role: "basic" }, 0.05],
  ]) {
    assert.equal(getDiscount(user), expected);
  }
});

test("Condizioni: blocchi dei case permettono const omonime", () => {
  assert.deepEqual(
    run(snippet("Strutture Condizionali", 'const action = "save"')).output,
    [["Salvato"]],
  );
});

test("Cicli: for...in filtra le proprieta ereditate", () => {
  const source = snippet("Cicli", "Object.hasOwn(user, key)");
  const { output } = run(`Object.prototype.inherited = true;\n${source}`);
  assert.deepEqual(output, [
    ["name", "Luca"],
    ["role", "admin"],
  ]);
});

test("Cicli: Object.entries visita solo proprieta proprie", () => {
  assert.deepEqual(run(snippet("Cicli", "Object.entries(user)")).output, [
    ["name", "Ada"],
  ]);
});

test("Cicli: saveAll attende ogni salvataggio prima del successivo", async () => {
  const { value: saveAll } = run(
    snippet("Cicli", "async function saveAll("),
    "saveAll",
  );
  const events = [];
  await saveAll(["a", "b"], async (item) => {
    events.push(`start:${item}`);
    await Promise.resolve();
    events.push(`end:${item}`);
  });
  assert.deepEqual(events, ["start:a", "end:a", "start:b", "end:b"]);
});

test("Cicli: saveAll propaga l'errore e non avvia gli elementi successivi", async () => {
  const { value: saveAll } = run(
    snippet("Cicli", "async function saveAll("),
    "saveAll",
  );
  const events = [];
  const failure = new Error("save failed");
  await assert.rejects(
    saveAll(["a", "b", "c"], async (item) => {
      events.push(item);
      if (item === "b") throw failure;
    }),
    (error) => error === failure,
  );
  assert.deepEqual(events, ["a", "b"]);
});

test("Funzioni: default applicato a undefined, non null", () => {
  const { value: greet } = run(
    snippet("Funzioni", 'function greet(name = "Guest")'),
    "greet",
  );
  assert.equal(greet(), "Ciao Guest");
  assert.equal(greet(undefined), "Ciao Guest");
  assert.equal(greet(null), "Ciao null");
  assert.equal(greet(""), "Ciao ");
});

test("Funzioni: mutare un oggetto non equivale a riassegnare il parametro", () => {
  assert.deepEqual(run(snippet("Funzioni", "function updateProfile(")).output, [
    ["Grace"],
    ["Linus"],
  ]);
});

test("Funzioni: return su una riga separata perde il risultato", () => {
  assert.deepEqual(run(snippet("Funzioni", "function brokenResult(")).output, [
    [undefined],
  ]);
});

test("Funzioni: prezzo e sconto hanno controlli di tipo e intervallo", () => {
  const { value: calculate } = run(
    snippet("Funzioni", "function calculateFinalPrice("),
    "calculateFinalPrice",
  );
  assert.equal(calculate(100, 0.2), 80);
  assert.equal(calculate(100), 100);
  assert.equal(calculate(100, 1), 0);
  assert.equal(calculate(0, 0.5), 0);
  for (const [price, rate] of [
    ["100", 0],
    [NaN, 0],
    [Infinity, 0],
    [100, null],
    [100, "0.2"],
    [100, NaN],
  ]) {
    assert.throws(() => calculate(price, rate), hasName("TypeError"));
  }
  for (const [price, rate] of [
    [-1, 0],
    [100, -0.1],
    [100, 20],
  ]) {
    assert.throws(() => calculate(price, rate), hasName("RangeError"));
  }
});

test("Strict: this dipende dalla chiamata e conserva null", () => {
  assert.deepEqual(run(snippet("Strict Mode", "function showThis(")).output, [
    [undefined],
    [null],
    [true],
  ]);
});

test("Strict: direttiva interna e parametri default sono incompatibili", () => {
  assert.throws(
    () => run(snippet("Strict Mode", "function invalidGreeting(")),
    hasName("SyntaxError"),
  );
  assert.equal(
    run(snippet("Strict Mode", 'function greet(name = "Guest")'), "greet()")
      .value,
    "Guest",
  );
});

test("Strict: assegnazioni a globali implicite e proprieta readonly falliscono", () => {
  assert.throws(
    () => run(snippet("Strict Mode", "function updateUser(")),
    hasName("ReferenceError"),
  );
  assert.throws(
    () => run(snippet("Strict Mode", 'Object.defineProperty(user, "id"')),
    hasName("TypeError"),
  );
});

test("Errori: return in finally nasconde l'errore originale", () => {
  assert.equal(
    run(snippet("Error Handling", "function maskedError("), "maskedError()")
      .value,
    "OK",
  );
});

test("Errori: readSettings conserva la causa, ma non valida lo schema", () => {
  const { value: readSettings } = run(
    snippet("Error Handling", "function readSettings("),
    "readSettings",
  );
  assert.deepEqual(structuredClone(readSettings('{"active":true}')), {
    active: true,
  });
  assert.equal(readSettings("null"), null);
  assert.throws(
    () => readSettings("{"),
    (error) => error.name === "Error" && error.cause?.name === "SyntaxError",
  );
});

test("Errori: return await permette di aggiungere contesto al rifiuto", async () => {
  const { value: runOperation } = run(
    snippet("Error Handling", "async function runOperation("),
    "runOperation",
  );
  const failure = new Error("offline");
  await assert.rejects(
    runOperation(async () => {
      throw failure;
    }),
    (error) => error.cause === failure,
  );
  assert.equal(await runOperation(async () => 42), 42);
});

const userSource = () => snippet("Error Handling", "async function loadUser(");

test("Errori HTTP: loadUser codifica l'id e inoltra signal", async () => {
  const controller = new AbortController();
  const { value: loadUser } = run(userSource(), "loadUser", {
    fetch: async (url, options) => {
      assert.equal(url, "/api/users/a%2Fb");
      assert.equal(options.signal, controller.signal);
      return { status: 200, ok: true, json: async () => ({ name: "Ada" }) };
    },
  });
  assert.deepEqual(await loadUser("a/b", { signal: controller.signal }), {
    name: "Ada",
  });
});

test("Errori HTTP: id invalido non effettua richieste", async () => {
  let requests = 0;
  const { value: loadUser } = run(userSource(), "loadUser", {
    fetch: async () => {
      requests += 1;
    },
  });
  for (const id of [undefined, null, 42, "", " \t"]) {
    await assert.rejects(loadUser(id), hasName("TypeError"));
  }
  assert.equal(requests, 0);
});

test("Errori HTTP: 404 restituisce null, 500 rigetta senza leggere JSON", async () => {
  for (const status of [404, 500]) {
    const { value: loadUser } = run(userSource(), "loadUser", {
      fetch: async () => ({
        status,
        ok: false,
        json: () => assert.fail("JSON should not be read"),
      }),
    });
    if (status === 404) assert.equal(await loadUser("42"), null);
    else await assert.rejects(loadUser("42"), { message: "HTTP 500" });
  }
});

test("Errori HTTP: rete, annullamento e JSON invalido restano rifiuti", async () => {
  const errors = [
    new TypeError("network failed"),
    new DOMException("aborted", "AbortError"),
    new SyntaxError("invalid JSON"),
  ];
  for (const failure of errors) {
    const { value: loadUser } = run(userSource(), "loadUser", {
      fetch: async () => {
        if (!(failure instanceof SyntaxError)) throw failure;
        return {
          status: 200,
          ok: true,
          json: async () => {
            throw failure;
          },
        };
      },
    });
    await assert.rejects(loadUser("42"), (error) => error === failure);
  }
});
