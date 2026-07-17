---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, functions]
aliases: [Higher-order Functions, HOF]
prerequisites: []
related: []
---

# Higher-order Functions in Python

## Sintesi

Una higher-order function e una funzione che accetta altre funzioni come argomenti o restituisce una funzione. In Python e naturale, perche le funzioni sono oggetti di prima classe.

Questo modello e alla base di callback, decoratori, funzioni di trasformazione, factory function e molte API della standard library.

## Quando usarlo

Usa higher-order functions quando:

- vuoi separare iterazione e trasformazione;
- devi passare una callback;
- vuoi creare funzioni configurate;
- stai scrivendo decoratori;
- vuoi comporre comportamenti riutilizzabili.

Evita astrazioni eccessive: Python privilegia leggibilita e chiarezza.

## Come funziona

Funzione passata come argomento:

```python
def apply_to_all(items, function):
    return [function(item) for item in items]


numbers = [1, 2, 3]
result = apply_to_all(numbers, lambda number: number * 2)
```

Funzione restituita da una funzione:

```python
def multiplier(factor):
    def multiply(value):
        return value * factor

    return multiply


double = multiplier(2)
print(double(10))
```

La funzione interna ricorda `factor`: questo e un esempio di closure.

## API / Sintassi

Funzioni comuni:

```python
names = ["anna", "luca", "marco"]
upper_names = list(map(str.upper, names))
```

```python
numbers = [1, 2, 3, 4, 5]
odd = list(filter(lambda number: number % 2 != 0, numbers))
```

Con `functools.reduce`:

```python
from functools import reduce

numbers = [1, 2, 3, 4]
total = reduce(lambda left, right: left + right, numbers)
```

In Python, spesso le comprehension sono piu leggibili di `map` e `filter`:

```python
upper_names = [name.upper() for name in names]
odd = [number for number in numbers if number % 2 != 0]
```

## Esempio pratico

Validatore configurabile:

```python
def min_length(length):
    def validate(value):
        return len(value) >= length

    return validate


is_valid_password = min_length(8)

print(is_valid_password("secret"))
print(is_valid_password("long-secret"))
```

La funzione esterna crea una regola; quella interna la applica.

## Varianti

- **Callback**: funzione passata per essere chiamata piu tardi.
- **Factory function**: funzione che crea e restituisce un'altra funzione.
- **Closure**: funzione che ricorda variabili dello scope esterno.
- **Decoratore**: higher-order function applicata con sintassi `@`.
- **`functools.partial`**: crea una funzione fissando alcuni argomenti.
- **`functools.lru_cache`**: decoratore che aggiunge memoization.

## Errori comuni

- Usare `map` e `filter` quando una comprehension e piu leggibile.
- Creare catene funzionali difficili da debuggare.
- Nascondere side effect dentro funzioni passate come callback.
- Non dare nomi alle funzioni quando la logica e importante.
- Dimenticare che le closure catturano variabili, non copie isolate per magia.

## Checklist

- La higher-order function rende il codice piu chiaro?
- La funzione passata ha un nome utile se la logica non e banale?
- Una comprehension sarebbe piu semplice?
- La closure cattura solo cio che serve?
- Il comportamento resta facile da testare?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Funzioni Lambda]]
- [[Decoratori]]
- [[Caching]]
