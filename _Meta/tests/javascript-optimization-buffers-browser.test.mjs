import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { snippet } from "./note-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const optimization = "Optimization";
const buffers = "Buffer e Typed Arrays";
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser optimization/buffers: ${browser.version()}`);
});
after(async () => browser?.close());

async function fixture(
  t,
  { isolated = false, status = 200, body, pending = false } = {},
) {
  const context = await browser.newContext();
  t.after(() => context.close());
  await context.route("**/*", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/demo/") {
      await route.fulfill({
        contentType: "text/html",
        headers: isolated
          ? {
              "Cross-Origin-Opener-Policy": "same-origin",
              "Cross-Origin-Embedder-Policy": "require-corp",
            }
          : {},
        body:
          snippet(optimization, '<label for="language-filter"', "html") +
          '<div class="measure-target" style="height:20px;padding:3px;border:2px solid"></div><div class="measure-target" style="height:30px;padding:3px;border:2px solid"></div>',
      });
    } else if (pathname === "/packet.bin") {
      if (!pending)
        await route.fulfill({
          status,
          contentType: "application/octet-stream",
          body: body ?? Buffer.from([78, 66, 1, 0, 0, 4, 114, 101, 116, 101]),
        });
    } else await route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto("https://notes.test/demo/");
  await page.addScriptTag({
    content: [
      snippet(optimization, "function debounce"),
      snippet(optimization, "function throttleLeading"),
      snippet(optimization, "function mountFilter"),
      snippet(optimization, "function growBoxes"),
      snippet(buffers, "function encodePacket"),
      snippet(buffers, "async function fetchPacket"),
    ].join("\n"),
  });
  return page;
}

test("Optimization browser: filtro con timer reali, query e cleanup dai Markdown", async (t) => {
  const page = await fixture(t);
  await page.evaluate(
    () => (document.querySelector("output").textContent = "Originale"),
  );
  await page.addScriptTag({
    content: snippet(optimization, "let disposeFilter ="),
  });
  await page.waitForFunction(
    () =>
      document.querySelector("output").textContent ===
      "JavaScript, Python, Rust",
  );
  await page.locator("input").fill(" RUST ");
  await page.waitForFunction(
    () => document.querySelector("output").textContent === "Rust",
  );
  await page.locator("input").fill("missing");
  await page.waitForFunction(
    () => document.querySelector("output").textContent === "",
  );
  await page.addScriptTag({
    content: snippet(optimization, "disposeFilter();"),
  });
  assert.equal(await page.locator("output").textContent(), "Originale");
  assert.equal(await page.evaluate(() => disposeFilter), null);
});

test("Optimization browser: timer pendenti, callback tardive e listener esterni dopo cleanup", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const input = document.querySelector("input");
      const output = document.querySelector("output");
      output.textContent = "Prima";
      const set = window.setTimeout;
      const clear = window.clearTimeout;
      const pending = new Map();
      const registered = [];
      let id = 0;
      let otherCalls = 0;
      input.addEventListener("input", () => otherCalls++);
      window.setTimeout = (callback) => {
        registered.push(callback);
        pending.set(id, callback);
        return id++;
      };
      window.clearTimeout = (key) => pending.delete(key);
      try {
        for (let i = 0; i < 20; i++) {
          const dispose = mountFilter(input, output);
          input.value = "Rust";
          input.dispatchEvent(new Event("input"));
          dispose();
          dispose();
        }
        input.dispatchEvent(new Event("input"));
        for (const callback of registered) callback();
        return { pending: pending.size, text: output.textContent, otherCalls };
      } finally {
        window.setTimeout = set;
        window.clearTimeout = clear;
      }
    }),
    { pending: 0, text: "Prima", otherCalls: 21 },
  );
});

test("Optimization browser: elementi errati rifiutati, nessun cleanup da inventare", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const input = document.querySelector("input");
      const output = document.querySelector("output");
      return [
        [null, output],
        [input, null],
        [output, input],
      ].map((args) => {
        try {
          mountFilter(...args);
          return "accepted";
        } catch (error) {
          return error.name;
        }
      });
    }),
    ["TypeError", "TypeError", "TypeError"],
  );
});

test("Optimization browser: NodeList e altezza border-box senza doppio padding", async (t) => {
  const page = await fixture(t);
  const before = await page
    .locator(".measure-target")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
  await page.addScriptTag({
    content: snippet(optimization, "growBoxes(document.querySelectorAll"),
  });
  const after = await page
    .locator(".measure-target")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    );
  assert.deepEqual(before, [30, 40]);
  assert.deepEqual(after, [40, 50]);
});

test("Buffer browser: snippet di viste, copie, resize, transfer e testo nativi", async (t) => {
  const page = await fixture(t);
  for (const [marker, expected] of [
    ["const source =", [[[10, 99, 30, 40]], [[20, 30]], [true]]],
    ["const storage =", [[18, 52], [4660], [13330]]],
    ["const text =", [[5, 6], [true]]],
    ["const decoder =", [["\u00e8"]]],
    [
      "typeof ArrayBuffer.prototype.resize",
      [
        [8, 2],
        [1, 0],
        [2, 0],
      ],
    ],
    ["const original =", [[[7, 8, 9]], [0, 0]]],
    ["const sourceBytes =", [[[1, 2, 3]]]],
  ]) {
    const logs = await page.evaluate(
      async (code) => {
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args);
        try {
          await new (Object.getPrototypeOf(async function () {}).constructor)(
            code,
          )();
        } finally {
          console.log = originalLog;
        }
        return logs;
      },
      snippet(buffers, marker),
    );
    assert.deepEqual(logs, expected, marker);
  }
});

test("Buffer browser: parser UTF-8 e sottovista, BOM, NUL ed errori", async (t) => {
  const page = await fixture(t);
  assert.deepEqual(
    await page.evaluate(() => {
      const samples = ["", "\ufefftest", "a\0b", "Ciao \u{1f30d}"];
      const roundtrips = samples.map((text) => {
        const packet = encodePacket(text);
        const envelope = new Uint8Array(packet.length + 6);
        envelope.set(packet, 3);
        return decodePacket(envelope.subarray(3, 3 + packet.length));
      });
      const malformed = encodePacket("x");
      malformed[6] = 0xff;
      const errors = [
        malformed,
        new Uint8Array(4),
        new Uint8Array(new ArrayBuffer(6, { maxByteLength: 8 })),
      ].map((bytes) => {
        try {
          decodePacket(bytes);
          return "accepted";
        } catch (error) {
          return error.name;
        }
      });
      return { roundtrips, errors };
    }),
    {
      roundtrips: ["", "\ufefftest", "a\0b", "Ciao \u{1f30d}"],
      errors: ["TypeError", "RangeError", "TypeError"],
    },
  );
});

test("Buffer browser: fetch nativo su risposta binaria intercettata", async (t) => {
  const page = await fixture(t);
  assert.equal(await page.evaluate(() => fetchPacket("/packet.bin")), "rete");
});

for (const [options, expected] of [
  [{ status: 404 }, "HTTP 404"],
  [{ body: Buffer.from([1, 2]) }, "Header incompleto"],
]) {
  test(`Buffer browser: fetch rifiuta ${expected}`, async (t) => {
    const page = await fixture(t, options);
    assert.equal(
      await page.evaluate(async () => {
        try {
          await fetchPacket("/packet.bin");
          return "accepted";
        } catch (error) {
          return error.message;
        }
      }),
      expected,
    );
  });
}

test("Buffer browser: abort nativo della richiesta pendente", async (t) => {
  const page = await fixture(t, { pending: true });
  const requested = page.waitForRequest("**/packet.bin");
  await page.evaluate(() => {
    window.controller = new AbortController();
    window.result = fetchPacket("/packet.bin", {
      signal: controller.signal,
    }).then(
      () => "accepted",
      (error) => error.name,
    );
  });
  await requested;
  assert.equal(
    await page.evaluate(async () => {
      controller.abort();
      return await result;
    }),
    "AbortError",
  );
});

test("Buffer browser: SharedArrayBuffer in contesto sicuro isolato", async (t) => {
  const page = await fixture(t, { isolated: true });
  assert.equal(
    await page.evaluate(() => isSecureContext && crossOriginIsolated),
    true,
  );
  const logs = await page.evaluate(
    (code) => {
      const values = [];
      const original = console.log;
      console.log = (...args) => values.push(args);
      try {
        new Function(code)();
      } finally {
        console.log = original;
      }
      return values;
    },
    snippet(buffers, "typeof SharedArrayBuffer"),
  );
  assert.deepEqual(logs, [[10], [11]]);
});
