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
  - programming
  - packaging
aliases:
  - Creazione di Package
  - Package Python
prerequisites: []
related: []
title: Creazione di Package in Python
---

# Creazione di Package in Python

## Sintesi

Un **modulo** e un'unita importabile, spesso un file `.py`. Un **package** organizza moduli e sottopackage. Una **distribuzione** e cio che installi: puo contenere uno o piu package importabili.

Questa nota costruisce un solo esempio coerente: distribuzione `appunti-calc-demo`, package `appunti_calc` e CLI `appunti-calc`. I nomi sono didattici, non una disponibilita verificata su PyPI.

Baseline: CPython 3.12.10, build 1.6.1 e setuptools 84.2.1. La build usa standard di packaging, non richiede Poetry o uv.

## Quando usarlo

- Separare responsabilita senza dipendere dalla directory di avvio.
- Riutilizzare una libreria o installare una CLI.
- Testare lo stesso artefatto che verra distribuito.
- Definire metadati e dipendenze in `pyproject.toml`.

Per uno script temporaneo semplice puo bastare un solo file.

## Come funziona

### Import, package e API pubblica

Un package regolare contiene `__init__.py`; i namespace package sono un caso diverso e possono non averlo. Un import esegue il codice del modulo al primo caricamento nel processo e normalmente lo recupera poi da `sys.modules`. Evita avvii di server o scritture come effetti collaterali degli import.

`from .operations import add` e relativo al package corrente. Non funziona allo stesso modo eseguendo il file interno come script: usa `python -m appunti_calc` o la CLI installata.

`__all__` documenta/esprime i nomi da esportare con wildcard import; **non impedisce** l'accesso agli altri attributi. La API pubblica e anche una scelta progettuale e di compatibilita.

### Layout src e artefatti

```text
appunti-calc-demo/
|-- pyproject.toml
|-- README.md
|-- src/
|   +-- appunti_calc/
|       |-- __init__.py
|       |-- __main__.py
|       |-- operations.py
|       +-- cli.py
+-- tests/
    +-- test_core.py
```

`src/` evita che l'import del package riesca solo perche la radice del repository si trova nel percorso di ricerca. Il package va installato nell'ambiente usato dai test.

Una **sdist** contiene i sorgenti necessari alla build; una **wheel** contiene la distribuzione costruita da installare. Una wheel con estensioni native puo essere specifica di piattaforma e versione Python; quella del demo e Python puro.

## API / Sintassi

### pyproject.toml

File completo per il progetto mostrato:

```toml
[build-system]
requires = ["setuptools>=84.2.1"]
build-backend = "setuptools.build_meta"

[project]
name = "appunti-calc-demo"
version = "0.1.0"
description = "Local packaging example"
readme = "README.md"
requires-python = ">=3.12"
dependencies = []

[project.scripts]
appunti-calc = "appunti_calc.cli:main"

[tool.setuptools.packages.find]
where = ["src"]
```

`[build-system]` definisce il backend e le sue dipendenze, diverse dalle dipendenze runtime in `[project]`. Il limite minimo del backend e scelto per l'esempio verificato; non significa che ogni package richieda quella release. `>=` non fissa la toolchain: la riproducibilita della build richiede una politica separata.

`requires-python` dichiara la compatibilita prevista, non dimostra che tutti gli interpreti successivi siano stati testati. Qui la verifica riguarda solo Python 3.12.

### README.md

```markdown
# Appunti Calc Demo

Esempio locale di package Python puro.
La funzione add accetta due int, escludendo bool.
La CLI appunti-calc somma due argomenti interi.
```

## Esempio pratico

Crea i file seguenti nelle posizioni indicate; i test vengono estratti da questi stessi blocchi.

### `src/appunti_calc/operations.py`

```python
def add(left: int, right: int) -> int:
    if type(left) is not int or type(right) is not int:
        raise TypeError("expected two int values, excluding bool")
    return left + right
```

Il contratto e intenzionalmente ristretto agli `int` esatti: le annotazioni non validano il runtime e `bool` e una sottoclasse di `int`. Per supportare altri numeri servirebbe un contratto diverso.

### `src/appunti_calc/__init__.py`

```python
from .operations import add

__all__ = ["add"]
```

### `src/appunti_calc/cli.py`

```python
import argparse

from .operations import add


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Add two integers")
    parser.add_argument("left", type=int)
    parser.add_argument("right", type=int)
    args = parser.parse_args(argv)
    print(add(args.left, args.right))
    return 0
```

