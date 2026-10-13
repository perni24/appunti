import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { snippet } from "./note-examples.mjs";
import { listen } from "./security-cors-examples.mjs";
import {
  createCspResponse,
  inlineCode,
  richSource,
  textSource,
} from "./csp-sanitization-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const purifyEntry = require.resolve(
  process.env.DOMPURIFY_MODULE_PATH || "dompurify",
);
const purifyModule = readFileSync(
  path.join(path.dirname(purifyEntry), "purify.es.mjs"),
  "utf8",
);
const purifyPackage = JSON.parse(
  readFileSync(path.join(path.dirname(purifyEntry), "../package.json"), "utf8"),
);
assert.equal(
  purifyPackage.version,
  "3.4.16",
  "Use the DOMPurify version documented in the note",
);
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "chrome",
  });
  console.log(
    `Browser CSP/sanitization: ${browser.version()}, DOMPurify ${purifyPackage.version}`,
  );
});
after(async () => browser?.close());

async function fixture(t, { response, html } = {}) {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push(req.url);
    req.resume();
    const scripts = {
      "/node_modules/dompurify/dist/purify.es.mjs": purifyModule,
      "/rich-comment.js": richSource,
      "/text.js": textSource,
      "/loaded.js": "globalThis.loadedExternal = true;",
    };
    if (Object.hasOwn(scripts, req.url)) {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(scripts[req.url]);
    } else if (req.url === "/data") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("{}");
    } else if (req.url === "/") {
      res.writeHead(
        200,
        response?.headers || { "Content-Type": "text/html; charset=utf-8" },
      );
      res.end(
        response?.body ||
          html ||
          '<!doctype html><title>Fixture</title><div id="comment"></div>',
      );
    } else {
      res.writeHead(204);
      res.end();
    }
  });
  const origin = await listen(t, server);
  const context = await browser.newContext();
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(origin);
  return { page, requests, origin };
}

function nonceResponse(code = "", changePolicy = (value) => value) {
  const response = createCspResponse();
  response.body = response.body.replace(
    inlineCode,
    `
    globalThis.violations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push({ directive: event.effectiveDirective, disposition: event.disposition });
    });
    ${inlineCode}
    ${code}
  `,
  );
  response.headers["Content-Security-Policy"] = changePolicy(
    response.headers["Content-Security-Policy"],
  );
  return response;
}

for (const mode of ["nonce", "hash"]) {
  test(`CSP browser: risposta ${mode}, script autorizzato e controesempio bloccato`, async (t) => {
    const { page } = await fixture(t, { response: createCspResponse(mode) });
    assert.equal(
      await page.locator("#result").textContent(),
      "Script autorizzato",
    );
    assert.equal(
      await page.evaluate(() => globalThis.blockedInline),
      undefined,
    );
  });
}

test("CSP browser: nonce errato blocca lo script", async (t) => {
  const response = createCspResponse();
  response.body = response.body.replace(/nonce="[^"]+"/, 'nonce="wrong"');
  const { page } = await fixture(t, { response });
  assert.equal(
    await page.locator("#result").textContent(),
    "Script non eseguito",
  );
});

test("CSP browser: una newline diversa invalida l'hash", async (t) => {
  const response = createCspResponse("hash");
  response.body = response.body.replace(inlineCode, inlineCode + "\n");
  const { page } = await fixture(t, { response });
  assert.equal(
    await page.locator("#result").textContent(),
    "Script non eseguito",
  );
});

test("CSP browser: report-only segnala ma permette lo script", async (t) => {
  const response = nonceResponse();
  response.headers["Content-Security-Policy-Report-Only"] =
    response.headers["Content-Security-Policy"];
  delete response.headers["Content-Security-Policy"];
  const { page } = await fixture(t, { response });
  assert.equal(await page.evaluate(() => globalThis.blockedInline), true);
  await page.waitForFunction(() =>
    violations.some((v) => v.disposition === "report"),
  );
});

test("CSP browser: nonce non autorizza eventi inline o eval", async (t) => {
  const response = nonceResponse(`
    try { eval("globalThis.evalRan = true"); } catch (error) { globalThis.evalError = error.name; }
    const button = document.createElement("button");
    button.textContent = "Test";
    button.setAttribute("onclick", "globalThis.eventRan = true");
    document.body.append(button);
    button.click();
  `);
  const { page } = await fixture(t, { response });
  await page.waitForFunction(() =>
    violations.some((v) => v.directive === "script-src-attr"),
  );
  assert.deepEqual(
    await page.evaluate(() => [
      globalThis.evalError,
      !!globalThis.evalRan,
      !!globalThis.eventRan,
    ]),
    ["EvalError", false, false],
  );
});

