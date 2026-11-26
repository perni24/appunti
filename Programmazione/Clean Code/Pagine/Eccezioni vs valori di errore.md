---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - errori
  - eccezioni
aliases:
  - Eccezioni vs valori di errore
  - Exceptions vs error values
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Eccezioni vs valori di errore
---

# Eccezioni vs valori di errore

## Sintesi

Un **valore di errore** torna al chiamante come un risultato ordinario. Un'**eccezione** trasferisce il controllo al gestore; con una funzione `async` arriva come rifiuto della promessa. La scelta dipende da chi può prendere una decisione, non dalla gravità del messaggio.

## Quando scegliere

| Situazione | Contratto utile | Cosa può fare il chiamante |
| --- | --- | --- |
| Ricerca completata, utente assente | Risultato `not_found` (o `null` se l'assenza è l'unica alternativa) | Mostrare «utente non trovato» |
| Impossibile interrogare l'archivio | Eccezione con la causa | Segnalare indisponibilità; non dichiarare l'utente assente |
| Input con più campi errati | Raccolta di errori per campo | Mostrare tutte le correzioni in una volta |

## Esempio pratico

L'archivio ha un contratto preciso: `findById` restituisce un utente o **esattamente** `null` se la ricerca non trova nulla; rifiuta la promessa se la ricerca fallisce.

```js
async function findUser(repo, id) {
  let user;
  try {
    user = await repo.findById(id);
  } catch (cause) {
    throw new Error("Lettura dell'archivio utenti non riuscita", { cause });
  }
  if (user === null) return { ok: false, error: "not_found" };
  return { ok: true, value: user };
}
```

Un gestore HTTP può tradurre `not_found` in 404; un guasto dell'archivio segue il percorso degli errori del servizio. Il `try` copre solo l'operazione che si vuole descrivere. `cause` mantiene l'errore originale per la diagnosi interna: non inviarlo tal quale al client.

## Errori comuni

- Restituire `not_found` dal `catch`: l'archivio indisponibile non ha risposto alla domanda.
- Supporre che la forma `{ ok, ... }` obblighi JavaScript a controllarla: il risultato può essere ignorato. Il chiamante deve distinguere i rami; tipi discriminati possono aiutare in TypeScript.
- Aggiungere un `catch` in ogni strato solo per loggare e rilanciare. Traduci l'errore dove cambia il contratto o dove puoi agire.

## Checklist

Verifica separatamente **presenza**, **assenza** e **lettura fallita**. Nell'ultimo caso prova anche che la causa rimanga accessibile, non soltanto che venga sollevato un errore.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili|Errori recuperabili e non recuperabili]]
- [[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti|Contratti impliciti ed espliciti]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Scott Wlaschin, *Domain Modeling Made Functional*
- Martin Fowler, *Refactoring*
- [ECMAScript: costruzione di Error con cause](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-error-message)
