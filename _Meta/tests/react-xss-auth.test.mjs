import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { realpath, readFile } from "node:fs/promises";
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
const names = ["Protezione XSS", "Gestione Autenticazione"];
const sources = Object.fromEntries(
  names.map((name, index) => {
    const blocks = parseNote(
      `Programmazione/React/Pagine/${name}.md`,
    ).tree.children.filter((n) => n.type === "code" && n.lang === "jsx");
    assert.equal(blocks.length, 1, name);
    return [index === 0 ? "Xss" : "Auth", blocks[0].value];
  }),
);
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
const { checkText, allowedHelpUrl, PlainText, RichText } = load("Xss");
const { checkSession } = load("Auth");
const token = "a".repeat(40);
const session = { user: { id: "u1", name: "Ada" }, csrfToken: token };
for (const name of ["Xss", "Auth"])
  test(`Sintassi del modulo ${name}`, () => {
    assert.doesNotThrow(() =>
      transformSync(sources[name], { loader: "jsx", jsx: "automatic" }),
    );
  });
test("DOMPurify: versione della nota e della toolchain coerenti", async () => {
  const pkg = JSON.parse(
    await readFile(
      path.join(toolsRoot, "node_modules/dompurify/package.json"),
      "utf8",
    ),
  );
  assert.equal(pkg.version, "3.4.17");
});
test("Testo: tipo, vuoto, limite UTF-16 e nessuna normalizzazione implicita", () => {
  assert.equal(checkText("  <b>A</b>  "), "  <b>A</b>  ");
  assert.equal(checkText(""), "");
  assert.equal(checkText("x".repeat(20_000)).length, 20_000);
  assert.throws(() => checkText("x".repeat(20_001)), RangeError);
  for (const value of [null, undefined, {}, 1])
    assert.throws(() => checkText(value), TypeError);
});
test("URL: solo HTTPS e origine esatta, senza credenziali", () => {
  assert.equal(
    allowedHelpUrl("https://REACT.dev:443/learn?q=a%20b#x"),
    "https://react.dev/learn?q=a%20b#x",
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,x",
    "http://react.dev",
    "//react.dev/learn",
    "/learn",
    "https://react.dev.evil.example/",
    "https://react.dev@evil.example/",
    "https://user@react.dev/",
    "https://react.dev:444/",
    "",
    null,
    {},
    "x".repeat(2049),
  ])
    assert.equal(allowedHelpUrl(value), null, String(value));
});
test("SSR: testo escaped, rich text rifiutato senza DOM supportato", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlainText, { text: '<img src=x onerror="x()">' }),
  );
  assert(!html.includes("<img"));
  assert(html.includes("&lt;img"));
  assert.throws(
    () =>
      renderToStaticMarkup(
        React.createElement(RichText, { html: "<p>ciao</p>" }),
      ),
    /Sanitizer browser non disponibile/,
  );
});
test("Sessione: payload valido proiettato senza token di autenticazione extra", () => {
  const input = Object.freeze({
    user: Object.freeze({ id: "u1", name: "Ada", role: "admin" }),
    csrfToken: token,
    accessToken: "segreto",
  });
  assert.deepEqual(checkSession(input), session);
  assert.notEqual(checkSession(input).user, input.user);
});
test("Sessione: tipi, ID, nome e token CSRF invalidi rifiutati", () => {
  for (const value of [
    null,
    [],
    {},
    { ...session, user: [] },
    { ...session, user: { id: "", name: "Ada" } },
    { ...session, user: { id: "u1", name: 1 } },
    { ...session, csrfToken: "corto" },
    { ...session, csrfToken: "a".repeat(257) },
    { ...session, csrfToken: token + "\r\nX: y" },
  ])
    assert.throws(() => checkSession(value), /Sessione non valida/);
});
test("SSR: sessione iniziale non carica dati e non mostra il pannello", () => {
  let calls = 0;
  const html = renderToStaticMarkup(
    React.createElement(load("Auth").default, {
      api: {
        readSession() {
          calls++;
        },
      },
    }),
  );
  assert.match(html, /Verifica sessione/);
  assert(!html.includes("Bozza locale"));
  assert.equal(calls, 0);
});
test("Context: consumer senza provider fallisce esplicitamente", () => {
  assert.throws(
    () => renderToStaticMarkup(React.createElement(load("Auth").RequireAuth)),
    /Serve AuthProvider/,
  );
});

