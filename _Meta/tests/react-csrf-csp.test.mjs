import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
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
const axe = toolRequire("axe-core");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const blocks = (name) =>
  parseNote(`Programmazione/React/Pagine/${name}.md`).tree.children.filter(
    (n) => n.type === "code",
  );
const csrfBlocks = blocks("CSRF"),
  cspBlocks = blocks("Content Security Policy");
const csrfSource = csrfBlocks.find((n) => n.lang === "jsx").value;
const cspSource = cspBlocks.find((n) => n.lang === "jsx").value;
const css = cspBlocks.find((n) => n.lang === "css").value;
const [shellSource, serverSource] = cspBlocks
  .filter((n) => n.lang === "js")
  .map((n) => n.value);
const baseline = cspBlocks
  .find((n) => n.lang === "http")
  .value.replace(/^Content-Security-Policy: /, "");
function load(source, resolve = toolRequire, define = {}) {
  const module = { exports: {} };
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
    define,
  }).code;
  new Function("require", "module", "exports", code)(
    resolve,
    module,
    module.exports,
  );
  return module.exports;
}
const csrf = load(csrfSource),
  { createReactPage } = load(shellSource);
const token = "a".repeat(43),
  foreignToken = "b".repeat(43);

test("Moduli delle note: sintassi JSX, shell e server", () => {
  for (const source of [csrfSource, cspSource, shellSource, serverSource])
    assert.doesNotThrow(() => transformSync(source, { loader: "jsx" }));
});
test("CSRF: input non valido rifiutato prima di fetch", async () => {
  for (const value of [null, 1, "true", {}])
    await assert.rejects(
      csrf.savePreferences(value, token),
      /Preferenza non valida/,
    );
  for (const value of [
    null,
    "",
    "a".repeat(31),
    "a".repeat(257),
    token + "\r\nX: y",
  ])
    await assert.rejects(
      csrf.savePreferences(true, value),
      /Token CSRF non valido/,
    );
});
test("CSRF: render SSR non effettua mutazioni e non espone il token", () => {
  const html = renderToStaticMarkup(
    React.createElement(csrf.default, { csrfToken: token }),
  );
  assert.match(html, /Salva preferenza/);
  assert(!html.includes(token));
  assert(!html.includes("checked="));
});
test("CSP: nonce diversi, 128 bit e corrispondenza header/HTML", () => {
  const values = new Set();
  for (let i = 0; i < 20; i++) {
    const { headers, body } = createReactPage();
    const nonce =
      headers["Content-Security-Policy"].match(/'nonce-([^']+)'/)[1];
    assert.equal(Buffer.from(nonce, "base64").length, 16);
    assert(body.includes(`nonce="${nonce}"`));
    assert.equal(headers["Cache-Control"], "no-store");
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    values.add(nonce);
  }
  assert.equal(values.size, 20);
});
test("CSP: baseline e nonce non aggiungono unsafe-inline/eval o data", () => {
  for (const policy of [
    baseline,
    createReactPage().headers["Content-Security-Policy"],
  ]) {
    for (const directive of [
      "default-src 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ])
      assert(policy.includes(directive));
    assert(!/unsafe-inline|unsafe-eval|data:/.test(policy));
  }
});

let browser, server, other, demo, origin, otherOrigin, demoOrigin;
const bundles = new Map(),
  assets = new Map();
let state;
const reset = () =>
  (state = {
    writes: [],
    requests: [],
    status: 204,
    delay: null,
    options: 0,
    probes: 0,
  });
const entry = `
import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Form, {savePreferences} from 'note:csrf';
window.savePreferences=savePreferences;
const root=createRoot(document.getElementById('root'));
window.mount=(token)=>root.render(token?React.createElement(StrictMode,null,React.createElement(Form,{csrfToken:token})):null);
window.mount('${token}');window.ready=true;
`;
async function listen(instance) {
  instance.listen(0, "127.0.0.1");
  await once(instance, "listening");
  return `http://127.0.0.1:${instance.address().port}`;
}
before(async () => {
  for (const mode of ["development", "production"]) {
    const result = await build({
      stdin: { contents: entry, loader: "jsx", resolveDir: toolsRoot },
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      jsx: "automatic",
      minify: mode === "production",
      nodePaths: [path.join(toolsRoot, "node_modules")],
      define: { "process.env.NODE_ENV": JSON.stringify(mode) },
      plugins: [
        {
          name: "note",
          setup(api) {
            api.onResolve({ filter: /^note:/ }, (args) => ({
              path: args.path,
              namespace: "note",
            }));
            api.onLoad({ filter: /.*/, namespace: "note" }, () => ({
              contents: csrfSource,
              loader: "jsx",
              resolveDir: toolsRoot,
            }));
          },
        },
      ],
    });
    bundles.set(`/${mode}.js`, result.outputFiles[0].text);
  }
  // Opzioni equivalenti al comando esbuild della nota, senza override NODE_ENV.
  const output = await build({
    stdin: {
      contents: cspSource,
      sourcefile: "app.jsx",
      loader: "jsx",
      resolveDir: toolsRoot,
    },
    bundle: true,
    minify: true,
    format: "esm",
    outdir: "dist",
    write: false,
    nodePaths: [path.join(toolsRoot, "node_modules")],
    plugins: [
      {
        name: "css",
        setup(api) {
          api.onResolve({ filter: /^\.\/app\.css$/ }, () => ({
            path: "app.css",
            namespace: "note-css",
          }));
          api.onLoad({ filter: /.*/, namespace: "note-css" }, () => ({
            contents: css,
            loader: "css",
          }));
        },
      },
    ],
  });
  assets.set(
    "/app.js",
    output.outputFiles.find((f) => f.path.endsWith(".js")).contents,
  );
  assets.set(
    "/app.css",
    output.outputFiles.find((f) => f.path.endsWith(".css")).contents,
  );
  // Esegue il server estratto: porta effimera e readFile virtuale sono gli unici adattamenti.
  load(
    serverSource,
    (name) => {
      if (name === "./csp-page.mjs") return { createReactPage };
      if (name === "node:fs/promises")
        return {
          readFile: async (url) => {
            const key = url.pathname.replace("/fixture/dist", "");
            if (!assets.has(key)) throw new Error("ENOENT fixture");
            return assets.get(key);
          },
        };
      if (name === "node:http")
        return {
          createServer(handler) {
            demo = createServer(handler);
            return {
              listen() {
                demo.listen(0, "127.0.0.1");
              },
            };
          },
        };
      return toolRequire(name);
    },
    { "import.meta.url": JSON.stringify("file:///fixture/server.mjs") },
  );
  await once(demo, "listening");
  demoOrigin = `http://127.0.0.1:${demo.address().port}`;
  reset();
  server = createServer(async (req, res) => {
    const url = new URL(req.url, origin);
    if (bundles.has(url.pathname)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end(bundles.get(url.pathname));
    }
    if (assets.has(url.pathname)) {
      res.writeHead(200, {
        "Content-Type": url.pathname.endsWith("css")
          ? "text/css"
          : "text/javascript",
      });
      return res.end(assets.get(url.pathname));
    }
    if (url.pathname === "/probe.js") {
      state.probes++;
      res.writeHead(200, { "Content-Type": "text/javascript" });
      return res.end("globalThis.externalProbe=true;");
    }
    if (url.pathname === "/csrf") {
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Set-Cookie": "sid=a; HttpOnly; SameSite=Lax; Path=/",
        "Cache-Control": "no-store",
      });
      return res.end(
        `<!doctype html><html lang="it"><head><title>Preferenze</title></head><body><main id="root"></main><script type="module" src="/${url.searchParams.get("mode") ?? "production"}.js"></script></body></html>`,
      );
    }
    if (url.pathname === "/api/preferences") {
      const request = { method: req.method, headers: req.headers };
      state.requests.push(request);
      if (req.method === "OPTIONS") {
        state.options++;
        res.writeHead(403);
        return res.end();
      }
      if (req.method !== "PUT") {
        res.writeHead(405);
        return res.end();
      }
      if (req.headers.origin !== origin) {
        res.writeHead(403);
        return res.end();
      }
      if (!/(?:^|; )sid=a(?:;|$)/.test(req.headers.cookie ?? "")) {
        res.writeHead(401);
        return res.end();
      }
      if (req.headers["x-csrf-token"] !== token) {
        res.writeHead(403);
        return res.end();
      }
      if (req.headers["content-type"] !== "application/json") {
        res.writeHead(415);
        return res.end();
      }
      let body = "";
      for await (const chunk of req) body += chunk;
      try {
        request.body = JSON.parse(body);
      } catch {
        res.writeHead(400);
        return res.end();
      }
      if (
        Object.keys(request.body).length !== 1 ||
        typeof request.body.newsletter !== "boolean"
      ) {
        res.writeHead(400);
        return res.end();
      }
      if (state.delay) await state.delay.promise;
      if (state.status === 204) state.writes.push(request.body);
      res.writeHead(state.status);
      return res.end();
    }
    if (url.pathname === "/csp") {
      const result = createReactPage(),
        kind = url.searchParams.get("kind");
      let payload = "";
      if (kind === "inline" || kind === "report")
        payload = "<script>globalThis.inlineProbe=true;</script>";
      if (kind === "wrong")
        payload = '<script nonce="wrong">globalThis.inlineProbe=true;</script>';
      if (kind === "external") payload = '<script src="/probe.js"></script>';
      if (kind === "baseline")
        result.headers["Content-Security-Policy"] = baseline;
      if (kind === "report") {
        result.headers["Content-Security-Policy-Report-Only"] =
          result.headers["Content-Security-Policy"];
        delete result.headers["Content-Security-Policy"];
      }
      res.writeHead(200, result.headers);
      return res.end(result.body.replace("</body>", payload + "</body>"));
    }
    res.writeHead(404);
    res.end();
  });
  origin = await listen(server);
  other = createServer((req, res) => {
    req.resume();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      `<!doctype html><html><head><title>Altra origine</title></head><body><form action="${origin}/api/preferences" method="POST"><input name="newsletter" value="true"><button>Invia</button></form></body></html>`,
    );
  });
  otherOrigin = await listen(other);
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Chrome ${browser.version()}; HTTP loopback, nessun backend di produzione`,
  );
});
after(async () => {
  state?.delay?.resolve();
  await browser?.close();
  for (const instance of [server, other, demo])
    if (instance) {
      instance.closeAllConnections();
      await new Promise((resolve) => instance.close(resolve));
    }
});
async function withPage(
  url,
  run,
  { statuses = [], csp = false, cors = false } = {},
) {
  reset();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage(),
    errors = [],
    violations = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text(),
      status = text.match(/status of (\d+)/)?.[1];
    if (csp && /Content Security Policy|report-only|Reporting API/i.test(text))
      return;
    if (cors && /CORS policy|net::ERR_FAILED/.test(text)) return;
    if (status && statuses.includes(Number(status))) return;
    errors.push(text);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && !statuses.includes(response.status()))
      errors.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    const u = new URL(request.url());
    if (![origin, otherOrigin, demoOrigin].includes(u.origin)) {
      errors.push(`Rete esterna: ${u.href}`);
    }
  });
  if (!cors)
    await context.route("**/favicon.ico", (route) =>
      route.fulfill({ status: 204 }),
    );
  await page.exposeFunction("recordViolation", (value) =>
    violations.push(value),
  );
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (e) =>
      window.recordViolation({
        directive: e.effectiveDirective,
        disposition: e.disposition,
      }),
    ),
  );
  try {
    await page.goto(url);
    await run(page, violations);
    assert.deepEqual(errors, []);
  } finally {
    state.delay?.resolve();
    await context.close();
  }
}
const rendered = (page) =>
  page.getByRole("button", { name: "Salva preferenza", exact: true }).waitFor();
for (const mode of ["development", "production"]) {
  test(`${mode}: salvataggio con cookie HttpOnly, token e JSON`, () =>
    withPage(`${origin}/csrf?mode=${mode}`, async (page) => {
      await rendered(page);
      assert.equal(await page.evaluate(() => document.cookie), "");
      await page.getByRole("checkbox").check();
      await page.getByRole("button").click();
      await page.getByText("Preferenza salvata.", { exact: true }).waitFor();
      assert.deepEqual(state.writes, [{ newsletter: true }]);
      assert.equal(state.requests[0].headers["x-csrf-token"], token);
      assert.equal(state.requests[0].headers.origin, origin);
      assert.equal(state.options, 0);
      await page.addScriptTag({ content: axe.source });
      const results = await page.evaluate(() =>
        axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        }),
      );
      assert.deepEqual(
        results.violations.map((v) => v.id),
        [],
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }));
  for (const status of [401, 403, 500])
    test(`${mode}: HTTP ${status}, bozza conservata e nessun retry automatico`, () =>
      withPage(
        `${origin}/csrf?mode=${mode}`,
        async (page) => {
          await rendered(page);
          state.status = status;
          await page.getByRole("checkbox").check();
          await page.getByRole("button").click();
          await page.waitForFunction(
            () =>
              document.querySelector('[role="status"]').textContent.length > 0,
          );
          assert.equal(await page.getByRole("checkbox").isChecked(), true);
          assert.equal(state.requests.length, 1);
          assert.equal(state.writes.length, 0);
          assert.match(
            await page.getByRole("status").innerText(),
            status === 401
              ? /Sessione scaduta/
              : status === 403
                ? /non consentita/
                : /non confermato/,
          );
        },
        { statuses: [status] },
      ));
  test(`${mode}: doppio submit serializzato e attesa visibile`, () =>
    withPage(`${origin}/csrf?mode=${mode}`, async (page) => {
      await rendered(page);
      state.delay = Promise.withResolvers();
      await page.evaluate(() => {
        const form = document.querySelector("form");
        form.requestSubmit();
        form.requestSubmit();
      });
      await page.getByRole("button", { name: "Salvataggio..." }).waitFor();
      assert(await page.getByRole("checkbox").isDisabled());
      await page.waitForFunction(
        () => document.querySelector("button").disabled,
      );
      state.delay.resolve();
      await page.getByText("Preferenza salvata.", { exact: true }).waitFor();
      assert.equal(state.requests.length, 1);
      assert.equal(state.writes.length, 1);
    }));
  test(`${mode}: smontaggio cancella attesa client, non la scrittura server`, () =>
    withPage(`${origin}/csrf?mode=${mode}`, async (page) => {
      await rendered(page);
      state.delay = Promise.withResolvers();
      const sent = page.waitForRequest((r) =>
        r.url().endsWith("/api/preferences"),
      );
      await page.getByRole("button").click();
      await sent;
      while (!state.requests.length)
        await new Promise((resolve) => setTimeout(resolve, 5));
      await page.evaluate(() => window.mount(null));
      await page.waitForFunction(() => !document.querySelector("form"));
      state.delay.resolve();
      for (let i = 0; i < 200 && !state.writes.length; i++)
        await new Promise((resolve) => setTimeout(resolve, 5));
      assert.equal(state.writes.length, 1);
      assert.equal(await page.locator("form").count(), 0);
    }));
}
test("CSRF: token di altra sessione rifiutato dal backend di fixture", () =>
  withPage(
    `${origin}/csrf`,
    async (page) => {
      await rendered(page);
      const status = await page.evaluate(async (foreign) => {
        try {
          await window.savePreferences(true, foreign);
        } catch (e) {
          return e.status;
        }
      }, foreignToken);
      assert.equal(status, 403);
      assert.equal(state.writes.length, 0);
    },
    { statuses: [403] },
  ));
test("CSRF: rete fallita non viene confermata", () =>
  withPage(`${origin}/csrf`, async (page) => {
    await rendered(page);
    await page.evaluate(() => {
      window.fetch = () => Promise.reject(new TypeError("rete simulata"));
    });
    await page.getByRole("button").click();
    await page.getByText(/Esito non confermato/).waitFor();
    assert.equal(state.requests.length, 0);
  }));
test("CSRF: opzione redirect error e nessun parsing JSON su 204", () =>
  withPage(`${origin}/csrf`, async (page) => {
    await rendered(page);
    const options = await page.evaluate(async (token) => {
      let captured;
      window.fetch = async (url, opts) => {
        captured = { url, ...opts };
        return {
          status: 204,
          json() {
            throw new Error("Non deve leggere JSON");
          },
        };
      };
      await window.savePreferences(false, token);
      return captured;
    }, token);
    assert.equal(options.url, "/api/preferences");
    assert.equal(options.redirect, "error");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    assert.equal(options.body, '{"newsletter":false}');
  }));
test("CSRF: Origin mancante/null/diverso rifiutato anche con cookie e token validi", async () => {
  reset();
  for (const value of [undefined, "null", otherOrigin, origin + ".invalid"]) {
    const headers = {
      Cookie: "sid=a",
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    };
    if (value !== undefined) headers.Origin = value;
    const response = await fetch(origin + "/api/preferences", {
      method: "PUT",
      headers,
      body: '{"newsletter":true}',
    });
    assert.equal(response.status, 403);
  }
  assert.equal(state.writes.length, 0);
});
test("CSRF: token assente/errato, sessione assente e schema/Content-Type rifiutati", async () => {
  reset();
  const valid = {
    Origin: origin,
    Cookie: "sid=a",
    "Content-Type": "application/json",
    "X-CSRF-Token": token,
  };
  const cases = [
    [{ ...valid, "X-CSRF-Token": "" }, '{"newsletter":true}', 403],
    [{ ...valid, "X-CSRF-Token": foreignToken }, '{"newsletter":true}', 403],
    [{ ...valid, Cookie: "" }, '{"newsletter":true}', 401],
    [{ ...valid, "Content-Type": "text/plain" }, '{"newsletter":true}', 415],
    [valid, '{"newsletter":"true"}', 400],
    [valid, '{"newsletter":true,"userId":"other"}', 400],
    [valid, "{", 400],
  ];
  for (const [headers, body, status] of cases)
    assert.equal(
      (
        await fetch(origin + "/api/preferences", {
          method: "PUT",
          headers,
          body,
        })
      ).status,
      status,
    );
  assert.equal(state.writes.length, 0);
});
test("CSRF: form cross-origin same-site invia cookie senza preflight, ma metodo rifiutato", () =>
  withPage(
    `${origin}/csrf`,
    async (page) => {
      await rendered(page);
      await page.goto(otherOrigin);
      const response = page.waitForResponse(
        (r) => r.url() === origin + "/api/preferences",
      );
      await page.getByRole("button").click();
      assert.equal((await response).status(), 405);
      assert.equal(state.requests[0].headers.cookie, "sid=a");
      assert.equal(state.requests[0].headers.origin, otherOrigin);
      assert.equal(state.requests[0].headers["sec-fetch-site"], "same-site");
      assert.equal(state.options, 0);
      assert.equal(state.writes.length, 0);
    },
    { statuses: [405] },
  ));
test("CSRF: PUT cross-origin con header richiede preflight e non arriva alla mutazione", () =>
  withPage(
    otherOrigin,
    async (page) => {
      const result = await page.evaluate(
        async ({ url, token }) => {
          try {
            await fetch(url, {
              method: "PUT",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token,
              },
              body: '{"newsletter":true}',
            });
            return "unexpected";
          } catch {
            return "blocked";
          }
        },
        { url: origin + "/api/preferences", token },
      );
      assert.equal(result, "blocked");
      assert.equal(state.options, 1);
      assert(state.requests.every((r) => r.method === "OPTIONS"));
    },
    { statuses: [403], cors: true },
  ));

test("CSP: server estratto serve HTML e asset con MIME corretto", () =>
  withPage(demoOrigin, async (page) => {
    await page.getByRole("button", { name: "Incrementa" }).click();
    await page.getByText("Conteggio: 1", { exact: true }).waitFor();
    const style = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    assert.match(style, /system-ui/);
    const js = await fetch(demoOrigin + "/app.js");
    assert.equal(js.headers.get("content-type"), "text/javascript");
    assert.equal(
      (await fetch(demoOrigin + "/app.css")).headers.get("content-type"),
      "text/css",
    );
  }));
test("CSP: server non espone sorgenti o altri metodi; asset assente restituisce 500", async () => {
  for (const url of ["/server.mjs", "/csp-page.mjs", "/missing", "/app.js?x=1"])
    assert.equal((await fetch(demoOrigin + url)).status, 404);
  assert.equal((await fetch(demoOrigin, { method: "POST" })).status, 405);
  const saved = assets.get("/app.css");
  assets.delete("/app.css");
  try {
    assert.equal((await fetch(demoOrigin + "/app.css")).status, 500);
  } finally {
    assets.set("/app.css", saved);
  }
});
for (const kind of ["inline", "wrong", "external"])
  test(`CSP: ${kind} bloccato mentre React resta interattivo`, () =>
    withPage(
      `${origin}/csp?kind=${kind}`,
      async (page, violations) => {
        await page.getByRole("button", { name: "Incrementa" }).click();
        await page.getByText("Conteggio: 1", { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(
            () => globalThis.inlineProbe ?? globalThis.externalProbe,
          ),
          undefined,
        );
        assert(
          violations.some(
            (v) =>
              v.directive === "script-src-elem" && v.disposition === "enforce",
          ),
        );
        assert.equal(state.probes, 0);
      },
      { csp: true },
    ));
test("CSP: solo report-only segnala ma permette lo script non autorizzato", () =>
  withPage(
    `${origin}/csp?kind=report`,
    async (page, violations) => {
      await page.getByRole("button", { name: "Incrementa" }).waitFor();
      assert.equal(await page.evaluate(() => globalThis.inlineProbe), true);
      assert(
        violations.some(
          (v) =>
            v.directive === "script-src-elem" && v.disposition === "report",
        ),
      );
    },
    { csp: true },
  ));
test("CSP: baseline self consente il bundle esterno e gli eventi React", () =>
  withPage(`${origin}/csp?kind=baseline`, async (page) => {
    await page.getByRole("button", { name: "Incrementa" }).click();
    await page.getByText("Conteggio: 1", { exact: true }).waitFor();
    assert.equal(await page.locator("button").getAttribute("onclick"), null);
  }));
