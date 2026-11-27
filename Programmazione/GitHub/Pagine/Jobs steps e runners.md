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
  - jobs
  - steps
  - runners
aliases:
  - Jobs steps e runners
  - Jobs e runners GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
title: Jobs steps e runners
---

# Jobs steps e runners

## Sintesi

Usa più **step** quando le operazioni devono lavorare sugli stessi file. Usa più **job** quando vuoi lavoro indipendente, runner diversi o permessi distinti. Un runner esegue un job: due job con `runs-on: ubuntu-latest` chiedono lo stesso tipo di ambiente, non la stessa macchina.

## Che cosa sopravvive da un’operazione all’altra?

| Dato | Tra step dello stesso job | Tra job |
| --- | --- | --- |
| File nel workspace | Sì: uno step può leggere ciò che il precedente ha scritto. | Non implicitamente. Per trasferire una directory prodotta dalla build, carica e recupera un artifact. |
| Variabile impostata nella shell | No: ogni step `run` avvia un nuovo processo. Usa `GITHUB_ENV` per gli step successivi. | No. Per un valore breve usa uno step output esposto come job output. |
| Esito di un job | Gli step sono sequenziali e normalmente si fermano al primo errore. | `needs` dichiara la dipendenza: per impostazione predefinita il job successivo parte solo dopo il successo del precedente. |

## Esempio pratico: passare un nome, non una directory

Il primo job legge il campo `name` dal vero manifesto del vault e lo scrive come output. Il secondo usa soltanto quella stringa, quindi non esegue il checkout. La shell è PowerShell su entrambi i runner.

```yaml
name: Leggi il nome del pacchetto
on: workflow_dispatch
permissions:
  contents: read
defaults:
  run:
    shell: pwsh
jobs:
  leggi:
    runs-on: windows-latest
    outputs:
      nome: ${{ steps.lettura.outputs.nome }}
    steps:
      - uses: actions/checkout@v6
      - id: lettura
        run: |
          $manifest = Get-Content -Raw -LiteralPath 'site/package.json' | ConvertFrom-Json
          "nome=$($manifest.name)" >> $env:GITHUB_OUTPUT
  mostra:
    needs: leggi
    runs-on: windows-latest
    steps:
      - name: Mostra il nome ricevuto
        env:
          PACKAGE_NAME: ${{ needs.leggi.outputs.nome }}
        run: |
          if (-not $env:PACKAGE_NAME) { throw 'Output nome assente' }
          Write-Output "Pacchetto: $env:PACKAGE_NAME"
```

Segui il nome `nome` lungo tre passaggi: lo step `lettura` lo scrive in `GITHUB_OUTPUT`; `leggi.outputs` lo espone; `mostra` lo legge tramite `needs.leggi.outputs.nome`. Aggiungere soltanto `needs: leggi` imporrebbe l’ordine senza trasferire alcun dato.

## Varianti e limiti

Job senza dipendenze possono procedere in parallelo, nei limiti dei runner disponibili: per esempio lint e test indipendenti. Per eseguire gli step in un’immagine Linux specifica si può dichiarare `jobs.<id>.container` su un runner Linux compatibile. Il container definisce l’ambiente degli step, non sostituisce il runner.

Nel deploy Quartz, `site/public` non è una stringa: `build` lo carica come artifact di Pages e `deploy` pubblica quell’artifact. Una **cache** ha un altro scopo: accelera run futuri e può mancare, quindi non usarla come unica copia dell’output da pubblicare.

Una **matrix** ripete un job per combinazioni di sistema o runtime. Le immagini hosted con suffisso `-latest` possono evolvere; con runner **self-hosted** possono invece rimanere file tra esecuzioni. Non fare affidamento su quello stato e non eseguire codice non fidato su un runner con accesso a risorse interne.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - Runner gestiti da GitHub](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners)
- [GitHub Docs - Job in un container](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/run-jobs-in-a-container)
- [GitHub Docs - Passare output tra job](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/pass-job-outputs)
- [GitHub Docs - File di ambiente e output](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
