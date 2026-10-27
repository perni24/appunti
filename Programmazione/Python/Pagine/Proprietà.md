---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
aliases:
  - Proprietà (@property)
prerequisites: []
related: []
title: Proprietà (@property) in Python
---

# Proprietà (@property) in Python

## Sintesi

`property` collega la lettura, l'assegnazione o la cancellazione di un attributo a funzioni della classe. Permette di aggiungere calcolo o validazione mantenendo un'interfaccia come `person.age`, senza richiedere `person.get_age()`.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

Usala per un valore calcolato, per validare un'assegnazione o per esporre in sola lettura una parte dello stato. Non serve trasformare ogni attributo in proprieta; non usarla per nascondere richieste di rete o operazioni sorprendentemente costose.

## Come funziona

`@property` costruisce un **data descriptor** memorizzato nella classe. Leggere `obj.name` esegue il getter; assegnare `obj.name = value` esegue il setter, se presente. Senza setter l'assegnazione solleva `AttributeError`: il valore non diventa automaticamente un normale attributo di istanza.

Il dato memorizzato puo avere un nome distinto, per esempio `_age`. Dentro il setter, `self.age = value` richiamerebbe il setter stesso fino a un `RecursionError`; dopo la validazione bisogna aggiornare `self._age`.

L'annotazione `value: int` non valida nulla da sola. Inoltre `bool` e una sottoclasse di `int`: se il contratto richiede un intero e non un booleano, occorre escluderlo esplicitamente.

## API / Sintassi

Il costruttore passa dallo stesso setter usato per gli aggiornamenti. Il contratto dell'esempio e un'eta intera non negativa, senza verifica della plausibilita anagrafica.

```python
class Person:
    def __init__(self, age: int) -> None:
        self.age = age

    @property
    def age(self) -> int:
        return self._age

    @age.setter
    def age(self, value: int) -> None:
        if type(value) is not int:
            raise TypeError("age must be an integer")
        if value < 0:
            raise ValueError("age cannot be negative")
        self._age = value


person = Person(20)
person.age = 21
print(person.age)  # 21
```

`type(value) is int` esclude anche le sottoclassi di `int`: qui e una scelta intenzionale di contratto, non una regola generale da applicare a tutte le API. Un'assegnazione rifiutata lascia intatto il valore precedente.

## Esempio pratico

Questo rettangolo rappresenta dimensioni intere su una griglia, non misure geometriche arbitrarie in virgola mobile. Larghezza e altezza possono essere zero; un valore negativo, frazionario o booleano viene rifiutato.

```python
class Rectangle:
    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height

    @staticmethod
    def _checked_length(value: int) -> int:
        if type(value) is not int:
            raise TypeError("length must be an integer")
        if value < 0:
            raise ValueError("length cannot be negative")
        return value

    @property
    def width(self) -> int:
        return self._width

    @width.setter
    def width(self, value: int) -> None:
        self._width = self._checked_length(value)

    @property
    def height(self) -> int:
        return self._height

    @height.setter
    def height(self, value: int) -> None:
        self._height = self._checked_length(value)

    @property
    def area(self) -> int:
        return self.width * self.height


rectangle = Rectangle(3, 4)
print(rectangle.area)  # 12
rectangle.width = 5
print(rectangle.area)  # 20
```

`area` viene ricalcolata a ogni lettura: non c'e una cache da sincronizzare con `width` e `height`. Non ha setter, quindi `rectangle.area = 10` fallisce. Cio non rende immutabile il rettangolo: le dimensioni hanno setter e gli attributi interni restano accessibili per convenzione.

La sola lettura riguarda l'assegnazione dell'attributo, non la mutabilita di eventuali liste o dizionari restituiti. Vedi [[Programmazione/Python/Pagine/Incapsulamento|Incapsulamento]] per questo caso.

## Varianti

### Deleter

`@name.deleter` definisce il comportamento di `del obj.name`. Senza deleter la cancellazione fallisce con `AttributeError`. Se lo definisci, sei tu a scegliere se cancellare l'attributo interno, ripristinare un default o vietare la cancellazione in certi stati: non avviene automaticamente.

### cached_property

`functools.cached_property` calcola un valore al primo accesso e lo salva nel dizionario dell'istanza. Non e una normale `property` con una cache invisibile: ammette assegnazione diretta e cancellazione del valore memorizzato.

Il seguente esempio rende intenzionalmente visibile una cache obsoleta:

```python
from functools import cached_property


class TextStats:
    def __init__(self, text: str) -> None:
        self.text = text
        self.computations = 0

    @cached_property
    def word_count(self) -> int:
        self.computations += 1
        return len(self.text.split())


stats = TextStats("one two")
print(stats.word_count, stats.word_count, stats.computations)  # 2 2 1
stats.text = "one two three"
print(stats.word_count)  # 2: valore memorizzato, ormai obsoleto
del stats.word_count
print(stats.word_count, stats.computations)  # 3 2
```

Sceglila per un calcolo costoso su stato stabile oppure definisci un'invalidazione esplicita. `TextStats` illustra il meccanismo, non e un modello con cache automaticamente coerente o validazione di input esterno.

In Python 3.12 `cached_property` non ha il lock interno presente nelle versioni precedenti: accessi concorrenti possono eseguire il getter piu volte. Se serve sincronizzazione, va progettata. Richiede inoltre un `__dict__` mutabile sull'istanza; una classe con soli `__slots__` che non includono `__dict__` non e adatta a questo meccanismo.

## Errori comuni

- Assegnare alla proprieta stessa dentro il setter.
- Aggiornare lo stato e validarlo soltanto dopo.
- Pensare che le annotazioni escludano automaticamente booleani, stringhe o `None`.
- Confondere una proprieta read-only con un oggetto immutabile.
- Aggiungere `cached_property` a valori che cambiano senza invalidare la cache.
- Usare un getter per effetti collaterali che dovrebbero essere un comando esplicito.

## Checklist

- Getter, setter e deleter hanno lo stesso nome pubblico?
- L'inizializzazione usa la stessa validazione degli aggiornamenti?
- Un valore errato lascia invariato lo stato precedente?
- Il getter e abbastanza economico e prevedibile?
- Il risultato e ricalcolato o memorizzato?
- Con una cache, sono chiari invalidazione, memoria e accessi concorrenti?

## Collegamenti

- [[Programmazione/Python/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e istanze]]
- [[Programmazione/Python/Pagine/Caching|Caching]]
- [[Programmazione/Python/Indice Python|Indice Python]]

## Fonti

- [Funzione property](https://docs.python.org/3.12/library/functions.html#property).
- [Descriptor HOWTO: proprieta](https://docs.python.org/3.12/howto/descriptor.html#properties).
- [functools.cached_property e differenze tra versioni](https://docs.python.org/3.12/library/functools.html#functools.cached_property).
