---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [python, promemoria, json, csv]
aliases: [Cheatsheet JSON CSV Python]
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Gestione File]]"
  - "[[Programmazione/Python/Pagine/Standard Library]]"
---

# Python - JSON e CSV

## JSON da stringa

```python
import json

data = json.loads(text)
text = json.dumps(data)
```

## JSON formattato

```python
text = json.dumps(
    data,
    ensure_ascii=False,
    indent=2,
    sort_keys=True,
)
```

## Leggere un file JSON

```python
import json
from pathlib import Path

path = Path("data.json")

with path.open(encoding="utf-8") as file:
    data = json.load(file)
```

## Scrivere un file JSON

```python
with path.open("w", encoding="utf-8") as file:
    json.dump(data, file, ensure_ascii=False, indent=2)
```

## Gestire JSON non valido

```python
try:
    data = json.loads(text)
except json.JSONDecodeError as error:
    print(error.lineno, error.colno, error.msg)
```

## Leggere CSV

```python
import csv

with open("users.csv", newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    users = list(reader)
```

I valori letti dal CSV sono stringhe.

## Scrivere CSV

```python
fieldnames = ["id", "name"]

with open("users.csv", "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(users)
```

## Separatore personalizzato

```python
reader = csv.DictReader(file, delimiter=";")
```

## Approfondimento

- [[Programmazione/Python/Pagine/Gestione File]]
- [[Programmazione/Python/Pagine/Context Managers]]
- [[Programmazione/Python/Pagine/Standard Library]]
