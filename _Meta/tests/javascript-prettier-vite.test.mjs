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
  readdir,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const toolsDir = await realpath(
  process.env.PRETTIER_VITE_TOOLS_DIR ??
    path.join(tmpdir(), "appunti-prettier-vite-tools"),
);
const deps = path.join(toolsDir, "node_modules");
const prettier = await import(
  pathToFileURL(path.join(deps, "prettier/index.mjs"))
);
const vite = await import(
  pathToFileURL(path.join(deps, "vite/dist/node/index.js"))
);
const prettierCli = path.join(deps, "prettier/bin/prettier.cjs");
const npmCli = process.env.NPM_CLI_PATH;
assert.ok(
  npmCli,
  "Set NPM_CLI_PATH to the installed npm JavaScript entry point",
);
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ?? "../../site/node_modules/playwright",
);
const before = snippet("Prettier", 'const user={name:"Luca"');
const after = snippet("Prettier", 'const user = { name: "Luca"') + "\n";
const options = JSON.parse(snippet("Prettier", '"printWidth": 100', "json"));
const sourceMain = snippet("Vite", 'import "./style.css"');
const sourceCss = snippet("Vite", "body {", "css");

async function fixture(t, note) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-prettier-vite-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(temp + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-prettier-vite-"));
    await rm(actual, { recursive: true, force: true });
  });
  const file = (name) => path.join(root, name);
  async function put(name, value) {
    await mkdir(path.dirname(file(name)), { recursive: true });
    await writeFile(file(name), value);
  }
  await mkdir(file("node_modules"));
  for (const name of ["prettier", "vite"]) {
    await symlink(
      path.join(deps, name),
      file(`node_modules/${name}`),
      process.platform === "win32" ? "junction" : "dir",
    );
  }
  // npm scripts need local shims; each points at a trusted JS CLI, not input data.
  await mkdir(file("node_modules/.bin"));
  for (const [name, entry] of [
    ["prettier", prettierCli],
    ["vite", path.join(deps, "vite/bin/vite.js")],
  ]) {
    if (process.platform === "win32")
      await put(
        `node_modules/.bin/${name}.cmd`,
        `@"${process.execPath}" "${entry}" %*\r\n`,
      );
    else {
      const { chmod } = await import("node:fs/promises");
      await put(
        `node_modules/.bin/${name}`,
        `#!/bin/sh\nexec "${process.execPath}" "${entry}" "$@"\n`,
      );
      await chmod(file(`node_modules/.bin/${name}`), 0o755);
    }
  }
  const files =
    note === "Prettier"
      ? [
          ["package.json", '"name": "format-demo"', "json"],
          [".prettierrc.json", '"printWidth": 100', "json"],
          [".prettierignore", "dist/", "text"],
          ["src/user.js", 'const user={name:"Luca"', "js"],
          [
            "tools/preview-format.mjs",
            'import * as prettier from "prettier"',
            "js",
          ],
        ]
      : [
          ["package.json", '"name": "vite-demo"', "json"],
          ["vite.config.js", "export default defineConfig", "js"],
          [".gitignore", "node_modules/", "text"],
          [".env", "VITE_APP_TITLE=Contatore locale", "dotenv"],
          [".env.production", "VITE_APP_TITLE=Contatore pubblicato", "dotenv"],
          ["public/info.txt", "Demo Vite:", "text"],
          ["index.html", "<!doctype html>", "html"],
          ["src/main.js", 'import "./style.css"', "js"],
          ["src/style.css", "body {", "css"],
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
  async function run(args, extra = {}) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env,
          windowsHide: true,
          timeout: 30000,
          maxBuffer: 2 * 1024 * 1024,
          encoding: "utf8",
          ...extra,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return {
    root,
    file,
    put,
    run,
    env,
    cli: (...args) => run([prettierCli, ...args]),
    npm: (...args) => run([npmCli, "run", ...args]),
  };
}

