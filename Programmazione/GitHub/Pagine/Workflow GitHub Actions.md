---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - workflow
  - yaml
aliases:
  - Workflow GitHub Actions
  - Workflow Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions]]"
title: Workflow GitHub Actions
---

# Workflow GitHub Actions

## Sintesi

Un workflow è un file `.yml` o `.yaml` direttamente in `.github/workflows/`. `name` è l’etichetta nell’interfaccia, `on` decide **quando** partire e `jobs` descrive **che cosa** eseguire. Chiamare il file `deploy.yml` non pubblica nulla; allo stesso modo, un controllo su una PR non richiede permessi di deploy.

## Esempio pratico: validare gli appunti prima del merge

Questo è un workflow completo **di esempio**, distinto dal deploy Quartz attivo. Il caso d’uso è dare un esito all’autore di una PR verso `main` senza caricare il sito su Pages. Presuppone la struttura del vault: manifesto npm e lockfile si trovano in `site/`, non nella radice.

```yaml
name: Controllo appunti

on:
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  controlla:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: site
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: npm
          cache-dependency-path: site/package-lock.json
      - name: Installa le dipendenze dal lockfile
        run: npm ci
      - name: Controlla metadati e collegamenti
        run: npm run content:check
      - name: Verifica la trasformazione delle note
        run: npm run content:test
```

## Perché le operazioni sono in questo ordine

- `checkout` rende disponibili i file della PR. Scegliere un runner con `runs-on` non scarica automaticamente il repository.
- `setup-node` prepara la versione di Node richiesta. `cache-dependency-path` indica all’action quale lockfile usare per la chiave della cache npm; non cambia la directory di lavoro e non ripristina `node_modules`.
- `defaults.run.working-directory` vale per gli step `run`, non per `uses`. I tre comandi npm trovano lo stesso `package.json` e, nello stesso job, i controlli riusano l’installazione fatta da `npm ci`.

## Come interpretare il risultato

Se a PR, release e pubblicazione servono eventi o permessi diversi, puoi separare i file: per esempio `ci.yml` per i controlli, `release.yml` per preparare una release su tag e `deploy.yml` per pubblicare. Sono nomi convenzionali, non tre file richiesti da GitHub.

Se `npm ci` fallisce, verifica percorso e coerenza del lockfile: i controlli successivi normalmente non partono. Un errore in `content:check` riguarda invece il contenuto o la struttura del vault. Un job verde dice che questi controlli sono passati, **non** che il sito è stato generato o che la PR è bloccata in caso di fallimento: per quest’ultima proprietà il repository deve richiedere il check al merge.

Usa job separati quando serve un runner diverso, del parallelismo o un confine di permessi. Dividere installazione e test in due job solo per dare loro nomi diversi fa perdere il filesystem condiviso: qui bastano step distinti nei log.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [GitHub Docs - Sintassi e directory di lavoro](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [actions/setup-node - Cache e lockfile](https://github.com/actions/setup-node/tree/v6)
