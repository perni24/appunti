import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";
import { binary, note, loader, memoryHelpers } from "./wasm-example.mjs";

function fixture(extra = {}) {
  const context = vm.createContext({
    WebAssembly,
    ArrayBuffer,
    Uint8Array,
    TextEncoder,
    TextDecoder,
    ...extra,
  });
  vm.runInContext(loader + "\n" + memoryHelpers, context);
  return context;
}
function response(
  bytes = binary,
  contentType = "application/wasm",
  status = 200,
) {
  return new Response(bytes, {
    status,
    headers: contentType ? { "Content-Type": contentType } : {},
  });
}
const imports = () => ({ env: { log() {} } });

test("Wasm: il WAT della nota compila e dichiara import ed export previsti", async () => {
  assert.equal(WebAssembly.validate(binary), true);
  const module = await WebAssembly.compile(binary);
  assert.deepEqual(WebAssembly.Module.imports(module), [
    { module: "env", name: "log", kind: "function" },
  ]);
  assert.deepEqual(
    WebAssembly.Module.exports(module).map((entry) => entry.name),
    ["memory", "add", "addAndLog", "increment64", "firstByte"],
  );
});
test("Wasm: export numerici, conversione i32, overflow e BigInt", async () => {
  const logs = [];
  const { instance } = await WebAssembly.instantiate(binary, {
    env: { log: (n) => logs.push(n) },
  });
  const api = instance.exports;
  assert.equal(api.add(2, 3), 5);
  assert.equal(api.add(2.9, 3.1), 5);
  assert.equal(api.add(2147483647, 1), -2147483648);
  assert.equal(api.addAndLog(10, 20), 30);
  assert.deepEqual(logs, [30]);
  assert.equal(api.increment64(41n), 42n);
  assert.throws(() => api.increment64(41), TypeError);
});
test("Wasm: overload Module restituisce Instance e memoria indipendente", async () => {
  const { module, instance } = await WebAssembly.instantiate(binary, imports());
  const context = fixture({
    compiledModule: module,
    imports: imports(),
    console: { log() {} },
  });
  const source = snippet(note, "const anotherInstance");
  const other = await vm.runInContext(
    `(async () => {\n${source}\nreturn anotherInstance;\n})()`,
    context,
  );
  assert.ok(other instanceof WebAssembly.Instance);
  assert.notEqual(other.exports.memory, instance.exports.memory);
  new Uint8Array(instance.exports.memory.buffer)[0] = 9;
  assert.equal(other.exports.firstByte(0), 0);
});
test("Wasm: trap e callback host conservano tipi di errore distinti", async () => {
  const failure = new Error("host failure");
  const { instance } = await WebAssembly.instantiate(binary, {
    env: {
      log() {
        throw failure;
      },
    },
  });
  assert.throws(
    () => instance.exports.firstByte(65536),
    WebAssembly.RuntimeError,
  );
  assert.throws(
    () => instance.exports.addAndLog(1, 2),
    (error) => error === failure,
  );
});
test("Wasm: namespace mancante e funzione incompatibile falliscono", async () => {
  await assert.rejects(WebAssembly.instantiate(binary, {}), TypeError);
  await assert.rejects(
    WebAssembly.instantiate(binary, { env: { log: 1 } }),
    WebAssembly.LinkError,
  );
});

