---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - promemoria
  - comprehension
  - iteratori
  - generatori
aliases:
  - Cheatsheet iteratori Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Comprehensions]]"
  - "[[Programmazione/Python/Pagine/Iteratori]]"
  - "[[Programmazione/Python/Pagine/Generatori]]"
title: Python - Comprehension, iteratori e generatori
---

# Python - Comprehension, iteratori e generatori

## Obiettivo

Trasformare e consumare sequenze ricordando cosa viene materializzato e cosa resta lazy. Teoria: [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]], [[Programmazione/Python/Pagine/Iteratori|Iteratori]] e [[Programmazione/Python/Pagine/Generatori|Generatori]].

Baseline: **CPython 3.12.10**, solo standard library. Ogni blocco e autonomo.

## Quando usarlo

- Trasformazioni brevi di liste, dizionari o set.
- Consumo progressivo di un flusso.
- Dubbi su esaurimento, ordine o raggruppamento.

## Procedura

1. Decidi se ti serve una collezione riutilizzabile o un iteratore monouso.
2. Copia lo snippet e sostituisci i dati dimostrativi, mantenendo il contratto degli elementi.
3. Considera input vuoti, duplicati, errori durante il consumo e risorse da chiudere.

## Snippet

### List comprehension

```python
values = [-2, -1, 0, 1, 2]
squares = [value**2 for value in values]
even = [value for value in values if value % 2 == 0]
labels = ["even" if value % 2 == 0 else "odd" for value in values]

print(squares)  # [4, 1, 0, 1, 4]
print(even)  # [-2, 0, 2]
print(labels)  # ['even', 'odd', 'even', 'odd', 'even']
```

L'`if` finale filtra; `a if ... else b` sceglie un valore per ogni elemento. Una lista conserva ordine e duplicati e viene costruita subito.

### Dict comprehension

```python
users = [{"id": 1, "name": "Ada"}, {"id": 1, "name": "Lin"}]
by_id = {user["id"]: user for user in users}

print(by_id[1]["name"])  # Lin
print(by_id[1] is users[-1])  # True
```

Chiavi hashable; per ID duplicati vince l'ultimo valore. Gli oggetti sono condivisi, non copiati profondamente. Se vuoi rifiutare duplicati, serve un controllo esplicito.

### Set comprehension

```python
values = ["a", "bb", "cc"]
unique_lengths = {len(value) for value in values}
print(sorted(unique_lengths))  # [1, 2]
```

Un set elimina duplicati e non garantisce ordine; qui ordiniamo solo per rendere l'output stabile.

### Comprehension annidata

```python
groups = [[1, 2], [], [3]]
flat = [item for group in groups for item in group]
print(flat)  # [1, 2, 3]
```

I `for` si leggono da sinistra a destra: appiattisce **un livello**, non una struttura ricorsiva. Con gruppi stringa otterresti caratteri.

### Enumerate

```python
items = ["Ada", "Lin"]
for index, item in enumerate(items, start=1):
    print(index, item)
# 1 Ada
# 2 Lin
```

Il numero e un contatore di visita: `start=1` non salta il primo elemento e non cambia gli indici della lista.

### Zip rigoroso

```python
names = ["Ada", "Lin"]
scores = [10, 20]
pairs = list(zip(names, scores, strict=True))
print(pairs)  # [('Ada', 10), ('Lin', 20)]
```

`strict=True` richiede Python 3.10+ e segnala lunghezze diverse **durante il consumo**. Prima dell'errore possono essere gia stati prodotti elementi: non rende un ciclo atomico. Senza strict, zip si ferma all'input piu corto.

### Iteratore e sentinella

```python
items = [None, "second"]
iterator = iter(items)
missing = object()

first = next(iterator, missing)
print(first is None)  # True
print(list(iterator))  # ['second']
print(next(iterator, missing) is missing)  # True
print(iter(iterator) is iterator)  # True
```

La sentinella distingue l'esaurimento da un valore `None` valido. `next(it)` senza default solleva `StopIteration`; altri errori non vengono nascosti. `iter(it)` non riavvolge l'iteratore.

### Generatore

