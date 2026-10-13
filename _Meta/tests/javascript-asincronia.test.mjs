import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { snippet } from "./note-examples.mjs";

function run(source, expression = "undefined", globals = {}) {
  const output = [];
  const context = vm.createContext({
    console: {
      log: (...args) => output.push(args),
      error: (...args) => output.push(args),
    },
    queueMicrotask,
    ...globals,
  });
  const value = vm.runInContext(`${source}\n;(${expression})`, context, {
    timeout: 1000,
  });
  return { value, output, context };
}
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;
const flush = () => new Promise((resolve) => setImmediate(resolve));

// These timers model scheduling boundaries, not elapsed time or browser rendering.
function timers() {
  const pending = [];
  return {
    pending,
    setTimeout(callback, delay) {
      pending.push({ callback, delay });
      return pending.length;
    },
    async next() {
      assert.ok(pending.length > 0, "expected a scheduled timer");
      pending.shift().callback();
      await flush();
    },
    async drain() {
      let count = 0;
      while (pending.length) {
        assert.ok(++count < 100, "timer fixture must terminate");
        await this.next();
      }
    },
  };
}

async function functionWithTimers(note, marker, name) {
  const clock = timers();
  const state = run(snippet(note, marker), name, {
    setTimeout: clock.setTimeout,
  });
  await clock.drain();
  state.output.length = 0;
  return { ...state, clock };
}

