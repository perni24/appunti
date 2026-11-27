---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - workflow-dispatch
  - schedule
aliases:
  - Workflow dispatch e scheduled workflows
  - Workflow manuali e schedulati GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Debug GitHub Actions]]"
title: Workflow dispatch e scheduled workflows
---

# Workflow dispatch e scheduled workflows

## Sintesi

`workflow_dispatch` significa «esegui su richiesta», non «esegui con privilegi elevati». `schedule` significa «tenta l’esecuzione a questi orari», non «garantisci la partenza al minuto». Possono stare nello stesso file: il punto da chiarire è quali passaggi devono girare **senza** gli input del modulo manuale.

## Esempio pratico: controllo manuale o feriale

Esempio completo per `.github/workflows/verifica-note.yml`, non installato nel vault. Dal modulo manuale puoi chiedere anche i test; nei giorni feriali i test si eseguono sempre. È una validazione, non un deploy.

```yaml
name: Verifica periodica delle note
on:
  workflow_dispatch:
    inputs:
      completo:
        description: Esegui anche i test di trasformazione
        type: boolean
        default: false
  schedule:
    - cron: '17 6 * * 1-5'
      timezone: Europe/Rome
permissions:
  contents: read
jobs:
  controlla:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: site
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: npm
          cache-dependency-path: site/package-lock.json
      - run: npm ci
      - run: npm run content:check
      - if: github.event_name == 'schedule' || inputs.completo
        run: npm run content:test
```

`17 6 * * 1-5` indica le 06:17 dal lunedì al venerdì **nel fuso dichiarato**. Senza `timezone` il riferimento è UTC. Il run pianificato usa l’ultimo commit del branch predefinito, non il branch scelto per l’ultimo avvio manuale. Con più espressioni cron puoi distinguerle tramite `github.event.schedule`.

## Avvio manuale e limiti

Per usare *Run workflow* servono `workflow_dispatch`, il file presente sul branch predefinito e accesso in scrittura. Puoi poi scegliere il riferimento da eseguire. Equivalente da GitHub CLI per il file dell’esempio, se installato e con accesso autorizzato; **avvia realmente un run** con il valore predefinito dell’input:

```bash
gh workflow run verifica-note.yml --ref main
```

Con un input `choice` puoi offrire un elenco di ambienti, ma scegliere `production` non è un’approvazione: servono le regole dell’environment. Mantieni gli input come dati, non interpolarli nel testo di un comando shell.

Gli schedule possono subire ritardi o essere saltati sotto carico; nei repository pubblici vengono disabilitati dopo 60 giorni senza attività del repository. Per backup con scadenza inderogabile serve anche un controllo dell’ultima esecuzione riuscita. Il deploy Quartz di questo vault dichiara `workflow_dispatch` e push su `main`, **non** uno schedule.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]

## Fonti

- [GitHub Docs - Avvio manuale e scelta del branch](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [GitHub Docs - Eventi, cron e fusi orari](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub CLI - gh workflow run](https://cli.github.com/manual/gh_workflow_run)
