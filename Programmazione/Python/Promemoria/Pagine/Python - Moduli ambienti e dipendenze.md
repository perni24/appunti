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

## Import

```python
import json
import pathlib

from datetime import datetime, timezone
from package.module import function
from package.module import function as alias
```

Evitare `from module import *`.

## Import relativo nel package

```python
from .repository import EntityRepository
from ..config import settings
```

## Entry point

```python
def main() -> None:
    print("Avvio")


if __name__ == "__main__":
    main()
```

## Creare un ambiente virtuale

```powershell
python -m venv .venv
```

## Attivare su PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

## Attivare su Linux o macOS

```bash
source .venv/bin/activate
```

## Disattivare

```text
deactivate
```

## Installare un pacchetto

```powershell
python -m pip install requests
```

## Installare da requirements

```powershell
python -m pip install -r requirements.txt
```

## Salvare le versioni installate

```powershell
python -m pip freeze
```

```powershell
python -m pip freeze > requirements.txt
```

## Informazioni sul pacchetto

```powershell
python -m pip show requests
```

## Aggiornare pip

```powershell
python -m pip install --upgrade pip
```

## Verificare interprete e ambiente

```python
import sys

print(sys.executable)
print(sys.version)
print(sys.path)
```

## Approfondimento

- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
