---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, dataclasses, oop, standard-library]
aliases: [dataclass, Dataclasses Python]
prerequisites: [Classi e Istanze]
related: [Classi e Istanze, Type Hinting, Enum]
---

# Dataclasses

## Sintesi

`dataclasses` riduce boilerplate per classi che rappresentano dati, generando metodi come `__init__`, `__repr__` e `__eq__`.

## Quando usarlo

Usale per oggetti dati semplici: configurazioni, DTO, risultati intermedi, value object e record con pochi metodi.

## Come funziona

Il decoratore `@dataclass` legge le annotazioni dei campi e genera metodi automaticamente. I default mutabili vanno creati con `default_factory`.

## API / Sintassi

```python
from dataclasses import dataclass, field

@dataclass
class User:
    id: int
    name: str
    tags: list[str] = field(default_factory=list)
```

Opzioni:

```python
@dataclass(frozen=True, order=True)
class Point:
    x: int
    y: int
```

## Esempio pratico

```python
@dataclass
class OrderLine:
    sku: str
    quantity: int
    unit_price: float

    @property
    def total(self) -> float:
        return self.quantity * self.unit_price
```

## Varianti

- `frozen=True`.
- `order=True`.
- `field(default_factory=...)`.
- `slots=True`.
- `kw_only=True`.
- `__post_init__`.

## Errori comuni

- Usare `[]` o `{}` come default diretto.
- Confondere `frozen=True` con immutabilita profonda.
- Mettere troppa logica in una dataclass.
- Dimenticare type hints sui campi.
- Usare dataclass dove serve validazione forte runtime.

## Checklist

- La classe rappresenta soprattutto dati?
- I campi hanno type hints?
- I default mutabili usano `default_factory`?
- Serve `frozen=True`?
- Serve `__post_init__` per validazioni semplici?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Enum|Enum]]
