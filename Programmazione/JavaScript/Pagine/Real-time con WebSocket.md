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
  - websocket
  - realtime
aliases: []
prerequisites: []
related: []
---

# Real-time con WebSocket

## Sintesi

Il **real-time con WebSocket** permette comunicazione bidirezionale persistente tra client e server. A differenza di HTTP classico, il server puo inviare messaggi al client senza aspettare una nuova richiesta.

## Concetto chiave

WebSocket crea una connessione persistente. Dopo l'handshake iniziale, client e server si scambiano messaggi finche la connessione resta aperta.

```javascript
const socket = new WebSocket("wss://example.com/events");

socket.addEventListener("message", event => {
  console.log(JSON.parse(event.data));
});

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "subscribe", topic: "orders" }));
});
```

## Quando usarlo

- Chat.
- Dashboard live.
- Notifiche.
- Multiplayer.
- Aggiornamenti di stato frequenti.

## Aspetti operativi

- Reconnect automatico.
- Heartbeat o ping.
- Backoff sui retry.
- Autenticazione della connessione.
- Gestione ordinamento e duplicati.

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
- [[Programmazione/JavaScript/Pagine/WebSockets|WebSockets]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]


