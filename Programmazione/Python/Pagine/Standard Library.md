---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - programming
  - standard-library
aliases:
  - Standard Library di Python
prerequisites: []
related: []
title: Standard Library di Python
---

# Standard Library di Python

## Sintesi

La standard library raccoglie i moduli distribuiti con Python: filesystem, formati dati, date, collezioni, test, logging e concorrenza. Non e un unico pacchetto da installare con pip.

Questa nota copre anche i rimandi dell'indice a `pathlib`, `json`, `csv`, `tomllib`, `datetime`, `zoneinfo` e `queue`. Gli altri moduli hanno note dedicate.

Riferimento: Python 3.12; baseline degli esempi CPython 3.12.10. La disponibilita di alcuni moduli dipende dalla compilazione e dalla piattaforma; i dati dei fusi orari possono richiedere una dipendenza esterna.

## Quando usarlo

- Risolvere problemi comuni senza aggiungere subito una libreria.
- Leggere formati strutturati con parser dedicati.
- Rappresentare date, misurare durate o coordinare thread.
- Scegliere consapevolmente una libreria esterna quando servono validazione, prestazioni o API ulteriori.

## Come funziona

Le funzioni built-in, come `len`, non richiedono import. I moduli built-in, come `sys`, sono integrati nell'interprete. Altri moduli standard sono implementati in Python o come estensioni native. Una dipendenza esterna, invece, non arriva automaticamente con Python.

Preferisci import espliciti: `import json`, `from pathlib import Path` oppure `import datetime as dt`. Evita `from math import *`: rende meno chiara l'origine dei nomi.

Mappa orientativa:

- Filesystem: `pathlib`, `os`, `shutil`, `tempfile`. `os.path` non e deprecato: `pathlib` offre un'interfaccia a oggetti, non una garanzia di sicurezza maggiore.
- Formati: `json`, `csv`, `configparser`, `tomllib`.
- Tempo: `datetime`, `zoneinfo`, `time`, `calendar`.
- Dati e funzioni: `collections`, `itertools`, `functools`.
- Diagnostica: `logging`, `unittest`, `pdb`, `traceback`.
- Concorrenza: `queue`, `threading`, `multiprocessing`, `asyncio`, `concurrent.futures`.
- Runtime: `inspect`, `types`, `sys`, `importlib`.

## API / Sintassi

### pathlib: percorsi e I/O

`Path` rappresenta un percorso, non necessariamente esistente. Le operazioni sul filesystem possono fallire anche dopo un controllo con `exists()`. `mkdir(parents=True, exist_ok=True)` crea directory; non verifica che una directory esistente sia fidata.

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    folder = Path(directory) / "reports"
    folder.mkdir()
    path = folder / "summary.txt"
    with path.open("x", encoding="utf-8") as file:
        file.write("ready\n")
    print(path.name, path.suffix, path.read_text(encoding="utf-8").strip())
```

Output: `summary.txt .txt ready`. `write_text` sovrascrive; qui `x` rifiuta un file gia esistente. Percorsi relativi, encoding e copie sono approfonditi in Gestione File.

### JSON: parsing non significa validazione

`loads` / `dumps` lavorano su stringhe; `load` / `dump` su file. JSON non conserva tutti i tipi Python: una tuple diventa un array e torna come lista; date, set e oggetti arbitrari richiedono una rappresentazione esplicita.

```python
import json


def read_enabled(text: str) -> bool:
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("expected an object")
    if set(data) != {"enabled"} or type(data["enabled"]) is not bool:
        raise ValueError("expected only a boolean enabled field")
    return data["enabled"]


enabled = read_enabled('{"enabled": true}')
encoded = json.dumps({"enabled": enabled}, allow_nan=False, sort_keys=True)
print(encoded)
```

Output: `{"enabled": true}`. Il controllo accetta esattamente una chiave e un booleano, non `1` o `"true"`. JSON sintatticamente errato solleva `JSONDecodeError`.

Python accetta per default alcune estensioni, tra cui NaN/Infinity: `allow_nan=False` impedisce di **scriverle**, non cambia il parser. Le chiavi duplicate sono accettate e prevale l'ultima; per rifiutarle serve una politica con `object_pairs_hook`. Limita anche dimensione e provenienza degli input: un parser non sostituisce autorizzazione o limiti di risorse.

### CSV: separatori, quoting e tipi

Non dividere righe con `split(",")`: un campo puo contenere virgole o newline quotati. I valori letti da `DictReader` sono normalmente stringhe, non numeri gia validati.

```python
import csv
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    path = Path(directory) / "items.csv"
    with path.open("x", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["name", "quantity"])
        writer.writeheader()
        writer.writerow({"name": "kit, small", "quantity": 3})

    with path.open(encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))

    quantity = int(rows[0]["quantity"])
    print(rows[0]["name"], quantity)
