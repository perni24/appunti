---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, async, leggibilita]
aliases: [Async code leggibile, Codice asincrono leggibile]
prerequisites: [Code e worker, Gestione esplicita degli errori]
related: [Logging e tracing, Side effects controllati, Race condition e leggibilita]
---

# Async code leggibile

## Sintesi

Il **codice asincrono leggibile** rende chiari ordine, concorrenza, errori e cancellazione.

L'asincronia non deve nascondere il flusso: deve mostrare quali operazioni sono sequenziali, quali parallele e come vengono gestiti i fallimenti.

## Problema che risolve

Il codice async diventa fragile quando:

- le promesse o task non vengono attesi;
- gli errori si perdono;
- le operazioni parallele modificano lo stesso stato;
- non esistono timeout;
- la cancellazione non e gestita;
- il logging perde contesto.

## Concetto chiave

Il lettore deve capire tre cose:

- cosa deve succedere in ordine;
- cosa puo succedere in parallelo;
- cosa accade se una parte fallisce.

La struttura del codice dovrebbe rendere queste scelte esplicite.

## Dettagli importanti

- Non avviare lavoro asincrono senza gestirne risultato o errore.
- Dai nomi chiari ai passaggi asincroni.
- Se esegui operazioni in parallelo, verifica che non condividano stato fragile.
- Usa timeout e cancellazione quando l'attesa non puo essere infinita.
- Mantieni correlation id e contesto nei log.

## Esempio

Sequenziale quando l'ordine conta:

```js
const user = await loadUser(userId);
const orders = await loadOrders(user.id);
return buildSummary(user, orders);
```

Parallelo quando le operazioni sono indipendenti:

```js
const [user, settings] = await Promise.all([
  loadUser(userId),
  loadSettings(userId),
]);
```

La forma scelta comunica l'intenzione.

## Limiti

- Troppa parallelizzazione puo aumentare carico e fallimenti.
- Alcuni framework impongono modelli async specifici.
- Debuggare codice concorrente richiede log e tracing migliori.
- Timeout, retry e cancellazione possono complicare il flusso.

## Errori comuni

- Usare `Promise.all` su operazioni che dipendono l'una dall'altra.
- Non gestire il fallimento parziale.
- Avviare task fire-and-forget senza monitoraggio.
- Mescolare callback, promise e async/await senza convenzione.
- Dimenticare timeout verso servizi esterni.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Code e worker]]
- [[Gestione esplicita degli errori]]
- [[Race condition e leggibilita]]
- [[Side effects controllati]]
- [[Logging e tracing]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- Brian Goetz, *Java Concurrency in Practice*
