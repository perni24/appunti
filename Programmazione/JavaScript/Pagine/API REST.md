---
date: 2026-06-02
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

## Quando usarlo

Usa una API REST quando devi esporre risorse consultabili o modificabili tramite HTTP in modo semplice e interoperabile.

E adatta per:

- CRUD su entita come utenti, ordini, prodotti o articoli;
- comunicazione tra frontend e backend;
- integrazioni con servizi esterni;
- API pubbliche o interne dove HTTP e status code sono sufficienti.

Valuta alternative come GraphQL, RPC o WebSocket quando servono query molto flessibili, comandi non orientati a risorse o comunicazione real-time.

## Come funziona

### Concetto chiave
REST modella il dominio come risorse identificate da URL.

```javascript
const response = await fetch("/api/users/42");

if (!response.ok) {
  throw new Error("Request failed");
}

const user = await response.json();
```
### Metodi comuni
- `GET`: leggere risorse.
- `POST`: creare risorse o inviare comandi.
- `PUT`: sostituire una risorsa.
- `PATCH`: aggiornamento parziale.
- `DELETE`: eliminare una risorsa.
### Aspetti importanti
- Status code coerenti.
- Validazione input.
- Gestione errori strutturata.
- Autenticazione e autorizzazione.
- Versionamento dell'API.

## API / Sintassi

Pattern tipici degli endpoint:

```text
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

Esempio client con `fetch`:

```javascript
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

Status code comuni:

- `200 OK`: lettura o aggiornamento riuscito;
- `201 Created`: risorsa creata;
- `204 No Content`: operazione riuscita senza body;
- `400 Bad Request`: input non valido;
- `401 Unauthorized`: utente non autenticato;
- `403 Forbidden`: utente autenticato ma non autorizzato;
- `404 Not Found`: risorsa non trovata;
- `409 Conflict`: conflitto di stato;
- `500 Internal Server Error`: errore server.

## Esempio pratico

Creazione di una risorsa:

```javascript
async function createUser(data) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    return response.json();
  }

  if (response.status === 400) {
    const error = await response.json();
    throw new Error(error.message);
  }

  throw new Error(`Unexpected status ${response.status}`);
}
```

La gestione esplicita degli status rende chiaro il contratto tra client e server.

## Varianti

- **REST classico**: risorse, URL, metodi HTTP e rappresentazioni JSON.
- **JSON API**: convenzione piu rigida per payload, relazioni ed errori.
- **HAL**: risposte con link ipermediali.
- **RPC su HTTP**: endpoint orientati ad azioni, per esempio `/login` o `/send-email`.
- **GraphQL**: un endpoint con query dichiarative, utile quando il client deve controllare molto la forma dei dati.

## Errori comuni

- Restituire sempre `200 OK`.
- Mescolare errori applicativi e di protocollo.
- Non gestire timeout e cancellazione lato client.

## Checklist

- Usa nomi di risorse chiari e consistenti.
- Scegli metodi HTTP coerenti con l'operazione.
- Restituisci status code significativi.
- Valida input e autorizzazioni lato server.
- Documenta payload, errori e paginazione.
- Gestisci timeout, abort e retry lato client dove serve.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]
