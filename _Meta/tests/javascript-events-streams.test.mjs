import assert from "node:assert/strict";
import { test } from "node:test";
import { EventEmitter, once, on, errorMonitor } from "node:events";
import { Readable, Writable } from "node:stream";
import { pipeline, finished } from "node:stream/promises";
import {
  mkdtemp,
  realpath,
  readFile,
  writeFile,
  rm,
  access,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const eventNote = "Events Node.js";
const streamNote = "Streams Node.js";
const moduleFrom = (source) =>
  import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
const { subscribe } = await moduleFrom(
  snippet(eventNote, "export function subscribe"),
);
const { waitForReady } = await moduleFrom(
  snippet(eventNote, "export async function waitForReady"),
);
const { Job } = await moduleFrom(snippet(eventNote, "export class Job"));
const { consumeText } = await moduleFrom(
  snippet(streamNote, "export async function consumeText"),
);
const { writeChunks } = await moduleFrom(
  snippet(streamNote, "export async function writeChunks"),
);
const { gzipFile } = await moduleFrom(
  snippet(streamNote, "export async function gzipFile"),
);
const { createJsonLines } = await moduleFrom(
  snippet(streamNote, "export function createJsonLines"),
);
const failure = new Error("controlled failure");
const defer = () => Promise.withResolvers();

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-events-streams-"));
  t.after(async () => {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(path.resolve(temp) + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-events-streams-"));
    await rm(actual, { recursive: true, force: true });
  });
  const file = (name) => path.join(root, name);
  const files = [
    ["job.mjs", eventNote, "export class Job"],
    ["job-demo.mjs", eventNote, 'import { Job } from "./job.mjs"'],
    ["consume-text.mjs", streamNote, "export async function consumeText"],
    [
      "read-demo.mjs",
      streamNote,
      'import { consumeText } from "./consume-text.mjs"',
    ],
    ["write-chunks.mjs", streamNote, "export async function writeChunks"],
    [
      "write-demo.mjs",
      streamNote,
      'import { writeChunks } from "./write-chunks.mjs"',
    ],
    ["gzip-file.mjs", streamNote, "export async function gzipFile"],
    ["gzip-demo.mjs", streamNote, 'import { gzipFile } from "./gzip-file.mjs"'],
    ["json-lines.mjs", streamNote, "export function createJsonLines"],
    [
      "json-lines-demo.mjs",
      streamNote,
      'import { createJsonLines } from "./json-lines.mjs"',
    ],
  ];
  for (const [name, note, marker] of files)
    await writeFile(file(name), snippet(note, marker));
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  async function run(args) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env,
          encoding: "utf8",
          timeout: 15000,
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return {
    file,
    run,
    runSource: (source) => run(["--input-type=module", "-e", source]),
  };
}

function success(result, output) {
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  if (output !== undefined) assert.equal(result.stdout, output);
}

for (const [name, note, marker, output] of [
  [
    "ordered dispatch",
    eventNote,
    "const trace = []",
    "before | first:7:true | second:7 | after:true\nfalse\n",
  ],
  [
    "async rejection captured",
    eventNote,
    "captureRejections: true",
    "true\nrefresh failed\n",
  ],
  [
    "waits installed before emission",
    eventNote,
    "const waiting = Promise.all",
    "1 3\n",
  ],
  [
    "early break destroys readable",
    streamNote,
    "const input = Readable.from([10",
    "10\ntrue\n",
  ],
]) {
  test(name + ": executes Markdown demo", async (t) => {
    const f = await fixture(t);
    success(await f.runSource(snippet(note, marker)), output);
  });
}

test("events: owned subscription preserves receiver and removes only itself", () => {
  const emitter = new EventEmitter();
  const calls = [];
  function listener(value) {
    calls.push([this === emitter, value]);
  }
  emitter.on("data", listener);
  const dispose = subscribe(emitter, "data", listener);
  assert.equal(emitter.listenerCount("data"), 2);
  emitter.emit("data", 1);
  dispose();
  dispose();
  emitter.emit("data", 2);
  assert.deepEqual(calls, [
    [true, 1],
    [true, 1],
    [true, 2],
  ]);
  assert.equal(emitter.listenerCount("data"), 1);
  emitter.off("data", listener);
});

test("events: subscription rejects non-functions", () => {
  assert.throws(() => subscribe(new EventEmitter(), "data", 42), TypeError);
});

test("events: off removes only one duplicate registration", () => {
  const emitter = new EventEmitter();
  const listener = () => {};
  emitter.on("x", listener).on("x", listener).off("x", listener);
  assert.equal(emitter.listenerCount("x"), 1);
});

test("events: once is removed before recursive emission", () => {
  const emitter = new EventEmitter();
  let calls = 0;
  emitter.once("x", () => {
    calls++;
    emitter.emit("x");
  });
  emitter.emit("x");
  assert.equal(calls, 1);
});

test("events: removal during emit affects future emissions", () => {
  const emitter = new EventEmitter();
  const calls = [];
  const later = () => calls.push("later");
  emitter.on("x", () => {
    calls.push("first");
    emitter.off("x", later);
  });
  emitter.on("x", later);
  emitter.emit("x");
  emitter.emit("x");
  assert.deepEqual(calls, ["first", "later", "first"]);
});

test("events: synchronous listener throw interrupts dispatch, not an error event", () => {
  const emitter = new EventEmitter();
  let later = false;
  let errors = 0;
  emitter.on("error", () => errors++);
  emitter.on("x", () => {
    throw failure;
  });
  emitter.on("x", () => {
    later = true;
  });
  assert.throws(
    () => emitter.emit("x"),
    (error) => error === failure,
  );
  assert.equal(later, false);
  assert.equal(errors, 0);
});

test("events: errorMonitor does not consume an unhandled error", () => {
  const emitter = new EventEmitter();
  let seen;
  emitter.on(errorMonitor, (error) => {
    seen = error;
  });
  assert.throws(
    () => emitter.emit("error", failure),
    (error) => error === failure,
  );
  assert.equal(seen, failure);
});

test("events: emit returns before an async listener finishes", async () => {
  const emitter = new EventEmitter();
  const gate = defer();
  const done = defer();
  let completed = false;
  emitter.on("x", async () => {
    await gate.promise;
    completed = true;
    done.resolve();
  });
  assert.equal(emitter.emit("x"), true);
  assert.equal(completed, false);
  gate.resolve();
  await done.promise;
  assert.equal(completed, true);
});

test("events: waitForReady returns payload and removes temporary listeners", async () => {
  const emitter = new EventEmitter();
  const payload = { version: 1 };
  const waiting = waitForReady(emitter);
  assert.equal(emitter.listenerCount("ready"), 1);
  emitter.emit("ready", payload, "ignored");
  assert.equal(await waiting, payload);
  assert.equal(emitter.listenerCount("ready"), 0);
  assert.equal(emitter.listenerCount("error"), 0);
});

test("events: error rejects pending ready wait and cleans up", async () => {
  const emitter = new EventEmitter();
  const rejected = assert.rejects(
    waitForReady(emitter),
    (error) => error === failure,
  );
  emitter.emit("error", failure);
  await rejected;
  assert.equal(emitter.listenerCount("ready"), 0);
  assert.equal(emitter.listenerCount("error"), 0);
});

for (const preAborted of [false, true]) {
  test("events: abort wait, preAborted=" + preAborted, async () => {
    const emitter = new EventEmitter();
    const controller = new AbortController();
    if (preAborted) controller.abort(failure);
    const rejected = assert.rejects(
      waitForReady(emitter, { signal: controller.signal }),
      { name: "AbortError", cause: failure },
    );
    controller.abort(failure);
    await rejected;
    assert.equal(emitter.listenerCount("ready"), 0);
    assert.equal(emitter.listenerCount("error"), 0);
  });
}

test("events: waiting after an event misses it until explicit cancellation", async () => {
  const emitter = new EventEmitter();
  emitter.emit("ready", 1);
  const controller = new AbortController();
  const rejected = assert.rejects(
    waitForReady(emitter, { signal: controller.signal }),
    { name: "AbortError" },
  );
  assert.equal(emitter.listenerCount("ready"), 1);
  controller.abort();
  await rejected;
});

test("events: async iterator buffers and break removes its listeners", async () => {
  const emitter = new EventEmitter();
  const iterator = on(emitter, "x");
  emitter.emit("x", 1);
  emitter.emit("x", 2);
  assert.equal(typeof emitter.pause, "undefined");
  for await (const args of iterator) {
    assert.deepEqual(args, [1]);
    break;
  }
  assert.equal(emitter.listenerCount("x"), 0);
  assert.equal(emitter.listenerCount("error"), 0);
});

test("job: demo executes with final result and progress", async (t) => {
  const f = await fixture(t);
  success(await f.run(["job-demo.mjs"]), "1/2\n2/2\n[4,8]\n");
});

test("job: sequential worker, payloads and results", async () => {
  const job = new Job();
  const events = [];
  let active = 0;
  for (const name of ["start", "progress", "done"])
    job.on(name, (data) => events.push([name, data]));
  assert.deepEqual(
    await job.run([2, 4], async (value) => {
      assert.equal(++active, 1);
      await Promise.resolve();
      active--;
      return value * 2;
    }),
    [4, 8],
  );
  assert.deepEqual(events, [
    ["start", { total: 2 }],
    ["progress", { done: 1, total: 2 }],
    ["progress", { done: 2, total: 2 }],
    ["done", { total: 2 }],
  ]);
});

test("job: empty batch emits start/done without work", async () => {
  const job = new Job();
  const events = [];
  for (const name of ["start", "progress", "done"])
    job.on(name, () => events.push(name));
  assert.deepEqual(await job.run([], () => assert.fail("unexpected work")), []);
  assert.deepEqual(events, ["start", "done"]);
});

test("job: failed worker stops batch, no duplicate error event, reusable state", async () => {
  const job = new Job();
  const seen = [];
  let done = 0;
  let errors = 0;
  job.on("done", () => done++);
  job.on("error", () => errors++);
  await assert.rejects(
    job.run([1, 2, 3], async (value) => {
      seen.push(value);
      if (value === 2) throw failure;
      return value;
    }),
    (error) => error === failure,
  );
  assert.deepEqual(seen, [1, 2]);
  assert.equal(done, 0);
  assert.equal(errors, 0);
  assert.deepEqual(await job.run([4], (value) => value), [4]);
});

test("job: overlapping run rejected without resetting active work", async () => {
  const job = new Job();
  const gate = defer();
  const running = job.run([1], () => gate.promise);
  await assert.rejects(
    job.run([], () => {}),
    /already running/,
  );
  await assert.rejects(
    job.run([], () => {}),
    /already running/,
  );
  gate.resolve(9);
  assert.deepEqual(await running, [9]);
  assert.deepEqual(await job.run([], () => {}), []);
});

test("job: input array snapshot precedes start notification", async () => {
  const job = new Job();
  const values = [1, 2];
  job.on("start", () => {
    values.push(3);
    values[0] = 99;
  });
  assert.deepEqual(await job.run(values, (value) => value), [1, 2]);
});

for (const eventName of ["start", "progress", "done"]) {
  test(
    "job: listener throws on " + eventName + ", state still resets",
    async () => {
      const job = new Job();
      let worked = 0;
      job.once(eventName, () => {
        throw failure;
      });
      await assert.rejects(
        job.run([1], () => ++worked),
        (error) => error === failure,
      );
      assert.equal(worked, eventName === "start" ? 0 : 1);
      assert.deepEqual(await job.run([5], (value) => value), [5]);
    },
  );
}

for (const [items, worker] of [
  [null, () => {}],
  [[], null],
]) {
  test(
    "job: invalid input " + (items === null ? "items" : "worker"),
    async () => {
      await assert.rejects(new Job().run(items, worker), TypeError);
    },
  );
}

test("streams: text demo counts UTF-16 units, not bytes", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("input.txt"), "a\u20ac\u{1f600}\n");
  success(await f.run(["read-demo.mjs"]), "Unita UTF-16: 5\n");
});

