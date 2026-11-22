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
const note = parseNote("Programmazione/Rust/Pagine/wasm-bindgen.md");
const blocks = note.tree.children.filter((node) => node.type === "code");
function block(language) {
  const matches = blocks.filter((node) => node.lang === language);
  assert.equal(matches.length, 1, language);
  return matches[0].value;
}

test("wasm-bindgen: dal Markdown al browser", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-bindings-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "Cargo.toml"), block("toml"));
  fs.writeFileSync(path.join(dir, "src/lib.rs"), block("rust"));
  const run = (cmd, args) =>
    execFileSync(cmd, args, { cwd: dir, encoding: "utf8", windowsHide: true });
  const cli = process.env.WASM_BINDGEN_CLI || "wasm-bindgen";
  for (const command of ["cargo build ", "wasm-bindgen --target "]) {
    const matches = blocks.filter(
      (b) => b.lang === "sh" && b.value.startsWith(command),
    );
    assert.equal(matches.length, 1);
    const [executable, ...args] = matches[0].value.split(/\s+/);
    run(executable === "wasm-bindgen" ? cli : executable, args);
  }
  const assets = new Map([
    ["/", ["text/html; charset=utf-8", block("html")]],
    [
      "/vuota",
      ["text/html; charset=utf-8", "<!doctype html><title>Test</title>"],
    ],
    [
      "/pkg/nomi_web.js",
      ["text/javascript", fs.readFileSync(path.join(dir, "pkg/nomi_web.js"))],
    ],
    [
      "/pkg/nomi_web_bg.wasm",
      [
        "application/wasm",
        fs.readFileSync(path.join(dir, "pkg/nomi_web_bg.wasm")),
      ],
    ],
  ]);
  const server = createServer((req, res) => {
    const asset = assets.get(req.url);
    if (!asset) return res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": asset[0] }).end(asset[1]);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const browser = await chromium.launch({
      channel: process.env.BROWSER_CHANNEL || "chrome",
    });
    try {
      console.log(run(cli, ["--version"]).trim(), "Chrome", browser.version());
      const page = await browser.newPage();
      await t.test(
        "HTML della nota: successo, eccezione, classe e import di console.info",
        async () => {
          const log = [];
          page.on("console", (msg) => {
            if (msg.type() === "info") log.push(msg.text());
          });
          await page.goto(base);
          await page.waitForFunction(
            () => document.querySelector("#risultato")?.textContent,
          );
          assert.equal(
            await page.locator("#risultato").textContent(),
            "alì\nIl nome richiede almeno 3 caratteri\nAccettati: 1\nSomma: 5",
          );
          assert.deepEqual(log, ["Nome accettato"]);
        },
      );
      await t.test(
        "export sincrono: conta scalari, non byte né grafemi; Err lancia Error",
        async () => {
          const cases = await page.evaluate(async () => {
            const { normalize_username } = await import("/pkg/nomi_web.js");
            return ["", " ÉÉ ", "   AÉB ", "a\u0301b"].map((s) => {
              try {
                return normalize_username(s);
              } catch (e) {
                return { error: e instanceof Error, message: e.message };
              }
            });
          });
          const failure = {
            error: true,
            message: "Il nome richiede almeno 3 caratteri",
          };
          assert.deepEqual(cases, [failure, failure, "aéb", "a\u0301b"]);
        },
      );
      await t.test("inizializzazione e durata dello stato Rust", async () => {
        await page.goto(base + "/vuota");
        const observed = await page.evaluate(async () => {
          const {
            default: init,
            add,
            Counter,
          } = await import("/pkg/nomi_web.js");
          let early = false;
          try {
            add(1, 2);
          } catch {
            early = true;
          }
          await init();
          const a = new Counter(),
            b = new Counter();
          a.increment();
          const values = [a.value, b.value];
          a.free();
          b.free();
          let released = false;
          try {
            a.increment();
          } catch {
            released = true;
          }
          return { early, values, released, sum: add(32767, 32767) };
        });
        assert.deepEqual(observed, {
          early: true,
          values: [1, 0],
          released: true,
          sum: 65534,
        });
      });
      await t.test(
        "il wrapper JS da solo non basta: binario mancante",
        async () => {
          await page.goto(base + "/vuota");
          await page.route("**/nomi_web_bg.wasm", (route) =>
            route.fulfill({ status: 404, body: "not found" }),
          );
          const failed = await page.evaluate(async () => {
            const { default: init } = await import("/pkg/nomi_web.js");
            try {
              await init();
              return false;
            } catch {
              return true;
            }
          });
          assert.equal(failed, true);
        },
      );
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
