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
  - nodejs
  - http
aliases: []
prerequisites: []
related: []
---

# HTTP server

## Sintesi

Un **HTTP server** in Node.js riceve richieste HTTP e restituisce risposte. Puo essere creato con il modulo nativo `http` o tramite framework come Express, Fastify o Hono.

## Quando usarlo

- Prototipi semplici.
- Health check.
- Server interni.
- Comprendere come funzionano i framework.

## Come funziona

### Concetto chiave
Il modulo nativo `node:http` espone le primitive basse: request, response, headers, status code e body.

```javascript
import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello");
});

server.listen(3000);
```

## API / Sintassi

API di base del modulo `node:http`:

```javascript
import http from "node:http";

const server = http.createServer((req, res) => {
  console.log(req.method, req.url);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});

server.listen(3000, () => {
  console.log("Server in ascolto su http://localhost:3000");
});
```

Oggetti principali:

- `req`: richiesta in ingresso, leggibile come stream;
- `res`: risposta da scrivere;
- `server.listen`: avvia il server;
- `server.close`: ferma il server.

## Esempio pratico

Router minimale senza framework:

```javascript
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000);
```

Questo approccio va bene per esempi e servizi piccoli. Per API reali conviene introdurre routing, middleware, validazione e gestione errori strutturata.

## Varianti

### Limiti
Per routing, middleware, validazione e gestione errori conviene usare un framework. Il modulo nativo e esplicito ma diventa verboso in applicazioni reali.

## Errori comuni

- Non gestire metodi e path.
- Non impostare status code corretti.
- Non gestire errori asincroni.
- Lasciare il server senza timeout o limiti.

## Checklist

- Gestisci metodo HTTP e path.
- Imposta status code e `Content-Type`.
- Valida input e dimensione del body.
- Gestisci errori asincroni.
- Configura timeout e limiti.
- Usa un framework quando routing e middleware crescono.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]
