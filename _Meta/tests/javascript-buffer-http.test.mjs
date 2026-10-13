import assert from "node:assert/strict";
import { test } from "node:test";
import { Buffer } from "node:buffer";
import http from "node:http";
import net from "node:net";
import { once } from "node:events";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, realpath, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const bufferNote = "Buffer Node.js";
const httpNote = "HTTP server";
const moduleFrom = (code) =>
  import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const { decodeHex } = await moduleFrom(
  snippet(bufferNote, "export function decodeHex"),
);
const { fileToBase64 } = await moduleFrom(
  snippet(bufferNote, "export async function fileToBase64"),
);
const appSource = snippet(httpNote, "export function createAppServer");
const { createAppServer, closeServer } = await moduleFrom(appSource);
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
      key,
    ),
  ),
);

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-buffer-http-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(path.resolve(temp) + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-buffer-http-"));
    await rm(actual, { recursive: true, force: true });
  });
  const file = (name) => path.join(root, name);
  for (const [name, source] of [
    [
      "file-base64.mjs",
      snippet(bufferNote, "export async function fileToBase64"),
    ],
    [
      "base64-demo.mjs",
      snippet(bufferNote, 'import { fileToBase64 } from "./file-base64.mjs"'),
    ],
    ["http-app.mjs", appSource],
    [
      "server.mjs",
      snippet(httpNote, "import { createAppServer, closeServer }"),
    ],
  ])
    await writeFile(file(name), source);
  async function run(args) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env: childEnv,
          encoding: "utf8",
          timeout: 10000,
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return { root, file, run };
}

function success(result, output) {
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  if (output !== undefined) assert.equal(result.stdout, output);
}

for (const [label, marker, output] of [
  ["text", 'const text = "caff', "5 6 6\n63616666c3a8\ntrue\ntrue true\n"],
  [
    "views",
    "const source = Buffer.from([10",
    "[ 10, 99, 30, 40 ]\n[ 20, 30 ]\n[ 99, 30 ]\n",
  ],
  [
    "multibyte copies",
    "const words = new Uint16Array",
    "[ 52, 120 ]\n4 4\nfalse\n",
  ],
  [
    "numbers",
    "const header = Buffer.alloc(10)",
    "4660\n13330\n9007199254740993\n",
  ],
  [
    "zeroes and conversions",
    "const zeroed = Buffer.alloc(4)",
    "[ 0, 0, 0, 0 ]\n[ 255, 0, 3 ]\n",
  ],
  ["fatal UTF-8", "const invalid = Buffer.from([0xc3", "true\nTypeError\n"],
]) {
  test("Buffer demo: " + label, async (t) => {
    const f = await fixture(t);
    success(
      await f.run(["--input-type=module", "-e", snippet(bufferNote, marker)]),
      output,
    );
  });
}

test("Buffer: strict hex accepts empty, lowercase, uppercase and exact boundary", () => {
  assert.equal(decodeHex("").length, 0);
  assert.deepEqual(decodeHex("00aBff"), Buffer.from([0, 171, 255]));
  assert.equal(decodeHex("ab".repeat(4096)).length, 4096);
});

for (const value of ["0x12", "1", "1ag1", "12 34", "12\n", "gg", null, 42]) {
  test("Buffer: strict hex rejects " + JSON.stringify(value), () => {
    assert.throws(() => decodeHex(value), TypeError);
  });
}

test("Buffer: strict hex rejects oversized input before conversion", () => {
  assert.throws(() => decodeHex("00".repeat(4097)), RangeError);
});

test("Buffer: native hex conversion is permissive", () => {
  assert.deepEqual(Buffer.from("1ag1", "hex"), Buffer.from([0x1a]));
  assert.deepEqual(Buffer.from("1a7", "hex"), Buffer.from([0x1a]));
});

