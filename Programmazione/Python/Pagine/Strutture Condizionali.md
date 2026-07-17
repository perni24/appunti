---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Strutture Condizionali]
prerequisites: []
related: []
---

# Strutture Condizionali in Python

## Sintesi

Le strutture condizionali controllano il flusso del programma usando `if`, `elif`, `else`, espressioni condizionali e `match`.

## Quando usarlo

Usale quando il codice deve scegliere percorsi diversi in base a stato, input, errori, permessi o risultati di calcoli.

## Come funziona

Python valuta una condizione come vera o falsa. Oltre a `True` e `False`, valori come `None`, `0`, stringhe vuote e collezioni vuote sono falsy.

`match` permette pattern matching strutturale, utile quando vuoi distinguere forme diverse di dati.

## API / Sintassi

```python
if age < 18:
    status = "minor"
elif age < 65:
    status = "adult"
else:
    status = "senior"
```

Espressione condizionale:

```python
label = "attivo" if is_active else "disattivato"
```

`match`:

```python
match status_code:
    case 200:
        message = "ok"
    case 400 | 404:
        message = "client error"
    case _:
        message = "unknown"
```

## Esempio pratico

```python
def can_access(user):
    if not user:
        return False

    if not user.get("active"):
        return False

    return user.get("role") in {"admin", "editor"}
```

## Varianti

- `if`.
- `if`/`else`.
- `if`/`elif`/`else`.
- Espressione condizionale inline.
- `match`/`case`.
- Guard clauses con ritorni anticipati.

## Errori comuni

- Scrivere `if value == True` invece di `if value`.
- Confondere valore mancante e valore vuoto.
- Annidare troppe condizioni.
- Usare espressioni condizionali troppo lunghe.
- Dimenticare il caso di default in `match`.

## Checklist

- I casi sono mutuamente esclusivi?
- Il caso default e gestito?
- Le condizioni sono leggibili?
- I valori falsy sono desiderati?
- Puoi usare guard clauses per semplificare?

## Collegamenti

- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
