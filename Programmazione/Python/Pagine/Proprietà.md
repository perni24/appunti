---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Proprietà (@property)]
prerequisites: []
related: []
---

# Proprietà (@property) in Python

## Sintesi

`@property` permette di esporre un metodo come attributo, aggiungendo calcolo o validazione senza cambiare l'interfaccia pubblica.

## Quando usarlo

Usalo quando un attributo deve essere calcolato, validato, reso read-only o mantenuto compatibile mentre cambia l'implementazione interna.

## Come funziona

`@property` crea un descriptor. Il getter viene chiamato quando leggi l'attributo. Il setter, se definito, viene chiamato quando assegni un valore.

## API / Sintassi

```python
class Person:
    def __init__(self, age: int) -> None:
        self.age = age

    @property
    def age(self) -> int:
        return self._age

    @age.setter
    def age(self, value: int) -> None:
        if value < 0:
            raise ValueError("age cannot be negative")
        self._age = value
```

## Esempio pratico

```python
class Rectangle:
    def __init__(self, width: float, height: float) -> None:
        self.width = width
        self.height = height

    @property
    def area(self) -> float:
        return self.width * self.height
```

`area` si usa come attributo: `rectangle.area`.

## Varianti

- Proprietà read-only.
- Proprietà con setter.
- Proprietà con deleter.
- Proprietà calcolate.
- Validazione tramite setter.
- `functools.cached_property` per calcoli costosi memorizzati.

## Errori comuni

- Usare `self.age = value` dentro il setter di `age`, causando ricorsione.
- Mettere I/O lento dentro una proprietà.
- Usare proprietà per nascondere logica complessa.
- Dimenticare che una property read-only non ha setter.
- Confondere `@property` con metodo normale.

## Checklist

- L'accesso sembra un attributo semplice?
- Il getter e veloce?
- Il setter valida senza ricorsione?
- Il nome interno usa `_name`?
- Serve `cached_property` invece di `property`?

## Collegamenti

- [[Programmazione/Python/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
