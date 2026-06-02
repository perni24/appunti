---
date: 2026-06-02
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

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
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
### Vantaggi
- Maggiore coesione.
- Meno import incrociati.
- Ownership piu chiara.
- Refactor piu localizzati.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Duplicare componenti condivisi in ogni feature.
- Non distinguere feature da shared/common.
- Creare dipendenze cicliche tra feature.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/API layer|API layer]]
- [[Programmazione/React/Pagine/State colocato|State colocato]]
- [[Programmazione/React/Pagine/Design system|Design system]]
