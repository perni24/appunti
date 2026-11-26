import assert from "node:assert/strict";
import { mkdtemp, readFile, unlink, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

function snippet(note) {
  const blocks = parseNote(`Programmazione/Clean Code/Pagine/${note}.md`).tree.children
    .filter(n => n.type === "code" && n.lang === "js");
  assert.equal(blocks.length, 1, note);
  return blocks[0].value;
}

function example(note, names) {
  return Function('"use strict";\n' + snippet(note) + "\nreturn ({" + names + "});")();
}

test("Importo: nessun fallback a zero per input assente, malformato o fuori limite", () => {
  const { parseCents } = example("Gestione esplicita degli errori", "parseCents");
  for (const v of [undefined, null, "", "  "]) {
    assert.deepEqual(parseCents(v), { ok: false, error: "amount_required" });
  }
  for (const v of [false, 0, "1e3", "10.99", "-1", "0x10"]) {
    assert.deepEqual(parseCents(v), { ok: false, error: "invalid_amount" });
  }
  for (const [v, expected] of [["0", 0], [" 0012 ", 12], [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER]]) {
    assert.deepEqual(parseCents(v), { ok: true, value: expected });
  }
  assert.deepEqual(parseCents("9007199254740992"), { ok: false, error: "amount_out_of_range" });
});

test("Ricerca: presenza, assenza e causa originale del guasto", async () => {
  const { findUser } = example("Eccezioni vs valori di errore", "findUser");
  const row = { id: "007" };
  const repo = { findById: async id => id === row.id ? row : null };
  assert.deepEqual(await findUser(repo, "007"), { ok: true, value: row });
  assert.deepEqual(await findUser(repo, "7"), { ok: false, error: "not_found" });
  const cause = new Error("offline");
  await assert.rejects(findUser({ findById: async () => { throw cause; } }, "7"),
    e => e.cause === cause && e.message.includes("archivio"));
});

test("Tracing: esito, correlazione, dati esclusi e fine dello span dopo il pagamento", async () => {
  const { authorizeOrder } = example("Logging e tracing", "authorizeOrder");
  const ids = { traceId: "a".repeat(32), spanId: "b".repeat(16) };
  const cause = new Error("dettaglio riservato");
  for (const failure of [false, true]) {
    const events = [];
    const span = { spanContext: () => ids, end: () => events.push("end"),
      setStatus: value => events.push(value) };
    const deps = {
      tracer: { startActiveSpan: (name, fn) => { events.push(name); return fn(span); } },
      SpanStatusCode: { ERROR: 2 },
      log: { info: value => events.push(["info", value]), error: value => events.push(["error", value]) },
      authorize: async payment => {
        assert.equal(payment, "dati riservati");
        await Promise.resolve();
        events.push("authorize");
        if (failure) throw cause;
        return "receipt";
      },
    };
    const outcome = authorizeOrder({ id: "O-7", payment: "dati riservati" }, deps);
    if (failure) await assert.rejects(outcome, e => e === cause);
    else assert.equal(await outcome, "receipt");
    const fields = { orderId: "O-7", ...ids };
    assert.deepEqual(events, ["payment.authorize", "authorize", ...(failure
      ? [{ code: 2 }, ["error", { event: "payment.authorization_failed", ...fields }]]
      : [["info", { event: "payment.authorized", ...fields }]]), "end"]);
  }
});

test("Configurazione: default solo per chiavi assenti, errore senza credenziali", () => {
  const { loadConfig } = example("Configurazione applicativa", "loadConfig");
  const env = { DATABASE_URL: "postgresql://db.example/app" };
  assert.deepEqual(loadConfig(env), { databaseUrl: env.DATABASE_URL, port: 3000, logLevel: "info" });
  for (const port of ["1", "65535"]) {
    assert.equal(loadConfig({ ...env, PORT: port, LOG_LEVEL: "debug" }).port, Number(port));
  }
  for (const port of ["", " ", "0", "65536", "1e3", "3000x", "1.5"]) {
    assert.throws(() => loadConfig({ ...env, PORT: port }), /PORT/);
  }
  for (const level of ["", "DEBUG", "false"]) assert.throws(() => loadConfig({ ...env, LOG_LEVEL: level }), /LOG_LEVEL/);
  for (const url of [undefined, "", "postgres:///app", "https://user:secret@db.example/app", "invalid secret"]) {
    assert.throws(() => loadConfig({ DATABASE_URL: url }), e => e.message.includes("DATABASE_URL") && !e.message.includes("secret"));
  }
});

test("JSON: sintassi, forma, normalizzazione e campi pubblici", () => {
  const { parseCreateUser: parse, serializePublicUser } = example("Parsing e serializzazione", "parseCreateUser, serializePublicUser");
  assert.deepEqual(parse("{"), { ok: false, error: "invalid_json" });
  for (const raw of ["null", "[]", "42"]) assert.deepEqual(parse(raw), { ok: false, error: "expected_object" });
  for (const email of [" ", 3, null]) assert.deepEqual(parse(JSON.stringify({ email })), { ok: false, error: "invalid_field", field: "email" });
  assert.deepEqual(parse('{"email":"a","displayName":null}'), { ok: false, error: "invalid_field", field: "displayName" });
  assert.deepEqual(parse('{"email":" A@example.org ","role":"admin"}'), { ok: true, value: { email: "A@example.org", displayName: "" } });
  assert.deepEqual(parse('{"email":"a","displayName":" Ada "}').value, { email: "a", displayName: "Ada" });
  assert.deepEqual(JSON.parse(serializePublicUser({ id: 1, displayName: "Ada", passwordHash: "private" })), { id: 1, displayName: "Ada" });
});

test("Roma: ora ripetuta in autunno, ora saltata in primavera e scadenza al confine", () => {
  const { firstMs, secondMs, romeClock, isExpired } = example("Date tempo e timezone", "firstMs, secondMs, romeClock, isExpired");
  assert.equal(romeClock.format(firstMs), "02:30");
  assert.equal(romeClock.format(secondMs), "02:30");
  assert.equal(secondMs - firstMs, 3_600_000);
  assert.equal(isExpired(secondMs, firstMs), false);
  assert.equal(isExpired(secondMs, secondMs), true);
  assert.throws(() => isExpired(NaN, firstMs), TypeError);
  assert.equal(romeClock.format(Date.parse("2025-03-30T00:59Z")), "01:59");
  assert.equal(romeClock.format(Date.parse("2025-03-30T01:00Z")), "03:00");
});

test("Filesystem locale: assenza, null, sintassi, UTF-8 e creazione esclusiva", async t => {
  const { readOptionalJson, createReport } = await import("data:text/javascript," + encodeURIComponent(snippet("File system e IO")));
  const dir = await mkdtemp(join(tmpdir(), "clean-code-io-"));
  const file = join(dir, "sample.json");
  t.after(async () => {
    try { await unlink(file); } catch (e) { if (e.code !== "ENOENT") throw e; }
    await rmdir(dir);
  });
  assert.deepEqual(await readOptionalJson(file), { found: false });
  await createReport(file, "null");
  assert.deepEqual(await readOptionalJson(file), { found: true, value: null });
  await assert.rejects(createReport(file, "nuovo"), { code: "EEXIST" });
  assert.equal(await readFile(file, "utf8"), "null");
  await writeFile(file, "", "utf8");
  await assert.rejects(readOptionalJson(file), SyntaxError);
  await unlink(file);
  await createReport(file, '"caffè"');
  assert.deepEqual(await readOptionalJson(file), { found: true, value: "caffè" });
});
