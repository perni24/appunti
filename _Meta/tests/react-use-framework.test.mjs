import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  realpath,
  symlink,
  unlink,
  rm,
  readdir,
  lstat,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { build, transformSync } = require("esbuild");
const toolsRoot = await realpath(
  path.resolve(
    process.env.REACT_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const React = toolRequire("react");
const { renderToString, renderToStaticMarkup } =
  toolRequire("react-dom/server");
const axe = toolRequire("axe-core");
const names = ["use hook", "Framework Next.js e Remix"];
const trees = names.map(
  (name) => parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
);
function snippet(index, marker) {
  const found = trees[index].children.filter(
    (n) => n.type === "code" && n.value.includes(marker),
  );
  assert.equal(found.length, 1, marker);
  return found[0].value;
}
const examples = {
  PromiseDemo: snippet(0, "function PromiseDemo"),
  ContextDemo: snippet(0, "function ContextDemo"),
  BrowserDemo: snippet(0, "function BrowserDemo"),
};
const files = {
  "package.json": snippet(1, '"router-framework-notes-demo"'),
  "vite.config.js": snippet(1, "defineConfig"),
  "react-router.config.ts": snippet(1, "ssr: true"),
  "app/routes.ts": snippet(1, "export default [index("),
  "app/root.jsx": snippet(1, "function Root("),
  "app/catalog.server.js": snippet(1, "function searchCatalog"),
  "app/routes/catalog.jsx": snippet(1, "function Catalog("),
  "app/app.css": snippet(1, "body {"),
};
function load(source, overrides = {}) {
  const module = { exports: {} };
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  new Function("require", "module", "exports", code)(
    (name) => overrides[name] ?? toolRequire(name),
    module,
    module.exports,
  );
  return module.exports;
}
const catalog = load(files["app/catalog.server.js"]);
const route = load(files["app/routes/catalog.jsx"], {
  "../catalog.server.js": catalog,
});

for (const [i, name] of names.entries()) {
  test(`Sintassi: ${name}, distinta dall'esecuzione`, () => {
    for (const block of trees[i].children.filter((n) => n.type === "code")) {
      const loaders = {
        jsx: "jsx",
        javascript: "js",
        typescript: "ts",
        css: "css",
      };
      if (loaders[block.lang])
        transformSync(block.value, {
          loader: loaders[block.lang],
          jsx: "automatic",
        });
      if (block.lang === "json") JSON.parse(block.value);
    }
  });
}
test("Servizio Promise reale: risoluzione e rigetto locale", async () => {
  const { loadMessageDemo } = load(examples.PromiseDemo);
  assert.equal(await loadMessageDemo(false), "Messaggio disponibile");
  await assert.rejects(loadMessageDemo(true), /Guasto dimostrativo/);
});
test("Context: default, valore esplicito undefined e provider annidati", () => {
  const { Greeting, LanguageContext } = load(examples.ContextDemo);
  const h = React.createElement;
  assert.equal(
    renderToStaticMarkup(h(Greeting, { show: true })),
    "<p>Ciao</p>",
  );
  assert.equal(
    renderToStaticMarkup(
      h(LanguageContext, { value: undefined }, h(Greeting, { show: true })),
    ),
    "<p>Hello</p>",
  );
  assert.equal(
    renderToStaticMarkup(
      h(
        LanguageContext,
        { value: "en" },
        h(LanguageContext, { value: "it" }, h(Greeting, { show: true })),
      ),
    ),
    "<p>Ciao</p>",
  );
});
test("browser(): SSR produce il fallback senza accedere a window", () => {
  assert.equal(typeof toolRequire("react-dom").browser, "function");
  const html = renderToString(
    React.createElement(load(examples.BrowserDemo).default),
  );
  assert.match(html, /Misura disponibile nel browser/);
  assert(!html.includes("Larghezza:"));
});
test("Catalogo: filtro e copie pubbliche senza campo interno", () => {
  const result = catalog.searchCatalog("PEN");
  assert.deepEqual(result, [{ id: "p2", name: "Penna" }]);
  result[0].name = "Cambiato";
  assert.equal(catalog.searchCatalog("pen")[0].name, "Penna");
  assert.equal(catalog.searchCatalog("assente").length, 0);
  assert(!JSON.stringify(catalog.searchCatalog("")).includes("INTERNAL"));
});
test("Loader: query normalizzata, limite e duplicati controllati sul server", () => {
  const run = (query) =>
    route.loader({ request: new Request(`http://fixture/${query}`) });
  assert.equal(run("").products.length, 2);
  assert.deepEqual(run("?q=%20pen%20"), {
    query: "pen",
    products: [{ id: "p2", name: "Penna" }],
  });
  assert.equal(run(`?q=${"a".repeat(80)}`).products.length, 0);
  for (const query of ["?q=a&q=b", `?q=${"a".repeat(81)}`, "?q=&q="]) {
    assert.throws(
      () => run(query),
      (e) => e instanceof Response && e.status === 400,
    );
  }
});

let temp, root, app, browser, server, url, appUrl, buildLog;
const links = [];
const processes = [];
async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}
async function close(server) {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((e) => (e ? reject(e) : resolve())),
  );
}
function child(bin, args, env = {}) {
  const child = spawn(process.execPath, [bin, ...args], {
    cwd: app,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production", CI: "1", ...env },
  });
  const record = { child, output: "" };
  child.stdout.on("data", (b) => (record.output += b));
  child.stderr.on("data", (b) => (record.output += b));
  record.done = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  processes.push(record);
  return record;
}
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(file)));
    else result.push(file);
  }
  return result;
}
before(
  async () => {
    temp = await realpath(tmpdir());
    root = await mkdtemp(path.join(temp, "appunti-react-use-framework-"));
    app = path.join(root, "framework");
    await mkdir(app);
    for (const [file, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(app, file)), { recursive: true });
      await writeFile(path.join(app, file), content);
    }
    for (const name of [
      "react",
      "react-dom",
      "react-router",
      "vite",
      "isbot",
      "@react-router/dev",
      "@react-router/node",
      "@react-router/serve",
    ]) {
      const link = path.join(app, "node_modules", name);
      const target = path.join(toolsRoot, "node_modules", name);
      await mkdir(path.dirname(link), { recursive: true });
      await symlink(
        target,
        link,
        process.platform === "win32" ? "junction" : "dir",
      );
      links.push({ link, target });
    }
    const builder = child(
      path.join(toolsRoot, "node_modules/@react-router/dev/bin.cjs"),
      ["build"],
    );
    const timer = setTimeout(() => builder.child.kill(), 120000);
    try {
      assert.equal(await builder.done, 0, builder.output);
    } finally {
      clearTimeout(timer);
    }
    buildLog = builder.output;
    const reserve = createServer();
    appUrl = await listen(reserve);
    await close(reserve);
    const runtime = child(
      path.join(toolsRoot, "node_modules/@react-router/serve/bin.cjs"),
      ["./build/server/index.js"],
      {
        HOST: "127.0.0.1",
        PORT: new URL(appUrl).port,
      },
    );
    const deadline = Date.now() + 30000;
    while (true) {
      assert.equal(runtime.child.exitCode, null, runtime.output);
      try {
        if ((await fetch(appUrl)).ok) break;
      } catch {}
      assert(Date.now() < deadline, runtime.output);
      await delay(100);
    }
    for (const [name, source] of Object.entries(examples))
      await writeFile(path.join(root, `${name}.jsx`), source);
    await writeFile(
      path.join(root, "fixture.jsx"),
      `
import {createElement as h, StrictMode, use} from 'react';
import {createRoot} from 'react-dom/client';
import PromiseDemo from './PromiseDemo.jsx';
import ContextDemo,{LanguageContext,Greeting} from './ContextDemo.jsx';
import BrowserDemo from './BrowserDemo.jsx';
window.gates=[]; window.calls=[]; window.caught=[]; window.failures=[];
function load(fail){window.calls.push(fail); const gate=Promise.withResolvers(); window.gates.push(gate); return gate.promise;}
function SameProvider(){const language=use(LanguageContext); return <LanguageContext value="en"><p>Esterno: {language}</p><Greeting show /></LanguageContext>;}
const components={PromiseDemo,ContextDemo,BrowserDemo,SameProvider};
const root=createRoot(document.getElementById('root'),{onCaughtError:e=>window.caught.push(e.message),onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
window.mount=(name,actual=false)=>root.render(h(StrictMode,null,h(components[name],name==='PromiseDemo'&&!actual?{load}:{})));
window.resolve=(i,value)=>window.gates[i].resolve(value);
window.reject=i=>window.gates[i].reject(new Error('Rigetto intenzionale'));
window.ready=true;
`,
    );
    const bundles = {};
    for (const mode of ["development", "production"]) {
      bundles[`/${mode}.js`] = (
        await build({
          entryPoints: [path.join(root, "fixture.jsx")],
          bundle: true,
          write: false,
          jsx: "automatic",
          format: "iife",
          platform: "browser",
          minify: mode === "production",
          nodePaths: [path.join(toolsRoot, "node_modules")],
          define: { "process.env.NODE_ENV": JSON.stringify(mode) },
          logLevel: "silent",
        })
      ).outputFiles[0].text;
    }
    server = createServer((req, res) => {
      if (bundles[req.url]) {
        res.writeHead(200, { "content-type": "text/javascript" });
        res.end(bundles[req.url]);
      } else if (["/development", "/production"].includes(req.url)) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(
          `<!doctype html><html lang="it"><head><title>Fixture use</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body><h1>Fixture React</h1><main id="root"></main><script src="${req.url}.js"></script></body></html>`,
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    url = await listen(server);
    browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL ?? "chrome",
      headless: true,
    });
    console.log(
      `React ${React.version}; Router ${toolRequire("react-router/package.json").version}; Chrome ${browser.version()}; build SSR reale`,
    );
  },
  { timeout: 180000 },
);