for (const mime of [
  "application/wasm",
  "application/octet-stream",
  "application/wasm; charset=utf-8",
  null,
]) {
  test(`Wasm loader: MIME ${mime}, una sola richiesta e ramo corretto`, async () => {
    let fetches = 0;
    const calls = [];
    const api = Object.create(WebAssembly);
    api.instantiateStreaming = (...args) => {
      calls.push("streaming");
      return WebAssembly.instantiateStreaming(...args);
    };
    api.instantiate = (...args) => {
      calls.push("bytes");
      return WebAssembly.instantiate(...args);
    };
    const context = fixture({
      WebAssembly: api,
      fetch: async () => {
        fetches++;
        return response(binary, mime);
      },
    });
    const result = await context.loadWasm(
      "https://notes.test/math.wasm",
      imports(),
    );
    assert.equal(result.instance.exports.add(1, 2), 3);
    assert.ok(result.module instanceof WebAssembly.Module);
    assert.equal(fetches, 1);
    assert.deepEqual(calls, [
      mime === "application/wasm" ? "streaming" : "bytes",
    ]);
  });
}
test("Wasm loader: assenza di streaming usa il buffer", async () => {
  const api = Object.create(WebAssembly);
  api.instantiateStreaming = undefined;
  const context = fixture({ WebAssembly: api, fetch: async () => response() });
  assert.equal(
    (await context.loadWasm("/math.wasm", imports())).instance.exports.add(
      2,
      2,
    ),
    4,
  );
});
for (const status of [404, 500]) {
  test(`Wasm loader: HTTP ${status} fallisce prima della compilazione`, async () => {
    const context = fixture({
      fetch: async () => response(binary, "application/wasm", status),
    });
    await assert.rejects(
      context.loadWasm("/math.wasm", imports()),
      new RegExp(`HTTP ${status}`),
    );
  });
}
test("Wasm loader: un guasto di rete non viene convertito in un fallback", async () => {
  const failure = new TypeError("network");
  const context = fixture({
    fetch: async () => {
      throw failure;
    },
  });
  await assert.rejects(
    context.loadWasm("/math.wasm"),
    (error) => error === failure,
  );
});
test("Wasm loader: errore streaming non viene ritentato via bytes", async () => {
  let fallback = 0;
  const api = Object.create(WebAssembly);
  api.instantiate = () => {
    fallback++;
    throw Error("Unexpected retry");
  };
  const context = fixture({
    WebAssembly: api,
    fetch: async () => response(new Uint8Array([1, 2, 3])),
  });
  await assert.rejects(
    context.loadWasm("/math.wasm", imports()),
    WebAssembly.CompileError,
  );
  assert.equal(fallback, 0);
});
test("Wasm loader: import invalido non viene nascosto dal fallback", async () => {
  const context = fixture({ fetch: async () => response() });
  await assert.rejects(
    context.loadWasm("/math.wasm", { env: { log: 3 } }),
    WebAssembly.LinkError,
  );
});
test("Wasm loader: signal viene inoltrato e controllato prima di compilare", async () => {
  const controller = new AbortController();
  const reason = new Error("cancelled");
  let received;
  const context = fixture({
    fetch: async (url, { signal }) => {
      received = signal;
      controller.abort(reason);
      return response();
    },
  });
  await assert.rejects(
    context.loadWasm("/math.wasm", imports(), { signal: controller.signal }),
    (error) => error === reason,
  );
  assert.equal(received, controller.signal);
});
test("Wasm loader: abort durante lettura impedisce l'istanziazione fallback", async () => {
  const controller = new AbortController();
  const context = fixture({
    fetch: async () => ({
      ok: true,
      headers: new Headers(),
      async arrayBuffer() {
        controller.abort();
        return binary;
      },
    }),
  });
  await assert.rejects(
    context.loadWasm("/math.wasm", imports(), { signal: controller.signal }),
    { name: "AbortError" },
  );
});
test("Wasm loader: abort durante compilazione scarta il risultato, non annulla la creazione", async () => {
  const controller = new AbortController();
  let created;
  const api = Object.create(WebAssembly);
  api.instantiateStreaming = async (...args) => {
    created = await WebAssembly.instantiateStreaming(...args);
    controller.abort();
    return created;
  };
  const context = fixture({ WebAssembly: api, fetch: async () => response() });
  await assert.rejects(
    context.loadWasm("/math.wasm", imports(), { signal: controller.signal }),
    { name: "AbortError" },
  );
  assert.equal(created.instance.exports.add(1, 1), 2);
});

