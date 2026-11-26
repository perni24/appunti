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
  - cleanup
  - risorse
aliases:
  - Cleanup e rilascio risorse
  - Resource cleanup
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Gestione delle risorse]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti]]"
  - "[[Programmazione/Clean Code/Pagine/File system e IO]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
title: Cleanup e rilascio risorse
---

# Cleanup e rilascio risorse

## Sintesi

Il cleanup deve **tentare** il rilascio di ciò che è stato acquisito. Un `finally` garantisce il passaggio dal codice di rilascio nel normale flusso delle eccezioni, non il successo del rilascio. Se falliscono sia il lavoro sia il cleanup, un secondo `throw` può nascondere il primo.

## Esempio: usare un lock preso in prestito

`acquire(key)` restituisce un handle con `release()` asincrono. Il callback riceve il lock in prestito: non deve rilasciarlo o avviare attività che continuino a usarlo dopo la conclusione della promessa restituita.

```js
async function withLock(key, acquire, work) {
  const lock = await acquire(key);
  let result;
  try {
    result = await work(lock);
  } catch (primary) {
    try {
      await lock.release();
    } catch (cleanup) {
      throw new AggregateError([primary, cleanup], "Lavoro e rilascio falliti");
    }
    throw primary;
  }
  await lock.release();
  return result;
}
```

## Quale esito arriva al chiamante?

| Acquisizione | Lavoro | Rilascio | Esito |
| --- | --- | --- | --- |
| Fallita | Non eseguito | Non tentato | Errore di acquisizione |
| Riuscita | Riuscito | Riuscito | Valore del lavoro |
| Riuscita | Fallito | Riuscito | Stesso errore del lavoro |
| Riuscita | Riuscito | Fallito | Errore di rilascio; il lavoro potrebbe avere già prodotto effetti |
| Riuscita | Fallito | Fallito | `AggregateError.errors` contiene le due cause, in ordine |

## Limiti e checklist

`await work(lock)` è essenziale: restituire direttamente la promessa da un `try/finally` può far partire il rilascio **prima** che il lavoro termini. Il doppio percorso dell'esempio serve a conservare entrambe le cause; se il rilascio non può fallire, un solo `finally` è più semplice.

Rilasciare un lock non annulla i dati scritti. Analogamente, cancellare un file temporaneo dopo una scrittura fallita è un tentativo distinto che può a sua volta fallire. Un arresto del processo può impedire qualsiasi cleanup locale: lease con scadenza, recupero di temporanei e compensazioni sono politiche separate. Nei test conta i tentativi di rilascio e verifica che non avvengano prima della fine del lavoro.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Gestione delle risorse|Gestione delle risorse]]
- [[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti|Lifecycle degli oggetti]]
- [[Programmazione/Clean Code/Pagine/File system e IO|File system e IO]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Feathers, *Working Effectively with Legacy Code*
- Michael Nygard, *Release It!*
- [ECMAScript: valutazione di try, catch e finally](https://tc39.es/ecma262/multipage/ecmascript-language-statements-and-declarations.html#sec-try-statement)
- [ECMAScript: AggregateError](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-aggregate-error-objects)
