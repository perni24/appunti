---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, fetch, http, networking, promises]
aliases: [Fetch JS, Fetch API]
prerequisites: [Promises, Async Await, JSON]
related: [AbortController, CORS, AJAX, Promise avanzate]
---

# Fetch API

## Sintesi

La Fetch API permette di eseguire richieste HTTP dal browser e da ambienti JavaScript moderni.

`fetch()` restituisce una Promise che si risolve con un oggetto `Response`.

---

## Quando usarlo

Usa Fetch API quando devi comunicare via HTTP da codice JavaScript moderno.

Casi comuni:

- leggere dati da API REST;
- inviare JSON;
- caricare testo o file;
- gestire upload o download;
- fare richieste cancellabili con `AbortController`;
- centralizzare un client HTTP leggero.

Per funzionalita avanzate come retry, cache applicativa, interceptors o gestione automatica complessa, puoi creare wrapper o usare librerie dedicate.

## Come funziona

### GET base
```js
const response = await fetch("/api/users/1");
const user = await response.json();

console.log(user);
```

Per impostazione predefinita, `fetch()` esegue una richiesta `GET`.

---
### Oggetto Response
`Response` contiene metadati e metodi per leggere il body.

```js
const response = await fetch("/api/users/1");

console.log(response.status);
console.log(response.ok);
console.log(response.headers.get("content-type"));
```

Metodi comuni:

- `response.json()` legge JSON;
- `response.text()` legge testo;
- `response.blob()` legge dati binari come `Blob`;
- `response.arrayBuffer()` legge dati binari grezzi;
- `response.formData()` legge dati form.

I metodi di lettura del body sono asincroni.

---
### POST JSON
```js
const response = await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Luca",
    email: "luca@example.com",
  }),
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const createdUser = await response.json();
```

Il body deve essere serializzato manualmente quando invii JSON.

---
### Query string
Usa `URL` e `URLSearchParams` per costruire query sicure.

```js
const url = new URL("/api/search", window.location.origin);

url.searchParams.set("q", "javascript");
url.searchParams.set("page", "1");

const response = await fetch(url);
```

Questo evita errori di encoding manuale.

---
### Headers
```js
const response = await fetch("/api/private", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
});
```

Alcuni header sono controllati dal browser e non possono essere impostati manualmente.

---
### Credentials e cookie
Per inviare cookie cross-origin bisogna specificare `credentials`.

```js
await fetch("https://api.example.com/me", {
  credentials: "include",
});
```

Valori principali:

- `same-origin`: default in molti casi, invia credenziali solo same-origin;
- `include`: invia credenziali anche cross-origin;
- `omit`: non invia credenziali.

Questo interagisce con CORS e configurazione server.

---
### AbortController
Per annullare una richiesta usa `AbortController`.

```js
const controller = new AbortController();

const timeoutId = setTimeout(() => {
  controller.abort();
}, 3000);

try {
  const response = await fetch("/api/data", {
    signal: controller.signal,
  });

  return await response.json();
} finally {
  clearTimeout(timeoutId);
}
```

---
### Wrapper riutilizzabile
```js
async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
```

Un wrapper centralizza parsing, errori e header comuni.

---

## API / Sintassi

Chiamata base:

```js
const response = await fetch(url, options);
```

Opzioni comuni:

```js
await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
  credentials: "include",
  signal: controller.signal,
});
```

Lettura risposta:

```js
response.ok;
response.status;
response.headers.get("content-type");
await response.json();
await response.text();
await response.blob();
await response.arrayBuffer();
```

## Esempio pratico

Wrapper JSON riutilizzabile:

```js
async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

const user = await requestJson("/api/users/1");
```

Il wrapper evita di ripetere controllo `response.ok` e parsing JSON in ogni chiamata.

## Varianti

- **GET semplice**: lettura dati.
- **POST JSON**: invio dati strutturati.
- **FormData**: upload form o file.
- **Blob/ArrayBuffer**: dati binari.
- **AbortController**: cancellazione e timeout.
- **Streaming body**: utile in scenari avanzati.
- **Wrapper applicativo**: centralizza errori, header e parsing.

## Errori comuni

### Errori HTTP
`fetch()` non rifiuta la Promise per status HTTP come `404` o `500`.

```js
const response = await fetch("/api/users/404");

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const user = await response.json();
```

La Promise viene rifiutata per errori di rete, CORS, abort o problemi simili.

---
- Non controllare `response.ok`.
- Chiamare `response.json()` due volte sullo stesso body.
- Dimenticare `JSON.stringify` nel body.
- Impostare `Content-Type` sbagliato.
- Confondere errori HTTP con errori di rete.
- Ignorare CORS e credenziali.

---

## Checklist

### Checklist operativa
- Controlla sempre `response.ok`.
- Gestisci errori con `try/catch`.
- Usa `AbortController` per timeout e richieste obsolete.
- Usa `URLSearchParams` per query string.
- Centralizza logica comune in un wrapper.
- Configura `credentials` solo quando serve.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/AJAX|AJAX]]
