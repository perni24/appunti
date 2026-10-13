import assert from "node:assert/strict";
import { test } from "node:test";
import { getEventListeners } from "node:events";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const fetchNote = (marker) => snippet("Fetch API", marker);
const abortNote = (marker) => snippet("AbortController", marker);
const named = (name) => (error) => error?.name === name;
const plain = (value) => structuredClone(value);
const flush = () => new Promise((resolve) => setImmediate(resolve));

function run(source, expression, globals = {}, async = false) {
  const context = vm.createContext({
    Headers,
    Response,
    URL,
    URLSearchParams,
    AbortController,
    AbortSignal,
    DOMException,
    console: { log() {}, error() {} },
    ...globals,
  });
  return vm.runInContext(
    async
      ? `(async () => { ${source}\n; return (${expression}); })()`
      : `${source}\n;(${expression})`,
    context,
    { timeout: 1000 },
  );
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
  let sequence = 0;
  return {
    pending,
    setTimeout(fn, ms) {
      const id = ++sequence;
      pending.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    fire() {
      assert.equal(pending.size, 1);
      const [id, { fn }] = pending.entries().next().value;
      pending.delete(id);
      fn();
    },
  };
}

function client(fetch) {
  return run(fetchNote("class HttpError"), "({ requestJson, HttpError })", {
    fetch,
  });
}

for (const [label, make] of [
  ["oggetto", () => ({ "X-Trace": "abc" })],
  ["coppie", () => [["X-Trace", "abc"]]],
  ["Headers", () => new Headers({ "X-Trace": "abc" })],
]) {
  test(`Fetch: header ${label}, default preservato e input non modificato`, async () => {
    const headers = make();
    const original = [...new Headers(headers)];
    const controller = new AbortController();
    const { requestJson } = client(async (url, options) => {
      assert.equal(url, "/api/example");
      assert.equal(options.headers.get("accept"), "application/json");
      assert.equal(options.headers.get("x-trace"), "abc");
      assert.equal(options.signal, controller.signal);
      assert.equal(options.credentials, "omit");
      return Response.json({ id: 1 });
    });
    assert.deepEqual(
      await requestJson("/api/example", {
        headers,
        signal: controller.signal,
        credentials: "omit",
      }),
      { id: 1 },
    );
    assert.deepEqual([...new Headers(headers)], original);
  });
}

test("Fetch: Accept esplicito, corpo serializzato e URL mantenuti", async () => {
  const url = new URL("https://notes.test/api/users");
  const { requestJson } = client(async (input, options) => {
    assert.equal(input, url);
    assert.equal(options.headers.get("accept"), "application/problem+json");
    assert.equal(options.headers.get("content-type"), "application/json");
    assert.equal(options.method, "POST");
    assert.equal(options.body, '{"name":"Ada"}');
    return new Response('{"id":1}', {
      headers: { "Content-Type": "Application/Problem+JSON; charset=utf-8" },
    });
  });
  assert.deepEqual(
    await requestJson(url, {
      method: "POST",
      headers: {
        accept: "application/problem+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Ada" }),
    }),
    { id: 1 },
  );
});

for (const [status, method] of [
  [204, "GET"],
  [205, "GET"],
  [200, "head"],
]) {
  test(`Fetch: nessun parsing su HTTP ${status} ${method}`, async () => {
    const { requestJson } = client(async () => new Response(null, { status }));
    assert.equal(await requestJson("/empty", { method }), null);
  });
}

test("Fetch: HttpError conserva lo status senza tentare JSON", async () => {
  const { requestJson, HttpError } = client(
    async () => new Response("<h1>Error</h1>", { status: 503 }),
  );
  await assert.rejects(
    requestJson("/broken"),
    (error) => error instanceof HttpError && error.status === 503,
  );
});

