---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, functions]
aliases: [Argomenti Flessibili, args e kwargs, *args e **kwargs]
prerequisites: []
related: []
---

# Argomenti Flessibili in Python

## Sintesi

`*args` e `**kwargs` permettono a una funzione di accettare un numero variabile di argomenti. `*args` raccoglie argomenti posizionali extra in una tupla; `**kwargs` raccoglie keyword arguments extra in un dizionario.

Sono utili per wrapper, decoratori, API flessibili e funzioni che inoltrano parametri ad altre funzioni.

## Quando usarlo

Usali quando:

- non conosci in anticipo il numero di argomenti;
- stai scrivendo un decoratore;
- devi inoltrare parametri a un'altra funzione;
- vuoi supportare opzioni aggiuntive senza cambiare subito la firma;
- stai costruendo una API compatibile con piu chiamanti.

Evitali quando la firma puo essere esplicita: parametri chiari rendono il codice piu leggibile.

## Come funziona

`*args` raccoglie argomenti posizionali:

```python
def sum_all(*numbers):
    return sum(numbers)


print(sum_all(10, 20, 30))
```

`**kwargs` raccoglie argomenti nominati:

```python
def create_profile(name, **extra):
    profile = {"name": name}
    profile.update(extra)
    return profile


user = create_profile("Luca", role="admin", active=True)
```

## API / Sintassi

Ordine tipico dei parametri:

```python
def function(positional, *args, keyword_only=None, **kwargs):
    ...
```

Unpacking in chiamata:

```python
numbers = [2, 3, 4]


def multiply(a, b, c):
    return a * b * c


print(multiply(*numbers))
```

Unpacking di dizionario:

```python
options = {"host": "localhost", "port": 8000}


def connect(host, port):
    return f"{host}:{port}"


print(connect(**options))
```

Keyword-only arguments:

```python
def create_user(name, *, active=True):
    return {"name": name, "active": active}
```

`active` deve essere passato per nome.

## Esempio pratico

Decoratore che funziona con qualunque firma:

```python
from functools import wraps


def log_call(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(f"Calling {function.__name__}")
        return function(*args, **kwargs)

    return wrapper


@log_call
def add(a, b):
    return a + b
```

Senza `*args` e `**kwargs`, il decoratore funzionerebbe solo con una firma specifica.

## Varianti

- **`*args` nella definizione**: raccoglie argomenti posizionali extra.
- **`**kwargs` nella definizione**: raccoglie keyword arguments extra.
- **`*iterable` nella chiamata**: espande una sequenza.
- **`**mapping` nella chiamata**: espande un dizionario.
- **`*` da solo nella firma**: forza parametri keyword-only.
- **`/` nella firma**: indica parametri positional-only.

## Errori comuni

- Usare `*args` e `**kwargs` per nascondere firme poco progettate.
- Non documentare quali keyword sono accettate.
- Inoltrare `kwargs` senza filtrare opzioni non valide.
- Confondere packing nella definizione e unpacking nella chiamata.
- Perdere type hint e chiarezza dell'API.

## Checklist

- La flessibilita e davvero necessaria?
- I parametri accettati sono documentati?
- Gli argomenti extra vengono validati?
- Una firma esplicita sarebbe piu chiara?
- Se sto scrivendo un wrapper, preservo il risultato e gli errori originali?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Decoratori]]
- [[Higher-order Functions]]
- [[Type Hinting]]
