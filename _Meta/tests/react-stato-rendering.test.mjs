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
const playwright = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const notes = ["useState", "useEffect", "useRef", "Gestione Moduli"];
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
  QueueCounter: snippet("useState", "function QueueCounter"),
  ProfileEditor: snippet("useState", "function ProfileEditor"),
  SearchForm: snippet("useState", "function SearchForm"),
  TitleCounter: snippet("useEffect", "function TitleCounter"),
  IntervalCounter: snippet("useEffect", "function IntervalCounter"),
  UserApp: snippet("useEffect", "function UserProfile"),
  SearchInput: snippet("useRef", "function SearchInput"),
  DelayedNotice: snippet("useRef", "function DelayedNotice"),
  PriceHistory: snippet("useRef", "function PriceHistory"),
  Preferences: snippet("Gestione Moduli", "function Preferences"),
  LoginApp: snippet("Gestione Moduli", "function LoginForm"),
  NativePreferences: snippet("Gestione Moduli", "function NativePreferences"),
  RegisteredNameForm: snippet("Gestione Moduli", "function RegisteredNameForm"),
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
for (const note of notes) {
  test(`Sintassi JSX: ${note} (anche schemi, non esecuzione)`, () => {
    for (const node of trees
      .get(note)
      .children.filter((node) => node.type === "code" && node.lang === "jsx")) {
      assert.doesNotThrow(() =>
        transformSync(node.value, { loader: "jsx", jsx: "automatic" }),
      );
    }
  });
}
test("Initializer puro: oggetti e array indipendenti", () => {
  const { createProfile } = load("ProfileEditor");
  const first = createProfile();
  const second = createProfile();
  first.address.city = "Modificato";
  first.skills.pop();
  assert.deepEqual(second, {
    name: "Luca",
    address: { city: "Roma" },
    skills: ["JS", "SQL"],
  });
});
for (const [name, pattern] of [
  ["TitleCounter", /Messaggi: 0/],
  ["IntervalCounter", /Tick: 0/],
  ["DelayedNotice", /Inattivo/],
]) {
  test(`Render statico senza eseguire effect: ${name}`, () => {
    assert.match(
      renderToStaticMarkup(React.createElement(load(name).default)),
      pattern,
    );
  });
}

