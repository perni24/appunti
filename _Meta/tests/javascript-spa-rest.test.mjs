import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import {
  mkdtemp,
  realpath,
  mkdir,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const SPA = "SPA e routing lato client";
const REST = "API REST";
const moduleUrl = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const apiCode = snippet(REST, "export class HttpError");
const { createUsersApi, HttpError, ProtocolError } = await import(
  moduleUrl(apiCode)
);
const json = (value, status = 200, type = "application/json") =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": type },
  });
const user = { id: "42", name: "Ada" };
function fake(response) {
  const calls = [];
  const api = createUsersApi("https://example.test/api", {
    fetchImpl: async (...args) => {
      calls.push(args);
      return typeof response === "function" ? response(...args) : response;
    },
  });
  return { api, calls };
}

for (const base of [
  "relative/",
  "ftp://example.test/api",
  "https://u:p@example.test/api",
  "https://example.test/api?q=1",
  "https://example.test/api#x",
]) {
  test(`REST: rejects invalid base ${base}`, () =>
    assert.throws(() => createUsersApi(base), TypeError));
}
test("REST: fetch implementation must be a function", () =>
  assert.throws(
    () => createUsersApi("https://example.test/", { fetchImpl: null }),
    TypeError,
  ));

test("REST: GET keeps base prefix and returns only public fields", async () => {
  const { api, calls } = fake(json({ ...user, secret: "not returned" }));
  assert.deepEqual(await api.getUser("42"), user);
  const [url, options] = calls[0];
  assert.equal(url.href, "https://example.test/api/users/42");
  assert.equal(options.method, "GET");
  assert.equal(options.body, undefined);
  assert.equal(options.headers["Content-Type"], undefined);
  assert.equal(options.credentials, "omit");
  assert.equal(options.redirect, "error");
  assert.equal(options.cache, "no-store");
  assert.match(options.headers.Accept, /application\/problem\+json/);
});
test("REST: POST trims and projects input, preserving caller data", async () => {
  const { api, calls } = fake(json(user, 201));
  const input = { name: " Ada ", role: "admin" };
  assert.deepEqual(await api.createUser(input), user);
  assert.equal(calls[0][0].pathname, "/api/users");
  assert.equal(calls[0][1].method, "POST");
  assert.equal(calls[0][1].headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0][1].body), { name: "Ada" });
  assert.equal(input.name, " Ada ");
});
test("REST: DELETE consumes no JSON for 204", async () => {
  const response = new Response(null, { status: 204 });
  response.json = () => {
    throw new Error("Must not parse empty body");
  };
  const { api, calls } = fake(response);
  assert.equal(await api.deleteUser("42"), undefined);
  assert.equal(calls[0][1].method, "DELETE");
});
test("REST: invalid IDs reject without fetching", async () => {
  const { api, calls } = fake(null);
  for (const id of [
    42,
    "",
    "0",
    "01",
    "-2",
    "1.5",
    "1/2",
    "../42",
    "1?admin=true",
    "1".repeat(17),
    null,
  ]) {
    await assert.rejects(api.getUser(id), TypeError);
    await assert.rejects(api.deleteUser(id), TypeError);
  }
  assert.equal(calls.length, 0);
});
test("REST: invalid POST data rejects without fetching", async () => {
  const { api, calls } = fake(null);
  for (const data of [
    null,
    [],
    "Ada",
    {},
    { name: 42 },
    { name: "  " },
    { name: "a".repeat(81) },
  ])
    await assert.rejects(api.createUser(data), TypeError);
  assert.equal(calls.length, 0);
});
test("REST: documented ID and name boundaries are accepted", async () => {
  const value = { id: "9".repeat(16), name: "a".repeat(80) };
  assert.deepEqual(await fake(json(value)).api.getUser(value.id), value);
});
for (const value of [
  null,
  [],
  {},
  { id: 42, name: "Ada" },
  { id: "42", name: "" },
  { id: "42", name: "a".repeat(81) },
]) {
  test(`REST: invalid response schema ${JSON.stringify(value)}`, async () =>
    await assert.rejects(fake(json(value)).api.getUser("42"), ProtocolError));
}
test("REST: different returned ID is a protocol error", async () =>
  await assert.rejects(
    fake(json({ id: "43", name: "Ada" })).api.getUser("42"),
    /ID risposta incoerente/,
  ));
