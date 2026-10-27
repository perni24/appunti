---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - packaging
  - tooling
aliases:
  - uv
  - pipx
  - poetry
  - pipx e poetry
prerequisites: []
related: []
title: uv, pipx e poetry
---

# uv, pipx e poetry

## Sintesi

Sono strumenti con ruoli sovrapposti, non tre pacchetti da aggiungere automaticamente a ogni progetto:

- **uv** gestisce interpreti, ambienti, progetti e tool; ha anche un'interfaccia di installazione simile a pip.
- **pipx** installa applicazioni CLI Python in ambienti separati e rende disponibili i loro comandi.
- **Poetry** gestisce dipendenze, ambienti, lockfile e packaging di progetti.

Baseline delle prove: CPython 3.12.10, uv 0.13.5, pipx 1.18.4 e Poetry 2.5.1. Le CLI evolvono: verifica la versione e la documentazione corrispondente.

## Quando usarlo

| Esigenza                                 | Scelta possibile                    |
| ---------------------------------------- | ----------------------------------- |
| Ambiente e requirements espliciti        | venv + pip, oppure uv pip           |
| Progetto con lockfile                    | uv project oppure Poetry            |
| CLI personale separata dai progetti      | pipx oppure uv tool                 |
| Tool di test/lint richiesto dal progetto | Dipendenza di sviluppo del progetto |

Non e sbagliato installare pytest o un formatter nel virtualenv del progetto: spesso e necessario per allineare team e CI.

## Come funziona

Prima scegli **chi gestisce lo stato del progetto**. Un'installazione manuale con pip puo funzionare oggi ed essere rimossa domani da una sincronizzazione che applica il lockfile.

`pyproject.toml` esprime metadati e requisiti. `uv.lock` e `poetry.lock` descrivono risoluzioni per i rispettivi workflow. Non sono intercambiabili e nessuno dei due sostituisce i requisiti di sistema o i test sulle piattaforme supportate.

Prerequisito dei comandi seguenti: tool gia installati con una procedura ufficiale. Non installarli tutti nel virtualenv applicativo solo per provarli; nella verifica della nota sono stati usati ambienti temporanei separati dai progetti.

## API / Sintassi

Verifica ciascun tool separatamente:

```text
uv --version
```

```text
pipx --version
```

```text
poetry --version
```

### uv: interfaccia pip e workflow di progetto

Per un progetto gestito con requirements, dalla sua directory:

```text
uv venv --python 3.12
```

```text
uv pip install -r requirements.txt
```

```text
uv pip freeze
```

La scelta dell'interprete puo comportare un download se non e disponibile e la configurazione lo permette. `uv pip install` modifica un ambiente, **non aggiorna automaticamente pyproject.toml e uv.lock**. `uv pip` non e un alias che avvia pip e non richiede pip installato nell'ambiente destinazione.

Per un **nuovo** progetto uv, scegli invece il workflow integrato. `uv-demo` deve essere una directory nuova:

```text
uv init --app --no-package --python 3.12 uv-demo
```

```text
cd uv-demo
```

```text
uv lock
```

```text
uv sync --locked
```

```text
uv run --locked main.py
```

`--no-package` richiede esplicitamente uno scheletro non impacchettato con `main.py`; non affidarti al default di `uv init --app`, che puo cambiare tra versioni. `uv add nome-distribuzione` aggiunge una dipendenza ai metadati e aggiorna risoluzione/ambiente; `uv remove` la rimuove dai requisiti gestiti.

`uv run` normalmente controlla lock e ambiente prima di eseguire. `--locked` fallisce se il lock richiede aggiornamento; `--frozen` usa il lock senza verificarne la coerenza con i metadati. Non sono sinonimi. Il lock deve comunque essere utilizzabile: nella baseline provata anche `--frozen` rifiuta un progetto rinominato che non corrisponde piu a un membro presente nel lock.

`uv sync` applica per default una sincronizzazione esatta e puo **rimuovere pacchetti non previsti**. Non usare l'ambiente come deposito di installazioni manuali da conservare. Per aggiornare intenzionalmente la risoluzione usa il workflow di upgrade di uv, rivedi il diff e riesegui i test.

### pipx: applicazioni, non librerie importate dal progetto

Prerequisito del demo: wheel costruita nella nota Creazione di Package. Dalla radice di quel progetto:

```text
pipx install dist/appunti_calc_demo-0.1.0-py3-none-any.whl
```

```text
appunti-calc 2 3
```

```text
pipx list
```

Il comando stampa `5` se la directory degli eseguibili pipx e sul PATH. Se non lo e, usa il percorso indicato da pipx; `pipx ensurepath` puo modificare la configurazione del PATH e richiedere un nuovo terminale, quindi non e incluso automaticamente in questa procedura.

Installare una CLI con pipx non rende il relativo package importabile nel Python di ogni progetto. L'isolamento evita conflitti tra dipendenze, **non limita i permessi del programma**. Una distribuzione senza entry point CLI di norma non e il caso d'uso giusto.