test("CSP browser: connect-src blocca Fetch prima dell'endpoint", async (t) => {
  const response = nonceResponse(
    `fetch("/data").then(() => globalThis.fetchResult = "ok", error => globalThis.fetchResult = error.name);`,
  );
  const { page, requests } = await fixture(t, { response });
  await page.waitForFunction(() => globalThis.fetchResult);
  assert.equal(await page.evaluate(() => fetchResult), "TypeError");
  assert.equal(requests.includes("/data"), false);
});

test("CSP browser: direttiva specifica sostituisce il fallback", async (t) => {
  const response = nonceResponse(
    `fetch("/data").then(() => globalThis.fetchResult = "ok", error => globalThis.fetchResult = error.name);`,
    (p) => p + "; connect-src 'self'",
  );
  const { page, requests } = await fixture(t, { response });
  await page.waitForFunction(() => globalThis.fetchResult);
  assert.equal(await page.evaluate(() => fetchResult), "ok");
  assert.ok(requests.includes("/data"));
});

test("CSP browser: policy aggiuntiva non allenta la prima", async (t) => {
  const response = createCspResponse();
  response.headers["Content-Security-Policy"] = [
    response.headers["Content-Security-Policy"],
    "script-src 'none'",
  ];
  const { page } = await fixture(t, { response });
  assert.equal(
    await page.locator("#result").textContent(),
    "Script non eseguito",
  );
});

for (const strict of [false, true]) {
  test(`CSP browser: loader dinamico, strict-dynamic=${strict}`, async (t) => {
    const response = nonceResponse(
      `
      const script = document.createElement("script");
      script.src = "/loaded.js";
      script.onload = () => globalThis.loaderDone = "loaded";
      script.onerror = () => globalThis.loaderDone = "blocked";
      document.head.append(script);
    `,
      (p) =>
        strict ? p.replace("; object-src", " 'strict-dynamic'; object-src") : p,
    );
    const { page, requests } = await fixture(t, { response });
    await page.waitForFunction(() => globalThis.loaderDone);
    assert.equal(
      await page.evaluate(() => loaderDone),
      strict ? "loaded" : "blocked",
    );
    assert.equal(requests.includes("/loaded.js"), strict);
  });
}

test("CSP browser: strict-dynamic ignora self per script parser-inserted", async (t) => {
  const response = nonceResponse("", (p) =>
    p.replace("; object-src", " 'strict-dynamic' 'self'; object-src"),
  );
  response.body = response.body.replace(
    "</body>",
    '<script src="/loaded.js"></script></body>',
  );
  const { page, requests } = await fixture(t, { response });
  assert.equal(await page.evaluate(() => globalThis.loadedExternal), undefined);
  assert.equal(requests.includes("/loaded.js"), false);
});

test("Sanitizzazione browser: testo non diventa HTML e query usa l'origine locale", async (t) => {
  const { page, origin } = await fixture(t);
  const result = await page.evaluate(async () => {
    const { renderCommentText, searchUrl } = await import("/text.js");
    const item = renderCommentText(
      '<img src=x onerror="globalThis.unexpected = true"> &amp;',
    );
    document.body.append(item);
    return {
      text: item.textContent,
      children: item.children.length,
      url: searchUrl("a&b").href,
    };
  });
  assert.deepEqual(result, {
    text: '<img src=x onerror="globalThis.unexpected = true"> &amp;',
    children: 0,
    url: origin + "/search?q=a%26b",
  });
});

test("Sanitizzazione browser: limiti del testo senza coercizione", async (t) => {
  const { page } = await fixture(t);
  const result = await page.evaluate(async () => {
    const { renderCommentText } = await import("/text.js");
    const errors = [null, {}, 1, "x".repeat(20_001)].map((value) => {
      try {
        renderCommentText(value);
        return "unexpected";
      } catch (error) {
        return error.name;
      }
    });
    return {
      errors,
      empty: renderCommentText("").textContent,
      max: renderCommentText("x".repeat(20_000)).textContent.length,
    };
  });
  assert.deepEqual(result, {
    errors: ["TypeError", "TypeError", "TypeError", "RangeError"],
    empty: "",
    max: 20_000,
  });
});

test("Sanitizzazione browser: demo HTML completa con DOMPurify reale", async (t) => {
  const { page } = await fixture(t, {
    html: snippet("Sanitizzazione input", "<!doctype html>", "html"),
  });
  assert.equal(await page.locator("#comment strong").textContent(), "mondo");
  assert.equal(await page.locator("#comment img").count(), 0);
  assert.equal(await page.evaluate(() => globalThis.unexpected), undefined);
});

