import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const { WebSocketServer } = require("ws");
let browser;

before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser degli esempi: ${browser.version()}`);
});
after(async () => {
  await browser?.close();
});

// A new context per test isolates storage and listeners. All network requests are intercepted.
async function fixture(t, html, source = "", contextOptions = {}) {
  const context = await browser.newContext(contextOptions);
  t.after(() => context.close());
  await context.route("**/*", (route) =>
    route.request().isNavigationRequest()
      ? route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><html><body></body></html>",
        })
      : route.abort(),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://notes.test/app/?keep=1#anchor");
  await page.setContent(html);
  if (source) await page.addScriptTag({ content: source });
  return { page, context, errors };
}

test("Copie browser: transfer distacca il buffer e il DOM non e clonabile", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet(
      "Immutabilita e Copia degli Oggetti",
      "const transferred =",
      "javascript",
    ),
  );
  const result = await page.evaluate(() => {
    let failure;
    try {
      structuredClone(document.querySelector("main"));
    } catch (error) {
      failure = error.name;
    }
    return { original: bytes.byteLength, copy: [...transferred], failure };
  });
  assert.deepEqual(result, {
    original: 0,
    copy: [10, 20, 30],
    failure: "DataCloneError",
  });
  assert.deepEqual(errors, []);
});

test("Copie browser: deepFreeze tratta cicli senza invocare getter", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet(
      "Immutabilita e Copia degli Oggetti",
      "function deepFreeze",
      "javascript",
    ),
  );
  const result = await page.evaluate(() => {
    const root = { items: [{ value: 1 }] };
    root.self = root;
    deepFreeze(root);
    let reads = 0;
    let failure;
    const invalid = {
      get value() {
        reads++;
        return 1;
      },
    };
    try {
      deepFreeze(invalid);
    } catch (error) {
      failure = error.name;
    }
    return [
      root.self === root,
      Object.isFrozen(root),
      Object.isFrozen(root.items[0]),
      reads,
      failure,
      Object.isFrozen(invalid),
    ];
  });
  assert.deepEqual(result, [true, true, true, 0, "TypeError", false]);
  assert.deepEqual(errors, []);
});

test("Generatori browser: helper nativi e cleanup su break", async (t) => {
  const source =
    snippet("Generators e Iterators", "function* range(") +
    "\n" +
    snippet("Generators e Iterators", "function* trackedNumbers");
  const { page, errors } = await fixture(t, "<main></main>", source);
  const result = await page.evaluate(() => {
    let closed = 0;
    for (const _ of trackedNumbers(() => {
      closed++;
    }))
      break;
    return {
      values: range(1, 100)
        .map((value) => value * 2)
        .take(3)
        .toArray(),
      closed,
    };
  });
  assert.deepEqual(result, { values: [2, 4, 6], closed: 1 });
  assert.deepEqual(errors, []);
});

test("Generatori browser: paginazione Fetch reale, query e arresto anticipato", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Generators e Iterators", "async function* fetchPages"),
  );
  const calls = [];
  await page.route("**/api/products*", (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page"));
    calls.push([pageNumber, url.searchParams.get("category")]);
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items:
          pageNumber < 3
            ? [{ id: pageNumber, name: `Book ${pageNumber}` }]
            : [],
      }),
    });
  });
  const result = await page.evaluate(async () => {
    const values = [];
    const endpoint = new URL(
      "/api/products?category=books&page=88",
      location.href,
    );
    for await (const items of fetchPages(endpoint)) values.push(...items);
    for await (const _ of fetchPages(endpoint)) break;
    return values;
  });
  assert.deepEqual(result, [
    { id: 1, name: "Book 1" },
    { id: 2, name: "Book 2" },
  ]);
  assert.deepEqual(calls, [
    [1, "books"],
    [2, "books"],
    [3, "books"],
    [1, "books"],
  ]);
  assert.deepEqual(errors, []);
});

test("Generatori browser: signal annulla la pagina HTTP in corso", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Generators e Iterators", "async function* fetchPages"),
  );
  await page.route("**/api/pending", () => {});
  await page.route("**/api/pending?*", () => {});
  const requested = page.waitForRequest("**/api/pending?*");
  await page.evaluate(() => {
    globalThis.pageController = new AbortController();
    const cursor = fetchPages(new URL("/api/pending", location.href), {
      signal: pageController.signal,
    });
    globalThis.pageOutcome = cursor.next().then(
      () => "unexpected",
      (error) => error.name,
    );
  });
  await requested;
  const result = await page.evaluate(async () => {
    pageController.abort();
    return await pageOutcome;
  });
  assert.equal(result, "AbortError");
  assert.deepEqual(errors, []);
});

test("FP browser: shell DOM rende i nomi come testo e sostituisce la lista", async (t) => {
  const source = [
    snippet("Functional Programming", "function getActiveUserNames"),
    snippet("Functional Programming", "const users ="),
    snippet("Functional Programming", "function renderActiveUserNames"),
  ].join("\n");
  const { page, errors } = await fixture(
    t,
    '<ul id="active-users"><li>vecchio</li></ul>',
    source,
  );
  assert.deepEqual(await page.locator("#active-users li").allTextContents(), [
    "Anna",
    "Sara",
  ]);
  await page.evaluate(() => {
    renderActiveUserNames(document.querySelector("#active-users"), [
      "<img src=x onerror=alert(1)>",
    ]);
  });
  assert.equal(await page.locator("#active-users img").count(), 0);
  assert.deepEqual(await page.locator("#active-users li").allTextContents(), [
    "<img src=x onerror=alert(1)>",
  ]);
  await page.evaluate(() =>
    renderActiveUserNames(document.querySelector("#active-users"), []),
  );
  assert.equal(await page.locator("#active-users li").count(), 0);
  assert.deepEqual(errors, []);
});

test("Pattern browser: import dello stesso modulo condivide la configurazione", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  const source = snippet("Design Patterns", "export const config");
  await page.route("**/config.mjs*", (route) =>
    route.fulfill({ contentType: "text/javascript", body: source }),
  );
  const result = await page.evaluate(async () => {
    const first = await import("/config.mjs");
    const second = await import("/config.mjs");
    const separate = await import("/config.mjs?other=1");
    return [
      first.config === second.config,
      first.config === separate.config,
      Object.isFrozen(first.config),
    ];
  });
  assert.deepEqual(result, [true, false, true]);
  assert.deepEqual(errors, []);
});

for (const [status, body, expected] of [
  [200, '{"ok":true}', { data: { ok: true } }],
  [404, "not found", { error: "Error", status: 404 }],
  [200, "bad JSON", { error: "SyntaxError" }],
  [204, "", { data: null }],
]) {
  test(`AJAX browser: XHR HTTP ${status}, corpo ${body || "vuoto"}`, async (t) => {
    const { page, errors } = await fixture(
      t,
      "<main></main>",
      snippet("AJAX", "function getJsonXHR"),
    );
    await page.route("**/api/xhr", (route) =>
      route.fulfill({ status, body, contentType: "application/json" }),
    );
    const result = await page.evaluate(async () => {
      try {
        return { data: await getJsonXHR("/api/xhr") };
      } catch (error) {
        return error.status === undefined
          ? { error: error.name }
          : { error: error.name, status: error.status };
      }
    });
    assert.deepEqual(result, expected);
    assert.deepEqual(errors, []);
  });
}

test("AJAX browser: timeout XHR su richiesta senza risposta", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("AJAX", "function getJsonXHR"),
  );
  await page.route("**/api/slow", () => {});
  const result = await page.evaluate(async () => {
    try {
      await getJsonXHR("/api/slow", { timeoutMs: 20 });
      return "unexpected";
    } catch (error) {
      return error.name;
    }
  });
  assert.equal(result, "TimeoutError");
  assert.deepEqual(errors, []);
});

test("AJAX browser: abort XHR in corso conserva il motivo del signal", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("AJAX", "function getJsonXHR"),
  );
  await page.route("**/api/slow", () => {});
  const requested = page.waitForRequest("**/api/slow");
  await page.evaluate(() => {
    globalThis.controller = new AbortController();
    globalThis.pending = getJsonXHR("/api/slow", {
      signal: controller.signal,
    }).then(
      () => "unexpected",
      (error) => error,
    );
  });
  await requested;
  await page.evaluate(() => controller.abort(0));
  assert.equal(await page.evaluate(() => pending), 0);
  assert.deepEqual(errors, []);
});

test("AJAX browser: lista testuale, singola richiesta e dati conservati su errore", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("AJAX", 'id="refresh-users"', "html"),
    `${snippet("AJAX", "async function loadUsers")}\n${snippet("AJAX", "function mountUsers")}`,
  );
  let requests = 0,
    fail = false;
  let release;
  await page.route("**/api/users", async (route) => {
    requests++;
    if (fail) return route.fulfill({ status: 503, body: "unavailable" });
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{ id: 1, name: '<img src=x onerror="alert(1)">' }]),
    });
  });
  await page.evaluate(() => {
    globalThis.cleanup = mountUsers();
    document.querySelector("#refresh-users").click();
    document.querySelector("#refresh-users").dispatchEvent(new Event("click"));
  });
  await page.waitForFunction(
    () => document.querySelector("#refresh-users").disabled,
  );
  for (let attempt = 0; !release && attempt < 1000; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.equal(
    typeof release,
    "function",
    "La richiesta deve raggiungere la route di test",
  );
  assert.equal(requests, 1);
  release();
  await page.waitForFunction(
    () => document.querySelector("#users-status").textContent === "1 utenti",
  );
  assert.equal(await page.locator("#users-list img").count(), 0);
  assert.equal(
    await page.locator("#users-list li").innerText(),
    '<img src=x onerror="alert(1)">',
  );
  fail = true;
  await page.click("#refresh-users");
  await page.waitForFunction(() =>
    document.querySelector("#users-status").textContent.includes("Impossibile"),
  );
  assert.equal(await page.locator("#users-list li").count(), 1);
  assert.equal(await page.locator("#refresh-users").isDisabled(), false);
  await page.evaluate(() => cleanup());
  assert.deepEqual(errors, []);
});

test("AJAX browser: unmount rimuove listener e ignora completamenti tardivi", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("AJAX", 'id="refresh-users"', "html"),
    `
    globalThis.calls = 0;
    globalThis.loadUsers = ({signal}) => {
      calls++;
      globalThis.signal = signal;
      return new Promise(resolve => { globalThis.finish = resolve; });
    };
    ${snippet("AJAX", "function mountUsers")}
  `,
  );
  await page.evaluate(async () => {
    const cleanup = mountUsers();
    document.querySelector("#refresh-users").click();
    cleanup();
    document.querySelector("#users-status").textContent = "Vista rimossa";
    finish([{ id: 1, name: "Late" }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.querySelector("#refresh-users").click();
  });
  assert.deepEqual(
    await page.evaluate(() => ({ calls, aborted: signal.aborted })),
    { calls: 1, aborted: true },
  );
  assert.equal(await page.locator("#users-list li").count(), 0);
  assert.equal(
    await page.locator("#users-status").innerText(),
    "Vista rimossa",
  );
  assert.deepEqual(errors, []);
});

test("AJAX browser: progress upload computabile, indeterminato e cleanup", async (t) => {
  const { page, errors } = await fixture(
    t,
    '<progress id="upload"></progress>',
    snippet("AJAX", "function trackUpload"),
  );
  const result = await page.evaluate(() => {
    const xhr = new XMLHttpRequest();
    const progress = document.querySelector("#upload");
    const remove = trackUpload(xhr, progress);
    xhr.upload.dispatchEvent(
      new ProgressEvent("progress", {
        lengthComputable: true,
        loaded: 50,
        total: 100,
      }),
    );
    const fraction = progress.position;
    xhr.upload.dispatchEvent(
      new ProgressEvent("progress", { lengthComputable: false }),
    );
    const indeterminate = !progress.hasAttribute("value");
    remove();
    xhr.upload.dispatchEvent(
      new ProgressEvent("progress", {
        lengthComputable: true,
        loaded: 100,
        total: 100,
      }),
    );
    return {
      fraction,
      indeterminate,
      cleaned: !progress.hasAttribute("value"),
    };
  });
  assert.deepEqual(result, {
    fraction: 0.5,
    indeterminate: true,
    cleaned: true,
  });
  assert.deepEqual(errors, []);
});

async function socketFixture(t, onConnection) {
  const server = createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<!doctype html><main></main>");
  });
  const wss = new WebSocketServer({ server });
  wss.on("connection", onConnection);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const context = await browser.newContext();
  t.after(async () => {
    await context.close();
    for (const socket of wss.clients) socket.terminate();
    await new Promise((resolve) => wss.close(resolve));
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const sources = [
    snippet("WebSockets", "function parseNotification"),
    snippet("WebSockets", "function sendMessage"),
    snippet("WebSockets", "function reconnectDelay"),
    snippet("Real-time con WebSocket", "function createRealtimeClient"),
  ];
  await page.addScriptTag({
    content: `${sources.join("\n")}\n
    globalThis.states = []; globalThis.notifications = []; globalThis.failures = [];
    globalThis.createClient = (maxRetries = 1) => createRealtimeClient('ws://127.0.0.1:${server.address().port}/events', {
      maxRetries, onStatus: value => states.push(value), onNotification: value => notifications.push(value),
      onError: error => failures.push(error.name)
    });
  `,
  });
  return {
    page,
    errors,
    url: `ws://127.0.0.1:${server.address().port}/events`,
  };
}

