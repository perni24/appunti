---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Comprehensions]
prerequisites: []
related: []
---

# Comprehensions in Python

## Sintesi

Le comprehensions creano liste, dizionari e set a partire da iterabili usando una sintassi compatta e leggibile.

## Quando usarlo

Usale per trasformare o filtrare collezioni in modo semplice. Evitale quando la logica diventa troppo annidata o difficile da leggere.

## Come funziona

Una comprehension combina espressione, ciclo e opzionalmente filtro. Produce una nuova collezione senza dover scrivere un ciclo con `.append()`.

## API / Sintassi

List comprehension:

```python
squares = [x * x for x in range(5)]
```

Filtro:

```python
even_numbers = [x for x in numbers if x % 2 == 0]
```

Dictionary comprehension:

```python
lengths = {name: len(name) for name in names}
```

Set comprehension:

```python
extensions = {filename.split(".")[-1].lower() for filename in files}
```

## Esempio pratico

```python
users = [
    {"email": " A@Example.com ", "active": True},
    {"email": "b@example.com", "active": False},
    {"email": " C@Example.com ", "active": True},
]

active_emails = [
    user["email"].strip().lower()
    for user in users
    if user["active"]
]
```

## Varianti

- List comprehension.
- Dictionary comprehension.
- Set comprehension.
- Generator expression.
- Filtro con `if` finale.
- Trasformazione condizionale con `x if cond else y`.

## Errori comuni

- Scrivere comprehensions troppo lunghe.
- Annidare troppe comprehensions.
- Usare side effects invece di creare valori.
- Confondere generator expression e list comprehension.
- Perdere leggibilita per eccesso di compattezza.

## Checklist

- La comprehension sta su poche righe leggibili?
- Produce una nuova collezione?
- Il filtro e chiaro?
- Una funzione helper migliorerebbe la leggibilita?
- Serve lista o basta generator?

## Collegamenti

- [[Programmazione/Python/Pagine/Cicli|Cicli]]
- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
