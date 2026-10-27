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
  - moduli
  - venv
  - pip
aliases:
  - Cheatsheet moduli e venv Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Creazione di Package]]"
  - "[[Programmazione/Python/Pagine/Ambienti Virtuali]]"
  - "[[Programmazione/Python/Pagine/Pip e PyPI]]"
title: Python - Moduli, ambienti e dipendenze
---

# Python - Moduli, ambienti e dipendenze

## Obiettivo

Ricordare come importare moduli, avviare un package e usare pip nell'interprete corretto. Dettagli: [[Programmazione/Python/Pagine/Creazione di Package|Package]], [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti virtuali]] e [[Programmazione/Python/Pagine/Pip e PyPI|Pip]].

Baseline: CPython **3.12.10**; pip **26.2.2** nella toolchain di verifica. Il pip incluso in un nuovo venv puo avere una versione diversa.

## Quando usarlo

- Un import funziona nel terminale ma non nell'IDE.
- Devi ricreare l'ambiente di un progetto.
- Vuoi distinguere dipendenze dichiarate e pacchetti installati.

## Procedura

1. Lavora nella directory del progetto con un interprete gia disponibile.
2. Crea una nuova `.venv`, senza riusare una cartella con file da conservare.
3. Attiva l'ambiente oppure usa direttamente il suo interprete.
4. Verifica percorso e pip, poi installa dipendenze fidate ed esegui i test.

## Snippet

### Import

```python
import json
import pathlib
from datetime import datetime, timezone
from pathlib import Path as FilePath

data = json.loads('{"enabled": true}')
print(data["enabled"])  # True
print(pathlib.Path("data").name)  # data
print(FilePath("report.json").suffix)  # .json
print(datetime(2026, 1, 1, tzinfo=timezone.utc).year)  # 2026
```

`import modulo` lega il nome del modulo; `from modulo import nome as alias` lega quel nome nel chiamante. Evita `import *` e file locali chiamati `json.py`, `requests.py` o come altre dipendenze. Un import esegue il codice top-level al primo caricamento nel processo, poi normalmente usa la cache.

### Import relativo ed entry point

Esempio minimo **multifile**, non blocchi indipendenti. I due `__init__.py` sono file vuoti; crea gli altri tre con i contenuti seguenti.

```text
project/
|-- demo_app/
|   |-- __init__.py
|   |-- config.py
|   +-- services/
|       |-- __init__.py
|       |-- repository.py
|       +-- report.py
+-- .venv/
```

#### demo_app/config.py

```python
TITLE = "Demo"
```

#### demo_app/services/repository.py

```python
def get_name():
    return "Ada"
```

#### demo_app/services/report.py

```python
from .repository import get_name
from ..config import TITLE


def main():
    print(f"{TITLE}: {get_name()}")


if __name__ == "__main__":
    main()
```

Dalla directory `project/`, con il Python scelto:

```text
python -m demo_app.services.report
```

Output: `Demo: Ada`. Un punto indica il package corrente, due quello genitore. Non avviare il file interno con `python demo_app/services/report.py`: manca il contesto di package per gli import relativi.

La guardia evita la chiamata a `main()` durante l'import, non tutti gli effetti collaterali top-level. Il layout qui serve al demo; per un progetto installabile con `src/`, packaging e CLI vedi la nota collegata.

### Verificare l'interprete di base

```text
python --version
```

### Creare un ambiente virtuale

```text
python -m venv .venv
```

Crea file nella directory indicata usando il Python selezionato; non scarica un'altra versione Python. Un venv **non e una sandbox** per codice non fidato e normalmente va ricreato, non copiato tra macchine.

### Usare senza attivazione su Windows

PowerShell, dalla directory del progetto:

```powershell
.\.venv\Scripts\python.exe -m pip --version
```

### Usare senza attivazione su Linux o macOS

```bash
./.venv/bin/python -m pip --version
```

### Attivare su PowerShell

Alternativa al percorso esplicito:

```powershell
.\.venv\Scripts\Activate.ps1
```

Se la policy blocca lo script, usa direttamente l'interprete; non serve cambiare la policy globale.

### Attivare su Bash

Su Linux/macOS:

```bash
source .venv/bin/activate
```

L'attivazione modifica la shell corrente, non altre finestre o il kernel del notebook. I comandi seguenti con `python` presuppongono questo ambiente; senza attivazione sostituisci `python` con il percorso esplicito.

### Verificare interprete e ambiente

