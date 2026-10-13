---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - promemoria
  - comprehension
  - iteratori
  - generatori
aliases:
  - Cheatsheet iteratori Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Comprehensions]]"
  - "[[Programmazione/Python/Pagine/Iteratori]]"
  - "[[Programmazione/Python/Pagine/Generatori]]"
title: Python - Comprehension, iteratori e generatori
---

# Python - Comprehension, iteratori e generatori

## List comprehension

```python
squares = [value**2 for value in values]
even = [value for value in values if value % 2 == 0]
```

## Dict e set comprehension

```python
by_id = {user["id"]: user for user in users}
unique_lengths = {len(value) for value in values}
```

## Comprehension annidata

```python
flat = [item for group in groups for item in group]
```

## Enumerate e zip

```python
for index, item in enumerate(items, start=1):
    print(index, item)
```

```python
for name, score in zip(names, scores, strict=True):
    print(name, score)
```

`strict=True` genera errore se gli iterabili hanno lunghezze diverse.

Il parametro `strict` e disponibile da Python 3.10.

## Iteratore

```python
iterator = iter(items)

first = next(iterator)
second = next(iterator, None)
```

## Generatore

```python
def read_ids(rows):
    for row in rows:
        yield int(row["id"])
```

```python
for entity_id in read_ids(rows):
    print(entity_id)
```

## Generator expression

```python
total = sum(value**2 for value in values)
```

## `yield from`

```python
def flatten(groups):
    for group in groups:
        yield from group
```

## `itertools`

```python
from itertools import chain, islice

combined = chain(first, second)
first_ten = islice(values, 10)
```

```python
from itertools import groupby

ordered = sorted(users, key=lambda user: user["role"])

for role, group in groupby(ordered, key=lambda user: user["role"]):
    print(role, list(group))
```

`groupby()` raggruppa elementi adiacenti: ordinare prima per la stessa chiave.

## Approfondimento

- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
