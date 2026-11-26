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
  - integrazione
aliases:
  - Test di integrazione
  - Integration tests
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Test unitari leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Test come documentazione]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
title: Test di integrazione
---

# Test di integrazione

## Sintesi

Un test di integrazione verifica **un confine concreto**: per esempio il repository parla davvero SQL e la sua query concorda con lo schema? Non è necessario attraversare browser, HTTP e database per rispondere a questa domanda. Sostituire il database con un oggetto che restituisce sempre successo lascerebbe invece non verificato proprio quel confine.

## Esempio: repository e SQLite reale

File `invoice-repository.test.mjs`, verificabile con Node 24 e il modulo integrato `node:sqlite`. Il motore è reale ma lavora in memoria, senza toccare dati personali. Il nome della fattura può contenere apostrofi: i valori vengono associati ai parametri, non concatenati al testo SQL.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

function insertInvoice(db, invoice) {
  db.prepare("INSERT INTO invoices (id, label) VALUES (?, ?)")
    .run(invoice.id, invoice.label);
}

test("il repository conserva l'etichetta e rifiuta un ID duplicato", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("CREATE TABLE invoices (id TEXT PRIMARY KEY NOT NULL, label TEXT NOT NULL)");
    insertInvoice(db, { id: "I-7", label: "Ordine d'aprile" });
    assert.throws(() => insertInvoice(db, { id: "I-7", label: "duplicato" }),
      /UNIQUE constraint failed/);

    const rows = db.prepare("SELECT label FROM invoices WHERE id = ?").all("I-7");
    assert.deepEqual(rows.map(row => row.label), ["Ordine d'aprile"]);
  } finally {
    db.close();
  }
});
```

## Cosa dimostra?

Il test osserva il dato **riletto** e un rifiuto effettivo del motore. Una nuova connessione in memoria isola ogni prova. La SELECT non richiama lo stesso metodo di scrittura per confermarsi da sola.

Lo schema qui è una fixture minima: il test non collauda le migrazioni del prodotto. Se in produzione usi PostgreSQL, non dare per verificati i suoi tipi, SQL o lock con una prova SQLite. Esegui i casi di compatibilità sul motore e sulla versione previsti. Per routing, autenticazione o serializzazione HTTP scegli separatamente se serve un test più ampio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Test unitari leggibili|Test unitari leggibili]]
- [[Programmazione/Clean Code/Pagine/Test come documentazione|Test come documentazione]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Validazione ai confini|Validazione ai confini]]

## Fonti

- Martin Fowler, [Integration Test](https://martinfowler.com/bliki/IntegrationTest.html)
- Node.js, [SQLite](https://nodejs.org/api/sqlite.html); SQLite, [In-memory databases](https://www.sqlite.org/inmemorydb.html)
- Gerard Meszaros, *xUnit Test Patterns*; Michael Feathers, *Working Effectively with Legacy Code*
