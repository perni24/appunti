---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - liste
  - tuple
  - set
aliases:
  - Cheatsheet collezioni Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Liste]]"
  - "[[Programmazione/Python/Pagine/Tuple]]"
  - "[[Programmazione/Python/Pagine/Set]]"
title: Python - Liste, tuple e set
---

# Python - Liste, tuple e set

## Liste

```python
items = [10, 20, 30]

items[0]
items[-1]
items[1:3]
items[::-1]
len(items)
```

## Modificare una lista

```python
items.append(40)
items.extend([50, 60])
items.insert(0, 0)
items.remove(20)
last = items.pop()
items.clear()
```

## Cercare

```python
20 in items
items.index(20)
items.count(20)
```

## Ordinare

```python
ordered = sorted(items)
descending = sorted(items, reverse=True)
by_name = sorted(users, key=lambda user: user["name"])
```

```python
items.sort()
```

`sorted()` crea una lista; `list.sort()` modifica quella esistente.

## Copiare

```python
copy = items.copy()
copy = items[:]
```

Sono copie superficiali.

## Tuple

```python
point = (10, 20)
x, y = point

single = (42,)
```

Usare una tuple per una sequenza ordinata che non deve essere modificata.

## Set

```python
ids = {1, 2, 3}

ids.add(4)
ids.discard(2)
ids.remove(3)
1 in ids
```

`discard()` non genera errore se il valore manca; `remove()` genera `KeyError`.

## Operazioni tra set

```python
left | right       # unione
left & right       # intersezione
left - right       # differenza
left ^ right       # differenza simmetrica
left <= right      # sottoinsieme
```

## Rimuovere duplicati

```python
unique = list(set(values))
```

Questa conversione non conserva un ordinamento semantico. Per mantenere l'ordine:

```python
unique = list(dict.fromkeys(values))
```

## Approfondimento

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
