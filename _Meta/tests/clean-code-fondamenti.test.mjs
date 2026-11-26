import assert from "node:assert/strict"
import test from "node:test"
import { parseNote } from "../../site/scripts/vault.mjs"

function example(note, expression, index = 0) {
  const { tree } = parseNote(`Programmazione/Clean Code/Pagine/${note}.md`)
  const blocks = tree.children.filter((node) => node.type === "code" && node.lang === "js")
  assert.ok(blocks[index], `Blocco JS ${index + 1} mancante: ${note}`)
  return Function(`"use strict";\n${blocks[index].value}\nreturn (${expression});`)()
}

test("Prenotazione: forme equivalenti per dati ordinari, non per ogni getter", () => {
  const before = example("Clean Code", "canBook")
  const after = example("Clean Code", "canBook", 1)
  for (const fn of [before, after]) {
    for (const [isActive, remainingCredits, expected] of [[true, 1, true], [true, 0, false], [false, 1, false]]) {
      assert.equal(fn({ isActive, remainingCredits }), expected)
    }
  }
  const inactive = { isActive: false, get remainingCredits() { throw new Error("credit lookup") } }
  assert.equal(before(inactive), false)
  assert.throws(() => after(inactive), /credit lookup/)
})

test("Ingresso: soglia inclusiva e condizioni indipendenti", () => {
  const canEnter = example("Leggibilita del codice", "canEnterVenue")
  for (const [age, status, banned, expected] of [
    [17, "active", false, false], [18, "active", false, true],
    [30, "active", true, false], [30, "inactive", false, false],
  ]) assert.equal(canEnter({ age, status, banned }), expected)
})

test("Spedizione e sconto: centesimi alla soglia, tetto e piano non premium", () => {
  const shipping = example("Manutenibilita del codice", "shippingFeeCents")
  assert.deepEqual([4999, 5000, 5001].map(shipping), [490, 0, 0])
  const discount = example("Semplicita e complessita accidentale", "discountCents")
  for (const [plan, totalCents, expected] of [
    ["premium", 0, 0], ["premium", 300, 300], ["premium", 900, 500], ["base", 900, 0],
  ]) assert.equal(discount({ plan, totalCents }), expected)
})

test("Audit: tentativo anche per ID assente; errore prima o dopo la registrazione", async () => {
  const lookup = example("Principio del minimo stupore", "lookupUserWithAudit")
  const failure = new Error("unavailable")
  for (const failAt of [null, "audit", "read"]) {
    const trace = []
    const run = lookup("42", {
      recordAttempt: async (id) => {
        trace.push("audit:" + id)
        if (failAt === "audit") throw failure
      },
      findUser: async (id) => {
        trace.push("read:" + id)
        if (failAt === "read") throw failure
        return null
      },
    })
    if (failAt) await assert.rejects(run, (err) => err === failure)
    else assert.equal(await run, null)
    assert.deepEqual(trace, failAt === "audit" ? ["audit:42"] : ["audit:42", "read:42"])
  }
})

test("Invio esplicito: ricevuta ed errore arrivano al chiamante", async () => {
  const welcome = example("Codice esplicito vs codice implicito", "sendWelcomeEmail")
  const user = { email: "test@example.org" }
  const receipt = { id: "sent" }
  const calls = []
  assert.equal(await welcome(user, { send: async (...args) => { calls.push(args); return receipt } }), receipt)
  assert.deepEqual(calls, [[user.email, "Welcome"]])
  const failure = new Error("offline")
  await assert.rejects(welcome(user, { send: async () => { throw failure } }), (err) => err === failure)
})

test("Nomi: istanti alla scadenza e durate di due politiche distinte", () => {
  const due = example("Naming di variabili e funzioni", "isRenewalDue")
  assert.deepEqual([1999, 2000, 2001].map((now) => due(2000, now)), [false, true, true])
  assert.deepEqual(example("Nomi che rivelano intenzione", "[trialPeriodDays, cancellationNoticeDays]"), [30, 30])
})

test("Checkout: ordine degli effetti, errori e pagamento gia avvenuto", async () => {
  const checkout = example("Funzioni piccole", "checkout")
  const order = { customer: "A", lines: [{ quantity: 2, unitPriceCents: 350 }, { quantity: 1, unitPriceCents: 100 }] }
  const receipt = { id: "paid" }
  for (const failAt of [null, "validate", "charge", "send"]) {
    const trace = []
    const failure = new Error("failed")
    function step(name) { trace.push(name); if (name === failAt) throw failure }
    const run = checkout(order, {
      validateOrder: (value) => { assert.equal(value, order); step("validate") },
      chargePayment: async (customer, amount) => {
        assert.equal(customer, "A"); assert.equal(amount, 800); step("charge"); return receipt
      },
      sendReceipt: async (customer, payment) => {
        assert.equal(customer, "A"); assert.equal(payment, receipt); step("send")
      },
    })
    if (failAt) await assert.rejects(run, (err) => err === failure)
    else assert.equal(await run, receipt)
    const steps = ["validate", "charge", "send"]
    assert.deepEqual(trace, failAt ? steps.slice(0, steps.indexOf(failAt) + 1) : steps)
  }
})

test("Registrazione: l'errore interrompe i passi successivi", async () => {
  const register = example("Funzioni con responsabilita singola", "registerUser")
  const input = { email: "test@example.org" }
  const user = { id: 7 }
  for (const failAt of [null, "create", "email", "invoice"]) {
    const trace = []
    const failure = new Error("failed")
    function step(name) { trace.push(name); if (name === failAt) throw failure }
    const run = register(input, {
      createUser: async (value) => { assert.equal(value, input); step("create"); return user },
      sendWelcomeEmail: async (value) => { assert.equal(value, user); step("email") },
      createInitialInvoice: async (value) => { assert.equal(value, user); step("invoice") },
    })
    if (failAt) await assert.rejects(run, (err) => err === failure)
    else assert.equal(await run, user)
    const steps = ["create", "email", "invoice"]
    assert.deepEqual(trace, failAt ? steps.slice(0, steps.indexOf(failAt) + 1) : steps)
  }
})

test("Export: nessun lotto vuoto; una posizione riservata per lotto", () => {
  const batches = example("Commenti che spiegano il perche non il cosa", "exportBatches")
  for (const [count, sizes] of [[0, []], [99, [99]], [100, [99, 1]], [198, [99, 99]]]) {
    const rows = Array.from({ length: count }, (_, i) => i + 1)
    const result = batches(rows)
    assert.deepEqual(result.map((batch) => batch.length), sizes)
    assert.deepEqual(result.flat(), rows)
  }
})
