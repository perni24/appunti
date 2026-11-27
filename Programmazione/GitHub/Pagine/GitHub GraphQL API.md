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
  - graphql
  - automazione
aliases:
  - GitHub GraphQL API
  - GraphQL API GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
related:
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
title: GitHub GraphQL API
---

# GitHub GraphQL API

## Sintesi

Con GraphQL descrivi **quali campi e relazioni** restituire. Una dashboard può chiedere nome del repository, numero e titolo delle issue senza scaricare tutto il JSON delle risorse. Una `query` legge; una `mutation` può modificare dati. Entrambe passano normalmente con `POST` a `https://api.github.com/graphql`: il metodo HTTP qui non distingue lettura e scrittura.

## Esempio pratico: leggere tutte le issue aperte

Documento GraphQL, per esempio `issue.graphql`. `owner` e `name` sono variabili, non testo da concatenare alla query. La prima richiesta omette `endCursor`; nelle successive `after` riparte dal cursore dell’ultima pagina.

```graphql
query IssueAperte($owner: String!, $name: String!, $endCursor: String) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    issues(first: 50, after: $endCursor, states: [OPEN]) {
      nodes { number title url }
      pageInfo { hasNextPage endCursor }
    }
  }
}
```

Con il file nella directory corrente e GitHub CLI autenticata, sostituisci `OWNER` e `REPO`. `-F query=@issue.graphql` legge il documento da file. Con `--paginate` la CLI usa la variabile `$endCursor` e i campi di `pageInfo`; `--slurp` restituisce un array con una risposta per pagina.

```bash
gh api graphql --paginate --slurp -f owner=OWNER -f name=REPO -F query=@issue.graphql
```

Dentro ogni pagina trovi le issue in `data.repository.issues.nodes`. **`first: 50` da solo non legge l’intera lista**. Con un client proprio continua solo se `hasNextPage` è vero e hai un nuovo `endCursor`; non ricavare il cursore dal numero della issue. Una seconda connection, per esempio i commenti di ogni issue, ha cursori propri. Per una dashboard non confondere un campione di commenti con il totale.

## Perché controllare anche il corpo della risposta

Un client HTTP non deve interpretare `200` come «report completo». Esempio di risposta parziale **illustrativa**: un campo richiesto è illeggibile, un altro è disponibile.

```json
{
  "data": { "repository": null, "viewer": { "login": "utente-esempio" } },
  "errors": [{ "message": "Repository non disponibile", "path": ["repository"] }]
}
```

Questo illustra una query che richiedeva *anche* `viewer`, non l’output della query precedente. Se il repository è indispensabile al report, segnala il problema: `repository: null` **non equivale** a `issues.nodes: []`. Se accetti dati parziali, marca esplicitamente cosa manca. Prima di riprovare distingui un errore di schema, un permesso mancante e un limite di costo.

## Scelta degli strumenti

Usa `nodes` se servono solo gli oggetti; `edges` se servono informazioni del collegamento, come il cursore per elemento. I *fragment* riusano selezioni di campi, non concedono accesso. Un node ID e il numero di una issue non sono intercambiabili. Per modificare un oggetto verifica quale ID richiede la mutation; per una singola operazione ben documentata, REST può essere più semplice.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/Personal access token GitHub|Personal access token GitHub]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]

## Fonti

- [GitHub Docs - Costruire chiamate GraphQL](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)
- [GitHub Docs - Connection e paginazione](https://docs.github.com/en/graphql/guides/using-pagination-in-the-graphql-api)
- [GitHub Docs - Costi e risposte di errore](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)
- [GitHub CLI - Paginazione GraphQL](https://cli.github.com/manual/gh_api)
