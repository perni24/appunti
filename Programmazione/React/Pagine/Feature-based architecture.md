---
date: 2026-05-20
area: Programmazione
topic: React
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - architettura
aliases: []
prerequisites: []
related: []
---

# Feature-based architecture

## Sintesi

La **feature-based architecture** organizza il codice per funzionalita di prodotto invece che solo per tipo tecnico di file.

## Concetto chiave

Invece di avere cartelle enormi come `components`, `hooks` e `services`, ogni feature contiene UI, hook, API e logica vicina al suo dominio.

```text
src/
  features/
    auth/
      components/
      api/
      hooks/
    billing/
      components/
      api/
      hooks/
```

## Vantaggi

- Maggiore coesione.
- Meno import incrociati.
- Ownership piu chiara.
- Refactor piu localizzati.

## Errori comuni

- Duplicare componenti condivisi in ogni feature.
- Non distinguere feature da shared/common.
- Creare dipendenze cicliche tra feature.

## Problema che risolve

Da completare: descrivere il problema concettuale o tecnico che questa nota chiarisce.

## Dettagli importanti

- Da completare: aggiungere dettagli, casi limite e differenze da concetti simili.

## Esempio

```text
Da completare con un esempio minimo.
```

## Limiti

- Da completare: indicare limiti, ambiguita e casi in cui il concetto non basta.

## Collegamenti
- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Design system|Design system]]


