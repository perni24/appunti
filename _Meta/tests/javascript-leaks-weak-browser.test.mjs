import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const leaks = "Memory Leaks";
const weak = "WeakMap e WeakSet";
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser leak/weak: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(
  t,
  { status = 200, body = '{"count":3}', pending = false } = {},
) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const requests = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/demo/index.html") {
      await route.fulfill({
        contentType: "text/html",
        body:
          snippet(leaks, '<section id="panel"', "html") +
          snippet(leaks, '<output id="summary"', "html"),
      });
    } else if (url.pathname === "/api/summary") {
      requests.push(url.pathname);
      if (!pending)
        await route.fulfill({ status, contentType: "application/json", body });
    } else await route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  t.after(() => assert.deepEqual(errors, []));
  await page.goto("http://notes.test/demo/index.html");
  await page.addScriptTag({
    content:
      snippet(leaks, "function mountPanelSize") +
      "\n" +
      snippet(leaks, "function mountSummary"),
  });
  return { page, requests, consoleErrors };
}

test("Leak browser: vista dimensioni, avvio e doppio cleanup dai Markdown", async (t) => {
  const { page } = await fixture(t);
  await page.evaluate(() => {
    document.querySelector("#panel").style.width = "120px";
    document.querySelector("#panel-width").textContent = "Originale";
  });
  await page.addScriptTag({ content: snippet(leaks, "let disposePanel =") });
  assert.equal(await page.locator("#panel-width").textContent(), "120");
  await page.evaluate(() => {
    document.querySelector("#panel").style.width = "180px";
    window.dispatchEvent(new Event("resize"));
  });
  assert.equal(await page.locator("#panel-width").textContent(), "180");
  await page.addScriptTag({ content: snippet(leaks, "disposePanel();") });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  assert.equal(await page.locator("#panel-width").textContent(), "Originale");
  assert.equal(await page.evaluate(() => disposePanel), null);
});

test("Leak browser: ripetuti mount/unmount preservano altri listener e bloccano callback vecchie", async (t) => {
  const { page } = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const panel = document.querySelector("#panel");
      const output = document.querySelector("#panel-width");
      let otherCalls = 0;
      const other = () => otherCalls++;
      window.addEventListener("resize", other);
      const registered = [];
      const add = window.addEventListener;
      window.addEventListener = function (type, callback, options) {
        if (type === "resize")
          registered.push({ callback, signal: options.signal });
        return add.call(this, type, callback, options);
      };
      try {
        for (let i = 0; i < 20; i++) {
          const dispose = mountPanelSize(panel, output);
          dispose();
          dispose();
        }
      } finally {
        window.addEventListener = add;
      }
      panel.remove();
      for (const registration of registered) registration.callback();
      window.dispatchEvent(new Event("resize"));
      window.removeEventListener("resize", other);
      return {
        count: registered.length,
        aborted: registered.every((entry) => entry.signal.aborted),
        otherCalls,
        text: output.textContent,
      };
    }),
    { count: 20, aborted: true, otherCalls: 1, text: "" },
  );
});

test("Leak browser: input invalidi rifiutati prima di listener o Fetch", async (t) => {
  const { page } = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const output = document.querySelector("#summary");
      const panel = document.querySelector("#panel");
      let adds = 0,
        fetches = 0;
      const add = window.addEventListener;
      window.addEventListener = function (...args) {
        adds++;
        return add.apply(this, args);
      };
      globalThis.fetch = () => {
        fetches++;
        throw new Error("unexpected fetch");
      };
      const cases = [
        () => mountPanelSize(null, output),
        () => mountPanelSize(panel, panel),
        () => mountSummary(null),
        () => mountSummary(panel),
      ];
      const results = cases.map((call) => {
        try {
          call();
          return "missing";
        } catch (error) {
          return error.name;
        }
      });
      window.addEventListener = add;
      return { results, adds, fetches };
    }),
    { results: Array(4).fill("TypeError"), adds: 0, fetches: 0 },
  );
});

test("Leak browser: nodo distaccato e metadati DOM, snippet completi", async (t) => {
  const { page } = await fixture(t);
  await page.addScriptTag({ content: snippet(leaks, "let removedNode =") });
  assert.equal(await page.evaluate(() => removedNode), null);
  await page.addScriptTag({ content: snippet(weak, "const elementData =") });
  assert.deepEqual(
    await page.evaluate(() => [
      button,
      document.querySelectorAll("button").length,
    ]),
    [null, 0],
  );
});

