import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  symlink,
  unlink,
  realpath,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";

const siteRequire = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = siteRequire("esbuild");
const toolsRoot = await realpath(
  path.resolve(
    process.env.REACT_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const dependencyLinks = ["react", "react-dom", "vite", "@vitejs/plugin-react"];
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const playwright = process.env.PLAYWRIGHT_MODULE_PATH
  ? siteRequire(process.env.PLAYWRIGHT_MODULE_PATH)
  : siteRequire("playwright");
const notes = [
  "Introduzione e Toolchain",
  "JSX",
  "Componenti Funzionali vs Componenti a Classe",
  "Props e Flusso di dati unidirezionale",
  "Rendering Condizionale e Liste",
];
const trees = new Map(
  notes.map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker, lang = "jsx") {
  const matches = trees
    .get(note)
    .children.filter(
      (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
    );
  assert.equal(matches.length, 1, `${note}: blocco univoco ${marker}`);
  return matches[0].value;
}
function loadSnippet(note, marker) {
  const code = transformSync(snippet(note, marker), {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
    target: "node24",
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
const html = (Component, props) => renderToStaticMarkup(h(Component, props));
const intro = notes[0],
  jsx = notes[1],
  components = notes[2],
  propsNote = notes[3],
  lists = notes[4];
const { SaveButton } = loadSnippet(jsx, "function SaveButton");
const { ResultCount } = loadSnippet(jsx, "function ResultCount");
const { Glossary } = loadSnippet(jsx, "function Glossary");
const { Toolbar } = loadSnippet(jsx, "function Toolbar");
const { UserCard } = loadSnippet(jsx, "function UserCard");
const { ActionButton } = loadSnippet(propsNote, "function ActionButton");
const { Card } = loadSnippet(propsNote, "function Card");
const { UserList } = loadSnippet(propsNote, "function SearchBox");
const { OrdersView } = loadSnippet(lists, "function OrdersView");
const { NotificationCount } = loadSnippet(lists, "function NotificationCount");
const { LoadMessage } = loadSnippet(lists, "function LoadMessage");

for (const name of notes) {
  test(`Sintassi JSX/JS: ${name}`, () => {
    for (const block of trees
      .get(name)
      .children.filter(
        (n) => n.type === "code" && ["jsx", "javascript"].includes(n.lang),
      )) {
      assert.doesNotThrow(() =>
        transformSync(block.value, {
          loader: block.lang === "jsx" ? "jsx" : "js",
          jsx: "automatic",
          format: "esm",
        }),
      );
    }
  });
}
test("SaveButton: tipo e attributo booleano", () => {
  assert.match(html(SaveButton, { onSave() {} }), /type="button"/);
  assert.doesNotMatch(html(SaveButton, { disabled: false }), /disabled=/);
  assert.match(html(SaveButton, { disabled: true }), /disabled=""/);
});
test("ResultCount: zero e risultato positivo", () => {
  assert.equal(html(ResultCount, { count: 0 }), "<p>Nessun risultato</p>");
  assert.equal(html(ResultCount, { count: 3 }), "<p>3 risultati</p>");
});
test("Fragment: glossario senza wrapper intermedi", () => {
  assert.equal(
    html(Glossary, {
      entries: [
        { id: "a", term: "A", definition: "Uno" },
        { id: "b", term: "B", definition: "Due" },
      ],
    }),
    "<dl><dt>A</dt><dd>Uno</dd><dt>B</dt><dd>Due</dd></dl>",
  );
});
test("Style: px sulle dimensioni e opacity senza unita", () => {
  assert.match(
    html(Toolbar, { children: "Azioni" }),
    /style="display:flex;gap:8px;opacity:0.9"/,
  );
});
test("UserCard: testo escapato, attributi e ramo Admin", () => {
  const user = Object.freeze({
    id: "a",
    name: "<b>Ada</b>",
    bio: "<em>Bio</em>",
    isAdmin: false,
  });
  const result = html(UserCard, { user });
  assert.match(result, /&lt;b&gt;Ada&lt;\/b&gt;/);
  assert.doesNotMatch(result, /<strong>|<em>/);
  assert.match(
    html(UserCard, { user: { ...user, isAdmin: true } }),
    /<strong>Admin<\/strong>/,
  );
  assert.equal(user.name, "<b>Ada</b>");
});
test("Child oggetto: errore distinto da testo normale", () => {
  assert.throws(
    () => html(Toolbar, { children: { label: "non un elemento" } }),
    /Objects are not valid as a React child/,
  );
});
test("Card: composizione di titolo e children", () => {
  assert.equal(
    html(Card, { title: "Profilo", children: h("p", null, "Ada") }),
    '<section class="card"><h2>Profilo</h2><p>Ada</p></section>',
  );
});
test("Default props: assente e undefined, ma non null", () => {
  assert.match(html(ActionButton, {}), />Salva<\/button>/);
  assert.match(html(ActionButton, { label: undefined }), />Salva<\/button>/);
  assert.match(html(ActionButton, { label: null }), /><\/button>/);
});
test("LoadMessage: quattro rami senza dipendenze implicite", () => {
  assert.match(html(LoadMessage, { status: "loading" }), /role="status"/);
  assert.match(html(LoadMessage, { status: "error" }), /role="alert"/);
  assert.equal(html(LoadMessage, { status: "success" }), "");
  assert.match(
    html(LoadMessage, { status: "other" }),
    /Stato non riconosciuto/,
  );
});
test("NotificationCount: zero non diventa un child testuale", () => {
  assert.equal(html(NotificationCount, { count: 0 }), "<p></p>");
  assert.equal(
    html(NotificationCount, { count: 2 }),
    "<p><strong>Notifiche: 2</strong></p>",
  );
});
test("OrdersView: caricamento, errore, ignoto e lista vuota", () => {
  assert.match(html(OrdersView, { status: "loading" }), /Caricamento/);
  assert.match(html(OrdersView, { status: "error" }), /Errore/);
  assert.match(html(OrdersView, { status: "idle" }), /Stato non riconosciuto/);
  assert.match(
    html(OrdersView, { status: "success", orders: [] }),
    /Nessun ordine/,
  );
});
test("OrdersView: dati ordinati, importi e testo non interpretato", () => {
  const orders = Object.freeze([
    Object.freeze({ id: "a", code: "<A>", amountCents: 1250 }),
    Object.freeze({ id: "b", code: "B", amountCents: 0 }),
  ]);
  const result = html(OrdersView, { status: "success", orders });
  assert.match(result, /&lt;A&gt; - 12,50/);
  assert.match(result, /B - 0,00/);
  assert.equal((result.match(/<li>/g) ?? []).length, 2);
});
test("UserList: vuoto, selezione e input congelato", () => {
  assert.match(html(UserList, { items: [] }), /Nessun utente/);
  const items = Object.freeze([Object.freeze({ id: "a", name: "Ada" })]);
  assert.match(
    html(UserList, { items, selectedId: "a", onSelect() {} }),
    /aria-pressed="true"/,
  );
});

const originalNodeEnv = process.env.NODE_ENV;
let root, realTemp, server, preview, browser, url, previewUrl;
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-foundations-"));
  await mkdir(path.join(root, "src"));
  await mkdir(path.join(root, "node_modules/@vitejs"), { recursive: true });
  for (const name of dependencyLinks) {
    await symlink(
      path.join(toolsRoot, "node_modules", name),
      path.join(root, "node_modules", name),
      process.platform === "win32" ? "junction" : "dir",
    );
  }
  const files = {
    "package.json": snippet(intro, '"react-notes-demo"', "json"),
    "vite.config.js": snippet(intro, "defineConfig", "javascript"),
    "index.html": snippet(intro, "<!doctype html>", "html"),
    "src/main.jsx": snippet(intro, "import { StrictMode }"),
    "src/App.jsx": snippet(intro, "export default function App"),
    "src/JsxApp.jsx": snippet(jsx, "function UserCard"),
    "src/CounterFunction.jsx": snippet(components, "function CounterFunction"),
    "src/CounterClass.jsx": snippet(components, "class CounterClass"),
    "src/CountersApp.jsx": snippet(components, "import CounterFunction"),
    "src/ProductCard.jsx": snippet(components, "function ProductCard"),
    "src/PropsApp.jsx": snippet(propsNote, "function SearchBox"),
    "src/ListsApp.jsx": snippet(lists, "function DraftRow"),
    "src/SaveButton.jsx": snippet(jsx, "function SaveButton"),
    "src/Glossary.jsx": snippet(jsx, "function Glossary"),
  };
  for (const [file, content] of Object.entries(files))
    await writeFile(path.join(root, file), content);
  // Mutante intenzionale: dimostra che la prova sul riordino distingue una key errata.
  const listCode = files["src/ListsApp.jsx"];
  assert.equal(listCode.split("key={item.id}").length, 2);
  await writeFile(
    path.join(root, "src/IndexKeysApp.jsx"),
    listCode
      .replace("items.map((item) =>", "items.map((item, index) =>")
      .replace("key={item.id}", "key={index}"),
  );
  await writeFile(
    path.join(root, "workbench.html"),
    files["index.html"].replace('src="/src/main.jsx"', 'src="/test-entry.jsx"'),
  );
  await writeFile(
    path.join(root, "test-entry.jsx"),
    `
import { createElement as h, StrictMode, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import JsxApp, { UserCard } from './src/JsxApp.jsx';
import CounterFunction from './src/CounterFunction.jsx';
import CounterClass from './src/CounterClass.jsx';
import CountersApp from './src/CountersApp.jsx';
import { ProductCard } from './src/ProductCard.jsx';
import PropsApp, { SearchBox, UserList } from './src/PropsApp.jsx';
import ListsApp from './src/ListsApp.jsx';
import IndexKeysApp from './src/IndexKeysApp.jsx';
import { SaveButton } from './src/SaveButton.jsx';
import { Glossary } from './src/Glossary.jsx';
const components = { JsxApp, UserCard, CounterFunction, CounterClass, CountersApp, ProductCard, PropsApp, SearchBox, UserList, ListsApp, IndexKeysApp, SaveButton, Glossary };
const root = createRoot(document.getElementById('root'));
window.mount = (name, props = {}, key = 'stable') => root.render(h(StrictMode, null, h(components[name], { ...props, key })));
window.mountSearchPair = () => root.render(h(StrictMode, null, h(Fragment, null, h(SearchBox, { value: '', onValueChange() {} }), h(SearchBox, { value: '', onValueChange() {} }))));
`,
  );
  const vite = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  process.env.NODE_ENV = "production";
  await vite.build({ root, logLevel: "error" });
  preview = await vite.preview({
    root,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  });
  previewUrl = `http://127.0.0.1:${preview.httpServer.address().port}`;
  process.env.NODE_ENV = "development";
  server = await vite.createServer({
    root,
    mode: "development",
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  assert.equal(server.config.isProduction, false);
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await playwright.chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Vite ${vite.version}; Chrome ${browser.version()}`,
  );
});
after(async () => {
  try {
    await browser?.close();
    if (preview)
      await new Promise((resolve, reject) =>
        preview.httpServer.close((e) => (e ? reject(e) : resolve())),
      );
    await server?.close();
  } finally {
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), realTemp);
      assert.ok(
        path.basename(resolved).startsWith("appunti-react-foundations-"),
      );
      // Remove each junction itself before deleting the local cache and fixture.
      for (const name of dependencyLinks) {
        await unlink(path.join(resolved, "node_modules", name)).catch(
          (error) => {
            if (error.code !== "ENOENT") throw error;
          },
        );
      }
      await rm(resolved, { recursive: true, force: true });
    }
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
async function withPage(
  run,
  { production = false, workbench = true, mobile = false } = {},
) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1280, height: 900 },
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) errors.push(m.text());
    });
    await page.goto(
      (production ? previewUrl : url) + (workbench ? "/workbench.html" : "/"),
    );
    if (workbench)
      await page.waitForFunction(() => typeof window.mount === "function");
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
  await page.waitForFunction(
    () => document.querySelector("#root").childElementCount > 0,
  );
}
async function value(page, label, expected) {
  await page.getByLabel(label, { exact: true }).evaluate((el) => el.value);
  await page.waitForFunction(
    ({ label, expected }) =>
      [...document.querySelectorAll("label")].some(
        (l) =>
          l.textContent === label &&
          (l.control ?? l.querySelector("input"))?.value === expected,
      ),
    { label, expected },
  );
}
test("Build: progetto completo, dipendenze coerenti e asset prodotti", async () => {
  assert.equal(React.version, "19.3.0");
  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(
    pkg.dependencies.react,
    toolRequire("react-dom/package.json").version,
  );
  assert.match(
    await readFile(path.join(root, "dist/index.html"), "utf8"),
    /assets\/index-.*\.js/,
  );
});
test("Chrome dev: click singolo in StrictMode e reload", async () =>
  withPage(
    async (page) => {
      await page.getByRole("button", { name: "Click: 0", exact: true }).click();
      assert.equal(await page.getByRole("button").textContent(), "Click: 1");
      await page.reload();
      await page
        .getByRole("button", { name: "Click: 0", exact: true })
        .waitFor();
    },
    { workbench: false },
  ));
test("Chrome produzione mobile: build interattiva senza dev server", async () =>
  withPage(
    async (page) => {
      await page.getByRole("button", { name: "Click: 0", exact: true }).click();
      await page
        .getByRole("button", { name: "Click: 1", exact: true })
        .waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    },
    { production: true, workbench: false, mobile: true },
  ));
test("Chrome JSX: descrizione testuale, non HTML", async () =>
  withPage(async (page) => {
    await mount(page, "JsxApp");
    assert.equal(
      await page.locator("article p").textContent(),
      "<em>Testo, non HTML</em>",
    );
    assert.equal(await page.locator("article em, article strong").count(), 0);
  }));
test("Chrome handler: non eseguito durante render, poi un click", async () =>
  withPage(async (page) => {
    await page.evaluate(() => {
      window.calls = 0;
      window.mount("SaveButton", {
        onSave() {
          window.calls++;
        },
      });
    });
    await page.getByRole("button", { name: "Salva" }).waitFor();
    assert.equal(await page.evaluate(() => window.calls), 0);
    await page.getByRole("button").click();
    assert.equal(await page.evaluate(() => window.calls), 1);
  }));
test("Chrome contatori: parita del comportamento e stato indipendente", async () =>
  withPage(async (page) => {
    await mount(page, "CountersApp");
    await page.getByRole("button", { name: "Funzione: 2" }).click();
    await page.getByRole("button", { name: "Funzione: 3" }).waitFor();
    await page.getByRole("button", { name: "Classe: 2" }).click();
    await page.getByRole("button", { name: "Classe: 3" }).waitFor();
  }));
for (const [name, label] of [
  ["CounterFunction", "Funzione"],
  ["CounterClass", "Classe"],
]) {
  test(`Chrome ${name}: nuova prop iniziale non resetta, nuova key si`, async () =>
    withPage(async (page) => {
      await mount(page, name, { initialValue: 2 });
      await page.getByRole("button", { name: `${label}: 2` }).click();
      await mount(page, name, { initialValue: 10, label: "Aggiornato" });
      await page.getByRole("button", { name: "Aggiornato: 3" }).waitFor();
      await mount(page, name, { initialValue: 10, label: "Reset" }, "new-key");
      await page.getByRole("button", { name: "Reset: 10" }).waitFor();
    }));
}
test("Chrome ProductCard: callback con id", async () =>
  withPage(async (page) => {
    await page.evaluate(() =>
      window.mount("ProductCard", {
        product: { id: "p-7", name: "Prodotto" },
        onSelect(id) {
          window.selected = id;
        },
      }),
    );
    await page.getByRole("button", { name: "Seleziona" }).click();
    assert.equal(await page.evaluate(() => window.selected), "p-7");
  }));
test("Chrome props: filtro, selezione persistente, vuoto e reset", async () =>
  withPage(async (page) => {
    await mount(page, "PropsApp");
    await page.getByRole("button", { name: "Ada", exact: true }).click();
    assert.equal(
      await page
        .getByRole("button", { name: "Ada", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.getByLabel("Cerca utenti").fill(" GRa ");
    await page.getByRole("button", { name: "Grace", exact: true }).waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Ada", exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByRole("status").textContent(),
      "Selezionato: Ada",
    );
    await page.getByLabel("Cerca utenti").fill("nessuno");
    await page.getByText("Nessun utente trovato", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Azzera" }).click();
    assert.equal(await page.getByLabel("Cerca utenti").inputValue(), "");
    assert.equal(
      await page.getByRole("status").textContent(),
      "Selezionato: nessuno",
    );
    assert.equal(await page.locator("li").count(), 3);
  }));
test("Chrome useId: due label associate a input differenti", async () =>
  withPage(async (page) => {
    await page.evaluate(() => window.mountSearchPair());
    await page.locator("input").nth(1).waitFor();
    const labels = await page.locator("label").evaluateAll((nodes) =>
      nodes.map((n) => ({
        id: n.htmlFor,
        linked: n.control?.id === n.htmlFor,
      })),
    );
    assert.equal(new Set(labels.map((x) => x.id)).size, 2);
    assert.ok(labels.every((x) => x.linked));
  }));
test("Chrome input controllato: callback da sola non cambia value", async () =>
  withPage(async (page) => {
    await page.evaluate(() =>
      window.mount("SearchBox", {
        value: "fisso",
        onValueChange(value) {
          window.proposed = value;
        },
      }),
    );
    await page.getByLabel("Cerca utenti").fill("nuovo");
    assert.equal(await page.evaluate(() => window.proposed), "nuovo");
    assert.equal(await page.getByLabel("Cerca utenti").inputValue(), "fisso");
  }));
test("Chrome key: bozza e nodo restano associati dopo reverse", async () =>
  withPage(async (page) => {
    await mount(page, "ListsApp");
    await page.getByLabel("Analisi", { exact: true }).fill("Bozza A");
    const originalNode = await page
      .getByLabel("Analisi", { exact: true })
      .elementHandle();
    await page.getByRole("button", { name: "Inverti ordine" }).click();
    await value(page, "Analisi", "Bozza A");
    assert.equal(
      await page.locator("li label").first().textContent(),
      "Verifica",
    );
    const currentNode = await page
      .getByLabel("Analisi", { exact: true })
      .elementHandle();
    assert.equal(
      await originalNode.evaluate((a, b) => a === b, currentNode),
      true,
    );
  }));
test("Chrome eliminazione: bozze delle altre righe e stato vuoto", async () =>
  withPage(async (page) => {
    await mount(page, "ListsApp");
    await page.getByLabel("Sviluppo", { exact: true }).fill("Bozza B");
    await page
      .getByRole("button", { name: "Rimuovi Analisi", exact: true })
      .click();
    await value(page, "Sviluppo", "Bozza B");
    await page
      .getByRole("button", { name: "Rimuovi Sviluppo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Rimuovi Verifica", exact: true })
      .click();
    await page.getByText("Nessuna attivita", { exact: true }).waitFor();
    assert.equal(await page.locator("input").count(), 0);
  }));
test("Chrome mutante: key indice sposta la bozza sulla riga sbagliata", async () =>
  withPage(async (page) => {
    await mount(page, "IndexKeysApp");
    await page.getByLabel("Analisi", { exact: true }).fill("Bozza A");
    await page.getByRole("button", { name: "Inverti ordine" }).click();
    await value(page, "Verifica", "Bozza A");
    assert.equal(
      await page.getByLabel("Analisi", { exact: true }).inputValue(),
      "",
    );
  }));
