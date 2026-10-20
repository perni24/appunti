import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
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
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const babel = toolRequire("@babel/core");
const compiler = toolRequire("babel-plugin-react-compiler");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const names = [
  "Virtual DOM",
  "Fiber Architecture e Concurrent Mode",
  "Batching",
  "React Compiler",
];
const trees = new Map(
  names.map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(name, marker, lang = "jsx") {
  const tree =
    trees.get(name) ?? parseNote(`Programmazione/React/Pagine/${name}.md`).tree;
  const matches = tree.children.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
  );
  assert.equal(matches.length, 1, `${name}: ${marker}`);
  return matches[0].value;
}
const sources = {
  Counter: snippet(names[0], "function Counter"),
  Identity: snippet(names[0], "function IdentityDemo"),
  Search: snippet(names[1], "function SearchPage"),
  Batch: snippet(names[2], "function BatchCounter"),
  Editor: snippet(names[2], "function ImmediateEditor"),
  Catalog: snippet(names[3], "function CatalogDemo"),
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
function compile(source, options = {}) {
  return babel.transformSync(source, {
    filename: "App.jsx",
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ["jsx"] },
    plugins: [
      [compiler, { compilationMode: "annotation", target: "19", ...options }],
    ],
    ast: true,
    code: true,
  });
}
const compiled = compile(sources.Catalog);
for (const name of names) {
  test(`Sintassi JSX/JS: ${name} (non prova il comportamento)`, () => {
    for (const node of trees
      .get(name)
      .children.filter(
        (n) =>
          n.type === "code" && ["jsx", "js", "javascript"].includes(n.lang),
      ))
      assert.doesNotThrow(() =>
        transformSync(node.value, {
          loader: node.lang === "jsx" ? "jsx" : "js",
          jsx: "automatic",
        }),
      );
  });
}
test("Compiler: genera cache soltanto nelle funzioni opt-in", () => {
  const runtime = compiled.ast.program.body.find(
    (n) =>
      n.type === "ImportDeclaration" &&
      n.source.value === "react/compiler-runtime",
  );
  assert(runtime);
  const local = runtime.specifiers[0].local.name;
  const functions = compiled.ast.program.body
    .filter((n) =>
      ["ExportNamedDeclaration", "ExportDefaultDeclaration"].includes(n.type),
    )
    .map((n) => n.declaration)
    .filter((n) => n?.type === "FunctionDeclaration");
  function calls(node) {
    if (!node || typeof node !== "object") return false;
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === local
    )
      return true;
    return Object.values(node).some((value) =>
      Array.isArray(value) ? value.some(calls) : calls(value),
    );
  }
  for (const fn of functions) {
    const callsCache = calls(fn.body);
    assert.equal(callsCache, fn.id.name !== "CatalogLabel", fn.id.name);
  }
  assert.deepEqual(functions.map((f) => f.id.name).sort(), [
    "CatalogDemo",
    "CatalogLabel",
    "ProductList",
  ]);
});
test("Compiler: annotation non ottimizza funzioni prive di opt-in; infer si", () => {
  const unannotated = sources.Catalog.replaceAll('"use memo";', "");
  assert(!compile(unannotated).code.includes("react/compiler-runtime"));
  assert(
    compile(unannotated, { compilationMode: "infer" }).code.includes(
      "react/compiler-runtime",
    ),
  );
});
test("Compiler: output e originale preservano markup e props congelate", () => {
  const original = load(sources.Catalog).ProductList;
  const optimized = load(compiled.code).ProductList;
  const items = Object.freeze([
    Object.freeze({ id: "x", name: "<test>", priceCents: 1250 }),
  ]);
  const originalHtml = renderToStaticMarkup(
    React.createElement(original, { items }),
  );
  const optimizedHtml = renderToStaticMarkup(
    React.createElement(optimized, { items }),
  );
  assert.equal(optimizedHtml, originalHtml);
  assert.match(optimizedHtml, /12.50/);
  assert.match(optimizedHtml, /&lt;test&gt;/);
});
test("Ricerca: filtro case-insensitive, trim e nessun risultato", () => {
  const { SearchResults } = load(sources.Search);
  const html = (query) =>
    renderToStaticMarkup(React.createElement(SearchResults, { query }));
  assert.match(html("  RUST  "), /<li>Rust<\/li>/);
  assert(!html("python").includes("<li>React</li>"));
  assert.match(html("non presente"), /Nessun risultato/);
});

