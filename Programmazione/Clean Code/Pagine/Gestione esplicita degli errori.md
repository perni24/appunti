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
  - standard-library
aliases:
  - Gestione esplicita degli errori
  - Explicit error handling
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili]]"
  - "[[Programmazione/Clean Code/Pagine/Contratti impliciti ed espliciti]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Eccezioni vs valori di errore]]"
  - "[[Programmazione/Clean Code/Pagine/Messaggi di errore utili]]"
  - "[[Programmazione/Clean Code/Pagine/Logging leggibile]]"
title: Gestione esplicita degli errori
---

# Gestione esplicita degli errori

## Sintesi

**Un errore esplicito dice al chiamante quale decisione prendere.** In un modulo di rimborso, «campo mancante», «importo non valido» e «zero centesimi» hanno effetti diversi: solo l'ultimo è un importo. Restituire zero in tutti e tre i casi farebbe proseguire l'operazione con un dato inventato.

## Quando usarlo

Definisci il contratto al confine tra un input esterno e il dominio. Un codice stabile permette all'interfaccia di scegliere il messaggio; il testo mostrato all'utente può cambiare o essere tradotto senza modificare il contratto. Non trasformare un guasto al database in un errore di compilazione del modulo.

## Esempio pratico

Il campo arriva da un modulo web: accetta **centesimi interi non negativi**, già espressi come testo decimale. Gli spazi esterni sono ammessi, gli zeri iniziali non cambiano il valore. Un campo assente o bianco richiede di inserire un valore; per un testo non numerico serve invece correggere il formato.

```js
function parseCents(raw) {
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { ok: false, error: "amount_required" };
  }
  if (typeof raw !== "string" || !/^[0-9]+$/.test(raw.trim())) {
    return { ok: false, error: "invalid_amount" };
  }
  const cents = Number(raw.trim());
  if (!Number.isSafeInteger(cents)) return { ok: false, error: "amount_out_of_range" };
  return { ok: true, value: cents };
}
```

`parseCents("0")` ha successo; `parseCents(" ")` no. Il controllo precede la conversione: `Number("")` e `Number(null)` darebbero entrambi zero. Il limite dell'intero sicuro riguarda la rappresentazione in JavaScript; un eventuale massimale di rimborso è una regola di dominio separata.

## Decisione del chiamante

Controlla `result.ok` prima di usare `result.value`: `if (!result.value)` scarterebbe anche lo zero valido. Per un modulo con più campi può convenire raccogliere **tutti** gli errori di validazione; un errore di lettura del modulo, invece, può impedire di validarli. Non catturare ogni eccezione per trasformarla in `invalid_amount`: quel codice promette qualcosa di preciso sull'input.

## Checklist

- I casi distinti richiedono davvero risposte diverse da parte del chiamante?
- Il valore limite valido e l'input mancante restano distinguibili?
- Un guasto inatteso conserva la sua causa e viene registrato nel punto che lo gestisce?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Errori recuperabili e non recuperabili|Errori recuperabili e non recuperabili]]
- [[Programmazione/Clean Code/Pagine/Eccezioni vs valori di errore|Eccezioni vs valori di errore]]
- [[Programmazione/Clean Code/Pagine/Messaggi di errore utili|Messaggi di errore utili]]
- [[Programmazione/Clean Code/Pagine/Logging leggibile|Logging leggibile]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Nygard, *Release It!*
- Scott Wlaschin, *Domain Modeling Made Functional*
- [ECMAScript: Number.isSafeInteger](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.issafeinteger)
