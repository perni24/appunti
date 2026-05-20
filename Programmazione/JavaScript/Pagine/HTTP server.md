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
  - nodejs
  - http
aliases: []
prerequisites: []
related: []
---

# HTTP server

## Sintesi

Un **HTTP server** in Node.js riceve richieste HTTP e restituisce risposte. Puo essere creato con il modulo nativo `http` o tramite framework come Express, Fastify o Hono.

## Concetto chiave

Il modulo nativo `node:http` espone le primitive basse: request, response, headers, status code e body.

```javascript
import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello");
});

server.listen(3000);
```

## Quando usarlo

- Prototipi semplici.
- Health check.
- Server interni.
- Comprendere come funzionano i framework.

## Limiti

Per routing, middleware, validazione e gestione errori conviene usare un framework. Il modulo nativo e esplicito ma diventa verboso in applicazioni reali.

## Errori comuni

- Non gestire metodi e path.
- Non impostare status code corretti.
- Non gestire errori asincroni.
- Lasciare il server senza timeout o limiti.

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
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]


