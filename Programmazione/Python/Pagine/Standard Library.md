---
date: 2026-04-14
tags:
  - programmazione
  - python
  - standard-library
  - moduli
type: #permanent-note
status: budding
---

# Standard Library di Python

## 💡 Concetto Chiave
La **Standard Library** di Python e l'insieme dei moduli inclusi con il linguaggio, disponibili senza installare pacchetti esterni. E uno dei punti di forza principali di Python: per molte esigenze comuni esiste gia un modulo ufficiale, stabile e ben integrato.

L'idea pratica e semplice: prima di aggiungere una dipendenza esterna, conviene verificare se la Standard Library copre gia il problema in modo sufficiente.

> [!INFO] "Batteries included"
> Python viene spesso descritto con l'espressione **batteries included**: il linguaggio arriva gia con strumenti per file, path, regex, JSON, HTTP, threading, testing, datetime, logging, serializzazione, parsing e molto altro.

---

## 📝 Come e organizzata

La Standard Library non e un singolo pacchetto, ma una raccolta molto ampia di moduli e package standard.

Alcune aree fondamentali:
- sistema operativo e file system;
- strutture dati e algoritmi comuni;
- date, orari e formati;
- serializzazione e parsing;
- concorrenza;
- networking;
- debugging, logging e test;
- introspezione e metaprogrammazione.

```python
import os
import json
import pathlib
import datetime
```

Questi import non richiedono `pip install`, perche fanno gia parte della distribuzione standard di Python.

---

## 💻 Moduli fondamentali da conoscere

### File system e sistema operativo

- `os`: interazione con ambiente e sistema operativo.
- `pathlib`: gestione moderna dei percorsi.
- `shutil`: operazioni di alto livello su file e directory.
- `tempfile`: file e cartelle temporanei.

```python
from pathlib import Path

path = Path("documenti") / "report.txt"
print(path.exists())
```

`pathlib` e spesso preferibile a manipolare path come stringhe raw, ed e direttamente collegato a [[Gestione File]].

### Serializzazione e formati dati

- `json`: encoding e decoding JSON.
- `csv`: lettura e scrittura CSV.
- `pickle`: serializzazione binaria di oggetti Python.
- `configparser`: parsing di file INI.

```python
import json

payload = {"name": "Luca", "active": True}
text = json.dumps(payload)
data = json.loads(text)
```

### Date e tempo

- `datetime`: date, orari, intervalli temporali.
- `time`: funzioni temporali a basso livello.
- `calendar`: utilita per calendari.

```python
from datetime import datetime, timedelta

now = datetime.now()
tomorrow = now + timedelta(days=1)
```

### Strutture dati utili

- `collections`: `Counter`, `defaultdict`, `deque`, `namedtuple`.
- `heapq`: heap e priority queue.
- `bisect`: inserimento e ricerca in liste ordinate.
- `array`: array tipizzati.

```python
from collections import Counter

counter = Counter(["a", "b", "a", "c", "a"])
print(counter["a"])
```

### Matematica e casualita

- `math`: funzioni matematiche.
- `statistics`: media, mediana, deviazione standard.
- `random`: numeri pseudo-casuali.
- `decimal`: aritmetica decimale precisa.
- `fractions`: numeri razionali.

### Regex e testo

- `re`: espressioni regolari.
- `string`: costanti e utility per stringhe.
- `textwrap`: wrapping e formattazione testo.

```python
import re

email = "utente@example.com"
match = re.match(r"^[^@]+@[^@]+\.[^@]+$", email)
print(bool(match))
```

### Networking e web

- `urllib`: operazioni HTTP e parsing URL.
- `http`: primitive HTTP.
- `socket`: networking a basso livello.
- `email`: parsing e composizione messaggi email.

### Concorrenza

- `threading`: thread e sincronizzazione.
- `multiprocessing`: processi separati.
- `asyncio`: concorrenza asincrona.
- `queue`: code thread-safe.
- `concurrent.futures`: API ad alto livello per task concorrenti.

Questi moduli si collegano direttamente a [[Threading]], `Multiprocessing`, `Asyncio` e `Concurrent.futures`.

### Debugging, test e osservabilita

- `logging`: logging strutturato.
- `unittest`: testing standard.
- `pdb`: debugger interattivo.
- `traceback`: gestione e stampa traceback.
- `warnings`: warning runtime.

### Introspezione e runtime

- `inspect`: analisi di firme, funzioni e classi.
- `sys`: informazioni sull'interprete.
- `types`: tipi speciali del runtime.
- `importlib`: import dinamico e gestione moduli.

Questa area e collegata a [[Introspezione]].

---

## ⚙️ Funzionamento Interno (Teoria)

### Moduli built-in vs moduli della libreria standard
Non tutti i moduli standard sono uguali:

- alcuni sono **built-in**, cioe integrati direttamente nell'interprete;
- altri sono file Python o estensioni native distribuite con Python.

Dal punto di vista dell'uso quotidiano, la differenza cambia poco: entrambi si importano normalmente.

```python
import sys
import json
```

### Import e namespace
Quando importi un modulo della Standard Library, i suoi nomi entrano nel namespace secondo la forma scelta:

```python
import math
from pathlib import Path
```

Capire bene gli import e importante per evitare collisioni di nomi e mantenere il codice leggibile.

### Stabilita e portabilita
La Standard Library tende a essere piu stabile e portabile di molte librerie esterne, ma non significa che tutto sia identico su ogni piattaforma. Moduli come `os`, `signal` o `resource` possono avere differenze tra Windows, Linux e macOS.

---

## 🧠 Quando preferire la Standard Library

Conviene partire dalla Standard Library quando:
- il problema e comune e ben coperto da un modulo standard;
- vuoi ridurre dipendenze esterne;
- vuoi massimizzare portabilita e manutenzione a lungo termine;
- stai costruendo script, utility o tool interni.

Ha senso introdurre librerie esterne quando:
- servono feature molto piu evolute;
- la DX della libreria standard e troppo bassa per il caso reale;
- performance, ergonomia o ecosistema richiedono uno strumento dedicato.

> [!TIP] Regola pratica
> Prima verifica la Standard Library. Se copre il problema in modo chiaro e sufficiente, evita dipendenze in piu. Se invece la soluzione diventa artificiale o troppo limitata, passa a una libreria esterna.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Conosci i moduli base prima di installare dipendenze:** spesso `json`, `pathlib`, `collections`, `datetime` e `logging` bastano gia.
- ✅ **Preferisci moduli moderni quando esistono:** ad esempio `pathlib` e spesso piu chiaro di `os.path`.
- ✅ **Leggi la documentazione ufficiale dei moduli standard:** i dettagli dei corner case contano molto.
- ✅ **Mantieni gli import espliciti e leggibili:** evita wildcard import.
- ❌ **Non usare `pickle` per dati non fidati:** puo eseguire codice arbitrario in fase di deserializzazione.
- ❌ **Non confondere Standard Library con built-in:** `len` e `print` sono built-in, `json` e `pathlib` sono moduli standard.
- 💣 **Attenzione ai nomi dei file locali:** creare file come `json.py`, `threading.py` o `pathlib.py` puo rompere gli import.
- 💣 **Non assumere che ogni modulo standard sia ideale:** "standard" non significa automaticamente "migliore" per ogni contesto.

---