`argparse` converte gli argomenti e termina con codice 2 quando l'input non e valido. `main` restituisce 0 in caso di successo; lo script generato dal packaging usa il valore come exit code.

### `src/appunti_calc/__main__.py`

```python
from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
```

### `tests/test_core.py`

```python
import unittest

from appunti_calc import add


class AddTests(unittest.TestCase):
    def test_sum(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(add(-2, 2), 0)

    def test_rejects_other_types(self):
        for value in (True, 2.5, "2", None):
            with self.subTest(value=value):
                with self.assertRaises(TypeError):
                    add(value, 3)
                with self.assertRaises(TypeError):
                    add(3, value)


if __name__ == "__main__":
    unittest.main()
```

### Installazione di sviluppo e test

Dalla radice del progetto, con un virtualenv dedicato gia selezionato:

```text
python -m pip install -e .
```

L'installazione editable rende visibili le modifiche ai file Python sorgente. Dopo modifiche ai metadati, alle dipendenze o agli entry point puo essere necessaria una reinstallazione. Le estensioni compilate richiedono una gestione propria.

```text
python -m unittest discover -s tests
```

```text
python -m appunti_calc 2 3
```

```text
appunti-calc 2 3
```

Gli ultimi due comandi stampano `5`. La CLI sul PATH richiede l'attivazione dell'ambiente o il percorso esplicito del comando.

### Build e verifica della wheel

Installa il frontend di build nel virtualenv di sviluppo:

```text
python -m pip install build
```

La build produce `dist/` e puo scaricare dipendenze di build in ambienti isolati:

```text
python -m build
```

Di default il frontend costruisce la sdist e poi la wheel a partire da quella sdist. Questo controlla una parte importante del confezionamento, ma non sostituisce i test sul prodotto installato.

Crea un **secondo ambiente pulito**, installa la wheel come nella nota Pip e PyPI e prova import, CLI e test da una directory esterna ai sorgenti. Non limitarti a rieseguire l'editable. Per questa versione il file e `dist/appunti_calc_demo-0.1.0-py3-none-any.whl`.

Questi comandi costruiscono e installano localmente: **non pubblicano su PyPI**. Prima di distribuire realmente servono anche licenza, metadati del progetto, gestione delle versioni e una procedura di rilascio. Non inserire segreti nella sdist o nella wheel.

## Varianti

- **Flat layout**: valido, ma i test eseguiti dalla radice possono importare sorgenti non installati.
- **Sottopackage**: separano domini di un progetto piu grande.
- **Namespace package**: utile per suddividere uno spazio di nomi tra distribuzioni; non e necessario per questo demo.
- **Editable o installazione normale**: entrambi validi in sviluppo secondo lo scopo. L'editable non e un obbligo del linguaggio.
- **Dati inclusi**: template e risorse richiedono configurazione e verifica nell'artefatto; non assumere che tutto il repository venga incluso. Per leggerli valuta `importlib.resources`, non percorsi relativi alla directory corrente.

## Errori comuni

- Confondere nome distribuzione, package importabile e nome del comando.
- Lasciare esempi che importano funzioni non definite nei file del progetto.
- Eseguire direttamente `src/appunti_calc/cli.py` e rompere gli import relativi.
- Usare nomi come `json.py`, `email` o `logging` che mascherano altri moduli.
- Provare soltanto l'editable e spedire una wheel incompleta.
- Considerare `__all__` un controllo di accesso.
- Dichiarare compatibilita con versioni non ancora verificate senza distinguerla dai risultati dei test.

## Checklist

- La struttura contiene tutti i file referenziati?
- Backend, runtime e compatibilita Python sono dichiarati separatamente?
- Import, modulo eseguibile e CLI funzionano dopo installazione?
- Sdist e wheel contengono il necessario senza segreti?
- I test passano anche sulla wheel da fuori del repository?
- Le versioni realmente testate sono registrate?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]

## Fonti

- [PyPA: packaging di un progetto](https://packaging.python.org/en/latest/tutorials/packaging-projects/).
- [PyPA: src layout e flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/).
- [Setuptools: configurazione pyproject.toml](https://setuptools.pypa.io/en/latest/userguide/pyproject_config.html).
- [build: comportamento del frontend](https://build.pypa.io/en/stable/).
- [Python 3.12: package e import](https://docs.python.org/3.12/tutorial/modules.html#packages).
- [pip: installazioni locali ed editable](https://pip.pypa.io/en/stable/topics/local-project-installs/).
