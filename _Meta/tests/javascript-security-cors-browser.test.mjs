import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";
import {
  createDemoServer,
  listen,
  clientSource,
} from "./security-cors-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser security/CORS: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(t, { handler, frontHandler, markup = false } = {}) {
  const requests = [],
    frontRequests = [];
  let apiOrigin;
  const front = createServer((req, res) => {
    frontRequests.push({
      method: req.method,
      url: req.url,
      headers: req.headers,
    });
    if (frontHandler?.(req, res)) return;
    if (req.url === "/client.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(clientSource(apiOrigin));
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
        markup
          ? snippet("CORS", "<!doctype html>", "html")
          : "<!doctype html><title>Fixture</title><body></body>",
      );
    }
  });
  const frontOrigin = await listen(t, front);
  const api = handler
    ? createServer((req, res) => {
        req.resume();
        handler(req, res, frontOrigin);
      })
    : createDemoServer([frontOrigin]);
  api.prependListener("request", (req) =>
    requests.push({ method: req.method, url: req.url, headers: req.headers }),
  );
  apiOrigin = await listen(t, api);
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(frontOrigin, { waitUntil: "load" });
  return { page, context, frontOrigin, apiOrigin, requests, frontRequests };
}

async function fetchResult(f, options = {}, path = "/data") {
  return f.page.evaluate(
    async ({ url, options }) => {
      try {
        const response = await fetch(url, options);
        return {
          status: response.status,
          type: response.type,
          ok: response.ok,
          id: response.headers.get("x-request-id"),
          cookie: response.headers.get("set-cookie"),
          body: await response.text(),
        };
      } catch (error) {
        return { error: error.name };
      }
    },
    { url: f.apiOrigin + path, options },
  );
}

test("Sicurezza browser: rendering testuale non crea markup e link con policy esplicita", async (t) => {
  const f = await fixture(t);
  const dialogs = [];
  f.page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await f.page.addScriptTag({
    content: snippet("Sicurezza", "function renderUsername"),
  });
  assert.equal(
    await f.page.locator("strong").textContent(),
    "<img src=x onerror=alert(1)>",
  );
  assert.equal(await f.page.locator("img").count(), 0);
  assert.deepEqual(dialogs, []);
  assert.equal(
    await f.page.locator("a").getAttribute("rel"),
    "noopener noreferrer",
  );
  assert.equal(await f.page.locator("a").getAttribute("target"), "_blank");
  assert.equal(
    await f.page.locator("a").getAttribute("href"),
    "https://docs.example.com/guide",
  );
});

test("Sicurezza browser: validazione nome e URL, nessuna coercizione di oggetti", async (t) => {
  const f = await fixture(t);
  await f.page.addScriptTag({
    content: snippet("Sicurezza", "function renderUsername"),
  });
  const result = await f.page.evaluate(() => {
    const invalid = [
      "javascript:alert(1)",
      "blob:https://docs.example.com/fixture",
      "data:text/html,test",
      "http://docs.example.com",
      "https://docs.example.com:444",
      "https://docs.example.com.evil.test",
      "https://docs.example.com@evil.test",
      "https://user@docs.example.com",
      "/guide",
      null,
    ];
    const failures = invalid.map((value) => {
      try {
        helpUrl(value);
        return false;
      } catch {
        return true;
      }
    });
    let coerced = false;
    try {
      renderUsername({
        toString() {
          coerced = true;
          return "name";
        },
      });
    } catch {}
    const names = ["", "a".repeat(81), null].map((value) => {
      try {
        renderUsername(value);
        return false;
      } catch {
        return true;
      }
    });
    return {
      failures,
      names,
      coerced,
      url: helpUrl("https://DOCS.example.com:443/guide?q=a%20b"),
      length: renderUsername("a".repeat(80)).textContent.length,
    };
  });
  assert.deepEqual(result, {
    failures: Array(10).fill(true),
    names: [true, true, true],
    coerced: false,
    url: "https://docs.example.com/guide?q=a%20b",
    length: 80,
  });
});

