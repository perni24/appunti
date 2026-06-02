---
date: 2026-06-02
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - internals
  - oop
aliases: []
prerequisites: []
related: []
---

# Descriptor protocol

## Sintesi

Il **descriptor protocol** permette a un oggetto di controllare accesso, assegnazione e cancellazione di un attributo.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
Un descriptor implementa uno o piu metodi tra `__get__`, `__set__` e `__delete__`.

```python
class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("Must be positive")
        instance.__dict__[self.name] = value

class Product:
    price = Positive()
```
### Dove si trova
`property`, metodi, `staticmethod`, `classmethod` e molte parti dell'OOP Python usano descriptor sotto il cofano.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Proprietà|Proprietà]]
- [[Programmazione/Python/Pagine/Metodi di classe e statici|Metodi di classe e statici]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
