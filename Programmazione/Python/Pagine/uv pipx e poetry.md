---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, packaging, tooling]
aliases: [uv, pipx, poetry, pipx e poetry]
prerequisites: []
related: []
---

# uv, pipx e poetry

## Sintesi

`uv`, `pipx` e `poetry` sono strumenti dell'ecosistema Python per gestire ambienti, dipendenze, tool CLI e packaging.

In breve:

- **uv**: workflow moderno e veloce per ambienti e dipendenze;
- **pipx**: installa applicazioni CLI Python in ambienti isolati;
- **poetry**: gestisce dipendenze, lockfile, packaging e pubblicazione.

## Quando usarlo

Usa:

- `uv` quando vuoi installazioni e ambienti rapidi;
- `pipx` per tool CLI globali come formatter, linter o generatori;
- `poetry` quando vuoi un workflow integrato basato su `pyproject.toml`;
- `pip` e `venv` quando vuoi restare vicino agli strumenti standard.

## Come funziona

Esempi di uso:

```bash
uv venv
uv pip install requests
pipx install black
poetry add fastapi
```

La scelta dello strumento dipende dal tipo di problema:

- dipendenza di progetto;
- tool CLI globale;
- packaging libreria;
- lockfile;
- gestione ambiente.

## API / Sintassi

Con `uv`:

```bash
uv venv
uv pip install -r requirements.txt
uv pip freeze
```

Con `pipx`:

```bash
pipx install black
pipx run cowsay hello
pipx list
```

Con `poetry`:

```bash
poetry init
poetry add requests
poetry install
poetry run pytest
```

## Esempio pratico

Caso 1: installare un tool CLI globale senza sporcare l'ambiente di progetto.

```bash
pipx install pre-commit
pre-commit --version
```

Caso 2: creare ambiente veloce con `uv`.

```bash
uv venv
uv pip install pytest
uv pip freeze
```

Caso 3: progetto gestito con Poetry.

```bash
poetry init
poetry add httpx
poetry add --group dev pytest
poetry run pytest
```

## Varianti

- **`pip` + `venv`**: base standard, esplicita e portabile.
- **`uv`**: alternativa moderna e molto veloce per molte operazioni.
- **`pipx`**: isolamento per applicazioni CLI Python installate a livello utente.
- **`poetry`**: gestione integrata di dipendenze e packaging.
- **`pip-tools`**: workflow basato su input dichiarativi e lock generato.
- **Conda**: comune in data science e quando servono dipendenze non Python.

## Errori comuni

- Usare un tool senza capire quale problema risolve.
- Installare tool CLI dentro l'ambiente del progetto quando dovrebbero essere globali e isolati.
- Mescolare Poetry, pip manuale e lockfile senza disciplina.
- Non versionare lockfile quando serve riproducibilita applicativa.
- Confondere dipendenze runtime e dipendenze di sviluppo.
- Cambiare tool di packaging a meta progetto senza motivo forte.

## Checklist

- Sto gestendo una dipendenza di progetto o un tool CLI?
- Serve un lockfile?
- Il team usa lo stesso strumento?
- Il workflow e documentato?
- Le dipendenze dev sono separate da quelle runtime?
- La scelta riduce complessita o la aumenta?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Ambienti Virtuali]]
- [[Pip e PyPI]]
- [[Creazione di Package]]
- [[pre-commit]]
