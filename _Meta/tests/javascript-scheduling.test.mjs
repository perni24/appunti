import assert from "node:assert/strict";
import vm from "node:vm";
import { test } from "node:test";
import { setImmediate as settle } from "node:timers/promises";
import { snippet } from "./note-examples.mjs";

const note = "Scheduling Browser";
function fixture(source, extra = {}) {
  let nextId = 0;
  const timers = new Map();
  const errors = [];
  const context = vm.createContext({
    AbortController,
    performance: { now: () => 0 },
    console: { log() {}, error: (...args) => errors.push(args) },
    setTimeout(fn, delay) {
      const id = ++nextId;
      timers.set(id, { fn, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
    ...extra,
  });
  vm.runInContext(source, context);
  return {
    context,
    timers,
    errors,
    run: (code) => vm.runInContext(code, context),
    async tick() {
      const entry = timers.entries().next().value;
      assert.ok(entry, "Attesa una callback pendente");
      timers.delete(entry[0]);
      await entry[1].fn();
    },
  };
}

const pollSource = snippet(note, "function startPolling");
test("Scheduling: polling avvia subito e attende la richiesta precedente", async () => {
  let finish;
  let calls = 0;
  const f = fixture(pollSource, {
    task: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  f.run("globalThis.stop = startPolling(task, 25)");
  assert.equal(calls, 1);
  assert.equal(f.timers.size, 0);
  finish();
  await settle();
  assert.equal([...f.timers.values()][0].delay, 25);
  const pending = f.tick();
  assert.equal(calls, 2);
  assert.equal(f.timers.size, 0);
  finish();
  await pending;
  f.run("stop()");
  assert.equal(f.timers.size, 0);
});

test("Scheduling: stop abortisce il task e impedisce la ripianificazione", async () => {
  let finish;
  let signal;
  const f = fixture(pollSource, {
    task: (value) => {
      signal = value;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  f.run("globalThis.stop = startPolling(task)");
  f.run("stop(); stop()");
  assert.equal(signal.aborted, true);
  finish();
  await settle();
  assert.equal(f.timers.size, 0);
  assert.deepEqual(f.errors, []);
});

test("Scheduling: errore di polling viene segnalato e seguito da retry", async () => {
  const f = fixture(pollSource, {
    task: () => Promise.reject(new Error("offline")),
  });
  f.run("globalThis.stop = startPolling(task)");
  await settle();
  assert.equal(f.errors.length, 1);
  assert.equal(f.errors[0][1].message, "offline");
  assert.equal(f.timers.size, 1);
  f.run("stop()");
});

for (const delay of [-1, Infinity, NaN, 2147483648]) {
  test(`Scheduling: polling rifiuta il ritardo ${delay}`, () => {
    const f = fixture(pollSource, { delay });
    assert.throws(() => f.run("startPolling(() => {}, delay)"), {
      name: "RangeError",
    });
    assert.equal(f.timers.size, 0);
  });
}
test("Scheduling: polling rifiuta un task non invocabile", () => {
  const f = fixture(pollSource);
  assert.throws(() => f.run("startPolling(null)"), { name: "TypeError" });
});

const chunkSource =
  snippet(note, "function yieldToBrowser") +
  "\n" +
  snippet(note, "async function sumWithBudget");
test("Scheduling: somma a blocchi usa yield e restituisce il totale", async () => {
  let calls = 0;
  const f = fixture(chunkSource, {
    scheduler: {
      yield() {
        calls++;
        return Promise.resolve();
      },
    },
  });
  assert.equal(
    await f.run("sumWithBudget([10, 20, 30, 40], {batchSize: 2})"),
    100,
  );
  assert.equal(calls, 1);
});
test("Scheduling: fallback di yield crea una task timer", async () => {
  const f = fixture(chunkSource, {
    scheduler: {
      postTask() {
        throw Error("Non richiesto");
      },
    },
  });
  const pending = f.run("sumWithBudget([1, 2, 3], {batchSize: 1})");
  assert.equal(f.timers.size, 1);
  await f.tick();
  await f.tick();
  assert.equal(await pending, 6);
  assert.equal(f.timers.size, 0);
});
test("Scheduling: budget temporale limita il blocco prima di batchSize", async () => {
  let time = 0;
  let calls = 0;
  const f = fixture(chunkSource, {
    performance: { now: () => time++ },
    scheduler: {
      yield() {
        calls++;
        return Promise.resolve();
      },
    },
  });
  assert.equal(await f.run("sumWithBudget([1, 2, 3], {budgetMs: 1})"), 6);
  assert.equal(calls, 2);
});
test("Scheduling: array vuoto non richiede pause", async () => {
  const f = fixture(chunkSource);
  assert.equal(await f.run("sumWithBudget([])"), 0);
  assert.equal(f.timers.size, 0);
});
for (const [input, options, name] of [
  ["null", "{}", "TypeError"],
  ["[1,,3]", "{}", "TypeError"],
  ["[1, Infinity]", "{}", "TypeError"],
  ["[1, '2']", "{}", "TypeError"],
  ["[Number.MAX_VALUE, Number.MAX_VALUE]", "{}", "RangeError"],
  ["[1]", "{budgetMs: 0}", "RangeError"],
  ["[1]", "{budgetMs: Infinity}", "RangeError"],
  ["[1]", "{batchSize: 0}", "RangeError"],
  ["[1]", "{batchSize: 1.5}", "RangeError"],
]) {
  test(`Scheduling: valida ${input} con ${options}`, async () => {
    const f = fixture(chunkSource);
    await assert.rejects(f.run(`sumWithBudget(${input}, ${options})`), {
      name,
    });
    assert.equal(f.timers.size, 0);
  });
}
test("Scheduling: abort precedente all'avvio rifiuta anche array vuoto", async () => {
  const controller = new AbortController();
  controller.abort(new Error("annullato"));
  const f = fixture(chunkSource, { signal: controller.signal });
  await assert.rejects(f.run("sumWithBudget([], {signal})"), /annullato/);
});
test("Scheduling: abort durante la pausa impedisce il blocco successivo", async () => {
  const controller = new AbortController();
  const f = fixture(chunkSource, { signal: controller.signal });
  const pending = f.run("sumWithBudget([1, 2, 3], {signal, batchSize: 1})");
  const rejected = assert.rejects(pending, { name: "AbortError" });
  controller.abort();
  await f.tick();
  await rejected;
  assert.equal(f.timers.size, 0);
});
test("Scheduling: il rifiuto di scheduler.yield raggiunge il chiamante", async () => {
  const f = fixture(chunkSource, {
    scheduler: { yield: () => Promise.reject(new Error("yield abortito")) },
  });
  await assert.rejects(
    f.run("sumWithBudget([1, 2], {batchSize: 1})"),
    /yield abortito/,
  );
});

const idleSource = snippet(note, "const idleResults");
test("Scheduling: fallback idle completa una operazione per callback", async () => {
  const f = fixture(idleSource);
  await f.tick();
  assert.equal(f.run("cursor"), 1);
  for (let i = 1; i < 200; i++) await f.tick();
  assert.equal(f.run("idleResults.length"), 200);
  assert.equal(f.run("idleResults[199]"), 199 ** 2);
  assert.equal(f.timers.size, 0);
});
test("Scheduling: cancellazione idle rimuove il timer fallback", () => {
  const f = fixture(idleSource);
  f.run("cancelIdleWork(); cancelIdleWork()");
  assert.equal(f.timers.size, 0);
  assert.equal(f.run("cursor"), 0);
});
test("Scheduling: idle senza budget ripianifica, timeout esegue solo un lavoro", () => {
  let callback;
  let cancelled;
  const f = fixture(idleSource, {
    requestIdleCallback: (fn, options) => {
      assert.equal(options.timeout, 2000);
      callback = fn;
      return 12;
    },
    cancelIdleCallback: (id) => {
      cancelled = id;
    },
  });
  callback({ didTimeout: false, timeRemaining: () => 0 });
  assert.equal(f.run("cursor"), 0);
  callback({ didTimeout: true, timeRemaining: () => 100 });
  assert.equal(f.run("cursor"), 1);
  callback({ didTimeout: false, timeRemaining: () => 100 });
  assert.equal(f.run("cursor"), 51);
  f.run("cancelIdleWork()");
  assert.equal(cancelled, 12);
  callback({ didTimeout: false, timeRemaining: () => 100 });
  assert.equal(f.run("cursor"), 51);
});

const animationSource = snippet(note, "function animateTranslation");
function animationFixture(reduced = false) {
  class HTMLElement {
    style = {};
  }
  let nextId = 0;
  const frames = new Map();
  const f = fixture(animationSource, {
    HTMLElement,
    matchMedia: () => ({ matches: reduced }),
    requestAnimationFrame: (fn) => {
      frames.set(++nextId, fn);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  f.run(
    "globalThis.element = new HTMLElement(); globalThis.stop = animateTranslation(element)",
  );
  return {
    ...f,
    frames,
    frame(time) {
      const [id, fn] = frames.entries().next().value;
      frames.delete(id);
      fn(time);
    },
  };
}
test("Scheduling: rAF parte da zero e usa tempo relativo fino al completamento", () => {
  const f = animationFixture();
  f.frame(0);
  assert.equal(f.run("element.style.transform"), "translateX(0px)");
  f.frame(500);
  assert.equal(f.run("element.style.transform"), "translateX(100px)");
  f.frame(9000);
  assert.equal(f.run("element.style.transform"), "translateX(200px)");
  assert.equal(f.frames.size, 0);
});
test("Scheduling: rAF ignora l'origine assoluta e cancella il frame successivo", () => {
  const f = animationFixture();
  f.frame(80000);
  assert.equal(f.run("element.style.transform"), "translateX(0px)");
  f.run("stop(); stop()");
  assert.equal(f.frames.size, 0);
});
test("Scheduling: reduced motion imposta lo stato finale senza rAF", () => {
  const f = animationFixture(true);
  assert.equal(f.frames.size, 0);
  assert.equal(f.run("element.style.transform"), "translateX(200px)");
});
test("Scheduling: animazione valida elemento e durata", () => {
  const f = animationFixture();
  assert.throws(() => f.run("animateTranslation(null)"), { name: "TypeError" });
  assert.throws(() => f.run("animateTranslation(element, 0)"), {
    name: "RangeError",
  });
  f.run("stop()");
});