test("Fetch: media type inatteso, JSON malformato e 200 vuoto restano errori", async () => {
  for (const [body, headers, errorName] of [
    ["{}", {}, "TypeError"],
    ["{}", { "Content-Type": "text/html" }, "TypeError"],
    ["bad", { "Content-Type": "application/json" }, "SyntaxError"],
    ["", { "Content-Type": "application/json" }, "SyntaxError"],
  ]) {
    const { requestJson } = client(async () => new Response(body, { headers }));
    await assert.rejects(requestJson("/invalid"), named(errorName));
  }
});

test("Fetch: errori di rete e motivi di abort non vengono sostituiti", async () => {
  for (const reason of [
    new TypeError("offline"),
    new DOMException("stop", "AbortError"),
    null,
  ]) {
    const { requestJson } = client(async () => {
      throw reason;
    });
    await assert.rejects(requestJson("/api"), (error) => error === reason);
  }
});

test("Fetch: un Request preconfigurato e respinto prima della rete", async () => {
  let called = false;
  const { requestJson } = client(async () => {
    called = true;
  });
  await assert.rejects(
    requestJson(new Request("https://notes.test/")),
    named("TypeError"),
  );
  assert.equal(called, false);
});

test("Fetch: clone prima della lettura, body consumato non riutilizzabile", async () => {
  const result = await run(
    fetchNote("const copy = response.clone()"),
    "({ data, text, response })",
    {},
    true,
  );
  assert.deepEqual(result.data, { id: 1 });
  assert.equal(result.text, '{"id":1}');
  assert.equal(result.response.bodyUsed, true);
  await assert.rejects(result.response.text(), named("TypeError"));
  assert.throws(() => result.response.clone(), named("TypeError"));
});

test("Fetch: getUser valida id e schema, restituisce solo i campi pubblici", async () => {
  let payload = { id: 1, name: "Ada", secret: "hidden" };
  let calls = 0;
  const signal = new AbortController().signal;
  const getUser = run(fetchNote("async function getUser"), "getUser", {
    requestJson: async (url, options) => {
      calls++;
      assert.equal(url, "/api/users/1");
      assert.equal(options.signal, signal);
      return payload;
    },
  });
  assert.deepEqual(plain(await getUser(1, { signal })), { id: 1, name: "Ada" });
  for (const id of [0, -1, 1.5, "1", NaN, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(getUser(id), named("RangeError"));
  }
  assert.equal(calls, 1);
  for (payload of [
    null,
    [],
    "bad",
    { id: 2, name: "Ada" },
    { id: 1, name: " " },
  ]) {
    await assert.rejects(getUser(1, { signal }), named("TypeError"));
  }
});

test("Fetch: esempio POST serializza e controlla HTTP", async () => {
  const source = fetchNote("body: JSON.stringify({");
  const data = await run(
    source,
    "createdUser",
    {
      fetch: async (url, options) => {
        assert.equal(url, "/api/users");
        assert.equal(options.headers["Content-Type"], "application/json");
        assert.deepEqual(JSON.parse(options.body), {
          name: "Luca",
          email: "luca@example.com",
        });
        return Response.json({ id: 1 }, { status: 201 });
      },
    },
    true,
  );
  assert.deepEqual(data, { id: 1 });
  await assert.rejects(
    run(
      source,
      "createdUser",
      { fetch: async () => new Response(null, { status: 500 }) },
      true,
    ),
    /HTTP 500/,
  );
});

for (const [note, marker, name] of [
  [fetchNote, "async function readDataWithTimeout", "readDataWithTimeout"],
  [abortNote, "async function readWithTimeout", "readWithTimeout"],
]) {
  test(`Timeout: ${name} mantiene il timer durante il corpo e lo rimuove`, async () => {
    const clock = timers();
    const body = deferred();
    const fn = run(note(marker), name, {
      ...clock,
      fetch: async () => ({ ok: true, json: () => body.promise }),
    });
    const pending = fn("/data", 10);
    await flush();
    assert.equal(clock.pending.size, 1);
    body.resolve({ ok: true });
    assert.deepEqual(await pending, { ok: true });
    assert.equal(clock.pending.size, 0);
  });
}

test("Timeout: rifiuto durante il corpo propaga TimeoutError e rimuove il timer", async () => {
  const clock = timers();
  const fn = run(
    abortNote("async function readWithTimeout"),
    "readWithTimeout",
    {
      ...clock,
      fetch: async (url, { signal }) => ({
        ok: true,
        json: () =>
          new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason), {
              once: true,
            });
          }),
      }),
    },
  );
  const checked = assert.rejects(fn("/data", 10), named("TimeoutError"));
  await flush();
  clock.fire();
  await checked;
  assert.equal(clock.pending.size, 0);
});

