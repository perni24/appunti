---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - api
  - http
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/JSON|JSON]]"
related:
  - "[[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]"
  - "[[Programmazione/JavaScript/Pagine/AbortController|AbortController]]"
title: API REST
---

# API REST

## Sintesi

**REST** e uno stile architetturale per sistemi distribuiti, non un formato JSON o un elenco di endpoint CRUD. Nelle API web si traduce spesso in risorse identificate da URI, rappresentazioni e uso coerente di HTTP.

Questa nota distingue i principi REST dal contratto concreto di una API e mostra un client JavaScript per una piccola **API HTTP orientata a risorse**. Il demo non pretende di implementare tutti i vincoli REST.

## Quando usarlo

- Risorse consultabili e modificabili da piu client.
- Frontend/backend separati e integrazioni via HTTP.
- Contratti in cui metodi, rappresentazioni, cache e status HTTP sono utili.

Non esiste una superiorita universale: RPC puo esprimere comandi, GraphQL esigenze di selezione dei dati, WebSocket eventi bidirezionali. Questi approcci possono convivere.

## Come funziona

### Risorsa, rappresentazione e vincoli

`/users/42` identifica una risorsa; il JSON restituito ne e una rappresentazione, non necessariamente la riga del database. JSON e comune, ma REST non lo impone.

I vincoli comprendono separazione client/server, comunicazione stateless, cache esplicita, interfaccia uniforme e sistema a strati; code-on-demand e facoltativo. L'interfaccia uniforme include messaggi auto-descrittivi e collegamenti ipermediali che guidano le transizioni. URL con nomi plurali e JSON non bastano a dimostrare piena conformita REST.

**Stateless non significa senza database o senza autenticazione**: riguarda la comprensione di ogni richiesta senza dover ricostruire una conversazione implicita precedente. Lo stato delle risorse puo essere persistente. Molte API chiamate REST sono, pragmaticamente, API HTTP JSON con un contratto documentato.

### Metodi: safe e idempotente

| Metodo | Uso tipico | Safe | Idempotente per semantica |
| --- | --- | --- | --- |
| GET | Leggere una rappresentazione | Si | Si |
| HEAD | Metadati come GET, senza contenuto di risposta | Si | Si |
| POST | Elaborare dati, spesso creare una risorsa | No | Non garantito |
| PUT | Creare o sostituire lo stato all'URI noto | No | Si |
| PATCH | Applicare un insieme di modifiche | No | Non garantito |
| DELETE | Rimuovere l'associazione della risorsa all'URI | No | Si |

Safe significa che il client non richiede un cambiamento di stato; log o contabilizzazione tecnica possono comunque avvenire. Non implementare eliminazioni con GET.

Idempotente riguarda l'effetto richiesto di ripetizioni identiche, non la risposta identica: un DELETE puo dare 204 e poi 404. Non promette cancellazione fisica da backup o storage.

PUT non significa automaticamente "aggiorna i campi presenti". PATCH richiede un formato e una semantica documentati: assegnare un valore puo essere idempotente, incrementarlo non lo e. Una mappa JSON arbitraria non ha una semantica di patch universale.

### Il contratto prima del client

Definisci:

- URL base, risorse, identificatori e normalizzazione.
- Metodi, status attesi e media type.
- Campi richiesti, nullabilita, limiti, errori e compatibilita.
- Autenticazione, autorizzazione per risorsa e protezione delle mutazioni.
- Paginazione, ordinamento, filtri, cache e concorrenza.

`/users/:id` e notazione documentale, non l'URL letterale da inviare. Usa URL/URLSearchParams per la query e valida/codifica ogni segmento dinamico.

## API / Sintassi

### Endpoint e status

Schema orientativo, non server implementato dal demo:

```text
GET    /api/users
POST   /api/users
GET    /api/users/42
PUT    /api/users/42
PATCH  /api/users/42
DELETE /api/users/42
```

| Status | Significato da considerare nel contratto |
| --- | --- |
| 200 | Successo con rappresentazione secondo il metodo |
| 201 | Creazione; Location puo identificare la nuova risorsa |
| 202 | Richiesta accettata, elaborazione non necessariamente conclusa |
| 204 | Successo senza contenuto: non chiamare json() |
| 400 / 422 | Richiesta errata / contenuto compreso ma non elaborabile |
| 401 | Credenziali valide mancanti; prevede WWW-Authenticate |
| 403 | Il server rifiuta: non certifica da solo che il client sia autenticato |
| 404 | Risorsa non trovata, oppure esistenza non rivelata |
| 405 / 415 | Metodo non consentito, con Allow / media type non supportato |
| 409 / 412 | Conflitto di stato / precondizione della richiesta fallita |
| 429 | Limite di richieste; puo includere Retry-After |
| 500 / 503 | Errore interno / indisponibilita del servizio |

