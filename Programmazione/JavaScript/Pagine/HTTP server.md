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
  - nodejs
  - http
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Buffer Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/API REST]]"
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
title: HTTP server
---

# HTTP server

## Sintesi

Un server HTTP riceve richieste e produce risposte. `node:http` fornisce primitive HTTP/1 a basso livello: non aggiunge automaticamente routing, parsing JSON, autenticazione o validazione.

`req` e un `IncomingMessage` leggibile come stream; `res` e un `ServerResponse` scrivibile. Il listener della richiesta parte quando arrivano gli header: il body puo arrivare dopo, a pezzi.

## Quando usarlo

E utile per capire il protocollo, health check e piccoli servizi controllati. Per routing articolato, middleware e schemi valuta framework come Express, Fastify o Hono; un framework non sostituisce comunque limiti, autorizzazione e gestione del lifecycle.

Gli esempi sono moduli `.mjs` senza dipendenze, riferiti a Node.js **24.14.0**. Il server dimostrativo ascolta solo su `127.0.0.1`: non e una configurazione pronta da esporre in Internet.

## Come funziona

### Richiesta, body e risposta

La sequenza e: arrivo degli header, scelta di metodo/percorso, eventuale lettura del body, validazione, lavoro applicativo, risposta. Il body e un flusso di byte, non un oggetto JSON gia pronto.

`req.url` comprende anche la query: il confronto con `"/health"` da solo non riconosce `"/health?check=1"`. Usa `URL` con una base fissa per separare `pathname` e `searchParams`; non usare l'header Host non verificato per costruire URL fidate. Il parsing puo normalizzare il percorso e non autorizza percorsi del filesystem.

Gli header vanno impostati prima del primo invio. `res.end` termina la risposta; `res.write` puo richiedere backpressure. Il completamento locale della scrittura non dimostra che il client abbia elaborato la risposta.

### Errori asincroni

Il listener di `createServer` e chiamato come un listener di eventi. Non basta renderlo `async`: devi gestire la Promise restituita. Un errore dopo l'invio degli header non permette di sostituire la risposta con un secondo JSON 500; se non puoi completarla coerentemente, interrompi la connessione.

Errori del parser HTTP o header eccessivi possono essere gestiti da Node prima del router; non tutte le risposte di errore avranno il JSON applicativo. Errori di `listen`, come una porta occupata, sono un altro canale ancora.

## API / Sintassi

| API | Ruolo | Attenzione |
| --- | --- | --- |
| `createServer` | Costruisce il server | Non comincia ad ascoltare |
| `listen` | Apre host e porta | Gestire errore e avvio riuscito |
| `setHeader` | Imposta un header | Prima di inviare il body |
| `end` | Completa la risposta | Non inviare due risposte |
| `close` | Ferma nuove connessioni | Attende le richieste attive |
| `closeAllConnections` | Interrompe connessioni HTTP attive | Chiusura forzata, non rollback |

## Esempio pratico

### Contratto del servizio locale

Il demo implementa:

| Rotta | Metodo | Risultato |
| --- | --- | --- |
| `/health` | GET, HEAD | Stato del processo, senza controllare database o dipendenze |
| `/greet` | POST | JSON con un unico campo `name`, risposta con `message` |
| Altra rotta | Qualunque | 404 |
| Rotta nota, metodo diverso | Qualunque altro | 405 con `Allow` |

Il body di `/greet` deve essere JSON UTF-8 senza BOM, non compresso, massimo **16 KiB**. `name` e una stringa con 1..80 unita UTF-16 dopo `trim`; campi extra, array e `null` vengono rifiutati. Non e un modello universale dei nomi delle persone, ma uno schema didattico esplicito.

Per rendere chiara la gestione dei body non consumati, il demo **chiude la connessione dopo ogni risposta** con `Connection: close`. E una semplificazione intenzionale: un servizio con keep-alive richiede una politica per consumare/scartare il resto della richiesta o chiudere la connessione quando necessario.

### Server e lettura limitata

Modulo `http-app.mjs`:

