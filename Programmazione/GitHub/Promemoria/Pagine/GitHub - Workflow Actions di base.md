---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - promemoria
  - actions
  - workflow
  - ci
aliases:
  - Cheatsheet GitHub Actions
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
title: GitHub - Workflow Actions di base
---

# GitHub - Workflow Actions di base

## CI minima per il vault

Esempio completo per `.github/workflows/ci.yml`: controlla gli appunti su PR verso `main`, su push a `main` o su richiesta. Non distribuisce il sito. Richiede `site/package-lock.json` e gli script in `site/package.json`.

```yaml
name: CI appunti
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-appunti-${{ github.ref }}
  cancel-in-progress: true

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
      - run: npm run content:test
```

`working-directory` vale per `run`, non per `uses`. Per un'altra app, adattare directory, lockfile e script: usare `npm run lint`, `npm test` o `npm run build` solo se il progetto li definisce.

## Shell e variabili

Due **step alternativi** sotto `jobs.verifica.steps`. La variabile vale solo nello step che la dichiara; per condividerla, spostare `env` a livello di job o di workflow.

```yaml
- name: Leggi il profilo in Bash
  shell: bash
  env:
    PROFILO: test
  run: echo "$PROFILO"
```

```yaml
- name: Leggi il profilo in PowerShell
  shell: pwsh
  env:
    PROFILO: test
  run: Write-Output $env:PROFILO
```

## Fonti

- [GitHub Docs: sintassi dei workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/checkout: versione usata dal vault](https://github.com/actions/checkout/tree/v6)
- [actions/setup-node: cache npm e lockfile](https://github.com/actions/setup-node/tree/v6)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]
- [[Programmazione/GitHub/Pagine/Checklist GitHub Actions|Checklist GitHub Actions]]

## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
