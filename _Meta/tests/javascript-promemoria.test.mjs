import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import { once } from "node:events";
import { parseNote } from "../../site/scripts/vault.mjs";

const names = [
  "Sintassi essenziale",
  "Funzioni",
  "Array",
  "Oggetti Map e Set",
  "Stringhe e RegExp",
  "Numeri e date",
  "Promise e async await",
  "Moduli",
  "DOM ed eventi",
  "Fetch JSON e storage",
  "Errori e debug",
];
const dir = "Programmazione/JavaScript/Promemoria/Pagine/";
const trees = new Map(
  names.map((name) => [
    name,
    parseNote(dir + "JavaScript - " + name + ".md").tree,
  ]),
);
function blocks(name, heading) {
  const children = trees.get(name).children;
  const start = children.findIndex(
    (node) =>
      node.type === "heading" &&
      node.children.map((part) => part.value ?? "").join("") === heading,
  );
  assert.ok(start >= 0, name + ": " + heading);
  const result = [];
  for (const node of children.slice(start + 1)) {
    if (node.type === "heading") break;
    if (node.type === "code") result.push(node);
  }
  return result;
}
function code(name, heading, i = 0) {
  const result = blocks(name, heading)[i];
  assert.ok(result, name + ": missing block " + heading + "/" + i);
  return result.value;
}
const quiet = {
  log() {},
  error() {},
  warn() {},
  info() {},
  table() {},
  dir() {},
  trace() {},
};
function run(
  name,
  heading,
  expression = "undefined",
  globals = {},
  i = 0,
  prefix = "",
) {
  return vm.runInNewContext(
    '"use strict";\n' +
      prefix +
      "\n" +
      code(name, heading, i) +
      "\n;(" +
      expression +
      ")",
    { console: quiet, ...globals },
  );
}
function asyncRun(
  name,
  heading,
  expression = "undefined",
  globals = {},
  i = 0,
  prefix = "",
) {
  return vm.runInNewContext(
    "(async () => {\n" +
      prefix +
      "\n" +
      code(name, heading, i) +
      "\nreturn (" +
      expression +
      ");\n})()",
    { console: quiet, ...globals },
  );
}
const plain = (value) => structuredClone(value);
const require = createRequire(import.meta.url);
const siteRequire = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = siteRequire("esbuild");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "../../site/node_modules/playwright",
);
const exec = promisify(execFile);
let browser, root, temp, server, origin;
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-js-promemoria-"));
  const files = {
    "api.mjs": code("Moduli", "Export nominato"),
    "api-alternative.mjs": code("Moduli", "Export nominato", 1),
    "main.mjs": code("Moduli", "Import nominato e alias"),
    "format.mjs": code("Moduli", "Export e import predefinito"),
    "default.mjs": code("Moduli", "Export e import predefinito", 1),
    "namespace.mjs": code("Moduli", "Import namespace"),
    "index.mjs": code("Moduli", "Re-export"),
    "dynamic.mjs": code("Moduli", "Import dinamico"),
    "dynamic-destructure.mjs": code("Moduli", "Import dinamico", 1),
  };
  for (const [name, source] of Object.entries(files))
    await writeFile(path.join(root, name), source);
  server = createServer((req, res) => {
    if (req.url === "/slow") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write('{"waiting":');
      return;
    }
    const name = req.url.slice(1);
    if (Object.hasOwn(files, name)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(files[name]);
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<!doctype html><html><head><title>Fixture</title></head><body></body></html>",
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
});
after(async () => {
  await browser?.close();
  if (server?.listening) {
    const closed = new Promise((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    server.closeAllConnections();
    await closed;
  }
  if (root) {
    assert.equal(await realpath(root), root);
    assert.equal(path.dirname(root), temp);
    assert.ok(path.basename(root).startsWith("appunti-js-promemoria-"));
    await rm(root, { recursive: true, force: true });
  }
});

for (const name of names)
  test("Promemoria: syntax of all JS blocks in " + name, () => {
    for (const block of trees
      .get(name)
      .children.filter(
        (n) => n.type === "code" && ["javascript", "js"].includes(n.lang),
      )) {
      transformSync(block.value, {
        loader: "js",
        format: "esm",
        target: "esnext",
        logLevel: "silent",
      });
    }
  });

test("Sintassi: branches, ternary and destructuring defaults", () => {
  assert.equal(run("Sintassi essenziale", "Condizioni", "result"), "B");
  assert.equal(
    run("Sintassi essenziale", "Condizioni", "status", { active: false }, 1),
    "offline",
  );
  const vars = {
    user: { id: 7, name: "Ada", role: null },
    values: [1, 2, 3, 4],
  };
  assert.deepEqual(
    plain(
      run(
        "Sintassi essenziale",
        "Destructuring",
        "({ id, displayName, role, first, second, remaining })",
        vars,
      ),
    ),
    {
      id: 7,
      displayName: "Ada",
      role: null,
      first: 1,
      second: 2,
      remaining: [3, 4],
    },
  );
  assert.equal(
    run("Sintassi essenziale", "Destructuring", "role", {
      user: {},
      values: [],
    }),
    "user",
  );
});
test("Sintassi: nullish values preserve zero false and empty text", () => {
  for (const value of [0, false, "", null, undefined]) {
    assert.equal(
      run("Sintassi essenziale", "Confronti e valori mancanti", "label", {
        value,
        expected: 1,
        user: null,
      }),
      value ?? "Predefinito",
    );
  }
  assert.throws(
    () =>
      run("Sintassi essenziale", "Confronti e valori mancanti", "city", {
        value: null,
        expected: null,
      }),
    { name: "ReferenceError" },
  );
});
test("Sintassi: shallow spread and numeric rest", () => {
  const user = { address: { city: "Roma" } };
  const result = run(
    "Sintassi essenziale",
    "Spread e rest",
    "({ shared: copy.address === user.address, combined, sum: sum(1, 2, 3) })",
    { user, firstList: [1], secondList: [2] },
  );
  assert.deepEqual(plain(result), { shared: true, combined: [1, 2], sum: 6 });
});
test("Funzioni: declaration expression arrow and object return", () => {
  assert.equal(run("Funzioni", "Dichiarazione", "add(2, 3)"), 5);
  assert.equal(run("Funzioni", "Espressione", "add(2, 3)"), 5);
  assert.deepEqual(
    plain(run("Funzioni", "Arrow function", "createUser(7, 'Ada')")),
    { id: 7, name: "Ada" },
  );
});
test("Funzioni: defaults and absolute discount", () => {
  assert.equal(run("Funzioni", "Parametri", "greet(undefined)"), "Ciao Utente");
  assert.equal(run("Funzioni", "Parametri", "greet(null)"), "Ciao null");
  assert.equal(run("Funzioni", "Parametri", "total(5, 10, 20)", {}, 1), 25);
});
test("Funzioni: callback is synchronous and counters are independent", () => {
  assert.equal(run("Funzioni", "Callback", "execute(7, x => x + 1)"), 8);
  assert.equal(run("Funzioni", "Closure", "next()"), 3);
  assert.equal(run("Funzioni", "Closure", "createCounter()()"), 1);
});
test("Funzioni: bind keeps receiver while detached method loses it", () => {
  const prefix = code("Funzioni", "Metodi e this");
  assert.equal(
    run("Funzioni", "Metodi e this", "greetAda()", {}, 1, prefix),
    "Ciao Ada",
  );
  const user = run("Funzioni", "Metodi e this", "user");
  const fn = user.greet;
  assert.throws(() => fn(), { name: "TypeError" });
});
const arrayPrefix = code("Array", "Creazione e accesso");
test("Array: transforms and checks leave source unchanged", () => {
  assert.deepEqual(
    plain(
      run(
        "Array",
        "Trasformare",
        "({ values, doubled, filtered, total })",
        {},
        0,
        arrayPrefix,
      ),
    ),
    {
      values: [10, 20, 30],
      doubled: [20, 40, 60],
      filtered: [20, 30],
      total: 60,
    },
  );
  assert.deepEqual(
    plain(
      run(
        "Array",
        "Aggiungere e rimuovere",
        "[appended, prepended, withoutSecond]",
        {},
        0,
        arrayPrefix,
      ),
    ),
    [
      [10, 20, 30, 40],
      [0, 10, 20, 30],
      [10, 30],
    ],
  );
});
test("Array: numeric and named sorts plus extraction", () => {
  assert.deepEqual(
    plain(
      run(
        "Array",
        "Ordinare",
        "[ascending, descending, byName.map(x => x.name)]",
        {},
        0,
        arrayPrefix,
      ),
    ),
    [
      [10, 20, 30],
      [30, 20, 10],
      ["Ada", "Grace"],
    ],
  );
  assert.deepEqual(
    plain(
      run(
        "Array",
        "Estrarre e unire",
        "[combined, nested.flat(2)]",
        {},
        0,
        arrayPrefix,
      ),
    ),
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
  );
});
test("Array: untrusted role names have no inherited collisions", () => {
  const group = run("Array", "Raggruppare per chiave", "groupByRole");
  const users = ["__proto__", "constructor", "toString", "admin", "admin"].map(
    (role) => ({ role }),
  );
  const result = group(users);
  assert.equal(Object.getPrototypeOf(result), null);
  for (const role of ["__proto__", "constructor", "toString"])
    assert.equal(result[role][0].role, role);
  assert.equal(result.admin.length, 2);
  assert.equal(result.admin[0], users[3]);
  assert.deepEqual(Object.keys(group([])), []);
});
const objectPrefix = code("Oggetti Map e Set", "Oggetti");
test("Oggetti: projection drops all non-allowlisted fields", () => {
  const result = run(
    "Oggetti Map e Set",
    "Rimuovere senza modificare l'originale",
    "({ withoutPassword, publicUser, account })",
  );
  assert.equal(result.withoutPassword.token, "demo");
  assert.deepEqual(plain(result.publicUser), { id: 1, name: "Ada" });
  assert.equal(result.account.password, "demo");
});
test("Oggetti: Map deletion and Set mutation results", () => {
  assert.equal(
    run("Oggetti Map e Set", "Map", "usersById.size", {}, 0, objectPrefix),
    0,
  );
  assert.deepEqual(
    [...run("Oggetti Map e Set", "Set", "uniqueIds")],
    [2, 3, 4],
  );
  assert.deepEqual(
    plain(run("Oggetti Map e Set", "Rimuovere duplicati", "uniqueValues")),
    [1, 2, NaN],
  );
});
test("Stringhe: creation join matches groups and replacements", () => {
  assert.equal(run("Stringhe e RegExp", "Creazione", "message"), "Ciao Ada");
  assert.equal(run("Stringhe e RegExp", "Unire", "joined"), "Ada,Grace");
  assert.equal(run("Stringhe e RegExp", "Gruppi", "year"), "2026");
  assert.deepEqual(
    plain(run("Stringhe e RegExp", "Tutte le corrispondenze", "numbers")),
    ["12", "3"],
  );
  assert.equal(
    run("Stringhe e RegExp", "Sostituzione con callback", "result"),
    "Hello World",
  );
});
test("Stringhe: validation regex and stateful repeated tests", () => {
  const re = run("Stringhe e RegExp", "Espressione regolare", "pattern");
  assert.equal(re.test("user_01"), true);
  assert.equal(re.test("invalid space"), false);
  assert.equal(re.test("user\n"), false);
  assert.equal(run("Stringhe e RegExp", "Flag", "repeated.lastIndex"), 0);
});
test("Numeri: decimal display is text and binary rounding is not exact", () => {
  const result = run(
    "Numeri e date",
    "Arrotondare",
    "({ rounded, display })",
    { value: 1.005 },
    1,
  );
  assert.equal(result.rounded, 1);
  assert.equal(typeof result.display, "string");
  assert.equal(
    run("Numeri e date", "Date", "Number.isNaN(invalid.getTime())", {}, 2),
    true,
  );
});
for (const [zone, elapsed] of [
  ["UTC", 168],
  ["Europe/Rome", 167],
]) {
  test("Date: calendar week versus duration in " + zone, async () => {
    const source =
      "const date = new Date(2026, 2, 25, 12);\n" +
      code("Numeri e date", "Aggiungere giorni") +
      "\n" +
      code("Numeri e date", "Aggiungere giorni", 1) +
      "\nconsole.log(JSON.stringify({week:(nextDate-date)/3600000, day:(after24Hours-date)/3600000, originalDay:date.getDate()}));";
    const { stdout } = await exec(
      process.execPath,
      ["--input-type=module", "-e", source],
      {
        env: { ...process.env, TZ: zone },
        windowsHide: true,
        timeout: 10000,
      },
    );
    assert.deepEqual(JSON.parse(stdout), {
      week: elapsed,
      day: 24,
      originalDay: 25,
    });
  });
}
test("Errori: custom error and cause retain metadata", async () => {
  const ValidationError = run(
    "Errori e debug",
    "Errore personalizzato",
    "ValidationError",
  );
  const error = new ValidationError("bad", "email");
  assert.equal(error.name, "ValidationError");
  assert.equal(error.field, "email");
  const cause = new Error("original");
  await assert.rejects(
    asyncRun("Errori e debug", "Conservare la causa", "undefined", {
      saveData: async () => {
        throw cause;
      },
    }),
    (e) => e.cause === cause,
  );
});
test("Errori: timing cleanup runs even on rejection", async () => {
  const events = [];
  await assert.rejects(
    asyncRun("Errori e debug", "Misurare il tempo", "undefined", {
      loadData: async () => {
        throw new Error("fail");
      },
      console: {
        time: (name) => events.push(["start", name]),
        timeEnd: (name) => events.push(["end", name]),
      },
    }),
    /fail/,
  );
  assert.deepEqual(events, [
    ["start", "load"],
    ["end", "load"],
  ]);
});
test("Promise: returned processing and cleanup errors reach final catch", async () => {
  const events = [];
  const script = code("Promise e async await", "Consumare una Promise");
  const execute = () =>
    vm.runInNewContext(script, {
      loadData: () => Promise.resolve("data"),
      processData: async (value) => {
        events.push(value);
        return "processed";
      },
      hideLoader: () => {
        throw new Error("cleanup");
      },
      console: { error: (error) => events.push(error.message) },
    });
  await execute();
  assert.deepEqual(events, ["data", "cleanup"]);
});
test("Promise: return await catches and rethrows rejection", async () => {
  const errors = [];
  const fn = run("Promise e async await", "Async-await", "loadUser", {
    getUser: async () => {
      throw new Error("missing");
    },
    console: { error: (...args) => errors.push(args) },
  });
  await assert.rejects(fn(1), /missing/);
  assert.equal(errors.length, 1);
});
test("Promise: concurrent work starts together and output is input ordered", async () => {
  const calls = [],
    pending = [];
  const result = asyncRun(
    "Promise e async await",
    "Operazioni concorrenti",
    "[user, orders]",
    {
      userId: 1,
      getUser: () => {
        calls.push("user");
        return new Promise((r) => (pending[0] = r));
      },
      getOrders: () => {
        calls.push("orders");
        return new Promise((r) => (pending[1] = r));
      },
    },
  );
  assert.deepEqual(calls, ["user", "orders"]);
  pending[1]("orders");
  pending[0]("user");
  assert.deepEqual(plain(await result), ["user", "orders"]);
});
test("Promise: allSettled keeps both outcomes", async () => {
  const results = await asyncRun(
    "Promise e async await",
    "Risultati anche in caso di errore",
    "results",
    { tasks: [Promise.resolve(2), Promise.reject("failed")] },
  );
  assert.deepEqual(plain(results), [
    { status: "fulfilled", value: 2 },
    { status: "rejected", reason: "failed" },
  ]);
});
test("Promise: sequential loop waits before next start", async () => {
  const events = [];
  await asyncRun(
    "Promise e async await",
    "Sequenziale o concorrente",
    "undefined",
    {
      items: [1, 2],
      processItem: async (item) => {
        events.push("start" + item);
        await Promise.resolve();
        events.push("end" + item);
      },
    },
  );
  assert.deepEqual(events, ["start1", "end1", "start2", "end2"]);
});
test("Promise: bounded delay completes", async () => {
  await asyncRun("Promise e async await", "Creare una Promise", "undefined", {
    setTimeout,
  });
});
const timeoutCode = code(
  "Promise e async await",
  "Timeout fino alla lettura del corpo",
);
function timeoutFn(fetchImpl, timers = {}) {
  return vm.runInNewContext(timeoutCode + "\ngetJsonWithTimeout", {
    fetch: fetchImpl,
    AbortController,
    setTimeout,
    clearTimeout,
    ...timers,
  });
}
test("Promise timeout: awaits body before clearing timer", async () => {
  let resolveBody,
    cleared = false;
  let started;
  const bodyStarted = new Promise((resolve) => {
    started = resolve;
  });
  const fn = timeoutFn(
    async () => ({
      ok: true,
      status: 200,
      json: () =>
        new Promise((resolve) => {
          resolveBody = resolve;
          started();
        }),
    }),
    {
      setTimeout: () => 42,
      clearTimeout: (id) => {
        assert.equal(id, 42);
        cleared = true;
      },
    },
  );
  const result = fn("https://example.invalid");
  await bodyStarted;
  assert.equal(cleared, false);
  resolveBody({ ok: true });
  assert.deepEqual(await result, { ok: true });
  assert.equal(cleared, true);
});
test("Promise timeout: invalid duration avoids fetch", async () => {
  let calls = 0;
  const fn = timeoutFn(async () => {
    calls++;
  });
  for (const ms of [0, -1, 1.5, NaN, 60001, "50"])
    await assert.rejects(fn("x", ms), { name: "RangeError" });
  assert.equal(calls, 0);
});
test("Promise timeout: HTTP and parsing failures clear timer", async () => {
  for (const response of [
    new Response("error", { status: 500 }),
    new Response(null, { status: 204 }),
    new Response("not json", { status: 200 }),
  ]) {
    let cleared = false;
    const fn = timeoutFn(async () => response, {
      setTimeout: () => 42,
      clearTimeout: () => {
        cleared = true;
      },
    });
    await assert.rejects(fn("x"));
    assert.equal(cleared, true);
  }
});
test("Promise timeout: actual incomplete HTTP body is aborted", async () => {
  let reading = false;
  const fn = timeoutFn(async (...args) => {
    const response = await fetch(...args);
    const read = response.json.bind(response);
    response.json = () => {
      reading = true;
      return read();
    };
    return response;
  });
  await assert.rejects(fn(origin + "/slow", 500), { name: "AbortError" });
  assert.equal(reading, true);
});
const jsonCode = code("Fetch JSON e storage", "Lettura JSON comune");
const readJson = vm.runInNewContext(jsonCode + "\nreadJson");
test("Fetch: JSON and vendor types accepted, empty statuses skipped", async () => {
  for (const type of [
    "application/json",
    "APPLICATION/JSON; charset=utf-8",
    "application/problem+json",
  ]) {
    assert.deepEqual(
      await readJson(
        new Response('{"ok":true}', { headers: { "content-type": type } }),
      ),
      { ok: true },
    );
  }
  for (const status of [204, 205])
    assert.equal(await readJson(new Response(null, { status })), null);
});
test("Fetch: HTTP, media type and invalid JSON reject", async () => {
  await assert.rejects(
    readJson(new Response("bad", { status: 404 })),
    /HTTP 404/,
  );
  await assert.rejects(
    readJson(
      new Response("<html>", { headers: { "content-type": "text/html" } }),
    ),
    { name: "TypeError" },
  );
  await assert.rejects(
    readJson(
      new Response("{", { headers: { "content-type": "application/json" } }),
    ),
    { name: "SyntaxError" },
  );
});
test("Fetch: GET validates and projects entity fields", async () => {
  const entities = await asyncRun(
    "Fetch JSON e storage",
    "Richiesta GET",
    "entities",
    {
      readJson,
      fetch: async () =>
        new Response('[{"id":1,"name":"Ada","token":"private"}]', {
          headers: { "content-type": "application/json" },
        }),
    },
  );
  assert.deepEqual(plain(entities), [{ id: 1, name: "Ada" }]);
});
test("Fetch: GET rejects invalid schema", async () => {
  for (const value of [
    null,
    {},
    [null],
    [{ id: -1, name: "x" }],
    [{ id: 1, name: 42 }],
  ]) {
    await assert.rejects(
      asyncRun("Fetch JSON e storage", "Richiesta GET", "entities", {
        readJson,
        fetch: async () =>
          new Response(JSON.stringify(value), {
            headers: { "content-type": "application/json" },
          }),
      }),
      { name: "TypeError" },
    );
  }
});
test("Fetch: POST header/body and empty response", async () => {
  let sent;
  const entity = await asyncRun(
    "Fetch JSON e storage",
    "Richiesta POST JSON",
    "entity",
    {
      readJson,
      fetch: async (url, init) => {
        sent = { url, init };
        return new Response(null, { status: 204 });
      },
    },
  );
  assert.equal(entity, null);
  assert.equal(sent.init.method, "POST");
  assert.equal(sent.init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(sent.init.body), { name: "Example" });
});
test("Fetch: query text is encoded without changing values", () => {
  const endpoint = run("Fetch JSON e storage", "Parametri query", "endpoint", {
    URLSearchParams,
  });
  const url = new URL(endpoint, "https://example.invalid");
  assert.equal(url.searchParams.get("search"), "test & demo");
  assert.equal(url.searchParams.get("page"), "1");
});
async function nodeModule(file) {
  return exec(process.execPath, [file], {
    cwd: root,
    windowsHide: true,
    timeout: 10000,
  });
}
test("Moduli: named alias main runs with real module linking", async () => {
  const { stdout } = await nodeModule("main.mjs");
  assert.match(stdout, /\/api/);
  assert.match(stdout, /Ada/);
  assert.match(stdout, /1/);
});
test("Moduli: alternate exports, default, namespace and dynamic imports", async () => {
  await nodeModule("api-alternative.mjs");
  assert.match((await nodeModule("default.mjs")).stdout, /Ada/);
  assert.match((await nodeModule("namespace.mjs")).stdout, /Grace/);
  assert.match((await nodeModule("dynamic.mjs")).stdout, /Ada/);
  assert.match((await nodeModule("dynamic-destructure.mjs")).stdout, /Grace/);
});
test("Moduli: re-export API and live calls binding", async () => {
  const source =
    'import { fetchData, calls, formatName } from "./index.mjs"; fetchData(); console.log(JSON.stringify({calls,name:formatName(" Ada ")}));';
  const file = path.join(root, "check.mjs");
  await writeFile(file, source);
  assert.deepEqual(JSON.parse((await nodeModule("check.mjs")).stdout), {
    calls: 1,
    name: "Ada",
  });
});

async function pageTest(t, run) {
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await run(page, context);
  assert.deepEqual(errors, []);
}
async function inPage(page, source, expression = "undefined", setup = "") {
  return page.evaluate(
    async ({ source, expression, setup }) => {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {},
      ).constructor;
      return new AsyncFunction(
        setup + "\n" + source + "\nreturn (" + expression + ");",
      )();
    },
    { source, expression, setup },
  );
}
test("[Chrome] DOM: selectors return null and NodeList stays static", async (t) =>
  pageTest(t, async (page) => {
    const result = await inPage(
      page,
      code("DOM ed eventi", "Selezionare elementi"),
      "({missing:element===null, input:input===null, before:elements.length, after:document.querySelectorAll('.user').length})",
      "document.body.innerHTML='<div class=\"user\"></div>'; queueMicrotask(()=>{});",
    );
    assert.equal(result.missing, true);
    assert.equal(result.input, true);
    const staticLength = await inPage(
      page,
      code("DOM ed eventi", "Selezionare elementi") +
        "\ndocument.body.append(Object.assign(document.createElement('div'),{className:'user'}));",
      "elements.length",
    );
    assert.equal(staticLength, 1);
  }));
test("[Chrome] DOM: text remains text and existing nodes move", async (t) =>
  pageTest(t, async (page) => {
    const result = await inPage(
      page,
      code("DOM ed eventi", "Creare e inserire") +
        "\n" +
        code("DOM ed eventi", "Creare e inserire", 1),
      "({text:item.textContent, oldCount:list.children.length, same:container.firstChild===item, images:document.querySelectorAll('img').length})",
      'document.body.innerHTML="<ul></ul><div></div>"; const list=document.querySelector("ul"), container=document.querySelector("div"), user={name:"<img src=x onerror=alert(1)>"};',
    );
    assert.deepEqual(result, {
      text: "<img src=x onerror=alert(1)>",
      oldCount: 0,
      same: true,
      images: 0,
    });
  }));
test("[Chrome] DOM: remove listener and abort cleanup prevent callbacks", async (t) =>
  pageTest(t, async (page) => {
    for (const section of [
      ["Listener e cleanup", 0],
      ["Listener e cleanup", 2],
    ]) {
      const setup =
        "const button=document.createElement('button'); let calls=0; const console={log:()=>calls++};" +
        (section[1] === 2 ? "const handleClick=()=>calls++;" : "");
      const calls = await inPage(
        page,
        code("DOM ed eventi", ...section) + "\nbutton.click();",
        "calls",
        setup,
      );
      assert.equal(calls, 0);
    }
  }));
test("[Chrome] DOM: once listener fires once", async (t) =>
  pageTest(t, async (page) => {
    const result = await inPage(
      page,
      code("DOM ed eventi", "Listener e cleanup", 1) +
        "\nbutton.click();button.click();",
      "calls",
      "const button=document.createElement('button');let calls=0;const handler=()=>calls++;",
    );
    assert.equal(result, 1);
  }));
test("[Chrome] DOM: form keeps repeated fields and cancels native submit", async (t) =>
  pageTest(t, async (page) => {
    const result = await inPage(
      page,
      code("DOM ed eventi", "Impedire il comportamento predefinito") +
        "\nconst event=new Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(event);",
      "({tags,canceled:event.defaultPrevented})",
      'document.body.innerHTML="<form><input name=tag value=a><input name=tag value=b></form>";const form=document.querySelector("form");let tags;const console={log:value=>tags=value};',
    );
    assert.deepEqual(result, { tags: ["a", "b"], canceled: true });
  }));
test("[Chrome] DOM: delegation handles nested click but not nested list", async (t) =>
  pageTest(t, async (page) => {
    const html = code("DOM ed eventi", "Delegazione con confine locale", 0);
    const source = code("DOM ed eventi", "Delegazione con confine locale", 1);
    await page.setContent(html);
    await inPage(
      page,
      source,
      "undefined",
      "const list=document.querySelector('[data-user-list]');",
    );
    await page.locator("button span").click();
    assert.equal(await page.locator("[data-user-id]").count(), 0);
    const result = await inPage(
      page,
      source +
        "\n" +
        "list.querySelector('button').click();list.dispatchEvent(new Event('click',{bubbles:true}));",
      "list.querySelectorAll('[data-user-id]').length",
      'document.body.innerHTML="<ul data-user-list><li data-user-id=outer><ul data-user-list><li data-user-id=inner><button data-action=delete>Delete</button></li></ul></li></ul>";const list=document.querySelector("[data-user-list]");',
    );
    assert.equal(result, 2);
  }));
test("[Chrome] DOM: ready callback works before and after event", async (t) =>
  pageTest(t, async (page) => {
    assert.equal(
      await inPage(
        page,
        code("DOM ed eventi", "Attendere il DOM, anche dopo il caricamento"),
        "calls",
        "let calls=0;const initialize=()=>calls++;",
      ),
      1,
    );
    await page.setContent(
      "<script>window.readyCalls=0;function initialize(){window.readyCalls++}\n" +
        code("DOM ed eventi", "Attendere il DOM, anche dopo il caricamento") +
        "</script>",
    );
    await page.waitForFunction(() => window.readyCalls === 1);
  }));
test("[Chrome] Storage: guarded scalar operations and JSON settings", async (t) =>
  pageTest(t, async (page) => {
    await inPage(page, code("Fetch JSON e storage", "Local storage", 0));
    assert.equal(
      await page.evaluate(() => localStorage.getItem("demo:theme")),
      null,
    );
    await inPage(page, code("Fetch JSON e storage", "Local storage", 3));
    const settings = await inPage(
      page,
      code("Fetch JSON e storage", "Local storage", 2),
      "readSettings()",
    );
    assert.deepEqual(settings, { theme: "dark" });
  }));
test("[Chrome] Storage: invalid and blocked storage fall back safely", async (t) =>
  pageTest(t, async (page) => {
    for (const text of ["{", "null", '{"theme":"pink"}', '["dark"]']) {
      await page.evaluate(
        (value) => localStorage.setItem("demo:settings", value),
        text,
      );
      assert.deepEqual(
        await inPage(
          page,
          code("Fetch JSON e storage", "Local storage", 2),
          "readSettings()",
        ),
        { theme: "light" },
      );
    }
    const result = await inPage(
      page,
      code("Fetch JSON e storage", "Local storage", 2),
      "readSettings()",
      "const localStorage={getItem(){throw new DOMException('blocked','SecurityError')}};",
    );
    assert.deepEqual(result, { theme: "light" });
  }));
test("[Chrome] Storage: clear removes only fixture origin keys", async (t) =>
  pageTest(t, async (page) => {
    await page.evaluate(() => {
      localStorage.setItem("unrelated:demo", "x");
      localStorage.setItem("demo:settings", "{}");
    });
    await inPage(page, code("Fetch JSON e storage", "Local storage", 1));
    assert.equal(await page.evaluate(() => localStorage.length), 0);
  }));
test("[Chrome] Storage: quota failures are caught and session survives reload", async (t) =>
  pageTest(t, async (page) => {
    const failures = await inPage(
      page,
      code("Fetch JSON e storage", "Local storage", 3),
      "failures",
      "let failures=0;const console={error:()=>failures++};const localStorage={setItem(){throw new DOMException('quota','QuotaExceededError')}};",
    );
    assert.equal(failures, 1);
    await inPage(page, code("Fetch JSON e storage", "Session storage"));
    await page.reload();
    assert.deepEqual(
      await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem("demo:draft")),
      ),
      { title: "Bozza" },
    );
  }));
