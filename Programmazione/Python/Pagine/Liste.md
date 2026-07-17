---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Liste]
prerequisites: []
related: []
---

# Liste in Python

## Sintesi

Le liste sono collezioni ordinate, mutabili e indicizzate. Sono adatte a sequenze di elementi modificabili.

## Quando usarlo

Usa una lista quando devi mantenere ordine, aggiungere/rimuovere elementi o processare una sequenza di dati.

## Come funziona

Una lista contiene riferimenti a oggetti. L'accesso per indice e veloce, mentre inserimenti e rimozioni all'inizio sono piu costosi perche richiedono spostamenti.

L'assegnazione `b = a` non copia la lista: crea un secondo nome per lo stesso oggetto.

## API / Sintassi

```python
items = ["apple", "banana", "pear"]
first = items[0]
last = items[-1]
items.append("orange")
items[1] = "kiwi"
```

Slicing:

```python
numbers = [0, 1, 2, 3, 4, 5]
numbers[1:4]   # [1, 2, 3]
numbers[:3]    # [0, 1, 2]
numbers[::-1]  # lista invertita
```

## Esempio pratico

```python
raw_scores = [18, 30, 24, 12, 28]

valid_scores = []
for score in raw_scores:
    if score >= 18:
        valid_scores.append(score)

average = sum(valid_scores) / len(valid_scores)
```

## Varianti

- Lista vuota: `[]`.
- Lista da iterabile: `list(iterable)`.
- Copia superficiale: `items.copy()` o `items[:]`.
- Ordinamento in place: `items.sort()`.
- Nuova lista ordinata: `sorted(items)`.
- List comprehension.

## Errori comuni

- Confondere assegnazione e copia.
- Modificare una lista mentre la si itera.
- Usare lista per membership frequente quando un set e piu adatto.
- Usare `pop(0)` per code grandi.
- Mescolare tipi senza motivo.

## Checklist

- Serve mantenere ordine?
- Serve mutabilita?
- Serve ricerca veloce per appartenenza? Valuta `set`.
- Hai copiato la lista se devi modificarla separatamente?
- L'uso di `sort()` in place e intenzionale?

## Collegamenti

- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
