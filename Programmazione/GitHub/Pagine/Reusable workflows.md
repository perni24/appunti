---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, github-actions, reusable-workflows, ci-cd]
aliases: [Reusable workflows, Workflow riutilizzabili GitHub Actions]
prerequisites: [GitHub Actions, Workflow GitHub Actions, Sintassi YAML GitHub Actions]
related: [Composite actions, Workflow GitHub Actions, Permissions GitHub Actions]
---

# Reusable workflows

## Sintesi

I **reusable workflows** permettono di richiamare un workflow GitHub Actions da un altro workflow. Servono a evitare duplicazione quando piu repository o piu workflow devono usare la stessa pipeline.

Sono diversi dalle action: una action riusa step, mentre un reusable workflow riusa un intero job o una sequenza di job.

## Quando usarlo

Usali quando:

- piu repository devono eseguire la stessa CI;
- vuoi centralizzare regole di build, test o release;
- vuoi standardizzare permessi e controlli;
- vuoi evitare copia e incolla di YAML;
- vuoi offrire una pipeline comune a un'organizzazione;
- vuoi cambiare una logica una volta sola.

## Come funziona

Un workflow diventa riutilizzabile quando dichiara:

```yaml
on:
  workflow_call:
```

Il workflow chiamante usa `jobs.<job_id>.uses`, non uno step `uses`. Questo e importante: un reusable workflow si richiama al livello del job.

Il workflow riutilizzabile puo definire:

- `inputs`, per dati configurabili;
- `secrets`, per credenziali esplicite;
- `outputs`, per restituire valori;
- `permissions`, per limitare i privilegi;
- job multipli, se la logica condivisa e piu complessa.

## API / Sintassi

Workflow riutilizzabile:

```yaml
name: Reusable CI

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: npm test
```

Workflow chiamante:

```yaml
jobs:
  ci:
    uses: ./.github/workflows/reusable-ci.yml
    with:
      node-version: "22"
```

## Esempio pratico

In un'organizzazione con molti repository JavaScript puoi creare un workflow comune:

```text
org/.github/.github/workflows/node-ci.yml
```

Ogni repository lo richiama:

```yaml
jobs:
  ci:
    uses: org/.github/.github/workflows/node-ci.yml@v1
    with:
      node-version: "22"
```

Questo rende piu semplice aggiornare versioni, cache e policy di sicurezza.

## Varianti

- **Workflow locale**: richiamato con `./.github/workflows/file.yml`.
- **Workflow remoto**: richiamato con `owner/repo/.github/workflows/file.yml@ref`.
- **Workflow versionato**: usa tag o SHA per stabilita.
- **Workflow con secrets espliciti**: passa solo i segreti necessari.
- **Workflow con `secrets: inherit`**: comodo dentro la stessa organizzazione, ma da usare con attenzione.

## Errori comuni

- Richiamare un reusable workflow dentro `steps` invece che dentro `jobs`.
- Usare branch mobili come `@main` per workflow critici.
- Passare troppi secret con `secrets: inherit`.
- Non dichiarare input con tipi chiari.
- Mettere logica troppo specifica in un workflow che dovrebbe essere generale.
- Dimenticare che i workflow riutilizzabili devono stare in `.github/workflows`.

## Checklist

- Il workflow riutilizzabile ha una responsabilita chiara?
- Gli input sono pochi e tipizzati?
- I secret sono espliciti quando possibile?
- Il workflow chiamato e versionato?
- I permessi sono dichiarati?
- La documentazione spiega come chiamarlo?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Composite actions]]
- [[Permissions GitHub Actions]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