test("Timeout: input invalidi, HTTP, rete e parsing non lasciano timer", async () => {
  const clock = timers();
  let calls = 0;
  let reply = () => new Response(null, { status: 500 });
  const fn = run(
    abortNote("async function readWithTimeout"),
    "readWithTimeout",
    {
      ...clock,
      fetch: async () => {
        calls++;
        return reply();
      },
    },
  );
  for (const ms of [-1, 1.5, "10", Infinity, 2_147_483_648])
    await assert.rejects(fn("/data", ms), named("RangeError"));
  assert.equal(calls, 0);
  await assert.rejects(fn("/data"), /HTTP 500/);
  assert.equal(clock.pending.size, 0);
  reply = () => {
    throw new TypeError("offline");
  };
  await assert.rejects(fn("/data"), /offline/);
  assert.equal(clock.pending.size, 0);
  reply = () => new Response("bad");
  await assert.rejects(fn("/data"), named("SyntaxError"));
  assert.equal(clock.pending.size, 0);
});

test("Wait: successo rimuove il listener anche senza abort", async () => {
  const clock = timers();
  const controller = new AbortController();
  const wait = run(abortNote("function wait(ms"), "wait", clock);
  const pending = wait(10, controller.signal);
  assert.equal(getEventListeners(controller.signal, "abort").length, 1);
  clock.fire();
  await pending;
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
  controller.abort();
  assert.equal(clock.pending.size, 0);
});

test("Wait: abort rimuove timer e listener e conserva anche null", async () => {
  for (const reason of [new Error("stop"), null, 0, "stop"]) {
    const clock = timers();
    const controller = new AbortController();
    const wait = run(abortNote("function wait(ms"), "wait", clock);
    const checked = assert.rejects(
      wait(10, controller.signal),
      (error) => error === reason,
    );
    controller.abort(reason);
    await checked;
    assert.equal(clock.pending.size, 0);
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
  }
});

test("Wait: signal gia abortito non registra risorse", async () => {
  const clock = timers();
  const controller = new AbortController();
  controller.abort();
  const wait = run(abortNote("function wait(ms"), "wait", clock);
  await assert.rejects(
    wait(10, controller.signal),
    (error) => error === controller.signal.reason,
  );
  assert.equal(clock.pending.size, 0);
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
});

test("Wait: durata e signal invalidi rifiutano senza risorse", async () => {
  const clock = timers();
  const wait = run(abortNote("function wait(ms"), "wait", clock);
  for (const ms of [-1, 1.5, NaN, Infinity, "10", 2_147_483_648])
    await assert.rejects(wait(ms), named("RangeError"));
  for (const signal of [null, {}, 1])
    await assert.rejects(wait(10, signal), named("TypeError"));
  assert.equal(clock.pending.size, 0);
  const pending = wait(0);
  clock.fire();
  await pending;
});

function searchFixture() {
  const jobs = [],
    results = [],
    errors = [];
  const create = run(
    abortNote("function createUserSearch"),
    "createUserSearch",
    {
      fetch: (url, { signal }) => {
        const body = deferred();
        jobs.push({ url, signal, body });
        // Deliberately ignore abort to test stale-result guards independently.
        return Promise.resolve({ ok: true, json: () => body.promise });
      },
    },
  );
  const search = create({
    renderResults: (users) => results.push(plain(users)),
    showError: (error) => errors.push(error),
  });
  return { create, search, jobs, results, errors };
}

