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
  - ci
  - pipeline
aliases:
  - Pipeline CI GitHub Actions
  - CI GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
title: Pipeline CI GitHub Actions
---

# Pipeline CI GitHub Actions

## Sintesi

Una pipeline di **integrazione continua** risponde a una domanda sul cambiamento proposto: «Se lo integriamo adesso, quali verifiche passano?». Il risultato deve arrivare sulla pull request mentre è ancora possibile correggerla. Un deploy riuscito **dopo** il merge non dà quello stesso feedback.

## Esempio pratico: controllare una PR del vault

Workflow didattico completo per una PR verso `main`. Il job mantiene un nome stabile, non ha permessi di scrittura e non pubblica su Pages. Il deploy effettivo è un altro file: `.github/workflows/deploy-pages.yml` ascolta i push su `main` e l’avvio manuale, non le PR.

```yaml
name: CI appunti
on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  valida:
    name: Validazione appunti
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
      - name: Verifica i collegamenti e i metadati
        run: npm run content:check
      - name: Verifica le regole di trasformazione
        run: npm run content:test
```

Un link verso una nota inesistente deve far fallire il primo controllo. Una modifica che altera la trasformazione dei link può invece essere rilevata dai test anche se **oggi** tutti i link del vault esistono. Un esito verde significa che sono passate queste verifiche, non che ogni spiegazione tecnica sia corretta.

## Da segnalazione a condizione di merge

1. Dai al job un nome riconoscibile e controlla in una PR che compaia per la revisione attesa.
2. Se deve bloccare il merge, seleziona il check nella regola applicabile a `main`. `on: pull_request` da solo **non lo rende obbligatorio**.
3. Evita un filtro `paths` sull’intero workflow se ogni PR deve ricevere quel check: un workflow saltato può lasciare il risultato atteso in sospeso. Se usi la merge queue, prevedi anche `merge_group` per i controlli richiesti.

## Quando estenderla

Tieni corti i controlli frequenti. Aggiungi build, typecheck o test d’integrazione quando intercettano errori diversi; usa una matrix solo per le piattaforme che vuoi verificare. Per distinguere i guasti basta spesso separare gli step. Se dividi in job, `needs` stabilisce l’ordine ma non trasferisce filesystem o dipendenze.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]

## Fonti

- [GitHub Docs - Integrazione continua](https://docs.github.com/en/actions/get-started/continuous-integration)
- [GitHub Docs - Problemi dei controlli obbligatori](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)
- [GitHub Docs - Sintassi dei workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
