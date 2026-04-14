---
date: 2026-04-14
tags:
  - programmazione
  - python
  - packaging
  - package
type: #permanent-note
status: budding
---

# Creazione di Package in Python

## 💡 Concetto Chiave
Un **package** Python e un modo per organizzare moduli correlati dentro una struttura riutilizzabile e importabile. Serve a dare un namespace coerente al codice, migliorare la manutenibilita e preparare il progetto alla distribuzione o al riuso.

In pratica:
- un **modulo** e un singolo file `.py`;
- un **package** e una directory Python strutturata per contenere moduli e sottopackage;
- una **distribuzione** e l'artefatto installabile che puo essere pubblicato o installato con `pip`.

> [!INFO] Distinzione importante
> Il nome del package importato nel codice e il nome della distribuzione installata con `pip` possono coincidere, ma non sono concetti identici.

---

## 📝 Struttura minima

Una struttura semplice di package puo essere:

```text
my_package/
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

### Elementi principali
- `src/my_package/`: codice del package.
- `__init__.py`: marca la directory come package Python e puo esporre API pubbliche.
- `pyproject.toml`: file moderno per build system e metadati del progetto.
- `tests/`: test del package.

Il layout `src/` e oggi molto diffuso per evitare import accidentali dal root del repository.

---

## 💻 Esempi Pratici

### Package minimale

```text
calculator/
└── calculator/
    ├── __init__.py
    └── operations.py
```

Contenuto di `operations.py`:

```python
def add(a, b):
    return a + b
```

Contenuto di `__init__.py`:

```python
from .operations import add
```

Uso:

```python
from calculator import add

print(add(2, 3))
```

### Package con sottopackage

```text
my_app/
└── my_app/
    ├── __init__.py
    ├── services/
    │   ├── __init__.py
    │   └── email_service.py
    └── models/
        ├── __init__.py
        └── user.py
```

Questa struttura diventa utile quando il progetto cresce e hai bisogno di separare responsabilita diverse.

---

## ⚙️ Funzionamento Interno (Teoria)

### `__init__.py`
Storicamente `__init__.py` serve a definire una directory come package Python. Oggi esistono anche i namespace package, ma nella pratica usare `__init__.py` resta la soluzione piu chiara e prevedibile.

`__init__.py` puo essere usato per:
- esporre simboli pubblici;
- inizializzare il package;
- definire `__all__`;
- mantenere una API di import piu pulita.

```python
from .core import Client
from .utils import parse_data
```

### Import relativi e assoluti
Dentro un package puoi usare:

- import assoluti:

```python
from my_package.utils import parse_data
```

- import relativi:

```python
from .utils import parse_data
```

Gli import relativi sono spesso comodi all'interno del package, ma gli import assoluti sono spesso piu leggibili in codebase grandi.

### Package vs distribuzione
Quando fai:

```bash
python -m pip install my-package
```

stai installando una **distribuzione**. Una volta installata, quella distribuzione espone uno o piu package importabili:

```python
import my_package
```

Questo si collega direttamente a [[Pip e PyPI]].

---

## 📦 `pyproject.toml`

Nel packaging moderno Python, `pyproject.toml` e il file centrale per dichiarare metadati e sistema di build.

Esempio minimale:

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

Questo file descrive:
- come costruire il package;
- nome e versione della distribuzione;
- compatibilita Python;
- dipendenze runtime.

---

## 🧠 Installazione locale e sviluppo

Durante lo sviluppo, un package viene spesso installato in editable mode:

```bash
python -m pip install -e .
```

Questo permette di modificare il codice sorgente locale e vedere subito gli effetti senza reinstallare il package a ogni cambiamento.

Il workflow tipico e:

1. creare un ambiente virtuale;
2. strutturare il progetto come package;
3. definire `pyproject.toml`;
4. installare in editable mode;
5. eseguire test e usare gli import come farebbe un consumer reale.

Questa nota si collega quindi anche a [[Ambienti Virtuali]].

---

## 🔒 API pubblica e organizzazione

Creare un package non significa solo "mettere file in una cartella". Significa anche definire:
- quali moduli fanno parte dell'API pubblica;
- quali componenti sono interni;
- come evolvere la struttura senza rompere chi usa il package.

Una convenzione utile e:
- esportare esplicitamente API stabili in `__init__.py`;
- trattare moduli con `_nome.py` come interni;
- evitare di esporre troppi dettagli implementativi.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Usa una struttura chiara:** separa codice, test e metadati del progetto.
- ✅ **Preferisci `pyproject.toml`:** e lo standard moderno del packaging Python.
- ✅ **Usa `src/` per progetti non banali:** evita import accidentali dal repository root.
- ✅ **Definisci un'API pubblica esplicita:** non costringere chi usa il package a import complessi o instabili.
- ✅ **Installa in editable mode durante lo sviluppo:** rende il workflow piu veloce e realistico.
- ❌ **Non confondere modulo, package e distribuzione:** sono livelli diversi del packaging.
- ❌ **Non esportare tutto da `__init__.py` senza criterio:** crea namespace confusi e accoppiamento inutile.
- 💣 **Attenzione ai nomi dei package:** evitare collisioni con moduli standard come `json`, `threading` o `email`.
- 💣 **Attenzione agli import relativi profondi:** possono diventare fragili se la struttura evolve male.

---
