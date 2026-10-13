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
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser worker reali: ${browser.version()}`);
});
after(async () => {
  await browser?.close();
});
const browserTest = (name, fn) => test(name, { timeout: 20000 }, fn);
const swNote = "Service Workers e PWA";
const workerNote = "Web Workers";
const swSource = () => snippet(swNote, "const SCOPE =");
const prefix = "notes-demo:/demo/:";

// Real HTTP and fresh browser contexts: no registration or cache touches the user's site.
async function fixture(t) {
  const files = new Map([
    [
      "/demo/",
      {
        body: '<!doctype html><title>Worker test</title><link rel="icon" href="data:,"><main>Online demo</main>',
        type: "text/html",
      },
    ],
    [
      "/outside/",
      { body: "<!doctype html><title>Outside</title>", type: "text/html" },
    ],
    [
      "/demo/offline.html",
      {
        body: "<!doctype html><title>Offline</title><main>Offline demo</main>",
        type: "text/html",
      },
    ],
    [
      "/demo/app.v1.js",
      { body: 'globalThis.appVersion = "v1";', type: "text/javascript" },
    ],
    [
      "/demo/styles.v1.css",
      { body: "body { color: black; }", type: "text/css" },
    ],
    [
      "/demo/register.js",
      {
        body: snippet(swNote, "export async function registerAppWorker"),
        type: "text/javascript",
      },
    ],
    ["/demo/sw.js", { body: swSource(), type: "text/javascript" }],
    [
      "/demo/sum-client.js",
      {
        body: snippet(workerNote, "export async function sumInWorker"),
        type: "text/javascript",
      },
    ],
    [
      "/demo/sum-worker.js",
      {
        body: snippet(workerNote, "const id = typeof data?.id"),
        type: "text/javascript",
      },
    ],
    [
      "/demo/worker.js",
      {
        body: snippet(workerNote, 'event.data?.type !== "hello"'),
        type: "text/javascript",
      },
    ],
  ]);
  const requests = [];
  const failPaths = new Set();
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://local.test");
    requests.push({ url: request.url, method: request.method });
    if (failPaths.has(url.pathname)) {
      response.destroy();
      return;
    }
    const file = files.get(url.pathname);
    response.writeHead(file?.status ?? (file ? 200 : 404), {
      "Content-Type": file?.type || "text/plain",
      "Cache-Control": "no-store",
      ...file?.headers,
    });
    response.end(file?.body || "Missing fixture");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ serviceWorkers: "allow" });
  t.after(async () => {
    await context.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/demo/`);
  return { page, context, files, requests, failPaths, base, errors };
}

async function sumClient(f) {
  await f.page.evaluate(async () => {
    const NativeWorker = window.Worker;
    window.workerStats = { created: 0, terminated: 0 };
    window.workerInstances = [];
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        window.workerStats.created += 1;
        window.workerInstances.push(this);
      }
      terminate() {
        window.workerStats.terminated += 1;
        super.terminate();
      }
    };
    window.sumInWorker = (await import("/demo/sum-client.js")).sumInWorker;
  });
}

async function register(f) {
  return f.page.evaluate(async () => {
    const { registerAppWorker } = await import("/demo/register.js");
    window.registration = await registerAppWorker();
    return window.registration.scope;
  });
}

async function activate(f, control = true) {
  await register(f);
  await f.page.waitForFunction(
    () => window.registration.active?.state === "activated",
  );
  if (control) {
    await f.page.reload();
    await f.page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
    );
  }
}

browserTest(
  "Worker: moduli reali, somma, input vuoto e terminazione dopo successo",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    assert.deepEqual(
      await f.page.evaluate(async () => [
        await sumInWorker([1, 2, 3, 4]),
        await sumInWorker([]),
        await sumInWorker([-2, 0.5]),
      ]),
      [10, 0, -1.5],
    );
    assert.deepEqual(await f.page.evaluate(() => workerStats), {
      created: 3,
      terminated: 3,
    });
    assert.deepEqual(f.errors, []);
  },
);

