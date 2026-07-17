---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, atomicita, concorrenza]
aliases: [Operazioni atomiche, Atomic operations]
prerequisites: [Race condition e leggibilita, Lock e sezioni critiche]
related: [Idempotenza, Stato condiviso, Gestione esplicita degli errori]
---

# Operazioni atomiche

## Sintesi

Un'**operazione atomica** e un'operazione che viene osservata come indivisibile: o avviene completamente, o non avviene.

Nel Clean Code l'atomicita rende piu chiaro quali passaggi non possono essere separati senza creare inconsistenza.

## Quando usarlo

- Quando fai `read -> modify -> write` su stato condiviso.
- Quando aggiorni contatori o stock.
- Quando crei record con vincoli unici.
- Quando devi coordinare piu scritture in una transazione.
- Quando un retry potrebbe duplicare effetti.

## Come funziona

L'atomicita puo essere garantita da:

- primitive del linguaggio;
- lock;
- transazioni database;
- vincoli unici;
- operazioni condizionali;
- compare-and-swap;
- code con ack controllato.

La scelta dipende dal livello in cui vive lo stato.

## API / Sintassi

```sql
UPDATE products
SET stock = stock - 1
WHERE id = ? AND stock > 0;
```

Questa forma evita di leggere stock e aggiornarlo in due passaggi separati.

## Esempio pratico

```js
async function reserveProduct(productId, repository) {
  const updated = await repository.decrementStockIfAvailable(productId);

  if (!updated) {
    return { ok: false, error: "out_of_stock" };
  }

  return { ok: true };
}
```

Il repository espone un'operazione atomica, non una sequenza fragile.

## Varianti

- Atomic increment: contatori.
- Compare-and-swap: aggiorna solo se il valore atteso e ancora valido.
- Transaction: piu operazioni trattate come unita.
- Unique constraint: impedisce duplicati.
- Upsert: crea o aggiorna in un'unica operazione.

## Errori comuni

- Dividere controllo e scrittura in passaggi separati.
- Pensare che una funzione sia atomica solo perche e corta.
- Ignorare concorrenza tra processi diversi.
- Usare transazioni senza capire isolamento.
- Non verificare il risultato dell'operazione atomica.

## Checklist

- Quale stato deve essere protetto?
- L'operazione e davvero indivisibile al livello corretto?
- Il risultato segnala successo o fallimento?
- Esistono vincoli o transazioni che proteggono i dati?
- I retry sono sicuri?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Race condition e leggibilita]]
- [[Lock e sezioni critiche]]
- [[Idempotenza]]
- [[Stato condiviso]]
- [[Gestione esplicita degli errori]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Brian Goetz, *Java Concurrency in Practice*
- Michael Nygard, *Release It!*