let server, browser, origin;
before(async () => {
  const imports = Object.keys(sources)
    .map((name) => `import ${name} from 'note:${name}';`)
    .join("\n");
  const bundle = await build({
    stdin: {
      contents: `${imports}
import { UserProfile } from 'note:UserApp';
import { LoginForm } from 'note:LoginApp';
import { createElement as h, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
const components = { ${Object.keys(sources).join(",")}, UserProfile, LoginForm };
window.mount = (name, props = {}, key = 'stable') => root.render(h(StrictMode, null, name ? h(components[name], { ...props, key }) : null));
window.ready = true;`,
      resolveDir: toolsRoot,
      loader: "jsx",
    },
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    jsx: "automatic",
    nodePaths: [path.join(toolsRoot, "node_modules")],
    define: { "process.env.NODE_ENV": '"development"' },
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
  const js = bundle.outputFiles[0].text;
  server = createServer((req, res) => {
    if (req.url === "/bundle.js") {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end(js);
    }
    if (req.url.startsWith("/api/users/")) {
      const id = decodeURIComponent(req.url.slice("/api/users/".length));
      res.writeHead(id === "missing" ? 404 : 200, {
        "Content-Type": "application/json",
      });
      return res.end(
        id === "broken"
          ? "{invalid"
          : JSON.stringify(
              id === "invalid"
                ? { id, name: 42 }
                : { id, name: id === "a" ? "Ada" : id === "b" ? "Grace" : id },
            ),
      );
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      '<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture React</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await playwright.chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; RHF ${toolRequire("react-hook-form/package.json").version}; Chrome ${browser.version()}`,
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
async function withPage(
  run,
  { clock = false, init, expected404 = false } = {},
) {
  const context = await browser.newContext({
    viewport: { width: 1000, height: 800 },
  });
  try {
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        ["error", "warning"].includes(message.type()) &&
        !(expected404 && /Failed to load resource.*404/.test(message.text()))
      )
        errors.push(message.text());
    });
    page.on("response", (response) => {
      if (
        response.status() >= 400 &&
        !(
          expected404 &&
          response.status() === 404 &&
          response.url().endsWith("/api/users/missing")
        )
      )
        errors.push(`${response.status()} ${response.url()}`);
    });
    if (clock) await page.clock.install();
    await page.goto(origin);
    await page.waitForFunction(() => window.ready);
    await run(page);
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
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function status(page, text) {
  await page.getByRole("status").filter({ hasText: text }).waitFor();
  assert.equal(await page.getByRole("status").textContent(), text);
}

test("Chrome stato: sostituzioni +1, updater +3, reset", () =>
  withPage(async (page) => {
    await mount(page, "QueueCounter");
    await button(page, "Tre sostituzioni").click();
    await status(page, "Conteggio: 1");
    await button(page, "Tre incrementi").click();
    await status(page, "Conteggio: 4");
    await button(page, "Azzera").click();
    await status(page, "Conteggio: 0");
  }));
test("Chrome stato: citta annidata, rimozione array e reset", () =>
  withPage(async (page) => {
    await mount(page, "ProfileEditor");
    await page.getByLabel("Citta").fill("Milano");
    await button(page, "Rimuovi JS").click();
    await page.getByText("Competenze: 1", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Citta").inputValue(), "Milano");
    assert.equal(await page.getByRole("heading").textContent(), "Luca");
    await button(page, "Ripristina").click();
    assert.equal(await page.getByLabel("Citta").inputValue(), "Roma");
    assert.equal(await page.locator("li").count(), 2);
  }));
test("Chrome stato: ricerca controllata e submit senza navigazione", () =>
  withPage(async (page) => {
    await mount(page, "SearchForm");
    await page.getByLabel("Ricerca").fill("react");
    await page.getByLabel("Ricerca").press("Enter");
    await page.getByText("Ricerca: react", { exact: true }).waitFor();
    assert.equal(page.url(), `${origin}/`);
  }));
test("Chrome effect: titolo aggiornato e ripristinato dopo cleanup", () =>
  withPage(async (page) => {
    await mount(page, "TitleCounter");
    await page.waitForFunction(() => document.title === "Messaggi: 0");
    await button(page, "Messaggi: 0").click();
    await page.waitForFunction(() => document.title === "Messaggi: 1");
    await mount(page, null);
    await page.waitForFunction(() => document.title === "Fixture React");
  }));
test("Chrome effect: StrictMode lascia un solo intervallo, reset e cleanup", () =>
  withPage(
    async (page) => {
      await page.evaluate(() => {
        window.intervals = new Set();
        const start = window.setInterval,
          stop = window.clearInterval;
        window.setInterval = (...args) => {
          const id = start(...args);
          window.intervals.add(id);
          return id;
        };
        window.clearInterval = (id) => {
          window.intervals.delete(id);
          stop(id);
        };
      });
      await mount(page, "IntervalCounter");
      await page.waitForFunction(() => window.intervals.size === 1);
      await page.clock.runFor(2000);
      await status(page, "Tick: 2");
      await button(page, "Azzera tick").click();
      await status(page, "Tick: 0");
      await page.clock.runFor(1000);
      await status(page, "Tick: 1");
      await mount(page, null);
      await page.waitForFunction(() => window.intervals.size === 0);
    },
    { clock: true },
  ));
test("Chrome fetch reale: selezione profili ed encoding dell'id", () =>
  withPage(async (page) => {
    await mount(page, "UserApp");
    await page.getByText("Utente: Ada", { exact: true }).waitFor();
    await page.getByLabel("Profilo").selectOption("b");
    await page.getByText("Utente: Grace", { exact: true }).waitFor();
    await mount(page, "UserProfile", { userId: "a/b?c" });
    await page.getByText("Utente: a/b?c", { exact: true }).waitFor();
  }));
for (const userId of ["missing", "broken", "invalid"]) {
  test(`Chrome fetch: errore gestito per ${userId}`, () =>
    withPage(
      async (page) => {
        await mount(page, "UserProfile", { userId });
        await page.getByRole("alert").waitFor();
        assert.equal(
          await page.getByRole("alert").textContent(),
          "Impossibile caricare il profilo.",
        );
        await mount(page, "UserProfile", { userId: "a" });
        await page.getByText("Utente: Ada", { exact: true }).waitFor();
      },
      { expected404: userId === "missing" },
    ));
}
function deferredFetch() {
  window.requests = [];
  window.fetch = (url, { signal }) =>
    new Promise((resolve, reject) => {
      window.requests.push({ url, signal, resolve, reject });
    });
  window.deliver = (index, user) =>
    window.requests[index].resolve({ ok: true, json: async () => user });
}
test("Chrome race: mock ignora abort ma il vecchio risultato non vince", () =>
  withPage(
    async (page) => {
      await mount(page, "UserProfile", { userId: "a" });
      await page.waitForFunction(() => window.requests.length === 2);
      assert.equal(
        await page.evaluate(() => window.requests[0].signal.aborted),
        true,
      );
      await mount(page, "UserProfile", { userId: "b" });
      await page.waitForFunction(() => window.requests.length === 3);
      assert.equal(
        await page.evaluate(() => window.requests[1].signal.aborted),
        true,
      );
      await page.evaluate(() => window.deliver(2, { id: "b", name: "Nuovo" }));
      await page.getByText("Utente: Nuovo", { exact: true }).waitFor();
      await page.evaluate(async () => {
        window.deliver(1, { id: "a", name: "Vecchio" });
        window.requests[0].reject(new DOMException("Abort", "AbortError"));
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      assert.equal(await page.locator("#root").textContent(), "Utente: Nuovo");
    },
    { init: deferredFetch },
  ));
test("Chrome fetch: caricamento al cambio id, errore rete e abort allo smontaggio", () =>
  withPage(
    async (page) => {
      await mount(page, "UserProfile", { userId: "a" });
      await page.waitForFunction(() => window.requests.length === 2);
      await page.evaluate(() => window.deliver(1, { id: "a", name: "Ada" }));
      await page.getByText("Utente: Ada", { exact: true }).waitFor();
      await mount(page, "UserProfile", { userId: "b" });
      await status(page, "Caricamento profilo...");
      await page.waitForFunction(() => window.requests.length === 3);
      await page.evaluate(() =>
        window.requests[2].reject(new TypeError("Failed to fetch")),
      );
      await page.getByRole("alert").waitFor();
      await mount(page, "UserProfile", { userId: "c" });
      await page.waitForFunction(() => window.requests.length === 4);
      await mount(page, null);
      await page.waitForFunction(() => window.requests[3].signal.aborted);
      await page.evaluate(async () => {
        window.deliver(3, { id: "c", name: "Tardivo" });
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      assert.equal(await page.locator("#root").textContent(), "");
    },
    { init: deferredFetch },
  ));
test("Chrome ref: focus e testo non controllato", () =>
  withPage(async (page) => {
    await mount(page, "SearchInput");
    await page.getByLabel("Ricerca").fill("bozza");
    await button(page, "Focus ricerca").click();
    assert.equal(
      await page
        .getByLabel("Ricerca")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(await page.getByLabel("Ricerca").inputValue(), "bozza");
  }));
test("Chrome ref: sostituzione timeout, annullamento e nuova esecuzione", () =>
  withPage(
    async (page) => {
      await mount(page, "DelayedNotice");
      await button(page, "Programma").click();
      await page.clock.runFor(600);
      await button(page, "Programma").click();
      await page.clock.runFor(600);
      await status(page, "In attesa");
      await button(page, "Annulla").click();
      await page.clock.runFor(1000);
      await status(page, "Annullato");
      await button(page, "Programma").click();
      await page.clock.runFor(1000);
      await status(page, "Completato");
    },
    { clock: true },
  ));
test("Chrome ref: timeout cancellato allo smontaggio", () =>
  withPage(
    async (page) => {
      await page.evaluate(() => {
        window.pendingNotice = new Set();
        const start = window.setTimeout,
          stop = window.clearTimeout;
        window.setTimeout = (callback, delay, ...args) => {
          const id = start(callback, delay, ...args);
          if (delay === 1000) window.pendingNotice.add(id);
          return id;
        };
        window.clearTimeout = (id) => {
          window.pendingNotice.delete(id);
          stop(id);
        };
      });
      await mount(page, "DelayedNotice");
      await button(page, "Programma").click();
      assert.equal(await page.evaluate(() => window.pendingNotice.size), 1);
      await mount(page, null);
      await page.waitForFunction(() => window.pendingNotice.size === 0);
    },
    { clock: true },
  ));
test("Chrome storico: precedente all'evento, non al render", () =>
  withPage(async (page) => {
    await mount(page, "PriceHistory");
    await page.getByText("Ora: 10; prima: nessuno", { exact: true }).waitFor();
    await button(page, "Aumenta di 5").click();
    await page.getByText("Ora: 15; prima: 10", { exact: true }).waitFor();
    await button(page, "Aumenta di 5").click();
    await page.getByText("Ora: 20; prima: 15", { exact: true }).waitFor();
  }));
test("Chrome form: select e checked controllati", () =>
  withPage(async (page) => {
    await mount(page, "Preferences");
    await page.getByLabel("Ruolo richiesto").selectOption("admin");
    await page.getByLabel("Accetto le condizioni").check();
    await status(page, "admin; consenso: si");
  }));
async function mountLogin(page) {
  await page.evaluate(() => {
    window.loginCalls = [];
    window.mount("LoginForm", {
      onLogin(data) {
        window.loginCalls.push(data);
        return new Promise((resolve, reject) => {
          window.resolveLogin = resolve;
          window.rejectLogin = reject;
        });
      },
    });
  });
  await page.getByLabel("Email", { exact: true }).waitFor();
}
async function fillLogin(page) {
  await page.getByLabel("Email", { exact: true }).fill("ada@example.test");
  await page.getByLabel("Password", { exact: true }).fill(" test-password ");
}
test("Chrome login: validazione HTML, Enter, pending, doppio submit e successo", () =>
  withPage(async (page) => {
    await mountLogin(page);
    await button(page, "Accedi").click();
    assert.equal(await page.evaluate(() => window.loginCalls.length), 0);
    await fillLogin(page);
    await page.getByLabel("Password", { exact: true }).press("Enter");
    await status(page, "Accesso in corso...");
    assert.equal(
      await page.getByLabel("Email", { exact: true }).isDisabled(),
      true,
    );
    await page.locator("form").evaluate((form) => {
      form.requestSubmit();
      form.reset();
    });
    assert.deepEqual(await page.evaluate(() => window.loginCalls), [
      { email: "ada@example.test", password: " test-password " },
    ]);
    assert.equal(
      await page.getByLabel("Password", { exact: true }).inputValue(),
      " test-password ",
    );
    await page.evaluate(() => window.resolveLogin());
    await status(page, "Operazione completata.");
    assert.equal(
      await page.getByLabel("Password", { exact: true }).inputValue(),
      "",
    );
    assert.equal(await page.locator("form").getAttribute("method"), "post");
  }));
test("Chrome login: errore, dati conservati, retry e reset controllato", () =>
  withPage(async (page) => {
    await mountLogin(page);
    await fillLogin(page);
    await button(page, "Accedi").click();
    await page.evaluate(() =>
      window.rejectLogin(new Error("Backend indisponibile")),
    );
    await page.getByRole("alert").waitFor();
    assert.equal(
      await page.getByLabel("Password", { exact: true }).inputValue(),
      " test-password ",
    );
    await button(page, "Accedi").click();
    assert.equal(await page.evaluate(() => window.loginCalls.length), 2);
    await page.evaluate(() => window.resolveLogin());
    await status(page, "Operazione completata.");
    await button(page, "Svuota").click();
    assert.equal(
      await page.getByLabel("Email", { exact: true }).inputValue(),
      "",
    );
    assert.equal(await page.getByRole("status").textContent(), "");
  }));
test("Chrome demo login: simulazione locale completa", () =>
  withPage(
    async (page) => {
      await mount(page, "LoginApp");
      await fillLogin(page);
      await button(page, "Accedi").click();
      await status(page, "Accesso in corso...");
      await page.clock.runFor(300);
      await status(page, "Operazione completata.");
    },
    { clock: true },
  ));
test("Chrome FormData: checkbox assente, multiselect e reset nativo", () =>
  withPage(async (page) => {
    await mount(page, "NativePreferences");
    await button(page, "Leggi valori").click();
    assert.deepEqual(JSON.parse(await page.locator("pre").textContent()), {
      nickname: "Ada",
      newsletter: false,
      topics: ["react"],
    });
    await page.getByLabel("Nickname").fill("Grace");
    await page.getByLabel("Newsletter").check();
    await page.getByLabel("Argomenti").selectOption(["react", "js"]);
    await button(page, "Leggi valori").click();
    assert.deepEqual(JSON.parse(await page.locator("pre").textContent()), {
      nickname: "Grace",
      newsletter: true,
      topics: ["react", "js"],
    });
    await button(page, "Ripristina").click();
    assert.equal(await page.getByLabel("Nickname").inputValue(), "Ada");
    assert.equal(await page.getByLabel("Newsletter").isChecked(), false);
    assert.equal(await page.locator("pre").count(), 0);
  }));
test("Chrome RHF: vuoto, spazi, errore associato e conferma normalizzata", () =>
  withPage(async (page) => {
    await mount(page, "RegisteredNameForm");
    await button(page, "Conferma nome").click();
    await page.getByRole("alert").waitFor();
    const field = page.getByLabel("Nome", { exact: true });
    assert.equal(await field.getAttribute("aria-invalid"), "true");
    assert.equal(
      await field.getAttribute("aria-describedby"),
      await page.getByRole("alert").getAttribute("id"),
    );
    assert.equal(
      await field.evaluate((el) => el === document.activeElement),
      true,
    );
    await field.fill("   ");
    await button(page, "Conferma nome").click();
    await status(page, "Ultimo nome confermato: nessuno");
    await field.fill("  Ada  ");
    await button(page, "Conferma nome").click();
    await status(page, "Ultimo nome confermato: Ada");
    assert.equal(await page.getByRole("alert").count(), 0);
  }));
