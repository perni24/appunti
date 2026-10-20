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
const names = ["useOptimistic", "useFormStatus"];
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
  CommentsDemo: snippet(0, "function CommentsDemo("),
  PreviewPanels: snippet(1, "function PreviewPanels("),
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
const {
  addPending,
  mergeConfirmed,
  readComment,
  checkReply,
  createCommentDemo,
  CommentRejected,
} = load(sources.CommentsDemo);
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
test("Reducer puro: inserimento, identita, base e payload congelati", () => {
  const item = Object.freeze({
    id: "a",
    requestId: "ra",
    text: "A",
    pending: false,
  });
  const base = Object.freeze([item]);
  const draft = Object.freeze({ requestId: "rb", text: "B" });
  const result = addPending(base, draft);
  assert.deepEqual(result, [item, { ...draft, pending: true }]);
  assert.equal(result[0], item);
  assert.equal(base.length, 1);
  assert.equal(draft.pending, undefined);
  assert.equal(addPending(result, draft), result);
});
test("Rebase: un record gia confermato non viene aggiunto di nuovo", () => {
  const base = Object.freeze([
    Object.freeze({ id: "server", requestId: "r1", text: "Canonico" }),
  ]);
  assert.equal(
    addPending(base, { requestId: "r1", text: "Provvisorio" }),
    base,
  );
});
test("Merge: deduplica id/requestId, conserva aggiornamenti estranei, non muta", () => {
  const base = Object.freeze([
    Object.freeze({ id: "s1", requestId: "old", text: "Vecchio" }),
    Object.freeze({ id: "temp", requestId: "r1", text: "Draft" }),
    Object.freeze({ id: "s2", requestId: "r2", text: "Altro" }),
  ]);
  const saved = Object.freeze({
    id: "s1",
    requestId: "r1",
    text: "Confermato",
  });
  const result = mergeConfirmed(base, saved);
  assert.deepEqual(result, [base[2], { ...saved, pending: false }]);
  assert.equal(base.length, 3);
  assert.equal(saved.pending, undefined);
  assert.deepEqual(mergeConfirmed(result, saved), result);
});
test("Lettura FormData: null/File non diventano stringhe fittizie", () => {
  const data = new FormData();
  assert.equal(readComment(data), "");
  data.set("text", new Blob(["test"]));
  assert.equal(readComment(data), "");
  data.set("text", "  testo  ");
  assert.equal(readComment(data), "testo");
  assert.equal(data.get("text"), "  testo  ");
});
test("Risposta: correlazione, schema minimo e selezione dei campi", () => {
  const source = Object.freeze({
    id: "s",
    requestId: "r",
    text: "Ciao",
    internal: "non pubblico",
  });
  assert.deepEqual(checkReply(source, "r"), {
    id: "s",
    requestId: "r",
    text: "Ciao",
  });
  assert.notEqual(checkReply(source, "r"), source);
  for (const reply of [
    null,
    {},
    { ...source, id: "" },
    { ...source, id: 1 },
    { ...source, requestId: "altro" },
    { ...source, text: null },
  ]) {
    assert.throws(() => checkReply(reply, "r"), /Risposta commento non valida/);
  }
});
test("Servizi demo reali: normalizzazione, rifiuto tipizzato e anteprima", async () => {
  assert.deepEqual(
    await createCommentDemo({ requestId: "r", text: "Ciao   mondo" }),
    { id: "demo-r", requestId: "r", text: "Ciao mondo" },
  );
  await assert.rejects(
    createCommentDemo({ requestId: "r", text: "RIFIUTA" }),
    (e) => e instanceof CommentRejected,
  );
  assert.equal(
    await load(sources.PreviewPanels).previewLabelDemo("ciao"),
    "CIAO",
  );
});

