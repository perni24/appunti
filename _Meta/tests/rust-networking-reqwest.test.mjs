import assert from "node:assert/strict";
import { execFile, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Networking con reqwest.md",
).tree.children.filter((b) => b.type === "code");
function first(lang, prefix) {
  const hits = blocks.filter(
    (b) => b.lang === lang && b.value.startsWith(prefix),
  );
  assert.equal(hits.length, 1, prefix);
  return hits[0].value;
}
const fixture = first("json", "{");
const temp = fs.realpathSync(os.tmpdir());
let root, project, env, binary;
function run(tool, args, cwd = project) {
  const r = spawnSync(tool, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 300000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(r.error);
  assert.equal(r.status, 0, [tool, ...args, r.stdout, r.stderr].join("\n"));
  return r.stdout;
}
before(() => {
  root = fs.mkdtempSync(path.join(temp, "vault-http-"));
  project = path.join(root, "issue-client");
  const target = path.join(root, "t");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: target,
    CARGO_TERM_COLOR: "never",
  };
  run(
    "cargo",
    first("sh", "cargo new").split(/\s+/).slice(1).concat("--vcs", "none"),
    root,
  );
  fs.appendFileSync(
    path.join(project, "Cargo.toml"),
    first("toml", "anyhow") + "\n",
  );
  fs.writeFileSync(
    path.join(project, "src/main.rs"),
    blocks
      .filter((b) => b.lang === "rust")
      .map((b) => b.value)
      .join("\n\n") + "\n",
  );
  fs.mkdirSync(path.join(project, "demo"));
  fs.writeFileSync(path.join(project, "demo/issue.json"), fixture);
  const host = run("rustc", ["-vV"])
    .match(/^host: (.+)$/m)[1]
    .trim();
  run("cargo", ["fetch", "--target", host]);
  run("cargo", ["build", "--offline", "--locked"]);
  binary = path.join(
    target,
    "debug",
    process.platform === "win32" ? "issue-client.exe" : "issue-client",
  );
  console.log(
    run("cargo", ["tree", "--offline", "--locked", "--depth", "1"]).trim(),
  );
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), temp);
  assert.ok(path.basename(p).startsWith("vault-http-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});
function cli(args, code = 0) {
  return new Promise((resolve, reject) =>
    execFile(
      binary,
      args,
      {
        cwd: project,
        windowsHide: true,
        env: { ...env, NO_PROXY: "127.0.0.1", no_proxy: "127.0.0.1" },
        timeout: 12000,
      },
      (err, stdout, stderr) => {
        try {
          assert.equal(err?.code ?? 0, code, stderr || err?.message);
          if (code === 0) assert.equal(stderr, "");
          else assert.equal(stdout, "");
          resolve(code === 0 ? stdout.trim() : stderr);
        } catch (e) {
          reject(e);
        }
      },
    ),
  );
}
async function serve(t, handler) {
  const srv = createServer(handler);
  srv.listen(0, "127.0.0.1");
  await once(srv, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        srv.close(resolve);
        srv.closeAllConnections();
      }),
  );
  return "http://127.0.0.1:" + srv.address().port;
}

