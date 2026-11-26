import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { parseNote } from "../../site/scripts/vault.mjs";
import { compile, hasName, run, ts } from "./typescript-examples.mjs";

function blocks(note, lang = "ts") {
  return parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter((node) => node.type === "code" && node.lang === lang)
    .map((node) => node.value);
}
function one(note, lang) {
  const snippets = blocks(note, lang);
  assert.equal(snippets.length, 1);
  return snippets[0];
}

test("Order: solo una conferma valida cambia lo stato osservabile", () => {
  const { value: Order } = run(one("Incapsulamento"), "Order");
  for (const amount of [-1, NaN, 1.5]) assert.throws(() => new Order(amount), hasName("RangeError"));
  const order = new Order(500);
  assert.throws(() => order.markAsPaid(" "), /riferimento/);
  assert.equal(order.status, "draft");
  assert.equal(Reflect.set(order, "status", "paid"), false);
  order.markAsPaid(" tx-7 ");
  assert.equal(order.status, "paid");
  assert.throws(() => order.markAsPaid("tx-7"), /già pagato/);
  assert.equal(order.status, "paid");
});

test("Annullamento: soglia inclusiva per lo stesso istante di inizio", () => {
  const source = one("Separazione delle responsabilita", "js");
  const allowed = Function('"use strict";\n' + source + '\nreturn cancellationAllowed;')();
  const start = Date.UTC(2026, 6, 1);
  const cutoff = start - 86_400_000;
  assert.equal(allowed(start, cutoff - 1), true);
  assert.equal(allowed(start, cutoff), true);
  assert.equal(allowed(start, cutoff + 1), false);
});

test("Sostituibilita: la firma accetta entrambi, il cliente distingue l'ID assente", () => {
  const { value: { displayLabel, lookup, incompatible } } = run(one("SOLID"), "({ displayLabel, lookup, incompatible })");
  for (const find of [lookup, incompatible]) {
    assert.equal(displayLabel("A", find), "Carta");
    assert.equal(displayLabel("B", find), "");
  }
  assert.equal(displayLabel("missing", lookup), "(non in catalogo)");
  assert.throws(() => displayLabel("missing", incompatible), /ID assente/);
});

test("DIP: moduli compilati insieme, richiamo dell'adattatore e propagazione degli errori", async (t) => {
  const sources = blocks("Dependency Inversion Principle");
  assert.equal(sources.length, 2);
  const root = path.resolve(tmpdir());
  const dir = mkdtempSync(path.join(root, "clean-code-oo-"));
  t.after(() => {
    assert.equal(path.dirname(dir), root);
    assert.ok(path.basename(dir).startsWith("clean-code-oo-"));
    rmSync(dir, { recursive: true, force: true });
  });
  const files = ["welcome.ts", "mail-adapter.ts"].map(name => path.join(dir, name));
  writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
  for (const [i, file] of files.entries()) writeFileSync(file, sources[i]);
  // Check the source dependency graph as well as the adapter's runtime contract.
  const imports = sources.map(s => ts.preProcessFile(s).importedFiles.map(f => f.fileName));
  assert.deepEqual(imports, [[], ["./welcome.js"]]);
  const program = ts.createProgram(files, {
    strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, noEmitOnError: true, types: [],
  });
  const errors = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, "\n")), []);
  assert.equal(program.emit().emitSkipped, false);
  const load = name => import(pathToFileURL(path.join(dir, name)).href);
  const { welcome } = await load("welcome.js");
  const { mailQueue } = await load("mail-adapter.js");
  assert.doesNotMatch(readFileSync(path.join(dir, "mail-adapter.js"), "utf8"), /from ["']\.\/welcome\.js["']/);
  const calls = [];
  const queue = mailQueue({ submit: async msg => { calls.push(msg); return { accepted: true }; } });
  const address = "test@example.org";
  assert.equal(await welcome({ address, verified: false }, queue), "skipped");
  assert.deepEqual(calls, []);
  assert.equal(await welcome({ address, verified: true }, queue), "queued");
  assert.deepEqual(calls, [{ to: address, template: "welcome" }]);
  const refused = mailQueue({ submit: async () => ({ accepted: false }) });
  await assert.rejects(welcome({ address, verified: true }, refused), /non accettato/);
  const offline = new Error("offline");
  const broken = mailQueue({ submit: async () => { throw offline; } });
  await assert.rejects(welcome({ address, verified: true }, broken), err => err === offline);
});

test("ISP: report con il solo lettore; l'errore dell'archivio non significa utente assente", async () => {
  const source = one("Interface Segregation Principle");
  const { value: report } = run(source + `
const readerOnly: UserReader = { findById: async () => null };
`, "nameForReport");
  const reader = { findById: async id => id === "7" ? { id, displayName: "Ada" } : null };
  assert.equal(await report(reader, "7"), "Ada");
  assert.equal(await report(reader, "8"), "(utente assente)");
  const error = new Error("offline");
  await assert.rejects(report({ findById: async () => { throw error; } }, "7"), e => e === error);
  const bad = compile(source + '\nfunction misuse(reader: UserReader) { return reader.remove("7"); }');
  assert.deepEqual(bad.diagnostics.map(d => d.code), [2339]);
  assert.equal(bad.js, undefined);
});

test("Tell Don't Ask: il gestore delega al vero ordine e non ingoia i rifiuti", () => {
  const source = one("Incapsulamento") + "\n" + one("Tell Don't Ask");
  const { value: { Order, record } } = run(source + '\nconst typedCall = (o: Order) => recordConfirmation(o, "tx");', "({ Order, record: recordConfirmation })");
  const free = new Order(0);
  assert.throws(() => record(free, "tx"), /gratuito/);
  assert.equal(free.status, "draft");
  const order = new Order(100);
  assert.throws(() => record(order, "  "), /riferimento/);
  record(order, "tx");
  assert.equal(order.status, "paid");
  assert.throws(() => record(order, "tx"), /già pagato/);
});

test("Demeter: la stessa politica usa la destinazione con due layout e ignora il domicilio", () => {
  const { value: route } = run(one("Law of Demeter"), "queueFor");
  const fromNested = order => ({ destinationCountry: () => order.shipTo.country.code });
  const fromFlat = order => ({ destinationCountry: () => order.deliveryCountryCode });
  for (const [billing, delivery, expected] of [["IT", "FR", "international"], ["FR", "IT", "domestic"]]) {
    assert.equal(route(fromNested({ customer: { address: { country: { code: billing } } }, shipTo: { country: { code: delivery } } })), expected);
    assert.equal(route(fromFlat({ billingCountryCode: billing, deliveryCountryCode: delivery })), expected);
  }
});
