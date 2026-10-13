import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const advanced = (marker) => snippet("Promise avanzate", marker);
const asyncNote = (marker) => snippet("Async Await", marker);
const plain = (value) => structuredClone(value);
const namedError = (name) => (error) => error.name === name;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function run(source, expression = "undefined", globals = {}, async = false) {
  const output = [];
  const context = vm.createContext({
    AbortController,
    console: {
      log: (...args) => output.push(args),
      error: (...args) => output.push(args),
    },
    ...globals,
  });
  const code = async
    ? `(async () => { ${source}\n; return (${expression}); })()`
    : `${source}\n;(${expression})`;
  const value = vm.runInContext(code, context, { timeout: 1000 });
  return { value, output };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function timers() {
  const pending = new Map();
  let nextId = 0;
  return {
    pending,
    setTimeout(callback, delay) {
      const id = ++nextId;
      pending.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    fire() {
      assert.equal(pending.size, 1);
      const [id, { callback }] = pending.entries().next().value;
      pending.delete(id);
      callback();
    },
  };
}

function pool() {
  return run(advanced("async function runWithLimit"), "runWithLimit").value;
}

test("Combinatori: all conserva l'ordine, non quello dei completamenti", async () => {
  const jobs = [deferred(), deferred(), deferred()];
  let index = 0;
  const state = run(
    advanced("const [user, posts, comments]"),
    "[user, posts, comments]",
    {
      fetchJSON: () => jobs[index++].promise,
    },
    true,
  );
  assert.equal(index, 3);
  jobs[2].resolve("comments");
  jobs[0].resolve("user");
  jobs[1].resolve("posts");
  assert.deepEqual(plain(await state.value), ["user", "posts", "comments"]);
});

test("Combinatori: allSettled conserva successo e fallimento in ordine", async () => {
  const jobs = [deferred(), deferred(), deferred()];
  let index = 0;
  const state = run(
    advanced('fetchJSON("/api/profile")'),
    "({results, successful, failed})",
    {
      fetchJSON: () => jobs[index++].promise,
    },
    true,
  );
  jobs[1].reject("offline");
  jobs[2].resolve("recommendations");
  jobs[0].resolve("profile");
  const result = plain(await state.value);
  assert.deepEqual(result.results, [
    { status: "fulfilled", value: "profile" },
    { status: "rejected", reason: "offline" },
    { status: "fulfilled", value: "recommendations" },
  ]);
  assert.deepEqual(result.successful, ["profile", "recommendations"]);
  assert.deepEqual(result.failed, ["offline"]);
});

test("Combinatori: race puo essere vinta da un errore", async () => {
  const jobs = [deferred(), deferred()];
  let index = 0;
  const state = run(
    advanced('fetchJSON("/api/primary")'),
    "result",
    { fetchJSON: () => jobs[index++].promise },
    true,
  );
  const error = new Error("first failure");
  const rejected = assert.rejects(state.value, (actual) => actual === error);
  jobs[1].reject(error);
  await rejected;
  jobs[0].reject(new Error("late loser"));
  await flush();
});

test("Combinatori: any ignora un rifiuto ma non accetta un HTTP 500", async () => {
  const state = run(
    advanced("async function fetchJSON(") +
      "\n" +
      advanced('fetchJSON("/api/replica-1/data")'),
    "data",
    {
      fetch: async (url) => ({
        ok: !url.includes("replica-1"),
        status: 500,
        json: async () => ({ source: url }),
      }),
    },
    true,
  );
  assert.equal((await state.value).source, "/api/replica-2/data");
});

test("Combinatori: any espone tutte le ragioni di errore in ordine di input", async () => {
  const jobs = [deferred(), deferred(), deferred()];
  let index = 0;
  const state = run(
    advanced('fetchJSON("/api/replica-1/data")'),
    "data",
    { fetchJSON: () => jobs[index++].promise },
    true,
  );
  const rejected = assert.rejects(state.value, (error) => {
    assert.equal(error.name, "AggregateError");
    assert.deepEqual(plain(error.errors), ["first", "second", "third"]);
    return true;
  });
  jobs[2].reject("third");
  jobs[0].reject("first");
  jobs[1].reject("second");
  await rejected;
});

test("Timeout: successo e rimozione del timer, anche con valore ordinario", async () => {
  const clock = timers();
  const withTimeout = run(
    advanced("async function withTimeout"),
    "withTimeout",
    clock,
  ).value;
  assert.equal(await withTimeout(() => 42, 200), 42);
  assert.equal(clock.pending.size, 0);
});

test("Timeout: throw sincrono e rifiuto conservano la causa e fanno cleanup", async () => {
  const clock = timers();
  const withTimeout = run(
    advanced("async function withTimeout"),
    "withTimeout",
    clock,
  ).value;
  const error = new Error("failure");
  await assert.rejects(
    withTimeout(() => {
      throw error;
    }, 200),
    (actual) => actual === error,
  );
  await assert.rejects(
    withTimeout(() => Promise.reject(error), 200),
    (actual) => actual === error,
  );
  assert.equal(clock.pending.size, 0);
});

test("Timeout: input invalido non avvia il lavoro o un timer", async () => {
  const clock = timers();
  const withTimeout = run(
    advanced("async function withTimeout"),
    "withTimeout",
    clock,
  ).value;
  let calls = 0;
  for (const ms of [-1, NaN, Infinity, "5", 0.5, 2_147_483_648]) {
    await assert.rejects(
      withTimeout(() => calls++, ms),
      namedError("RangeError"),
    );
  }
  await assert.rejects(withTimeout(null, 1), namedError("TypeError"));
  assert.equal(calls, 0);
  assert.equal(clock.pending.size, 0);
});

test("Timeout: race non cancella il lavoro e osserva il rifiuto tardivo", async () => {
  const clock = timers();
  const job = deferred();
  const withTimeout = run(
    advanced("async function withTimeout"),
    "withTimeout",
    clock,
  ).value;
  const result = withTimeout(() => job.promise, 10);
  const rejected = assert.rejects(result, /Timeout/);
  await flush();
  clock.fire();
  await rejected;
  job.reject(new Error("late failure"));
  await flush();
  assert.equal(clock.pending.size, 0);
});

test("Timeout Fetch: il timer resta attivo fino alla lettura del corpo", async () => {
  const clock = timers();
  const body = deferred();
  const get = run(
    advanced("async function fetchJSON(") +
      "\n" +
      advanced("async function fetchJSONWithTimeout"),
    "fetchJSONWithTimeout",
    {
      ...clock,
      fetch: async () => ({ ok: true, json: () => body.promise }),
    },
  ).value;
  const result = get("/api/data", 100);
  await flush();
  assert.equal(clock.pending.size, 1);
  body.resolve({ done: true });
  assert.deepEqual(await result, { done: true });
  assert.equal(clock.pending.size, 0);
});

test("Timeout Fetch: l'abort raggiunge la lettura del corpo", async () => {
  const clock = timers();
  let signal;
  const get = run(
    advanced("async function fetchJSON(") +
      "\n" +
      advanced("async function fetchJSONWithTimeout"),
    "fetchJSONWithTimeout",
    {
      ...clock,
      fetch: async (url, options) => {
        signal = options.signal;
        return {
          ok: true,
          json: () =>
            new Promise((resolve, reject) =>
              signal.addEventListener("abort", () => reject(signal.reason), {
                once: true,
              }),
            ),
        };
      },
    },
  ).value;
  const rejected = assert.rejects(
    get("/api/data", 100),
    namedError("AbortError"),
  );
  await flush();
  clock.fire();
  await rejected;
  assert.equal(signal.aborted, true);
  assert.equal(clock.pending.size, 0);
});

test("Timeout Fetch: HTTP, parsing e delay invalido ripuliscono le risorse", async () => {
  const clock = timers();
  let calls = 0;
  const get = run(
    advanced("async function fetchJSON(") +
      "\n" +
      advanced("async function fetchJSONWithTimeout"),
    "fetchJSONWithTimeout",
    {
      ...clock,
      fetch: async () =>
        ++calls === 1
          ? { ok: false, status: 503 }
          : {
              ok: true,
              json: async () => {
                throw new SyntaxError("json");
              },
            },
    },
  ).value;
  await assert.rejects(get("/api/data", -1), namedError("RangeError"));
  assert.equal(calls, 0);
  await assert.rejects(get("/api/data"), /HTTP 503/);
  await assert.rejects(get("/api/data"), namedError("SyntaxError"));
  assert.equal(clock.pending.size, 0);
});

test("Pool: limite concorrente, ordine dei risultati e indice del task", async () => {
  const runWithLimit = pool();
  const jobs = Array.from({ length: 4 }, deferred);
  const started = [];
  let active = 0,
    maximum = 0;
  const result = runWithLimit(["a", "b", "c", "d"], 2, async (item, index) => {
    started.push([item, index]);
    maximum = Math.max(maximum, ++active);
    try {
      return await jobs[index].promise;
    } finally {
      active--;
    }
  });
  await flush();
  assert.deepEqual(started, [
    ["a", 0],
    ["b", 1],
  ]);
  jobs[1].resolve("B");
  await flush();
  assert.deepEqual(started.at(-1), ["c", 2]);
  jobs[2].resolve("C");
  await flush();
  jobs[3].resolve("D");
  jobs[0].resolve("A");
  assert.deepEqual(plain(await result), ["A", "B", "C", "D"]);
  assert.equal(maximum, 2);
  assert.equal(active, 0);
});

test("Pool: dopo un errore ferma nuovi avvii e drena quelli in corso", async () => {
  const jobs = [deferred(), deferred()];
  const started = [];
  let settled = false;
  const error = new Error("first failure");
  const result = pool()([0, 1, 2, 3], 2, (item) => {
    started.push(item);
    return jobs[item].promise;
  });
  const observed = result.then(
    () => {
      settled = true;
      assert.fail("expected rejection");
    },
    (reason) => {
      settled = true;
      return reason;
    },
  );
  jobs[0].reject(error);
  await flush();
  assert.deepEqual(started, [0, 1]);
  assert.equal(settled, false);
  jobs[1].reject(new Error("second failure"));
  assert.equal(await observed, error);
  await flush();
});

test("Pool: throw sincrono e ragione falsy restano errori", async () => {
  for (const reason of [undefined, null, 0, new Error("sync")]) {
    const started = [];
    const result = pool()([0, 1, 2], 2, (item) => {
      started.push(item);
      throw reason;
    });
    const outcome = await result.then(
      () => ({ success: true }),
      (error) => ({ error }),
    );
    assert.equal(Object.hasOwn(outcome, "success"), false);
    assert.equal(outcome.error, reason);
    assert.deepEqual(started, [0]);
  }
});

test("Pool: vuoto, limite uno e limite superiore al numero di elementi", async () => {
  const execute = pool();
  assert.deepEqual(plain(await execute([], 2, () => assert.fail("empty"))), []);
  for (const limit of [1, 100]) {
    assert.deepEqual(
      plain(await execute([2, 4], limit, (value) => value * 2)),
      [4, 8],
    );
  }
});

test("Pool: valida argomenti e buchi prima di avviare task", async () => {
  const execute = pool();
  let calls = 0;
  const task = () => calls++;
  for (const limit of [0, -1, 1.5, Infinity, NaN, "2"]) {
    await assert.rejects(execute([1], limit, task), namedError("RangeError"));
  }
  await assert.rejects(execute(null, 2, task), namedError("TypeError"));
  await assert.rejects(execute([1, , 3], 2, task), namedError("TypeError"));
  await assert.rejects(execute([], 2, null), namedError("TypeError"));
  assert.equal(calls, 0);
});

test("Pool: snapshot dell'array senza clonare gli oggetti", async () => {
  const first = deferred();
  const shared = { name: "shared" };
  const input = ["first", shared];
  const seen = [];
  const result = pool()(input, 1, (item, index) => {
    seen.push(item);
    return index === 0 ? first.promise : item;
  });
  input[1] = "replaced";
  first.resolve("done");
  const values = await result;
  assert.equal(seen[1], shared);
  assert.equal(values[1], shared);
});

test("Upload: allSettled raccoglie anche throw sincroni della funzione", async () => {
  const state = run(
    advanced("files.map((file) => Promise.resolve()"),
    "({uploaded,failed})",
    {
      files: [1, 2, 3],
      uploadFile: (value) => {
        if (value === 2) throw "unavailable";
        return value;
      },
    },
    true,
  );
  assert.deepEqual(plain(await state.value), {
    uploaded: [1, 3],
    failed: ["unavailable"],
  });
});

test("Async: restituzione Promise e ordine fino al primo await", async () => {
  const message = run(asyncNote("async function getMessage"), "result");
  assert.deepEqual(message.output, [[true]]);
  assert.equal(await message.value, "ciao");
  const state = run(asyncNote("async function describeOrder"), "pending");
  assert.deepEqual(state.output, [["inizio funzione"], ["chiamante"]]);
  assert.equal(await state.value, 7);
  await flush();
  assert.deepEqual(state.output, [
    ["inizio funzione"],
    ["chiamante"],
    ["ripresa", 7],
    ["risultato", 7],
  ]);
});

test("Async: return await rende il rifiuto visibile al catch locale", async () => {
  const [withoutAwait, withAwait] = run(
    asyncNote("async function withoutAwait"),
    "[withoutAwait,withAwait]",
  ).value;
  const error = new Error("failure");
  await assert.rejects(
    withoutAwait(() => Promise.reject(error)),
    (reason) => reason === error,
  );
  assert.equal(await withAwait(() => Promise.reject(error)), "fallback");
  assert.equal(
    await withoutAwait(() => {
      throw error;
    }),
    "fallback",
  );
  assert.equal(
    await withAwait(() => {
      throw error;
    }),
    "fallback",
  );
});

test("Async: finally ripristina loading dopo successo ed errore", async () => {
  for (const fail of [false, true]) {
    const job = deferred(),
      loading = [];
    const submit = run(asyncNote("async function submitForm"), "submitForm", {
      saveForm: () => job.promise,
      setLoading: (value) => loading.push(value),
    }).value;
    const result = submit({});
    assert.deepEqual(loading, [true]);
    if (fail) {
      const rejected = assert.rejects(result, /save failed/);
      job.reject(new Error("save failed"));
      await rejected;
    } else {
      job.resolve();
      await result;
    }
    assert.deepEqual(loading, [true, false]);
  }
});

function userLoader(fetch) {
  const clock = timers();
  const load = run(asyncNote("async function loadUser(id,"), "loadUser", {
    ...clock,
    fetch,
  }).value;
  return { load, clock };
}

test("Async: loadUser controlla id, schema e campi pubblici", async () => {
  const user = { id: 3, name: "Ada", secret: "not returned" };
  const { load, clock } = userLoader(async (url, { signal }) => {
    assert.equal(url, "/api/users/3");
    assert.equal(signal.aborted, false);
    return { ok: true, json: async () => user };
  });
  const result = await load(3);
  assert.deepEqual(plain(result), { id: 3, name: "Ada" });
  assert.notEqual(result, user);
  assert.equal(clock.pending.size, 0);
});

test("Async: loadUser non avvia Fetch per input invalidi", async () => {
  const { load, clock } = userLoader(() => assert.fail("no request expected"));
  for (const id of [0, -1, 1.5, "1", NaN, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(load(id), namedError("RangeError"));
  }
  for (const timeout of [-1, 1.5, Infinity, "2", 2_147_483_648]) {
    await assert.rejects(load(1, timeout), namedError("RangeError"));
  }
  assert.equal(clock.pending.size, 0);
});

test("Async: rete, HTTP, JSON e schema invalidi puliscono il timer", async () => {
  const responses = [
    () => {
      throw new Error("offline");
    },
    () => ({ ok: false, status: 404 }),
    () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("json");
      },
    }),
    ...[
      null,
      [],
      {},
      { id: 2, name: "Ada" },
      { id: 1, name: " " },
      { id: 1, name: 9 },
    ].map((value) => () => ({ ok: true, json: async () => value })),
  ];
  for (const response of responses) {
    const { load, clock } = userLoader(async () => response());
    await assert.rejects(load(1));
    assert.equal(clock.pending.size, 0);
  }
});