test("streams: consumeText preserves multibyte boundaries and awaits each consumer", async (t) => {
  const f = await fixture(t);
  const text = "x".repeat(65535) + "\u20ac\u{1f600}" + "y".repeat(65536);
  await writeFile(f.file("input.txt"), text);
  let active = 0;
  let result = "";
  await consumeText(f.file("input.txt"), async (chunk) => {
    assert.equal(++active, 1);
    await Promise.resolve();
    result += chunk;
    active--;
  });
  assert.equal(result, text);
});

test("streams: empty text invokes no consumer", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("empty.txt"), "");
  await consumeText(f.file("empty.txt"), () => assert.fail("empty input"));
});

test("streams: missing text rejects and CLI reports failure", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    consumeText(f.file("missing"), () => {}),
    { code: "ENOENT" },
  );
  const result = await f.run(["read-demo.mjs"]);
  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /ENOENT/);
});

test("streams: invalid consumer rejects before file access", async () => {
  await assert.rejects(consumeText("does-not-exist", null), TypeError);
});

test("streams: consumer rejection propagates", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("input.txt"), "input");
  await assert.rejects(
    consumeText(f.file("input.txt"), async () => {
      throw failure;
    }),
    (error) => error === failure,
  );
});

for (const operation of ["consume", "write", "gzip"]) {
  test(
    "streams: pre-aborted " + operation + " does not open output",
    async (t) => {
      const f = await fixture(t);
      const options = { signal: AbortSignal.abort(failure) };
      const pending =
        operation === "consume"
          ? consumeText(f.file("missing"), () => {}, options)
          : operation === "write"
            ? writeChunks(f.file("out"), ["x"], options)
            : gzipFile(f.file("missing"), f.file("out"), options);
      await assert.rejects(pending, (error) => error === failure);
      await assert.rejects(access(f.file("out")), { code: "ENOENT" });
    },
  );
}

