---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [python, enum, standard-library]
aliases: [Enum Python]
prerequisites: [Classi e Istanze]
related: [Dataclasses, Type Hinting]
---

# Enum

## Sintesi

`Enum` rappresenta un insieme chiuso di valori nominati. Riduce stringhe magiche e rende gli stati validi espliciti.

## Quando usarlo

Usalo per stati, ruoli, tipi evento, categorie stabili e valori che devono appartenere a un insieme finito.

## Come funziona

Ogni membro enum ha un nome e un valore. I confronti tra enum sono espliciti e leggibili. `StrEnum` e utile quando serve interoperare con stringhe.

## API / Sintassi

```python
from enum import Enum

class Status(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
```

`StrEnum`:

```python
from enum import StrEnum

class Role(StrEnum):
    ADMIN = "admin"
    USER = "user"
```

## Esempio pratico

```python
def can_publish(status: Status) -> bool:
    return status is Status.DRAFT

status = Status("draft")
```

## Varianti

- `Enum`.
- `StrEnum`.
- `IntEnum`.
- `auto()`.
- Enum con metodi.
- Enum usati nei type hints.

## Errori comuni

- Confrontare `Enum` normale con stringhe.
- Usare enum per valori dinamici che arrivano da database e cambiano spesso.
- Salvare nome o valore senza una convenzione.
- Duplicare gli stessi stati in piu enum.
- Usare enum dove basta un booleano chiaro.

## Checklist

- I valori sono davvero finiti e stabili?
- Serve interoperabilita stringa? Valuta `StrEnum`.
- La serializzazione usa `.value` o `.name` in modo coerente?
- I type hints usano l'enum?
- I casi invalidi sono gestiti?

## Collegamenti

- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]]
