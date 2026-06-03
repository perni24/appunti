---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Type Hinting]
prerequisites: []
related: []
---

# Type Hinting in Python

## Sintesi

Il type hinting aggiunge annotazioni di tipo a funzioni, variabili e classi. Non cambia da solo il runtime, ma migliora leggibilita, refactoring e controlli statici.

## Quando usarlo

Usalo nelle API pubbliche, funzioni condivise, classi, modelli dati, librerie e codice di team. E particolarmente utile dove `None`, dizionari strutturati o callback rendono il codice ambiguo.

## Come funziona

Le annotazioni sono metadati accessibili tramite `__annotations__`. Strumenti come mypy, pyright e IDE le usano per segnalare errori prima dell'esecuzione.

Python resta dinamico: se non usi un type checker, i tipi sono principalmente documentazione.

## API / Sintassi

```python
def greet(name: str) -> str:
    return f"Ciao {name}"

count: int = 0
names: list[str] = ["Ada", "Luca"]
```

Tipi moderni:

```python
def normalize(value: int | float) -> float:
    return float(value)

def find_user(user_id: int) -> str | None:
    ...
```

## Esempio pratico

```python
from typing import TypedDict

class UserData(TypedDict):
    id: int
    email: str

def send_email(user: UserData, subject: str) -> None:
    print(user["email"], subject)
```

## Varianti

- Annotazioni di funzioni.
- Annotazioni di variabili.
- `list[str]`, `dict[str, int]`, `tuple[int, int]`.
- Union moderna: `str | None`.
- `TypedDict`.
- `Protocol`.
- `Callable`.
- `Any`.

## Errori comuni

- Usare `Any` ovunque.
- Annotare troppo codice interno banale e ignorare API pubbliche.
- Non eseguire un type checker.
- Dimenticare di gestire `None`.
- Scrivere tipi piu complessi del codice stesso.

## Checklist

- Le funzioni pubbliche sono annotate?
- I valori opzionali usano `| None`?
- Eviti `Any` quando possibile?
- Usi un type checker nel workflow?
- I tipi aiutano la lettura invece di appesantirla?

## Collegamenti

- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Enum|Enum]]