test("WebSocket browser: protocollo reale, parsing e chiusura volontaria", async (t) => {
  let connections = 0;
  const sent = [];
  const { page, errors } = await socketFixture(t, (socket) => {
    connections++;
    socket.on("message", (data) => {
      sent.push(JSON.parse(data.toString()));
      socket.send("bad JSON");
      socket.send(Buffer.from([1, 2, 3]));
      socket.send(
        JSON.stringify({
          type: "notification",
          payload: { id: "1", text: "Hello", secret: "hidden" },
        }),
      );
    });
  });
  await page.evaluate(() => {
    globalThis.client = createClient();
    client.start();
    client.start();
  });
  await page.waitForFunction(
    () => notifications.length === 1 && failures.length === 2,
  );
  assert.deepEqual(sent, [{ type: "subscribe", payload: { topic: "orders" } }]);
  assert.deepEqual(await page.evaluate(() => notifications), [
    { id: "1", text: "Hello" },
  ]);
  await page.evaluate(() => client.stop());
  assert.equal(await page.evaluate(() => states.at(-1)), "stopped");
  assert.equal(connections, 1);
  assert.deepEqual(errors, []);
});

test("WebSocket browser: caduta reale, reconnect e budget esaurito", async (t) => {
  let connections = 0,
    subscriptions = 0;
  const { page, errors } = await socketFixture(t, (socket) => {
    connections++;
    socket.on("message", () => {
      subscriptions++;
      socket.terminate();
    });
  });
  await page.evaluate(() => {
    globalThis.client = createClient(1);
    client.start();
  });
  await page.waitForFunction(() => states.includes("exhausted"));
  assert.equal(connections, 2);
  assert.equal(subscriptions, 2);
  assert.equal(
    await page.evaluate(
      () => states.filter((state) => state === "retrying").length,
    ),
    1,
  );
  assert.deepEqual(errors, []);
});

