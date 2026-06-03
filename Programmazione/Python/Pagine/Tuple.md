---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Tuple]
prerequisites: []
related: []
---

# Tuple in Python

## Sintesi

Le tuple sono collezioni ordinate e immutabili. Sono adatte a dati che non devono cambiare e a ritorni multipli da funzioni.

## Quando usarlo

Usa tuple per coordinate, coppie, record brevi, valori multipli restituiti e chiavi composte di dizionari.

## Come funziona

Una tupla non permette aggiunte, rimozioni o sostituzioni di elementi. Se contiene oggetti mutabili, quegli oggetti possono comunque essere modificati.

Le tuple sono hashable solo se tutti gli elementi sono hashable.

## API / Sintassi

```python
point = (10, 20)
single = (5,)
coordinates = 45.0, 9.0

x, y = point
```

Metodi:

```python
values = (1, 2, 2, 3)
values.count(2)
values.index(3)
```

## Esempio pratico

```python
def split_full_name(full_name):
    first, last = full_name.split(" ", 1)
    return first, last

first_name, last_name = split_full_name("Ada Lovelace")
```

## Varianti

- Tupla letterale.
- Tuple unpacking.
- Extended unpacking: `first, *middle, last`.
- Named tuple.
- Dataclass per record piu complessi.
- Tupla come chiave di dizionario.

## Errori comuni

- Dimenticare la virgola nella tupla a un elemento.
- Pensare che una tupla renda immutabili gli oggetti contenuti.
- Usare tuple lunghe e poco leggibili.
- Confondere tuple con liste solo per abitudine.
- Scompattare un numero di valori diverso dagli elementi.

## Checklist

- I dati devono essere immutabili?
- La tupla e abbastanza corta da restare leggibile?
- Serve una dataclass o namedtuple?
- Gli elementi sono hashable se la usi come chiave?
- Lo unpacking ha il numero corretto di variabili?

## Collegamenti

- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