test("Tooling: exact versions match the documented baseline", () => {
  assert.equal(prettier.version, "3.9.10");
  assert.equal(vite.version, "8.3.4");
});

test("Prettier: documented before/after is exact", async () => {
  assert.equal(
    await prettier.format(before, { ...options, parser: "babel" }),
    after,
  );
});

test("Prettier: formatted output is a fixed point", async () => {
  assert.equal(
    await prettier.format(after, { ...options, parser: "babel" }),
    after,
  );
  assert.equal(
    await prettier.check(after, { ...options, parser: "babel" }),
    true,
  );
  assert.equal(
    await prettier.check(before, { ...options, parser: "babel" }),
    false,
  );
});

test("Prettier: parseable runtime errors are not linted", async () => {
  assert.equal(
    await prettier.format("missingFunction()", { parser: "babel" }),
    "missingFunction();\n",
  );
});

test("Prettier: invalid syntax rejects", async () => {
  await assert.rejects(
    prettier.format("const = ;", { parser: "babel" }),
    SyntaxError,
  );
});

test("Prettier: printWidth is not a strict maximum", async () => {
  const formatted = await prettier.format(
    `const message = "${"x".repeat(130)}";`,
    { parser: "babel", printWidth: 100 },
  );
  assert.ok(formatted.split("\n").some((line) => line.length > 100));
});

test("Prettier: API does not read project config by itself", async (t) => {
  const f = await fixture(t, "Prettier");
  await f.put(".prettierrc.json", JSON.stringify({ semi: false }));
  assert.equal(
    await prettier.format("const x=1", { filepath: f.file("src/user.js") }),
    "const x = 1;\n",
  );
  const config = await prettier.resolveConfig(f.file("src/user.js"), {
    useCache: false,
  });
  assert.equal(
    await prettier.format("const x=1", {
      ...config,
      filepath: f.file("src/user.js"),
    }),
    "const x = 1\n",
  );
});

test("Prettier: config lookup and Markdown override", async (t) => {
  const f = await fixture(t, "Prettier");
  const js = await prettier.resolveConfig(f.file("src/user.js"));
  const md = await prettier.resolveConfig(f.file("docs/nested/readme.md"));
  assert.equal(js.printWidth, 100);
  assert.equal(js.proseWrap, undefined);
  assert.equal(md.proseWrap, "preserve");
  assert.equal(
    await prettier.format("riga uno\nriga due\n", {
      ...md,
      parser: "markdown",
    }),
    "riga uno\nriga due\n",
  );
});

test("Prettier: explicit config overrides EditorConfig", async (t) => {
  const f = await fixture(t, "Prettier");
  await f.put(
    ".editorconfig",
    "root = true\n[*]\nindent_size = 4\nmax_line_length = 60\nend_of_line = crlf\n",
  );
  const config = await prettier.resolveConfig(f.file("src/user.js"), {
    editorconfig: true,
    useCache: false,
  });
  assert.equal(config.tabWidth, 4);
  assert.equal(config.printWidth, 100);
  assert.equal(config.endOfLine, "lf");
});

test("Prettier: CLI check does not modify input and exits 1", async (t) => {
  const f = await fixture(t, "Prettier");
  const result = await f.npm("format:file", "--", "src/user.js", "--check");
  assert.equal(result.code, 1);
  assert.equal(await readFile(f.file("src/user.js"), "utf8"), before + "\n");
});

test("Prettier: npm write then check exits 0", async (t) => {
  const f = await fixture(t, "Prettier");
  const write = await f.npm("format");
  assert.equal(write.code, 0, write.stderr);
  assert.equal(await readFile(f.file("src/user.js"), "utf8"), after);
  assert.equal((await f.npm("format:check")).code, 0);
});

test("Prettier: stdout preview leaves source unchanged", async (t) => {
  const f = await fixture(t, "Prettier");
  const result = await f.cli("src/user.js");
  assert.equal(result.code, 0);
  assert.equal(result.stdout, after);
  assert.equal(await readFile(f.file("src/user.js"), "utf8"), before + "\n");
});