test("WebSocket browser: send in CONNECTING e vincoli close nativi", async (t) => {
  const { page, errors, url } = await socketFixture(t, () => {});
  const result = await page.evaluate(async (url) => {
    const socket = new WebSocket(url);
    const result = {};
    try {
      socket.send("early");
    } catch (error) {
      result.early = error.name;
    }
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    try {
      socket.close(1006);
    } catch (error) {
      result.code = error.name;
    }
    try {
      socket.close(1000, "\u20ac".repeat(42));
    } catch (error) {
      result.reason = error.name;
    }
    const closed = new Promise((resolve) =>
      socket.addEventListener("close", resolve, { once: true }),
    );
    socket.close(1000, "done");
    await closed;
    result.closed = socket.readyState === WebSocket.CLOSED;
    result.silent = socket.send("discarded") === undefined;
    return result;
  }, url);
  assert.deepEqual(result, {
    early: "InvalidStateError",
    code: "InvalidAccessError",
    reason: "SyntaxError",
    closed: true,
    silent: true,
  });
  assert.deepEqual(errors, []);
});

test("Fetch browser: Headers e Authorization esplicito con credentials omit", async (t) => {
  const { page, context, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Fetch API", "class HttpError"),
  );
  await context.addCookies([
    { name: "demo", value: "not-a-secret", url: "http://notes.test" },
  ]);
  let observed;
  await page.route("**/api/demo", async (route) => {
    observed = await route.request().allHeaders();
    await route.fulfill({
      contentType: "application/json",
      body: '{"ok":true}',
    });
  });
  const result = await page.evaluate(() =>
    requestJson("/api/demo", {
      headers: new Headers({
        "X-Trace": "abc",
        Authorization: "Bearer test-only",
      }),
      credentials: "omit",
    }),
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(observed.accept, "application/json");
  assert.equal(observed["x-trace"], "abc");
  assert.equal(observed.authorization, "Bearer test-only");
  assert.equal(observed.cookie, undefined);
  assert.deepEqual(errors, []);
});

test("Fetch browser: FormData genera Content-Type con boundary e file", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Fetch API", "async function uploadAvatar"),
  );
  let contentType, payload;
  await page.route("**/api/avatar", async (route) => {
    contentType = (await route.request().allHeaders())["content-type"];
    payload = route.request().postDataBuffer().toString();
    await route.fulfill({ status: 204 });
  });
  assert.equal(
    await page.evaluate(() =>
      uploadAvatar(
        new File(["demo bytes"], "avatar.txt", { type: "text/plain" }),
      ),
    ),
    204,
  );
  assert.match(contentType, /^multipart\/form-data; boundary=/);
  assert.ok(payload.includes(contentType.split("boundary=")[1]));
  assert.match(payload, /name="avatar"; filename="avatar.txt"/);
  assert.match(payload, /demo bytes/);
  assert.deepEqual(errors, []);
});

