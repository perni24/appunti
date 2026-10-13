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
  - dizionari
aliases:
  - Cheatsheet dizionari Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Dizionari]]"
title: Python - Dizionari
---

# Python - Dizionari

## Creazione e accesso

```python
user = {
    "id": 1,
    "name": "Ada",
    "active": True,
}

user["name"]
user.get("role")
user.get("role", "user")
```

`dictionary[key]` genera `KeyError` se la chiave manca; `get()` restituisce il valore predefinito.

## Inserire e aggiornare

```python
user["role"] = "admin"
user.update({"active": False, "city": "Roma"})
```

```python
settings = defaults | overrides
defaults |= overrides
```

Gli operatori `|` e `|=` sui dizionari sono disponibili da Python 3.9.

## Rimuovere

```python
role = user.pop("role", None)
key, value = user.popitem()
del user["active"]
```

## Verificare

```python
"name" in user
"name" not in user
len(user)
```

## Iterare

```python
for key in user:
    print(key)
```

```python
for key, value in user.items():
    print(key, value)
```

```python
user.keys()
user.values()
user.items()
```

## Valore iniziale

```python
groups.setdefault(role, []).append(user)
```

Per conteggi:

```python
counts[word] = counts.get(word, 0) + 1
```

## Comprehension

```python
squares = {value: value**2 for value in values}
active_users = {
    user_id: user
    for user_id, user in users.items()
    if user["active"]
}
```

## Copiare

```python
copy = user.copy()
copy = {**user}
```

Sono copie superficiali.

## Approfondimento

- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