for (const [name, setup, args] of [
  [
    "syntax error",
    (f) => f.put("src/user.js", "const = ;"),
    ["src/user.js", "--check"],
  ],
  [
    "invalid config",
    (f) => f.put(".prettierrc.json", "{broken"),
    ["src/user.js", "--check"],
  ],
  [
    "unknown explicit file",
    (f) => f.put("input.unknown", "abc"),
    ["input.unknown", "--check"],
  ],
])
  test(`Prettier: ${name} exits 2`, async (t) => {
    const f = await fixture(t, "Prettier");
    await setup(f);
    const result = await f.cli(...args);
    assert.equal(result.code, 2, result.stdout + result.stderr);
  });

test("Prettier: ignore files survive whole-project write", async (t) => {
  const f = await fixture(t, "Prettier");
  await f.put(".gitignore", "generated/\n");
  for (const name of [
    "dist/bad.js",
    "coverage/bad.js",
    "vendor/bad.js",
    "generated/bad.js",
    "package-lock.json",
  ])
    await f.put(name, "not valid {{{");
  const result = await f.npm("format");
  assert.equal(result.code, 0, result.stderr);
  for (const name of [
    "dist/bad.js",
    "coverage/bad.js",
    "vendor/bad.js",
    "generated/bad.js",
    "package-lock.json",
  ])
    assert.equal(await readFile(f.file(name), "utf8"), "not valid {{{");
});

test("Prettier: dedicated script finds exactly one config", async (t) => {
  const f = await fixture(t, "Prettier");
  const result = await f.npm(
    "format:file",
    "--",
    "--find-config-path",
    "src/user.js",
  );
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /\.prettierrc\.json/);
});

