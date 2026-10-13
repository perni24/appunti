import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { snippet } from "./note-examples.mjs";

const optimization = "Optimization";
const buffers = "Buffer e Typed Arrays";
const normalize = (value) =>
  Array.isArray(value) ? Array.from(value, normalize) : value;

function execute(note, marker, globals = {}) {
  const logs = [];
  const context = vm.createContext({
    console: { log: (...args) => logs.push(normalize(args)) },
    TextEncoder,
    TextDecoder,
    Blob,
    structuredClone,
    ArrayBuffer,
    SharedArrayBuffer,
    Uint8Array,
    Uint16Array,
    DataView,
    performance,
    ...globals,
  });
  vm.runInContext(snippet(note, marker), context);
  return { context, logs };
}

for (const [note, marker, expected] of [
  [optimization, "const products =", [[["p2", "p3"]]]],
  [buffers, "const buffer = new ArrayBuffer(8)", [[8, 8], [2, 2, 4], [true]]],
  [buffers, "const wrapped =", [[[255, 0, 3]], [[0, 255, 2, 4]], [1n]]],
  [buffers, "const source =", [[[10, 99, 30, 40]], [[20, 30]], [true]]],
  [buffers, "const values16 =", [[[52, 120]], [4]]],
  [buffers, "const storage =", [[18, 52], [4660], [13330]]],
  [buffers, "const text =", [[5, 6], [true]]],
  [buffers, "const decoder =", [["\u00e8"]]],
  [
    buffers,
    "typeof ArrayBuffer.prototype.resize",
    [
      [8, 2],
      [1, 0],
      [2, 0],
    ],
  ],
  [buffers, "const original =", [[[7, 8, 9]], [0, 0]]],
  [buffers, "typeof SharedArrayBuffer", [[10], [11]]],
]) {
  test(`Optimization/buffer: output ${marker}`, () => {
    assert.deepEqual(execute(note, marker).logs, expected);
  });
}

test("Optimization: misura e risultato, senza soglie di performance", () => {
  const { logs } = execute(optimization, "const values =");
  assert.equal(logs[0][0].total, 49_995_000);
  assert.ok(Number.isFinite(logs[0][0].durationMs));
  assert.ok(logs[0][0].durationMs >= 0);
});

test("Optimization: formatter riusato e factory con proprieta x/y", () => {
  const { context, logs } = execute(optimization, "const formatter =");
  const formatter = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  });
  assert.deepEqual(logs, [[[formatter.format(12.5), formatter.format(3)]]]);
  vm.runInContext(snippet(optimization, "function createPoint"), context);
  assert.equal(vm.runInContext("first.x + second.y", context), 5);
  assert.equal(vm.runInContext("first === second", context), false);
});

