import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  realpath,
  symlink,
  unlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");
const qualityRoot = await realpath(
  path.resolve(
    process.env.REACT_QUALITY_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-quality-tools"),
  ),
);
const runnerRoot = await realpath(
  path.resolve(
    process.env.REACT_TESTING_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-testing-tools"),
  ),
);
const qualityRequire = createRequire(path.join(qualityRoot, "package.json"));
const runnerRequire = createRequire(path.join(runnerRoot, "package.json"));
const { ESLint } = qualityRequire("eslint");
const React = runnerRequire("react");
const { renderToStaticMarkup } = runnerRequire("react-dom/server");
const a = "Test di accessibilita",
  l = "Linting e Formattazione",
  b = "Testing Cypress e Playwright";
const trees = new Map(
  [a, l, b, "WAI-ARIA", "Portals"].map((name) => [
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
const counter = snippet(l, "export default function TitleCounter", "jsx");
const broken = snippet(l, "export default function BrokenTitle", "jsx");
const lintFiles = {
  "eslint.config.mjs": snippet(l, "globalIgnores"),
  ".prettierrc.json": snippet(l, '"semi"', "json"),
  ".prettierignore": snippet(l, "package-lock.json", "text"),
  "src/TitleCounter.jsx": counter,
  "src/App.jsx":
    'import TitleCounter from "./TitleCounter.jsx";\nexport default function App() { return <TitleCounter />; }\n',
  "scripts/info.mjs": 'process.stdout.write("ok");\n',
  "test/setup.js": "beforeEach(() => { jest.clearAllMocks(); });\n",
  "dist/invalid.js": "intentionally not valid JavaScript",
};
const browserFiles = {
  "index.html": snippet(a, "<!doctype html>", "html"),
  "src/main.jsx": snippet(a, "createRoot", "jsx"),
  "src/index.css": snippet(a, "focus-visible", "css"),
  "src/Details.jsx": snippet(
    "WAI-ARIA",
    "export default function Details",
    "jsx",
  ),
  "src/NameForm.jsx": snippet(
    "WAI-ARIA",
    "export default function NameForm",
    "jsx",
  ),
  "src/PortalDemo.jsx": snippet(
    "Portals",
    "export function ClientPortal",
    "jsx",
  ),
  "src/DialogDemo.jsx": snippet(
    "Portals",
    "export function ConfirmDialog",
    "jsx",
  ),
  "vite.config.js": snippet(b, 'from "vite"'),
  "playwright.config.js": snippet(b, "webServer:"),
  "e2e/accessibility.spec.js": snippet(a, "async function scan"),
};
const versions = {
  eslint: "10.13.0",
  "@eslint/js": "10.0.1",
  globals: "17.13.0",
  "eslint-plugin-react-hooks": "7.1.1",
  "eslint-config-prettier": "10.1.8",
  prettier: "3.9.10",
  "@axe-core/playwright": "4.14.0",
  "playwright-core": "1.62.1",
};
let root, lintRoot, browserRoot, realTemp, eslint;
const links = [],
  children = new Set();
async function project(directory, files, pkg, packages) {
  await mkdir(directory, { recursive: true });
  for (const [name, content] of Object.entries({
    ...files,
    "package.json": JSON.stringify(pkg),
  })) {
    const destination = path.join(directory, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  for (const [name, location] of packages) {
    const destination = path.join(directory, "node_modules", name);
    await mkdir(path.dirname(destination), { recursive: true });
    await symlink(
      path.join(location, "node_modules", name),
      destination,
      "junction",
    );
    links.push(destination);
  }
}
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-quality-"));
  lintRoot = path.join(root, "lint");
  browserRoot = path.join(root, "browser");
  await project(
    lintRoot,
    lintFiles,
    {
      private: true,
      type: "module",
      ...JSON.parse(snippet(l, '"scripts"', "json")),
    },
    Object.keys(versions).map((name) => [name, qualityRoot]),
  );
  await project(
    browserRoot,
    browserFiles,
    {
      private: true,
      type: "module",
      ...JSON.parse(snippet(b, '"scripts"', "json")),
    },
    [
      ...[
        "react",
        "react-dom",
        "vite",
        "@vitejs/plugin-react",
        "@playwright/test",
      ].map((name) => [name, runnerRoot]),
      ["@axe-core/playwright", qualityRoot],
    ],
  );
  eslint = new ESLint({
    cwd: lintRoot,
    overrideConfigFile: path.join(lintRoot, "eslint.config.mjs"),
  });
  console.log(
    `Fixture ${root}; ESLint 10.13.0; Hooks 7.1.1; Prettier 3.9.10; axe 4.14.0`,
  );
});
async function kill(child) {
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
async function run(directory, args, extra = {}, timeout = 120_000) {
  const env = { ...process.env, CI: "1", ...extra };
  delete env.NODE_ENV;
  delete env.ELECTRON_RUN_AS_NODE;
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: directory,
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
      void kill(child);
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
function success(result) {
  assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
}
const eslintCLI = path.join(qualityRoot, "node_modules/eslint/bin/eslint.js");
const prettierCLI = path.join(
  qualityRoot,
  "node_modules/prettier/bin/prettier.cjs",
);
const viteCLI = path.join(runnerRoot, "node_modules/vite/bin/vite.js");
async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
after(async () => {
  for (const child of children) await kill(child);
  for (const link of links) await unlink(link);
  if (root) {
    assert.equal(path.dirname(root), realTemp);
    assert(path.basename(root).startsWith("appunti-react-quality-"));
    await rm(root, { recursive: true, force: true });
  }
});

test("Sintassi degli snippet JS/JSX/JSON/CSS (non esecuzione)", () => {
  for (const name of [a, l])
    for (const n of trees.get(name).children) {
      if (n.type !== "code") continue;
      if (n.lang === "json") JSON.parse(n.value);
      else if (["js", "jsx", "css"].includes(n.lang))
        transformSync(n.value, { loader: n.lang });
    }
});
test("Versioni dei pacchetti verificate", () => {
  for (const [name, expected] of Object.entries(versions)) {
    const pkg = JSON.parse(
      require("node:fs").readFileSync(
        path.join(qualityRoot, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    assert.equal(pkg.version, expected, name);
  }
  assert.equal(React.version, "19.3.0");
});
test("TitleCounter: render SSR iniziale, senza eseguire effect", () => {
  const code = transformSync(counter, {
    loader: "jsx",
    jsx: "automatic",
    format: "cjs",
  }).code;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    runnerRequire,
    module,
    module.exports,
  );
  const html = renderToStaticMarkup(
    React.createElement(module.exports.default),
  );
  assert.match(html, /Contatore/);
  assert.match(html, /Conteggio: 0/);
  assert.match(html, /Incrementa/);
});
test("ESLint CLI: progetto positivo, JSX importato e dist esclusa", async () => {
  const result = await run(lintRoot, [
    eslintCLI,
    ".",
    "--max-warnings",
    "0",
    "--format",
    "json",
  ]);
  success(result);
  const report = JSON.parse(result.stdout);
  assert(report.some((item) => item.filePath.endsWith("TitleCounter.jsx")));
  assert(
    report.every((item) => item.errorCount === 0 && item.warningCount === 0),
  );
  assert(
    !report.some((item) =>
      item.filePath.includes(`${path.sep}dist${path.sep}`),
    ),
  );
});
test("Configurazione effettiva: Hooks attivi, stile disabilitato e globali scoped", async () => {
  const result = await run(lintRoot, [
    eslintCLI,
    "--print-config",
    "src/TitleCounter.jsx",
  ]);
  success(result);
  const config = JSON.parse(result.stdout);
  assert.equal(config.rules["react-hooks/rules-of-hooks"][0], 2);
  assert.equal(config.rules["react-hooks/exhaustive-deps"][0], 1);
  assert.equal(config.rules["react-hooks/purity"][0], 2);
  assert.equal(config.rules.semi[0], 0);
  assert.equal(config.languageOptions.globals.document, false);
  assert.equal(config.languageOptions.globals.process, undefined);
  assert.equal(config.languageOptions.globals.jest, undefined);
});
for (const [name, filePath, source, rule, severity = 2] of [
  [
    "hook condizionale",
    "src/Bad.jsx",
    'import {useState} from "react"; export default function Bad({enabled}) { if(enabled) { const [x] = useState(0); return <p>{x}</p>; } return null; }',
    "react-hooks/rules-of-hooks",
  ],
  [
    "dipendenza mancante",
    "src/BrokenTitle.jsx",
    broken,
    "react-hooks/exhaustive-deps",
    1,
  ],
  [
    "mutazione props",
    "src/Bad.jsx",
    'export default function Bad({user}) { user.name = "new"; return <p>{user.name}</p>; }',
    "react-hooks/immutability",
  ],
  [
    "render impuro",
    "src/Bad.jsx",
    "export default function Bad() { return <p>{Date.now()}</p>; }",
    "react-hooks/purity",
  ],
  [
    "componente JSX non definito",
    "src/Bad.jsx",
    "export default function Bad() { return <Missing />; }",
    "no-undef",
  ],
  [
    "variabile inutilizzata",
    "src/Bad.jsx",
    "export default function Bad() { const unused = 1; return <p>Ok</p>; }",
    "no-unused-vars",
  ],
  [
    "process nel browser",
    "src/Bad.js",
    "export const mode = process.env.NODE_ENV;",
    "no-undef",
  ],
  [
    "jest fuori dai test",
    "src/Bad.js",
    "export const mock = jest.fn();",
    "no-undef",
  ],
  [
    "document nello script Node",
    "scripts/bad.mjs",
    'document.title = "bad";',
    "no-undef",
  ],
  [
    "require in ESM Node",
    "scripts/bad.mjs",
    'export const fs = require("node:fs");',
    "no-undef",
  ],
  [
    "uguaglianza non stretta",
    "src/Bad.js",
    "export const same = (a,b) => a == b;",
    "eqeqeq",
  ],
])
  test(`ESLint rifiuta: ${name}`, async () => {
    const [result] = await eslint.lintText(source, {
      filePath: path.join(lintRoot, filePath),
    });
    assert(
      result.messages.some(
        (message) => message.ruleId === rule && message.severity === severity,
      ),
      JSON.stringify(result.messages),
    );
  });
for (const [name, filePath, source] of [
  ["browser", "src/env.js", "export const title = () => document.title;"],
  ["Node ESM", "scripts/env.mjs", "export const mode = process.env.NODE_ENV;"],
  [
    "CommonJS",
    "build.config.cjs",
    'module.exports = require("node:path").basename(__dirname);',
  ],
  [
    "Jest",
    "src/env.test.jsx",
    'test("example", () => { expect(jest.fn()).toBeDefined(); });',
  ],
])
  test(`Globali consentiti: ${name}`, async () => {
    const [result] = await eslint.lintText(source, {
      filePath: path.join(lintRoot, filePath),
    });
    assert.deepEqual(result.messages, []);
  });
test("Una soppressione inutile viene segnalata", async () => {
  const [result] = await eslint.lintText(
    "/* eslint-disable eqeqeq */\nexport const value = 1;",
    { filePath: path.join(lintRoot, "src/unused-disable.js") },
  );
  assert(
    result.messages.some(
      (m) => m.message.includes("Unused eslint-disable") && m.severity === 2,
    ),
  );
});
test("Warning reale: CLI 0 senza soglia, 1 con max-warnings 0", async () => {
  const destination = path.join(lintRoot, "src/BrokenTitle.jsx");
  await writeFile(destination, broken);
  try {
    const normal = await run(lintRoot, [
      eslintCLI,
      "src/BrokenTitle.jsx",
      "--format",
      "json",
    ]);
    success(normal);
    const strict = await run(lintRoot, [
      eslintCLI,
      "src/BrokenTitle.jsx",
      "--max-warnings",
      "0",
      "--format",
      "json",
    ]);
    assert.equal(strict.code, 1);
    const [report] = JSON.parse(strict.stdout);
    assert.equal(report.errorCount, 0);
    assert.equal(report.warningCount, 1);
  } finally {
    await unlink(destination);
  }
});
test("Prettier: check non scrive; write corregge stile senza nascondere errori Hooks", async () => {
  const beforeText = await readFile(path.join(lintRoot, "src/App.jsx"), "utf8");
  const check = await run(lintRoot, [prettierCLI, ".", "--check"]);
  assert.equal(check.code, 1);
  assert.equal(
    await readFile(path.join(lintRoot, "src/App.jsx"), "utf8"),
    beforeText,
  );
  success(await run(lintRoot, [prettierCLI, ".", "--write"]));
  success(await run(lintRoot, [prettierCLI, ".", "--check"]));
  assert.notEqual(
    await readFile(path.join(lintRoot, "src/App.jsx"), "utf8"),
    beforeText,
  );
  assert.equal(
    await readFile(path.join(lintRoot, "dist/invalid.js"), "utf8"),
    lintFiles["dist/invalid.js"],
  );
  success(await run(lintRoot, [eslintCLI, ".", "--max-warnings", "0"]));
  const prettier = qualityRequire("prettier");
  const formatted = await prettier.format(broken, { parser: "babel" });
  const [result] = await eslint.lintText(formatted, {
    filePath: path.join(lintRoot, "src/BrokenTitle.jsx"),
  });
  assert(
    result.messages.some((m) => m.ruleId === "react-hooks/exhaustive-deps"),
  );
});
test("Vite: build reale del demo accessibilita", async () => {
  success(await run(browserRoot, [viteCLI, "build"]));
  assert.match(
    await readFile(path.join(browserRoot, "dist/index.html"), "utf8"),
    /assets\/[^" ]+\.js/,
  );
});
async function playwrightRun(args = []) {
  const port = await freePort();
  const output = path.join(browserRoot, "playwright-results.json");
  const result = await run(
    browserRoot,
    [
      path.join(runnerRoot, "node_modules/@playwright/test/cli.js"),
      "test",
      "e2e/accessibility.spec.js",
      "--reporter=json",
      ...args,
    ],
    { TEST_PORT: String(port), PLAYWRIGHT_JSON_OUTPUT_FILE: output },
  );
  const report = JSON.parse(await readFile(output, "utf8"));
  return { result, report };
}
function collectSpecs(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []),
    ...collectSpecs(suite.suites ?? []),
  ]);
}
test("Playwright Test: quattro casi originali e cinque scansioni axe con report", async () => {
  const { result, report } = await playwrightRun();
  success(result);
  assert.equal(report.stats.expected, 4);
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.stats.flaky, 0);
  const attachments = collectSpecs(report.suites)
    .flatMap((spec) =>
      spec.tests.flatMap((t) => t.results.flatMap((r) => r.attachments)),
    )
    .filter((item) => item.name.startsWith("axe-"));
  assert.equal(attachments.length, 5);
  let incomplete = 0;
  for (const item of attachments) {
    const data = JSON.parse(
      item.path
        ? await readFile(item.path, "utf8")
        : Buffer.from(item.body, "base64").toString(),
    );
    assert.equal(data.testEngine.version, "4.14.0");
    assert.deepEqual(data.violations, []);
    incomplete += data.incomplete.length;
  }
  console.log(
    `Playwright: 4/4; cinque scansioni axe, ${incomplete} risultati incomplete da triage`,
  );
});
test("Prova negativa axe: senza lingua la scansione originale fallisce", async () => {
  const filename = path.join(browserRoot, "index.html");
  const original = browserFiles["index.html"];
  assert(original.includes('lang="it"'));
  await writeFile(filename, original.replace(' lang="it"', ""));
  try {
    success(await run(browserRoot, [viteCLI, "build"]));
    const { result, report } = await playwrightRun([
      "--grep",
      "scansione iniziale",
    ]);
    assert.equal(result.code, 1);
    assert.equal(report.stats.unexpected, 1);
    assert(JSON.stringify(report).includes("html-has-lang"));
  } finally {
    await writeFile(filename, original);
  }
});
