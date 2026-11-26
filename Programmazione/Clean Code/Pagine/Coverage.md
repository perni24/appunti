---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - testing
  - coverage
aliases:
  - Coverage
  - Test coverage
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Mutation testing]]"
  - "[[Programmazione/Clean Code/Pagine/Code quality gates]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Coverage
---

# Coverage

## Sintesi

La coverage misura **quale codice è stato attraversato**, non se l'asserzione sarebbe capace di riconoscere un risultato sbagliato. Una riga eseguita, una funzione chiamata e un ramo preso sono misure diverse. Leggi anche il perimetro del report: i file esclusi non diventano coperti.

## Esempio: due rami coperti, una soglia non verificata

Regola del progetto di esempio: su importi interi non negativi in centesimi, la spedizione è gratuita **a partire da 2000**, altrimenti costa 350. In `shipping.mjs`:

```js
export function shippingCents(total) {
  if (total >= 2000) {
    return 0;
  }
  return 350;
}
```

In `shipping.test.mjs`, con il test runner di Node 24:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { shippingCents } from "./shipping.mjs";

test("costo sotto e sopra la soglia", () => {
  assert.equal(shippingCents(1999), 350);
  assert.equal(shippingCents(2001), 0);
});
```

Esegui il report **sul solo modulo della tariffa**, non sul test:

```sh
node --test --experimental-test-coverage --test-coverage-include=shipping.mjs shipping.test.mjs
```

Con questi casi entrambi i ritorni vengono eseguiti. Eppure, se il confronto diventasse `>`, le due asserzioni passerebbero ancora: **1999 e 2001 non distinguono le due implementazioni**. Il test mancante riguarda 2000, non una riga che il report colora come non eseguita.

## Come usare il dato

1. Individua un percorso scoperto e chiediti se corrisponde a un comportamento promesso: rifiuto, errore di scrittura, limite esatto o stato invariato dopo un fallimento.
2. Aggiungi un'asserzione osservabile. Invocare la funzione senza controllarne l'effetto può far salire il numero senza proteggere nulla.
3. Specifica quali file e quali metriche contano. Una soglia sulle righe dell'intero progetto può nascondere codice nuovo non provato; la copertura differenziale riguarda soltanto il cambiamento.

Per verificare *se i test reagiscono* al difetto sulla soglia, usa l'esperimento in [[Programmazione/Clean Code/Pagine/Mutation testing|Mutation testing]].

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Mutation testing|Mutation testing]]
- [[Programmazione/Clean Code/Pagine/Code quality gates|Code quality gates]]

## Fonti

- Martin Fowler, *TestCoverage*
- Gerard Meszaros, *xUnit Test Patterns*
- Kent Beck, *Test Driven Development*
- [Node.js 24: test runner e raccolta della coverage](https://nodejs.org/docs/latest-v24.x/api/test.html#collecting-code-coverage)
- [Martin Fowler: Test Coverage](https://martinfowler.com/bliki/TestCoverage.html)