// Native ESM and fs preserve the real callback/error contract of readFile.
async function executeFiles(t, files, entry = "main.mjs") {
  const root = await realpath(tmpdir());
  const directory = await mkdtemp(join(root, "appunti-js-async-"));
  t.after(async () => {
    const target = await realpath(directory);
    assert.equal(dirname(target), root);
    assert.ok(basename(target).startsWith("appunti-js-async-"));
    await rm(target, { recursive: true, force: true });
  });
  for (const [name, source] of Object.entries(files)) {
    const target = resolve(directory, name);
    assert.ok(target.startsWith(directory + sep));
    await writeFile(target, source, "utf8");
  }
  const entryPath = resolve(directory, entry);
  assert.ok(entryPath.startsWith(directory + sep));
  const result = spawnSync(process.execPath, [entryPath], {
    cwd: directory,
    encoding: "utf8",
    timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

test("Event Loop: microtask dopo il codice sincrono", async () => {
  const state = run(snippet("Event Loop", 'console.log("microtask");'));
  assert.deepEqual(state.output, [["sync"]]);
  await flush();
  assert.deepEqual(state.output, [["sync"], ["microtask"]]);
});

test("Event Loop: microtask annidate seguono l'ordine di accodamento", async () => {
  const clock = timers();
  const state = run(
    snippet("Event Loop", 'console.log("micro 1")'),
    "undefined",
    { setTimeout: clock.setTimeout },
  );
  assert.deepEqual(state.output, [["sync"]]);
  await flush();
  assert.deepEqual(state.output, [
    ["sync"],
    ["micro 1"],
    ["micro 2"],
    ["micro 3"],
  ]);
  await clock.next();
  assert.equal(state.output.at(-1)[0], "timer");
});

test("Event Loop: esempio A D C B senza attesa cronometrica", async () => {
  const clock = timers();
  const state = run(snippet("Event Loop", 'console.log("A")'), "undefined", {
    setTimeout: clock.setTimeout,
  });
  await flush();
  assert.deepEqual(state.output, [["A"], ["D"], ["C"]]);
  await clock.next();
  assert.deepEqual(state.output, [["A"], ["D"], ["C"], ["B"]]);
});

test("Event Loop: somma a blocchi differita e suddivisa in piu task", async () => {
  const { value: sum, clock } = await functionWithTimers(
    "Event Loop",
    "function sumInChunks",
    "sumInChunks",
  );
  const input = [1, 2, 3, 4, 5];
  let settled = false;
  const result = sum(input, 2).then((value) => {
    settled = true;
    return value;
  });
  assert.equal(settled, false);
  assert.equal(clock.pending.length, 1);
  await clock.next();
  assert.equal(settled, false);
  await clock.next();
  assert.equal(settled, false);
  await clock.next();
  assert.equal(await result, 15);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.equal(clock.pending.length, 0);
});

test("Event Loop: array vuoto produce zero attraverso un timer", async () => {
  const { value: sum, clock } = await functionWithTimers(
    "Event Loop",
    "function sumInChunks",
    "sumInChunks",
  );
  const result = sum([], 1);
  assert.equal(clock.pending.length, 1);
  await clock.next();
  assert.equal(await result, 0);
});

test("Event Loop: input e chunkSize invalidi rifiutano senza timer", async () => {
  const { value: sum, clock } = await functionWithTimers(
    "Event Loop",
    "function sumInChunks",
    "sumInChunks",
  );
  await assert.rejects(sum(null), namedError("TypeError"));
  for (const size of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    "2",
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    await assert.rejects(sum([1], size), namedError("RangeError"));
  }
  assert.equal(clock.pending.length, 0);
});

test("Event Loop: array sparsi e valori non finiti falliscono nel task", async () => {
  const { value: sum, clock } = await functionWithTimers(
    "Event Loop",
    "function sumInChunks",
    "sumInChunks",
  );
  for (const input of [[1, , 3], [1, NaN], [Infinity], ["1"]]) {
    const rejected = assert.rejects(sum(input, 1), namedError("TypeError"));
    await clock.drain();
    await rejected;
  }
});

test("Event Loop: overflow viene inoltrato alla Promise", async () => {
  const { value: sum, clock } = await functionWithTimers(
    "Event Loop",
    "function sumInChunks",
    "sumInChunks",
  );
  const rejected = assert.rejects(
    sum([Number.MAX_VALUE, Number.MAX_VALUE], 1),
    namedError("RangeError"),
  );
  await clock.drain();
  await rejected;
});

test("Callback: forEach sincrono e map usa il risultato", () => {
  assert.deepEqual(run(snippet("Callback", "const numbers =")).output, [
    [2],
    [4],
    [6],
    ["fine"],
  ]);
  assert.deepEqual(plain(run(snippet("Callback", "const doubled =")).output), [
    [[4, 8, 12]],
  ]);
});

test("Callback: return differito non e il risultato della registrazione", async () => {
  const clock = timers();
  const state = run(
    snippet("Callback", "function getValueLater"),
    "immediate",
    { setTimeout: clock.setTimeout },
  );
  assert.equal(state.value, undefined);
  assert.deepEqual(state.output, [[undefined]]);
  await clock.next();
  assert.deepEqual(state.output, [[undefined], [42]]);
});

test("Callback: runTwice e runLater rispettano conteggio e differimento", async () => {
  const twice = run(snippet("Callback", "function runTwice"), "runTwice").value;
  let calls = 0;
  twice(() => {
    calls += 1;
  });
  assert.equal(calls, 2);
  const clock = timers();
  const state = run(snippet("Callback", "function runLater"), "undefined", {
    setTimeout: clock.setTimeout,
  });
  assert.deepEqual(state.output, []);
  await clock.next();
  assert.deepEqual(state.output, [["finito"]]);
});

test("Callback: findFirst si ferma al primo risultato e non copia", () => {
  const { value: find, output } = run(
    snippet("Callback", "function findFirst"),
    "findFirst",
  );
  assert.deepEqual(output, [[2]]);
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const seen = [];
  const match = find(items, (item) => {
    seen.push(item.id);
    return item.id === 2;
  });
  assert.equal(match, items[1]);
  assert.deepEqual(seen, [1, 2]);
  assert.equal(
    find([], () => true),
    undefined,
  );
  assert.equal(
    find(items, () => false),
    undefined,
  );
});

test("Callback: contratto booleano sincrono ed errori propagati", () => {
  const find = run(
    snippet("Callback", "function findFirst"),
    "findFirst",
  ).value;
  assert.throws(() => find(null, () => true), namedError("TypeError"));
  assert.throws(() => find([], null), namedError("TypeError"));
  assert.throws(() => find([1], () => 1), namedError("TypeError"));
  assert.throws(() => find([1], async () => false), namedError("TypeError"));
  const error = new Error("predicate failed");
  assert.throws(
    () =>
      find([1], () => {
        throw error;
      }),
    (actual) => actual === error,
  );
});

const readConfig = () => snippet("Callback", "import { readFile }");

test("Callback: lettura ESM reale, UTF-8 e uso error-first", async (t) => {
  const output = await executeFiles(t, {
    "config.json": '{"enabled":true,"label":"caf\u00e9"}',
    "main.mjs":
      readConfig() +
      '\nreadConfig("config.json", (error, config) => { if (error) throw error; console.log(JSON.stringify(config)); });',
  });
  assert.deepEqual(JSON.parse(output), { enabled: true, label: "caf\u00e9" });
});

test("Callback: I/O e JSON malformato arrivano una volta nel canale errore", async (t) => {
  const output = await executeFiles(t, {
    "invalid.json": "{",
    "main.mjs":
      readConfig() +
      `
      const results = await Promise.all(["missing.json", "invalid.json"].map((path) =>
        new Promise((resolve) => {
          let calls = 0;
          readConfig(path, (error, value) => {
            calls += 1;
            setImmediate(() => resolve([error.code || error.name, value === undefined, calls]));
          });
        })));
      console.log(JSON.stringify(results));`,
  });
  assert.deepEqual(JSON.parse(output), [
    ["ENOENT", true, 1],
    ["SyntaxError", true, 1],
  ]);
});

test("Callback: argomenti invalidi possono lanciare sincronicamente", async (t) => {
  const output = await executeFiles(t, {
    "main.mjs":
      readConfig() +
      `
      const errors = [];
      for (const args of [[null, () => {}], ["", () => {}], ["config.json", null]]) {
        try { readConfig(...args); } catch (error) { errors.push(error.name); }
      }
      console.log(JSON.stringify(errors));`,
  });
  assert.deepEqual(JSON.parse(output), ["TypeError", "TypeError", "TypeError"]);
});

test("Callback: throw del consumatore non causa un secondo callback", async (t) => {
  const output = await executeFiles(t, {
    "config.json": "{}",
    "main.mjs":
      readConfig() +
      `
      let calls = 0;
      process.once("uncaughtException", (error) => console.log(JSON.stringify([calls, error.message])));
      readConfig("config.json", () => { calls += 1; throw new Error("consumer failed"); });`,
  });
  assert.deepEqual(JSON.parse(output), [1, "consumer failed"]);
});

test("Promise: l'esecutore e sincrono e resolve non e return", async () => {
  const state = run(snippet("Promises", 'console.log("executor")'));
  assert.deepEqual(state.output, [
    ["A"],
    ["executor"],
    ["dopo resolve"],
    ["C"],
  ]);
  await flush();
  assert.deepEqual(state.output.at(-1), ["B"]);
});

test("Promise: risoluzione con altra Promise adotta il rifiuto", async () => {
  const state = run(snippet("Promises", "let rejectInner"), "outer");
  await assert.rejects(state.value, /errore adottato/);
  await flush();
  assert.deepEqual(state.output, [["errore adottato"]]);
});

test("Promise: esempio di creazione produce il valore previsto", async () => {
  const promise = run(
    snippet("Promises", "const success = true"),
    "promise",
  ).value;
  assert.equal(await promise, "ok");
});

test("Promise: then restituisce un valore alla nuova Promise", async () => {
  const state = run(snippet("Promises", "Promise.resolve(2)"));
  await flush();
  assert.deepEqual(state.output, [[4]]);
});

test("Promise: return mantiene il risultato dell'operazione composta", async () => {
  const state = run(snippet("Promises", "function doubleLater"));
  await flush();
  assert.deepEqual(state.output, [[6]]);
});

test("Promise: catch con fallback recupera dal rifiuto", async () => {
  const state = run(snippet("Promises", "cache non disponibile"));
  await flush();
  assert.deepEqual(state.output, [[0]]);
});

test("Promise: handler di errore dello stesso then non cattura il success", async () => {
  const state = run(snippet("Promises", "errore nel successo"));
  await flush();
  assert.deepEqual(state.output, [["errore nel successo"]]);
});

test("Promise: finally ignora il valore ordinario del cleanup", async () => {
  const state = run(snippet("Promises", ".finally(() => 99)"));
  await flush();
  assert.deepEqual(state.output, [[7]]);
});

test("Promise: finally puo sostituire l'esito con un rifiuto", async () => {
  const state = run(snippet("Promises", 'throw new Error("cleanup fallito")'));
  await flush();
  assert.deepEqual(state.output, [["cleanup fallito"]]);
});

test("Promise: wait registra il timer e risolve solo alla callback", async () => {
  const { value: wait, clock } = await functionWithTimers(
    "Promises",
    "function wait",
    "wait",
  );
  for (const delay of [0, 15, 2_147_483_647]) {
    let done = false;
    const result = wait(delay).then(() => {
      done = true;
    });
    await flush();
    assert.equal(done, false);
    assert.equal(clock.pending[0].delay, delay);
    await clock.next();
    await result;
    assert.equal(done, true);
  }
});

test("Promise: wait rifiuta input invalidi senza creare timer", async () => {
  const { value: wait, clock } = await functionWithTimers(
    "Promises",
    "function wait",
    "wait",
  );
  for (const delay of [
    -1,
    0.5,
    Infinity,
    NaN,
    "100",
    null,
    undefined,
    2_147_483_648,
  ]) {
    let result;
    assert.doesNotThrow(() => {
      result = wait(delay);
    });
    await assert.rejects(result, namedError("RangeError"));
  }
  assert.equal(clock.pending.length, 0);
});

function loadUsers(fetch) {
  return run(snippet("Promises", "function loadUsers"), "loadUsers", { fetch })
    .value;
}

test("Promise: loadUsers valida e seleziona i campi senza alias", async () => {
  const original = [{ id: 1, name: "Ada", privateNote: "excluded" }];
  const load = loadUsers(async (url) => {
    assert.equal(url, "/api/users");
    return { ok: true, json: async () => original };
  });
  const result = await load();
  assert.deepEqual(plain(result), [{ id: 1, name: "Ada" }]);
  assert.notEqual(result, original);
  assert.notEqual(result[0], original[0]);
  result[0].name = "Changed";
  assert.equal(original[0].name, "Ada");
});

test("Promise: loadUsers distingue rete, HTTP e parsing", async () => {
  const networkError = new Error("offline");
  await assert.rejects(
    loadUsers(async () => {
      throw networkError;
    })(),
    (error) => error === networkError,
  );
  await assert.rejects(
    loadUsers(async () => ({
      ok: false,
      status: 503,
      json: () => assert.fail("no body parse on HTTP failure"),
    }))(),
    /HTTP 503/,
  );
  const jsonError = new SyntaxError("invalid json");
  await assert.rejects(
    loadUsers(async () => ({
      ok: true,
      json: async () => {
        throw jsonError;
      },
    }))(),
    (error) => error === jsonError,
  );
});

test("Promise: loadUsers rifiuta forma, id e nome invalidi", async () => {
  for (const data of [
    null,
    {},
    [null],
    [[]],
    [{ id: 0, name: "Ada" }],
    [{ id: 1.5, name: "Ada" }],
    [{ id: 1, name: " " }],
    [{ id: 1, name: 4 }],
  ]) {
    await assert.rejects(
      loadUsers(async () => ({ ok: true, json: async () => data }))(),
      namedError("TypeError"),
    );
  }
  assert.deepEqual(
    plain(await loadUsers(async () => ({ ok: true, json: async () => [] }))()),
    [],
  );
});

test("Promise: consumo completo esegue finally e poi catch sugli errori", async () => {
  const state = run(
    snippet("Promises", "function loadUsers") +
      "\n" +
      snippet("Promises", "richiesta terminata"),
    "undefined",
    {
      fetch: async () => ({ ok: false, status: 404 }),
    },
  );
  await flush();
  assert.equal(state.output[0][0], "richiesta terminata");
  assert.equal(state.output[1][0], "Caricamento fallito:");
  assert.equal(state.output[1][1].message, "HTTP 404");
});

test("Promise: adattatore error-first con vero file, errori e throw iniziale", async (t) => {
  const output = await executeFiles(t, {
    "config.json": '{"enabled":true}',
    "invalid.json": "{",
    "main.mjs":
      readConfig() +
      "\n" +
      snippet("Promises", "function readConfigAsync") +
      `
      const results = await Promise.allSettled([
        readConfigAsync("config.json"), readConfigAsync("invalid.json"),
        readConfigAsync("missing.json"), readConfigAsync(null),
      ]);
      console.log(JSON.stringify(results.map((result) => result.status === "fulfilled"
        ? [result.status, result.value]
        : [result.status, result.reason.code || result.reason.name])));`,
  });
  assert.deepEqual(JSON.parse(output), [
    ["fulfilled", { enabled: true }],
    ["rejected", "SyntaxError"],
    ["rejected", "ENOENT"],
    ["rejected", "TypeError"],
  ]);
});
