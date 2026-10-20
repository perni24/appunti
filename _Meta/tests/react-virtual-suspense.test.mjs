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
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
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
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const axe = toolRequire("axe-core");
const names = ["Virtualizzazione delle liste", "Suspense e Lazy Loading"];
const trees = new Map(
  names.map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(name, marker, lang = "jsx") {
  const tree =
    trees.get(name) ?? parseNote(`Programmazione/React/Pagine/${name}.md`).tree;
  const nodes = tree.children.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
  );
  assert.equal(nodes.length, 1, `${name}: ${marker}`);
  return nodes[0].value;
}
const sources = {
  VirtualLog: snippet(names[0], "function VirtualLog("),
  Fixed: snippet(names[0], "function VirtualLogDemo"),
  Measured: snippet(names[0], "function MeasuredLogDemo"),
  ReportsPanel: snippet(names[1], "function ReportsPanel"),
  ChunkBoundary: snippet(names[1], "class ChunkBoundary"),
  App: snippet(names[1], "function ReportsApp"),
};
function load(source) {
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    toolRequire,
    module,
    module.exports,
  );
  return module.exports;
}
for (const name of names) {
  test(`Sintassi JSX/CSS: ${name} (non equivale a esecuzione)`, () => {
    for (const block of trees
      .get(name)
      .children.filter(
        (n) => n.type === "code" && ["jsx", "css"].includes(n.lang),
      )) {
      assert.doesNotThrow(() =>
        transformSync(block.value, { loader: block.lang, jsx: "automatic" }),
      );
    }
  });
}
test("Pannello: markup statico iniziale con label e bozza vuota", () => {
  const html = renderToStaticMarkup(
    React.createElement(load(sources.ReportsPanel).default),
  );
  assert.match(html, /Bozza rapporto/);
  assert.match(html, /<textarea[^>]*><\/textarea>/);
  assert.match(html, /Caratteri: 0/);
});
test("ChunkBoundary: comportamento della classe e render server senza protezione", () => {
  const { ChunkBoundary } = load(sources.ChunkBoundary);
  assert.deepEqual(ChunkBoundary.getDerivedStateFromError(new Error("prova")), {
    failed: true,
  });
  const calls = [],
    instance = new ChunkBoundary({ onError: (...args) => calls.push(args) });
  const error = new Error("prova"),
    info = { componentStack: "stack" };
  instance.componentDidCatch(error, info);
  assert.deepEqual(calls, [[error, info]]);
  function Fail() {
    throw error;
  }
  assert.throws(
    () =>
      renderToStaticMarkup(
        React.createElement(ChunkBoundary, null, React.createElement(Fail)),
      ),
    /prova/,
  );
});

