import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { before, after, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const tmp = fs.realpathSync(os.tmpdir());
let root, env, binDir;
const source = "Programmazione/Rust/Pagine/";
const serverNote = "Web backend con axum";
function blocks(note) {
  return parseNote(source + note + ".md").tree.children.filter(
    (b) => b.type === "code",
  );
}
function run(bin, args, cwd = root) {
  const res = spawnSync(bin, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 300000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(res.error);
  assert.equal(
    res.status,
    0,
    [bin, ...args, res.stderr, res.stdout].join("\n"),
  );
  return res.stdout.trim();
}
function project(note, name) {
  const doc = blocks(note);
  const cmd = doc.find(
    (b) => b.lang === "sh" && b.value.startsWith("cargo new "),
  ).value;
  run("cargo", [...cmd.split(/\s+/).slice(1), "--vcs", "none"]);
  const dir = path.join(root, name);
  fs.appendFileSync(
    path.join(dir, "Cargo.toml"),
    doc.find((b) => b.lang === "toml").value + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "src", "main.rs"),
    doc
      .filter((b) => b.lang === "rust")
      .map((b) => b.value)
      .join("\n\n") + "\n",
  );
}
function exe(name) {
  return path.join(binDir, name + (process.platform === "win32" ? ".exe" : ""));
}
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-axum-"));
  const target = path.join(root, "t");
  binDir = path.join(target, "debug");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: target,
    CARGO_TERM_COLOR: "never",
    NO_PROXY: "127.0.0.1",
    no_proxy: "127.0.0.1",
  };
  project(serverNote, "issue-api");
  project("Networking con reqwest", "issue-client");
  fs.writeFileSync(
    path.join(root, "Cargo.toml"),
    '[workspace]\nresolver = "3"\nmembers = ["issue-api", "issue-client"]\n',
  );
  fs.writeFileSync(
    path.join(root, "issue.json"),
    blocks(serverNote).find((b) => b.lang === "json").value + "\n",
  );
  const host = run("rustc", ["-vV"])
    .match(/^host: (.+)$/m)[1]
    .trim();
  run("cargo", ["fetch", "--target", host]);
  run("cargo", ["build", "--workspace", "--offline", "--locked"]);
  console.log(
    run("cargo", [
      "tree",
      "--offline",
      "--locked",
      "-p",
      "issue-api",
      "--depth",
      "1",
    ]),
  );
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), tmp);
  assert.ok(path.basename(p).startsWith("vault-axum-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});
async function server(t) {
  const child = spawn(exe("issue-api"), ["0"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let err = "";
  child.stderr.on("data", (b) => {
    err += b;
  });
  t.after(async () => {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      const closed = once(child, "close");
      child.kill();
      await closed;
    }
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Nessun indirizzo di ascolto: " + err)),
      10000,
    );
    let out = "";
    child.stdout.on("data", (b) => {
      out += b;
      const m = out.match(/^(http:\/\/127\.0\.0\.1:\d+)\r?\n/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    child.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(Error("issue-api: " + code + " " + err));
    });
  });
}
function post(url, body, type = "application/json") {
  return fetch(url + "/issues", {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });
}
test("curl: 201 con Location, lettura della risorsa e assenza applicativa", async (t) => {
  const base = await server(t);
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  const request = (...args) =>
    run(curl, ["--silent", "--show-error", "-i", ...args]);
  const created = request("--json", "@issue.json", base + "/issues");
  assert.match(created, /^HTTP\/1\.1 201\b/);
  assert.match(created, /^location: \/issues\/1\r?$/im);
  const location = created.match(/^location: (\S+)/im)[1];
  const read = request(base + location);
  assert.match(read, /^HTTP\/1\.1 200\b/);
  const body = (r) => JSON.parse(r.split(/\r?\n\r?\n/)[1]);
  assert.deepEqual(body(created), { id: 1, title: "Prima nota" });
  assert.deepEqual(body(read), body(created));
  const absent = request(base + "/issues/0");
  assert.match(absent, /^HTTP\/1\.1 404\b/);
  assert.deepEqual(body(absent), { error: "issue_not_found" });
});
test("la CLI reqwest della nota precedente crea e ritrova una issue", async (t) => {
  const base = await server(t);
  const cli = (...args) => run(exe("issue-client"), args);
  assert.equal(cli("get", base + "/issues/1"), "non trovata");
  assert.equal(
    cli("create", base + "/issues", "  Prima nota  "),
    "1: Prima nota",
  );
  assert.equal(cli("get", base + "/issues/1"), "1: Prima nota");
});
test("routing, estrazione del path e assenza della risorsa sono distinti", async (t) => {
  const base = await server(t);
  assert.equal(await (await fetch(base + "/health")).text(), "ok");
  const badPath = await fetch(base + "/issues/abc");
  assert.equal(badPath.status, 400);
  const absent = await fetch(base + "/issues/42");
  assert.equal(absent.status, 404);
  assert.deepEqual(await absent.json(), { error: "issue_not_found" });
  const fallback = await fetch(base + "/nessuna-route");
  assert.equal(fallback.status, 404);
  assert.doesNotMatch(await fallback.text(), /issue_not_found/);
  const method = await fetch(base + "/issues/1", { method: "DELETE" });
  assert.equal(method.status, 405);
  assert.ok(method.headers.get("allow").split(/,\s*/).includes("GET"));
});
test("media type, sintassi, schema e titolo vuoto hanno esiti distinguibili", async (t) => {
  const base = await server(t);
  for (const [body, type, status] of [
    ['{"title":"ok"}', "text/plain", 415],
    ["{", "application/json", 400],
    ['{"title":7}', "application/json", 422],
  ]) {
    const r = await post(base, body, type);
    assert.equal(r.status, status);
    assert.doesNotMatch(
      r.headers.get("content-type") || "",
      /application\/json/,
    );
    await r.arrayBuffer();
  }
  const empty = await post(base, JSON.stringify({ title: "  " }));
  assert.equal(empty.status, 422);
  assert.deepEqual(await empty.json(), { error: "empty_title" });
  const valid = await post(base, JSON.stringify({ title: "Valida" }));
  assert.equal(valid.status, 201);
  assert.equal((await valid.json()).id, 1);
});
test("4096 byte accettati, 4097 rifiutati: il limite include tutto il JSON", async (t) => {
  const base = await server(t);
  const json = JSON.stringify({ title: "caffè" });
  const sized = (n) => json + " ".repeat(n - Buffer.byteLength(json));
  const over = await post(base, sized(4097));
  assert.equal(over.status, 413);
  const exact = await post(base, sized(4096));
  assert.equal(exact.status, 201);
  assert.deepEqual(await exact.json(), { id: 1, title: "caffè" });
});
test("le richieste concorrenti condividono la lista e ricevono ID distinti", async (t) => {
  const base = await server(t);
  const items = await Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const r = await post(base, JSON.stringify({ title: "Nota " + i }));
      assert.equal(r.status, 201);
      return [r.headers.get("location"), await r.json()];
    }),
  );
  assert.deepEqual(
    items.map(([, v]) => v.id).sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  for (const [location, created] of items) {
    const r = await fetch(base + location);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), created);
  }
});