test("Ricerca: risposta vecchia dopo quella nuova non aggiorna la UI", async () => {
  const { search, jobs, results, errors } = searchFixture();
  const first = search.searchUsers("old");
  const second = search.searchUsers(" A & B ");
  assert.equal(jobs[0].signal.aborted, true);
  assert.equal(
    new URL(jobs[1].url, "https://notes.test").searchParams.get("q"),
    "A & B",
  );
  jobs[1].body.resolve([{ id: 2, name: "New", secret: "hidden" }]);
  await second;
  jobs[0].body.resolve([{ id: 1, name: "Old" }]);
  await first;
  assert.deepEqual(results, [[{ id: 2, name: "New" }]]);
  assert.deepEqual(errors, []);
});

test("Ricerca: vecchio finally non elimina il nuovo controller", async () => {
  const { search, jobs, results } = searchFixture();
  const first = search.searchUsers("old");
  const second = search.searchUsers("new");
  await flush();
  jobs[0].body.reject(new Error("old failure"));
  await first;
  search.cancel();
  assert.equal(jobs[1].signal.aborted, true);
  jobs[1].body.resolve([{ id: 2, name: "New" }]);
  await second;
  assert.deepEqual(results, []);
});

test("Ricerca: query vuota annulla e svuota senza una nuova fetch", async () => {
  const { search, jobs, results } = searchFixture();
  const pending = search.searchUsers("old");
  await search.searchUsers("  ");
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].signal.aborted, true);
  jobs[0].body.resolve([{ id: 1, name: "Old" }]);
  await pending;
  assert.deepEqual(results, [[]]);
});

test("Ricerca: schema invalido e HTTP non diventano risultati validi", async () => {
  const { search, jobs, results, errors } = searchFixture();
  for (const value of [
    null,
    {},
    [null],
    [{ id: 0, name: "Ada" }],
    [{ id: 1, name: " " }],
  ]) {
    const pending = search.searchUsers("query");
    jobs.at(-1).body.resolve(value);
    await pending;
  }
  assert.equal(errors.length, 5);
  assert.ok(errors.every(named("TypeError")));
  assert.deepEqual(results, []);
  const create = run(
    abortNote("function createUserSearch"),
    "createUserSearch",
    { fetch: async () => new Response(null, { status: 503 }) },
  );
  await create({
    renderResults: () => assert.fail(),
    showError: (error) => assert.match(error.message, /HTTP 503/),
  }).searchUsers("query");
});

test("Ricerca: input e callback invalidi restano responsabilita del chiamante", async () => {
  const { search, create, jobs } = searchFixture();
  await assert.rejects(search.searchUsers(null), named("TypeError"));
  assert.equal(jobs.length, 0);
  assert.throws(() => create({}), named("TypeError"));
  const failure = new Error("UI broken");
  const broken = create({
    renderResults() {
      throw failure;
    },
    showError() {
      throw failure;
    },
  });
  await assert.rejects(broken.searchUsers(""), (error) => error === failure);
});

test("Report: avvio, annullamento e vecchio completamento non aggiornano la UI", async () => {
  const jobs = [],
    output = [];
  const { loadData, cancelLoad } = run(
    abortNote("let activeController"),
    "({ loadData, cancelLoad })",
    {
      fetch: async (url, { signal }) => {
        const body = deferred();
        jobs.push({ body, signal });
        return { ok: true, json: () => body.promise };
      },
      renderReport: (report) => output.push(report),
      showError: (error) => output.push(error),
    },
  );
  const first = loadData();
  const second = loadData();
  assert.equal(jobs[0].signal.aborted, true);
  jobs[0].body.resolve("old");
  await first;
  cancelLoad();
  assert.equal(jobs[1].signal.aborted, true);
  jobs[1].body.resolve("new");
  await second;
  assert.deepEqual(output, []);
});
