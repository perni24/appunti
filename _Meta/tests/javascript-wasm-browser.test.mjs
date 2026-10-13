import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";
import { binary, note, loader, memoryHelpers } from "./wasm-example.mjs";

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
  console.log(`Browser WebAssembly: ${browser.version()}`);
});
after(async () => browser?.close());

const defaultApp = `${loader}\n${memoryHelpers}\nObject.assign(globalThis, {loadWasm, memoryRegion, writeUtf8, readUtf8});`;
async function fixture(
  t,
  {
    mime = "application/wasm",
    status = 200,
    bytes = binary,
    app = defaultApp,
    csp,
  } = {},
) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const requests = [];
  const logs = [];
  const errorLogs = [];
  const errors = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    if (url.pathname === "/demo/math.wasm") {
      await route.fulfill({
        status,
        body: Buffer.from(bytes),
        headers: { "Content-Type": mime },
      });
    } else if (url.pathname === "/demo/app.js") {
      await route.fulfill({
        contentType: "text/javascript",
        body: app + "\nglobalThis.appReady = true;",
      });
    } else if (url.pathname === "/demo/index.html") {
      await route.fulfill({
        contentType: "text/html",
        headers: csp ? { "Content-Security-Policy": csp } : {},
        body: snippet(note, "<!doctype html>", "html"),
      });
    } else await route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "log") logs.push(message.text());
    if (message.type() === "error") errorLogs.push(message.text());
  });
  t.after(() => assert.deepEqual(errors, []));
  await page.goto("http://notes.test/demo/index.html");
  await page.waitForFunction(() => globalThis.appReady === true);
  return { page, requests, logs, errorLogs };
}

test("Wasm browser: demo completo da Markdown, import.meta.url e memoria UTF-8", async (t) => {
  const app = [
    loader,
    snippet(note, "const imports ="),
    memoryHelpers,
    snippet(note, "const memory = instance.exports.memory"),
    snippet(note, "const anotherInstance"),
    "globalThis.demoState = {instance, compiledModule, anotherInstance};",
  ].join("\n");
  const { page, requests, logs } = await fixture(t, { app });
  // Il bridge console del runtime non serializza BigInt: verificalo nel realm browser.
  assert.equal(logs.length, 8);
  assert.deepEqual(
    logs.filter((value, index) => index !== 3),
    ["5", "Dal modulo: 30", "30", "5 6", "67", "Caff\u00e8", "9"],
  );
  assert.deepEqual(
    requests.filter((url) => url.endsWith(".wasm")),
    ["/demo/math.wasm"],
  );
  assert.deepEqual(
    await page.evaluate(() => [
      demoState.compiledModule instanceof WebAssembly.Module,
      demoState.anotherInstance instanceof WebAssembly.Instance,
      demoState.instance.exports.memory !==
        demoState.anotherInstance.exports.memory,
      String(demoState.instance.exports.increment64(41n)),
      typeof demoState.instance.exports.increment64(41n),
    ]),
    [true, true, true, "42", "bigint"],
  );
});