```python
def read_ids(rows):
    for row in rows:
        yield int(row["id"])


rows = [{"id": "10"}, {"id": "20"}]
ids = read_ids(rows)
print(list(ids))  # [10, 20]
print(list(ids))  # []
```

Il corpo e le conversioni partono al consumo, non alla chiamata. `KeyError`, `ValueError` o `TypeError` si propagano; `int` converte, non valida un ID positivo/unico. Una nuova chiamata crea un nuovo generatore, ma non rigenera un input gia esaurito.

### Generator expression

```python
values = [1, 2, 3]
squares = (value**2 for value in values)
print(sum(squares))  # 14
print(sum(squares))  # 0
```

Non crea una tupla. Il primo iterabile viene valutato subito; trasformazione e filtri sono lazy. Variabili libere e dati mutabili possono cambiare prima del consumo; lazy non significa memoria nulla.

### Yield from

```python
def flatten(groups):
    for group in groups:
        yield from group


print(list(flatten([[1, 2], [], [3]])))  # [1, 2, 3]
```

Delega a ciascun iterabile, sempre per un solo livello. I protocolli avanzati di delega sono nella nota Generatori.

### Concatenare con chain

```python
from itertools import chain

first = [1, 2]
second = [3]
combined = chain(first, second)
print(list(combined))  # [1, 2, 3]
print(list(combined))  # []
```

`chain` e lazy e monouso; non modifica le liste sorgenti.

### Limitare con islice

```python
from itertools import islice

values = iter(range(20))
first_ten = list(islice(values, 10))
print(first_ten)  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(next(values))  # 10
```

Avanza l'iteratore sorgente. Non accetta indici negativi e non offre accesso casuale; limita un flusso infinito prima di convertirlo in lista.

## Adattamenti comuni

### Raggruppare con groupby

```python
from itertools import groupby

users = [
    {"name": "Ada", "role": "admin"},
    {"name": "Lin", "role": "reader"},
    {"name": "Sam", "role": "admin"},
]
key = lambda user: user["role"]
ordered = sorted(users, key=key)
groups = [(role, list(group)) for role, group in groupby(ordered, key=key)]
print([(role, len(group)) for role, group in groups])
# [('admin', 2), ('reader', 1)]
```

`groupby` raggruppa elementi **adiacenti**. Ordinare per la stessa chiave serve qui a riunire tutti i ruoli uguali, ma non e necessario se vuoi i gruppi consecutivi originali. Consuma ogni gruppo prima di avanzare: condivide l'iteratore sottostante.

### Chiudere dopo un consumo parziale

```python
from contextlib import closing

events = []


def stream():
    try:
        yield 1
        yield 2
    finally:
        events.append("closed")


with closing(stream()) as values:
    print(next(values))  # 1

print(events)  # ['closed']
```

`break` da solo non garantisce la chiusura immediata di un generatore. `close()` esegue il cleanup gia raggiunto; chiudere un generatore mai avviato non ne esegue il corpo. Per file reali assegna chiaramente la proprieta della risorsa.

## Debug rapido

- **Seconda lista vuota**: l'iteratore e stato consumato; conserva dati o crea un nuovo flusso.
- **ID spariti**: la dict comprehension ha sovrascritto chiavi duplicate.
- **Zip non segnala l'errore**: il consumo non ha ancora raggiunto il disallineamento.
- **Gruppi vuoti**: hai conservato iteratori di gruppo invece di materializzarli prima di avanzare.
- **Comprehension illeggibile**: usa un ciclo normale per logica articolata, errori o effetti collaterali.

## Checklist finale

- Eager o lazy scelto intenzionalmente?
- Ordine, duplicati e oggetti condivisi sono accettabili?
- Esaurimento e input vuoti gestiti?
- Consumo limitato per flussi infiniti?
- Cleanup previsto se il consumo si interrompe?

## Collegamenti

- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: comprehension](https://docs.python.org/3.12/tutorial/datastructures.html#list-comprehensions).
- [Python 3.12: iter, next, enumerate e zip](https://docs.python.org/3.12/library/functions.html).
- [Python 3.12: itertools](https://docs.python.org/3.12/library/itertools.html).
- [Python 3.12: generatori e yield](https://docs.python.org/3.12/reference/expressions.html#yield-expressions).
