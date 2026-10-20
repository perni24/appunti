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
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");
const toolRoot = await realpath(
  path.resolve(
    process.env.REACT_STORYBOOK_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-storybook-tools"),
  ),
);
const s = "Storybook",
  v = "Visual regression testing";
const trees = new Map(
  [s, v].map((name) => [
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
const files = {
  ".storybook/main.js": snippet(s, "stories:"),
  ".storybook/preview.js": snippet(s, 'import "../src/button.css"'),
  "vitest.storybook.config.js": snippet(s, "storybookTest"),
  "src/Button.jsx": snippet(s, "export function Button", "jsx"),
  "src/Button.stories.jsx": snippet(s, "export const Activated", "jsx"),
  "src/button.css": snippet(s, ".button {", "css"),
  "playwright.visual.config.js": snippet(v, "webServer:"),
  "visual/button.spec.js": snippet(v, "const cases ="),
  ".gitignore": snippet(v, "storybook-static/", "gitignore"),
};
const versions = {
  storybook: "10.6.2",
  "@storybook/react-vite": "10.6.2",
  "@storybook/addon-docs": "10.6.2",
  "@storybook/addon-vitest": "10.6.2",
  vitest: "5.0.5",
  "@vitest/browser-playwright": "5.0.5",
  react: "19.3.0",
  "react-dom": "19.3.0",
  vite: "8.3.4",
  "@vitejs/plugin-react": "6.1.2",
  "@playwright/test": "1.62.1",
  playwright: "1.62.1",
  "http-server": "14.1.1",
};
let root, realTemp;
const links = [],
  children = new Set();
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-storybook-"));
  const scripts = {
    ...JSON.parse(snippet(s, '"scripts"', "json")).scripts,
    ...JSON.parse(snippet(v, '"scripts"', "json")).scripts,
  };
  for (const [name, value] of Object.entries({
    ...files,
    "package.json": JSON.stringify({
      private: true,
      type: "module",
      scripts,
      devDependencies: versions,
    }),
  })) {
    const file = path.join(root, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, value);
  }
  for (const name of Object.keys(versions)) {
    const link = path.join(root, "node_modules", name);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(path.join(toolRoot, "node_modules", name), link, "junction");
    links.push(link);
  }
  // Only the fixture needs permission to serve its external package junctions.
  await writeFile(
    path.join(root, "vitest.fixture.config.js"),
    `import { mergeConfig } from "vitest/config";\nimport base from "./vitest.storybook.config.js";\nexport default mergeConfig(base, { server: { fs: { allow: ${JSON.stringify([root, toolRoot])} } } });\n`,
  );
  console.log(
    `Fixture ${root}; Storybook 10.6.2, Vitest 5.0.5, Playwright Test 1.62.1`,
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
async function run(args, extra = {}, timeout = 120_000) {
  const env = {
    ...process.env,
    CI: "1",
    STORYBOOK_DISABLE_TELEMETRY: "1",
    BROWSER_CHANNEL: "chrome",
    ...extra,
  };
  delete env.NODE_ENV;
  delete env.ELECTRON_RUN_AS_NODE;
  return new Promise((resolve, reject) => {
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
    child.stdout.on("data", (c) => (stdout += c));
    child.stderr.on("data", (c) => (stderr += c));
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
        reject(new Error(`Timeout ${args.join(" ")}\n${stdout}\n${stderr}`));
      else resolve({ code, stdout, stderr });
    });
  });
}
function success(result) {
  assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
}
async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function cli(name) {
  const pkg = JSON.parse(
    await readFile(
      path.join(toolRoot, "node_modules", name, "package.json"),
      "utf8",
    ),
  );
  const bin = typeof pkg.bin === "string" ? pkg.bin : Object.values(pkg.bin)[0];
  return path.join(toolRoot, "node_modules", name, bin);
}
async function build() {
  return run(
    [await cli("storybook"), "build", "--quiet", "--disable-telemetry"],
    {},
    180_000,
  );
}
async function vitestRun() {
  const output = path.join(root, "vitest-results.json");
  const result = await run([
    await cli("vitest"),
    "run",
    "--config",
    "vitest.fixture.config.js",
    "--reporter=json",
    `--outputFile=${output}`,
  ]);
  return { result, report: JSON.parse(await readFile(output, "utf8")) };
}
async function visualRun(args = []) {
  const output = path.join(root, "playwright-results.json");
  const result = await run(
    [
      await cli("@playwright/test"),
      "test",
      "--config",
      "playwright.visual.config.js",
      "--reporter=json",
      ...args,
    ],
    {
      TEST_PORT: String(await freePort()),
      PLAYWRIGHT_JSON_OUTPUT_FILE: output,
    },
  );
  return { result, report: JSON.parse(await readFile(output, "utf8")) };
}
async function pngs(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const e of entries) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) result.push(...(await pngs(file)));
    else if (file.endsWith(".png")) result.push(file);
  }
  return result.sort();
}
async function baselineHashes() {
  const result = {};
  for (const file of await pngs(path.join(root, "visual/__screenshots__")))
    result[path.relative(root, file)] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  return result;
}
after(async () => {
  for (const child of children) await kill(child);
  for (const link of links) await unlink(link);
  if (root) {
    assert.equal(path.dirname(await realpath(root)), realTemp);
    assert(path.basename(root).startsWith("appunti-react-storybook-"));
    await rm(root, { recursive: true, force: true });
  }
});

