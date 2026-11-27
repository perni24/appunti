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

## Scegliere l'evento

Frammenti **alternativi** alla radice del workflow. Se ne servono più di uno, riunire gli eventi sotto una sola chiave `on`.

**Branch e percorsi:** sul push devono coincidere sia branch sia percorso; sulla PR qui conta solo il branch **base**. Evitare filtri che saltino l'intero workflow se il check è obbligatorio per ogni PR.

```yaml
on:
  push:
    branches: [main]
    paths: ['site/**']
  pull_request:
    branches: [main]
```

**Tag:** `v*` è un filtro sul nome, non una validazione SemVer.

```yaml
on:
  push:
    tags: ['v*']
```

**Manuale:** l'input è disponibile come `inputs.target`. La scelta da menu non protegge un deploy: le restrizioni vanno configurate sull'environment.

```yaml
on:
  workflow_dispatch:
    inputs:
      target:
        description: Ambiente
        type: choice
        required: true
        options: [staging, production]
```

**Pianificato:** lunedì alle 03:00 di Roma. Senza `timezone` l'orario è UTC. Lo scheduler usa il branch predefinito e può partire in ritardo.

```yaml
on:
  schedule:
    - cron: '0 3 * * 1'
      timezone: Europe/Rome
```

## Condizioni e contesti

Una sola chiave `if` per job o step. Esempio di **step** di diagnostica dopo un errore:

```yaml
- name: Segnala il test fallito
  if: failure()
  run: echo "Controllare il primo step fallito"
```

| Se serve... | Espressione |
| --- | --- |
| Eseguire solo sul branch principale | `github.ref == 'refs/heads/main'` |
| Distinguere successo, annullamento o esecuzione anche dopo un errore | `success()`, `cancelled()`, `always()`; per saltare i run annullati: `!cancelled()` |
| Identificare repository, revisione e autore dell'evento | `github.repository`, `github.sha`, `github.actor` |
| Leggere runner, variante o risultato | `runner.os`, `matrix.node`, `needs.build.result` |
| Leggere output, configurazione o credenziale | `steps.meta.outputs.version`, `vars.API_URL`, `secrets.API_TOKEN`; usare ciascun contesto soltanto dove ammesso |

## Permessi e concorrenza

`permissions: {}` non assegna permessi al `GITHUB_TOKEN`; per checkout ordinario usare `contents: read`. Una mappa esplicita assegna `none` alle categorie omesse. Per creare una release, questo **frammento del solo job di rilascio** abilita la scrittura sui contenuti:

```yaml
permissions:
  contents: write
```

Per il deploy Pages del vault il gruppo è condiviso: un nuovo push **non interrompe il deploy già in esecuzione**. Diversamente dalla CI, qui non si usa `cancel-in-progress: true`.

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

## Fonti

- [GitHub Docs: filtri, permessi e pianificazione](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub Docs: eventi e branch predefinito](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub Docs: espressioni e funzioni di stato](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow dispatch e scheduled workflows|Workflow dispatch e scheduled workflows]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Concurrency e cancel-in-progress|Concurrency e cancel-in-progress]]
- [[Programmazione/GitHub/Pagine/Troubleshooting permissions GitHub Actions|Troubleshooting permissions GitHub Actions]]

## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
