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
  - git
aliases:
  - pre-commit
prerequisites: []
related: []
title: pre-commit
---

# pre-commit

## Obiettivo

Eseguire controlli ripetibili sui file prima del commit e in CI. `pre-commit` gestisce gli hook; sono i singoli strumenti a controllare o modificare il codice.

La configurazione versionata e l'hook Git installato localmente sono due cose diverse. Un clone contiene la prima, non installa automaticamente il secondo.

Baseline del laboratorio: CPython 3.12.10, Git e pre-commit 4.7.0 su Windows; hook pre-commit-hooks v6.0.0 e isort 9.0.2. Le revisioni sono esplicite, non aggiornamenti automatici alla versione piu recente.

## Quando usarlo

- Controlli veloci su whitespace, YAML, formattazione e import.
- Regole condivise tra collaboratori e CI.
- Feedback anticipato, senza affidare ogni errore formale alla revisione manuale.

Test d'integrazione lenti, servizi esterni e matrici di interpreti stanno meglio in [[Programmazione/Python/Pagine/tox e nox|tox o nox]] e nella pipeline.

## Procedura

### 1. Preparare un repository di lavoro

Servono Git e un ambiente dedicato con il comando disponibile:

```text
python -m pip install "pre-commit==4.7.0"
```

Esegui i comandi dalla radice del repository dell'applicazione. Per fare pratica usa un clone o un progetto di prova, non una directory con modifiche importanti non salvate.

### 2. Versionare la configurazione

#### .pre-commit-config.yaml

```yaml
minimum_pre_commit_version: "4.7.0"
default_stages: [pre-commit]
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
        args: [--markdown-linebreak-ext=md]
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: https://github.com/PyCQA/isort
    rev: 9.0.2
    hooks:
      - id: isort
        args: [--filter-files]
```

Il parametro Markdown conserva le due spaziature finali intenzionali usate per gli a-capo. `check-yaml` controlla i file YAML selezionati, **non** il frontmatter dentro ogni Markdown e non lo schema dell'applicazione.

Per isort aggiungi anche la configurazione del `pyproject.toml` nella [[Programmazione/Python/Pagine/isort|sua nota]]. Black non e incluso in questo esempio: aggiungilo solo se e il formatter scelto, dopo l'ordinatore.

Valida la configurazione prima di eseguirla:

```text
python -m pre_commit validate-config
```

Le revisioni dei repository hook non sono le versioni di `pre-commit` stesso. Per maggiore stabilita puoi fissare commit SHA completi; neppure questo blocca automaticamente tutte le dipendenze transitive.

### 3. Provare manualmente

```text
python -m pre_commit run --all-files
```

`--all-files` considera i file tracciati da Git, rispettando i filtri degli hook; non significa tutti i file presenti sul disco. Un file nuovo non aggiunto all'indice puo non essere incluso. Per una prova mirata:

```text
python -m pre_commit run check-yaml --files config.yaml
```

Il file `config.yaml` deve esistere. Il primo avvio puo scaricare repository e dipendenze degli hook e preparare ambienti nella cache; i successivi riusano quegli ambienti.

### 4. Abilitare l'esecuzione al commit

Questo comando modifica gli hook **locali** del repository corrente:

```text
python -m pre_commit install
```

Ogni collaboratore deve installare il proprio hook. Un task CI puo invece eseguire `run --all-files` senza installare l'hook Git.

Controllo manuale dei file staged:

```text
python -m pre_commit run
```

Durante il controllo staged, pre-commit mette temporaneamente da parte le modifiche non staged dei file tracciati e poi le ripristina. Con commit parziali e formatter possono esserci conflitti: leggi il messaggio e ricontrolla il working tree. Non usare come soluzione un reset che cancelli lavoro.

### 5. Gestire una correzione automatica

Un hook che modifica file fa fallire il passaggio: non e necessariamente un errore dello strumento. Le correzioni non vengono aggiunte automaticamente all'indice.

Ispeziona prima il diff:

```text
git diff
```

Aggiungi soltanto il file verificato, per esempio:

```text
git add src/appunti_calc/cli.py
```

Ripeti il controllo:

```text
python -m pre_commit run
```

Per un vero errore YAML o di lint, correggi il problema indicato prima di riprovare. Non trasformare indiscriminatamente i fallimenti in esclusioni.

