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
const tree = parseNote(
  "Programmazione/Rust/Pagine/Limiti del runtime WebAssembly.md",
).tree;
function block(lang, prefix = "") {
  const matches = tree.children.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.startsWith(prefix),
  );
  assert.equal(matches.length, 1, lang + " " + prefix);
  return matches[0].value;
}

test("limiti del runtime: stesso sorgente, host diversi", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-wasm-limits-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const file = (name) => path.join(dir, name);
  const run = (cmd, args) =>
    execFileSync(cmd, args, { cwd: dir, encoding: "utf8", windowsHide: true });
  fs.writeFileSync(file("limiti.rs"), block("rust"));
  fs.writeFileSync(file("index.html"), block("html"));
  fs.writeFileSync(file("config.json"), block("json"));
  run("rustc", block("sh", "rustc ").split(/\s+/).slice(1));
  await t.test(
    "lo stesso core nativo legge il file, e wasm32 da solo non identifica il browser",
    () => {
      fs.writeFileSync(
        file("native.rs"),
        'include!("limiti.rs"); fn main() { println!("{} {}",compute_score(40,2),config_is_readable()); }',
      );
      const exe = file(process.platform === "win32" ? "native.exe" : "native");
      run("rustc", ["--edition=2024", "native.rs", "-o", exe]);
      assert.equal(run(exe, []).trim(), "42 true");
      for (const [target, osName] of [
        ["wasm32-unknown-unknown", "unknown"],
        ["wasm32-wasip1", "wasi"],
      ]) {
        const cfg = run("rustc", ["--print", "cfg", "--target", target]).split(
          /\r?\n/,
        );
        assert.ok(cfg.includes('target_arch="wasm32"'));
        assert.ok(cfg.includes('target_os="' + osName + '"'));
      }
    },
  );
  const assets = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/limiti.wasm", ["limiti.wasm", "application/wasm"]],
    ["/config.json", ["config.json", "application/json"]],
  ]);
  const server = createServer((req, res) => {
    const a = assets.get(req.url);
    if (!a) return res.writeHead(404).end();
    res
      .writeHead(200, { "Content-Type": a[1], "Cache-Control": "no-store" })
      .end(fs.readFileSync(file(a[0])));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || "chrome",
    });
    try {
      console.log(
        run("rustc", ["--version"]).trim(),
        "Chrome",
        browser.version(),
      );
      const page = await browser.newPage();
      const base = "http://127.0.0.1:" + server.address().port;
      async function loadPage() {
        await page.goto(base);
        await page.waitForFunction(
          () => document.querySelector("#esito")?.textContent,
          null,
          { timeout: 8000 },
        );
        return page.locator("#esito").textContent();
      }
      await t.test(
        "output del Markdown e nuova configurazione senza ricompilare",
        async () => {
          assert.equal(await loadPage(), block("text"));
          fs.writeFileSync(file("config.json"), JSON.stringify({ base: 5 }));
          assert.equal(
            await loadPage(),
            "Base fornita dall'host: 5\nTotale: 7\nFile letto da std::fs: false",
          );
        },
      );
      await t.test(
        "un solo import esplicito, errore di collegamento se la funzione manca",
        async () => {
          const result = await page.evaluate(async () => {
            const module = await WebAssembly.compile(
              await (await fetch("./limiti.wasm")).arrayBuffer(),
            );
            let missing = false;
            try {
              await WebAssembly.instantiate(module, { settings: {} });
            } catch (e) {
              missing = e instanceof WebAssembly.LinkError;
            }
            return { imports: WebAssembly.Module.imports(module), missing };
          });
          assert.deepEqual(result, {
            imports: [
              { module: "settings", name: "baseline", kind: "function" },
            ],
            missing: true,
          });
        },
      );
      await t.test(
        "stesso modulo, due host e nessun overflow della somma i32 restituita in i64",
        async () => {
          const totals = await page.evaluate(async () => {
            const module = await WebAssembly.compile(
              await (await fetch("./limiti.wasm")).arrayBuffer(),
            );
            const call = async (x) => {
              const instance = await WebAssembly.instantiate(module, {
                settings: { baseline: () => x },
              });
              const y = instance.exports.demo_score(x);
              return [typeof y, String(y)];
            };
            return [await call(2147483647), await call(-2147483648)];
          });
          assert.deepEqual(totals, [
            ["bigint", "4294967294"],
            ["bigint", "-4294967296"],
          ]);
        },
      );
      await t.test(
        "la pagina distingue configurazione invalida, HTTP 404 e byte non Wasm",
        async () => {
          fs.writeFileSync(file("config.json"), '{"base":"40"}');
          assert.match(await loadPage(), /base deve essere un i32/);
          fs.writeFileSync(file("config.json"), block("json"));
          await page.route("**/limiti.wasm", (route) =>
            route.fulfill({ status: 404, body: "missing" }),
          );
          assert.match(await loadPage(), /HTTP 404/);
          await page.unroute("**/limiti.wasm");
          await page.route("**/limiti.wasm", (route) =>
            route.fulfill({
              status: 200,
              contentType: "text/html",
              body: "<!doctype html>",
            }),
          );
          assert.match(await loadPage(), /^CompileError:/);
          await page.unroute("**/limiti.wasm");
        },
      );
      await t.test(
        "crescita limitata: ricreare la vista sul buffer non condiviso",
        async () => {
          const result = await page.evaluate(() => {
            const memory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
            const old = new Uint8Array(memory.buffer);
            old[0] = 17;
            memory.grow(1);
            const current = new Uint8Array(memory.buffer);
            let atLimit = false;
            try {
              memory.grow(1);
            } catch (e) {
              atLimit = e instanceof RangeError;
            }
            return [old.byteLength, current.byteLength, current[0], atLimit];
          });
          assert.deepEqual(result, [0, 131072, 17, true]);
        },
      );
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