test("Wasm memoria: UTF-8 usa lunghezza in byte e conserva NUL interni", async () => {
  const { instance } = await WebAssembly.instantiate(binary, imports());
  const memory = instance.exports.memory;
  const context = fixture();
  for (const text of ["Caff\u00e8", "A\u{1F680}B", "a\0b", ""]) {
    const length = context.writeUtf8(memory, 1024, 128, text);
    assert.equal(length, new TextEncoder().encode(text).length);
    assert.equal(context.readUtf8(memory, 1024, length), text);
  }
  assert.equal(context.writeUtf8(memory, 1024, 128, "Caff\u00e8"), 6);
  assert.equal(instance.exports.firstByte(1024), 67);
});
test("Wasm memoria: helper rilegge il buffer dopo grow senza perdere i dati", () => {
  const context = fixture();
  const memory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
  context.writeUtf8(memory, 1024, 128, "ok");
  const view = context.memoryRegion(memory, 1024, 2);
  assert.equal(memory.grow(1), 1);
  assert.equal(view.byteLength, 0);
  assert.equal(context.readUtf8(memory, 1024, 2), "ok");
  assert.throws(() => memory.grow(1), RangeError);
});
test("Wasm memoria: esempio grow viene eseguito e grow(0) distacca le viste", () => {
  const logs = [];
  const context = fixture({
    console: { log: (...values) => logs.push(values) },
  });
  vm.runInContext(snippet(note, "const growingMemory"), context);
  assert.deepEqual(logs, [[1], [0], [131072, 7]]);
  const memory = new WebAssembly.Memory({ initial: 1 });
  const old = memory.buffer;
  memory.grow(0);
  assert.equal(old.byteLength, 0);
});
test("Wasm memoria: capacita insufficiente non causa una scrittura parziale", () => {
  const context = fixture();
  const memory = new WebAssembly.Memory({ initial: 1 });
  new Uint8Array(memory.buffer).fill(9, 0, 8);
  assert.throws(() => context.writeUtf8(memory, 0, 2, "Caff\u00e8"), {
    name: "RangeError",
  });
  assert.deepEqual([...new Uint8Array(memory.buffer, 0, 8)], Array(8).fill(9));
});
for (const [offset, length] of [
  [-1, 2],
  [0, -1],
  [0.5, 1],
  [0, Infinity],
  [65536, 1],
  [65537, 0],
  [Number.MAX_SAFE_INTEGER, 2],
]) {
  test(`Wasm memoria: range invalido ${offset}, ${length}`, () => {
    const context = fixture();
    assert.throws(
      () =>
        context.memoryRegion(
          new WebAssembly.Memory({ initial: 1 }),
          offset,
          length,
        ),
      { name: "RangeError" },
    );
  });
}
test("Wasm memoria: range vuoto finale valido, tipi errati rifiutati", () => {
  const context = fixture();
  const memory = new WebAssembly.Memory({ initial: 1 });
  assert.equal(context.memoryRegion(memory, 65536, 0).length, 0);
  assert.throws(() => context.memoryRegion({}, 0, 1), { name: "TypeError" });
  assert.throws(() => context.writeUtf8(memory, 0, 4, 42), {
    name: "TypeError",
  });
  const shared = new WebAssembly.Memory({
    initial: 1,
    maximum: 2,
    shared: true,
  });
  assert.throws(() => context.memoryRegion(shared, 0, 1), {
    name: "TypeError",
  });
});
test("Wasm memoria: decoder strict rifiuta byte invalidi e encoder sostituisce surrogate isolate", () => {
  const context = fixture();
  const memory = new WebAssembly.Memory({ initial: 1 });
  new Uint8Array(memory.buffer)[0] = 255;
  assert.throws(() => context.readUtf8(memory, 0, 1), TypeError);
  const length = context.writeUtf8(memory, 0, 8, "\uD800");
  assert.equal(length, 3);
  assert.equal(context.readUtf8(memory, 0, length), "\uFFFD");
});
test("Wasm memoria: slice copia, subarray mantiene alias", () => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const view = new Uint8Array(memory.buffer, 0, 2);
  const alias = view.subarray();
  const copy = view.slice();
  view[0] = 9;
  assert.equal(alias[0], 9);
  assert.equal(copy[0], 0);
});