test("Abort browser: signal gia abortito, motivo predefinito e personalizzato", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("AbortController", "async function readUsers"),
  );
  let requests = 0;
  await page.route("**/api/users", (route) => {
    requests++;
    return route.abort();
  });
  const result = await page.evaluate(async () => {
    const outcomes = [];
    for (const custom of [false, true]) {
      const controller = new AbortController();
      if (custom) controller.abort(null);
      else controller.abort();
      try {
        await readUsers(controller.signal);
        outcomes.push(false);
      } catch (error) {
        outcomes.push(error === controller.signal.reason);
      }
    }
    return outcomes;
  });
  assert.deepEqual(result, [true, true]);
  assert.equal(requests, 0);
  assert.deepEqual(errors, []);
});

test("Abort browser: Fetch fulfilled ma lettura del corpo ancora cancellabile", async (t) => {
  // A loopback-only server streams an incomplete body; route.fulfill cannot model this phase.
  const server = createServer((request, response) => {
    if (request.url === "/api/users") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.write('[{"id":1,');
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("<!doctype html><main></main>");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const context = await browser.newContext();
  t.after(async () => {
    await context.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.addScriptTag({
    content: snippet("AbortController", "async function readUsers"),
  });
  const responseReady = page.waitForResponse((response) =>
    response.url().endsWith("/api/users"),
  );
  await page.evaluate(() => {
    globalThis.controller = new AbortController();
    globalThis.outcome = readUsers(controller.signal).then(
      () => "unexpected success",
      (error) => error.name,
    );
  });
  assert.equal((await responseReady).status(), 200);
  await page.evaluate(() => controller.abort());
  assert.equal(await page.evaluate(() => outcome), "AbortError");
});

test("Abort browser: any conserva il primo motivo senza abortire gli altri", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  const result = await page.evaluate(() => {
    const first = new AbortController();
    const second = new AbortController();
    const combined = AbortSignal.any([first.signal, second.signal]);
    const reason = new Error("first");
    first.abort(reason);
    const siblingStillActive = !second.signal.aborted;
    second.abort(new Error("second"));
    let thrown;
    try {
      combined.throwIfAborted();
    } catch (error) {
      thrown = error;
    }
    return {
      siblingStillActive,
      firstReason: combined.reason === reason,
      thrownReason: thrown === reason,
      emptyPending: !AbortSignal.any([]).aborted,
      preabortedOrder:
        AbortSignal.any([second.signal, first.signal]).reason ===
        second.signal.reason,
    };
  });
  assert.deepEqual(result, {
    siblingStillActive: true,
    firstReason: true,
    thrownReason: true,
    emptyPending: true,
    preabortedOrder: true,
  });
  assert.deepEqual(errors, []);
});

test("Abort browser: timeout nativo produce TimeoutError", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("AbortController", "function wait(ms"),
  );
  const result = await page.evaluate(async () => {
    const signal = AbortSignal.timeout(0);
    try {
      await wait(1000, signal);
      return "unexpected success";
    } catch (error) {
      return error === signal.reason ? error.name : "wrong reason";
    }
  });
  assert.equal(result, "TimeoutError");
  assert.deepEqual(errors, []);
});

test("Abort browser: il listener DOM viene rimosso all'abort", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  await page.addScriptTag({
    content: `
    globalThis.messages = [];
    console.log = (...args) => messages.push(args[0]);
    ${snippet("AbortController", "window.addEventListener(")}
  `,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  assert.deepEqual(await page.evaluate(() => messages), []);
  assert.deepEqual(errors, []);
});

test("Pool browser: errori multipli non lasciano rifiuti non gestiti", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Promise avanzate", "async function runWithLimit"),
  );
  const result = await page.evaluate(async () => {
    const unhandled = [];
    const onUnhandled = (event) => {
      unhandled.push(String(event.reason));
      event.preventDefault();
    };
    addEventListener("unhandledrejection", onUnhandled);
    const started = [];
    let failSecond;
    const second = new Promise((resolve, reject) => {
      failSecond = reject;
    });
    const running = runWithLimit([0, 1, 2], 2, (item) => {
      started.push(item);
      return item === 0 ? Promise.reject(new Error("first")) : second;
    }).catch((error) => error.message);
    await new Promise((resolve) => setTimeout(resolve, 0));
    failSecond(new Error("second"));
    const message = await running;
    await new Promise((resolve) => setTimeout(resolve, 0));
    removeEventListener("unhandledrejection", onUnhandled);
    return { message, started, unhandled };
  });
  assert.deepEqual(result, {
    message: "first",
    started: [0, 1],
    unhandled: [],
  });
  assert.deepEqual(errors, []);
});

test("Async browser: loadUser valida la risposta e seleziona i campi", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Async Await", "async function loadUser(id,"),
  );
  await page.route("**/api/users/1", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: '{"id":1,"name":"Ada","secret":"hidden"}',
    }),
  );
  assert.deepEqual(await page.evaluate(() => loadUser(1)), {
    id: 1,
    name: "Ada",
  });
  assert.deepEqual(errors, []);
});

test("Async browser: il timeout annulla una richiesta Fetch senza risposta", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Async Await", "async function loadUser(id,"),
  );
  // Leave the intercepted request pending; only the note's AbortController ends it.
  await page.route("**/api/users/1", () => {});
  const result = await page.evaluate(async () => {
    try {
      await loadUser(1, 20);
      return "unexpected success";
    } catch (error) {
      return error.name;
    }
  });
  assert.equal(result, "AbortError");
  assert.deepEqual(errors, []);
});

