---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, automazione, issues, pull-request]
aliases: [Automazioni issue e pull request, Automazioni GitHub issue PR]
prerequisites: [Issues GitHub, Pull request, GitHub REST API]
related: [GitHub Actions, GitHub Apps, Webhooks GitHub, GitHub REST API]
---

# Automazioni issue e pull request

## Sintesi

Le **automazioni issue e pull request** servono a ridurre lavoro ripetitivo su triage, label, assegnazioni, commenti, controlli e aggiornamenti di stato.

Possono essere implementate con GitHub Actions, REST API, GraphQL API, Webhooks o GitHub Apps. La scelta dipende da complessita, sicurezza e durata dell'automazione.

## Quando usarlo

Usale quando:

- vuoi aggiungere label in base a file o titolo;
- vuoi assegnare reviewer o owner;
- vuoi chiudere issue inattive;
- vuoi commentare PR con report automatici;
- vuoi controllare template o convenzioni;
- vuoi sincronizzare GitHub con strumenti esterni;
- vuoi costruire bot di repository.

## Come funziona

Ci sono tre modelli principali:

1. **GitHub Actions**: automazione dentro il repository, utile per workflow semplici.
2. **Webhooks + API**: servizio esterno che reagisce a eventi GitHub.
3. **GitHub App**: integrazione installabile con permessi granulari e token temporanei.

Per automazioni piccole parti da GitHub Actions. Per automazioni multi-repository, usa GitHub App o servizio esterno.

## API / Sintassi

Esempio con GitHub Actions su issue:

```yaml
name: Issue triage

on:
  issues:
    types: [opened]

permissions:
  issues: write

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - name: Add label
        run: gh issue edit "$ISSUE_URL" --add-label "triage"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_URL: ${{ github.event.issue.html_url }}
```

## Esempio pratico

Automazione per pull request:

1. trigger su `pull_request`;
2. legge file modificati;
3. assegna label `frontend`, `backend` o `docs`;
4. commenta se manca una checklist;
5. fallisce il check solo se la regola e bloccante.

La parte importante e separare automazioni informative da controlli bloccanti.

## Varianti

- **Label automatiche**: basate su path, titolo o template.
- **Commenti automatici**: utili per report o istruzioni contestuali.
- **Assegnazione reviewer**: integrata con CODEOWNERS o logica custom.
- **Stale issue**: chiusura o reminder su issue inattive.
- **Bot esterno**: usa webhook e REST API.
- **GitHub App**: adatta a molte repository e permessi dedicati.

## Errori comuni

- Dare `contents: write` quando basta `issues: write`.
- Usare `pull_request_target` senza capire i rischi.
- Commentare troppe volte creando rumore.
- Bloccare PR per controlli non affidabili.
- Non gestire fork e permessi ridotti.
- Usare PAT personali invece di `GITHUB_TOKEN` o GitHub App.

## Checklist

- L'automazione deve essere informativa o bloccante?
- I permessi sono minimi?
- Funziona con fork esterni?
- Evita commenti duplicati?
- Gestisce retry e fallimenti API?
- I token non sono esposti nei log?
- La regola e documentata nel repository?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Issues GitHub]]
- [[Pull request]]
- [[Labels milestones e assignees]]
- [[GitHub Actions]]
- [[GitHub REST API]]
- [[GitHub Apps]]
- [[Webhooks GitHub]]

## Fonti

- [GitHub Docs - REST API issues](https://docs.github.com/en/rest/issues/issues)
- [GitHub Docs - REST API pull requests](https://docs.github.com/en/rest/pulls/pulls)
- [GitHub Docs - GitHub Actions manage issues and pull requests](https://docs.github.com/en/actions/use-cases-and-examples/project-management)