test("Sintassi degli snippet JS, JSX, CSS e JSON (non esecuzione)", () => {
  for (const tree of trees.values())
    for (const n of tree.children) {
      if (n.type !== "code") continue;
      if (n.lang === "json") JSON.parse(n.value);
      else if (["js", "jsx", "css"].includes(n.lang))
        transformSync(n.value, { loader: n.lang });
    }
});
test("Versioni effettive della toolchain isolata", async () => {
  for (const [name, expected] of Object.entries(versions)) {
    const pkg = JSON.parse(
      await readFile(
        path.join(toolRoot, "node_modules", name, "package.json"),
        "utf8",
      ),
    );
    assert.equal(pkg.version, expected, name);
  }
});
test("Vitest browser: cinque storie originali, play positivo e disabled", async () => {
  const { result, report } = await vitestRun();
  success(result);
  assert.equal(report.numTotalTests, 5);
  assert.equal(report.numPassedTests, 5);
  assert.equal(report.numFailedTests, 0);
  assert.equal(report.numPendingTests, 0);
});
test("Controllo negativo: la play rileva il callback rimosso", async () => {
  const file = path.join(root, "src/Button.jsx");
  await writeFile(
    file,
    files["src/Button.jsx"].replace("onClick={onClick}", "onClick={undefined}"),
  );
  try {
    const { result, report } = await vitestRun();
    assert.equal(result.code, 1);
    assert.equal(report.numFailedTests, 1);
    assert.equal(report.numPassedTests, 4);
    const tests = report.testResults.flatMap((r) => r.assertionResults);
    assert(
      tests.some((r) => r.status === "failed" && /activated/i.test(r.fullName)),
    );
  } finally {
    await writeFile(file, files["src/Button.jsx"]);
  }
});
test("Storybook build reale: catalogo, iframe e cinque ID esatti", async () => {
  success(await build());
  const index = JSON.parse(
    await readFile(path.join(root, "storybook-static/index.json"), "utf8"),
  );
  const ids = Object.values(index.entries)
    .filter((e) => e.type === "story")
    .map((e) => e.id)
    .sort();
  assert.deepEqual(
    ids,
    ["activated", "disabled", "long-label", "primary", "secondary"]
      .map((id) => `ui-button--${id}`)
      .sort(),
  );
  assert(index.entries["ui-button--docs"]);
  assert.match(
    await readFile(path.join(root, "storybook-static/iframe.html"), "utf8"),
    /storybook-root/,
  );
  assert.match(
    await readFile(path.join(root, "storybook-static/index.html"), "utf8"),
    /<!doctype html>/i,
  );
});
test("Baseline assente: fallimento senza creazione automatica", async () => {
  const { result, report } = await visualRun([
    "--project=desktop",
    "--grep=Button primary",
  ]);
  assert.equal(result.code, 1);
  assert.equal(report.stats.unexpected, 1);
  assert.match(JSON.stringify(report), /snapshot.*exist|snapshot.*missing/i);
  assert.deepEqual(await baselineHashes(), {});
});
test("Creazione esplicita: sei PNG per tre casi e due viewport", async () => {
  const { result, report } = await visualRun(["--update-snapshots=all"]);
  success(result);
  assert.equal(report.stats.expected, 6);
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.stats.flaky, 0);
  const images = await pngs(path.join(root, "visual/__screenshots__"));
  assert.equal(images.length, 6);
  for (const file of images) {
    const png = await readFile(file);
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    const mobile = file.includes(`${path.sep}mobile${path.sep}`);
    assert.equal(png.readUInt32BE(16), mobile ? 390 : 1280);
    assert.equal(png.readUInt32BE(20), mobile ? 844 : 720);
  }
});
test("Confronto reale: sei screenshot uguali senza riscrivere baseline", async () => {
  const before = await baselineHashes();
  const { result, report } = await visualRun();
  success(result);
  assert.equal(report.stats.expected, 6);
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.stats.flaky, 0);
  assert.deepEqual(await baselineHashes(), before);
});
test("Regressione CSS rilevata: diff prodotto, baseline intatte, ripristino verde", async () => {
  const file = path.join(root, "src/button.css");
  const before = await baselineHashes();
  await writeFile(
    file,
    `${files["src/button.css"]}\n.button--primary { background: #cc0022; }\n`,
  );
  try {
    success(await build());
    const { result, report } = await visualRun([
      "--project=desktop",
      "--grep=Button primary",
    ]);
    assert.equal(result.code, 1);
    assert.equal(report.stats.unexpected, 1);
    assert(
      (await pngs(path.join(root, "test-results"))).some((file) =>
        file.endsWith("-diff.png"),
      ),
    );
    assert.deepEqual(await baselineHashes(), before);
  } finally {
    await writeFile(file, files["src/button.css"]);
  }
  success(await build());
  const restored = await visualRun([
    "--project=desktop",
    "--grep=Button primary",
  ]);
  success(restored.result);
  assert.equal(restored.report.stats.expected, 1);
  assert.deepEqual(await baselineHashes(), before);
});
