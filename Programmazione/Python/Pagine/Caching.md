---
date: 2026-05-20
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

## Cache in memoria

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

## Tipi comuni

- Cache in memoria locale.
- Cache LRU.
- Cache distribuita.
- Cache HTTP.
- Memoization di funzioni pure.

## Rischi

- Dati stale.
- Invalidazione difficile.
- Crescita memoria.
- Cache key progettate male.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]


