---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - programming
  - functions
aliases:
  - Funzioni Lambda
  - Lambda
prerequisites: []
related: []
title: Funzioni Lambda in Python
---

# Funzioni Lambda in Python

## Sintesi

Una lambda crea una funzione tramite un'espressione: `lambda parametri: espressione`. Quando la funzione viene chiamata, valuta il corpo e ne restituisce il risultato. Non e piu veloce, pura o asincrona per il solo fatto di essere una lambda.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

- Una callback breve serve soltanto nel punto in cui la passi.
- La chiave di un ordinamento combina pochi campi.
- Una trasformazione locale e immediatamente leggibile.

Usa `def` quando il comportamento ha un nome utile, richiede annotazioni, una docstring, gestione di errori o piu istruzioni.

## Come funziona

La definizione crea un oggetto funzione; non esegue subito il corpo. Gli argomenti vengono associati alla chiamata come per una normale funzione. Sono possibili default e parametri keyword-only, ma non annotazioni nella sintassi lambda.

Il corpo contiene una sola espressione, non necessariamente una sola riga fisica. Sono possibili espressioni condizionali, chiamate e comprehensions; non blocchi `try` o istruzioni `return`. Una chiamata nel corpo puo comunque modificare oggetti o produrre altri effetti collaterali.

## API / Sintassi

L'assegnazione seguente e valida e serve a confrontare le due forme. Per una funzione con un nome stabile e preferibile la versione `def`.

```python
add_expression = lambda left, right=1: left + right


def add(left, right=1):
    return left + right


print(add_expression(2, 3), add(2, 3))  # 5 5
print(add_expression(2), add(2))        # 3 3
```

### Chiavi di ordinamento e selezione

Una `key` riceve un elemento e restituisce il valore da confrontare; non e un comparatore a due argomenti. Gli esempi assumono record con campi presenti e tipi confrontabili.

```python
users = [
    {"name": "Luca", "age": 30},
    {"name": "Anna", "age": 24},
    {"name": "Lin", "age": 24},
]
ordered = sorted(users, key=lambda user: user["age"])
youngest = min(users, key=lambda user: user["age"], default=None)

print([user["name"] for user in ordered])  # ['Anna', 'Lin', 'Luca']
print(youngest["name"])                   # Anna
print(min([], key=lambda user: user["age"], default=None))  # None
```

`sorted` crea una lista nuova e conserva l'ordine degli elementi con chiavi uguali; i dizionari contenuti non vengono copiati. `min` sceglie il primo minimo incontrato. Senza `default`, `min` su un iterabile vuoto solleva `ValueError`.

### map, filter e comprehension

```python
numbers = [1, 2, 3, 4]
squares = list(map(lambda number: number * number, numbers))
even = list(filter(lambda number: number % 2 == 0, numbers))
squares_comprehension = [number * number for number in numbers]
even_comprehension = [number for number in numbers if number % 2 == 0]

print(squares, squares_comprehension)  # [1, 4, 9, 16] [1, 4, 9, 16]
print(even, even_comprehension)        # [2, 4] [2, 4]
```

`map` e `filter` producono iteratori lazy: qui vengono consumati da `list`. La comprehension di lista materializza subito il risultato. Scegli in base a leggibilita e consumo, non all'idea che lambda sia automaticamente una forma migliore.

## Esempio pratico

Ordinamento del report per priorita crescente e poi per titolo. La tupla della chiave viene confrontata da sinistra a destra.

```python
rows = [
    {"title": "backup", "priority": 3},
    {"title": "security patch", "priority": 1},
    {"title": "cleanup", "priority": 3},
]
rows_by_priority = sorted(rows, key=lambda row: (row["priority"], row["title"]))

print([row["title"] for row in rows_by_priority])
# ['security patch', 'backup', 'cleanup']
print([row["title"] for row in rows])
# ['backup', 'security patch', 'cleanup']
```

Il confronto dei titoli usa l'ordine ordinario delle stringhe, non un ordinamento linguistico locale. Per l'accesso diretto a campi esistono anche `operator.itemgetter` e `attrgetter`; una lambda resta utile quando la chiave richiede una piccola trasformazione.

## Varianti

### Closure e late binding

Una variabile libera viene letta quando si esegue la funzione, non congelata automaticamente quando si crea la lambda. Lo stesso vale per funzioni annidate definite con `def`.

```python
late = [lambda: index for index in range(3)]
bound = [lambda index=index: index for index in range(3)]

print([function() for function in late])   # [2, 2, 2]
print([function() for function in bound])  # [0, 1, 2]

state = []
read_state = lambda state=state: state
state.append("changed")
print(read_state())  # ['changed']
```

Il default `index=index` viene valutato alla creazione di ciascuna funzione. Conserva un riferimento, non una copia profonda: il caso con la lista mostra che il suo contenuto resta modificabile. Inoltre quel default e un parametro che il chiamante puo sostituire; non e una barriera di accesso.

Una factory con `def` puo essere piu chiara quando occorre catturare piu valori o validare la configurazione.

## Errori comuni

- Scrivere callback annidate troppo dense per evitare una funzione con nome.
- Passare il risultato di una chiamata invece della funzione richiesta.
- Aspettarsi che `lambda` congeli lo stato esterno o elimini gli effetti collaterali.
- Confondere una key con un comparatore.
- Ignorare chiavi mancanti, input vuoto o tipi incompatibili nell'ordinamento.
- Usare lambda per nascondere logica di business o gestione di risorse.

## Checklist

- Il corpo comunica immediatamente la trasformazione?
- La callback riceve gli argomenti previsti dall'API?
- Input vuoto e dati malformati sono gestiti al confine appropriato?
- La cattura delle variabili produce il valore voluto al momento della chiamata?
- Una funzione esistente, una comprehension o `def` sarebbe piu chiara?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Liste|Ordinamento e copie]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]

## Fonti

- [Python 3.12: lambda](https://docs.python.org/3.12/reference/expressions.html#lambda).
- [FAQ: late binding nelle closure](https://docs.python.org/3.12/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result).
- [Sorting HOWTO](https://docs.python.org/3.12/howto/sorting.html).
- [Funzioni built-in: map, filter e min](https://docs.python.org/3.12/library/functions.html).
