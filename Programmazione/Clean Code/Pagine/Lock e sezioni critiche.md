---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, concorrenza, lock]
aliases: [Lock e sezioni critiche, Critical sections]
prerequisites: [Stato condiviso, Race condition e leggibilita]
related: [Operazioni atomiche, Cleanup e rilascio risorse, Gestione delle risorse]
---

# Lock e sezioni critiche

## Sintesi

Un **lock** protegge una risorsa condivisa impedendo accessi concorrenti non sicuri.

Una **sezione critica** e il tratto di codice che deve essere eseguito in modo esclusivo.

## Quando usarlo

- Quando piu flussi modificano lo stesso stato.
- Quando una sequenza deve essere indivisibile.
- Quando una risorsa non e thread-safe.
- Quando serve proteggere cache, contatori, file o strutture condivise.
- Quando una transazione database non basta o non e disponibile.

## Come funziona

La forma base e:

```text
acquisisci lock -> esegui sezione critica -> rilascia lock
```

Il rilascio deve essere garantito anche in caso di errore.

## API / Sintassi

```js
await mutex.runExclusive(async () => {
  const current = state.value;
  state.value = current + 1;
});
```

L'operazione protetta deve essere piccola e chiara.

## Esempio pratico

```js
async function reserveSeat(seatId, lock, repository) {
  return lock.runExclusive(`seat:${seatId}`, async () => {
    const seat = await repository.findSeat(seatId);
    if (seat.reserved) return false;

    await repository.markReserved(seatId);
    return true;
  });
}
```

Il lock rende esplicita la sezione critica della prenotazione.

## Varianti

- Mutex: accesso esclusivo in un processo.
- Read-write lock: molte letture, scrittura esclusiva.
- Distributed lock: coordinamento tra processi o nodi.
- Transazione database: protezione a livello dati.
- Semaphore: limita concorrenza, non sempre esclusione totale.

## Errori comuni

- Dimenticare il rilascio del lock.
- Tenere lock durante operazioni lente o remote.
- Acquisire lock in ordini diversi e creare deadlock.
- Proteggere codice troppo ampio.
- Usare lock distribuiti senza capire timeout e lease.

## Checklist

- La sezione critica e davvero minima?
- Il lock viene sempre rilasciato?
- L'ordine di acquisizione e coerente?
- Sono gestiti timeout e cancellazione?
- Esistono test o controlli sui casi concorrenti?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Stato condiviso]]
- [[Race condition e leggibilita]]
- [[Operazioni atomiche]]
- [[Cleanup e rilascio risorse]]
- [[Gestione delle risorse]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Michael Nygard, *Release It!*
- Martin Kleppmann, *Designing Data-Intensive Applications*
