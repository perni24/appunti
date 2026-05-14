---
date: 2026-05-14
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

`Enum` permette di rappresentare un insieme chiuso di valori nominati.

E utile quando una variabile puo assumere solo alcuni stati validi.

## Esempio

```python
from enum import Enum

class Status(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


status = Status.DRAFT
```

## Perche usarlo

- Evita stringhe magiche sparse nel codice.
- Rende gli stati espliciti.
- Migliora type checking e leggibilita.
- Riduce errori di typo.

## StrEnum

Nelle versioni moderne di Python e disponibile `StrEnum`, utile quando vuoi enum che si comportano come stringhe.

```python
from enum import StrEnum

class Role(StrEnum):
    ADMIN = "admin"
    USER = "user"
```

## Errori comuni

- Confrontare enum con stringhe quando non si usa `StrEnum`.
- Usare enum per liste di valori che cambiano spesso a runtime.
- Salvare il nome invece del valore senza una scelta consapevole.

## Collegamenti

- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
