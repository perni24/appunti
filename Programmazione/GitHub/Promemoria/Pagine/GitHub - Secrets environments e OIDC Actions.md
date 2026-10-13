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
  - secrets
  - environments
  - oidc
aliases:
  - Cheatsheet secrets GitHub Actions
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Gestire secrets in GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Environments GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/OIDC GitHub Actions]]"
title: GitHub - Secrets, environments e OIDC Actions
---

# GitHub - Secrets, environments e OIDC Actions

## Usare un secret

```yaml
- name: Deploy
  env:
    API_TOKEN: ${{ secrets.API_TOKEN }}
  run: ./deploy.sh
```

Non passare il secret direttamente nella riga di comando quando puo apparire nei log o nell'elenco processi.

## Variabili non sensibili

```yaml
env:
  API_URL: ${{ vars.API_URL }}
```

## GITHUB_TOKEN

```yaml
permissions:
  contents: read
  issues: write
```

```yaml
env:
  GH_TOKEN: ${{ github.token }}
```

`GITHUB_TOKEN` e temporaneo e limitato al repository del workflow.

## Environment

```yaml
jobs:
  deploy:
    environment:
      name: production
      url: https://example.com
```

Usare gli environment per:

- secret distinti;
- approvazioni;
- branch autorizzati;
- cronologia dei deployment.

## OIDC

```yaml
permissions:
  contents: read
  id-token: write
```

Il job usa poi l'azione ufficiale del provider cloud per scambiare il token OIDC con credenziali temporanee.

## Secret da CLI

```powershell
gh secret set API_TOKEN
```

```powershell
gh secret list
```

```powershell
gh secret set API_TOKEN --env production
```

## Variabile da CLI

```powershell
gh variable set API_URL --body "https://api.example.com"
```

## Pull request da fork

I secret, salvo eccezioni controllate da GitHub, non vengono forniti ai workflow avviati da pull request provenienti da fork.

Non usare `pull_request_target` per eseguire codice non affidabile con accesso ai secret.

## Approfondimento

- [[Programmazione/GitHub/Pagine/Gestire secrets in GitHub Actions|Gestire secrets in GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Environments GitHub Actions|Environments GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Deployment approvals GitHub Actions|Deployment approvals GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Troubleshooting secrets GitHub Actions|Troubleshooting secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