test("[Chrome] Fetch: immediate abort is handled without unhandled rejection", async (t) =>
  pageTest(t, async (page) => {
    const result = await inPage(
      page,
      jsonCode +
        "\n" +
        code("Fetch JSON e storage", "Annullare senza rifiuti non gestiti"),
      "({aborted:controller.signal.aborted, result:await handled})",
    );
    assert.deepEqual(result, { aborted: true, result: null });
  }));
test("[Chrome] Fetch: manual Authorization is retained with credentials omit", async (t) =>
  pageTest(t, async (page, context) => {
    await context.addCookies([
      { name: "fixture", value: "secret", url: origin },
    ]);
    let headers;
    await page.route("**/authorized", async (route) => {
      headers = await route.request().allHeaders();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"ok":true}',
      });
    });
    const data = await inPage(
      page,
      jsonCode +
        "\n" +
        code("Fetch JSON e storage", "Header di autorizzazione"),
      "data",
      `const url=${JSON.stringify(origin + "/authorized")}; const token="demo-token";`,
    );
    assert.deepEqual(data, { ok: true });
    assert.equal(headers.authorization, "Bearer demo-token");
    assert.equal(headers.cookie, undefined);
  }));
test("[Chrome] Moduli: HTTP ESM import and alias work in browser", async (t) =>
  pageTest(t, async (page) => {
    const result = await page.evaluate(async () => {
      const api = await import("/main.mjs");
      return api.fetchData();
    });
    assert.deepEqual(result, ["Ada", "Grace"]);
  }));
test("[Chrome] Debug: console.assert does not throw", async (t) =>
  pageTest(t, async (page) => {
    const value = await inPage(
      page,
      code("Errori e debug", "Asserzione di debug"),
      "'continued'",
      "const items=[];",
    );
    assert.equal(value, "continued");
  }));
