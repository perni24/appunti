import assert from "node:assert/strict";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

// Evaluate only the JS blocks of the named note in one isolated lexical scope.
function example(title, names, count = 1) {
  const blocks = parseNote(`Programmazione/Clean Code/Pagine/${title}.md`).tree.children
    .filter(node => node.type === "code" && node.lang === "js");
  assert.equal(blocks.length, count, title);
  return Function('"use strict";\n' + blocks.map(b => b.value).join("\n") + "\nreturn ({" + names + "});")();
}

test("Purezza: il calcolo resta stabile mentre cambia il preventivo che legge le impostazioni", () => {
  const { discountedTotalCents: total, quoteFromSettings: quote, set } = example(
    "Funzioni pure e impure", "discountedTotalCents, quoteFromSettings, set: n => { currentDiscount = n }");
  assert.equal(quote(1250), 1125);
  assert.equal(total(1250, 15), 1063);
  set(15);
  assert.equal(quote(1250), 1063);
  assert.equal(total(1250, 15), 1063);
  assert.equal(total(1250, 100), 0);
  assert.equal(total(1250, 0), 1250);
});

test("Composizione: l'ordine conta quando il buono supera il prezzo della merce", () => {
  const { giftTotalCents: total, addGiftWrap, applyVoucher } = example(
    "Composizione di funzioni", "giftTotalCents, addGiftWrap, applyVoucher");
  const reversed = n => applyVoucher(addGiftWrap(n));
  assert.equal(total(1000), 700);
  assert.equal(reversed(1000), 700);
  assert.equal(total(300), 200);
  assert.equal(reversed(300), 0);
  assert.equal(total(0), 200);
});

test("Immutabilita: alias della copia superficiale e stabilita della ricevuta", () => {
  const { withPayment, paymentSnapshot } = example("Immutabilita", "withPayment, paymentSnapshot", 2);
  const invoice = { id: "A", totalCents: 70, lines: [70], status: "draft" };
  const date = new Date(1000);
  const next = withPayment(invoice, date);
  const receipt = paymentSnapshot(invoice, date);
  assert.equal(invoice.status, "draft");
  assert.equal(next.status, "paid");
  assert.notEqual(invoice, next);
  assert.equal(next.lines, invoice.lines);
  invoice.lines.push(25);
  date.setTime(0);
  invoice.totalCents = 95;
  assert.deepEqual(next.lines, [70, 25]);
  assert.equal(next.paidAt.getTime(), 0);
  assert.equal(Reflect.set(receipt, "paidAtMs", 0), false);
  assert.deepEqual(receipt, { invoiceId: "A", totalCents: 70, paidAtMs: 1000 });
  assert.throws(() => paymentSnapshot(invoice, new Date(NaN)), RangeError);
});

test("Trasformazioni: gli stessi valori non implicano lo stesso ordine delle letture", () => {
  const { paidTotalsLoop, paidTotals } = example("Trasformazioni dichiarative", "paidTotalsLoop, paidTotals");
  function observed(fn) {
    const log = [];
    const orders = [["draft", 300], ["paid", 0], ["paid", 250], ["paid", 250]].map(([status, cents], i) => ({
      get status() { log.push("s" + i); return status; },
      get totalCents() { log.push("t" + i); return cents; },
    }));
    assert.deepEqual(fn(orders), [0, 250, 250]);
    assert.deepEqual(fn([]), []);
    assert.deepEqual(fn([{ status: "draft", totalCents: 500 }]), []);
    return log;
  }
  assert.deepEqual(observed(paidTotalsLoop), ["s0", "s1", "t1", "s2", "t2", "s3", "t3"]);
  assert.deepEqual(observed(paidTotals), ["s0", "s1", "s2", "s3", "t1", "t2", "t3"]);
});

test("Pipeline: nessuna scrittura sugli scarti, dati normalizzati e rifiuto distinto dell'archivio", async () => {
  const { importCustomer } = example("Pipeline di trasformazione", "importCustomer");
  const writes = [];
  const save = async value => { writes.push(value); return "id-7"; };
  for (const [raw, field] of [
    [null, "row"], [[], "row"], [false, "row"], [{}, "code"],
    [{ code: 7, name: "Ada" }, "code"], [{ code: "007" }, "name"],
    [{ code: "7a", name: "Ada" }, "code"], [{ code: "007", name: "   " }, "name"],
  ]) assert.deepEqual(await importCustomer(raw, save), { ok: false, field });
  assert.deepEqual(writes, []);
  const row = Object.freeze({ code: " 007 ", name: " Ada ", ignored: true });
  assert.deepEqual(await importCustomer(row, save), { ok: true, id: "id-7" });
  assert.deepEqual(writes, [{ code: "007", displayName: "Ada" }]);
  const offline = new Error("offline");
  await assert.rejects(importCustomer(row, async () => { throw offline; }), e => e === offline);
});

test("Guard clauses: preservano casi limite, corto circuito, argomenti ed errore di invio", async () => {
  const { sendNested, sendGuarded } = example("Guard clauses", "sendNested, sendGuarded", 2);
  for (const fn of [sendNested, sendGuarded]) {
    const sent = [];
    const send = async (...args) => { sent.push(args); };
    const address = "buyer@example.org";
    const noAddress = { customerEmail: "", get totalCents() { throw new Error("lettura inattesa"); } };
    for (const invoice of [null, noAddress, { customerEmail: address },
      ...[NaN, 0, -1].map(totalCents => ({ totalCents, customerEmail: address }))]) {
      assert.equal(await fn(invoice, send), "skipped");
    }
    assert.deepEqual(sent, []);
    for (const totalCents of [5, "5"]) {
      const invoice = { customerEmail: address, totalCents };
      assert.equal(await fn(invoice, send), "accepted");
      assert.equal(sent.at(-1)[0], address);
      assert.equal(sent.at(-1)[1], invoice);
    }
    assert.equal(sent.length, 2);
    const failure = new Error("mail");
    await assert.rejects(fn({ customerEmail: address, totalCents: 5 }, async () => { throw failure; }), e => e === failure);
  }
});

test("Effetti: audit dopo il salvataggio; un rifiuto non annulla una vendita gia salvata", async () => {
  const { totalCents, recordSale } = example("Side effects controllati", "totalCents, recordSale");
  const lines = Object.freeze([Object.freeze({ quantity: 2, unitPriceCents: 250 }), Object.freeze({ quantity: 1, unitPriceCents: 30 })]);
  assert.equal(totalCents(lines), 530);
  assert.equal(totalCents([]), 0);
  for (const fail of [null, "save", "audit"]) {
    const calls = [], stored = [];
    const failure = new Error("unavailable");
    const run = recordSale(lines, {
      save: async sale => {
        calls.push("save");
        if (fail === "save") throw failure;
        stored.push(sale);
        return "sale-1";
      },
      audit: async event => {
        calls.push("audit");
        assert.deepEqual(event, { event: "sale-saved", id: "sale-1", totalCents: 530 });
        if (fail === "audit") throw failure;
      },
    });
    if (fail) await assert.rejects(run, err => err === failure);
    else assert.equal(await run, "sale-1");
    assert.deepEqual(calls, fail === "save" ? ["save"] : ["save", "audit"]);
    assert.deepEqual(stored, fail === "save" ? [] : [{ totalCents: 530 }]);
  }
});
