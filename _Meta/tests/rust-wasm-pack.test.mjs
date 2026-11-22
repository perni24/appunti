import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const webpack = require(process.env.WEBPACK_MODULE_PATH || "webpack");
const tree = parseNote("Programmazione/Rust/Pagine/wasm-pack.md").tree;
const blocks = tree.children.filter((n) => n.type === "code");
const block = (lang, start = "") => {
  const matches = blocks.filter(
    (b) => b.lang === lang && b.value.startsWith(start),
  );
  assert.equal(matches.length, 1, lang + " " + start);
  return matches[0].value;
};

test("wasm-pack: tre pacchetti dalla stessa crate del Markdown", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-wasm-pack-qa-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const run = (exe, args) =>
    execFileSync(exe, args, {
      cwd: dir,
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  const file = (name) => path.join(dir, name);
  fs.mkdirSync(file("src"));
  for (const [name, content] of [
    ["Cargo.toml", block("toml")],
    ["src/lib.rs", block("rust")],
    ["index.html", block("html")],
    ["prova.cjs", block("javascript", "const ")],
    ["app.mjs", block("javascript", "import ")],
    ["webpack.config.cjs", block("javascript", "module.exports")],
  ])
    fs.writeFileSync(file(name), content);
  const cli = process.env.WASM_PACK_CLI || "wasm-pack";
  console.log(
    run(cli, ["--version"]),
    "webpack",
    webpack.version,
    "Node",
    process.version,
  );
  for (const target of ["web", "nodejs", "bundler"]) {
    const command = block("sh", "wasm-pack build --dev --target " + target);
    run(cli, command.split(/\s+/).slice(1));
  }
  await t.test(
    "target nodejs: il consumatore CommonJS usa il manifest senza init",
    () => {
      assert.equal(run(process.execPath, ["prova.cjs"]), "0.1.0: 3");
      const scores = run(process.execPath, [
        "-e",
        'const {score_text:f}=require("./pkg-node");console.log(JSON.stringify(["","  ","é é","hello from rust"].map(f)))',
      ]);
      assert.deepEqual(JSON.parse(scores), [0, 0, 4, 13]);
    },
  );
  await t.test(
    "anteprima npm: identità, entry point, tipi e binario inclusi",
    () => {
      const args = block("sh", "npm pack ")
        .split(" ")
        .slice(1)
        .concat("--json");
      const json =
        process.platform === "win32"
          ? run(process.env.ComSpec, ["/d", "/c", "npm", ...args])
          : run("npm", args);
      const [preview] = JSON.parse(json);
      assert.equal(preview.name, "testo-wasm");
      assert.equal(preview.version, "0.1.0");
      const names = new Set(preview.files.map((f) => f.path));
      const manifest = JSON.parse(
        fs.readFileSync(file("pkg-node/package.json"), "utf8"),
      );
      for (const name of [
        manifest.main,
        manifest.types,
        "testo_wasm_bg.wasm",
        "package.json",
      ])
        assert.ok(names.has(name), name);
      assert.ok(!fs.readdirSync(dir).some((name) => name.endsWith(".tgz")));
    },
  );

  const config = require(file("webpack.config.cjs"));
  const compiler = webpack({
    ...config,
    context: dir,
    output: { ...config.output, path: file("dist") },
  });
  try {
    const stats = await new Promise((ok, fail) =>
      compiler.run((err, stats) => (err ? fail(err) : ok(stats))),
    );
    assert.ok(!stats.hasErrors(), stats.toString({ all: false, errors: true }));
  } finally {
    await new Promise((ok, fail) =>
      compiler.close((err) => (err ? fail(err) : ok())),
    );
  }
  const html = tree.children
    .flatMap((n) => n.children || [])
    .find((n) => n.type === "inlineCode" && n.value.startsWith("<output "));
  assert.ok(html, "pagina di prova per il bundle");
  const assets = new Map([
    ["/", ["text/html; charset=utf-8", fs.readFileSync(file("index.html"))]],
    ["/bundle.html", ["text/html; charset=utf-8", html.value]],
  ]);
  for (const folder of ["pkg-web", "dist"]) {
    for (const name of fs
      .readdirSync(file(folder))
      .filter((n) => /\.(js|wasm)$/.test(n))) {
      assets.set("/" + folder + "/" + name, [
        name.endsWith(".wasm") ? "application/wasm" : "text/javascript",
        fs.readFileSync(file(path.join(folder, name))),
      ]);
    }
  }
  const server = createServer((req, res) => {
    const a = assets.get(req.url);
    if (!a) return res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": a[0] }).end(a[1]);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || "chrome",
    });
    try {
      for (const [url, prefix] of [
        ["/", "/pkg-web/"],
        ["/bundle.html", "/dist/"],
      ]) {
        await t.test("Chrome carica il binario da " + prefix, async () => {
          const page = await browser.newPage();
          try {
            const wasm = [];
            const errors = [];
            page.on("response", (r) => {
              if (new URL(r.url()).pathname.endsWith(".wasm"))
                wasm.push([new URL(r.url()).pathname, r.status()]);
            });
            page.on("pageerror", (e) => errors.push(e.message));
            await page.goto("http://127.0.0.1:" + server.address().port + url);
            await page.waitForFunction(
              () =>
                document.querySelector("#score")?.textContent === "0.1.0: 3",
              null,
              { timeout: 8000 },
            );
            assert.deepEqual(errors, []);
            assert.equal(wasm.length, 1);
            assert.ok(wasm[0][0].startsWith(prefix));
            assert.equal(wasm[0][1], 200);
          } finally {
            await page.close();
          }
        });
      }
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((done) => server.close(done));
  }
});
