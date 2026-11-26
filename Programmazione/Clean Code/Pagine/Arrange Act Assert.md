---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - testing
  - aaa
aliases:
  - Arrange Act Assert
  - AAA pattern
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Test data builders]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
title: Arrange Act Assert
---

# Arrange Act Assert

## Sintesi

**Arrange, Act, Assert** separa la preparazione del caso, l'azione sotto esame e le osservazioni finali. La regola pratica è **un comportamento riconoscibile**, non «una sola asserzione» o «tre commenti obbligatori».

## Esempio: verificare una scrittura asincrona

Metti `reminder.test.mjs` accanto al modulo `reminder.mjs` di [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]. Il sostituto registra la richiesta, ma non decide lui la scadenza:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { scheduleReminder } from "./reminder.mjs";

test("il promemoria è salvato un'ora dopo e restituisce l'ID assegnato", async () => {
  const saved = [];
  const deps = {
    nowMs: () => 1000,
    save: async reminder => { saved.push(reminder); return "R-7"; },
  };

  const id = await scheduleReminder("I-3", deps);

  assert.equal(id, "R-7");
  assert.deepEqual(saved, [{ invoiceId: "I-3", dueAtMs: 3601000 }]);
});
```

La riga vuota isola l'azione. Controllare soltanto l'ID lascerebbe passare una scrittura con scadenza sbagliata; controllare soltanto il record non rileverebbe la perdita del valore restituito. Le due asserzioni descrivono lo stesso contratto.

## Errori comuni

Completa l'azione con `await` **prima** di verificare i suoi effetti. Se il comportamento atteso è un errore asincrono, l'invocazione può stare dentro `await assert.rejects(...)`: non chiamare due volte il sistema solo per separare visivamente le fasi. Per il caso «archivio indisponibile» scrivi una prova distinta; non modificare a metà test un collaboratore per avviare un secondo scenario scollegato.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Test data builders|Test data builders]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]

## Fonti

- Bill Wake, [3A: Arrange, Act, Assert](https://xp123.com/3a-arrange-act-assert/)
- Kent Beck, *Test Driven Development*; Gerard Meszaros, *xUnit Test Patterns*