for (const mime of [
  "application/octet-stream",
  "application/wasm; charset=utf-8",
]) {
  test(`Wasm browser: MIME ${mime} usa fallback senza doppio download`, async (t) => {
    const { page, requests } = await fixture(t, { mime });
    assert.equal(
      await page.evaluate(async () => {
        const original = WebAssembly.instantiateStreaming;
        WebAssembly.instantiateStreaming = () => {
          throw Error("Streaming non atteso");
        };
        try {
          const { instance } = await loadWasm("./math.wasm", {
            env: { log() {} },
          });
          return instance.exports.add(3, 4);
        } finally {
          WebAssembly.instantiateStreaming = original;
        }
      }),
      7,
    );
    assert.equal(requests.filter((url) => url.endsWith(".wasm")).length, 1);
  });
}
test("Wasm browser: fallback quando instantiateStreaming non e disponibile", async (t) => {
  const { page } = await fixture(t);
  assert.equal(
    await page.evaluate(async () => {
      WebAssembly.instantiateStreaming = undefined;
      return (
        await loadWasm("./math.wasm", { env: { log() {} } })
      ).instance.exports.add(1, 2);
    }),
    3,
  );
});
test("Wasm browser: HTTP 404 genera un errore esplicito", async (t) => {
  const { page } = await fixture(t, { status: 404 });
  assert.match(
    await page.evaluate(async () => {
      try {
        await loadWasm("./math.wasm", { env: { log() {} } });
      } catch (error) {
        return error.message;
      }
    }),
    /HTTP 404/,
  );
});
test("Wasm browser: binario invalido non causa retry", async (t) => {
  const { page, requests } = await fixture(t, {
    bytes: new Uint8Array([1, 2, 3]),
  });
  assert.equal(
    await page.evaluate(async () => {
      try {
        await loadWasm("./math.wasm", { env: { log() {} } });
      } catch (error) {
        return error.name;
      }
    }),
    "CompileError",
  );
  assert.equal(requests.filter((url) => url.endsWith(".wasm")).length, 1);
});
test("Wasm browser: import errato, trap e i64 Number restano errori distinti", async (t) => {
  const { page } = await fixture(t);
  assert.deepEqual(
    await page.evaluate(async () => {
      const errors = [];
      try {
        await loadWasm("./math.wasm", { env: { log: 1 } });
      } catch (error) {
        errors.push(error.name);
      }
      const { instance } = await loadWasm("./math.wasm", { env: { log() {} } });
      for (const action of [
        () => instance.exports.firstByte(65536),
        () => instance.exports.increment64(41),
      ]) {
        try {
          action();
        } catch (error) {
          errors.push(error.name);
        }
      }
      return errors;
    }),
    ["LinkError", "RuntimeError", "TypeError"],
  );
});
test("Wasm browser: memoria cresce e helper ricreano le viste", async (t) => {
  const { page } = await fixture(t);
  assert.deepEqual(
    await page.evaluate(async () => {
      const { instance } = await loadWasm("./math.wasm", { env: { log() {} } });
      const memory = instance.exports.memory;
      const length = writeUtf8(memory, 1024, 128, "Caff\u00e8");
      const old = memoryRegion(memory, 1024, length);
      memory.grow(1);
      return [
        old.byteLength,
        memory.buffer.byteLength,
        readUtf8(memory, 1024, length),
        instance.exports.firstByte(1024),
      ];
    }),
    [0, 131072, "Caff\u00e8", 67],
  );
});
test("Wasm browser: signal gia abortito viene rispettato da Fetch", async (t) => {
  const { page } = await fixture(t);
  assert.equal(
    await page.evaluate(async () => {
      const controller = new AbortController();
      controller.abort();
      try {
        await loadWasm(
          "./math.wasm",
          { env: { log() {} } },
          { signal: controller.signal },
        );
      } catch (error) {
        return error.name;
      }
    }),
    "AbortError",
  );
});
test("Wasm browser: CSP senza autorizzazione Wasm blocca la compilazione", async (t) => {
  const { page } = await fixture(t, {
    csp: "script-src 'self'; connect-src 'self'",
  });
  assert.equal(
    await page.evaluate(async () => {
      try {
        await loadWasm("./math.wasm", { env: { log() {} } });
      } catch (error) {
        return error.name;
      }
    }),
    "CompileError",
  );
});
test("Wasm browser: autorizzazione CSP mirata consente la compilazione", async (t) => {
  const { page } = await fixture(t, {
    csp: "script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'",
  });
  assert.equal(
    await page.evaluate(async () => {
      return (
        await loadWasm("./math.wasm", { env: { log() {} } })
      ).instance.exports.add(6, 7);
    }),
    13,
  );
});
test("Wasm browser: avvio alternativo gestisce il rifiuto senza pageerror", async (t) => {
  const app = `${loader}\n${snippet(note, "async function startDemo")}`;
  const { page, errorLogs } = await fixture(t, { status: 500, app });
  // Attende la richiesta avviata dal modulo e poi la sua gestione dell'errore.
  await page.waitForLoadState("networkidle");
  assert.ok(
    errorLogs.some((message) => message.includes("Avvio Wasm fallito:")),
  );
});
