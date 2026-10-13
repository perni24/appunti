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

Il **cleanup** e il rilascio delle risorse garantiscono che file, connessioni, lock, processi, timer e memoria esterna non restino aperti oltre il necessario.

E una parte essenziale della robustezza, non un dettaglio finale.

## Quando usarlo

- Quando apri una connessione.
- Quando acquisisci un lock.
- Quando crei file temporanei.
- Quando avvii timer, worker o listener.
- Quando un errore puo interrompere l'operazione.

## Come funziona

Il cleanup dovrebbe essere legato allo scope o al lifecycle dell'operazione.

Se acquisizione e rilascio sono distanti, aumenta il rischio di dimenticare il rilascio in un ramo di errore.

## API / Sintassi

```js
const lock = await acquireLock(key);

try {
  await runCriticalSection();
} finally {
  await lock.release();
}
```

Il `finally` assicura rilascio anche in caso di eccezione.

## Esempio pratico

```js
async function writeTempReport(tempFile, report) {
  try {
    await tempFile.write(report);
    return tempFile.path;
  } catch (error) {
    await tempFile.remove();
    throw error;
  }
}
```

Se la scrittura fallisce, il file temporaneo non resta sporco.

## Varianti

- Cleanup sincrono: semplice e immediato.
- Cleanup asincrono: necessario per rete, file e processi.
- Scope guard: oggetto che rilascia a fine scope.
- Cleanup compensativo: annulla effetti gia prodotti.
- Cleanup best-effort: registra errore ma non blocca tutto.

## Errori comuni

- Rilasciare risorse solo nel percorso di successo.
- Ignorare errori durante cleanup.
- Fare cleanup in punti troppo lontani dall'acquisizione.
- Lasciare listener o timer attivi nei test.
- Non gestire cancellazione o timeout.

## Checklist

- Ogni risorsa acquisita ha un rilascio?
- Il rilascio avviene anche se fallisce un passaggio?
- Il cleanup e idempotente?
- Gli errori di cleanup vengono registrati?
- I test lasciano l'ambiente pulito?

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
