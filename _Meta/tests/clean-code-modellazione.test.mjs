import assert from "node:assert/strict";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { compile, hasName, run, valid } from "./typescript-examples.mjs";

function blocks(note, lang) {
  const { tree } = parseNote(`Programmazione/Clean Code/Pagine/${note}.md`);
  return tree.children.filter((n) => n.type === "code" && n.lang === lang).map((n) => n.value);
}

function source(note) {
  const snippets = blocks(note, "ts");
  assert.equal(snippets.length, 1);
  return snippets[0];
}

test("Posto: uguaglianza di valore, chiavi Map, confini e immutabilita", () => {
  const { value: Seat } = run(source("Value objects"), "Seat");
  const a = new Seat(3, 2);
  const b = new Seat(3, 2);
  assert.notEqual(a, b);
  assert.equal(new Map([[a, true]]).has(b), false);
  assert.equal(a.equals(b), true);
  assert.equal(a.equals(new Seat(3, 1)), false);
  assert.equal(a.equals(new Seat(1, 2)), false);
  assert.equal(Reflect.set(a, "row", 10), false);
  assert.equal(a.row, 3);
  for (const [row, n] of [[1, 1], [12, 8]]) assert.doesNotThrow(() => new Seat(row, n));
  for (const [row, n] of [[0, 1], [13, 1], [1, 9], [1, 0], [2.5, 3], [3, NaN]]) {
    assert.throws(() => new Seat(row, n), hasName("RangeError"));
  }
});

test("Saldo: snapshot indipendente e nessuna spesa dopo l'ultimo credito", () => {
  const { value: Balance } = run(source("Data objects e behavior objects"), "CreditBalance");
  const balance = new Balance(1);
  const old = balance.snapshot();
  assert.equal(balance.spendOne(), true);
  assert.equal(old.available, 1);
  old.available = 100;
  assert.equal(balance.spendOne(), false);
  assert.equal(balance.snapshot().available, 0);
  for (const value of [-1, 0.5, Infinity]) {
    assert.throws(() => new Balance(value), hasName("RangeError"));
  }
});

test("Importo: la factory controlla i dati, il solo tipo non impone la positivita", () => {
  const amount = source("Primitive obsession");
  const { value: create } = run(amount, "transferAmount");
  for (const currency of ["EUR", "USD"]) {
    assert.deepEqual(structuredClone(create(1250, currency)), { cents: 1250, currency });
  }
  for (const cents of [-1, 0, 12.5, "1250", NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => create(cents, "EUR"), hasName("RangeError"));
  }
  assert.throws(() => create(1250, "GBP"), hasName("RangeError"));
  valid(amount + '\nconst unchecked: TransferAmount = { cents: -1, currency: "EUR" };');
});

test("Intervallo: estremi, date invalide e mutazione successiva degli input", () => {
  const { value: Range } = run(source("Invarianti del dominio"), "DateRange");
  const start = new Date(10);
  const end = new Date(20);
  const range = new Range(start, end);
  start.setTime(100);
  end.setTime(NaN);
  for (const [ms, expected] of [[9, false], [10, true], [19, true], [20, false], [NaN, false]]) {
    assert.equal(range.contains(new Date(ms)), expected);
  }
  for (const [a, b] of [[5, 5], [6, 5], [NaN, 5], [5, NaN]]) {
    assert.throws(() => new Range(new Date(a), new Date(b)), hasName("RangeError"));
  }
});

test("Risultato API: casi validi, campi vietati e controllo esaustivo del nuovo caso", () => {
  const api = source("Modellare stati impossibili");
  const { value: describe } = run(api, "describe");
  assert.equal(describe({ status: "success", data: { name: "Ada" } }), "Ada");
  assert.equal(describe({ status: "error", error: "assente" }), "assente");
  valid(api + `
const mixed = {status: "success" as const, data: {name: "Ada"}, error: "oops"};
// @ts-expect-error un campo escluso resta incompatibile anche su una variabile
describe(mixed);
// @ts-expect-error dati mancanti
describe({status: "success"});
// @ts-expect-error presente con undefined non equivale ad assente
describe({status: "success", data: {name: "Ada"}, error: undefined});
`, { exactOptionalPropertyTypes: true });
  const expanded = api.replace("type ApiResult =", 'type ApiResult = { status: "pending" }');
  const result = compile(expanded);
  assert.deepEqual(result.diagnostics.map((d) => d.code), [2322]);
  const d = result.diagnostics[0];
  assert.match(d.file.text.slice(d.start, d.start + d.length), /unhandled/);
});

test("Aggiornamento: alias, copia del solo percorso modificato e riuso senza variazioni", () => {
  const snippets = blocks("Stato mutabile e immutabile", "js");
  assert.equal(snippets.length, 2);
  const [wrong, update] = snippets.map((s, i) =>
    Function('"use strict";\n' + s + '\nreturn ' + ["withQuantityWrong", "withQuantity"][i])());
  const original = () => ({ lines: [{ id: "a", quantity: 1 }, { id: "b", quantity: 2 }] });
  const bad = original();
  assert.equal(wrong(bad, "a", 3).lines, bad.lines);
  assert.equal(bad.lines[0].quantity, 3);
  const order = original();
  const next = update(order, "a", 3);
  assert.notEqual(next, order);
  assert.notEqual(next.lines, order.lines);
  assert.notEqual(next.lines[0], order.lines[0]);
  assert.equal(next.lines[1], order.lines[1]);
  assert.equal(next.lines[0].quantity, 3);
  assert.equal(order.lines[0].quantity, 1);
  assert.equal(update(next, "a", 3), next);
  assert.throws(() => update(next, "missing", 1), RangeError);
  for (const qty of [0, -2, 1.5]) assert.throws(() => update(next, "a", qty), RangeError);
});
