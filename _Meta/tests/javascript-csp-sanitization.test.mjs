import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { parseNote } from "../../site/scripts/vault.mjs";
import {
  createCspResponse,
  inlineCode,
  searchUrl,
} from "./csp-sanitization-examples.mjs";

const require = createRequire(
  new URL("../../site/package.json", import.meta.url),
);
const { transformSync } = require("esbuild");

test("CSP: nonce da 16 byte distinto e coerente con il markup", () => {
  const seen = new Set();
  for (let index = 0; index < 30; index++) {
    const { headers, body } = createCspResponse();
    const nonce =
      headers["Content-Security-Policy"].match(/'nonce-([^']+)'/)[1];
    assert.equal(Buffer.from(nonce, "base64").length, 16);
    assert.ok(body.includes(`<script nonce="${nonce}">${inlineCode}</script>`));
    assert.equal(seen.has(nonce), false);
    seen.add(nonce);
  }
});

test("CSP: hash esatto e risposta deterministica senza nonce", () => {
  const first = createCspResponse("hash");
  assert.deepEqual(first, createCspResponse("hash"));
  const hash = createHash("sha256").update(inlineCode, "utf8").digest("base64");
  assert.ok(
    first.headers["Content-Security-Policy"].includes(`'sha256-${hash}'`),
  );
  assert.ok(first.body.includes(`<script>${inlineCode}</script>`));
  assert.equal(first.body.includes("nonce="), false);
  assert.notEqual(
    hash,
    createHash("sha256")
      .update(inlineCode + "\n")
      .digest("base64"),
  );
});

test("CSP: modalita errate rifiutate senza coercizione", () => {
  for (const value of [null, {}, "", "report-only", 3]) {
    assert.throws(() => createCspResponse(value), TypeError);
  }
});

test("CSP: header, regole esplicite e controesempio non autorizzato", () => {
  for (const mode of ["nonce", "hash"]) {
    const { headers, body } = createCspResponse(mode);
    assert.equal(headers["Content-Type"], "text/html; charset=utf-8");
    assert.equal(headers["Cache-Control"], "no-store");
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    for (const directive of [
      "default-src",
      "object-src",
      "base-uri",
      "form-action",
      "frame-ancestors",
    ]) {
      assert.ok(
        headers["Content-Security-Policy"].includes(`${directive} 'none'`),
      );
    }
    assert.match(body, /<script>globalThis.blockedInline = true;<\/script>/);
    assert.doesNotMatch(headers["Content-Security-Policy"], /unsafe|https:/);
  }
});

test("Sanitizzazione: URLSearchParams conserva dati e destinazione", () => {
  for (const query of [
    "",
    "a&admin=true",
    "a+b",
    "%26",
    "<img>",
    "a".repeat(200),
  ]) {
    const url = searchUrl(query, "https://example.test");
    assert.equal(url.origin, "https://example.test");
    assert.equal(url.pathname, "/search");
    assert.equal(url.searchParams.get("q"), query);
    assert.deepEqual([...url.searchParams.keys()], ["q"]);
  }
});

test("Sanitizzazione: limiti query e origine invalida", () => {
  for (const query of [null, undefined, {}, 12]) {
    assert.throws(() => searchUrl(query, "https://example.test"), TypeError);
  }
  assert.throws(
    () => searchUrl("x".repeat(201), "https://example.test"),
    RangeError,
  );
  assert.throws(() => searchUrl("ok", "not an origin"), TypeError);
});

for (const name of ["Content Security Policy", "Sanitizzazione input"]) {
  test(`${name}: sintassi di tutti i blocchi JS come moduli`, () => {
    const nodes = parseNote(`Programmazione/JavaScript/Pagine/${name}.md`).tree
      .children;
    const blocks = nodes.filter(
      (node) => node.type === "code" && node.lang === "js",
    );
    assert.equal(blocks.length, 2);
    for (const block of blocks)
      transformSync(block.value, {
        loader: "js",
        format: "esm",
        target: "esnext",
      });
  });
}
