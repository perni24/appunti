---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, workflow, yaml]
aliases: [Workflow GitHub Actions, Workflow Actions]
prerequisites: [GitHub Actions]
related: [Sintassi YAML GitHub Actions, Eventi e trigger GitHub Actions]
---

# Workflow GitHub Actions

## Sintesi

Un **workflow GitHub Actions** e un file YAML che definisce un processo automatizzato. Un workflow indica quando partire, quali job eseguire, su quali runner e con quali step.

Il workflow e il confine principale dell'automazione: se diventa troppo grande, e piu difficile da capire, mantenere e mettere in sicurezza.

## Quando usarlo

Crea workflow separati quando:

- vuoi distinguere CI, release e deploy;
- vuoi trigger diversi per operazioni diverse;
- vuoi ridurre tempi di esecuzione;
- vuoi isolare permessi e secret;
- vuoi rendere i log piu leggibili;
- vuoi evitare che un fallimento blocchi processi non correlati.

## Come funziona

Un workflow vive in:

```text
.github/workflows/nome-workflow.yml
```

Contiene:

- `name`;
- `on`;
- `permissions`;
- `env`;
- `jobs`;
- eventuali `defaults`, `concurrency` o condizioni.

Ogni workflow puo avere piu job. I job possono essere indipendenti o dipendere da altri tramite `needs`.

## API / Sintassi

Workflow con due job:

```yaml
name: CI

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
```

## Esempio pratico

Separazione consigliata:

```text
.github/workflows/ci.yml
.github/workflows/release.yml
.github/workflows/deploy.yml
```

`ci.yml` gira su PR e push. `release.yml` gira su tag. `deploy.yml` gira solo da branch o ambiente controllato.

## Varianti

- **Workflow CI**: test e build.
- **Workflow release**: crea artefatti e changelog.
- **Workflow deploy**: pubblica su ambiente.
- **Workflow manuale**: usa `workflow_dispatch`.
- **Workflow schedulato**: usa `schedule`.
- **Reusable workflow**: richiamabile da altri workflow.

## Errori comuni

- Mettere CI, release e deploy nello stesso file senza separazione.
- Usare nomi generici come `build.yml` per tutto.
- Dimenticare `permissions`.
- Duplicare molto YAML invece di estrarre workflow riutilizzabili.
- Rendere job dipendenti senza motivo.
- Non documentare workflow manuali o pericolosi.

## Checklist

- Il workflow ha responsabilita singola?
- Il nome del file e descrittivo?
- Gli eventi sono limitati?
- I job hanno dipendenze chiare?
- I permessi sono dichiarati?
- I log sono facili da leggere?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Jobs steps e runners]]
- [[Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