for (const status of [200, 503]) {
  test(`Async browser: top-level await in un vero modulo, HTTP ${status}`, async (t) => {
    const { page, errors } = await fixture(t, "<main></main>");
    await page.route("**/config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: snippet(
          "Async Await",
          'const response = await fetch("/api/config")',
        ),
      }),
    );
    await page.route("**/api/config", (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: '{"theme":"dark"}',
      }),
    );
    const result = await page.evaluate(async () => {
      try {
        const { config } = await import("/config.js");
        return { config };
      } catch (error) {
        return { error: error.message };
      }
    });
    assert.deepEqual(
      result,
      status === 200 ? { config: { theme: "dark" } } : { error: "HTTP 503" },
    );
    assert.deepEqual(errors, []);
  });
}

test("Event Loop: ordine A D C B con timer e microtask reali", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  await page.addScriptTag({
    content: `
    globalThis.messages = [];
    console.log = (...args) => messages.push(args[0]);
    ${snippet("Event Loop", 'console.log("A")')}
  `,
  });
  await page.waitForFunction(() => messages.includes("B"));
  assert.deepEqual(await page.evaluate(() => messages), ["A", "D", "C", "B"]);
  assert.deepEqual(errors, []);
});

test("Event Loop: queueMicrotask e reazioni Promise condividono l'ordine", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  await page.addScriptTag({
    content: `
    globalThis.messages = [];
    console.log = (...args) => messages.push(args[0]);
    ${snippet("Event Loop", 'console.log("micro 1")')}
  `,
  });
  await page.waitForFunction(() => messages.includes("timer"));
  assert.deepEqual(await page.evaluate(() => messages), [
    "sync",
    "micro 1",
    "micro 2",
    "micro 3",
    "timer",
  ]);
  assert.deepEqual(errors, []);
});

test("Event Loop: somma a blocchi lascia eseguire un altro timer", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Event Loop", "function sumInChunks"),
  );
  const result = await page.evaluate(async () => {
    const events = [];
    const total = sumInChunks([1, 2, 3, 4], 1).then((value) => {
      events.push("sum done");
      return value;
    });
    setTimeout(() => events.push("other task"), 0);
    const value = await total;
    let errorName;
    try {
      await sumInChunks([1, NaN], 1);
    } catch (error) {
      errorName = error.name;
    }
    return { value, events, errorName };
  });
  assert.deepEqual(result, {
    value: 10,
    events: ["other task", "sum done"],
    errorName: "TypeError",
  });
  assert.deepEqual(errors, []);
});

test("Callback: dispatchEvent invoca il listener sincronicamente", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  const messages = [];
  page.on("console", (message) => messages.push(message.text()));
  await page.addScriptTag({
    content: snippet("Callback", "const target = new EventTarget"),
  });
  assert.deepEqual(messages, ["prima", "listener", "dopo"]);
  assert.deepEqual(errors, []);
});

test("Callback: listener del pulsante e cleanup usano lo stesso riferimento", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("Callback", '<button id="save"', "html"),
    snippet("Callback", "function handleClick"),
  );
  const messages = [];
  page.on("console", (message) => messages.push(message.text()));
  await page.locator("#save").click();
  assert.equal(messages.length, 1);
  await page.evaluate(() => {
    cleanup();
    cleanup();
  });
  await page.locator("#save").click();
  assert.equal(messages.length, 1);
  assert.deepEqual(errors, []);
});

test("Promise: loadUsers con Fetch reale e risposte HTTP intercettate", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Promises", "function loadUsers"),
  );
  const cases = [
    {
      status: 200,
      body: '[{"id":1,"name":"Ada","secret":"hidden"}]',
      expected: { users: [{ id: 1, name: "Ada" }] },
    },
    {
      status: 500,
      body: "{}",
      expected: { error: "Error", message: "HTTP 500" },
    },
    { status: 200, body: "{", expectedError: "SyntaxError" },
    {
      status: 200,
      body: '[{"id":0,"name":"Ada"}]',
      expected: { error: "TypeError", message: "Utente non valido" },
    },
  ];
  for (const current of cases) {
    await page.route("**/api/users", (route) =>
      route.fulfill({
        status: current.status,
        contentType: "application/json",
        body: current.body,
      }),
    );
    const result = await page.evaluate(async () => {
      try {
        return { users: await loadUsers() };
      } catch (error) {
        return { error: error.name, message: error.message };
      }
    });
    if (current.expectedError)
      assert.equal(result.error, current.expectedError);
    else assert.deepEqual(result, current.expected);
    await page.unroute("**/api/users");
  }
  assert.deepEqual(errors, []);
});

test("Promise: esecutore sincrono e handler differiti anche in browser", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  await page.addScriptTag({
    content: `
    globalThis.messages = [];
    console.log = (...args) => messages.push(args[0]);
    ${snippet("Promises", 'console.log("executor")')}
  `,
  });
  await page.waitForFunction(() => messages.includes("B"));
  assert.deepEqual(await page.evaluate(() => messages), [
    "A",
    "executor",
    "dopo resolve",
    "C",
    "B",
  ]);
  assert.deepEqual(errors, []);
});

test("Scope: binding globali, proprieta window e isolamento del modulo", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Scope", "var legacyValue"),
  );
  assert.deepEqual(
    await page.evaluate(() => [
      window.legacyValue,
      window.modernValue,
      modernValue,
    ]),
    [1, undefined, 2],
  );
  const messages = [];
  page.on("console", (message) => messages.push(message.text()));
  await page.addScriptTag({
    content: snippet("Context", "console.log(this === window)"),
  });
  assert.deepEqual(messages, ["true"]);
  await page.addScriptTag({
    type: "module",
    content:
      snippet("Scope", "// config.js") +
      "\n globalThis.moduleProbe = { api: getApiUrl(), value: modernValue, topThis: this === undefined };",
  });
  await page.waitForFunction(() => Boolean(globalThis.moduleProbe));
  assert.deepEqual(
    await page.evaluate(() => [moduleProbe, typeof apiUrl, window.apiUrl]),
    [
      { api: "https://api.example.com", value: 2, topThis: true },
      "undefined",
      undefined,
    ],
  );
  assert.deepEqual(errors, []);
});