test("streams: write demo creates lines, refuses to overwrite", async (t) => {
  const f = await fixture(t);
  success(await f.run(["write-demo.mjs"]), "Scrittura completata\n");
  assert.equal(
    await readFile(f.file("output.txt"), "utf8"),
    "prima riga\nseconda riga\n",
  );
  const result = await f.run(["write-demo.mjs"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /EEXIST/);
  assert.equal(
    await readFile(f.file("output.txt"), "utf8"),
    "prima riga\nseconda riga\n",
  );
});

test("streams: writeChunks supports async iterable with mixed string and Buffer", async (t) => {
  const f = await fixture(t);
  async function* chunks() {
    yield "a";
    await Promise.resolve();
    yield Buffer.from([0, 255]);
  }
  await writeChunks(f.file("out"), chunks());
  assert.deepEqual(await readFile(f.file("out")), Buffer.from([97, 0, 255]));
});

test("streams: writeChunks empty iterable produces empty file", async (t) => {
  const f = await fixture(t);
  await writeChunks(f.file("out"), []);
  assert.equal((await readFile(f.file("out"))).length, 0);
});

test("streams: iterable failure rejects write, no rollback promised", async (t) => {
  const f = await fixture(t);
  async function* chunks() {
    yield "partial";
    throw failure;
  }
  await assert.rejects(
    writeChunks(f.file("out"), chunks()),
    (error) => error === failure,
  );
});

test("streams: writing into absent directory rejects", async (t) => {
  const f = await fixture(t);
  await assert.rejects(writeChunks(f.file("absent/out"), ["x"]), {
    code: "ENOENT",
  });
});

test("streams: gzip real binary file roundtrip preserves source", async (t) => {
  const f = await fixture(t);
  const input = Buffer.from(Array.from({ length: 200000 }, (_, i) => i % 256));
  await writeFile(f.file("source.bin"), input);
  await gzipFile(f.file("source.bin"), f.file("out.gz"));
  assert.deepEqual(gunzipSync(await readFile(f.file("out.gz"))), input);
  assert.deepEqual(await readFile(f.file("source.bin")), input);
});

test("streams: gzip empty file produces a valid archive", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("empty"), "");
  await gzipFile(f.file("empty"), f.file("out.gz"));
  assert.equal(gunzipSync(await readFile(f.file("out.gz"))).length, 0);
});

