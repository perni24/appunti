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
const { I18nextProvider } = toolRequire("react-i18next");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const axe = toolRequire("axe-core");
const names = [
  "WAI-ARIA",
  "Focus Management",
  "Animazioni e Micro-interazioni",
  "Internazionalizzazione",
];
const trees = names.map(
  (name) => parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
);
function snippet(index, marker, lang = "jsx") {
  const nodes = trees[index].children.filter(
    (node) =>
      node.type === "code" && node.lang === lang && node.value.includes(marker),
  );
  assert.equal(nodes.length, 1, marker);
  return nodes[0].value;
}
const sources = {
  Details: snippet(0, "function Details"),
  NameForm: snippet(0, "function NameForm"),
  EditableName: snippet(1, "function EditableName"),
  PageLayout: snippet(1, "function PageLayout"),
  CssFeedback: snippet(2, "function CssFeedback"),
  MotionFeedback: snippet(2, "function MotionFeedback"),
  SpringFeedback: snippet(2, "function SpringFeedback"),
  I18n: snippet(3, "function createI18n", "javascript"),
  TranslationDemo: snippet(3, "function TranslationDemo"),
  Bootstrap: snippet(3, "createRoot(root)"),
};
const feedbackCss = snippet(2, ".feedback-button {", "css");
const focusCss = trees[1].children
  .filter((node) => node.type === "code" && node.lang === "css")
  .map((node) => node.value)
  .join("\n");
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
const { createI18n } = load("I18n");
const intl = load("TranslationDemo");
for (let index = 0; index < names.length; index++) {
  test(`Sintassi JSX/JS/CSS: ${names[index]} (non esecuzione)`, () => {
    for (const node of trees[index].children.filter(
      (node) =>
        node.type === "code" &&
        ["jsx", "javascript", "css"].includes(node.lang),
    )) {
      assert.doesNotThrow(() =>
        transformSync(node.value, {
          loader: node.lang === "css" ? "css" : "jsx",
          jsx: "automatic",
        }),
      );
    }
  });
}
test("i18n: factory isola lingua e risorse mutabili", async () => {
  const a = await createI18n("it"),
    b = await createI18n("en");
  assert.notEqual(a, b);
  await a.changeLanguage("en");
  await b.changeLanguage("it");
  assert.equal(a.resolvedLanguage, "en");
  assert.equal(b.resolvedLanguage, "it");
  a.addResource("it", "translation", "language", "Modificata");
  assert.equal(b.t("language"), "Lingua");
});
for (const [language, expected] of [
  ["it", ["Nessun elemento", "1 elemento", "2 elementi", "1000000 elementi"]],
  ["en", ["No items", "1 item", "2 items", "1000000 items"]],
]) {
  test(`i18n: plurali ${language}, zero speciale e numeri grandi`, async () => {
    const i18n = await createI18n(language);
    assert.deepEqual(
      [0, 1, 2, 1000000].map((count) => i18n.t("items", { count })),
      expected,
    );
  });
}
test("i18n: fallback di chiave, lingua non supportata e chiave mancante", async () => {
  const it = await createI18n("it"),
    unsupported = await createI18n("de");
  assert.equal(it.t("help"), "Help is available in English.");
  assert.equal(it.t("missing.key"), "missing.key");
  assert.equal(unsupported.resolvedLanguage, "en");
  assert.equal(unsupported.t("language"), "Language");
  assert.equal(it.dir("ar"), "rtl");
});
test("Intl: valuta del dato preservata al cambio locale, zero incluso", () => {
  assert.match(intl.formatPrice(1234.5, "it-IT", "EUR"), /1\.?234,50/);
  assert.match(intl.formatPrice(1234.5, "en-GB", "EUR"), /1,234\.50/);
  assert(intl.formatPrice(1234.5, "en-GB", "EUR").includes("€"));
  assert.match(intl.formatPrice(0, "en-GB", "EUR"), /0\.00/);
});
test("Intl: fuso esplicito cambia giorno, input e fuso invalidi rifiutati", () => {
  const instant = "2026-10-15T01:00:00Z";
  assert.match(intl.formatInstant(instant, "en-GB", "UTC"), /15 Oct 2026/);
  assert.match(
    intl.formatInstant(instant, "en-GB", "America/New_York"),
    /14 Oct 2026/,
  );
  assert.throws(
    () => intl.formatInstant("not-a-date", "it-IT", "UTC"),
    RangeError,
  );
  assert.throws(
    () => intl.formatInstant(instant, "it-IT", "Invalid/Zone"),
    RangeError,
  );
});
test("i18n: interpolazione JSX resta testo nel render statico", async () => {
  const instance = await createI18n("it");
  const html = renderToStaticMarkup(
    h(
      I18nextProvider,
      { i18n: instance },
      h(intl.default, { name: '<img src=x onerror="alert(1)">' }),
    ),
  );
  assert(!html.includes("<img"));
  assert(html.includes("&lt;img"));
  assert(html.includes("2 elementi"));
});

