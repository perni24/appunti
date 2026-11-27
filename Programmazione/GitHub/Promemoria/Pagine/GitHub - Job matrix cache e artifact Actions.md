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
  - matrix
  - cache
  - artifact
aliases:
  - Cheatsheet job GitHub Actions
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
  - "[[Programmazione/GitHub/Pagine/Matrix strategy GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Artifacts GitHub Actions]]"
title: GitHub - Job, matrix, cache e artifact Actions
---

# GitHub - Job, matrix, cache e artifact Actions

## Matrix, cache npm e report

Frammento sotto `jobs`, con `permissions: { contents: read }` nel workflow. Due sistemi × due versioni Node = quattro job. `timeout-minutes` vale per ciascuno; `fail-fast: false` lascia terminare le altre combinazioni se una fallisce.

```yaml
test:
  strategy:
    fail-fast: false
    matrix:
      os: [ubuntu-latest, windows-latest]
      node: [22, 24]
  runs-on: ${{ matrix.os }}
  timeout-minutes: 20
  defaults:
    run:
      working-directory: site
  steps:
    - uses: actions/checkout@v6
    - uses: actions/setup-node@v6
      with:
        node-version: ${{ matrix.node }}
        cache: npm
        cache-dependency-path: site/package-lock.json
    - run: npm ci
    - id: prova
      run: node --test --test-reporter=tap --test-reporter-destination=report.tap scripts/content.test.mjs
    - uses: actions/upload-artifact@v7
      if: success() || (failure() && steps.prova.outcome == 'failure')
      with:
        name: report-${{ matrix.os }}-${{ matrix.node }}
        path: site/report.tap
        if-no-files-found: error
        retention-days: 7
```

**Cache**: accelera il download delle dipendenze, non conserva `node_modules` e non sostituisce `npm ci`. Per una cache manuale usare `actions/cache` con chiave legata a sistema e hash del lockfile; non sovrapporla a `setup-node` per gli stessi dati.

**Artifact**: conserva un file del run. Il nome include entrambe le dimensioni per evitare collisioni. Per leggere un report dopo una matrix riuscita, aggiungere questo job accanto a `test`:

```yaml
leggi:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/download-artifact@v8
      with:
        name: report-ubuntu-latest-24
        path: risultati
    - run: head -n 5 risultati/report.tap
```

`needs` stabilisce l'ordine, non copia file. Se la matrix fallisce, questo consumer viene saltato per impostazione predefinita; i report già caricati restano consultabili nel run.

## Output: passare un valore senza un file

Esempio indipendente, ancora sotto `jobs`. `id: meta` identifica lo step; `outputs` pubblica il suo valore per il job dipendente.

```yaml
build:
  runs-on: ubuntu-latest
  outputs:
    version: ${{ steps.meta.outputs.version }}
  steps:
    - id: meta
      shell: bash
      run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"

mostra:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - env:
        VERSIONE: ${{ needs.build.outputs.version }}
      run: echo "$VERSIONE"
```

## Fonti

- [GitHub Docs: matrix, needs e output](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/setup-node: cache del package manager](https://github.com/actions/setup-node/tree/v6)
- [actions/cache: chiavi e ripristino](https://github.com/actions/cache/tree/v5)
- [actions/upload-artifact: caricamento](https://github.com/actions/upload-artifact/tree/v7)
- [actions/download-artifact: recupero](https://github.com/actions/download-artifact/tree/v8)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Matrix strategy GitHub Actions|Matrix strategy GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Service containers GitHub Actions|Service containers GitHub Actions]]

## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
