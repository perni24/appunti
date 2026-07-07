---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: avanzato
tags: [github, github-actions, permissions, troubleshooting]
aliases: [Troubleshooting permissions GitHub Actions, Troubleshooting permessi Actions]
prerequisites: [Permissions GitHub Actions, Sicurezza dei token GitHub]
related: [Troubleshooting GitHub Actions, Troubleshooting secrets GitHub Actions, Personal access token GitHub]
---

# Troubleshooting permissions GitHub Actions

## Obiettivo

Capire perche un workflow GitHub Actions riceve errori di autorizzazione, non puo leggere o scrivere risorse GitHub, non puo pubblicare package, non puo commentare PR o non puo fare deploy.

Il problema spesso non e il comando, ma il token usato e i permessi effettivi concessi al job.

## Quando usarlo

- Ricevi `403 Forbidden`, `Resource not accessible by integration` o errori simili.
- `GITHUB_TOKEN` non puo scrivere issue, PR, package o release.
- Un workflow da fork non ha i permessi attesi.
- Un job di deploy non puo ottenere OIDC token.
- Un required status o commento automatico non viene creato.
- Una GitHub App o PAT non accede alla risorsa.

## Procedura

1. Identifica quale token viene usato: `GITHUB_TOKEN`, PAT, GitHub App token o OIDC.
2. Leggi l'errore preciso e l'endpoint o comando fallito.
3. Controlla `permissions` a livello workflow e job.
4. Verifica evento: `pull_request`, `push`, `workflow_dispatch`, fork o tag.
5. Controlla impostazioni Actions del repository o organizzazione.
6. Verifica branch protection, environments e required reviewers.
7. Riduci i permessi al minimo necessario, ma aggiungi quelli mancanti.
8. Riesegui il workflow e controlla se cambia l'errore.

## Snippet

Permessi per commentare issue o PR:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

Permessi per creare release:

```yaml
permissions:
  contents: write
```

Permessi per OIDC:

```yaml
permissions:
  contents: read
  id-token: write
```

## Adattamenti comuni

- **Workflow CI**: spesso basta `contents: read`.
- **Commenti su PR**: servono `pull-requests: write` o `issues: write` a seconda dell'API usata.
- **Release**: serve scrittura su `contents`.
- **Package**: servono permessi su packages e configurazione del registry.
- **OIDC**: serve `id-token: write` e trust policy lato provider.
- **Fork**: i permessi possono essere ridotti per sicurezza.

## Debug rapido

- Se vedi `Resource not accessible by integration`, controlla evento e permessi del `GITHUB_TOKEN`.
- Se un workflow da fork non accede ai secrets, e spesso comportamento atteso.
- Se OIDC fallisce, controlla `id-token: write` e configurazione del provider esterno.
- Se un PAT funziona ma `GITHUB_TOKEN` no, stai mascherando un problema di permessi workflow.
- Se aggiungere `write-all` risolve, riduci subito a permessi specifici.

## Checklist finale

- Token usato identificato.
- Errore letto integralmente.
- `permissions` dichiarati esplicitamente.
- Evento e fork controllati.
- Accessi repository/organization verificati.
- Environment e branch protection controllati.
- Permessi minimi ripristinati dopo il debug.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Permissions GitHub Actions]]
- [[Sicurezza dei token GitHub]]
- [[Personal access token GitHub]]
- [[Fine-grained token GitHub]]
- [[GitHub Apps]]
- [[OIDC GitHub Actions]]
- [[Troubleshooting GitHub Actions]]
- [[Troubleshooting secrets GitHub Actions]]

## Fonti

- [GitHub Docs - Authenticate with GITHUB_TOKEN](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)
