---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Sintassi e Variabili]
prerequisites: []
related: []
---

# Sintassi e Variabili in Python

## Sintesi

Python usa indentazione significativa, nomi leggibili e assegnazione dinamica. Le variabili sono riferimenti a oggetti, non contenitori tipizzati staticamente.

## Quando usarlo

Serve per leggere e scrivere qualsiasi codice Python: definire valori, capire scope, evitare errori di indentazione e distinguere nome, oggetto e tipo.

## Come funziona

In Python tutto e un oggetto. Una variabile e un nome collegato a un oggetto. Il tipo appartiene all'oggetto, non al nome.

Python e dinamicamente tipizzato, perche un nome puo puntare a oggetti di tipo diverso nel tempo. E anche fortemente tipizzato, perche non converte automaticamente tipi incompatibili in modo arbitrario.

L'indentazione definisce i blocchi: `if`, `for`, `while`, funzioni e classi non usano parentesi graffe.

## API / Sintassi

```python
name = "Luca"
age = 30
height = 1.75
is_active = True
missing_value = None
```

Assegnazione multipla:

```python
x, y = 10, 20
a = b = c = 0
```

Commenti e docstring:

```python
# Commento a riga singola

def greet(name):
    """Restituisce un saluto per name."""
    return f"Ciao {name}"
```

## Esempio pratico

```python
user_name = "Ada"
login_count = 3

if login_count > 0:
    message = f"{user_name} ha gia effettuato il login"
else:
    message = f"{user_name} non ha ancora effettuato il login"

print(message)
```

L'esempio mostra nomi in `snake_case`, indentazione a 4 spazi e string interpolation con f-string.

## Varianti

- Assegnazione semplice: `x = 1`.
- Assegnazione multipla: `x, y = y, x`.
- Annotazioni di tipo: `age: int = 30`.
- Costanti convenzionali: `MAX_RETRIES = 3`.
- Valore assente: `None`.
- Casting esplicito: `int("10")`, `str(10)`, `float("3.5")`.

## Errori comuni

- Mischiare tab e spazi.
- Usare nomi poco descrittivi.
- Confondere `None`, stringa vuota e zero.
- Sovrascrivere nomi built-in come `list`, `dict`, `str`.
- Pensare che `y = x` copi sempre l'oggetto.

## Checklist

- L'indentazione usa 4 spazi?
- I nomi seguono `snake_case`?
- I valori assenti sono rappresentati con `None`?
- Hai evitato nomi di built-in?
- Le conversioni di tipo sono esplicite?

## Collegamenti

- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
