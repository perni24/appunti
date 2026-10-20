import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
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
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const axe = toolRequire("axe-core");
const names = [
  "useTransition e useDeferredValue",
  "Gestione della memoria e AbortController",
];
const trees = names.map(
  (name) => parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
);
function snippet(index, marker) {
  const blocks = trees[index].children.filter(
    (n) => n.type === "code" && n.lang === "jsx" && n.value.includes(marker),
  );
  assert.equal(blocks.length, 1, marker);
  return blocks[0].value;
}
const sources = {
  Search: snippet(0, "function SearchComparison"),
  Profile: snippet(1, "function ProfileDemo"),
  Viewport: snippet(1, "function ViewportWidth"),
};
function load(name) {
  const code = transformSync(sources[name], {
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
for (const [index, name] of names.entries()) {
  test(`Sintassi JSX: ${name} (non equivale a esecuzione)`, () => {
    for (const block of trees[index].children.filter(
      (n) => n.type === "code" && n.lang === "jsx",
    )) {
      assert.doesNotThrow(() =>
        transformSync(block.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Filtro: trim, case, ordine e input non mutato", () => {
  const { filterItems } = load("Search");
  const items = Object.freeze([
    Object.freeze({ id: "a", name: "Ada" }),
    Object.freeze({ id: "b", name: "Grace" }),
  ]);
  assert.deepEqual(filterItems(items, " AD "), [items[0]]);
  assert.deepEqual(filterItems(items, ""), items);
  assert.deepEqual(filterItems(items, "assente"), []);
  assert.notEqual(filterItems(items, ""), items);
});
test("Profilo: schema, ID coerente e proiezione dei campi", () => {
  const { checkProfile } = load("Profile");
  assert.deepEqual(
    checkProfile({ id: "a", name: "Ada", secret: "privato" }, "a"),
    { id: "a", name: "Ada" },
  );
  for (const value of [
    null,
    [],
    "Ada",
    {},
    { id: "b", name: "Ada" },
    { id: "a", name: " " },
    { id: "a", name: 1 },
  ]) {
    assert.throws(() => checkProfile(value, "a"), /Profilo non valido/);
  }
});
test("Loader originale: successo ed errore locale senza mock", async () => {
  const { loadProfileDemo } = load("Profile");
  assert.deepEqual(
    await loadProfileDemo("a", { signal: new AbortController().signal }),
    { id: "a", name: "Ada" },
  );
  await assert.rejects(
    loadProfileDemo("missing", { signal: new AbortController().signal }),
    /Profilo assente/,
  );
});
test("Loader originale: abort prima e durante, motivo conservato", async () => {
  const { loadProfileDemo } = load("Profile");
  const first = new AbortController(),
    reason = new Error("motivo custom");
  first.abort(reason);
  await assert.rejects(
    loadProfileDemo("a", { signal: first.signal }),
    (error) => error === reason,
  );
  const second = new AbortController();
  const pending = loadProfileDemo("slow", { signal: second.signal });
  second.abort(reason);
  await assert.rejects(pending, (error) => error === reason);
});
test("SSR: ricerca iniziale e label distinte", () => {
  const html = renderToStaticMarkup(
    React.createElement(load("Search").default),
  );
  assert.match(html, /2000 risultati/);
  const ids = [...html.matchAll(/<input[^>]+id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
});
test("SSR: viewport non legge window e profilo non avvia richieste", () => {
  assert.match(
    renderToStaticMarkup(React.createElement(load("Viewport").default)),
    /Misura in attesa/,
  );
  let calls = 0;
  const html = renderToStaticMarkup(
    React.createElement(load("Profile").ProfilePanel, {
      userId: "a",
      load: () => {
        calls++;
      },
    }),
  );
  assert.match(html, /Caricamento profilo/);
  assert.equal(calls, 0);
});

// Probe API separati dai demo: le Promise controllate rendono osservabile Suspense.
const entry = `
import Search from 'note:Search';
import Profile, {ProfilePanel, fetchProfile} from 'note:Profile';
import Viewport from 'note:Viewport';
import {createElement as h, StrictMode, Suspense, memo, use, useState, useTransition, useDeferredValue} from 'react';
import {createRoot} from 'react-dom/client';
window.failures=[];
const root=createRoot(document.getElementById('root'),{onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
window.calls=[];
window.prepareLoader=(cooperative=false)=>{
 window.calls=[];
 window.loader=(id,{signal})=>{
  const gate=Promise.withResolvers();
  window.calls.push({id,signal,...gate});
  if(cooperative){
   if(signal.aborted) gate.reject(signal.reason);
   else signal.addEventListener('abort',()=>gate.reject(signal.reason),{once:true});
  }
  return gate.promise;
 };
};
window.settle=(id,kind='resolve',name=id)=>{
 for(const call of window.calls.filter(c=>c.id===id)) {
  if(kind==='reject') call.reject(new Error('Errore controllato'));
  else call.resolve({id,name});
 }
};
const gates=new Map([['base',{promise:Promise.resolve('base')}]]);
function getGate(key){
 if(!gates.has(key)) gates.set(key,Promise.withResolvers());
 return gates.get(key);
}
window.resolveGate=key=>getGate(key).resolve(key);
const Resource=memo(function Resource({value}){return h('p',{'data-testid':'resource'},'Dato: '+use(getGate(value).promise));});
function TransitionProbe(){
 const [value,setValue]=useState('base'),[count,setCount]=useState(0),[pending,start]=useTransition();
 return h('section',null,
  h('button',{onClick:()=>{window.order=['before'];start(()=>{window.order.push('callback');setValue('next');});window.order.push('after');}},'Transition probe'),
  h('button',{onClick:()=>setCount(n=>n+1)},'Urgente '+count),
  h('p',{'data-testid':'pending'},String(pending)),
  h(Suspense,{fallback:h('p',null,'Fallback probe')},h(Resource,{value})));
}
function DeferredProbe(){
 const [query,setQuery]=useState('base'),value=useDeferredValue(query);
 return h('section',null,
  h('label',null,'Query probe',h('input',{value:query,onChange:e=>{getGate(e.target.value);setQuery(e.target.value);}})),
  h('p',{'data-testid':'stale'},String(query!==value)),
  h(Suspense,{fallback:h('p',null,'Fallback probe')},h(Resource,{value})));
}
const components={Search,Profile,ProfilePanel,Viewport,TransitionProbe,DeferredProbe};
window.mount=(name,props={})=>root.render(h(StrictMode,null,name?h(components[name],props):null));
window.mountPanel=(id,timeoutMs=10000)=>window.mount('ProfilePanel',{userId:id,load:window.loader,timeoutMs});
window.fetchProfile=fetchProfile;
window.ready=true;
`;
let server, browser, origin;
const bundles = new Map();
before(async () => {
  for (const mode of ["development", "production"]) {
    const result = await build({
      stdin: { contents: entry, loader: "jsx", resolveDir: toolsRoot },
      bundle: true,
      write: false,
      platform: "browser",
      format: "esm",
      jsx: "automatic",
      minify: mode === "production",
      nodePaths: [path.join(toolsRoot, "node_modules")],
      define: { "process.env.NODE_ENV": JSON.stringify(mode) },
      plugins: [
        {
          name: "note-snippets",
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
    bundles.set(`/${mode}.js`, result.outputFiles[0].text);
  }
  server = createServer((req, res) => {
    if (bundles.has(req.url)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end(bundles.get(req.url));
    }
    if (req.url.startsWith("/api/users/")) {
      const id = decodeURIComponent(req.url.slice("/api/users/".length));
      res.writeHead(id === "missing" ? 404 : id === "fail" ? 500 : 200, {
        "Content-Type": "application/json",
      });
      if (id === "body") {
        res.write('{"id":"body",');
        return;
      }
      return res.end(
        id === "broken"
          ? "{invalid"
          : JSON.stringify({ id, name: id === "invalid" ? 42 : id }),
      );
    }
    const mode = req.url === "/production" ? "production" : "development";
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Concorrenza e risorse</title><link rel="icon" href="data:,"></head><body><h1>Fixture React</h1><main id="root"></main><script type="module" src="/${mode}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Chrome ${browser.version()}; esbuild ${require("esbuild/package.json").version}`,
  );
});
after(async () => {
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
async function withPage(mode, run, { init, httpErrors = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !(
        httpErrors &&
        /Failed to load resource:.*(404|500|ERR_ABORTED)/.test(message.text())
      )
    )
      errors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !(httpErrors && [404, 500].includes(response.status()))
    )
      errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  try {
    if (init) await page.addInitScript(init);
    await page.goto(`${origin}/${mode}`);
    await page.waitForFunction(() => window.ready);
    await run(page);
    assert.deepEqual(await page.evaluate(() => window.failures), []);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name, props = {}) {
  await page.evaluate(({ name, props }) => window.mount(name, props), {
    name,
    props,
  });
}
async function text(page, selector, expected) {
  await page.waitForFunction(
    ({ selector, expected }) =>
      document.querySelector(selector)?.textContent === expected,
    { selector, expected },
  );
}
async function accessible(page) {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    }),
  );
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "overflow orizzontale della pagina",
  );
}
for (const mode of ["development", "production"]) {
  test(`${mode}: ricerche originali indipendenti, reset, nessun risultato e axe`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Search");
      await page.getByLabel("Filtro transition", { exact: true }).waitFor();
      assert.equal(await page.locator("li").count(), 80);
      for (const [label, section] of [
        ["Filtro transition", 'section[aria-label="Ricerca con transition"]'],
        [
          "Filtro differito",
          'section[aria-label="Ricerca con valore differito"]',
        ],
      ]) {
        await page.getByLabel(label, { exact: true }).fill("Documento 2000");
        await page.waitForFunction(
          (section) => document.querySelectorAll(`${section} li`).length === 1,
          section,
        );
        assert.equal(
          await page.locator(`${section} li`).innerText(),
          "Documento 2000",
        );
        await page.getByLabel(label, { exact: true }).fill("assente");
        await page
          .locator(section)
          .getByText("Nessun risultato.", { exact: true })
          .waitFor();
        await page
          .locator(section)
          .getByRole("button", { name: "Azzera" })
          .click();
        await page.waitForFunction(
          (section) => document.querySelectorAll(`${section} li`).length === 40,
          section,
        );
      }
      await accessible(page);
    }));
  test(`${mode}: probe transition, callback sincrona, pending e aggiornamento urgente`, () =>
    withPage(mode, async (page) => {
      await mount(page, "TransitionProbe");
      await text(page, '[data-testid="resource"]', "Dato: base");
      await page.getByRole("button", { name: "Transition probe" }).click();
      await text(page, '[data-testid="pending"]', "true");
      assert.deepEqual(await page.evaluate(() => window.order), [
        "before",
        "callback",
        "after",
      ]);
      await text(page, '[data-testid="resource"]', "Dato: base");
      assert.equal(
        await page.getByText("Fallback probe", { exact: true }).count(),
        0,
      );
      await page.getByRole("button", { name: "Urgente 0" }).click();
      await page.getByRole("button", { name: "Urgente 1" }).waitFor();
      await page.evaluate(() => window.resolveGate("next"));
      await text(page, '[data-testid="resource"]', "Dato: next");
      await text(page, '[data-testid="pending"]', "false");
    }));
  test(`${mode}: probe deferred, input nuovo e risultato precedente fino alla risoluzione`, () =>
    withPage(mode, async (page) => {
      await mount(page, "DeferredProbe");
      await text(page, '[data-testid="resource"]', "Dato: base");
      await page.getByLabel("Query probe").fill("first");
      await text(page, '[data-testid="stale"]', "true");
      await text(page, '[data-testid="resource"]', "Dato: base");
      await page.getByLabel("Query probe").fill("last");
      await page.evaluate(() => window.resolveGate("last"));
      await text(page, '[data-testid="resource"]', "Dato: last");
      await text(page, '[data-testid="stale"]', "false");
      await page.evaluate(() => window.resolveGate("first"));
      await text(page, '[data-testid="resource"]', "Dato: last");
      assert.equal(await page.getByLabel("Query probe").inputValue(), "last");
    }));
  test(`${mode}: profilo originale, successo, errore, annullamento e nuovo tentativo`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Profile");
      await page.getByText("Utente: Ada", { exact: true }).waitFor();
      await page.getByLabel("Profilo", { exact: true }).selectOption("missing");
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByRole("alert").innerText(),
        "Impossibile caricare il profilo.",
      );
      await page.getByLabel("Profilo", { exact: true }).selectOption("slow");
      await page.getByRole("button", { name: "Annulla", exact: true }).click();
      await text(page, '[role="status"]', "Caricamento annullato.");
      await page.getByRole("button", { name: "Ricarica", exact: true }).click();
      await text(page, '[role="status"]', "Caricamento profilo...");
      await page.getByLabel("Profilo", { exact: true }).selectOption("b");
      await page.getByText("Utente: Grace", { exact: true }).waitFor();
      await accessible(page);
    }));
  test(`${mode}: loader non cooperativo, risultati fuori ordine e cleanup su unmount`, () =>
    withPage(mode, async (page) => {
      await page.evaluate(() => {
        window.prepareLoader();
        window.mountPanel("a");
      });
      await page.waitForFunction(() =>
        window.calls.some((c) => c.id === "a" && !c.signal.aborted),
      );
      await page.evaluate(() => window.mountPanel("b"));
      await page.waitForFunction(() => window.calls.some((c) => c.id === "b"));
      assert(
        await page.evaluate(() =>
          window.calls
            .filter((c) => c.id === "a")
            .every((c) => c.signal.aborted),
        ),
      );
      await page.evaluate(() => window.settle("b", "resolve", "Nuovo"));
      await page.getByText("Utente: Nuovo", { exact: true }).waitFor();
      await page.evaluate(() => window.settle("a", "resolve", "Obsoleto"));
      await text(page, '[role="status"]', "Profilo pronto.");
      assert.equal(
        await page.getByText("Utente: Obsoleto", { exact: true }).count(),
        0,
      );
      await page.evaluate(() => window.mountPanel("c"));
      await page.waitForFunction(() => window.calls.some((c) => c.id === "c"));
      assert.equal(
        await page.getByText("Utente: Nuovo", { exact: true }).count(),
        0,
      );
      await mount(page, null);
      await page.waitForFunction(
        () => document.getElementById("root").childElementCount === 0,
      );
      assert(
        await page.evaluate(() => window.calls.every((c) => c.signal.aborted)),
      );
      await page.evaluate(() => window.settle("c", "reject"));
    }));
  test(`${mode}: timeout cooperativo, retry con controller nuovo e cancel tardivo`, () =>
    withPage(mode, async (page) => {
      await page.evaluate(() => {
        window.prepareLoader(true);
        window.mountPanel("slow", 150);
      });
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByRole("alert").innerText(),
        "Tempo di attesa esaurito.",
      );
      assert.equal(
        await page.evaluate(() => window.calls.at(-1).signal.reason.name),
        "TimeoutError",
      );
      await page.getByRole("button", { name: "Ricarica", exact: true }).click();
      await page.waitForFunction(() =>
        window.calls.some((c) => !c.signal.aborted),
      );
      assert(
        await page.evaluate(
          () =>
            new Set(window.calls.map((c) => c.signal)).size ===
            window.calls.length,
        ),
      );
      await page.evaluate(() => window.settle("slow", "resolve", "Ritentato"));
      await page.getByText("Utente: Ritentato", { exact: true }).waitFor();
      await mount(page, null);
      await page.waitForFunction(
        () => document.getElementById("root").childElementCount === 0,
      );
      await page.evaluate(() => {
        window.prepareLoader();
        window.mountPanel("ignored");
      });
      await page.waitForFunction(() =>
        window.calls.some((c) => !c.signal.aborted),
      );
      await page.getByRole("button", { name: "Annulla", exact: true }).click();
      await page.evaluate(() =>
        window.settle("ignored", "resolve", "Non pubblicare"),
      );
      await text(page, '[role="status"]', "Caricamento annullato.");
      assert.equal(
        await page.getByText("Utente: Non pubblicare", { exact: true }).count(),
        0,
      );
    }));
  test(`${mode}: fetchProfile con HTTP reale locale, JSON/schema e abort del corpo`, () =>
    withPage(
      mode,
      async (page) => {
        const result = await page.evaluate(async () => {
          const output = {};
          for (const id of ["a/b ?", "missing", "fail", "broken", "invalid"]) {
            try {
              output[id] = await window.fetchProfile(id, {
                signal: new AbortController().signal,
              });
            } catch (error) {
              output[id] = { error: error.name, message: error.message };
            }
          }
          return output;
        });
        assert.deepEqual(result["a/b ?"], { id: "a/b ?", name: "a/b ?" });
        assert.equal(result.missing.message, "HTTP 404");
        assert.equal(result.fail.message, "HTTP 500");
        assert.equal(result.broken.error, "SyntaxError");
        assert.equal(result.invalid.error, "TypeError");
        await page.evaluate(() => {
          const nativeFetch = window.fetch;
          window.headersReceived = false;
          window.fetch = async (...args) => {
            const response = await nativeFetch(...args);
            window.headersReceived = true;
            return response;
          };
          window.controller = new AbortController();
          window
            .fetchProfile("body", { signal: window.controller.signal })
            .then(
              () => {
                window.bodyResult = "unexpected";
              },
              (error) => {
                window.bodyResult = error.name;
              },
            );
        });
        await page.waitForFunction(() => window.headersReceived);
        await page.evaluate(() => window.controller.abort());
        await page.waitForFunction(() => window.bodyResult);
        assert.equal(
          await page.evaluate(() => window.bodyResult),
          "AbortError",
        );
      },
      { httpErrors: true },
    ));
  test(`${mode}: viewport, listener e timer rimossi anche con Strict Mode`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "Viewport");
        await text(page, '[role="status"]', "Larghezza: 390");
        assert.equal(
          await page.evaluate(
            () => window.resources.signals.filter((s) => !s.aborted).length,
          ),
          1,
        );
        assert.equal(
          await page.evaluate(() => window.resources.signals.length),
          mode === "development" ? 2 : 1,
        );
        await page.setViewportSize({ width: 430, height: 844 });
        await text(page, '[role="status"]', "Larghezza: 430");
        await page.evaluate(() => {
          dispatchEvent(new Event("resize"));
          window.mount(null);
        });
        await page.waitForFunction(
          () => document.getElementById("root").childElementCount === 0,
        );
        const state = await page.evaluate(() => {
          const before = window.resources.calls;
          dispatchEvent(new Event("resize"));
          return {
            active: window.resources.signals.filter((s) => !s.aborted).length,
            timers: window.resources.timers.size,
            extra: window.resources.calls - before,
          };
        });
        assert.deepEqual(state, { active: 0, timers: 0, extra: 0 });
      },
      {
        init: () => {
          window.resources = { signals: [], timers: new Set(), calls: 0 };
          const add = window.addEventListener.bind(window),
            set = window.setTimeout.bind(window),
            clear = window.clearTimeout.bind(window);
          window.addEventListener = (type, listener, options) => {
            if (type === "resize" && options?.signal) {
              window.resources.signals.push(options.signal);
              return add(
                type,
                (...args) => {
                  window.resources.calls++;
                  return listener(...args);
                },
                options,
              );
            }
            return add(type, listener, options);
          };
          window.setTimeout = (fn, delay, ...args) => {
            if (delay !== 150) return set(fn, delay, ...args);
            const id = set(() => {
              window.resources.timers.delete(id);
              fn(...args);
            }, delay);
            window.resources.timers.add(id);
            return id;
          };
          window.clearTimeout = (id) => {
            window.resources.timers.delete(id);
            return clear(id);
          };
        },
      },
    ));
}
