---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [clean-code, stato, architettura]
aliases: [Gestione dello stato, State management]
prerequisites: [Stato mutabile e immutabile, Side effects controllati]
related: [Gestione delle risorse, Invarianti interne, Codice testabile]
---

# Gestione dello stato

## Sintesi

La **gestione dello stato** riguarda dove vivono i dati mutabili, chi puo modificarli e quali regole ne proteggono la coerenza.

Nel Clean Code lo stato non e un problema da eliminare, ma una responsabilita da rendere visibile e controllata.

## Problema che risolve

Stato sparso e non governato rende il sistema difficile da capire:

- valori modificati da punti lontani;
- ordine di chiamata fragile;
- test che si influenzano tra loro;
- cache incoerenti;
- oggetti in stati intermedi;
- side effects difficili da tracciare.

## Concetto chiave

Ogni stato mutabile dovrebbe avere un proprietario chiaro.

Il codice pulito distingue tra dati immutabili, stato locale temporaneo, stato di dominio, stato applicativo, cache e stato infrastrutturale.

## Dettagli importanti

- Lo stato locale e piu facile da controllare dello stato globale.
- Lo stato condiviso richiede contratti piu forti.
- La mutazione dovrebbe avvenire tramite operazioni nominate.
- Gli invarianti devono restare validi dopo ogni transizione.
- Nei test, lo stato deve essere isolato e ripristinabile.

## Esempio

Stato globale fragile:

```js
let currentUser = null;

function canEditDocument(document) {
  return currentUser.role === "admin" || document.ownerId === currentUser.id;
}
```

Stato esplicito:

```js
function canEditDocument(user, document) {
  return user.role === "admin" || document.ownerId === user.id;
}
```

La seconda versione rende la dipendenza visibile e testabile.

## Limiti

- Alcuni sistemi sono naturalmente stateful.
- UI, sessioni, transazioni e workflow richiedono stato persistente.
- Rendere ogni stato immutabile puo essere costoso.
- Troppa astrazione nella gestione dello stato puo nascondere il flusso reale.

## Errori comuni

- Usare variabili globali come scorciatoia.
- Modificare oggetti ricevuti senza dichiararlo.
- Lasciare stati intermedi osservabili.
- Duplicare lo stesso stato in piu punti.
- Non definire chi possiede la mutazione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Stato mutabile e immutabile]]
- [[Side effects controllati]]
- [[Invarianti interne]]
- [[Codice testabile]]

## Fonti

- Martin Fowler, *Refactoring*
- Michael Feathers, *Working Effectively with Legacy Code*
- Eric Evans, *Domain-Driven Design*
