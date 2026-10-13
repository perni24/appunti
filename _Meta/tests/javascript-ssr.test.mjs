import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtemp, realpath, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { request } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const NOTE = "Server-side rendering";
const renderCode = snippet(NOTE, "export function escapeHtml");
const serverCode = snippet(NOTE, "export function createApp");
const clientCode = snippet(
  NOTE,
  'const button = document.querySelector("#sort")',
);
const mainCode = snippet(NOTE, "const server = createApp();");
const { escapeHtml, renderCatalog } = await import(
  "data:text/javascript;base64," + Buffer.from(renderCode).toString("base64")
);
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "../../site/node_modules/playwright",
);

let root, temp, createApp, browser, app, origin;
async function start(options) {
  const server = createApp(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
async function stop(server) {
  if (!server?.listening) return;
  const closed = new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  server.closeAllConnections();
  await closed;
}
async function withApp(t, options, run) {
  const { server, url } = await start(options);
  t.after(() => stop(server));
  return run(url);
}
async function textResponse(url, options) {
  const response = await fetch(url, options);
  return { response, body: await response.text() };
}
async function rawResponse(url, target) {
  return new Promise((resolve, reject) => {
    const req = request(url, { path: target }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-ssr-tests-"));
  for (const [name, code] of [
    ["render.mjs", renderCode],
    ["server.mjs", serverCode],
    ["client.js", clientCode],
    ["main.mjs", mainCode],
  ])
    await writeFile(path.join(root, name), code + "\n");
  ({ createApp } = await import(pathToFileURL(path.join(root, "server.mjs"))));
  const running = await start();
  app = running.server;
  origin = running.url;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
});
after(async () => {
  await browser?.close();
  await stop(app);
  if (root) {
    assert.equal(await realpath(root), root);
    assert.equal(path.dirname(root), temp);
    assert.ok(path.basename(root).startsWith("appunti-ssr-tests-"));
    await rm(root, { recursive: true, force: true });
  }
});

for (const [name, value, expected] of [
  ["ampersand", "&", "&amp;"],
  ["less than", "<", "&lt;"],
  ["greater than", ">", "&gt;"],
  ["double quote", '"', "&quot;"],
  ["single quote", "'", "&#39;"],
])
  test(`SSR: escapes ${name}`, () => assert.equal(escapeHtml(value), expected));
test("SSR: plain text and Unicode remain unchanged", () => {
  assert.equal(escapeHtml("Caff\u00e8 \u{1f642}"), "Caff\u00e8 \u{1f642}");
  assert.equal(escapeHtml(""), "");
});
test("SSR: pre-encoded text is not trusted markup", () => {
  assert.equal(escapeHtml("&lt;b&gt;"), "&amp;lt;b&amp;gt;");
});
test("SSR: escaping rejects non-string values", () => {
  for (const value of [null, undefined, 1, {}, ["x"]]) {
    assert.throws(() => escapeHtml(value), TypeError);
  }
});
test("SSR: title, heading and quoted input encode query", () => {
  const html = renderCatalog({ query: '<b>"x"</b>', products: [] });
  assert.match(
    html,
    /<title>Catalogo: &lt;b&gt;&quot;x&quot;&lt;\/b&gt;<\/title>/,
  );
  assert.match(html, /value="&lt;b&gt;&quot;x&quot;&lt;\/b&gt;"/);
  assert.doesNotMatch(html, /<b>/);
});
test("SSR: names are encoded and script URL is fixed", () => {
  const html = renderCatalog({
    query: "",
    products: ["<script>x</script>", "A & B"],
  });
  assert.match(html, /<li>&lt;script&gt;x&lt;\/script&gt;<\/li>/);
  assert.match(html, /<li>A &amp; B<\/li>/);
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.match(html, /type="module" src="\/client.js"/);
});
test("SSR: zero results are explicit and controls start hidden", () => {
  const html = renderCatalog({ query: "", products: [] });
  assert.match(html, /<title>Catalogo<\/title>/);
  assert.match(html, /Risultati: 0/);
  assert.match(html, /Nessun prodotto trovato/);
  assert.match(html, /id="sort" type="button" hidden/);
});
test("SSR: GET contains initial HTML and declared headers", async () => {
  const { response, body } = await textResponse(origin);
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type"),
    /^text\/html; charset=utf-8$/,
  );
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(
    response.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.match(body, /<li>Mouse &amp; tappetino<\/li>/);
  assert.match(body, /Risultati: 3/);
});
test("SSR: search trims and ignores case and unrelated parameters", async () => {
  const { response, body } = await textResponse(
    origin + "/?q=%20mOuSe%20&tracking=1",
  );
  assert.equal(response.status, 200);
  assert.match(body, /value="mOuSe"/);
  assert.match(body, /Risultati: 1/);
  assert.match(body, /Mouse &amp; tappetino/);
  assert.doesNotMatch(body, /<li>Monitor/);
});
test("SSR: no matches stay HTTP 200", async () => {
  const { response, body } = await textResponse(origin + "/?q=unknown");
  assert.equal(response.status, 200);
  assert.match(body, /Nessun prodotto trovato/);
});
test("SSR: repeated query is rejected before loader", async (t) => {
  let calls = 0;
  await withApp(
    t,
    {
      loadProducts: async () => {
        calls++;
        return [];
      },
    },
    async (url) => {
      const { response } = await textResponse(url + "/?q=a&q=b");
      assert.equal(response.status, 400);
      assert.equal(calls, 0);
    },
  );
});
test("SSR: query limit is 80 UTF-16 units before trim", async () => {
  for (const [query, status] of [
    ["x".repeat(80), 200],
    ["x".repeat(81), 400],
    [" ".repeat(81), 400],
    ["\u{1f642}".repeat(40), 200],
    ["\u{1f642}".repeat(41), 400],
  ]) {
    const { response } = await textResponse(
      origin + "/?q=" + encodeURIComponent(query),
    );
    assert.equal(response.status, status);
  }
});
test("SSR: UTF-8 Content-Length counts bytes", async () => {
  const { response, body } = await textResponse(
    origin + "/?q=" + encodeURIComponent("caff\u00e8"),
  );
  assert.equal(
    Number(response.headers.get("content-length")),
    Buffer.byteLength(body),
  );
  assert.notEqual(Buffer.byteLength(body), body.length);
});
test("SSR: HEAD preserves representation headers without body", async () => {
  for (const route of ["/", "/client.js", "/missing", "/?q=a&q=b"]) {
    const get = await textResponse(origin + route);
    const head = await textResponse(origin + route, { method: "HEAD" });
    assert.equal(head.response.status, get.response.status);
    assert.equal(head.body, "");
    for (const key of ["content-type", "content-length", "cache-control"]) {
      assert.equal(
        head.response.headers.get(key),
        get.response.headers.get(key),
      );
    }
  }
});
test("SSR: only fixed client asset is served", async () => {
  const { response, body } = await textResponse(origin + "/client.js?v=1");
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("content-type"),
    "text/javascript; charset=utf-8",
  );
  assert.equal(body, clientCode + "\n");
  for (const route of [
    "/server.mjs",
    "/render.mjs",
    "/not-found",
    "/favicon.ico",
  ]) {
    const result = await textResponse(origin + route);
    assert.equal(result.response.status, 404);
    assert.equal(result.body, "Pagina non trovata");
  }
});
test("SSR: mutation methods return 405 and Allow", async () => {
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) {
    const { response, body } = await textResponse(origin, {
      method,
      body: "ignored",
    });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.equal(body, "Metodo non consentito");
  }
});
test("SSR: absolute and external authority targets are rejected", async () => {
  for (const target of [
    "http://example.invalid/",
    "//example.invalid/",
    "/\\example.invalid/",
  ]) {
    const result = await rawResponse(origin, target);
    assert.equal(result.status, 400);
  }
});
test("SSR: rejected loader returns generic 500", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  await withApp(
    t,
    {
      loadProducts: async () => {
        throw new Error("private-token");
      },
    },
    async (url) => {
      const { response, body } = await textResponse(url);
      assert.equal(response.status, 500);
      assert.equal(body, "Errore interno");
      assert.doesNotMatch(body, /private-token|Error:|stack/);
    },
  );
  assert.deepEqual(log.mock.calls[0].arguments, ["SSR request failed"]);
});
test("SSR: invalid loader data returns 500", async (t) => {
  t.mock.method(console, "error", () => {});
  for (const value of [null, "product", ["x", 42]]) {
    await withApp(t, { loadProducts: async () => value }, async (url) => {
      const { response, body } = await textResponse(url);
      assert.equal(response.status, 500);
      assert.equal(body, "Errore interno");
    });
  }
});
test(
  "SSR: concurrent requests keep queries and results separate",
  { timeout: 10000 },
  async (t) => {
    let calls = 0,
      release;
    const barrier = new Promise((resolve) => {
      release = resolve;
    });
    await withApp(
      t,
      {
        loadProducts: async () => {
          if (++calls === 2) release();
          await barrier;
          return ["Monitor", "Tastiera"];
        },
      },
      async (url) => {
        const first = textResponse(url + "/?q=monitor");
        const second = textResponse(url + "/?q=tastiera");
        const a = await first,
          b = await second;
        assert.equal(calls, 2);
        assert.match(a.body, /value="monitor"/);
        assert.match(a.body, /<li>Monitor<\/li>/);
        assert.doesNotMatch(a.body, /<li>Tastiera/);
        assert.match(b.body, /value="tastiera"/);
        assert.match(b.body, /<li>Tastiera<\/li>/);
        assert.doesNotMatch(b.body, /<li>Monitor/);
      },
    );
  },
);
test(
  "SSR: main entry starts a real Node child",
  { timeout: 15000 },
  async (t) => {
    // Only the fixture's port and printed URL change to avoid using an occupied port.
    const source = mainCode
      .replace("server.listen(3000,", "server.listen(0,")
      .replace(
        '"http://127.0.0.1:3000/"',
        "`http://127.0.0.1:${server.address().port}/`",
      );
    assert.notEqual(source, mainCode);
    const file = path.join(root, "main-ephemeral.mjs");
    await writeFile(file, source);
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
          key,
        ),
      ),
    );
    const child = spawn(process.execPath, [file], {
      cwd: root,
      env,
      windowsHide: true,
    });
    const closed = once(child, "close");
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) child.kill();
      await closed;
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => {
      stderr += data;
    });
    const url = await new Promise((resolve, reject) => {
      let output = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (data) => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
        if (match) resolve(match[0]);
      });
      child.once("error", reject);
      child.once("exit", () =>
        reject(new Error("Child exited before listening")),
      );
    });
    assert.equal((await textResponse(url)).response.status, 200);
    assert.equal(stderr, "");
  },
);