let temp, root, server, browser, url;
const bundles = {};
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-react-optimistic-"));
  for (const [name, source] of Object.entries(sources))
    await writeFile(path.join(root, `${name}.jsx`), source);
  // Probe aggiuntivi dichiarati: contesto React, snapshot e base esterna.
  await writeFile(
    path.join(root, "fixture.jsx"),
    `
import {Component,StrictMode,createElement as h,startTransition,useOptimistic,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useFormStatus} from 'react-dom';
import CommentsDemo,{Comments,CommentRejected,mergeConfirmed} from './CommentsDemo.jsx';
import PreviewPanels from './PreviewPanels.jsx';
window.calls=[];window.gates=[];window.caught=[];window.failures=[];
function gate(payload){window.calls.push(payload);const d=Promise.withResolvers();window.gates.push(d);return d.promise;}
function Rebase({ignore=false}){
 const [base,setBase]=useState([{id:'existing',requestId:'existing',text:'Gia presente',pending:false}]);
 window.replaceBase=setBase;
 return h(Comments,{comments:base,onConfirm:ignore?()=>{}:saved=>setBase(current=>mergeConfirmed(current,saved)),createComment:gate});
}
class Boundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?h('p',{role:'alert'},'Errore intercettato'):this.props.children;}
}
function Status({name}){
 const s=useFormStatus();
 const payload=s.data?Object.fromEntries(s.data):null;
 return h('output',{'data-probe':name},JSON.stringify({pending:s.pending,data:payload,method:s.method,action:s.action?.name??null}));
}
function StatusProbe(){
 async function primary(data){await gate(Object.fromEntries(data));}
 async function alternate(data){await gate(Object.fromEntries(data));}
 return h('section',null,h(Status,{name:'outside'}),
   h('form',{id:'probe-form',action:primary},
     h('label',null,'Valore probe',h('input',{name:'value',defaultValue:''})),
     h(Status,{name:'inside'}),
     h('button',{type:'submit',name:'intent',value:'primary'},'Invio probe'),
     h('button',{type:'submit',formAction:alternate},'Invio alternativo')),
   h('div',null,h('button',{type:'submit',form:'probe-form'},'Invio esterno'),h(Status,{name:'sibling'})));
}
function SameComponent(){
 const {pending}=useFormStatus();
 return h('form',{action:async()=>{await gate('same');}},h('p',null,'Parent pending: '+pending),h(Status,{name:'inside'}),h('button',{type:'submit'},'Invia stesso'));
}
function SubmitOnly(){
 const [done,setDone]=useState(false);
 return h('form',{onSubmit:async e=>{e.preventDefault();await gate('onSubmit');setDone(true);}},h(Status,{name:'inside'}),h('button',{type:'submit'},'Invia evento'),h('p',null,done?'Terminato':'Non terminato'));
}
function OptimisticProbe(){
 const [value,set]=useOptimistic('base');window.setOptimistic=set;
 return h('p',null,'Valore: '+value);
}
const components={CommentsDemo,Rebase,PreviewPanels,StatusProbe,SameComponent,SubmitOnly,OptimisticProbe};
const props={CommentsDemo:{createComment:gate},PreviewPanels:{transform:gate}};
const root=createRoot(document.getElementById('root'),{onCaughtError:e=>window.caught.push(e.message),onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
window.mount=(name,extra={},key='stable')=>root.render(h(StrictMode,null,h(Boundary,{key},h(components[name],{...props[name],...extra}))));
window.release=(index,value)=>window.gates[index].resolve(value);
window.reject=(index,expected=false)=>window.gates[index].reject(expected?new CommentRejected('Rifiuto previsto'):new Error('Guasto intenzionale'));
window.confirm=(index,text='Canonico')=>{const call=window.calls[index];window.gates[index].resolve({id:'server-'+call.requestId,requestId:call.requestId,text});};
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
      minify: false,
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
        `<!doctype html><html lang="it"><head><title>Ottimismo e form</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"></head><body><h1>Fixture React</h1><main id="root"></main><script src="${req.url}.js"></script></body></html>`,
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
    `React ${toolRequire("react").version}; Chrome ${browser.version()}; esbuild development/production`,
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
      assert(path.basename(resolved).startsWith("appunti-react-optimistic-"));
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
async function mount(page, name, extra = {}) {
  await page.evaluate(({ name, extra }) => window.mount(name, extra), {
    name,
    extra,
  });
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
const items = (page) =>
  page
    .getByRole("list", { name: "Commenti", exact: true })
    .getByRole("listitem");
async function submitComment(page, value) {
  await page.getByLabel("Commento", { exact: true }).fill(value);
  await page.getByRole("button", { name: "Invia commento" }).click();
}
async function status(page, name) {
  return JSON.parse(await page.locator(`[data-probe="${name}"]`).textContent());
}
const idle = { pending: false, data: null, method: null, action: null };
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
  test(`${mode}: previsione immediata, conferma normalizzata, key e bozza conservate`, () =>
    withPage(mode, async (page) => {
      await mount(page, "CommentsDemo");
      await submitComment(page, "Ciao   mondo");
      await calls(page, 1);
      await text(page, "Ciao   mondo (in attesa)");
      assert(
        await page.getByRole("button", { name: "Invia commento" }).isDisabled(),
      );
      assert(
        await page
          .getByLabel("Commento", { exact: true })
          .evaluate((e) => e.readOnly),
      );
      await items(page)
        .first()
        .evaluate((e) => {
          window.row = e;
        });
      await scan(page);
      await page.evaluate(() => window.confirm(0, "Ciao mondo"));
      await text(page, "Ciao mondo (confermato)");
      assert.equal(await items(page).count(), 1);
      assert(
        await items(page)
          .first()
          .evaluate((e) => e === window.row),
      );
      assert.equal(
        await page.getByLabel("Commento", { exact: true }).inputValue(),
        "Ciao   mondo",
      );
      await page.getByRole("button", { name: "Svuota bozza" }).click();
      assert.equal(
        await page.getByLabel("Commento", { exact: true }).inputValue(),
        "",
      );
      assert.equal(await items(page).count(), 1);
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }));
  test(`${mode}: rifiuto rimuove previsione, conserva base/bozza e permette retry`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Rebase");
      await submitComment(page, "rifiuta");
      await calls(page, 1);
      assert.equal(await items(page).count(), 2);
      await page.evaluate(() => window.reject(0, true));
      await text(page, "Rifiuto previsto");
      assert.equal(await items(page).count(), 1);
      assert.equal(
        await page.getByLabel("Commento", { exact: true }).inputValue(),
        "rifiuta",
      );
      await submitComment(page, "Nuovo testo");
      await calls(page, 2);
      assert(
        await page.evaluate(
          () => window.calls[0].requestId !== window.calls[1].requestId,
        ),
      );
      await page.evaluate(() => window.confirm(1, "Nuovo testo"));
      await text(page, "Nuovo testo (confermato)");
      await text(page, "Gia presente (confermato)");
      assert.equal(await items(page).count(), 2);
    }));
  test(`${mode}: rebase su aggiornamenti esterni e merge senza perdita`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Rebase");
      await submitComment(page, "Locale");
      await calls(page, 1);
      await page.evaluate(() =>
        window.replaceBase((current) => [
          ...current,
          { id: "remote", requestId: "remote", text: "Remoto", pending: false },
        ]),
      );
      await text(page, "Remoto (confermato)");
      await text(page, "Locale (in attesa)");
      assert.equal(await items(page).count(), 3);
      await page.evaluate(() => window.confirm(0, "Locale salvato"));
      await text(page, "Locale salvato (confermato)");
      assert.equal(await items(page).count(), 3);
      await text(page, "Remoto (confermato)");
    }));
  test(`${mode}: base gia confermata deduplica e non viene annullata dal rifiuto`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Rebase");
      await submitComment(page, "Provvisorio");
      await calls(page, 1);
      await page.evaluate(() =>
        window.replaceBase((current) => [
          ...current,
          {
            id: "remote-confirmed",
            requestId: window.calls[0].requestId,
            text: "Conferma esterna",
            pending: false,
          },
        ]),
      );
      await text(page, "Conferma esterna (confermato)");
      assert.equal(await items(page).count(), 2);
      assert(
        !(await items(page).allTextContents()).some((s) =>
          s.includes("in attesa"),
        ),
      );
      await page.evaluate(() => window.reject(0, true));
      await text(page, "Rifiuto previsto");
      await text(page, "Conferma esterna (confermato)");
      assert.equal(await items(page).count(), 2);
    }));
  test(`${mode}: successo senza aggiornare la base perde la previsione`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Rebase", { ignore: true });
      await submitComment(page, "Temporaneo");
      await calls(page, 1);
      assert.equal(await items(page).count(), 2);
      await page.evaluate(() => window.confirm(0));
      await text(page, "Commento confermato nella demo.");
      assert.equal(await items(page).count(), 1);
      await text(page, "Gia presente (confermato)");
    }));
  test(`${mode}: testo vuoto/spazi non avvia servizio o previsione`, () =>
    withPage(mode, async (page) => {
      await mount(page, "CommentsDemo");
      await submitComment(page, "");
      assert.equal(
        await page
          .getByLabel("Commento", { exact: true })
          .evaluate((e) => e.validity.valueMissing),
        true,
      );
      await submitComment(page, "   ");
      await text(page, "Inserisci da 1 a 200");
      assert.equal(await page.evaluate(() => window.calls.length), 0);
      assert.equal(await items(page).count(), 0);
      assert.equal(
        await page.getByLabel("Commento", { exact: true }).inputValue(),
        "   ",
      );
    }));
  for (const invalidReply of [false, true]) {
    test(`${mode}: ${invalidReply ? "risposta incoerente" : "guasto inatteso"} raggiunge il boundary`, () =>
      withPage(
        mode,
        async (page) => {
          await mount(page, "CommentsDemo");
          await submitComment(page, "Testo");
          await calls(page, 1);
          await page.evaluate(
            (bad) =>
              bad
                ? window.release(0, {
                    id: "s",
                    requestId: "errato",
                    text: "No",
                  })
                : window.reject(0),
            invalidReply,
          );
          await page.getByRole("alert").waitFor();
        },
        {
          caught: [
            invalidReply
              ? "Risposta commento non valida."
              : "Guasto intenzionale",
          ],
        },
      ));
  }
  test(`${mode}: form distinti, payload, pending locale, esito e ID accessibili`, () =>
    withPage(mode, async (page) => {
      await mount(page, "PreviewPanels");
      const a = page.getByRole("form", { name: "Etichetta principale" });
      const b = page.getByRole("form", { name: "Etichetta secondaria" });
      assert.notEqual(
        await a.getByLabel("Etichetta", { exact: true }).getAttribute("id"),
        await b.getByLabel("Etichetta", { exact: true }).getAttribute("id"),
      );
      await a.getByLabel("Etichetta", { exact: true }).fill(" ciao ");
      await a.getByLabel("Etichetta", { exact: true }).press("Enter");
      await calls(page, 1);
      await text(page, "In elaborazione:  ciao ");
      assert.deepEqual(await page.evaluate(() => window.calls), ["ciao"]);
      assert(await a.getByRole("button").isDisabled());
      assert.equal(await b.getByRole("button").isDisabled(), false);
      await b.getByLabel("Etichetta", { exact: true }).fill("Indipendente");
      await scan(page);
      await page.evaluate(() => window.release(0, "CIAO"));
      await text(page, "Anteprima pronta: CIAO");
      assert.equal(
        await a.getByLabel("Etichetta", { exact: true }).inputValue(),
        " ciao ",
      );
      assert.equal(
        await b.getByLabel("Etichetta", { exact: true }).inputValue(),
        "Indipendente",
      );
      await b.getByRole("button").click();
      await calls(page, 2);
      await page.evaluate(() => window.release(1, "INDIPENDENTE"));
      await text(page, "Anteprima pronta: INDIPENDENTE");
      await page.setViewportSize({ width: 390, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }));
  test(`${mode}: errore previsto mantiene risultato precedente e bozza`, () =>
    withPage(mode, async (page) => {
      await mount(page, "PreviewPanels");
      const form = page.getByRole("form", { name: "Etichetta principale" });
      await form.getByLabel("Etichetta", { exact: true }).fill("prima");
      await form.getByRole("button").click();
      await calls(page, 1);
      await page.evaluate(() => window.release(0, "PRIMA"));
      await text(page, "Ultima anteprima: PRIMA");
      await form.getByLabel("Etichetta", { exact: true }).fill("  ");
      await form.getByRole("button").click();
      await text(page, "Inserisci da 1 a 40");
      assert.equal(await page.evaluate(() => window.calls.length), 1);
      await text(page, "Ultima anteprima: PRIMA");
      assert.equal(
        await form.getByLabel("Etichetta", { exact: true }).inputValue(),
        "  ",
      );
      assert.equal(await form.getByRole("button").isDisabled(), false);
    }));
  test(`${mode}: rigetto di anteprima non produce un successo fittizio`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "PreviewPanels");
        const form = page.getByRole("form", { name: "Etichetta principale" });
        await form.getByLabel("Etichetta", { exact: true }).fill("testo");
        await form.getByRole("button").click();
        await calls(page, 1);
        await page.evaluate(() => window.reject(0));
        await page.getByRole("alert").waitFor();
      },
      { caught: ["Guasto intenzionale"] },
    ));
  test(`${mode}: scope, snapshot FormData, method e action durante e dopo invio`, () =>
    withPage(mode, async (page) => {
      await mount(page, "StatusProbe");
      assert.deepEqual(await status(page, "inside"), idle);
      await page.getByLabel("Valore probe").fill("prima");
      await page
        .getByRole("button", { name: "Invio probe", exact: true })
        .click();
      await calls(page, 1);
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      assert.deepEqual(await status(page, "inside"), {
        pending: true,
        data: { value: "prima", intent: "primary" },
        method: "get",
        action: "primary",
      });
      assert.deepEqual(await status(page, "outside"), idle);
      assert.deepEqual(await status(page, "sibling"), idle);
      await page.getByLabel("Valore probe").fill("dopo");
      assert.equal((await status(page, "inside")).data.value, "prima");
      await page.evaluate(() => window.release(0));
      await page.waitForFunction(
        () =>
          !JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      assert.deepEqual(await status(page, "inside"), idle);
    }));
  test(`${mode}: formAction effettiva e submitter HTML esterno non spostano il contesto`, () =>
    withPage(mode, async (page) => {
      await mount(page, "StatusProbe");
      await page.getByRole("button", { name: "Invio alternativo" }).click();
      await calls(page, 1);
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      assert.equal((await status(page, "inside")).action, "alternate");
      await page.evaluate(() => window.release(0));
      await page.waitForFunction(
        () =>
          !JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      await page.getByRole("button", { name: "Invio esterno" }).click();
      await calls(page, 2);
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      assert.deepEqual(await status(page, "sibling"), idle);
      await page.evaluate(() => window.release(1));
      await page.waitForFunction(
        () =>
          !JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
    }));
  test(`${mode}: hook nello stesso componente non osserva il form restituito`, () =>
    withPage(mode, async (page) => {
      await mount(page, "SameComponent");
      await page.getByRole("button", { name: "Invia stesso" }).click();
      await calls(page, 1);
      await page.waitForFunction(
        () =>
          JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
      await text(page, "Parent pending: false");
      await page.evaluate(() => window.release(0));
      await page.waitForFunction(
        () =>
          !JSON.parse(
            document.querySelector('[data-probe="inside"]').textContent,
          ).pending,
      );
    }));
  test(`${mode}: onSubmit async da solo non attiva useFormStatus`, () =>
    withPage(mode, async (page) => {
      await mount(page, "SubmitOnly");
      await page.getByRole("button", { name: "Invia evento" }).click();
      await calls(page, 1);
      assert.deepEqual(await status(page, "inside"), idle);
      await page.evaluate(() => window.release(0));
      await text(page, "Terminato");
      assert.deepEqual(await status(page, "inside"), idle);
    }));
}
test("development: setter ottimistico fuori Action segnala l'uso scorretto", () =>
  withPage(
    "development",
    async (page) => {
      await mount(page, "OptimisticProbe");
      await page.evaluate(() => window.setOptimistic("temporaneo"));
      await text(page, "Valore: base");
    },
    { warning: /optimistic.*outside.*transition|optimistic.*outside.*action/i },
  ));
