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
  - numeri
  - date
aliases:
  - Cheatsheet numeri e date Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Standard Library]]"
title: Python - Numeri e date
---

# Python - Numeri e date

## Numeri

```python
int("42")
float("3.14")
round(3.14159, 2)
abs(-10)
min(values)
max(values)
sum(values)
pow(2, 8)
divmod(17, 5)
```

## Modulo `math`

```python
import math

math.floor(3.9)
math.ceil(3.1)
math.sqrt(16)
math.isclose(left, right)
math.isfinite(value)
```

## Decimali

```python
from decimal import Decimal

price = Decimal("19.90")
tax = Decimal("0.22")
total = price * (Decimal("1") + tax)
```

Creare `Decimal` da stringhe per evitare di importare approssimazioni `float`.

## Valori casuali

```python
import random

random.randint(1, 6)
random.choice(items)
random.shuffle(items)
```

Per token:

```python
import secrets

token = secrets.token_urlsafe(32)
```

## Data e ora correnti

```python
from datetime import datetime, timezone

now_utc = datetime.now(timezone.utc)
iso_value = now_utc.isoformat()
```

## Parsing

```python
from datetime import date, datetime

day = date.fromisoformat("2026-07-30")
instant = datetime.fromisoformat("2026-07-30T12:30:00+00:00")
```

## Formattazione

```python
label = instant.strftime("%d/%m/%Y %H:%M")
parsed = datetime.strptime("30/07/2026", "%d/%m/%Y")
```

## Durate

```python
from datetime import timedelta

tomorrow = day + timedelta(days=1)
expires_at = now_utc + timedelta(minutes=30)
```

## Fuso orario

```python
from zoneinfo import ZoneInfo

rome = now_utc.astimezone(ZoneInfo("Europe/Rome"))
```

## Timestamp

```python
timestamp = now_utc.timestamp()
restored = datetime.fromtimestamp(timestamp, tz=timezone.utc)
```

## Approfondimento

- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
