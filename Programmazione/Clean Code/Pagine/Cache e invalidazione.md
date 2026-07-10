---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [clean-code, cache, performance]
aliases: [Cache e invalidazione, Cache invalidation]
prerequisites: [Gestione dello stato, Performance e leggibilita]
related: [Configurazione applicativa, Invarianti interne, Side effects controllati]
---

# Cache e invalidazione

## Sintesi

Una **cache** conserva risultati o dati per evitare calcoli o accessi costosi. L'**invalidazione** decide quando quei dati non sono piu affidabili.

La cache migliora performance, ma introduce stato duplicato.

## Quando usarlo

- Quando una lettura e costosa e frequente.
- Quando il dato cambia raramente.
- Quando la latenza e un problema misurato.
- Quando il sistema puo tollerare dati leggermente obsoleti.
- Quando il costo di invalidazione e gestibile.

## Come funziona

Una cache deve avere regole esplicite:

- chi la popola;
- chi la legge;
- quando scade;
- quando viene invalidata;
- cosa succede in caso di errore;
- quale coerenza e richiesta.

Senza queste regole, la cache diventa una fonte di bug.

## API / Sintassi

```text
key -> cached value
miss -> load source -> store -> return
invalidate -> remove or refresh
```

La chiave deve rappresentare tutti i fattori che influenzano il risultato.

## Esempio pratico

```js
async function getProduct(productId, cache, repository) {
  const cached = cache.get(productId);
  if (cached) return cached;

  const product = await repository.findById(productId);
  cache.set(productId, product, { ttlSeconds: 300 });
  return product;
}
```

La cache e esplicita e il TTL limita la durata del dato.

## Varianti

- TTL: scadenza temporale.
- Write-through: scrittura su cache e sorgente insieme.
- Write-behind: scrittura differita.
- Cache locale: veloce ma non condivisa.
- Cache distribuita: condivisa ma piu complessa.

## Errori comuni

- Non definire una strategia di invalidazione.
- Usare chiavi incomplete.
- Caching di dati utente senza isolamento.
- Nascondere cache dentro funzioni pure apparenti.
- Aggiungere cache prima di misurare il problema.

## Checklist

- La cache risolve un problema misurato?
- La chiave include tutti i parametri rilevanti?
- Esiste una strategia di invalidazione?
- La staleness e accettabile?
- I test coprono hit, miss e invalidazione?

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Gestione dello stato]]
- [[Programmazione/Clean Code/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Side effects controllati]]
- [[Invarianti interne]]

## Fonti

- Martin Fowler, *Cache-Aside*
- Michael Nygard, *Release It!*
- Martin Kleppmann, *Designing Data-Intensive Applications*
