import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import { tmpdir } from "node:os";
import { realpath } from "node:fs/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { build, transformSync } = require("esbuild");
const toolsRoot = await realpath(
  process.env.REACT_TOOLCHAIN_PATH ??
    path.join(tmpdir(), "appunti-react-tools"),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const names = {
  router: "React Router",
  query: "Data Fetching e Cache",
  validation: "Validazione Dati",
};
const trees = Object.fromEntries(
  Object.entries(names).map(([key, name]) => [
    key,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function code(key, lang) {
  const blocks = trees[key].children.filter(
    (node) => node.type === "code" && node.lang === lang,
  );
  assert.equal(blocks.length, 1, `${key}: ${lang}`);
  return blocks[0].value;
}
const sources = Object.fromEntries(
  Object.keys(names).map((key) => [key, code(key, "jsx")]),
);
sources.schemas = code("validation", "js");
const users = JSON.parse(code("router", "json"));
function load(key) {
  const module = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    transformSync(sources[key], {
      loader: "jsx",
      jsx: "automatic",
      format: "cjs",
    }).code,
  )(toolRequire, module, module.exports);
  return module.exports;
}
const queryModule = load("query");
const validation = load("validation");
const schemas = load("schemas");
const { z } = toolRequire("zod");
const profile = { name: " Ada ", email: " ada@example.com ", years: " 2 " };
for (const [key, name] of Object.entries(names)) {
  test(`Sintassi: ${name}`, () => {
    for (const node of trees[key].children.filter(
      (n) => n.type === "code" && ["jsx", "js"].includes(n.lang),
    )) {
      assert.doesNotThrow(() =>
        transformSync(node.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Task: parsing restituisce copie e campi espliciti", () => {
  const input = Object.freeze([
    Object.freeze({ id: "a", title: "Prima", done: false, extra: 1 }),
  ]);
  assert.deepEqual(queryModule.parseTasks(input), [
    { id: "a", title: "Prima", done: false },
  ]);
  assert.deepEqual(queryModule.parseTasks([]), []);
  assert.notEqual(queryModule.parseTasks(input)[0], input[0]);
});
test("Task: forma, booleano e unicita degli ID", () => {
  const task = { id: "a", title: "Prima", done: false };
  for (const input of [
    null,
    {},
    [null],
    [{ ...task, done: "false" }],
    [{ ...task, id: " " }],
    [{ ...task, title: "" }],
    [task, task],
  ]) {
    assert.throws(() => queryModule.parseTasks(input));
  }
});
test("Zod: output normalizzato, input immutato e initializer indipendenti", () => {
  const input = Object.freeze({ ...profile, extra: "ignorato" });
  assert.deepEqual(validation.ProfileSchema.parse(input), {
    name: "Ada",
    email: "ada@example.com",
    years: 2,
  });
  assert.equal(input.years, " 2 ");
  assert.notEqual(validation.emptyProfile(), validation.emptyProfile());
});
test("Zod: anni zero e limite superiore; rifiuto delle conversioni ambigue", () => {
  for (const years of ["0", "60"])
    assert.equal(
      validation.ProfileSchema.parse({ ...profile, years }).years,
      Number(years),
    );
  for (const years of [
    "",
    " ",
    "02",
    "2.5",
    "-1",
    "61",
    "100",
    "2e1",
    "0x10",
    null,
    2,
  ]) {
    assert.equal(
      validation.ProfileSchema.safeParse({ ...profile, years }).success,
      false,
      String(years),
    );
  }
});
test("Zod: nome/email invalidi, errori globali e per campo", () => {
  const result = validation.ProfileSchema.safeParse({
    name: " ",
    email: "a@",
    years: "",
  });
  assert.equal(result.success, false);
  assert.deepEqual(Object.keys(z.flattenError(result.error).fieldErrors), [
    "name",
    "email",
    "years",
  ]);
  assert(
    z.flattenError(validation.ProfileSchema.safeParse(null).error).formErrors
      .length,
  );
  assert.equal(
    validation.ProfileSchema.safeParse({ ...profile, name: "a".repeat(81) })
      .success,
    false,
  );
});
test("Zod: range e percorso dell'errore, dati API e chiavi sconosciute", () => {
  assert.deepEqual(schemas.RangeSchema.parse({ min: 2, max: 2 }), {
    min: 2,
    max: 2,
  });
  assert(
    z.flattenError(schemas.RangeSchema.safeParse({ min: 3, max: 2 }).error)
      .fieldErrors.max.length,
  );
  assert.deepEqual(
    schemas.parseApiUser({ id: "a", name: "Ada", role: "admin" }),
    { id: "a", name: "Ada" },
  );
  assert.throws(() => schemas.parseApiUser({ id: 1, name: "Ada" }));
});
test("Zod: coercion non valida stringhe e parsing non e sanitizzazione", () => {
  assert.equal(z.coerce.number().parse(""), 0);
  assert.equal(
    z.strictObject({ name: z.string() }).safeParse({ name: "Ada", extra: true })
      .success,
    false,
  );
  assert.equal(
    z.looseObject({ name: z.string() }).parse({ name: "Ada", extra: true })
      .extra,
    true,
  );
  assert.equal(
    schemas.parseApiUser({ id: "a", name: "<b>Ada</b>" }).name,
    "<b>Ada</b>",
  );
});
test("QueryClient: chiavi equivalenti, deduplicazione e freschezza", async () => {
  const client = queryModule.makeQueryClient();
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const queryFn = async () => {
    calls++;
    await gate;
    return ["dato"];
  };
  try {
    const first = client.fetchQuery({
      queryKey: ["x", { a: 1, b: 2 }],
      queryFn,
    });
    const second = client.fetchQuery({
      queryKey: ["x", { b: 2, a: 1 }],
      queryFn,
    });
    release();
    assert.deepEqual(await first, await second);
    assert.equal(calls, 1);
    await client.fetchQuery({ queryKey: ["x", { a: 1, b: 2 }], queryFn });
    assert.equal(calls, 1);
    await client.invalidateQueries({ queryKey: ["x"] });
    assert.equal(
      calls,
      1,
      "Query inattiva: invalidazione senza refetch immediato",
    );
    await client.fetchQuery({ queryKey: ["x", { a: 1, b: 2 }], queryFn });
    assert.equal(calls, 2);
  } finally {
    release();
    client.clear();
  }
});

let browser, server, origin, fixture;
const bundles = new Map();
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function freshFixture() {
  return {
    tasks: [{ id: "a", title: "Studiare cache", done: false }],
    usersMode: "ok",
    readMode: "ok",
    patchMode: "ok",
    gets: 0,
    patches: [],
    closes: 0,
    getGate: null,
    patchGate: null,
    userGate: null,
    userGets: 0,
  };
}
function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}
before(async () => {
  for (const mode of ["development", "production"])
    for (const key of Object.keys(names)) {
      const output = await build({
        stdin: {
          contents: `import React,{StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as note from 'note:${key}';
const root=createRoot(document.getElementById('root'));
window.examples=note;
window.mount=(count=1)=>root.render(React.createElement(StrictMode,null,
  ...Array.from({length:count},(_,i)=>React.createElement(note.default,{key:i}))));
window.mount(); window.ready=true;`,
          loader: "jsx",
          resolveDir: toolsRoot,
        },
        bundle: true,
        write: false,
        platform: "browser",
        format: "esm",
        jsx: "automatic",
        nodePaths: [path.join(toolsRoot, "node_modules")],
        define: { "process.env.NODE_ENV": JSON.stringify(mode) },
        plugins: [
          {
            name: "markdown-examples",
            setup(api) {
              api.onResolve({ filter: /^note:/ }, (args) => ({
                path: args.path.slice(5),
                namespace: "notes",
              }));
              api.onLoad({ filter: /.*/, namespace: "notes" }, (args) => ({
                contents: sources[args.path],
                loader: "jsx",
                resolveDir: toolsRoot,
              }));
            },
          },
        ],
      });
      bundles.set(`/${mode}-${key}.js`, output.outputFiles[0].text);
    }
  server = createServer(async (req, res) => {
    const f = fixture;
    const url = new URL(req.url, "http://localhost");
    res.on("close", () => {
      if (!res.writableEnded) f.closes++;
    });
    try {
      if (bundles.has(url.pathname)) {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        return res.end(bundles.get(url.pathname));
      }
      if (url.pathname === "/users.json") {
        f.userGets++;
        if (f.userGate) await f.userGate.promise;
        if (f.usersMode === "http") return json(res, 503, {});
        if (f.usersMode === "json") {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end("{");
        }
        return json(
          res,
          200,
          f.usersMode === "schema"
            ? [{ id: 1 }]
            : f.usersMode === "empty"
              ? []
              : users,
        );
      }
      if (url.pathname === "/api/tasks" && req.method === "GET") {
        f.gets++;
        if (f.getGate) await f.getGate.promise;
        if (f.readMode === "http") return json(res, 503, {});
        if (f.readMode === "json") {
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end("{");
        }
        return json(
          res,
          200,
          f.readMode === "schema"
            ? [{ id: "a", title: "No", done: 0 }]
            : f.tasks,
        );
      }
      if (url.pathname.startsWith("/api/tasks/") && req.method === "PATCH") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const payload = JSON.parse(body);
        const id = decodeURIComponent(url.pathname.slice("/api/tasks/".length));
        f.patches.push({
          id,
          payload,
          url: req.url,
          contentType: req.headers["content-type"],
        });
        if (f.patchGate) await f.patchGate.promise;
        if (f.patchMode === "http") return json(res, 503, {});
        f.tasks = f.tasks.map((task) =>
          task.id === id
            ? { ...task, done: payload.done, title: "Titolo dal server" }
            : task,
        );
        if (f.patchMode === "uncertain") return json(res, 500, {});
        const task = f.tasks.find((task) => task.id === id);
        if (!task) return json(res, 404, {});
        return json(
          res,
          200,
          f.patchMode === "wrong-id" ? { ...task, id: "different" } : task,
        );
      }
      const mode = req.headers["x-test-mode"] ?? "development";
      const key = req.headers["x-test-demo"] ?? "router";
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        `<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture React</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/${mode}-${key}.js"></script></body></html>`,
      );
    } catch (error) {
      if (!res.destroyed) json(res, 500, { message: error.message });
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
  });
  console.log(
    `React ${toolRequire("react").version}; Router ${toolRequire("react-router/package.json").version}; Query ${toolRequire("@tanstack/react-query/package.json").version}; Zod ${toolRequire("zod/package.json").version}; Chrome ${browser.version()}`,
  );
});
after(async () => {
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
async function withPage(mode, key, run, options = {}) {
  fixture = Object.assign(freshFixture(), options.fixture);
  const f = fixture;
  const context = await browser.newContext({
    extraHTTPHeaders: { "x-test-mode": mode, "x-test-demo": key },
  });
  try {
    const page = await context.newPage();
    const errors = [],
      httpErrors = [],
      resourceErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (!["warning", "error"].includes(m.type())) return;
      if (/Failed to load resource/.test(m.text()))
        resourceErrors.push(m.text());
      else errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400)
        httpErrors.push([new URL(r.url()).pathname, r.status()]);
    });
    await page.goto(origin + (options.url ?? "/"));
    await page.waitForFunction(() => window.ready);
    await run(page, f);
    assert.deepEqual(errors, []);
    for (const [url, status] of httpErrors) {
      assert(
        options.httpErrors &&
          (url === "/users.json" || url.startsWith("/api/tasks")) &&
          [500, 503].includes(status),
        `${url}: ${status}`,
      );
    }
    if (!httpErrors.length) assert.deepEqual(resourceErrors, []);
  } finally {
    f.getGate?.resolve();
    f.patchGate?.resolve();
    f.userGate?.resolve();
    await context.close();
  }
}
const text = (page, value) => page.getByText(value, { exact: true }).waitFor();
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function until(predicate) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  assert(predicate(), "Condizione del server non raggiunta");
}
for (const mode of ["development", "production"]) {
  test(`Chrome ${mode}: router, filtro URL, history e layout`, () =>
    withPage(
      mode,
      "router",
      async (page) => {
        await page.getByRole("link", { name: "Ada", exact: true }).waitFor();
        assert.equal(
          await page
            .getByRole("link", { name: "Utenti", exact: true })
            .getAttribute("aria-current"),
          "page",
        );
        await page.getByLabel("Filtra utenti").fill("gr");
        await page.waitForURL(/q=gr/);
        assert.equal(new URL(page.url()).searchParams.get("lang"), "it");
        await page.getByRole("link", { name: "Grace", exact: true }).click();
        await page
          .getByRole("heading", { name: "Grace", exact: true })
          .waitFor();
        await page.goBack();
        await page.waitForURL(/q=gr/);
        assert.equal(await page.getByLabel("Filtra utenti").inputValue(), "gr");
        await page.getByLabel("Filtra utenti").fill("nessuno");
        await text(page, "Nessun utente.");
        await page.getByLabel("Filtra utenti").fill("");
        await page.waitForURL((url) => !url.searchParams.has("q"));
      },
      { url: "/?lang=it" },
    ));
  test(`Chrome ${mode}: router, apertura profonda e reload`, () =>
    withPage(
      mode,
      "router",
      async (page) => {
        await page
          .getByRole("heading", { name: "Grace", exact: true })
          .waitFor();
        await page.reload();
        await page
          .getByRole("heading", { name: "Grace", exact: true })
          .waitFor();
        await page
          .getByRole("link", { name: "Informazioni", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Informazioni", exact: true })
          .waitFor();
      },
      { url: "/users/2" },
    ));
  for (const [url, heading] of [
    ["/users/99", "Errore 404"],
    ["/users/no", "Errore 400"],
    ["/inesistente", "Pagina non trovata"],
  ]) {
    test(`Chrome ${mode}: router ${url}`, () =>
      withPage(
        mode,
        "router",
        async (page) => {
          await page
            .getByRole("heading", { name: heading, exact: true })
            .waitFor();
          await page
            .getByRole("link", { name: "Torna agli utenti", exact: true })
            .click();
          await page.getByLabel("Filtra utenti").waitFor();
        },
        { url },
      ));
  }
  for (const usersMode of ["http", "json", "schema", "empty"]) {
    test(`Chrome ${mode}: loader dati ${usersMode}`, () =>
      withPage(
        mode,
        "router",
        async (page) => {
          await text(
            page,
            usersMode === "empty"
              ? "Nessun utente."
              : `Errore ${usersMode === "http" ? 503 : 500}`,
          );
        },
        { fixture: { usersMode }, httpErrors: usersMode === "http" },
      ));
  }
  test(`Chrome ${mode}: navigazione cancellata non sovrascrive la nuova pagina`, () =>
    withPage(mode, "router", async (page, f) => {
      await page.getByRole("link", { name: "Ada", exact: true }).waitFor();
      f.userGate = deferred();
      const before = f.userGets;
      await page.getByRole("link", { name: "Ada", exact: true }).click();
      await text(page, "Caricamento pagina...");
      await until(() => f.userGets > before);
      await page
        .getByRole("link", { name: "Informazioni", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Informazioni", exact: true })
        .waitFor();
      await until(() => f.closes > 0);
      f.userGate.resolve();
      assert.equal(new URL(page.url()).pathname, "/about");
    }));
  test(`Chrome ${mode}: query primo caricamento e vuoto`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        await text(page, "Caricamento attivita...");
        f.getGate.resolve();
        await text(page, "Nessuna attivita.");
      },
      { fixture: { tasks: [], getGate: deferred() } },
    ));
  for (const readMode of ["http", "json", "schema"]) {
    test(`Chrome ${mode}: query errore ${readMode} e retry esplicito`, () =>
      withPage(
        mode,
        "query",
        async (page, f) => {
          await text(page, "Caricamento non riuscito.");
          f.readMode = "ok";
          await button(page, "Riprova").click();
          await page
            .getByRole("checkbox", { name: "Studiare cache" })
            .waitFor();
        },
        { fixture: { readMode }, httpErrors: readMode === "http" },
      ));
  }
  test(`Chrome ${mode}: refetch fallito mantiene dati e permette ripresa`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        await page.getByRole("checkbox").waitFor();
        f.readMode = "http";
        await button(page, "Aggiorna").click();
        await text(page, "Aggiornamento fallito: dati precedenti conservati.");
        assert.equal(await page.getByRole("checkbox").count(), 1);
        f.readMode = "ok";
        f.tasks = [];
        await button(page, "Aggiorna").click();
        await text(page, "Nessuna attivita.");
      },
      { httpErrors: true },
    ));
  test(`Chrome ${mode}: ottimismo, risposta server e attesa della riconciliazione`, () =>
    withPage(mode, "query", async (page, f) => {
      const box = page.getByRole("checkbox");
      await box.waitFor();
      f.patchGate = deferred();
      await box.click();
      await text(page, "Salvataggio in corso...");
      await page.waitForFunction(
        () => document.querySelector('input[type="checkbox"]').checked,
      );
      assert(await box.isChecked());
      assert(await box.isDisabled());
      await until(() => f.patches.length === 1);
      assert.equal(f.tasks[0].done, false);
      f.getGate = deferred();
      const gets = f.gets;
      f.patchGate.resolve();
      await until(() => f.gets > gets);
      await page.getByRole("checkbox", { name: "Titolo dal server" }).waitFor();
      assert(
        await box.isDisabled(),
        "La Promise di invalidazione mantiene pending",
      );
      f.getGate.resolve();
      await page.waitForFunction(
        () => !document.querySelector('input[type="checkbox"]').disabled,
      );
      assert(await box.isChecked());
      assert.equal(f.patches.length, 1);
      assert.deepEqual(f.patches[0].payload, { done: true });
      assert.equal(f.patches[0].contentType, "application/json");
    }));
  test(`Chrome ${mode}: rollback prima del refetch e retry della mutation`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        const box = page.getByRole("checkbox");
        await box.waitFor();
        f.patchMode = "http";
        f.patchGate = deferred();
        f.getGate = deferred();
        await box.click();
        await text(page, "Salvataggio in corso...");
        await page.waitForFunction(
          () => document.querySelector('input[type="checkbox"]').checked,
        );
        assert(await box.isChecked());
        const gets = f.gets;
        f.patchGate.resolve();
        await until(() => f.gets > gets);
        await page.waitForFunction(
          () => !document.querySelector('input[type="checkbox"]').checked,
        );
        f.getGate.resolve();
        await text(
          page,
          "Salvataggio non confermato. Controlla i dati aggiornati.",
        );
        f.patchMode = "ok";
        await box.click();
        await page
          .getByRole("checkbox", { name: "Titolo dal server" })
          .waitFor();
        await page.waitForFunction(
          () => !document.querySelector('input[type="checkbox"]').disabled,
        );
        assert(await box.isChecked());
      },
      { httpErrors: true },
    ));
  test(`Chrome ${mode}: errore dopo scrittura, refetch conserva il dato autorevole`, () =>
    withPage(
      mode,
      "query",
      async (page) => {
        await page.getByRole("checkbox").click();
        await text(
          page,
          "Salvataggio non confermato. Controlla i dati aggiornati.",
        );
        assert(
          await page
            .getByRole("checkbox", { name: "Titolo dal server" })
            .isChecked(),
        );
      },
      { fixture: { patchMode: "uncertain" }, httpErrors: true },
    ));
  test(`Chrome ${mode}: ID codificato e risposta con ID errato rifiutata`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        await page.getByRole("checkbox").click();
        await text(
          page,
          "Salvataggio non confermato. Controlla i dati aggiornati.",
        );
        assert.equal(f.patches[0].url, "/api/tasks/a%2Fb%20%26%3F");
        assert.equal(await page.getByRole("checkbox").count(), 1);
      },
      {
        fixture: {
          tasks: [{ id: "a/b &?", title: "ID speciale", done: false }],
          patchMode: "wrong-id",
        },
      },
    ));
  test(`Chrome ${mode}: unmount cancella Fetch e remount ricarica`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        await until(() => f.gets > 0);
        const closes = f.closes;
        await page.evaluate(() => window.mount(0));
        await until(() => f.closes > closes);
        f.getGate.resolve();
        await page.evaluate(() => window.mount());
        await page.getByRole("checkbox").waitFor();
        assert(f.gets >= 2);
      },
      { fixture: { getGate: deferred() } },
    ));
  test(`Chrome ${mode}: rollback con refetch fallito conserva lo snapshot`, () =>
    withPage(
      mode,
      "query",
      async (page, f) => {
        await page.getByRole("checkbox").waitFor();
        f.patchMode = "http";
        f.readMode = "http";
        await page.getByRole("checkbox").click();
        await text(
          page,
          "Salvataggio non confermato. Controlla i dati aggiornati.",
        );
        await text(page, "Aggiornamento fallito: dati precedenti conservati.");
        assert.equal(await page.getByRole("checkbox").isChecked(), false);
        f.readMode = "ok";
        await button(page, "Aggiorna").click();
        await page.waitForFunction(
          () =>
            !document
              .querySelector('[role="alert"]')
              ?.textContent.includes("Aggiornamento fallito"),
        );
      },
      { httpErrors: true },
    ));
  test(`Chrome ${mode}: parser utenti, copie e dati invalidi`, () =>
    withPage(mode, "router", async (page) => {
      const result = await page.evaluate(() => {
        const parse = window.examples.parseUsers;
        const input = Object.freeze([
          Object.freeze({ id: "1", name: " Ada ", extra: 2 }),
        ]);
        const output = parse(input);
        let rejected = 0;
        for (const value of [
          null,
          {},
          [null],
          [{ id: 1, name: "Ada" }],
          [{ id: "0", name: "Ada" }],
          [{ id: "1", name: " " }],
          [input[0], input[0]],
        ]) {
          try {
            parse(value);
          } catch {
            rejected++;
          }
        }
        return { output, copied: output[0] !== input[0], rejected };
      });
      assert.deepEqual(result, {
        output: [{ id: "1", name: "Ada" }],
        copied: true,
        rejected: 7,
      });
    }));
  test(`Chrome ${mode}: form, errori accessibili e focus`, () =>
    withPage(mode, "validation", async (page) => {
      await button(page, "Verifica profilo").click();
      await text(page, "Correggi i campi indicati.");
      const name = page.getByLabel("Nome", { exact: true });
      assert(await name.evaluate((el) => el === document.activeElement));
      assert.equal(await name.getAttribute("aria-invalid"), "true");
      assert.equal(
        await name.evaluate(
          (el) =>
            document.getElementById(el.getAttribute("aria-describedby"))
              .textContent,
        ),
        "Inserisci il nome",
      );
      await name.fill("Ada");
      assert.equal(await name.getAttribute("aria-invalid"), "false");
      await page.getByLabel("Email", { exact: true }).fill("a@");
      await page.getByLabel("Anni di esperienza").fill("02");
      await button(page, "Verifica profilo").click();
      await text(page, "Email non valida");
      await text(page, "Usa un intero da 0 a 60");
    }));
  test(`Chrome ${mode}: output validato, Enter, testo non HTML e reset`, () =>
    withPage(mode, "validation", async (page) => {
      await page.getByLabel("Nome", { exact: true }).fill(" <b>Ada</b> ");
      await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
      await page.getByLabel("Anni di esperienza").fill(" 2 ");
      await page.getByLabel("Anni di esperienza").press("Enter");
      await text(
        page,
        "Profilo valido: <b>Ada</b>; ada@example.com; esperienza: 2.",
      );
      assert.equal(await page.locator('[role="status"] b').count(), 0);
      assert.equal(
        await page.getByLabel("Nome", { exact: true }).inputValue(),
        " <b>Ada</b> ",
      );
      await button(page, "Ripristina").click();
      assert.equal(
        await page.getByLabel("Nome", { exact: true }).inputValue(),
        "",
      );
      assert.equal(await page.getByRole("status").count(), 0);
    }));
  test(`Chrome ${mode}: due form hanno ID e valori indipendenti`, () =>
    withPage(mode, "validation", async (page) => {
      await page.evaluate(() => window.mount(2));
      await page.waitForFunction(
        () => document.querySelectorAll('input[name="name"]').length === 2,
      );
      const inputs = page.getByLabel("Nome", { exact: true });
      assert.notEqual(
        await inputs.nth(0).getAttribute("id"),
        await inputs.nth(1).getAttribute("id"),
      );
      await inputs.nth(0).fill("Ada");
      assert.equal(await inputs.nth(1).inputValue(), "");
    }));
}