test("Sicurezza browser: token CSRF e cookie HttpOnly inviati same-origin senza lettura cookie", async (t) => {
  let body;
  const f = await fixture(t, {
    frontHandler(req, res) {
      if (req.url !== "/api/preferences") return false;
      body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        res.writeHead(204);
        res.end();
      });
      return true;
    },
  });
  await f.context.addCookies([
    {
      name: "session",
      value: "fixture",
      url: f.frontOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await f.page.addScriptTag({
    content: snippet("Sicurezza", "async function saveTheme"),
  });
  await f.page.evaluate(() => saveTheme("dark", "a".repeat(64)));
  const request = f.frontRequests.find((req) => req.url === "/api/preferences");
  assert.equal(request.headers.cookie, "session=fixture");
  assert.equal(request.headers["x-csrf-token"], "a".repeat(64));
  assert.deepEqual(JSON.parse(body), { theme: "dark" });
  assert.equal(await f.page.evaluate(() => document.cookie), "");
});

test("Sicurezza browser: redirect rifiutato prima di inviare il token altrove", async (t) => {
  const f = await fixture(t, {
    frontHandler(req, res) {
      if (req.url !== "/api/preferences") return false;
      req.resume();
      res.writeHead(307, { Location: "/other" });
      res.end();
      return true;
    },
  });
  await f.page.addScriptTag({
    content: snippet("Sicurezza", "async function saveTheme"),
  });
  const result = await f.page.evaluate(async () => {
    try {
      await saveTheme("light", "a".repeat(64));
    } catch (error) {
      return error.name;
    }
  });
  assert.equal(result, "TypeError");
  assert.equal(f.frontRequests.filter((req) => req.url === "/other").length, 0);
});

test("CORS browser: HTML e moduli della demo, GET diretto e preflight PUT", async (t) => {
  const f = await fixture(t, { markup: true });
  await f.page.waitForFunction(() =>
    document.querySelector("#output").textContent.includes("demo-1"),
  );
  assert.deepEqual(JSON.parse(await f.page.locator("#output").textContent()), {
    message: "CORS demo",
    requestId: "demo-1",
  });
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["GET", "OPTIONS", "PUT"],
  );
  assert.equal(f.requests[1].headers["access-control-request-method"], "PUT");
  assert.equal(
    f.requests[1].headers["access-control-request-headers"],
    "content-type,x-demo",
  );
});

test("CORS browser: errore gestito nel markup se GET fallisce", async (t) => {
  const f = await fixture(t, {
    markup: true,
    handler(req, res) {
      res.writeHead(403);
      res.end();
    },
  });
  await f.page.waitForFunction(() =>
    document
      .querySelector("#output")
      .textContent.startsWith("Richiesta fallita"),
  );
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["GET"],
  );
});

test("CORS browser: POST semplice raggiunge il server anche senza risposta leggibile", async (t) => {
  const f = await fixture(t, {
    handler(req, res) {
      res.end("processed");
    },
  });
  assert.deepEqual(
    await fetchResult(f, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "demo",
    }),
    { error: "TypeError" },
  );
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["POST"],
  );
});

for (const [method, headers] of [
  ["DELETE", {}],
  ["PUT", { "X-Other": "1" }],
]) {
  test(`CORS browser: preflight rifiutato impedisce ${method}`, async (t) => {
    const f = await fixture(t);
    assert.deepEqual(await fetchResult(f, { method, headers }), {
      error: "TypeError",
    });
    assert.deepEqual(
      f.requests.map((req) => req.method),
      ["OPTIONS"],
    );
  });
}

test("CORS browser: OPTIONS 204 senza header non concede la richiesta", async (t) => {
  const f = await fixture(t, {
    handler(req, res) {
      res.writeHead(204);
      res.end();
    },
  });
  assert.deepEqual(await fetchResult(f, { method: "PUT" }), {
    error: "TypeError",
  });
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["OPTIONS"],
  );
});

test("CORS browser: preflight riuscito non compensa header mancanti sulla risposta finale", async (t) => {
  const f = await fixture(t, {
    handler(req, res, origin) {
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "PUT");
        res.writeHead(204);
      }
      res.end();
    },
  });
  assert.deepEqual(await fetchResult(f, { method: "PUT" }), {
    error: "TypeError",
  });
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["OPTIONS", "PUT"],
  );
});

