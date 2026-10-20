import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  realpath,
  symlink,
  unlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");
const toolsRoot = await realpath(
  path.resolve(
    process.env.REACT_TESTING_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-testing-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const trees = new Map(
  ["Testing Jest", "Testing Cypress e Playwright"].map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker, lang = "js") {
  const matches = trees
    .get(note)
    .children.filter(
      (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
    );
  assert.equal(matches.length, 1, `${note}: ${marker}`);
  return matches[0].value;
}
const j = "Testing Jest",
  b = "Testing Cypress e Playwright";
const formSource = snippet(j, "export function normalizeName", "jsx");
const apiSource = snippet(b, "export async function saveName");
const files = {
  "jest.config.cjs": snippet(j, "testEnvironment"),
  "babel.config.cjs": snippet(j, "presets:"),
  "test/setup.js": snippet(j, 'import "@testing-library/jest-dom"'),
  "src/ProfileForm.jsx": formSource,
  "src/ProfileForm.test.jsx": snippet(j, "test.each", "jsx"),
  "src/profile-api.js": apiSource,
  "src/main.jsx": snippet(b, "createRoot", "jsx"),
  "vite.config.js": snippet(b, 'from "vite"'),
  "index.html": snippet(b, "<!doctype html>", "html"),
  "playwright.config.js": snippet(b, "webServer:"),
  "e2e/profile.spec.js": snippet(b, "import { test, expect }"),
  "cypress.config.cjs": snippet(b, 'require("cypress")'),
  "cypress/e2e/profile.cy.js": snippet(
    b,
    'describe("Profilo con API simulata"',
  ),
};
function load(source, fetchImpl) {
  const module = { exports: {} };
  const code = transformSync(source, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  new Function("require", "module", "exports", "fetch", code)(
    (name) => (name === "./ProfileForm.jsx" ? form : toolRequire(name)),
    module,
    module.exports,
    fetchImpl,
  );
  return module.exports;
}
const form = load(formSource);
let realTemp, root;
const links = [],
  children = new Set();
const versions = {
  react: "19.3.0",
  "react-dom": "19.3.0",
  vite: "8.3.4",
  "@vitejs/plugin-react": "6.1.2",
  jest: "30.5.2",
  "jest-environment-jsdom": "30.5.2",
  "babel-jest": "30.5.2",
  "@babel/core": "7.29.7",
  "@babel/preset-env": "7.29.7",
  "@babel/preset-react": "7.29.7",
  "@testing-library/react": "16.3.3",
  "@testing-library/dom": "10.4.2",
  "@testing-library/jest-dom": "7.0.1",
  "@testing-library/user-event": "14.6.8",
  "@playwright/test": "1.62.1",
  cypress: "16.2.0",
};
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-runners-"));
  for (const [name, content] of Object.entries(files)) {
    const destination = path.join(root, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  const pkg = JSON.parse(snippet(b, '"scripts"', "json"));
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "react-test-fixture",
      private: true,
      type: "module",
      ...pkg,
      dependencies: versions,
    }),
  );
  for (const name of Object.keys(versions)) {
    const destination = path.join(root, "node_modules", name);
    await mkdir(path.dirname(destination), { recursive: true });
    await symlink(
      path.join(toolsRoot, "node_modules", name),
      destination,
      "junction",
    );
    links.push(destination);
  }
  await writeFile(
    path.join(root, "cypress-run.cjs"),
    `
const fs=require('node:fs');
require('cypress').run({project:__dirname,browser:'chrome',headed:false,quiet:true}).then(result=>{
 fs.writeFileSync('cypress-results.json',JSON.stringify(result));
 if(result.status==='failed'||result.totalFailed)process.exitCode=1;
}).catch(error=>{console.error(error);process.exitCode=1});
`,
  );
  console.log(
    `Fixture ${root}; React ${React.version}; Jest 30.5.2; Playwright Test 1.62.1; Cypress 16.2.0`,
  );
});
async function killTree(child) {
  if (!children.has(child)) return;
  if (process.platform === "win32") {
    const killer = spawn(
      "taskkill.exe",
      ["/PID", String(child.pid), "/T", "/F"],
      { windowsHide: true, stdio: "ignore" },
    );
    await once(killer, "close");
  } else child.kill("SIGTERM");
}
async function run(args, extra = {}, timeout = 120_000) {
  const env = { ...process.env, CI: "1", ...extra };
  delete env.NODE_ENV;
  delete env.ELECTRON_RUN_AS_NODE;
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.add(child);
    let stdout = "",
      stderr = "",
      expired = false;
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    const timer = setTimeout(() => {
      expired = true;
      void killTree(child);
    }, timeout);
    child.on("error", (error) => {
      clearTimeout(timer);
      children.delete(child);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      children.delete(child);
      if (expired)
        reject(new Error(`Timeout: ${args.join(" ")}\n${stdout}\n${stderr}`));
      else resolve({ code, stdout, stderr });
    });
  });
}
function successful(result) {
  assert.equal(result.code, 0, result.stdout + "\n" + result.stderr);
}
async function freePort() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}
after(async () => {
  for (const child of children) await killTree(child);
  if (!root) return;
  const resolved = await realpath(root);
  assert.equal(path.dirname(resolved), realTemp);
  assert(path.basename(resolved).startsWith("appunti-react-runners-"));
  for (const destination of links) {
    const relative = path.relative(resolved, destination);
    assert(!relative.startsWith("..") && !path.isAbsolute(relative));
    await unlink(destination);
  }
  await rm(resolved, { recursive: true, force: true });
});

