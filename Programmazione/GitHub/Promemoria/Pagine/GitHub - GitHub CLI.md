---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - promemoria
  - gh
  - cli
aliases:
  - Cheatsheet GitHub CLI
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/GitHub CLI]]"
title: GitHub - GitHub CLI
---

# GitHub - GitHub CLI

## Autenticazione

`gh auth status` verifica account e host; `login` e `logout` modificano le credenziali locali. Non includere token nell’output condiviso.

```powershell
gh auth login
```

```powershell
gh auth status
```

```powershell
gh auth logout
```

## Repository

Sostituisci `owner/repository`. `repo create --source . --push` crea un repository su GitHub e vi invia i commit locali: prima verifica directory, cronologia e account. In un clone del fork, `gh repo sync` senza argomenti aggiorna il branch locale dal progetto originale; specificando `gh repo sync owner/repository` la destinazione è invece il fork remoto.

```powershell
gh repo clone owner/repository
```

```powershell
gh repo view --web
```

```powershell
gh repo create repository --private --source . --push
```

```powershell
gh repo fork owner/repository --clone
```

```powershell
gh repo sync
```

## Stato

```powershell
gh status
```

## Workflow

`workflow run` avvia un’esecuzione reale: il workflow deve prevedere `workflow_dispatch` ed essere presente sul branch predefinito. Per ottenere il numero da sostituire a `run-id`, elenca le esecuzioni con il campo `databaseId`.

```powershell
gh workflow list
```

```powershell
gh workflow run ci.yml
```

```powershell
gh run list --json databaseId,workflowName,status,conclusion
```

```powershell
gh run view run-id
```

```powershell
gh run watch run-id
```

```powershell
gh run rerun run-id --failed
```

## Release

```powershell
gh release list
```

```powershell
gh release view v1.0.0
```

## API REST

In PowerShell racchiudi l’endpoint tra apici: le parentesi graffe devono arrivare intatte a `gh`, che risolve `{owner}` e `{repo}` dal repository corrente.

```powershell
gh api 'repos/{owner}/{repo}'
```

```powershell
gh api 'repos/{owner}/{repo}/pulls' --paginate
```

## JSON e jq

```powershell
gh pr list --json number,title,author
```

```powershell
gh pr list --json number,title --jq '.[] | [.number, .title]'
```

## Repository esplicito

```powershell
gh issue list --repo owner/repository
```

## Fonti

- [GitHub CLI: endpoint e segnaposto di gh api](https://cli.github.com/manual/gh_api)
- [GitHub CLI: creare un repository da sorgenti locali](https://cli.github.com/manual/gh_repo_create)
- [GitHub CLI: distinguere sincronizzazione locale e remota](https://cli.github.com/manual/gh_repo_sync)
- [GitHub CLI: avviare un workflow](https://cli.github.com/manual/gh_workflow_run)

## Approfondimento

- [[Programmazione/GitHub/Pagine/GitHub CLI|GitHub CLI]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API|GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/GitHub Web UI|GitHub Web UI]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
