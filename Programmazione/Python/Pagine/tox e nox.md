---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - testing
  - tooling
aliases:
  - tox
  - nox
prerequisites: []
related: []
title: tox e nox
---

# tox e nox

## Obiettivo

Automatizzare installazione e controlli in ambienti Python separati, con gli stessi comandi in locale e CI.

- **tox** descrive ambienti, dipendenze e comandi in configurazione dichiarativa.
- **nox** definisce sessioni in un file Python, utile quando serve logica esplicita.

Nessuno dei due e un test runner: qui il runner e pytest e il linter e Ruff. Un virtualenv non e una sandbox di sicurezza, un container o una copia dell'ambiente di produzione.

Baseline: CPython 3.12.10, tox 4.67.1, nox 2026.10.20, pytest 9.1.1 e Ruff 0.17.3 su Windows. Le prove riguardano Python 3.12, non tutte le versioni dichiarabili.

## Quando usarlo

- Una libreria deve essere installata e testata su piu interpreti.
- Lint, test, typing o documentazione richiedono dipendenze diverse.
- Il comando locale deve corrispondere a quello della pipeline.

Per un piccolo script puo bastare un virtualenv e pytest. Scegli normalmente uno dei due orchestratori: mantenere due configurazioni equivalenti aumenta la manutenzione.

## Procedura

### 1. Partire da un progetto completo

Riusa tutti i file di [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]: `appunti-calc-demo`, package `appunti_calc` in `src/` e `tests/test_core.py`. Non copiare soltanto il file di configurazione in una directory vuota.

Il demo ha gia due test `unittest`, che pytest puo raccogliere. Installa l'orchestratore scelto in un ambiente di strumenti, non nelle dipendenze runtime del package:

```text
python -m pip install "tox==4.67.1"
```

Alternativa nox:

```text
python -m pip install "nox==2026.10.20"
```

Devono essere disponibili anche gli interpreti richiesti. Il Python che avvia tox/nox e quello che esegue una sessione possono essere diversi.

### 2. Configurare tox

Aggiungi le tabelle seguenti al `pyproject.toml` del package senza sostituire quelle gia presenti.

#### Configurazione tox in pyproject.toml

```toml
[tool.tox]
env_list = ["py312", "lint"]
skip_missing_interpreters = false

[tool.tox.env_run_base]
package = "wheel"
deps = ["pytest==9.1.1"]
commands = [
  ["python", "-I", "-m", "pytest", "-q",
   { replace = "posargs", default = ["tests"], extend = true }]
]

[tool.tox.env.lint]
base_python = ["python3.12"]
package = "skip"
deps = ["ruff==0.17.3"]
commands = [["python", "-m", "ruff", "check", "src", "tests"]]
```

`py312` seleziona Python 3.12. L'ambiente di test costruisce e installa una wheel; `lint` non installa il package, perche analizza sorgenti. Il flag Python `-I` evita che la directory corrente e `PYTHONPATH` facciano riuscire per caso l'import del package non installato.

Qui Ruff usa le regole predefinite, non una verifica statica completa. Puoi aggiungere una policy nella configurazione condivisa; non confondere questa sessione con test o type checking.

La configurazione usa TOML nativo. La documentazione tox corrente indica INI come deprecato ma ancora funzionante: i vecchi `tox.ini` non diventano automaticamente invalidi. Se ne esiste uno, verifica la precedenza prima di aggiungere TOML, altrimenti potresti continuare a eseguire la configurazione precedente.

### 3. Eseguire tox

Dalla radice del package, elenca gli ambienti:

```text
python -m tox list
```

Esegui gli ambienti predefiniti:

```text
python -m tox run
```

Solo Python 3.12:

```text
python -m tox run -e py312
```

Passa argomenti al runner:

```text
python -m tox run -e py312 -- tests/test_core.py -k test_sum
```

La sostituzione `posargs` rimpiazza il valore predefinito `tests`: con `-k` soltanto, pytest usera la propria discovery. Il risultato atteso e un test selezionato e uno escluso, non l'intera suite.

### 4. Configurare nox come alternativa

#### noxfile.py

```python
import nox

nox.options.error_on_missing_interpreters = True
nox.options.error_on_external_run = True


@nox.session(python="3.12", download_python="never")
def tests(session):
    session.install("pytest==9.1.1")
    session.install(".")
    session.run(
        "python", "-I", "-m", "pytest", "-q", *(session.posargs or ["tests"])
    )


@nox.session(python="3.12", download_python="never")
def lint(session):
    session.install("ruff==0.17.3")
    session.run("python", "-m", "ruff", "check", "src", "tests")
```

nox non installa il progetto automaticamente: `session.install(".")` e intenzionale. Esegue un'installazione normale, non editable. I comandi Python sono quelli dell'ambiente della sessione; un eseguibile esterno e rifiutato dalla policy scelta.

Il download di interpreti e disabilitato in questo esempio; i nox recenti possono supportarlo con backend/extra appropriati. Un interprete mancante deve produrre un errore, non un apparente successo perche la sessione e stata saltata.

Elenca le sessioni:

```text
python -m nox --list
```

Esegui test e lint:

```text
python -m nox
```

Solo test:

```text
python -m nox -s tests
```

