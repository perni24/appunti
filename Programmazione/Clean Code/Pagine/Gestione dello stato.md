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
  - stato
  - architettura
aliases:
  - Gestione dello stato
  - State management
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Gestione delle risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti interne]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Gestione dello stato
---

# Gestione dello stato

## Sintesi

Prima di scegliere *dove* tenere uno stato, chiediti **per quanto tempo e per chi quel valore è vero**. L'utente corrente appartiene alla richiesta, non al processo che la esegue. Due richieste possono alternarsi a ogni `await`: un'unica variabile globale non può rappresentarle entrambe.

## Quale stato stai leggendo?

| Valore | Chi lo possiede | Durata utile |
| --- | --- | --- |
| Utente autenticato | Contesto della richiesta | Fino al termine della richiesta |
| Proprietario di un documento | Archivio dei documenti | Fino a una modifica confermata |
| Esito di un controllo | Funzione che prende la decisione | Per quella coppia di utente e documento |

L'esito si può calcolare dai primi due valori: conservarlo come terzo stato mutabile obbligherebbe a invalidarlo quando cambia l'uno o l'altro.

## Esempio

Il gestore riceve `user` dal livello di autenticazione. `load(id)` restituisce un documento valido oppure `null`; un guasto dell'archivio rifiuta la promessa.

```js
function canEditDocument(user, document) {
  if (user === null || document === null) return false;
  return user.role === "admin" || user.id === document.ownerId;
}

async function checkEdit(user, id, load) {
  const document = await load(id);
  return canEditDocument(user, document);
}
```

Anna avvia la lettura del suo documento; Bruno avvia un'altra richiesta prima che termini la prima. Se il controllo rilegge `currentUser` da una variabile globale, può trovare Bruno al posto di Anna. Qui ogni chiamata conserva il proprio parametro. Il confronto presuppone identità già validate, non un oggetto utente costruito dal client.

## Limiti e verifica

Passare un oggetto non ne fa una copia: il contesto della richiesta non deve essere mutato da altri durante l'attesa. Un risultato `true` descrive il documento **letto**; se proprietario o permessi possono cambiare prima del salvataggio, la scrittura deve verificare la condizione sulla versione corrente. Per provare l'isolamento, fai partire due letture e completa per prima la seconda, senza timer.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Invarianti interne|Invarianti interne]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Martin Fowler, *Refactoring*
- Michael Feathers, *Working Effectively with Legacy Code*
- Eric Evans, *Domain-Driven Design*
- [ECMAScript: sospensione e ripresa con Await](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#await)