`fetch` non rifiuta la Promise solo perche arriva 404 o 500. Rete, status HTTP, parsing JSON e schema dei dati sono quattro livelli distinti. `response.ok` copre tutti i 2xx: se il contratto pretende 201, un 202 non e intercambiabile.

### Errori strutturati

Problem Details (RFC 9457) usa `application/problem+json`. Esempio di contenuto per una risposta 422 del servizio ipotetico:

```json
{
  "type": "https://api.example.test/problems/invalid-name",
  "title": "Nome non valido",
  "status": 422,
  "detail": "Il nome deve contenere da 1 a 80 caratteri."
}
```

Il campo status nel corpo non sostituisce lo status HTTP. Non dedurre la logica applicativa cercando parole in detail: usa il tipo/codice stabile definito dal contratto. Non includere stack, credenziali o dettagli interni. Anche gli errori possono arrivare come HTML da un proxy: il client deve conservare l'informazione HTTP senza presumere JSON valido.

## Esempio pratico

### Contratto del demo

Client ESM per Node.js 24.14.0 o browser moderno, senza dipendenze:

- URL base assoluto, per esempio `https://example.test/api/`; host illustrativo.
- GET users/:id restituisce 200 con `{ "id": "42", "name": "Ada" }`.
- POST users riceve `{ "name": "Ada" }` e restituisce 201 con il record creato.
- DELETE users/:id restituisce 204; 404 resta un errore distinguibile.
- ID stringa di 1-16 cifre, senza zero iniziale; nome non vuoto, massimo 80 unita UTF-16 dopo trim.
- Errori HTTP eventualmente in Problem Details. Payload piccoli e limitati dal servizio.
- Nessuna autenticazione, retry, cache applicativa o aggiornamento concorrente implementati.

Il limite del nome e una scelta del demo, non una regola per nomi personali o un conteggio universale dei caratteri visibili. Lato server servono nuovamente validazione e autorizzazione.

### Client completo

File `users-api.mjs`:

```js
export class HttpError extends Error {
  constructor(status, problem = null) {
    super("HTTP " + status);
    this.name = "HttpError";
    this.status = status;
    this.problem = problem;
  }
}

export class ProtocolError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ProtocolError";
  }
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function userId(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,15}$/.test(value)) {
    throw new TypeError("ID non valido");
  }
  return value;
}

function userName(value) {
  if (typeof value !== "string") throw new TypeError("Nome non valido");
  const name = value.trim();
  if (name.length < 1 || name.length > 80) throw new TypeError("Nome non valido");
  return name;
}

function parseUser(value) {
  try {
    if (!record(value)) throw new TypeError("Record non valido");
    return { id: userId(value.id), name: userName(value.name) };
  } catch (cause) {
    throw new ProtocolError("Schema utente non valido", { cause });
  }
}

function mediaType(response) {
  return (response.headers.get("Content-Type") ?? "")
    .split(";", 1)[0].trim().toLowerCase();
}

export function createUsersApi(baseUrl, { fetchImpl = fetch } = {}) {
  const base = new URL(baseUrl);
  if (!["http:", "https:"].includes(base.protocol) ||
      base.username || base.password || base.search || base.hash) {
    throw new TypeError("URL base non valido");
  }
  if (!base.pathname.endsWith("/")) base.pathname += "/";
  if (typeof fetchImpl !== "function") throw new TypeError("Fetch non valido");

  async function request(path, method, expected, data, signal) {
    signal?.throwIfAborted();
    const headers = { Accept: "application/json, application/problem+json" };
    if (data !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetchImpl(new URL(path, base), {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
    });

    if (!response.ok) {
      let problem = null;
      if (mediaType(response) === "application/problem+json") {
        try {
          const value = await response.json();
          if (record(value)) {
            problem = Object.fromEntries(
              ["type", "title", "detail"]
                .filter((key) => typeof value[key] === "string")
                .map((key) => [key, value[key]]),
            );
          }
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      } else {
        await response.body?.cancel();
      }
      signal?.throwIfAborted();
      throw new HttpError(response.status, problem);
    }

    if (response.status !== expected) {
      await response.body?.cancel();
      throw new ProtocolError("Status inatteso: " + response.status);
    }
    if (expected === 204) return undefined;
    if (mediaType(response) !== "application/json") {
      await response.body?.cancel();
      throw new ProtocolError("Atteso application/json");
    }

    try {
      return await response.json();
    } catch (cause) {
      if (!(cause instanceof SyntaxError)) throw cause;
      throw new ProtocolError("JSON non valido", { cause });
    }
  }

  return {
    async getUser(id, { signal } = {}) {
      const expectedId = userId(id);
      const value = await request(
        "users/" + encodeURIComponent(expectedId), "GET", 200, undefined, signal,
      );
      const user = parseUser(value);
      if (user.id !== expectedId) throw new ProtocolError("ID risposta incoerente");
      return user;
    },
    async createUser(data, { signal } = {}) {
      if (!record(data)) throw new TypeError("Input non valido");
      const input = { name: userName(data.name) };
      return parseUser(await request("users", "POST", 201, input, signal));
    },
    async deleteUser(id, { signal } = {}) {
      await request(
        "users/" + encodeURIComponent(userId(id)), "DELETE", 204, undefined, signal,
      );
    },
  };
}
```