test("Scope: il nome locale non collide con window.name", async (t) => {
  const { page, errors } = await fixture(t, "<main></main>");
  await page.evaluate(() => {
    window.name = "nome-finestra";
  });
  await page.addScriptTag({
    content: snippet("Scope", "const createdUserName"),
  });
  assert.deepEqual(
    await page.evaluate(() => {
      let errorName;
      try {
        createdUserName;
      } catch (error) {
        errorName = error.name;
      }
      return [createUser(), name, errorName];
    }),
    ["Luca", "nome-finestra", "ReferenceError"],
  );
  assert.deepEqual(errors, []);
});

test("Closures: mountCounter aggiorna il DOM e unmount rimuove il callback", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("Closures", '<button id="increment-count"', "html"),
    snippet("Closures", "function mountCounter"),
  );
  await page.locator("#increment-count").click({ clickCount: 2 });
  assert.equal(await page.locator("#count-value").textContent(), "2");
  await page.evaluate(() => {
    unmountCounter();
    unmountCounter();
  });
  await page.locator("#increment-count").click();
  assert.equal(await page.locator("#count-value").textContent(), "2");
  await page.evaluate(() =>
    mountCounter(
      document.querySelector("#increment-count"),
      document.querySelector("#count-value"),
    ),
  );
  await page.locator("#increment-count").click();
  assert.equal(await page.locator("#count-value").textContent(), "1");
  assert.deepEqual(
    await page.evaluate(() =>
      [null, document.createElement("div")].map((button) => {
        try {
          mountCounter(button, document.querySelector("#count-value"));
        } catch (error) {
          return error.name;
        }
      }),
    ),
    ["TypeError", "TypeError"],
  );
  assert.deepEqual(errors, []);
});

test("Context: listener riceve currentTarget, wrapper conserva this e puo essere rimosso", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("Context", '<button id="context-button"', "html"),
  );
  const messages = [];
  page.on("console", (message) => messages.push(message.text()));
  await page.addScriptTag({
    content: snippet(
      "Context",
      'const button = document.querySelector("#context-button")',
    ),
  });
  await page.locator("#context-button span").click();
  assert.deepEqual(messages, ["true", "SPAN"]);
  await page.addScriptTag({
    content:
      snippet("Context", "const increment = counter.increment;") +
      "\n" +
      snippet("Context", "const onIncrement"),
  });
  await page.locator("#context-button span").click();
  assert.equal(await page.evaluate(() => counter.count), 1);
  await page.evaluate(() => button.removeEventListener("click", onIncrement));
  await page.locator("#context-button span").click();
  assert.equal(await page.evaluate(() => counter.count), 1);
  assert.deepEqual(errors, []);
});

test("Classi nel browser: campo pubblico e setter ereditato restano distinti", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Private Fields e Static Blocks", "class BaseSettings"),
  );
  assert.deepEqual(
    await page.evaluate(() => [
      writes,
      fieldSettings.mode,
      assignedSettings.mode,
    ]),
    [["assignment"], "field", undefined],
  );
  assert.deepEqual(errors, []);
});

test("Classi nel browser: snapshot del carrello e contatore privato congelato", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<main></main>",
    snippet("Incapsulamento", "priceCents });"),
  );
  assert.equal(await page.evaluate(() => cart.getTotal()), 1200);
  await page.addScriptTag({
    content:
      snippet(
        "Private Fields e Static Blocks",
        "constructor(initialValue = 0)",
      ) +
      "\n" +
      snippet(
        "Private Fields e Static Blocks",
        "const counter = new Counter()",
      ),
  });
  assert.deepEqual(
    await page.evaluate(() => [
      counter.value,
      Object.isFrozen(counter),
      Reflect.ownKeys(counter),
      JSON.stringify(counter),
    ]),
    [1, true, [], "{}"],
  );
  assert.deepEqual(errors, []);
});

test("DOM: i nomi non diventano HTML e il secondo render non duplica righe", async (t) => {
  const note = "Manipolazione del DOM";
  const { page, errors } = await fixture(
    t,
    snippet(note, '<ul id="users">', "html"),
    snippet(note, "function renderUsers("),
  );
  assert.equal(await page.locator("#users li").count(), 2);
  assert.equal(await page.locator("#users strong").count(), 0);
  assert.equal(
    await page.locator("#users li").nth(1).textContent(),
    "<strong>Grace</strong>",
  );
  await page.evaluate(() =>
    renderUsers(document.querySelector("#users"), [{ name: "Linus" }]),
  );
  assert.equal(await page.locator("#users li").count(), 1);
  assert.equal(
    await page.evaluate(() => {
      try {
        renderUsers(null, []);
      } catch (error) {
        return error.name;
      }
    }),
    "TypeError",
  );
  assert.deepEqual(errors, []);
});

test("DOM: inizializzazione sia durante il parsing sia dopo DOMContentLoaded", async (t) => {
  const source = snippet("Manipolazione del DOM", "function onDomReady(");
  const first = await fixture(t, `<body><script>${source}</script></body>`);
  assert.equal(
    await first.page.locator("body").getAttribute("data-ready"),
    "true",
  );
  const second = await fixture(t, "<body></body>", source);
  assert.equal(
    await second.page.locator("body").getAttribute("data-ready"),
    "true",
  );
  assert.deepEqual([...first.errors, ...second.errors], []);
});

test("Eventi: delegazione, righe dinamiche, liste annidate e cleanup", async (t) => {
  const note = "Gestione Eventi";
  const { page, errors } = await fixture(
    t,
    snippet(note, "<ul data-user-list>", "html"),
    snippet(note, "function mountUserList("),
  );
  await page.locator("button span").click();
  assert.equal(await page.locator("[data-user-id]").count(), 0);
  await page.locator("[data-user-list]").evaluate((list) => {
    list.innerHTML =
      '<li data-user-id="43"><button type="button" data-action="delete">Dynamic</button></li>' +
      '<li data-user-id="outer"><ul data-user-list><li data-user-id="inner"><button type="button" data-action="delete">Nested</button></li></ul></li>';
  });
  await page.getByRole("button", { name: "Dynamic" }).click();
  assert.equal(await page.locator('[data-user-id="43"]').count(), 0);
  await page.getByRole("button", { name: "Nested" }).click();
  assert.equal(await page.locator('[data-user-id="inner"]').count(), 1);
  await page.evaluate(() => cleanupUserList());
  await page
    .locator("[data-user-list]")
    .first()
    .evaluate((list) => {
      list.innerHTML =
        '<li data-user-id="44"><button type="button" data-action="delete">After cleanup</button></li>';
    });
  await page.getByRole("button", { name: "After cleanup" }).click();
  assert.equal(await page.locator('[data-user-id="44"]').count(), 1);
  assert.deepEqual(errors, []);
});

