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
  - database
  - repository-pattern
aliases:
  - Repository pattern
  - Pattern Repository
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Service layer]]"
  - "[[Programmazione/Clean Code/Pagine/Dipendenze esplicite]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Query leggibili]]"
  - "[[Programmazione/Clean Code/Pagine/Migrazioni e schema evolution]]"
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
title: Repository pattern
---

# Repository pattern

## Sintesi

Un repository nasconde **come si accede** ai dati, non **che cosa significa** il risultato. Il chiamante deve poter distinguere «nessuna fattura con questo ID», «aggiornamento rifiutato perché non è più una bozza» e «database non disponibile». Un unico `false` per tutti e tre renderebbe impossibile decidere correttamente.

## Schema minimo dell'esempio

Su una connessione SQLite con chiavi esterne abilitate, inizializza una base vuota con questo schema. L'outbox è dedicata al solo evento di emissione, una volta per fattura; non è una tabella universale per qualunque evento.

```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft', 'issued')),
  issued_ms INTEGER,
  internal_note TEXT NOT NULL DEFAULT '',
  CHECK ((state = 'draft' AND issued_ms IS NULL)
      OR (state = 'issued' AND issued_ms IS NOT NULL))
);
CREATE TABLE invoice_issued_outbox (
  invoice_id TEXT PRIMARY KEY NOT NULL REFERENCES invoices(id),
  issued_ms INTEGER NOT NULL
);
```

## Repository: tre metodi, tre contratti

```js
function invoiceRepository(db) {
  const find = db.prepare("SELECT id, state, issued_ms, internal_note FROM invoices WHERE id = ?");
  const save = db.prepare("UPDATE invoices SET state = 'issued', issued_ms = ? WHERE id = ? AND state = 'draft'");
  const enqueue = db.prepare("INSERT INTO invoice_issued_outbox(invoice_id, issued_ms) VALUES (?, ?)");
  return {
    find(id) {
      const row = find.get(id);
      return row === undefined ? null : {
        id: row.id, state: row.state, issuedAtMs: row.issued_ms, internalNote: row.internal_note,
      };
    },
    saveIssued(invoice) {
      return save.run(invoice.issuedAtMs, invoice.id).changes === 1;
    },
    enqueueIssued(invoice) {
      enqueue.run(invoice.id, invoice.issuedAtMs);
    },
  };
}
```

`find` mappa i nomi SQL e restituisce `null` **solo** per una ricerca riuscita senza righe. `saveIssued` riceve il modello già transitato a `issued`: il filtro sul vecchio stato viene valutato nello stesso `UPDATE`. Zero righe modificate non permette, da solo, di distinguere tra riga assente e stato cambiato. `enqueueIssued` non ignora i conflitti del vincolo univoco; è il [[Programmazione/Clean Code/Pagine/Service layer|service]] a decidere il confine del commit, non ogni metodo a confermare per conto proprio.

## Quando non usarlo

Un report che aggrega righe di più tabelle può avere un lettore SQL dedicato invece di ricostruire molte entità. Un wrapper che espone ogni metodo dell'ORM senza cambiare il contratto aggiunge poco. Per operazioni condizionali come il decremento dello stock, verifica il numero di righe modificate e non scambiare un errore tecnico per «esaurito».

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Service layer|Service layer]]
- [[Programmazione/Clean Code/Pagine/Dipendenze esplicite|Dipendenze esplicite]]
- [[Programmazione/Clean Code/Pagine/Query leggibili|Query leggibili]]
- [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]

## Fonti

- Martin Fowler, *Repository*
- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Patterns of Enterprise Application Architecture*
- [Martin Fowler: Repository](https://martinfowler.com/eaaCatalog/repository.html)
- [Node.js: DatabaseSync e StatementSync](https://nodejs.org/api/sqlite.html)
