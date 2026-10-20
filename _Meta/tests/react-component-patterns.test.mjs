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
const { renderToString, renderToStaticMarkup } =
  toolRequire("react-dom/server");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const names = [
  "Compound Components Pattern",
  "Control Props e State Reducer Pattern",
  "Portals",
  "Error Boundaries",
];
const trees = names.map(
  (name) => parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
);
function snippet(index, marker) {
  const blocks = trees[index].children.filter(
    (node) =>
      node.type === "code" &&
      node.lang === "jsx" &&
      node.value.includes(marker),
  );
  assert.equal(blocks.length, 1, marker);
  return blocks[0].value;
}
const sources = {
  Accordion: snippet(0, "function AccordionDemo"),
  Control: snippet(1, "function ControlDemo"),
  Reducer: snippet(1, "function ReducerDemo"),
  Portal: snippet(2, "function ClientPortal"),
  Dialog: snippet(2, "function ConfirmDialog"),
  Boundary: snippet(3, "class ErrorBoundary"),
  Save: snippet(3, "function SaveButton"),
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
const h = React.createElement;
for (let i = 0; i < names.length; i++) {
  test(`Sintassi JSX: ${names[i]} (non equivale a esecuzione)`, () => {
    for (const node of trees[i].children.filter(
      (node) => node.type === "code" && node.lang === "jsx",
    )) {
      assert.doesNotThrow(() =>
        transformSync(node.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Accordion: guard per parti fuori dal provider", () => {
  const { Accordion } = load("Accordion");
  for (const [Part, message] of [
    [Accordion.Item, "Item richiede Accordion"],
    [Accordion.Header, "Header richiede Accordion.Item"],
    [Accordion.Panel, "Panel richiede Accordion.Item"],
  ]) {
    assert.throws(() => renderToStaticMarkup(h(Part)), new RegExp(message));
  }
});
test("Accordion: markup iniziale, relazioni ARIA e ID distinti", () => {
  const markup = renderToStaticMarkup(h(load("Accordion").default));
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /aria-expanded="false"/);
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, 4);
  for (const match of markup.matchAll(/aria-controls="([^"]+)"/g))
    assert(ids.includes(match[1]));
  assert.match(markup, /hidden=""/);
});
test("Reducer: transizioni pure, copie e azione sconosciuta", () => {
  const { toggleReducer } = load("Reducer");
  const initial = Object.freeze({ on: false, changes: 0 });
  const action = Object.freeze({ type: "toggle" });
  assert.deepEqual(toggleReducer(initial, action), { on: true, changes: 1 });
  assert.deepEqual(initial, { on: false, changes: 0 });
  assert.deepEqual(
    toggleReducer(initial, action),
    toggleReducer(initial, action),
  );
  assert.throws(
    () => toggleReducer(initial, { type: "unknown" }),
    /Azione sconosciuta/,
  );
});
test("Reducer: limite conserva identita, reset resta permesso", () => {
  const { limitedReducer } = load("Reducer");
  let state = { on: false, changes: 0 };
  for (let i = 0; i < 3; i++)
    state = limitedReducer(Object.freeze(state), { type: "toggle" });
  assert.deepEqual(state, { on: true, changes: 3 });
  assert.equal(limitedReducer(state, { type: "toggle" }), state);
  assert.deepEqual(limitedReducer(Object.freeze(state), { type: "reset" }), {
    on: false,
    changes: 0,
  });
});
test("Portal: render server senza document produce solo il placeholder", () => {
  assert.equal(
    renderToStaticMarkup(
      h(load("Portal").ClientPortal, null, "Non ancora nel DOM"),
    ),
    "",
  );
  assert(!renderToString(h(load("Portal").default)).includes("Saluta"));
});
test("Boundary: non intercetta render server", () => {
  const { ErrorBoundary, CounterPanel } = load("Boundary");
  assert.throws(
    () =>
      renderToString(
        h(
          ErrorBoundary,
          { renderFallback: () => "Fallback" },
          h(CounterPanel, { broken: true }),
        ),
      ),
    /Guasto dimostrativo/,
  );
});

let server, browser, origin;
before(async () => {
  const bundles = new Map();
  for (const mode of ["development", "production"]) {
    const result = await build({
      stdin: {
        contents: `
import { createElement as h, StrictMode, useEffect, useState, useTransition } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import AccordionDemo, { Accordion } from 'note:Accordion';
import ControlDemo, { Toggle } from 'note:Control';
import ReducerDemo, { useToggle, limitedReducer } from 'note:Reducer';
import PortalDemo, { ClientPortal } from 'note:Portal';
import DialogDemo from 'note:Dialog';
import BoundaryDemo, { ErrorBoundary, CounterPanel } from 'note:Boundary';
import { SaveButton } from 'note:Save';
window.caught=[]; window.uncaught=[]; window.recoverable=[]; window.logged=[];
window.requests=[]; window.submits=0; window.nativeClicks=0;
const report=(error,info)=>window.logged.push({message:error.message,stack:info.componentStack});
const fallback=({reset})=>h('button',{type:'button',onClick:reset},'Riprova');
const safe=(child)=>h(ErrorBoundary,{onError:report,renderFallback:fallback},child);
function AccordionProbe({defaultValue}) {
 return h(Accordion,{defaultValue},['a','b'].map(value=>h(Accordion.Item,{value,key:value},h(Accordion.Header,null,value),h(Accordion.Panel,null,'Panel '+value))));
}
function AccordionPair() { return h('div',null,h(AccordionDemo),h(AccordionDemo)); }
function NestedAccordion() {
 return h(Accordion,{defaultValue:'outer'},h(Accordion.Item,{value:'outer'},h(Accordion.Header,null,'Esterno'),h(Accordion.Panel,null,h(AccordionProbe,{defaultValue:'a'}))));
}
function ControlProbe(props) {
 return h('form',{onSubmit:e=>{e.preventDefault();window.submits++;}},h(Toggle,{...props,onCheckedChange:value=>window.requests.push(value)},'Scelta'));
}
function BatchProbe({limited=false}) {
 const {on,changes,toggle,reset}=useToggle(limited?{reducer:limitedReducer}:{});
 return h('div',null,h('p',null,JSON.stringify({on,changes})),h('button',{onClick:()=>{toggle();toggle();toggle();toggle();}},'Quattro toggle'),h('button',{onClick:reset},'Reset'));
}
function BoundaryProbe({kind='render',broken=true}) {
 function Fault() {
  useEffect(()=>{if(kind==='effect')throw new Error('Guasto effect');},[]);
  const [,startTransition]=useTransition();
  if(kind==='render')return h(CounterPanel,{broken});
  return h('button',{onClick:()=>{
   if(kind==='event')throw new Error('Guasto evento');
   if(kind==='timer')setTimeout(()=>{throw new Error('Guasto timer');},0);
   if(kind==='transition')startTransition(async()=>{await Promise.resolve();throw new Error('Guasto transition');});
  }},'Genera errore');
 }
 return safe(h(Fault));
}
function NestedBoundary() {
 function BadFallback(){throw new Error('Guasto fallback');}
 return h(ErrorBoundary,{onError:report,renderFallback:()=>h('p',null,'Fallback esterno')},
  h(ErrorBoundary,{renderFallback:()=>h(BadFallback)},h(CounterPanel,{broken:true})));
}
function SaveProbe() {
 return safe(h(SaveButton,{save:()=>new Promise((resolve,reject)=>{window.resolveSave=resolve;window.rejectSave=()=>reject(new Error('Rete indisponibile'));})}));
}
function MissingPortal(){return safe(h(ClientPortal,{targetId:'missing'},'Contenuto'));}
const components={AccordionDemo,AccordionProbe,AccordionPair,NestedAccordion,ControlDemo,ControlProbe,ReducerDemo,BatchProbe,PortalDemo,DialogDemo,BoundaryProbe,NestedBoundary,SaveProbe,MissingPortal,BoundaryDemo:()=>h(BoundaryDemo,{onError:report})};
const options={onCaughtError:(e,i)=>window.caught.push({message:e.message,stack:i.componentStack}),onUncaughtError:e=>window.uncaught.push(e.message),onRecoverableError:e=>window.recoverable.push(e.message)};
const host=document.getElementById('root');
host.addEventListener('click',()=>window.nativeClicks++);
const root=location.search.includes('hydrate')?hydrateRoot(host,h(StrictMode,null,h(PortalDemo)),options):createRoot(host,options);
window.mount=(name,props={},key='stable')=>root.render(h(StrictMode,null,name?h(components[name],{...props,key}):null));
window.ready=true;
`,
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
            api.onResolve(
              { filter: /^\.\/PortalDemo\.jsx$/, namespace: "notes" },
              () => ({ path: "Portal", namespace: "notes" }),
            );
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
  const ssr = renderToString(h(load("Portal").default));
  server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (bundles.has(url.pathname)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end(bundles.get(url.pathname));
    }
    const mode = url.pathname === "/production" ? "production" : "development";
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<!doctype html><html lang="it"><head><title>Fixture Patterns</title><link rel="icon" href="data:,"></head><body><div id="root">${url.searchParams.has("hydrate") ? ssr : ""}</div><div id="overlay-root"></div><script type="module" src="/${mode}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(`React ${React.version}; Chrome ${browser.version()}`);
});
after(async () => {
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
async function withPage(
  mode,
  run,
  { expectedErrors = [], hydrate = false, caught = [] } = {},
) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    const errors = [],
      consoleErrors = [],
      httpErrors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type()))
        consoleErrors.push(msg.text());
    });
    page.on("response", (res) => {
      if (res.status() >= 400) httpErrors.push(`${res.status()} ${res.url()}`);
    });
    await page.goto(`${origin}/${mode}${hydrate ? "?hydrate=1" : ""}`);
    await page.waitForFunction(() => window.ready);
    await run(page);
    assert.deepEqual(errors, expectedErrors);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(httpErrors, []);
    assert.deepEqual(await page.evaluate(() => window.uncaught), []);
    assert.deepEqual(await page.evaluate(() => window.recoverable), []);
    const caughtMessages = await page.evaluate(() =>
      window.caught.map((error) => error.message),
    );
    assert(
      caughtMessages.every((message) => caught.includes(message)),
      JSON.stringify(caughtMessages),
    );
    for (const message of caught)
      assert(caughtMessages.includes(message), message);
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
async function textVisible(page, value) {
  await page.getByText(value, { exact: true }).waitFor();
}
async function pressed(page, name, value) {
  await page.waitForFunction(
    ({ name, value }) =>
      [...document.querySelectorAll("button")].some(
        (node) =>
          node.textContent === name &&
          node.getAttribute("aria-pressed") === String(value),
      ),
    { name, value },
  );
}
const fault = "Guasto dimostrativo del pannello";
for (const mode of ["development", "production"]) {
  test(`Chrome ${mode}: accordion, tastiera, apertura unica e bozza conservata`, () =>
    withPage(mode, async (page) => {
      await mount(page, "AccordionDemo");
      await page.getByLabel("Bozza nome").fill("Bozza locale");
      await button(page, "Privacy").focus();
      await page.keyboard.press("Enter");
      await textVisible(page, "Puoi esportare i dati dal profilo.");
      assert.equal(await page.getByLabel("Bozza nome").isVisible(), false);
      await page.keyboard.press("Space");
      await page
        .getByText("Puoi esportare i dati dal profilo.")
        .waitFor({ state: "hidden" });
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Account",
      );
      await page.keyboard.press("Space");
      await page.getByLabel("Bozza nome").waitFor();
      assert.equal(
        await page.getByLabel("Bozza nome").inputValue(),
        "Bozza locale",
      );
    }));
  test(`Chrome ${mode}: accordion, default cambia solo con nuova key`, () =>
    withPage(mode, async (page) => {
      await mount(page, "AccordionProbe", { defaultValue: "a" });
      await textVisible(page, "Panel a");
      await mount(page, "AccordionProbe", { defaultValue: "b" });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(
        await button(page, "a").getAttribute("aria-expanded"),
        "true",
      );
      await mount(page, "AccordionProbe", { defaultValue: "b" }, "new");
      await textVisible(page, "Panel b");
    }));
  test(`Chrome ${mode}: accordion, istanze indipendenti e ID/ARIA validi`, () =>
    withPage(mode, async (page) => {
      await mount(page, "AccordionPair");
      await button(page, "Privacy").first().click();
      assert.equal(
        await button(page, "Account").last().getAttribute("aria-expanded"),
        "true",
      );
      assert(
        await page.evaluate(() => {
          const ids = [...document.querySelectorAll("[id]")].map(
            (node) => node.id,
          );
          return (
            new Set(ids).size === ids.length &&
            [...document.querySelectorAll("[aria-controls]")].every((node) =>
              document.getElementById(node.getAttribute("aria-controls")),
            )
          );
        }),
      );
    }));
  test(`Chrome ${mode}: accordion annidato conserva provider e stato interno`, () =>
    withPage(mode, async (page) => {
      await mount(page, "NestedAccordion");
      await button(page, "b").click();
      await textVisible(page, "Panel b");
      await button(page, "Esterno").click();
      await page
        .getByText("Panel b", { exact: true })
        .waitFor({ state: "hidden" });
      await button(page, "Esterno").click();
      await textVisible(page, "Panel b");
    }));
  test(`Chrome ${mode}: toggle controlled, rifiuto del parent e nessun submit`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ControlProbe", {
        checked: false,
        defaultChecked: true,
      });
      await pressed(page, "Scelta", false);
      await button(page, "Scelta").click();
      assert.deepEqual(await page.evaluate(() => window.requests), [true]);
      await pressed(page, "Scelta", false);
      await mount(page, "ControlProbe", { checked: true });
      await pressed(page, "Scelta", true);
      assert.equal(await page.evaluate(() => window.submits), 0);
    }));
  test(`Chrome ${mode}: toggle uncontrolled, callback una volta e reset per key`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ControlProbe", { defaultChecked: false });
      await button(page, "Scelta").click();
      await pressed(page, "Scelta", true);
      await mount(page, "ControlProbe", { defaultChecked: false });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await pressed(page, "Scelta", true);
      assert.deepEqual(await page.evaluate(() => window.requests), [true]);
      await mount(page, "ControlProbe", { defaultChecked: false }, "new");
      await pressed(page, "Scelta", false);
    }));
  test(`Chrome ${mode}: demo controlled aggiorna il parent, secondo toggle indipendente`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ControlDemo");
      await button(page, "Notifiche").click();
      await textVisible(page, "Notifiche: attive");
      await pressed(page, "Anteprima", true);
      await button(page, "Anteprima").click();
      await pressed(page, "Anteprima", false);
      await pressed(page, "Notifiche", true);
    }));
  test(`Chrome ${mode}: reducer e render prop, limite e reset riutilizzabile`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ReducerDemo");
      for (let i = 0; i < 3; i++)
        await button(page, "Modalita compatta").click();
      await textVisible(page, "Cambiamenti: 3 / 3");
      assert(await button(page, "Modalita compatta").isDisabled());
      await button(page, "Ripristina").click();
      await textVisible(page, "Cambiamenti: 0 / 3");
      await pressed(page, "Modalita compatta", false);
      await button(page, "Modalita compatta").click();
      await textVisible(page, "Cambiamenti: 1 / 3");
    }));
  test(`Chrome ${mode}: quattro dispatch nello stesso batch, reducer base e limitato`, () =>
    withPage(mode, async (page) => {
      await mount(page, "BatchProbe");
      await button(page, "Quattro toggle").click();
      await textVisible(page, '{"on":false,"changes":4}');
      await mount(page, "BatchProbe", { limited: true }, "new");
      await button(page, "Quattro toggle").click();
      await textVisible(page, '{"on":true,"changes":3}');
      await button(page, "Reset").click();
      await textVisible(page, '{"on":false,"changes":0}');
    }));
  test(`Chrome ${mode}: portal, Context, bubbling React ma non DOM, cleanup`, () =>
    withPage(mode, async (page) => {
      await mount(page, "PortalDemo");
      await button(page, "Saluta").click();
      await textVisible(page, "Click ricevuti dal parent: 1");
      assert.equal(await page.locator("#root button").count(), 0);
      assert.equal(await page.locator("#overlay-root button").count(), 1);
      assert.equal(await page.evaluate(() => window.nativeClicks), 0);
      await mount(page, null);
      await page.waitForFunction(
        () => document.getElementById("overlay-root").childElementCount === 0,
      );
    }));
  test(`Chrome ${mode}: portal dopo hydration del placeholder senza mismatch`, () =>
    withPage(
      mode,
      async (page) => {
        await button(page, "Saluta").click();
        await textVisible(page, "Click ricevuti dal parent: 1");
      },
      { hydrate: true },
    ));
  test(`Chrome ${mode}: portal assente segnala errore, non fallisce silenziosamente`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "MissingPortal");
        await button(page, "Riprova").waitFor();
      },
      { caught: ["Target portal assente: missing"] },
    ));
  test(`Chrome ${mode}: dialog nativo, label, focus, Tab e Escape`, () =>
    withPage(mode, async (page) => {
      await mount(page, "DialogDemo");
      await button(page, "Apri conferma").click();
      const dialog = page.getByRole("dialog", { name: "Conferma operazione" });
      await dialog.waitFor();
      assert(await dialog.evaluate((node) => node.matches(":modal")));
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Annulla",
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Conferma",
      );
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Annulla",
      );
      const prevented = await page.evaluate(() => {
        const opener = [...document.querySelectorAll("button")].find(
          (node) => node.textContent === "Apri conferma",
        );
        opener.focus();
        return document.activeElement !== opener;
      });
      assert(prevented);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Apri conferma",
      );
    }));
  test(`Chrome ${mode}: dialog annulla, conferma, riapertura e cleanup`, () =>
    withPage(mode, async (page) => {
      await mount(page, "DialogDemo");
      await button(page, "Apri conferma").click();
      await button(page, "Annulla").click();
      await page.locator("dialog").waitFor({ state: "detached" });
      await textVisible(page, "Nessuna modifica");
      await button(page, "Apri conferma").click();
      await button(page, "Conferma").click();
      await textVisible(page, "Bozza aggiornata");
      await button(page, "Apri conferma").click();
      await page.getByRole("dialog").waitFor();
      await mount(page, null);
      await page.waitForFunction(
        () => document.querySelector("dialog") === null,
      );
      assert.equal(await page.locator("#overlay-root").innerHTML(), "");
    }));
  test(`Chrome ${mode}: boundary isola il pannello, reset perde solo stato interno`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "BoundaryDemo");
        await page.getByLabel("Nota esterna").fill("Conservare");
        await button(page, "Conteggio: 0").click();
        await button(page, "Conteggio: 1").waitFor();
        await button(page, "Simula guasto").click();
        await page.getByRole("alert").waitFor();
        assert.equal(
          await page.getByLabel("Nota esterna").inputValue(),
          "Conservare",
        );
        assert(
          await page.evaluate(() =>
            window.logged.some(
              (entry) =>
                entry.message === "Guasto dimostrativo del pannello" &&
                entry.stack.includes("CounterPanel"),
            ),
          ),
        );
        await button(page, "Ripristina pannello").click();
        await button(page, "Conteggio: 0").waitFor();
      },
      { caught: [fault] },
    ));
  test(`Chrome ${mode}: reset senza correggere la causa fallisce di nuovo`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "BoundaryProbe");
        await button(page, "Riprova").click();
        await page.waitForFunction(() => window.caught.length >= 2);
        await button(page, "Riprova").waitFor();
        await mount(page, "BoundaryProbe", { broken: false });
        await button(page, "Riprova").click();
        await button(page, "Conteggio: 0").waitFor();
      },
      { caught: [fault] },
    ));
  test(`Chrome ${mode}: errore sincrono nell'effect raggiunge il boundary`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "BoundaryProbe", { kind: "effect" });
        await button(page, "Riprova").waitFor();
      },
      { caught: ["Guasto effect"] },
    ));
  test(`Chrome ${mode}: errore nel fallback raggiunge quello superiore`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "NestedBoundary");
        await textVisible(page, "Fallback esterno");
      },
      { caught: ["Guasto fallback"] },
    ));
  for (const kind of ["event", "timer"]) {
    const message = kind === "event" ? "Guasto evento" : "Guasto timer";
    test(`Chrome ${mode}: ${kind} non raggiunge il boundary`, () =>
      withPage(
        mode,
        async (page) => {
          await mount(page, "BoundaryProbe", { kind });
          const error = page.waitForEvent("pageerror");
          await button(page, "Genera errore").click();
          assert.equal((await error).message, message);
          assert.equal(await button(page, "Riprova").count(), 0);
          await button(page, "Genera errore").waitFor();
        },
        { expectedErrors: [message] },
      ));
  }
  test(`Chrome ${mode}: Action async di useTransition raggiunge il boundary`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "BoundaryProbe", { kind: "transition" });
        await button(page, "Genera errore").click();
        await button(page, "Riprova").waitFor();
      },
      { caught: ["Guasto transition"] },
    ));
  test(`Chrome ${mode}: SaveButton pending, rifiuto gestito, retry e successo`, () =>
    withPage(mode, async (page) => {
      await mount(page, "SaveProbe");
      await button(page, "Salva").click();
      assert(await button(page, "Salva").isDisabled());
      await page.evaluate(() => window.rejectSave());
      await textVisible(page, "Salvataggio non riuscito. Riprova.");
      await button(page, "Salva").click();
      await page.evaluate(() => window.resolveSave());
      await textVisible(page, "Salvataggio completato");
      assert.equal(await button(page, "Salva").isDisabled(), false);
      assert.equal(await button(page, "Riprova").count(), 0);
    }));
}
