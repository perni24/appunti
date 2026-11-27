---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - token
  - security
  - authentication
aliases:
  - Sicurezza dei token GitHub
  - Token GitHub
  - Personal access token
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Secret scanning]]"
title: Sicurezza dei token GitHub
---

# Sicurezza dei token GitHub

## Sintesi

Per scegliere una credenziale chiediti **chi deve agire, su quali repository, per fare cosa e per quanto tempo**. Un token personale rappresenta una persona; il token di un job Actions rappresenta il workflow nel suo repository. Conservare una credenziale in un secret manager la protegge nel deposito, ma non ne riduce i permessi.

## Quale identità scegliere?

| Situazione | Scelta di partenza | Limite da ricordare |
| --- | --- | --- |
| Uso interattivo sul proprio computer | Login di GitHub CLI o gestore credenziali; SSH per operazioni Git. | Una chiave SSH non è un bearer token per l’API REST. |
| Script personale su repository selezionati | **Fine-grained PAT** con proprietario, repository, permessi e scadenza necessari. | Non attribuisce privilegi che la persona non possiede. Un’organizzazione può richiedere approvazione; verifica che l’endpoint supporti il tipo di token. |
| Job Actions che opera sul proprio repository | **GITHUB_TOKEN**, emesso per ciascun job, con `permissions` espliciti. | Non è un token personale permanente o un accesso automatico a tutti i repository dell’organizzazione. |
| Integrazione condivisa, anche su più repository | **GitHub App** installata sui repository necessari, con token d’installazione di breve durata. | Evita di legare il servizio all’account di una persona che potrebbe lasciare il team. |
| Accesso Git via SSH da una macchina a un singolo repository | **Deploy key**, in sola lettura se sufficiente. | Gestisci e revoca la chiave separatamente dagli account. |

Un **PAT classic** ha scope spesso più ampi: se un’operazione non è supportata dal fine-grained PAT, verifica prima se è appropriata una GitHub App. Per un deploy verso un cloud che supporta OIDC, valuta credenziali temporanee del provider invece di conservare una sua chiave permanente.

## Esempio: leggere una issue senza creare un PAT

Frammento `jobs:` di un workflow didattico per un repository con Issues abilitate e una issue `12` leggibile. Su un runner GitHub-hosted Ubuntu con `gh` disponibile, il job chiede sola lettura delle issue. Non effettua checkout e non stampa il token:

```yaml
jobs:
  leggi-issue:
    runs-on: ubuntu-latest
    permissions:
      issues: read
    steps:
      - name: Leggi lo stato della issue
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh api "repos/$GITHUB_REPOSITORY/issues/12" --jq '.state'
```

`GH_TOKEN` è qui il nome della variabile letta dalla CLI, non una nuova credenziale. Per questa richiesta GET servono la risorsa corretta e il permesso di lettura; non serve `issues: write`. Un `404` può indicare sia un numero inesistente sia una risorsa non visibile: controlla repository, identità e accessi prima di ampliare i permessi.

Per controllare la sessione **locale** della CLI, senza richiedere il valore del token:

```bash
gh auth status --hostname github.com
```

## Conservazione e revoca

Non incollare valori reali in comandi salvati nella cronologia, file Markdown, URL del remoto, ticket o log. In locale usa il gestore credenziali; in CI passa le credenziali solo ai job o agli step che ne hanno bisogno. Inventaria proprietario, scopo, scadenza e consumatori senza registrarne il valore. Se un token è stato esposto, revocalo presso l’emittente e aggiorna i consumatori autorizzati: sostituire il valore nel workflow non disabilita quello vecchio.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Accessi ruoli e permessi GitHub|Accessi ruoli e permessi GitHub]]
- [[Programmazione/GitHub/Pagine/Secret scanning|Secret scanning]]
- [[Programmazione/GitHub/Pagine/Repository settings|Repository settings]]
- [[Programmazione/GitHub/Pagine/OIDC GitHub Actions|OIDC GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]

## Fonti

- [GitHub Docs: token personali, limiti e scadenze](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Docs: identità e durata del GITHUB_TOKEN](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub REST API: permessi per leggere una issue](https://docs.github.com/en/rest/issues/issues#get-an-issue)
- [GitHub CLI: autenticazione da variabili d’ambiente](https://cli.github.com/manual/gh_help_environment)