const oldNodeEnv = process.env.NODE_ENV;
let root, temp, vite, dev, preview, browser, devUrl, prodUrl, panelFile;
const linked = [];
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-react-virtual-suspense-"));
  await mkdir(path.join(root, "src"));
  for (const name of [
    "react",
    "react-dom",
    "vite",
    "@vitejs/plugin-react",
    "@tanstack/react-virtual",
  ]) {
    const link = path.join(root, "node_modules", name);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(
      path.join(toolsRoot, "node_modules", name),
      link,
      process.platform === "win32" ? "junction" : "dir",
    );
    linked.push(link);
  }
  const intro = "Introduzione e Toolchain";
  const files = {
    "package.json": snippet(intro, '"react-notes-demo"', "json"),
    "vite.config.js": snippet(intro, "defineConfig", "javascript"),
    "index.html": snippet(intro, "<!doctype html>", "html"),
    "src/main.jsx": snippet(intro, "import { StrictMode }"),
    "src/virtual-log.css": snippet(names[0], ".virtual-log {", "css"),
    "src/reports.css": snippet(names[1], ".reports-app {", "css"),
    "workbench.html":
      '<!doctype html><html lang="it"><head><title>Virtual e Suspense</title><link rel="icon" href="data:,"></head><body><h1>Fixture React</h1><main id="root"></main><script type="module" src="/src/probes.jsx"></script></body></html>',
  };
  for (const [name, source] of Object.entries(sources))
    files[`src/${name}.jsx`] = source;
  files["src/probes.jsx"] = `
import {createElement as h,StrictMode,Suspense,lazy,useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {VirtualLog} from './VirtualLog.jsx';
import Fixed from './Fixed.jsx';
import Measured from './Measured.jsx';
import {ChunkBoundary} from './ChunkBoundary.jsx';
window.caught=[];window.failures=[];window.loadCalls=0;window.logged=[];
const root=createRoot(document.getElementById('root'),{onCaughtError:e=>window.caught.push(e.message),onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
const components={VirtualLog,Fixed,Measured};
window.mount=(name,props={},key='stable')=>root.render(h(StrictMode,null,name?h(components[name],{...props,key}):null));
function Panel(){const [draft,setDraft]=useState('');return h('label',null,'Bozza fixture',h('input',{value:draft,onChange:e=>setDraft(e.target.value)}));}
window.prepareLazy=()=>{
 const deferred=Promise.withResolvers();
 const Lazy=lazy(()=>{window.loadCalls++;return deferred.promise;});
 window.resolveLazy=()=>deferred.resolve({default:Panel});
 window.rejectLazy=()=>deferred.reject(new Error('Errore loader di prova'));
 window.mountLazy=(show=true,key='stable')=>root.render(h(StrictMode,null,h(ChunkBoundary,{key,onError:e=>window.logged.push(e.message)},h(Suspense,{fallback:h('p',{role:'status'},'Attesa fixture')},show?h(Lazy):null))));
};
window.prepareNested=()=>{
 const a=Promise.withResolvers(),b=Promise.withResolvers();
 const A=lazy(()=>a.promise),B=lazy(()=>b.promise);
 window.resolveA=()=>a.resolve({default:()=>h('p',null,'Contenuto A')});
 window.resolveB=()=>b.resolve({default:()=>h('p',null,'Contenuto B')});
 root.render(h(StrictMode,null,h(Suspense,{fallback:h('p',null,'Attesa esterna')},h(A),h(Suspense,{fallback:h('p',null,'Attesa interna')},h(B)))));
};
function EffectData(){
 const [value,setValue]=useState('Attesa gestita dal componente');
 useEffect(()=>{let active=true;window.resolveEffect=()=>{if(active)setValue('Dato pronto');};return()=>{active=false;};},[]);
 return h('p',null,value);
}
window.mountEffect=()=>root.render(h(StrictMode,null,h(Suspense,{fallback:h('p',null,'Fallback non atteso')},h(EffectData))));
window.ready=true;
`;
  for (const [file, contents] of Object.entries(files))
    await writeFile(path.join(root, file), contents);
  vite = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  process.env.NODE_ENV = "production";
  await vite.build({
    root,
    logLevel: "error",
    build: {
      manifest: true,
      rolldownOptions: {
        input: {
          main: path.join(root, "index.html"),
          workbench: path.join(root, "workbench.html"),
        },
      },
    },
  });
  const manifest = JSON.parse(
    await readFile(path.join(root, "dist/.vite/manifest.json"), "utf8"),
  );
  const panel = Object.values(manifest).find(
    (entry) => entry.src === "src/ReportsPanel.jsx",
  );
  assert(panel?.isDynamicEntry, "ReportsPanel deve essere una entry dinamica");
  panelFile = panel.file;
  preview = await vite.preview({
    root,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  });
  prodUrl = `http://127.0.0.1:${preview.httpServer.address().port}`;
  process.env.NODE_ENV = "development";
  dev = await vite.createServer({
    root,
    logLevel: "error",
    mode: "development",
    server: { host: "127.0.0.1", port: 0 },
  });
  await dev.listen();
  assert.equal(dev.config.isProduction, false);
  devUrl = `http://127.0.0.1:${dev.httpServer.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Vite ${vite.version}; Chrome ${browser.version()}; TanStack Virtual 3.14.20; chunk ${panelFile}`,
  );
});
after(async () => {
  try {
    await browser?.close();
    await dev?.close();
    if (preview)
      await new Promise((resolve, reject) =>
        preview.httpServer.close((error) =>
          error ? reject(error) : resolve(),
        ),
      );
  } finally {
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), temp);
      assert(
        path.basename(resolved).startsWith("appunti-react-virtual-suspense-"),
      );
      for (const link of linked) await unlink(link);
      await rm(root, { recursive: true, force: true });
    }
  }
});
const rows = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    text: `Riga ${i}`,
  }));
const panelPath = (mode) =>
  mode === "production" ? `/${panelFile}` : "/src/ReportsPanel.jsx";
