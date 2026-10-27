---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - liste
  - tuple
  - set
aliases:
  - Cheatsheet collezioni Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Liste]]"
  - "[[Programmazione/Python/Pagine/Tuple]]"
  - "[[Programmazione/Python/Pagine/Set]]"
title: Python - Liste, tuple e set
---

# Python - Liste, tuple e set

## Obiettivo

Promemoria per sequenze e insiemi: accesso, mutazione, copie, ordinamento e deduplicazione. Per le spiegazioni estese usa i collegamenti alla teoria.

## Quando usarlo

`list` per una sequenza modificabile; `tuple` per posizioni fisse; `set` per valori unici e operazioni insiemistiche, senza ordine garantito.

## Procedura

1. Scegli se mantenere ordine e duplicati.
2. Decidi se modificare l'originale o creare un nuovo contenitore.
3. Controlla input vuoti, valori assenti e oggetti annidati.

Ogni blocco e autonomo. Baseline delle prove: **CPython 3.12.10**, non requisito di ultima versione.

## Snippet

### Accesso e slicing

```python
items = [10, 20, 30]

print(items[0], items[-1], len(items))  # 10 30 3
print(items[1:3])                      # [20, 30]
print(items[::-1])                     # [30, 20, 10]
print(items[10:])                      # []
```

La fine della slice e esclusa. Un indice fuori intervallo genera `IndexError`; una slice puo essere vuota.

### Aggiungere elementi

```python
items = [10]
items.append([20, 30])    # aggiunge un solo oggetto
items.extend([40, 50])    # aggiunge gli elementi dell'iterabile
items.insert(0, 0)
print(items)             # [0, 10, [20, 30], 40, 50]
```

Questi metodi modificano la lista e restituiscono `None`. `extend("ab")` aggiunge due caratteri, non una stringa unica.

### Cercare e rimuovere

```python
items = [10, 20, 20, 30]
print(20 in items, items.index(20), items.count(20))  # True 1 2

items.remove(20)     # elimina solo la prima occorrenza
last = items.pop()  # estrae l'ultimo elemento
print(items, last)  # [10, 20] 30
```

`index` e `remove` generano `ValueError` se il valore manca; `pop` genera `IndexError` con lista vuota o indice non valido.

### Svuotare una lista

```python
items = [10, 20]
alias = items
items.clear()
print(items, alias)  # [] []
```

`clear()` modifica l'oggetto condiviso. `items = []` assegnerebbe invece una nuova lista al solo nome `items`.

### Ordinare

```python
items = [30, 10, 20]
ordered = sorted(items)
descending = sorted(items, reverse=True)
print(items, ordered)  # [30, 10, 20] [10, 20, 30]
print(descending)      # [30, 20, 10]

result = items.sort()
print(items, result)   # [10, 20, 30] None
```

`sorted` produce una nuova lista da un iterabile; `sort` modifica una lista esistente. Non assegnare `items = items.sort()`.

### Ordinare per campo

```python
users = [{"name": "Grace"}, {"name": "Ada"}]
by_name = sorted(users, key=lambda user: user["name"])
print([user["name"] for user in by_name])  # ['Ada', 'Grace']
```

L'ordinamento e stabile: a parita di chiave mantiene l'ordine iniziale. Gli oggetti contenuti non vengono copiati; le chiavi devono essere confrontabili.

### Copie e riferimenti annidati

```python
items = [[10], [20]]
copied = items.copy()
sliced = items[:]
copied[0].append(99)
copied.append([30])

print(items)           # [[10, 99], [20]]
print(copied is items) # False
print(sliced == items) # True
```

`copy()` e `[:]` copiano solo il contenitore esterno: gli elementi annidati restano condivisi.

### Tuple e unpacking

```python
point = (10, 20)
x, y = point
single = (42,)
record = ("Ada", [])
record[1].append("admin")

print(x, y, single)  # 10 20 (42,)
print(record)       # ('Ada', ['admin'])
```

La virgola crea la tupla singola: `(42)` e un intero. Le posizioni non sono sostituibili, ma una lista contenuta puo cambiare. Una tupla e hashable solo se lo sono tutti gli elementi.

### Creare e modificare un set

```python
ids = set()  # {} crea invece un dict
ids.update([1, 2, 2, 3])
ids.add(4)
ids.discard(99)
ids.remove(3)

print(sorted(ids))  # [1, 2, 4]
print(1 in ids)    # True
```

Gli elementi devono essere hashable. `discard` tollera l'assenza; `remove` genera `KeyError`. Nessun indice o ordine di inserimento garantito; qui `sorted` serve solo a rendere leggibile il risultato.

### Operazioni tra set

```python
left = {1, 2}
right = {2, 3}

print(sorted(left | right))  # [1, 2, 3]: unione
print(sorted(left & right))  # [2]: intersezione
print(sorted(left - right))  # [1]: differenza
print(sorted(left ^ right))  # [1, 3]: differenza simmetrica
print({2} <= left)           # True: sottoinsieme
print(left.isdisjoint(right))  # False: hanno elementi comuni
```

Questi operatori non modificano i set iniziali; per aggiornare un set usa, per esempio, `|=` oppure `update`.

### Eliminare duplicati

```python
values = ["b", "a", "b"]
unordered = list(set(values))
in_order = list(dict.fromkeys(values))

print(sorted(unordered))  # ['a', 'b']
print(in_order)           # ['b', 'a']
```

Entrambe le forme richiedono elementi hashable. Solo la seconda mantiene il primo ordine di comparsa; non ordina alfabeticamente. Valori uguali come `1` e `True` non restano distinti.

## Adattamenti comuni

### Liste annidate indipendenti

```python
rows = [[] for _ in range(3)]
rows[0].append(1)
print(rows)  # [[1], [], []]
```

Non usare `[[]] * 3` se vuoi tre liste indipendenti: ripete il riferimento alla stessa lista. Per copiare strutture annidate valuta `copy.deepcopy` secondo il tipo dei dati, non come rimedio automatico.

## Debug rapido

- `TypeError: unhashable type`: una lista non puo essere elemento di un set o chiave di dict.
- Un elemento saltato nel ciclo: non rimuovere dalla lista che stai percorrendo; crea un risultato filtrato.
- Risultato `None`: hai assegnato il ritorno di un metodo che modifica in place.
- Risultati non ordinabili: rendi coerenti i tipi oppure fornisci una `key` adatta.

## Checklist finale

- Ordine e duplicati devono restare?
- L'originale o gli oggetti annidati possono cambiare?
- Assenze e input vuoti sono gestiti?

## Collegamenti

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Tuple|Tuple]]
- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Promemoria/Pagine/Python - Dizionari|Promemoria dizionari]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: strutture dati](https://docs.python.org/3.12/tutorial/datastructures.html).
- [Python 3.12: ordinamento e stabilita](https://docs.python.org/3.12/howto/sorting.html).
- [Python 3.12: copie superficiali e profonde](https://docs.python.org/3.12/library/copy.html).
