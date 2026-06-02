---
date: 2026-06-02
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - react
  - api
  - architettura
aliases: []
prerequisites: []
related: []
---

# API layer

## Sintesi

L'**API layer** isola il codice che comunica con backend, servizi esterni o storage remoto dal resto della UI React.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
I componenti non dovrebbero conoscere dettagli grezzi di endpoint, header, mapping e gestione errori HTTP.

```javascript
export async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error("User request failed");
  }

  return response.json();
}
```
### Responsabilita
- Costruire URL e query string.
- Gestire autenticazione.
- Normalizzare errori.
- Validare payload quando serve.
- Esporre funzioni orientate al dominio.
### Con React Query
L'API layer puo essere usato da hook di data fetching.

```javascript
const userQuery = useQuery({
  queryKey: ["user", id],
  queryFn: () => getUser(id)
});
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]
