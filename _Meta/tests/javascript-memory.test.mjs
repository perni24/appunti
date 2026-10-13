import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const lifecycle = "Memory Lifecycle";
const gc = "Garbage Collection";

function execute(note, marker, extra = {}) {
  const logs = [];
  const context = vm.createContext({
    console: { log: (...args) => logs.push(args) },
    ...extra,
  });
  vm.runInContext(snippet(note, marker), context);
  return { context, logs };
}

for (const [note, marker, expected] of [
  [lifecycle, "function readName", [["Luca"]]],
  [lifecycle, "function createCounter", [[1, 2]]],
  [lifecycle, "let firstNumber", [[1]]],
  [lifecycle, "let first =", [[2]]],
  [lifecycle, "function update", [[2]]],
  [gc, "let user =", [["Luca"]]],
  [gc, "function inspectCycle", [[true]]],
  [gc, "function createPair", [["second"], [true], [0]]],
  [gc, "function readWeakLabel", [["cache-1"]]],
  [gc, "const finalizers =", [[true], [false]]],
]) {
  test(`Memoria: output dello snippet ${note} / ${marker}`, () => {
    assert.deepEqual(execute(note, marker).logs, expected);
  });
}

test("Memoria: ogni closure del contatore ha un binding indipendente", () => {
  const { context } = execute(lifecycle, "function createCounter");
  assert.equal(vm.runInContext("next()", context), 3);
  assert.equal(vm.runInContext("createCounter()()", context), 1);
  assert.equal(vm.runInContext("next()", context), 4);
});

test("GC: cancellare la voce della Map non invalida un alias esterno", () => {
  const { context } = execute(gc, "function createPair");
  assert.equal(
    vm.runInContext(
      `
    const retained = createPair();
    registry.set("retained", retained);
    registry.delete("retained");
    retained.other.other === retained && registry.size === 0;
  `,
      context,
    ),
    true,
  );
});

test("GC: WeakRef mantiene il target nel job corrente dopo il reset", () => {
  const { context } = execute(gc, "function readWeakLabel");
  assert.equal(vm.runInContext("item", context), null);
  assert.equal(vm.runInContext("readWeakLabel(reference)", context), "cache-1");
});

test("GC: ramo target assente simulato, una sola lettura deref", () => {
  const { context } = execute(gc, "function readWeakLabel");
  let calls = 0;
  context.absent = {
    deref() {
      calls++;
      return undefined;
    },
  };
  assert.equal(vm.runInContext("readWeakLabel(absent)", context), null);
  assert.equal(calls, 1);
});

test("GC: unregister rimuove la registrazione, non distrugge il target", () => {
  const { context } = execute(gc, "const finalizers =");
  assert.equal(
    vm.runInContext(
      `
    const retained = {id: "still-live"};
    finalizers.register(retained, retained.id, token);
    const removed = finalizers.unregister(token);
    removed && retained.id === "still-live";
  `,
      context,
    ),
    true,
  );
  assert.throws(
    () => vm.runInContext("finalizers.register(retained, retained)", context),
    { name: "TypeError" },
  );
});

function tickerFixture() {
  const scheduled = [];
  const cleared = [];
  const { context, logs } = execute(lifecycle, "function startTicker", {
    setInterval(callback, delay) {
      const id = { callback, delay };
      scheduled.push(id);
      return id;
    },
    clearInterval(id) {
      cleared.push(id);
    },
  });
  return { context, logs, scheduled, cleared, start: context.startTicker };
}

test("Memoria: ticker legge la lunghezza attuale senza mutare l'array", () => {
  const { start, scheduled, cleared } = tickerFixture();
  const data = [];
  const values = [];
  const stop = start(data, (value) => values.push(value));
  assert.equal(scheduled[0].delay, 1000);
  scheduled[0].callback();
  data.push(1, 2);
  scheduled[0].callback();
  stop();
  stop();
  scheduled[0].callback();
  assert.deepEqual(values, [0, 2]);
  assert.deepEqual(data, [1, 2]);
  assert.deepEqual(cleared, [scheduled[0]]);
});

for (const [label, data, callback] of [
  ["array null", null, () => {}],
  ["oggetto non array", {}, () => {}],
  ["callback null", [], null],
  ["callback non funzione", [], "tick"],
]) {
  test(`Memoria: ticker rifiuta ${label} prima di registrare il timer`, () => {
    const { start, scheduled } = tickerFixture();
    assert.throws(() => start(data, callback), { name: "TypeError" });
    assert.equal(scheduled.length, 0);
  });
}

test("Memoria: ticker puo fermarsi dalla propria callback", () => {
  const { start, scheduled, cleared } = tickerFixture();
  let calls = 0;
  const stop = start([1], () => {
    calls++;
    stop();
  });
  scheduled[0].callback();
  scheduled[0].callback();
  assert.equal(calls, 1);
  assert.deepEqual(cleared, [scheduled[0]]);
});

test("Memoria: callback ticker propaga gli errori come documentato", () => {
  const { start, scheduled } = tickerFixture();
  const failure = new Error("callback failure");
  const stop = start([], () => {
    throw failure;
  });
  assert.throws(scheduled[0].callback, (error) => error === failure);
  stop();
  assert.doesNotThrow(scheduled[0].callback);
});

test("Memoria: anche lo snippet di avvio ticker e eseguibile", () => {
  const { context, logs, scheduled, cleared } = tickerFixture();
  vm.runInContext(snippet(lifecycle, "const stopTicker ="), context);
  scheduled[0].callback();
  vm.runInContext("stopTicker()", context);
  scheduled[0].callback();
  assert.deepEqual(logs, [[3]]);
  assert.deepEqual(cleared, [scheduled[0]]);
});

test("GC: modulo Node espone metriche numeriche senza attendere raccolte", () => {
  const source =
    "console.table = (value) => process.stdout.write(JSON.stringify(value));\n" +
    snippet(gc, "import { memoryUsage }");
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", source],
    {
      encoding: "utf8",
      timeout: 10000,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const metrics = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(metrics), [
    "rss",
    "heapTotal",
    "heapUsed",
    "external",
    "arrayBuffers",
  ]);
  for (const value of Object.values(metrics)) {
    assert.ok(Number.isFinite(value) && value >= 0);
  }
  assert.ok(metrics.heapUsed <= metrics.heapTotal);
  assert.ok(metrics.arrayBuffers <= metrics.external);
});
