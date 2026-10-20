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
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
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
const runnerRoot = path.resolve(
  process.env.REACT_TESTING_TOOLCHAIN_PATH ??
    path.join(tmpdir(), "appunti-react-testing-tools"),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const { expect } = createRequire(path.join(runnerRoot, "package.json"))(
  "@playwright/test",
);
const playwright = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const React = toolRequire("react");
const { renderToStaticMarkup } = toolRequire("react-dom/server");
const d = "Design system",
  f = "Feature-based architecture",
  i = "Introduzione e Toolchain";
const trees = new Map(
  [d, f, i].map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker, lang = "jsx") {
  const matches = trees
    .get(note)
    .children.filter(
      (n) => n.type === "code" && n.lang === lang && n.value.includes(marker),
    );
  assert.equal(matches.length, 1, `${note}: ${marker}`);
  return matches[0].value;
}
function evaluate(source, loader = "jsx") {
  const module = { exports: {} };
  const { code } = transformSync(source, {
    loader,
    jsx: "automatic",
    format: "cjs",
  });
  new Function("require", "module", "exports", code)(
    toolRequire,
    module,
    module.exports,
  );
  return module.exports;
}
const model = snippet(f, "export function parseDisplayName", "js");
const { parseDisplayName } = evaluate(model, "js");
const field = snippet(d, "export function TextField");
const { TextField } = evaluate(field);
const files = {
  "package.json": snippet(i, '"react-notes-demo"', "json"),
  "vite.config.js": snippet(i, "defineConfig", "javascript"),
  "index.html": snippet(i, "<!doctype html>", "html"),
  "src/main.jsx": snippet(f, "createRoot"),
  "src/app/App.jsx": snippet(f, "export default function App"),
  "src/app/app.css": snippet(f, ".profile-form {", "css"),
  "src/shared/ui/TextField.jsx": field,
  "src/shared/ui/field.css": snippet(d, ":root {", "css"),
  "src/features/profile/index.js": snippet(f, "export { ProfileEditor }", "js"),
  "src/features/profile/ProfileEditor.jsx": snippet(
    f,
    "export function ProfileEditor",
  ),
  "src/features/profile/profileModel.js": model,
};
const dependencies = ["react", "react-dom", "vite", "@vitejs/plugin-react"];
let root, realTemp, browser, dev, preview, devURL, prodURL;
const oldNodeEnv = process.env.NODE_ENV;
const links = [];
before(async () => {
  realTemp = await realpath(tmpdir());
  root = await mkdtemp(path.join(realTemp, "appunti-react-design-"));
  for (const [name, value] of Object.entries(files)) {
    const filename = path.join(root, name);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, value);
  }
  for (const name of dependencies) {
    const link = path.join(root, "node_modules", name);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(path.join(toolsRoot, "node_modules", name), link, "junction");
    links.push(link);
  }
  // This harness exercises the original shared component, not a second implementation.
  await writeFile(
    path.join(root, "probe.html"),
    files["index.html"].replace("/src/main.jsx", "/src/probe.jsx"),
  );
  await writeFile(
    path.join(root, "src/probe.jsx"),
    `
    import { useRef, useState } from "react";
    import { createRoot } from "react-dom/client";
    import { TextField } from "./shared/ui/TextField.jsx";
    import "./shared/ui/field.css";
    const props = JSON.parse(new URLSearchParams(location.search).get("props") || "{}");
    function Probe() {
      const [value, setValue] = useState(props.initialValue || "");
      const [result, setResult] = useState("");
      const ref = useRef(null);
      return <main className="ds-theme"><h1>Field probe</h1>
        <form onSubmit={e => { e.preventDefault(); setResult(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
          <TextField {...props} label={props.label || "Campo"} name="displayName" ref={ref}
            value={value} onChange={e => setValue(e.currentTarget.value)} />
          <button type="button" onClick={() => ref.current?.focus()}>Focus</button>
          <button type="submit">Invia</button>
          <p role="status">{result}</p>
        </form>
      </main>;
    }
    createRoot(document.getElementById("root")).render(<Probe />);
  `,
  );
  const vite = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  process.env.NODE_ENV = "production";
  await vite.build({ root, logLevel: "error" });
  preview = await vite.preview({
    root,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  });
  prodURL = `http://127.0.0.1:${preview.httpServer.address().port}`;
  process.env.NODE_ENV = "development";
  dev = await vite.createServer({
    root,
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  await dev.listen();
  devURL = `http://127.0.0.1:${dev.httpServer.address().port}`;
  browser = await playwright.chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${React.version}; Vite ${vite.version}; Chrome ${browser.version()}; build reale e moduli delle note`,
  );
});
after(async () => {
  try {
    await browser?.close();
    await dev?.close();
    if (preview)
      await new Promise((resolve, reject) =>
        preview.httpServer.close((e) => (e ? reject(e) : resolve())),
      );
  } finally {
    for (const link of links) await unlink(link);
    if (root) {
      assert.equal(path.dirname(await realpath(root)), realTemp);
      assert(path.basename(root).startsWith("appunti-react-design-"));
      await rm(root, { recursive: true, force: true });
    }
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = oldNodeEnv;
  }
});
async function withPage(mode, run, { width = 1280, probe } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
  });
  const errors = [];
  try {
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    const base = mode === "production" ? prodURL : devURL;
    const url = probe
      ? `${base}/probe.html?props=${encodeURIComponent(JSON.stringify(probe))}`
      : base;
    const response = await page.goto(url);
    assert.equal(response.status(), 200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
async function dependencyGraph() {
  return (
    await build({
      absWorkingDir: root,
      entryPoints: ["src/main.jsx"],
      bundle: true,
      write: false,
      metafile: true,
      jsx: "automatic",
      outdir: "graph-output",
      logLevel: "silent",
    })
  ).metafile;
}
function boundaryViolations(meta) {
  const violations = [];
  const local = (file) =>
    path.relative(root, path.resolve(root, file)).replaceAll("\\", "/");
  for (const [name, info] of Object.entries(meta.inputs)) {
    const source = local(name);
    if (!source.startsWith("src/")) continue;
    for (const imported of info.imports) {
      if (imported.external) continue;
      const target = local(imported.path);
      const sharedUpward =
        source.startsWith("src/shared/") &&
        /^(src\/app\/|src\/features\/)/.test(target);
      const featureUpward =
        source.startsWith("src/features/") && target.startsWith("src/app/");
      const deepImport =
        source.startsWith("src/app/") &&
        target.startsWith("src/features/") &&
        target !== "src/features/profile/index.js";
      if (sharedUpward || featureUpward || deepImport)
        violations.push(`${source} -> ${target}`);
    }
  }
  return violations;
}
for (const name of [d, f])
  test(`Sintassi dei blocchi di ${name} (non esecuzione)`, () => {
    for (const n of trees.get(name).children) {
      if (n.type === "code" && ["js", "jsx", "css"].includes(n.lang))
        transformSync(n.value, { loader: n.lang });
    }
  });
for (const input of [
  null,
  undefined,
  42,
  true,
  [],
  {},
  "",
  "   ",
  "x".repeat(41),
])
  test(`Policy del demo rifiuta ${JSON.stringify(input)}`, () =>
    assert.equal(parseDisplayName(input).ok, false));
test("Policy: trim, confine UTF-16 e nessuna sanitizzazione implicita", () => {
  assert.deepEqual(parseDisplayName(" Ada "), { ok: true, value: "Ada" });
  assert.equal(parseDisplayName("x".repeat(40)).ok, true);
  assert.equal(parseDisplayName("\u{1f600}".repeat(20)).ok, true);
  assert.equal(parseDisplayName("\u{1f600}".repeat(21)).ok, false);
  assert.equal(parseDisplayName("<b>Ada</b>").value, "<b>Ada</b>");
});
test("TextField SSR: label, descrizioni presenti, required e testo escaped", () => {
  const html = renderToStaticMarkup(
    React.createElement(TextField, {
      id: "name",
      name: "displayName",
      label: "Nome",
      value: "Ada",
      onChange() {},
      hint: "Istruzione",
      error: "<b>Errore</b>",
      required: true,
    }),
  );
  assert.match(html, /for="name"/);
  assert.match(html, /aria-describedby="name-hint name-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /&lt;b&gt;Errore&lt;\/b&gt;/);
  assert.match(html, /required=""/);
});
test("TextField SSR: niente riferimenti a messaggi assenti", () => {
  const html = renderToStaticMarkup(
    React.createElement(TextField, { label: "Nome", value: "", onChange() {} }),
  );
  assert(!html.includes("aria-describedby"));
  assert(!html.includes("aria-invalid"));
});
test("Vite build ed esbuild: dipendenze reali rispettano i tre livelli", async () => {
  assert.match(
    await readFile(path.join(root, "dist/index.html"), "utf8"),
    /assets\/[^" ]+\.js/,
  );
  const graph = await dependencyGraph();
  assert.deepEqual(boundaryViolations(graph), []);
  assert(
    Object.keys(graph.inputs).some((key) =>
      key.endsWith("src/features/profile/index.js"),
    ),
  );
});
test("Un deep import compila ma il controllo del confine lo rileva", async () => {
  const file = path.join(root, "src/app/App.jsx");
  await writeFile(
    file,
    files["src/app/App.jsx"].replace(
      "../features/profile/index.js",
      "../features/profile/ProfileEditor.jsx",
    ),
  );
  try {
    assert.deepEqual(boundaryViolations(await dependencyGraph()), [
      "src/app/App.jsx -> src/features/profile/ProfileEditor.jsx",
    ]);
  } finally {
    await writeFile(file, files["src/app/App.jsx"]);
  }
});
test("Shared non deve importare la policy della feature, anche se compila", async () => {
  const file = path.join(root, "src/shared/ui/TextField.jsx");
  await writeFile(
    file,
    `import "../../features/profile/profileModel.js";\n${field}`,
  );
  try {
    assert.deepEqual(boundaryViolations(await dependencyGraph()), [
      "src/shared/ui/TextField.jsx -> src/features/profile/profileModel.js",
    ]);
  } finally {
    await writeFile(file, field);
  }
});
for (const mode of ["development", "production"]) {
  test(`${mode}: istanze indipendenti e relazioni ARIA univoche`, () =>
    withPage(mode, async (page) => {
      const forms = page.getByRole("form");
      await expect(forms).toHaveCount(2);
      await expect(forms.nth(0).getByRole("textbox")).toHaveValue("Ada");
      await expect(forms.nth(1).getByRole("textbox")).toHaveValue("");
      const ids = await page
        .locator("[id]")
        .evaluateAll((nodes) => nodes.map((n) => n.id));
      assert.equal(ids.length, new Set(ids).size);
      for (const form of [forms.nth(0), forms.nth(1)]) {
        await expect(form.getByRole("textbox")).toHaveAccessibleName(
          "Nome visualizzato (obbligatorio)",
        );
        await expect(form.getByRole("textbox")).toHaveAccessibleDescription(
          "Da 1 a 40 unita UTF-16; spazi esterni rimossi.",
        );
      }
    }));
  test(`${mode}: errore, ref/focus, correzione e submit con Enter`, () =>
    withPage(mode, async (page) => {
      const form = page.getByRole("form", { name: "Lavoro" });
      const input = form.getByRole("textbox");
      const id = await input.getAttribute("id");
      await input.fill("   ");
      await form.getByRole("button").click();
      await expect(input).toBeFocused();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveAccessibleDescription(/Inserisci da 1 a 40/);
      await expect(form.getByRole("status")).toHaveText("Nome non valido.");
      await input.fill(" Grace ");
      await expect(input).not.toHaveAttribute("aria-invalid");
      await input.press("Enter");
      await expect(input).toHaveValue("Grace");
      await expect(form.getByRole("status")).toHaveText("Nome locale: Grace");
      assert.equal(await input.getAttribute("id"), id);
      await expect(
        page.getByRole("form", { name: "Personale" }).getByRole("textbox"),
      ).toHaveValue("Ada");
    }));
  test(`${mode}: limite, testo non HTML e reload senza persistenza`, () =>
    withPage(mode, async (page) => {
      const form = page.getByRole("form", { name: "Personale" });
      const input = form.getByRole("textbox");
      await input.fill("x".repeat(41));
      await input.press("Enter");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await input.fill("<b>Ada</b>");
      await input.press("Enter");
      await expect(form.getByRole("status")).toHaveText(
        "Nome locale: <b>Ada</b>",
      );
      await expect(form.getByRole("status").locator("b")).toHaveCount(0);
      await page.reload();
      await expect(form.getByRole("textbox")).toHaveValue("Ada");
      await expect(form.getByRole("status")).toHaveText("");
    }));
  test(`${mode}: tema cambia token, non bozza o identita del campo`, () =>
    withPage(mode, async (page) => {
      const input = page
        .getByRole("form", { name: "Personale" })
        .getByRole("textbox");
      const id = await input.getAttribute("id");
      await input.fill("Bozza");
      await expect(input).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await page.getByRole("button", { name: "Tema scuro" }).click();
      await expect(input).toHaveCSS("background-color", "rgb(25, 25, 25)");
      await expect(input).toHaveCSS("color", "rgb(245, 245, 245)");
      await expect(input).toHaveValue("Bozza");
      assert.equal(await input.getAttribute("id"), id);
      await expect(
        page.getByRole("button", { name: "Tema scuro" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Tema scuro" }).press("Space");
      await expect(input).toHaveCSS("background-color", "rgb(255, 255, 255)");
    }));
  test(`${mode}: Tab e focus visibile sul campo`, () =>
    withPage(mode, async (page) => {
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "Tema scuro" }),
      ).toBeFocused();
      await page.keyboard.press("Tab");
      const input = page
        .getByRole("form", { name: "Personale" })
        .getByRole("textbox");
      await expect(input).toBeFocused();
      await expect(input).toHaveCSS("outline-style", "solid");
      await expect(input).toHaveCSS("outline-width", "3px");
    }));
  test(`${mode}: axe su errore in tema chiaro e scuro`, () =>
    withPage(mode, async (page) => {
      await page
        .getByRole("form", { name: "Lavoro" })
        .getByRole("button")
        .click();
      await page.addScriptTag({
        path: toolRequire.resolve("axe-core/axe.min.js"),
      });
      for (const dark of [false, true]) {
        if (dark)
          await page.getByRole("button", { name: "Tema scuro" }).click();
        const result = await page.evaluate(() =>
          axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          }),
        );
        assert.deepEqual(result.violations, []);
        console.log(
          `axe ${mode} dark=${dark}: ${result.violations.length} violazioni, ${result.incomplete.length} incomplete`,
        );
      }
    }));
}
test("Probe: required nativo blocca il vuoto; ref, name e FormData funzionano", () =>
  withPage(
    "development",
    async (page) => {
      const input = page.getByRole("textbox");
      await page.getByRole("button", { name: "Invia" }).click();
      await expect(page.getByRole("status")).toHaveText("");
      assert.equal(await input.evaluate((n) => n.validity.valueMissing), true);
      await input.fill("Testo");
      await page.getByRole("button", { name: "Focus", exact: true }).click();
      await expect(input).toBeFocused();
      await page.getByRole("button", { name: "Invia" }).click();
      await expect(page.getByRole("status")).toHaveText(
        '{"displayName":"Testo"}',
      );
    },
    { probe: { required: true, id: "explicit-name" } },
  ));
test("Probe: disabled escluso da Tab e FormData", () =>
  withPage(
    "development",
    async (page) => {
      await expect(page.getByRole("textbox")).toBeDisabled();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "Focus", exact: true }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Invia" }).click();
      await expect(page.getByRole("status")).toHaveText("{}");
    },
    { probe: { disabled: true, initialValue: "Non inviato" } },
  ));
test("Probe: messaggi lunghi e HTML rimangono testo a 320px", () =>
  withPage(
    "development",
    async (page) => {
      await expect(page.getByRole("textbox")).toHaveAccessibleDescription(
        /<b>Errore<\/b>/,
      );
      await expect(page.locator("main b")).toHaveCount(0);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    },
    {
      width: 320,
      probe: {
        label: "L".repeat(100),
        hint: "H".repeat(120),
        error: "<b>Errore</b>",
      },
    },
  ));
for (const width of [320, 390, 1440])
  test(`Produzione responsive a ${width}px nei due temi`, () =>
    withPage(
      "production",
      async (page) => {
        for (const dark of [false, true]) {
          if (dark)
            await page.getByRole("button", { name: "Tema scuro" }).click();
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          for (const input of await page.getByRole("textbox").all()) {
            const box = await input.boundingBox();
            assert(box.width > 0 && box.x >= 0 && box.x + box.width <= width);
          }
        }
      },
      { width },
    ));