after(async () => {
  try {
    await browser?.close();
    await close(server);
  } finally {
    for (const record of processes) {
      if (record.child.exitCode === null) record.child.kill();
      await record.done;
    }
    for (const { link, target } of links) {
      assert(link.startsWith(path.join(app, "node_modules") + path.sep));
      const info = await lstat(link).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
      if (info?.isSymbolicLink()) {
        assert.equal(await realpath(link), await realpath(target));
        await unlink(link);
      }
    }
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), temp);
      assert(
        path.basename(resolved).startsWith("appunti-react-use-framework-"),
      );
      await rm(root, { recursive: true, force: true });
    }
  }
});

async function withPage(
  target,
  run,
  { caught = [], javaScriptEnabled = true } = {},
) {
  const context = await browser.newContext({
    javaScriptEnabled,
    viewport: { width: 1100, height: 800 },
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [],
      messages = [],
      http = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) messages.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) http.push(`${r.status()} ${r.url()}`);
    });
    assert.equal((await page.goto(target)).status(), 200);
    await run(page);
    if (target.startsWith(url + "/")) {
      assert.deepEqual(
        await page.evaluate(() => [...new Set(window.caught)]),
        caught,
      );
      assert.deepEqual(await page.evaluate(() => window.failures), []);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(messages, []);
    assert.deepEqual(http, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name, actual = false) {
  await page.waitForFunction(() => window.ready);
  await page.evaluate(({ name, actual }) => window.mount(name, actual), {
    name,
    actual,
  });
  await page.locator("#root > *").first().waitFor();
}
async function hasText(page, value) {
  await page.getByText(value, { exact: true }).waitFor();
}
async function scan(page) {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document.querySelector("main"), {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      })
    ).violations.map((v) => v.id),
  );
  assert.deepEqual(violations, []);
}
for (const mode of ["development", "production"]) {
  test(`${mode}: Promise pending, risultato e re-render senza nuove operazioni`, async () => {
    await withPage(`${url}/${mode}`, async (page) => {
      await mount(page, "PromiseDemo");
      await page.getByRole("button", { name: "Carica", exact: true }).click();
      await hasText(page, "Caricamento...");
      await page.getByRole("button", { name: "Aggiorna contatore" }).click();
      await hasText(page, "Contatore: 1");
      assert.equal(await page.evaluate(() => window.calls.length), 1);
      await page.evaluate(() => window.resolve(0, "Risultato unico"));
      await hasText(page, "Risultato unico");
      await page.getByRole("button", { name: "Aggiorna contatore" }).click();
      await hasText(page, "Contatore: 2");
      assert.equal(await page.evaluate(() => window.calls.length), 1);
      assert.equal(
        await page.getByText("Caricamento...", { exact: true }).count(),
        0,
      );
    });
  });
  test(`${mode}: rigetto al boundary e nuovo caricamento con Promise nuova`, async () => {
    await withPage(
      `${url}/${mode}`,
      async (page) => {
        await mount(page, "PromiseDemo");
        await page.getByRole("button", { name: "Simula errore" }).click();
        await hasText(page, "Caricamento...");
        await page.evaluate(() => window.reject(0));
        await page.getByRole("alert").waitFor();
        await page.getByRole("button", { name: "Carica", exact: true }).click();
        await hasText(page, "Caricamento...");
        assert.deepEqual(await page.evaluate(() => window.calls), [
          true,
          false,
        ]);
        await page.evaluate(() => window.resolve(1, "Recuperato"));
        await hasText(page, "Recuperato");
        assert.equal(await page.getByRole("alert").count(), 0);
        await scan(page);
      },
      { caught: ["Rigetto intenzionale"] },
    );
  });
  test(`${mode}: risultato tardivo non sostituisce l'ultima operazione`, async () => {
    await withPage(`${url}/${mode}`, async (page) => {
      await mount(page, "PromiseDemo");
      await page.getByRole("button", { name: "Carica", exact: true }).click();
      await hasText(page, "Caricamento...");
      await page.getByRole("button", { name: "Carica", exact: true }).click();
      await page.evaluate(() => window.resolve(1, "Nuovo"));
      await hasText(page, "Nuovo");
      await page.evaluate(() => window.resolve(0, "Vecchio"));
      await page.getByRole("button", { name: "Aggiorna contatore" }).click();
      await hasText(page, "Contatore: 1");
      await hasText(page, "Nuovo");
      assert.equal(await page.getByText("Vecchio", { exact: true }).count(), 0);
    });
  });
  test(`${mode}: servizio demo originale nel browser`, async () => {
    await withPage(
      `${url}/${mode}`,
      async (page) => {
        await mount(page, "PromiseDemo", true);
        await page.getByRole("button", { name: "Carica", exact: true }).click();
        await hasText(page, "Messaggio disponibile");
        await page.getByRole("button", { name: "Simula errore" }).click();
        await page.getByRole("alert").waitFor();
      },
      { caught: ["Guasto dimostrativo"] },
    );
  });
  test(`${mode}: Context condizionale e aggiornamento quando torna visibile`, async () => {
    await withPage(`${url}/${mode}`, async (page) => {
      await mount(page, "ContextDemo");
      await hasText(page, "Ciao");
      await page.getByLabel("Mostra saluto").uncheck();
      await hasText(page, "Saluto nascosto");
      await page.getByLabel("Lingua", { exact: true }).selectOption("en");
      await page.getByLabel("Mostra saluto").check();
      await hasText(page, "Hello");
      await page.getByLabel("Lingua", { exact: true }).selectOption("it");
      await hasText(page, "Ciao");
      await scan(page);
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    });
  });
  test(`${mode}: provider nello stesso componente non cambia la sua lettura`, async () => {
    await withPage(`${url}/${mode}`, async (page) => {
      await mount(page, "SameProvider");
      await hasText(page, "Esterno: it");
      await hasText(page, "Hello");
    });
  });
  test(`${mode}: browser-only legge il viewport senza effetto resize implicito`, async () => {
    await withPage(`${url}/${mode}`, async (page) => {
      await mount(page, "BrowserDemo");
      await hasText(page, "Larghezza: 1100");
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await hasText(page, "Larghezza: 1100");
    });
  });
}
test("Framework: build reale e dipendenza server assente dagli asset client", async () => {
  assert.match(buildLog, /built in/);
  const assets = await walk(path.join(app, "build/client"));
  assert(assets.some((file) => file.endsWith(".js")));
  for (const file of assets)
    assert(!(await readFile(file, "utf8")).includes("INTERNAL-CATALOG"), file);
  const serverFiles = await walk(path.join(app, "build/server"));
  assert(
    (await Promise.all(serverFiles.map((file) => readFile(file, "utf8")))).some(
      (text) => text.includes("INTERNAL-CATALOG"),
    ),
  );
});
test("Framework HTTP: SSR, filtro e proiezione dei dati", async () => {
  const response = await fetch(`${appUrl}/?q=pen`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<li>Penna<\/li>/);
  assert(!html.includes("<li>Taccuino</li>"));
  assert(!html.includes("INTERNAL-CATALOG"));
  assert.match(html, /Catalogo filtrabile/);
});
test("Framework HTTP: 400 query, 404 URL e 405 POST senza action", async () => {
  const invalid = await fetch(`${appUrl}/?q=a&q=b`);
  assert.equal(invalid.status, 400);
  assert.match(await invalid.text(), /Errore <!-- -->400/);
  assert.equal((await fetch(`${appUrl}/assente`)).status, 404);
  const post = await fetch(`${appUrl}/`, {
    method: "POST",
    body: new URLSearchParams({ q: "pen" }),
  });
  assert.equal(post.status, 405);
});
for (const javaScriptEnabled of [true, false]) {
  test(`Framework browser: ricerca GET, URL e reload, JavaScript=${javaScriptEnabled}`, async () => {
    await withPage(
      appUrl,
      async (page) => {
        const input = page.getByLabel("Cerca un prodotto");
        await input.fill("pen");
        await page.getByRole("button", { name: "Cerca", exact: true }).click();
        await page.waitForURL(/\?q=pen$/);
        await hasText(page, "1 risultato");
        assert.deepEqual(await page.getByRole("listitem").allTextContents(), [
          "Penna",
        ]);
        assert.equal(await input.inputValue(), "pen");
        await page.reload();
        await hasText(page, "Penna");
        assert.equal(await input.inputValue(), "pen");
        await page.getByRole("link", { name: "Tutti" }).click();
        await page.waitForURL(appUrl + "/");
        await hasText(page, "2 risultati");
        assert.equal(await input.inputValue(), "");
        await page.goBack();
        await hasText(page, "1 risultato");
        assert.equal(await input.inputValue(), "pen");
        await input.fill("inesistente");
        await input.press("Enter");
        await hasText(page, "Nessun prodotto trovato.");
        await page.setViewportSize({ width: 390, height: 844 });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (javaScriptEnabled) await scan(page);
      },
      { javaScriptEnabled },
    );
  });
}
test("Framework: navigazione idratata non sostituisce il documento e mostra pending", async () => {
  await withPage(appUrl, async (page) => {
    await page.waitForFunction(() => Boolean(window.__reactRouterContext));
    // Lascia completare la hydration prima della prova sul documento.
    await page.getByLabel("Cerca un prodotto").fill("pen");
    await page.getByRole("button", { name: "Cerca", exact: true }).click();
    await hasText(page, "1 risultato");
    await page.evaluate(() => (window.documentMarker = "rimane"));
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await page.route("**/*.data*", async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.getByLabel("Cerca un prodotto").fill("tacc");
      await page.getByRole("button", { name: "Cerca", exact: true }).click();
      await hasText(page, "Ricerca...");
    } finally {
      release();
    }
    await hasText(page, "Taccuino");
    assert.equal(await page.evaluate(() => window.documentMarker), "rimane");
    assert.equal(
      await page.getByLabel("Cerca un prodotto").inputValue(),
      "tacc",
    );
  });
});
