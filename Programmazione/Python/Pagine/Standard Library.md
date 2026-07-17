---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [python, programming, standard-library]
aliases: [Standard Library di Python]
prerequisites: []
related: []
---

# Standard Library di Python

## Sintesi

La standard library e l'insieme di moduli inclusi con Python. Copre file, path, date, JSON, CSV, logging, test, concorrenza, networking, introspezione, debug e molte utility comuni.

La regola pratica e: prima controlla se il problema e gia risolto dalla standard library; poi valuta una dipendenza esterna se serve piu ergonomia, performance o funzionalita.

## Quando usarlo

Parti dalla standard library quando:

- il problema e comune e ben coperto da un modulo standard;
- vuoi ridurre dipendenze esterne;
- stai scrivendo script o tool interni;
- vuoi massimizzare portabilita e manutenzione;
- devi lavorare in ambienti dove installare pacchetti e difficile.

Introduci librerie esterne quando la soluzione standard diventa troppo limitata, verbosa o inadatta al caso reale.

## Come funziona

I moduli standard si importano senza `pip install`.

```python
import json
from pathlib import Path
from datetime import datetime
```

La standard library non e un singolo pacchetto: e una raccolta ampia di moduli organizzati per aree.

Moduli molto usati:

- `pathlib`, `os`, `shutil`, `tempfile` per filesystem;
- `json`, `csv`, `configparser`, `tomllib` per formati dati;
- `datetime`, `time`, `calendar` per date e tempo;
- `collections`, `itertools`, `functools` per strutture e funzioni;
- `logging`, `unittest`, `pdb`, `traceback` per debugging e test;
- `threading`, `multiprocessing`, `asyncio`, `concurrent.futures` per concorrenza;
- `inspect`, `types`, `sys`, `importlib` per runtime e introspezione.

## API / Sintassi

Import di un modulo:

```python
import json

text = json.dumps({"active": True})
data = json.loads(text)
```

Import di un nome specifico:

```python
from pathlib import Path

path = Path("notes") / "todo.txt"
```

Alias:

```python
import datetime as dt

today = dt.date.today()
```

Evita wildcard import:

```python
from math import *  # sconsigliato
```

## Esempio pratico

Script minimale che legge righe da un file, conta le occorrenze e salva il risultato in JSON.

```python
import json
from collections import Counter
from pathlib import Path


source = Path("input.txt")
target = Path("summary.json")

counter = Counter()

with source.open(encoding="utf-8") as file:
    for line in file:
        words = line.lower().split()
        counter.update(words)

target.write_text(
    json.dumps(counter.most_common(20), indent=2),
    encoding="utf-8",
)
```

Questo usa solo moduli standard: `pathlib`, `collections` e `json`.

## Varianti

- **Built-in**: funzioni e tipi disponibili senza import, come `len`, `dict`, `list`, `print`.
- **Moduli built-in**: integrati nell'interprete, come `sys`.
- **Moduli standard Python**: distribuiti con Python, come `json` o `pathlib`.
- **Estensioni native standard**: moduli standard implementati in C o con componenti native.
- **Librerie esterne**: installate con package manager come `pip`.

Alcuni moduli hanno differenze tra sistemi operativi. Per esempio `os`, `signal` e alcune funzionalita legate ai processi possono comportarsi diversamente su Windows, Linux e macOS.

## Errori comuni

- Installare una libreria esterna prima di controllare il modulo standard equivalente.
- Usare moduli vecchi quando esiste un'alternativa piu moderna, come `pathlib` rispetto a molte operazioni con `os.path`.
- Creare file locali con nomi come `json.py`, `logging.py` o `pathlib.py`, rompendo gli import.
- Usare `pickle` con dati non fidati: puo eseguire codice durante la deserializzazione.
- Confondere built-in, standard library e pacchetti esterni.
- Usare wildcard import, rendendo poco chiaro da dove arrivano i nomi.

## Checklist

- Esiste un modulo standard che risolve il problema?
- La soluzione standard e abbastanza leggibile per il caso reale?
- Sto usando moduli moderni e mantenuti?
- Gli import sono espliciti?
- Ci sono differenze di piattaforma da considerare?
- Una dipendenza esterna porta un vantaggio reale?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Gestione File]]
- [[Introspezione]]
- [[Caching]]
- [[Logging]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Asyncio]]
- [[Threading]]
