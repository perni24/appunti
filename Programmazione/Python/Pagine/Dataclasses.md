---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
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

| Opzione | Effetto e uso |
|---|---|
| `frozen=True` | Impedisce assegnazioni ai campi; non congela gli oggetti contenuti. |
| `order=True` | Confronta lessicograficamente i campi nell'ordine dichiarato, tra istanze dello stesso tipo; richiede `eq=True`. |
| `field(default_factory=...)` | Crea un default nuovo per ogni istanza, evitando liste condivise. |
| `slots=True` | Genera slot, utili per molti oggetti piccoli; senza `__dict__` ereditato impedisce attributi arbitrari. Richiede Python 3.10+. |
| `kw_only=True` | Richiede nomi espliciti per gli argomenti del costruttore. Richiede Python 3.10+. |
| `__post_init__` | Esegue controlli dopo l'assegnazione dei campi da parte dell'`__init__` generato. |

Esempio con configurazione validata:

```python
@dataclass(slots=True, kw_only=True)
class RetryPolicy:
    attempts: int = 3

    def __post_init__(self):
        if type(self.attempts) is not int:
            raise TypeError("attempts must be an integer")
        if self.attempts < 1:
            raise ValueError("attempts must be positive")

policy = RetryPolicy(attempts=5)
```

`RetryPolicy(5)` non e ammesso. Le annotazioni non validano i tipi a runtime: qui i controlli sono espliciti. `__post_init__` non viene richiamato automaticamente dopo successive modifiche ai campi.

Con `frozen=True`, una lista interna resta modificabile. Per un record immutabile preferisci campi immutabili, come tuple di valori immutabili. `frozen=True` non garantisce neppure che tutti i campi siano hashable.

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

## Fonti

- [Python - dataclasses](https://docs.python.org/3/library/dataclasses.html)
