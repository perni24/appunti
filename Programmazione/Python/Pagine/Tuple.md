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
  - Tuple
prerequisites: []
related: []
title: Tuple in Python
---

# Tuple in Python

## Sintesi

Una tupla e una sequenza ordinata di riferimenti che **non permette di sostituire, aggiungere o eliminare le proprie posizioni**. Non rende immutabili gli oggetti che contiene.

Baseline delle prove: **CPython 3.12.10**, non un'indicazione dell'ultima patch disponibile.

## Quando usarlo

Per coppie, coordinate, piccoli record posizionali e risultati composti di una funzione. Una tupla puo essere una chiave composta soltanto se tutti i suoi elementi sono hashable. Quando i campi diventano poco comprensibili per posizione, usa nomi tramite namedtuple o dataclass.

## Come funziona

E normalmente la virgola a costruire una tupla, non le sole parentesi. `(5)` e un int; `(5,)` una tupla di un elemento; `()` e il caso vuoto.

Immutabilita e hashability non sono sinonimi: una tupla con una lista non e hashable. Hashable significa avere un hash stabile durante la vita dell'oggetto e confronti coerenti: oggetti uguali devono avere lo stesso hash. Non usare il valore di hash come identificatore persistente.

## API / Sintassi

### Creazione, accesso e metodi

```python
point = (10, 20)
single = (5,)
coordinates = 45.0, 9.0
empty = ()
from_iterable = tuple([1, 2, 3])

x, y = point
print(x, y, point[-1])  # 10 20 20
print(point[:1])  # (10,)

values = (1, 2, 2, 3)
print(values.count(2), values.index(3))  # 2 3
```

Supporta indice, slicing, len, in, concatenazione e ripetizione. `index` fallisce con ValueError se il valore non c'e; un indice fuori intervallo genera IndexError. Non ha append o sort: `sorted(tuple_value)` restituisce una lista.

### Unpacking

```python
first, *middle, last = (10, 20, 30, 40)
print(first, middle, last)  # 10 [20, 30] 40

head, *tail = (7,)
print(head, tail)  # 7 []

left, right = "LR"
print(left, right)  # L R
```

L'unpacking funziona con iterabili, non solo tuple. Senza stella, il numero di valori deve corrispondere alle destinazioni. Una destinazione starred raccoglie una **lista**, anche vuota; deve comunque restare abbastanza input per le altre. Troppi o pochi valori generano ValueError; una sorgente non iterabile genera TypeError.

### Elementi mutabili e chiavi composte

```python
record = ("draft", ["python"])
record[1].append("notes")
print(record)  # ('draft', ['python', 'notes'])

stock = {("warehouse-a", "sku-1"): 4}
print(stock[("warehouse-a", "sku-1")])  # 4
```

`record[1] = []` fallirebbe, mentre append modifica l'oggetto gia contenuto. Non dedurre che un'operazione fallita sia senza effetti: `record[1] += ["extra"]` prima estende la lista e poi fallisce nel tentativo di riassegnare quella posizione della tupla. E un controesempio da capire, non una tecnica consigliata.

Una chiave come `("warehouse-a", ["sku-1"])` non e valida. Una tupla di stringhe lo e, ma resta necessario scegliere una politica per uguaglianza e normalizzazione degli identificatori.

## Esempio pratico

### Restituire due risultati con un contratto chiaro

Contratto: iterabile finito e non vuoto di int built-in. La funzione restituisce minimo e massimo; esclude bool e non impone un intervallo di dominio.

```python
def bounds(values):
    items = tuple(values)
    if not items:
        raise ValueError("At least one value is required")
    if any(type(value) is not int for value in items):
        raise TypeError("Values must be integers")
    return min(items), max(items)


low, high = bounds([9, 3, 12])
print(low, high)  # 3 12
```

La funzione restituisce un solo oggetto tupla, poi il chiamante lo scompone. La conversione iniziale consuma e memorizza l'input: il demo non e ottimizzato per flussi enormi o infiniti.

Dividere un testo con `split(" ", 1)` puo illustrare la scomposizione, ma non identifica in generale nome e cognome: spazi, nomi composti e stringhe senza separatore richiedono un contratto diverso.

### Campi nominati

```python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
origin = Point(0, 0)
shifted = origin._replace(x=10)
print(origin.x, shifted.x)  # 0 10
```

`_replace` crea un nuovo record e non modifica origin. Namedtuple non aggiunge controlli runtime sui tipi e puo contenere oggetti mutabili. Una dataclass rende piu espliciti modelli con comportamento e molti campi; `frozen=True` non equivale a immutabilita profonda.

## Varianti

- `tuple(iterable)` per materializzare una sequenza non modificabile nelle posizioni.
- `typing.NamedTuple` per campi nominati con annotazioni, che da sole non validano.
- Tupla come chiave di dict o elemento di set quando e hashable.
- `(expression for item in source)` e una generator expression, **non una tuple comprehension**; per ottenere una tupla serve `tuple(...)`.

## Errori comuni

- Omettere la virgola della tupla singola.
- Confondere impossibilita di riassegnare le posizioni con assenza di mutazioni annidate.
- Usare tuple lunghe senza documentare il significato dei campi.
- Supporre che ogni tupla sia hashable.
- Aspettarsi una tupla nella destinazione starred dell'unpacking.
- Usare `is` invece di `==` per confrontare il contenuto.

## Checklist

- Significato e ordine dei campi sono chiari?
- Serve un record con nomi invece delle posizioni?
- Gli oggetti contenuti possono cambiare attraverso altri riferimenti?
- Tutti gli elementi sono hashable se la tupla diventa una chiave?
- Input vuoto e numero di valori nell'unpacking sono gestiti?

## Collegamenti

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]

## Fonti

- [Python 3.12: tuple e sequenze](https://docs.python.org/3.12/tutorial/datastructures.html#tuples-and-sequences).
- [Python 3.12: definizione di hashable](https://docs.python.org/3.12/glossary.html#term-hashable).
- [Python 3.12: namedtuple](https://docs.python.org/3.12/library/collections.html#collections.namedtuple).
- [Python 3.12: virgola, parentesi e generator expressions](https://docs.python.org/3.12/reference/expressions.html#parenthesized-forms).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
