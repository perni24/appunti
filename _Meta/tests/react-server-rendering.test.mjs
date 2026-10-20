import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  realpath,
  symlink,
  unlink,
  rm,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createServer, get } from "node:http";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync, buildSync } = require("esbuild");
const { parse } = require("parse5");
const toolsRoot = await realpath(
  path.resolve(
    process.env.REACT_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const React = toolRequire("react");
const { renderToString, renderToStaticMarkup } =
  toolRequire("react-dom/server");
const { prerenderToNodeStream } = toolRequire("react-dom/static");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright",
);
const axe = toolRequire("axe-core");
const names = ["Server Components", "SSR e SSG"];
const trees = names.map(
  (name) => parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
);
function snippet(index, marker, lang = "jsx") {
  const matches = trees[index].children.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
  );
  assert.equal(matches.length, 1, marker);
  return matches[0].value;
}
const sources = {
  "package.json": snippet(0, '"react-rsc-notes-demo"', "json"),
  "app/layout.jsx": snippet(0, "function RootLayout"),
  "app/catalog.js": snippet(0, "function getPublicProducts", "javascript"),
  "app/ProductDetails.jsx": snippet(0, "function ProductDetails"),
  "app/ProductPanel.jsx": snippet(0, "function ProductPanel"),
  "app/page.jsx": snippet(0, "function ProductsPage"),
  "app/globals.css": snippet(0, "body {", "css"),
};
const live = snippet(1, "function LivePage"),
  streaming = snippet(1, "function StreamPage");
