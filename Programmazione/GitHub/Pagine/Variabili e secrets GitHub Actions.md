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
  - variables
  - secrets
  - security
aliases:
  - Variabili e secrets GitHub Actions
  - Secrets GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
  - "[[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions]]"
title: Variabili e secrets GitHub Actions
---

# Variabili e secrets GitHub Actions

## Sintesi

Chiediti separatamente **chi può leggere il valore** e **in quali step deve esistere**. Il nome di un ambiente può stare in una variabile di configurazione; una credenziale no. Sia una variabile sia un secret possono essere passati alla shell con `env`: dichiararli sotto `env` non li rende automaticamente segreti.

| Strumento | A cosa serve | Come si legge |
| --- | --- | --- |
| `env` nel YAML | Valore per workflow, job o step. A parità di nome vince l’ambito più specifico. | Nella shell: `$env:NOME` in PowerShell, `"$NOME"` in Bash. |
| Contesto `vars` | Configurazione non riservata salvata su organizzazione, repository o environment. | `${{ vars.NOME }}`; non diventa da sola una variabile della shell. |
| Contesto `secrets` | Valore sensibile con accesso limitato. | `${{ secrets.NOME }}` nello step che ne ha bisogno. Un secret non disponibile restituisce una stringa vuota. |
| `GITHUB_ENV` | File per impostare una variabile negli **step successivi dello stesso job**. | Lo step che scrive nel file non vede automaticamente il nuovo valore. Non è un archivio per secret. |

## Esempio pratico: distinguere configurazione e credenziale assente

Il workflow manuale funziona anche senza configurare nulla. `REPORT_KIND` sceglie un’etichetta non sensibile; `REPORT_TOKEN` è solo un nome didattico. Lo step segnala se la credenziale è disponibile senza mostrarla, usarla o contattare servizi. Non serve creare un token per provare il ramo «assente».

```yaml
name: Verifica configurazione report
on: workflow_dispatch
permissions: {}
jobs:
  verifica:
    runs-on: windows-latest
    env:
      REPORT_KIND: ${{ vars.REPORT_KIND || 'anteprima' }}
    steps:
      - name: Verifica la configurazione
        shell: pwsh
        env:
          REPORT_TOKEN: ${{ secrets.REPORT_TOKEN }}
        run: |
          Write-Output "Tipo di report: $env:REPORT_KIND"
          if ([string]::IsNullOrEmpty($env:REPORT_TOKEN)) {
            Write-Output 'Credenziale non disponibile'
          } else {
            Write-Output 'Credenziale disponibile'
          }
```

## Se un secret risulta vuoto

Controlla nome, ambito e **evento** prima di rigenerarlo. I secret di un environment richiedono che il job dichiari quell’environment e rispetti le sue eventuali protezioni. Nei normali workflow `pull_request` da fork pubblici i secret del repository non vengono passati; `GITHUB_TOKEN` è un caso distinto, normalmente di sola lettura in quel contesto.

Non leggere `secrets.NOME` direttamente in una condizione `if` di Actions: mappalo nell’ambiente del job o controllane la presenza nella shell dello step, come sopra. Se l’operazione richiede davvero la credenziale, interrompila quando manca: nell’esempio si prosegue solo perché è una diagnosi.

## Errori da evitare

Se una credenziale reale compare nei log, revocala o ruotala presso il servizio che l’ha emessa e aggiorna il secret nei repository autorizzati. Cancellare la riga di log non invalida una copia già letta.

Non stampare l’intero ambiente e non affidarti al mascheramento dei log per rendere sicuro l’output. Per operazioni sul repository valuta il `GITHUB_TOKEN` con i permessi strettamente necessari; per un provider cloud che lo supporta valuta OIDC, evitando di conservare una chiave di lunga durata.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sintassi YAML GitHub Actions|Sintassi YAML GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]

## Fonti

- [GitHub Docs - Variabili di configurazione e ambiente](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables)
- [GitHub Docs - Uso dei secret e restrizioni](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub Docs - GITHUB_ENV e step successivi](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
- [GitHub Docs - Contesti disponibili](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
