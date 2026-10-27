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
  - Comprehensions
prerequisites: []
related: []
title: Comprehensions in Python
---

# Comprehensions in Python

## Sintesi

Le comprehensions costruiscono liste, set e dizionari combinando **trasformazione, iterazione e filtri**. Una generator expression usa una forma simile ma produce un iteratore lazy, non una collezione gia materializzata.

Baseline delle prove: **CPython 3.12.10**, non una raccomandazione su quale patch installare.

## Quando usarlo

Per trasformazioni brevi con un risultato chiaro. Preferisci un ciclo normale quando servono gestione di errori per elemento, logging, molte condizioni o aggiornamenti con effetti esterni.

## Come funziona

Le clausole si leggono come cicli annidati da sinistra a destra. Il filtro decide se produrre un elemento; l'espressione iniziale calcola il valore soltanto per gli elementi che passano i filtri.

- Una list comprehension conserva ordine di visita e duplicati.
- Un set elimina gli elementi uguali e non garantisce ordine.
- Un dict conserva l'ordine di prima inserzione delle chiavi; se una chiave ricompare, l'ultimo valore vince.
- Nessuna delle tre forme copia profondamente gli oggetti prodotti o valida automaticamente l'input.

## API / Sintassi

### Trasformazione, filtro e condizione

```python
numbers = [-2, -1, 0, 1, 2]
squares = [value * value for value in numbers]
even_numbers = [value for value in numbers if value % 2 == 0]
labels = ["even" if value % 2 == 0 else "odd" for value in numbers]

print(squares)  # [4, 1, 0, 1, 4]
print(even_numbers)  # [-2, 0, 2]
print(labels)  # ['even', 'odd', 'even', 'odd', 'even']
```

L'if finale filtra e puo ridurre il numero di risultati; `a if condition else b` nell'espressione sceglie un valore per ogni elemento. Non sono intercambiabili.

### Dizionari e set con input completo

```python
names = ["Ada", "Lin", "Ada"]
lengths = {name: len(name) for name in names}
unique_lengths = {len(name) for name in names}
print(lengths)  # {'Ada': 3, 'Lin': 3}
print(unique_lengths)  # {3}

pairs = [("mode", "draft"), ("mode", "ready")]
last_value = {key: value for key, value in pairs}
print(last_value)  # {'mode': 'ready'}
```

Le chiavi del dict e gli elementi del set devono essere hashable. Per rifiutare duplicati invece di sovrascriverli, usa un controllo esplicito come nella nota Dizionari.

### Piu cicli e scope

```python
rows = [[1, 2], [], [3]]
flattened = [value for row in rows for value in row]
print(flattened)  # [1, 2, 3]

x = "outside"
doubled = [x * 2 for x in range(3)]
print(doubled, x)  # [0, 2, 4] outside
```

Il primo for e quello esterno. L'esempio appiattisce **un solo livello**, non una struttura ricorsiva generica. Le variabili di iterazione non sovrascrivono i binding esterni. In CPython 3.12 le comprehensions list/set/dict sono inline, ma mantengono questo isolamento; non descriverle come funzioni annidate obbligatorie a runtime.

## Esempio pratico

### Etichette attive con politica di scarto

Input: iterabile finito di record. Si scartano i non-dict, active diverso dal booleano True, label non testuali e label vuote dopo strip. Ordine e duplicati delle etichette valide vengono conservati.

```python
def active_labels(records):
    return [
        record["label"].strip()
        for record in records
        if isinstance(record, dict)
        and record.get("active") is True
        and isinstance(record.get("label"), str)
        and record["label"].strip()
    ]


records = [
    {"label": " Python ", "active": True},
    {"label": "Rust", "active": False},
    {"label": "   ", "active": True},
    {"label": 42, "active": True},
    None,
    {"label": "Python", "active": True},
]
print(active_labels(records))  # ['Python', 'Python']
```