```js
import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { MIMEType, TextDecoder } from "node:util";

const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(req, res, status, value, headers = {}) {
  if (res.destroyed || res.writableEnded) return;
  const body = Buffer.from(JSON.stringify(value), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Connection": "close",
    ...headers,
  });
  res.end(req.method === "HEAD" ? undefined : body);
}

async function readJson(req) {
  let mime;
  try {
    mime = new MIMEType(req.headers["content-type"] ?? "");
  } catch {
    throw new HttpError(415, "Expected application/json UTF-8");
  }
  if (mime.essence !== "application/json" ||
      (mime.params.get("charset") ?? "utf-8").toLowerCase() !== "utf-8" ||
      (req.headers["content-encoding"] ?? "identity").toLowerCase() !== "identity") {
    throw new HttpError(415, "Expected uncompressed application/json UTF-8");
  }
  if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
    throw new HttpError(413, "Body too large");
  }
  const chunks = [];
  let size = 0;
  // Preserve the response socket if we stop early to return 413.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Body too large");
    chunks.push(chunk);
  }
  if (!req.complete) throw new HttpError(400, "Incomplete request");
  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })
      .decode(Buffer.concat(chunks, size));
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Invalid JSON or UTF-8");
  }
}

function parseName(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).length !== 1 || !Object.hasOwn(value, "name") ||
      typeof value.name !== "string") {
    throw new HttpError(422, "Expected an object with only name");
  }
  const name = value.name.trim();
  if (name.length < 1 || name.length > 80) {
    throw new HttpError(422, "name must contain 1 to 80 UTF-16 units");
  }
  return name;
}

async function route(req, res, greet, signal) {
  const target = req.url ?? "";
  if (!target.startsWith("/") || target.startsWith("//") ||
      target.includes("#") || target.includes("\\")) {
    throw new HttpError(400, "Invalid request target");
  }
  const { pathname } = new URL(target, "http://localhost");
  if (pathname === "/health") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(req, res, 405, { error: "Method not allowed" }, { Allow: "GET, HEAD" });
      return;
    }
    sendJson(req, res, 200, { status: "ok" });
    return;
  }
  if (pathname === "/greet") {
    if (req.method !== "POST") {
      sendJson(req, res, 405, { error: "Method not allowed" }, { Allow: "POST" });
      return;
    }
    const name = parseName(await readJson(req));
    signal.throwIfAborted();
    const message = await greet(name, { signal });
    signal.throwIfAborted();
    if (typeof message !== "string") throw new TypeError("greet must return a string");
    sendJson(req, res, 200, { message });
    return;
  }
  sendJson(req, res, 404, { error: "Not found" });
}

export function createAppServer({ greet = async (name) => `Ciao, ${name}` } = {}) {
  if (typeof greet !== "function") throw new TypeError("greet must be a function");
  const server = createServer({
    maxHeaderSize: 8 * 1024,
    headersTimeout: 10_000,
    requestTimeout: 15_000,
    connectionsCheckingInterval: 1_000,
  }, (req, res) => {
    const controller = new AbortController();
    req.on("error", (error) => controller.abort(error));
    res.on("error", (error) => controller.abort(error));
    res.once("close", () => {
      if (!res.writableFinished) controller.abort(new Error("Client disconnected"));
    });
    void route(req, res, greet, controller.signal).catch((error) => {
      if (res.destroyed || res.writableEnded) return;
      if (res.headersSent) {
        res.destroy();
        return;
      }
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : "Internal server error";
      sendJson(req, res, status, { error: message });
    });
  });
  server.setTimeout(20_000, (socket) => socket.destroy());
  return server;
}

export function closeServer(server, graceMs = 5_000) {
  if (!Number.isInteger(graceMs) || graceMs < 1 || graceMs > 60_000) {
    return Promise.reject(new RangeError("Invalid shutdown grace period"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => server.closeAllConnections(), graceMs);
    timer.unref();
    server.close((error) => {
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    });
  });
}
```

Il controllo su Content-Length rifiuta presto alcuni input, ma il limite viene verificato anche sui byte realmente letti, comprese richieste chunked. Non usiamo `req.setEncoding`: il conteggio resta in byte.

L'iteratore con `destroyOnReturn: false` evita che un'uscita anticipata distrugga subito la connessione prima del JSON 413. E usato con la politica esplicita di chiusura della risposta; non copiarlo dimenticando chi dovra chiudere o consumare la richiesta. Per disconnessioni e errori del trasporto non e sempre possibile consegnare una risposta.

Il limite di 16 KiB riguarda i byte accumulati dall'applicazione. Esistono anche buffer del parser/socket, il chunk corrente e le allocazioni di testo/JSON: non e un tetto alla memoria totale del processo. La sintassi JSON valida non certifica lo schema, per questo `parseName` e separata.

### Avvio, porta e shutdown

File `server.mjs`, accanto al modulo:

