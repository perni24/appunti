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
  - sintassi
aliases:
  - Cheatsheet sintassi Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Sintassi e Variabili]]"
  - "[[Programmazione/Python/Pagine/Operatori]]"
title: Python - Sintassi essenziale
---

# Python - Sintassi essenziale

## Obiettivo

Ritrovare la sintassi di base senza rileggere la teoria. Gli snippet sono autonomi e usano solo la standard library; i commenti indicano i risultati attesi.

Baseline verificata: **CPython 3.12.10**. Il blocco `match` richiede Python 3.10 o successivo.

## Quando usarlo

Per assegnazioni, conversioni, condizioni, cicli e unpacking. Per il comportamento dei tipi: [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]].

## Procedura

Scegli il blocco, sostituisci i dati di esempio e controlla la nota sotto lo snippet. Quattro spazi per ogni livello di indentazione; non mescolare tab e spazi.

## Snippet

### Variabili e tipi

```python
name = "Ada"
count = 0
active = True
value = None

print(type(value).__name__)            # NoneType
print(isinstance(name, str))           # True
print(isinstance(count, (int, float)))  # True
print(isinstance(True, int))           # True
print(type(True) is int)               # False
```

`isinstance` include le sottoclassi; `bool` e sottoclasse di `int`. `type(value) is int` controlla il tipo esatto.

### Assegnazione e alias

```python
items = ["a"]
alias = items
alias.append("b")
print(items)  # ['a', 'b']

alias = ["c"]
print(items)  # ['a', 'b']
print(alias)  # ['c']
```

Assegnare non copia l'oggetto; riassegnare un nome non modifica l'oggetto precedente.

### Conversioni

```python
print(str(42))        # 42, come stringa
print(int("42"))      # 42, come intero
print(float("3.14"))  # 3.14
print(bool(""))      # False
print(bool("False")) # True

values = [1, 2, 2]
copied = list(values)
as_tuple = tuple(values)
unique = set(values)
print(as_tuple)       # (1, 2, 2)
print(sorted(unique))  # [1, 2]
```

`bool` non interpreta flag testuali. `int("3.14")` solleva `ValueError`; `int(3.9)` tronca verso zero. Le conversioni consumano un eventuale iteratore; `list` non copia ricorsivamente gli oggetti annidati.

### Confronti e assenza

```python
value, expected = 42, 42
minimum, maximum = 0, 100
missing = None

print(value == expected)           # True
print(value != expected)           # False
print(minimum <= value <= maximum) # True
print(missing is None)             # True
print(value is not None)           # True
print(value in [10, 42])           # True
```

`==` confronta valori; `is` identita. Per l'assenza usa `is None`, non `is` per stringhe o numeri. Teoria: [[Programmazione/Python/Pagine/Operatori|Operatori]].

### Condizioni e scelta di un valore

```python
score = 75
if score >= 90:
    result = "A"
elif score >= 60:
    result = "B"
else:
    result = "C"
print(result)  # B

active = False
status = "online" if active else "offline"
print(status)  # offline
```

### Logica e default

```python
limit = 0
print(limit or 100)                     # 100
print(100 if limit is None else limit)  # 0
print("" and "ready")                   # stringa vuota
print(not [])                          # True
```

`and` e `or` restituiscono un operando e fanno short-circuit; `not` restituisce un booleano. Usa `is None` quando zero e vuoti sono valori validi.

### For ed enumerate

```python
items = ["a", "b"]
for item in items:
    print(item)  # a, poi b

for index, item in enumerate(items, start=1):
    print(index, item)  # 1 a, poi 2 b
```

### Intervalli con range

```python
for number in range(1, 6, 2):
    print(number)  # 1, 3, 5
```

Il limite finale e escluso; `range` non costruisce una lista completa.

### While con avanzamento

```python
attempts = 0
limit = 3
while attempts < limit:
    attempts += 1
print(attempts)  # 3
```

La condizione deve poter diventare falsa: questo e un contatore, non una procedura di retry di rete.

### Continue, break ed else del ciclo

```python
items = [None, 3, 0, 8]
for item in items:
    if item is None:
        continue
    if item % 2 == 0:
        found = item
        break
else:
    found = None
print(found)  # 0
```

`else` si esegue all'esaurimento normale del ciclo, anche vuoto, non dopo `break`. Teoria e altri casi: [[Programmazione/Python/Pagine/Cicli|Cicli]].

### Unpacking

```python
first, second = (10, 20)
head, *middle, tail = [1, 2, 3, 4]
print(first, second)  # 10 20
print(head, middle, tail)  # 1 [2, 3] 4
```

Senza `*` il numero di elementi deve corrispondere; lo starred target raccoglie una lista, anche vuota.

### Espansione in liste e dizionari

```python
defaults = {"timeout": 10, "retries": 2}
options = {"timeout": 5}
merged = {**defaults, **options}

first_list = [1, 2]
second_list = [3]
combined = [*first_list, *second_list]

print(merged)    # {'timeout': 5, 'retries': 2}
print(combined)  # [1, 2, 3]
```

Nel dizionario vince la chiave piu a destra. Si creano nuovi contenitori, non copie profonde; nelle chiamate a funzione le keyword duplicate sono invece un errore.

### Walrus operator

```python
import re

pattern = re.compile(r"\d+")
text = "ordine 42"
if (match := pattern.search(text)) is not None:
    print(match.group())  # 42
```

`:=` assegna e restituisce il valore; qui le parentesi separano l'assegnazione dal confronto con `None`. Sintassi disponibile da Python 3.8.

### Pattern matching

```python
status_code = 404
match status_code:
    case 200:
        result = "ok"
    case 404:
        result = "not found"
    case _:
        result = "error"
print(result)  # not found
```

`case nome:` cattura un valore, non confronta con una normale variabile omonima. Per pattern strutturali e guardie: [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]].

## Adattamenti comuni

- Liste, tuple e set: [[Programmazione/Python/Promemoria/Pagine/Python - Liste tuple e set|promemoria dedicato]].
- Firma e chiamata di una funzione: [[Programmazione/Python/Promemoria/Pagine/Python - Funzioni|Funzioni]].
- Comprehension e iteratori: [[Programmazione/Python/Promemoria/Pagine/Python - Comprehension iteratori e generatori|snippet dedicati]].

## Debug rapido

- `NameError`: definisci il nome prima dell'uso.
- `ValueError` in conversione/unpacking: verifica formato e numero di elementi.
- `bool("False")` e vero: una stringa non vuota non e un booleano parsato.
- Default che sostituisce `0`: verifica se volevi controllare soltanto `None`.
- Ciclo infinito: controlla avanzamento e condizione d'uscita.

## Checklist finale

- Input definiti e indentazione coerente?
- Assenza distinta da zero e vuoti?
- Copia, alias e consumo degli iteratori intenzionali?
- Versione Python compatibile con lo snippet?

## Collegamenti

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/Python/Pagine/Cicli|Cicli]]
- [[Programmazione/Python/Pagine/Comandi base|Comandi base]]

## Fonti

- [Python 3.12: controllo del flusso](https://docs.python.org/3.12/tutorial/controlflow.html).
- [Python 3.12: verita e operatori booleani](https://docs.python.org/3.12/library/stdtypes.html#truth-value-testing).
- [Python 3.12: funzioni built-in](https://docs.python.org/3.12/library/functions.html).
- [Python 3.12: espressioni di assegnazione](https://docs.python.org/3.12/reference/expressions.html#assignment-expressions).
