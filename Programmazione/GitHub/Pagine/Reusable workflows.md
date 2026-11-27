---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-actions
  - reusable-workflows
  - ci-cd
aliases:
  - Reusable workflows
  - Workflow riutilizzabili GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Composite actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
title: Reusable workflows
---

# Reusable workflows

## Sintesi

Scegli un **workflow riutilizzabile** se vuoi condividere un’intera procedura che sceglie i propri runner, esegue uno o più job e restituisce un esito. Se vuoi invece inserire alcune operazioni *tra due step già esistenti*, ti serve una composite action. La differenza si vede nel punto di chiamata: `jobs.<id>.uses` per il workflow, `steps[*].uses` per l’action.

## Esempio pratico: due file, un solo controllo del vault

**Chiamato**, `.github/workflows/verifica-vault.yml`. Espone l’input booleano `test`: metadati e link vengono sempre controllati; i test della trasformazione sono facoltativi. Entrambi i comandi esistono in `site/package.json`.

```yaml
name: Verifica riutilizzabile del vault
on:
  workflow_call:
    inputs:
      test:
        type: boolean
        default: true
permissions:
  contents: read
jobs:
  verifica:
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
      - if: inputs.test
        run: npm run content:test
```

**Chiamante**, per esempio `.github/workflows/ci-note.yml`. Questi due file sono didattici, non due workflow già installati nel vault.

```yaml
name: CI delle note
on: pull_request
permissions:
  contents: read
jobs:
  note:
    uses: ./.github/workflows/verifica-vault.yml
    with:
      test: true
```

Il job `note` delega l’esecuzione: non aggiungervi `runs-on` o `steps`. Con `test: false` si salta **solo** l’ultimo step, non la validazione. Un ulteriore job del chiamante può aspettare l’esito con `needs: note`.

## Cosa passa davvero tra i due file

- Il percorso locale usa la stessa revisione del chiamante. Per un altro repository usa `owner/repo/.github/workflows/file.yml@ref`. Uno SHA completo fissa la revisione; un tag può spostarsi. I file riutilizzabili stanno direttamente in `.github/workflows/`.
- Il normale checkout nel chiamato scarica il **repository del chiamante**. Per usare questo esempio tra più repository, ciascun chiamante deve quindi avere `site/`, lockfile e script compatibili.
- Le variabili `env` a livello di workflow del chiamante non sono un’interfaccia implicita. Passa valori con `with` e i soli secret necessari con `secrets`. `secrets: inherit` è più ampio e non inoltra automaticamente i secret lungo tutta una catena di chiamate. Il chiamato non può aumentare i privilegi del `GITHUB_TOKEN` ricevuto.
- Per restituire un valore, collegalo dall’output dello step a quello del job, poi a `on.workflow_call.outputs`. Il chiamante lo legge via `needs.note.outputs.<nome>`. L’esito successo/fallimento del job non richiede un output personalizzato.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Composite actions|Composite actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Definire e richiamare un workflow](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [GitHub Docs - Contesto, accesso e permessi tra workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)
