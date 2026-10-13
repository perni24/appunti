import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";
import { parseNote } from "../../site/scripts/vault.mjs";
import { createDemoServer, listen } from "./security-cors-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");
const token = "a".repeat(64);
function save(fetch) {
  return vm.runInNewContext(
    snippet("Sicurezza", "async function saveTheme") + "\nsaveTheme",
    { fetch },
  );
}

for (const theme of ["light", "dark"]) {
  test(`Sicurezza: tema ${theme}, URL fisso, header e 204 senza corpo`, async () => {
    const calls = [];
    const controller = new AbortController();
    const fn = save(async (...args) => {
      calls.push(args);
      return new Response(null, { status: 204 });
    });
    assert.equal(
      await fn(theme, token, { signal: controller.signal }),
      undefined,
    );
    const [url, options] = calls[0];
    assert.equal(calls.length, 1);
    assert.equal(url, "/api/preferences");
    assert.equal(options.method, "POST");
    assert.equal(options.mode, "same-origin");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers["X-CSRF-Token"], token);
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), { theme });
    assert.equal(options.signal, controller.signal);
  });
}

test("Sicurezza: input invalidi rifiutati prima di Fetch", async () => {
  let calls = 0;
  const fn = save(() => {
    calls++;
    throw new Error("not expected");
  });
  for (const theme of ["", "LIGHT", "system", null, {}, 1])
    await assert.rejects(fn(theme, token), { name: "TypeError" });
  for (const value of [
    "",
    "a".repeat(63),
    "a".repeat(65),
    "A".repeat(64),
    "z".repeat(64),
    null,
    {},
    token + "\n",
  ])
    await assert.rejects(fn("light", value), { name: "TypeError" });
  assert.equal(calls, 0);
});

for (const status of [200, 201, 400, 401, 403, 500]) {
  test(`Sicurezza: HTTP ${status} non e il successo previsto`, async () => {
    await assert.rejects(
      save(async () => new Response("private detail", { status }))(
        "light",
        token,
      ),
      { message: `Salvataggio fallito: HTTP ${status}` },
    );
  });
}

test("Sicurezza: errori rete e abort propagati senza retry", async () => {
  for (const error of [
    new TypeError("network"),
    new DOMException("stop", "AbortError"),
  ]) {
    let calls = 0;
    await assert.rejects(
      save(async () => {
        calls++;
        throw error;
      })("dark", token),
      (e) => e === error,
    );
    assert.equal(calls, 1);
  }
});

test("CORS: terna di origine e porta HTTPS predefinita", () => {
  const logs = [];
  vm.runInNewContext(snippet("CORS", "const first ="), {
    URL,
    console: { log: (x) => logs.push(x) },
  });
  assert.deepEqual(logs, [true, false, false, false]);
});

test("CORS server: GET consentito, header esposto, Vary e no-store", async (t) => {
  const origin = "https://app.example.com";
  const url = await listen(t, createDemoServer([origin]));
  const response = await fetch(url + "/data", { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { message: "CORS demo" });
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    response.headers.get("access-control-allow-credentials"),
    "true",
  );
  assert.equal(
    response.headers.get("access-control-expose-headers"),
    "X-Request-Id",
  );
  assert.equal(response.headers.get("x-request-id"), "demo-1");
  assert.equal(response.headers.get("vary"), "Origin");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

for (const origin of [
  "null",
  "https://app.example.com.evil.test",
  "https://app.example.com:444",
  "http://app.example.com",
]) {
  test(`CORS server: origine non esatta rifiutata (${origin})`, async (t) => {
    const url = await listen(t, createDemoServer(["https://app.example.com"]));
    const response = await fetch(url + "/data", {
      headers: { Origin: origin },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
}

test("CORS server: allowlist copiata, due origini e client senza Origin", async (t) => {
  const origins = ["https://a.test", "https://b.test"];
  const api = createDemoServer(origins);
  origins.push("https://c.test");
  const url = await listen(t, api);
  for (const origin of origins) {
    const response = await fetch(url + "/data", {
      headers: { Origin: origin },
    });
    assert.equal(response.status, origin === "https://c.test" ? 403 : 200);
    await response.arrayBuffer();
  }
  const response = await fetch(url + "/data");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  await response.arrayBuffer();
});

test("CORS server: preflight valido, header case-insensitive e PUT senza dati persistiti", async (t) => {
  const origin = "https://app.example.com";
  const url = await listen(t, createDemoServer([origin]));
  const response = await fetch(url + "/data", {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": " Content-Type, X-DEMO ",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-max-age"), "600");
  assert.equal(await response.text(), "");
  const write = await fetch(url + "/data", {
    method: "PUT",
    headers: { Origin: origin },
    body: "discarded",
  });
  assert.equal(write.status, 204);
  const after = await fetch(url + "/data");
  assert.deepEqual(await after.json(), { message: "CORS demo" });
});

for (const [method, header] of [
  ["DELETE", "content-type"],
  ["PUT", "authorization"],
  ["GET", "x-other"],
]) {
  test(`CORS server: preflight rifiutato ${method}/${header}`, async (t) => {
    const origin = "https://app.example.com";
    const url = await listen(t, createDemoServer([origin]));
    const response = await fetch(url + "/data", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": header,
      },
    });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-methods"), null);
  });
}

test("CORS server: errori 404/405 mantengono CORS; OPTIONS normale non e preflight", async (t) => {
  const origin = "https://app.example.com";
  const url = await listen(t, createDemoServer([origin]));
  for (const [method, path, status] of [
    ["GET", "/missing", 404],
    ["POST", "/data", 405],
    ["OPTIONS", "/data", 405],
  ]) {
    const response = await fetch(url + path, {
      method,
      headers: { Origin: origin },
    });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    await response.arrayBuffer();
  }
});

test("Client CORS: schema, HTTP e nessun parsing del 204", async () => {
  const code = transformSync(
    snippet("CORS", "export async function readDemo"),
    { format: "cjs" },
  ).code;
  function client(fetch) {
    const context = vm.createContext({ module: { exports: {} }, fetch });
    vm.runInContext(code, context);
    return context.module.exports;
  }
  for (const value of [null, [], {}, { message: 1 }])
    await assert.rejects(client(async () => Response.json(value)).readDemo(), {
      name: "TypeError",
    });
  await assert.rejects(
    client(async () => new Response("not-json")).readDemo(),
    { name: "SyntaxError" },
  );
  await assert.rejects(
    client(async () => new Response(null, { status: 401 })).readDemo(),
    { message: "HTTP 401" },
  );
  await assert.rejects(
    client(async () => new Response(null, { status: 200 })).writeDemo(),
    { message: "HTTP 200" },
  );
  assert.equal(
    await client(async () => new Response(null, { status: 204 })).writeDemo(),
    undefined,
  );
});

test("Sicurezza/CORS: sintassi di tutti i sette blocchi JS", () => {
  let count = 0;
  for (const name of ["Sicurezza", "CORS"]) {
    const { tree } = parseNote(`Programmazione/JavaScript/Pagine/${name}.md`);
    for (const block of tree.children.filter(
      (node) => node.type === "code" && node.lang === "js",
    )) {
      transformSync(block.value, { format: "esm", target: "es2022" });
      count++;
    }
  }
  assert.equal(count, 7);
});
