---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, ci, procedura]
aliases: [Configurare una pipeline CI con GitHub Actions, Configurare CI GitHub Actions]
prerequisites: [GitHub Actions, Pipeline CI GitHub Actions]
related: [Workflow per test, lint e build, Cache GitHub Actions, Permissions GitHub Actions]
---

# Configurare una pipeline CI con GitHub Actions

## Obiettivo

Configurare una pipeline CI che esegue installazione dipendenze, lint, test e build su pull request e push al branch principale.

La pipeline deve fallire quando il codice non e verificabile e deve essere abbastanza veloce da non bloccare il lavoro quotidiano.

## Quando usarlo

Usalo quando:

- vuoi validare ogni pull request;
- vuoi impedire merge con test falliti;
- vuoi automatizzare lint e build;
- vuoi usare required status checks;
- vuoi rendere ripetibile il controllo del progetto.

## Procedura

1. Crea `.github/workflows/ci.yml`.
2. Definisci eventi `pull_request` e `push`.
3. Imposta `permissions` minimi.
4. Scegli runner.
5. Fai checkout del repository.
6. Installa runtime e dipendenze.
7. Esegui lint.
8. Esegui test.
9. Esegui build.
10. Aggiungi cache o artifact solo se servono.
11. Dopo una run riuscita, usa il job come required status check se il repository e protetto.

## Snippet

Esempio Node.js:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Adattamenti comuni

- **Python**: usa `actions/setup-python` e comandi `ruff`, `pytest`.
- **Rust**: usa `cargo fmt`, `cargo clippy`, `cargo test`.
- **Matrix**: utile per piu versioni runtime o sistemi operativi.
- **Cache**: utile se riduce davvero i tempi.
- **Artifact**: utile per report, coverage o build output.
- **Monorepo**: usa path filter o job separati.

## Debug rapido

- Se il workflow non parte, controlla path `.github/workflows/ci.yml` e trigger.
- Se `npm ci` fallisce, controlla lockfile e versione Node.
- Se i test passano in locale ma falliscono in CI, controlla variabili ambiente e sistema operativo.
- Se la cache non funziona, controlla package manager e lockfile.
- Se il required check non compare, esegui almeno una run con quel nome.

## Checklist finale

- Workflow in `.github/workflows`.
- Trigger su pull request e branch principale.
- `permissions` minimi.
- Installazione riproducibile.
- Lint, test e build presenti.
- Cache configurata solo se utile.
- CI collegata a branch protection se serve.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Pipeline CI GitHub Actions]]
- [[Workflow per test, lint e build]]
- [[Cache GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Permissions GitHub Actions]]

## Fonti

- [GitHub Docs - Building and testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
