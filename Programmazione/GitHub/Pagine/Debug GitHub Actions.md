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
  - debug
  - troubleshooting
aliases:
  - Debug GitHub Actions
  - Debug workflow GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Artifacts GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Permissions GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Troubleshooting GitHub Actions]]"
title: Debug GitHub Actions
---

# Debug GitHub Actions

## Sintesi

Prima di aumentare la verbosità, identifica **dove** si interrompe il flusso: nessun run, job in attesa, step saltato o comando fallito. Non sono quattro versioni dello stesso errore. Per il vault conserva sempre evento, SHA e numero del tentativo: il job `deploy` saltato può essere soltanto la conseguenza di un errore precedente in `build`.

## Trovare il primo errore utile

Dalla radice del clone, con GitHub CLI autenticata e accesso in lettura, elenca le esecuzioni del workflow reale:

```bash
gh run list --workflow deploy-pages.yml --limit 5 --json databaseId,event,headSha,status,conclusion
```

Per un run fallito, sostituisci `RUN_ID` con il suo `databaseId`:

```bash
gh run view RUN_ID --log-failed
```

| Cosa vedi | Cosa controllare |
| --- | --- |
| Nessun run per lo SHA | Evento e filtri; un commit locale non è un push. Se c’è un errore di sintassi guarda anche le annotazioni del workflow. |
| Job in coda o in attesa | Disponibilità del runner, gruppo di concorrenza o approvazione dell’environment. Non ci sono ancora log di uno step che non è partito. |
| Job o step *skipped* | Condizione `if` e dipendenze `needs`. Controlla il primo job fallito prima di investigare il deploy. |
| Comando npm fallito | Prima riga utile del log, directory effettiva, versione di Node, presenza del lockfile. Un cache miss da solo non è un errore. |
| 403 o artifact assente | Per il 403 verifica evento, token e permessi del job; per l’artifact guarda prima l’esito del produttore, il percorso e il nome dell’upload. |

## Diagnostica mirata, senza esporre l’ambiente

Step temporaneo da inserire **dopo checkout e setup di Node**. Nel vault `package-lock.json` è in `site/`. Se la directory dello step non esiste, il runner fallisce prima di avviare la shell: controlla il percorso nel YAML.

```yaml
- name: Controlla il contesto npm
  working-directory: site
  shell: pwsh
  run: |
    Write-Output "Evento: $env:GITHUB_EVENT_NAME"
    Write-Output "SHA: $env:GITHUB_SHA"
    node --version
    if (-not (Test-Path -LiteralPath 'package-lock.json' -PathType Leaf)) {
      throw 'Lockfile assente nella directory del comando'
    }
```

Per approfondire puoi rieseguire con debug oppure impostare nel repository `ACTIONS_STEP_DEBUG` a `true` (dettagli degli step) o `ACTIONS_RUNNER_DEBUG` (diagnostica del runner). Non è sufficiente fare `echo` di quelle stringhe nello script. Se coesistono secret e variabile con lo stesso nome, prevale il secret. Evita dump di `env` o di interi contesti; conserva solo log mirati e rimuovi la diagnostica temporanea.

**Rerun o nuovo run?** Il rerun usa lo stesso SHA e ref dell’esecuzione originale: serve a indagare un guasto transitorio. Per verificare una correzione appena committata serve un run sul **nuovo** SHA. Un rerun di un workflow di deploy può ripeterne gli effetti.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Permissions GitHub Actions|Permissions GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting GitHub Actions|Troubleshooting GitHub Actions]]

## Fonti

- [GitHub Docs - Log diagnostici degli step e del runner](https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging)
- [GitHub CLI - gh run list](https://cli.github.com/manual/gh_run_list)
- [GitHub CLI - gh run view](https://cli.github.com/manual/gh_run_view)
- [GitHub Docs - Revisione ed effetti del rerun](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)