Rimozione del solo demo installato da pipx:

```text
pipx uninstall appunti-calc-demo
```

`pipx run` esegue una app in un ambiente temporaneo gestito dal tool; puo scaricare codice. Non usarlo su un nome sconosciuto solo per provarlo.

## Esempio pratico

### Poetry: applicazione senza package installabile

Questo esempio e **alternativo** al progetto uv, in un'altra directory nuova, ad esempio `poetry-demo`. Non mischiare i due lockfile.

Crea `pyproject.toml`:

```toml
[project]
name = "poetry-demo"
version = "0.1.0"
requires-python = ">=3.12,<4"
dependencies = []

[tool.poetry]
package-mode = false
```

`package-mode = false` dice di gestire le dipendenze senza installare/pubblicare il progetto come package. Non servono un backend di build o una directory `src/poetry_demo` per questo esempio.

Crea `main.py`:

```python
import sys

print("environment ready")
print(sys.prefix != sys.base_prefix)
```

Dalla directory `poetry-demo`, fuori da un virtualenv estraneo al progetto:

```text
poetry env use 3.12
```

```text
poetry lock
```

```text
poetry install
```

```text
poetry run python main.py
```

Output atteso: `environment ready` e `True`. `poetry run` usa l'ambiente selezionato senza richiedere una shell attivata. Se sei gia in un virtualenv, Poetry puo usarlo: controlla `poetry env info` prima di installare o sincronizzare.

Per una dipendenza reale, `poetry add nome-distribuzione` aggiorna requisiti e lock; `poetry add --group dev nome-tool` la assegna al gruppo di sviluppo. Sostituisci i nomi con distribuzioni verificate, non con il nome importabile per tentativi.

### Installare, sincronizzare e aggiornare

- `poetry install` installa dal lock quando presente; non equivale a eliminare qualsiasi pacchetto estraneo.
- `poetry sync` allinea l'ambiente ai gruppi selezionati e puo rimuovere pacchetti non previsti.
- `poetry lock`, nelle versioni 2.x, conserva normalmente le versioni gia bloccate compatibili; `--regenerate` richiede una nuova risoluzione completa.
- `poetry update` aggiorna intenzionalmente le dipendenze entro i vincoli.
- `poetry shell` non e necessario: nelle versioni 2.x e fornito da un plugin separato.

Un ambiente gestito da Poetry non va riparato a colpi di pip senza aggiornare le dichiarazioni: alla prossima sincronizzazione lo stato puo cambiare di nuovo.

## Varianti

- Un package distribuito con Poetry usa la modalita package e un backend, diversamente dall'applicazione dell'esempio.
- `uv tool` copre anche workflow di CLI isolate: scegli un solo gestore per uno stesso comando sul PATH.
- pip-tools offre risoluzione e file requirements compilati; Conda affronta anche dipendenze non Python. Sono workflow diversi, non passaggi obbligatori.
- In CI versiona il lockfile adottato, controlla che sia aggiornato e dichiara interprete e versione del tool. Il lockfile di un'applicazione non impone automaticamente gli stessi pin ai consumatori di una libreria pubblicata.

## Errori comuni

- Usare `uv pip install` aspettandosi un aggiornamento di `uv.lock`.
- Eseguire `sync` in un ambiente che contiene pacchetti manuali da conservare.
- Trattare pipx come un gestore delle librerie importate dall'applicazione.
- Considerare tutti i tool CLI necessariamente globali.
- Cambiare gestore mantenendo lockfile concorrenti senza una migrazione.
- Confondere ambiente isolato con sandbox di sicurezza.
- Dichiarare testate piattaforme o versioni non provate.

## Checklist

- Il progetto ha un solo workflow dichiarato?
- La dipendenza serve all'applicazione, ai test oppure come CLI personale?
- Il lockfile corrisponde ai requisiti?
- Sono chiari gli effetti di install, sync e update?
- Ambiente, PATH e interprete puntano dove previsto?
- Le prove partono da un ambiente pulito, non solo dalla macchina di sviluppo?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Ambienti Virtuali|Ambienti Virtuali]]
- [[Programmazione/Python/Pagine/Pip e PyPI|Pip e PyPI]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/pre-commit|pre-commit]]

## Fonti

- [uv: progetti](https://docs.astral.sh/uv/guides/projects/), [template di init e cambio di default da 0.12](https://docs.astral.sh/uv/concepts/projects/init/), [lock e sincronizzazione](https://docs.astral.sh/uv/concepts/projects/sync/).
- [uv: interfaccia pip](https://docs.astral.sh/uv/pip/) e [installazione](https://docs.astral.sh/uv/getting-started/installation/).
- [pipx: uso e isolamento delle CLI](https://pipx.pypa.io/stable/) e [installazione](https://pipx.pypa.io/stable/installation/).
- [Poetry 2.5: uso e package mode](https://python-poetry.org/docs/basic-usage/), [comandi](https://python-poetry.org/docs/cli/), [installazione](https://python-poetry.org/docs/#installation).