browserTest(
  "Worker: array sparsi, tipi errati, NaN, Infinity e overflow falliscono",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    const result = await f.page.evaluate(async () => {
      const messages = [];
      for (const values of [
        [1, , 3],
        ["1"],
        [NaN],
        [Infinity],
        [Number.MAX_VALUE, Number.MAX_VALUE],
      ]) {
        try {
          await sumInWorker(values);
          messages.push("unexpected success");
        } catch (error) {
          messages.push(error.message);
        }
      }
      return { messages, stats: workerStats };
    });
    assert.equal(result.messages.includes("unexpected success"), false);
    assert.match(result.messages[0], /array denso/);
    assert.match(result.messages[4], /fuori intervallo/);
    assert.deepEqual(result.stats, { created: 5, terminated: 5 });
  },
);

browserTest(
  "Worker: validazione e abort gia richiesto non avviano un thread",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    const result = await f.page.evaluate(async () => {
      const outcomes = [];
      for (const args of [
        [null],
        [new Array(1_000_001)],
        [[], { timeoutMs: 0 }],
        [[], { signal: {} }],
      ]) {
        try {
          await sumInWorker(...args);
          outcomes.push("ok");
        } catch (error) {
          outcomes.push(error.name);
        }
      }
      const controller = new AbortController();
      controller.abort(0);
      try {
        await sumInWorker([], { signal: controller.signal });
      } catch (error) {
        outcomes.push(error);
      }
      return { outcomes, stats: workerStats };
    });
    assert.deepEqual(result.outcomes, [
      "TypeError",
      "TypeError",
      "RangeError",
      "TypeError",
      0,
    ]);
    assert.deepEqual(result.stats, { created: 0, terminated: 0 });
  },
);

browserTest(
  "Worker: DataCloneError non lascia un worker pendente",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    const name = await f.page.evaluate(async () => {
      try {
        await sumInWorker([() => 1]);
        return "ok";
      } catch (error) {
        return error.name;
      }
    });
    assert.equal(name, "DataCloneError");
    assert.deepEqual(await f.page.evaluate(() => workerStats), {
      created: 1,
      terminated: 1,
    });
  },
);

browserTest(
  "Worker: timeout e abort di un job silenzioso terminano e conservano il motivo",
  async (t) => {
    const f = await fixture(t);
    f.files.set("/demo/sum-worker.js", {
      body: 'self.addEventListener("message", () => {});',
      type: "text/javascript",
    });
    await sumClient(f);
    const result = await f.page.evaluate(async () => {
      const outcomes = [];
      try {
        await sumInWorker([1], { timeoutMs: 50 });
      } catch (error) {
        outcomes.push(error.message);
      }
      const controller = new AbortController();
      const task = sumInWorker([1], { signal: controller.signal });
      controller.abort(null);
      try {
        await task;
      } catch (error) {
        outcomes.push(error);
      }
      return { outcomes, stats: workerStats };
    });
    assert.deepEqual(result.outcomes, ["Timeout del worker", null]);
    assert.deepEqual(result.stats, { created: 2, terminated: 2 });
  },
);

browserTest(
  "Worker: file mancante, errori runtime e risposta fuori protocollo rifiutano il job",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    for (const body of [
      'throw new Error("worker boot failed");',
      'self.postMessage({ type: "unknown" });',
    ]) {
      f.files.set("/demo/sum-worker.js", { body, type: "text/javascript" });
      const message = await f.page.evaluate(async () => {
        try {
          await sumInWorker([1]);
          return "ok";
        } catch (error) {
          return error.message;
        }
      });
      assert.match(message, /worker boot failed|fuori protocollo/);
    }
    f.files.delete("/demo/sum-worker.js");
    const missing = await f.page.evaluate(async () => {
      try {
        await sumInWorker([1]);
        return "ok";
      } catch (error) {
        return error.message;
      }
    });
    assert.notEqual(missing, "ok");
    assert.notEqual(missing, "Timeout del worker");
    assert.deepEqual(await f.page.evaluate(() => workerStats), {
      created: 3,
      terminated: 3,
    });
    assert.deepEqual(f.errors, []);
  },
);

browserTest(
  "Worker: messageerror sintetico chiude il job e non lo completa due volte",
  async (t) => {
    const f = await fixture(t);
    await sumClient(f);
    const message = await f.page.evaluate(async () => {
      const task = sumInWorker([1]);
      const worker = workerInstances[0];
      worker.dispatchEvent(new MessageEvent("messageerror"));
      worker.dispatchEvent(new MessageEvent("messageerror"));
      try {
        await task;
        return "ok";
      } catch (error) {
        return error.message;
      }
    });
    assert.equal(message, "Messaggio non leggibile");
    assert.deepEqual(await f.page.evaluate(() => workerStats), {
      created: 1,
      terminated: 1,
    });
  },
);

