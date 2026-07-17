---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [javascript, websocket, networking, realtime]
aliases: [WebSocket JS, WebSockets]
prerequisites: [Event Loop, JSON]
related: [Fetch API, AJAX, Event Loop, CORS]
---

# WebSockets

## Sintesi

WebSocket e un protocollo per comunicazione persistente e bidirezionale tra client e server.

E utile quando il server deve inviare dati al client senza aspettare una nuova richiesta HTTP.

---

## Quando usarlo

### Quando usarli
WebSocket e indicato per:

- chat;
- notifiche realtime;
- trading e prezzi live;
- multiplayer;
- collaborazione simultanea;
- dashboard che ricevono eventi continui.

Per richieste sporadiche o CRUD classico, spesso basta HTTP con `fetch()`.

---

## Come funziona

### Connessione
```js
const socket = new WebSocket("wss://example.com/ws");

socket.addEventListener("open", () => {
  console.log("connessione aperta");
});

socket.addEventListener("message", (event) => {
  console.log("messaggio ricevuto", event.data);
});

socket.addEventListener("error", (event) => {
  console.error("errore websocket", event);
});

socket.addEventListener("close", (event) => {
  console.log("connessione chiusa", event.code, event.reason);
});
```

In produzione usa `wss://`, non `ws://`.

---
### Invio messaggi
```js
const message = {
  type: "chat-message",
  payload: {
    text: "ciao",
  },
};

socket.send(JSON.stringify(message));
```

Il browser puo inviare stringhe, `Blob`, `ArrayBuffer` e altri dati binari supportati.

---
### Parsing sicuro
```js
socket.addEventListener("message", (event) => {
  try {
    const message = JSON.parse(event.data);

    if (message.type === "notification") {
      showNotification(message.payload);
    }
  } catch (error) {
    console.error("messaggio non valido", error);
  }
});
```

Non assumere che ogni messaggio ricevuto sia valido.

---
### Stato della connessione
`socket.readyState` indica lo stato.

```js
if (socket.readyState === WebSocket.OPEN) {
  socket.send("ping");
}
```

Valori principali:

- `WebSocket.CONNECTING`;
- `WebSocket.OPEN`;
- `WebSocket.CLOSING`;
- `WebSocket.CLOSED`.

---
### Chiusura
```js
socket.close(1000, "chiusura normale");
```

Chiudere esplicitamente la connessione e importante quando il socket non serve piu, ad esempio al cambio pagina o allo smontaggio di un componente UI.

---
### Riconnessione
La WebSocket API non riconnette automaticamente.

```js
function connect() {
  const socket = new WebSocket("wss://example.com/ws");

  socket.addEventListener("close", () => {
    setTimeout(connect, 1000);
  });

  return socket;
}
```

In produzione conviene usare backoff progressivo, limite massimo e gestione dello stato offline.

---
### WebSocket vs HTTP
| Aspetto | HTTP con fetch | WebSocket |
| --- | --- | --- |
| Modello | richiesta-risposta | connessione persistente |
| Server push | no, salvo tecniche dedicate | si |
| Overhead | header per richiesta | basso dopo handshake |
| Uso tipico | API REST, CRUD, risorse | realtime continuo |
| Complessita | minore | maggiore |

---
### Sicurezza
- Usa `wss://` in produzione.
- Autentica la connessione.
- Valida ogni messaggio lato server.
- Limita dimensione e frequenza dei messaggi.
- Gestisci permessi per canali e stanze.

---

## API / Sintassi

Creazione:

```js
const socket = new WebSocket("wss://example.com/ws");
```

Eventi:

```js
socket.addEventListener("open", handleOpen);
socket.addEventListener("message", handleMessage);
socket.addEventListener("error", handleError);
socket.addEventListener("close", handleClose);
```

Invio e chiusura:

```js
socket.send(JSON.stringify(message));
socket.close(1000, "normal closure");
```

Stato:

```js
socket.readyState === WebSocket.OPEN;
```

## Esempio pratico

Protocollo messaggi semplice:

```js
function sendMessage(socket, type, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify({ type, payload }));
  return true;
}

sendMessage(socket, "subscribe", { topic: "orders" });
```

Usare `type` e `payload` rende il protocollo piu leggibile e validabile.

## Varianti

- **WebSocket nativo**: controllo diretto su connessione e protocollo.
- **Socket.IO o simili**: aggiungono reconnect, fallback e convenzioni.
- **Server-Sent Events**: server push monodirezionale.
- **Polling/long polling**: alternative HTTP piu semplici.
- **WebSocket binario**: usa `ArrayBuffer` o `Blob`.

## Errori comuni

- Usare WebSocket per richieste semplici dove basta HTTP.
- Non gestire riconnessione.
- Non chiudere il socket quando non serve piu.
- Fidarsi dei messaggi ricevuti senza validazione.
- Inviare dati prima che `readyState` sia `OPEN`.

---

## Checklist

### Checklist operativa
- Usa `wss://`.
- Definisci un protocollo messaggi con `type` e `payload`.
- Gestisci `open`, `message`, `error` e `close`.
- Implementa reconnect con backoff se serve.
- Chiudi la connessione nel cleanup.
- Valida dati in ingresso e uscita.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AJAX|AJAX]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
