---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, ci, test, lint, build]
aliases: [Workflow per test lint e build, Test lint build GitHub Actions]
prerequisites: [Pipeline CI GitHub Actions]
related: [Required status checks, Cache GitHub Actions]
---

# Workflow per test, lint e build

## Sintesi

Un workflow per **test, lint e build** e la base pratica della CI. Verifica che il codice sia corretto, coerente con le regole del progetto e ancora compilabile o impacchettabile.

Questi controlli dovrebbero essere automatizzati per evitare discussioni manuali e regressioni ripetibili.

## Quando usarlo

Usalo quando:

- il progetto ha test automatici;
- usi ESLint, Ruff, Clippy o strumenti simili;
- hai un passaggio di build;
- vuoi feedback immediato sulle PR;
- vuoi bloccare merge non validi;
- vuoi standard ripetibili tra macchine diverse.

## Come funziona

La sequenza tipica e:

1. checkout;
2. setup runtime;
3. installazione dipendenze;
4. lint;
5. test;
6. build;
7. eventuale upload artifact o report.

Separare i comandi in step diversi rende piu chiaro quale controllo fallisce.

## API / Sintassi

Esempio Node.js:

```yaml
name: Test lint build

on:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Esempio pratico

Per un progetto TypeScript:

```yaml
- run: npm run lint
- run: npm run typecheck
- run: npm test
- run: npm run build
```

Il typecheck intercetta errori che test e lint potrebbero non vedere.

## Varianti

- **Job unico**: semplice, adatto a progetti piccoli.
- **Job separati**: lint, test e build in parallelo.
- **Fail fast**: interrompe presto su errori evidenti.
- **Report artifact**: salva coverage, log o bundle.
- **Monorepo selective CI**: esegue controlli solo su package modificati.

## Errori comuni

- Eseguire `npm install` invece di `npm ci` in CI.
- Non distinguere lint, typecheck e test.
- Non fare build sulle PR.
- Ignorare exit code dei comandi.
- Usare versioni runtime diverse da quelle di produzione.
- Non cacheare dipendenze quando la pipeline diventa lenta.

## Checklist

- Lint, test e build sono step separati?
- Il runtime e fissato?
- L'installazione e riproducibile?
- Il workflow fallisce se un controllo fallisce?
- I controlli sono abbastanza rapidi per ogni PR?
- I report importanti vengono conservati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pipeline CI GitHub Actions]]
- [[Cache GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Required status checks]]

## Fonti

- [GitHub Docs - Continuous integration](https://docs.github.com/en/actions/get-started/continuous-integration)
