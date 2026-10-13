import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const note = "Service Workers e PWA";
const origin = "https://notes.test";
const endpoint = `${origin}/demo/public-feed.json`;
const json = (value, init = {}) =>
  new Response(JSON.stringify(value), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

function runtime() {
  const entries = new Map();
  const state = {
    calls: 0,
    writes: 0,
    warnings: 0,
    openFails: false,
    putFails: false,
  };
  const cache = {
    async match(request) {
      return entries.get(request.url)?.clone();
    },
    async put(request, response) {
      if (state.putFails) throw new Error("quota");
      state.writes += 1;
      entries.set(request.url, response.clone());
    },
  };
  state.fetch = async () => json({ version: 1 });
  const context = vm.createContext({
    URL,
    Request,
    Response,
    self: { location: new URL(`${origin}/demo/sw.js`) },
    caches: {
      async open() {
        if (state.openFails) throw new Error("storage unavailable");
        return cache;
      },
    },
    console: {
      warn() {
        state.warnings += 1;
      },
    },
    fetch: async (request) => {
      state.calls += 1;
      return state.fetch(request);
    },
  });
  const api = vm.runInContext(
    snippet(note, "const PUBLIC_URL =") +
      "\n({cacheFirst, networkFirst, staleWhileRevalidate, checkPublicRequest, storePublicResponse})",
    context,
  );
  const request = () => new Request(endpoint, { credentials: "omit" });
  const event = () => {
    const pending = [];
    return {
      request: request(),
      pending,
      waitUntil(promise) {
        pending.push(promise);
      },
    };
  };
  return { ...api, request, event, entries, state };
}

test("Cache runtime: ammette solo GET pubblico esatto senza credenziali o Range", () => {
  const r = runtime();
  assert.doesNotThrow(() => r.checkPublicRequest(r.request()));
  for (const value of [
    null,
    new Request(endpoint),
    new Request(endpoint, { method: "POST", credentials: "omit" }),
    new Request(`${endpoint}?user=1`, { credentials: "omit" }),
    new Request("https://other.test/demo/public-feed.json", {
      credentials: "omit",
    }),
    new Request(endpoint, {
      credentials: "omit",
      headers: { Authorization: "Bearer x" },
    }),
    new Request(endpoint, {
      credentials: "omit",
      headers: { Range: "bytes=0-1" },
    }),
  ])
    assert.throws(() => r.checkPublicRequest(value), { name: "TypeError" });
  assert.equal(r.state.calls, 0);
});

test("Cache first: miss scrive una copia leggibile, hit evita la rete", async () => {
  const r = runtime();
  assert.deepEqual(await (await r.cacheFirst(r.request())).json(), {
    version: 1,
  });
  r.state.fetch = async () => json({ version: 2 });
  assert.deepEqual(await (await r.cacheFirst(r.request())).json(), {
    version: 1,
  });
  assert.equal(r.state.calls, 1);
  assert.equal(r.state.writes, 1);
});

test("Network first: rete fallita usa cache o Response JSON 503", async () => {
  const r = runtime();
  r.state.fetch = async () => {
    throw new TypeError("offline");
  };
  const missing = await r.networkFirst(r.request());
  assert.equal(missing.status, 503);
  assert.deepEqual(await missing.json(), { error: "offline" });
  r.entries.set(endpoint, json({ cached: true }));
  assert.deepEqual(await (await r.networkFirst(r.request())).json(), {
    cached: true,
  });
  const first = runtime();
  first.state.fetch = r.state.fetch;
  assert.equal((await first.cacheFirst(first.request())).status, 503);
});

test("Network first: 404 e 500 non sono offline e non sovrascrivono la cache", async () => {
  const r = runtime();
  r.entries.set(endpoint, json({ old: true }));
  for (const status of [404, 500]) {
    r.state.fetch = async () => json({ error: true }, { status });
    assert.equal((await r.networkFirst(r.request())).status, status);
  }
  assert.equal(r.state.writes, 0);
  assert.deepEqual(await r.entries.get(endpoint).json(), { old: true });
});

test("Cache runtime: esclude redirect, MIME errato, private e no-store", async () => {
  const r = runtime();
  const redirected = json({ value: 1 });
  Object.defineProperty(redirected, "redirected", { value: true });
  for (const response of [
    redirected,
    new Response("login", { headers: { "Content-Type": "text/html" } }),
    json({}, { headers: { "Cache-Control": "public, no-store" } }),
    json({}, { headers: { "Cache-Control": "private, max-age=60" } }),
    json({}, { status: 206 }),
  ])
    await r.storePublicResponse(r.request(), response);
  assert.equal(r.state.writes, 0);
});

test("Cache runtime: errori storage non nascondono una risposta di rete riuscita", async () => {
  for (const fault of ["openFails", "putFails"]) {
    const r = runtime();
    r.state[fault] = true;
    assert.deepEqual(await (await r.cacheFirst(r.request())).json(), {
      version: 1,
    });
    assert.deepEqual(await (await r.networkFirst(r.request())).json(), {
      version: 1,
    });
    assert.equal(r.state.writes, 0);
    assert.equal(r.state.warnings, 2);
  }
});

test("Stale while revalidate: registra waitUntil subito e aggiorna dopo il cache hit", async () => {
  const r = runtime();
  r.entries.set(endpoint, json({ version: 1 }));
  let complete;
  r.state.fetch = () =>
    new Promise((resolve) => {
      complete = resolve;
    });
  const event = r.event();
  const result = r.staleWhileRevalidate(event);
  assert.equal(event.pending.length, 1);
  assert.deepEqual(await (await result).json(), { version: 1 });
  complete(json({ version: 2 }));
  await Promise.all(event.pending);
  assert.deepEqual(await r.entries.get(endpoint).json(), { version: 2 });
});

test("Stale while revalidate: miss online e guasti con o senza cache", async () => {
  for (const cached of [false, true]) {
    const r = runtime();
    if (cached) r.entries.set(endpoint, json({ old: true }));
    r.state.fetch = async () => {
      throw new TypeError("offline");
    };
    const event = r.event();
    const response = await r.staleWhileRevalidate(event);
    assert.equal(response.status, cached ? 200 : 503);
    await Promise.all(event.pending);
  }
  const r = runtime();
  const event = r.event();
  assert.deepEqual(await (await r.staleWhileRevalidate(event)).json(), {
    version: 1,
  });
  await Promise.all(event.pending);
  assert.equal(r.state.writes, 1);
});

test("Push: JSON invalido, campi mancanti e stringhe lunghe hanno fallback controllati", async () => {
  let listener;
  const notifications = [];
  const self = {
    addEventListener(type, callback) {
      assert.equal(type, "push");
      listener = callback;
    },
    registration: {
      scope: `${origin}/demo/`,
      async showNotification(title, options) {
        notifications.push({ title, ...options });
      },
    },
  };
  vm.runInNewContext(snippet(note, 'self.addEventListener("push"'), {
    self,
    URL,
  });
  for (const data of [
    undefined,
    {
      json() {
        throw new SyntaxError("bad");
      },
    },
    { json: () => ({ title: 42, body: null }) },
    { json: () => ({ title: "x".repeat(100), body: "y".repeat(300) }) },
    { json: () => ({ title: " ".repeat(100) + "Aggiornamento" }) },
  ]) {
    const pending = [];
    listener({ data, waitUntil: (p) => pending.push(p) });
    await Promise.all(pending);
  }
  assert.deepEqual(
    notifications.slice(0, 3).map((n) => n.title),
    Array(3).fill("Nuova notifica"),
  );
  assert.equal(notifications[3].title.length, 80);
  assert.equal(notifications[3].body.length, 240);
  assert.equal(notifications[4].title, "Aggiornamento");
  assert.equal(notifications[0].icon, `${origin}/demo/icons/icon-192.png`);
});

test("Update opzionale: messaggio filtrato e claim collegati a waitUntil", async () => {
  const listeners = new Map();
  let skipped = 0,
    claimed = 0;
  const self = {
    location: new URL(`${origin}/demo/sw.js`),
    registration: { scope: `${origin}/demo/` },
    addEventListener: (type, callback) => listeners.set(type, callback),
    async skipWaiting() {
      skipped += 1;
    },
    clients: {
      async claim() {
        claimed += 1;
      },
    },
  };
  vm.runInNewContext(snippet(note, 'event.data?.type !== "SKIP_WAITING"'), {
    self,
  });
  vm.runInNewContext(snippet(note, "event.waitUntil(self.clients.claim())"), {
    self,
  });
  const pending = [];
  const event = {
    origin,
    source: { url: `${origin}/demo/` },
    data: { type: "SKIP_WAITING" },
    waitUntil: (p) => pending.push(p),
  };
  for (const invalid of [
    { origin: "https://other.test" },
    { source: null },
    { source: { url: `${origin}/other/` } },
    { data: { type: "CLEAR_CACHE" } },
  ]) {
    listeners.get("message")({ ...event, ...invalid });
  }
  assert.equal(skipped, 0);
  listeners.get("message")(event);
  listeners.get("activate")(event);
  await Promise.all(pending);
  assert.equal(skipped, 1);
  assert.equal(claimed, 1);
  assert.equal(pending.length, 2);
});