test("Buffer: base64 text is reversible but encoding separate chunks is not", () => {
  const bytes = Buffer.from([0, 1, 2, 255]);
  assert.deepEqual(Buffer.from(bytes.toString("base64"), "base64"), bytes);
  assert.equal(
    bytes.toString("base64").length,
    4 * Math.ceil(bytes.length / 3),
  );
  assert.notEqual(
    Buffer.from("a").toString("base64") + Buffer.from("b").toString("base64"),
    Buffer.from("ab").toString("base64"),
  );
  assert.equal(Buffer.from("Y Q==\n", "base64").toString(), "a");
});

test("Buffer: numeric methods check bounds, indexed access does not throw", () => {
  const bytes = Buffer.alloc(2);
  assert.throws(() => bytes.readUInt16BE(1), RangeError);
  assert.throws(() => bytes.writeUInt16BE(65536), RangeError);
  assert.equal(bytes[2], undefined);
});

test("Buffer: slice shares bytes, concat length can truncate or zero-pad", () => {
  const source = Buffer.from([1, 2, 3]);
  const alias = source.slice(1);
  alias[0] = 9;
  assert.deepEqual(source, Buffer.from([1, 9, 3]));
  assert.deepEqual(Buffer.concat([source], 2), Buffer.from([1, 9]));
  assert.deepEqual(Buffer.concat([source], 5), Buffer.from([1, 9, 3, 0, 0]));
});

test("Buffer: exact view excludes unrelated prefix and suffix bytes", () => {
  const backing = new ArrayBuffer(12);
  const bytes = Buffer.from(backing, 4, 3);
  bytes.set([7, 8, 9]);
  assert.deepEqual(
    [...new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)],
    [7, 8, 9],
  );
  assert.equal(new Uint8Array(bytes.buffer).length, 12);
});

test("Buffer: file base64 preserves binary source and handles spaces in CLI path", async (t) => {
  const f = await fixture(t);
  const data = Buffer.from(
    Array.from({ length: 4096 }, (_, index) => index % 256),
  );
  await writeFile(f.file("input bytes.bin"), data);
  assert.deepEqual(
    Buffer.from(
      await fileToBase64(f.file("input bytes.bin"), data.length),
      "base64",
    ),
    data,
  );
  success(
    await f.run(["base64-demo.mjs", "input bytes.bin"]),
    data.toString("base64") + "\n",
  );
  assert.deepEqual(await readFile(f.file("input bytes.bin")), data);
});

test("Buffer: zero limit accepts empty file and rejects one byte", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("empty"), "");
  await writeFile(f.file("one"), "x");
  assert.equal(await fileToBase64(f.file("empty"), 0), "");
  await assert.rejects(fileToBase64(f.file("one"), 0), /File too large/);
});

test("Buffer: accepts exact byte limit, rejects one extra byte", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("input"), "abcd");
  assert.equal(await fileToBase64(f.file("input"), 4), "YWJjZA==");
  await assert.rejects(fileToBase64(f.file("input"), 3), /File too large/);
});

for (const limit of [-1, 1.5, NaN, Infinity, "10", 16777217]) {
  test("Buffer: invalid read limit " + String(limit), async () => {
    await assert.rejects(fileToBase64("must-not-be-opened", limit), RangeError);
  });
}

test("Buffer: missing file and directory fail, CLI reports without stdout", async (t) => {
  const f = await fixture(t);
  await assert.rejects(fileToBase64(f.file("missing")), { code: "ENOENT" });
  await assert.rejects(fileToBase64(f.root));
  const missing = await f.run(["base64-demo.mjs", "missing"]);
  assert.equal(missing.code, 1);
  assert.equal(missing.stdout, "");
  assert.match(missing.stderr, /ENOENT/);
  const invalid = await f.run(["base64-demo.mjs"]);
  assert.equal(invalid.code, 1);
  assert.match(invalid.stderr, /Usage/);
});