const originalNodeEnv = process.env.NODE_ENV;
let temp, root, vite, dev, preview, browser, devUrl, prodUrl;
const linked = [];
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-react-internals-"));
  await mkdir(path.join(root, "src"));
  for (const name of [
    "react",
    "react-dom",
    "vite",
    "@vitejs/plugin-react",
    "@rolldown/plugin-babel",
    "@babel/core",
    "babel-plugin-react-compiler",
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
    "index.html": snippet(intro, "<!doctype html>", "html"),
    "src/main.jsx": snippet(intro, "import { StrictMode }"),
    "vite.config.js": snippet(names[3], "defineConfig", "js"),
    "src/App.jsx": sources.Catalog,
    "workbench.html":
      '<!doctype html><html lang="it"><head><title>Internals test</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/src/probes.jsx"></script></body></html>',
    // Baseline intentionally opts out; application interactions must not depend on compilation.
    "src/Baseline.jsx": sources.Catalog.replaceAll(
      '"use memo";',
      '"use no memo";',
    ),
  };
  for (const [name, source] of Object.entries(sources))
    files[`src/${name}.jsx`] = source;
  files["src/probes.jsx"] = `
import { createElement as h, StrictMode, useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Counter } from './Counter.jsx';
import IdentityDemo, { UserRow } from './Identity.jsx';
import SearchPage from './Search.jsx';
import BatchCounter from './Batch.jsx';
import { ImmediateEditor } from './Editor.jsx';
import CatalogDemo from './Catalog.jsx';
import Baseline from './Baseline.jsx';
window.commits=[]; window.failures=[];
function BatchProbe({kind='promise'}) {
 const [count,setCount]=useState(0); const [flag,setFlag]=useState(false);
 useLayoutEffect(()=>{window.commits.push({count,flag});});
 function update(){setCount(v=>v+1);setFlag(v=>!v);}
 function run(){if(kind==='promise')Promise.resolve().then(update);else setTimeout(update,0);}
 return h('button',{type:'button',onClick:run},count+':'+flag);
}
function IdentityProbe({id='a',name='Ada',present=true}) {
 return h('ul',null,present?h(UserRow,{key:id,user:{id,name}}):null);
}
const components={Counter,IdentityDemo,IdentityProbe,SearchPage,BatchCounter,ImmediateEditor,CatalogDemo,Baseline,BatchProbe};
const root=createRoot(document.getElementById('root'),{onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
window.mount=(name,props={},key='stable')=>root.render(h(StrictMode,null,name?h(components[name],{...props,key}):null));
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
      rolldownOptions: {
        input: {
          main: path.join(root, "index.html"),
          workbench: path.join(root, "workbench.html"),
        },
      },
    },
  });
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
  devUrl = `http://127.0.0.1:${dev.httpServer.address().port}`;
  assert.equal(dev.config.isProduction, false);
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Vite ${vite.version}; Chrome ${browser.version()}; Compiler 1.0.0`,
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
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), temp);
      assert(path.basename(resolved).startsWith("appunti-react-internals-"));
      for (const link of linked) await unlink(link);
      await rm(root, { recursive: true, force: true });
    }
  }
});
async function withPage(mode, run, direct = false) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    const response = await page.goto(
      `${mode === "production" ? prodUrl : devUrl}/${direct ? "" : "workbench.html"}`,
    );
    assert.equal(response.status(), 200);
    if (!direct) await page.waitForFunction(() => window.ready);
    await run(page);
    if (!direct) {
      await page.evaluate(() => window.mount(null));
      await page.waitForFunction(
        () => document.getElementById("root").childElementCount === 0,
      );
      assert.deepEqual(await page.evaluate(() => window.failures), []);
    }
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
  await page.locator("#root > *").first().waitFor({ state: "attached" });
}
async function textIncludes(page, text) {
  await page.waitForFunction(
    (text) => document.getElementById("root").textContent.includes(text),
    text,
  );
}
test("Vite: trasformazione effettiva con il config estratto dalla nota", async () => {
  const result = await dev.transformRequest("/src/App.jsx");
  assert.match(result.code, /compiler-runtime/);
  assert.match(result.code, /memo_cache_sentinel/);
  const baseline = await dev.transformRequest("/src/Baseline.jsx");
  assert(!baseline.code.includes("compiler-runtime"));
});
for (const mode of ["development", "production"]) {
  test(`${mode}: Counter aggiorna lo stesso nodo DOM`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Counter");
      await page.evaluate(() => {
        window.originalButton = document.querySelector("button");
      });
      await page.getByRole("button").click();
      await textIncludes(page, "Conteggio: 1");
      assert(
        await page.evaluate(
          () => window.originalButton === document.querySelector("button"),
        ),
      );
    }));
  test(`${mode}: riordino conserva bozze e nodi per ID; reset li sostituisce`, () =>
    withPage(mode, async (page) => {
      await mount(page, "IdentityDemo");
      await page.getByLabel("Bozza per Ada").fill("Bozza A");
      await page.getByLabel("Bozza per Grace").fill("Bozza G");
      await page.evaluate(() => {
        window.ada = document.querySelector('[data-user-id="ada"] input');
      });
      await page.getByRole("button", { name: "Inverti ordine" }).click();
      assert.deepEqual(
        await page
          .locator("li")
          .evaluateAll((rows) => rows.map((r) => r.dataset.userId)),
        ["grace", "ada"],
      );
      assert.equal(
        await page.getByLabel("Bozza per Ada").inputValue(),
        "Bozza A",
      );
      assert.equal(
        await page.getByLabel("Bozza per Grace").inputValue(),
        "Bozza G",
      );
      assert(
        await page.evaluate(
          () =>
            window.ada === document.querySelector('[data-user-id="ada"] input'),
        ),
      );
      await page.getByRole("button", { name: "Azzera bozze" }).click();
      assert.equal(await page.getByLabel("Bozza per Ada").inputValue(), "");
      assert(
        await page.evaluate(
          () =>
            window.ada !== document.querySelector('[data-user-id="ada"] input'),
        ),
      );
    }));
  test(`${mode}: stessa key conserva stato con props nuove, smontaggio lo perde`, () =>
    withPage(mode, async (page) => {
      await mount(page, "IdentityProbe");
      await page.getByRole("textbox").fill("Persistente finche montata");
      await mount(page, "IdentityProbe", { name: "Augusta" });
      assert.equal(
        await page.getByLabel("Bozza per Augusta").inputValue(),
        "Persistente finche montata",
      );
      await mount(page, "IdentityProbe", { present: false });
      await page.waitForFunction(() => !document.querySelector("input"));
      await mount(page, "IdentityProbe");
      assert.equal(await page.getByRole("textbox").inputValue(), "");
    }));
  test(`${mode}: transition converge alla query piu recente senza perdere input`, () =>
    withPage(mode, async (page) => {
      await mount(page, "SearchPage");
      const input = page.getByRole("textbox");
      await input.fill("R");
      await input.fill("Pyt");
      await input.fill("Rust");
      await textIncludes(page, "Filtro applicato: Rust");
      assert.equal(await input.inputValue(), "Rust");
      assert.deepEqual(await page.locator("li").allTextContents(), ["Rust"]);
      await page.waitForFunction(
        () =>
          document.querySelector("[aria-busy]").getAttribute("aria-busy") ===
          "false",
      );
      await input.fill("assente");
      await textIncludes(page, "Nessun risultato");
      await input.fill("");
      await textIncludes(page, "Filtro applicato: tutti");
      assert.equal(await page.locator("li").count(), 4);
    }));
  test(`${mode}: sostituzioni, updater, ordine e snapshot`, () =>
    withPage(mode, async (page) => {
      await mount(page, "BatchCounter");
      await page.getByRole("button", { name: "Due sostituzioni" }).click();
      await textIncludes(page, "Conteggio: 1");
      await textIncludes(page, "ultimo handler: 0");
      await page.getByRole("button", { name: "Due updater" }).click();
      await textIncludes(page, "Conteggio: 3");
      await textIncludes(page, "ultimo handler: 1");
      await page
        .getByRole("button", { name: "Sostituzione poi updater", exact: true })
        .click();
      await textIncludes(page, "Conteggio: 6");
      await page
        .getByRole("button", { name: "Updater poi sostituzione", exact: true })
        .click();
      await textIncludes(page, "Conteggio: 5");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await textIncludes(page, "Conteggio: 0");
      await textIncludes(page, "nessuna lettura");
    }));
  for (const kind of ["promise", "timer"]) {
    test(`${mode}: probe batching ${kind}, nessun commit intermedio incoerente`, () =>
      withPage(mode, async (page) => {
        await mount(page, "BatchProbe", { kind });
        await page.evaluate(() => {
          window.commits = [];
        });
        await page.getByRole("button").click();
        await textIncludes(page, "1:true");
        const commits = await page.evaluate(() => window.commits);
        assert(commits.length > 0);
        assert(commits.every((c) => c.count === 1 && c.flag === true));
      }));
  }
  test(`${mode}: flushSync rende disponibile il ref, focus e bozza scartata`, () =>
    withPage(mode, async (page) => {
      await mount(page, "ImmediateEditor");
      await page.getByRole("button", { name: "Apri editor" }).click();
      const input = page.getByLabel("Bozza temporanea");
      assert(await input.evaluate((n) => n === document.activeElement));
      await input.fill("Da scartare");
      await page.getByRole("button", { name: "Chiudi editor" }).click();
      assert(
        await page
          .getByRole("button", { name: "Apri editor" })
          .evaluate((n) => n === document.activeElement),
      );
      await page.getByRole("button", { name: "Apri editor" }).click();
      assert.equal(await input.inputValue(), "");
    }));
  for (const component of ["CatalogDemo", "Baseline"]) {
    test(`${mode}: catalogo ${component}, filtro/totale e toggle indipendente`, () =>
      withPage(mode, async (page) => {
        await mount(page, component);
        await textIncludes(page, "Totale EUR: 87.50");
        const toggle = page.getByRole("button", {
          name: "Spaziatura compatta",
        });
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-pressed"), "true");
        await page.getByLabel("Cerca prodotti").fill(" MOUSE ");
        await textIncludes(page, "Totale EUR: 25.00");
        assert.deepEqual(await page.locator("li").allTextContents(), ["Mouse"]);
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-pressed"), "false");
        await textIncludes(page, "Totale EUR: 25.00");
        await page.getByLabel("Cerca prodotti").fill("<script>");
        await textIncludes(page, "Totale EUR: 0.00");
        assert.equal(await page.locator("li").count(), 0);
      }));
  }
  test(`${mode}: bootstrap della nota con config e Compiler reali`, () =>
    withPage(
      mode,
      async (page) => {
        await page.getByLabel("Cerca prodotti").fill("tastiera");
        await textIncludes(page, "Totale EUR: 50.00");
        assert.deepEqual(await page.locator("li").allTextContents(), [
          "Tastiera",
        ]);
      },
      true,
    ));
}
