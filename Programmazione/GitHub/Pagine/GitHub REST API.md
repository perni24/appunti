---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [github, api, rest, automazione]
aliases: [GitHub REST API, REST API GitHub]
prerequisites: [GitHub, Personal access token GitHub]
related: [GitHub GraphQL API, GitHub Apps, Webhooks GitHub, Fine-grained token GitHub]
---

# GitHub REST API

## Sintesi

La **GitHub REST API** permette di leggere e modificare risorse GitHub tramite endpoint HTTP. E utile per script, integrazioni, bot, dashboard, automazioni di repository e strumenti interni.

E l'API piu immediata quando conosci gia la risorsa da manipolare: issue, pull request, repository, release, workflow, secret, team o organizzazioni.

## Quando usarlo

Usala quando:

- vuoi automatizzare operazioni GitHub da script;
- vuoi creare, leggere o aggiornare issue e pull request;
- vuoi gestire release, tag, branch o repository;
- vuoi interrogare workflow e run di GitHub Actions;
- vuoi integrare un servizio esterno con GitHub;
- vuoi usare endpoint documentati con permessi chiari.

## Come funziona

La REST API usa richieste HTTP verso endpoint come:

```text
https://api.github.com/repos/OWNER/REPO/issues
```

Gli elementi importanti sono:

- metodo HTTP: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`;
- autenticazione: `GITHUB_TOKEN`, PAT, GitHub App token o OAuth token;
- header di versione API;
- paginazione;
- rate limit;
- permessi richiesti dall'endpoint.

Per automazioni stabili conviene trattare la versione API come parte della configurazione.

## API / Sintassi

Richiesta base con `curl`:

```bash
curl \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/OWNER/REPO/issues
```

Creare una issue:

```bash
curl \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  https://api.github.com/repos/OWNER/REPO/issues \
  -d '{"title":"Bug login","body":"Descrizione del problema"}'
```

## Esempio pratico

Script per leggere pull request aperte:

```bash
curl \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer TOKEN" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "https://api.github.com/repos/OWNER/REPO/pulls?state=open"
```

Questo e utile per dashboard, report automatici o controlli pre-release.

## Varianti

- **REST API da script locale**: usa PAT o GitHub CLI.
- **REST API da GitHub Actions**: preferisci `GITHUB_TOKEN` quando basta.
- **REST API con GitHub App**: migliore per integrazioni persistenti.
- **REST API con paginazione**: necessaria su liste grandi.
- **GraphQL API**: migliore quando vuoi dati aggregati e selezione precisa dei campi.

## Errori comuni

- Non impostare la versione API.
- Ignorare paginazione e leggere solo la prima pagina.
- Usare token con permessi troppo ampi.
- Non gestire rate limit e retry.
- Salvare token in chiaro negli script.
- Confondere errore di permessi con endpoint sbagliato.

## Checklist

- L'endpoint supporta il tipo di token scelto?
- Il token ha solo i permessi necessari?
- La richiesta include versione API?
- La risposta puo essere paginata?
- Gli errori HTTP sono gestiti?
- I token non sono stampati nei log?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub]]
- [[GitHub GraphQL API]]
- [[GitHub Apps]]
- [[Personal access token GitHub]]
- [[Fine-grained token GitHub]]
- [[Webhooks GitHub]]

## Fonti

- [GitHub Docs - REST API](https://docs.github.com/en/rest)
