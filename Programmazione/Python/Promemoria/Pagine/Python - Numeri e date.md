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

## Obiettivo

Promemoria per conversioni, arrotondamenti, casualita, date e fusi orari. Esempi brevi; modelli e limiti estesi nelle note collegate.

## Quando usarlo

Per calcoli comuni e manipolazione di date. Distingui numeri approssimati da decimali, date di calendario da istanti e durata trascorsa da orario locale.

## Procedura

1. Definisci formato, unita, precisione e fuso dei dati.
2. Gestisci parsing fallito, valori non finiti e input vuoti.
3. Usa UTC per calcoli tra istanti; un orologio monotono per misurare esecuzioni.

Ogni blocco Python e autonomo. Baseline: **CPython 3.12.10**; per `Europe/Rome` serve il database IANA, provato con `tzdata 2026.5`. Se manca, installa `tzdata` nel virtualenv del progetto:

```text
python -m pip install tzdata
```

## Snippet

### Conversioni e aggregazioni

```python
values = [2, 4, 6]
print(int("42"), float("3.14"), abs(-10))  # 42 3.14 10
print(min(values), max(values), sum(values))  # 2 6 12
print(pow(2, 8), divmod(17, 5))              # 256 (3, 2)
```

`int("3.14")` genera `ValueError`; `int(3.9)` tronca verso zero. `min` e `max` su un iterabile vuoto richiedono un default o generano `ValueError`; `sum([])` vale zero.

### Arrotondare float

```python
print(round(3.14159, 2))     # 3.14
print(round(2.5), round(3.5))  # 2 4
print(round(2.675, 2))       # 2.67
```

Nei pareggi esatti `round` sceglie il pari. Le frazioni decimali non sempre sono rappresentabili come float: il terzo risultato non e un errore di Python.

### Funzioni math

```python
import math

print(math.floor(-3.1), math.ceil(-3.1))  # -4 -3
print(math.sqrt(16))                     # 4.0
```

`floor` va verso meno infinito, `ceil` verso piu infinito; non equivalgono al troncamento. `sqrt` su un numero reale negativo genera `ValueError`.

### Confronto tollerante e valori finiti

```python
import math

left, right = 0.1 + 0.2, 0.3
print(left == right)  # False
print(math.isclose(left, right, rel_tol=1e-9))  # True
print(math.isclose(1e-12, 0.0, abs_tol=1e-9))   # True
print(math.isfinite(float("nan")))             # False
```

Scegli tolleranze in base al problema: vicino a zero serve una tolleranza assoluta adeguata. `float` accetta anche NaN e infinito; conversione riuscita non significa numero finito.

### Decimali e arrotondamento

```python
from decimal import Decimal, ROUND_HALF_UP, localcontext

with localcontext() as context:
    context.prec = 28
    price = Decimal("19.90")
    rate = Decimal("0.22")
    total = price * (Decimal("1") + rate)
    rounded = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

print(total, rounded)  # 24.2780 24.28
```

Parti da stringhe, non da float. `ROUND_HALF_UP` e una scelta esplicita del demo, non una regola universale; precisione, arrotondamento e controllo dei valori finiti restano responsabilita dell'applicazione.

### Valori pseudocasuali

```python
import random

rng = random.Random(42)
items = ["a", "b", "c"]
roll = rng.randint(1, 6)
selected = rng.choice(items)
result = rng.shuffle(items)

print(1 <= roll <= 6, selected in items, result is None)  # True True True
```

`randint` include entrambi gli estremi; `choice` richiede una sequenza non vuota; `shuffle` modifica in place. L'istanza con seed isola il demo e lo rende ripetibile sulla baseline, ma non e adatta a segreti.

### Token casuali

```python
import secrets

token = secrets.token_urlsafe(32)
print(isinstance(token, str))  # True
```

`32` indica i byte casuali, non il numero di caratteri. Non stampare o registrare token reali; generarlo non implementa scadenza, autenticazione o revoca.

### Data e ora correnti

```python
from datetime import datetime, timezone

now_utc = datetime.now(timezone.utc)
iso_value = now_utc.isoformat()
print(now_utc.utcoffset().total_seconds())  # 0.0
print(datetime.fromisoformat(iso_value) == now_utc)  # True
```

`datetime.now()` senza fuso produce un valore naive; non rappresenta automaticamente UTC.

### Parsing ISO

```python
from datetime import date, datetime

day = date.fromisoformat("2024-02-29")
text = "2024-07-01T12:30:00+00:00"
instant = datetime.fromisoformat(text)
if instant.utcoffset() is None:
    raise ValueError("An explicit UTC offset is required")

print(day, instant.isoformat())  # 2024-02-29 2024-07-01T12:30:00+00:00
```