Solo un test selezionato:

```text
python -m nox -s tests -- tests/test_core.py -k test_sum
```

Solo lint:

```text
python -m nox -s lint
```

### 5. Integrare e interpretare l'esito

In CI esegui il comando dell'orchestratore dopo checkout, installazione degli interpreti e degli strumenti. Un test fallito deve rendere non riuscita la sessione e il job.

Gli ambienti e gli artefatti locali non appartengono al versionamento. Integra nel `.gitignore`:

```gitignore
.tox/
.nox/
.pytest_cache/
.ruff_cache/
__pycache__/
*.egg-info/
build/
dist/
```

Non usare i test come backup: tox e nox possono ricreare le proprie directory di ambiente.

## Snippet

### Ricreare un ambiente tox

Rimuove e ricrea l'ambiente selezionato; non conservarvi dati o lavoro manuale:

```text
python -m tox run -r -e py312
```

### Riutilizzare un ambiente nox

```text
python -m nox -r -s tests
```

`-r` riusa il virtualenv ma non elimina gli `install` della sessione. `-R` salta anche le reinstallazioni quando riusa l'ambiente: e piu veloce, ma puo lasciare codice e dipendenze vecchi dopo modifiche al progetto. Non usarlo come verifica pulita del rilascio.

### Matrice di versioni

Per estendere il progetto, modifica `env_list` tox, per esempio con `py312`, `py313` e `py314`; in nox sostituisci il decoratore dei test con:

```python
@nox.session(python=["3.12", "3.13", "3.14"], download_python="never")
```

E solo la riga da sostituire sopra la stessa funzione, non un file Python autonomo. Verifica i nomi generati con `--list`: le sessioni parametrizzate avranno suffissi come `tests-3.12`.

Installa gli interpreti richiesti e verifica compatibilita di runtime, backend di build e dipendenze. Elencare tre versioni non dimostra di averne testate tre; non abilitare gli skip per far passare una matrice obbligatoria.

## Adattamenti comuni

- **Applicazione non distribuibile**: in tox puoi usare `package = "skip"` e in nox omettere l'installazione del progetto, ma devi definire esplicitamente come i test importano/eseguono il codice. Non aggiungere `PYTHONPATH=src` per nascondere un packaging rotto di una libreria.
- **Dipendenze**: fissare pytest/Ruff non blocca transitivi, dipendenze applicative e backend. Per riproducibilita piu forte serve una policy di lock/constraints coerente con interpreti e piattaforme.
- **Variabili d'ambiente**: tox filtra quelle ereditate tramite `pass_env`; nox normalmente le eredita, salvo configurazione. Passa solo cio che serve e usa servizi di test, non credenziali o database di produzione.
- **Comandi esterni**: in tox usa una `allowlist_externals` mirata; in nox `external=True` solo per un comando fidato. Non autorizzare tutto per risolvere un errore di PATH.
- **Editable**: utile durante sviluppo, ma non sostituisce la prova dell'artefatto distribuibile. In nox `session.install(".")` non controlla da solo che una sdist contenga tutti i file necessari.
- **Altre sessioni**: typing, build e docs seguono lo stesso schema, con dipendenze proprie. Evita di eseguirle tutte a ogni commit: [[Programmazione/Python/Pagine/pre-commit|pre-commit]] puo mantenere controlli veloci.

## Debug rapido

- **Interprete mancante**: installalo oppure seleziona esplicitamente una sessione disponibile; documenta la matrice non eseguita.
- **ModuleNotFoundError**: controlla installazione del package, layout e nome importabile. La dipendenza nell'ambiente da cui avvii tox/nox non e automaticamente in quello dei test.
- **Errore prima dei test**: distingue setup/build/installazione dall'esecuzione del runner.
- **Risultato inatteso dopo una modifica**: elimina il riuso improprio o ricrea l'ambiente selezionato; controlla quale configurazione e stata caricata.
- **Command not allowed/external**: installa il tool nelle dipendenze della sessione, se possibile.
- **Lint passato, test falliti**: non sono controlli equivalenti. Verifica il riepilogo completo e l'exit code.
- **Locale verde, CI rossa**: confronta interprete, sistema operativo, file tracciati, variabili e risoluzione delle dipendenze.

## Checklist finale

- Il package e installato davvero nell'ambiente dei test?
- Il laboratorio usa i file completi della nota Packaging?
- Gli interpreti obbligatori mancanti provocano un errore?
- Argomenti aggiuntivi e sessioni selezionate hanno l'effetto atteso?
- Almeno una controprova rileva un test deliberatamente rotto?
- CI e locale condividono comandi, versioni e criteri di esito?
- Ambienti isolati, cache e segreti sono distinti dalla produzione?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]
- [[Programmazione/Python/Pagine/uv pipx e poetry|uv pipx e poetry]]

## Fonti

- [tox: configurazione e formati](https://tox.wiki/en/stable/reference/config.html).
- [tox: ambienti, packaging e variabili](https://tox.wiki/en/stable/explanation.html).
- [nox: configurazione, install e run](https://nox.thea.codes/en/stable/config.html).
- [nox: CLI, riuso e interpreti](https://nox.thea.codes/en/stable/usage.html).