async function pageTest(t, run, options = {}) {
  const context = await browser.newContext(options);
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await run(page, context);
  assert.deepEqual(errors, []);
}
async function removeCsp(page) {
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    delete headers["content-security-policy"];
    await route.fulfill({ response, headers });
  });
}
test("[Chrome] SSR: content and GET form work with JavaScript disabled", async (t) =>
  pageTest(
    t,
    async (page) => {
      await page.goto(origin);
      assert.equal(await page.locator("#products li").count(), 3);
      assert.equal(await page.locator("#sort").isVisible(), false);
      await page.getByLabel("Cerca prodotti").fill("mouse");
      await Promise.all([
        page.waitForURL("**/?q=mouse"),
        page.getByRole("button", { name: "Cerca", exact: true }).click(),
      ]);
      assert.deepEqual(await page.locator("#products li").allTextContents(), [
        "Mouse & tappetino",
      ]);
      assert.equal(await page.title(), "Catalogo: mouse");
    },
    { javaScriptEnabled: false },
  ));
test("[Chrome] SSR: enhancement sorts existing nodes without requests", async (t) =>
  pageTest(t, async (page) => {
    await page.goto(origin);
    await page.locator("#sort").waitFor({ state: "visible" });
    await page.evaluate(() => {
      window.originalItems = [...document.querySelectorAll("#products li")];
    });
    const requests = [];
    page.on("request", (req) => requests.push(req.url()));
    await page.locator("#sort").click();
    assert.deepEqual(await page.locator("#products li").allTextContents(), [
      "Monitor",
      "Mouse & tappetino",
      "Tastiera",
    ]);
    assert.equal(
      await page.locator("#result-status").textContent(),
      "Prodotti ordinati per nome",
    );
    assert.equal(
      await page.evaluate(() =>
        [...document.querySelectorAll("#products li")].every((item) =>
          window.originalItems.includes(item),
        ),
      ),
      true,
    );
    assert.deepEqual(requests, []);
  }));
