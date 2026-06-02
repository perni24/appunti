---
date: 2026-06-02
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

`dataclasses` e un modulo della standard library che riduce boilerplate per classi usate principalmente come contenitori di dati.

Genera automaticamente metodi come `__init__`, `__repr__` e `__eq__` a partire dai campi dichiarati.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Opzioni utili
- `frozen=True`: rende l'istanza immutabile a livello pratico.
- `order=True`: genera metodi di confronto.
- `default_factory`: crea valori mutabili in modo sicuro.

```python
from dataclasses import dataclass, field

@dataclass
class Team:
    members: list[str] = field(default_factory=list)
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Esempio base
```python
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    active: bool = True


user = User(1, "Luca")
print(user)
```

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Usare `[]` o `{}` come default diretto.
- Usare dataclass per oggetti con molta logica e invarianti complesse.
- Confondere `frozen=True` con immutabilita profonda.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Enum|Enum]]
