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
  - race-condition
aliases:
  - Race condition e leggibilita
  - Race conditions
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Stato condiviso]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Lock e sezioni critiche]]"
  - "[[Programmazione/Clean Code/Pagine/Operazioni atomiche]]"
  - "[[Programmazione/Clean Code/Pagine/Idempotenza]]"
title: Race condition e leggibilita
---

# Race condition e leggibilita

## Sintesi

Una **race condition** è un difetto per cui un ordine di esecuzione consentito viola una regola del programma. Non serve che due thread scrivano nello stesso istante. Due ricerche su un singolo event loop possono terminare in ordine inverso e mostrare all'utente il risultato di una domanda che non sta più facendo.

## Esempio: vince l'ultima ricerca avviata

La regola della schermata è «mostra il risultato della richiesta più **recente per avvio**», non «mostra qualunque risposta arrivi per ultima». Ogni schermata crea la propria funzione `search`; `render` è sincrona.

```js
function latestSearch(load, render) {
  let latest;
  return async function search(query) {
    const ticket = Symbol();
    latest = ticket;
    let rows;
    try {
      rows = await load(query);
    } catch (error) {
      if (latest !== ticket) return "obsolete";
      throw error;
    }
    if (latest !== ticket) return "obsolete";
    render(rows);
    return "shown";
  };
}
```

| Passo | Evento | Effetto visibile |
| --- | --- | --- |
| 1 | L'utente cerca A, poi B | B diventa la richiesta corrente |
| 2 | B termina per prima | Si mostrano i risultati di B |
| 3 | A termina o fallisce | A è obsoleta: non sovrascrive B e non mostra un errore tardivo |

Due ricerche con lo **stesso testo** sono ancora due richieste: per questo il confronto usa un ticket e non la stringa. Un errore della ricerca corrente arriva al chiamante. Il controllo impedisce un aggiornamento obsoleto dell'interfaccia; non interrompe il lavoro già avviato.

## Quando serve una protezione diversa

Per un risultato di ricerca è lecito scartare il vecchio esito. Per la prenotazione dell'ultimo pezzo non basta ignorare una risposta: controllo della disponibilità e decremento vanno eseguiti nell'archivio che possiede lo stock. Vedi [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]. Un nome come `decrementIfAvailable` non dimostra che l'implementazione mantenga quella promessa.

## Verifica

Sblocca B, osserva cosa viene mostrato, poi sblocca A; ripeti con A che fallisce. È un test dell'ordine problematico, non una gara tra due timeout scelti a caso. Provare entrambi gli ordini è più informativo che eseguire molte volte solo quello abituale.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Stato condiviso|Stato condiviso]]
- [[Programmazione/Clean Code/Pagine/Lock e sezioni critiche|Lock e sezioni critiche]]
- [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]
- [[Programmazione/Clean Code/Pagine/Idempotenza|Idempotenza]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione|Test di integrazione]]

## Fonti

- Brian Goetz, *Java Concurrency in Practice*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- [ECMAScript: sospensione e ripresa di una funzione con Await](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#await)
