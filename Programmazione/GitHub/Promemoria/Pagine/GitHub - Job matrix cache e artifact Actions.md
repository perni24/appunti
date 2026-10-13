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

## Dipendenze tra job

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: ./deploy.sh
```

## Matrix

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [22, 24]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

## Output di uno step

```yaml
- name: Calculate version
  id: meta
  shell: bash
  run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"

- run: echo "${{ steps.meta.outputs.version }}"
```

## Output tra job

```yaml
jobs:
  build:
    outputs:
      version: ${{ steps.meta.outputs.version }}
```

```yaml
jobs:
  deploy:
    needs: build
    steps:
      - run: echo "${{ needs.build.outputs.version }}"
```

## Cache

```yaml
- name: Cache dependencies
  uses: actions/cache@v5
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```

Per npm, il caching integrato in `actions/setup-node` e normalmente piu semplice.

## Caricare artifact

```yaml
- name: Upload build
  uses: actions/upload-artifact@v7
  with:
    name: frontend-build
    path: dist/
    if-no-files-found: error
    retention-days: 7
```

In una matrix usare nomi artifact univoci:

```yaml
name: build-${{ matrix.os }}-${{ matrix.node }}
```

## Timeout

```yaml
jobs:
  test:
    timeout-minutes: 20
```

## Approfondimento

- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Matrix strategy GitHub Actions|Matrix strategy GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Cache GitHub Actions|Cache GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Service containers GitHub Actions|Service containers GitHub Actions]]

## Riferimenti

- [actions/cache](https://github.com/actions/cache)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