test("il server Python della nota riproduce i tre esempi: 200, assenza e POST 501", async (t) => {
  const args = first("sh", "python -m")
    .split(/\s+/)
    .slice(1)
    .map((x) => (x === "8000" ? "0" : x));
  const srv = spawn("python", ["-u", ...args], {
    cwd: project,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  t.after(async () => {
    if (srv.pid && srv.exitCode === null && srv.signalCode === null) {
      const closed = once(srv, "close");
      srv.kill();
      await closed;
    }
  });
  const port = await new Promise((resolve, reject) => {
    let log = "";
    const timer = setTimeout(
      () => reject(Error("Server Python non pronto: " + log)),
      10000,
    );
    function detectPort(buf) {
      log += buf;
      const match = log.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    }
    srv.stdout.on("data", detectPort);
    srv.stderr.on("data", detectPort);
    srv.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    srv.once("close", (code) => {
      clearTimeout(timer);
      reject(Error("http.server: " + code));
    });
  });
  const url = "http://127.0.0.1:" + port;
  assert.equal(await cli(["get", url + "/issue.json"]), "7: Prima nota");
  assert.equal(await cli(["get", url + "/assente.json"]), "non trovata");
  assert.match(
    await cli(["create", url + "/issues", "Nuova nota"], 1),
    /POST: HTTP 501/,
  );
});
test("POST serializza il titolo e legge la risorsa solo sul 201", async (t) => {
  const seen = [];
  const url = await serve(t, async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    seen.push([
      req.method,
      req.headers["content-type"],
      req.url,
      Buffer.concat(chunks).toString(),
    ]);
    res.writeHead(req.url === "/ok" ? 201 : 200).end(fixture);
  });
  const title = 'Una "nota"';
  assert.equal(await cli(["create", url + "/ok", title]), "7: Prima nota");
  assert.match(
    await cli(["create", url + "/wrong", title], 1),
    /POST: HTTP 200/,
  );
  assert.deepEqual(
    seen.map(([method, type, route, body]) => [
      method,
      type,
      route,
      JSON.parse(body),
    ]),
    ["/ok", "/wrong"].map((route) => [
      "POST",
      "application/json",
      route,
      { title },
    ]),
  );
});
test("503 e 204 non diventano errori JSON; un redirect non viene seguito", async (t) => {
  const seen = [];
  const url = await serve(t, (req, res) => {
    seen.push(req.url);
    if (req.url === "/redirect")
      res.writeHead(302, { Location: "/dest" }).end();
    else if (req.url === "/empty") res.writeHead(204).end();
    else res.writeHead(503).end("<h1>Non disponibile</h1>");
  });
  for (const [route, code] of [
    ["/busy", 503],
    ["/redirect", 302],
    ["/empty", 204],
  ]) {
    const err = await cli(["get", url + route], 1);
    assert.match(err, new RegExp("GET: HTTP " + code));
    assert.doesNotMatch(err, /JSON/);
  }
  assert.deepEqual(seen, ["/busy", "/redirect", "/empty"]);
});
test("200 con JSON malformato o con schema errato fallisce nella decodifica", async (t) => {
  const url = await serve(t, (req, res) =>
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(req.url === "/type" ? '{"id":"7","title":"X"}' : "{"),
  );
  for (const route of ["/type", "/syntax"])
    assert.match(
      await cli(["get", url + route], 1),
      /JSON non valido per Issue/,
    );
});
test("senza Content-Length il limite è inclusivo a 65536 byte", async (t) => {
  const url = await serve(t, (req, res) => {
    res.writeHead(200);
    res.write(fixture);
    res.end(
      " ".repeat(
        65536 - Buffer.byteLength(fixture) + (req.url === "/large" ? 1 : 0),
      ),
    );
  });
  assert.equal(await cli(["get", url + "/limit"]), "7: Prima nota");
  assert.match(
    await cli(["get", url + "/large"], 1),
    /corpo oltre il limite di 65536 byte/,
  );
});
test("il budget scade prima degli header o durante il corpo, senza stampare la query", async (t) => {
  const url = await serve(t, (req, res) => {
    if (req.url.startsWith("/body")) {
      res.writeHead(200);
      res.write("{");
    }
    // Nessuna fine risposta: il client deve interrompere la richiesta.
  });
  for (const [route, stage] of [
    ["/head", "invio GET"],
    ["/body", "lettura del corpo"],
  ]) {
    const err = await cli(["get", url + route + "?ref=prova-riservata"], 1);
    assert.match(err, /timeout HTTP/);
    assert.ok(err.includes(stage), err);
    assert.doesNotMatch(err, /prova-riservata/);
  }
});
