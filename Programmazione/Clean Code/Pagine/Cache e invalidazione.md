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
  - cache
  - performance
aliases:
  - Cache e invalidazione
  - Cache invalidation
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Gestione dello stato]]"
  - "[[Programmazione/Clean Code/Pagine/Performance e leggibilita]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti interne]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
title: Cache e invalidazione
---

# Cache e invalidazione

## Sintesi

In una cache *cache-aside* la sorgente resta autorevole: al primo accesso si legge da lì, poi si riusa il risultato per un tempo limitato. **Un prezzo di zero è un dato presente.** Verificare `if (price)` mescola due domande diverse: «esiste la voce?» e «quanto vale?».

## Esempio: listino locale con letture asincrone

`loadPrice(id)` restituisce il prezzo in centesimi o fallisce. L'esempio assume un solo listino e una sola valuta. La scadenza parte dalla lettura riuscita; l'orologio in millisecondi è sostituibile nei test. Ogni voce conserva una promessa: due lettori simultanei della stessa chiave possono aspettare lo stesso lavoro.

```js
function priceCache(loadPrice, nowMs, ttlMs) {
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new RangeError("TTL non valido");
  const entries = new Map();
  return {
    get(id) {
      const hit = entries.get(id);
      if (hit && (hit.expiresAt === null || nowMs() < hit.expiresAt)) return hit.pending;
      const entry = { expiresAt: null };
      entry.pending = Promise.resolve().then(() => loadPrice(id)).then(price => {
        entry.expiresAt = nowMs() + ttlMs;
        return price;
      }).catch(error => {
        if (entries.get(id) === entry) entries.delete(id);
        throw error;
      });
      entries.set(id, entry);
      return entry.pending;
    },
    invalidate(id) { entries.delete(id); },
  };
}
```

## Cosa accade durante una modifica

Dopo una scrittura **confermata** in archivio, il proprietario invalida la chiave. Se una vecchia lettura A è ancora in corso, chi la attende può ricevere il prezzo precedente. Il lettore successivo avvia B; A modifica solo la propria voce, non può rimetterla nella mappa. Anche se A fallisce dopo B, il confronto d'identità impedisce che cancelli B. Al limite esatto del TTL la voce è già scaduta.

## Limiti e alternative

- La scadenza viene controllata **in lettura**: non rimuove automaticamente le chiavi mai più consultate. Per un catalogo non limitato servono anche un limite di capacità e una politica di espulsione.
- Il TTL non è un timeout per `loadPrice`. Se la lettura rimane sospesa occorre un timeout nella dipendenza. Per intervalli di processo usa un orologio monotono.
- Una chiave composta solo dall'ID va bene **solo** se il prezzo non dipende da cliente, listino o valuta. Un `Map` locale non invalida le cache degli altri processi. Una scrittura fallita, un'invalidazione persa o una lettura già avviata non implicano consistenza immediata.
- Prima di introdurre cache distribuite o aggiornamenti differiti, misura il costo delle letture e stabilisci per quanto tempo un valore vecchio sia accettabile.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Gestione dello stato|Gestione dello stato]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Invarianti interne|Invarianti interne]]

## Fonti

- Michael Nygard, *Release It!*
- Martin Kleppmann, *Designing Data-Intensive Applications*
- [Microsoft Azure Architecture Center: Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
