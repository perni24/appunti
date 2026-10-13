import assert from "node:assert/strict";
import { test } from "node:test";
import { getEventListeners } from "node:events";
import vm from "node:vm";
import { snippet } from "./note-examples.mjs";

const ajax = (marker) => snippet("AJAX", marker);
const ws = (marker) => snippet("WebSockets", marker);
const realtime = () =>
  snippet("Real-time con WebSocket", "function createRealtimeClient");
const named = (name) => (error) => error?.name === name;
const plain = (value) => structuredClone(value);

function run(source, expression, globals = {}) {
  return vm.runInNewContext(
    `${source}\n;(${expression})`,
    {
      AbortController,
      AbortSignal,
      DOMException,
      TextEncoder,
      Response,
      console: { log() {}, error() {} },
      ...globals,
    },
    { timeout: 1000 },
  );
}

function xhrFixture() {
  const requests = [];
  class XHR {
    static failure = null;
    constructor() {
      requests.push(this);
      this.status = 0;
      this.responseText = "";
      this.headers = {};
    }
    open(...args) {
      this.openArgs = args;
      if (XHR.failure === "open") throw new Error("open failed");
    }
    setRequestHeader(name, value) {
      this.headers[name] = value;
    }
    send() {
      if (XHR.failure === "send") throw new Error("send failed");
      this.sent = true;
    }
    abort() {
      this.aborted = true;
      this.onabort?.();
    }
    load(status, text) {
      this.status = status;
      this.responseText = text;
      this.onload?.();
    }
  }
  return {
    XHR,
    requests,
    get: run(ajax("function getJsonXHR"), "getJsonXHR", {
      XMLHttpRequest: XHR,
    }),
  };
}

test("XHR: richiesta asincrona, header e risultato JSON", async () => {
  const { get, requests } = xhrFixture();
  const controller = new AbortController();
  const pending = get("/users", { signal: controller.signal, timeoutMs: 200 });
  const xhr = requests[0];
  assert.deepEqual(plain(xhr.openArgs), ["GET", "/users", true]);
  assert.equal(xhr.timeout, 200);
  assert.equal(xhr.headers.Accept, "application/json");
  assert.equal(xhr.sent, true);
  assert.equal(getEventListeners(controller.signal, "abort").length, 1);
  xhr.load(200, '[{"id":1}]');
  assert.deepEqual(plain(await pending), [{ id: 1 }]);
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
  assert.equal(xhr.onload, null);
});

test("XHR: HTTP fallito e parsing invalido restano distinti", async () => {
  for (const [status, body, name] of [
    [404, "bad", "Error"],
    [200, "bad", "SyntaxError"],
    [200, "", "SyntaxError"],
  ]) {
    const { get, requests } = xhrFixture();
    const checked = assert.rejects(
      get("/users"),
      (error) =>
        error.name === name && (status === 200 || error.status === status),
    );
    requests[0].load(status, body);
    await checked;
    assert.equal(requests[0].onerror, null);
  }
});

test("XHR: 204 e 205 senza parsing; JSON null resta valido", async () => {
  for (const [status, body] of [
    [204, ""],
    [205, ""],
    [200, "null"],
  ]) {
    const { get, requests } = xhrFixture();
    const pending = get("/users");
    requests[0].load(status, body);
    assert.equal(await pending, null);
  }
});

test("XHR: error, timeout e abort separati con cleanup", async () => {
  for (const [event, name] of [
    ["onerror", "TypeError"],
    ["ontimeout", "TimeoutError"],
    ["onabort", "AbortError"],
  ]) {
    const { get, requests } = xhrFixture();
    const controller = new AbortController();
    const checked = assert.rejects(
      get("/users", { signal: controller.signal }),
      named(name),
    );
    requests[0][event]();
    await checked;
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    assert.equal(requests[0][event], null);
  }
});

test("XHR: abort personalizzato conserva null e chiude la richiesta", async () => {
  const { get, requests } = xhrFixture();
  const controller = new AbortController();
  const checked = assert.rejects(
    get("/users", { signal: controller.signal }),
    (error) => error === null,
  );
  controller.abort(null);
  await checked;
  assert.equal(requests[0].aborted, true);
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
});

