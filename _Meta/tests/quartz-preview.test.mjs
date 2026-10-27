import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import YAML from "../../site/node_modules/yaml/dist/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const config = YAML.parse(
  fs.readFileSync(path.join(root, "site/quartz.config.yaml"), "utf8"),
);
const prefix = new URL(
  "https://" + config.configuration.baseUrl,
).pathname.replace(/\/$/, "");
const pagePath = "/programmazione/python/pagine/";
const accented = encodeURIComponent("ereditarietà");
let child,
  origin,
  logs = "";

before(async () => {
  assert.ok(
    fs.existsSync(
      path.join(root, "site/public", pagePath, "ereditarietà.html"),
    ),
    "Run site:build before this suite",
  );
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const port = reservation.address().port;
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve())),
  );
  origin = "http://127.0.0.1:" + port;
  child = spawn(
    process.execPath,
    ["site/scripts/preview-site.mjs", "--port", String(port)],
    {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Preview startup timeout: " + logs)),
      15000,
    );
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Preview exited: " + code + " " + logs));
    });
    child.stdout.on("data", (chunk) => {
      logs += chunk.toString();
      if (logs.includes("Anteprima:")) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
});
after(async () => {
  if (child && child.exitCode === null && child.signalCode === null) {
    const closed = once(child, "close");
    child.kill();
    await closed;
  }
});
function request(route, options = {}) {
  return fetch(origin + route, {
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
    ...options,
  });
}
test("anteprima: pagina ASCII e sottopercorso Pages", async () => {
  const response = await request(prefix + pagePath + "dataclasses");
  assert.equal(response.status, 200, logs);
  assert.match(await response.text(), /Dataclasses/);
});
test("anteprima: URL Unicode senza estensione e header valido", async () => {
  const response = await request(prefix + pagePath + accented);
  assert.equal(response.status, 200, logs);
  assert.equal(response.headers.get("content-disposition"), "inline");
  assert.match(await response.text(), /Ereditarietà in Python/);
});
test("anteprima: seconda pagina accentata anche dalla radice", async () => {
  const response = await request(pagePath + encodeURIComponent("proprietà"));
  assert.equal(response.status, 200, logs);
  assert.match(await response.text(), /cached_property/);
});
test("anteprima: redirect HTML Unicode conserva query e prefisso", async () => {
  const target = prefix + pagePath + accented;
  const response = await request(target + ".html?example=1");
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), target + "?example=1");
  const canonical = await request(response.headers.get("location"));
  assert.equal(canonical.status, 200, logs);
  await canonical.text();
});
test("anteprima: indici e HEAD", async () => {
  const redirect = await request(prefix + "/index.html?example=1");
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("location"), prefix + "/?example=1");
  const response = await request(prefix + pagePath + accented, {
    method: "HEAD",
  });
  assert.equal(response.status, 200, logs);
  assert.ok(Number(response.headers.get("content-length")) > 0);
  assert.equal(await response.text(), "");
});
test("anteprima: URL malformato e traversal codificato sono rifiutati", async () => {
  const malformed = await request(prefix + "/%ZZ");
  assert.equal(malformed.status, 400);
  assert.match(await malformed.text(), /URL non valido/);
  const outside = await request(prefix + "/..%2f..%2fnot-a-file");
  assert.equal(outside.status, 400);
  assert.match(await outside.text(), /Percorso non valido/);
});
test("anteprima: pagina assente resta 404", async () => {
  const response = await request(prefix + "/not-a-real-page-for-preview-test");
  assert.equal(response.status, 404);
  await response.text();
});
