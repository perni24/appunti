import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";
import { run, invalid } from "./typescript-examples.mjs";

function blocks(note, lang = "js") {
  return parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(n => n.type === "code" && n.lang === lang).map(n => n.value);
}
function one(note, lang) {
  const snippets = blocks(note, lang);
  assert.equal(snippets.length, 1, note);
  return snippets[0];
}
function functions(note, names) {
  return Function('"use strict";\n' + one(note) + "\nreturn ({" + names + "});")();
}
const loadModule = note => import("data:text/javascript," + encodeURIComponent(one(note)));

test("Contratto: errore prima della lettura, assenza e indisponibilita distinte", async () => {
  const { findInvoice } = functions("Contratti impliciti ed espliciti", "findInvoice");
  const ids = [], row = { id: "007" };
  const repo = { findById: async id => { ids.push(id); return id === "007" ? row : null; } };
  for (const bad of ["  ", 7, null]) await assert.rejects(findInvoice(bad, repo), TypeError);
  assert.deepEqual(ids, []);
  assert.equal(await findInvoice(" 007 ", repo), row);
  assert.equal(await findInvoice("7", repo), null);
  assert.deepEqual(ids, ["007", "7"]);
  const error = new Error("offline");
  await assert.rejects(findInvoice("7", { findById: async () => { throw error; } }), e => e === error);
});

test("Confine: quantita 1..99, campi proiettati, codice con zeri iniziali", () => {
  const { parseInvoiceLine: parse } = functions("Validazione ai confini", "parseInvoiceLine");
  for (const n of [1, 99]) assert.deepEqual(parse({ sku: " 007 ", quantity: n, extra: true }), {
    ok: true, line: { sku: "007", quantity: n },
  });
  for (const body of [null, [], false]) assert.deepEqual(parse(body), { ok: false, field: "body" });
  assert.deepEqual(parse({ sku: " ", quantity: 1 }), { ok: false, field: "sku" });
  for (const n of [0, 100, 1.5, "1", undefined]) {
    assert.deepEqual(parse({ sku: "7", quantity: n }), { ok: false, field: "quantity" });
  }
});

test("Money: unione statica e regole a runtime su importi e valute", () => {
  const src = one("Tipi significativi", "ts");
  const { value: Money } = run(src, "Money");
  invalid(src + '\nnew Money(1, "GBP");', 2345);
  const total = new Money(500, "EUR");
  assert.equal(total.lessDiscount(new Money(500, "EUR")).cents, 0);
  assert.equal(total.lessDiscount(new Money(100, "EUR")).cents, 400);
  assert.equal(total.cents, 500);
  assert.throws(() => total.lessDiscount(new Money(1, "USD")), /Valute diverse/);
  assert.throws(() => total.lessDiscount(new Money(501, "EUR")), /superiore/);
  for (const cents of [-1, NaN, 0.1]) assert.throws(() => new Money(cents, "EUR"), /Importo/);
  assert.throws(() => new Money(1, "GBP"), /Valuta/);
});

test("Listino: otto combinazioni per i quattro percorsi, incluse le precedenze", () => {
  const { discountPercent: rate } = functions("Complessita ciclomatica", "discountPercent");
  const flags = [false, true];
  const actual = flags.flatMap(vip => flags.flatMap(sale => flags.map(coupon => rate(vip, sale, coupon))));
  assert.deepEqual(actual, [0, 15, 10, 10, 20, 20, 20, 20]);
});

test("Guardie e annidamento: risultati equivalenti e nessuna lettura di locked per l'inattivo", () => {
  const { nested, guarded } = functions("Complessita cognitiva", "nested, guarded");
  for (const fn of [nested, guarded]) {
    assert.equal(fn(null), false);
    assert.equal(fn({ active: false, get locked() { throw new Error("lettura inattesa"); } }), false);
    assert.equal(fn({ active: true, locked: true }), false);
    assert.equal(fn({ active: true, locked: false }), true);
  }
});

