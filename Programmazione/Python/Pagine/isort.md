---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - python
  - tooling
  - import
aliases:
  - isort
prerequisites: []
related: []
title: isort
---

# isort

## Obiettivo

Ordinare gli import in modo ripetibile, distinguendo standard library, dipendenze esterne e package del progetto. `isort` modifica lo stile degli import: non installa moduli, non controlla i tipi e non dimostra che il programma funzioni.

Baseline del laboratorio: CPython 3.12.10, isort 9.0.2 e Black 26.10.1 su Windows. I numeri fissano l'esempio verificato, non sono una regola universale per tutti i progetti.

## Quando usarlo

- Il progetto usa gia Black e vuole un ordinatore degli import separato.
- Editor, hook e CI devono produrre lo stesso risultato.
- Serve una policy esplicita per package locali e cartelle escluse.

Se usi gia Ruff con le regole `I`, valuta di affidargli anche questo compito: non aggiungere automaticamente un secondo ordinatore. Il confronto tra formatter, linter e test e in [[Programmazione/Python/Pagine/Stile|Stile]].

## Procedura

### 1. Preparare l'ambiente

Con un virtualenv dedicato gia selezionato:

```text
python -m pip install "isort==9.0.2" "black==26.10.1"
```

Non serve installare le dipendenze importate per il solo riordino testuale. Serviranno invece per eseguire davvero il programma. Per il laboratorio riusa il progetto `appunti-calc-demo` di [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]].

### 2. Condividere la configurazione

Aggiungi queste tabelle al `pyproject.toml` del progetto, integrandole se esistono gia. Non sostituire le sezioni di packaging.

#### Configurazione isort e Black

```toml
[tool.isort]
profile = "black"
line_length = 88
py_version = 312
src_paths = ["src", "tests"]
known_first_party = ["appunti_calc"]
skip_gitignore = true
filter_files = true
extend_skip = ["generated"]

[tool.black]
line-length = 88
target-version = ["py312"]
```

`src_paths` aiuta a riconoscere i moduli del progetto; non imposta `PYTHONPATH` e non indica quali file scandire. `known_first_party` rende esplicito il nome importabile, diverso da `appunti-calc-demo`.

`py_version` riguarda la classificazione della standard library. Non esegue Python 3.12 e non verifica la compatibilita della sintassi.

Il profilo Black coordina l'impaginazione degli import, ma non avvia Black. Mantieni coerente anche la lunghezza delle righe. `skip_gitignore` richiede Git; `filter_files` applica i filtri anche ai file passati esplicitamente, come avviene con gli hook. `extend_skip` aggiunge esclusioni senza rimpiazzare quelle predefinite.

### 3. Controllare prima di modificare

Dalla radice del progetto:

```text
python -m isort --check-only --diff src tests
```

Gli import fuori ordine producono un exit code non zero e un diff; i file restano invariati. Non confondere un controllo fallito con un errore di installazione: leggi il messaggio.

Per vedere soltanto la proposta:

```text
python -m isort --diff src tests
```

Il solo `--diff` non e il controllo da usare per far fallire la CI.

### 4. Applicare e verificare

Questo comando riscrive i file selezionati: parti da modifiche versionate o da una copia e controlla il diff.

```text
python -m isort src tests
```

Poi esegui il formatter scelto:

```text
python -m black src tests
```

Controlla il risultato:

```text
python -m isort --check-only --diff src tests
```

```text
python -m black --check --diff src tests
```

Per il package dimostrativo, gia installato nell'ambiente, esegui anche i test:

```text
python -m unittest discover -s tests
```

Riordinare import puo cambiare gli effetti collaterali di inizializzazione: un controllo di stile superato non sostituisce i test.

## Snippet

### Prima del riordino

Esempio testuale che usa `pytest` come dipendenza esterna; non va eseguito come applicazione:

```python
from appunti_calc import add
import sys
import pytest
from pathlib import Path
```

### Dopo il riordino

```python
import sys
from pathlib import Path

import pytest

from appunti_calc import add
```

I nomi non usati restano: isort non e un controllo di import inutilizzati come Ruff F401.

### Ordine intenzionale

Quando un modulo configura un runtime prima di importare componenti che lo consumano, documenta il vincolo e circoscrivi l'eccezione. Questo e uno schema, non due moduli forniti dal demo:

```python
# La configurazione deve precedere il caricamento dei componenti.
# isort: off
import runtime_setup
import application_plugins
# isort: on
```

Non usare eccezioni estese per nascondere import circolari. Anche una direttiva `skip` su una singola riga ha regole proprie: non equivale necessariamente a congelarne la posizione rispetto a tutti gli altri import.

## Adattamenti comuni

- **CI**: usa `--check-only --diff` con le stesse versioni, configurazione e directory del controllo locale.
- **Editor**: scegli l'interprete corretto e verifica quale configurazione viene caricata.
- **pre-commit**: usa l'hook isort e lascia le impostazioni nel `pyproject.toml`; esempio completo nella [[Programmazione/Python/Pagine/pre-commit|nota dedicata]].
- **Monorepo**: configura esplicitamente i confini dei progetti; non presumere che il risultato sia indipendente dalla directory di avvio.
- **Ruff**: le regole `I` appartengono a `ruff check`, non a `ruff format`. Scegli un proprietario del riordino e verifica la migrazione prima di rimuovere isort.

## Debug rapido

- **Package locale nel gruppo esterno**: controlla nome importabile, `src_paths` e `known_first_party`, non soltanto la presenza del virtualenv.
- **File generato modificato**: verifica gli argomenti, `extend_skip` e `filter_files`; una directory nel file di configurazione non e automaticamente una directory esclusa.
- **Diff alternati con Black**: confronta profilo, lunghezza, versioni e configurazioni effettive.
- **Import riusciti prima ma non dopo**: cerca inizializzazioni e dipendenze dall'ordine, non eliminare il test che segnala il problema.
- **Locale e CI divergono**: controlla lo stesso file da entrambe le directory di avvio e ispeziona la configurazione:

```text
python -m isort --show-config src/appunti_calc/cli.py
```

## Checklist finale

- Controllo e correzione sono comandi distinti?
- Nome importabile e percorsi del progetto sono corretti?
- Le esclusioni funzionano anche sui file espliciti?
- Un secondo passaggio non cambia nuovamente i file?
- Black e isort concordano, oppure Ruff e l'unico ordinatore?
- Il diff e i test sono stati controllati dopo le correzioni?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]

## Fonti

- [isort: opzioni di configurazione](https://isort.readthedocs.io/en/latest/configuration/options.html).
- [isort: integrazione con Black](https://isort.readthedocs.io/en/latest/configuration/black_compatibility.html).
- [isort: direttive nel codice](https://isort.readthedocs.io/en/latest/configuration/action_comments.html).
- [Ruff: linter e selezione delle regole](https://docs.astral.sh/ruff/linter/).
