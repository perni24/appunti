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

## Stringhe

```python
text = "Python"

len(text)
text[0]
text[-1]
text[1:4]
text[::-1]
```

## Metodi principali

```python
text.lower()
text.upper()
text.title()
text.strip()
text.lstrip()
text.rstrip()
text.startswith("Py")
text.endswith(".py")
text.find("th")
text.count("o")
text.replace("old", "new")
text.split(",")
" ".join(words)
```

Le stringhe sono immutabili.

## Formattazione

```python
message = f"Ciao {name}, hai {count} messaggi"
price_label = f"{price:.2f} EUR"
identifier = f"{number:04d}"
```

## Righe

```python
lines = text.splitlines()
```

## Verifiche

```python
text.isalpha()
text.isdigit()
text.isalnum()
text.isspace()
```

## Espressioni regolari

```python
import re

pattern = re.compile(r"^[a-z0-9_-]+$", re.IGNORECASE)
is_valid = pattern.fullmatch(value) is not None
```

## Cercare

```python
match = re.search(r"\d+", text)
value = match.group(0) if match else None
```

```python
numbers = re.findall(r"\d+", text)
matches = list(re.finditer(r"\d+", text))
```

## Gruppi nominati

```python
match = re.fullmatch(
    r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})",
    value,
)

year = match.group("year") if match else None
```

## Sostituire

```python
result = re.sub(r"\s+", " ", text).strip()
```

## Approfondimento

- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