test("Scadenza: una sola lettura dell'orologio e rifiuto originale del salvataggio", async () => {
  const { scheduleReminder } = await loadModule("Codice testabile");
  let reads = 0;
  const failure = new Error("offline");
  await assert.rejects(scheduleReminder("I-1", {
    nowMs: () => { reads++; return 0; },
    save: async data => { assert.deepEqual(data, { invoiceId: "I-1", dueAtMs: 3600000 }); throw failure; },
  }), e => e === failure);
  assert.equal(reads, 1);
});

test("Builder: array indipendenti, stessa identita di default, distinte fatture vuote e gratuite", async () => {
  const { aDraftInvoice: draft } = functions("Test data builders", "aDraftInvoice");
  const { issueInvoice } = await loadModule("Modellazione del dominio");
  const lines = [125];
  const first = draft({ lineCents: lines }), second = draft(), third = draft();
  lines[0] = 800;
  assert.equal(first.lineCents[0], 125);
  assert.equal(second.id, third.id);
  second.lineCents.push(25);
  assert.deepEqual(third.lineCents, [100]);
  assert.equal(issueInvoice(first).invoice.totalCents, 125);
  assert.equal(first.status, "draft");
  assert.equal(issueInvoice(draft({ lineCents: [] })).code, "empty_invoice");
  assert.equal(issueInvoice(draft({ lineCents: [0] })).code, "zero_total");
});

test("Log: eventi selezionati, nessun payload del provider, nessun record su esito ignoto al contratto", () => {
  const { logAuthorization: log } = functions("Logging leggibile", "logAuthorization");
  const records = [], write = r => records.push(r);
  for (const outcome of ["declined", "unknown"]) log(outcome, "r-7", write);
  assert.throws(() => log({ diagnostic: "raw provider message" }, "r-7", write), RangeError);
  assert.deepEqual(records, ["info", "warn"].map((level, i) => ({
    event: "payment.authorization", level, outcome: ["declined", "unknown"][i], requestId: "r-7",
  })));
});

test("Problema HTTP: esempio JSON coerente con il codice di dominio e con lo stato documentato", async () => {
  const problem = JSON.parse(one("Messaggi di errore utili", "json"));
  const { issueInvoice } = await loadModule("Modellazione del dominio");
  assert.equal(problem.code, issueInvoice({ status: "draft", lineCents: [] }).code);
  assert.equal(new URL(problem.type).pathname, "/problems/empty-invoice");
  assert.equal(problem.status, 422);
  assert.deepEqual(Object.keys(problem).sort(), ["code", "detail", "status", "title", "type"]);
});

test("File delle quattro note di test: sette esempi nativi, incluso SQLite in memoria", t => {
  const root = path.resolve(tmpdir());
  const dir = mkdtempSync(path.join(root, "clean-code-quality-"));
  t.after(() => {
    assert.equal(path.dirname(dir), root);
    assert.ok(path.basename(dir).startsWith("clean-code-quality-"));
    rmSync(dir, { recursive: true, force: true });
  });
  const unit = blocks("Test unitari leggibili");
  assert.equal(unit.length, 2);
  const files = {
    "member-discount.mjs": unit[0], "member-discount.test.mjs": unit[1],
    "invoice.mjs": one("Modellazione del dominio"), "invoice.test.mjs": one("Test come documentazione"),
    "invoice-repository.test.mjs": one("Test di integrazione"),
    "reminder.mjs": one("Codice testabile"), "reminder.test.mjs": one("Arrange Act Assert"),
  };
  for (const [name, text] of Object.entries(files)) writeFileSync(path.join(dir, name), text);
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, ["--test", "--test-reporter=tap",
    ...Object.keys(files).filter(n => n.endsWith(".test.mjs"))], { cwd: dir, env, encoding: "utf8", timeout: 30_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /^# pass 7\s*$/m);
});