```

`newline=""` lascia la gestione dei terminatori al modulo CSV. Separa parsing da controlli su intestazioni, campi mancanti, valori negativi e righe troppo grandi. Il quoting CSV non neutralizza formule interpretate da un foglio di calcolo: esportazioni destinate a Excel richiedono una politica ulteriore.

### TOML: configurazioni in lettura

`tomllib` e incluso da Python 3.11 e **non scrive TOML**. `loads` riceve una stringa; `load` richiede un file aperto in binario. Per conservare commenti e formattazione in modifica serve uno strumento diverso.

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import tomllib

with TemporaryDirectory() as directory:
    path = Path(directory) / "config.toml"
    path.write_bytes(b'[server]\nhost = "127.0.0.1"\nport = 8000\n')
    with path.open("rb") as file:
        config = tomllib.load(file)

    port = config["server"]["port"]
    if type(port) is not int or not 1 <= port <= 65535:
        raise ValueError("port out of range")
    print(config["server"]["host"], port)
```

Il formato assegna tipi, ma non conosce lo schema dell'applicazione. Se mancano `server` o `port`, questo esempio propaga `KeyError`; una configurazione destinata agli utenti dovrebbe trasformarlo in un messaggio diagnostico esplicito.

### datetime e zoneinfo: istanti e orari locali

Un `datetime` naive non porta un fuso utilizzabile; uno aware si. Per rappresentare un istante usa un valore aware, spesso UTC. `astimezone` converte preservando l'istante; `replace(tzinfo=...)` assegna un'interpretazione ai campi, **non converte** l'ora.

Prerequisito del prossimo esempio: database IANA disponibile. `zoneinfo` lo cerca nel sistema e poi nel pacchetto ufficiale `tzdata`; su Windows e spesso necessario installare quest'ultimo nel virtualenv. La prova della nota usa `tzdata 2026.5`.

```text
python -m pip install tzdata
```

```python
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

rome = ZoneInfo("Europe/Rome")
instant = datetime(2024, 7, 1, 12, tzinfo=timezone.utc)
local = instant.astimezone(rome)
print(local.isoformat())

first = datetime(2024, 10, 27, 2, 30, tzinfo=rome, fold=0)
second = first.replace(fold=1)
elapsed = second.astimezone(timezone.utc) - first.astimezone(timezone.utc)
print(elapsed == timedelta(hours=1))
```

Output: `2024-07-01T14:00:00+02:00` e `True`. Nel ritorno all'ora solare le 02:30 si ripetono: `fold` distingue le due occorrenze. Nelle transizioni primaverili esistono anche ore locali inesistenti: costruire un datetime con `ZoneInfo` non le rifiuta automaticamente.

Per durate tra istanti attraverso transizioni DST, converti in UTC prima della sottrazione: due datetime con lo stesso oggetto `tzinfo` possono essere sottratti secondo l'orario locale. Per misurare un'esecuzione usa invece `time.perf_counter()` o `time.monotonic()`; l'orologio civile puo essere corretto durante il programma.

### collections, itertools e functools

```python
from collections import Counter, deque
from functools import partial
from itertools import islice

counts = Counter(["red", "blue", "red"])
pending = deque(["first", "second"])
item = pending.popleft()
first_three = list(islice(iter(range(100)), 3))
parse_binary = partial(int, base=2)
print(counts["missing"], item, first_three, parse_binary("101"))
```

`Counter` conta chiavi hashable e restituisce zero per una chiave assente; `deque` e adatta a inserimenti/rimozioni alle estremita. `islice` consuma un iteratore senza materializzarlo tutto. `partial` fissa argomenti, non esegue subito la funzione. Per `functools.cache` e `lru_cache` vedi Caching: memoria e invalidazione non sono gratuite.

### Queue: coordinare thread

`queue.Queue` offre una coda sincronizzata per thread; non e la coda per processi o coroutine. `get()` e `put()` possono bloccare; `maxsize` permette backpressure. `empty()` e `qsize()` non garantiscono che l'operazione successiva non blocchi: usa timeout oppure `get_nowait()` con `Empty`.