const entry = `
import * as xss from 'note:Xss';
import * as auth from 'note:Auth';
import {createElement as h, StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
window.xss=xss;window.auth=auth;window.failures=[];
const root=createRoot(document.getElementById('root'),{onUncaughtError:e=>window.failures.push(e.message),onRecoverableError:e=>window.failures.push(e.message)});
function Probe(){window.currentAuth=auth.useAuth();return null;}
function AuthHarness({api}){return h(auth.AuthProvider,{api},h(Probe),h(auth.RequireAuth,null,h(auth.PrivatePanel)));}
window.calls=[];
window.prepareApi=()=>{
 window.calls=[];
 function request(kind,signal,token){
  const gate=Promise.withResolvers();
  window.calls.push({kind,signal,token,...gate});
  return gate.promise;
 }
 window.api={readSession:({signal})=>request('read',signal),endSession:(token,{signal})=>request('logout',signal,token)};
};
window.mount=(name,props={})=>root.render(h(StrictMode,null,name?h({Xss:xss.default,Auth:auth.default,AuthHarness}[name],props):null));
window.mountControlled=()=>window.mount('AuthHarness',{api:window.api});
window.resolveRead=(name='Ada',id='u1')=>{
 const call=window.calls.findLast(c=>c.kind==='read'&&!c.signal.aborted);
 call.resolve({user:{id,name},csrfToken:'a'.repeat(40)});
};
window.ready=true;
`;
let server, origin, browser;
const bundles = new Map(),
  states = new Map();