test("REST: media type parameters and case are normalized", async () =>
  assert.deepEqual(
    await fake(json(user, 200, "Application/JSON; charset=utf-8")).api.getUser(
      "42",
    ),
    user,
  ));
test("REST: unexpected successful statuses are rejected", async () => {
  await assert.rejects(
    fake(json(user, 202)).api.createUser({ name: "Ada" }),
    ProtocolError,
  );
  await assert.rejects(
    fake(json(user, 200)).api.deleteUser("42"),
    ProtocolError,
  );
  await assert.rejects(
    fake(new Response(null, { status: 204 })).api.getUser("42"),
    ProtocolError,
  );
});
test("REST: HTML success and malformed JSON do not become users", async () => {
  await assert.rejects(
    fake(
      new Response("<html>login</html>", {
        headers: { "Content-Type": "text/html" },
      }),
    ).api.getUser("42"),
    /application\/json/,
  );
  await assert.rejects(
    fake(
      new Response("{", { headers: { "Content-Type": "application/json" } }),
    ).api.getUser("42"),
    (error) =>
      error instanceof ProtocolError && error.cause instanceof SyntaxError,
  );
});
test("REST: Problem Details cannot override HTTP status or leak extra fields", async () => {
  const errorBody = {
    type: "about:blank",
    title: "Not Found",
    detail: "<b>text</b>",
    status: 200,
    secret: "private",
  };
  await assert.rejects(
    fake(json(errorBody, 404, "application/problem+json")).api.getUser("42"),
    (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "HTTP 404");
      assert.deepEqual(error.problem, {
        type: "about:blank",
        title: "Not Found",
        detail: "<b>text</b>",
      });
      return true;
    },
  );
});
test("REST: malformed problem JSON and non-record problems retain status", async () => {
  for (const body of ["{", "null", "[]"]) {
    await assert.rejects(
      fake(
        new Response(body, {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ).api.createUser({ name: "Ada" }),
      (e) => e instanceof HttpError && e.status === 422 && e.problem === null,
    );
  }
});
test("REST: non-JSON HTTP errors cancel unread bodies", async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
    { status: 503, headers: { "Content-Type": "text/html" } },
  );
  await assert.rejects(
    fake(response).api.getUser("42"),
    (e) => e instanceof HttpError && e.status === 503,
  );
  assert.equal(cancelled, true);
});
test("REST: transport and body failures are not reclassified as HTTP errors", async () => {
  const failure = new TypeError("transport interrupted");
  await assert.rejects(
    fake(() => {
      throw failure;
    }).api.getUser("42"),
    (e) => e === failure,
  );
  for (const status of [200, 500]) {
    const response = json(
      {},
      status,
      status === 200 ? "application/json" : "application/problem+json",
    );
    response.json = async () => {
      throw failure;
    };
    await assert.rejects(
      fake(response).api.getUser("42"),
      (e) => e === failure,
    );
  }
});
test("REST: pre-abort prevents fetch and forwards the original reason", async () => {
  const { api, calls } = fake(null);
  const reason = new Error("stopped");
  await assert.rejects(
    api.getUser("42", { signal: AbortSignal.abort(reason) }),
    (e) => e === reason,
  );
  assert.equal(calls.length, 0);
});
test("REST: caller signal reaches fetch unchanged", async () => {
  const { api, calls } = fake(json(user));
  const controller = new AbortController();
  await api.getUser("42", { signal: controller.signal });
  assert.equal(calls[0][1].signal, controller.signal);
});

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    return await run(`http://127.0.0.1:${server.address().port}/api/`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
test("REST: actual loopback HTTP GET, POST and DELETE", async () => {
  const requests = [];
  await withServer(
    async (req, res) => {
      const parts = [];
      for await (const part of req) parts.push(part);
      requests.push({
        url: req.url,
        method: req.method,
        body: Buffer.concat(parts).toString(),
        cookie: req.headers.cookie,
      });
      const status =
        req.method === "POST" ? 201 : req.method === "DELETE" ? 204 : 200;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(status === 204 ? undefined : JSON.stringify(user));
    },
    async (base) => {
      const api = createUsersApi(base);
      assert.deepEqual(await api.getUser("42"), user);
      assert.deepEqual(await api.createUser({ name: "Ada" }), user);
      assert.equal(await api.deleteUser("42"), undefined);
    },
  );
  assert.deepEqual(
    requests.map((r) => [r.method, r.url]),
    [
      ["GET", "/api/users/42"],
      ["POST", "/api/users"],
      ["DELETE", "/api/users/42"],
    ],
  );
  assert.equal(requests[1].body, '{"name":"Ada"}');
  assert.ok(requests.every((r) => r.cookie === undefined));
});
test("REST: native fetch refuses redirects without following them", async () => {
  let count = 0;
  await withServer(
    (req, res) => {
      count++;
      res.writeHead(302, { Location: "/other" });
      res.end();
    },
    async (base) =>
      await assert.rejects(createUsersApi(base).getUser("42"), TypeError),
  );
  assert.equal(count, 1);
});
test(
  "REST: abort during the actual response body rejects",
  { timeout: 10000 },
  async () => {
    let notify;
    const started = new Promise((resolve) => {
      notify = resolve;
    });
    await withServer(
      (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"id":');
      },
      async (base) => {
        const controller = new AbortController();
        const api = createUsersApi(base, {
          fetchImpl: async (...args) => {
            const response = await fetch(...args);
            const read = response.json.bind(response);
            response.json = () => {
              const pending = read();
              notify();
              return pending;
            };
            return response;
          },
        });
        const pending = api.getUser("42", {
          signal: controller.signal,
        });
        const rejected = assert.rejects(
          pending,
          (e) => e.name === "AbortError",
        );
        await started;
        controller.abort();
        await rejected;
      },
    );
  },
);

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "../../site/node_modules/playwright",
);
const toolsDir = await realpath(
  process.env.PRETTIER_VITE_TOOLS_DIR ??
    path.join(tmpdir(), "appunti-prettier-vite-tools"),
);
const viteDir = path.join(toolsDir, "node_modules/vite");
const vite = await import(
  pathToFileURL(path.join(viteDir, "dist/node/index.js"))
);
let root, temp, server, browser, origin;
const html = snippet(SPA, "<!doctype html>", "html");
const routerCode = snippet(SPA, "export function mountRouter");
before(async () => {
  temp = await realpath(tmpdir());
  root = await mkdtemp(path.join(temp, "appunti-spa-rest-"));
  const put = async (file, code) => {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), code);
  };
  for (const [file, code] of [
    ["package.json", snippet(SPA, '"name": "routing-demo"', "json")],
    ["vite.config.js", snippet(SPA, 'base: "/demo/"')],
    ["index.html", html],
    ["src/router.js", routerCode],
    ["src/main.js", snippet(SPA, "import { mountRouter }")],
    ["users-api.mjs", apiCode],
    ["demo.mjs", snippet(REST, "import { createUsersApi, HttpError }")],
  ])
    await put(file, code);
  await mkdir(path.join(root, "node_modules"));
  await symlink(
    viteDir,
    path.join(root, "node_modules/vite"),
    process.platform === "win32" ? "junction" : "dir",
  );
  assert.equal(vite.version, "8.3.4");
  await vite.build({ root, logLevel: "silent" });
  server = await vite.preview({
    root,
    logLevel: "silent",
    preview: { host: "127.0.0.1", port: 0, strictPort: true },
  });
  origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
});
after(async () => {
  await browser?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  if (root) {
    assert.equal(await realpath(root), root);
    assert.ok(
      root.startsWith(temp + path.sep) &&
        path.basename(root).startsWith("appunti-spa-rest-"),
    );
    await rm(root, { recursive: true, force: true });
  }
});
test("REST: standalone offline demo runs exactly as documented", async () => {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  const { stdout, stderr } = await promisify(execFile)(
    process.execPath,
    [path.join(root, "demo.mjs")],
    { env, windowsHide: true, timeout: 10000 },
  );
  assert.equal(stderr, "");
  assert.equal((stdout.match(/^(POST|GET|DELETE) /gm) ?? []).length, 4);
  assert.match(stdout, /Status gestito: 404/);
  assert.match(stdout, /undefined/);
});

