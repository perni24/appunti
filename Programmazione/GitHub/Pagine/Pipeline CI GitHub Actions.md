---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, ci, pipeline]
aliases: [Pipeline CI GitHub Actions, CI GitHub Actions]
prerequisites: [GitHub Actions, Workflow GitHub Actions]
related: [Workflow per test, lint e build, Required status checks]
---

# Pipeline CI GitHub Actions

## Sintesi

Una **pipeline CI** con GitHub Actions esegue controlli automatici quando il codice cambia. Di solito verifica test, lint, type check, build e altri controlli prima del merge.

L'obiettivo non e solo "far girare comandi": e dare feedback rapido e affidabile sulle pull request, proteggendo il branch principale da regressioni.

## Quando usarlo

Usa una pipeline CI quando:

- vuoi controllare ogni pull request;
- vuoi bloccare merge con test falliti;
- vuoi eseguire lint, typecheck o build;
- vuoi ridurre regressioni manuali;
- lavori in team;
- vuoi collegare CI e required status checks.

## Come funziona

Una pipeline CI tipica:

1. parte su `pull_request` e push su `main`;
2. scarica il codice;
3. prepara il runtime;
4. installa dipendenze;
5. esegue controlli;
6. produce esito visibile nella pull request;
7. diventa required check se il repository lo richiede.

La pipeline deve essere veloce, deterministica e leggibile nei log.

## API / Sintassi

Workflow CI base:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

## Esempio pratico

Pipeline separata per test e build:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
```

## Varianti

- **CI minima**: installazione e test.
- **CI completa**: lint, test, typecheck, build.
- **CI per monorepo**: filtri per path e job per package.
- **CI con matrix**: piu versioni o sistemi operativi.
- **CI con service containers**: database o cache per test integrazione.
- **CI con artifact**: conserva report, build o log.

## Errori comuni

- Eseguire CI solo su `main` e non sulle PR.
- Pipeline lenta e rumorosa.
- Non fallire quando test o lint falliscono.
- Non usare lockfile per installazioni riproducibili.
- Non dichiarare permessi minimi.
- Rendere required check instabili.

## Checklist

- La CI gira su pull request?
- I controlli principali falliscono correttamente?
- I log sono leggibili?
- I job sono abbastanza veloci?
- La pipeline usa lockfile?
- I check critici sono richiesti su `main`?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Workflow per test, lint e build]]
- [[Required status checks]]
- [[Permissions GitHub Actions]]

## Fonti

- [GitHub Docs - Continuous integration](https://docs.github.com/en/actions/get-started/continuous-integration)
