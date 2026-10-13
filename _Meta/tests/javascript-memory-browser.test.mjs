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
const note = "Memory Lifecycle";
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser memoria: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(t) {
  const context = await browser.newContext();
  t.after(() => context.close());
  await context.route("**/*", (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.setContent(snippet(note, '<button id="show-record"', "html"));
  await page.addScriptTag({ content: snippet(note, "function mountWidget") });
  return page;
}

test("Memoria browser: widget completo, reset dati e doppio cleanup dai Markdown", async (t) => {
  const page = await fixture(t);
  await page.addScriptTag({ content: snippet(note, "let widgetData =") });
  assert.equal(await page.evaluate(() => widgetData), null);
  await page.locator("button").click();
  assert.equal(await page.locator("button").textContent(), "ID: record-1");
  await page.addScriptTag({ content: snippet(note, "disposeWidget();") });
  assert.equal(await page.evaluate(() => disposeWidget), null);
  await page.locator("button").click();
  assert.equal(await page.locator("button").textContent(), "Mostra ID");
});

test("Memoria browser: cleanup conserva il record del chiamante e gli altri listener", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const button = document.querySelector("button");
      const data = Object.freeze({ id: "frozen", payload: [1, 2] });
      let otherCalls = 0;
      const other = () => otherCalls++;
      button.addEventListener("click", other);
      const cleanup = mountWidget(button, data);
      button.click();
      const mountedText = button.textContent;
      cleanup();
      button.click();
      button.removeEventListener("click", other);
      return {
        mountedText,
        text: button.textContent,
        id: data.id,
        payload: data.payload,
        otherCalls,
      };
    }),
    {
      mountedText: "ID: frozen",
      text: "Mostra ID",
      id: "frozen",
      payload: [1, 2],
      otherCalls: 2,
    },
  );
});

test("Memoria browser: ID interpretato come testo e non come markup", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const button = document.querySelector("button");
      const cleanup = mountWidget(button, {
        id: '<img src="invalid" onerror="alert(1)">',
      });
      button.click();
      const result = [button.textContent, button.children.length];
      cleanup();
      return result;
    }),
    ['ID: <img src="invalid" onerror="alert(1)">', 0],
  );
});

test("Memoria browser: parametri invalidi non registrano listener", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const button = document.querySelector("button");
      let additions = 0;
      const originalAdd = button.addEventListener;
      button.addEventListener = function (...args) {
        additions++;
        return originalAdd.apply(this, args);
      };
      const errors = [
        [null, { id: "x" }],
        [document.createElement("div"), { id: "x" }],
        [button, null],
        [button, {}],
        [button, { id: 1 }],
        [button, "x"],
      ].map((args) => {
        try {
          mountWidget(...args);
          return "missing error";
        } catch (error) {
          return error.name;
        }
      });
      button.addEventListener = originalAdd;
      return { errors, additions, text: button.textContent };
    }),
    { errors: Array(6).fill("TypeError"), additions: 0, text: "Mostra ID" },
  );
});

test("Memoria browser: cicli mount/unmount rimuovono esattamente i listener creati", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const button = document.querySelector("button");
      const added = [];
      const removed = [];
      const originalAdd = button.addEventListener;
      const originalRemove = button.removeEventListener;
      button.addEventListener = function (...args) {
        added.push(args);
        return originalAdd.apply(this, args);
      };
      button.removeEventListener = function (...args) {
        removed.push(args);
        return originalRemove.apply(this, args);
      };
      const cleanups = [];
      for (let i = 0; i < 20; i++) {
        const cleanup = mountWidget(button, { id: String(i) });
        cleanups.push(cleanup);
        button.click();
        if (button.textContent !== `ID: ${i}`)
          throw new Error("Widget non aggiornato");
        cleanup();
        cleanup();
      }
      button.addEventListener = originalAdd;
      button.removeEventListener = originalRemove;
      // Invocazioni conservate dal test: devono restare inattive dopo lo smontaggio.
      for (const [, listener] of added) listener();
      for (const cleanup of cleanups) cleanup();
      button.click();
      return {
        count: added.length,
        removed: removed.length,
        matched: added.every(
          (args, i) =>
            args[0] === removed[i][0] &&
            args[1] === removed[i][1] &&
            args[2] === removed[i][2],
        ),
        text: button.textContent,
      };
    }),
    { count: 20, removed: 20, matched: true, text: "Mostra ID" },
  );
});

test("Memoria browser: cleanup funziona anche dopo la rimozione del nodo", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const button = document.querySelector("button");
      const cleanup = mountWidget(button, { id: "detached" });
      button.remove();
      button.click();
      const before = button.textContent;
      cleanup();
      cleanup();
      button.click();
      return [before, button.textContent, button.isConnected];
    }),
    ["ID: detached", "Mostra ID", false],
  );
});

test("GC browser: WeakRef nativa e ramo assente simulato", async (t) => {
  const page = await fixture(t);
  await page.addScriptTag({
    content: snippet("Garbage Collection", "function readWeakLabel"),
  });
  assert.deepEqual(
    await page.evaluate(() => {
      const target = { label: "native" };
      const ref = new WeakRef(target);
      let calls = 0;
      return [
        readWeakLabel(ref),
        readWeakLabel({
          deref() {
            calls++;
            return undefined;
          },
        }),
        calls,
      ];
    }),
    ["native", null, 1],
  );
});

test("GC browser: registrazione e annullamento nativi senza attendere finalizer", async (t) => {
  const page = await fixture(t);
  const logs = [];
  page.on("console", (message) => {
    if (message.type() === "log") logs.push(message.text());
  });
  await page.addScriptTag({
    content: snippet("Garbage Collection", "const finalizers ="),
  });
  assert.deepEqual(logs, ["true", "false"]);
});
