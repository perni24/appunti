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
  - json
  - csv
aliases:
  - Cheatsheet JSON CSV Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Gestione File]]"
  - "[[Programmazione/Python/Pagine/Standard Library]]"
title: Python - JSON e CSV
---

# Python - JSON e CSV

## Obiettivo

Leggere e scrivere JSON/CSV con i parser standard, distinguendo sintassi del formato, tipi Python e controlli sui campi.

## Quando usarlo

Per configurazioni e scambio di dati. Non usare `eval` per JSON o `split(",")` per CSV: quoting, caratteri speciali e righe interne richiedono parser dedicati.

## Procedura

1. Definisci encoding, schema atteso e limite della dimensione.
2. Leggi con il parser corretto, poi valida struttura e valori.
3. Scegli esplicitamente se creare o sostituire l'output.

Baseline **CPython 3.12.10**. Ogni blocco e autonomo; le scritture avvengono in directory temporanee nuove, eliminate alla fine. `x` rifiuta file gia presenti, `w` li troncherebbe.

## Snippet

### JSON da stringa

```python
import json

text = '{"id": 1, "active": true, "note": null}'
data = json.loads(text)
encoded = json.dumps(data, allow_nan=False)
print(data["id"], data["active"], data["note"])  # 1 True None
print(json.loads(encoded) == data)             # True
```

`loads/dumps` lavorano con testo, `load/dump` con file. JSON puo contenere anche array o scalari alla radice: non assumere sempre un dict.

### JSON formattato

```python
import json

data = {"z": 1, "city": "Forl\u00ec"}
text = json.dumps(
    data, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False
)
print(text)
```

`indent` rende leggibile, `sort_keys` ordina le chiavi, `ensure_ascii=False` mantiene i caratteri Unicode nel testo. L'encoding del file e una scelta separata. `allow_nan=False` rifiuta NaN/infinito in **scrittura**, non modifica il parser.

### Leggere un file JSON

```python
import json
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir) / "data.json"
    path.write_text('{"id": 1}', encoding="utf-8")
    with path.open(encoding="utf-8") as file:
        data = json.load(file)
    print(data, file.closed)  # {'id': 1} True
```

`json.load` non e un parser a memoria costante: il documento viene letto e decodificato. Limita la dimensione prima di accettare input non fidato.

### Scrivere un file JSON

```python
import json
from pathlib import Path
from tempfile import TemporaryDirectory

data = {"id": 1, "active": True}
with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir) / "output.json"
    with path.open("x", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, ensure_ascii=False, indent=2, allow_nan=False)
        file.write("\n")
    print(json.loads(path.read_text(encoding="utf-8")) == data)  # True
```

`x` evita la sovrascrittura, non un output parziale se la serializzazione fallisce. Un file JSON contiene un solo documento: chiamare piu volte `dump` sullo stesso stream non crea automaticamente un array.

### Gestire JSON non valido

```python
import json

text = '{"active": tru}'
data = None
try:
    data = json.loads(text)
except json.JSONDecodeError as error:
    print(error.lineno, error.colno)  # 1 12
```

Il demo intercetta solo sintassi JSON errata. File mancante, encoding errato e schema non valido richiedono gestioni distinte; evita di registrare contenuti sensibili nel log.

### Validare i campi JSON

```python
import json

text = '{"enabled": true}'
data = json.loads(text)
if not isinstance(data, dict) or set(data) != {"enabled"}:
    raise ValueError("Expected only the enabled field")
if type(data["enabled"]) is not bool:
    raise ValueError("enabled must be a boolean")
enabled = data["enabled"]
print(enabled)  # True
```

Schema minimo del demo, non validatore generale. `true` diventa `True`; `"true"` e `1` non sono booleani accettabili per questo contratto.

### Leggere CSV da file

```python
import csv
from pathlib import Path
from tempfile import TemporaryDirectory

text = 'id,name\n1,"Ada, L."\n2,"Grace\nHopper"\n'
with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir) / "users.csv"
    path.write_text(text, encoding="utf-8", newline="")
    with path.open(newline="", encoding="utf-8") as file:
        users = list(csv.DictReader(file))
    print(users[0])          # {'id': '1', 'name': 'Ada, L.'}
    print(repr(users[1]["name"]))  # 'Grace\nHopper'
```

