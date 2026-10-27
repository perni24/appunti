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
  - Liste
prerequisites: []
related: []
title: Liste in Python
---

# Liste in Python

## Sintesi

Una lista e una sequenza **ordinata, mutabile e con duplicati ammessi**. Le posizioni sono indici interi; gli elementi sono riferimenti a oggetti, non copie automatiche.

Baseline delle prove: **CPython 3.12.10**. La patch identifica il runtime usato, non l'ultima versione disponibile.

## Quando usarlo

Per accumulare risultati, mantenere un ordine scelto dall'applicazione, accedere per posizione o lavorare con uno stack. Per una coda FIFO con molte rimozioni in testa valuta `collections.deque`; per appartenenza e unicita senza ordine, un set.

## Come funziona

`alias = items` assegna un altro nome alla stessa lista. `items.copy()`, `items[:]` e `list(items)` creano un nuovo contenitore ma condividono gli elementi: sono copie superficiali.

In CPython gli accessi per indice non richiedono una scansione della lista; inserimenti e rimozioni in testa spostano gli elementi successivi. La ricerca per valore percorre gli elementi fino alla corrispondenza. Non dedurre da questo che ogni operazione sia veloce o che gli oggetti contenuti abbiano confronti economici.

## API / Sintassi

### Accesso, aggiunta e rimozione

```python
items = ["apple", "banana", "pear"]
first = items[0]
last = items[-1]
items[1] = "kiwi"
items.append("orange")
items.extend(["plum", "grape"])
items.insert(1, "lime")
removed = items.pop()
items.remove("pear")

print(first, last, removed)  # apple pear grape
print(items)  # ['apple', 'lime', 'kiwi', 'orange', 'plum']
```

- `append(x)` aggiunge un elemento, anche se x e una lista. `extend(iterable)` aggiunge i suoi elementi.
- `pop(i)` rimuove e restituisce; `remove(x)` rimuove la prima uguaglianza e restituisce None.
- `del items[i]` e `clear()` eliminano senza restituire il valore.
- Un indice fuori intervallo o pop su lista vuota genera IndexError; remove/index su valore assente genera ValueError.
- `count(x)` conta le occorrenze; `index(x)` trova la prima posizione. Non confondere indice e valore.

### Slicing

La forma `items[start:stop:step]` esclude stop. Lo step predefinito e 1, non puo essere zero. Con step negativo cambiano direzione e default degli estremi.

```python
numbers = [0, 1, 2, 3, 4, 5]
print(numbers[1:4])    # [1, 2, 3]
print(numbers[:3])     # [0, 1, 2]
print(numbers[::2])    # [0, 2, 4]
print(numbers[::-1])   # [5, 4, 3, 2, 1, 0]
print(numbers[20:30])  # []

changed = numbers.copy()
changed[1:3] = [10, 20, 30]
print(changed)  # [0, 10, 20, 30, 3, 4, 5]
```

Una slice in lettura produce una nuova lista superficiale e limita gli estremi alla sequenza, diversamente da un singolo indice fuori intervallo. L'assegnazione a slice muta invece la lista: con step 1 puo cambiarne la lunghezza; con step diverso da 1 richiede tanti valori quante sono le posizioni selezionate.

### Ordinamento e inversione

```python
records = [("first", 2), ("second", 1), ("third", 2)]
ordered = sorted(records, key=lambda row: row[1])
print(ordered)  # [('second', 1), ('first', 2), ('third', 2)]
print(records[0])  # ('first', 2)

values = [3, 1, 2]
result = values.sort(reverse=True)
print(values, result)  # [3, 2, 1] None
print(list(reversed(values)))  # [1, 2, 3]
```

`sorted` accetta un iterabile e restituisce una lista; `list.sort` modifica la lista e restituisce None. Entrambi sono **stabili**: a parita di chiave conservano l'ordine relativo iniziale, anche con reverse=True. `key` estrae una chiave confrontabile per elemento; non e una funzione di confronto fra due elementi.

