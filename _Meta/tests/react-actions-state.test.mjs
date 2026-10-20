import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, writeFile, realpath, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
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
const axe = toolRequire("axe-core");
const names = ["Actions e form actions", "useActionState"];
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
  LabelPreview: snippet(0, "function LabelPreview("),
  AliasForm: snippet(1, "function AliasForm("),
  QueuedCounter: snippet(1, "function QueuedCounter("),
};
function load(source) {
  const module = { exports: {} };
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  new Function("require", "module", "exports", code)(
    toolRequire,
    module,
    module.exports,
  );
  return module.exports;
}
const { makeAliasAction, initialAliasState, reserveAliasDemo } = load(
  sources.AliasForm,
);
const data = (value) => {
  const form = new FormData();
  if (value !== null) form.set("alias", value);
  return form;
};
for (const [i, name] of names.entries()) {
  test(`Sintassi JSX: ${name} (non equivale a esecuzione)`, () => {
    for (const block of trees[i].children.filter(
      (n) => n.type === "code" && n.lang === "jsx",
    )) {
      assert.doesNotThrow(() =>
        transformSync(block.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
for (const value of [
  null,
  "",
  "  ",
  "ab",
  "1abc",
  "a".repeat(21),
  "a-b",
  new Blob(["test"]),
]) {
  test(`Alias non valido: ${value instanceof Blob ? "File" : JSON.stringify(value)}`, async () => {
    let calls = 0;
    const previous = Object.freeze({
      ...initialAliasState,
      savedAlias: "precedente",
      attempts: 2,
    });
    const result = await makeAliasAction(async () => {
      calls++;
    })(previous, data(value));
    assert.equal(calls, 0);
    assert.equal(result.status, "invalid");
    assert.equal(result.attempts, 3);
    assert.equal(result.savedAlias, "precedente");
    assert.notEqual(result, previous);
    assert.equal(previous.attempts, 2);
  });
}
test("Alias valido: normalizzazione, successo e stato precedente immutato", async () => {
  const calls = [];
  const previous = Object.freeze({ ...initialAliasState });
  const next = await makeAliasAction(async (alias) => {
    calls.push(alias);
    return { ok: true };
  })(previous, data(" Ada_7 "));
  assert.deepEqual(calls, ["ada_7"]);
  assert.equal(next.savedAlias, "ada_7");
  assert.equal(next.status, "success");
  assert.equal(next.attempts, 1);
  assert.equal(previous.savedAlias, null);
});
test("Rifiuto previsto conserva conferma; eccezione inattesa propaga", async () => {
  const previous = Object.freeze({
    ...initialAliasState,
    savedAlias: "ada",
    attempts: 3,
  });
  const result = await makeAliasAction(async () => ({
    ok: false,
    message: "Non disponibile",
  }))(previous, data("root"));
  assert.deepEqual(result, {
    status: "error",
    message: "Non disponibile",
    savedAlias: "ada",
    attempts: 4,
  });
  const error = new Error("Servizio di prova non disponibile");
  await assert.rejects(
    makeAliasAction(async () => {
      throw error;
    })(previous, data("ada")),
    (e) => e === error,
  );
});
test("Servizi locali reali: ritardo, alias riservati, testo e contatore", async () => {
  assert.equal((await reserveAliasDemo("root")).ok, false);
  assert.equal((await reserveAliasDemo("admin")).ok, false);
  assert.equal((await reserveAliasDemo("ada")).ok, true);
  const { formatLabelDemo } = load(sources.LabelPreview);
  assert.equal(await formatLabelDemo("Ciao", "upper"), "CIAO");
  assert.equal(await formatLabelDemo("Ciao", "lower"), "ciao");
  assert.equal(await load(sources.QueuedCounter).addAfterDelay(2, 3), 5);
});

let root, temp, server, browser, url;
const bundles = {};
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-react-actions-"));
  for (const [name, source] of Object.entries(sources))
    await writeFile(path.join(root, `${name}.jsx`), source);
  // Questi probe aggiuntivi verificano contratti React, non sono esempi delle note.
  await writeFile(
    path.join(root, "fixture.jsx"),
    `
import {Component,StrictMode,createElement as h,startTransition,useActionState,useState} from 'react';
import {createRoot} from 'react-dom/client';
import LabelPreview from './LabelPreview.jsx';
import AliasForm from './AliasForm.jsx';
import QueuedCounter from './QueuedCounter.jsx';
window.calls=[];window.gates=[];window.caught=[];window.failures=[];
function gate(args){window.calls.push(args);const d=Promise.withResolvers();window.gates.push(d);return d.promise;}
const format=(...args)=>gate(args);
const save=(...args)=>gate(args);
const apply=async(previous,delta)=>{await gate([previous,delta]);return previous+delta;};
class Boundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?h('p',{role:'alert'},'Errore intercettato'):this.props.children;}
}
function Probe({initial=0}){
 const [count,dispatch,pending]=useActionState(apply,initial);
 window.dispatch=dispatch;
 return h('p',null,'Probe: '+count+'; pending: '+pending);
}
function Override(){
 const [result,setResult]=useState('');
 return h('form',{action:()=>setResult('form')},h('button',{type:'submit',formAction:()=>setResult('button')},'Override'),h('p',null,result));
}
function ResetProbe(){
 const [result,dispatch]=useActionState(async(_previous,formData)=>({error:'Rifiutato: '+formData.get('text')}),{error:''});
 return h('form',{action:dispatch},h('label',null,'Non controllato',h('input',{name:'text',defaultValue:'iniziale'})),h('button',{type:'submit'},'Rifiuta'),h('p',null,result.error));
}
const components={LabelPreview,AliasForm,QueuedCounter,Probe,Override,ResetProbe};
const props={LabelPreview:{format},AliasForm:{save},QueuedCounter:{apply}};
const root=createRoot(document.getElementById('root'),{onCaughtError:e=>window.caught.push(e.message),onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
window.mount=(name,extra={},key='stable')=>root.render(h(StrictMode,null,name?h(Boundary,{key},h(components[name],{...props[name],...extra})):null));
window.release=(index,result)=>window.gates[index].resolve(result);
window.reject=(index)=>window.gates[index].reject(new Error('Errore intenzionale'));
window.dispatchInAction=(payload)=>startTransition(()=>window.dispatch(payload));
window.ready=true;
`,
  );
  for (const mode of ["development", "production"]) {
    const result = await build({
      entryPoints: [path.join(root, "fixture.jsx")],
      bundle: true,
      write: false,
      jsx: "automatic",
      format: "iife",
      platform: "browser",
      nodePaths: [path.join(toolsRoot, "node_modules")],
      define: { "process.env.NODE_ENV": JSON.stringify(mode) },
      minify: mode === "production",
      logLevel: "silent",
    });
    bundles[`/${mode}.js`] = result.outputFiles[0].text;
  }
  server = createServer((req, res) => {
    if (bundles[req.url]) {
      res.writeHead(200, { "content-type": "text/javascript" });
      res.end(bundles[req.url]);
    } else if (["/development", "/production"].includes(req.url)) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><html lang="it"><head><title>Actions di prova</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body><h1>Actions</h1><main id="root"></main><script src="${req.url}.js"></script></body></html>`,
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${toolRequire("react").version}; Chrome ${browser.version()}; bundle esbuild development/production`,
  );
});
after(async () => {
  try {
    await browser?.close();
    if (server)
      await new Promise((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
  } finally {
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), temp);
      assert(path.basename(resolved).startsWith("appunti-react-actions-"));
      await rm(root, { recursive: true, force: true });
    }
  }
});
async function withPage(mode, run, { caught = [], warning } = {}) {
  const context = await browser.newContext({
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
    assert.equal((await page.goto(`${url}/${mode}`)).status(), 200);
    await page.waitForFunction(() => window.ready);
    await run(page);
    assert.deepEqual(
      await page.evaluate(() => [...new Set(window.caught)]),
      caught,
    );
    assert.deepEqual(await page.evaluate(() => window.failures), []);
    assert.deepEqual(errors, []);
    assert.deepEqual(http, []);
    if (warning) {
      assert(messages.length);
      messages.forEach((m) => assert.match(m, warning));
    } else assert.deepEqual(messages, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name, extra = {}, key = "stable") {
  await page.evaluate(
    ({ name, extra, key }) => window.mount(name, extra, key),
    { name, extra, key },
  );
  await page.locator("#root > *").first().waitFor();
}
async function text(page, value) {
  await page.waitForFunction(
    (value) => document.body.textContent.includes(value),
    value,
  );
}
async function calls(page, count) {
  await page.waitForFunction((count) => window.calls.length === count, count);
}
async function scan(page) {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () =>
    (
      await window.axe.run(document.getElementById("root"), {
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
  test(`${mode}: payload del submitter, pending, reset e secondo invio`, () =>
    withPage(mode, async (page) => {
      await mount(page, "LabelPreview");
      await page.getByLabel("Testo", { exact: true }).fill(" Ciao ");
      await page.getByRole("button", { name: "Maiuscolo" }).click();
      await calls(page, 1);
      await text(page, "Elaborazione...");
      assert.deepEqual(await page.evaluate(() => window.calls), [
        ["Ciao", "upper"],
      ]);
      assert(await page.getByLabel("Testo", { exact: true }).isDisabled());
      assert(
        await page.getByRole("button", { name: "Minuscolo" }).isDisabled(),
      );
      await page.evaluate(() => window.release(0, "CIAO"));
      await text(page, "Risultato: CIAO");
      assert.equal(
        await page.getByLabel("Testo", { exact: true }).inputValue(),
        "",
      );
      await page.getByLabel("Testo", { exact: true }).fill("CIAO");
      await page.getByRole("button", { name: "Minuscolo" }).click();
      await calls(page, 2);
      assert.deepEqual(await page.evaluate(() => window.calls[1]), [
        "CIAO",
        "lower",
      ]);
      await page.evaluate(() => window.release(1, "ciao"));
      await text(page, "Risultato: ciao");
      await scan(page);
    }));
  test(`${mode}: validazione HTML blocca il vuoto, errore applicativo resetta spazi`, () =>
    withPage(mode, async (page) => {
      await mount(page, "LabelPreview");
      await page.getByRole("button", { name: "Maiuscolo" }).click();
      assert.equal(await page.evaluate(() => window.calls.length), 0);
      assert.equal(
        await page
          .getByLabel("Testo", { exact: true })
          .evaluate((e) => e.validity.valueMissing),
        true,
      );
      await page.getByLabel("Testo", { exact: true }).fill("   ");
      await page.getByRole("button", { name: "Maiuscolo" }).click();
      await text(page, "Inserisci testo non vuoto");
      assert.equal(
        await page.getByLabel("Testo", { exact: true }).inputValue(),
        "",
      );
      assert.equal(await page.evaluate(() => window.calls.length), 0);
    }));
  test(`${mode}: errore restituito da useActionState resetta uncontrolled al default`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ResetProbe");
      await page.getByLabel("Non controllato").fill("modificato");
      await page.getByRole("button", { name: "Rifiuta" }).click();
      await text(page, "Rifiutato: modificato");
      assert.equal(
        await page.getByLabel("Non controllato").inputValue(),
        "iniziale",
      );
    }));
  test(`${mode}: alias invalido conserva bozza, relazione ARIA e nessuna chiamata`, () =>
    withPage(mode, async (page) => {
      await mount(page, "AliasForm");
      await page.getByLabel("Alias", { exact: true }).fill("ab");
      await page.getByRole("button", { name: "Conferma alias" }).click();
      await text(page, "Tentativi elaborati: 1");
      assert.equal(
        await page.getByLabel("Alias", { exact: true }).inputValue(),
        "ab",
      );
      assert.equal(
        await page
          .getByLabel("Alias", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(await page.evaluate(() => window.calls.length), 0);
      await scan(page);
    }));
  test(`${mode}: alias confermato, nuovo errore conserva dati e reset solo bozza`, () =>
    withPage(mode, async (page) => {
      await mount(page, "AliasForm");
      const input = page.getByLabel("Alias", { exact: true });
      await input.fill("Ada_7");
      await input.press("Enter");
      await calls(page, 1);
      await text(page, "Verifica in corso...");
      assert.deepEqual(await page.evaluate(() => window.calls), [["ada_7"]]);
      assert(await input.evaluate((e) => e.readOnly));
      assert.equal(await input.isDisabled(), false);
      assert(
        await page.getByRole("button", { name: "Conferma alias" }).isDisabled(),
      );
      await page.evaluate(() => window.release(0, { ok: true }));
      await text(page, "Ultima conferma: ada_7");
      assert.equal(await input.inputValue(), "Ada_7");
      await input.fill("admin");
      await page.getByRole("button", { name: "Conferma alias" }).click();
      await calls(page, 2);
      await page.evaluate(() =>
        window.release(1, { ok: false, message: "Riservato dalla fixture" }),
      );
      await text(page, "Tentativi elaborati: 2");
      await text(page, "Riservato dalla fixture");
      await text(page, "Ultima conferma: ada_7");
      assert.equal(await input.inputValue(), "admin");
      await page.getByRole("button", { name: "Svuota bozza" }).click();
      assert.equal(await input.inputValue(), "");
      await text(page, "Ultima conferma: ada_7");
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await scan(page);
    }));
  test(`${mode}: tre dispatch, ordine sequenziale e pending fino al completamento`, () =>
    withPage(mode, async (page) => {
      await mount(page, "QueuedCounter");
      for (let i = 0; i < 3; i++)
        await page.getByRole("button", { name: "Aggiungi" }).click();
      await calls(page, 1);
      assert.deepEqual(await page.evaluate(() => window.calls), [[0, 1]]);
      await text(page, "Elaborazione coda...");
      for (let i = 0; i < 3; i++) {
        await page.evaluate((i) => window.release(i), i);
        if (i < 2) {
          await calls(page, i + 2);
          await text(page, "Elaborazione coda...");
        }
      }
      await text(page, "Confermati: 3");
      await text(page, "Pronto");
      assert.deepEqual(await page.evaluate(() => window.calls), [
        [0, 1],
        [1, 1],
        [2, 1],
      ]);
    }));
  test(`${mode}: rigetto del primo dispatch cancella i successivi in coda`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "QueuedCounter");
        for (let i = 0; i < 3; i++)
          await page.getByRole("button", { name: "Aggiungi" }).click();
        await calls(page, 1);
        await page.evaluate(() => window.reject(0));
        await page.getByRole("alert").waitFor();
        assert.equal(await page.evaluate(() => window.calls.length), 1);
      },
      { caught: ["Errore intenzionale"] },
    ));
  test(`${mode}: rigetto form action diretto raggiunge il boundary`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "LabelPreview");
        await page.getByLabel("Testo", { exact: true }).fill("Ciao");
        await page.getByRole("button", { name: "Maiuscolo" }).click();
        await calls(page, 1);
        await page.evaluate(() => window.reject(0));
        await page.getByRole("alert").waitFor();
      },
      { caught: ["Errore intenzionale"] },
    ));
  test(`${mode}: cambiare initialState non resetta dopo dispatch; key rimonta`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Probe", { initial: 4 });
      await text(page, "Probe: 4");
      await page.evaluate(() => window.dispatchInAction(1));
      await calls(page, 1);
      await page.evaluate(() => window.release(0));
      await text(page, "Probe: 5; pending: false");
      await mount(page, "Probe", { initial: 100 });
      await text(page, "Probe: 5; pending: false");
      await mount(page, "Probe", { initial: 100 }, "new");
      await text(page, "Probe: 100; pending: false");
    }));
  test(`${mode}: formAction del pulsante sostituisce action del form`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Override");
      await page.getByRole("button", { name: "Override" }).click();
      await page
        .locator("form p")
        .filter({ hasText: /^button$/ })
        .waitFor();
    }));
}
test("development: dispatch async fuori Action avvisa e non attiva pending", () =>
  withPage(
    "development",
    async (page) => {
      await mount(page, "Probe");
      await page.evaluate(() => {
        window.dispatch(1);
      });
      await calls(page, 1);
      await text(page, "Probe: 0; pending: false");
      await page.evaluate(() => window.release(0));
      await text(page, "Probe: 1; pending: false");
    },
    { warning: /outside.*transition|outside.*action/i },
  ));
