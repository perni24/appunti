---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - testing
  - documentazione
aliases:
  - Test come documentazione
  - Tests as documentation
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
  - "[[Programmazione/Clean Code/Pagine/Arrange Act Assert]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
title: Test come documentazione
---

# Test come documentazione

## Sintesi

Un test diventa documentazione eseguibile quando mostra **un esempio del contratto** che interessa al lettore. Un'asserzione verde conferma quel caso, non la correttezza del requisito né la completezza degli esempi scelti.

## Esempio: quando una fattura non può essere emessa?

Usa il modulo `invoice.mjs` di [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]] e metti accanto questo `invoice.test.mjs`. Le prime due prove distinguono condizioni che un messaggio generico come «fattura non valida» nasconderebbe:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { issueInvoice } from "./invoice.mjs";

test("bozza senza righe: serve almeno una riga", () => {
  assert.deepEqual(issueInvoice({ status: "draft", lineCents: [] }),
    { ok: false, code: "empty_invoice" });
});

test("bozza con riga gratuita: la riga esiste ma il totale è zero", () => {
  assert.deepEqual(issueInvoice({ status: "draft", lineCents: [0] }),
    { ok: false, code: "zero_total" });
});

test("dopo l'emissione la stessa fattura non si può emettere di nuovo", () => {
  const issued = issueInvoice({ status: "draft", lineCents: [125, 75] });
  assert.equal(issued.ok, true);
  assert.equal(issued.invoice.totalCents, 200);
  assert.deepEqual(issueInvoice(issued.invoice), { ok: false, code: "not_draft" });
});
```

## Cosa lasciare fuori dal test

Il codice di errore serve all'applicazione; il testo italiano può cambiare senza rompere il contratto. Se l'utente deve leggere una particolare istruzione, testala nella presentazione, non bloccando alla stessa frase il modello di dominio.

Questi test descrivono **cosa** accade. Per il **perché** della regola sul totale occorre il requisito di prodotto. Un test di caratterizzazione scritto su codice esistente può registrare anche un difetto: prima di chiamarlo specifica, chiedi quale comportamento il prodotto intenda garantire.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Arrange Act Assert|Arrange Act Assert]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]

## Fonti

- Martin Fowler, [Given When Then](https://martinfowler.com/bliki/GivenWhenThen.html)
- Kent Beck, *Test Driven Development*; Gerard Meszaros, *xUnit Test Patterns*; Martin Fowler, *Specification by Example*
