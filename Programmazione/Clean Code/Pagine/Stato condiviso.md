---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, concorrenza, stato]
aliases: [Stato condiviso, Shared state]
prerequisites: [Gestione dello stato, Stato mutabile e immutabile]
related: [Race condition e leggibilita, Lock e sezioni critiche, Operazioni atomiche]
---

# Stato condiviso

## Sintesi

Lo **stato condiviso** e uno stato accessibile da piu parti del programma, spesso da thread, processi, callback, worker o richieste concorrenti.

Nel Clean Code lo stato condiviso va ridotto, reso esplicito e protetto da regole chiare.

## Problema che risolve

Lo stato condiviso non controllato rende il comportamento dipendente dall'ordine di esecuzione.

Questo produce problemi come:

- race condition;
- aggiornamenti persi;
- cache incoerenti;
- test intermittenti;
- dati osservati in stati intermedi;
- bug difficili da riprodurre.

## Concetto chiave

Ogni stato condiviso dovrebbe avere:

- un proprietario;
- regole di accesso;
- operazioni di modifica nominate;
- protezione contro accessi concorrenti;
- test sui casi critici.

Se non serve condividerlo, conviene tenerlo locale o immutabile.

## Dettagli importanti

- Lo stato immutabile e piu facile da condividere.
- Lo stato mutabile condiviso richiede sincronizzazione.
- Le code riducono condivisione diretta passando messaggi.
- Le cache sono stato condiviso e vanno invalidate.
- In applicazioni web, database e sessioni sono spesso punti di stato condiviso.

## Esempio

Fragile:

```js
let processedCount = 0;

async function processJob(job) {
  await run(job);
  processedCount += 1;
}
```

Se piu worker aggiornano lo stesso contatore, l'aggiornamento puo non essere sicuro.

Piu chiaro:

```js
async function processJob(job, metrics) {
  await run(job);
  await metrics.incrementProcessedJobs();
}
```

La gestione concorrente viene spostata in un componente responsabile.

## Limiti

- Alcuni sistemi richiedono stato condiviso per coordinamento e performance.
- Eliminare tutto lo stato condiviso puo complicare inutilmente il design.
- Database e cache distribuite hanno regole di coerenza proprie.
- La sincronizzazione puo introdurre deadlock o rallentamenti.

## Errori comuni

- Usare stato globale per comodita.
- Modificare oggetti condivisi senza lock o transazioni.
- Pensare che un singolo processo sia sempre single-threaded.
- Ignorare concorrenza tra richieste web.
- Non testare aggiornamenti simultanei.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Gestione dello stato]]
- [[Stato mutabile e immutabile]]
- [[Race condition e leggibilita]]
- [[Lock e sezioni critiche]]
- [[Operazioni atomiche]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
