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
  - environments
  - deploy
aliases:
  - Environments GitHub Actions
  - GitHub Actions environments
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Deployment approvals GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions]]"
title: Environments GitHub Actions
---

# Environments GitHub Actions

## Sintesi

Un **environment** è una destinazione logica del repository: può avere regole di accesso, variabili, secret e una cronologia dei deployment. Non crea l’infrastruttura: chiamarlo `production` non crea un server, non carica alcun file e non attiva automaticamente un’approvazione.

| Nel workflow | Significato |
| --- | --- |
| `environment: staging` sul job | Collega il job alla destinazione e alle sue regole. |
| `env:` sul workflow, job o step | Definisce variabili di processo; non associa un deployment a una destinazione. |
| `environment.url` | Fornisce un collegamento alla destinazione. Non ne verifica la raggiungibilità. |

## Esempio pratico: provare la configurazione senza pubblicare

In un repository di prova prepara **prima** l’environment `staging` in **Settings → Environments** e definisci *in quell’ambiente* la variabile non sensibile `SITE_LABEL`. Per osservare il caso «mancante», non definirla anche a livello di repository o organizzazione. Il workflow manuale seguente controlla il valore e non effettua deploy esterni.

```yaml
name: Verifica configurazione staging
on: workflow_dispatch
permissions: {}
jobs:
  verifica:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Verifica l'etichetta della destinazione
        shell: pwsh
        env:
          SITE_LABEL: ${{ vars.SITE_LABEL }}
        run: |
          if ([string]::IsNullOrWhiteSpace($env:SITE_LABEL)) { throw 'SITE_LABEL assente' }
          Write-Output "Destinazione: $env:SITE_LABEL"
```

L’accesso ai secret dell’environment è subordinato alle protezioni configurate. Questo esempio non ne usa: il nome di una destinazione non è una credenziale. Un refuso nel nome dell’environment può crearne uno nuovo, senza le regole e i secret attesi; non usare il fatto che un job parta come prova che la configurazione sia corretta.

## Staging, produzione e preview

Per staging puoi ammettere `main` e pubblicare automaticamente; per produzione puoi limitare branch o tag **nelle impostazioni** e richiedere una review. Mantieni le credenziali di produzione nell’ambiente corretto, non come secret comune se tutti i job non devono usarle. Un ambiente preview non prepara né elimina da solo un’istanza: sono responsabilità del deploy.

Nel vault il job di pubblicazione dichiara `github-pages` e usa l’output `page_url` per il link al sito. Dal solo file YAML non puoi dedurre revisori, wait timer, secret o altre impostazioni effettive. La disponibilità delle protezioni dipende anche dal piano e dalla visibilità del repository.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Deployment approvals GitHub Actions|Deployment approvals GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Variabili e secrets GitHub Actions|Variabili e secrets GitHub Actions]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]

## Fonti

- [GitHub Docs - Configurare un environment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [GitHub Docs - Regole e disponibilità](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub Docs - Review di un deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
