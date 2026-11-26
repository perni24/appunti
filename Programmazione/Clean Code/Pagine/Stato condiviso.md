---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - concorrenza
  - stato
aliases:
  - Stato condiviso
  - Shared state
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Gestione dello stato]]"
  - "[[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Race condition e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Lock e sezioni critiche]]"
  - "[[Programmazione/Clean Code/Pagine/Operazioni atomiche]]"
title: Stato condiviso
---

# Stato condiviso

## Sintesi

Uno stato è **condiviso** quando più operazioni accedono alla stessa informazione. Se è immutabile, le letture non si ostacolano; se qualcuno lo modifica, individua il proprietario e il punto in cui un'altra operazione può intervenire. Concorrenza significa che più attività sono in corso; parallelismo significa che eseguono lavoro nello stesso istante. Per perdere un aggiornamento basta la prima.

## Esempio: due lavori, un contatore

Ogni chiamata a `jobMetrics()` crea un contatore distinto. I lavori dello **stesso** componente condividono la stessa istanza. `run` è una funzione asincrona: si conta solo il lavoro terminato con successo.

```js
function jobMetrics() {
  let completed = 0;
  return {
    async process(job, run) {
      await run(job);
      completed += 1;
    },
    count() { return completed; },
  };
}
```

Sul singolo agente JavaScript dell'esempio, con una variabile numerica locale, nessun'altra continuazione si inserisce **dentro** `completed += 1`. L'attesa avviene prima della lettura del contatore. Se invece si salvasse `const before = completed` **prima** di `await run(job)` e poi si scrivesse `completed = before + 1`, due lavori potrebbero leggere entrambi zero e lasciare uno invece di due.

## Dove vive il dato?

| Ambito | Che cosa osserva il contatore? | Conseguenza |
| --- | --- | --- |
| Una richiesta | Solo i lavori di quell'istanza | Nessun totale applicativo |
| Un'istanza condivisa nello stesso agente | I completamenti di chi usa quell'istanza | Riparte da zero al riavvio |
| Più processi o worker con stato locale | Un conteggio distinto per ciascuno | Serve aggregazione, non basta un modulo globale |

Per una metrica locale può andare bene contare **tentativi riusciti**: lo stesso job eseguito due volte conta due. Per un totale fatturabile di job unici, servono identità stabili e un archivio che le registri una volta sola. Spostare `+= 1` in una funzione dal nome migliore non cambia la garanzia.

## Verifica

Avvia due lavori con promesse controllabili e completa per primo il secondo. Entrambi devono contribuire al totale, uno rifiutato no. Crea poi una seconda istanza: deve partire da zero. Queste verifiche non dicono nulla su memoria condivisa tra thread, per la quale servono primitive adeguate.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Gestione dello stato|Gestione dello stato]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]
- [[Programmazione/Clean Code/Pagine/Race condition e leggibilita|Race condition e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Lock e sezioni critiche|Lock e sezioni critiche]]
- [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- [ECMAScript: agenti, job e contesti di esecuzione](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html)
- [Node.js: worker e condivisione esplicita della memoria](https://nodejs.org/api/worker_threads.html)
