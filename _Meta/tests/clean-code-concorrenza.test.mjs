import assert from "node:assert/strict";
import { mkdtempSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippet(note, lang = "js") {
  const blocks = parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(node => node.type === "code" && node.lang === lang);
  assert.equal(blocks.length, 1, note);
  return blocks[0].value;
}
function example(note, name) {
  return Function('"use strict";\n' + snippet(note) + "\nreturn " + name + ";")();
}
function dbFile(t) {
  const dir = mkdtempSync(join(tmpdir(), "clean-code-concorrenza-"));
  const file = join(dir, "example.db");
  const connections = [];
  t.after(() => {
    for (const db of connections) if (db.isOpen) db.close();
    unlinkSync(file);
    rmdirSync(dir);
  });
  return () => {
    const db = new DatabaseSync(file);
    connections.push(db);
    return db;
  };
}

test("Contatore: completamenti in ordine inverso, errore e isolamento delle istanze", async () => {
  const create = example("Stato condiviso", "jobMetrics");
  const metrics = create(), a = Promise.withResolvers(), b = Promise.withResolvers();
  const first = metrics.process("A", () => a.promise), second = metrics.process("B", () => b.promise);
  assert.equal(metrics.count(), 0);
  b.resolve(); await second;
  assert.equal(metrics.count(), 1);
  a.resolve(); await first;
  const error = new Error("job fallito");
  await assert.rejects(metrics.process("C", async () => { throw error; }), e => e === error);
  assert.equal(metrics.count(), 2);
  assert.equal(create().count(), 0);
});

test("Ricerca: testo anche identico, errori correnti visibili, risultati vecchi scartati", async () => {
  const latestSearch = example("Race condition e leggibilita", "latestSearch");
  for (const lateError of [true, false]) {
    const a = Promise.withResolvers(), b = Promise.withResolvers(), reads = [a, b], rendered = [];
    const search = latestSearch(() => reads.shift().promise, rows => rendered.push(rows));
    const first = search("Roma"), second = search("Roma");
    b.resolve(["nuovo"]);
    assert.equal(await second, "shown");
    if (lateError) a.reject(new Error("ritardo")); else a.resolve(["vecchio"]);
    assert.equal(await first, "obsolete");
    assert.deepEqual(rendered, [["nuovo"]]);
  }
  const err = new Error("errore corrente");
  const current = latestSearch(async () => { throw err; }, () => assert.fail("render"));
  await assert.rejects(current("x"), e => e === err);
  const rendered = [];
  const inOrder = latestSearch(async x => x, x => rendered.push(x));
  await inOrder("a"); await inOrder("b");
  assert.deepEqual(rendered, ["a", "b"]);
});

test("Lock nativi: stesso posto serializzato, altro posto libero e lock rilasciato dopo errore", { timeout: 5000 }, async () => {
  const { reserveSeat } = await import("data:text/javascript," + encodeURIComponent(snippet("Lock e sezioni critiche")));
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const reads = [], reserved = new Set();
  const repo = {
    async isAvailable(id) { reads.push(id); return !reserved.has(id); },
    async markReserved(id) {
      if (id === "A") { entered.resolve(); await release.promise; }
      reserved.add(id);
    },
  };
  const first = reserveSeat("A", repo);
  await entered.promise;
  const second = reserveSeat("A", repo);
  try {
    assert.equal(await reserveSeat("B", repo), true);
    assert.deepEqual(reads, ["A", "B"]);
  } finally { release.resolve(); }
  assert.deepEqual(await Promise.all([first, second]), [true, false]);
  assert.deepEqual(reads, ["A", "B", "A"]);
  const err = new Error("archivio");
  await assert.rejects(reserveSeat("C", { ...repo, markReserved: async () => { throw err; } }), e => e === err);
  assert.equal(await reserveSeat("C", repo), true);
});

test("Idempotenza: ricevuta persistente dopo riapertura, tenant isolati e conflitto di payload", t => {
  const open = dbFile(t);
  const register = example("Idempotenza", "registerReceipt");
  const job = { tenant: "A", key: "k", orderId: "007" };
  const db = open(); db.exec(snippet("Idempotenza", "sql"));
  const first = register(db, job);
  assert.equal(first.kind, "created");
  db.close();
  const reopened = open();
  assert.deepEqual(register(reopened, job), { kind: "replayed", id: first.id });
  assert.deepEqual(register(reopened, { ...job, orderId: "7" }), { kind: "key_conflict" });
  assert.equal(register(reopened, { ...job, tenant: "B" }).kind, "created");
  assert.equal(register(reopened, { ...job, key: "altro" }).kind, "created");
  assert.equal(reopened.prepare("SELECT count(*) AS n FROM receipts").get().n, 3);
});

test("Stock: contesa fra due connessioni, ultimo pezzo e nessuna idempotenza implicita", t => {
  const open = dbFile(t), a = open(), b = open();
  a.exec("CREATE TABLE products(id TEXT PRIMARY KEY, stock INTEGER NOT NULL CHECK(stock >= 0))");
  a.exec("INSERT INTO products VALUES ('A',1), ('B',2)");
  b.exec("PRAGMA busy_timeout = 0");
  const reserve = example("Operazioni atomiche", "reserveOne");
  a.exec("BEGIN IMMEDIATE");
  assert.deepEqual(reserve(a, "A"), { ok: true, remaining: 0 });
  assert.throws(() => reserve(b, "A"), e => e.errcode === 5); // SQLITE_BUSY
  a.exec("COMMIT");
  for (const id of ["A", "missing"]) assert.deepEqual(reserve(b, id), { ok: false, reason: "unavailable" });
  for (const remaining of [1, 0]) assert.deepEqual(reserve(b, "B"), { ok: true, remaining });
});

test("Worker: ack perso dopo la scrittura, riconsegna, scarto definitivo e guasti non confermati", async t => {
  const consume = example("Code e worker", "consumeReceipt");
  const register = example("Idempotenza", "registerReceipt");
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(snippet("Idempotenza", "sql"));
  const events = [], lostAck = new Error("ack perso");
  const body = { version: 1, tenant: "A", key: "k", orderId: "01" };
  const delivery = { body, ack: () => events.push("ack"), deadLetter: reason => events.push(reason) };
  const save = job => { const r = register(db, job); events.push(r.kind); return r; };
  await assert.rejects(consume({ ...delivery, ack: async () => { throw lostAck; } }, save), e => e === lostAck);
  await consume(delivery, save);
  assert.deepEqual(events, ["created", "replayed", "ack"]);
  assert.equal(db.prepare("SELECT count(*) AS n FROM receipts").get().n, 1);
  events.length = 0;
  await consume({ ...delivery, body: { ...body, orderId: "02" } }, save);
  assert.deepEqual(events, ["key_conflict", "key_conflict"]);
  events.length = 0;
  for (const invalid of [null, { ...body, key: " " }, { ...body, version: 2 }]) {
    await consume({ ...delivery, body: invalid }, () => assert.fail("save"));
  }
  assert.deepEqual(events, Array(3).fill("invalid_job"));
  events.length = 0;
  await assert.rejects(consume(delivery, async () => { throw lostAck; }), e => e === lostAck);
  await assert.rejects(consume(delivery, async () => ({ kind: "unknown" })), /sconosciuto/);
  assert.deepEqual(events, []);
});

test("Dashboard: dipendenze, concorrenza, errore originale e annullamento cooperativo", async () => {
  const dashboard = example("Async code leggibile", "loadDashboard");
  const calls = [], user = Promise.withResolvers(), settings = Promise.withResolvers();
  const api = {
    user: async id => { calls.push("user:" + id); return user.promise; },
    orders: async id => { calls.push("orders:" + id); return [1]; },
    settings: async id => { calls.push("settings:" + id); return settings.promise; },
  };
  const task = dashboard("alias", api);
  assert.deepEqual(calls, ["user:alias", "settings:alias"]);
  settings.resolve("it"); user.resolve({ id: "canonical" });
  assert.deepEqual(await task, { user: { id: "canonical" }, orders: [1], settings: "it" });
  assert.equal(calls.at(-1), "orders:canonical");
  const err = new Error("preferenze"), late = Promise.withResolvers();
  let observed, orders = 0;
  await assert.rejects(dashboard("X", {
    async user(id, signal) { observed = signal; return late.promise; },
    async settings() { throw err; },
    async orders() { orders++; },
  }), e => e === err);
  assert.equal(observed.reason, err);
  late.resolve({ id: "X" });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(orders, 0);
  const controller = new AbortController();
  controller.abort(err);
  const never = new Proxy({}, { get() { assert.fail("lavoro avviato"); } });
  await assert.rejects(dashboard("X", never, controller.signal), e => e === err);
});
