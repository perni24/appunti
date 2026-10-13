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
  - risorse
  - lifecycle
aliases:
  - Gestione delle risorse
  - Resource management
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/File system e IO]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
title: Gestione delle risorse
---

# Gestione delle risorse

## Sintesi

La **gestione delle risorse** riguarda acquisizione, uso e rilascio di elementi limitati o esterni: file, socket, connessioni database, lock, memoria, thread, handle e stream.

Una risorsa deve avere un ciclo di vita chiaro.

## Quando usarlo

- Quando apri file, stream o connessioni.
- Quando acquisisci lock o transazioni.
- Quando lavori con pool di connessioni.
- Quando una libreria richiede chiamate di cleanup.
- Quando un errore puo interrompere il flusso prima del rilascio.

## Come funziona

La sequenza sicura e:

```text
acquisisci -> usa -> rilascia sempre
```

Il rilascio deve avvenire anche in caso di errore. Nei linguaggi moderni esistono costrutti come `try/finally`, context manager, RAII, `defer` o `using`.

## API / Sintassi

```js
const resource = acquireResource();

try {
  useResource(resource);
} finally {
  resource.close();
}
```

Il blocco `finally` protegge il rilascio.

## Esempio pratico

```js
async function withTransaction(database, work) {
  const transaction = await database.beginTransaction();

  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

La gestione della risorsa transazione e centralizzata.

## Varianti

- RAII: la risorsa viene rilasciata quando l'oggetto esce dallo scope.
- Context manager: il blocco gestisce entrata e uscita.
- Pool: le risorse vengono riusate e restituite.
- `defer` / `finally`: rilascio esplicito a fine scope.

## Errori comuni

- Aprire risorse senza chiuderle.
- Rilasciare solo nel percorso di successo.
- Nascondere risorse in oggetti senza metodo di cleanup.
- Condividere risorse non thread-safe.
- Ignorare timeout e cancellazione.

## Checklist

- Chi acquisisce la risorsa?
- Chi la rilascia?
- Il rilascio avviene anche in caso di errore?
- La risorsa puo essere condivisa in sicurezza?
- Esiste un test o una convenzione per evitare leak?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/File system e IO|File system e IO]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse|Cleanup e rilascio risorse]]
- [[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti|Lifecycle degli oggetti]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Nygard, *Release It!*
- Bjarne Stroustrup, *The C++ Programming Language*
