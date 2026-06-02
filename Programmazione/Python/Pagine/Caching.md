---
date: 2026-06-02
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - performance
aliases: []
prerequisites: []
related: []
---

# Caching

## Sintesi

Il **caching** salva risultati gia calcolati per evitare lavoro ripetuto, ridurre latenza e diminuire carico su servizi esterni.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Cache in memoria
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```
### Tipi comuni
- Cache in memoria locale.
- Cache LRU.
- Cache distribuita.
- Cache HTTP.
- Memoization di funzioni pure.
### Rischi
- Dati stale.
- Invalidazione difficile.
- Crescita memoria.
- Cache key progettate male.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