async function pageTest(t, run, viewport = { width: 1440, height: 1000 }) {
  t.diagnostic(`SPA/REST browser: ${browser.version()}`);
  const context = await browser.newContext({ viewport });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await run(page, context);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
const headingIs = (page, title) =>
  page.waitForFunction(
    (title) => document.querySelector("#app h1")?.textContent === title,
    title,
  );

test("[Chrome] REST: browser client consumes the contract without cookies", async (t) =>
  pageTest(t, async (page, context) => {
    await context.addCookies([
      { name: "demo-session", value: "not-for-api", url: origin },
    ]);
    const requests = [];
    await context.route("**/api/users**", async (route) => {
      const request = route.request();
      requests.push({
        method: request.method(),
        cookie: (await request.allHeaders()).cookie,
        body: request.postData(),
      });
      if (request.method() === "DELETE") await route.fulfill({ status: 204 });
      else
        await route.fulfill({
          status: request.method() === "POST" ? 201 : 200,
          contentType: "application/json",
          body: JSON.stringify({ ...user, privateField: true }),
        });
    });
    await page.goto(origin + "/demo/");
    const result = await page.evaluate(async (url) => {
      const { createUsersApi } = await import(url);
      const api = createUsersApi(location.origin + "/api/");
      const created = await api.createUser({ name: " Ada ", role: "admin" });
      const fetched = await api.getUser(created.id);
      const removed = await api.deleteUser(created.id);
      return { created, fetched, empty: removed === undefined };
    }, moduleUrl(apiCode));
    assert.deepEqual(result, { created: user, fetched: user, empty: true });
    assert.deepEqual(
      requests.map((r) => r.method),
      ["POST", "GET", "DELETE"],
    );
    assert.ok(requests.every((r) => r.cookie === undefined));
    assert.equal(requests[0].body, '{"name":"Ada"}');
  }));

test("[Chrome] SPA: click updates route, title, focus without a document load", async (t) =>
  pageTest(t, async (page) => {
    let documents = 0;
    page.on("request", (r) => {
      if (r.isNavigationRequest()) documents++;
    });
    await page.goto(origin + "/demo/");
    await headingIs(page, "Home");
    await page.evaluate(() => {
      window.demoMarker = true;
    });
    await page.getByRole("link", { name: "Impostazioni", exact: true }).click();
    await headingIs(page, "Impostazioni");
    assert.equal(await page.title(), "Impostazioni | Demo routing");
    assert.equal(
      await page.locator("#app p").textContent(),
      "Preferenze: privacy",
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "view-title",
    );
    assert.equal(
      await page.locator('[aria-current="page"]').textContent(),
      "Impostazioni",
    );
    const length = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: "Impostazioni", exact: true }).click();
    assert.equal(await page.evaluate(() => history.length), length);
    assert.equal(await page.evaluate(() => window.demoMarker), true);
    assert.equal(documents, 1);
  }));
