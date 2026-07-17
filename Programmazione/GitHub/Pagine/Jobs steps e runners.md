---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, jobs, steps, runners]
aliases: [Jobs steps e runners, Jobs e runners GitHub Actions]
prerequisites: [Workflow GitHub Actions]
related: [Sintassi YAML GitHub Actions]
---

# Jobs steps e runners

## Sintesi

In GitHub Actions un **job** e un gruppo di step eseguiti su un **runner**. Uno **step** puo eseguire un comando shell o usare una action. Il runner e la macchina che esegue il job.

Capire questa struttura aiuta a progettare workflow veloci, leggibili e facili da debuggare.

## Quando usarlo

Studia jobs, steps e runners quando:

- vuoi separare test, build e deploy;
- vuoi parallelizzare controlli;
- vuoi usare sistemi operativi diversi;
- vuoi capire dove vengono eseguiti i comandi;
- vuoi scegliere tra GitHub-hosted e self-hosted runner;
- vuoi ottimizzare tempi e costi.

## Come funziona

Un workflow contiene uno o piu job. Ogni job:

- sceglie un runner con `runs-on`;
- ha una lista di step;
- puo dipendere da altri job tramite `needs`;
- puo definire variabili o permessi;
- produce log separati.

Gli step vengono eseguiti in ordine nello stesso job. Job diversi possono girare in parallelo se non hanno dipendenze.

## API / Sintassi

Job base:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

Dipendenza tra job:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
```

## Esempio pratico

Separazione utile:

- `lint`: controlla stile e regole statiche;
- `test`: esegue test;
- `build`: produce artefatti;
- `deploy`: pubblica solo se build e test passano.

Questa divisione rende chiaro cosa fallisce e permette di parallelizzare dove possibile.

## Varianti

- **GitHub-hosted runner**: runner gestito da GitHub.
- **Self-hosted runner**: runner gestito da te.
- **Job paralleli**: nessun `needs` tra loro.
- **Job sequenziali**: usano `needs`.
- **Matrix job**: stesso job su piu versioni o ambienti.
- **Container job**: job eseguito in container.

## Errori comuni

- Mettere tutto in un solo job enorme.
- Duplicare setup in molti job senza cache o riuso.
- Usare self-hosted runner senza hardening.
- Non capire che job diversi non condividono filesystem.
- Dimenticare `actions/checkout`.
- Usare `ubuntu-latest` senza considerare aggiornamenti futuri.

## Checklist

- I job riflettono fasi logiche?
- I job indipendenti possono girare in parallelo?
- Le dipendenze `needs` sono minime?
- Il runner scelto e adatto?
- Gli step hanno nomi comprensibili?
- I log aiutano a capire il fallimento?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - GitHub-hosted runners](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners)
- [GitHub Docs - Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