test("Prettier: preview API program runs without writing", async (t) => {
  const f = await fixture(t, "Prettier");
  const result = await f.run(["tools/preview-format.mjs"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stdout, after);
  assert.equal(await readFile(f.file("src/user.js"), "utf8"), before + "\n");
});

test("Prettier: ignore comment skips a node, not all following code", async () => {
  const result = await prettier.format(
    "// prettier-ignore\nconst a=[1,2,3];\nconst b=[1,2,3];",
    { parser: "babel" },
  );
  assert.match(result, /const a=\[1,2,3\];/);
  assert.match(result, /const b = \[1, 2, 3\];/);
});

test("Vite: loadEnv modes, strings and default prefix", async (t) => {
  const f = await fixture(t, "Vite");
  await f.put(".env.local", "VITE_FLAG=false\nPRIVATE_MARKER=fixture-only\n");
  const dev = vite.loadEnv("development", f.root);
  const prod = vite.loadEnv("production", f.root);
  assert.equal(dev.VITE_APP_TITLE, "Contatore locale");
  assert.equal(prod.VITE_APP_TITLE, "Contatore pubblicato");
  assert.equal(prod.VITE_FLAG, "false");
  assert.equal(prod.PRIVATE_MARKER, undefined);
  assert.equal(
    vite.loadEnv("production", f.root, "").PRIVATE_MARKER,
    "fixture-only",
  );
});

test("Vite: existing process env has priority", async (t) => {
  const f = await fixture(t, "Vite");
  const previous = process.env.VITE_APP_TITLE;
  try {
    process.env.VITE_APP_TITLE = "Process title";
    assert.equal(
      vite.loadEnv("production", f.root).VITE_APP_TITLE,
      "Process title",
    );
  } finally {
    if (previous === undefined) delete process.env.VITE_APP_TITLE;
    else process.env.VITE_APP_TITLE = previous;
  }
});

test("Vite: production build handles base, assets and outDir cleanup", async (t) => {
  const f = await fixture(t, "Vite");
  await f.put("dist/stale.txt", "old output");
  const result = await f.npm("build");
  assert.equal(result.code, 0, result.stderr);
  assert.equal((await readdir(f.file("dist"))).includes("stale.txt"), false);
  assert.equal(
    await readFile(f.file("dist/info.txt"), "utf8"),
    snippet("Vite", "Demo Vite:", "text") + "\n",
  );
  const html = await readFile(f.file("dist/index.html"), "utf8");
  assert.match(html, /\/appunti\/assets\/[^" ]+\.js/);
  assert.match(html, /\/appunti\/assets\/[^" ]+\.css/);
  assert.doesNotMatch(html, /\/src\/main\.js/);
  assert.equal(
    await readFile(f.file("src/main.js"), "utf8"),
    sourceMain + "\n",
  );
});

test("Vite: build strips TypeScript but does not type-check", async (t) => {
  const f = await fixture(t, "Vite");
  await f.put(
    "src/typed.ts",
    'const count: number = "wrong type";\ndocument.title = String(count);\n',
  );
  await f.put("src/main.js", 'import "./typed.ts";\n');
  const result = await f.npm("build");
  assert.equal(result.code, 0, result.stderr);
  const assets = await readdir(f.file("dist/assets"));
  const js = await readFile(
    f.file("dist/assets/" + assets.find((name) => name.endsWith(".js"))),
    "utf8",
  );
  assert.match(js, /wrong type/);
});

test("Vite: unresolved import fails the build", async (t) => {
  const f = await fixture(t, "Vite");
  await f.put("src/main.js", 'import "./missing.js";\n');
  const result = await f.npm("build");
  assert.notEqual(result.code, 0);
  assert.match(result.stdout + result.stderr, /missing\.js/);
});

test("Vite: static env values and staging remain distinct from production flag", async (t) => {
  const f = await fixture(t, "Vite");
  await f.put(
    ".env.staging",
    "VITE_APP_TITLE=Staging title\nVITE_FLAG=false\nPRIVATE_MARKER=fixture-private-marker\n",
  );
  await f.put(
    "src/main.js",
    "globalThis.demo = { title: import.meta.env.VITE_APP_TITLE, mode: import.meta.env.MODE, prod: import.meta.env.PROD, flag: import.meta.env.VITE_FLAG, privateValue: import.meta.env.PRIVATE_MARKER };\n",
  );
  const result = await f.npm("build", "--", "--mode", "staging");
  assert.equal(result.code, 0, result.stderr);
  const files = await readdir(f.file("dist/assets"));
  const js = await readFile(
    f.file("dist/assets/" + files.find((name) => name.endsWith(".js"))),
    "utf8",
  );
  assert.doesNotMatch(js, /fixture-private-marker/);
  const { runInNewContext } = await import("node:vm");
  const context = {
    document: { createElement: () => ({ relList: { supports: () => true } }) },
  };
  runInNewContext(js, context, { timeout: 1000 });
  assert.equal(context.demo.title, "Staging title");
  assert.equal(context.demo.mode, "staging");
  assert.equal(context.demo.prod, true);
  assert.equal(context.demo.flag, "false");
  assert.equal(context.demo.privateValue, undefined);
});

test("Vite: real dev and preview lifecycle", { timeout: 60000 }, async (t) => {
  const f = await fixture(t, "Vite");
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.diagnostic(`Vite browser: ${browser.version()}`);
  let dev;
  let preview;
  try {
    dev = await vite.createServer({
      root: f.root,
      logLevel: "silent",
      server: { port: 0 },
    });
    await dev.listen();
    const devUrl = `http://127.0.0.1:${dev.httpServer.address().port}/appunti/`;
    await t.test(
      "Vite: extracted config keeps loopback, strictPort and base",
      () => {
        assert.equal(dev.config.server.host, "127.0.0.1");
        assert.equal(dev.config.server.strictPort, true);
        assert.equal(dev.config.base, "/appunti/");
      },
    );
    await t.test(
      "Vite: strictPort rejects an occupied local port",
      async () => {
        const other = await vite.createServer({
          root: f.root,
          logLevel: "silent",
          server: { port: dev.httpServer.address().port },
        });
        try {
          await assert.rejects(other.listen(), /already in use/);
        } finally {
          await other.close();
        }
      },
    );
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(response.url());
    });
    await t.test(
      "[Chrome] Vite: dev HTML, env title, click and public asset",
      async () => {
        await page.goto(devUrl, { waitUntil: "networkidle" });
        assert.equal(await page.title(), "Contatore locale");
        assert.equal(
          await page.locator("#mode").textContent(),
          "Modalita: development",
        );
        await page.locator("#increment").click();
        assert.equal(await page.locator("#count").textContent(), "1");
        assert.equal(
          await page.locator("#info").getAttribute("href"),
          "/appunti/info.txt",
        );
        const info = await context.request.get(
          new URL("info.txt", devUrl).href,
        );
        assert.equal(info.status(), 200);
        assert.match(await info.text(), /nessun dato persistente/);
        assert.deepEqual(errors, []);
      },
    );
    await t.test(
      "[Chrome] Vite: CSS HMR preserves page and counter",
      async () => {
        await page.evaluate(() => {
          window.fixtureMarker = "survives-css";
        });
        await f.put(
          "src/style.css",
          sourceCss + "\nbody { background: rgb(240, 250, 240); }\n",
        );
        await page.waitForFunction(
          () =>
            getComputedStyle(document.body).backgroundColor ===
            "rgb(240, 250, 240)",
        );
        assert.equal(
          await page.evaluate(() => window.fixtureMarker),
          "survives-css",
        );
        assert.equal(await page.locator("#count").textContent(), "1");
      },
    );
    await t.test(
      "[Chrome] Vite: plain JS without HMR boundary reloads",
      async () => {
        await f.put(
          "src/main.js",
          sourceMain.replace(
            "let count = 0;",
            'document.body.dataset.updated = "yes";\nlet count = 0;',
          ),
        );
        await page.waitForFunction(
          () => document.body.dataset.updated === "yes",
        );
        assert.equal(
          await page.evaluate(() => window.fixtureMarker),
          undefined,
        );
        assert.equal(await page.locator("#count").textContent(), "0");
        assert.deepEqual(errors, []);
      },
    );
    await context.close();
    await dev.close();
    dev = null;
    await f.put("src/main.js", sourceMain + "\n");
    await f.put("src/style.css", sourceCss + "\n");
    const build = await f.npm("build");
    assert.equal(build.code, 0, build.stderr);
    preview = await vite.preview({
      root: f.root,
      logLevel: "silent",
      preview: { port: 0 },
    });
    const previewUrl = `http://127.0.0.1:${preview.httpServer.address().port}/appunti/`;
    await t.test(
      "[Chrome] Vite: production preview works on desktop and mobile",
      async () => {
        for (const viewport of [
          { width: 1440, height: 1000 },
          { width: 390, height: 844 },
        ]) {
          const ctx = await browser.newContext({ viewport });
          try {
            const p = await ctx.newPage();
            const problems = [];
            p.on("pageerror", (error) => problems.push(error.message));
            p.on("response", (response) => {
              if (response.status() >= 400) problems.push(response.url());
            });
            await p.goto(previewUrl, { waitUntil: "networkidle" });
            assert.equal(await p.title(), "Contatore pubblicato");
            assert.equal(
              await p.locator("#mode").textContent(),
              "Modalita: production",
            );
            await p.locator("#increment").click();
            assert.equal(await p.locator("#count").textContent(), "1");
            assert.equal(
              await p.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            assert.deepEqual(problems, []);
            await f.put(
              ".env.production",
              "VITE_APP_TITLE=Changed after build\n",
            );
            await p.reload({ waitUntil: "networkidle" });
            assert.equal(await p.title(), "Contatore pubblicato");
          } finally {
            await ctx.close();
          }
        }
      },
    );
  } finally {
    await browser.close();
    if (dev) await dev.close();
    if (preview) {
      await new Promise((resolve, reject) =>
        preview.httpServer.close((error) =>
          error ? reject(error) : resolve(),
        ),
      );
    }
  }
});
