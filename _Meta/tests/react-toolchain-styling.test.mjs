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
    process.env.REACT_TOOLCHAIN_PATH ??
      path.join(tmpdir(), "appunti-react-tools"),
  ),
);
const toolRequire = createRequire(path.join(toolsRoot, "package.json"));
const postcss = toolRequire("postcss");
const playwright = require(process.env.PLAYWRIGHT_MODULE_PATH ?? "playwright");
const intro = "Introduzione e Toolchain";
const profiler = "Profiler e Debugging";
const modules = "CSS Modules";
const styling = "Styling base";
const trees = new Map(
  [intro, profiler, modules, styling].map((name) => [
    name,
    parseNote(`Programmazione/React/Pagine/${name}.md`).tree,
  ]),
);
function snippet(note, marker, lang = "jsx") {
  const matches = trees
    .get(note)
    .children.filter(
      (node) =>
        node.type === "code" &&
        node.lang === lang &&
        node.value.includes(marker),
    );
  assert.equal(matches.length, 1, `${note}: ${marker}`);
  return matches[0].value;
}
for (const note of [profiler, modules, styling]) {
  test(`Sintassi JSX/CSS: ${note} (schemi inclusi, non esecuzione)`, () => {
    for (const node of trees
      .get(note)
      .children.filter((node) => node.type === "code")) {
      if (node.lang === "jsx")
        transformSync(node.value, { loader: "jsx", jsx: "automatic" });
      if (node.lang === "css") postcss.parse(node.value);
    }
  });
}

