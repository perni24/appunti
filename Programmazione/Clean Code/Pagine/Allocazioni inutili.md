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
  - performance
  - memoria
aliases:
  - Allocazioni inutili
  - Unnecessary allocations
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Hot path]]"
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Profiling prima del refactoring]]"
  - "[[Programmazione/Clean Code/Pagine/Immutabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
title: Allocazioni inutili
---

# Allocazioni inutili

## Sintesi

Un'allocazione è superflua **rispetto al risultato richiesto**, non perché ogni oggetto nuovo sia un problema. In `users.filter(...).map(...)` si ottengono due array: il primo è **intermedio**, il secondo è **il risultato**. Restituire tutti i nomi richiede comunque spazio per quei nomi; fondere i passaggi non rende il risultato a memoria costante.

## Esempio: rimuovere solo la raccolta intermedia

Contratto: `users` è un array denso di record ordinari, senza getter né modifiche durante la lettura. Le due funzioni restituiscono un array nuovo di nomi nello stesso ordine, mantenendo i duplicati.

```js
function activeNamesPipeline(users) {
  return users.filter(u => u.active).map(u => u.name);
}

function activeNamesSinglePass(users) {
  const names = [];
  for (const user of users) {
    if (user.active) names.push(user.name);
  }
  return names;
}
```

Con `N` utenti e `K` attivi, la pipeline raccoglie prima `K` riferimenti agli utenti e poi `K` nomi. Il ciclo conserva soltanto l'array di output. Questo è un confronto delle strutture costruite dal codice, non un conteggio di byte né una previsione delle pause del garbage collector.

## Quando cambia il comportamento

La pipeline legge **tutti** i campi `active` prima di leggere i nomi; il ciclo legge il nome di ogni utente attivo prima di passare al successivo. Un getter con effetti osservabili può quindi produrre risultati diversi. Anche gli array sparsi esulano dal contratto: `filter` salta gli indici mancanti, mentre il ciclo può ottenere `undefined` e fallire su `user.active`.

Non risolvere il problema riusando un array globale: due chiamanti potrebbero ricevere lo stesso oggetto e vedere il primo risultato cambiare in seguito. Se al chiamante basta consumare un nome alla volta, un iteratore può evitare anche l'array finale, ma cambia l'API e il momento delle letture.

## Misurare la memoria giusta

- **Allocazioni nel tempo:** quali punti creano molti temporanei? Usa un profilo delle allocazioni su un lotto rappresentativo.
- **Memoria trattenuta:** quali oggetti restano raggiungibili dopo il lotto e chi li trattiene? Confronta lo stato dopo l'esecuzione; un temporaneo non è di per sé un leak.
- **Decisione:** verifica output, ordine, indipendenza tra chiamate e picco di memoria alla scala attesa. Una differenza tra due letture istantanee dell'heap non misura tutti i byte allocati nel frattempo.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Hot path|Hot path]]
- [[Programmazione/Clean Code/Pagine/Performance e leggibilita|Performance e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Profiling prima del refactoring|Profiling prima del refactoring]]
- [[Programmazione/Clean Code/Pagine/Immutabilita|Immutabilita]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]

## Fonti

- Brendan Gregg, *Systems Performance*
- Martin Thompson, *Mechanical Sympathy*
- Martin Fowler, *Refactoring*
- [ECMAScript: Array.prototype.filter e iterazione degli array](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.filter)
- [Node.js: profilare le allocazioni nello heap](https://nodejs.org/en/learn/diagnostics/memory/using-heap-profiler)