```js
import { createAppServer, closeServer } from "./http-app.mjs";

const rawPort = process.argv[2] ?? "3000";
if (process.argv.length > 3 || !/^\d{1,5}$/.test(rawPort) ||
    Number(rawPort) < 1 || Number(rawPort) > 65535) {
  console.error("Usage: node server.mjs [port 1..65535]");
  process.exitCode = 1;
} else {
  const server = createAppServer();
  server.on("error", (error) => {
    console.error(`Server error: ${error.code ?? "unknown"}`);
    process.exitCode = 1;
  });
  server.listen(Number(rawPort), "127.0.0.1", () => {
    console.log(`HTTP demo: http://127.0.0.1:${server.address().port}`);
  });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    void closeServer(server).catch(() => {
      console.error("Shutdown failed");
      process.exitCode = 1;
    });
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
```

```sh
node server.mjs
```

**Effetto:** apre un listener locale e mantiene il processo attivo. Se 3000 e occupata, usa una porta libera, per esempio:

```sh
node server.mjs 3001
```

Non avviare entrambi per provare lo stesso esempio. Per fermarlo dal terminale usa Ctrl+C. Su sistemi che inviano SIGTERM, viene usato lo stesso percorso; terminazioni forzate non permettono cleanup garantito.

### Client eseguibile

File `client.mjs`. Usa la stessa porta del server; il timeout del client non e una garanzia che il server annulli gli effetti di un'operazione gia iniziata.

```js
try {
  const response = await fetch("http://127.0.0.1:3000/greet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Luca" }),
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (typeof data.message !== "string") throw new TypeError("Unexpected response");
  console.log(data.message);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Request failed");
  process.exitCode = 1;
}
```

In un secondo terminale:

```sh
node client.mjs
```

Output atteso: `Ciao, Luca`. Per il semplice health check si puo aprire [l'endpoint locale](http://127.0.0.1:3000/health). HEAD restituisce gli header equivalenti alla risposta GET, ma nessun body; il Content-Length puo quindi essere diverso dai byte ricevuti per HEAD.

## Timeout e chiusura

| Controllo | Cosa limita | Cosa non risolve |
| --- | --- | --- |
| `maxHeaderSize` | Dimensione degli header | Dimensione del body |
| `headersTimeout` | Ricezione degli header | Durata del lavoro applicativo |
| `requestTimeout` | Ricezione dell'intera richiesta | Timeout di query o API esterne |
| `setTimeout` | Inattivita del socket | Deadline assoluta del servizio |
| `keepAliveTimeout` | Attesa fra richieste riutilizzando una connessione | Inutile nel demo che chiude ogni risposta |

I timeout di ricezione sono controllati periodicamente e non sono scadenze al millisecondo. Nel demo, l'inattivita distrugge il socket: non produce necessariamente un JSON 408. Per un servizio reale aggiungi deadline applicative, limiti di concorrenza e cancellazione cooperativa delle dipendenze.

`closeServer` smette di accettare connessioni e aspetta quelle attive. Dopo la tolleranza forza la chiusura delle connessioni HTTP rimaste: non annulla transazioni o Promise arbitrarie e non gestisce socket promossi ad altri protocolli. La funzione `greet` riceve un signal quando il client si disconnette prima del completamento, ma deve cooperare per interrompere il proprio lavoro.

## Varianti e limiti

`node:http` non cifra il traffico. Per TLS servono `node:https` e certificati, oppure un reverse proxy configurato; HTTP/2 richiede API e configurazione specifiche. La porta e l'host di ascolto definiscono l'esposizione: omettere l'host non equivale a scegliere loopback.

Il demo non include autenticazione, autorizzazione, CORS, rate limiting, persistenza, logging strutturato o difese complete da abuso. CORS non e autenticazione. Il bind locale riduce l'esposizione ma non rende fidati tutti i client locali o le richieste originate da un browser.

Il target accettato e la forma `/percorso?query`; non e un proxy HTTP e non implementa CONNECT, WebSocket o routing generale. Non serve file da percorsi forniti dal client. Per una API completa vedi [[Programmazione/JavaScript/Pagine/API REST|API REST]].

## Errori comuni

- Confrontare `req.url` senza separare la query.
- Attendere implicitamente un listener async che Node non attende.
- Fare parsing di ogni chunk invece del body ricostruito entro un limite.
- Fidarsi soltanto di Content-Length o contare caratteri invece di byte.
- Usare il `for await` predefinito, distruggere la richiesta e poi aspettarsi di poter rispondere 413.
- Inviare stack trace, body ricevuti o dettagli interni nel JSON 500.
- Confondere timeout di ricezione, inattivita, deadline e cancellazione del lavoro.
- Eseguire `process.exit()` durante richieste attive o chiamare una chiusura forzata uno shutdown senza perdita.

## Checklist

- Metodo, percorso, query e schema hanno contratti espliciti.
- Status, Content-Type, Content-Length e HEAD sono coerenti.
- Header e body hanno limiti distinti; parsing ed encoding vengono verificati.
- Errori di listener, stream e avvio hanno gestori dedicati.
- Richieste rifiutate e body non consumati hanno una politica di chiusura.
- Timeout e shutdown distinguono fase regolare e forzata.
- Esposizione, TLS, autenticazione e osservabilita sono progettati prima del deploy.

## Fonti

- [Node.js 24.14.0: HTTP e lifecycle del server](https://nodejs.org/download/release/v24.14.0/docs/api/http.html).
- [Node.js 24.14.0: iteratori degli stream](https://nodejs.org/download/release/v24.14.0/docs/api/stream.html#readableiteratoroptions).
- [Node.js 24.14.0: MIMEType e TextDecoder](https://nodejs.org/download/release/v24.14.0/docs/api/util.html).

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
