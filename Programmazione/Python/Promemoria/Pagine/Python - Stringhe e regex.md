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
  - stringhe
  - regex
aliases:
  - Cheatsheet stringhe Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Standard Library]]"
title: Python - Stringhe e regex
---

# Python - Stringhe e regex

## Obiettivo

Consultare operazioni sul testo e regex senza ricostruire ogni volta sintassi, import e dati di esempio. Approfondimenti nei collegamenti.

## Quando usarlo

Metodi `str` per trasformazioni letterali; `re` per schemi di ricerca. Per JSON, CSV o date usa il parser del formato, non una regex come validatore completo.

## Procedura

1. Decidi se accettare testo Unicode o solo ASCII.
2. Distingui ricerca parziale da controllo dell'intera stringa.
3. Gestisci assenza di risultati e conserva il valore restituito.

Ogni blocco e autonomo. Baseline delle prove: **CPython 3.12.10**; `removeprefix` e `removesuffix` richiedono Python 3.9+.

## Snippet

### Accesso e slicing

```python
text = "Python"
print(len(text), text[0], text[-1])  # 6 P n
print(text[1:4], text[::-1])         # yth nohtyP
print(text[99:])                    # stringa vuota
```

`str` e immutabile. Un indice assente genera `IndexError`; `len` conta code point Unicode, non necessariamente caratteri visivi o byte.

### Maiuscole e confronto

```python
text = "hello PYTHON"
print(text.lower())  # hello python
print(text.upper())  # HELLO PYTHON
print(text.title())  # Hello Python
print("Stra\u00dfe".casefold() == "STRASSE".casefold())  # True
```

Per confronti senza distinzione maiuscole/minuscole valuta `casefold`; non effettua normalizzazione Unicode. `title` non e una regola affidabile per nomi propri.

### Spazi, prefissi e suffissi

```python
text = "  report.csv  "
print(repr(text.strip()))   # 'report.csv'
print(repr(text.lstrip()))  # 'report.csv  '
print(repr(text.rstrip()))  # '  report.csv'
print("pre_report.csv".removeprefix("pre_"))  # report.csv
print("report.csv".removesuffix(".csv"))     # report
```

`strip(chars)` elimina un insieme di caratteri alle estremita, non un prefisso/suffisso esatto. Le operazioni restituiscono un risultato senza modificare `text`.

### Cercare e sostituire

```python
text = "Python.py"
print(text.startswith("Py"), text.endswith(".py"))  # True True
print(text.find("th"), text.find("missing"))        # 2 -1
print(text.count("y"))                             # 2
changed = text.replace(".py", ".txt")
print(changed, text)                               # Python.txt Python.py
```

Non usare `if text.find(...)`: indice zero e falso, `-1` e vero. Per sola presenza usa `fragment in text`. `replace` sostituisce tutte le occorrenze, salvo limite `count`.

### Dividere e unire

```python
text = "  alpha \t beta  "
words = text.split()
fields = "a,,b,".split(",")
print(words)             # ['alpha', 'beta']
print(fields)            # ['a', '', 'b', '']
print(" ".join(words))   # alpha beta
```

`split()` compatta i separatori whitespace; con separatore esplicito mantiene i campi vuoti. `join` richiede stringhe. `split(",")` non gestisce il quoting CSV.

### Righe

```python
text = "first\r\nsecond\n"
lines = text.splitlines()
with_endings = text.splitlines(keepends=True)
print(lines)         # ['first', 'second']
print(with_endings)  # ['first\r\n', 'second\n']
```

`splitlines` non aggiunge una riga vuota per il solo terminatore finale; la stringa vuota produce `[]`.

### Formattazione

```python
name, count = "Ada", 3
price, number = 19.9, 7
message = f"Ciao {name}, hai {count} messaggi"
price_label = f"{price:.2f} EUR"
identifier = f"{number:04d}"
print(message)      # Ciao Ada, hai 3 messaggi
print(price_label)  # 19.90 EUR
print(identifier)   # 0007
```