test("[Chrome] SSR: query cannot inject markup even without CSP", async (t) =>
  pageTest(t, async (page) => {
    await removeCsp(page);
    const query = '"><img src=x onerror="window.pwned=1">';
    await page.goto(origin + "/?q=" + encodeURIComponent(query));
    assert.equal(await page.getByLabel("Cerca prodotti").inputValue(), query);
    assert.equal(await page.title(), "Catalogo: " + query);
    assert.equal(await page.locator("h1").textContent(), "Catalogo: " + query);
    assert.equal(await page.locator("img").count(), 0);
    assert.equal(await page.locator("script").count(), 1);
    assert.equal(await page.evaluate(() => window.pwned), undefined);
  }));
test("[Chrome] SSR: product names stay text without CSP", async (t) =>
  withApp(
    t,
    {
      loadProducts: async () => [
        '</li><script>window.pwned=1</script><img src=x onerror="window.pwned=2">',
        "A & B",
        "Caff\u00e8",
      ],
    },
    async (url) =>
      pageTest(t, async (page) => {
        await removeCsp(page);
        await page.goto(url);
        const names = await page.locator("#products li").allTextContents();
        assert.equal(
          names[0],
          '</li><script>window.pwned=1</script><img src=x onerror="window.pwned=2">',
        );
        assert.equal(names[1], "A & B");
        assert.equal(names[2], "Caff\u00e8");
        assert.equal(await page.locator("img").count(), 0);
        assert.equal(await page.locator("script").count(), 1);
        assert.equal(await page.evaluate(() => window.pwned), undefined);
      }),
  ));
