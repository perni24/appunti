---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, memory]
aliases: [Memory Management]
prerequisites: []
related: []
---

# Memory Management in Python

## Sintesi

Python gestisce la memoria automaticamente, ma questo non significa che la memoria sia irrilevante. Capire riferimenti, mutabilita, garbage collection e risorse esterne aiuta a evitare consumi eccessivi, cache fuori controllo e bug dovuti ad aliasing.

In CPython il modello si basa soprattutto su reference counting e garbage collector ciclico.

## Quando usarlo

Questo argomento diventa importante quando:

- un programma consuma troppa RAM;
- lavori con file, stream o dataset grandi;
- usi cache, singleton o strutture globali;
- devi capire aliasing e mutabilita;
- fai profiling o debugging di memory leak logici;
- gestisci risorse esterne come file, socket o lock.

## Come funziona

In Python una variabile contiene un riferimento a un oggetto, non l'oggetto stesso.

```python
numbers = [1, 2, 3]
alias = numbers

alias.append(4)

print(numbers)  # [1, 2, 3, 4]
```

`numbers` e `alias` puntano allo stesso oggetto mutabile.

In CPython ogni oggetto ha un contatore di riferimenti. Quando il contatore arriva a zero, l'oggetto puo essere liberato. Per cicli di riferimento entra in gioco il garbage collector.

```python
class Node:
    def __init__(self):
        self.other = None


a = Node()
b = Node()

a.other = b
b.other = a
```

Qui gli oggetti si referenziano a vicenda. Il garbage collector ciclico serve anche per questi casi.

## API / Sintassi

Strumenti utili:

- `sys.getrefcount(obj)`: mostra il numero di riferimenti in CPython;
- `sys.getsizeof(obj)`: dimensione approssimativa dell'oggetto;
- `gc.collect()`: forza una raccolta del garbage collector;
- `gc.get_stats()`: mostra statistiche del garbage collector;
- `tracemalloc`: traccia allocazioni di memoria.

```python
import sys

data = {"name": "Luca", "roles": ["admin", "editor"]}

print(sys.getsizeof(data))
print(sys.getrefcount(data))
```

`sys.getsizeof()` non misura sempre l'intera memoria di una struttura annidata: misura l'oggetto contenitore, non necessariamente tutti gli oggetti referenziati.

## Esempio pratico

Un memory leak logico spesso nasce da strutture che restano raggiungibili per tutta la vita del processo.

```python
results_cache = {}


def store_result(key, value):
    results_cache[key] = value
```

Questo non e un leak per il garbage collector: la memoria e ancora raggiungibile. Il problema e che la cache non ha limiti o invalidazione.

Una versione piu controllata usa una cache limitata.

```python
from functools import lru_cache


@lru_cache(maxsize=256)
def compute_report(user_id):
    return f"report for {user_id}"
```

## Varianti

- **Reference counting**: libera molti oggetti appena non sono piu referenziati.
- **Garbage collector ciclico**: gestisce cicli di oggetti non piu raggiungibili.
- **Allocator di CPython**: ottimizza allocazioni frequenti di oggetti piccoli.
- **Lazy evaluation**: generatori e iteratori riducono memoria temporanea.
- **Context manager**: gestiscono risorse esterne, che non sono la stessa cosa della memoria.

```python
def read_lines(path):
    with open(path, encoding="utf-8") as file:
        for line in file:
            yield line.strip()
```

## Errori comuni

- Pensare che `del variable` liberi sempre subito tutta la memoria osservabile dal sistema operativo.
- Confondere liberazione della memoria e chiusura di risorse esterne.
- Lasciare crescere cache, liste globali o code senza limiti.
- Creare copie grandi non necessarie invece di usare iteratori o generatori.
- Non considerare aliasing su oggetti mutabili.
- Usare `gc.collect()` come soluzione abituale invece di correggere i riferimenti mantenuti vivi.

## Checklist

- Sto mantenendo riferimenti inutili a oggetti grandi?
- Una lista puo essere sostituita da un generatore?
- Le cache hanno un limite o una strategia di invalidazione?
- Le risorse esterne sono gestite con `with`?
- Ho verificato il consumo con strumenti come `tracemalloc` prima di ottimizzare?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Generatori]]
- [[Iteratori]]
- [[Context Managers]]
- [[Caching]]
- [[Profiling]]