test("XHR: segnale gia annullato e input invalidi non creano richieste", async () => {
  const { get, requests } = xhrFixture();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    get("/users", { signal: controller.signal }),
    (error) => error === controller.signal.reason,
  );
  for (const timeoutMs of [-1, 1.5, "10", Infinity, 2_147_483_648])
    await assert.rejects(get("/users", { timeoutMs }), named("RangeError"));
  await assert.rejects(get("/users", { signal: {} }), named("TypeError"));
  assert.equal(requests.length, 0);
});

test("XHR: errori sincroni open/send puliscono il listener", async () => {
  for (const failure of ["open", "send"]) {
    const { get, XHR, requests } = xhrFixture();
    XHR.failure = failure;
    const controller = new AbortController();
    await assert.rejects(
      get("/users", { signal: controller.signal }),
      new RegExp(failure),
    );
    assert.equal(getEventListeners(controller.signal, "abort").length, 0);
    assert.equal(requests[0].onabort, null);
  }
});

test("XHR: un callback terminale gia accodato non sostituisce il primo esito", async () => {
  const { get, requests } = xhrFixture();
  const pending = get("/users", { timeoutMs: 0 });
  const lateError = requests[0].onerror;
  requests[0].load(200, '{"ok":true}');
  lateError();
  assert.deepEqual(plain(await pending), { ok: true });
  assert.equal(requests[0].timeout, 0);
});

test("AJAX: loadUsers convalida schema e seleziona campi", async () => {
  let payload = [{ id: 1, name: "Ada", secret: "hidden" }];
  const signal = new AbortController().signal;
  const load = run(ajax("async function loadUsers"), "loadUsers", {
    fetch: async (url, options) => {
      assert.equal(url, "/api/users");
      assert.equal(options.signal, signal);
      return Response.json(payload);
    },
  });
  assert.deepEqual(plain(await load({ signal })), [{ id: 1, name: "Ada" }]);
  for (payload of [
    null,
    {},
    [null],
    [{ id: 0, name: "Ada" }],
    [{ id: 1, name: " " }],
  ]) {
    await assert.rejects(load({ signal }), named("TypeError"));
  }
});

test("AJAX: loadUsers propaga HTTP, rete e JSON non valido", async () => {
  for (const [fetch, name] of [
    [async () => new Response(null, { status: 503 }), "Error"],
    [async () => new Response("bad"), "SyntaxError"],
    [
      async () => {
        throw new TypeError("offline");
      },
      "TypeError",
    ],
  ])
    await assert.rejects(
      run(ajax("async function loadUsers"), "loadUsers", { fetch })(),
      named(name),
    );
});

test("WebSocket: parsing seleziona notification e rimuove campi inattesi", () => {
  const parse = run(ws("function parseNotification"), "parseNotification");
  assert.deepEqual(
    plain(
      parse(
        JSON.stringify({
          type: "notification",
          extra: 1,
          payload: { id: "evt-1", text: "Hello", secret: "hidden" },
        }),
      ),
    ),
    {
      type: "notification",
      payload: { id: "evt-1", text: "Hello" },
    },
  );
});

test("WebSocket: parsing rifiuta binari, JSON e schema malformati", () => {
  const parse = run(ws("function parseNotification"), "parseNotification");
  assert.throws(() => parse("bad"), named("SyntaxError"));
  for (const data of [
    new ArrayBuffer(1),
    "null",
    "[]",
    "1",
    "{}",
    '{"type":"other"}',
    JSON.stringify({
      type: "notification",
      payload: { id: "", text: "Hello" },
    }),
    JSON.stringify({ type: "notification", payload: { id: "a", text: " " } }),
  ]) {
    assert.throws(() => parse(data), named("TypeError"));
  }
});

test("WebSocket: limiti del parsing includono byte UTF-8 e campi", () => {
  const parse = run(ws("function parseNotification"), "parseNotification");
  for (const payload of [
    { id: "x".repeat(129), text: "ok" },
    { id: "id", text: "x".repeat(4001) },
  ]) {
    assert.throws(
      () => parse(JSON.stringify({ type: "notification", payload })),
      named("TypeError"),
    );
  }
  assert.throws(() => parse("\u20ac".repeat(22_000)), named("TypeError"));
});

const constants = { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };
function sender() {
  return run(ws("function sendMessage"), "sendMessage", {
    WebSocket: constants,
  });
}

