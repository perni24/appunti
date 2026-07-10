---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, testing, tooling]
aliases: [tox, nox]
prerequisites: []
related: []
---

# tox e nox

## Sintesi

`tox` e `nox` automatizzano test e comandi in ambienti Python isolati. Sono utili per riprodurre la CI localmente, testare piu versioni Python e separare lint, test, type checking e build.

La differenza principale:

- **tox** usa configurazione dichiarativa;
- **nox** usa sessioni Python programmatiche.

## Quando usarlo

Usali quando:

- devi testare piu versioni di Python;
- vuoi ambienti puliti per ogni tipo di controllo;
- vuoi riprodurre la CI localmente;
- una libreria deve garantire compatibilita ampia;
- vuoi separare `tests`, `lint`, `typing`, `docs` e `build`.

Per progetti piccoli puo bastare `python -m pytest`.

## Come funziona

Esempio `tox.ini`:

```ini
[tox]
envlist = py311, py312

[testenv]
deps = pytest
commands = pytest
```

Esecuzione:

```bash
tox
```

Esempio `noxfile.py`:

```python
import nox


@nox.session
def tests(session):
    session.install("pytest")
    session.run("pytest")
```

Esecuzione:

```bash
nox
```

## API / Sintassi

Eseguire un ambiente tox specifico:

```bash
tox -e py312
```

Definire piu ambienti:

```ini
[tox]
envlist = lint, tests

[testenv:lint]
deps = ruff
commands = ruff check .

[testenv:tests]
deps = pytest
commands = pytest
```

Sessione nox con versione Python:

```python
@nox.session(python=["3.11", "3.12"])
def tests(session):
    session.install("pytest")
    session.run("pytest")
```

## Esempio pratico

Workflow con nox:

```python
import nox


@nox.session
def lint(session):
    session.install("ruff")
    session.run("ruff", "check", ".")


@nox.session
def tests(session):
    session.install("pytest")
    session.run("pytest")
```

Comandi:

```bash
nox -s lint
nox -s tests
```

## Varianti

- **tox per librerie**: comodo per matrix di versioni Python.
- **nox per automazioni flessibili**: utile quando la logica e piu complessa.
- **Ambienti separati**: lint, tests, typing, build, docs.
- **CI mirror**: lo stesso comando usato localmente viene eseguito in pipeline.
- **Pre-commit leggero + tox/nox pesante**: hook veloci prima del commit, suite completa in CI.

## Errori comuni

- Usare tox/nox per progetti troppo piccoli senza reale beneficio.
- Duplicare logica diversa tra CI e comandi locali.
- Non fissare dipendenze critiche dei test.
- Creare ambienti lentissimi eseguiti troppo spesso.
- Confondere isolamento tox/nox con ambiente di produzione.
- Non documentare quali sessioni usare nel workflow quotidiano.

## Checklist

- Serve davvero una matrice di ambienti?
- I comandi locali e CI sono allineati?
- Le sessioni sono nominate chiaramente?
- Lint, test e typing sono separati quando utile?
- Gli ambienti restano veloci abbastanza?
- Il progetto documenta il comando principale?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Ambienti Virtuali]]
- [[pre-commit]]
- [[uv pipx e poetry]]