test("Sintassi: tutti i blocchi JS/JSX e i JSON delle due note", () => {
  for (const tree of trees.values())
    for (const node of tree.children) {
      if (node.type !== "code") continue;
      if (["js", "jsx"].includes(node.lang))
        transformSync(node.value, { loader: "jsx" });
      if (node.lang === "json") JSON.parse(node.value);
    }
});
test("Versioni della toolchain coerenti con i pin del demo", async () => {
  for (const [name, version] of Object.entries(versions)) {
    const pkg = JSON.parse(
      await readFile(
        path.join(toolsRoot, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    assert.equal(pkg.version, version, name);
  }
});
test("Nome: trim, limiti UTF-16 e tipi invalidi", () => {
  assert.equal(form.normalizeName("  Ada Lovelace  "), "Ada Lovelace");
  assert.equal(form.normalizeName("x".repeat(40)).length, 40);
  assert.equal(form.normalizeName("\u{1F600}".repeat(20)).length, 40);
  for (const value of [null, undefined, 1, {}])
    assert.throws(() => form.normalizeName(value), TypeError);
  for (const value of [" ", "x".repeat(41), "\u{1F600}".repeat(21)])
    assert.throws(() => form.normalizeName(value), RangeError);
});
test("Render SSR del form non chiama il servizio e mantiene label/stato", () => {
  let calls = 0;
  const html = renderToStaticMarkup(
    React.createElement(form.default, { saveName: () => calls++ }),
  );
  assert.match(html, /Nome visualizzato/);
  assert.match(html, /role="status"/);
  assert(!html.includes('role="alert"'));
  assert.equal(calls, 0);
});
test("Adapter: richiesta esplicita, payload normalizzato e proiezione della risposta", async () => {
  let sent;
  const api = load(apiSource, async (url, options) => {
    sent = { url, options };
    return new Response(
      JSON.stringify({ name: " Ada Lovelace ", private: "not returned" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  });
  assert.equal(await api.saveName(" Ada "), "Ada Lovelace");
  assert.equal(sent.url, "/api/profile");
  assert.equal(sent.options.method, "PUT");
  assert.equal(sent.options.credentials, "omit");
  assert.equal(sent.options.redirect, "error");
  assert.equal(sent.options.cache, "no-store");
  assert.deepEqual(JSON.parse(sent.options.body), { name: "Ada" });
});
test("Adapter: input invalido non chiama fetch, guasto rete propagato", async () => {
  let calls = 0;
  const failure = new Error("rete simulata");
  const api = load(apiSource, async () => {
    calls++;
    throw failure;
  });
  await assert.rejects(api.saveName(" "), RangeError);
  assert.equal(calls, 0);
  await assert.rejects(api.saveName("Ada"), (error) => error === failure);
  assert.equal(calls, 1);
});
for (const status of [201, 204, 401, 403, 500])
  test(`Adapter: HTTP ${status} non e un successo del contratto`, async () => {
    const api = load(
      apiSource,
      async () =>
        new Response(null, {
          status,
          headers: { "Content-Type": "application/json" },
        }),
    );
    await assert.rejects(api.saveName("Ada"), /Risposta profilo non valida/);
  });
for (const [name, body, contentType] of [
  ["HTML", "<p>login</p>", "text/html"],
  ["JSON malformato", "{", "application/json"],
  ["null", "null", "application/json"],
  ["array", "[]", "application/json"],
  ["campo assente", "{}", "application/json"],
  ["nome non stringa", '{"name":1}', "application/json"],
  ["nome vuoto", '{"name":" "}', "application/json"],
])
  test(`Adapter: risposta ${name} rifiutata`, async () => {
    const api = load(
      apiSource,
      async () =>
        new Response(body, {
          status: 200,
          headers: { "Content-Type": contentType },
        }),
    );
    await assert.rejects(api.saveName("Ada"));
  });
test("Jest CLI: sette test originali con jsdom, Babel, user-event e coverage", async () => {
  const result = await run([
    path.join(toolsRoot, "node_modules/jest/bin/jest.js"),
    "--config",
    "jest.config.cjs",
    "--runInBand",
    "--coverage",
    "--json",
    "--outputFile",
    "jest-results.json",
  ]);
  successful(result);
  const report = JSON.parse(
    await readFile(path.join(root, "jest-results.json"), "utf8"),
  );
  assert.equal(report.numPassedTests, 7);
  assert.equal(report.numFailedTests, 0);
  assert.equal(report.numPendingTests, 0);
  assert(
    report.coverageMap &&
      Object.keys(report.coverageMap).some((name) =>
        name.endsWith("ProfileForm.jsx"),
      ),
  );
  assert(!/not wrapped in act|Jest did not exit/.test(result.stderr));
  console.log("Jest: 7/7, coverage raccolta (non certifica i requisiti)");
});
test("Prova negativa: i test Jest rilevano la rimozione della validazione del vuoto", async () => {
  const destination = path.join(root, "src/ProfileForm.jsx");
  const mutant = formSource.replace(
    "name.length === 0 || name.length > 40",
    "name.length > 40",
  );
  assert.notEqual(mutant, formSource);
  await writeFile(destination, mutant);
  try {
    const result = await run([
      path.join(toolsRoot, "node_modules/jest/bin/jest.js"),
      "--config",
      "jest.config.cjs",
      "--runInBand",
      "--json",
      "--outputFile",
      "jest-negative.json",
    ]);
    assert.equal(result.code, 1);
    const report = JSON.parse(
      await readFile(path.join(root, "jest-negative.json"), "utf8"),
    );
    assert.equal(report.numFailedTests, 2);
    assert.equal(report.numPassedTests, 5);
    assert.equal(report.numRuntimeErrorTestSuites, 0);
  } finally {
    await writeFile(destination, formSource);
  }
});
test("Vite: build production del progetto originale prima dei test browser", async () => {
  successful(
    await run([path.join(toolsRoot, "node_modules/vite/bin/vite.js"), "build"]),
  );
  const html = await readFile(path.join(root, "dist/index.html"), "utf8");
  assert.match(html, /assets\/[^" ]+\.js/);
  assert(!html.includes("/src/main.jsx"));
});
test("Playwright Test CLI: tre test su Chrome con webServer della nota", async () => {
  const port = await freePort();
  const reportPath = path.join(root, "playwright-results.json");
  const result = await run(
    [
      path.join(toolsRoot, "node_modules/@playwright/test/cli.js"),
      "test",
      "--reporter=json",
    ],
    { TEST_PORT: String(port), PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath },
  );
  successful(result);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  assert.equal(report.stats.expected, 3);
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.flaky, 0);
  assert.equal(report.stats.skipped, 0);
  assert(!/pageerror|uncaught/i.test(result.stderr));
  console.log("Playwright Test: 3/3, Chrome e API simulata");
});
test("Cypress runner: tre test originali su Chrome con anteprima esterna", async () => {
  const { preview } = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  const port = await freePort();
  const server = await preview({
    root,
    logLevel: "silent",
    preview: { host: "127.0.0.1", port, strictPort: true },
  });
  try {
    const result = await run(
      [path.join(root, "cypress-run.cjs")],
      { TEST_PORT: String(port) },
      180_000,
    );
    successful(result);
    const report = JSON.parse(
      await readFile(path.join(root, "cypress-results.json"), "utf8"),
    );
    assert.equal(report.totalPassed, 3);
    assert.equal(report.totalFailed, 0);
    assert.equal(report.totalPending, 0);
    assert.equal(report.totalSkipped, 0);
    assert.equal(report.browserName, "chrome");
    console.log(`Cypress: 3/3, Chrome ${report.browserVersion}, API simulata`);
  } finally {
    server.httpServer.closeAllConnections();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
});