test("WebSocket: send su OPEN accoda l'envelope ma non e un ACK", () => {
  const sent = [];
  const socket = {
    readyState: 1,
    bufferedAmount: 0,
    send: (value) => sent.push(value),
  };
  assert.equal(sender()(socket, "subscribe", { topic: "orders" }), true);
  assert.deepEqual(JSON.parse(sent[0]), {
    type: "subscribe",
    payload: { topic: "orders" },
  });
});

test("WebSocket: invio negato quando non aperto o buffer oltre soglia", () => {
  const send = sender();
  for (const readyState of [0, 2, 3])
    assert.equal(
      send({ readyState, send: () => assert.fail() }, "type", null),
      false,
    );
  const text = JSON.stringify({ type: "type", payload: "\u20ac" });
  const size = new TextEncoder().encode(text).length;
  let calls = 0;
  const socket = {
    readyState: 1,
    bufferedAmount: 5,
    send() {
      calls++;
    },
  };
  assert.equal(send(socket, "type", "\u20ac", size + 4), false);
  assert.equal(send(socket, "type", "\u20ac", size + 5), true);
  assert.equal(calls, 1);
});

test("WebSocket: input, JSON ciclico/BigInt e errore send si propagano", () => {
  const send = sender();
  const socket = { readyState: 1, bufferedAmount: 0, send() {} };
  for (const [type, payload] of [
    ["", {}],
    [null, {}],
    ["ok", undefined],
  ])
    assert.throws(() => send(socket, type, payload), named("TypeError"));
  for (const max of [0, -1, 1.5, Infinity])
    assert.throws(() => send(socket, "ok", {}, max), named("RangeError"));
  const cyclic = {};
  cyclic.self = cyclic;
  for (const payload of [cyclic, 1n])
    assert.throws(() => send(socket, "ok", payload), named("TypeError"));
  const error = new Error("send failed");
  socket.send = () => {
    throw error;
  };
  assert.throws(
    () => send(socket, "ok", {}),
    (value) => value === error,
  );
});

test("WebSocket: ricontrollo dello stato dopo serializzazione", () => {
  const socket = {
    readyState: 1,
    bufferedAmount: 0,
    send: () => assert.fail(),
  };
  const payload = {
    toJSON() {
      socket.readyState = 2;
      return {};
    },
  };
  assert.equal(sender()(socket, "ok", payload), false);
});

test("Backoff: crescita, jitter e tetto senza overflow", () => {
  const delay = run(ws("function reconnectDelay"), "reconnectDelay");
  assert.equal(
    delay(0, () => 0),
    250,
  );
  assert.equal(
    delay(1, () => 0),
    500,
  );
  assert.equal(
    delay(6, () => 0),
    15_000,
  );
  assert.equal(
    delay(Number.MAX_SAFE_INTEGER, () => 0.999),
    29_985,
  );
  for (const attempt of [-1, 1.5, "0", Infinity])
    assert.throws(() => delay(attempt), named("RangeError"));
  for (const sample of [-1, 1, Infinity, NaN])
    assert.throws(() => delay(0, () => sample), named("RangeError"));
});

function realtimeFixture(maxRetries = 2) {
  const sockets = [],
    pending = new Map(),
    statuses = [],
    notifications = [],
    errors = [];
  let nextTimer = 0;
  class Socket extends EventTarget {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    static fail = false;
    constructor(url) {
      super();
      if (Socket.fail) throw new SyntaxError("invalid URL");
      this.url = url;
      this.readyState = 0;
      this.bufferedAmount = 0;
      this.sent = [];
      sockets.push(this);
    }
    emit(type, fields = {}) {
      this.dispatchEvent(Object.assign(new Event(type), fields));
    }
    open() {
      this.readyState = 1;
      this.emit("open");
    }
    send(value) {
      this.sent.push(value);
    }
    serverClose(code) {
      this.readyState = 3;
      this.emit("close", { code });
    }
    close(code, reason) {
      this.closeArgs = [code, reason];
      this.serverClose(code);
    }
  }
  const source = [
    ws("function parseNotification"),
    ws("function sendMessage"),
    ws("function reconnectDelay"),
    realtime(),
  ].join("\n");
  const create = run(source, "createRealtimeClient", {
    WebSocket: Socket,
    setTimeout(fn, ms) {
      const id = ++nextTimer;
      pending.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    },
  });
  const client = create("wss://notes.test/events", {
    maxRetries,
    onStatus: (status) => statuses.push(status),
    onNotification: (value) => notifications.push(plain(value)),
    onError: (error) => errors.push(error),
  });
  const fire = () => {
    assert.equal(pending.size, 1);
    const [id, { fn }] = pending.entries().next().value;
    pending.delete(id);
    fn();
  };
  return {
    client,
    create,
    Socket,
    sockets,
    pending,
    fire,
    statuses,
    notifications,
    errors,
  };
}