Con le impostazioni mostrate, i campi presenti sono stringhe; numeri e date vanno convertiti. `newline=""` lascia al modulo CSV la gestione dei terminatori. `list` carica tutte le righe: per elaborarle progressivamente itera sul reader dentro `with`.

### Scrivere CSV

```python
import csv
from pathlib import Path
from tempfile import TemporaryDirectory

users = [{"id": 1, "name": "Ada, L."}]
fieldnames = ["id", "name"]
with TemporaryDirectory() as temporary_dir:
    path = Path(temporary_dir) / "users.csv"
    with path.open("x", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(users)
    with path.open(newline="", encoding="utf-8") as file:
        restored = list(csv.DictReader(file))
    print(restored)  # [{'id': '1', 'name': 'Ada, L.'}]
```

`fieldnames` definisce ordine e intestazioni. Chiavi aggiuntive generano `ValueError` per default; chiavi mancanti e `None` possono diventare campi vuoti: non e un round-trip senza perdita per tutti i tipi.

### Separatore personalizzato

```python
import csv
from io import StringIO

text = 'id;name\n1;"Ada; L."\n'
with StringIO(text, newline="") as file:
    users = list(csv.DictReader(file, delimiter=";"))
print(users)  # [{'id': '1', 'name': 'Ada; L.'}]
```

Scegli il dialetto del produttore, non indovinarlo dal nome del file. Separatore e encoding sono indipendenti; usa `utf-8-sig` in lettura solo se vuoi gestire anche un BOM UTF-8.

## Adattamenti comuni

### Validare colonne e righe CSV

```python
import csv
from io import StringIO

text = "id,name\n1,Ada\n"
users = []
with StringIO(text, newline="") as file:
    reader = csv.DictReader(file)
    if reader.fieldnames != ["id", "name"]:
        raise ValueError("Expected id,name columns in this order")
    for row in reader:
        if None in row or any(value is None for value in row.values()):
            raise ValueError("Wrong number of fields")
        user_id = int(row["id"])
        name = row["name"].strip()
        if user_id <= 0 or not name:
            raise ValueError("Expected a positive id and a non-empty name")
        users.append({"id": user_id, "name": name})
print(users)  # [{'id': 1, 'name': 'Ada'}]
```

Il contratto accetta intestazioni nell'ordine mostrato e ID interi positivi. Non impone unicita degli ID; `int` accetta anche spazi e segno `+`. Con `DictReader` standard, campi extra finiscono sotto `None` e campi mancanti valgono `None`: non ignorarli.

Altri adattamenti:

- JSON: tuple diventano liste al ritorno; chiavi non stringa possono cambiare tipo. Date, set e Decimal richiedono una rappresentazione esplicita, non un `default=str` usato alla cieca.
- Il decoder JSON standard accetta NaN/Infinity e chiavi duplicate, conservando l'ultimo valore. Per rifiutarli servono una politica e hook dedicati; vedi la teoria.
- Il quoting CSV non neutralizza formule interpretate da Excel o altri fogli di calcolo: valuta una politica specifica per quel destinatario.

## Debug rapido

- `JSONDecodeError`: doppi apici, virgole finali, documenti concatenati o input vuoto.
- `TypeError` in `dump`: tipo non serializzabile; un file puo essere gia stato creato.
- `csv.Error` riguarda il parser, non sostituisce il controllo di schema.
- `KeyError` o righe incomplete: verifica intestazioni, separatore e numero dei campi.
- Per errori di file/encoding, consulta il promemoria sui percorsi.

## Checklist finale

- Formato, encoding, dimensione e schema sono definiti?
- Numeri, booleani, campi mancanti ed extra vengono controllati?
- Output nuovo o sostituzione? Sono tollerati file parziali?

## Collegamenti

- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library: JSON e CSV]]
- [[Programmazione/Python/Promemoria/Pagine/Python - File e percorsi|Promemoria file e percorsi]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: json](https://docs.python.org/3.12/library/json.html).
- [Python 3.12: csv](https://docs.python.org/3.12/library/csv.html).
- [Python 3.12: open ed encoding](https://docs.python.org/3.12/library/functions.html#open).