const exportConfig = snippet(1, "const nextConfig", "javascript");
function load(source) {
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  const module = { exports: {} };
  // Il guard e verificato separatamente dalla build Next negativa.
  const localRequire = (name) =>
    name === "server-only" ? {} : toolRequire(name);
  new Function("require", "module", "exports", code)(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}
for (const [i, name] of names.entries()) {
  test(`Sintassi: ${name} (distinta dall'esecuzione)`, () => {
    for (const block of trees[i].children.filter((n) => n.type === "code")) {
      if (block.lang === "json")
        assert.doesNotThrow(() => JSON.parse(block.value));
      if (["javascript", "jsx", "css"].includes(block.lang)) {
        assert.doesNotThrow(() =>
          transformSync(block.value, {
            loader: block.lang === "javascript" ? "js" : block.lang,
            jsx: "automatic",
          }),
        );
      }
    }
  });
}
test("Catalogo: proiezione pubblica, copie indipendenti e campo interno escluso", async () => {
  const { getPublicProducts } = load(sources["app/catalog.js"]);
  const first = await getPublicProducts(),
    second = await getPublicProducts();
  assert.deepEqual(
    first.map((p) => Object.keys(p)),
    [
      ["id", "name", "cents"],
      ["id", "name", "cents"],
    ],
  );
  assert.deepEqual(
    first.map((p) => p.cents),
    [1250, 300],
  );
  first[0].name = "Mutato";
  assert.equal(second[0].name, "Taccuino");
  assert(!JSON.stringify(second).includes("INTERNAL-SUPPLIER"));
});
test("Dettagli: prezzo sul server e nome del pannello trattato come testo", () => {
  const Details = load(sources["app/ProductDetails.jsx"]).default;
  const Panel = load(sources["app/ProductPanel.jsx"]).default;
  const html = renderToStaticMarkup(
    React.createElement(
      Panel,
      { name: "<script>prova</script>" },
      React.createElement(Details, { product: { cents: 1250 } }),
    ),
  );
  assert.match(html, /12,50/);
  assert.match(html, /&lt;script&gt;/);
  assert(!html.includes("<script>"));
  assert.match(html, /aria-expanded="true"/);
});
test("React API: renderToString e static markup restituiscono fallback senza attendere", () => {
  const Lazy = React.lazy(() => new Promise(() => {}));
  const element = React.createElement(
    React.Suspense,
    { fallback: React.createElement("p", null, "In attesa") },
    React.createElement(Lazy),
  );
  assert.match(renderToString(element), /In attesa/);
  assert.equal(renderToStaticMarkup(element), "<p>In attesa</p>");
});
test("React API: prerenderToNodeStream attende prima del risultato", async () => {
  const deferred = Promise.withResolvers();
  const Lazy = React.lazy(() => deferred.promise);
  const element = React.createElement(
    React.Suspense,
    { fallback: "Attesa statica" },
    React.createElement(Lazy),
  );
  let finished = false;
  const pending = prerenderToNodeStream(element).then((result) => {
    finished = true;
    return result;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(finished, false);
  deferred.resolve({
    default: () => React.createElement("p", null, "Prerender completo"),
  });
  const { prelude } = await pending;
  let html = "";
  for await (const chunk of prelude) html += chunk;
  assert.match(html, /Prerender completo/);
  assert(!html.includes("Attesa statica"));
});

let temp, root, browser, appUrl, staticUrl, staticServer, probeServer, probeUrl;
const junctions = [],
  processes = [];
let buildOutput, badOutput;
const nextBin = path.join(toolsRoot, "node_modules/next/dist/bin/next");
async function fixture(name, files) {
  const directory = path.join(root, name);
  await mkdir(directory);
  for (const pkg of ["next", "react", "react-dom", "server-only"]) {
    const link = path.join(directory, "node_modules", pkg);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(
      path.join(toolsRoot, "node_modules", pkg),
      link,
      process.platform === "win32" ? "junction" : "dir",
    );
    junctions.push(link);
  }
  for (const [file, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), text);
  }
  return directory;
}
function child(args, cwd) {
  const processChild = spawn(process.execPath, [nextBin, ...args], {
    cwd,
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      CI: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const record = { child: processChild, output: "" };
  processChild.stdout.on("data", (data) => {
    record.output += data;
  });
  processChild.stderr.on("data", (data) => {
    record.output += data;
  });
  record.done = new Promise((resolve, reject) => {
    processChild.once("error", reject);
    processChild.once("close", (code) => resolve(code));
  });
  processes.push(record);
  return record;
}
async function build(directory, success = true) {
  const record = child(["build", "--webpack"], directory);
  const timer = setTimeout(() => record.child.kill(), 180000);
  try {
    const code = await record.done;
    if (success) assert.equal(code, 0, record.output);
    else assert.notEqual(code, 0, "Il build negativo dovrebbe fallire");
    return record.output;
  } finally {
    clearTimeout(timer);
  }
}
async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}
async function close(server) {
  if (!server) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}
before(
  async () => {
    temp = await realpath(tmpdir());
    root = await mkdtemp(path.join(temp, "appunti-react-server-"));
    const app = await fixture("app", {
      ...sources,
      "app/live/page.jsx": live,
      "app/stream/page.jsx": streaming,
    });
    const exported = await fixture("export", {
      ...sources,
      "next.config.mjs": exportConfig,
    });
    const bad = await fixture("invalid", {
      ...sources,
      "app/ProductPanel.jsx":
        '"use client"; import {getPublicProducts} from "./catalog.js"; export default function Bad(){return <button onClick={()=>getPublicProducts()}>Import non valido</button>;}',
      "next.config.mjs": `import {writeFileSync} from 'node:fs';
export default {webpack(config){config.plugins.push({apply(compiler){compiler.hooks.done.tap('FixtureDiagnostics',stats=>{
const errors=stats.toJson({all:false,errors:true}).errors;
if(errors.length)writeFileSync(new URL('./diagnostics.json',import.meta.url),JSON.stringify(errors));
});}});return config;}};`,
    });
    console.log(
      `Next ${toolRequire("next/package.json").version}; React ${React.version}; build di tre fixture`,
    );
    buildOutput = await build(app);
    await build(exported);
    badOutput = await build(bad, false);
    const portServer = createServer();
    const reserved = await listen(portServer);
    await close(portServer);
    const runtime = child(
      ["start", "--hostname", "127.0.0.1", "--port", new URL(reserved).port],
      app,
    );
    appUrl = reserved;
    const deadline = Date.now() + 30000;
    while (!runtime.output.includes("Ready in")) {
      assert.equal(runtime.child.exitCode, null, runtime.output);
      assert(Date.now() < deadline, runtime.output);
      await delay(100);
    }
    const out = path.join(exported, "out");
    const staticFiles = new Map();
    for (const file of await walk(out)) {
      const route = `/${path.relative(out, file).split(path.sep).join("/")}`;
      staticFiles.set(route, file);
      if (route.endsWith("/index.html"))
        staticFiles.set(route.slice(0, -10), file);
    }
    staticServer = createServer(async (req, res) => {
      const file = staticFiles.get(new URL(req.url, "http://fixture").pathname);
      if (!file) {
        res.writeHead(404);
        res.end("Assente");
        return;
      }
      const extension = path.extname(file);
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".txt": "text/plain",
        }[extension] ?? "application/octet-stream",
      );
      res.end(await readFile(file));
    });
    staticUrl = await listen(staticServer);
    // Probe delle API React: distinto dal bootstrap e dal protocollo Next.
    const probeCode = buildSync({
      stdin: {
        contents: `import {createElement as h,useState,useEffect} from 'react';import {hydrateRoot} from 'react-dom/client';
window.recoveries=[];window.original=document.querySelector('button');
function Counter(){const [count,setCount]=useState(window.initial);useEffect(()=>{window.hydrated=true;},[]);return h('button',{onClick:()=>setCount(c=>c+1)},'Conteggio: '+count);}
hydrateRoot(document.getElementById('root'),h(Counter),{onRecoverableError:e=>window.recoveries.push(e.message)});`,
        resolveDir: toolsRoot,
      },
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      define: { "process.env.NODE_ENV": '"development"' },
    }).outputFiles[0].text;
    const html = renderToString(
      React.createElement("button", null, "Conteggio: 4"),
    );
    probeServer = createServer((req, res) => {
      if (req.url === "/probe.js") {
        res.setHeader("Content-Type", "text/javascript");
        res.end(probeCode);
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        `<!doctype html><html lang="it"><head><title>Hydration probe</title><link rel="icon" href="data:,"></head><body><div id="root">${html}</div><script>window.initial=${req.url === "/mismatch" ? 5 : 4};</script><script src="/probe.js"></script></body></html>`,
      );
    });
    probeUrl = await listen(probeServer);
    browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL ?? "chrome",
      headless: true,
    });
    console.log(`Chrome ${browser.version()}; Next build ed export completati`);
  },
  { timeout: 600000 },
);
after(async () => {
  try {
    await browser?.close();
    for (const record of processes) {
      if (record.child.exitCode === null && !record.child.killed)
        record.child.kill();
      await record.done;
    }
    await close(staticServer);
    await close(probeServer);
  } finally {
    if (root) {
      const resolved = await realpath(root);
      assert.equal(path.dirname(resolved), temp);
      assert(path.basename(resolved).startsWith("appunti-react-server-"));
      for (const link of junctions) await unlink(link);
      await rm(root, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 300,
      });
    }
  }
});
test("Next: build riconosce catalogo statico e route dinamiche", async () => {
  const manifest = JSON.parse(
    await readFile(
      path.join(root, "app/.next/prerender-manifest.json"),
      "utf8",
    ),
  );
  assert(manifest.routes["/"]);
  assert(!manifest.routes["/live"]);
  assert(!manifest.routes["/stream"]);
  assert.match(buildOutput, /live/);
});
test("Next: guard server-only rifiuta l'import nel grafo client", async () => {
  const diagnostics = JSON.parse(
    await readFile(path.join(root, "invalid/diagnostics.json"), "utf8"),
  );
  const messages = diagnostics.map((item) => item.message).join("\n");
  assert.match(messages, /server-only/);
  assert.match(messages, /Client Component|use client|Server Component/);
  assert.match(badOutput, /Failed to compile/);
});
test("Next: HTML pubblico e bundle client non contengono i campi interni", async () => {
  const response = await fetch(appUrl);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Catalogo pubblico/);
  assert.match(html, /12,50/);
  assert(!html.includes("INTERNAL-SUPPLIER"));
  assert(!html.includes("internalRef"));
  const files = (await walk(path.join(root, "app/.next/static"))).filter(
    (file) => file.endsWith(".js"),
  );
  assert(files.length > 0);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert(!source.includes("INTERNAL-SUPPLIER"), file);
    assert(!source.includes("internalRef"), file);
  }
});
test("SSR: documenti successivi hanno ID diversi e risposta non condivisibile", async () => {
  const first = await fetch(`${appUrl}/live`),
    second = await fetch(`${appUrl}/live`);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.match(first.headers.get("cache-control"), /private|no-store/);
  const id = (html) => {
    function find(node) {
      if (node.attrs?.some((attr) => attr.name === "data-render-id")) {
        return node.childNodes
          .filter((child) => child.nodeName === "#text")
          .map((child) => child.value)
          .join("");
      }
      for (const child of node.childNodes ?? []) {
        const result = find(child);
        if (result !== undefined) return result;
      }
    }
    return find(parse(html));
  };
  const a = id(await first.text()),
    b = id(await second.text());
  assert.match(a, /^[a-f\d-]{36}$/);
  assert.match(b, /^[a-f\d-]{36}$/);
  assert.notEqual(a, b);
});
test("Streaming HTTP: shell e fallback prima del dettaglio, senza deadline prestazionale", async () => {
  const chunks = await new Promise((resolve, reject) => {
    get(
      `${appUrl}/stream`,
      {
        headers: {
          "user-agent": "Mozilla/5.0 Chrome/155.0.0.0",
          "accept-encoding": "identity",
        },
      },
      (response) => {
        const pieces = [];
        assert.equal(response.statusCode, 200);
        response.setEncoding("utf8");
        response.on("data", (data) => pieces.push(data));
        response.on("end", () => resolve(pieces));
        response.on("error", reject);
      },
    ).on("error", reject);
  });
  const firstDetail = chunks.findIndex((chunk) =>
    chunk.includes("Dettagli completati sul server."),
  );
  const firstShell = chunks.findIndex((chunk) =>
    chunk.includes("Questa parte appartiene alla shell."),
  );
  assert(
    firstShell >= 0 && firstDetail > firstShell,
    JSON.stringify(chunks.map((c) => c.length)),
  );
  assert(
    chunks.slice(0, firstDetail).join("").includes("Preparazione dettagli..."),
  );
});
test("SSG: export crea HTML servibile senza il runtime Next", async () => {
  const html = await readFile(path.join(root, "export/out/index.html"), "utf8");
  assert.match(html, /Catalogo pubblico/);
  assert(!html.includes("INTERNAL-SUPPLIER"));
  const response = await fetch(staticUrl);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), html);
});
async function pageAt(url, run, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 850 },
    ...options,
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    const response = await page.goto(url);
    assert.equal(response.status(), 200);
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
for (const mode of ["Next", "export"]) {
  test(`${mode}: catalogo leggibile senza JavaScript`, () =>
    pageAt(
      mode === "Next" ? appUrl : staticUrl,
      async (page) => {
        assert.equal(
          await page.getByRole("heading", { level: 1 }).innerText(),
          "Catalogo pubblico",
        );
        assert.match(await page.locator("main").innerText(), /12,50/);
        await page
          .getByRole("button", { name: "Nascondi dettagli di Taccuino" })
          .click();
        assert(
          await page
            .getByRole("region", { name: "Taccuino" })
            .getByText("Prezzo:")
            .isVisible(),
        );
      },
      { javaScriptEnabled: false },
    ));
  test(`${mode}: hydration, tastiera, ID indipendenti e reload`, () =>
    pageAt(mode === "Next" ? appUrl : staticUrl, async (page) => {
      const first = page.getByRole("button", {
        name: "Nascondi dettagli di Taccuino",
      });
      const second = page.getByRole("button", {
        name: "Nascondi dettagli di Penna",
      });
      assert.notEqual(
        await first.getAttribute("aria-controls"),
        await second.getAttribute("aria-controls"),
      );
      await first.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          document.querySelector("button").getAttribute("aria-expanded") ===
          "false",
      );
      assert.equal(await second.getAttribute("aria-expanded"), "true");
      assert(
        await page
          .getByRole("button", { name: "Mostra dettagli di Taccuino" })
          .evaluate((el) => document.activeElement === el),
      );
      await page
        .getByRole("button", { name: "Mostra dettagli di Taccuino" })
        .click();
      await first.waitFor();
      await first.click();
      await page.reload();
      await page
        .getByRole("button", { name: "Nascondi dettagli di Taccuino" })
        .waitFor();
    }));
  test(`${mode}: mobile e scansione axe sul catalogo`, () =>
    pageAt(
      mode === "Next" ? appUrl : staticUrl,
      async (page) => {
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.addScriptTag({ content: axe.source });
        const results = await page.evaluate(() =>
          window.axe.run(document.body, {
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
      },
      { viewport: { width: 390, height: 844 } },
    ));
}
test("SSR browser: hydration conserva ID/orario e click non richiede altro documento", () =>
  pageAt(`${appUrl}/live`, async (page) => {
    const before = await page.locator("[data-render-id]").innerText();
    const timestamp = await page.locator("time").innerText();
    const requests = [];
    page.on("request", (r) => {
      if (r.isNavigationRequest()) requests.push(r.url());
    });
    await page
      .getByRole("button", {
        name: "Nascondi dettagli di Risultato della richiesta",
      })
      .click();
    await page
      .getByRole("button", {
        name: "Mostra dettagli di Risultato della richiesta",
      })
      .waitFor();
    assert.equal(await page.locator("[data-render-id]").innerText(), before);
    assert.equal(await page.locator("time").innerText(), timestamp);
    assert.deepEqual(requests, []);
  }));
test("Streaming browser: dettaglio finale sostituisce il fallback", () =>
  pageAt(`${appUrl}/stream`, async (page) => {
    await page
      .getByText("Dettagli completati sul server.", { exact: true })
      .waitFor();
    assert.equal(await page.getByRole("status").count(), 0);
  }));
test("Hydration API: riutilizza il nodo e abilita il click senza errori", () =>
  pageAt(probeUrl, async (page) => {
    await page.waitForFunction(() => window.hydrated);
    assert(
      await page.evaluate(
        () => window.original === document.querySelector("button"),
      ),
    );
    await page.getByRole("button").click();
    await page.getByRole("button", { name: "Conteggio: 5" }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.recoveries), []);
  }));
test("Hydration API: mismatch intenzionale segnalato e albero ricreato", () =>
  pageAt(`${probeUrl}/mismatch`, async (page) => {
    await page.waitForFunction(
      () => window.hydrated && window.recoveries.length > 0,
    );
    assert(
      await page.evaluate(
        () => window.original !== document.querySelector("button"),
      ),
    );
    assert.match(
      (await page.evaluate(() => window.recoveries)).join(" "),
      /Hydration failed|didn't match/,
    );
    await page.getByRole("button", { name: "Conteggio: 5" }).click();
    await page.getByRole("button", { name: "Conteggio: 6" }).waitFor();
  }));