Formati e date invalidi generano `ValueError`. `fromisoformat` accetta piu forme della sola grafia mostrata: non e un validatore rigoroso di uno specifico protocollo. Un offset fisso non identifica un fuso IANA.

### Formattazione e formato noto

```python
from datetime import datetime, timezone

instant = datetime(2024, 7, 1, 12, 30, tzinfo=timezone.utc)
label = instant.strftime("%d/%m/%Y %H:%M %z")
parsed = datetime.strptime("30/07/2026", "%d/%m/%Y").date()

print(label)   # 01/07/2024 12:30 +0000
print(parsed)  # 2026-07-30
```

Senza `%z`, `strptime` produce un datetime naive; qui interessa solo la data. Nomi di mesi/giorni e alcune direttive dipendono da locale e piattaforma.

### Durate

```python
from datetime import date, datetime, timedelta, timezone

day = date(2024, 2, 29)
tomorrow = day + timedelta(days=1)
start = datetime(2024, 7, 1, 12, tzinfo=timezone.utc)
expires_at = start + timedelta(minutes=30)
elapsed = expires_at - start

print(tomorrow)                 # 2024-03-01
print(elapsed.total_seconds())  # 1800.0
```

`timedelta` non rappresenta mesi di calendario. `.seconds` e solo la componente dei secondi: usa `total_seconds()` per la durata completa, anche negativa.

### Fusi orari

```python
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

instant = datetime(2024, 7, 1, 12, tzinfo=timezone.utc)
rome = instant.astimezone(ZoneInfo("Europe/Rome"))
print(rome.isoformat())  # 2024-07-01T14:00:00+02:00
```

`astimezone` conserva l'istante; `replace(tzinfo=...)` non converte l'ora. Ore locali ambigue/inesistenti richiedono una politica; per durate attraverso cambi d'ora converti in UTC prima di sottrarre. Vedi la teoria su `fold` e DST.

### Timestamp

```python
from datetime import datetime, timezone

instant = datetime(2024, 7, 1, 12, tzinfo=timezone.utc)
timestamp = instant.timestamp()
restored = datetime.fromtimestamp(timestamp, tz=timezone.utc)
print(restored == instant)  # True
```

Il timestamp POSIX e in **secondi**, non millisecondi. Senza `tz`, `fromtimestamp` restituisce l'ora locale naive; sui naive, `timestamp` assume l'ora locale.

## Adattamenti comuni

### Misurare un intervallo

```python
from time import perf_counter

start = perf_counter()
result = sum(range(1000))
elapsed = perf_counter() - start
print(result, elapsed >= 0)  # 499500 True
```

`perf_counter` serve per differenze temporali, non per date o timestamp persistenti. Questo esempio mostra l'API, non e un benchmark attendibile.

## Debug rapido

- `ValueError` nel parsing: controlla formato, separatore decimale e calendario.
- `TypeError` fra datetime: non mischiare naive e aware nei confronti d'ordine o nelle sottrazioni.
- `ZoneInfoNotFoundError`: verifica il nome del fuso e la presenza di dati IANA/tzdata.
- Scarto di un'ora: controlla DST e differenza fra durata UTC e calendario locale.

## Checklist finale

- Float o Decimal? Politica di arrotondamento esplicita?
- Casualita per simulazione o per segreti?
- Data, istante o durata? Secondi o millisecondi? Fuso noto?

## Collegamenti

- [[Programmazione/Python/Pagine/Standard Library|Standard Library: datetime, zoneinfo e orologi]]
- [[Programmazione/Python/Pagine/Sintassi e Variabili|Sintassi e Variabili]]
- [[Programmazione/Python/Pagine/Operatori|Operatori]]
- [[Programmazione/Python/Promemoria/Pagine/Python - Stringhe e regex|Promemoria stringhe e regex]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: built-in e round](https://docs.python.org/3.12/library/functions.html#round).
- [Python 3.12: math](https://docs.python.org/3.12/library/math.html).
- [Python 3.12: decimal](https://docs.python.org/3.12/library/decimal.html).
- [Python 3.12: random](https://docs.python.org/3.12/library/random.html) e [secrets](https://docs.python.org/3.12/library/secrets.html).
- [Python 3.12: datetime](https://docs.python.org/3.12/library/datetime.html) e [zoneinfo](https://docs.python.org/3.12/library/zoneinfo.html).
- [Python 3.12: perf_counter](https://docs.python.org/3.12/library/time.html#time.perf_counter).