## Snippet

### Test locali su richiesta

Voce aggiuntiva della lista `repos`, non un secondo blocco YAML `repos:` nello stesso file:

```yaml
- repo: local
  hooks:
    - id: tests
      name: pytest locale
      entry: python -m pytest
      language: system
      pass_filenames: false
      always_run: true
      stages: [manual]
```

`language: system` usa i programmi del PATH, senza creare l'ambiente del progetto. Prima di questo hook devi avere installato il package e pytest nel virtualenv attivo; un editor avviato da un altro ambiente potrebbe non trovarli. Per il demo:

```text
python -m pip install . "pytest==9.1.1"
```

Avvio esplicito, fuori dal normale ciclo di commit:

```text
python -m pre_commit run tests --hook-stage manual --all-files
```

`pass_filenames: false` evita di passare file sorgente o documenti come argomenti pytest. `always_run` evita lo skip quando non ci sono file selezionati, ma non cambia lo stage manuale.

### Controllo in CI

Dopo checkout e installazione della versione concordata:

```text
python -m pre_commit run --all-files --show-diff-on-failure
```

Un fallimento deve restare tale nel job. Gli hook che riscrivono file possono mostrare la correzione richiesta; il comando non crea un commit per te. Il controllo locale e aggirabile: non sostituisce controlli CI richiesti o policy del repository.

## Adattamenti comuni

- **Aggiornare gli hook**: il comando seguente modifica la configurazione; rivedi revisioni, changelog e diff, quindi ripeti i controlli.

```text
python -m pre_commit autoupdate --freeze
```

- **Filtri**: `files` ed `exclude` sono espressioni regolari, non glob. `types` richiede tutti i tipi elencati, `types_or` ne accetta almeno uno. Un hook saltato non dimostra che i file siano corretti.
- **Hook Python isolati**: `language: python` crea un ambiente hook, non installa automaticamente il tuo package applicativo. Per i test usa una strategia esplicita.
- **Rimuovere l'integrazione locale**: il comando seguente disinstalla l'hook gestito, non cancella la configurazione versionata.

```text
python -m pre_commit uninstall
```

- **Sicurezza**: hook, dipendenze e file di configurazione eseguibili sono codice. Verifica repository e modifiche ricevute; un virtualenv separa dipendenze, non limita accesso a filesystem, rete o credenziali. Non eseguire hook non fidati in ambienti con segreti.
- **Cache**: `PRE_COMMIT_HOME` consente una posizione dedicata; non versionare cache o ambienti. Ripulirla forza installazioni future e non risolve configurazioni sbagliate.

## Debug rapido

- **Non parte al commit**: verifica l'installazione locale, il repository corrente e l'eventuale `core.hooksPath`. Non sovrascrivere alla cieca hook aziendali.
- **Skipped**: controlla stage, file staged, filtri e tipo dei file.
- **Files were modified**: esamina, aggiungi i file corretti e ripeti.
- **Command not found con hook locale**: verifica PATH e ambiente, non aggiungere dipendenze casuali al Python globale.
- **Errore al primo avvio**: separa problemi di rete, proxy/certificati e versione Python dai difetti del codice. Non disabilitare la verifica TLS.
- **Passa localmente ma fallisce in CI**: confronta versioni, file selezionati e comando; il controllo staged puo coprire meno file.

## Checklist finale

- Configurazione versionata, revisioni fissate e hook verificati?
- Controllo su tutti i file eseguito almeno alla prima integrazione?
- Hook installato in ogni clone in cui serve?
- Correzioni riviste e aggiunte intenzionalmente all'indice?
- Test locali con dipendenze e stage espliciti?
- CI indipendente dal fatto che un collaboratore usi l'hook?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Stile|Stile]]
- [[Programmazione/Python/Pagine/isort|isort]]
- [[Programmazione/Python/Pagine/Testing|Testing]]
- [[Programmazione/Python/Pagine/tox e nox|tox e nox]]

## Fonti

- [pre-commit: configurazione, CLI, stage e hook locali](https://pre-commit.com/).
- [pre-commit-hooks: controlli e opzioni disponibili](https://github.com/pre-commit/pre-commit-hooks).
- [isort: integrazione pre-commit](https://isort.readthedocs.io/en/latest/configuration/pre-commit.html).