La formattazione produce testo: non rende esatto un calcolo float e non effettua escaping SQL/HTML.

### Verifiche Unicode

```python
print("Python".isalpha())  # True
print("42".isdigit())     # True
print("api2".isalnum())    # True
print(" \t".isspace())     # True
print("\u00b2".isdigit())  # True: cifra in apice
print("".isdigit())       # False
```

Questi metodi non impongono ASCII. `isdigit` non garantisce che `int` accetti il testo: l'apice dell'esempio non e convertibile. Per numeri firmati/decimali usa un parser con gestione degli errori.

### Validare un identificatore ASCII

```python
import re

value = "User_42"
pattern = re.compile(r"[a-z0-9_-]+", re.IGNORECASE | re.ASCII)
is_valid = pattern.fullmatch(value) is not None
print(is_valid)  # True
```

Qui sono ammessi solo lettere ASCII, cifre, `_` e `-`, con almeno un carattere. `IGNORECASE` da solo estende `[a-z]` anche ad alcune lettere non ASCII. `fullmatch` controlla tutto il testo; non servono `^` e `$`.

### Cercare le corrispondenze

```python
import re

text = "id=12; next=7"
match = re.search(r"\d+", text)
first = match.group(0) if match else None
numbers = re.findall(r"\d+", text)
spans = [item.span() for item in re.finditer(r"\d+", text)]
print(first, numbers, spans)  # 12 ['12', '7'] [(3, 5), (12, 13)]
```

`search` cerca ovunque, `match` solo all'inizio. `\d` include cifre Unicode; usa `[0-9]` per ASCII. Con gruppi catturanti, `findall` restituisce gruppi o tuple invece del match completo.

### Gruppi nominati

```python
import re

value = "2024-02-29"
match = re.fullmatch(
    r"(?P<year>[0-9]{4})-(?P<month>[0-9]{2})-(?P<day>[0-9]{2})",
    value,
)
year = match.group("year") if match else None
parts = match.groupdict() if match else {}
print(year, parts)  # 2024 {'year': '2024', 'month': '02', 'day': '29'}
```

Questo controlla solo la forma: accetterebbe anche `2024-99-99`. Per verificare il calendario usa `date.fromisoformat`, gestendo `ValueError`.

### Sostituire spazi

```python
import re

text = "  alpha\t beta\n gamma  "
result = re.sub(r"\s+", " ", text).strip()
print(result)  # alpha beta gamma
```

`\s` comprende anche newline e whitespace Unicode: questa normalizzazione elimina la separazione in righe.

## Adattamenti comuni

### Testo letterale in una regex

```python
import re

needle = "a+b"
text = "a+b e aaab"
replacement = r"\1"
result = re.sub(re.escape(needle), lambda match: replacement, text)
print(result)  # \1 e aaab
```

`re.escape` riguarda il **pattern**, non il testo sostitutivo. La callback restituisce il rimpiazzo letterale, senza interpretarlo come riferimento a gruppi.

## Debug rapido

- `AttributeError` su `group`: la ricerca ha restituito `None`.
- `re.error`: pattern o riferimenti di sostituzione non validi.
- Match inattesi: controlla ASCII/Unicode, newline e gruppi catturanti.
- Pattern complessi su input non fidato: limita la dimensione e valuta il rischio di backtracking; `re` non offre un timeout per chiamata.

## Checklist finale

- Trasformazione letterale o regex? Stringhe o byte?
- Ricerca parziale oppure intero valore?
- Unicode, input vuoto e nessun match sono previsti?

## Collegamenti

- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library e parser]]
- [[Programmazione/Python/Promemoria/Pagine/Python - Numeri e date|Promemoria numeri e date]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: stringhe e metodi](https://docs.python.org/3.12/library/stdtypes.html#text-sequence-type-str).
- [Python 3.12: espressioni regolari](https://docs.python.org/3.12/library/re.html).
- [Python 3.12: mini-linguaggio di formattazione](https://docs.python.org/3.12/library/string.html#formatspec).