browserTest(
  "Worker: esempio hello classico e transfer reale del buffer",
  async (t) => {
    const f = await fixture(t);
    const hello = await f.page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const worker = new Worker("./worker.js");
          worker.onmessage = ({ data }) => {
            worker.terminate();
            resolve(data);
          };
          worker.onerror = reject;
          worker.postMessage({ type: "hello", name: "Luca" });
        }),
    );
    assert.deepEqual(hello, { type: "greeting", text: "Ciao Luca" });
    f.files.set("/demo/bytes-worker.js", {
      body: "self.onmessage = ({ data }) => self.postMessage({ bytes: [...data.bytes], dom: typeof document });",
      type: "text/javascript",
    });
    await f.page.addScriptTag({
      content:
        'const worker = new Worker("./bytes-worker.js"); window.transferResult = new Promise(resolve => { worker.onmessage = ({ data }) => { worker.terminate(); resolve(data); }; });',
    });
    await f.page.addScriptTag({
      content: snippet(workerNote, 'worker.postMessage({ type: "bytes"'),
    });
    assert.deepEqual(
      await f.page.evaluate(async () => ({
        result: await transferResult,
        length: bytes.byteLength,
      })),
      {
        result: { bytes: [10, 20, 30], dom: "undefined" },
        length: 0,
      },
    );
  },
);

browserTest(
  "Service Worker: registrazione, ready e controllo della prima pagina sono distinti",
  async (t) => {
    const f = await fixture(t);
    assert.equal(await register(f), `${f.base}/demo/`);
    await f.page.waitForFunction(
      () => window.registration.active?.state === "activated",
    );
    assert.deepEqual(
      await f.page.evaluate(async () => ({
        active: Boolean((await navigator.serviceWorker.ready).active),
        controlled: Boolean(navigator.serviceWorker.controller),
      })),
      { active: true, controlled: false },
    );
    await f.page.reload();
    await f.page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
    );
    await f.page.goto(`${f.base}/outside/`);
    assert.equal(
      await f.page.evaluate(() => navigator.serviceWorker.controller),
      null,
    );
  },
);

browserTest(
  "Service Worker: activate elimina solo cache obsolete della propria app",
  async (t) => {
    const f = await fixture(t);
    await f.page.evaluate(async () => {
      await caches.open("notes-demo:/demo/:shell-old");
      await caches.open("notes-demo:/other/:shell-v1");
      await caches.open("unrelated-cache");
    });
    await activate(f);
    const names = await f.page.evaluate(() => caches.keys());
    assert.deepEqual(
      names.sort(),
      [
        `${prefix}shell-v1`,
        "notes-demo:/other/:shell-v1",
        "unrelated-cache",
      ].sort(),
    );
    assert.equal(
      await f.page.evaluate(
        async () =>
          (await (await caches.open("notes-demo:/demo/:shell-v1")).keys())
            .length,
      ),
      3,
    );
  },
);

browserTest(
  "Service Worker: offline navigazione usa fallback, asset in cache e API senza HTML",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    await f.context.setOffline(true);
    const response = await f.page.goto(`${f.base}/demo/new-page`);
    assert.equal(response.status(), 200);
    assert.match(await f.page.locator("main").innerText(), /Offline demo/);
    assert.match(
      await f.page.evaluate(() =>
        fetch("/demo/app.v1.js").then((r) => r.text()),
      ),
      /appVersion/,
    );
    assert.equal(
      await f.page.evaluate(() =>
        fetch("/demo/api").then(
          () => "unexpected",
          (e) => e.name,
        ),
      ),
      "TypeError",
    );
  },
);

browserTest(
  "Service Worker: cache eliminata e rete assente producono una vera Response 503",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    await f.page.evaluate(() => caches.delete("notes-demo:/demo/:shell-v1"));
    await f.context.setOffline(true);
    const response = await f.page.goto(`${f.base}/demo/no-cache`);
    assert.equal(response.status(), 503);
    assert.match(await response.text(), /Connessione non disponibile/);
  },
);

