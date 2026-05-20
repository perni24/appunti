---
date: 2026-05-20
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

## Concetto chiave

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

## Responsabilita

- Costruire URL e query string.
- Gestire autenticazione.
- Normalizzare errori.
- Validare payload quando serve.
- Esporre funzioni orientate al dominio.

## Con React Query

L'API layer puo essere usato da hook di data fetching.

```javascript
const userQuery = useQuery({
  queryKey: ["user", id],
  queryFn: () => getUser(id)
});
```

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/React/Pagine/Data Fetching e Cache|Data Fetching e Cache]]
- [[Programmazione/React/Pagine/Validazione Dati|Validazione Dati]]
- [[Programmazione/React/Pagine/Gestione Autenticazione|Gestione Autenticazione]]