test("[Chrome] SPA: direct deep link and reload preserve query", async (t) =>
  pageTest(t, async (page) => {
    assert.equal(
      (await page.goto(origin + "/demo/settings?tab=privacy")).status(),
      200,
    );
    await headingIs(page, "Impostazioni");
    assert.equal((await page.reload()).status(), 200);
    await headingIs(page, "Impostazioni");
    assert.equal(
      await page.locator("#app p").textContent(),
      "Preferenze: privacy",
    );
  }));
test("[Chrome] SPA: real back and forward work with null history state", async (t) =>
  pageTest(t, async (page) => {
    await page.goto(origin + "/demo/");
    await headingIs(page, "Home");
    await page.getByRole("link", { name: "Impostazioni", exact: true }).click();
    await headingIs(page, "Impostazioni");
    assert.equal(await page.evaluate(() => history.state), null);
    await page.goBack();
    await headingIs(page, "Home");
    await page.goForward();
    await headingIs(page, "Impostazioni");
    assert.equal(await page.evaluate(() => history.state), null);
  }));
test("[Chrome] SPA: unknown and prototype names produce a client 404 view", async (t) =>
  pageTest(t, async (page) => {
    for (const route of ["missing", "constructor", "__proto__", "settings/"]) {
      assert.equal((await page.goto(origin + "/demo/" + route)).status(), 200);
      await headingIs(page, "Pagina non trovata");
      assert.equal(await page.locator('[aria-current="page"]').count(), 0);
    }
  }));