async function app(t, options) {
  const server = createAppServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    try {
      await closeServer(server, 50);
    } catch (error) {
      if (error.code !== "ERR_SERVER_NOT_RUNNING") throw error;
    }
  });
  const port = server.address().port;
  function request({
    method = "GET",
    target = "/health",
    headers = {},
    body,
    chunks,
  } = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          method,
          path: target,
          headers,
          agent: false,
        },
        (res) => {
          const received = [];
          res.on("data", (chunk) => received.push(chunk));
          res.on("error", reject);
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(received),
            }),
          );
        },
      );
      req.on("error", reject);
      req.setTimeout(5000, () =>
        req.destroy(new Error("Fixture request timeout")),
      );
      if (chunks) {
        for (const chunk of chunks) req.write(chunk);
        req.end();
      } else req.end(body);
    });
  }
  function post(body, headers = {}) {
    return request({
      method: "POST",
      target: "/greet",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
  }
  return { server, port, request, post };
}

test("HTTP: GET path excludes query, response byte length and headers are consistent", async (t) => {
  const f = await app(t);
  const result = await f.request({ target: "/health?check=1" });
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body), { status: "ok" });
  assert.equal(Number(result.headers["content-length"]), result.body.length);
  assert.equal(
    result.headers["content-type"],
    "application/json; charset=utf-8",
  );
  assert.equal(result.headers.connection, "close");
  assert.equal(result.headers["cache-control"], "no-store");
});

