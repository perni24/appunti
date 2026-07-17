---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
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

## Quando usarlo

- Chat.
- Dashboard live.
- Notifiche.
- Multiplayer.
- Aggiornamenti di stato frequenti.

## Come funziona

### Concetto chiave
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
### Aspetti operativi
- Reconnect automatico.
- Heartbeat o ping.
- Backoff sui retry.
- Autenticazione della connessione.
- Gestione ordinamento e duplicati.

## API / Sintassi

API browser principale:

```javascript
const socket = new WebSocket("wss://example.com/events");

socket.addEventListener("open", () => {});
socket.addEventListener("message", (event) => {});
socket.addEventListener("error", (event) => {});
socket.addEventListener("close", (event) => {});

socket.send("message");
socket.close();
```

Stati della connessione:

```javascript
WebSocket.CONNECTING;
WebSocket.OPEN;
WebSocket.CLOSING;
WebSocket.CLOSED;
```

Prima di inviare, controlla che la connessione sia aperta.

## Esempio pratico

Client con reconnect semplice:

```javascript
function connect() {
  const socket = new WebSocket("wss://example.com/events");

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "subscribe", topic: "orders" }));
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    handleRealtimeMessage(message);
  });

  socket.addEventListener("close", () => {
    setTimeout(connect, 1000);
  });
}

connect();
```

In produzione il reconnect dovrebbe usare backoff progressivo e distinguere chiusure volontarie da errori.

## Varianti

- **WebSocket puro**: controllo diretto del protocollo.
- **Server-Sent Events**: server invia eventi, client non invia messaggi sulla stessa connessione.
- **Polling**: richieste periodiche, piu semplice ma meno efficiente.
- **Long polling**: richiesta tenuta aperta finche ci sono dati.
- **Socket.IO o librerie simili**: aggiungono fallback, room, reconnect e convenzioni.

## Errori comuni

- Non gestire reconnect e perdita di connessione.
- Fidarsi dei messaggi ricevuti senza validazione.
- Inviare messaggi prima che `readyState` sia `OPEN`.
- Non autenticare la connessione.
- Non gestire duplicati, ordine o messaggi persi.
- Tenere connessioni aperte inutilmente.

## Checklist

- Usa `wss://` in produzione.
- Valida ogni messaggio ricevuto.
- Gestisci reconnect con backoff.
- Definisci heartbeat o ping se serve rilevare connessioni morte.
- Gestisci autenticazione e autorizzazione.
- Progetta idempotenza, ordinamento e recupero dati persi.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/WebSockets|WebSockets]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/API REST|API REST]]
