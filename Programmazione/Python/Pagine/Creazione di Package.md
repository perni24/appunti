---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, packaging]
aliases: [Creazione di Package, Package Python]
prerequisites: []
related: []
---

# Creazione di Package in Python

## Sintesi

Un package Python organizza moduli correlati in una struttura importabile e riutilizzabile. Serve quando il codice cresce oltre uno script singolo, quando vuoi separare responsabilita o quando devi distribuire una libreria.

Da distinguere:

- **modulo**: singolo file `.py`;
- **package**: directory importabile con moduli e sottopackage;
- **distribuzione**: artefatto installabile con `pip`.

## Quando usarlo

Crea un package quando:

- il progetto ha piu moduli;
- vuoi import stabili e leggibili;
- devi scrivere test realistici;
- vuoi installare il progetto in editable mode;
- stai costruendo una libreria;
- vuoi preparare il codice alla distribuzione.

Per script piccoli e temporanei, un singolo file puo bastare.

## Come funziona

Struttura moderna con layout `src/`:

```text
my-project/
├── pyproject.toml
├── README.md
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── core.py
│       └── utils.py
└── tests/
    └── test_core.py
```

Il layout `src/` riduce il rischio di import accidentali dal root del repository e rende i test piu simili all'uso reale del package installato.

`__init__.py` puo esporre l'API pubblica:

```python
from .core import Client

__all__ = ["Client"]
```

## API / Sintassi

`pyproject.toml` minimale:

```toml
[build-system]
requires = ["setuptools>=61"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "0.1.0"
description = "Example package"
readme = "README.md"
requires-python = ">=3.11"
dependencies = []
```

Installazione locale in editable mode:

```bash
python -m pip install -e .
```

Import assoluto:

```python
from my_package.utils import parse_data
```

Import relativo dentro il package:

```python
from .utils import parse_data
```

## Esempio pratico

Package minimale:

```text
calculator/
├── pyproject.toml
└── src/
    └── calculator/
        ├── __init__.py
        └── operations.py
```

`operations.py`:

```python
def add(a, b):
    return a + b
```

`__init__.py`:

```python
from .operations import add

__all__ = ["add"]
```

Uso dopo `python -m pip install -e .`:

```python
from calculator import add

print(add(2, 3))
```

## Varianti

- **Package semplice**: directory con moduli e `__init__.py`.
- **Sottopackage**: directory annidate per aree funzionali.
- **Namespace package**: package distribuiti su piu directory, meno comune per progetti piccoli.
- **Layout flat**: codice direttamente nel root, piu semplice ma piu facile da importare per errore.
- **Layout `src/`**: preferibile per librerie e progetti non banali.

## Errori comuni

- Confondere nome della distribuzione e nome importabile.
- Mettere troppa logica in `__init__.py`.
- Esportare tutto senza definire una vera API pubblica.
- Usare nomi che collidono con moduli standard, come `email`, `json` o `logging`.
- Affidarsi a import che funzionano solo dal root del progetto.
- Non installare il package in editable mode durante lo sviluppo.
- Mischiare codice applicativo, test e script senza struttura.

## Checklist

- Il progetto ha una struttura importabile chiara?
- `pyproject.toml` definisce metadati e build system?
- L'API pubblica e esplicita?
- I test importano il package come farebbe un utente?
- Il nome scelto evita collisioni?
- Il package e installabile in editable mode?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Pip e PyPI]]
- [[Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[uv pipx e poetry]]
