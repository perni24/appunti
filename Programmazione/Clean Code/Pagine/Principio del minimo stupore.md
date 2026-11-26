---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - leggibilita
  - design-api
aliases:
  - Principio del minimo stupore
  - Principle of least astonishment
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Principio del minimo stupore
---

# Principio del minimo stupore

## Sintesi

Un'API rispetta il principio del minimo stupore quando ciò che il chiamante può ragionevolmente prevedere coincide con ciò che avviene: restituzione, modifiche ai dati, errori e costo dell'operazione. Il riferimento sono le convenzioni del progetto, non l'intuizione di una singola persona.

## Esempio: leggere o registrare un accesso?

Se `getUser(id)` di norma è una lettura, chi la chiama due volte non si aspetta di creare due eventi di audit. Supponiamo invece che il requisito sia **registrare ogni tentativo**, anche per un ID inesistente, e non procedere alla lettura se la registrazione fallisce.

```js
async function lookupUserWithAudit(id, { recordAttempt, findUser }) {
  await recordAttempt(id);
  return findUser(id);
}
```

Il nome avverte che c'è un effetto, la sequenza nel corpo ne chiarisce l'ordine. Nel contratto di esempio `findUser` restituisce `null` se l'utente non esiste. Un errore dell'audit viene propagato senza chiamare `findUser`; un errore della lettura viene propagato **dopo** aver registrato il tentativo.

## Dettagli importanti

- «Registrare un tentativo» e «registrare un accesso riuscito» sono requisiti diversi. Invertire le due chiamate non è un refactoring neutro.
- Il nome non promette atomicità né deduplicazione: ripetere l'intera operazione può produrre un altro evento. Distinguere bene i due casi è più utile che elencare tutti i dettagli nel nome.

## Limiti ed errori comuni

Un getter che usa una cache interna non deve necessariamente chiamarsi `getAndUpdateCache`. Rendi visibile ciò che cambia il modo *corretto* di usare l'API: una scrittura osservabile, una chiamata di rete costosa, una mutazione dell'argomento o una nuova condizione di errore. Per un'API pubblica già in uso, cambiare nome o semantica richiede anche una strategia di compatibilità.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Nomi che rivelano intenzione|Nomi che rivelano intenzione]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Martin Fowler, [Command Query Separation](https://martinfowler.com/bliki/CommandQuerySeparation.html)