test("streams: gzip refuses existing destination without truncation", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("input"), "source");
  await writeFile(f.file("out.gz"), "keep");
  await assert.rejects(gzipFile(f.file("input"), f.file("out.gz")), {
    code: "EEXIST",
  });
  assert.equal(await readFile(f.file("out.gz"), "utf8"), "keep");
});

test("streams: gzip source and destination failures reject", async (t) => {
  const f = await fixture(t);
  await assert.rejects(gzipFile(f.file("missing"), f.file("out.gz")), {
    code: "ENOENT",
  });
  await writeFile(f.file("input"), "x");
  await assert.rejects(gzipFile(f.file("input"), f.file("absent/out.gz")), {
    code: "ENOENT",
  });
});

test("streams: gzip CLI handles paths with spaces and missing arguments", async (t) => {
  const f = await fixture(t);
  await writeFile(f.file("input text.txt"), "hello");
  success(
    await f.run(["gzip-demo.mjs", "input text.txt", "output text.gz"]),
    "Compressione completata\n",
  );
  assert.equal(
    gunzipSync(await readFile(f.file("output text.gz"))).toString(),
    "hello",
  );
  const result = await f.run(["gzip-demo.mjs"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Usage:/);
  const missing = await f.run(["gzip-demo.mjs", "missing", "other.gz"]);
  assert.equal(missing.code, 1);
  assert.match(missing.stderr, /ENOENT/);
});

async function encode(records) {
  const chunks = [];
  await pipeline(
    Readable.from(records),
    createJsonLines(),
    new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    }),
  );
  return Buffer.concat(chunks).toString("utf8");
}

