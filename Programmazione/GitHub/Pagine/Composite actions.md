---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-actions
  - composite-actions
  - automation
aliases:
  - Composite actions
  - Composite action GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Actions marketplace]]"
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Reusable workflows]]"
  - "[[Programmazione/GitHub/Pagine/Actions marketplace]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
title: Composite actions
---

# Composite actions

## Sintesi

Una **composite action** raggruppa più step che devono girare nello **stesso job del chiamante**. Vede il suo workspace: può controllare i file lasciati dallo step precedente e restituire un risultato al successivo. Non sceglie il runner, non crea job e non costituisce un confine di sicurezza separato.

## Esempio pratico: verificare la home ed esporne la dimensione

Definizione didattica in `.github/actions/verifica-home/action.yml`. Legge `Home.md` dalla radice del checkout; richiede PowerShell 7 (`pwsh`). La soglia è un input, non un comando: viene passata tramite `env` e validata prima dell’uso.

```yaml
name: Verifica home
description: Verifica la dimensione minima della home del vault
inputs:
  minimo:
    description: Dimensione minima in byte
    default: '1'
outputs:
  byte:
    description: Dimensione osservata
    value: ${{ steps.misura.outputs.byte }}
runs:
  using: composite
  steps:
    - id: misura
      shell: pwsh
      env:
        MINIMO: ${{ inputs.minimo }}
      run: |
        $min = 0
        if (-not [int]::TryParse($env:MINIMO, [ref]$min) -or $min -lt 1) {
          throw 'La soglia deve essere un intero positivo'
        }
        $file = Get-Item -LiteralPath 'Home.md' -ErrorAction Stop
        if ($file.PSIsContainer -or $file.Length -lt $min) { throw 'Home non valida' }
        "byte=$($file.Length)" >> $env:GITHUB_OUTPUT
```

Uso in `steps` di un job, dopo aver aggiunto la definizione al repository:

```yaml
- uses: actions/checkout@v6
- id: home
  uses: ./.github/actions/verifica-home
  with:
    minimo: '1'
- name: Leggi il risultato
  shell: pwsh
  env:
    DIMENSIONE: ${{ steps.home.outputs.byte }}
  run: Write-Output "$env:DIMENSIONE byte"
```

`misura` è l’ID **interno** dell’action; `home` è l’ID scelto dal **chiamante**. Una home vuota deve far fallire lo step, non produrre un output di successo pari a zero. Una home non vuota non garantisce che i suoi collegamenti siano validi: per quello serve `content:check`.

## Errori da evitare

Una composite locale non è disponibile prima del checkout. Ogni suo step `run` dichiara la shell; gli input non diventano automaticamente variabili `INPUT_*`. Se distribuisci script insieme all’action, cerca gli script con `github.action_path` e i dati del progetto nel workspace del chiamante.

Per usarla da un altro repository occorrono accesso e un riferimento esplicito, preferibilmente uno SHA verificato. Se hai bisogno di una libreria Node articolata valuta un’action JavaScript; se devi definire un ambiente Linux tramite un’immagine valuta un’action Docker. Nessuna delle due è necessaria per questa semplice verifica.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Actions marketplace|Actions marketplace]]
- [[Programmazione/GitHub/Pagine/Reusable workflows|Reusable workflows]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]

## Fonti

- [GitHub Docs - Creare una composite action](https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action)
- [GitHub Docs - Input, output e shell delle action](https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax)
- [GitHub Docs - Uso sicuro delle action](https://docs.github.com/en/actions/reference/security/secure-use)
