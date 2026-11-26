import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function example(note, name) {
  const blocks = parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(n => n.type === "code" && n.lang === "js");
  assert.equal(blocks.length, 1, note);
  return Function('"use strict";\n' + blocks[0].value + "\nreturn " + name + ";")();
}

test("Stato: richieste sovrapposte con completamento inverso", async () => {
  const check = example("Gestione dello stato", "checkEdit");
  const anna = { id: "A", role: "user" }, bruno = { id: "B", role: "user" };
  const doc = { ownerId: "A" };
  const gate = Promise.withResolvers();
  const first = check(anna, "D", () => gate.promise);
  assert.equal(await check(bruno, "D", async () => doc), false);
  gate.resolve(doc);
  assert.equal(await first, true);
  assert.equal(await check(null, "D", async () => doc), false);
  assert.equal(await check({ ...bruno, role: "admin" }, "D", async () => doc), true);
  assert.equal(await check(anna, "D", async () => null), false);
  const failure = new Error("archivio indisponibile");
  await assert.rejects(check(anna, "D", async () => { throw failure; }), e => e === failure);
});

test("Transazione SQLite: errore della riga, vincolo al commit e transazione del chiamante", t => {
  const save = example("Gestione delle risorse", "saveOrder");
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE products(id INTEGER PRIMARY KEY);
    CREATE TABLE orders(id INTEGER PRIMARY KEY);
    CREATE TABLE order_lines(order_id REFERENCES orders(id), product_id INTEGER NOT NULL
      REFERENCES products(id) DEFERRABLE INITIALLY DEFERRED);
    INSERT INTO products VALUES (10);`);
  save(db, 1, 10);
  assert.throws(() => save(db, 2, null), /NOT NULL/);
  assert.throws(() => save(db, 3, 11), /FOREIGN KEY/);
  assert.equal(db.isTransaction, false);
  assert.deepEqual(db.prepare("SELECT id FROM orders").all().map(r => r.id), [1]);
  assert.equal(db.prepare("SELECT count(*) AS n FROM order_lines").get().n, 1);
  db.exec("BEGIN; INSERT INTO orders VALUES (4)");
  assert.throws(() => save(db, 5, 10), /transaction/);
  assert.equal(db.isTransaction, true);
  assert.equal(db.prepare("SELECT id FROM orders WHERE id=4").get().id, 4);
  db.exec("ROLLBACK");
});

test("Lifecycle: il writer chiude una volta, anche se rientra; fallimento distinto da chiusura", () => {
  const Writer = example("Lifecycle degli oggetti", "ReportWriter");
  const writes = [];
  let calls = 0;
  const writer = new Writer({ write: x => writes.push(x), close() {
    calls++;
    assert.equal(writer.state, "closing");
    assert.throws(() => writer.close(), /non ripetibile/);
    assert.throws(() => writer.write("late"), /non scrivibile/);
  } });
  writer.write("A");
  writer.close();
  writer.close();
  assert.equal(writer.state, "closed");
  assert.equal(calls, 1);
  assert.deepEqual(writes, ["A"]);
  assert.throws(() => writer.write("B"), /non scrivibile/);
  const failure = new Error("close");
  let attempts = 0;
  const broken = new Writer({ close() { attempts++; throw failure; } });
  assert.throws(() => broken.close(), e => e === failure);
  assert.equal(broken.state, "close_failed");
  assert.throws(() => broken.close(), /non ripetibile/);
  assert.throws(() => broken.write("B"), /non scrivibile/);
  assert.equal(attempts, 1);
});

test("Ownership: conferme duplicate, conflitto e copie non modificano indebitamente l'ordine", () => {
  const Order = example("Ownership concettuale", "OrderPayment");
  const order = new Order();
  for (const id of [null, "  "]) assert.throws(() => order.confirm(id), TypeError);
  assert.deepEqual(order.snapshot(), { status: "pending", paymentId: null });
  assert.equal(order.confirm("007"), "recorded");
  Object.assign(order.snapshot(), { status: "pending", paymentId: "altro" });
  assert.equal(order.confirm("007"), "already_recorded");
  assert.throws(() => order.confirm("7"), /conflitto/);
  assert.deepEqual(order.snapshot(), { status: "paid", paymentId: "007" });
});

test("Cache: zero, TTL dal completamento, miss simultanei e risultato vecchio dopo invalidazione", async () => {
  const cacheFor = example("Cache e invalidazione", "priceCache");
  const requests = [];
  let timestamp = 0;
  const cache = cacheFor(() => {
    const gate = Promise.withResolvers();
    requests.push(gate);
    return gate.promise;
  }, () => timestamp, 10);
  const first = cache.get("A");
  assert.equal(cache.get("A"), first);
  await Promise.resolve();
  timestamp = 100;
  requests[0].resolve(0);
  assert.equal(await first, 0);
  timestamp = 109;
  assert.equal(cache.get("A"), first);
  timestamp = 110;
  const old = cache.get("A");
  assert.notEqual(old, first);
  cache.invalidate("A");
  const fresh = cache.get("A");
  await Promise.resolve();
  requests[2].resolve(42);
  assert.equal(await fresh, 42);
  requests[1].resolve(1);
  assert.equal(await old, 1);
  assert.equal(cache.get("A"), fresh);
  cache.invalidate("A");
  const staleFailure = cache.get("A");
  cache.invalidate("A");
  const next = cache.get("A");
  await Promise.resolve();
  const err = new Error("listino offline");
  requests[3].reject(err);
  await assert.rejects(staleFailure, e => e === err);
  assert.equal(cache.get("A"), next);
  requests[4].reject(err);
  await assert.rejects(next, e => e === err);
  const retry = cache.get("A");
  await Promise.resolve();
  requests[5].resolve(12);
  assert.equal(await retry, 12);
});

test("Lock: ordine e identità delle cause per tutti e cinque gli esiti", async () => {
  const withLock = example("Cleanup e rilascio risorse", "withLock");
  const primary = new Error("work"), cleanup = new Error("release");
  const unavailable = new Error("acquire");
  await assert.rejects(withLock("k", async () => { throw unavailable; }, () => assert.fail("work")), e => e === unavailable);
  for (const badWork of [false, true]) for (const badRelease of [false, true]) {
    const events = [];
    const lock = { async release() { events.push("release"); if (badRelease) throw cleanup; } };
    const op = withLock("k", async key => { assert.equal(key, "k"); return lock; }, async lease => {
      assert.equal(lease, lock);
      await Promise.resolve();
      events.push("work");
      if (badWork) throw primary;
      return 0;
    });
    if (badWork && badRelease) await assert.rejects(op, e =>
      e instanceof AggregateError && e.errors.length === 2 && e.errors[0] === primary && e.errors[1] === cleanup);
    else if (badWork || badRelease) await assert.rejects(op, e => e === (badWork ? primary : cleanup));
    else assert.equal(await op, 0);
    assert.deepEqual(events, ["work", "release"]);
  }
});

test("Invariante: limite, FIFO, snapshot superficiale e undefined presente", () => {
  const Queue = example("Invarianti interne", "LimitedQueue");
  for (const n of [0, NaN, -1, 1.5, Infinity]) assert.throws(() => new Queue(n), RangeError);
  const q = new Queue(2), item = { id: 1 };
  q.push(item);
  q.push(undefined);
  const copy = q.snapshot();
  assert.equal(copy[0], item);
  copy.pop();
  assert.throws(() => q.push("X"), RangeError);
  assert.equal(q.size, 2);
  assert.equal(q.take().value, item);
  assert.deepEqual(q.take(), { found: true, value: undefined });
  assert.deepEqual(q.take(), { found: false });
});

function observeExport(fn, codes, failAt = Infinity) {
  const failure = new Error("writer");
  const accepted = [];
  let calls = 0;
  try {
    const count = fn(codes, row => { if (++calls === failAt) throw failure; accepted.push(row); });
    return { calls, accepted, count };
  } catch (e) {
    assert.equal(e, failure);
    return { calls, accepted, failed: true };
  }
}

test("Legacy: il writer osserva righe, terminatori e consegna parziale", () => {
  const original = example("Legacy code", "exportCodesLegacy");
  for (const empty of [[], ["", ""]]) assert.deepEqual(observeExport(original, empty), { calls: 0, accepted: [], count: 0 });
  assert.deepEqual(observeExport(original, ["007", "", "0"]), { calls: 2, accepted: ["C;007\r\n", "C;0\r\n"], count: 2 });
  assert.deepEqual(observeExport(original, ["a", "b", "c"], 2), { calls: 2, accepted: ["C;a\r\n"], failed: true });
});

test("Refactoring: vecchia e nuova versione hanno gli stessi effetti sui casi caratterizzati", () => {
  const before = example("Legacy code", "exportCodesLegacy");
  const after = example("Refactoring sicuro", "exportCodes");
  for (const codes of [[], [""], ["0"], ["007", "", "0", "A"]]) {
    for (const failAt of [1, 2, 3, Infinity]) {
      assert.deepEqual(observeExport(after, codes, failAt), observeExport(before, codes, failAt));
    }
  }
});