const definitions = {
  profiler: { "src/App.jsx": snippet(profiler, "function SearchPanel") },
  modules: {
    "src/App.jsx": snippet(modules, "const [selected, setSelected]"),
    "src/App.module.css": snippet(modules, ".card :global", "css"),
    "src/Button.jsx": snippet(modules, "const localClass"),
    "src/Button.module.css": snippet(modules, "composes: root", "css"),
    "src/tokens.css": snippet(modules, ":root", "css"),
  },
  styling: {
    "src/App.jsx": snippet(styling, "function handleSubmit"),
    "src/styles.css": snippet(styling, ".preferences-form", "css"),
  },
};
const dependencyLinks = ["react", "react-dom", "vite", "@vitejs/plugin-react"];
const fixtures = new Map();
const originalNodeEnv = process.env.NODE_ENV;
let realTemp, fixtureBase, browser;
before(async () => {
  realTemp = await realpath(tmpdir());
  fixtureBase = await mkdtemp(path.join(realTemp, "appunti-react-styling-"));
  if (process.env.REACT_QA_DIR)
    await mkdir(process.env.REACT_QA_DIR, { recursive: true });
  const vite = await import(
    pathToFileURL(path.join(toolsRoot, "node_modules/vite/dist/node/index.js"))
  );
  for (const [name, files] of Object.entries(definitions)) {
    const root = path.join(fixtureBase, name);
    const fixture = { root };
    fixtures.set(name, fixture);
    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, "node_modules/@vitejs"), { recursive: true });
    for (const dependency of dependencyLinks) {
      await symlink(
        path.join(toolsRoot, "node_modules", dependency),
        path.join(root, "node_modules", dependency),
        process.platform === "win32" ? "junction" : "dir",
      );
    }
    const allFiles = {
      "package.json": snippet(intro, '"react-notes-demo"', "json"),
      "vite.config.js": snippet(intro, "defineConfig", "javascript"),
      "index.html": snippet(intro, "<!doctype html>", "html"),
      "src/main.jsx": snippet(intro, "import { StrictMode }"),
      ...files,
    };
    for (const [file, content] of Object.entries(allFiles))
      await writeFile(path.join(root, file), content);
    process.env.NODE_ENV = "production";
    await vite.build({ root, logLevel: "error" });
    fixture.preview = await vite.preview({
      root,
      logLevel: "error",
      preview: { host: "127.0.0.1", port: 0 },
    });
    fixture.productionUrl = `http://127.0.0.1:${fixture.preview.httpServer.address().port}`;
  }
  // Vite build sets NODE_ENV: do not let the dev servers inherit production mode.
  process.env.NODE_ENV = "development";
  for (const fixture of fixtures.values()) {
    fixture.dev = await vite.createServer({
      root: fixture.root,
      mode: "development",
      logLevel: "error",
      server: { host: "127.0.0.1", port: 0 },
    });
    assert.equal(fixture.dev.config.isProduction, false);
    await fixture.dev.listen();
    fixture.url = `http://127.0.0.1:${fixture.dev.httpServer.address().port}`;
  }
  browser = await playwright.chromium.launch({
    channel: process.env.BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  console.log(
    `React ${toolRequire("react").version}; Vite ${vite.version}; Chrome ${browser.version()}`,
  );
});
after(async () => {
  try {
    await browser?.close();
    for (const fixture of fixtures.values()) {
      if (fixture.preview)
        await new Promise((resolve, reject) =>
          fixture.preview.httpServer.close((error) =>
            error ? reject(error) : resolve(),
          ),
        );
      await fixture.dev?.close();
    }
  } finally {
    if (fixtureBase) {
      const resolved = await realpath(fixtureBase);
      assert.equal(path.dirname(resolved), realTemp);
      assert.ok(path.basename(resolved).startsWith("appunti-react-styling-"));
      for (const fixture of fixtures.values()) {
        assert.equal(path.dirname(await realpath(fixture.root)), resolved);
        // Unlink junctions before removing only the verified local fixture tree.
        for (const dependency of dependencyLinks)
          await unlink(
            path.join(fixture.root, "node_modules", dependency),
          ).catch((error) => {
            if (error.code !== "ENOENT") throw error;
          });
      }
      await rm(resolved, { recursive: true, force: true });
    }
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
async function withPage(
  name,
  run,
  { production = false, width = 1280, reducedMotion = "no-preference" } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion,
  });
  try {
    await context.addInitScript(() => {
      window.profileSamples = [];
      const original = console.log;
      console.log = (...args) => {
        if (args[0] === "[react-profile]") window.profileSamples.push(args[1]);
        original(...args);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    const fixture = fixtures.get(name);
    await page.goto(production ? fixture.productionUrl : fixture.url);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function css(locator, property) {
  return locator.evaluate(
    (element, property) => getComputedStyle(element).getPropertyValue(property),
    property,
  );
}
async function screenshot(page, name) {
  if (process.env.REACT_QA_DIR)
    await page.screenshot({
      path: path.join(process.env.REACT_QA_DIR, name + ".png"),
      fullPage: true,
    });
}

for (const name of Object.keys(definitions)) {
  test(`Build Vite reale: ${name}, asset prodotti`, async () => {
    const html = await readFile(
      path.join(fixtures.get(name).root, "dist/index.html"),
      "utf8",
    );
    assert.match(html, /assets\/index-.*\.js/);
    if (name !== "profiler") {
      assert.match(html, /assets\/index-.*\.css/);
      const files = await readdir(
        path.join(fixtures.get(name).root, "dist/assets"),
      );
      assert.ok(files.some((file) => file.endsWith(".css")));
    }
  });
}
test("Profiler dev: mount/update e campi numerici senza soglie di velocita", () =>
  withPage("profiler", async (page) => {
    await page.waitForFunction(() => window.profileSamples.length > 0);
    await page.getByLabel("Cerca voci").fill("voce 20");
    await page.waitForFunction(() =>
      window.profileSamples.some((sample) => sample.phase === "update"),
    );
    const samples = await page.evaluate(() => window.profileSamples);
    assert.ok(samples.some((sample) => sample.phase === "mount"));
    for (const sample of samples) {
      assert.equal(sample.id, "SearchPanel");
      assert.ok(["mount", "update", "nested-update"].includes(sample.phase));
      for (const field of [
        "actualDuration",
        "baseDuration",
        "startTime",
        "commitTime",
      ])
        assert.ok(Number.isFinite(sample[field]) && sample[field] >= 0);
      assert.ok(sample.commitTime >= sample.startTime);
    }
  }));
for (const production of [false, true]) {
  test(`Profiler ${production ? "produzione" : "dev"}: filtro, vuoto e reset`, () =>
    withPage(
      "profiler",
      async (page) => {
        assert.equal(await page.locator("li").count(), 200);
        await page.getByLabel("Cerca voci").fill(" VOCE 20 ");
        assert.deepEqual(await page.locator("li").allTextContents(), [
          "Voce 20",
          "Voce 200",
        ]);
        await page.getByLabel("Cerca voci").fill("nessuna corrispondenza");
        await page.getByText("Nessuna voce", { exact: true }).waitFor();
        assert.equal(
          await page.getByRole("status").textContent(),
          "Risultati: 0",
        );
        await button(page, "Azzera filtro").click();
        assert.equal(await page.locator("li").count(), 200);
        if (production)
          assert.deepEqual(
            await page.evaluate(() => window.profileSamples),
            [],
          );
      },
      { production },
    ));

  test(`CSS Modules ${production ? "produzione" : "dev"}: nomi distinti e composes`, () =>
    withPage(
      "modules",
      async (page) => {
        const main = (await page.locator("main").getAttribute("class")).split(
          /\s+/,
        );
        const primary = (
          await button(page, "Seleziona scheda").getAttribute("class")
        ).split(/\s+/);
        const secondary = (
          await button(page, "Elimina (non disponibile)").getAttribute("class")
        ).split(/\s+/);
        assert.equal(secondary.length, 1);
        assert.equal(primary.length, 2);
        assert.ok(primary.includes(secondary[0]));
        assert.ok(main.every((name) => !primary.includes(name)));
        assert.ok(![...main, ...primary].includes("root"));
        assert.equal(
          await css(button(page, "Seleziona scheda"), "background-color"),
          "rgb(23, 107, 70)",
        );
        assert.equal(
          await css(button(page, "Seleziona scheda"), "padding-top"),
          "8px",
        );
      },
      { production },
    ));

  test(`CSS Modules ${production ? "produzione" : "dev"}: selezione, testo e ARIA`, () =>
    withPage(
      "modules",
      async (page) => {
        const border = await css(page.locator("article"), "border-top-color");
        await button(page, "Seleziona scheda").click();
        assert.equal(
          await button(page, "Seleziona scheda").getAttribute("aria-pressed"),
          "true",
        );
        assert.equal(
          await page.getByRole("status").textContent(),
          "Scheda selezionata",
        );
        assert.equal(
          await css(page.locator("article"), "border-top-color"),
          "rgb(23, 107, 70)",
        );
        await button(page, "Seleziona scheda").click();
        assert.equal(
          await css(page.locator("article"), "border-top-color"),
          border,
        );
        assert.equal(
          await button(page, "Seleziona scheda").getAttribute("aria-pressed"),
          "false",
        );
      },
      { production },
    ));

  test(`Styling ${production ? "produzione" : "dev"}: tema locale, variabile e reset`, () =>
    withPage(
      "styling",
      async (page) => {
        const bodyBackground = await css(
          page.locator("body"),
          "background-color",
        );
        await page
          .getByRole("combobox", { name: /^Tema/ })
          .selectOption("dark");
        assert.equal(
          await css(page.locator("main"), "background-color"),
          "rgb(32, 38, 34)",
        );
        assert.equal(
          await css(page.locator("body"), "background-color"),
          bodyBackground,
        );
        assert.equal(await css(page.locator("main"), "color-scheme"), "dark");
        await page.getByRole("slider").fill("24");
        assert.equal(await css(page.locator("form"), "row-gap"), "24px");
        await button(page, "Salva preferenze").click();
        assert.equal(
          await page.getByRole("status").textContent(),
          "Preferenze applicate localmente.",
        );
        await screenshot(page, `styling-${production ? "prod" : "dev"}-dark`);
        await button(page, "Ripristina").click();
        assert.equal(await page.getByRole("slider").inputValue(), "16");
        assert.equal(
          await page.getByRole("combobox", { name: /^Tema/ }).inputValue(),
          "light",
        );
        assert.equal(await css(page.locator("form"), "row-gap"), "16px");
        assert.equal(await page.getByRole("status").textContent(), "");
      },
      { production },
    ));

  test(`Styling ${production ? "produzione" : "dev"}: disabled reale e reset`, () =>
    withPage(
      "styling",
      async (page) => {
        await page.getByLabel("Blocca salvataggio").check();
        const save = button(page, "Salva preferenze");
        assert.equal(await save.isDisabled(), true);
        assert.equal(await css(save, "opacity"), "0.55");
        await save.evaluate((element) => element.click());
        await page.locator("form").evaluate((form) => form.requestSubmit());
        assert.equal(await page.getByRole("status").textContent(), "");
        await button(page, "Ripristina").click();
        assert.equal(await save.isDisabled(), false);
        assert.equal(
          await page.getByLabel("Blocca salvataggio").isChecked(),
          false,
        );
      },
      { production },
    ));
}
test("CSS Modules: global raggiunge il pulsante e le variabili sono ereditate", () =>
  withPage("modules", async (page) => {
    await page.addStyleTag({ content: "button { font-style: italic; }" });
    assert.equal(
      await css(button(page, "Seleziona scheda"), "font-style"),
      "italic",
    );
    await page
      .locator("main")
      .evaluate((element) =>
        element.style.setProperty("--color-accent", "rgb(11, 22, 33)"),
      );
    assert.equal(
      await css(button(page, "Seleziona scheda"), "background-color"),
      "rgb(11, 22, 33)",
    );
    await button(page, "Seleziona scheda").click();
    assert.equal(
      await css(page.locator("article"), "border-top-color"),
      "rgb(11, 22, 33)",
    );
  }));
test("CSS Modules: global discendente non colpisce una label esterna", () =>
  withPage("modules", async (page) => {
    await page.evaluate(() => {
      const label = document.createElement("p");
      label.className = "external-label";
      label.id = "outside";
      label.textContent = "Esterno";
      document.body.append(label);
    });
    assert.equal(
      await css(page.locator("article .external-label"), "font-weight"),
      "700",
    );
    assert.equal(await css(page.locator("#outside"), "font-weight"), "400");
  }));
test("CSS Modules: focus tastiera e pulsante disabled escluso dalla tabulazione", () =>
  withPage("modules", async (page) => {
    await page.keyboard.press("Tab");
    const selected = button(page, "Seleziona scheda");
    assert.equal(
      await selected.evaluate(
        (element) =>
          element === document.activeElement &&
          element.matches(":focus-visible"),
      ),
      true,
    );
    assert.equal(await css(selected, "outline-width"), "3px");
    const disabled = button(page, "Elimina (non disponibile)");
    assert.equal(await disabled.isDisabled(), true);
    await page.keyboard.press("Tab");
    assert.equal(
      await disabled.evaluate((element) => element === document.activeElement),
      false,
    );
  }));
test("Styling: focus, hover e transizione attiva", () =>
  withPage("styling", async (page) => {
    await page.keyboard.press("Tab");
    const select = page.getByRole("combobox", { name: /^Tema/ });
    assert.equal(
      await select.evaluate((element) => element === document.activeElement),
      true,
    );
    assert.equal(await css(select, "outline-width"), "3px");
    const reset = button(page, "Ripristina");
    assert.equal(await css(reset, "transition-duration"), "0.12s");
    await reset.hover();
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find(
        (element) => element.textContent.trim() === "Ripristina",
      );
      return (
        getComputedStyle(button).borderTopColor ===
        getComputedStyle(button).color
      );
    });
  }));
test("Styling: reduced motion disattiva la transizione", () =>
  withPage(
    "styling",
    async (page) => {
      assert.equal(
        await css(button(page, "Ripristina"), "transition-duration"),
        "0s",
      );
    },
    { production: true, reducedMotion: "reduce" },
  ));
for (const name of ["modules", "styling"]) {
  for (const width of [320, 390, 1440]) {
    test(`Responsive produzione: ${name} a ${width}px`, () =>
      withPage(
        name,
        async (page) => {
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          if (name === "styling") {
            const fieldRects = await page
              .locator(".preferences-field")
              .evaluateAll((nodes) =>
                nodes.map((node) => ({
                  top: node.getBoundingClientRect().top,
                  left: node.getBoundingClientRect().left,
                })),
              );
            assert.equal(fieldRects[0].top === fieldRects[1].top, width > 560);
          }
          await screenshot(page, `${name}-${width}`);
          await page.addStyleTag({ content: "html { font-size: 200%; }" });
          await page.getByRole("heading", { level: 1 }).evaluate((element) => {
            element.textContent = "PreferenzeConUnNomeMoltoLungoSenzaSpazi";
          });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          for (const control of await page.getByRole("button").all()) {
            assert.equal(
              await control.evaluate(
                (element) => element.scrollWidth <= element.clientWidth + 1,
              ),
              true,
            );
          }
        },
        { production: true, width },
      ));
  }
}
