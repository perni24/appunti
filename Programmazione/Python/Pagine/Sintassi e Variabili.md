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
  - Sintassi e Variabili
prerequisites: []
related: []
title: Sintassi e Variabili in Python
---

# Sintassi e Variabili in Python

## Sintesi

Un nome Python viene associato a un oggetto: **assegnare un nome non significa copiare l'oggetto**. Il tipo appartiene all'oggetto; lo stesso nome puo essere riassegnato a un valore di altro tipo.

Baseline degli esempi: **CPython 3.12.10**.

## Quando usarlo

Per capire indentazione, assegnazioni, alias, mutabilita e visibilita dei nomi prima di lavorare con funzioni o collezioni complesse.

## Come funziona

L'indentazione delimita i blocchi di if, cicli, funzioni e classi. Usa quattro spazi per livello come convenzione di stile; evita di mescolare tab e spazi. Le parentesi tonde permettono di continuare un'espressione su piu righe senza backslash.

La tipizzazione dinamica non significa che ogni conversione sia automatica: sommare una stringa e un intero causa TypeError, mentre int e float possono partecipare alla stessa somma numerica.

Numeri e stringhe sono immutabili; liste e dizionari sono mutabili. Una tupla puo contenere una lista mutabile: immutabilita del contenitore non equivale a immutabilita di tutto il grafo.

## API / Sintassi

### Nomi, valori e unpacking

```python
name = "Ada"
age = 30
height = 1.75
is_active = True
missing_value = None

x, y = 10, 20
x, y = y, x
print(x, y)  # 20 10
```

L'assegnazione multipla richiede un numero compatibile di elementi, salvo un target con asterisco. A = B = valore collega entrambi i nomi al medesimo risultato.

### Commenti e docstring

```python
def greet(name):
    """Restituisce un saluto senza modificare dati esterni."""
    return f"Ciao {name}"


print(greet("Ada"))  # Ciao Ada
```

Un commento inizia con #. Una docstring e una stringa nella prima istruzione del modulo, della classe o della funzione; non ogni stringa tra triple virgolette e un commento. Le f-string valutano le espressioni quando vengono eseguite, non restano collegate ai nomi.

## Esempio pratico

### Alias e riassegnazione

```python
original = ["uno"]
alias = original
alias.append("due")
print(original)  # ['uno', 'due']

alias = ["altro"]
print(original)  # ['uno', 'due']
print(alias is original)  # False
```

Append modifica l'oggetto condiviso. L'ultima assegnazione cambia solo il binding di alias. Anche una copia superficiale conserva riferimenti agli oggetti annidati:

```python
rows = [["iniziale"]]
copied = rows.copy()
copied[0].append("aggiunto")
print(rows)  # [['iniziale', 'aggiunto']]
print(copied is rows)  # False
```

### Scope e nomi locali

Per funzioni ordinarie, il modello LEGB aiuta a ricordare la ricerca dei nomi: Local, Enclosing, Global del modulo, Built-in. Classi e comprehensions hanno regole aggiuntive; non applicare il modello come formula universale.

If e for non creano un nuovo scope locale. Una funzione, invece, considera locale un nome assegnato nel suo corpo, salvo global/nonlocal.

```python
count = 10


def increment_bad():
    count += 1
    return count


def increment(value):
    return value + 1


print(increment(count))  # 11
print(count)  # 10
```

Il demo non chiama increment_bad: chiamarla produce **UnboundLocalError**, perche legge il count locale prima che sia associato a un valore. Una variabile definita solo dentro un ramo if puo allo stesso modo non esistere quando quel ramo non viene eseguito.

### Valori e annotazioni non sono la stessa cosa

```python
declared_age: int = "30"
print(type(declared_age).__name__)  # str
```

Questo e un controesempio intenzionale per un type checker: l'interprete non impone int e non converte la stringa. Per convertire un input usa una funzione come int(), gestendo gli errori e definendo quali formati accettare.

## Varianti

- Nomi snake_case; MAIUSCOLE per costanti convenzionali, non protette dall'interprete.
- None rappresenta assenza quando il contratto lo prevede; non sostituisce automaticamente zero o stringa vuota.
- global riassegna un nome del modulo; nonlocal uno di una funzione esterna. Preferisci parametri e ritorni quando bastano.
- del rimuove un binding o un elemento, non garantisce la distruzione immediata dell'oggetto.

## Errori comuni

- Creare liste condivise con left = right = [] credendo di averne due.
- Sovrascrivere nomi built-in come list, str o dict.
- Usare un nome dopo un ramo che potrebbe non averlo definito.
- Confondere type hint, conversione e validazione.
- Aspettarsi una copia profonda da assegnazione o list.copy().

## Checklist

- Indentazione e nomi coerenti.
- Binding e mutazione distinti.
- Copia superficiale sufficiente per i dati usati?
- Tutti i percorsi assegnano i nomi che verranno letti?
- Input convertiti e controllati, non soltanto annotati?

## Collegamenti

- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Liste|Liste]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Data model|Data model]]

## Fonti

- [Python 3.12: nomi e scope](https://docs.python.org/3.12/reference/executionmodel.html).
- [Python 3.12: oggetti, identita e mutabilita](https://docs.python.org/3.12/reference/datamodel.html).
- [Python 3.12: indentazione e righe logiche](https://docs.python.org/3.12/reference/lexical_analysis.html).
- [Python 3.12: assegnazioni e annotazioni](https://docs.python.org/3.12/reference/simple_stmts.html).
- [Python 3.12: type hint non imposti dal runtime](https://docs.python.org/3.12/library/typing.html).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
