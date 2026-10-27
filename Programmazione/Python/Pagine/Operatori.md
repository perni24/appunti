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
  - Operatori
prerequisites: []
related: []
title: Operatori in Python
---

# Operatori in Python

## Sintesi

Gli operatori eseguono calcoli, confronti, test logici, di appartenenza e identita. Il risultato dipende anche dai tipi: **and/or restituiscono un operando**, mentre is verifica l'identita, non l'uguaglianza dei valori.

Baseline degli esempi: **CPython 3.12.10**, con i tipi standard indicati.

## Quando usarlo

Quando costruisci condizioni, calcoli dimensioni e intervalli o confronti oggetti. Per tipi personalizzati molti operatori possono avere implementazioni specifiche.

## Come funziona

Non esiste una regola unica per tutti i tipi: + somma numeri, ma concatena liste o stringhe. Con int e float, / produce un float; Decimal, Fraction, complex e classi personalizzate non seguono necessariamente quel tipo di risultato.

## API / Sintassi

Riferimento sintetico, non un blocco da eseguire:

```text
Aritmetica:       + - * / // % **
Confronto:        == != < <= > >=
Logica:           and or not
Appartenenza:     in not in
Identita:         is is not
Bitwise:          & | ^ ~ << >>
Assegnazione:     = += -= *= ...
Espressione:      :=
```

### Divisione, resto e precedenza

```python
print(7 / 2)       # 3.5
print(-7 // 2)     # -4
print(-7 % 2)      # 1
print(7.0 // 2)    # 3.0
print(-2 ** 2)     # -4
print((-2) ** 2)   # 4
```

La divisione // arrotonda verso meno infinito, non verso zero; un risultato matematicamente intero puo avere tipo float. Con interi e divisore non nullo vale a == (a // b) \* b + a % b.

Parentesi esplicite evitano dubbi. I confronti possono essere concatenati: 0 <= size < 100 esprime un intervallo e valuta size una volta.

### Logica e short-circuit

```python
label = ""
print(label or "senza titolo")  # senza titolo
print(label and len(label))    # stringa vuota, non False

limit = 0
print(limit or 100)             # 100
print(100 if limit is None else limit)  # 0
print(bool("False"))            # True
```

And valuta il secondo operando solo se il primo e truthy; or solo se il primo e falsy. Not restituisce un bool. Usare or per un default sostituisce anche zero, stringhe vuote e altre collezioni vuote: non e un controllo di sola assenza.

Un'espressione come email and "@" in email non e una validazione completa dell'email e non restituisce necessariamente un bool.

### Valore, identita e appartenenza

```python
first = [1, 2]
second = [1, 2]
alias = first
print(first == second)  # True
print(first is second)  # False
print(first is alias)   # True

record = {"name": "Ada"}
print("name" in record)  # True: chiavi, non valori
print("Ada" in record)   # False
```

Usa is None per l'assenza. Non usare is per stringhe o numeri confidando nell'interning. Per le liste, in cerca per uguaglianza; per dizionari e set servono chiavi hashable. Su iteratori, un test di appartenenza puo consumare elementi.

## Esempio pratico

Numero di pagine necessarie a contenere elementi, con una politica precisa: interi built-in, totale non negativo e dimensione positiva. I booleani vengono rifiutati anche se bool e una sottoclasse di int.

```python
def page_count(total_items, page_size):
    if type(total_items) is not int or type(page_size) is not int:
        raise TypeError("Counts must be integers")
    if total_items < 0 or page_size <= 0:
        raise ValueError("Invalid counts")

    return (total_items + page_size - 1) // page_size


print(page_count(25, 10))  # 3
print(page_count(0, 10))   # 0
```

La formula usa aritmetica intera, senza conversioni a float o dipendenze da un backend. I limiti massimi ammessi dall'applicazione sono una decisione ulteriore.

## Varianti

- += puo mutare una lista, ma riassegna un nuovo intero: non equivale sempre a una copia.
- & e | sono bitwise per interi; per set esprimono operazioni insiemistiche. Non sono sostituti generali di and/or e non fanno short-circuit.
- := assegna e restituisce un valore in un'espressione; usalo quando evita davvero una duplicazione.
- Float usa rappresentazioni finite: 0.1 + 0.2 non e esattamente 0.3. Valuta il contratto numerico, non arrotondamenti casuali.

## Errori comuni

- Confondere /, // e int(a / b), soprattutto con numeri negativi.
- Usare is al posto di ==.
- Interpretare stringhe come "False" tramite bool() per ottenere un flag.
- Fare membership su chiavi non hashable o su un iteratore che servira ancora.
- Affidare leggibilita a una lunga catena di precedenze implicite.

## Checklist

- Tipo degli operandi e del risultato noti.
- Valore e identita distinti.
- Default basato su falsy o soltanto su None?
- Gestiti zero, negativi e divisore nullo?
- Confronti numerici compatibili con precisione e dominio?

## Collegamenti

- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Strutture Condizionali|Strutture Condizionali]]
- [[Programmazione/Python/Pagine/Set|Set]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]

## Fonti

- [Python 3.12: espressioni, operatori e precedenza](https://docs.python.org/3.12/reference/expressions.html).
- [Python 3.12: tipi numerici e truth value testing](https://docs.python.org/3.12/library/stdtypes.html).
- [Python 3.12: assegnazione aumentata](https://docs.python.org/3.12/reference/simple_stmts.html#augmented-assignment-statements).
- [Python 3.12: limiti dell'aritmetica floating point](https://docs.python.org/3.12/tutorial/floatingpoint.html).

## Navigazione

- [[Programmazione/Python/Indice Python|Indice Python]]