browserTest(
  "Service Worker: 404 e 500 di navigazione non diventano la pagina offline",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    for (const status of [404, 500]) {
      f.files.set(`/demo/error-${status}`, {
        status,
        body: `HTTP ${status}`,
        type: "text/html",
      });
      const response = await f.page.goto(`${f.base}/demo/error-${status}`);
      assert.equal(response.status(), status);
      assert.equal(await response.text(), `HTTP ${status}`);
    }
  },
);

browserTest(
  "Service Worker: URL esatta, query, POST, Authorization e Range sono distinti",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    f.files.set("/demo/app.v1.js", {
      body: "network-version",
      type: "text/javascript",
    });
    const results = await f.page.evaluate(async () => {
      const values = [];
      for (const [url, init] of [
        ["/demo/app.v1.js"],
        ["/demo/app.v1.js?x=1"],
        ["/demo/app.v1.js", { method: "POST" }],
        ["/demo/app.v1.js", { headers: { Authorization: "Bearer fixture" } }],
        ["/demo/app.v1.js", { headers: { Range: "bytes=0-1" } }],
      ])
        values.push(await (await fetch(url, init)).text());
      return values;
    });
    assert.match(results[0], /appVersion/);
    assert.deepEqual(results.slice(1), Array(4).fill("network-version"));
  },
);

browserTest(
  "Service Worker: precache fallito non crea una versione attiva",
  async (t) => {
    const f = await fixture(t);
    f.files.delete("/demo/styles.v1.css");
    await register(f);
    await f.page.waitForFunction(() => window.registration.installing === null);
    assert.equal(await f.page.evaluate(() => window.registration.active), null);
    assert.equal(
      await f.page.evaluate(() => navigator.serviceWorker.controller),
      null,
    );
  },
);

browserTest(
  "Service Worker: update resta waiting finche l'ultimo vecchio client non viene chiuso",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    const secondClient = await f.context.newPage();
    await secondClient.goto(`${f.base}/demo/`);
    assert.equal(
      await secondClient.evaluate(() =>
        Boolean(navigator.serviceWorker.controller),
      ),
      true,
    );
    f.files.set("/demo/sw.js", {
      body: swSource().replace("shell-v1", "shell-v2"),
      type: "text/javascript",
    });
    await f.page.evaluate(async () => {
      window.registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });
    await f.page.waitForFunction(() => Boolean(window.registration.waiting));
    assert.deepEqual(
      (await f.page.evaluate(() => caches.keys())).sort(),
      [`${prefix}shell-v1`, `${prefix}shell-v2`].sort(),
    );
    const observer = await f.context.newPage();
    await observer.goto(`${f.base}/outside/`);
    await f.page.close();
    await observer.evaluate(async () => {
      window.registration =
        await navigator.serviceWorker.getRegistration("/demo/");
    });
    assert.equal(
      await observer.evaluate(() => Boolean(window.registration.waiting)),
      true,
    );
    await secondClient.close();
    await observer.waitForFunction(
      () =>
        !window.registration.waiting &&
        window.registration.active?.state === "activated",
    );
    assert.deepEqual(await observer.evaluate(() => caches.keys()), [
      `${prefix}shell-v2`,
    ]);
  },
);

browserTest(
  "Service Worker: update con asset mancante mantiene attiva la versione precedente",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    f.files.set("/demo/sw.js", {
      body: swSource().replace("shell-v1", "shell-v2"),
      type: "text/javascript",
    });
    f.files.delete("/demo/styles.v1.css");
    await f.page.evaluate(async () => {
      window.registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
    });
    await f.page.waitForFunction(() => window.registration.installing === null);
    assert.deepEqual(
      await f.page.evaluate(() => ({
        active: registration.active.state,
        waiting: registration.waiting,
      })),
      {
        active: "activated",
        waiting: null,
      },
    );
    assert.match(
      await f.page.evaluate(() =>
        fetch("/demo/styles.v1.css").then((r) => r.text()),
      ),
      /color: black/,
    );
  },
);

browserTest(
  "Service Worker: unregister non elimina Cache Storage",
  async (t) => {
    const f = await fixture(t);
    await activate(f);
    assert.equal(
      await f.page.evaluate(async () =>
        (await navigator.serviceWorker.getRegistration()).unregister(),
      ),
      true,
    );
    assert.deepEqual(await f.page.evaluate(() => caches.keys()), [
      `${prefix}shell-v1`,
    ]);
    await f.page.reload();
    assert.equal(
      await f.page.evaluate(() => navigator.serviceWorker.controller),
      null,
    );
  },
);