E un filtro locale su dati ordinari, non una validazione completa con errori riportati. La scartatura e intenzionale: in un import dove non puoi perdere record, usa una funzione/ciclo che segnali gli errori.

L'esempio non usa piu indirizzi email come testo da trasformare indistintamente in minuscolo: strip/lower non sono una validazione email e la normalizzazione richiede una politica propria.

### Estensioni di nomi file

```python
from pathlib import PurePosixPath

files = ["notes.MD", "photo.png", "README", ".env", "archive.tar.gz"]
suffixes = [PurePosixPath(name).suffix.lower() for name in files]
extensions = {suffix for suffix in suffixes if suffix}
print(sorted(extensions))  # ['.gz', '.md', '.png']
```

La convenzione qui e "ultimo suffisso, punto incluso, in minuscolo" per nomi con sintassi POSIX. Nessun accesso al filesystem: PurePosixPath lavora sul testo. Non rileva MIME o sicurezza di un file, non conserva l'intera catena .tar.gz e non interpreta percorsi Windows. Nella baseline 3.12 .env e README non hanno suffisso.

## Varianti

### Generator expression

```python
numbers = [1, 2, 3]
squares = (value * value for value in numbers)

print(next(squares))  # 1
print(list(squares))  # [4, 9]
print(list(squares))  # []
print(sum(value * value for value in numbers))  # 14
```

Il generatore e monouso: calcola al consumo e non memorizza tutti i risultati. Conserva pero riferimenti e stato, quindi "lazy" non significa memoria nulla. `tuple(value * value for value in numbers)` lo consuma per produrre una tupla.

L'espressione iterabile del **primo for** viene valutata subito; corpo, filtri e iterazioni successive vengono valutati durante il consumo. Quindi non tutti gli errori sono rinviati, e variabili esterne lette nel corpo possono avere un valore diverso quando si consuma il generatore.

### Closure: la variabile non e congelata

```python
late = [lambda: value for value in range(3)]
bound = [lambda value=value: value for value in range(3)]
print([function() for function in late])  # [2, 2, 2]
print([function() for function in bound])  # [0, 1, 2]
```

Nel secondo caso il default viene valutato a ogni creazione della lambda. Non e una copia profonda dell'oggetto catturato. L'operatore walrus ha regole di binding proprie: non estendere l'isolamento della variabile del for a qualsiasi assegnazione dentro una comprehension.

## Errori comuni

- Usare numbers, names o files senza definirli nell'esempio copiato.
- Scrivere una comprehension soltanto per print, append o altri effetti.
- Confondere parentesi tonde con una tuple comprehension.
- Supporre che la nuova lista contenga copie indipendenti dei record.
- Dimenticare che set e dict possono perdere duplicati.
- Aspettarsi che un generatore possa essere consumato due volte.
- Considerare una comprehension fallita una transazione: effetti gia prodotti non vengono annullati.

## Checklist

- Input, ordine e politica sui duplicati sono espliciti?
- La logica resta piu leggibile di un ciclo?
- Serve una collezione completa oppure un iteratore lazy?
- I dati scartati possono essere persi senza segnalazione?
- Scope, variabili catturate e momento della valutazione sono corretti?

## Collegamenti

- [[Programmazione/Python/Pagine/Cicli|Cicli]]
- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Dizionari|Dizionari]]
- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]

## Fonti

- [Python 3.12: comprehensions e generator expressions](https://docs.python.org/3.12/reference/expressions.html#displays-for-lists-sets-and-dictionaries).
- [Python 3.12: esempi di list comprehension](https://docs.python.org/3.12/tutorial/datastructures.html#list-comprehensions).
- [PEP 709: inlining in CPython 3.12 e isolamento delle variabili](https://peps.python.org/pep-0709/).
- [Python 3.12: PurePath.suffix](https://docs.python.org/3.12/library/pathlib.html#pathlib.PurePath.suffix).
- [Python 3.12: late binding nelle closure](https://docs.python.org/3.12/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