async function withPage(
  mode,
  run,
  { direct = false, beforeGoto, expectedCaught = [], consolePattern } = {},
) {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 800 },
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [],
      consoleErrors = [],
      httpErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) consoleErrors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.url()}`);
    });
    if (beforeGoto) await beforeGoto(page);
    const response = await page.goto(
      `${mode === "production" ? prodUrl : devUrl}/${direct ? "" : "workbench.html"}`,
    );
    assert.equal(response.status(), 200);
    if (!direct) await page.waitForFunction(() => window.ready);
    await run(page);
    if (!direct) {
      assert.deepEqual(
        await page.evaluate(() => [...new Set(window.caught)]),
        expectedCaught,
      );
      await page.evaluate(() => window.mount(null));
      await page.waitForFunction(
        () => document.getElementById("root").childElementCount === 0,
      );
      assert.deepEqual(await page.evaluate(() => window.failures), []);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(httpErrors, []);
    if (consolePattern) {
      assert(consoleErrors.length > 0);
      for (const error of consoleErrors) assert.match(error, consolePattern);
    } else assert.deepEqual(consoleErrors, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name, props = {}) {
  await page.evaluate(({ name, props }) => window.mount(name, props), {
    name,
    props,
  });
  await page.locator("#root > *").first().waitFor({ state: "attached" });
}
async function waitText(page, text) {
  await page.waitForFunction(
    (text) => document.body.textContent.includes(text),
    text,
  );
}
async function checkRows(page, total) {
  await page.waitForFunction(
    () => document.querySelectorAll(".virtual-log-row").length > 0,
  );
  const result = await page
    .locator(".virtual-log-row")
    .evaluateAll((elements) =>
      elements.map((e) => ({
        index: Number(e.dataset.index),
        position: Number(e.getAttribute("aria-posinset")),
        total: Number(e.getAttribute("aria-setsize")),
        height: e.getBoundingClientRect().height,
        top: e.getBoundingClientRect().top,
        bottom: e.getBoundingClientRect().bottom,
      })),
    );
  assert(result.length < Math.min(total, 50));
  for (let i = 0; i < result.length; i++) {
    assert.equal(result[i].position, result[i].index + 1);
    assert.equal(result[i].total, total);
    assert(result[i].height >= 47.5);
    if (i)
      assert(
        Math.abs(result[i].top - result[i - 1].bottom) < 2,
        JSON.stringify(result.slice(i - 1, i + 1)),
      );
  }
  return result;
}
async function scan(page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () =>
    window.axe.run(document.getElementById("root") ?? document.body, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    }),
  );
  assert.deepEqual(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
}

test("Vite: chunk dinamica separata e non precaricata dall'HTML iniziale", async () => {
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert(!html.includes(panelFile));
  const chunk = await readFile(path.join(root, "dist", panelFile), "utf8");
  assert(chunk.includes("Bozza rapporto"));
});
for (const mode of ["development", "production"]) {
  test(`${mode}: 5000 record, DOM limitato, righe fisse e ARIA`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Fixed");
      await waitText(page, "Evento 00001");
      const rendered = await checkRows(page, 5000);
      assert(rendered.every((r) => r.height === 48));
      assert.equal(
        await page
          .locator(".virtual-log-space")
          .evaluate((el) => el.getBoundingClientRect().height),
        5000 * 48,
      );
      await scan(page);
    }));
  test(`${mode}: Fine/Inizio cambiano intervallo e smontano le righe lontane`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Fixed");
      await page.getByRole("button", { name: "Fine", exact: true }).click();
      await waitText(page, "Evento 05000");
      assert.equal(await page.locator('[data-item-id="event-1"]').count(), 0);
      await checkRows(page, 5000);
      await page.getByRole("button", { name: "Inizio", exact: true }).click();
      await waitText(page, "Evento 00001");
      assert.equal(
        await page.locator('[data-item-id="event-5000"]').count(),
        0,
      );
    }));
  test(`${mode}: scroll da tastiera conserva focus sulla regione`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Fixed");
      const region = page.getByRole("region", { name: "Archivio eventi" });
      await region.focus();
      await page.keyboard.press("PageDown");
      await page.waitForFunction(
        () => document.querySelector(".virtual-log-viewport").scrollTop > 100,
      );
      assert(await region.evaluate((e) => document.activeElement === e));
      assert((await page.locator(".virtual-log-row").count()) < 50);
    }));
  test(`${mode}: ID coerenti dopo riordino, riduzione e svuotamento`, () =>
    withPage(mode, async (page) => {
      const items = rows(1000);
      await mount(page, "VirtualLog", { items });
      await page.getByRole("button", { name: "Fine", exact: true }).click();
      await waitText(page, "Riga 999");
      await mount(page, "VirtualLog", { items: items.slice(0, 3) });
      await page.waitForFunction(
        () => document.querySelectorAll(".virtual-log-row").length === 3,
      );
      await mount(page, "VirtualLog", { items: items.slice(0, 3).reverse() });
      await page.waitForFunction(
        () =>
          document.querySelector(".virtual-log-row")?.dataset.itemId === "id-2",
      );
      assert.deepEqual(
        await page.locator(".virtual-log-row").allTextContents(),
        ["Riga 2", "Riga 1", "Riga 0"],
      );
      await mount(page, "VirtualLog", { items: [] });
      await waitText(page, "Nessun evento");
      assert.equal(await page.locator(".virtual-log-row").count(), 0);
      assert(
        await page
          .getByRole("button", { name: "Fine", exact: true })
          .isDisabled(),
      );
      await mount(page, "VirtualLog", { items });
      await waitText(page, "Riga 0");
      await checkRows(page, 1000);
    }));
  test(`${mode}: righe dinamiche, misure e resize senza sovrapposizioni`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Measured");
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".virtual-log-row")].some(
          (e) => e.getBoundingClientRect().height > 48,
        ),
      );
      await checkRows(page, 200);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(
        () => document.querySelector(".virtual-log-viewport").clientWidth < 400,
      );
      await page.waitForFunction(() => {
        const rows = [...document.querySelectorAll(".virtual-log-row")];
        return (
          rows.length > 0 &&
          rows.every(
            (e, i) =>
              i === 0 ||
              Math.abs(
                e.getBoundingClientRect().top -
                  rows[i - 1].getBoundingClientRect().bottom,
              ) < 2,
          )
        );
      });
      await checkRows(page, 200);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.getByRole("button", { name: "Fine", exact: true }).click();
      await page.locator('[data-item-id="message-199"]').waitFor();
      await checkRows(page, 200);
    }));
  test(`${mode}: lazy risolto mantiene il loader, non la bozza smontata`, () =>
    withPage(mode, async (page) => {
      await page.evaluate(() => {
        window.prepareLazy();
        window.mountLazy();
      });
      await waitText(page, "Attesa fixture");
      assert.equal(await page.evaluate(() => window.loadCalls), 1);
      await page.evaluate(() => window.resolveLazy());
      await page.getByLabel("Bozza fixture").fill("Temporanea");
      await page.evaluate(() => window.mountLazy(false));
      await page.getByLabel("Bozza fixture").waitFor({ state: "detached" });
      await page.evaluate(() => window.mountLazy(true));
      assert.equal(await page.getByLabel("Bozza fixture").inputValue(), "");
      assert.equal(await page.evaluate(() => window.loadCalls), 1);
    }));
  test(`${mode}: reset boundary non ritenta il loader rifiutato`, () =>
    withPage(
      mode,
      async (page) => {
        await page.evaluate(() => {
          window.prepareLazy();
          window.mountLazy();
        });
        await waitText(page, "Attesa fixture");
        await page.evaluate(() => window.rejectLazy());
        await page.getByRole("alert").waitFor();
        const previousErrors = await page.evaluate(() => window.logged.length);
        await page.evaluate(() => window.mountLazy(true, "reset"));
        await page.waitForFunction(
          (previous) => window.logged.length > previous,
          previousErrors,
        );
        await page.getByRole("alert").waitFor();
        assert.equal(await page.evaluate(() => window.loadCalls), 1);
        assert(
          (await page.evaluate(() => window.logged)).every(
            (s) => s === "Errore loader di prova",
          ),
        );
      },
      { expectedCaught: ["Errore loader di prova"] },
    ));
  test(`${mode}: boundary annidati rivelano gruppi separati`, () =>
    withPage(mode, async (page) => {
      await page.evaluate(() => window.prepareNested());
      await waitText(page, "Attesa esterna");
      await page.evaluate(() => window.resolveA());
      await waitText(page, "Contenuto A");
      await waitText(page, "Attesa interna");
      await page.evaluate(() => window.resolveB());
      await waitText(page, "Contenuto B");
      assert.equal(
        await page.getByText("Attesa interna", { exact: true }).count(),
        0,
      );
    }));
  test(`${mode}: attesa gestita in effect non attiva Suspense`, () =>
    withPage(mode, async (page) => {
      await page.evaluate(() => window.mountEffect());
      await waitText(page, "Attesa gestita dal componente");
      assert.equal(
        await page.getByText("Fallback non atteso", { exact: true }).count(),
        0,
      );
      await page.evaluate(() => window.resolveEffect());
      await waitText(page, "Dato pronto");
    }));
  test(`${mode}: import reale solo all'apertura, cache e stato indipendenti`, async () => {
    const requests = [];
    await withPage(
      mode,
      async (page) => {
        await page.getByLabel("Titolo della sessione").fill("Sessione locale");
        assert.equal(requests.length, 0);
        await page.getByLabel("Mostra rapporti").check();
        await page.getByLabel("Bozza rapporto").fill("Prima bozza");
        assert.equal(requests.length, 1);
        await page.getByLabel("Mostra rapporti").uncheck();
        await page.getByLabel("Bozza rapporto").waitFor({ state: "detached" });
        await page.getByLabel("Mostra rapporti").check();
        assert.equal(await page.getByLabel("Bozza rapporto").inputValue(), "");
        assert.equal(
          await page.getByLabel("Titolo della sessione").inputValue(),
          "Sessione locale",
        );
        assert.equal(requests.length, 1);
        await scan(page);
      },
      {
        direct: true,
        beforeGoto: async (page) =>
          page.on("request", (r) => {
            if (new URL(r.url()).pathname === panelPath(mode))
              requests.push(r.url());
          }),
      },
    );
  });
  test(`${mode}: import ritardato, fallback, chiusura e completamento non cancellato`, async () => {
    const gate = Promise.withResolvers();
    let intercepted = 0,
      finished = 0;
    try {
      await withPage(
        mode,
        async (page) => {
          await page.getByLabel("Mostra rapporti").check();
          await page.getByRole("status").waitFor();
          assert.equal(intercepted, 1);
          await page.getByLabel("Titolo della sessione").fill("Durante attesa");
          await page.getByLabel("Mostra rapporti").uncheck();
          await page.getByRole("status").waitFor({ state: "detached" });
          const response = page.waitForResponse(
            (r) => new URL(r.url()).pathname === panelPath(mode),
          );
          gate.resolve();
          await response;
          await page.getByLabel("Mostra rapporti").check();
          await page.getByLabel("Bozza rapporto").waitFor();
          assert.equal(finished, 1);
          assert.equal(intercepted, 1);
          assert.equal(
            await page.getByLabel("Titolo della sessione").inputValue(),
            "Durante attesa",
          );
        },
        {
          direct: true,
          beforeGoto: async (page) =>
            page.route(
              (url) => url.pathname === panelPath(mode),
              async (route) => {
                intercepted++;
                await gate.promise;
                await route.continue();
                finished++;
              },
            ),
        },
      );
    } finally {
      gate.resolve();
    }
  });
  test(`${mode}: errore modulo, riapertura fallisce ancora, reload esplicito recupera`, () =>
    withPage(
      mode,
      async (page) => {
        await page.getByLabel("Titolo della sessione").fill("Non persistito");
        await page.getByLabel("Mostra rapporti").check();
        await page.getByRole("alert").waitFor();
        assert.equal(
          await page.getByLabel("Titolo della sessione").inputValue(),
          "Non persistito",
        );
        await page.getByLabel("Mostra rapporti").uncheck();
        await page.getByRole("alert").waitFor({ state: "detached" });
        await page.getByLabel("Mostra rapporti").check();
        await page.getByRole("alert").waitFor();
        await page.unrouteAll();
        await Promise.all([
          page.waitForEvent("load"),
          page.getByRole("button", { name: "Ricarica pagina" }).click(),
        ]);
        assert.equal(
          await page.getByLabel("Titolo della sessione").inputValue(),
          "",
        );
        await page.getByLabel("Mostra rapporti").check();
        await page.getByLabel("Bozza rapporto").waitFor();
      },
      {
        direct: true,
        consolePattern: /Chunk demo non disponibile/,
        beforeGoto: async (page) =>
          page.route(
            (url) => url.pathname === panelPath(mode),
            (route) =>
              route.fulfill({
                status: 200,
                contentType: "text/javascript",
                body: 'throw new Error("Chunk demo non disponibile"); export default function Broken() {}',
              }),
          ),
      },
    ));
}
