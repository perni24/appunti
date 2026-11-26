import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function blocks(note, lang) {
  return parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(n => n.type === "code" && n.lang === lang).map(n => n.value);
}
function one(note, lang) {
  const snippets = blocks(note, lang);
  assert.equal(snippets.length, 1, note);
  return snippets[0];
}
function example(note, names) {
  return Function('"use strict";\n' + one(note, "js") + "\nreturn ({" + names + "});")();
}
const { parseIssue } = example("Validazione input API", "parseIssue");
const { publicInvoice, issueDraft } = example("DTO e modelli di dominio", "publicInvoice, issueDraft");
const { invoiceRepository } = example("Repository pattern", "invoiceRepository");
const { issueInvoice } = example("Service layer", "issueInvoice");
const { postInvoiceIssue } = example("Controller sottili", "postInvoiceIssue");

function database(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}
function fixture(t) {
  const db = database(t);
  db.exec(one("Repository pattern", "sql"));
  db.exec("INSERT INTO invoices(id,state,internal_note) VALUES ('007','draft','nota interna')");
  const repo = invoiceRepository(db);
  return { db, repo, issue: command => issueInvoice(command, { db, repo, nowMs: () => 0, issueDraft }) };
}

test("Controller Fetch: gli esiti HTTP attraversano davvero parser, service e database", async t => {
  const { db, issue } = fixture(t);
  let called = 0;
  const deps = { parseIssue, publicInvoice, issue: input => { called++; return issue(input); } };
  const send = (body, type = "application/json; charset=utf-8") => postInvoiceIssue(
    new Request("https://example.test/invoice-issues", { method: "POST", headers: { "Content-Type": type }, body }), deps);
  assert.equal((await send("{}", "text/plain")).status, 415);
  assert.equal((await send("{")).status, 400);
  const invalid = await send("null");
  assert.equal(invalid.status, 422);
  assert.deepEqual(await invalid.json(), { field: "body", code: "expected_object" });
  assert.equal(called, 0);
  assert.equal((await send('{"invoiceId":"MISSING"}')).status, 404);
  const response = await send('{"invoiceId":"007"}');
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /application\/json/);
  assert.deepEqual(await response.json(), { id: "007", status: "issued", issuedAtMs: 0 });
  assert.equal((await send('{"invoiceId":"007"}')).status, 409);
  db.exec("ALTER TABLE invoices RENAME TO archived_invoices");
  await assert.rejects(send('{"invoiceId":"007"}'), /no such table/);
});

test("Service: errore outbox annulla l'emissione; un BEGIN fallito non annulla lavoro altrui", t => {
  const { db, repo, issue } = fixture(t);
  const id = { invoiceId: "007" };
  db.exec("CREATE TRIGGER block_notification BEFORE INSERT ON invoice_issued_outbox BEGIN SELECT RAISE(ABORT, 'outbox offline'); END");
  assert.throws(() => issue(id), /outbox offline/);
  assert.equal(repo.find("007").state, "draft");
  assert.equal(repo.find("007").issuedAtMs, null);
  assert.equal(db.prepare("SELECT count(*) AS n FROM invoice_issued_outbox").get().n, 0);
  assert.equal(db.isTransaction, false);
  db.exec("DROP TRIGGER block_notification; BEGIN");
  assert.throws(() => issue(id), /transaction/);
  assert.equal(db.isTransaction, true);
  db.exec("ROLLBACK");
  assert.equal(issue(id).kind, "issued");
  assert.equal(issue(id).kind, "conflict");
  assert.equal(db.prepare("SELECT count(*) AS n FROM invoice_issued_outbox").get().n, 1);
});

test("Repository: assenza, campi mappati, zero righe aggiornate e vincoli reali", t => {
  const { db, repo } = fixture(t);
  assert.equal(repo.find("7"), null);
  const original = repo.find("007");
  assert.deepEqual(original, { id: "007", state: "draft", issuedAtMs: null, internalNote: "nota interna" });
  const changed = issueDraft(original, 42);
  assert.equal(repo.saveIssued(changed), true);
  assert.equal(repo.saveIssued(changed), false);
  repo.enqueueIssued(changed);
  assert.throws(() => repo.enqueueIssued(changed), /UNIQUE/);
  assert.throws(() => repo.enqueueIssued({ ...changed, id: "other" }), /FOREIGN KEY/);
  assert.throws(() => db.exec("INSERT INTO invoices(id,state) VALUES ('X','issued')"), /CHECK/);
});

