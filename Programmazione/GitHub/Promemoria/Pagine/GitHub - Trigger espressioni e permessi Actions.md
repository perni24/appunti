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
  - trigger
  - permissions
aliases:
  - Cheatsheet trigger GitHub Actions
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
title: GitHub - Trigger, espressioni e permessi Actions
---

# GitHub - Trigger, espressioni e permessi Actions

## Branch e percorsi

```yaml
on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "package-lock.json"
  pull_request:
    branches: [main]
```

## Tag

```yaml
on:
  push:
    tags:
      - "v*"
```

## Avvio manuale

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: Target environment
        required: true
        type: choice
        options:
          - staging
          - production
```

```yaml
env:
  TARGET_ENVIRONMENT: ${{ inputs.environment }}
```

## Pianificazione

```yaml
on:
  schedule:
    - cron: "0 3 * * 1"
```

Le espressioni cron di GitHub Actions usano UTC.

## Condizione

```yaml
if: github.ref == 'refs/heads/main'
```

```yaml
if: success()
if: failure()
if: always()
if: cancelled()
```

## Contesti comuni

```yaml
${{ github.repository }}
${{ github.ref }}
${{ github.sha }}
${{ github.actor }}
${{ runner.os }}
${{ matrix.node }}
${{ needs.build.result }}
${{ steps.meta.outputs.version }}
${{ vars.API_URL }}
${{ secrets.API_TOKEN }}
```

## Permessi minimi

```yaml
permissions:
  contents: read
```

## Permessi per job

```yaml
jobs:
  release:
    permissions:
      contents: write
```

Quando viene specificato almeno un permesso, quelli omessi diventano `none`.

## Nessun permesso

```yaml
permissions: {}
```

## Concurrency

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow dispatch e scheduled workflows|Workflow dispatch e scheduled workflows]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Concurrency e cancel-in-progress|Concurrency e cancel-in-progress]]
- [[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions|Troubleshooting permissions GitHub Actions]]

## Riferimenti

- [GitHub Docs - Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub Docs - Workflow concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
