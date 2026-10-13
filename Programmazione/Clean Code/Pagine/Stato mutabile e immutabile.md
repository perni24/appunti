---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - stato
  - immutabilita
aliases:
  - Stato mutabile e immutabile
  - Mutabilita e immutabilita
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
title: Stato mutabile e immutabile
---

# Stato mutabile e immutabile

## Sintesi

Lo **stato mutabile** puo cambiare nel tempo. Lo **stato immutabile** viene creato e poi non modificato.

Nel Clean Code, ridurre la mutabilita aiuta a rendere il comportamento piu prevedibile, soprattutto quando i dati attraversano molte funzioni o thread.

## Problema che risolve

La mutabilita non controllata rende difficile capire quando e perche un valore cambia.

Questo causa bug come:

- dati modificati da funzioni inattese;
- ordine di esecuzione fragile;
- test che si influenzano tra loro;
- race condition;
- oggetti in stati intermedi non validi.

## Concetto chiave

Non tutta la mutabilita e sbagliata. Il punto e renderla:

- localizzata;
- intenzionale;
- visibile;
- protetta da invarianti;
- evitata quando non serve.

L'immutabilita e utile per valori, configurazioni, eventi, DTO e risultati di trasformazioni.

## Dettagli importanti

- I value objects sono spesso immutabili.
- Lo stato mutabile dovrebbe avere un owner chiaro.
- Le funzioni pure sono piu facili da testare.
- Copiare dati immutabili puo avere un costo.
- Nei sistemi concorrenti la mutabilita richiede ancora piu disciplina.

## Esempio

Mutazione implicita:

```js
function applyDiscount(order) {
  order.total = order.total * 0.9;
  return order;
}
```

Trasformazione esplicita:

```js
function withDiscount(order) {
  return {
    ...order,
    total: order.total * 0.9,
  };
}
```

La seconda versione rende piu chiaro che nasce un nuovo valore.

## Limiti

- L'immutabilita totale puo essere costosa o scomoda.
- Alcuni domini sono naturalmente stateful.
- Database, UI e cache richiedono gestione dello stato.
- Copiare strutture grandi puo impattare performance.

## Errori comuni

- Modificare oggetti ricevuti come parametri senza dichiararlo.
- Condividere stato mutabile tra moduli lontani.
- Rendere mutabili value objects.
- Confondere immutabilita con assenza di cambiamento nel sistema.
- Usare copie superficiali pensando che proteggano tutto.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Principio del minimo stupore|Principio del minimo stupore]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Refactoring*
