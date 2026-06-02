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
  - testing
  - tooling
aliases: []
prerequisites: []
related: []
---

# tox e nox

## Sintesi

**tox** e **nox** automatizzano test e comandi in ambienti Python isolati, spesso su piu versioni dell'interprete.

## Quando usarlo

### Quando usarli
- Testare piu versioni Python.
- Riprodurre CI localmente.
- Separare lint, test, type checking e build.

## Come funziona

### tox
`tox` usa configurazione dichiarativa per definire ambienti.

```ini
[testenv]
deps = pytest
commands = pytest
```
### nox
`nox` usa sessioni Python programmatiche.

```python
import nox

@nox.session
def tests(session):
    session.install("pytest")
    session.run("pytest")
```

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

- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
