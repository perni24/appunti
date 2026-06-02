---
date: 2026-06-02
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - tooling
  - git
aliases: []
prerequisites: []
related: []
---

# pre-commit

## Sintesi

**pre-commit** esegue controlli automatici prima di un commit Git, come formatter, linter, type checker e validazioni sui file.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
I controlli vengono dichiarati in `.pre-commit-config.yaml` e girano in ambienti isolati.

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.0.0
    hooks:
      - id: black
```
### Uso base
```powershell
pre-commit install
pre-commit run --all-files
```
### Vantaggi
- Riduce errori banali.
- Uniforma stile.
- Anticipa controlli CI.
- Evita commit con file generati male.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Procedura
1. Da completare.
2. Da completare.
3. Da completare.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/isort|isort]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