test("Storage: preferenza persistita, default e dati non ammessi", async (t) => {
  const source = snippet("Browser Storage", "function saveTheme(");
  const { page, errors } = await fixture(t, "<body></body>", source);
  assert.equal(await page.evaluate(() => loadTheme()), "light");
  assert.equal(await page.evaluate(() => saveTheme("dark")), true);
  assert.equal(await page.evaluate(() => loadTheme()), "dark");
  await page.reload();
  await page.addScriptTag({ content: source });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.evaluate(() => localStorage.setItem("app:theme", "invalid"));
  assert.equal(await page.evaluate(() => loadTheme()), "light");
  assert.equal(
    await page.evaluate(() => {
      try {
        saveTheme("invalid");
      } catch (error) {
        return error.name;
      }
    }),
    "TypeError",
  );
  assert.deepEqual(errors, []);
});

test("Storage: accesso bloccato produce fallback, non crash", async (t) => {
  const { page, errors } = await fixture(t, "<body></body>");
  await page.evaluate(() =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    }),
  );
  await page.addScriptTag({
    content: snippet("Browser Storage", "function saveTheme("),
  });
  assert.equal(await page.evaluate(() => loadTheme()), "light");
  assert.equal(await page.evaluate(() => saveTheme("dark")), false);
  assert.deepEqual(errors, []);
});

test("Storage: quota esaurita viene segnalata al chiamante", async (t) => {
  const { page, errors } = await fixture(
    t,
    "<body></body>",
    snippet("Browser Storage", "function saveTheme("),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  assert.equal(await page.evaluate(() => saveTheme("dark")), false);
  assert.equal(await page.evaluate(() => loadTheme()), "light");
  assert.deepEqual(errors, []);
});

test("BOM: URL, UI e Indietro/Avanti restano sincronizzati", async (t) => {
  const { page, errors } = await fixture(
    t,
    snippet("BOM", '<p id="tab-status"', "html"),
    snippet("BOM", "function renderTabFromUrl("),
  );
  assert.equal(await page.locator("#tab-status").textContent(), "home");
  await page.locator("#tab-status").click();
  await page.evaluate(() => selectTab("settings"));
  const url = new URL(page.url());
  assert.equal(url.pathname, "/app/");
  assert.equal(url.searchParams.get("keep"), "1");
  assert.equal(url.hash, "#anchor");
  assert.equal(url.searchParams.get("tab"), "settings");
  assert.equal(await page.locator("#tab-status").textContent(), "settings");
  await page.goBack();
  await page.waitForFunction(
    () => document.querySelector("#tab-status").textContent === "home",
  );
  await page.goForward();
  await page.waitForFunction(
    () => document.querySelector("#tab-status").textContent === "settings",
  );
  assert.deepEqual(errors, []);
});

const formNote = "Form Handling e Validazione";
async function signup(t) {
  return fixture(
    t,
    snippet(formNote, 'action="/api/signup"', "html"),
    snippet(formNote, "let submitting = false"),
  );
}
async function fillSignup(page) {
  await page.getByLabel("Email").fill("ada@example.test");
  await page.getByLabel("Password").fill("test-password");
}

test("Form: HTML usa POST e il submit invalido non avvia fetch", async (t) => {
  const { page, errors } = await signup(t);
  assert.equal(await page.locator("form").getAttribute("method"), "post");
  await page.evaluate(() => {
    window.fetchCalls = 0;
    window.fetch = async () => {
      window.fetchCalls += 1;
      return { ok: true };
    };
    document.querySelector("form").requestSubmit();
  });
  assert.equal(await page.evaluate(() => window.fetchCalls), 0);
  assert.equal(await page.locator("button").isEnabled(), true);
  assert.deepEqual(errors, []);
});

test("Form: JSON corretto, blocco doppi submit e successo 204 senza parsing", async (t) => {
  const { page, errors } = await signup(t);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let receive;
  const received = new Promise((resolve) => {
    receive = resolve;
  });
  const requests = [];
  await page.route("**/api/signup", async (route) => {
    requests.push(route.request());
    receive(route.request());
    await gate;
    await route.fulfill({ status: 204, body: "" });
  });
  await fillSignup(page);
  await page.getByRole("button", { name: "Registrati" }).click();
  const request = await received;
  assert.equal(request.method(), "POST");
  assert.equal(request.headers()["content-type"], "application/json");
  assert.deepEqual(request.postDataJSON(), {
    email: "ada@example.test",
    password: "test-password",
  });
  assert.equal(await page.locator("button").isDisabled(), true);
  await page.evaluate(() => document.querySelector("form").requestSubmit());
  release();
  await page.waitForFunction(
    () =>
      document.querySelector("#signup-feedback").textContent ===
      "Registrazione completata.",
  );
  assert.equal(requests.length, 1);
  assert.equal(await page.locator("button").isEnabled(), true);
  assert.equal(await page.locator("form").getAttribute("aria-busy"), null);
  assert.equal(await page.getByLabel("Email").inputValue(), "ada@example.test");
  assert.deepEqual(errors, []);
});

for (const failure of ["http", "network"]) {
  test(`Form: errore ${failure} gestito, pulsante ripristinato e dati conservati`, async (t) => {
    const { page, errors } = await signup(t);
    await page.route("**/api/signup", (route) =>
      failure === "http"
        ? route.fulfill({ status: 500, body: "failure" })
        : route.abort("failed"),
    );
    await fillSignup(page);
    await page.getByRole("button", { name: "Registrati" }).click();
    await page.waitForFunction(() =>
      document
        .querySelector("#signup-feedback")
        .textContent.startsWith("Invio non riuscito"),
    );
    assert.equal(await page.locator("button").isEnabled(), true);
    assert.equal(
      await page.getByLabel("Password").inputValue(),
      "test-password",
    );
    assert.equal(await page.locator("form").getAttribute("aria-busy"), null);
    assert.deepEqual(errors, []);
  });
}

test("FormData: campi multipli selezionati ed esclusione dei disabilitati", async (t) => {
  const html = snippet(formNote, 'name="topics"', "html");
  const source =
    'const form = document.querySelector("form");\n' +
    snippet(formNote, 'const topics = formData.getAll("topics")');
  const { page, errors } = await fixture(
    t,
    `<form>${html}<input name="disabled" value="hidden" disabled><input name="number" type="number" value="2"></form>`,
    source,
  );
  assert.deepEqual(await page.evaluate(() => topics), ["javascript", "css"]);
  assert.equal(await page.evaluate(() => formData.get("disabled")), null);
  assert.equal(await page.evaluate(() => formData.get("number")), "2");
  assert.equal(
    await page.evaluate(() => Object.fromEntries(formData).topics),
    "css",
  );
  assert.deepEqual(errors, []);
});

test("File input: nessuna selezione non provoca TypeError", async (t) => {
  const { errors } = await fixture(
    t,
    snippet(formNote, 'type="file"', "html"),
    snippet(formNote, "const fileInput ="),
  );
  assert.deepEqual(errors, []);
});

test("Template: interpolazione non fidata resta testo nel DOM", async (t) => {
  const source =
    snippet("Template Literals", "function formatUserLabel(") +
    "\n" +
    snippet("Template Literals", "document.body.append(label)");
  const { page, errors } = await fixture(t, "<body></body>", source);
  assert.equal(
    await page.locator("span").textContent(),
    "<strong>Ada</strong> (attivo)",
  );
  assert.equal(await page.locator("strong").count(), 0);
  assert.deepEqual(errors, []);
});

async function reportFixture(t, reportHandler) {
  const result = await fixture(t, "<body></body>");
  const files = new Map([
    [
      "/report/",
      ["text/html", snippet("Dynamic Import", "<!-- index.html -->", "html")],
    ],
    [
      "/report/report-loader.js",
      ["text/javascript", snippet("Dynamic Import", "// report-loader.js")],
    ],
  ]);
  await result.page.route("http://notes.test/report/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/report/report.js") return reportHandler(route);
    const file = files.get(path);
    if (!file) return route.abort();
    return route.fulfill({ contentType: file[0], body: file[1] });
  });
  await result.page.goto("http://notes.test/report/");
  return result;
}