test("HTTP: HEAD returns matching headers but no body", async (t) => {
  const f = await app(t);
  const get = await f.request();
  const head = await f.request({ method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  assert.equal(head.headers["content-length"], get.headers["content-length"]);
});

for (const [target, method, status, allow] of [
  ["/unknown", "GET", 404, undefined],
  ["/health", "POST", 405, "GET, HEAD"],
  ["/greet", "GET", 405, "POST"],
  ["/greet", "HEAD", 405, "POST"],
]) {
  test("HTTP: route and method " + method + " " + target, async (t) => {
    const f = await app(t);
    const result = await f.request({ target, method });
    assert.equal(result.status, status);
    assert.equal(result.headers.allow, allow);
    if (method === "HEAD") assert.equal(result.body.length, 0);
    else assert.equal(typeof JSON.parse(result.body).error, "string");
  });
}

for (const target of [
  "http://example.test/health",
  "//example.test/health",
  "/health#fragment",
  "/health\\x",
]) {
  test("HTTP: rejects non-origin or ambiguous target " + target, async (t) => {
    const f = await app(t);
    assert.equal((await f.request({ target })).status, 400);
  });
}

test("HTTP: valid Unicode body is trimmed and byte length is correct", async (t) => {
  const f = await app(t);
  const result = await f.post(JSON.stringify({ name: "  Luc\u00e0  " }));
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(result.body), { message: "Ciao, Luc\u00e0" });
  assert.equal(Number(result.headers["content-length"]), result.body.length);
  assert.ok(result.body.length > result.body.toString("utf8").length);
});

test("HTTP: chunked UTF-8 body may split a multibyte code point", async (t) => {
  const f = await app(t);
  const text = Buffer.from('{"name":"\u20ac"}');
  const result = await f.request({
    method: "POST",
    target: "/greet",
    headers: { "Content-Type": "application/json" },
    chunks: [text.subarray(0, 10), text.subarray(10, 11), text.subarray(11)],
  });
  assert.equal(result.status, 200);
  assert.equal(JSON.parse(result.body).message, "Ciao, \u20ac");
});

for (const body of [
  "",
  "{",
  Buffer.from([0xc3, 0x28]),
  "\ufeff" + '{"name":"ok"}',
]) {
  test("HTTP: malformed JSON/UTF-8/BOM " + JSON.stringify(body), async (t) => {
    const f = await app(t);
    assert.equal((await f.post(body)).status, 400);
  });
}

for (const value of [
  null,
  [],
  {},
  { name: 42 },
  { name: " " },
  { name: "a".repeat(81) },
  { name: "ok", extra: true },
]) {
  test("HTTP: invalid schema " + JSON.stringify(value), async (t) => {
    const f = await app(t);
    assert.equal((await f.post(JSON.stringify(value))).status, 422);
  });
}

test("HTTP: accepted schema length boundary is 80 UTF-16 units", async (t) => {
  const f = await app(t);
  assert.equal(
    (await f.post(JSON.stringify({ name: "\u{1f600}".repeat(40) }))).status,
    200,
  );
  assert.equal(
    (await f.post(JSON.stringify({ name: "\u{1f600}".repeat(41) }))).status,
    422,
  );
});

for (const headers of [
  { "Content-Type": "text/plain" },
  { "Content-Type": "application/problem+json" },
  { "Content-Type": "application/json; charset=latin1" },
  { "Content-Encoding": "gzip" },
]) {
  test(
    "HTTP: unsupported representation " + JSON.stringify(headers),
    async (t) => {
      const f = await app(t);
      assert.equal((await f.post('{"name":"ok"}', headers)).status, 415);
    },
  );
}

test("HTTP: MIME parser accepts case and quoted UTF-8", async (t) => {
  const f = await app(t);
  assert.equal(
    (
      await f.post('{"name":"ok"}', {
        "Content-Type": 'Application/JSON; charset="UTF-8"',
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await f.request({
        method: "POST",
        target: "/greet",
        body: '{"name":"ok"}',
      })
    ).status,
    415,
  );
});

test("HTTP: early Content-Length rejection does not require full upload", async (t) => {
  const f = await app(t);
  const result = await f.post("", { "Content-Length": "16385" });
  assert.equal(result.status, 413);
  assert.deepEqual(JSON.parse(result.body), { error: "Body too large" });
});

test("HTTP: exact body boundary succeeds; chunked over-limit receives JSON 413", async (t) => {
  const f = await app(t);
  const body = '{"name":"ok"}'.padEnd(16384, " ");
  assert.equal((await f.post(body)).status, 200);
  const result = await f.request({
    method: "POST",
    target: "/greet",
    headers: { "Content-Type": "application/json" },
    chunks: [body, " "],
  });
  assert.equal(result.status, 413);
  assert.deepEqual(JSON.parse(result.body), { error: "Body too large" });
});

test("HTTP: oversized headers rejected by Node parser before application route", async (t) => {
  const f = await app(t);
  const result = await f.request({ headers: { "X-Large": "x".repeat(9000) } });
  assert.equal(result.status, 431);
});

for (const greet of [
  () => {
    throw new Error("private database credential");
  },
  async () => {
    throw new Error("private database credential");
  },
  async () => 123,
]) {
  test("HTTP: service failure has generic 500 without leaking details", async (t) => {
    const f = await app(t, { greet });
    const result = await f.post('{"name":"ok"}');
    assert.equal(result.status, 500);
    assert.deepEqual(JSON.parse(result.body), {
      error: "Internal server error",
    });
    assert.doesNotMatch(result.body.toString(), /credential/);
  });
}

test("HTTP: configured limits and invalid service factory", async (t) => {
  const f = await app(t);
  assert.equal(f.server.maxHeaderSize, 8192);
  assert.equal(f.server.headersTimeout, 10000);
  assert.equal(f.server.requestTimeout, 15000);
  assert.equal(f.server.timeout, 20000);
  assert.throws(() => createAppServer({ greet: null }), TypeError);
});

test(
  "HTTP: client disconnection aborts a cooperating service",
  { timeout: 5000 },
  async (t) => {
    const started = Promise.withResolvers();
    const aborted = Promise.withResolvers();
    const f = await app(t, {
      greet: async (name, { signal }) => {
        started.resolve();
        return new Promise((resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => {
              aborted.resolve(signal.aborted);
              reject(signal.reason);
            },
            { once: true },
          ),
        );
      },
    });
    const req = http.request({
      host: "127.0.0.1",
      port: f.port,
      path: "/greet",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      agent: false,
    });
    req.on("error", () => {});
    req.end('{"name":"ok"}');
    await started.promise;
    req.destroy();
    assert.equal(await aborted.promise, true);
  },
);

test(
  "HTTP: interrupted upload does not invoke the service and server remains usable",
  { timeout: 5000 },
  async (t) => {
    let calls = 0;
    const f = await app(t, {
      greet: async () => {
        calls++;
        return "ok";
      },
    });
    const socket = net.createConnection({ host: "127.0.0.1", port: f.port });
    socket.on("error", () => {});
    await once(socket, "connect");
    const seen = once(f.server, "request");
    socket.write(
      'POST /greet HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{"name":',
    );
    const [req] = await seen;
    const ended = once(req, "close");
    socket.destroy();
    await ended.catch((error) => {
      assert.equal(error.code, "ECONNRESET");
    });
    assert.equal(calls, 0);
    assert.equal((await f.request()).status, 200);
  },
);

test("HTTP: client snippet uses real loopback service with only port remapped", async (t) => {
  const f = await app(t);
  const logs = [];
  const fakeProcess = { exitCode: 0 };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction(
    "fetch",
    "console",
    "process",
    snippet(httpNote, "const response = await fetch("),
  );
  await run(
    (url, options) => {
      const local = new URL(url);
      assert.equal(local.hostname, "127.0.0.1");
      local.port = String(f.port);
      return fetch(local, options);
    },
    {
      log: (message) => logs.push(message),
      error: (message) => assert.fail(message),
    },
    fakeProcess,
  );
  assert.deepEqual(logs, ["Ciao, Luca"]);
  assert.equal(fakeProcess.exitCode, 0);
});

test("HTTP: idle server closes cleanly; invalid grace period rejected", async (t) => {
  const f = await app(t);
  await assert.rejects(closeServer(f.server, 0), RangeError);
  assert.equal(f.server.listening, true);
  await closeServer(f.server);
  assert.equal(f.server.listening, false);
});

test(
  "HTTP: graceful close waits for an active response",
  { timeout: 5000 },
  async (t) => {
    const started = Promise.withResolvers();
    const release = Promise.withResolvers();
    const f = await app(t, {
      greet: async () => {
        started.resolve();
        return release.promise;
      },
    });
    const pending = f.post('{"name":"ok"}');
    await started.promise;
    let closed = false;
    const closing = closeServer(f.server, 1000).then(() => {
      closed = true;
    });
    await Promise.resolve();
    assert.equal(closed, false);
    release.resolve("finished");
    assert.equal((await pending).status, 200);
    await closing;
    assert.equal(closed, true);
  },
);

test(
  "HTTP: forced close disconnects active work and signals cancellation",
  { timeout: 5000 },
  async (t) => {
    const started = Promise.withResolvers();
    const aborted = Promise.withResolvers();
    const f = await app(t, {
      greet: async (name, { signal }) => {
        started.resolve();
        return new Promise((resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => {
              aborted.resolve();
              reject(signal.reason);
            },
            { once: true },
          ),
        );
      },
    });
    const failed = assert.rejects(f.post('{"name":"ok"}'), {
      code: "ECONNRESET",
    });
    await started.promise;
    await closeServer(f.server, 30);
    await failed;
    await aborted.promise;
  },
);

for (const args of [["0"], ["65536"], ["-1"], ["abc"], ["3000", "extra"]]) {
  test("HTTP CLI: invalid arguments " + args.join(" "), async (t) => {
    const f = await fixture(t);
    const result = await f.run(["server.mjs", ...args]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Usage/);
    assert.equal(result.stdout, "");
  });
}

test("HTTP CLI: occupied fixture port reports EADDRINUSE", async (t) => {
  const f = await fixture(t);
  const service = await app(t);
  const result = await f.run(["server.mjs", String(service.port)]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /EADDRINUSE/);
  assert.equal(result.stdout, "");
});
