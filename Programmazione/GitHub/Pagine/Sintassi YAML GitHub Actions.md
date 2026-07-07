---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, yaml, workflow-syntax]
aliases: [Sintassi YAML GitHub Actions, Workflow syntax GitHub Actions]
prerequisites: [Workflow GitHub Actions]
related: [Eventi e trigger GitHub Actions, Jobs steps e runners]
---

# Sintassi YAML GitHub Actions

## Sintesi

La sintassi YAML di GitHub Actions definisce eventi, job, step, runner, variabili, permessi e condizioni. E dichiarativa: descrive cosa deve succedere e GitHub Actions esegue il workflow.

Una sintassi chiara riduce workflow fragili e difficili da debuggare.

## Quando usarlo

Studiala quando:

- scrivi un workflow da zero;
- modifichi CI/CD esistente;
- devi usare condizioni;
- vuoi passare variabili tra step o job;
- vuoi configurare permessi;
- vuoi capire perche un workflow non parte.

## Come funziona

Le chiavi principali sono:

- `name`;
- `on`;
- `permissions`;
- `env`;
- `jobs`;
- `runs-on`;
- `steps`;
- `uses`;
- `run`;
- `with`;
- `if`;
- `needs`.

YAML e sensibile a indentazione e tipi. Un errore di spazi puo cambiare il significato del workflow.

## API / Sintassi

Workflow completo minimo:

```yaml
name: CI

on:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run tests
        run: npm test
```

Condizione:

```yaml
if: github.ref == 'refs/heads/main'
```

## Esempio pratico

Step con input:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

Step shell:

```yaml
- name: Install dependencies
  run: npm ci
```

## Varianti

- **`uses`**: usa una action.
- **`run`**: esegue comando shell.
- **`with`**: passa input a una action.
- **`env`**: definisce variabili.
- **`if`**: condiziona esecuzione.
- **`permissions`**: limita permessi token.
- **`needs`**: definisce dipendenze tra job.

## Errori comuni

- Indentazione sbagliata.
- Dimenticare `actions/checkout`.
- Usare secret in echo o log.
- Non dichiarare `permissions`.
- Confondere contesti `${{ }}` con variabili shell.
- Usare branch o path filter troppo ampi.

## Checklist

- Il YAML e indentato correttamente?
- Le action sono versionate?
- I permessi sono minimi?
- I secret non finiscono nei log?
- I nomi di job e step sono leggibili?
- Il trigger e coerente con lo scopo?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Jobs steps e runners]]

## Fonti

- [GitHub Docs - Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
