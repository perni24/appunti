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
  - subprocess
  - standard-library
  - cli
aliases:
  - subprocess Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Error Handling]]"
  - "[[Programmazione/Python/Pagine/Gestione File]]"
related:
  - "[[Programmazione/Python/Pagine/CLI con argparse]]"
  - "[[Programmazione/Python/Pagine/Standard Library]]"
title: Subprocess
---

# Subprocess

## Sintesi

`subprocess` avvia programmi esterni e ne gestisce input, output e terminazione. Serve per integrare una CLI esistente, non per sostituire automaticamente le API Python per file, HTTP o database.

Esempi riferiti a Python 3.12, verificati con CPython 3.12.10 su Windows: e la baseline di prova, non l'ultima patch disponibile. I blocchi sono indipendenti.

## Quando usarlo

- Integrare compilatori, Git o altri eseguibili gia disponibili.
- Automatizzare uno script separato, osservandone exit code e diagnostica.
- Usare `run()` per un comando finito; passare a `Popen` quando serve controllarne il ciclo di vita.

Prima verifica se una funzione Python equivalente evita dipendenze da PATH, shell e sistema operativo.

## Come funziona

`run()` attende il processo e restituisce un `CompletedProcess`. L'avvio riuscito non implica il successo del comando: `check=True` controlla il codice di uscita.

### Argomenti distinti, non una riga di shell

`shell=False` e il default. Ogni elemento della lista e un argomento; non aggiungere virgolette agli elementi che contengono spazi.

```python
import subprocess
import sys

message = "due parole; $(nessun_comando)"
result = subprocess.run(
    [sys.executable, "-I", "-c", "import sys; print(sys.argv[1])", message],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
    timeout=5,
)
print(result.stdout.strip())  # due parole; $(nessun_comando)
```

`sys.executable` riusa l'interprete corrente, incluso il virtualenv. Per altri tool scegli un eseguibile fidato, preferibilmente con percorso assoluto.

La lista non e una sandbox: il programma puo interpretare un argomento come opzione, espressione o percorso pericoloso. Usa `--` per terminare le opzioni solo se quel tool lo supporta. Su Windows i file `.bat`/`.cmd` possono coinvolgere una shell anche con `shell=False`: evita argomenti non fidati e consulta le precauzioni specifiche della documentazione.

## API / Sintassi

- `capture_output=True`: cattura entrambi gli stream in memoria; senza cattura, di norma sono ereditati.
- `text=True, encoding="utf-8"`: decodifica come UTF-8, solo se il programma produce quell'encoding. Altrimenti scegli l'encoding corretto o lavora in byte.
- `input=...`: invia dati su stdin; testo con modalita testo, byte altrimenti.
- `cwd`: directory del figlio, non cambia quella del processo Python.
- `env`: sostituisce l'ambiente ereditato; per una modifica mirata usa una copia di `os.environ`.
- `timeout`: limita l'attesa, ma non garantisce una deadline globale comprendente l'avvio e tutti i discendenti.
- `check=True`: codice non zero diventa `CalledProcessError`; i programmi possono assegnare significati particolari ai propri codici.

### Ambiente, stdin e directory di lavoro

```python
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    child_env = os.environ.copy()
    child_env["APP_MODE"] = "preview"
    child_code = (
        "import json, os, sys; "
        "print(json.dumps([os.getcwd(), os.environ['APP_MODE'], sys.stdin.read()]))"
    )
    result = subprocess.run(
        [sys.executable, "-I", "-X", "utf8", "-c", child_code],
        cwd=directory,
        env=child_env,
        input="contenuto\n",
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
        timeout=5,
    )
    child_cwd, mode, received = json.loads(result.stdout)
    print(Path(child_cwd).resolve() == Path(directory).resolve())  # True
    print(mode, repr(received))  # preview 'contenuto\n'
```

### Errori di avvio e di esecuzione

```python
import subprocess
import sys

try:
    subprocess.run(
        [sys.executable, "-I", "-c",
         "import sys; print('invalid input', file=sys.stderr); sys.exit(7)"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
        timeout=5,
    )
except FileNotFoundError:
    print("Eseguibile non trovato")
except subprocess.TimeoutExpired:
    print("Tempo di attesa esaurito")
except subprocess.CalledProcessError as error:
    print(error.returncode)  # 7
    print(error.stderr.strip())  # invalid input
```

Il caso dimostrato produce exit code 7, non un errore di avvio. Permessi insufficienti e altri errori di sistema possono sollevare altri `OSError`. Non stampare indiscriminatamente comandi/output se contengono segreti.

## Esempio pratico

Leggere il branch di un repository. Richiede Git nel PATH e un percorso scelto dall'applicazione; non modifica il repository.

```python
from pathlib import Path
import shutil
import subprocess

def current_branch(repository: Path) -> str | None:
    git = shutil.which("git")
    if git is None:
        raise FileNotFoundError("Git non disponibile")
    result = subprocess.run(
        [git, "-C", str(repository.resolve()), "branch", "--show-current"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
        timeout=5,
    )
    return result.stdout.strip() or None
```

Chiama `current_branch(Path("percorso-del-repository"))` dopo aver importato la funzione. `None` indica HEAD detached, non assenza di un repository. Fuori da un repository l'errore di Git viene propagato. La scelta UTF-8 deve essere coerente con la configurazione del tool.

## Varianti

### Popen e timeout

Con `run(timeout=...)` Python termina e attende il figlio diretto prima di rilanciare l'errore. Con `Popen.communicate(timeout=...)` devi invece gestire la terminazione.

```python
import subprocess
import sys

with subprocess.Popen(
    [sys.executable, "-I", "-c", "import time; time.sleep(30)"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8",
) as process:
    try:
        stdout, stderr = process.communicate(timeout=0.1)
    except subprocess.TimeoutExpired:
        process.kill()
        stdout, stderr = process.communicate()
        print("Processo terminato dopo il timeout")
```

Questo esempio termina un solo processo, non un albero di processi. `communicate()` gestisce i due stream evitando di bloccarli uno alla volta, ma accumula l'output in memoria. Per output grandi usa file o una strategia di streaming che consumi entrambi gli stream.

## Errori comuni

- Credere che `capture_output` mostri automaticamente la diagnostica.
- Usare `wait()` con pipe non consumate: un buffer pieno puo bloccare il figlio.
- Aspettarsi che `kill()` annulli file scritti o altre operazioni gia completate.
- Usare comandi POSIX come `ls` in esempi dichiarati portabili.
- Passare solo una variabile a `env` perdendo PATH e altre variabili necessarie.
- Usare `shell=True` per risolvere genericamente problemi di quoting.

## Checklist

- Eseguibile fidato, argomenti separati e politica sugli input?
- Exit code, encoding, stderr e timeout gestiti?
- Output limitato o diretto a file?
- Portabilita e cleanup dei processi verificati?
- Nessun segreto nei log o negli argomenti visibili agli altri processi?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/CLI con argparse|CLI con argparse]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]
- [[Programmazione/Python/Pagine/Automazione file e script|Automazione file e script]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e ambiente]]

## Fonti

- [Python 3.12: subprocess, errori e gestione delle pipe](https://docs.python.org/3.12/library/subprocess.html).
- [Python 3.12: sicurezza, shell e batch Windows](https://docs.python.org/3.12/library/subprocess.html#security-considerations).
- [Python 3.12: sys.executable](https://docs.python.org/3.12/library/sys.html#sys.executable).
- [PEP 324: motivazioni, processi e pipe](https://peps.python.org/pep-0324/).