Le sole proprieta pubbliche sono copiate; non si inviano automaticamente campi aggiuntivi dell'oggetto ricevuto. JSON valido non implica schema valido. La base e configurazione fidata: questi controlli non sono una difesa SSRF per URL forniti da utenti.

Il demo non manda cookie e rifiuta redirect; per una API autenticata devi progettare esplicitamente credenziali, CORS e CSRF, non cambiare un'opzione alla cieca. La scelta no-store semplifica la prova, ma non e una strategia di caching per ogni API.

Problem Details e dato non fidato: usa testo, non innerHTML, per mostrarlo. Il client non impone un limite di byte alla lettura JSON; questo va aggiunto se il contratto sulle dimensioni non e affidabile.

### Prova locale senza backend

File `demo.mjs`, nella stessa directory. Il fetch iniettato e **un fake dichiarato**: non invia richieste e non verifica un server reale.

```js
import { createUsersApi, HttpError } from "./users-api.mjs";

const json = (value, status, type = "application/json") =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": type },
  });

const replies = [
  json({ id: "42", name: "Ada" }, 201),
  json({ id: "42", name: "Ada" }, 200),
  new Response(null, { status: 204 }),
  json({ type: "about:blank", title: "Not Found" }, 404, "application/problem+json"),
];

const api = createUsersApi("https://example.test/api/", {
  fetchImpl: async (url, options) => {
    console.log(options.method, url.pathname);
    const response = replies.shift();
    if (!response) throw new Error("Risposta fake non prevista");
    return response;
  },
});

try {
  const created = await api.createUser({ name: " Ada " });
  console.log(created);
  console.log(await api.getUser(created.id));
  console.log(await api.deleteUser(created.id)); // undefined, nessun JSON da leggere.
  await api.getUser(created.id);
} catch (error) {
  if (error instanceof HttpError) console.log("Status gestito:", error.status);
  else throw error;
}
```

Esecuzione da Node:

```powershell
node demo.mjs
```

Sono attese quattro chiamate simulate (POST, GET, DELETE, GET), il record Ada, undefined per DELETE e infine **Status gestito: 404**. Il fake restituisce risposte in sequenza, non conserva un database.

Per collegare un servizio reale passa la sua base fidata e ometti fetchImpl; il servizio deve rispettare il contratto. Non usare l'host dimostrativo come backend.

### Cancellazione e timeout

Schema d'uso, con `api` gia creata. Richiede AbortSignal.any/timeout, disponibili nel runtime Node provato; verifica il supporto dei browser destinatari.

```js
const controller = new AbortController();
const signal = AbortSignal.any([
  controller.signal,
  AbortSignal.timeout(5000),
]);

try {
  const user = await api.getUser("42", { signal });
  console.log(user);
} catch (error) {
  if (signal.aborted) console.log("Richiesta interrotta");
  else if (error instanceof HttpError) console.log("Errore HTTP:", error.status);
  else throw error;
}
```

