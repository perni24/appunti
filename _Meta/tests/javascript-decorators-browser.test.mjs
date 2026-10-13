import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createRequire } from "node:module";
import { cases, compileExample } from "./decorators-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(`Browser decorators (output trasformato): ${browser.version()}`);
});
after(async () => browser?.close());

for (const item of cases) {
  test(`Decorators browser: ${item.name}`, async (t) => {
    const context = await browser.newContext();
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const code = await compileExample(item.marker, item.tail);
    const result = await page.evaluate((source) => (0, eval)(source), code);
    assert.deepEqual(result, item.expected);
    assert.deepEqual(errors, []);
  });
}