const richCases = [
  [
    "tag consentiti",
    "<p>Ciao<br><strong>forte</strong><em>enfasi</em><code>code</code></p><ul><li>uno</li></ul><ol><li>due</li></ol>",
    "Ciaoforteenfasicodeunodue",
  ],
  [
    "attributi",
    '<p id="x" name="x" class="x" style="color:red" data-x="x" aria-label="x" onclick="globalThis.unexpected=true">test</p>',
    "test",
  ],
  [
    "script e immagini",
    '<p>test<img src="/probe" onerror="globalThis.unexpected=true"></p><script>globalThis.unexpected=true</script>',
    "test",
  ],
  [
    "link e form",
    '<a href="javascript:globalThis.unexpected=true">link</a><form><input name="x"></form>',
    "link",
  ],
  [
    "SVG MathML e custom element",
    '<svg onload="globalThis.unexpected=true"></svg><math><mi>x</mi></math><custom-box>test</custom-box>',
    "test",
  ],
  ["markup incompleto", "<p><strong>test", "test"],
  ["entita", "<p>&lt;img src=x&gt;&amp;</p>", "<img src=x>&"],
];
for (const [label, dirty, text] of richCases) {
  test(`Sanitizzazione browser: ${label}, DOM limitato e nessun attributo`, async (t) => {
    const { page } = await fixture(t);
    const result = await page.evaluate(async (html) => {
      const { renderRichComment } = await import("/rich-comment.js");
      const target = document.getElementById("comment");
      renderRichComment(target, html);
      return {
        text: target.textContent,
        tags: [...target.querySelectorAll("*")].map((el) => el.localName),
        attrs: [...target.querySelectorAll("*")].flatMap((el) =>
          [...el.attributes].map((a) => a.name),
        ),
        unexpected: !!globalThis.unexpected,
      };
    }, dirty);
    assert.equal(result.text, text);
    assert.deepEqual(result.attrs, []);
    assert.equal(result.unexpected, false);
    assert.ok(
      result.tags.every((tag) =>
        ["p", "br", "strong", "em", "ul", "ol", "li", "code"].includes(tag),
      ),
    );
  });
}

test("Sanitizzazione browser: input invalidi preservano il contenuto precedente", async (t) => {
  const { page } = await fixture(t);
  const result = await page.evaluate(async () => {
    const { renderRichComment } = await import("/rich-comment.js");
    const target = document.getElementById("comment");
    target.textContent = "precedente";
    let coerced = false;
    const errors = [
      null,
      1,
      {
        toString() {
          coerced = true;
          return "bad";
        },
      },
      "x".repeat(20_001),
    ].map((html) => {
      try {
        renderRichComment(target, html);
        return "unexpected";
      } catch (error) {
        return error.name;
      }
    });
    return { errors, text: target.textContent, coerced };
  });
  assert.deepEqual(result, {
    errors: ["TypeError", "TypeError", "TypeError", "RangeError"],
    text: "precedente",
    coerced: false,
  });
});

test("Sanitizzazione browser: destinazione limitata a div del documento", async (t) => {
  const { page } = await fixture(t);
  const errors = await page.evaluate(async () => {
    const { renderRichComment } = await import("/rich-comment.js");
    const other = document.implementation.createHTMLDocument("Other");
    return [
      null,
      document.createElement("script"),
      document.createElement("p"),
      document.createElementNS("http://www.w3.org/2000/svg", "div"),
      other.createElement("div"),
    ].map((target) => {
      try {
        renderRichComment(target, "test");
        return "unexpected";
      } catch (error) {
        return error.name;
      }
    });
  });
  assert.deepEqual(errors, Array(5).fill("TypeError"));
});

test("Sanitizzazione browser: sostituzione, vuoto e limite massimo", async (t) => {
  const { page } = await fixture(t);
  const result = await page.evaluate(async () => {
    const { renderRichComment } = await import("/rich-comment.js");
    const target = document.getElementById("comment");
    renderRichComment(target, "<p>prima</p>");
    renderRichComment(target, "<strong>dopo</strong>");
    const replaced = target.innerHTML;
    renderRichComment(target, "");
    const empty = target.childNodes.length;
    renderRichComment(target, "x".repeat(20_000));
    return { replaced, empty, max: target.textContent.length };
  });
  assert.deepEqual(result, {
    replaced: "<strong>dopo</strong>",
    empty: 0,
    max: 20_000,
  });
});