test("[Chrome] SPA: invalid query does not inject markup", async (t) =>
  pageTest(t, async (page) => {
    await page.goto(
      origin +
        "/demo/settings?tab=" +
        encodeURIComponent('<img src=x onerror="window.injected=true">'),
    );
    await headingIs(page, "Impostazioni");
    assert.equal(
      await page.locator("#app p").textContent(),
      "Preferenze: general",
    );
    assert.equal(await page.locator("#app img").count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
  }));

async function unitPage(page) {
  await page.route("**/demo/unit", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: html.replace(
        /<script[^>]*src="\/src\/main.js"[^>]*><\/script>/,
        "",
      ),
    }),
  );
  await page.goto(origin + "/demo/unit");
  await page.evaluate(async (url) => {
    const { mountRouter } = await import(url);
    window.mountDemo = mountRouter;
    window.stopDemo = mountRouter(
      document.querySelector("#app"),
      document.querySelector("#navigation"),
    );
  }, moduleUrl(routerCode));
}
test("[Chrome] SPA: native click cases are not intercepted", async (t) =>
  pageTest(t, async (page) => {
    await unitPage(page);
    const cases = await page.evaluate(() => {
      const nav = document.querySelector("#navigation");
      const values = [];
      for (const item of [
        { label: "ctrl", event: { ctrlKey: true } },
        { label: "meta", event: { metaKey: true } },
        { label: "shift", event: { shiftKey: true } },
        { label: "alt", event: { altKey: true } },
        { label: "middle", event: { button: 1 } },
        { label: "right", event: { button: 2 } },
        { label: "target", attrs: { target: "_blank" } },
        { label: "download", attrs: { download: "" } },
        { label: "external-rel", attrs: { rel: "external" } },
        {
          label: "other-origin",
          attrs: { href: "https://example.test/demo/settings" },
        },
        { label: "outside-base", attrs: { href: "/demo-other/settings" } },
        { label: "hash", attrs: { href: "/demo/settings#details" } },
        { label: "empty-hash", attrs: { href: "/demo/settings#" } },
        { label: "unmarked", unmarked: true },
        { label: "missing-href", missingHref: true },
      ]) {
        const link = document.createElement("a");
        link.href = "/demo/settings";
        link.dataset.route = "";
        for (const [key, value] of Object.entries(item.attrs ?? {}))
          link.setAttribute(key, value);
        if (item.unmarked) link.removeAttribute("data-route");
        if (item.missingHref) link.removeAttribute("href");
        const span = document.createElement("span");
        link.append(span);
        nav.append(link);
        document.addEventListener(
          "click",
          (event) => {
            values.push([item.label, event.defaultPrevented]);
            event.preventDefault();
          },
          { once: true },
        );
        span.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            button: 0,
            ...item.event,
          }),
        );
        link.remove();
      }
      return values;
    });
    assert.equal(cases.length, 15);
    assert.ok(
      cases.every(([, intercepted]) => !intercepted),
      JSON.stringify(cases),
    );
  }));