test("Dominio e DTO: transizione senza mutazione, istante zero valido e nessun campo interno", () => {
  const draft = Object.freeze({ id: "007", state: "draft", internalNote: "riservato", issuedAtMs: null });
  const issued = issueDraft(draft, 0);
  assert.equal(draft.state, "draft");
  assert.deepEqual(publicInvoice(issued), { id: "007", status: "issued", issuedAtMs: 0 });
  assert.equal(issueDraft(issued, 0), null);
  for (const time of [NaN, -1, 1.5]) assert.throws(() => issueDraft(draft, time), RangeError);
});

test("Parser: JSON scalare, campo obbligatorio, campi estranei e confini degli ID", () => {
  for (const bad of [null, [], "007", 0]) assert.equal(parseIssue(bad).error.code, "expected_object");
  assert.equal(parseIssue({}).error.code, "required");
  assert.equal(parseIssue({ invoiceId: "007", status: "issued" }).error.code, "unknown_field");
  for (const id of [null, 7, "inv", "X\n", "", "A".repeat(41)]) {
    assert.deepEqual(parseIssue({ invoiceId: id }).error, { field: "invoiceId", code: "invalid_format" });
  }
  for (const id of ["007", "INV-7", "A".repeat(40)]) {
    assert.deepEqual(parseIssue({ invoiceId: id }), { ok: true, value: { invoiceId: id } });
  }
});

test("Report: cursore a due colonne, proiezione esatta, filtri e pagina finale vuota", t => {
  const db = database(t);
  db.exec(`CREATE TABLE customers(id INTEGER PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id),
      created_ms INTEGER NOT NULL, status TEXT NOT NULL);
    INSERT INTO customers VALUES (1,'a@example.test'), (2,'b@example.test');
    INSERT INTO orders VALUES (11,1,1000,'pending'),(12,2,1000,'pending'),(15,1,999,'pending'),(17,1,1001,'done');`);
  const page = db.prepare(one("Query leggibili", "sql"));
  let last = null;
  const ids = [];
  for (let i = 0; i < 4; i++) {
    const rows = page.all({ before_ms: last?.created_ms ?? null, before_id: last?.order_id ?? null, page_size: 1 });
    if (i === 3) { assert.equal(rows.length, 0); break; }
    assert.equal(rows.length, 1);
    last = rows[0];
    assert.deepEqual(Object.keys(last).sort(), ["created_ms", "customer_email", "order_id"]);
    assert.equal(last.customer_email, last.order_id === 12 ? "b@example.test" : "a@example.test");
    ids.push(last.order_id);
  }
  assert.deepEqual(ids, [12, 11, 15]);
});

test("Migrazione: vecchio scrittore tardivo, backfill ripetibile e vincoli dopo contract", t => {
  const db = database(t);
  const sql = blocks("Migrazioni e schema evolution", "sql");
  assert.equal(sql.length, 5);
  const [expand, dual, reconcile, audit, contract] = sql;
  db.exec("CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL); INSERT INTO customers VALUES(1,'Ada'),(2,'Bea')");
  db.exec(expand);
  db.prepare(dual).run({ value: "Ada II", id: 1 });
  db.exec("UPDATE customers SET name='Ada III' WHERE id=1");
  assert.equal(db.prepare("SELECT display_name FROM customers WHERE id=1").get().display_name, "Ada II");
  assert.equal(db.prepare(audit).get().mismatches, 2);
  // Simulate a runner stopping and rolling back a premature contraction.
  assert.throws(() => db.exec(contract), /NOT NULL/);
  assert.equal(db.isTransaction, true);
  db.exec("ROLLBACK");
  assert.equal(db.prepare(audit).get().mismatches, 2);
  assert.equal(db.prepare(reconcile).run().changes, 2);
  assert.equal(db.prepare(reconcile).run().changes, 0);
  assert.equal(db.prepare(audit).get().mismatches, 0);
  assert.throws(() => db.exec("INSERT INTO customers(id,display_name) VALUES(3,'C')"), /NOT NULL/);
  db.exec(contract);
  assert.deepEqual(db.prepare("SELECT id,display_name FROM customers ORDER BY id").all().map(r => [r.id, r.display_name]), [[1,"Ada III"],[2,"Bea"]]);
  db.exec("INSERT INTO customers(id,display_name) VALUES (3,'C')");
  assert.throws(() => db.exec("INSERT INTO customers(id) VALUES (4)"), /NOT NULL/);
  assert.throws(() => db.prepare("SELECT name FROM customers"), /no such column/);
});
