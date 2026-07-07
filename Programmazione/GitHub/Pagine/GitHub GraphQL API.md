---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [github, api, graphql, automazione]
aliases: [GitHub GraphQL API, GraphQL API GitHub]
prerequisites: [GitHub REST API]
related: [GitHub REST API, GitHub Apps, Personal access token GitHub]
---

# GitHub GraphQL API

## Sintesi

La **GitHub GraphQL API** permette di chiedere esattamente i dati che servono, con query e mutation GraphQL. E utile quando una chiamata REST richiederebbe molte richieste separate o quando vuoi comporre dati da risorse collegate.

La REST API e spesso piu semplice per operazioni dirette. GraphQL diventa piu vantaggiosa per query ricche, dashboard, report e automazioni che leggono molte relazioni.

## Quando usarlo

Usala quando:

- vuoi leggere dati collegati in una sola richiesta;
- vuoi selezionare solo i campi necessari;
- vuoi costruire dashboard o report;
- vuoi usare node ID globali;
- vuoi ridurre molte chiamate REST;
- devi usare mutation GraphQL disponibili solo nello schema.

## Come funziona

GraphQL usa un singolo endpoint:

```text
https://api.github.com/graphql
```

La richiesta contiene:

- `query`, per leggere dati;
- `mutation`, per modificare dati;
- variabili;
- autenticazione;
- gestione di paginazione tramite connection, `edges`, `nodes` e `pageInfo`.

Il costo della query dipende da complessita e quantita di dati richiesti.

## API / Sintassi

Query per leggere repository e issue:

```graphql
query RepositoryIssues($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    issues(first: 10, states: OPEN) {
      nodes {
        title
        url
        createdAt
      }
    }
  }
}
```

Chiamata con `curl`:

```bash
curl \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { viewer { login } }"}' \
  https://api.github.com/graphql
```

## Esempio pratico

Per una dashboard puoi leggere in una query:

- nome repository;
- issue aperte;
- pull request aperte;
- ultimi aggiornamenti;
- stato di campi Project.

Con REST spesso richiederesti piu endpoint e piu paginazione.

## Varianti

- **Query**: lettura dati.
- **Mutation**: modifica dati.
- **Fragments**: riuso di selezioni.
- **Variables**: parametri esterni alla query.
- **Pagination**: lettura progressiva di connection.
- **REST + GraphQL**: spesso convivono nello stesso strumento.

## Errori comuni

- Richiedere troppi campi senza bisogno.
- Dimenticare la paginazione.
- Non controllare costo e rate limit.
- Usare GraphQL per una chiamata REST semplice.
- Non gestire campi `null`.
- Basarsi su node ID senza conservarli correttamente.

## Checklist

- GraphQL riduce davvero il numero di richieste?
- La query seleziona solo i campi utili?
- La paginazione e gestita?
- Le variabili sono separate dalla query?
- I permessi del token coprono tutti i dati richiesti?
- Gli errori GraphQL sono gestiti oltre allo status HTTP?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub REST API]]
- [[GitHub Apps]]
- [[Personal access token GitHub]]
- [[Fine-grained token GitHub]]

## Fonti

- [GitHub Docs - GraphQL API](https://docs.github.com/en/graphql)
