---
date: 2026-05-20
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

## Concetto chiave

I controlli vengono dichiarati in `.pre-commit-config.yaml` e girano in ambienti isolati.

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.0.0
    hooks:
      - id: black
```

## Uso base

```powershell
pre-commit install
pre-commit run --all-files
```

## Vantaggi

- Riduce errori banali.
- Uniforma stile.
- Anticipa controlli CI.
- Evita commit con file generati male.

## Obiettivo

Da completare: descrivere cosa ottenere in pratica.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Procedura

1. Da completare.
2. Da completare.
3. Da completare.

## Snippet

```text
Da completare con codice o comando riutilizzabile.
```

## Adattamenti comuni

- Da completare: varianti per casi frequenti.

## Debug rapido

- Da completare: controlli rapidi in caso di errore.

## Checklist finale

- Da completare: verifiche finali.

## Collegamenti
- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/isort|isort]]
- [[Programmazione/Python/Pagine/Testing|Testing]]


