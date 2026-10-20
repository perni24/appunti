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
const notes = ["Context API", "State Management Esterno", "Derived state"];
const trees = new Map(
  notes.map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker) {
  const blocks = trees
    .get(note)
    .children.filter(
      (node) =>
        node.type === "code" &&
        node.lang === "jsx" &&
        node.value.includes(marker),
    );
  assert.equal(blocks.length, 1, `${note}: ${marker}`);
  return blocks[0].value;
}
const sources = {
  FallbackDemo: snippet(notes[0], "function FallbackDemo"),
  LocaleDemo: snippet(notes[0], "function LocaleProvider"),
  ZustandDemo: snippet(notes[1], "function createLayoutStore"),
  ReduxDemo: snippet(notes[1], "function makeStore"),
  CartDemo: snippet(notes[2], "function createItems"),
  DraftDemo: snippet(notes[2], "function NameDraft"),
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
function freeze(value) {
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
}
for (const note of notes) {
  test(`Sintassi JSX: ${note} (schemi e anti-pattern inclusi, non esecuzione)`, () => {
    for (const node of trees
      .get(note)
      .children.filter((node) => node.type === "code" && node.lang === "jsx")) {
      assert.doesNotThrow(() =>
        transformSync(node.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Context statico: fallback, provider vicino e undefined esplicito", () => {
  const html = renderToStaticMarkup(
    React.createElement(load("FallbackDemo").default),
  );
  for (const text of [
    "Senza provider: light",
    "Provider esterno: dark",
    "Provider interno: undefined",
  ])
    assert(html.includes(text));
});
test("Context guard: assente, null e undefined falliscono con errore esplicito", () => {
  const { LocaleContext, LocaleView } = load("LocaleDemo");
  const view = React.createElement(LocaleView, { label: "Prova" });
  assert.throws(
    () => renderToStaticMarkup(view),
    /useLocale richiede LocaleProvider/,
  );
  for (const value of [null, undefined]) {
    assert.throws(
      () =>
        renderToStaticMarkup(
          React.createElement(LocaleContext, { value }, view),
        ),
      /useLocale richiede LocaleProvider/,
    );
  }
});
test("Context statico: false e zero non riattivano il fallback", () => {
  const { ThemeContext, ThemeLabel } = load("FallbackDemo");
  for (const value of [false, 0, ""]) {
    const html = renderToStaticMarkup(
      React.createElement(
        ThemeContext,
        { value },
        React.createElement(ThemeLabel, { label: "Valore" }),
      ),
    );
    assert.equal(html, `<p>Valore: ${String(value)}</p>`);
  }
});
test("Zustand: factory genera store isolati", () => {
  const { createLayoutStore } = load("ZustandDemo");
  const a = createLayoutStore(),
    b = createLayoutStore();
  a.getState().increment();
  a.getState().openSidebar();
  assert.equal(a.getState().count, 1);
  assert.equal(a.getState().sidebarOpen, true);
  assert.equal(b.getState().count, 0);
  assert.equal(b.getState().sidebarOpen, false);
});
test("Zustand: snapshot immutabile e reset conserva le azioni con merge", () => {
  const store = load("ZustandDemo").createLayoutStore();
  const previous = freeze(store.getState());
  previous.increment();
  previous.increment();
  previous.openSidebar();
  assert.equal(previous.count, 0);
  assert.equal(previous.sidebarOpen, false);
  assert.equal(store.getState().count, 2);
  assert.notEqual(store.getState(), previous);
  store.getState().reset();
  assert.equal(store.getState().count, 0);
  assert.equal(store.getState().sidebarOpen, false);
  assert.equal(store.getState().increment, previous.increment);
  assert.equal(store.getState().openSidebar, previous.openSidebar);
  store.getState().increment();
  assert.equal(store.getState().count, 1);
});
test("Zustand: subscribe riceve snapshot e unsubscribe ferma gli avvisi", () => {
  const store = load("ZustandDemo").createLayoutStore();
  const changes = [];
  const unsubscribe = store.subscribe((next, previous) =>
    changes.push([previous.count, next.count]),
  );
  store.getState().increment();
  assert.deepEqual(changes, [[0, 1]]);
  unsubscribe();
  store.getState().increment();
  assert.deepEqual(changes, [[0, 1]]);
});
test("Redux: factory isola store e percorso layout coerente", () => {
  const { makeStore, increment, openSidebar } = load("ReduxDemo");
  const a = makeStore(),
    b = makeStore();
  a.dispatch(increment());
  a.dispatch(openSidebar());
  assert.deepEqual(a.getState(), { layout: { sidebarOpen: true, count: 1 } });
  assert.deepEqual(b.getState(), { layout: { sidebarOpen: false, count: 0 } });
});
test("Redux: Immer non muta snapshot congelato, reset e azione ignota", () => {
  const { layoutReducer, increment, openSidebar, closeSidebar, reset } =
    load("ReduxDemo");
  const initial = freeze({ sidebarOpen: false, count: 0 });
  const action = freeze(increment());
  const next = layoutReducer(initial, action);
  assert.deepEqual(initial, { sidebarOpen: false, count: 0 });
  assert.deepEqual(next, { sidebarOpen: false, count: 1 });
  assert.notEqual(next, initial);
  assert.deepEqual(layoutReducer(initial, action), next);
  const open = layoutReducer(next, openSidebar());
  assert.deepEqual(layoutReducer(open, closeSidebar()), next);
  assert.deepEqual(layoutReducer(open, reset()), initial);
  assert.equal(layoutReducer(next, { type: "unrelated" }), next);
});
test("Redux: unsubscribe ferma gli avvisi della sottoscrizione manuale", () => {
  const { makeStore, increment } = load("ReduxDemo");
  const store = makeStore();
  const changes = [];
  const unsubscribe = store.subscribe(() =>
    changes.push(store.getState().layout.count),
  );
  store.dispatch(increment());
  unsubscribe();
  store.dispatch(increment());
  assert.deepEqual(changes, [1]);
});
test("Derived: initializer con array e record indipendenti", () => {
  const { createItems } = load("CartDemo");
  const a = createItems(),
    b = createItems();
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
  for (let i = 0; i < a.length; i++) assert.notEqual(a[i], b[i]);
});
test("Derived: totale include quantita, vuoto zero, nessuna mutazione", () => {
  const { createItems, calculateTotal } = load("CartDemo");
  const items = freeze(createItems());
  assert.equal(calculateTotal(items), 30000);
  assert.equal(calculateTotal([]), 0);
  assert.equal(
    calculateTotal(freeze([{ priceCents: 2500, quantity: 3 }])),
    7500,
  );
});
test("Derived: filtro normalizzato, ordinamento su copia e dati originali invariati", () => {
  const { createItems, selectVisible } = load("CartDemo");
  const items = freeze(createItems());
  assert.deepEqual(
    selectVisible(items, " MO ").map((item) => item.id),
    ["mouse", "screen"],
  );
  assert.deepEqual(
    selectVisible(items, "").map((item) => item.id),
    ["mouse", "keyboard", "screen"],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ["keyboard", "mouse", "screen"],
  );
  assert.deepEqual(selectVisible(items, "nessuno"), []);
});
test("Bozza: render statico iniziale, non una verifica di hydration", () => {
  const { NameDraft } = load("DraftDemo");
  const html = renderToStaticMarkup(
    React.createElement(NameDraft, { person: { id: "a", name: "Ada" } }),
  );
  assert.match(html, /value="Ada"/);
  assert.match(html, /Bozza: Ada/);
});

let server, browser, origin;
before(async () => {
  const bundles = new Map();
  for (const mode of ["development", "production"]) {
    const imports = Object.keys(sources)
      .map((name) => `import ${name} from 'note:${name}';`)
      .join("\n");
    const result = await build({
      stdin: {
        contents: `${imports}
import { LocaleProvider, LocaleControls, LocaleView } from 'note:LocaleDemo';
import { NameDraft } from 'note:DraftDemo';
import { createElement as h, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
function LocaleProbe({initialLocale, label}) {
  return h(LocaleProvider, {initialLocale}, h(LocaleControls, {label}), h(LocaleView, {label:'Prova'}));
}
const components={${Object.keys(sources).join(",")}, LocaleProbe, NameDraft};
const root=createRoot(document.getElementById('root'));
window.mount=(name,props={},key='stable')=>root.render(h(StrictMode,null,name?h(components[name],{...props,key}):null));
window.ready=true;`,
        loader: "jsx",
        resolveDir: toolsRoot,
      },
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      jsx: "automatic",
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
    const mode = req.url === "/production" ? "production" : "development";
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture Context e Store</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/${mode}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Zustand ${toolRequire("zustand/package.json").version}; RTK ${toolRequire("@reduxjs/toolkit/package.json").version}; React Redux ${toolRequire("react-redux/package.json").version}; Chrome ${browser.version()}`,
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
async function withPage(mode, run) {
  const context = await browser.newContext({
    viewport: { width: 1000, height: 800 },
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${origin}/${mode}`);
    await page.waitForFunction(() => window.ready);
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name, props = {}, key = "stable") {
  await page.evaluate(
    ({ name, props, key }) => window.mount(name, props, key),
    { name, props, key },
  );
}
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function exactText(page, text) {
  await page.getByText(text, { exact: true }).waitFor();
}
for (const mode of ["development", "production"]) {
  test(`Chrome ${mode}: default e provider annidati incluso undefined`, () =>
    withPage(mode, async (page) => {
      await mount(page, "FallbackDemo");
      for (const text of [
        "Senza provider: light",
        "Provider esterno: dark",
        "Provider interno: undefined",
      ])
        await exactText(page, text);
    }));
  test(`Chrome ${mode}: provider locali indipendenti, consumatori memo aggiornati`, () =>
    withPage(mode, async (page) => {
      await mount(page, "LocaleDemo");
      await exactText(page, "Principale: Ciao");
      await exactText(page, "Sezione: Hello");
      await page
        .getByRole("combobox", { name: "Lingua principale" })
        .selectOption("en");
      await exactText(page, "Principale: Hello");
      await exactText(page, "Sezione: Hello");
      await page
        .getByRole("combobox", { name: "Lingua sezione" })
        .selectOption("it");
      await exactText(page, "Principale: Hello");
      await exactText(page, "Sezione: Ciao");
      assert.notEqual(
        await page
          .getByRole("combobox", { name: "Lingua principale" })
          .getAttribute("id"),
        await page
          .getByRole("combobox", { name: "Lingua sezione" })
          .getAttribute("id"),
      );
    }));
  test(`Chrome ${mode}: initialLocale non resetta, nuova key si`, () =>
    withPage(mode, async (page) => {
      await mount(page, "LocaleProbe", { initialLocale: "it", label: "Prima" });
      await page.getByRole("combobox", { name: "Prima" }).selectOption("en");
      await mount(page, "LocaleProbe", {
        initialLocale: "it",
        label: "Seconda",
      });
      await page.getByRole("combobox", { name: "Seconda" }).waitFor();
      await exactText(page, "Prova: Hello");
      await mount(
        page,
        "LocaleProbe",
        { initialLocale: "it", label: "Terza" },
        "new",
      );
      await page.getByRole("combobox", { name: "Terza" }).waitFor();
      await exactText(page, "Prova: Ciao");
    }));
  for (const name of ["ZustandDemo", "ReduxDemo"]) {
    test(`Chrome ${mode}: ${name}, azioni condivise, chiusura e reset riutilizzabile`, () =>
      withPage(mode, async (page) => {
        await mount(page, name);
        await exactText(page, "Voci: 0; pannello: chiuso.");
        assert.equal(await button(page, "Chiudi pannello").count(), 0);
        await button(page, "Apri pannello").click();
        await button(page, "Aggiungi voce").click();
        await button(page, "Aggiungi voce").click();
        await exactText(page, "Voci: 2; pannello: aperto.");
        await button(page, "Chiudi pannello").click();
        await exactText(page, "Voci: 2; pannello: chiuso.");
        await button(page, "Ripristina").click();
        await exactText(page, "Voci: 0; pannello: chiuso.");
        await button(page, "Aggiungi voce").click();
        await button(page, "Apri pannello").click();
        await exactText(page, "Voci: 1; pannello: aperto.");
      }));
    test(`Chrome ${mode}: ${name}, stato oltre l'unmount ma non il reload`, () =>
      withPage(mode, async (page) => {
        await mount(page, name);
        await button(page, "Aggiungi voce").click();
        await mount(page, null);
        await page.waitForFunction(
          () => document.getElementById("root").childElementCount === 0,
        );
        await mount(page, name);
        await exactText(page, "Voci: 1; pannello: chiuso.");
        await page.reload();
        await page.waitForFunction(() => window.ready);
        await mount(page, name);
        await exactText(page, "Voci: 0; pannello: chiuso.");
      }));
  }
  test(`Chrome ${mode}: totale e selezione derivati restano correnti col filtro`, () =>
    withPage(mode, async (page) => {
      await mount(page, "CartDemo");
      await exactText(page, "Totale carrello: 300.00 EUR");
      assert.deepEqual(await page.locator("li > span").allTextContents(), [
        "Mouse: 2 unita",
        "Tastiera: 1 unita",
        "Monitor: 1 unita",
      ]);
      await button(page, "Seleziona Mouse").click();
      await button(page, "Aumenta Mouse").click();
      await exactText(page, "Selezionato: Mouse, 3 unita.");
      await exactText(page, "Totale carrello: 325.00 EUR");
      assert.equal(
        await button(page, "Seleziona Mouse").getAttribute("aria-pressed"),
        "true",
      );
      await page.getByLabel("Filtra prodotti").fill(" Tastiera ");
      await exactText(page, "Righe visibili: 1 su 3");
      await exactText(page, "Totale carrello: 325.00 EUR");
      await exactText(page, "Selezionato: Mouse, 3 unita.");
      await page.getByLabel("Filtra prodotti").fill("nessuno");
      await exactText(page, "Nessun prodotto visibile.");
      await exactText(page, "Righe visibili: 0 su 3");
    }));
  test(`Chrome ${mode}: rimozione selezionato, carrello vuoto e reset`, () =>
    withPage(mode, async (page) => {
      await mount(page, "CartDemo");
      await button(page, "Seleziona Mouse").click();
      await button(page, "Rimuovi Mouse").click();
      await exactText(page, "Nessuna selezione.");
      await exactText(page, "Totale carrello: 250.00 EUR");
      await button(page, "Rimuovi Tastiera").click();
      await button(page, "Rimuovi Monitor").click();
      await exactText(page, "Totale carrello: 0.00 EUR");
      await exactText(page, "Righe visibili: 0 su 0");
      await page.getByLabel("Filtra prodotti").fill("query");
      await button(page, "Ripristina carrello").click();
      await exactText(page, "Totale carrello: 300.00 EUR");
      await exactText(page, "Righe visibili: 3 su 3");
      assert.equal(await page.getByLabel("Filtra prodotti").inputValue(), "");
    }));
  test(`Chrome ${mode}: cambio persona scarta la bozza secondo la key`, () =>
    withPage(mode, async (page) => {
      await mount(page, "DraftDemo");
      const input = page.getByLabel("Nome nella bozza");
      await input.fill("Bozza Ada");
      await page
        .getByRole("combobox", { name: /Persona/ })
        .selectOption("grace");
      await exactText(page, "Bozza: Grace");
      await input.fill("Bozza Grace");
      await page.getByRole("combobox", { name: /Persona/ }).selectOption("ada");
      await exactText(page, "Bozza: Ada");
    }));
  test(`Chrome ${mode}: nuova prop non sovrascrive la bozza gia montata`, () =>
    withPage(mode, async (page) => {
      await mount(page, "NameDraft", { person: { id: "a", name: "Ada" } });
      const input = page.getByLabel("Nome nella bozza");
      await input.fill("Modifica locale");
      await mount(page, "NameDraft", {
        person: { id: "a", name: "Ada aggiornata" },
      });
      await page
        .getByRole("heading", { name: "Bozza di Ada aggiornata" })
        .waitFor();
      assert.equal(await input.inputValue(), "Modifica locale");
      await mount(
        page,
        "NameDraft",
        { person: { id: "a", name: "Ada aggiornata" } },
        "new",
      );
      await exactText(page, "Bozza: Ada aggiornata");
    }));
}