test("Async: loadUser mantiene il timer durante il corpo e abortisce", async () => {
  let signal;
  const { load, clock } = userLoader(async (url, options) => {
    signal = options.signal;
    return {
      ok: true,
      json: () =>
        new Promise((resolve, reject) =>
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          }),
        ),
    };
  });
  const rejected = assert.rejects(load(1, 100), namedError("AbortError"));
  await flush();
  assert.equal(clock.pending.size, 1);
  clock.fire();
  await rejected;
  assert.equal(clock.pending.size, 0);
});

test("Async: il wrapper di profilo conserva cause e propaga il rifiuto", async () => {
  const cause = new Error("HTTP 500");
  const load = run(asyncNote("async function loadProfile"), "loadProfile", {
    loadUser: async () => {
      throw cause;
    },
  }).value;
  await assert.rejects(
    load(1),
    (error) =>
      error.message === "Impossibile caricare il profilo" &&
      error.cause === cause,
  );
});

test("Async: loop sequenziale e Promise.all producono i risultati dichiarati", async () => {
  for (const marker of ["const results = [];", "[1, 2, 3].map"]) {
    const state = run(asyncNote(marker), "results", {}, true);
    assert.deepEqual(plain(await state.value), [2, 4, 6]);
    assert.deepEqual(plain(state.output), [[[2, 4, 6]]]);
  }
});