test("CORS browser: credentials omit/default/include, HttpOnly e cookie same-site", async (t) => {
  const f = await fixture(t);
  await f.context.addCookies([
    {
      name: "session",
      value: "fixture",
      url: f.apiOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  for (const credentials of ["omit", "same-origin", "include"])
    assert.equal((await fetchResult(f, { credentials })).status, 200);
  assert.deepEqual(
    f.requests.map((req) => req.headers.cookie ?? null),
    [null, null, "session=fixture"],
  );
  assert.equal(await f.page.evaluate(() => document.cookie), "");
});

test("CORS browser: preflight non porta il cookie ma la richiesta PUT si", async (t) => {
  const f = await fixture(t);
  await f.context.addCookies([
    {
      name: "session",
      value: "fixture",
      url: f.apiOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await f.page.evaluate(async () => {
    const client = await import("/client.js");
    await client.writeDemo();
  });
  assert.deepEqual(
    f.requests.map((req) => [req.method, req.headers.cookie ?? null]),
    [
      ["OPTIONS", null],
      ["PUT", "session=fixture"],
    ],
  );
});

test("CORS browser: wildcard funziona con omit ma non include anche senza cookie", async (t) => {
  const f = await fixture(t, {
    handler(req, res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.end("public");
    },
  });
  assert.equal((await fetchResult(f, { credentials: "omit" })).body, "public");
  assert.deepEqual(await fetchResult(f, { credentials: "include" }), {
    error: "TypeError",
  });
  assert.ok(f.requests.every((req) => !req.headers.cookie));
});

test("CORS browser: cookie gia inviato anche quando Allow-Credentials manca", async (t) => {
  const f = await fixture(t, {
    handler(req, res, origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.end("ok");
    },
  });
  await f.context.addCookies([
    {
      name: "session",
      value: "fixture",
      url: f.apiOrigin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  assert.deepEqual(await fetchResult(f, { credentials: "include" }), {
    error: "TypeError",
  });
  assert.equal(f.requests[0].headers.cookie, "session=fixture");
});

test("CORS browser: Authorization esplicito sopravvive a omit, rifiuto senza permesso e allowlist", async (t) => {
  let allow = "X-Demo";
  const f = await fixture(t, {
    handler(req, res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", allow);
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Access-Control-Max-Age", "0");
      if (req.method === "OPTIONS") res.writeHead(204);
      res.end();
    },
  });
  const options = {
    credentials: "omit",
    headers: { Authorization: "Bearer fixture-not-secret" },
  };
  assert.deepEqual(await fetchResult(f, options), { error: "TypeError" });
  assert.deepEqual(
    f.requests.map((req) => req.method),
    ["OPTIONS"],
  );
  allow = "Authorization";
  assert.equal((await fetchResult(f, options)).status, 200);
  const actual = f.requests.at(-1);
  assert.equal(actual.headers.authorization, "Bearer fixture-not-secret");
  assert.equal(actual.headers.cookie, undefined);
});

test("CORS browser: osservazione di compatibilita Authorization e wildcard", async (t) => {
  const f = await fixture(t, {
    handler(req, res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      if (req.method === "OPTIONS") res.writeHead(204);
      res.end();
    },
  });
  const result = await fetchResult(f, {
    credentials: "omit",
    headers: { Authorization: "Bearer fixture-not-secret" },
  });
  assert.equal(
    f.requests[0].headers["access-control-request-headers"],
    "authorization",
  );
  // This is a compatibility probe, not a claim of conformance to Fetch.
  if (result.error) {
    assert.equal(result.error, "TypeError");
    assert.deepEqual(
      f.requests.map((req) => req.method),
      ["OPTIONS"],
    );
    t.diagnostic(`${browser.version()}: wildcard non copre Authorization`);
  } else {
    assert.equal(result.status, 200);
    assert.deepEqual(
      f.requests.map((req) => req.method),
      ["OPTIONS", "GET"],
    );
    assert.equal(
      f.requests[1].headers.authorization,
      "Bearer fixture-not-secret",
    );
    t.diagnostic(
      `${browser.version()}: divergenza Fetch, wildcard copre Authorization`,
    );
  }
});

test("CORS browser: header nascosto/esposto e Set-Cookie sempre filtrato", async (t) => {
  let expose = false;
  const f = await fixture(t, {
    handler(req, res, origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("X-Request-Id", "fixture-id");
      res.setHeader("Set-Cookie", "test=fixture; Path=/; SameSite=Lax");
      if (expose)
        res.setHeader(
          "Access-Control-Expose-Headers",
          "X-Request-Id, Set-Cookie",
        );
      res.end("ok");
    },
  });
  assert.equal((await fetchResult(f)).id, null);
  expose = true;
  const result = await fetchResult(f);
  assert.equal(result.id, "fixture-id");
  assert.equal(result.cookie, null);
});

test("CORS browser: header same-origin leggibile senza Expose-Headers", async (t) => {
  const f = await fixture(t, {
    frontHandler(req, res) {
      if (req.url !== "/same") return false;
      res.setHeader("X-Request-Id", "same-origin");
      res.end();
      return true;
    },
  });
  assert.equal(
    await f.page.evaluate(async () =>
      (await fetch("/same")).headers.get("x-request-id"),
    ),
    "same-origin",
  );
});

test("CORS browser: 404 leggibile non e errore di rete", async (t) => {
  const f = await fixture(t);
  const result = await fetchResult(f, { credentials: "include" }, "/missing");
  assert.equal(result.status, 404);
  assert.equal(result.ok, false);
  assert.equal(result.type, "cors");
});

test("CORS browser: no-cors resta opaco e same-origin blocca prima dell'invio", async (t) => {
  const f = await fixture(t);
  await f.page.addScriptTag({
    content: snippet("CORS", "async function opaqueDemo").replaceAll(
      "http://127.0.0.1:9000",
      f.apiOrigin,
    ),
  });
  assert.deepEqual(await f.page.evaluate(() => opaqueDemo()), {
    type: "opaque",
    status: 0,
    ok: false,
    body: "",
  });
  const before = f.requests.length;
  assert.deepEqual(await fetchResult(f, { mode: "same-origin" }), {
    error: "TypeError",
  });
  assert.equal(f.requests.length, before);
});