let browser, server, origin;
before(async () => {
  const bundles = new Map();
  for (const mode of ["development", "production"]) {
    for (const bootstrap of [false, true]) {
      const result = await build({
        stdin: {
          contents: bootstrap
            ? `import 'note:Bootstrap';`
            : `
import {createElement as h, StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {I18nextProvider} from 'react-i18next';
import Details from 'note:Details';
import NameForm from 'note:NameForm';
import EditableName from 'note:EditableName';
import {PageLayout} from 'note:PageLayout';
import CssFeedback from 'note:CssFeedback';
import MotionFeedback from 'note:MotionFeedback';
import SpringFeedback from 'note:SpringFeedback';
import TranslationDemo from 'note:TranslationDemo';
import {createI18n} from 'note:I18n';
const instance=await createI18n('it');
window.i18n=instance;
window.deferLanguage=()=>{
 const original=instance.changeLanguage.bind(instance);
 instance.changeLanguage=next=>new Promise((resolve,reject)=>{
  window.resolveLanguage=()=>original(next).then(resolve,reject);
  window.rejectLanguage=()=>reject(new Error('Guasto simulato'));
 });
 window.restoreLanguage=()=>{instance.changeLanguage=original;};
};
function Pair({component}){const Item=component==='form'?NameForm:Details;return h('div',null,h(Item),h(Item));}
const components={Details,NameForm,EditableName,PageLayout,CssFeedback,MotionFeedback,SpringFeedback,TranslationDemo,Pair};
const root=createRoot(document.getElementById('root'));
window.mount=(name,props={},key='stable')=>root.render(h(StrictMode,null,h(I18nextProvider,{i18n:instance},name?h(name==='PageLayout'?'div':'main',null,h(components[name],{...props,key})):null)));
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
                { filter: /^\.\/feedback\.css$/, namespace: "notes" },
                () => ({ path: "feedback.css", namespace: "style" }),
              );
              api.onLoad({ filter: /.*/, namespace: "style" }, () => ({
                contents: "",
                loader: "js",
              }));
              api.onResolve(
                { filter: /^\.\/(App\.jsx|i18n\.js)$/, namespace: "notes" },
                (args) => ({
                  path: args.path.includes("App") ? "TranslationDemo" : "I18n",
                  namespace: "notes",
                }),
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
      bundles.set(
        `/${bootstrap ? "bootstrap-" : ""}${mode}.js`,
        result.outputFiles[0].text,
      );
    }
  }
  server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (bundles.has(url.pathname)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end(bundles.get(url.pathname));
    }
    const mode = url.pathname === "/production" ? "production" : "development";
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<!doctype html><html lang="it" dir="ltr"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture UX</title><link rel="icon" href="data:,"><style>${feedbackCss}\n${focusCss}</style></head><body><header><h1>Fixture UX</h1></header><div id="root"></div><script type="module" src="/${url.searchParams.has("bootstrap") ? "bootstrap-" : ""}${mode}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Motion ${toolRequire("motion/package.json").version}; Spring ${toolRequire("@react-spring/web/package.json").version}; i18next ${toolRequire("i18next/package.json").version}; react-i18next ${toolRequire("react-i18next/package.json").version}; axe ${axe.version}; Chrome ${browser.version()}`,
  );
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
  {
    reducedMotion = "no-preference",
    bootstrap = false,
    motionWarning = false,
    width = 1000,
  } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion,
    timezoneId: "America/Los_Angeles",
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    const errors = [],
      warnings = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
      if (msg.type() === "warning") warnings.push(msg.text());
    });
    page.on("response", (res) => {
      if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
    });
    await page.goto(`${origin}/${mode}${bootstrap ? "?bootstrap=1" : ""}`);
    if (bootstrap)
      await page.getByRole("heading", { name: "Ciao, Ada" }).waitFor();
    else await page.waitForFunction(() => window.ready);
    await run(page);
    assert.deepEqual(errors, []);
    const allowed =
      "You have Reduced Motion enabled on your device. Animations may not appear as expected.";
    assert(
      warnings.every((message) => motionWarning && message.includes(allowed)),
      JSON.stringify(warnings),
    );
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
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function textVisible(page, text) {
  await page.getByText(text, { exact: true }).waitFor();
}
async function focused(page, selector) {
  await page.waitForFunction(
    (selector) => document.activeElement?.matches(selector),
    selector,
  );
}
async function assertAxe(page) {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(async () => {
    const { violations, incomplete } = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
    return {
      violations: violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      incomplete: incomplete.map((v) => v.id),
    };
  });
  assert.deepEqual(result.violations, []);
  if (result.incomplete.length)
    console.log(
      `axe: revisione manuale richiesta: ${result.incomplete.join(", ")}`,
    );
}
for (const mode of ["development", "production"]) {
  test(`Chrome ${mode}: disclosure, Enter/Space, hidden e Tab`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Details");
      const trigger = button(page, "Dettagli notifiche");
      await trigger.focus();
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await page.getByRole("checkbox").count(), 0);
      await page.keyboard.press("Enter");
      await page.getByRole("checkbox").waitFor();
      assert.equal(await trigger.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Tab");
      await focused(page, "input[type=checkbox]");
      await page.keyboard.press("Space");
      assert.equal(await page.getByRole("checkbox").isChecked(), false);
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Space");
      assert.equal(await page.getByRole("checkbox").count(), 0);
      await trigger.click();
      assert.equal(await page.getByRole("checkbox").isChecked(), false);
      await assertAxe(page);
    }));
  test(`Chrome ${mode}: due disclosure, ID e stati indipendenti`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Pair");
      await button(page, "Dettagli notifiche").first().click();
      assert.equal(
        await button(page, "Dettagli notifiche")
          .last()
          .getAttribute("aria-expanded"),
        "false",
      );
      const ids = await button(page, "Dettagli notifiche").evaluateAll(
        (nodes) => nodes.map((node) => node.getAttribute("aria-controls")),
      );
      assert.equal(new Set(ids).size, 2);
      assert(
        await page.evaluate(
          (ids) => ids.every((id) => document.getElementById(id)),
          ids,
        ),
      );
    }));
  test(`Chrome ${mode}: form, nome/descrizione, errore, stato e testo escapato`, () =>
    withPage(mode, async (page) => {
      await mount(page, "NameForm");
      const field = page.getByLabel("Nome visualizzato");
      await field.fill("  ");
      await button(page, "Salva bozza").click();
      await page.getByRole("alert").waitFor();
      assert.equal(await field.getAttribute("aria-invalid"), "true");
      const relation = await field.evaluate((node) =>
        node
          .getAttribute("aria-describedby")
          .split(" ")
          .map((id) => document.getElementById(id)?.textContent),
      );
      assert.equal(relation.length, 2);
      assert(relation.every(Boolean));
      await assertAxe(page);
      await field.fill("<img src=x>");
      await field.press("Enter");
      await textVisible(page, "Bozza salvata per <img src=x>.");
      assert.equal(await page.locator("img").count(), 0);
      assert.equal(await field.getAttribute("aria-invalid"), null);
      assert.equal(
        (await field.getAttribute("aria-describedby")).split(" ").length,
        1,
      );
      await assertAxe(page);
    }));
  test(`Chrome ${mode}: due form, label e errori non incrociati`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Pair", { component: "form" });
      await button(page, "Salva bozza").first().click();
      assert.equal(await page.getByRole("alert").count(), 1);
      const fields = page.getByLabel("Nome visualizzato");
      assert.notEqual(
        await fields.first().getAttribute("id"),
        await fields.last().getAttribute("id"),
      );
      assert.equal(await fields.last().getAttribute("aria-invalid"), null);
    }));
  test(`Chrome ${mode}: editor, nessun autofocus al mount, Enter salva e restituisce focus`, () =>
    withPage(mode, async (page) => {
      await mount(page, "EditableName");
      await button(page, "Modifica nome").waitFor();
      assert.equal(
        await page.evaluate(() => document.activeElement.tagName),
        "BODY",
      );
      await button(page, "Modifica nome").click();
      await focused(page, "input");
      await page.getByLabel("Nuovo nome").fill(" Grace ");
      await page.keyboard.press("Enter");
      await textVisible(page, "Nome: Grace");
      await focused(page, "button");
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Modifica nome",
      );
      await assertAxe(page);
    }));
  test(`Chrome ${mode}: editor, Annulla/Escape scartano bozza, render non ruba focus`, () =>
    withPage(mode, async (page) => {
      await mount(page, "EditableName");
      await button(page, "Modifica nome").click();
      await page.getByLabel("Nuovo nome").fill("Bozza");
      await button(page, "Annulla").click();
      await focused(page, "button");
      await button(page, "Modifica nome").click();
      assert.equal(await page.getByLabel("Nuovo nome").inputValue(), "Ada");
      await button(page, "Annulla").focus();
      await mount(page, "EditableName", { rerender: 1 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Annulla",
      );
      await page.keyboard.press("Escape");
      await focused(page, "button");
      await textVisible(page, "Nome: Ada");
    }));
  test(`Chrome ${mode}: Escape durante composizione IME non chiude`, () =>
    withPage(mode, async (page) => {
      await mount(page, "EditableName");
      await button(page, "Modifica nome").click();
      await page.getByLabel("Nuovo nome").evaluate((node) =>
        node.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            isComposing: true,
          }),
        ),
      );
      await page.getByLabel("Nuovo nome").waitFor();
    }));
  test(`Chrome ${mode}: skip link visibile al focus e destinazione fuori da Tab`, () =>
    withPage(mode, async (page) => {
      await mount(page, "PageLayout");
      await page.getByRole("link", { name: "Salta al contenuto" }).waitFor();
      await page.keyboard.press("Tab");
      await focused(page, ".skip-link");
      assert.equal(
        await page
          .locator(".skip-link")
          .evaluate((node) => getComputedStyle(node).transform),
        "none",
      );
      await page.keyboard.press("Enter");
      await focused(page, "#main-content");
      await page.keyboard.press("Tab");
      await focused(page, "input[type=checkbox]");
    }));
  test(`Chrome ${mode}: CSS feedback, transizione, hover e focus visibile`, () =>
    withPage(mode, async (page) => {
      await mount(page, "CssFeedback");
      const target = button(page, "Preferiti");
      await target.click();
      await textVisible(page, "Aggiunto ai preferiti");
      assert(
        (
          await target.evaluate(
            (node) => getComputedStyle(node).transitionDuration,
          )
        ).includes("0.15s"),
      );
      await target.hover();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector(".feedback-button"))
            .transform === "matrix(1, 0, 0, 1, 0, -2)",
      );
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await target.evaluate((node) => getComputedStyle(node).outlineStyle),
        "solid",
      );
    }));
  test(`Chrome ${mode}: CSS reduced motion elimina transform e transizione`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "CssFeedback");
        const target = button(page, "Preferiti");
        await target.hover();
        assert.equal(
          await target.evaluate((node) => getComputedStyle(node).transform),
          "none",
        );
        assert.equal(
          await target.evaluate(
            (node) => getComputedStyle(node).transitionDuration,
          ),
          "0s",
        );
        await target.click();
        await textVisible(page, "Aggiunto ai preferiti");
      },
      { reducedMotion: "reduce" },
    ));
  test(`Chrome ${mode}: Motion ingresso, uscita inerte e riapertura`, () =>
    withPage(mode, async (page) => {
      await mount(page, "MotionFeedback");
      await button(page, "Mostra feedback").click();
      const notice = page.locator("main div[aria-hidden]");
      await notice.waitFor();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector("main div[aria-hidden]"))
            .opacity === "1",
      );
      await textVisible(page, "Bozza aggiornata (demo).");
      await button(page, "Nascondi feedback").click();
      await page
        .locator("main div[aria-hidden=true][inert]")
        .waitFor({ state: "attached" });
      await notice.waitFor({ state: "detached" });
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Nascondi feedback",
      );
      await button(page, "Mostra feedback").click();
      await notice.waitFor();
      await assertAxe(page);
    }));
  test(`Chrome ${mode}: Motion reduced motion, stato finale e smontaggio`, () =>
    withPage(
      mode,
      async (page) => {
        await mount(page, "MotionFeedback");
        await button(page, "Mostra feedback").click();
        await page.waitForFunction(() => {
          const node = document.querySelector("main div[aria-hidden]");
          return (
            node &&
            getComputedStyle(node).opacity === "1" &&
            getComputedStyle(node).transform === "none"
          );
        });
        await button(page, "Nascondi feedback").click();
        await page
          .locator("main div[aria-hidden]")
          .waitFor({ state: "detached" });
      },
      { reducedMotion: "reduce", motionWarning: true },
    ));
  for (const reducedMotion of ["no-preference", "reduce"]) {
    test(`Chrome ${mode}: React Spring ${reducedMotion}, toggle e cleanup`, () =>
      withPage(
        mode,
        async (page) => {
          await mount(page, "SpringFeedback");
          await button(page, "Modalita compatta").click();
          await textVisible(page, "Modalita attiva");
          await page.waitForFunction(() => {
            const node = document.querySelector("main button");
            return (
              Math.abs(
                new DOMMatrixReadOnly(getComputedStyle(node).transform).a -
                  1.04,
              ) < 0.0001
            );
          });
          await button(page, "Modalita compatta").click();
          await textVisible(page, "Modalita disattiva");
          await page.waitForFunction(
            () =>
              Math.abs(
                new DOMMatrixReadOnly(
                  getComputedStyle(document.querySelector("main button"))
                    .transform,
                ).a - 1,
              ) < 0.0001,
          );
          await mount(page, null);
          await page.waitForFunction(
            () => document.getElementById("root").childElementCount === 0,
          );
        },
        { reducedMotion },
      ));
  }
  test(`Chrome ${mode}: i18n cambio lingua, plurali, valuta, fuso e cleanup html`, () =>
    withPage(mode, async (page) => {
      await mount(page, "TranslationDemo");
      await textVisible(page, "2 elementi");
      await button(page, "Svuota").click();
      await textVisible(page, "Nessun elemento");
      await button(page, "Aggiungi elemento").click();
      await textVisible(page, "1 elemento");
      await page.getByLabel("Lingua").selectOption("en");
      await textVisible(page, "1 item");
      assert.equal(await page.locator("html").getAttribute("lang"), "en");
      assert.equal(await page.locator("html").getAttribute("dir"), "ltr");
      assert.match(await page.locator("time").textContent(), /14:00/);
      assert((await page.locator("main").innerText()).includes("€1,234.50"));
      await button(page, "Add item").click();
      await textVisible(page, "2 items");
      await assertAxe(page);
      await mount(page, null);
      await page.waitForFunction(() => document.documentElement.lang === "it");
    }));
  test(`Chrome ${mode}: i18n pending, errore simulato e retry`, () =>
    withPage(mode, async (page) => {
      // useTranslation puo conservare un wrapper: installare il mock prima del mount.
      await page.evaluate(() => window.deferLanguage());
      await mount(page, "TranslationDemo");
      await page.getByLabel("Lingua").selectOption("en");
      await page.waitForFunction(
        () => document.querySelector("select").disabled,
      );
      await page.evaluate(() => window.rejectLanguage());
      await page.getByRole("alert").waitFor();
      assert.equal(await page.getByRole("combobox").inputValue(), "it");
      await page.getByLabel("Lingua").selectOption("en");
      await page.evaluate(() => window.resolveLanguage());
      await textVisible(page, "2 items");
      assert.equal(await page.getByRole("alert").count(), 0);
      await page.evaluate(() => window.restoreLanguage());
    }));
  test(`Chrome ${mode}: i18n input interpolato non diventa HTML`, () =>
    withPage(mode, async (page) => {
      await mount(page, "TranslationDemo", {
        name: "<img src=x onerror=alert(1)>",
      });
      await page
        .getByRole("heading", { name: "Ciao, <img src=x onerror=alert(1)>" })
        .waitFor();
      assert.equal(await page.locator("img").count(), 0);
    }));
  test(`Chrome ${mode}: bootstrap i18n completo e reload senza persistenza`, () =>
    withPage(
      mode,
      async (page) => {
        await page.getByLabel("Lingua").selectOption("en");
        await textVisible(page, "2 items");
        await page.reload();
        await page.getByRole("heading", { name: "Ciao, Ada" }).waitFor();
        await textVisible(page, "2 elementi");
      },
      { bootstrap: true },
    ));
}
