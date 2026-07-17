---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [programmazione, python, tooling, import]
aliases: [isort]
prerequisites: []
related: []
---

# isort

## Sintesi

`isort` ordina automaticamente gli import Python. Raggruppa standard library, dipendenze di terze parti e import locali, riducendo diff inutili e discussioni manuali sullo stile.

## Quando usarlo

Usa `isort` quando:

- il progetto ha molti import;
- vuoi import ordinati in modo coerente;
- usi formatter e linter automatici;
- vuoi integrarlo in `pre-commit` o CI;
- vuoi evitare ordinamenti manuali diversi tra sviluppatori.

## Come funziona

Esecuzione base:

```bash
isort .
```

Esempio di import disordinati:

```python
from myapp.core import run
import json
import requests
from pathlib import Path
```

Dopo `isort`:

```python
import json
from pathlib import Path

import requests

from myapp.core import run
```

## API / Sintassi

Configurazione in `pyproject.toml`:

```toml
[tool.isort]
profile = "black"
src_paths = ["src", "tests"]
```

Comandi comuni:

```bash
isort .
isort src tests
isort --check-only .
isort --diff .
```

`--check-only` e utile in CI: fallisce se gli import non sono ordinati, senza modificare i file.

## Esempio pratico

Workflow locale:

```bash
isort .
python -m pytest
```

Con `pre-commit`, `isort` puo girare automaticamente prima del commit, evitando che import disordinati arrivino nel repository.

## Varianti

- **Uso standalone**: comando manuale `isort .`.
- **In `pre-commit`**: ordinamento automatico prima del commit.
- **In CI**: controllo con `--check-only`.
- **Profilo Black**: evita conflitti con Black sulle righe lunghe.
- **Ruff import sorting**: in alcuni progetti il ruolo di `isort` puo essere coperto da Ruff.

## Errori comuni

- Non configurare compatibilita con il formatter usato.
- Ordinare import a mano e ottenere diff instabili.
- Non indicare correttamente quali package sono locali.
- Far girare `isort` dopo il formatter se il workflow del progetto prevede l'ordine opposto.
- Mescolare `isort` e un altro tool che ordina import con regole diverse.

## Checklist

- Il progetto ha una configurazione condivisa?
- `isort` e compatibile con Black o il formatter scelto?
- Gli import locali vengono riconosciuti correttamente?
- Il controllo gira in pre-commit o CI?
- Il team usa lo stesso comando?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Stile]]
- [[pre-commit]]
- [[uv pipx e poetry]]
