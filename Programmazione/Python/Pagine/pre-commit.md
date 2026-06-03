---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
difficulty: beginner
tags: [programmazione, python, tooling, git]
aliases: [pre-commit]
prerequisites: []
related: []
---

# pre-commit

## Sintesi

`pre-commit` esegue controlli automatici prima di un commit Git. In un progetto Python puo avviare formatter, linter, ordinamento import, type checker e controlli sui file.

Serve a spostare errori banali prima della CI e a mantenere il repository coerente.

## Quando usarlo

Usa `pre-commit` quando:

- vuoi applicare regole di stile in modo automatico;
- vuoi evitare commit con file mal formattati;
- il progetto ha piu collaboratori;
- vuoi controlli locali simili alla CI;
- vuoi eseguire hook anche su YAML, JSON, Markdown o file generici.

## Come funziona

I controlli sono dichiarati in `.pre-commit-config.yaml`. Dopo l'installazione degli hook, Git esegue `pre-commit` prima di creare il commit.

```bash
pre-commit install
```

Esecuzione manuale su tutti i file:

```bash
pre-commit run --all-files
```

Esempio di configurazione:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
```

Le versioni degli hook vanno aggiornate periodicamente con criterio.

## API / Sintassi

Comandi comuni:

```bash
pre-commit install
pre-commit run
pre-commit run --all-files
pre-commit autoupdate
```

Hook locale:

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: python -m pytest
        language: system
        pass_filenames: false
```

## Esempio pratico

Configurazione tipica per stile Python:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort

  - repo: local
    hooks:
      - id: tests
        name: tests
        entry: python -m pytest
        language: system
        pass_filenames: false
```

## Varianti

- **Hook ufficiali generici**: whitespace, YAML, file final newline.
- **Hook Python**: formatter, import sorting, linter, test.
- **Hook locali**: comandi definiti dal progetto.
- **Esecuzione su commit**: comportamento standard.
- **Esecuzione manuale**: `pre-commit run --all-files`.
- **CI**: gli stessi hook possono essere eseguiti anche in pipeline.

## Errori comuni

- Non eseguire `pre-commit install` dopo aver aggiunto la configurazione.
- Usare hook senza fissare versioni.
- Mettere controlli troppo lenti su ogni commit.
- Duplicare controlli incompatibili tra loro.
- Non eseguire `pre-commit run --all-files` dopo la prima configurazione.
- Trattare pre-commit come sostituto completo della CI.

## Checklist

- `.pre-commit-config.yaml` e versionato?
- Gli hook hanno versioni fissate?
- I controlli sono abbastanza veloci per girare spesso?
- `pre-commit run --all-files` passa?
- La CI ripete i controlli importanti?
- Gli hook non si sovrappongono in modo conflittuale?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Stile]]
- [[isort]]
- [[Testing]]
- [[tox e nox]]
