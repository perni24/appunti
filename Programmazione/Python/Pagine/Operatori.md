---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Operatori]
prerequisites: []
related: []
---

# Operatori in Python

## Sintesi

Gli operatori eseguono calcoli, confronti, combinazioni logiche, test di appartenenza e test di identita.

## Quando usarlo

Servono in espressioni, condizioni, cicli, calcoli, filtri e manipolazione di collezioni.

## Come funziona

Gli operatori producono valori. Alcuni restituiscono numeri, altri booleani, altri oggetti. `==` confronta valori; `is` confronta identita dell'oggetto.

Gli operatori logici fanno short-circuit: `and` e `or` possono non valutare il secondo operando se il risultato e gia determinato.

## API / Sintassi

```python
total = price * quantity
is_adult = age >= 18
is_valid = email and "@" in email
```

Operatori principali:

```python
+ - * / // % **
== != < <= > >=
and or not
in not in
is is not
```

## Esempio pratico

```python
items = ["book", "pen"]
user = {"active": True, "age": 21}

can_buy = user["active"] and user["age"] >= 18 and "book" in items

if can_buy:
    print("Acquisto consentito")
```

## Varianti

- Aritmetici: `+`, `-`, `*`, `/`, `//`, `%`, `**`.
- Confronto: `==`, `!=`, `<`, `>`, `<=`, `>=`.
- Logici: `and`, `or`, `not`.
- Appartenenza: `in`, `not in`.
- Identita: `is`, `is not`.
- Bitwise: `&`, `|`, `^`, `~`, `<<`, `>>`.

## Errori comuni

- Usare `is` per confrontare stringhe o numeri invece di `==`.
- Dimenticare che `/` restituisce sempre `float`.
- Scrivere condizioni troppo dense senza parentesi.
- Confondere `and/or` logici con `&/|` bitwise.
- Non considerare truthy/falsy.

## Checklist

- Stai confrontando valore (`==`) o identita (`is`)?
- La precedenza e chiara o servono parentesi?
- La divisione deve essere reale o intera?
- Il test `in` lavora su una collezione efficiente?
- La condizione resta leggibile?

## Collegamenti

- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/Python/Pagine/Set|Set]]