```python
from queue import Queue
from threading import Thread

jobs = Queue(maxsize=2)
results = []
stop = object()


def worker():
    while True:
        item = jobs.get()
        try:
            if item is stop:
                return
            results.append(item * item)
        finally:
            jobs.task_done()


thread = Thread(target=worker)
thread.start()
for value in (2, 3):
    jobs.put(value)
jobs.put(stop)
jobs.join()
thread.join()
print(results)
```

Output: `[4, 9]`. C'e un solo worker e riceve solo gli interi preparati dal programma. Ogni `get`, inclusa la sentinella, ha un `task_done`. `Queue.join` attende il conteggio dei task, `Thread.join` la fine del thread.

`task_done` non significa "lavoro riuscito". Se un worker reale muore lasciando altri elementi in coda, `join` puo restare bloccato: occorre gestire e comunicare gli errori, non soltanto mettere `task_done` in `finally`. Con piu worker va ripensata anche la distribuzione delle sentinelle. Le API introdotte dopo 3.12, come `Queue.shutdown`, non fanno parte di questo esempio.

## Esempio pratico

Conteggio di parole e report JSON, senza file di input esterni. La tokenizzazione usa spazi e minuscole: non elimina punteggiatura e non e un'analisi linguistica.

```python
import json
from collections import Counter
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    source = Path(directory) / "input.txt"
    target = Path(directory) / "summary.json"
    source.write_text("Red blue\nred\n", encoding="utf-8")
    counter = Counter()
    with source.open(encoding="utf-8") as file:
        for line in file:
            counter.update(line.lower().split())

    with target.open("x", encoding="utf-8") as file:
        json.dump(counter.most_common(20), file, indent=2, allow_nan=False)

    summary = json.loads(target.read_text(encoding="utf-8"))
    print(summary)
```

Output: `[['red', 2], ['blue', 1]]`. Il file viene letto per righe, ma il contatore cresce con il numero di parole distinte: non e un algoritmo a memoria costante.

## Varianti

- Per task asincroni: `asyncio.Queue`, con attese `await`.
- Per processi: `multiprocessing.Queue`, con serializzazione e ciclo di vita differenti.
- Per configurazioni INI: `configparser`; per oggetti Python fidati: `pickle`, mai per input non fidati.
- Per validazione strutturata o trasformazioni complesse: una libreria esterna puo essere piu adatta. La sola presenza di un modulo standard non decide la scelta.

## Errori comuni

- Dare a un file locale nomi come `json.py` o `queue.py` e mascherare gli import standard.
- Confondere parsing, validazione e sanitizzazione.
- Perdere il fuso orario o trattare tutte le giornate come intervalli di 24 ore.
- Usare `pickle.loads` su dati non fidati: puo eseguire codice.
- Dichiarare una pipeline "streaming" ignorando accumulatori e righe enormi.
- Credere che thread-safe significhi che un'intera sequenza di operazioni sia atomica.

## Checklist

- Il modulo esiste nella versione e nella build Python adottate?
- Input, schema, limiti ed encoding sono espliciti?
- Date e durate hanno una semantica definita?
- Sono gestiti errori e terminazione delle attivita concorrenti?
- Le scritture possono sovrascrivere dati?
- I moduli specializzati hanno note di approfondimento collegate?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione File]]
- [[Programmazione/Python/Pagine/Introspezione|Introspezione]]
- [[Programmazione/Python/Pagine/Caching|Caching]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Threading|Threading]]

## Fonti

- [Python 3.12: indice della standard library](https://docs.python.org/3.12/library/index.html).
- [pathlib](https://docs.python.org/3.12/library/pathlib.html), [json](https://docs.python.org/3.12/library/json.html), [csv](https://docs.python.org/3.12/library/csv.html), [tomllib](https://docs.python.org/3.12/library/tomllib.html).
- [datetime](https://docs.python.org/3.12/library/datetime.html), [zoneinfo](https://docs.python.org/3.12/library/zoneinfo.html), [orologi di time](https://docs.python.org/3.12/library/time.html).
- [collections](https://docs.python.org/3.12/library/collections.html), [itertools](https://docs.python.org/3.12/library/itertools.html), [functools](https://docs.python.org/3.12/library/functools.html).
- [queue e contabilizzazione dei task](https://docs.python.org/3.12/library/queue.html), [sicurezza di pickle](https://docs.python.org/3.12/library/pickle.html).
