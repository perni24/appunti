---
date: 2026-05-20
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - api
  - http
aliases: []
prerequisites: []
related: []
---

# API REST

## Sintesi

Una **API REST** espone risorse tramite HTTP usando metodi come `GET`, `POST`, `PUT`, `PATCH` e `DELETE`. JavaScript interagisce con queste API soprattutto tramite `fetch`.

## Concetto chiave

REST modella il dominio come risorse identificate da URL.

```javascript
const response = await fetch("/api/users/42");

if (!response.ok) {
  throw new Error("Request failed");
}

const user = await response.json();
```

## Metodi comuni

- `GET`: leggere risorse.
- `POST`: creare risorse o inviare comandi.
- `PUT`: sostituire una risorsa.
- `PATCH`: aggiornamento parziale.
- `DELETE`: eliminare una risorsa.

## Aspetti importanti

- Status code coerenti.
- Validazione input.
- Gestione errori strutturata.
- Autenticazione e autorizzazione.
- Versionamento dell'API.

## Errori comuni

- Restituire sempre `200 OK`.
- Mescolare errori applicativi e di protocollo.
- Non gestire timeout e cancellazione lato client.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]