test("Dynamic import: lazy al click, attesa, nessun doppio caricamento e cache", async (t) => {
  let release;
  let received;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const requested = new Promise((resolve) => {
    received = resolve;
  });
  t.after(() => release());
  let calls = 0;
  const { page, errors } = await reportFixture(t, async (route) => {
    calls += 1;
    received();
    await gate;
    await route.fulfill({
      contentType: "text/javascript",
      body: snippet("Dynamic Import", "// report.js"),
    });
  });
  assert.equal(calls, 0);
  await page.getByRole("button", { name: "Calcola report" }).click();
  await requested;
  assert.equal(await page.getByRole("status").textContent(), "Caricamento...");
  assert.equal(await page.locator("button").isDisabled(), true);
  await page.evaluate(() =>
    document.querySelector("button").dispatchEvent(new Event("click")),
  );
  release();
  await page.waitForFunction(
    () =>
      document.querySelector("#report-status").textContent ===
      "3 valori, totale 14",
  );
  assert.equal(await page.locator("button").isEnabled(), true);
  await page.getByRole("button", { name: "Calcola report" }).click();
  await page.waitForFunction(
    () =>
      document.querySelector("#report-status").textContent ===
      "3 valori, totale 14",
  );
  assert.equal(calls, 1);
  assert.deepEqual(errors, []);
});

for (const failure of ["network", "evaluation"]) {
  test(`Dynamic import: errore ${failure} gestito e pulsante ripristinato`, async (t) => {
    const { page, errors } = await reportFixture(t, (route) =>
      failure === "network"
        ? route.abort("failed")
        : route.fulfill({
            contentType: "text/javascript",
            body: 'throw new Error("fixture failure");',
          }),
    );
    await page.getByRole("button", { name: "Calcola report" }).click();
    await page.waitForFunction(
      () =>
        document.querySelector("#report-status").textContent ===
        "Report non disponibile.",
    );
    assert.equal(await page.locator("button").isEnabled(), true);
    assert.deepEqual(errors, []);
  });
}

for (const timezoneId of ["UTC", "Europe/Rome"]) {
  test(`Date nel browser: ora legale e fuso esplicito con ambiente ${timezoneId}`, async (t) => {
    const note = "Date & Time";
    const source =
      snippet(note, "function parseUtcInstant") +
      "\n" +
      snippet(note, "function formatCreatedAt") +
      "\n" +
      snippet(note, "const after24Hours");
    const { page, errors } = await fixture(t, "<body></body>", source, {
      timezoneId,
    });
    const values = await page.evaluate(() => ({
      hours: [after24Hours.getHours(), nextLocalDay.getHours()],
      elapsed: (nextLocalDay - start) / 3600000,
      label: formatCreatedAt("2026-05-13T10:00:00.000Z"),
      utc: parseUtcInstant("2026-05-13T10:00:00.000Z").toISOString(),
    }));
    assert.deepEqual(
      values.hours,
      timezoneId === "Europe/Rome" ? [13, 12] : [12, 12],
    );
    assert.equal(values.elapsed, timezoneId === "Europe/Rome" ? 23 : 24);
    assert.match(values.label, /13 maggio 2026/);
    assert.match(values.label, /12:00/);
    assert.equal(values.utc, "2026-05-13T10:00:00.000Z");
    assert.deepEqual(errors, []);
  });
}
