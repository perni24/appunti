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

## Scegliere il contesto

| Valore necessario | Dove leggerlo |
| --- | --- |
| Configurazione non riservata | `vars.API_URL` |
| Credenziale di un servizio esterno | `secrets.API_TOKEN` nello step che usa il client |
| Operazione su GitHub nello stesso repository | `github.token`, con i soli `permissions` necessari al job |
| Accesso a un cloud che supporta OIDC | Token d'identità del job da scambiare presso il provider, non un secret statico |

## Secret di environment: verificarne la presenza

Frammento sotto `jobs` per un workflow fidato. Creare prima l'environment `staging` e il relativo secret. Il job verifica soltanto la disponibilità del valore: non esegue deploy e non prova l'autenticazione.

```yaml
verifica:
  runs-on: ubuntu-latest
  environment: staging
  permissions: {}
  steps:
    - name: Controlla configurazione
      shell: pwsh
      env:
        API_TOKEN: ${{ secrets.API_TOKEN }}
      run: |
        if ([string]::IsNullOrWhiteSpace($env:API_TOKEN)) {
          throw "API_TOKEN non disponibile"
        }
        Write-Output "API_TOKEN presente"
```

L'`env` dello step non passa al successivo. Per una vera pubblicazione configurare branch ammessi ed eventuali approvazioni sull'environment; il campo `environment.url` può riportare l'URL del deployment, ma non lo crea. Nelle normali PR da fork i secret Actions del repository base non sono disponibili: non esporli a codice non fidato.

## CLI: leggere oppure modificare

Sostituire `OWNER/REPO`. La lettura elenca i nomi, **non i valori**:

```powershell
gh secret list --repo OWNER/REPO --env staging
```

Scrittura nel relativo environment: il valore si inserisce al prompt. Omettere `--env staging` **solo** per creare o aggiornare un secret di repository.

```powershell
gh secret set API_TOKEN --repo OWNER/REPO --env staging
```

Scrittura di una variabile **non segreta** di repository:

```powershell
gh variable set API_URL --repo OWNER/REPO --body "https://api.example.com"
```

## GitHub CLI e OIDC nei job

Per usare `gh` in uno step, impostare `GH_TOKEN: ${{ github.token }}` nel suo `env`. Per leggere issue è sufficiente `issues: read`; aggiungere scrittura solo al job che la richiede.

Per OIDC, **frammento del job** che deve richiedere il token:

```yaml
permissions:
  id-token: write
```

Aggiungere `contents: read` se il job deve anche fare checkout. `id-token: write` consente di richiedere un'identità, non concede privilegi cloud: il provider deve accettarne audience e soggetto (repository, ref o environment previsti) e assegnare un ruolo limitato.

## Fonti

- [GitHub Docs: usare i secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub Docs: OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [GitHub CLI: impostare un secret](https://cli.github.com/manual/gh_secret_set)

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