test("streams: JSON Lines demo writes complete records", async (t) => {
  const f = await fixture(t);
  success(await f.run(["json-lines-demo.mjs"]), "Esportazione completata\n");
  assert.equal(
    await readFile(f.file("records.jsonl"), "utf8"),
    '{"id":1}\n{"id":2}\n',
  );
  const again = await f.run(["json-lines-demo.mjs"]);
  assert.equal(again.code, 1);
  assert.match(again.stderr, /EEXIST/);
});

test("streams: JSON Lines escapes newline and retains standard JSON conversion", async () => {
  assert.equal(
    await encode([{ text: "a\nb", missing: undefined }, { n: NaN }]),
    '{"text":"a\\nb"}\n{"n":null}\n',
  );
});

test("streams: JSON Lines handles empty input", async () => {
  assert.equal(await encode([]), "");
});

for (const kind of ["cycle", "bigint", "undefined", "throwing toJSON"]) {
  test("streams: JSON Lines rejects " + kind, async () => {
    const cycle = {};
    cycle.self = cycle;
    const record =
      kind === "cycle"
        ? cycle
        : kind === "bigint"
          ? { n: 1n }
          : kind === "undefined"
            ? undefined
            : {
                toJSON() {
                  throw failure;
                },
              };
    await assert.rejects(encode([record]));
  });
}

test("streams: controlled sink confirms false means buffered, then drain", async () => {
  let complete;
  const received = [];
  const sink = new Writable({
    highWaterMark: 1,
    write(chunk, encoding, callback) {
      received.push(chunk.toString());
      complete = callback;
    },
  });
  assert.equal(sink.write("abc"), false);
  assert.deepEqual(received, ["abc"]);
  assert.equal(sink.writableLength, 3);
  const drained = once(sink, "drain");
  complete();
  await drained;
  assert.equal(sink.writableLength, 0);
  const done = finished(sink, { cleanup: true });
  sink.end();
  await done;
  assert.deepEqual(received, ["abc"]);
});

test("streams: destination failure rejects pipeline and destroys source", async () => {
  const source = Readable.from(["x", "y"]);
  const sink = new Writable({
    write(chunk, encoding, callback) {
      callback(failure);
    },
  });
  await assert.rejects(pipeline(source, sink), (error) => error === failure);
  assert.equal(source.destroyed, true);
  assert.equal(sink.destroyed, true);
});

test("streams: abort during a controlled pipeline destroys both endpoints", async () => {
  const controller = new AbortController();
  const source = new Readable({ read() {} });
  const sink = new Writable({
    write(chunk, encoding, callback) {
      callback();
    },
  });
  const rejected = assert.rejects(
    pipeline(source, sink, { signal: controller.signal }),
    { name: "AbortError" },
  );
  source.push("prefix");
  controller.abort();
  await rejected;
  assert.equal(source.destroyed, true);
  assert.equal(sink.destroyed, true);
});
