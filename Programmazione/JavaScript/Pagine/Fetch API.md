---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - fetch
  - http
  - networking
  - promises
aliases:
  - Fetch JS
  - Fetch API
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
related:
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
  - "[[Programmazione/JavaScript/Pagine/AJAX]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
title: Fetch API
---

# Fetch API

## Sintesi

La Fetch API permette di eseguire richieste HTTP dal browser e da ambienti JavaScript moderni.

`fetch()` restituisce una Promise che, quando sono disponibili status e header, diventa fulfilled con un oggetto `Response`. Il corpo puo essere ancora in arrivo: leggerlo e un secondo passaggio asincrono, che puo fallire anche dopo una risposta HTTP riuscita.

Tre controlli distinti: esito HTTP, formato del corpo e schema dei dati richiesto dall'applicazione. Un `200` con JSON valido non garantisce un oggetto utente valido.

Gli esempi sono indipendenti, salvo dipendenze dichiarate. Gli URL `/api/...` richiedono un backend dimostrativo, non esistono nel sito degli appunti. I frammenti con `await` al livello principale richiedono un modulo; in un'app vanno inseriti in funzioni async con errori gestiti dal chiamante. In Node usa URL assoluti e verifica le API disponibili nella versione del runtime: CORS e cookie del browser non si trasferiscono automaticamente al server.

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
async function readUser() {
  const response = await fetch("/api/users/1");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

try {
  console.log(await readUser());
} catch (error) {
  console.error("Caricamento non riuscito", error);
}
```

Per impostazione predefinita, `fetch()` esegue una richiesta `GET`. Questo primo esempio controlla HTTP e parsing, ma non ancora i campi del risultato. GET e HEAD non accettano un body: i parametri di lettura vanno nella query string.

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

`response.ok` vale true per status da 200 a 299; non dice se il corpo sia JSON. `json()` restituisce il valore JavaScript ottenuto dal parsing, non una stringa JSON. I metodi leggono normalmente l'intero corpo in memoria: per file grandi valuta `response.body` e gli stream.

### Corpo monouso e risposte vuote

Le letture elencate sopra sono alternative. Un corpo non nullo gia consumato o bloccato da un reader non puo essere letto nuovamente con `json()` o `text()`. `bodyUsed` indica il consumo, non tutti i possibili lock dello stream.

Esempio autonomo, senza rete: clona la risposta prima della lettura per ottenere due rami.

```js
const response = new Response('{"id":1}', {
  headers: { "Content-Type": "application/json" },
});
const copy = response.clone();
const [data, text] = await Promise.all([response.json(), copy.text()]);
console.log(data.id, text); // 1, '{"id":1}'
```

`clone()` non ripete la richiesta e non azzera un body gia letto. Il ramo piu lento puo accumulare dati in memoria: non clonare grandi download solo per fare logging.

Una risposta `204`, `205` o a una richiesta HEAD non contiene il JSON atteso: chiamare `json()` su un corpo vuoto fallisce. Anche un `200` vuoto non e JSON valido. Stabilisci nel contratto dell'endpoint quando non leggere il corpo; non trasformare ogni errore di parsing in un successo vuoto.

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

Il body deve essere serializzato manualmente quando invii JSON. Questo endpoint dimostrativo deve rispondere con JSON, per esempio con status 201; se risponde senza corpo, non chiamare `json()`. `Content-Type` descrive cio che invii, mentre `Accept` indica il formato di risposta desiderato: nessuno dei due valida automaticamente i dati.

### FormData e file

Nel browser, passa un `File` ottenuto da un input file. Esempio con risposta senza dati da interpretare:

```js
async function uploadAvatar(file) {
  if (!(file instanceof File)) throw new TypeError("Serve un File");
  const body = new FormData();
  body.append("avatar", file);
  const response = await fetch("/api/avatar", { method: "POST", body });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.status;
}
```

Non impostare manualmente `Content-Type: multipart/form-data`: il browser deve aggiungere il boundary coerente con il corpo. Validazione di dimensioni, formato e autorizzazioni resta necessaria sul server; il controllo `File` non la sostituisce. Il chiamante deve attendere o gestire il rifiuto di `uploadAvatar()`.

---
### Query string
Usa `URL` e `URLSearchParams` per codificare correttamente i parametri, senza concatenazioni manuali.

```js
const url = new URL("/api/search", window.location.origin);

url.searchParams.set("q", "javascript");
url.searchParams.set("page", "1");

const response = await fetch(url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const results = await response.json();
```

Questo evita errori di encoding, non esegue autorizzazione o validazione sul server. La barra iniziale indica la radice dell'origine, non la sottocartella corrente. Non mettere password o token nella query: possono finire in log e cronologia.

---
### Headers
Schema: `token` e fornito dall'autenticazione dell'applicazione, non va scritto negli appunti o nel sorgente pubblico.

```js
const response = await fetch("/api/private", {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  },
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const privateData = await response.json();
```

Puoi passare un oggetto, un array di coppie o un oggetto `Headers`. Usa `new Headers(...)` per copiarli e gestire i nomi senza distinzione fra maiuscole e minuscole. Uno spread su un oggetto `Headers` non e un modo corretto di copiarne le voci.

Alcuni header, come `Cookie`, sono controllati dal browser. Non inviare automaticamente `Authorization` verso URL arbitrari; `credentials: "omit"` non e un filtro che rimuove un header Authorization aggiunto esplicitamente dal tuo codice.

---
### Credentials e cookie
Nel browser, `credentials` regola l'uso delle credenziali gestite dal browser, inclusi i cookie, e l'accettazione di `Set-Cookie`.

```js
const response = await fetch("https://api.example.com/me", {
  credentials: "include",
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const profile = await response.json();
```

Valori principali:

- `same-origin`: valore predefinito, usa le credenziali solo sulla stessa origine;
- `include`: consente di usarle anche cross-origin, entro le altre regole del browser;
- `omit`: esclude le credenziali gestite automaticamente e ignora Set-Cookie.

`include` non forza l'invio di qualsiasi cookie: contano dominio, percorso, Secure, SameSite e blocchi dei cookie di terze parti. Cross-origin non significa necessariamente cross-site. Per leggere una risposta cross-origin con credenziali, il server deve consentire l'origine precisa, non `*`, e inviare `Access-Control-Allow-Credentials: true`.

### CORS non e un'opzione da disattivare

`mode: "no-cors"` non rende leggibile un'API esterna: la risposta cross-origin e opaca, con status 0, header non esposti e corpo non accessibile al codice. JSON e header personalizzati possono richiedere un preflight CORS. La correzione va nella configurazione del server o in un backend autorizzato, non in un bypass del browser.

Un errore CORS non dimostra che la richiesta non sia arrivata al server. CORS non e un sistema di autenticazione ne una difesa completa contro CSRF. Vedi [[Programmazione/JavaScript/Pagine/CORS|CORS]] per i dettagli.

---
### AbortController
Per annullare una richiesta usa `AbortController`. Funzione autonoma con timeout fisso dimostrativo e controllo HTTP:

```js
async function readDataWithTimeout() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch("/api/data", { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Il chiamante gestisce il rifiuto. `return await` mantiene il timer durante la lettura del corpo, prima del finally. Non e una deadline precisa e non annulla eventuali modifiche gia eseguite sul server. Per annullamento manuale, signal composti e distinzione delle cause vedi [[Programmazione/JavaScript/Pagine/AbortController|AbortController]].

---
### Wrapper riutilizzabile
Contratto di `requestJson`: URL come stringa o `URL`, opzioni `RequestInit`, risposta JSON oppure nessun corpo per HEAD/204/205. Non accetta un oggetto `Request` preconfigurato, per evitare di perderne implicitamente gli header. Non serializza automaticamente gli oggetti in ingresso.

```js
class HttpError extends Error {
  constructor(response) {
    super(`HTTP ${response.status}`);
    this.name = "HttpError";
    this.status = response.status;
  }
}

async function requestJson(url, options = {}) {
  if (typeof url !== "string" && !(url instanceof URL)) {
    throw new TypeError("Serve una stringa URL o un oggetto URL");
  }
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) throw new HttpError(response);

  const method = (options.method ?? "GET").toUpperCase();
  if (method === "HEAD" || response.status === 204 || response.status === 205) {
    return null;
  }
  const mediaType = (response.headers.get("content-type") ?? "")
    .split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json" &&
      !(mediaType.startsWith("application/") && mediaType.endsWith("+json"))) {
    throw new TypeError("Risposta non dichiarata come JSON");
  }
  return response.json();
}
```

Gli header normalizzati sono applicati dopo `...options`, quindi non vengono sovrascritti. Un Accept esplicito viene conservato, ma il wrapper continua ad accettare solo risposte JSON. Gli header del chiamante non vengono modificati.

Il wrapper distingue `HttpError`, media type inatteso e parsing fallito; rete e abort si propagano. Non legge il corpo degli errori HTTP: un'API con errori JSON strutturati richiede una politica dedicata. Il risultato `null` rappresenta qui assenza di corpo, ma puo anche essere un JSON `null`: usa un risultato strutturato se devi distinguerli. Un JSON ben formato va ancora validato rispetto allo schema dell'applicazione.

---

## API / Sintassi

Schema della chiamata (url e options forniti dal chiamante):

```js
const response = await fetch(url, options);
```

Schema con opzioni comuni: `data` e `controller` sono dipendenze dell'applicazione. Credentials va incluso solo se richiesto dal contratto, non come default universale.

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

Letture alternative del corpo, non una sequenza da eseguire sulla stessa risposta:

```text
response.ok;
response.status;
response.headers.get("content-type");
await response.json();
await response.text();
await response.blob();
await response.arrayBuffer();
```

## Esempio pratico

Usa `HttpError` e `requestJson` definiti sopra. Questo endpoint deve restituire un utente con id positivo sicuro e name non vuoto: il wrapper da solo non lo garantisce.

```js
async function getUser(id, { signal } = {}) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new RangeError("Id intero positivo richiesto");
  }
  const user = await requestJson(`/api/users/${id}`, { signal });
  if (user === null || typeof user !== "object" || Array.isArray(user) ||
      user.id !== id || typeof user.name !== "string" || !user.name.trim()) {
    throw new TypeError("Schema utente non valido");
  }
  return { id: user.id, name: user.name };
}
```

Uso separato:

```js
try {
  console.log(await getUser(1));
} catch (error) {
  if (error instanceof HttpError && error.status === 404) {
    console.error("Utente non trovato");
  } else {
    console.error("Caricamento fallito", error);
  }
}
```

La selezione dei campi evita di propagare proprieta inattese; non sostituisce l'autorizzazione del server. Per aggiornare la UI usa rendering testuale o escaping, non HTML grezzo da una risposta remota.

## Varianti

- **GET semplice**: lettura dati.
- **POST JSON**: invio dati strutturati.
- **FormData**: upload form o file.
- **Blob/ArrayBuffer**: dati binari.
- **AbortController**: cancellazione e timeout.
- **Streaming body**: utile in scenari avanzati.
- **Wrapper applicativo**: centralizza errori, header e parsing.

`Request` consente di preparare una richiesta per `fetch()` diretto. Un body consumato non e riutilizzabile: per un nuovo tentativo ricrea la richiesta o clonala prima del consumo. Questo non rende automaticamente sicuro il retry di POST o pagamenti: il server potrebbe avere gia completato l'operazione. Cache HTTP (`cache`), cache applicativa, redirect e retry sono politiche distinte; il wrapper non le implementa.

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
- Trattare un 204 come JSON o nascondere un JSON malformato con un fallback vuoto.
- Sovrascrivere gli header fusi mettendo `...options` dopo di essi.
- Classificare ogni TypeError come problema di rete: puo derivare da URL, opzioni, body o codice applicativo.
- Ripetere automaticamente una scrittura dopo un timeout, rischiando effetti duplicati.

---

## Checklist

### Checklist operativa
- Controlla sempre `response.ok`.
- Gestisci errori con `try/catch`.
- Usa `AbortController` per timeout e richieste obsolete.
- Usa `URLSearchParams` per query string.
- Centralizza logica comune in un wrapper.
- Configura `credentials` solo quando serve.
- Distingui formato JSON da schema e stabilisci cosa significa una risposta senza corpo.
- Non promettere rollback del server quando una richiesta viene annullata.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/AJAX|AJAX]]


## Fonti

- [MDN - Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN - RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
- [MDN - Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers)
- [MDN - Response.json](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
- [MDN - Response.clone](https://developer.mozilla.org/en-US/docs/Web/API/Response/clone)
- [MDN - FormData](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects)
- [WHATWG - Fetch standard](https://fetch.spec.whatwg.org/#fetch-method)
- [Node.js - Fetch](https://nodejs.org/api/globals.html#fetch)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
