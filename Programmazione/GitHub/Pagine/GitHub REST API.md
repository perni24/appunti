---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - api
  - rest
  - automazione
aliases:
  - GitHub REST API
  - REST API GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/GitHub GraphQL API]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Webhooks GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Fine-grained token GitHub]]"
title: GitHub REST API
---

# GitHub REST API

## Sintesi

Con REST scegli una risorsa e un’operazione: `GET` legge, `POST` crea o applica un’azione, `PATCH` modifica alcuni campi. `PUT` e `DELETE` hanno effetti definiti dal singolo endpoint. Per sapere quali issue sono aperte in un repository basta una lettura; non serve concedere allo script il diritto di aprirne di nuove.

## Esempio pratico: un report di sole issue

Da Bash, con GitHub CLI autenticata, sostituisci `OWNER/REPO` con il repository leggibile. Su GitHub.com il comando interroga la REST API in sola lettura. La redirezione **crea o sovrascrive** `pagine.json` nella directory corrente: usa una cartella di lavoro, non una cartella pubblicabile del vault.

```bash
gh api --method GET -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2026-03-10' --paginate --slurp 'repos/OWNER/REPO/issues?state=open&per_page=100' > pagine.json
```

`per_page=100` è la dimensione della pagina, non il massimo del report. `--paginate` segue le pagine successive e `--slurp` raccoglie gli array di pagina in un array esterno. Con un client HTTP proprio, segui l’URL `rel="next"` nell’header `Link` finché manca: non dedurre la fine dal numero di elementi. Fissare una versione REST supportata rende esplicito il contratto utilizzato.

L’endpoint `/issues` include **anche le pull request**, riconoscibili dalla proprietà `pull_request`. Dopo il successo di `gh`, questo comando Node legge il file locale e stampa soltanto numero e titolo delle issue:

```bash
node -e "const pages = JSON.parse(require('node:fs').readFileSync('pagine.json', 'utf8')); console.log(JSON.stringify(pages.flat().filter(x => Object.hasOwn(x, 'pull_request') === false).map(({number,title}) => ({number,title}))))"
```

Per un elenco di sole PR usa invece `GET /repos/OWNER/REPO/pulls`. Per aprire una issue, `POST /repos/OWNER/REPO/issues` riceve un oggetto con `title` e, facoltativamente, `body`: **crea** una risorsa e normalmente restituisce `201`. Dopo un timeout non ripetere la scrittura alla cieca: la prima richiesta potrebbe essere già riuscita.

## Interpretare un risultato inatteso

| Risposta | Prima verifica |
| --- | --- |
| `200` ma report incompleto | Paginazione, filtri e presenza di PR nel conteggio. Un array vuoto non è un errore HTTP. |
| `401` | Credenziale mancante, scaduta o non valida. |
| `403` o `429` | Leggi messaggio e header: non ogni `403` è un problema di permessi. Per un limite rispetta `Retry-After` se presente; con quota residua zero attendi il reset. |
| `404` su un repository privato | Verifica sia il percorso sia l’accesso: GitHub può nascondere l’esistenza della risorsa. |
| `422` in scrittura | Controlla i campi dell’errore, il formato e i vincoli dell’endpoint prima di riprovare. |

Nel job Actions usa il `GITHUB_TOKEN` se sufficiente; in una GitHub App usa il token dell’installazione. Scegli REST per risorse note e GraphQL quando conviene comporre dati collegati, non per aggirare i permessi.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API|GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/Personal access token GitHub|Personal access token GitHub]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]
- [[Programmazione/GitHub/Pagine/Webhooks GitHub|Webhooks GitHub]]

## Fonti

- [GitHub Docs - Endpoint delle issue](https://docs.github.com/en/rest/issues/issues)
- [GitHub Docs - Versioni REST supportate](https://docs.github.com/en/rest/about-the-rest-api/api-versions)
- [GitHub Docs - Paginazione REST](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)
- [GitHub Docs - Rate limit e attese](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub CLI - gh api](https://cli.github.com/manual/gh_api)