Un controllo della UI o lo smontaggio puo chiamare controller.abort(). Il signal e passato anche alla lettura del corpo da Fetch. Annullare una POST non prova che il server non l'abbia gia eseguita; un timeout e un esito incerto, non un rollback.

## Varianti

### Concorrenza, cache e retry

Per evitare di sovrascrivere modifiche altrui, un contratto puo usare un ETag forte dalla lettura e `If-Match` nella mutazione. Una precondizione fallita produce 412; il client rilegge/confronta invece di sovrascrivere automaticamente. L'ETag va trattato come valore opaco, incluse le virgolette. Il demo non implementa PUT/PATCH o questo controllo.

La cache HTTP dipende da metodo e direttive, non dalla sola presenza di JSON. `no-cache` permette memorizzazione con rivalidazione; `no-store` vieta la memorizzazione per quella risposta/richiesta secondo la sua semantica. Considera Cache-Control, Vary e dati personali; un ETag puo supportare If-None-Match e 304. La specifica di riferimento e RFC 9111, collegata nelle fonti.

Un retry deve avere budget, attesa e criterio per gli errori recuperabili. 429/503 possono suggerire Retry-After; non ripetere senza limiti o ignorando il segnale di abort. Per POST non idempotenti, un header inventato dal client non basta: una eventuale chiave di idempotenza deve essere supportata e registrata dal server secondo un contratto preciso.

### Paginazione e compatibilita

- Limita le liste e documenta ordinamento stabile, dimensione massima e fine pagina.
- Offset puo saltare/duplicare elementi se i dati cambiano; un cursore non garantisce da solo uno snapshot.
- Tratta i cursori come opachi. Se ricevi un link next, verifica origine/destinazione prima di inoltrare credenziali.
- Distingui campo assente, null e valore vuoto; documenta il formato delle date.
- Evolvi il contratto con una politica di compatibilita e deprecazione. Un prefisso v1 nell'URL non rende ogni cambiamento compatibile.

### Formati e alternative

- **JSON:API** e una specifica con media type `application/vnd.api+json`, struttura ed errori propri; non indica qualunque API che usa JSON.
- **HAL** rappresenta risorse e link ipermediali secondo convenzioni dedicate.
- **RPC su HTTP** esprime operazioni; non tutto il dominio deve essere forzato in CRUD.
- **GraphQL** offre un modello di query; **WebSocket** un canale persistente. Sono alternative/complementi con contratti diversi.

Il client dimostrativo accetta application/json e Problem Details, non e compatibile automaticamente con tutti questi formati.

## Errori comuni

- Confondere REST con "JSON via HTTP" o con nomi di endpoint.
- Considerare 401/403 una diagnosi completa dello stato di autenticazione.
- Trattare ogni 2xx come risposta con JSON o ogni errore come Problem Details valido.
- Ripetere mutazioni dopo timeout senza sapere se sono state applicate.
- Validare soltanto nel browser o confondere CORS con autorizzazione.
- Nascondere gli errori restituendo sempre 200, liste vuote o oggetti di default.
- Esporre campi privati del database o loggare credenziali e corpi sensibili.

## Checklist

- Contratto esplicito di risorse, metodi, payload, status e media type.
- Validazione input/output e autorizzazione lato server.
- Distinti rete, HTTP, parsing e schema.
- Risposte vuote gestite senza parsing JSON.
- Cancellazione e retry con esiti incerti considerati.
- Paginazione, cache, concorrenza e compatibilita documentate.
- Test del client separati dai test d'integrazione del backend.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]
- [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## Fonti

Fonti primarie consultate il 2026-10-13; client provato con Node.js 24.14.0.

- [Fielding: vincoli e modello REST](https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm).
- [RFC 9110: semantica HTTP](https://www.rfc-editor.org/rfc/rfc9110.html).
- [MDN: panoramica degli status HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).
- [MDN: PUT](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PUT).
- [MDN: DELETE](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/DELETE).
- [RFC 5789: PATCH](https://www.rfc-editor.org/rfc/rfc5789.html).
- [MDN: 401](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401) e [403](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403).
- [RFC 9457: Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html).
- [MDN: Fetch e gestione delle risposte](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: If-Match](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/If-Match).
- [RFC 9111: caching HTTP](https://www.rfc-editor.org/rfc/rfc9111.html).
- [MDN: 429 e Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429).
- [JSON:API 1.1](https://jsonapi.org/format/).
- [HAL: descrizione nel draft IETF, non una RFC](https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
