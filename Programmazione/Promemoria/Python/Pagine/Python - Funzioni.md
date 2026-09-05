---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [python, promemoria, funzioni]
aliases: [Cheatsheet funzioni Python]
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Funzioni]]"
  - "[[Programmazione/Python/Pagine/Argomenti Flessibili]]"
  - "[[Programmazione/Python/Pagine/Type Hinting]]"
---

# Python - Funzioni

## Definizione

```python
def add(left: int, right: int) -> int:
    return left + right
```

## Valore predefinito

```python
def greet(name: str = "Utente") -> str:
    return f"Ciao {name}"
```

Non usare liste o dizionari modificabili come valori predefiniti:

```python
def append_value(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items
```

## Argomenti variabili

```python
def total(*values: float) -> float:
    return sum(values)
```

```python
def configure(**options):
    return options
```

## Solo posizionali e solo keyword

```python
def connect(host, /, port=5432, *, timeout=10):
    pass


connect("localhost", port=5432, timeout=5)
```

## Unpacking nella chiamata

```python
arguments = [2, 3]
result = add(*arguments)
```

```python
options = {"port": 5432, "timeout": 5}
connect("localhost", **options)
```

`host` precede `/`: va passato per posizione, anche quando gli altri argomenti usano `**options`.

## Lambda

```python
users.sort(key=lambda user: user["name"])
```

Usare `lambda` per espressioni brevi.

## Restituire piu valori

```python
def bounds(values):
    return min(values), max(values)


minimum, maximum = bounds(values)
```

## Funzione come argomento

```python
def apply(value, operation):
    return operation(value)


result = apply(5, lambda value: value * 2)
```

## Approfondimento

- [[Programmazione/Python/Pagine/Funzioni]]
- [[Programmazione/Python/Pagine/Argomenti Flessibili]]
- [[Programmazione/Python/Pagine/Funzioni Lambda]]
- [[Programmazione/Python/Pagine/Higher-order Functions]]
- [[Programmazione/Python/Pagine/Type Hinting]]
- [[Programmazione/Python/Pagine/Decoratori]]
