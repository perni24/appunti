import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, realpath, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snippet } from "./note-examples.mjs";

const exec = promisify(execFile);
const childNote = "Child process";
const workerNote = "Worker threads";
const importCode = (source) =>
  import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
const { countPrimes } = await importCode(
  snippet(workerNote, "export function countPrimes"),
);
const { runWorker } = await importCode(
  snippet(workerNote, "export async function runWorker"),
);

async function fixture(t) {
  const temp = await realpath(tmpdir());
  const root = await mkdtemp(path.join(temp, "appunti-child-worker-"));
  async function removeRoot() {
    const actual = await realpath(root);
    assert.equal(actual, root);
    assert.ok(actual.startsWith(path.resolve(temp) + path.sep));
    assert.ok(path.basename(actual).startsWith("appunti-child-worker-"));
    await rm(actual, { recursive: true, force: true });
  }
  t.after(removeRoot);
  const file = (name) => path.join(root, name);
  const put = (name, source) => writeFile(file(name), source);
  for (const [name, note, marker] of [
    ["text-stats.mjs", childNote, "const args = process.argv.slice(2)"],
    ["progress.mjs", childNote, "for (let step = 1"],
    ["run-tools.mjs", childNote, "export async function inspectText"],
    ["child-main.mjs", childNote, "import { inspectText, runProgress }"],
    ["prime.mjs", workerNote, "export function countPrimes"],
    [
      "prime-worker.mjs",
      workerNote,
      "const value = countPrimes(workerData?.limit)",
    ],
    ["worker-client.mjs", workerNote, "export async function runWorker"],
    [
      "worker-main.mjs",
      workerNote,
      'import { runWorker } from "./worker-client.mjs"',
    ],
    [
      "transfer.mjs",
      workerNote,
      "const { port1, port2 } = new MessageChannel()",
    ],
  ])
    await put(name, snippet(note, marker));

  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      /^(PATH|SYSTEMROOT|WINDIR|COMSPEC|PATHEXT|TEMP|TMP|HOME|USERPROFILE)$/i.test(
        key,
      ),
    ),
  );
  async function run(args, extra = {}) {
    try {
      return {
        code: 0,
        ...(await exec(process.execPath, args, {
          cwd: root,
          env,
          encoding: "utf8",
          windowsHide: true,
          timeout: 15_000,
          maxBuffer: 1024 * 1024,
          ...extra,
        })),
      };
    } catch (error) {
      if (typeof error.code !== "number" || error.killed) throw error;
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  return {
    root,
    file,
    put,
    run,
    env,
    removeRoot,
    url: (name) => pathToFileURL(file(name)),
    source: (source, extra) =>
      run(["--input-type=module", "-e", source], extra),
    tools: () => import(pathToFileURL(file("run-tools.mjs")).href),
    worker: async (source, data, options) => {
      await put("controlled-worker.mjs", source);
      return runWorker(
        pathToFileURL(file("controlled-worker.mjs")),
        data,
        options,
      );
    },
  };
}

function success(result, output) {
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  if (output !== undefined) assert.equal(result.stdout, output);
}

for (const [name, expected] of [
  [
    "child-main.mjs",
    '{"codeUnits":10,"utf8Bytes":10}\nstep 1/3\nstep 2/3\nstep 3/3\nCompleted\n',
  ],
  ["worker-main.mjs", "9592\n"],
  ["transfer.mjs", "0 0\n1,2,3\n"],
]) {
  test(name + ": complete Markdown demo", async (t) => {
    const f = await fixture(t);
    success(await f.run([name]), expected);
  });
}

for (const text of [
  "hello",
  "",
  'a b "quoted"',
  "; echo NOT_EXECUTED | & $HOME *.txt",
  "--version",
  "\u00e8\ud83d\ude00",
  "x".repeat(4096),
]) {
  test(
    "execFile: literal text " + JSON.stringify(text.slice(0, 35)),
    async (t) => {
      const f = await fixture(t);
      const { inspectText } = await f.tools();
      assert.deepEqual(await inspectText(text), {
        stats: {
          codeUnits: text.length,
          utf8Bytes: Buffer.byteLength(text, "utf8"),
        },
        diagnostic: text === "" ? "Empty text" : "",
      });
    },
  );
}

for (const value of [undefined, null, 42, {}, [], "x".repeat(4097)]) {
  test(
    "inspectText: invalid " +
      (typeof value === "string" ? "length" : String(value)),
    async (t) => {
      const f = await fixture(t);
      await rm(f.file("text-stats.mjs"));
      const { inspectText } = await f.tools();
      await assert.rejects(inspectText(value), /Expected text/);
    },
  );
}

for (const args of [[], ["a", "b"], ["x".repeat(4097)]]) {
  test("text-stats CLI: validates argv " + args.length, async (t) => {
    const f = await fixture(t);
    const result = await f.run(["text-stats.mjs", ...args]);
    assert.equal(result.code, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Expected one text argument/);
  });
}

test("inspectText: native argv rejects NUL", async (t) => {
  const f = await fixture(t);
  const { inspectText } = await f.tools();
  await assert.rejects(inspectText("a\0b"), { code: "ERR_INVALID_ARG_VALUE" });
});

for (const [label, source, expected] of [
  ["invalid JSON", 'console.log("not json")', SyntaxError],
  ["null", 'console.log("null")', /Unexpected child output/],
  ["array", 'console.log("[]")', /Unexpected child output/],
  [
    "missing field",
    "console.log(JSON.stringify({codeUnits: 1}))",
    /Unexpected child output/,
  ],
  [
    "extra field",
    "console.log(JSON.stringify({codeUnits: 1, utf8Bytes: 1, extra: true}))",
    /Unexpected child output/,
  ],
  [
    "negative field",
    "console.log(JSON.stringify({codeUnits: -1, utf8Bytes: 1}))",
    /Unexpected child output/,
  ],
  [
    "fractional field",
    "console.log(JSON.stringify({codeUnits: 1, utf8Bytes: 1.5}))",
    /Unexpected child output/,
  ],
  [
    "string field",
    'console.log(JSON.stringify({codeUnits: "1", utf8Bytes: 1}))',
    /Unexpected child output/,
  ],
  [
    "stdout bound",
    'process.stdout.write("x".repeat(20000))',
    { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" },
  ],
  [
    "stderr bound",
    'process.stderr.write("x".repeat(20000))',
    { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" },
  ],
]) {
  test("inspectText: " + label, async (t) => {
    const f = await fixture(t);
    await f.put("text-stats.mjs", source);
    const { inspectText } = await f.tools();
    await assert.rejects(inspectText("input"), expected);
  });
}

test("execFile: rejection preserves process output and code", async (t) => {
  const f = await fixture(t);
  await f.put(
    "text-stats.mjs",
    'console.log("partial"); console.error("diagnostic"); process.exitCode = 7;',
  );
  const { inspectText } = await f.tools();
  await assert.rejects(inspectText("input"), (error) => {
    assert.equal(error.code, 7);
    assert.equal(error.stdout, "partial\n");
    assert.equal(error.stderr, "diagnostic\n");
    return true;
  });
});

test("child environment: no secret or NODE_OPTIONS inheritance", async (t) => {
  const f = await fixture(t);
  await f.put(
    "text-stats.mjs",
    "console.log(JSON.stringify({codeUnits: 1, utf8Bytes: 1})); console.error(JSON.stringify({secret: process.env.APPUNTI_SECRET ?? null, flags: process.env.NODE_OPTIONS ?? null}));",
  );
  success(
    await f.source(`
    import { inspectText } from "./run-tools.mjs";
    process.env.APPUNTI_SECRET = "fixture-only";
    process.env.NODE_OPTIONS = "--invalid-fixture-option";
    const result = await inspectText("x");
    console.log(result.diagnostic);
  `),
    '{"secret":null,"flags":null}\n',
  );
});

for (const method of ["inspectText", "runProgress"]) {
  test(method + ": pre-abort does not start missing script", async (t) => {
    const f = await fixture(t);
    await rm(
      f.file(method === "inspectText" ? "text-stats.mjs" : "progress.mjs"),
    );
    const api = await f.tools();
    const reason = new Error("pre-aborted");
    const options = { signal: AbortSignal.abort(reason) };
    const result =
      method === "inspectText"
        ? api[method]("x", options)
        : api[method](options);
    await assert.rejects(result, (error) => error === reason);
  });
}

test("runProgress: nonzero exit is rejected even without spawn error", async (t) => {
  const f = await fixture(t);
  await f.put("progress.mjs", "process.exitCode = 4;");
  const { runProgress } = await f.tools();
  await assert.rejects(runProgress(), /Child failed: code=4/);
});

test("runProgress: missing script and main failure path", async (t) => {
  const f = await fixture(t);
  await rm(f.file("progress.mjs"));
  const result = await f.run(["child-main.mjs"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Child failed: code=1/);
  assert.doesNotMatch(result.stdout, /Completed/);
});

test("runProgress: missing cwd reports spawn error and close", async (t) => {
  const f = await fixture(t);
  const { runProgress } = await f.tools();
  await f.removeRoot();
  // Recreate only this owned fixture root so its registered cleanup remains valid.
  try {
    await assert.rejects(runProgress(), { code: "ENOENT" });
  } finally {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(f.root);
  }
});

const waitForReady = `
  import { access } from "node:fs/promises";
  import { setTimeout as delay } from "node:timers/promises";
  async function ready() {
    const deadline = Date.now() + 5000;
    while (true) {
      try { await access("./ready"); return; } catch (error) {
        if (error.code !== "ENOENT" || Date.now() > deadline) throw error;
        await delay(5);
      }
    }
  }
`;

for (const method of ["inspectText", "runProgress"]) {
  test(method + ": abort after child readiness", async (t) => {
    const f = await fixture(t);
    await f.put(
      method === "inspectText" ? "text-stats.mjs" : "progress.mjs",
      'import { writeFileSync } from "node:fs"; writeFileSync("ready", "yes"); setInterval(() => {}, 1000);',
    );
    success(
      await f.source(`
      import assert from "node:assert/strict";
      import { ${method} } from "./run-tools.mjs";
      ${waitForReady}
      const controller = new AbortController();
      const pending = ${method}(${method === "inspectText" ? '"x",' : ""} { signal: controller.signal });
      const observed = assert.rejects(pending, { name: "AbortError" });
      await ready();
      controller.abort(new Error("fixture abort"));
      await observed;
      console.log("aborted");
    `),
      "aborted\n",
    );
  });
}

test("runProgress: configured timeout stops an owned idle child", async (t) => {
  const f = await fixture(t);
  await f.put("progress.mjs", "setInterval(() => {}, 1000);");
  success(
    await f.source(`
    import assert from "node:assert/strict";
    import { runProgress } from "./run-tools.mjs";
    await assert.rejects(runProgress(), /Child failed:/);
    console.log("timed out");
  `),
    "timed out\n",
  );
});

for (const [limit, expected] of [
  [0, 0],
  [1, 0],
  [2, 1],
  [3, 2],
  [4, 2],
  [10, 4],
  [100, 25],
  [100000, 9592],
  [1000000, 78498],
]) {
  test("countPrimes: " + limit, () =>
    assert.equal(countPrimes(limit), expected),
  );
}
for (const limit of [-1, 1.5, 1000001, Infinity, NaN, "10", null, undefined]) {
  test("countPrimes: rejects " + String(limit), () =>
    assert.throws(() => countPrimes(limit), RangeError),
  );
}

for (const timeoutMs of [0, -1, 0.5, 60001, Infinity, NaN, "50"]) {
  test("runWorker: invalid timeout " + timeoutMs, async () => {
    await assert.rejects(
      runWorker(new URL("file:///not-created.mjs"), {}, { timeoutMs }),
      RangeError,
    );
  });
}
test("runWorker: requires file URL and real AbortSignal", async () => {
  await assert.rejects(runWorker("./worker.mjs", {}), TypeError);
  await assert.rejects(
    runWorker(new URL("https://example.invalid/worker.mjs"), {}),
    TypeError,
  );
  await assert.rejects(
    runWorker(new URL("file:///not-created.mjs"), {}, { signal: {} }),
    TypeError,
  );
});

test("runWorker: pre-abort reason preserved before constructor", async () => {
  const reason = new Error("already stopped");
  await assert.rejects(
    runWorker(
      new URL("file:///not-created.mjs"),
      { f() {} },
      {
        signal: AbortSignal.abort(reason),
      },
    ),
    (error) => error === reason,
  );
});

test("runWorker: missing module becomes error, not pending forever", async (t) => {
  const f = await fixture(t);
  await assert.rejects(runWorker(f.url("absent.mjs"), {}), {
    code: "MODULE_NOT_FOUND",
  });
});
test("runWorker: uncloneable initial data rejects construction", async (t) => {
  const f = await fixture(t);
  await assert.rejects(runWorker(f.url("prime-worker.mjs"), { f() {} }), {
    name: "DataCloneError",
  });
});
test("prime worker: validation errors propagate", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    runWorker(f.url("prime-worker.mjs"), { limit: -1 }),
    /Expected an integer/,
  );
});
test("prime worker: direct invocation fails clearly", async (t) => {
  const f = await fixture(t);
  const result = await f.run(["prime-worker.mjs"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Run this file as a worker/);
});

const portImport =
  'import { parentPort, workerData } from "node:worker_threads";';
for (const [label, source, expected] of [
  ["empty exit", "", /without a result/],
  ["nonzero exit", "process.exitCode = 3;", /code 3/],
  ["exception", 'throw new Error("boom");', /boom/],
  [
    "result then exception",
    portImport +
      'parentPort.postMessage({type:"result",value:1}); throw new Error("late error");',
    /late error/,
  ],
  [
    "result then nonzero exit",
    portImport +
      'parentPort.postMessage({type:"result",value:1}); process.exitCode = 6;',
    /code 6/,
  ],
  [
    "duplicate result",
    portImport +
      'parentPort.postMessage({type:"result",value:1}); parentPort.postMessage({type:"result",value:2});',
    /Invalid or duplicate/,
  ],
  [
    "null envelope",
    portImport + "parentPort.postMessage(null);",
    /Invalid or duplicate/,
  ],
  [
    "array envelope",
    portImport + "parentPort.postMessage([]);",
    /Invalid or duplicate/,
  ],
  [
    "wrong type",
    portImport + 'parentPort.postMessage({type:"progress",value:1});',
    /Invalid or duplicate/,
  ],
  [
    "missing value",
    portImport + 'parentPort.postMessage({type:"result"});',
    /Invalid or duplicate/,
  ],
  [
    "extra field",
    portImport + 'parentPort.postMessage({type:"result",value:1,extra:true});',
    /Invalid or duplicate/,
  ],
]) {
  test("worker lifecycle: " + label, async (t) => {
    const f = await fixture(t);
    await assert.rejects(f.worker(source, {}), expected);
  });
}

test("worker: undefined is an explicit value, not a missing result", async (t) => {
  const f = await fixture(t);
  assert.equal(
    await f.worker(
      portImport + 'parentPort.postMessage({type:"result",value:undefined});',
      {},
    ),
    undefined,
  );
});
test("worker: cloned data and empty environment/execArgv", async (t) => {
  const f = await fixture(t);
  assert.deepEqual(
    await f.worker(
      portImport +
        'parentPort.postMessage({type:"result",value:{data:workerData,env:process.env,flags:process.execArgv}});',
      { values: [1, 2] },
    ),
    { data: { values: [1, 2] }, env: {}, flags: [] },
  );
});
test("worker: transferList detaches all sender views and delivers data", async (t) => {
  const f = await fixture(t);
  const bytes = new Uint8Array([4, 5, 6]);
  const alias = bytes.subarray(1);
  assert.deepEqual(
    await f.worker(
      portImport +
        'parentPort.postMessage({type:"result",value:[...workerData.bytes]});',
      { bytes },
      { transferList: [bytes.buffer] },
    ),
    [4, 5, 6],
  );
  assert.equal(bytes.byteLength, 0);
  assert.equal(alias.byteLength, 0);
});
test("worker: clone preserves caller buffer, Buffer arrives as Uint8Array", async (t) => {
  const f = await fixture(t);
  const bytes = Buffer.from([7, 8]);
  assert.deepEqual(
    await f.worker(
      portImport +
        `
    workerData.bytes[0] = 9;
    parentPort.postMessage({type:"result",value:{
      isBuffer:Buffer.isBuffer(workerData.bytes),
      isView:workerData.bytes instanceof Uint8Array,
      bytes:[...workerData.bytes],
    }});
  `,
      { bytes },
    ),
    { isBuffer: false, isView: true, bytes: [9, 8] },
  );
  assert.deepEqual([...bytes], [7, 8]);
});

for (const [label, source, expected] of [
  ["idle", "setInterval(() => {}, 1000);", /timed out/],
  [
    "result but still active",
    portImport +
      'parentPort.postMessage({type:"result",value:1}); setInterval(() => {}, 1000);',
    /timed out/,
  ],
]) {
  test("worker: timeout " + label, async (t) => {
    const f = await fixture(t);
    await assert.rejects(f.worker(source, {}, { timeoutMs: 150 }), expected);
  });
}

test("worker: abort a running CPU loop, then remove signal listener", async (t) => {
  const f = await fixture(t);
  await f.put(
    "controlled-worker.mjs",
    `
    import { writeFileSync } from "node:fs";
    import { workerData } from "node:worker_threads";
    writeFileSync(workerData.ready, "yes");
    while (true) {}
  `,
  );
  success(
    await f.source(`
    import assert from "node:assert/strict";
    import { getEventListeners } from "node:events";
    import { fileURLToPath } from "node:url";
    import { runWorker } from "./worker-client.mjs";
    ${waitForReady}
    const controller = new AbortController();
    const pending = runWorker(new URL("./controlled-worker.mjs", import.meta.url), {
      ready: fileURLToPath(new URL("./ready", import.meta.url)),
    }, {signal:controller.signal});
    const observed = assert.rejects(pending, {name:"AbortError"});
    await ready();
    controller.abort("fixture reason");
    await observed;
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    console.log("stopped");
  `),
    "stopped\n",
  );
});

test("worker: successful exit clears timer and signal listener", async (t) => {
  const f = await fixture(t);
  success(
    await f.source(`
    import assert from "node:assert/strict";
    import { getEventListeners } from "node:events";
    import { runWorker } from "./worker-client.mjs";
    const controller = new AbortController();
    assert.equal(await runWorker(new URL("./prime-worker.mjs", import.meta.url),
      {limit:10}, {signal:controller.signal}), 4);
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    assert.equal(process.getActiveResourcesInfo().includes("Timeout"), false);
    controller.abort();
    console.log("clean");
  `),
    "clean\n",
  );
});

test("worker main: rejects a result with the wrong value schema", async (t) => {
  const f = await fixture(t);
  await f.put(
    "prime-worker.mjs",
    portImport + 'parentPort.postMessage({type:"result",value:"9592"});',
  );
  const result = await f.run(["worker-main.mjs"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unexpected prime count/);
});