before(async () => {
  for (const mode of ["development", "production"]) {
    const output = await build({
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
          name: "notes",
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
    bundles.set(`/${mode}.js`, output.outputFiles[0].text);
  }
  // Backend di fixture: nessun login/password/OIDC. Cookie e dati sono solo locali.
  server = createServer((req, res) => {
    const state = states.get(req.headers["x-fixture-id"]);
    if (req.url.startsWith("/api/")) {
      if (!state) {
        res.writeHead(500);
        res.end();
        return;
      }
      state.requests.push({
        url: req.url,
        method: req.method,
        cookie: req.headers.cookie,
        csrf: req.headers["x-csrf-token"],
      });
      res.setHeader("Cache-Control", "no-store");
      if (req.url === "/api/session") {
        if (
          !state.active ||
          !req.headers.cookie?.includes("fixture-session=local")
        ) {
          res.writeHead(401);
          res.end();
          return;
        }
        res.writeHead(state.status, { "Content-Type": "application/json" });
        res.end(state.body ?? JSON.stringify(session));
        return;
      }
      if (req.url === "/api/logout" && req.method === "POST") {
        if (req.headers["x-csrf-token"] !== token) {
          res.writeHead(403);
          res.end();
          return;
        }
        if (state.logoutStatus !== 204) {
          res.writeHead(state.logoutStatus);
          res.end();
          return;
        }
        state.active = false;
        res.writeHead(204, {
          "Set-Cookie":
            "fixture-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
        });
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
      return;
    }
    if (bundles.has(req.url)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(bundles.get(req.url));
      return;
    }
    if (!["/development", "/production"].includes(req.url)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Set-Cookie": "fixture-session=local; Path=/; HttpOnly; SameSite=Lax",
    });
    res.end(
      `<!doctype html><html lang="it"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>XSS e sessione</title><link rel="icon" href="data:,"></head><body><h1>Fixture React</h1><main id="root"></main><script type="module" src="${req.url}.js"></script></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; DOMPurify 3.4.17; Chrome ${browser.version()}`,
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
async function withPage(mode, run, { expectedStatuses = [] } = {}) {
  const id = String(states.size + 1),
    state = {
      active: true,
      status: 200,
      body: null,
      logoutStatus: 204,
      requests: [],
    };
  states.set(id, state);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders: { "X-Fixture-ID": id },
  });
  const page = await context.newPage(),
    errors = [],
    unexpectedNetwork = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const status = message
      .text()
      .match(/Failed to load resource:.*status of (\d+)/)?.[1];
    if (!status || !expectedStatuses.includes(Number(status)))
      errors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !expectedStatuses.includes(response.status())
    )
      errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on("request", (req) => {
    if (!req.url().startsWith(origin + "/") && !req.url().startsWith("data:"))
      unexpectedNetwork.push(req.url());
  });
  try {
    await page.goto(`${origin}/${mode}`);
    await page.waitForFunction(() => window.ready);
    await run(page, state);
    assert.deepEqual(await page.evaluate(() => window.failures), []);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpectedNetwork, []);
  } finally {
    await context.close();
  }
}
async function mount(page, name) {
  await page.evaluate((name) => window.mount(name), name);
}
async function controlled(page) {
  await page.evaluate(() => {
    window.prepareApi();
    window.mountControlled();
  });
  await page.waitForFunction(() => window.calls.some((c) => !c.signal.aborted));
}
async function axeCheck(page) {
  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(() =>
    axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    }),
  );
  assert.deepEqual(
    result.violations.map((v) => v.id),
    [],
  );
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
}
for (const mode of ["development", "production"]) {
  test(`${mode}: token CSRF rifiutato e nome utente reso come testo`, () =>
    withPage(
      mode,
      async (page, state) => {
        const message = await page.evaluate(async () => {
          try {
            await window.auth.endSession("errato", {
              signal: new AbortController().signal,
            });
            return "successo inatteso";
          } catch (error) {
            return error.message;
          }
        });
        assert.equal(message, "Logout HTTP 403");
        assert.equal(state.active, true);
        const name = '<img src="/unwanted" onerror="window.unexpected=1">';
        state.body = JSON.stringify({ ...session, user: { id: "u1", name } });
        await mount(page, "Auth");
        await page.getByText(`Utente: ${name}`, { exact: true }).waitFor();
        assert.equal(await page.locator("img").count(), 0);
        assert.equal(await page.evaluate(() => window.unexpected), undefined);
        assert.deepEqual(
          await page.evaluate(() => [
            localStorage.length,
            sessionStorage.length,
          ]),
          [0, 0],
        );
      },
      { expectedStatuses: [403] },
    ));
  test(`${mode}: markup originale separato dal testo, link e reset`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Xss");
      await page.getByLabel("Contenuto", { exact: true }).waitFor();
      assert(
        (await page.locator('[data-view="text"]').innerText()).includes("<img"),
      );
      assert.equal(
        await page.locator('[data-view="rich"] strong').innerText(),
        "React",
      );
      assert.equal(await page.locator("img").count(), 0);
      assert.equal(await page.evaluate(() => window.unexpected), undefined);
      await page.getByLabel("Link documentazione").fill("javascript:alert(1)");
      await page.getByRole("status").waitFor();
      assert.equal(await page.getByRole("link").count(), 0);
      await page
        .getByLabel("Link documentazione")
        .fill("https://react.dev/learn");
      const link = page.getByRole("link", { name: "Apri documentazione" });
      assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
      await page.getByLabel("Contenuto", { exact: true }).fill("");
      assert.equal(await page.locator('[data-view="rich"]').innerText(), "");
      await page.getByRole("button", { name: "Ripristina esempio" }).click();
      await page.locator('[data-view="rich"] strong').waitFor();
      await axeCheck(page);
    }));
  test(`${mode}: payload XSS senza CSP, allowlist effettiva nel DOM`, () =>
    withPage(mode, async (page) => {
      await mount(page, "Xss");
      const payloads = [
        '<img src="/unwanted" onerror="window.unexpected=1"><script>window.unexpected=2</script>',
        '<svg onload="window.unexpected=3"><a href="javascript:alert(1)">x</a></svg>',
        '<math><mtext><img src="/unwanted" onerror="window.unexpected=4"></mtext></math>',
        '<iframe srcdoc="<script>window.unexpected=5</script>"></iframe><form><input name="x"></form>',
        '<p id="root" style="color:red" data-x="1" aria-label="x" onclick="window.unexpected=6">Test <strong>ok</strong></p>',
        '<a href="javascript:alert(1)">link</a><custom-tag>testo</custom-tag>',
        "<ul><li>uno<li><em>due</ul><code>&lt;img&gt;</code>",
        "<p><strong>aperto",
      ];
      for (const html of payloads) {
        await page.getByLabel("Contenuto", { exact: true }).fill(html);
        const dom = await page.locator('[data-view="rich"]').evaluate((root) =>
          [...root.querySelectorAll("*")].map((e) => ({
            tag: e.localName,
            attrs: e.attributes.length,
          })),
        );
        assert(
          dom.every(
            (e) =>
              [
                "div",
                "p",
                "br",
                "strong",
                "em",
                "ul",
                "ol",
                "li",
                "code",
              ].includes(e.tag) && e.attrs === 0,
          ),
        );
        assert.equal(await page.evaluate(() => window.unexpected), undefined);
      }
      const invalid = await page.evaluate(() => {
        const errors = [];
        for (const value of [null, {}, "x".repeat(20001)]) {
          try {
            window.xss.sanitizeRichHtml(value);
          } catch (error) {
            errors.push(error.name);
          }
        }
        return errors;
      });
      assert.deepEqual(invalid, ["TypeError", "TypeError", "RangeError"]);
    }));
  test(`${mode}: cookie HttpOnly reale, sessione e logout con header CSRF`, () =>
    withPage(
      mode,
      async (page, state) => {
        await mount(page, "Auth");
        await page.getByText("Utente: Ada", { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.cookie), "");
        assert(
          state.requests.some((r) =>
            r.cookie?.includes("fixture-session=local"),
          ),
        );
        await page.getByLabel("Bozza locale").fill("dato privato");
        await axeCheck(page);
        await page.getByRole("button", { name: "Esci", exact: true }).click();
        await page.getByRole("link", { name: "Accedi", exact: true }).waitFor();
        assert.equal(await page.getByLabel("Bozza locale").count(), 0);
        assert.equal(state.active, false);
        const logout = state.requests.find((r) => r.url === "/api/logout");
        assert.equal(logout.csrf, token);
        assert.equal(logout.method, "POST");
        assert(logout.cookie.includes("fixture-session=local"));
        assert.equal(
          (await page.context().cookies()).filter(
            (c) => c.name === "fixture-session",
          ).length,
          0,
        );
        await page.reload();
        await page.waitForFunction(() => window.ready);
        await mount(page, "Auth");
        await page.getByRole("link", { name: "Accedi", exact: true }).waitFor();
      },
      { expectedStatuses: [401] },
    ));
  for (const [label, status, body] of [
    ["401 anonimo", 401, null],
    ["403 distinto", 403, null],
    ["500 errore", 500, null],
    ["JSON invalido", 200, "{bad"],
    [
      "schema invalido",
      200,
      JSON.stringify({ user: { id: 1, name: "Ada" }, csrfToken: token }),
    ],
  ]) {
    test(`${mode}: bootstrap ${label}`, () =>
      withPage(
        mode,
        async (page, state) => {
          state.status = status;
          state.body = body;
          await mount(page, "Auth");
          if (status === 401)
            await page
              .getByRole("link", { name: "Accedi", exact: true })
              .waitFor();
          else {
            await page.getByRole("alert").waitFor();
            assert.equal(
              await page.getByRole("alert").innerText(),
              "Impossibile verificare la sessione.",
            );
            assert.equal(
              await page
                .getByRole("link", { name: "Accedi", exact: true })
                .count(),
              0,
            );
            state.status = 200;
            state.body = null;
            await page
              .getByRole("button", { name: "Verifica di nuovo" })
              .click();
            await page.getByText("Utente: Ada", { exact: true }).waitFor();
          }
          assert.equal(await page.locator('[role="alert"]').count(), 0);
        },
        { expectedStatuses: status >= 400 ? [status] : [] },
      ));
  }
  test(`${mode}: logout fallito non annuncia revoca e permette retry`, () =>
    withPage(
      mode,
      async (page, state) => {
        state.logoutStatus = 500;
        await mount(page, "Auth");
        await page.getByText("Utente: Ada", { exact: true }).waitFor();
        await page.getByLabel("Bozza locale").fill("non conservare");
        await page.getByRole("button", { name: "Esci", exact: true }).click();
        await page.getByRole("alert").waitFor();
        assert.match(
          await page.getByRole("alert").innerText(),
          /Logout non confermato/,
        );
        assert.equal(
          await page.getByText("Utente: Ada", { exact: true }).count(),
          0,
        );
        assert.equal(state.active, true);
        await axeCheck(page);
        state.logoutStatus = 204;
        await page.getByRole("button", { name: "Riprova logout" }).click();
        await page.getByRole("link", { name: "Accedi", exact: true }).waitFor();
        assert.equal(state.active, false);
      },
      { expectedStatuses: [500] },
    ));
  test(`${mode}: richieste obsolete, lettura ripetuta e cambio identita senza vecchia bozza`, () =>
    withPage(mode, async (page) => {
      await controlled(page);
      await page.evaluate(() => {
        window.old = window.calls.at(-1);
        void window.currentAuth.reload();
      });
      await page.waitForFunction(() => window.calls.at(-1) !== window.old);
      assert(await page.evaluate(() => window.old.signal.aborted));
      await page.evaluate(() => window.resolveRead("Grace", "u2"));
      await page.getByText("Utente: Grace", { exact: true }).waitFor();
      await page.evaluate(() =>
        window.old.resolve({
          user: { id: "u1", name: "Obsoleto" },
          csrfToken: "a".repeat(40),
        }),
      );
      await page.getByLabel("Bozza locale").fill("segreto di Grace");
      await page.getByRole("button", { name: "Ricontrolla sessione" }).click();
      await page.getByRole("status").waitFor();
      assert.equal(await page.getByLabel("Bozza locale").count(), 0);
      await page.evaluate(() => window.resolveRead("Ada", "u1"));
      await page.getByText("Utente: Ada", { exact: true }).waitFor();
      assert.equal(await page.getByLabel("Bozza locale").inputValue(), "");
      assert.equal(
        await page.getByText("Utente: Obsoleto", { exact: true }).count(),
        0,
      );
    }));
  test(`${mode}: doppio logout e reload durante revoca non duplicano il POST`, () =>
    withPage(mode, async (page) => {
      await controlled(page);
      await page.evaluate(() => window.resolveRead());
      await page.getByText("Utente: Ada", { exact: true }).waitFor();
      const before = await page.evaluate(() => window.calls.length);
      await page.evaluate(() => {
        void window.currentAuth.logout();
        void window.currentAuth.logout();
        void window.currentAuth.reload();
      });
      await page.getByText("Disconnessione...", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => window.calls.length), before + 1);
      assert.equal(
        await page.evaluate(() => window.calls.at(-1).kind),
        "logout",
      );
      await page.evaluate(() => window.calls.at(-1).resolve());
      await page.getByRole("link", { name: "Accedi", exact: true }).waitFor();
    }));
  test(`${mode}: rigetto rete gestito, unmount annulla e ignora completamenti`, () =>
    withPage(mode, async (page) => {
      await controlled(page);
      await page.evaluate(() =>
        window.calls.at(-1).reject(new TypeError("Network failed")),
      );
      await page.getByRole("alert").waitFor();
      await page.getByRole("button", { name: "Verifica di nuovo" }).click();
      await page.getByRole("status").waitFor();
      await mount(page, null);
      await page.waitForFunction(
        () => document.getElementById("root").childElementCount === 0,
      );
      assert(await page.evaluate(() => window.calls.at(-1).signal.aborted));
      await page.evaluate(() => {
        for (const c of window.calls) c.reject(new Error("Tardivo"));
      });
    }));
}
