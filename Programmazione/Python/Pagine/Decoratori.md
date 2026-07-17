---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, decorators]
aliases: [Decoratori, Decorator Python]
prerequisites: []
related: []
---

# Decoratori in Python

## Sintesi

Un decoratore e una funzione che riceve una funzione e ne restituisce una versione modificata o arricchita. Si applica con `@` sopra la definizione della funzione.

I decoratori sono una forma pratica di higher-order function e sono molto usati per logging, caching, autorizzazione, validazione, retry e framework web.

## Quando usarlo

Usa un decoratore quando vuoi aggiungere comportamento trasversale senza modificare il corpo della funzione:

- logging;
- misurazione tempi;
- caching;
- controlli di autorizzazione;
- retry;
- validazione;
- registrazione automatica di handler o route.

## Come funziona

La sintassi:

```python
@decorator
def function():
    ...
```

equivale a:

```python
def function():
    ...


function = decorator(function)
```

Decoratore base:

```python
from functools import wraps


def log_call(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(f"Calling {function.__name__}")
        return function(*args, **kwargs)

    return wrapper
```

## API / Sintassi

Uso:

```python
@log_call
def add(a, b):
    return a + b


print(add(2, 3))
```

Decoratore con argomenti:

```python
from functools import wraps


def repeat(times):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = function(*args, **kwargs)
            return result

        return wrapper

    return decorator


@repeat(times=3)
def say_hello():
    print("hello")
```

## Esempio pratico

Misurare la durata di una funzione:

```python
from functools import wraps
from time import perf_counter


def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start = perf_counter()
        try:
            return function(*args, **kwargs)
        finally:
            elapsed = perf_counter() - start
            print(f"{function.__name__}: {elapsed:.3f}s")

    return wrapper


@timed
def build_report():
    return [number * 2 for number in range(100_000)]
```

## Varianti

- **Decoratore semplice**: funzione che riceve e restituisce una funzione.
- **Decoratore con argomenti**: factory che restituisce un decoratore.
- **Decoratori multipli**: piu `@` applicati alla stessa funzione.
- **Decoratori di classe**: modificano o registrano classi.
- **Decoratori standard**: `@property`, `@classmethod`, `@staticmethod`, `@lru_cache`.

Ordine di applicazione:

```python
@outer
@inner
def function():
    ...
```

equivale a:

```python
function = outer(inner(function))
```

## Errori comuni

- Dimenticare `functools.wraps`, perdendo nome, docstring e metadata.
- Non restituire il risultato della funzione originale.
- Non supportare `*args` e `**kwargs`.
- Eseguire logica pesante nel corpo del decoratore al momento dell'import.
- Impilare troppi decoratori rendendo il flusso poco leggibile.
- Nascondere side effect importanti.

## Checklist

- Il decoratore aggiunge comportamento trasversale reale?
- Usa `functools.wraps`?
- Preserva argomenti, ritorno ed eccezioni?
- Il comportamento resta testabile?
- L'ordine dei decoratori e chiaro?
- Una funzione esplicita sarebbe piu leggibile?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Higher-order Functions]]
- [[Argomenti Flessibili]]
- [[Caching]]
- [[Introspezione]]