test("[Chrome] SSR: blocked client script leaves usable HTML", async (t) =>
  pageTest(t, async (page) => {
    await page.route("**/client.js", (route) => route.abort());
    await page.goto(origin);
    assert.equal(await page.locator("#sort").isVisible(), false);
    assert.equal(await page.locator("#products li").count(), 3);
    await page.getByLabel("Cerca prodotti").fill("monitor");
    await Promise.all([
      page.waitForURL("**/?q=monitor"),
      page.getByRole("button", { name: "Cerca", exact: true }).click(),
    ]);
    assert.deepEqual(await page.locator("#products li").allTextContents(), [
      "Monitor",
    ]);
  }));
test("[Chrome] SSR: one or zero results do not expose sort", async (t) =>
  pageTest(t, async (page) => {
    for (const [query, count] of [
      ["monitor", 1],
      ["unknown", 0],
    ]) {
      await page.goto(origin + "/?q=" + query);
      assert.equal(await page.locator("#products li").count(), count);
      assert.equal(await page.locator("#sort").isVisible(), false);
    }
    assert.equal(
      await page.getByText("Nessun prodotto trovato.").isVisible(),
      true,
    );
  }));
test("[Chrome] SSR: unknown route has real 404 status", async (t) =>
  pageTest(t, async (page) => {
    const response = await page.goto(origin + "/missing");
    assert.equal(response.status(), 404);
    assert.equal(
      await page.locator("body").textContent(),
      "Pagina non trovata",
    );
    assert.equal(await page.locator("#products").count(), 0);
  }));
test("[Chrome] SSR: mobile keyboard interaction with actual CSP", async (t) =>
  pageTest(
    t,
    async (page) => {
      const response = await page.goto(origin);
      assert.match(
        response.headers()["content-security-policy"],
        /default-src 'none'/,
      );
      const violations = [];
      page.on("console", (msg) => {
        if (msg.text().includes("Content Security Policy"))
          violations.push(msg.text());
      });
      await page.locator("#sort").waitFor({ state: "visible" });
      await page.locator("#sort").focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await page.locator("#products li").first().textContent(),
        "Monitor",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      assert.deepEqual(violations, []);
    },
    { viewport: { width: 390, height: 844 } },
  ));
