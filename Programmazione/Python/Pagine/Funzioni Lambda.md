---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [python, programming, functions]
aliases: [Funzioni Lambda, Lambda]
prerequisites: []
related: []
---

# Funzioni Lambda in Python

## Sintesi

Una lambda e una piccola funzione anonima definita con la keyword `lambda`. Contiene una sola espressione e restituisce automaticamente il valore di quell'espressione.

E utile per callback brevi, ordinamenti e trasformazioni semplici. Se la logica cresce, e meglio usare `def`.

## Quando usarlo

Usa una lambda quando:

- la funzione serve una sola volta;
- la logica e leggibile in una singola espressione;
- devi passare una funzione come argomento;
- vuoi definire una chiave di ordinamento;
- stai scrivendo una trasformazione breve.

## Come funziona

Sintassi:

```python
lambda arguments: expression
```

Esempio:

```python
add = lambda a, b: a + b

print(add(2, 3))
```

Questo funziona, ma assegnare una lambda a una variabile e spesso meno leggibile di una funzione normale:

```python
def add(a, b):
    return a + b
```

## API / Sintassi

Uso con `sorted()`:

```python
users = [
    {"name": "Luca", "age": 30},
    {"name": "Anna", "age": 24},
]

ordered = sorted(users, key=lambda user: user["age"])
```

Uso con `min()`:

```python
youngest = min(users, key=lambda user: user["age"])
```

Uso con `map()` e `filter()`:

```python
numbers = [1, 2, 3, 4]

squares = list(map(lambda number: number * number, numbers))
even = list(filter(lambda number: number % 2 == 0, numbers))
```

In molti casi una comprehension e piu leggibile:

```python
squares = [number * number for number in numbers]
even = [number for number in numbers if number % 2 == 0]
```

## Esempio pratico

Ordinare righe di report per priorita:

```python
rows = [
    {"title": "backup", "priority": 3},
    {"title": "security patch", "priority": 1},
    {"title": "cleanup", "priority": 5},
]

rows_by_priority = sorted(rows, key=lambda row: row["priority"])
```

La lambda e appropriata perche la logica e breve e locale al punto d'uso.

## Varianti

- **Lambda senza nome**: passata direttamente a una funzione.
- **Lambda assegnata**: possibile, ma spesso sconsigliata.
- **Lambda come key function**: uso tipico con `sorted`, `min`, `max`.
- **Lambda in closure**: puo leggere variabili dello scope esterno.
- **`def` equivalente**: preferibile quando servono nome, docstring, type hint o piu righe.

## Errori comuni

- Usare lambda complesse difficili da leggere.
- Assegnare lambda a variabili quando `def` sarebbe piu chiaro.
- Usare lambda per sostituire funzioni con logica significativa.
- Dimenticare che puo contenere solo una espressione.
- Creare closure in loop senza considerare il binding delle variabili.

## Checklist

- La lambda e leggibile in una riga?
- Serve solo localmente?
- Una funzione `def` renderebbe il codice piu chiaro?
- Serve una docstring o type hint?
- Una comprehension sarebbe piu leggibile di `map` o `filter`?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Higher-order Functions]]
- [[Comprehensions]]
- [[Decoratori]]
