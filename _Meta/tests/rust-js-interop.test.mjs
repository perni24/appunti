import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
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
const nodes = parseNote("Programmazione/Rust/Pagine/Interop con JavaScript.md")
  .tree.children;
function block(lang, starts = "") {
  const found = nodes.filter(
    (n) => n.type === "code" && n.lang === lang && n.value.startsWith(starts),
  );
  assert.equal(found.length, 1, lang + " " + starts);
  return found[0].value;
}

test("interop: contratto dei blocchi Markdown in un browser reale", async (t) => {
  const temp = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(temp, "vault-js-interop-"));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(dir)), temp);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(dir, "src"));
  fs.writeFileSync(path.join(dir, "src/lib.rs"), block("rust"));
  fs.writeFileSync(path.join(dir, "Cargo.toml"), block("toml"));
  const args = block("sh", "wasm-pack build").split(/\s+/).slice(1);
  const run = (exe, args) =>
    execFileSync(exe, args, { cwd: dir, encoding: "utf8", windowsHide: true });
  const cli = process.env.WASM_PACK_CLI || "wasm-pack";
  run(cli, args);
  run(cli, [
    "build",
    "--release",
    "--no-opt",
    "--target",
    "web",
    "--out-dir",
    "pkg-release",
  ]);
  console.log(run("cargo", ["tree", "--depth", "1"]).trim());

  const assets = new Map([
    ["/", { contentType: "text/html; charset=utf-8", body: block("html") }],
  ]);
  for (const folder of ["pkg", "pkg-release"]) {
    for (const name of fs.readdirSync(path.join(dir, folder), {
      recursive: true,
    })) {
      if (!/\.(js|wasm)$/.test(name)) continue;
      assets.set("/" + folder + "/" + name.split(path.sep).join("/"), {
        contentType: name.endsWith(".wasm")
          ? "application/wasm"
          : "text/javascript",
        path: path.join(dir, folder, name),
      });
    }
  }
  const browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      const asset =
        url.origin === "http://interop.test" && assets.get(url.pathname);
      return asset ? route.fulfill(asset) : route.abort();
    });
    await page.goto("http://interop.test/");
    await t.test(
      "la pagina del Markdown produce le quattro righe previste",
      async () => {
        await page.waitForFunction(
          () => document.querySelector("#esito")?.textContent,
          null,
          { timeout: 8000 },
        );
        assert.equal(await page.locator("#esito").textContent(), block("text"));
        assert.deepEqual(errors, []);
      },
    );
    await t.test(
      "Serde distingue false da un tipo sbagliato e richiede entrambi i campi",
      async () => {
        const result = await page.evaluate(async () => {
          const { compute } = await import("/pkg/interop_demo.js");
          const invalid = [
            null,
            {},
            { values: [1] },
            { double: false },
            { values: [2], double: "false" },
            ...["3", -1, 1.5, 2 ** 32, NaN].map((n) => ({
              values: [n],
              double: true,
            })),
          ];
          return [
            compute({ values: [], double: false }),
            compute({ values: [2, 3], double: true, extra: 1 }),
            invalid.every((input) => {
              try {
                compute(input);
                return false;
              } catch (e) {
                return (
                  e instanceof Error &&
                  e.message.startsWith("Input non valido:")
                );
              }
            }),
          ];
        });
        assert.deepEqual(result, [{ total: 0 }, { total: 10 }, true]);
      },
    );
    await t.test("limite u32: errori identici in dev e release", async () => {
      for (const folder of ["pkg", "pkg-release"]) {
        const result = await page.evaluate(async (folder) => {
          const { default: init, compute } = await import(
            "/" + folder + "/interop_demo.js"
          );
          await init();
          return [
            [0xffffffff, 0, false],
            [0xffffffff, 1, false],
            [0x80000000, 0, true],
          ].map(([a, b, double]) => {
            try {
              return compute({ values: [a, b], double }).total;
            } catch (e) {
              return [e instanceof Error, e.message];
            }
          });
        }, folder);
        assert.deepEqual(result, [
          0xffffffff,
          [true, "Totale fuori da u32"],
          [true, "Totale fuori da u32"],
        ]);
      }
    });
    await t.test(
      "il risultato è una Uint8Array indipendente dalla vista d'ingresso",
      async () => {
        const result = await page.evaluate(async () => {
          const { reverse_bytes } = await import("/pkg/interop_demo.js");
          const src = new Uint8Array([4, 5, 6, 7]);
          const out = reverse_bytes(src.subarray(1, 3));
          const before = [...out];
          out[0] = 90;
          src[1] = 80;
          return [out instanceof Uint8Array, before, [...src], [...out]];
        });
        assert.deepEqual(result, [true, [6, 5], [4, 80, 6, 7], [90, 5]]);
      },
    );
    await t.test(
      "callback solo dopo il successo, identità del risultato e del throw",
      async () => {
        const result = await page.evaluate(async () => {
          const { compute_and_notify: f } =
            await import("/pkg/interop_demo.js");
          const input = { values: [3], double: false };
          let seen,
            calls = 0;
          const ok = f(input, (value) => {
            seen = value;
            calls++;
          });
          let invalid = false;
          try {
            f({}, () => calls++);
          } catch (e) {
            invalid = e instanceof Error;
          }
          const marker = new RangeError("host");
          let same = false;
          try {
            f(input, () => {
              throw marker;
            });
          } catch (e) {
            same = e === marker;
          }
          return [seen === ok, ok.total, calls, invalid, same];
        });
        assert.deepEqual(result, [true, 3, 1, true, true]);
      },
    );
    await t.test(
      "Promise pendente, rifiuto originale e fallimento della validazione dopo resolve",
      async () => {
        const result = await page.evaluate(async () => {
          const { compute_when_ready: f } =
            await import("/pkg/interop_demo.js");
          let resolveInput;
          const pending = f(
            new Promise((resolve) => {
              resolveInput = resolve;
            }),
          );
          resolveInput({ values: [8], double: true });
          const ok = await pending;
          const marker = { reason: "annullata" };
          const original = await f(Promise.reject(marker)).then(
            () => false,
            (reason) => reason === marker,
          );
          const invalid = await f(Promise.resolve({})).then(
            () => false,
            (err) =>
              err instanceof Error &&
              err.message.startsWith("Input non valido:"),
          );
          return [pending instanceof Promise, ok.total, original, invalid];
        });
        assert.deepEqual(result, [true, 16, true, true]);
      },
    );
  } finally {
    await browser.close();
  }
});
