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
  - unit-test
aliases:
  - Test unitari leggibili
  - Readable unit tests
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Arrange Act Assert]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
  - "[[Programmazione/Clean Code/Pagine/Test data builders]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Test unitari leggibili
---

# Test unitari leggibili

## Sintesi

Un test unitario leggibile identifica la regola che si romperebbe. Se il nome dice «lo sconto spetta **solo** agli iscritti attivi», provare soltanto un iscritto attivo non basta: anche una funzione che concede lo sconto a tutti passerebbe il test.

## Esempio: verificare entrambi i lati della regola

Per questo esempio gli importi sono centesimi interi non negativi. Lo sconto per un cliente attivo è il 10% arrotondato per difetto al centesimo; quello per un cliente inattivo è zero. Modulo `member-discount.mjs`:

```js
export function discountCents(totalCents, active) {
  return active ? Math.floor(totalCents / 10) : 0;
}
```

File `member-discount.test.mjs` accanto al modulo, con il runner nativo di Node:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { discountCents } from "./member-discount.mjs";

test("cliente attivo: 105 centesimi danno 10 centesimi di sconto", () => {
  assert.equal(discountCents(105, true), 10);
});

test("cliente inattivo: lo stesso carrello non riceve sconto", () => {
  assert.equal(discountCents(105, false), 0);
});
```

## Perché questi dati?

Tenere identico il totale isola il ruolo dello stato del cliente; scegliere 105 anziché 100 rende osservabile anche l'arrotondamento. Il valore atteso è scritto nel test, non ricalcolato con la stessa formula della produzione. Cambiare il calcolo interno senza cambiare il comportamento non dovrebbe richiedere di riscrivere le asserzioni.

Qui un builder o un mock nasconderebbe gli unici due dati importanti. Per molti casi omogenei una tabella può aiutare, ma una percentuale di copertura elevata non sostituisce il controesempio che smaschererebbe la regola sbagliata.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Arrange Act Assert|Arrange Act Assert]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]
- [[Programmazione/Clean Code/Pagine/Test data builders|Test data builders]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]

## Fonti

- Node.js, [Test runner](https://nodejs.org/api/test.html)
- Kent Beck, *Test Driven Development*; Gerard Meszaros, *xUnit Test Patterns*; Martin Fowler, *Test Pyramid*
