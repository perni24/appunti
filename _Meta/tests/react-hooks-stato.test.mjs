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
const notes = ["useMemo e useCallback", "useReducer", "Custom Hooks"];
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
  MemoApp: snippet(notes[0], "function ProductPicker"),
  Counter: snippet(notes[1], "function counterReducer"),
  ProfileForm: snippet(notes[1], "function createForm"),
  Panels: snippet(notes[2], "function useToggle"),
  Title: snippet(notes[2], "function useDocumentTitle"),
  SearchDemo: snippet(notes[2], "function useDebouncedValue"),
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
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const { createForm, formReducer } = load("ProfileForm");

for (const note of notes) {
  test(`Sintassi JSX: ${note} (schemi inclusi, non esecuzione)`, () => {
    for (const node of trees
      .get(note)
      .children.filter((node) => node.type === "code" && node.lang === "jsx")) {
      assert.doesNotThrow(() =>
        transformSync(node.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Filtro puro: normalizza query e non muta il catalogo", () => {
  const { filterProducts } = load("MemoApp");
  const products = freeze([
    { name: "Monitor" },
    { name: "Mouse" },
    { name: "Tastiera" },
  ]);
  assert.deepEqual(filterProducts(products, " MO "), products.slice(0, 2));
  assert.deepEqual(filterProducts(products, "assente"), []);
  assert.deepEqual(filterProducts(products, ""), products);
  assert.notEqual(filterProducts(products, ""), products);
});
test("Counter reducer: sequenza pura e azione sconosciuta", () => {
  const { counterReducer } = load("Counter");
  const initial = freeze({ count: 0 });
  const action = freeze({ type: "increment" });
  const once = counterReducer(initial, action);
  assert.deepEqual(counterReducer(once, action), { count: 2 });
  assert.deepEqual(counterReducer(once, { type: "decrement" }), initial);
  assert.deepEqual(counterReducer(initial, action), once);
  assert.throws(() => counterReducer(initial, { type: "typo" }), /sconosciuta/);
});
test("Initializer: stato e valori annidati indipendenti", () => {
  const first = createForm("Ada");
  const second = createForm("Ada");
  assert.deepEqual(first, {
    values: { name: "Ada", role: "reader" },
    status: "editing",
    error: "",
  });
  assert.notEqual(first, second);
  assert.notEqual(first.values, second.values);
  assert.equal(createForm().values.name, "");
});
test("Change: copia annidata, conserva campi, azzera errore/conferma", () => {
  const initial = freeze({
    ...createForm("A"),
    status: "invalid",
    error: "Errore",
  });
  const action = freeze({ type: "change", name: "role", value: "editor" });
  const next = formReducer(initial, action);
  assert.deepEqual(next, {
    values: { name: "A", role: "editor" },
    status: "editing",
    error: "",
  });
  assert.notEqual(next.values, initial.values);
  assert.deepEqual(formReducer(initial, action), next);
  assert.equal(
    formReducer(freeze({ ...next, status: "saved" }), {
      type: "change",
      name: "name",
      value: "Grace",
    }).status,
    "editing",
  );
});
test("Submit invalido: conserva valori e rende osservabile l'errore", () => {
  const initial = freeze(createForm("  "));
  const next = formReducer(initial, freeze({ type: "submit" }));
  assert.equal(next.status, "invalid");
  assert.equal(next.error, "Inserisci almeno 2 caratteri.");
  assert.equal(next.values, initial.values);
});
test("Submit valido: normalizza senza mutare lo snapshot", () => {
  const initial = freeze({
    values: { name: " Grace ", role: "editor" },
    status: "invalid",
    error: "Vecchio",
  });
  const action = freeze({ type: "submit" });
  const next = formReducer(initial, action);
  assert.deepEqual(next, {
    values: { name: "Grace", role: "editor" },
    status: "saved",
    error: "",
  });
  assert.notEqual(next.values, initial.values);
  assert.deepEqual(formReducer(initial, action), next);
});
test("Reset esplicito: nuova inizializzazione completa", () => {
  const initial = freeze({ ...createForm("Grace"), status: "saved" });
  const next = formReducer(
    initial,
    freeze({ type: "reset", initialName: "Lin" }),
  );
  assert.deepEqual(next, createForm("Lin"));
  assert.notEqual(next.values, initial.values);
});
test("Azioni interne invalide: tipo, nome campo, valore e ruolo", () => {
  const state = freeze(createForm("Ada"));
  for (const action of [
    { type: "unknown" },
    { type: "change", name: "__proto__", value: "x" },
    { type: "change", name: "name", value: 42 },
    { type: "change", name: "role", value: "administrator" },
  ])
    assert.throws(() => formReducer(state, freeze(action)));
});
test("Change senza differenze: identita conservata, nessuna mutazione", () => {
  const state = freeze(createForm("Ada"));
  assert.equal(
    formReducer(state, freeze({ type: "change", name: "name", value: "Ada" })),
    state,
  );
});
test("Render statico del form: initializer, non una prova di hydration", () => {
  const html = renderToStaticMarkup(
    React.createElement(load("ProfileForm").default, { initialName: "Lin" }),
  );
  assert.match(html, /value="Lin"/);
  assert.match(html, /Modifiche non confermate/);
});
test("Debounce: il render statico espone subito il valore iniziale", () => {
  const { useDebouncedValue } = load("SearchDemo");
  function Probe() {
    return React.createElement("p", null, useDebouncedValue("iniziale", 600));
  }
  assert.equal(
    renderToStaticMarkup(React.createElement(Probe)),
    "<p>iniziale</p>",
  );
});

let browser, server, origin;
before(async () => {
  const bundles = new Map();
  for (const mode of ["development", "production"]) {
    const result = await build({
      stdin: {
        contents: `
import MemoApp from 'note:MemoApp';
import Counter from 'note:Counter';
import ProfileForm from 'note:ProfileForm';
import Panels, { Panel } from 'note:Panels';
import { useDocumentTitle } from 'note:Title';
import SearchDemo, { useDebouncedValue } from 'note:SearchDemo';
import { createElement as h, StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
function TitleProbe({title}) { useDocumentTitle(title); return h('p', null, title); }
function FunctionProbe({version}) {
  const fn = window.functions[version];
  const value = useDebouncedValue(fn, 300);
  useEffect(() => { window.currentValue = value; }, [value]);
  return h('p', null, 'Function probe');
}
const components = {MemoApp, Counter, ProfileForm, Panels, Panel, SearchDemo, TitleProbe, FunctionProbe};
const root = createRoot(document.getElementById('root'));
window.mount = (name, props = {}, key = 'stable') => root.render(
  h(StrictMode, null, name ? h(components[name], {...props, key}) : null)
);
window.ready = true;`,
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
      `<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture Hooks</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/${mode}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Chrome ${browser.version()}; bundle dev/prod separati`,
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
async function withPage(mode, run, clock = false) {
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
    if (clock)
      await page.clock.install({ time: new Date("2026-10-15T10:00:00Z") });
    await page.goto(`${origin}/${mode}`);
    await page.waitForFunction(() => window.ready);
    if (clock) await page.clock.pauseAt(new Date("2026-10-15T10:00:10Z"));
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
async function expectText(locator, text) {
  await locator.filter({ hasText: text }).waitFor();
  assert.equal(await locator.textContent(), text);
}
async function trackTimers(page) {
  await page.evaluate(() => {
    const start = window.setTimeout,
      stop = window.clearTimeout;
    window.pendingTimers = new Map();
    window.timerCalls = [];
    window.setTimeout = (callback, delay, ...args) => {
      let id;
      id = start(() => {
        window.pendingTimers.delete(id);
        window.timerCalls.push(delay);
        callback(...args);
      }, delay);
      window.pendingTimers.set(id, delay);
      return id;
    };
    window.clearTimeout = (id) => {
      window.pendingTimers.delete(id);
      stop(id);
    };
  });
}
async function pending(page, delays) {
  await page.waitForFunction(
    (delays) =>
      JSON.stringify([...window.pendingTimers.values()].sort()) ===
      JSON.stringify(delays),
    delays.sort(),
  );
}

for (const mode of ["development", "production"]) {
  test(`Chrome ${mode}: filtro, query vuota, nessun risultato e contatore`, () =>
    withPage(mode, async (page) => {
      await mount(page, "MemoApp");
      await page.getByRole("heading", { name: "Catalogo" }).waitFor();
      assert.equal(await page.locator("li").count(), 3);
      await page.getByLabel("Cerca prodotto").fill(" MO ");
      assert.equal(await page.locator("li").count(), 2);
      await button(page, "Contatore indipendente: 0").click();
      await button(page, "Contatore indipendente: 1").waitFor();
      assert.equal(await page.locator("li").count(), 2);
      await page.getByLabel("Cerca prodotto").fill("nessuno");
      await page.getByText("Nessun prodotto.", { exact: true }).waitFor();
      await page.getByLabel("Cerca prodotto").fill("");
      assert.equal(await page.locator("li").count(), 3);
    }));
  test(`Chrome ${mode}: callback usa lo sconto aggiornato, scelta resta snapshot`, () =>
    withPage(mode, async (page) => {
      await mount(page, "MemoApp");
      await button(page, "Seleziona Tastiera").click();
      await expectText(
        page.getByRole("status"),
        "Ultima scelta: Tastiera, 45.00 EUR",
      );
      await button(page, "Sconto: 10%").click();
      await button(page, "Sconto: 20%").waitFor();
      assert.equal(
        await page.getByRole("status").textContent(),
        "Ultima scelta: Tastiera, 45.00 EUR",
      );
      await button(page, "Seleziona Tastiera").click();
      await expectText(
        page.getByRole("status"),
        "Ultima scelta: Tastiera, 40.00 EUR",
      );
    }));
  test(`Chrome ${mode}: due dispatch si accumulano, decremento`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Counter");
      await button(page, "+2").click();
      await expectText(page.getByRole("status"), "Conteggio: 2");
      await button(page, "+1").click();
      await button(page, "-1").click();
      await expectText(page.getByRole("status"), "Conteggio: 2");
    }));
  test(`Chrome ${mode}: form errore accessibile, correzione, invio, modifica e reset`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ProfileForm");
      const input = page.getByRole("textbox", { name: "Nome" });
      await input.fill("  ");
      await input.press("Enter");
      await expectText(
        page.getByRole("alert"),
        "Inserisci almeno 2 caratteri.",
      );
      assert.equal(await input.getAttribute("aria-invalid"), "true");
      assert.equal(
        await input.getAttribute("aria-describedby"),
        await page.getByRole("alert").getAttribute("id"),
      );
      await input.fill(" Grace ");
      assert.equal(await page.getByRole("alert").count(), 0);
      await page
        .getByRole("combobox", { name: "Ruolo" })
        .selectOption("editor");
      await button(page, "Conferma").click();
      await expectText(
        page.getByRole("status"),
        "Confermato localmente: Grace (editor).",
      );
      assert.equal(await input.inputValue(), "Grace");
      await input.fill("Lin");
      await expectText(page.getByRole("status"), "Modifiche non confermate.");
      await button(page, "Ripristina").click();
      assert.equal(await input.inputValue(), "Ada");
      assert.equal(await page.getByRole("combobox").inputValue(), "reader");
      assert.equal(page.url(), `${origin}/${mode}`);
    }));
  test(`Chrome ${mode}: initialArg non resetta, azione e key si`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ProfileForm", { initialName: "Ada" });
      const input = page.getByRole("textbox", { name: "Nome" });
      await input.fill("Bozza");
      await mount(page, "ProfileForm", { initialName: "Grace" });
      assert.equal(await input.inputValue(), "Bozza");
      await button(page, "Ripristina").click();
      assert.equal(await input.inputValue(), "Grace");
      await mount(page, "ProfileForm", { initialName: "Lin" }, "new-identity");
      await page.waitForFunction(
        () => document.querySelector("input").value === "Lin",
      );
    }));
  test(`Chrome ${mode}: due pannelli indipendenti e riferimenti ARIA distinti`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Panels");
      await button(page, "Dettagli").click();
      assert.equal(
        await button(page, "Dettagli").getAttribute("aria-expanded"),
        "true",
      );
      assert.equal(
        await button(page, "Filtri").getAttribute("aria-expanded"),
        "false",
      );
      assert.notEqual(
        await button(page, "Dettagli").getAttribute("aria-controls"),
        await button(page, "Filtri").getAttribute("aria-controls"),
      );
      await button(page, "Filtri").click();
      await button(page, "Dettagli").click();
      assert.equal(
        await page
          .getByText("Contenuto di Dettagli", { exact: true })
          .isVisible(),
        false,
      );
      assert.equal(
        await page
          .getByText("Contenuto di Filtri", { exact: true })
          .isVisible(),
        true,
      );
    }));
  test(`Chrome ${mode}: useToggle distingue valore iniziale e prop corrente`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Panel", { name: "Prova", initialOpen: true });
      await button(page, "Prova").waitFor();
      assert.equal(
        await button(page, "Prova").getAttribute("aria-expanded"),
        "true",
      );
      await mount(page, "Panel", {
        name: "Prova aggiornata",
        initialOpen: false,
      });
      await button(page, "Prova aggiornata").waitFor();
      assert.equal(
        await button(page, "Prova aggiornata").getAttribute("aria-expanded"),
        "true",
      );
      await button(page, "Prova aggiornata").click();
      assert.equal(
        await button(page, "Prova aggiornata").getAttribute("aria-expanded"),
        "false",
      );
    }));
  test(`Chrome ${mode}: debounce trailing e istanze indipendenti`, () =>
    withPage(
      mode,
      async (page) => {
        await trackTimers(page);
        await mount(page, "SearchDemo");
        const a = page.getByRole("region", { name: "A", exact: true });
        const b = page.getByRole("region", { name: "B", exact: true });
        await page.getByLabel("Ricerca A").fill("R");
        await pending(page, [300, 300]);
        await page.clock.runFor(200);
        await page.getByLabel("Ricerca A").fill("Ru");
        await page.clock.runFor(100);
        assert.equal(
          await a.getByRole("status").textContent(),
          "Filtro applicato: (vuoto)",
        );
        await page.clock.runFor(200);
        await expectText(a.getByRole("status"), "Filtro applicato: Ru");
        assert.deepEqual(await a.locator("li").allTextContents(), ["Rust"]);
        assert.equal(await b.locator("li").count(), 4);
        await page.getByLabel("Ricerca A").fill("nessuno");
        await page.clock.runFor(300);
        await a.getByText("Nessun argomento.", { exact: true }).waitFor();
      },
      true,
    ));
  test(`Chrome ${mode}: cambiare delay riavvia l'attesa`, () =>
    withPage(
      mode,
      async (page) => {
        await trackTimers(page);
        await mount(page, "SearchDemo");
        await page.getByLabel("Ricerca A").fill("Python");
        await pending(page, [300, 300]);
        await page.clock.runFor(200);
        await page
          .getByRole("combobox", { name: /Ritardo/ })
          .selectOption("600");
        await pending(page, [600, 600]);
        await page.clock.runFor(599);
        const status = page
          .getByRole("region", { name: "A", exact: true })
          .getByRole("status");
        assert.equal(await status.textContent(), "Filtro applicato: (vuoto)");
        await page.clock.runFor(1);
        await expectText(status, "Filtro applicato: Python");
      },
      true,
    ));
  test(`Chrome ${mode}: unmount cancella timer, remount resetta solo A`, () =>
    withPage(
      mode,
      async (page) => {
        await trackTimers(page);
        await mount(page, "SearchDemo");
        await page.getByLabel("Ricerca B").fill("React");
        await pending(page, [300, 300]);
        await page.clock.runFor(300);
        await expectText(
          page
            .getByRole("region", { name: "B", exact: true })
            .getByRole("status"),
          "Filtro applicato: React",
        );
        await page.getByLabel("Ricerca A").fill("Rust");
        await pending(page, [300]);
        const calls = await page.evaluate(() => window.timerCalls.length);
        await button(page, "Nascondi filtro A").click();
        await pending(page, []);
        await page.clock.runFor(600);
        assert.equal(
          await page.evaluate(() => window.timerCalls.length),
          calls,
        );
        await button(page, "Mostra filtro A").click();
        assert.equal(await page.getByLabel("Ricerca A").inputValue(), "");
        assert.equal(await page.getByLabel("Ricerca B").inputValue(), "React");
        await pending(page, [300]);
        await mount(page, null);
        await pending(page, []);
      },
      true,
    ));
  test(`Chrome ${mode}: debounce conserva funzioni senza invocarle`, () =>
    withPage(
      mode,
      async (page) => {
        await trackTimers(page);
        await page.evaluate(() => {
          window.functionCalls = 0;
          window.functions = [
            () => ++window.functionCalls,
            () => ++window.functionCalls,
          ];
        });
        await mount(page, "FunctionProbe", { version: 0 });
        await page.waitForFunction(
          () => window.currentValue === window.functions[0],
        );
        await mount(page, "FunctionProbe", { version: 1 });
        await pending(page, [300]);
        assert.equal(
          await page.evaluate(
            () => window.currentValue === window.functions[0],
          ),
          true,
        );
        await page.clock.runFor(300);
        await page.waitForFunction(
          () => window.currentValue === window.functions[1],
        );
        assert.equal(await page.evaluate(() => window.functionCalls), 0);
      },
      true,
    ));
  test(`Chrome ${mode}: titolo aggiornato e ripristinato da un solo proprietario`, () =>
    withPage(mode, async (page) => {
      await mount(page, "TitleProbe", { title: "Primo" });
      await page.waitForFunction(() => document.title === "Primo");
      await mount(page, "TitleProbe", { title: "Secondo" });
      await page.waitForFunction(() => document.title === "Secondo");
      await mount(page, null);
      await page.waitForFunction(() => document.title === "Fixture Hooks");
    }));
}
