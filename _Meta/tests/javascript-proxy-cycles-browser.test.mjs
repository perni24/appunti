import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";
import { cycleFiles } from "./cycle-examples.mjs";

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
  console.log(`Browser proxy/cycles: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(
  t,
  { name = "late", files = cycleFiles(name), markup = false } = {},
) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const requests = [];
  await context.route("**/*", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/demo/") {
      await route.fulfill({
        contentType: "text/html",
        body: markup
          ? snippet("Circular Dependencies", '<script type="module"', "html")
          : "<!doctype html><title>Fixture moduli</title>",
      });
    } else if (pathname.startsWith(`/demo/${name}/`)) {
      const file = pathname.slice(`/demo/${name}/`.length);
      requests.push(file);
      if (Object.hasOwn(files, file))
        await route.fulfill({
          contentType: "text/javascript",
          body: files[file],
        });
      else
        await route.fulfill({
          status: 404,
          contentType: "text/plain",
          body: "Fixture non trovata",
        });
    } else await route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  const logs = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "log") logs.push(message.text());
  });
  t.after(() => assert.deepEqual(errors, []));
  await page.goto("https://notes.test/demo/", { waitUntil: "load" });
  return { page, logs, requests };
}

test("Proxy browser: snippet nativi di receiver, invarianti, chiamata, costruzione e revoca", async (t) => {
  const { page } = await fixture(t);
  for (const [marker, expected] of [
    ['const target = { name: "Luca" }', [["Luca"], [false], [["name"]]]],
    ["const base =", [["child"]]],
    ["const locked =", [[false], ["TypeError"]]],
    ["function addToBase", [[12]]],
    ["class Item", [["demo", true]]],
    ["const immutable =", [["TypeError"]]],
    ["class Secret", [["TypeError"], ["TypeError"]]],
    ["proxy: temporary", [["TypeError"], ["Luca"]]],
  ]) {
    const logs = await page.evaluate(
      (source) => {
        const values = [];
        const log = console.log;
        console.log = (...args) => values.push(args);
        try {
          new Function(source)();
        } finally {
          console.log = log;
        }
        return values;
      },
      snippet("Proxy e Reflect", marker),
    );
    assert.deepEqual(logs, expected, marker);
  }
});

test("Proxy browser: factory e uso completi, fallimenti non modificano age", async (t) => {
  const { page } = await fixture(t);
  const logs = await page.evaluate(
    (source) => {
      const values = [];
      const log = console.log;
      console.log = (...args) => values.push(args);
      try {
        new Function(source)();
      } finally {
        console.log = log;
      }
      return values;
    },
    snippet("Proxy e Reflect", "function createAgeRecord") +
      "\n" +
      snippet("Proxy e Reflect", "const user = createAgeRecord"),
  );
  assert.deepEqual(logs, [[32], [false], [false], ["RangeError"], [32]]);
});

test("Proxy browser: defineProperty, cancellazione, accessor e freeze rispettano lo schema", async (t) => {
  const { page } = await fixture(t);
  await page.addScriptTag({
    content: snippet("Proxy e Reflect", "function createAgeRecord"),
  });
  assert.deepEqual(
    await page.evaluate(() => {
      const user = createAgeRecord(0);
      const rejected = [];
      for (const value of [NaN, "1", -1, 1.5]) {
        try {
          Object.defineProperty(user, "age", { value });
          rejected.push("accepted");
        } catch (error) {
          rejected.push(error.name);
        }
      }
      const accessor = Reflect.defineProperty(user, "age", {
        get() {
          return -1;
        },
      });
      const deleted = Reflect.deleteProperty(user, "age");
      const extra = Reflect.set(user, "extra", 1);
      Object.freeze(user);
      const changed = Reflect.set(user, "age", 2);
      return {
        rejected,
        accessor,
        deleted,
        extra,
        changed,
        age: user.age,
        keys: Object.keys(user),
      };
    }),
    {
      rejected: ["RangeError", "RangeError", "RangeError", "RangeError"],
      accessor: false,
      deleted: false,
      extra: false,
      changed: false,
      age: 0,
      keys: ["age"],
    },
  );
});

async function importEntry(page, name, file) {
  return page.evaluate(async (url) => {
    const logs = [];
    const previous = console.log;
    console.log = (...args) => logs.push(args);
    try {
      await import(url);
      return { logs, error: null };
    } catch (error) {
      return { logs, error: error.name };
    } finally {
      console.log = previous;
    }
  }, `/demo/${name}/${file}`);
}

for (const [name, entry, expected] of [
  ["tdz", "a.mjs", { logs: [], error: "ReferenceError" }],
  ["tdz", "b.mjs", { logs: [], error: "ReferenceError" }],
  ["late", "main.mjs", { logs: [["B usa A"], ["B usa A2"]], error: null }],
  ["classes", "user.mjs", { logs: [], error: "ReferenceError" }],
  ["classes", "admin.mjs", { logs: [], error: null }],
  ["composed", "main.mjs", { logs: [[true], [false]], error: null }],
  ["lazy", "main.mjs", { logs: [["CORE"]], error: null }],
]) {
  test(`Cicli browser: ${name}/${entry}, moduli nativi e cache pulita`, async (t) => {
    const { page } = await fixture(t, { name });
    assert.deepEqual(await importEntry(page, name, entry), expected);
  });
}

test("Cicli browser: markup module della nota esegue l'entry late", async (t) => {
  const { logs, requests } = await fixture(t, { markup: true });
  assert.deepEqual(logs, ["B usa A", "B usa A2"]);
  assert.deepEqual([...requests].sort(), ["a.mjs", "b.mjs", "main.mjs"]);
});

test("Cicli browser: funzione gia inizializzata legge un dato ancora in TDZ", async (t) => {
  const files = cycleFiles("late");
  files["b.mjs"] += "\nexport const tooEarly = getA();\n";
  const { page } = await fixture(t, { name: "late", files });
  assert.deepEqual(await importEntry(page, "late", "main.mjs"), {
    logs: [],
    error: "ReferenceError",
  });
});

test("Cicli browser: lazy non scarica subito feature e propaga un import fallito", async (t) => {
  const files = cycleFiles("lazy");
  delete files["feature.mjs"];
  const { page, requests } = await fixture(t, { name: "lazy", files });
  await page.evaluate(async () => {
    window.core = await import("/demo/lazy/core.mjs");
  });
  assert.deepEqual(requests, ["core.mjs"]);
  assert.equal(
    await page.evaluate(async () => {
      try {
        await core.runFeature();
        return "accepted";
      } catch (error) {
        return error.name;
      }
    }),
    "TypeError",
  );
  assert.deepEqual(requests, ["core.mjs", "feature.mjs"]);
});

test("Cicli browser: top-level await resta pendente nella finestra osservata", async (t) => {
  const { page, requests } = await fixture(t, { name: "waiting" });
  await page.evaluate(() => {
    window.state = "pending";
    import("/demo/waiting/a.mjs").then(
      () => (state = "fulfilled"),
      () => (state = "rejected"),
    );
  });
  await page.waitForFunction(() =>
    performance
      .getEntriesByType("resource")
      .some((entry) => entry.name.endsWith("/waiting/b.mjs")),
  );
  const state = await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return window.state;
  });
  assert.deepEqual([...requests].sort(), ["a.mjs", "b.mjs"]);
  assert.equal(state, "pending");
});