test("Realtime: start idempotente, subscribe per connessione e messaggi validati", () => {
  const state = realtimeFixture();
  state.client.start();
  state.client.start();
  assert.equal(state.sockets.length, 1);
  assert.equal(state.client.send("test", {}), false);
  const socket = state.sockets[0];
  socket.open();
  assert.deepEqual(JSON.parse(socket.sent[0]), {
    type: "subscribe",
    payload: { topic: "orders" },
  });
  socket.emit("message", { data: "bad" });
  socket.emit("message", {
    data: '{"type":"notification","payload":{"id":"1","text":"Hello"}}',
  });
  assert.equal(state.errors.length, 1);
  assert.deepEqual(state.notifications, [{ id: "1", text: "Hello" }]);
  assert.equal(state.client.send("test", {}), true);
  state.client.stop();
});

test("Realtime: solo close pianifica retry, ogni reconnect risottoscrive", () => {
  const state = realtimeFixture();
  state.client.start();
  state.sockets[0].open();
  state.sockets[0].emit("error");
  assert.equal(state.pending.size, 0);
  state.sockets[0].serverClose(1006);
  assert.equal(state.pending.size, 1);
  state.fire();
  state.sockets[1].open();
  assert.equal(state.sockets[1].sent.length, 1);
  state.sockets[0].emit("message", {
    data: '{"type":"notification","payload":{"id":"old","text":"Old"}}',
  });
  assert.deepEqual(state.notifications, []);
  state.client.stop();
});

test("Realtime: budget non azzerato da aperture brevi", () => {
  const state = realtimeFixture(2);
  state.client.start();
  for (let index = 0; index < 3; index++) {
    state.sockets[index].open();
    state.sockets[index].serverClose(1011);
    if (index < 2) state.fire();
  }
  assert.equal(state.sockets.length, 3);
  assert.equal(state.pending.size, 0);
  assert.equal(state.statuses.at(-1), "exhausted");
  state.client.start();
  assert.equal(state.sockets.length, 4);
  state.client.stop();
});

test("Realtime: stop durante retry cancella timer e non riparte", () => {
  const state = realtimeFixture();
  state.client.start();
  state.sockets[0].serverClose(1006);
  state.client.stop();
  assert.equal(state.pending.size, 0);
  assert.equal(state.client.send("test", {}), false);
  assert.equal(state.sockets.length, 1);
});

test("Realtime: stop in CONNECTING rimuove listener e permette nuovo ciclo", () => {
  const state = realtimeFixture();
  state.client.start();
  const old = state.sockets[0];
  state.client.stop();
  assert.deepEqual(old.closeArgs, [1000, "Client stopped"]);
  for (const type of ["open", "close", "message", "error"])
    assert.equal(getEventListeners(old, type).length, 0);
  state.client.start();
  old.open();
  old.serverClose(1006);
  assert.equal(state.sockets.length, 2);
  assert.equal(state.pending.size, 0);
  state.client.stop();
});

test("Realtime: chiusure normali e definitive non ritentano", () => {
  for (const code of [1000, 1002, 1008, 1009, 4001]) {
    const state = realtimeFixture();
    state.client.start();
    state.sockets[0].serverClose(code);
    assert.equal(state.pending.size, 0);
    assert.equal(state.statuses.at(-1), "closed");
  }
});

test("Realtime: errori di configurazione e costruttore restano espliciti", () => {
  const state = realtimeFixture();
  assert.throws(() => state.create("url", {}), named("TypeError"));
  assert.throws(
    () =>
      state.create("url", {
        onNotification() {},
        onStatus() {},
        onError() {},
        maxRetries: -1,
      }),
    named("RangeError"),
  );
  state.Socket.fail = true;
  state.client.start();
  assert.equal(state.statuses.at(-1), "failed");
  assert.equal(state.errors[0].name, "SyntaxError");
  assert.equal(state.pending.size, 0);
});
