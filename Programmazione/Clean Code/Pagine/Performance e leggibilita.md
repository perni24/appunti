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
  - performance
  - leggibilita
aliases:
  - Performance e leggibilita
  - Performance vs readability
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Profiling prima del refactoring]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Ottimizzazione prematura]]"
  - "[[Programmazione/Clean Code/Pagine/Hot path]]"
  - "[[Programmazione/Clean Code/Pagine/Allocazioni inutili]]"
title: Performance e leggibilita
---

# Performance e leggibilita

## Sintesi

La prima domanda non è «un ciclo è più veloce di due?», ma **«quale comportamento devo conservare, e quale costo voglio ridurre?»**. Un indice può rendere il codice più leggibile e ridurre le ricerche, ma ha un costo di costruzione e occupa memoria. Se lo usi una sola volta su tre elementi, la scansione più semplice può bastare.

## Esempio: filtrare un elenco senza cambiare il risultato

Un export deve includere solo gli utenti dei gruppi abilitati. Gli ID sono stringhe, i record sono ordinari e i due array sono densi. Il contratto richiede di conservare **ordine e ripetizioni degli utenti**, non l'ordine dei gruppi.

```js
function allowedUsersScan(users, allowedGroups) {
  return users.filter(user => allowedGroups.includes(user.groupId));
}

function allowedUsersIndexed(users, allowedGroups) {
  const allowed = new Set(allowedGroups);
  return users.filter(user => allowed.has(user.groupId));
}
```

Entrambe le versioni restituiscono un nuovo array con gli stessi riferimenti agli utenti ammessi. Un gruppo duplicato nella lista dei permessi non duplica l'utente. Per `N` utenti e `M` gruppi, nel caso di nessuna corrispondenza la prima versione esamina `N × M` voci di gruppo; la seconda costruisce l'indice una volta e fa `N` interrogazioni. Lo standard richiede accessi medi sublineari per `Set`, non promette una durata fissa per ogni chiamata.

## Come scegliere

- Includi la **costruzione del Set** nella misura se avviene a ogni export. Escluderla significa confrontare la scansione con un indice già pronto, cioè uno scenario diverso.
- Se molti export condividono gli stessi permessi, l'indice è riutilizzabile solo fino al loro aggiornamento. Indica chi lo ricostruisce.
- Prova insieme casi frequenti, rari e assenti, con le dimensioni attese. Confronta sia la durata dell'intero export sia il consumo di memoria, prima di accettare una variante più complessa.

## Limiti

Il test di equivalenza protegge il risultato; il conteggio delle ricerche spiega **perché** i costi possono divergere. Nessuno dei due misura da solo la latenza in produzione. Per il diverso caso di due passaggi `filter` e `map` con una raccolta intermedia, vedi [[Programmazione/Clean Code/Pagine/Allocazioni inutili|Allocazioni inutili]].

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Ottimizzazione prematura|Ottimizzazione prematura]]
- [[Programmazione/Clean Code/Pagine/Profiling prima del refactoring|Profiling prima del refactoring]]
- [[Programmazione/Clean Code/Pagine/Hot path|Hot path]]
- [[Programmazione/Clean Code/Pagine/Allocazioni inutili|Allocazioni inutili]]

## Fonti

- Donald Knuth, *Structured Programming with go to Statements*
- Martin Fowler, *Refactoring*
- Brendan Gregg, *Systems Performance*
- [ECMAScript: requisiti di accesso di Set](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-set-objects)
- [ECMAScript: Array.prototype.includes](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.includes)
