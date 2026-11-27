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
  - yaml
  - workflow-syntax
aliases:
  - Sintassi YAML GitHub Actions
  - Workflow syntax GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
title: Sintassi YAML GitHub Actions
---

# Sintassi YAML GitHub Actions

## Sintesi

Per leggere il YAML parti dal livello di indentazione: `jobs` è una mappa di identificatori; `steps` è una **lista ordinata**, e ogni trattino apre uno step. Due file YAML validi possono avere effetti diversi in Actions: per esempio `if` sotto uno step governa solo quello step, sotto un job governa l’intero job.

## Esempio pratico: un input booleano che cambia un solo step

Questo workflow manuale controlla che esista `Home.md`. Con l’opzione `esteso` attiva conta anche i Markdown di `Programmazione/`. Non richiede npm, non modifica file e non pubblica nulla.

```yaml
name: Controlla la home
on:
  workflow_dispatch:
    inputs:
      esteso:
        description: Conta anche le note di programmazione
        type: boolean
        default: false

permissions:
  contents: read

jobs:
  verifica:
    name: Verifica del vault
    runs-on: windows-latest
    defaults:
      run:
        shell: pwsh
    steps:
      - uses: actions/checkout@v6
      - name: Verifica il file iniziale
        run: |
          if (-not (Test-Path -LiteralPath 'Home.md' -PathType Leaf)) {
            throw 'Home.md assente'
          }
      - name: Conta i Markdown
        if: inputs.esteso
        run: |
          (Get-ChildItem -LiteralPath 'Programmazione' -Recurse -File -Filter '*.md' | Measure-Object).Count
```

## Quattro distinzioni utili

- `verifica` è l’ID del job, utilizzabile in `needs`; `name: Verifica del vault` è il nome mostrato nei log. Uno step che deve esporre output ha bisogno di un proprio `id`.
- `uses` richiama un’action; `with` le passa input. `run` avvia la shell; `env` le rende disponibili valori con nome. Non mettere `uses` e `run` nello stesso step.
- `if: inputs.esteso` è un’espressione di Actions, non un comando PowerShell. `inputs` conserva il tipo booleano; la stringa non vuota `'false'` non è il booleano `false`. Con l’opzione disattivata il conteggio è *skipped*, non *failed*.
- `run: |` conserva le righe dello script. Una variabile dichiarata in `env` si legge come `$env:NOME` in PowerShell o `"$NOME"` in Bash. Le espressioni `${{ ... }}` sono valutate da Actions: per usare un valore dinamico nella shell passalo tramite `env`, non inserirlo nel testo del comando.

## Diagnosi rapida

Se GitHub rifiuta il workflow prima di creare i job, controlla indentazione, chiavi ammesse e tipi degli input. Se il run esiste ma salta uno step, guarda il relativo `if`. Se invece lo step parte e fallisce, apri il suo log: nel caso sopra, un checkout mancante o un nome file errato fa fallire la verifica di `Home.md`.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Eventi e trigger GitHub Actions|Eventi e trigger GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]

## Fonti

- [GitHub Docs - Sintassi dei workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub Docs - Contesti ed espressioni disponibili](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [GitHub Docs - Input di workflow_dispatch](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch)
