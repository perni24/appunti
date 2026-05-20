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
  - testing
  - tooling
aliases: []
prerequisites: []
related: []
---

# tox e nox

## Sintesi

**tox** e **nox** automatizzano test e comandi in ambienti Python isolati, spesso su piu versioni dell'interprete.

## tox

`tox` usa configurazione dichiarativa per definire ambienti.

```ini
[testenv]
deps = pytest
commands = pytest
```

## nox

`nox` usa sessioni Python programmatiche.

```python
import nox

@nox.session
def tests(session):
    session.install("pytest")
    session.run("pytest")
```

## Quando usarli

- Testare piu versioni Python.
- Riprodurre CI localmente.
- Separare lint, test, type checking e build.

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
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]


