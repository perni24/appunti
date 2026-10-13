import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtemp,
  realpath,
  mkdir,
  readFile,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { createRequire, SourceMap } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const BUNDLE = "Bundling e tree shaking";
const MAPS = "Source maps e debugging";
const toolsDir = await realpath(
  process.env.PRETTIER_VITE_TOOLS_DIR ??
    path.join(tmpdir(), "appunti-prettier-vite-tools"),
);
const viteDir = path.join(toolsDir, "node_modules/vite");
const vite = await import(
  pathToFileURL(path.join(viteDir, "dist/node/index.js"))
);
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "../../site/node_modules/playwright",
);
const exec = promisify(execFile);
const npmCli = process.env.NPM_CLI_PATH;
assert.ok(npmCli, "Set NPM_CLI_PATH to the npm JavaScript entry point");

async function fixture(t, note) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-bundling-maps-"));
  t.after(async () => {
    assert.equal(await realpath(root), root);
    assert.ok(root.startsWith(temp + path.sep));
    assert.ok(path.basename(root).startsWith("appunti-bundling-maps-"));
    await rm(root, { recursive: true, force: true });
  });
  const file = (name) => path.join(root, name);
  async function put(name, source) {
    await mkdir(path.dirname(file(name)), { recursive: true });
    await writeFile(file(name), source);
  }
  await mkdir(file("node_modules"));
  await symlink(
    viteDir,
    file("node_modules/vite"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await mkdir(file("node_modules/.bin"));
  const cli = path.join(viteDir, "bin/vite.js");
  if (process.platform === "win32")
    await put(
      "node_modules/.bin/vite.cmd",
      `@"${process.execPath}" "${cli}" %*\r\n`,
    );
  else {
    const { chmod } = await import("node:fs/promises");
    await put(
      "node_modules/.bin/vite",
      `#!/bin/sh\nexec "${process.execPath}" "${cli}" "$@"\n`,
    );
    await chmod(file("node_modules/.bin/vite"), 0o755);
  }
  const files = [
    [
      "package.json",
      note === BUNDLE ? '"name": "bundle-demo"' : '"name": "sourcemap-demo"',
      "json",
    ],
    [
      "vite.config.js",
      note === BUNDLE ? "minify: false" : "sourcemap: true",
      "js",
    ],
    [".gitignore", "node_modules/", "text"],
    ["index.html", "<!doctype html>", "html"],
    ...(note === BUNDLE
      ? [
          ["src/main.js", 'import { sum } from "./math.js";\nimport', "js"],
          ["src/math.js", "export function sum", "js"],
          ["src/register.js", "globalThis.demoReady = true", "js"],
          ["src/report.js", "export function reportMessage", "js"],
        ]
      : [
          ["src/main.js", "import { displayName }", "js"],
          ["src/profile.js", "export function displayName", "js"],
        ]),
  ];
  for (const [name, marker, language] of files)
    await put(name, snippet(note, marker, language) + "\n");
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  async function run(args) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env,
          windowsHide: true,
          encoding: "utf8",
          timeout: 30000,
          maxBuffer: 2 * 1024 * 1024,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  async function build(options = {}) {
    const result = await vite.build({
      root,
      logLevel: "silent",
      build: options,
    });
    assert.ok(!Array.isArray(result) && Array.isArray(result.output));
    const entry = result.output.find(
      (item) => item.type === "chunk" && item.isEntry,
    );
    assert.ok(entry);
    return { output: result.output, entry };
  }
  async function serve(callback) {
    const server = await vite.preview({
      root,
      logLevel: "silent",
      preview: { host: "127.0.0.1", port: 0, strictPort: true },
    });
    try {
      return await callback(
        `http://127.0.0.1:${server.httpServer.address().port}/`,
      );
    } finally {
      await new Promise((resolve, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
  return {
    root,
    file,
    put,
    build,
    serve,
    run,
    npm: (...args) => run([npmCli, "run", ...args]),
  };
}

function evaluate(code) {
  const logs = [];
  const context = {
    console: { log: (...values) => logs.push(values) },
    document: { createElement: () => ({ relList: { supports: () => true } }) },
  };
  runInNewContext(code, context, { timeout: 1000 });
  return { context, logs };
}

test("Bundling: tested Vite version and note packages match", () => {
  assert.equal(vite.version, "8.3.4");
  for (const note of [BUNDLE, MAPS]) {
    const pkg = JSON.parse(snippet(note, '"devDependencies"', "json"));
    assert.equal(pkg.devDependencies.vite, vite.version);
  }
});

test("Bundling: npm build removes unused function but preserves import effect", async (t) => {
  const f = await fixture(t, BUNDLE);
  const result = await f.npm("build");
  assert.equal(result.code, 0, result.stderr);
  const manifest = JSON.parse(
    await readFile(f.file("dist/.vite/manifest.json"), "utf8"),
  );
  const js = await readFile(
    f.file("dist/" + manifest["index.html"].file),
    "utf8",
  );
  assert.doesNotMatch(js, /DEBUG_UNUSED_MARKER/);
  assert.match(js, /demoReady/);
  assert.ok(manifest["src/report.js"].isDynamicEntry);
  assert.ok(manifest["index.html"].dynamicImports.includes("src/report.js"));
});

for (const [label, marker] of [
  ["named", 'import { sum } from "./math.js";\nconsole.log'],
  ["namespace", 'import * as math from "./math.js"'],
]) {
  test(`Bundling: ${label} static access is tree-shaken`, async (t) => {
    const f = await fixture(t, BUNDLE);
    await f.put("src/main.js", snippet(BUNDLE, marker));
    const { entry } = await f.build();
    assert.doesNotMatch(entry.code, /DEBUG_UNUSED_MARKER/);
    assert.deepEqual(evaluate(entry.code).logs, [[5]]);
  });
}

test("Bundling: dynamic namespace access retains potentially used export", async (t) => {
  const f = await fixture(t, BUNDLE);
  await f.put(
    "src/main.js",
    'import * as math from "./math.js";\nglobalThis.result = math[globalThis.method](2, 3);',
  );
  const { entry } = await f.build();
  assert.match(entry.code, /DEBUG_UNUSED_MARKER/);
});

for (const [label, options, retained] of [
  ["tree shaking disabled but output DCE active", { treeshake: false }, false],
  [
    "output DCE disabled but tree shaking active",
    { output: { minify: false } },
    false,
  ],
  [
    "both elimination stages disabled",
    { treeshake: false, output: { minify: false } },
    true,
  ],
]) {
  test(`Bundling: ${label}`, async (t) => {
    const f = await fixture(t, BUNDLE);
    const { entry } = await f.build({ rolldownOptions: options });
    assert.equal(/DEBUG_UNUSED_MARKER/.test(entry.code), retained);
  });
}

test("Bundling: false sideEffects removes necessary registration", async (t) => {
  const f = await fixture(t, BUNDLE);
  const pkg = JSON.parse(await readFile(f.file("package.json"), "utf8"));
  await f.put("package.json", JSON.stringify({ ...pkg, sideEffects: false }));
  const { entry } = await f.build();
  assert.doesNotMatch(entry.code, /demoReady/);
});

test("Bundling: targeted sideEffects preserves the registration", async (t) => {
  const f = await fixture(t, BUNDLE);
  const pkg = JSON.parse(await readFile(f.file("package.json"), "utf8"));
  const metadata = JSON.parse(snippet(BUNDLE, '"sideEffects": [', "json"));
  await f.put("package.json", JSON.stringify({ ...pkg, ...metadata }));
  const { entry } = await f.build();
  assert.match(entry.code, /demoReady/);
  assert.doesNotMatch(entry.code, /DEBUG_UNUSED_MARKER/);
});

test("Bundling: false PURE assertion can suppress an observable call", async (t) => {
  const f = await fixture(t, BUNDLE);
  await f.put(
    "src/main.js",
    'function install() { globalThis.installed = true; return {}; }\nconst unused = /* @__PURE__ */ install();\nconsole.log("main");',
  );
  const { entry } = await f.build();
  assert.equal(evaluate(entry.code).context.installed, undefined);
});

test("Bundling: side effects in PURE call arguments are still preserved", async (t) => {
  const f = await fixture(t, BUNDLE);
  await f.put(
    "src/main.js",
    'const unused = /* @__PURE__ */ globalThis.factory(console.log("ARGUMENT_EFFECT"));',
  );
  const { entry } = await f.build();
  assert.deepEqual(evaluate(entry.code).logs, [["ARGUMENT_EFFECT"]]);
});

test("Bundling: source map may retain text removed from executable JS", async (t) => {
  const f = await fixture(t, BUNDLE);
  const { entry } = await f.build({ sourcemap: true });
  assert.doesNotMatch(entry.code, /DEBUG_UNUSED_MARKER/);
  const map = JSON.parse(
    await readFile(f.file("dist/" + entry.fileName + ".map"), "utf8"),
  );
  assert.ok(
    map.sourcesContent.some((source) =>
      source?.includes("DEBUG_UNUSED_MARKER"),
    ),
  );
});

test("Maps: demo function follows its declared contract", async () => {
  const code = snippet(MAPS, "export function displayName");
  const { displayName } = await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
  assert.equal(displayName({ name: "Ada" }), "ADA");
  assert.throws(() => displayName(undefined), TypeError);
});

test("Maps: external map has source content and matching link", async (t) => {
  const f = await fixture(t, MAPS);
  const { entry } = await f.build();
  assert.match(entry.code, /sourceMappingURL=.*\.map/);
  const map = JSON.parse(
    await readFile(f.file("dist/" + entry.fileName + ".map"), "utf8"),
  );
  assert.equal(map.version, 3);
  assert.ok(map.mappings.length > 0);
  const index = map.sources.findIndex((source) =>
    source.endsWith("/src/profile.js"),
  );
  assert.ok(index >= 0);
  assert.equal(
    map.sourcesContent[index],
    snippet(MAPS, "export function displayName") + "\n",
  );
});

test("Maps: hidden removes only the bundle comment", async (t) => {
  const f = await fixture(t, MAPS);
  const { entry } = await f.build({ sourcemap: "hidden" });
  assert.doesNotMatch(entry.code, /sourceMappingURL=/);
  const map = JSON.parse(
    await readFile(f.file("dist/" + entry.fileName + ".map"), "utf8"),
  );
  assert.equal(map.version, 3);
  assert.ok(
    map.sourcesContent.some((source) => source?.includes("response.profile")),
  );
  await f.serve(async (url) => {
    const response = await fetch(new URL(entry.fileName + ".map", url));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), map);
  });
});

test("Maps: inline embeds JSON and does not emit external map asset", async (t) => {
  const f = await fixture(t, MAPS);
  const { output, entry } = await f.build({ sourcemap: "inline" });
  const match = entry.code.match(
    /sourceMappingURL=data:application\/json[^,]*;base64,([^\s]+)/,
  );
  assert.ok(match);
  const map = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
  assert.equal(map.version, 3);
  assert.ok(map.sourcesContent.length > 0);
  assert.equal(
    output.some((item) => item.fileName.endsWith(".map")),
    false,
  );
});

test("Maps: false emits no map or map reference", async (t) => {
  const f = await fixture(t, MAPS);
  const { output, entry } = await f.build({ sourcemap: false });
  assert.doesNotMatch(entry.code, /sourceMappingURL=/);
  assert.equal(
    output.some((item) => item.fileName.endsWith(".map")),
    false,
  );
});

test("Maps: alternative config omits sourcesContent, not source paths", async (t) => {
  const f = await fixture(t, MAPS);
  await f.put("vite.config.js", snippet(MAPS, "sourcemapExcludeSources: true"));
  const { entry } = await f.build();
  const map = JSON.parse(
    await readFile(f.file("dist/" + entry.fileName + ".map"), "utf8"),
  );
  assert.doesNotMatch(entry.code, /sourceMappingURL=/);
  assert.equal(map.sourcesContent, undefined);
  assert.ok(map.sources.some((source) => source.endsWith("profile.js")));
  assert.ok(map.mappings.length > 0);
});

test("Maps: Node uses the generated server map only when enabled", async (t) => {
  const f = await fixture(t, MAPS);
  await f.put(
    "src/server.js",
    'import { displayName } from "./profile.js";\ndisplayName(undefined);\n',
  );
  await f.build({ ssr: "src/server.js", minify: false });
  const plain = await f.run(["dist/server.js"]);
  const mapped = await f.run(["--enable-source-maps", "dist/server.js"]);
  assert.equal(plain.code, 1);
  assert.equal(mapped.code, 1);
  assert.match(plain.stderr, /dist[\/]server\.js/);
  assert.match(mapped.stderr, /src[\\/]profile\.js:2:/);
});

async function browserTest(t, callback) {
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.diagnostic(`Bundling/source maps browser: ${browser.version()}`);
  try {
    await callback(browser);
  } finally {
    await browser.close();
  }
}

test(
  "[Chrome] Bundling: report loads on demand and is reused",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture(t, BUNDLE);
    await f.build();
    const manifest = JSON.parse(
      await readFile(f.file("dist/.vite/manifest.json"), "utf8"),
    );
    const reportPath = "/" + manifest["src/report.js"].file;
    await browserTest(t, (browser) =>
      f.serve(async (url) => {
        const context = await browser.newContext();
        try {
          const page = await context.newPage();
          const errors = [];
          const requests = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("request", (request) =>
            requests.push(new URL(request.url()).pathname),
          );
          await page.goto(url, { waitUntil: "networkidle" });
          assert.equal(await page.locator("#sum").textContent(), "5");
          assert.equal(await page.evaluate(() => globalThis.demoReady), true);
          assert.equal(requests.includes(reportPath), false);
          await page.locator("#load-report").click();
          await page.waitForFunction(
            () =>
              document.querySelector("#report").textContent ===
              "Report caricato",
          );
          assert.equal(
            requests.filter((value) => value === reportPath).length,
            1,
          );
          await page.locator("#load-report").click();
          await page.waitForFunction(
            () => !document.querySelector("#load-report").disabled,
          );
          assert.equal(
            requests.filter((value) => value === reportPath).length,
            1,
          );
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      }),
    );
  },
);

test(
  "[Chrome] Bundling: failed chunk has visible error and releases button",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture(t, BUNDLE);
    await f.build();
    const manifest = JSON.parse(
      await readFile(f.file("dist/.vite/manifest.json"), "utf8"),
    );
    const reportPath = "/" + manifest["src/report.js"].file;
    await browserTest(t, (browser) =>
      f.serve(async (url) => {
        const context = await browser.newContext();
        try {
          await context.route("**/*", (route) =>
            new URL(route.request().url()).pathname === reportPath
              ? route.abort("failed")
              : route.continue(),
          );
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(url, { waitUntil: "networkidle" });
          await page.locator("#load-report").click();
          await page.waitForFunction(
            () =>
              document.querySelector("#report").textContent ===
              "Caricamento non riuscito",
          );
          assert.equal(await page.locator("#load-report").isEnabled(), true);
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      }),
    );
  },
);

test(
  "[Chrome] Maps: actual generated exception resolves to the original source",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture(t, MAPS);
    const { entry } = await f.build();
    const map = JSON.parse(
      await readFile(f.file("dist/" + entry.fileName + ".map"), "utf8"),
    );
    await browserTest(t, (browser) =>
      f.serve(async (url) => {
        const context = await browser.newContext();
        try {
          const page = await context.newPage();
          const cdp = await context.newCDPSession(page);
          const scripts = new Map();
          cdp.on("Debugger.scriptParsed", (event) =>
            scripts.set(event.scriptId, event),
          );
          await cdp.send("Debugger.enable");
          await cdp.send("Debugger.setPauseOnExceptions", {
            state: "uncaught",
          });
          await page.goto(url, { waitUntil: "networkidle" });
          // Schedule the click without awaiting the paused browser task.
          const paused = new Promise((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error("Expected debugger pause")),
              10000,
            );
            cdp.once("Debugger.paused", (event) => {
              clearTimeout(timer);
              resolve(event);
            });
          });
          await cdp.send("Runtime.evaluate", {
            expression:
              'setTimeout(() => document.querySelector("#show-profile").click(), 0)',
          });
          const event = await paused;
          try {
            assert.equal(event.reason, "exception");
            const frame = event.callFrames[0];
            const script = scripts.get(frame.location.scriptId);
            assert.ok(script.url.endsWith(entry.fileName));
            assert.ok(script.sourceMapURL.endsWith(".map"));
            const original = new SourceMap(map).findEntry(
              frame.location.lineNumber,
              frame.location.columnNumber,
            );
            assert.match(original.originalSource, /src\/profile\.js$/);
            assert.equal(original.originalLine, 1);
            const mappedSource =
              map.sourcesContent[map.sources.indexOf(original.originalSource)];
            assert.match(
              mappedSource.split("\n")[original.originalLine],
              /return user\.name/,
            );
            t.diagnostic(
              `Mapped exception: ${original.originalSource}:${original.originalLine + 1}`,
            );
          } finally {
            await cdp.send("Debugger.setPauseOnExceptions", { state: "none" });
            await cdp.send("Debugger.resume");
          }
          await cdp.detach();
        } finally {
          await context.close();
        }
      }),
    );
  },
);

test(
  "[Chrome] Maps: correction in source fixes the build on desktop and mobile",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture(t, MAPS);
    const main = snippet(MAPS, "import { displayName }");
    const fix = snippet(MAPS, "const user = response.user;");
    await f.put(
      "src/main.js",
      main.replace("const user = response.profile;", fix),
    );
    await f.build();
    await browserTest(t, (browser) =>
      f.serve(async (url) => {
        for (const viewport of [
          { width: 1440, height: 1000 },
          { width: 390, height: 844 },
        ]) {
          const context = await browser.newContext({ viewport });
          try {
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("#show-profile").click();
            assert.equal(await page.locator("#result").textContent(), "ADA");
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        }
      }),
    );
  },
);
