---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [python, promemoria, sintassi]
aliases: [Cheatsheet sintassi Python]
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Sintassi e Variabili]]"
  - "[[Programmazione/Python/Pagine/Operatori]]"
---

# Python - Sintassi essenziale

## Variabili e tipi

```python
name = "Ada"
count = 0
active = True
value = None
```

```python
type(value)
isinstance(value, str)
isinstance(value, (int, float))
```

## Conversioni

```python
str(42)
int("42")
float("3.14")
bool(value)
list(iterable)
tuple(iterable)
set(iterable)
```

## Confronti

```python
value == expected
value != expected
value is None
value is not None
minimum <= value <= maximum
```

Usare `is` per `None`, non per confrontare stringhe o numeri.

## Condizioni

```python
if score >= 90:
    result = "A"
elif score >= 60:
    result = "B"
else:
    result = "C"
```

```python
status = "online" if active else "offline"
```

## Cicli

```python
for item in items:
    print(item)
```

```python
for index, item in enumerate(items, start=1):
    print(index, item)
```

```python
while attempts < limit:
    attempts += 1
```

## Interrompere o saltare

```python
for item in items:
    if should_skip(item):
        continue
    if is_target(item):
        break
```

## Unpacking

```python
first, second = values
head, *middle, tail = values
```

```python
merged = {**defaults, **options}
combined = [*first_list, *second_list]
```

## Walrus operator

```python
if match := pattern.search(text):
    print(match.group())
```

## Pattern matching

```python
match status:
    case 200:
        result = "ok"
    case 404:
        result = "not found"
    case _:
        result = "error"
```

Disponibile da Python 3.10.

## Approfondimento

- [[Programmazione/Python/Pagine/Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Operatori]]
- [[Programmazione/Python/Pagine/Strutture Condizionali]]
- [[Programmazione/Python/Pagine/Cicli]]
- [[Programmazione/Python/Pagine/Comandi base]]