Esegui anche nell'IDE/notebook quando confronti ambienti:

```python
import sys

print(sys.executable)
print(sys.version)
print(sys.prefix != sys.base_prefix)  # True nel venv
print(sys.path)
```

Per verificare il pip associato:

```text
python -m pip --version
```

`python -m pip` sceglie il pip di quel Python, non garantisce da solo che sia quello del progetto. `VIRTUAL_ENV` assente non esclude un venv avviato senza attivazione.

### Installare un pacchetto

Esempio con il pin usato nelle note HTTP; verifica i requisiti del tuo progetto, non assumerlo come versione sempre consigliata:

```text
python -m pip install "requests==2.34.2"
```

Installare modifica l'ambiente, puo scaricare dipendenze ed eseguire build. Distribuzione installata e nome importabile possono differire: `beautifulsoup4` espone `bs4`.

### Installare da requirements

Richiede un file `requirements.txt` esistente e controllato:

```text
python -m pip install -r requirements.txt
```

Non elimina automaticamente i pacchetti extra gia installati. Non e una sincronizzazione esatta dell'ambiente.

### Informazioni sul pacchetto

```text
python -m pip show requests
```

### Controllare le dipendenze dichiarate

```text
python -m pip check
```

Controlla metadati/requisiti mancanti o incompatibili, non i test dell'applicazione o le vulnerabilita.

### Aggiornare pip

Operazione facoltativa che modifica il tool **nell'ambiente selezionato**:

```text
python -m pip install --upgrade pip
```

### Disattivare

Solo nella shell dove hai attivato il venv:

```text
deactivate
```

Non cancella l'ambiente; con il percorso esplicito non c'e nulla da disattivare.

## Adattamenti comuni

### Visualizzare lo snapshot

```text
python -m pip freeze
```

Descrive lo stato installato, incluse dipendenze transitive; non calcola un lockfile. Con Python 3.12+ omette pip per default. Usa `--all` se vuoi includerlo.

### Salvare lo snapshot su PowerShell

**Crea o sovrascrive** solo il file indicato. Esamina prima l'output: non sostituire automaticamente il file delle dipendenze curate.

```powershell
python -m pip freeze | Set-Content -LiteralPath requirements.snapshot.txt -Encoding utf8
```

### Salvare lo snapshot su Bash

Alternativa, con lo stesso effetto di sovrascrittura:

```bash
python -m pip freeze > requirements.snapshot.txt
```

Lo snapshot puo contenere percorsi locali e riferimenti non portabili. Per lockfile e installazioni controllate: [[Programmazione/Python/Pagine/uv pipx e poetry|uv, pipx e Poetry]].

### Escludere l'ambiente da Git

Nel `.gitignore` del progetto:

```gitignore
.venv/
__pycache__/
```

Versiona sorgenti e dichiarazioni delle dipendenze, non l'ambiente. `.gitignore` non smette di tracciare file gia aggiunti a Git.

## Debug rapido

- **ModuleNotFoundError**: verifica `sys.executable`, nome importabile e posizione del progetto; non reinstallare alla cieca.
- **Import relativo fallito**: avvia con `-m` dal genitore del package, oppure installa il progetto.
- **Modulo sbagliato**: controlla il suo `__file__`, se presente, e i nomi dei file locali; evita correzioni casuali a `sys.path`.
- **IDE/notebook differente**: seleziona esplicitamente interprete/kernel.
- **No module named venv/ensurepip**: verifica i componenti Python della distribuzione; non usare automaticamente pip globale o privilegi amministrativi.
- **pip check riuscito ma app guasta**: esegui i test; i metadati non provano compatibilita runtime.

## Checklist finale

- Interprete, shell e directory di avvio verificati?
- Import relativo eseguito nel contesto di package?
- Dipendenze fidate e installate nel venv giusto?
- Snapshot distinto da lockfile e requisiti curati?
- Ambiente ricreabile e escluso da Git?

## Collegamenti

- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: moduli, import e package](https://docs.python.org/3.12/tutorial/modules.html).
- [Python 3.12: venv](https://docs.python.org/3.12/library/venv.html).
- [pip: installazione](https://pip.pypa.io/en/stable/cli/pip_install/), [freeze](https://pip.pypa.io/en/stable/cli/pip_freeze/) e [check](https://pip.pypa.io/en/stable/cli/pip_check/).
- [PyPA: distribuzioni e package importabili](https://packaging.python.org/en/latest/discussions/distribution-package-vs-import-package/).
