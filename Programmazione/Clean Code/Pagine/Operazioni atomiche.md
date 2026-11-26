---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - atomicita
  - concorrenza
aliases:
  - Operazioni atomiche
  - Atomic operations
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Race condition e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Lock e sezioni critiche]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Idempotenza]]"
  - "[[Programmazione/Clean Code/Pagine/Stato condiviso]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
title: Operazioni atomiche
---

# Operazioni atomiche

## Sintesi

Per prenotare l'ultima unità non basta che la lettura dello stock e la scrittura siano sicure **separatamente**. La domanda da rivolgere al database è «puoi togliere una unità **se è ancora disponibile**?». Il punto che decide deve essere lo stesso che modifica il dato.

## Esempio: aggiornamento condizionale SQLite

Si presuppone `products(id TEXT PRIMARY KEY, stock INTEGER NOT NULL CHECK (stock >= 0))` con quantità intere, e una connessione SQLite in autocommit. Il risultato della stessa istruzione dice se il decremento è avvenuto e quanto rimane: non occorre una seconda lettura.

```js
function reserveOne(db, id) {
  const row = db.prepare(
    "UPDATE products SET stock = stock - 1 " +
    "WHERE id = ? AND stock > 0 RETURNING stock"
  ).get(id);
  if (row === undefined) return { ok: false, reason: "unavailable" };
  return { ok: true, remaining: row.stock };
}
```

Da stock uno il primo tentativo restituisce `{ ok: true, remaining: 0 }`: **zero è il risultato di un successo**. Il tentativo seguente non aggiorna righe. Il contratto usa `unavailable` sia per ID assente sia per stock esaurito, perché l'istruzione non li distingue. Un database occupato o una scrittura fallita sollevano un errore, non significano «esaurito».

## Tre garanzie diverse

| Garanzia | Domanda | Cosa offre l'esempio |
| --- | --- | --- |
| Atomicità | La modifica può essere applicata a metà? | Il decremento è una sola istruzione condizionale |
| Isolamento | Chi vede o può modificare il dato mentre lavoro? | SQLite serializza le scritture; un altro scrittore può dover attendere o ricevere un errore di contesa |
| Idempotenza | Ripetere la stessa richiesta è innocuo? | **No**: se ci sono due unità, due chiamate possono consumarle entrambe |

## Quando una sola istruzione non basta

Se devi inserire anche la prenotazione, racchiudi le scritture nella stessa transazione e comunica il successo **dopo** il commit. Un vincolo univoco serve per l'identità, un aggiornamento condizionale per lo stock, un confronto di versione per rilevare dati cambiati. Un `ack` di coda non estende nessuna di queste garanzie a un database o servizio separato.

## Verifica

Oltre all'ultimo pezzo, prova il caso di due unità e un ID inesistente. Con due connessioni allo stesso file mantieni aperta una transazione di scrittura: la contesa sulla seconda deve rimanere distinguibile da una prenotazione rifiutata per stock non disponibile.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Race condition e leggibilita|Race condition e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Lock e sezioni critiche|Lock e sezioni critiche]]
- [[Programmazione/Clean Code/Pagine/Idempotenza|Idempotenza]]
- [[Programmazione/Clean Code/Pagine/Stato condiviso|Stato condiviso]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Brian Goetz, *Java Concurrency in Practice*
- Michael Nygard, *Release It!*
- [SQLite: isolamento tra connessioni e scritture](https://www.sqlite.org/isolation.html)
- [SQLite: risultati e limiti di RETURNING](https://www.sqlite.org/lang_returning.html)
