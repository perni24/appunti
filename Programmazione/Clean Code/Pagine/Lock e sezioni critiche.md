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
  - concorrenza
  - lock
aliases:
  - Lock e sezioni critiche
  - Critical sections
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Stato condiviso]]"
  - "[[Programmazione/Clean Code/Pagine/Race condition e leggibilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Operazioni atomiche]]"
  - "[[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione delle risorse]]"
title: Lock e sezioni critiche
---

# Lock e sezioni critiche

## Sintesi

Una sezione critica comprende **tutte** le operazioni che devono essere viste come esclusive dagli altri partecipanti. Nel caso di una prenotazione: leggere la disponibilità, decidere e registrare il posto. Se si legge prima di prendere il lock, la decisione può basarsi su una disponibilità già cambiata.

## Esempio: prenotazioni nello stesso processo

Esempio ESM su Node 24.14. `locks` di `node:worker_threads` è disponibile da Node 24.5 ed è sperimentale nella serie 24. Il repository dell'esempio risolve `isAvailable(id)` con un booleano e `markReserved(id)` quando la modifica è completa. Tutti i partecipanti usano lo stesso nome di lock per lo stesso posto.

```js
import { locks } from "node:worker_threads";

export function reserveSeat(seatId, repo) {
  return locks.request("seat:" + seatId, async () => {
    if (!(await repo.isAvailable(seatId))) return false;
    await repo.markReserved(seatId);
    return true;
  });
}
```

Il lock esclusivo resta detenuto fino alla conclusione della promessa del callback, anche se il callback fallisce. **Poi** viene rilasciato: un secondo richiedente può entrare e rileggere lo stato. Una notifica via email non fa parte della prenotazione e non dovrebbe prolungare la sezione critica. Un rifiuto del callback non annulla una scrittura già riuscita.

## Scegliere l'ambito

- Due posti diversi hanno nomi diversi: non c'è ragione di bloccare la prenotazione di B mentre A è occupato.
- Un lettore o uno scrittore che ignora il lock non viene protetto. Questo gestore coordina i partecipanti **nello stesso processo Node**; per più istanze che condividono un database usa un vincolo o una modifica condizionale nel database.
- Un semaforo permette fino a *N* accessi: con *N* maggiore di uno non protegge da solo un aggiornamento esclusivo. Se imponi più lock, stabilisci un ordine comune di acquisizione; riacquisire lo stesso lock esclusivo mentre lo si detiene può far attendere il proprio callback indefinitamente.

## Verifica

Sospendi la prima scrittura, richiedi lo stesso posto e uno diverso: solo il posto diverso deve poter procedere nel frattempo. Fai anche fallire una prenotazione e controlla che la successiva possa entrare. Questo prova l'esclusione locale, non un lock distribuito né un rollback del repository.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Stato condiviso|Stato condiviso]]
- [[Programmazione/Clean Code/Pagine/Race condition e leggibilita|Race condition e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]
- [[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse|Cleanup e rilascio risorse]]
- [[Programmazione/Clean Code/Pagine/Gestione delle risorse|Gestione delle risorse]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Michael Nygard, *Release It!*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- [Node.js 24: LockManager e durata di locks.request](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html#class-lockmanager)
- [W3C: Web Locks API](https://www.w3.org/TR/web-locks/)
