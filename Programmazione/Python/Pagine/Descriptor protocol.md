---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
publish: true
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

Il descriptor protocol permette a un oggetto di controllare lettura, assegnazione e cancellazione di un attributo tramite `__get__`, `__set__` e `__delete__`.

## Quando usarlo

Serve per capire `property`, metodi, `classmethod`, `staticmethod`, ORM, validatori e molte parti avanzate dell'OOP Python.

## Come funziona

Un descriptor e un attributo definito sulla classe. Quando accedi all'attributo da un'istanza, Python chiama i metodi del descriptor invece di restituire direttamente l'oggetto.

Data descriptor implementa `__set__` o `__delete__`. Non-data descriptor implementa solo `__get__`.

## API / Sintassi

```python
class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self
        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be positive")
        instance.__dict__[self.name] = value
```

## Esempio pratico

```python
class Product:
    price = Positive()

    def __init__(self, price: float) -> None:
        self.price = price

product = Product(10)
```

Assegnare `product.price = -1` solleva `ValueError`.

## Varianti

- Data descriptor.
- Non-data descriptor.
- `property`.
- Metodi di istanza come descriptor.
- `staticmethod`.
- `classmethod`.
- Descriptor con `__set_name__`.

## Errori comuni

- Salvare stato nel descriptor condiviso invece che nell'istanza.
- Non gestire accesso da classe con `instance is None`.
- Usare descriptor quando una property basta.
- Creare API troppo implicite.
- Non capire la precedenza tra descriptor e `__dict__`.

## Checklist

- Serve davvero un descriptor riutilizzabile?
- Lo stato per istanza e salvato correttamente?
- `instance is None` e gestito?
- La validazione e chiara?
- Una property sarebbe piu semplice?

## Collegamenti

- [[Programmazione/Python/Pagine/Proprietà|Proprietà]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Metodi di classe e statici|Metodi di classe e statici]]
