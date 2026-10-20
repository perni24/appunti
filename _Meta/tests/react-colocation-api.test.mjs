import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import {
  mkdtemp,
  mkdir,
  writeFile,
  realpath,
  symlink,
  unlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");
const toolsRoot = await realpath(
  path.resolve(
    process.env.REACT_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const runnerRequire = createRequire(
  path.join(
    process.env.REACT_TESTING_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-testing-tools"),
    "package.json",
  ),
);
const { expect } = runnerRequire("@playwright/test");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const names = [
  "State colocato",
  "API layer",
  "Introduzione e Toolchain",
  "Gestione della memoria e AbortController",
];
const trees = new Map(
  names.map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker, lang = "jsx") {
  const matches = trees
    .get(note)
    .children.filter(
      (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
    );
  assert.equal(matches.length, 1, `${note}: ${marker}`);
  return matches[0].value;
}
function evaluate(source, imports = {}, loader = "js") {
  const { code } = transformSync(source, {
    loader,
    jsx: "automatic",
    format: "cjs",
  });
  const module = { exports: {} };
  const resolve = (name) =>
    name.endsWith(".css") ? {} : (imports[name] ?? toolRequire(name));
  new Function("require", "module", "exports", code)(
    resolve,
    module,
    module.exports,
  );
  return module.exports;
}
const httpSource = snippet("API layer", "export class ApiError", "js");
const apiSource = snippet("API layer", "const ID_PATTERN", "js");
const querySource = snippet("API layer", "usersQueryOptions", "js");
const stateSource = snippet(
  "State colocato",
  "export default function ColocationDemo",
);
const http = evaluate(httpSource);
const api = evaluate(apiSource, { "../../shared/api/http.js": http });
const { usersQueryOptions } = evaluate(querySource, { "./usersApi.js": api });
const state = evaluate(stateSource, {}, "jsx");
const dto = { id: "a", display_name: "Ada" };
const nativeFetch = globalThis.fetch;
async function withFetch(fake, run) {
  const old = globalThis.fetch;
  globalThis.fetch = fake;
  try {
    return await run();
  } finally {
    globalThis.fetch = old;
  }
}
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
const errorKind =
  (kind, status = null) =>
  (error) =>
    error instanceof http.ApiError &&
    error.kind === kind &&
    error.status === status;
let root, realTemp, browser, server, serverURL;
const fixtures = {};
const links = [];
const oldNodeEnv = process.env.NODE_ENV;
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-colocation-"));
  const vite = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  for (const name of ["state", "api"]) {
    const dir = path.join(root, name);
    const files = {
      "package.json": snippet(names[2], '"react-notes-demo"', "json"),
      "vite.config.js": snippet(names[2], "defineConfig", "javascript"),
      "index.html": snippet(names[2], "<!doctype html>", "html"),
      "src/main.jsx": snippet(names[2], "<StrictMode>"),
      "src/App.jsx":
        name === "state"
          ? stateSource
          : snippet("API layer", "export default function ApiDemo"),
    };
    if (name === "state") {
      files["src/colocation.css"] = snippet(
        "State colocato",
        ".colocation-demo {",
        "css",
      );
      files["probe.html"] = files["index.html"].replace(
        "/src/main.jsx",
        "/src/probe.jsx",
      );
      files["src/probe.jsx"] = `import { createRoot } from "react-dom/client";
        import { Catalog } from "./App.jsx";
        const root = createRoot(document.getElementById("root"));
        window.renderCatalog = (query, key = "same") => root.render(<Catalog key={key}
          title="Probe" initialQuery={query} items={[{id:"a",name:"Ada"},{id:"b",name:"Grace"}]} />);
        window.renderCatalog("Ada");`;
    } else {
      files["src/shared/api/http.js"] = httpSource;
      files["src/features/users/usersApi.js"] = apiSource;
      files["src/ProfileDemo.jsx"] = snippet(
        names[3],
        "export function ProfilePanel",
      );
    }
    for (const [name, value] of Object.entries(files)) {
      const file = path.join(dir, name);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, value);
    }
    for (const dependency of [
      "react",
      "react-dom",
      "vite",
      "@vitejs/plugin-react",
    ]) {
      const link = path.join(dir, "node_modules", dependency);
      await mkdir(path.dirname(link), { recursive: true });
      await symlink(
        path.join(toolsRoot, "node_modules", dependency),
        link,
        "junction",
      );
      links.push(link);
    }
    process.env.NODE_ENV = "production";
    await vite.build({ root: dir, logLevel: "error" });
    const preview = await vite.preview({
      root: dir,
      logLevel: "error",
      preview: { host: "127.0.0.1", port: 0 },
    });
    process.env.NODE_ENV = "development";
    const dev = await vite.createServer({
      root: dir,
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0 },
    });
    await dev.listen();
    fixtures[name] = {
      dev,
      preview,
      development: `http://127.0.0.1:${dev.httpServer.address().port}`,
      production: `http://127.0.0.1:${preview.httpServer.address().port}`,
    };
  }
  server = createServer(async (req, res) => {
    if (req.url === "/slow-body") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write('{"id":"a",');
      return;
    }
    if (req.method === "DELETE") {
      res.writeHead(204);
      res.end();
      return;
    }
    let result = dto;
    if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      result = { id: "new", ...JSON.parse(Buffer.concat(chunks).toString()) };
    } else if (req.url === "/api/users") result = [dto];
    res.writeHead(req.method === "POST" ? 201 : 200, {
      "Content-Type": "application/json",
    });
    res.end(JSON.stringify(result));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  serverURL = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Vite ${vite.version}; Chrome ${browser.version()}; due build Vite e HTTP loopback`,
  );
});
after(async () => {
  try {
    await browser?.close();
    for (const fixture of Object.values(fixtures)) {
      await fixture.dev.close();
      await new Promise((resolve, reject) =>
        fixture.preview.httpServer.close((e) => (e ? reject(e) : resolve())),
      );
    }
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
    }
  } finally {
    for (const link of links) await unlink(link);
    if (root) {
      assert.equal(path.dirname(await realpath(root)), realTemp);
      assert(path.basename(root).startsWith("appunti-react-colocation-"));
      await rm(root, { recursive: true, force: true });
    }
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
  }
});

for (const name of names.slice(0, 2))
  test(`Sintassi: ${name}, non esecuzione`, () => {
    for (const n of trees.get(name).children)
      if (n.type === "code" && ["js", "jsx", "css"].includes(n.lang))
        transformSync(n.value, { loader: n.lang });
  });
test("Filtro: trim/case, vuoto, nessun risultato e input immutati", () => {
  const items = Object.freeze([
    Object.freeze({ id: "a", name: "Ada" }),
    Object.freeze({ id: "b", name: "Grace" }),
  ]);
  assert.deepEqual(state.filterItems(items, " ADA "), [items[0]]);
  assert.deepEqual(state.filterItems(items, " "), items);
  assert.notEqual(state.filterItems(items, ""), items);
  assert.deepEqual(state.filterItems(items, "zzz"), []);
});
test("SSR: due cataloghi, ID unici, label e testo escaped", () => {
  const html = renderToStaticMarkup(React.createElement(state.default));
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal((html.match(/type="search"/g) ?? []).length, 2);
  assert(html.includes('aria-expanded="false"'));
  assert(
    renderToStaticMarkup(
      React.createElement(state.Catalog, { title: "<b>Demo</b>", items: [] }),
    ).includes("&lt;b&gt;Demo&lt;/b&gt;"),
  );
});
test("DTO: proiezione e copia, non sanitizzazione", () => {
  const input = Object.freeze({
    ...dto,
    display_name: "<b>Ada</b>",
    extra: "scartato",
  });
  assert.deepEqual(api.parseUserDTO(input), { id: "a", name: "<b>Ada</b>" });
  assert.deepEqual(api.parseUsersDTO([]), []);
});
for (const value of [
  null,
  [],
  {},
  { ...dto, id: ".." },
  { ...dto, id: 1 },
  { ...dto, display_name: " " },
  { ...dto, display_name: 1 },
  { ...dto, display_name: "x".repeat(81) },
]) {
  test(`DTO rifiutato: ${JSON.stringify(value)}`, () =>
    assert.throws(() => api.parseUserDTO(value), errorKind("schema")));
}
test("Elenco non valido, duplicati e ID richiesto incoerente", () => {
  assert.throws(() => api.parseUsersDTO({}), errorKind("schema"));
  assert.throws(() => api.parseUsersDTO([dto, dto]), errorKind("schema"));
  assert.throws(() => api.parseUserDTO(dto, "b"), errorKind("schema"));
});
test("GET: header, credenziali, redirect e signal espliciti", () => {
  const controller = new AbortController();
  return withFetch(
    async (url, options) => {
      assert.equal(url, "/api/users/a");
      assert.equal(options.method, "GET");
      assert.equal(options.body, undefined);
      assert.equal(options.headers.get("accept"), "application/json");
      assert.equal(options.headers.has("content-type"), false);
      assert.equal(options.credentials, "omit");
      assert.equal(options.redirect, "error");
      assert.equal(options.signal, controller.signal);
      return json(dto);
    },
    async () =>
      assert.deepEqual(await api.getUser("a", { signal: controller.signal }), {
        id: "a",
        name: "Ada",
      }),
  );
});
for (const headers of [
  { "X-Demo": "ok" },
  [["X-Demo", "ok"]],
  new Headers({ "X-Demo": "ok" }),
]) {
  test(`Headers accetta ${headers.constructor.name}${Array.isArray(headers) ? " pairs" : ""}`, () =>
    withFetch(
      async (_url, options) => {
        assert.equal(options.headers.get("x-demo"), "ok");
        return json({});
      },
      () => http.requestJson("/api/test", { headers }),
    ));
}
test("Creazione: payload normalizzato, POST 201 e Content-Type JSON", () =>
  withFetch(
    async (url, options) => {
      assert.equal(url, "/api/users");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.get("content-type"), "application/json");
      assert.deepEqual(JSON.parse(options.body), { display_name: "Grace" });
      return json({ id: "b", display_name: "Grace" }, 201);
    },
    async () =>
      assert.deepEqual(await api.createUser(" Grace "), {
        id: "b",
        name: "Grace",
      }),
  ));
test("Headers clonati e Content-Type impostato solo per il body JSON", () => {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "text/plain",
  });
  return withFetch(
    async (_url, options) => {
      assert.equal(options.headers.get("content-type"), "application/json");
      return json({});
    },
    async () => {
      await http.requestJson("/api/test", {
        method: "POST",
        data: null,
        headers,
      });
      assert.equal(headers.get("content-type"), "text/plain");
    },
  );
});
test("DELETE 204 non tenta parsing JSON", () =>
  withFetch(
    async (url, options) => {
      assert.equal(url, "/api/users/a");
      assert.equal(options.method, "DELETE");
      return {
        ok: true,
        status: 204,
        json() {
          throw new Error("Non leggere");
        },
      };
    },
    async () => assert.equal(await api.deleteUser("a"), undefined),
  ));
for (const status of [400, 401, 403, 404, 429, 500])
  test(`HTTP ${status} resta distinto da vuoto o protocollo`, () =>
    withFetch(
      async () => new Response("non esporre questo body", { status }),
      () => assert.rejects(api.getUsers(), errorKind("http", status)),
    ));
test("Successo inatteso: 200 al posto di 201 e 204 al posto di JSON", async () => {
  await withFetch(
    async () => json(dto),
    () => assert.rejects(api.createUser("Ada"), errorKind("protocol", 200)),
  );
  await withFetch(
    async () => new Response(null, { status: 204 }),
    () => assert.rejects(api.getUsers(), errorKind("protocol", 204)),
  );
});
for (const [body, type] of [
  ["<h1>Login</h1>", "text/html"],
  ["{}", null],
  ["{}", "application/vnd.demo+json"],
  ["", "application/json"],
  ["{", "application/json"],
]) {
  test(`Protocollo rifiutato: ${type}, ${JSON.stringify(body)}`, () =>
    withFetch(
      async () =>
        new Response(body, { headers: type ? { "Content-Type": type } : {} }),
      () =>
        assert.rejects(
          http.requestJson("/api/test"),
          errorKind("protocol", 200),
        ),
    ));
}
test("Media type normalizzato e parametri JSON accettati", () =>
  withFetch(
    async () =>
      new Response("{}", {
        headers: { "Content-Type": "Application/JSON; charset=utf-8" },
      }),
    async () => assert.deepEqual(await http.requestJson("/api/test"), {}),
  ));
test("Errore di lettura preserva cause e categoria body", () => {
  const cause = new TypeError("stream non leggibile");
  return withFetch(
    async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => {
        throw cause;
      },
    }),
    () =>
      assert.rejects(
        http.requestJson("/api/test"),
        (error) => errorKind("body", 200)(error) && error.cause === cause,
      ),
  );
});
test("Errore rete preserva cause senza fingere HTTP", () => {
  const cause = new TypeError("Fetch fallito");
  return withFetch(
    async () => {
      throw cause;
    },
    () =>
      assert.rejects(
        api.getUsers(),
        (error) => errorKind("network")(error) && error.cause === cause,
      ),
  );
});
test("Input e serializzazione invalidi non inviano richieste", () =>
  withFetch(
    () => {
      throw new Error("Fetch non atteso");
    },
    async () => {
      for (const id of ["", "..", "a/b", "a?b", 1, "a".repeat(65)])
        await assert.rejects(api.getUser(id), TypeError);
      for (const name of [null, " ", "a".repeat(81)])
        await assert.rejects(api.createUser(name), TypeError);
      const cycle = {};
      cycle.self = cycle;
      for (const data of [cycle, 1n, () => {}])
        await assert.rejects(
          http.requestJson("/api/test", { method: "POST", data }),
          TypeError,
        );
      await assert.rejects(
        http.requestJson("/api/test", { data: {} }),
        TypeError,
      );
      await assert.rejects(
        http.requestJson("/api/test", { method: "HEAD" }),
        TypeError,
      );
      await assert.rejects(
        http.requestJson("/api/test", { expectedStatus: 202 }),
        TypeError,
      );
    },
  ));
test("Signal gia annullato: motivo originale e nessun Fetch", () => {
  const controller = new AbortController(),
    reason = { cancelled: true };
  controller.abort(reason);
  return withFetch(
    () => {
      throw new Error("Fetch non atteso");
    },
    () =>
      assert.rejects(
        api.getUser("a", { signal: controller.signal }),
        (error) => error === reason,
      ),
  );
});
test("Abort di Fetch prima degli header conserva il motivo senza ApiError", () => {
  const controller = new AbortController();
  const reason = new Error("stop fetch");
  return withFetch(
    (url, options) => {
      const pending = nativeFetch(url, options);
      controller.abort(reason);
      return pending;
    },
    () =>
      assert.rejects(
        http.requestJson(`${serverURL}/slow-body`, {
          signal: controller.signal,
        }),
        (error) => error === reason,
      ),
  );
});
test("Query options: chiave pubblica, retry disattivato, signal inoltrato", () => {
  const controller = new AbortController();
  assert.deepEqual(usersQueryOptions.queryKey, ["public-users"]);
  assert.equal(usersQueryOptions.retry, false);
  return withFetch(
    async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      return json([dto]);
    },
    async () =>
      assert.deepEqual(
        await usersQueryOptions.queryFn({ signal: controller.signal }),
        [{ id: "a", name: "Ada" }],
      ),
  );
});
test("HTTP loopback reale: elenco, dettaglio, POST e DELETE del client", () =>
  withFetch(
    (url, options) => nativeFetch(new URL(url, serverURL), options),
    async () => {
      assert.deepEqual(await api.getUsers(), [{ id: "a", name: "Ada" }]);
      assert.deepEqual(await api.getUser("a"), { id: "a", name: "Ada" });
      assert.deepEqual(await api.createUser(" Grace "), {
        id: "new",
        name: "Grace",
      });
      assert.equal(await api.deleteUser("a"), undefined);
    },
  ));
test("Abort durante il corpo HTTP reale conserva il motivo personalizzato", async () => {
  const controller = new AbortController(),
    reason = new Error("stop body");
  let response, ready;
  const received = new Promise((resolve) => {
    ready = resolve;
  });
  await withFetch(
    async (url, options) => {
      response = await nativeFetch(url, options);
      ready();
      return response;
    },
    async () => {
      const pending = http.requestJson(`${serverURL}/slow-body`, {
        signal: controller.signal,
      });
      const rejection = assert.rejects(pending, (error) => error === reason);
      await received;
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(response.bodyUsed, true);
      controller.abort(reason);
      await rejection;
    },
  );
});

async function withPage(
  name,
  mode,
  run,
  { setup, width = 1280, probe = false, negative = false } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  const errors = [];
  try {
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !(negative && /^Failed to load resource:/.test(message.text()))
      )
        errors.push(message.text());
    });
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        !(negative && new URL(response.url()).pathname.startsWith("/api/"))
      )
        errors.push(`${response.status()} ${response.url()}`);
    });
    await setup?.(page);
    assert.equal(
      (
        await page.goto(`${fixtures[name][mode]}${probe ? "/probe.html" : "/"}`)
      ).status(),
      200,
    );
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
for (const mode of ["development", "production"]) {
  test(`${mode}: filtro condiviso, dettaglio locale e due cataloghi indipendenti`, () =>
    withPage("state", mode, async (page) => {
      const first = page.getByRole("region", { name: "Primo", exact: true });
      const second = page.getByRole("region", { name: "Secondo", exact: true });
      await first.getByRole("button").click();
      await first.getByRole("searchbox").fill(" PEN ");
      await expect(first.getByRole("listitem")).toHaveText(["Penna"]);
      await expect(second.getByRole("listitem")).toHaveCount(3);
      await expect(first.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(second.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await first.getByRole("searchbox").fill("inesistente");
      await expect(first.getByRole("status")).toHaveText("0 risultati");
      await expect(first.getByText("Nessun risultato.")).toBeVisible();
    }));
  test(`${mode}: hidden conserva stato, unmount lo perde`, () =>
    withPage("state", mode, async (page) => {
      const first = page.getByRole("region", { name: "Primo", exact: true });
      await first.getByRole("searchbox").fill("pen");
      await first.getByRole("button").click();
      const id = await first.getByRole("searchbox").getAttribute("id");
      await page.getByLabel("Primo catalogo visibile").uncheck();
      await expect(first).toHaveCount(0);
      await page.getByLabel("Primo catalogo visibile").check();
      await expect(first.getByRole("searchbox")).toHaveValue("pen");
      assert.equal(await first.getByRole("searchbox").getAttribute("id"), id);
      await expect(first.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.getByLabel("Primo catalogo montato").uncheck();
      await page.getByLabel("Primo catalogo montato").check();
      await expect(first.getByRole("searchbox")).toHaveValue("");
      await expect(first.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    }));
  test(`${mode}: key resetta solo il primo, tastiera e focus restano utilizzabili`, () =>
    withPage("state", mode, async (page) => {
      const first = page.getByRole("region", { name: "Primo", exact: true });
      const second = page.getByRole("region", { name: "Secondo", exact: true });
      await first.getByRole("searchbox").fill("pen");
      await second.getByRole("searchbox").fill("rig");
      await second.getByRole("button").press("Space");
      await page
        .getByRole("button", { name: "Reset primo catalogo" })
        .press("Enter");
      await expect(first.getByRole("searchbox")).toHaveValue("");
      await expect(second.getByRole("searchbox")).toHaveValue("rig");
      await expect(second.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(
        page.getByRole("button", { name: "Reset primo catalogo" }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(first.getByRole("searchbox")).toBeFocused();
      await expect(first.getByRole("searchbox")).toHaveCSS(
        "outline-width",
        "3px",
      );
    }));
  test(`${mode}: nomi/ID indipendenti e axe sul catalogo filtrato`, () =>
    withPage("state", mode, async (page) => {
      const input = page.getByRole("searchbox").first();
      await input.fill("pen");
      await expect(input).toHaveAccessibleName("Filtro");
      const ids = await page
        .locator("[id]")
        .evaluateAll((nodes) => nodes.map((n) => n.id));
      assert.equal(ids.length, new Set(ids).size);
      await page.addScriptTag({
        path: toolRequire.resolve("axe-core/axe.min.js"),
      });
      const result = await page.evaluate(() =>
        axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        }),
      );
      assert.deepEqual(result.violations, []);
      console.log(`axe ${mode}: ${result.incomplete.length} incomplete`);
    }));
  test(`${mode}: API pubblica, cambio ID e mapping DTO nella UI`, () =>
    withPage(
      "api",
      mode,
      async (page) => {
        await expect(
          page.getByText("Utente: Ada", { exact: true }),
        ).toBeVisible();
        await page.getByLabel("Profilo", { exact: true }).selectOption("b");
        await expect(
          page.getByText("Utente: Grace", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Utente: Ada", { exact: true }),
        ).toHaveCount(0);
      },
      {
        setup: (page) =>
          page.route("**/api/users/*", (route) => {
            const id = new URL(route.request().url()).pathname
              .split("/")
              .at(-1);
            return route.fulfill({
              json: { id, display_name: id === "a" ? "Ada" : "Grace" },
            });
          }),
      },
    ));
  test(`${mode}: HTTP fallito, retry esplicito e testo non HTML`, () => {
    let valid = false;
    return withPage(
      "api",
      mode,
      async (page) => {
        await expect(page.getByRole("alert")).toHaveText(
          "Impossibile caricare il profilo.",
        );
        valid = true;
        await page.getByRole("button", { name: "Ricarica" }).click();
        await expect(
          page.getByText("Utente: <b>Ada</b>", { exact: true }),
        ).toBeVisible();
        await expect(page.locator("main b")).toHaveCount(0);
      },
      {
        negative: true,
        setup: (page) =>
          page.route("**/api/users/*", (route) =>
            valid
              ? route.fulfill({ json: { id: "a", display_name: "<b>Ada</b>" } })
              : route.fulfill({
                  status: 404,
                  body: "errore interno non mostrato",
                }),
          ),
      },
    );
  });
  test(`${mode}: UI rifiuta il profilo di un altro ID`, () =>
    withPage(
      "api",
      mode,
      async (page) => {
        await expect(page.getByRole("alert")).toHaveText(
          "Impossibile caricare il profilo.",
        );
        await expect(
          page.getByText("Utente: Grace", { exact: true }),
        ).toHaveCount(0);
      },
      {
        setup: (page) =>
          page.route("**/api/users/*", (route) =>
            route.fulfill({ json: { id: "b", display_name: "Grace" } }),
          ),
      },
    ));
}
test("Probe: nuova initialQuery non sovrascrive stato, nuova key si", () =>
  withPage(
    "state",
    "development",
    async (page) => {
      await expect(page.getByRole("searchbox")).toHaveValue("Ada");
      await page.getByRole("searchbox").fill("Bozza");
      await page.evaluate(() => window.renderCatalog("Grace"));
      await expect(page.getByRole("searchbox")).toHaveValue("Bozza");
      await page.evaluate(() => window.renderCatalog("Grace", "new"));
      await expect(page.getByRole("searchbox")).toHaveValue("Grace");
    },
    { probe: true },
  ));
for (const width of [320, 390, 1440])
  test(`Catalogo di produzione senza overflow a ${width}px`, () =>
    withPage(
      "state",
      "production",
      async (page) => {
        await page
          .getByRole("button", { name: "Dettagli del filtro" })
          .first()
          .click();
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      },
      { width },
    ));
