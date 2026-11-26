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
  - qualita-codice
  - manutenibilita
aliases:
  - Clean Code
  - Codice pulito
prerequisites: []
related:
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Manutenibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
title: Clean Code
---

# Clean Code

## Sintesi

Un tratto di codice è «pulito» se chi deve cambiarlo riesce a capire quale comportamento deve conservare e dove intervenire. Formattazione uniforme e nomi curati aiutano, ma non rendono corretta una regola sbagliata.

## Problema che risolve

Un utente attivo può prenotare una lezione solo se ha almeno un credito. Durante una review, la domanda utile non è «potremmo accorciare questo `if`?», ma «si capisce quando la prenotazione verrà rifiutata?».

## Concetto chiave

Distingui una modifica di *forma* da una modifica di *comportamento*. Rinominare un parametro locale o dare un nome a una condizione può essere un refactoring; cambiare `> 0` in `>= 0` introduce una nuova regola. Se fai entrambe le cose nello stesso passaggio, è più difficile capire perché un test non passa.

## Esempio

Prima, con crediti interi e un campo booleano `isActive`:

```js
function canBook(u) {
  return u.isActive && u.remainingCredits > 0;
}
```

Dopo, con la stessa firma per chi chiama e gli stessi campi sull'oggetto:

```js
function canBook(member) {
  const hasCredit = member.remainingCredits > 0;
  return member.isActive && hasCredit;
}
```

Per oggetti di dati già validati, un iscritto attivo con un credito ottiene `true`; con zero crediti ottiene `false`, così come un iscritto inattivo con un credito. La verifica riguarda ciò che restituisce `canBook`, non il nome della variabile locale.

## Dettagli importanti

- Il secondo esempio legge sempre `remainingCredits`; il primo lo legge solo se `isActive` è vero. Con un getter che lancia un errore o registra gli accessi, le versioni **non** sono equivalenti. Prima di estrarre un'espressione controlla anche *quando* viene valutata.
- Formato dei dati, nomi pubblici, errori ed effetti fanno parte del contratto quando un chiamante vi fa affidamento. Non rinominare una chiave di un payload esterno come se fosse una variabile locale.

## Limiti ed errori comuni

Una condizione breve con nomi già chiari può restare in linea. Aggiungere classi o funzioni per gusto personale non riduce il costo della prossima modifica. Se proponi un'astrazione, indica la regola che rende più facile leggere, cambiare o verificare.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Martin Fowler, [Definition of Refactoring](https://martinfowler.com/bliki/DefinitionOfRefactoring.html)
