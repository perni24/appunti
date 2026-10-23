import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import test, { after } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

assert.ok(
  process.env.TYPESCRIPT_FRAMEWORK_TOOLS_DIR,
  "Vedere README: TYPESCRIPT_FRAMEWORK_TOOLS_DIR",
);
const toolRoot = fs.realpathSync(process.env.TYPESCRIPT_FRAMEWORK_TOOLS_DIR);
const req = createRequire(path.join(toolRoot, "package.json"));
const siteReq = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const npmCli =
  process.env.NPM_CLI_PATH ??
  path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const playwright = siteReq(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const names = [
  "TypeScript con React",
  "TypeScript con Node.js",
  "API tipizzate",
  "TypeScript con Express-Fastify",
  "TypeScript con Next.js",
  "TypeScript monorepo",
];
const notes = names.map((n) =>
  parseNote("Programmazione/TypeScript/Pagine/" + n + ".md"),
);
const blocks = (i, lang) =>
  notes[i].tree.children
    .filter((n) => n.type === "code" && n.lang === lang)
    .map((n) => n.value);
function files(i) {
  const result = {};
  const nodes = notes[i].tree.children;
  for (let j = 1; j < nodes.length; j++) {
    const code = nodes[j],
      previous = nodes[j - 1];
    if (
      code.type !== "code" ||
      !["ts", "tsx", "json", "html", "javascript"].includes(code.lang) ||
      previous.type !== "paragraph"
    )
      continue;
    const labels = previous.children.filter(
      (n) =>
        n.type === "inlineCode" && /\.(?:json|tsx?|html|js)$/.test(n.value),
    );
    assert.equal(labels.length, 1, names[i] + ": filename before code");
    result[labels[0].value] = code.value;
  }
  return result;
}
const roots = [];
function fixture(sources, link = true) {
  const temp = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(temp, "appunti-typescript-framework-"));
  const locate = (name) => {
    const file = path.resolve(root, name);
    assert.ok(file.startsWith(root + path.sep));
    return file;
  };
  const put = (name, text) => {
    const file = locate(name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      typeof text === "string" ? text : JSON.stringify(text),
    );
  };
  for (const [name, text] of Object.entries(sources)) put(name, text);
  const modules = locate("node_modules");
  const links = [];
  const connect = (target, destination) => {
    fs.symlinkSync(
      target,
      destination,
      process.platform === "win32" ? "junction" : "dir",
    );
    links.push({ target, destination });
  };
  if (link === "packages") {
    // Vite writes its cache here; the parent must be a real fixture directory.
    fs.mkdirSync(modules);
    for (const entry of fs.readdirSync(path.join(toolRoot, "node_modules"), {
      withFileTypes: true,
    })) {
      if (entry.isDirectory() && !entry.name.startsWith("."))
        connect(
          path.join(toolRoot, "node_modules", entry.name),
          path.join(modules, entry.name),
        );
    }
  } else if (link) {
    connect(path.join(toolRoot, "node_modules"), modules);
  }
  roots.push({ root, temp, links });
  return {
    root,
    put,
    locate,
    read: (name) => fs.readFileSync(locate(name), "utf8"),
  };
}
after(() => {
  for (const { root, temp, links } of roots.reverse()) {
    assert.equal(path.dirname(fs.realpathSync(root)), temp);
    for (const { target, destination } of links) {
      assert.equal(fs.realpathSync(destination), fs.realpathSync(target));
      fs.unlinkSync(destination);
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
});
async function run(p, args, timeout = 60000) {
  const env = {
    ...process.env,
    NODE_OPTIONS: "",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.NODE_ENV;
  const child = spawn(process.execPath, args, {
    cwd: p.root,
    env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (b) => {
    output += b;
  });
  child.stderr.on("data", (b) => {
    output += b;
  });
  const timer = setTimeout(() => child.kill(), timeout);
  try {
    const [status, signal] = await once(child, "close");
    assert.equal(signal, null, output);
    return { status, output };
  } finally {
    clearTimeout(timer);
  }
}
const success = (r) => {
  assert.equal(r.status, 0, r.output);
  return r.output;
};
const tsc = (p, ...args) =>
  run(p, [req.resolve("typescript/bin/tsc"), ...args, "--pretty", "false"]);
const npm = (p, ...args) => run(p, [npmCli, ...args], 120000);
const imported = (p, file) => import(pathToFileURL(p.locate(file)).href);
async function negative(p, file, append, pattern) {
  const original = p.read(file);
  try {
    p.put(file, original + "\n" + append);
    const result = await tsc(p, "--noEmit");
    assert.notEqual(result.status, 0);
    assert.match(result.output, pattern);
  } finally {
    p.put(file, original);
  }
}
const react = fixture(files(0), "packages");
const node = fixture(files(1));
const apiSource = blocks(2, "ts").join("\n");
const server = fixture({
  ...files(3),
  "tsconfig.json": node.read("tsconfig.json"),
  "src/preview-client.ts": apiSource,
});
const next = fixture(files(4));
const mono = fixture(files(5), false);
let nodeReady, serverReady;
const prepareNode = () =>
  (nodeReady ??= (async () => {
    success(await tsc(node, "-p", "tsconfig.json"));
    return imported(node, "dist/config.js");
  })());
const prepareServer = () =>
  (serverReady ??= (async () => {
    success(await tsc(server, "-p", "tsconfig.json"));
    return imported(server, "dist/preview-client.js");
  })());

test("Framework: baseline e strumenti isolati", () => {
  assert.equal(process.versions.node, "24.14.0");
  for (const [name, version] of Object.entries({
    typescript: "5.9.3",
    react: "19.3.0",
    "react-dom": "19.3.0",
    next: "16.4.1",
    express: "5.3.0",
    fastify: "5.12.7",
    zod: "4.6.7",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@types/express": "5.0.6",
  }))
    assert.equal(req(name + "/package.json").version, version);
});
for (let i = 0; i < names.length; i++)
  test(names[i] + ": metadati, fonti, JSON e comandi", () => {
    assert.equal(notes[i].data.publish, true);
    assert.equal(notes[i].data.status, "non revisionato");
    assert.match(notes[i].body, /## Fonti/);
    for (const value of blocks(i, "json")) JSON.parse(value);
    for (const value of blocks(i, "sh"))
      assert.equal(value.split("\n").length, 1);
  });
test("React: checker e build Vite reali", async () => {
  success(await tsc(react, "--noEmit"));
  const viteCli = path.join(
    path.dirname(req.resolve("vite/package.json")),
    "bin/vite.js",
  );
  success(await run(react, [viteCli, "build"]));
  assert.ok(fs.existsSync(react.locate("dist/index.html")));
});
test("React: props e callback incompatibili rifiutate", async () => {
  await negative(
    react,
    "src/App.tsx",
    "const bad = <UserList users={[]} onSelect={(value: number) => {}} />;",
    /TS2322/,
  );
});
test("React: selezione, filtro, ref e UI nel browser", async () => {
  const { preview } = await import(pathToFileURL(req.resolve("vite")).href);
  const app = await preview({
    root: react.root,
    preview: { host: "127.0.0.1", port: 0 },
  });
  const browser = await playwright.chromium.launch({
    channel: "chrome",
    headless: true,
  });
  try {
    const errors = [];
    const page = await browser.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    const address = app.httpServer.address();
    await page.goto("http://127.0.0.1:" + address.port);
    await page
      .getByRole("button", { name: "ada@example.test", exact: true })
      .click();
    assert.match(await page.getByRole("status").innerText(), /ada/);
    await page.getByLabel("Filtra per email").fill("lin");
    assert.equal(
      await page
        .getByRole("button", { name: "ada@example.test", exact: true })
        .count(),
      0,
    );
    assert.match(await page.getByRole("status").innerText(), /ada/);
    await page.getByRole("button", { name: "Vai al filtro" }).click();
    assert.equal(
      await page
        .locator("#query")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.getByLabel("Filtra per email").fill("<script>");
    assert.equal(await page.locator("li").count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => app.httpServer.close(resolve));
  }
});
test("Node: CLI compilata, argomenti e codici di uscita", async () => {
  await prepareNode();
  assert.match(
    success(
      await run(node, ["--enable-source-maps", "dist/main.js", "config.json"]),
    ),
    /Port: 8080/,
  );
  const missing = await run(node, ["dist/main.js"]);
  assert.equal(missing.status, 2);
  assert.match(missing.output, /Usage/);
  const absent = await run(node, ["dist/main.js", "absent.json"]);
  assert.equal(absent.status, 1);
  assert.match(absent.output, /Cannot read/);
});
test("Node: schema, proiezione, intervalli ed ereditarieta", async () => {
  const { parseConfig } = await prepareNode();
  for (const input of [
    null,
    [],
    {},
    { port: "80" },
    { port: 0 },
    { port: 65536 },
    { port: 1.1 },
    { port: NaN },
    { port: Infinity },
    Object.create({ port: 80 }),
  ])
    assert.throws(() => parseConfig(input), TypeError);
  for (const port of [1, 80, 65535])
    assert.deepEqual(parseConfig({ port, secret: "demo" }), { port });
});
test("Node: file malformato, schema errato e percorso rispetto a cwd", async () => {
  await prepareNode();
  node.put("broken.json", "{");
  node.put("wrong.json", '{"port":true}');
  for (const [file, message] of [
    ["broken.json", "Invalid JSON"],
    ["wrong.json", "Invalid configuration"],
  ]) {
    const r = await run(node, ["dist/main.js", file]);
    assert.equal(r.status, 1);
    assert.ok(r.output.includes(message));
  }
});
test("Node: stripping non controlla tipi e rifiuta enum predefiniti", async () => {
  node.put(
    "native.ts",
    'const value: number = "not a number"; console.log(value);',
  );
  assert.match(success(await run(node, ["native.ts"])), /not a number/);
  const checked = await tsc(
    node,
    "native.ts",
    "--noEmit",
    "--types",
    "node",
    "--skipLibCheck",
  );
  assert.notEqual(checked.status, 0);
  assert.match(checked.output, /TS2322/);
  node.put("enum.ts", "enum Mode { Ready }; console.log(Mode.Ready);");
  const enumResult = await run(node, ["enum.ts"]);
  assert.notEqual(enumResult.status, 0);
  assert.match(enumResult.output, /ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX/);
  const wrongEntry = await run(node, ["src/main.ts", "config.json"]);
  assert.notEqual(wrongEntry.status, 0);
  assert.match(wrongEntry.output, /ERR_MODULE_NOT_FOUND/);
});
test("API: configurazione Node e tutti i sorgenti server compilano", async () => {
  await prepareServer();
});
test("API: input, normalizzazione, copia URL e opzioni HTTP", async () => {
  const { createPreviewClient } = await prepareServer();
  let calls = 0,
    seen;
  const endpoint = new URL("http://example.test/preview");
  const client = createPreviewClient(endpoint, async (url, options) => {
    calls++;
    seen = { url: String(url), options };
    return Response.json({ title: "Appunti", length: 7, private: "hidden" });
  });
  endpoint.pathname = "/changed";
  assert.deepEqual(await client({ title: "  Appunti  " }), {
    ok: true,
    data: { title: "Appunti", length: 7 },
  });
  assert.equal(seen.url, "http://example.test/preview");
  assert.equal(seen.options.body, '{"title":"Appunti"}');
  assert.equal(seen.options.credentials, "omit");
  assert.equal(seen.options.redirect, "error");
  for (const input of [
    { title: "" },
    { title: " " },
    { title: "x".repeat(81) },
    { title: 12 },
    { title: "x", extra: 1 },
  ])
    assert.equal((await client(input)).error.code, "input");
  assert.equal(calls, 1);
});
test("API: errori HTTP, media type, JSON, schema e rete distinti", async () => {
  const { createPreviewClient } = await prepareServer();
  for (const [factory, code] of [
    [() => new Response(null, { status: 204 }), "http"],
    [() => Response.json({ error: "secret" }, { status: 500 }), "http"],
    [
      () => new Response("x", { headers: { "Content-Type": "text/plain" } }),
      "content_type",
    ],
    [
      () =>
        new Response("{", { headers: { "Content-Type": "application/json" } }),
      "json",
    ],
    [() => Response.json({ title: "x", length: 2 }), "schema"],
    [() => Response.json({ title: " x", length: 2 }), "schema"],
    [
      () => {
        throw new TypeError("secret");
      },
      "network",
    ],
  ]) {
    const result = await createPreviewClient(
      new URL("http://example.test"),
      async () => factory(),
    )({ title: "x" });
    assert.equal(result.error.code, code);
    assert.ok(!JSON.stringify(result).includes("secret"));
  }
});
test("API: annullamento gia richiesto non avvia Fetch", async () => {
  const { createPreviewClient } = await prepareServer();
  let called = false;
  const client = createPreviewClient(
    new URL("http://example.test"),
    async () => {
      called = true;
      return Response.json({});
    },
  );
  assert.equal(
    (await client({ title: "x" }, AbortSignal.abort())).error.code,
    "aborted",
  );
  assert.equal(called, false);
});
test("API: discriminante richiede narrowing", async () => {
  await prepareServer();
  await negative(
    server,
    "src/preview-client.ts",
    "declare const r: PreviewResult; console.log(r.data);",
    /TS2339/,
  );
});
async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return "http://127.0.0.1:" + server.address().port;
}
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
test("API: abort reale durante la lettura della risposta", async () => {
  const { createPreviewClient } = await prepareServer();
  let bodyStarted;
  const started = new Promise((resolve) => (bodyStarted = resolve));
  const http = createServer((req, res) => {
    req.resume();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write('{"title":');
    bodyStarted();
  });
  const url = await listen(http);
  try {
    const control = new AbortController();
    const pending = createPreviewClient(new URL(url))(
      { title: "x" },
      control.signal,
    );
    await started;
    control.abort();
    assert.equal((await pending).error.code, "aborted");
  } finally {
    await close(http);
  }
});
for (const framework of ["Express", "Fastify"]) {
  test(framework + ": endpoint reale, client e limiti HTTP", async () => {
    const { createPreviewClient } = await prepareServer();
    const module = await imported(
      server,
      framework === "Express" ? "dist/express-app.js" : "dist/fastify-app.js",
    );
    const app =
      framework === "Express" ? module.buildExpress() : module.buildFastify();
    let http, url;
    if (framework === "Express") {
      http = createServer(app);
      url = await listen(http);
    } else url = await app.listen({ host: "127.0.0.1", port: 0 });
    try {
      const client = createPreviewClient(new URL("/preview", url));
      assert.deepEqual(await client({ title: "  Appunti  " }), {
        ok: true,
        data: { title: "Appunti", length: 7 },
      });
      assert.deepEqual(await client({ title: "\u{1F600}" }), {
        ok: true,
        data: { title: "\u{1F600}", length: 2 },
      });
      for (const [body, media, status] of [
        ['{"title":true}', "application/json", 400],
        ['{"title":"x","extra":1}', "application/json", 400],
        ['{"title":" "}', "application/json", 400],
        ["{", "application/json", 400],
        ['{"title":"' + "x".repeat(1100) + '"}', "application/json", 413],
        ["x", "text/plain", 415],
      ]) {
        const res = await fetch(url + "/preview", {
          method: "POST",
          body,
          headers: { "Content-Type": media },
        });
        assert.equal(res.status, status);
        assert.deepEqual(await res.json(), { error: "invalid_request" });
      }
    } finally {
      if (http) await close(http);
      else await app.close();
    }
  });
}
test("Fastify: schema nativo ha una politica diversa dallo Zod del demo", async () => {
  const app = req("fastify")();
  app.post(
    "/native",
    {
      schema: {
        body: {
          type: "object",
          properties: { quantity: { type: "integer", default: 1 } },
          additionalProperties: false,
        },
      },
    },
    async (r) => r.body,
  );
  try {
    const first = await app.inject({
      method: "POST",
      url: "/native",
      payload: { quantity: "2", extra: true },
    });
    assert.equal(first.statusCode, 200);
    assert.deepEqual(first.json(), { quantity: 2 });
    const second = await app.inject({
      method: "POST",
      url: "/native",
      payload: {},
    });
    assert.deepEqual(second.json(), { quantity: 1 });
  } finally {
    await app.close();
  }
});
test("Next: typegen e checker da progetto senza artefatti", async () => {
  success(await run(next, [req.resolve("next/dist/bin/next"), "typegen"]));
  assert.ok(fs.existsSync(next.locate("next-env.d.ts")));
  success(await tsc(next, "--noEmit"));
});
test("Next: accesso sincrono ai params e route inesistente rifiutati", async () => {
  await negative(
    next,
    "app/products/[id]/page.tsx",
    'function wrong(p: PageProps<"/products/[id]">) { return p.params.id; }',
    /TS2339/,
  );
  await negative(
    next,
    "app/page.tsx",
    'const invalidLink = <Link href="/not-a-route" />;',
    /TS2322/,
  );
});
test(
  "Next: build di produzione, HTML, not-found e interazione client",
  { timeout: 240000 },
  async () => {
    success(
      await run(
        next,
        [req.resolve("next/dist/bin/next"), "build", "--webpack"],
        180000,
      ),
    );
    const reserved = createServer();
    await listen(reserved);
    const port = reserved.address().port;
    await close(reserved);
    const child = spawn(
      process.execPath,
      [
        req.resolve("next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        cwd: next.root,
        windowsHide: true,
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: "" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const exited = once(child, "close");
    let output = "";
    child.stdout.on("data", (b) => (output += b));
    child.stderr.on("data", (b) => (output += b));
    let browser;
    try {
      const base = "http://127.0.0.1:" + port;
      let ready = false;
      for (let i = 0; i < 100; i++) {
        try {
          const r = await fetch(base);
          await r.text();
          if (r.ok) {
            ready = true;
            break;
          }
        } catch {}
        await delay(100);
      }
      assert.ok(ready, output);
      const response = await fetch(base + "/products/p1");
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /Taccuino/);
      assert.doesNotMatch(html, /INTERNAL-DEMO|supplierCode/);
      const missing = await fetch(base + "/products/absent");
      assert.equal(missing.status, 404);
      await missing.text();
      browser = await playwright.chromium.launch({
        channel: "chrome",
        headless: true,
      });
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base);
      await page.getByRole("link", { name: "Apri prodotto" }).click();
      await page
        .getByRole("button", { name: "Seleziona", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Selezionato", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.deepEqual(errors, []);
      const assets = next.locate(".next/static");
      const readAll = (dir) =>
        fs
          .readdirSync(dir, { withFileTypes: true })
          .flatMap((e) =>
            e.isDirectory()
              ? readAll(path.join(dir, e.name))
              : e.name.endsWith(".js")
                ? [fs.readFileSync(path.join(dir, e.name), "utf8")]
                : [],
          );
      assert.ok(!readAll(assets).join("\n").includes("INTERNAL-DEMO"));
    } finally {
      if (browser) await browser.close();
      child.kill();
      await exited;
    }
  },
);
test("Monorepo: installazione workspace e build pulita reali", async () => {
  assert.match(success(await npm(mono, "--version")), /^11\./);
  success(
    await npm(
      mono,
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ),
  );
  success(await npm(mono, "run", "build"));
  assert.match(success(await npm(mono, "start")), /Ciao Ada/);
  assert.equal(
    fs.realpathSync(mono.locate("node_modules/@notes/domain")),
    fs.realpathSync(mono.locate("packages/domain")),
  );
  assert.ok(fs.existsSync(mono.locate("packages/domain/dist/index.d.ts")));
});
test("Monorepo: export map e firma pubblica", async () => {
  const result = await run(mono, [
    "--input-type=module",
    "-e",
    "import '@notes/domain/dist/index.js'",
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /ERR_PACKAGE_PATH_NOT_EXPORTED/);
  const original = mono.read("apps/api/src/main.ts");
  try {
    mono.put("apps/api/src/main.ts", original + "\ngreeting(42);");
    const r = await tsc(mono, "-b", "--force", "--stopBuildOnErrors");
    assert.notEqual(r.status, 0);
    assert.match(r.output, /TS2345/);
  } finally {
    mono.put("apps/api/src/main.ts", original);
  }
});
test("Monorepo: npm ci e rebuild senza output preesistenti", async () => {
  success(await tsc(mono, "-b", "--clean"));
  assert.equal(
    fs.existsSync(mono.locate("packages/domain/dist/index.js")),
    false,
  );
  success(
    await npm(
      mono,
      "ci",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ),
  );
  success(await tsc(mono, "-b", "apps/api", "--stopBuildOnErrors"));
  assert.match(success(await npm(mono, "start")), /Ciao Ada/);
});