test("[Chrome] SPA: cancelled events, nested links and cleanup", async (t) =>
  pageTest(t, async (page) => {
    await unitPage(page);
    const result = await page.evaluate(() => {
      const nav = document.querySelector("#navigation");
      const link = nav.querySelector('a[href*="settings"]');
      const span = document.createElement("span");
      span.textContent = "Nested";
      link.append(span);
      const prior = location.href;
      const cancelled = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      });
      cancelled.preventDefault();
      span.dispatchEvent(cancelled);
      const unchanged = location.href === prior;
      span.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }),
      );
      const nested = document.querySelector("#app h1").textContent;
      window.stopDemo();
      window.stopDemo();
      let captured;
      document.addEventListener(
        "click",
        (event) => {
          captured = event.defaultPrevented;
          event.preventDefault();
        },
        { once: true },
      );
      nav.querySelector("a").dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
      history.replaceState(null, "", "/demo/");
      window.dispatchEvent(new PopStateEvent("popstate"));
      let invalid = false;
      try {
        window.mountDemo(null, nav);
      } catch (e) {
        invalid = e instanceof TypeError;
      }
      return {
        unchanged,
        nested,
        captured,
        invalid,
        title: document.querySelector("#app h1").textContent,
      };
    });
    assert.deepEqual(result, {
      unchanged: true,
      nested: "Impostazioni",
      captured: false,
      invalid: true,
      title: "Impostazioni",
    });
  }));
test("[Chrome] SPA: pushState and replaceState alone do not render", async (t) =>
  pageTest(t, async (page) => {
    await page.goto(origin + "/demo/");
    await headingIs(page, "Home");
    const result = await page.evaluate(() => {
      let pop = 0;
      window.addEventListener("popstate", () => pop++);
      const length = history.length;
      history.pushState(null, "", "/demo/settings");
      history.replaceState(null, "", "/demo/settings?tab=privacy");
      return {
        pop,
        delta: history.length - length,
        title: document.querySelector("#app h1").textContent,
      };
    });
    assert.deepEqual(result, { pop: 0, delta: 1, title: "Home" });
  }));
test("[Chrome] SPA: native fragment navigation keeps the rendered view", async (t) =>
  pageTest(t, async (page) => {
    await page.goto(origin + "/demo/");
    await headingIs(page, "Home");
    await page.evaluate(() => {
      window.oldHeading = document.querySelector("#app h1");
    });
    await page.getByRole("link", { name: "Dettagli della vista" }).click();
    assert.equal(new URL(page.url()).hash, "#details");
    assert.equal(
      await page.evaluate(
        () => document.querySelector("#app h1") === window.oldHeading,
      ),
      true,
    );
  }));
test("[Chrome] SPA: modified click opens a separate document", async (t) =>
  pageTest(t, async (page, context) => {
    await page.goto(origin + "/demo/");
    await headingIs(page, "Home");
    const opened = context.waitForEvent("page");
    await page
      .getByRole("link", { name: "Impostazioni", exact: true })
      .click({ modifiers: ["ControlOrMeta"] });
    const popup = await opened;
    await headingIs(popup, "Impostazioni");
    assert.equal(new URL(page.url()).pathname, "/demo/");
    await popup.close();
  }));
test("[Chrome] SPA: keyboard navigation and mobile layout", async (t) =>
  pageTest(
    t,
    async (page) => {
      await page.goto(origin + "/demo/");
      await headingIs(page, "Home");
      await page
        .getByRole("link", { name: "Impostazioni", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await headingIs(page, "Impostazioni");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "view-title",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    },
    { width: 390, height: 844 },
  ));