function timers() {
  let next = 0;
  const pending = new Map();
  return {
    pending,
    setTimeout(callback, delay) {
      const id = next++;
      pending.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
    fire() {
      const [id, { callback }] = pending.entries().next().value;
      pending.delete(id);
      callback();
    },
  };
}

test("Debounce: trailing, ultimo this/argomenti e timer con ID zero", () => {
  const clock = timers();
  const { context } = execute(optimization, "function debounce", clock);
  const calls = [];
  const fn = context.debounce(function (...args) {
    calls.push([this.id, ...args]);
  });
  assert.equal(fn.call({ id: "old" }, 1), undefined);
  fn.call({ id: "last" }, 2, 3);
  assert.equal(clock.pending.size, 1);
  assert.equal([...clock.pending.values()][0].delay, 300);
  assert.deepEqual(calls, []);
  clock.fire();
  assert.deepEqual(calls, [["last", 2, 3]]);
});

test("Debounce: cancel ripetuto e riuso, dati mantenuti per riferimento", () => {
  const clock = timers();
  const { context } = execute(optimization, "function debounce", clock);
  const seen = [];
  const fn = context.debounce((value) => seen.push(value.count), 0);
  const data = { count: 1 };
  fn(data);
  fn.cancel();
  fn.cancel();
  assert.equal(clock.pending.size, 0);
  fn(data);
  data.count = 2;
  clock.fire();
  assert.deepEqual(seen, [2]);
});

test("Debounce: rientranza e cancellazione del nuovo timer", () => {
  const clock = timers();
  const { context } = execute(optimization, "function debounce", clock);
  let count = 0;
  const fn = context.debounce(() => {
    count++;
    fn();
  });
  fn();
  clock.fire();
  assert.equal(count, 1);
  assert.equal(clock.pending.size, 1);
  fn.cancel();
  assert.equal(clock.pending.size, 0);
});

test("Debounce: errore sincrono nel task del timer, non nella pianificazione", () => {
  const clock = timers();
  const { context } = execute(optimization, "function debounce", clock);
  const failure = new Error("callback");
  const fn = context.debounce(() => {
    throw failure;
  });
  assert.doesNotThrow(() => fn());
  assert.throws(
    () => clock.fire(),
    (error) => error === failure,
  );
  assert.equal(clock.pending.size, 0);
});

for (const name of ["debounce", "throttleLeading"]) {
  test(`${name}: validazione callback e delay prima di registrare lavoro`, () => {
    const clock = timers();
    const { context } = execute(optimization, `function ${name}`, clock);
    for (const callback of [null, 1, "callback", {}]) {
      assert.throws(() => context[name](callback), { name: "TypeError" });
    }
    for (const delay of [-1, 0.5, NaN, Infinity, "10", 2_147_483_648]) {
      assert.throws(() => context[name](() => {}, delay), {
        name: "RangeError",
      });
    }
    for (const delay of [0, 2_147_483_647])
      assert.doesNotThrow(() => context[name](() => {}, delay));
    assert.equal(clock.pending.size, 0);
  });
}

test("Throttle: prima chiamata a zero, finestra esatta, this e risultato", () => {
  let now = 0;
  const { context } = execute(optimization, "function throttleLeading", {
    performance: { now: () => now },
  });
  const calls = [];
  const fn = context.throttleLeading(function (value) {
    calls.push([this.id, value]);
    return value * 2;
  });
  const receiver = { id: "owner" };
  assert.equal(fn.call(receiver, 2), 4);
  now = 99;
  assert.equal(fn.call(receiver, 3), undefined);
  now = 100;
  assert.equal(fn.call(receiver, 4), 8);
  now = 150;
  fn.call(receiver, 5);
  assert.deepEqual(calls, [
    ["owner", 2],
    ["owner", 4],
  ]);
});

test("Throttle: errore consuma finestra, zero non sopprime eventi", () => {
  let now = 0;
  const { context } = execute(optimization, "function throttleLeading", {
    performance: { now: () => now },
  });
  const fn = context.throttleLeading(() => {
    throw new Error("failure");
  }, 10);
  assert.throws(() => fn(), /failure/);
  assert.equal(fn(), undefined);
  now = 10;
  assert.throws(() => fn(), /failure/);
  let calls = 0;
  const zero = context.throttleLeading(() => ++calls, 0);
  zero();
  zero();
  assert.equal(calls, 2);
});

test("DOM: tutte le letture precedono le scritture; input invalidi senza effetti", () => {
  const events = [];
  class Element {
    constructor(height) {
      this.height = height;
      this.style = new Proxy(
        {},
        {
          set: (target, key, value) => {
            events.push("write");
            target[key] = value;
            return true;
          },
        },
      );
    }
    getBoundingClientRect() {
      events.push("read");
      return { height: this.height };
    }
  }
  const { context } = execute(optimization, "function growBoxes", {
    HTMLElement: Element,
  });
  const nodes = [new Element(12), new Element(20)];
  context.growBoxes(nodes);
  assert.deepEqual(events, [
    "read",
    "read",
    "write",
    "write",
    "write",
    "write",
  ]);
  assert.equal(nodes[0].style.height, "22px");
  assert.equal(nodes[1].style.boxSizing, "border-box");
  events.length = 0;
  assert.throws(() => context.growBoxes([nodes[0], {}]), { name: "TypeError" });
  for (const extra of [-1, NaN, Infinity, "10"])
    assert.throws(() => context.growBoxes(nodes, extra), {
      name: "RangeError",
    });
  context.growBoxes([]);
  assert.deepEqual(events, []);
});

test("Buffer: allineamento, limiti e conversione rispetto a reinterpretazione", () => {
  const { context } = execute(buffers, "const values16 =");
  assert.throws(
    () => vm.runInContext("new Uint16Array(values16.buffer, 1)", context),
    { name: "RangeError" },
  );
  assert.throws(
    () => vm.runInContext("new Uint16Array(values16.buffer, 0, 3)", context),
    { name: "RangeError" },
  );
  assert.equal(
    vm.runInContext("rawBytes.buffer === values16.buffer", context),
    true,
  );
  assert.equal(
    vm.runInContext("converted.buffer === values16.buffer", context),
    false,
  );
  vm.runInContext("rawBytes.fill(0)", context);
  assert.equal(vm.runInContext("values16[0]", context), 0);
  assert.equal(vm.runInContext("converted[0]", context), 52);
});

test("Buffer: DataView rifiuta fuori vista, typed array non cresce", () => {
  const { context } = execute(buffers, "const storage =");
  assert.throws(() => vm.runInContext("view.getUint16(5)", context), {
    name: "RangeError",
  });
  assert.equal(vm.runInContext("view.getUint16(1)", context), 4660);
  assert.equal(
    vm.runInContext("region[6] = 42; region[6]", context),
    undefined,
  );
  assert.equal(vm.runInContext("region.length", context), 6);
  assert.equal(vm.runInContext("storage[8]", context), 0);
});

test("Buffer: clone copia, transfer invalida anche le altre viste", () => {
  const { context } = execute(buffers, "const original =");
  assert.throws(() => vm.runInContext("otherView.slice()", context), {
    name: "TypeError",
  });
  vm.runInContext(
    "const clone = structuredClone(moved); clone[0] = 100",
    context,
  );
  assert.equal(vm.runInContext("moved[0]", context), 7);
});

test("Buffer: feature detection percorre anche il ramo senza resize o SharedArrayBuffer", () => {
  assert.deepEqual(
    execute(buffers, "typeof ArrayBuffer.prototype.resize", {
      ArrayBuffer: function LegacyBuffer() {},
    }).logs,
    [],
  );
  assert.deepEqual(
    execute(buffers, "typeof SharedArrayBuffer", {
      SharedArrayBuffer: undefined,
    }).logs,
    [],
  );
});

function packetContext(globals = {}) {
  return execute(buffers, "function encodePacket", globals).context;
}

for (const text of [
  "",
  "ASCII",
  "caff\u00e8",
  "Ciao \u{1f30d}",
  "\ufeffinizio",
  "a\0b",
  "a".repeat(65_535),
]) {
  test(`Packet: round-trip UTF-8, lunghezza caratteri ${text.length}`, () => {
    const context = packetContext();
    const encoded = context.encodePacket(text);
    assert.equal(context.decodePacket(encoded), text);
    assert.equal(encoded.length, 6 + new TextEncoder().encode(text).length);
  });
}

test("Packet: esempio su sottovista e Buffer Node con byte esterni ignorati", () => {
  const { context, logs } = execute(buffers, "function encodePacket");
  vm.runInContext(snippet(buffers, "const packet = encodePacket"), context);
  assert.deepEqual(logs, [["Ciao \u{1f30d}"]]);
  const packet = context.encodePacket("node");
  const envelope = Buffer.alloc(packet.length + 10, 255);
  envelope.set(packet, 5);
  assert.equal(
    context.decodePacket(envelope.subarray(5, 5 + packet.length)),
    "node",
  );
});

test("Packet: encoder rifiuta tipo, surrogate isolate e payload fuori limite", () => {
  const context = packetContext();
  for (const value of [
    1,
    null,
    {},
    "\ud800",
    "\udfff",
    "x\ud800x",
    "\ud800\ud800\udfff",
  ]) {
    assert.throws(() => context.encodePacket(value), { name: "TypeError" });
  }
  for (const text of ["a".repeat(65_536), "\u00e8".repeat(32_768)]) {
    assert.throws(() => context.encodePacket(text), { name: "RangeError" });
  }
});

test("Packet: tipi, buffer resizable/shared e header incompleti rifiutati", () => {
  const context = packetContext();
  for (const value of [
    null,
    [],
    new ArrayBuffer(6),
    new Uint16Array(6),
    new Uint8Array(new ArrayBuffer(6, { maxByteLength: 10 })),
    new Uint8Array(new SharedArrayBuffer(6)),
  ]) {
    assert.throws(() => context.decodePacket(value), { name: "TypeError" });
  }
  for (let length = 0; length < 6; length++)
    assert.throws(() => context.decodePacket(new Uint8Array(length)), {
      name: "RangeError",
    });
  const detached = context.encodePacket("x");
  structuredClone(detached.buffer, { transfer: [detached.buffer] });
  assert.throws(() => context.decodePacket(detached), { name: "RangeError" });
});

test("Packet: magic, versione, riservato, lunghezza e UTF-8 invalidi", () => {
  const context = packetContext();
  for (const index of [0, 1, 2, 3, 4, 5]) {
    const packet = context.encodePacket("x");
    packet[index] ^= 0xff;
    assert.throws(() => context.decodePacket(packet));
  }
  const valid = context.encodePacket("test");
  assert.throws(
    () => context.decodePacket(valid.subarray(0, valid.length - 1)),
    { name: "RangeError" },
  );
  const extra = new Uint8Array(valid.length + 1);
  extra.set(valid);
  assert.throws(() => context.decodePacket(extra), { name: "RangeError" });
  const malformed = context.encodePacket("x");
  malformed[6] = 0xc3;
  assert.throws(() => context.decodePacket(malformed), { name: "TypeError" });
});

test("Packet: lunghezza big-endian a due byte e controllo UTF-8 strict", () => {
  const context = packetContext();
  const encoded = context.encodePacket("a".repeat(256));
  assert.deepEqual(
    Array.from(encoded.subarray(0, 6)),
    [0x4e, 0x42, 1, 0, 1, 0],
  );
  const decoder = new TextDecoder("utf-8", { fatal: true });
  decoder.decode(new Uint8Array([0xc3]), { stream: true });
  assert.throws(() => decoder.decode(), { name: "TypeError" });
});

test("Packet fetch: successo, HTTP, corpo malformato e signal inoltrato", async () => {
  let response;
  let options;
  const context = packetContext({
    fetch: async (url, init) => {
      assert.equal(url, "/packet.bin");
      options = init;
      return response;
    },
  });
  vm.runInContext(snippet(buffers, "async function fetchPacket"), context);
  response = new Response(context.encodePacket("rete"));
  const signal = new AbortController().signal;
  assert.equal(await context.fetchPacket("/packet.bin", { signal }), "rete");
  assert.equal(options.signal, signal);
  response = new Response("no", { status: 503 });
  await assert.rejects(context.fetchPacket("/packet.bin"), /HTTP 503/);
  assert.equal(response.bodyUsed, false);
  response = new Response(new Uint8Array(2));
  await assert.rejects(context.fetchPacket("/packet.bin"), {
    name: "RangeError",
  });
});

test("Packet fetch: rifiuti del trasporto e del consumo del corpo propagati", async () => {
  const failure = new DOMException("annullato", "AbortError");
  for (const fetch of [
    async () => {
      throw failure;
    },
    async () => ({
      ok: true,
      arrayBuffer: async () => {
        throw failure;
      },
    }),
  ]) {
    const context = packetContext({ fetch });
    vm.runInContext(snippet(buffers, "async function fetchPacket"), context);
    await assert.rejects(
      context.fetchPacket("/packet.bin"),
      (error) => error === failure,
    );
  }
});

test("Buffer: snippet Blob mantiene snapshot dei byte", async () => {
  const logs = [];
  const context = vm.createContext({
    Uint8Array,
    Blob,
    console: { log: (value) => logs.push(Array.from(value)) },
  });
  await vm.runInContext(
    `(async () => {\n${snippet(buffers, "const sourceBytes =")}\n})()`,
    context,
  );
  assert.deepEqual(logs, [[1, 2, 3]]);
});

test("Buffer: snippet ESM Node eseguito con import originale", () => {
  const code =
    snippet(buffers, "import { Buffer }") +
    `
import assert from "node:assert/strict";
assert.deepEqual([...nodeBytes], [10, 99, 30, 40]);
assert.deepEqual([...nodeCopy], [20, 30]);
assert.equal(exactView.byteLength, 4);
assert.equal(exactView.byteOffset, nodeBytes.byteOffset);
assert.equal(nodeAlias.buffer, nodeBytes.buffer);
`;
  execFileSync(process.execPath, ["--input-type=module", "-e", code], {
    stdio: "pipe",
  });
});