for (const [label, status, body, expected] of [
  ["successo", 200, '{"count":3}', "Totale: 3"],
  ["zero", 200, '{"count":0}', "Totale: 0"],
  ["HTTP fallito", 503, '{"count":3}', "Dati non disponibili"],
  ["JSON invalido", 200, "{", "Dati non disponibili"],
  ["schema negativo", 200, '{"count":-1}', "Dati non disponibili"],
  ["schema stringa", 200, '{"count":"3"}', "Dati non disponibili"],
]) {
  test(`Leak browser: summary ${label} con Fetch nativo`, async (t) => {
    const { page, requests } = await fixture(t, { status, body });
    await page.addScriptTag({ content: snippet(leaks, "let summaryView =") });
    await page.evaluate(() => summaryView.done);
    assert.deepEqual(requests, ["/api/summary"]);
    assert.equal(await page.locator("#summary").textContent(), expected);
    await page.addScriptTag({
      content: snippet(leaks, "summaryView.dispose();"),
    });
    assert.equal(await page.locator("#summary").textContent(), "");
    assert.equal(await page.evaluate(() => summaryView), null);
  });
}

test("Leak browser: abort nativo della richiesta mentre e pendente", async (t) => {
  const { page } = await fixture(t, { pending: true });
  const requested = page.waitForRequest("**/api/summary");
  await page.addScriptTag({ content: snippet(leaks, "let summaryView =") });
  await requested;
  assert.equal(
    await page.evaluate(async () => {
      summaryView.dispose();
      summaryView.dispose();
      await summaryView.done;
      return document.querySelector("#summary").textContent;
    }),
    "",
  );
});

for (const phase of ["response", "body", "rejection"]) {
  test(`Leak browser: risultato tardivo ${phase}, operazione che ignora abort`, async (t) => {
    const { page } = await fixture(t);
    assert.deepEqual(
      await page.evaluate(async (phase) => {
        const output = document.querySelector("#summary");
        output.textContent = "Prima";
        let resolveFetch, rejectFetch, resolveBody, signal;
        let jsonCalls = 0;
        let bodyStarted;
        const started = new Promise((resolve) => {
          bodyStarted = resolve;
        });
        globalThis.fetch = (_url, options) => {
          signal = options.signal;
          return new Promise((resolve, reject) => {
            resolveFetch = resolve;
            rejectFetch = reject;
          });
        };
        const view = mountSummary(output);
        const response = {
          ok: true,
          json() {
            jsonCalls++;
            bodyStarted();
            return new Promise((resolve) => {
              resolveBody = resolve;
            });
          },
        };
        if (phase === "body") {
          resolveFetch(response);
          await started;
        }
        view.dispose();
        view.dispose();
        if (phase === "response") resolveFetch(response);
        if (phase === "body") resolveBody({ count: 9 });
        if (phase === "rejection") rejectFetch(new Error("late error"));
        await view.done;
        return { text: output.textContent, aborted: signal.aborted, jsonCalls };
      }, phase),
      { text: "Prima", aborted: true, jsonCalls: phase === "body" ? 1 : 0 },
    );
  });
}

test("Weak browser: simboli, input non validi e metodi di inserimento nativi", async (t) => {
  const { page } = await fixture(t);
  await page.addScriptTag({
    content:
      snippet(weak, "const localKey") +
      "\n" +
      snippet(weak, "function stateFor"),
  });
  assert.deepEqual(
    await page.evaluate(() => {
      const key = {};
      const map = new WeakMap([[key, undefined]]);
      let computed = 0,
        eager = 0;
      const first = map.getOrInsertComputed(key, () => {
        computed++;
        return 2;
      });
      const second = map.getOrInsert(
        key,
        (() => {
          eager++;
          return 3;
        })(),
      );
      const fresh = {};
      const created = map.getOrInsertComputed(fresh, (input) => {
        computed++;
        return input === fresh;
      });
      let error;
      try {
        map.set(Symbol.for("key"), 1);
      } catch (caught) {
        error = caught.name;
      }
      const stateKey = {};
      const state = stateFor(stateKey);
      state.visits = 7;
      return [
        metadata.get(localKey),
        new WeakSet([localKey]).has(localKey),
        first === undefined,
        second === undefined,
        computed,
        eager,
        created,
        error,
        stateFor(stateKey) === state,
        stateFor(stateKey).visits,
      ];
    }),
    ["valore", true, true, true, 1, 1, true, "TypeError", true, 7],
  );
});