Ordinare una nuova lista non copia i record contenuti. `reverse()` inverte in place e restituisce None; `reversed()` produce un iteratore, senza ordinare. Tipi non confrontabili, per esempio int e str senza una chiave adatta, possono causare TypeError. Non modificare la lista nella funzione key e non trattare un sort fallito come operazione con rollback.

## Esempio pratico

### Media dei voti sufficienti, anche senza risultati

Contratto: iterabile finito di int built-in fra 0 e 30, bool esclusi. La funzione rifiuta i dati errati, conserva i voti da 18 in su e restituisce None se non ce ne sono. Zero e un voto ammesso, non un dato mancante.

```python
def passing_average(scores):
    passed = []
    for score in scores:
        if type(score) is not int:
            raise TypeError("Scores must be integers")
        if not 0 <= score <= 30:
            raise ValueError("Scores must be between 0 and 30")
        if score >= 18:
            passed.append(score)

    if not passed:
        return None
    return sum(passed) / len(passed)


print(passing_average([18, 30, 24, 12, 28]))  # 25.0
print(passing_average([0, 12, 17]))  # None
print(passing_average([]))  # None
```

L'input non viene modificato; un iteratore viene pero consumato. Per flussi molto grandi si possono mantenere soltanto somma e conteggio: qui la lista rende visibile la selezione. Un errore tardivo non riavvolge l'iteratore.

### Copie e righe condivise

```python
rows = [["original"]]
copied = rows.copy()
copied[0].append("shared")
print(rows)  # [['original', 'shared']]

repeated = [[]] * 3
repeated[0].append(1)
print(repeated)  # [[1], [1], [1]]

independent = [[] for _ in range(3)]
independent[0].append(1)
print(independent)  # [[1], [], []]
```

La ripetizione moltiplica i riferimenti, non costruisce tre liste interne. `copy.deepcopy` copia ricorsivamente i dati supportati e preserva le condivisioni interne tramite memo; non e un clone universale di file, socket o risorse esterne.

## Varianti

- `[]` per una lista vuota; `list(iterable)` materializza e consuma l'iterabile, quindi deve poter terminare.
- `append` e `pop()` per uno stack LIFO.
- Comprehension per trasformare/filtrare senza mutare la lista visitata.
- `items[:] = nuovi_valori` aggiorna l'oggetto visibile anche agli alias; `items = nuovi_valori` cambia soltanto quel binding.

## Errori comuni

- Assegnare `items = items.sort()` e ritrovarsi con None.
- Eliminare elementi durante lo stesso ciclo e saltare quelli spostati.
- Usare `extend("abc")` aspettandosi un solo elemento.
- Pensare che una slice renda indipendenti anche gli oggetti annidati.
- Dividere per la lunghezza di una selezione vuota.
- Usare `pop(0)` per una coda grande senza valutarne il costo.

## Checklist

- Ordine e duplicati vanno mantenuti?
- Mutazione, copia superficiale e riassegnazione sono intenzionali?
- Indici, step, lista vuota e valori assenti sono gestiti?
- Ordinamento stabile e chiave di confronto rispecchiano il risultato desiderato?
- L'iterabile ha dimensioni ragionevoli e viene consumato una sola volta?

## Collegamenti

- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Cicli|Cicli]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

## Fonti

- [Python 3.12: liste, stack e code](https://docs.python.org/3.12/tutorial/datastructures.html#more-on-lists).
- [Python 3.12: sequenze mutabili e slicing](https://docs.python.org/3.12/library/stdtypes.html#mutable-sequence-types).
- [Python 3.12: ordinamento stabile e key](https://docs.python.org/3.12/howto/sorting.html).
- [Python 3.12: copie superficiali e profonde](https://docs.python.org/3.12/library/copy.html).
- [FAQ Python: implementazione delle liste in CPython](https://docs.python.org/3.12/faq/design.html#how-are-lists-implemented-in-cpython).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
