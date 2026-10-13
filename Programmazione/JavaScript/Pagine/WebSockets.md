---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - javascript
  - websocket
  - networking
  - realtime
aliases:
  - WebSocket JS
  - WebSockets
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Fetch API]]"
  - "[[Programmazione/JavaScript/Pagine/AJAX]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/CORS]]"
title: WebSockets
---

# WebSockets

## Sintesi

WebSocket e un protocollo per comunicazione persistente e bidirezionale tra client e server.

E utile quando il server deve inviare dati al client senza aspettare una nuova richiesta HTTP.

Questa nota descrive l'API WebSocket del browser e il contratto dei messaggi. [[Programmazione/JavaScript/Pagine/Real-time con WebSocket|Real-time con WebSocket]] applica gli stessi helper a un client con riconnessione e cleanup.

Gli esempi sono indipendenti salvo dipendenze dichiarate. Gli URL example.com sono segnaposto: serve un server WebSocket compatibile, non una normale API REST. La connessione non rende automaticamente persistenti, autenticati o confermati i messaggi.

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

Per notifiche solo server-client valuta anche SSE. WebSocket serve quando occorre davvero comunicazione bidirezionale continua; non promette una latenza massima e aggiunge stato operativo da gestire.

---

## Come funziona

### Connessione
Il costruttore avvia l'handshake, ma non attende l'apertura. Usa open prima di inviare; un URL invalido puo generare un'eccezione sincrona, mentre guasti di connessione vengono segnalati tramite eventi.

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
  console.log("connessione chiusa", event.code, event.reason, event.wasClean);
});
```

In produzione usa wss, protetto da TLS. ws e utile solo per sviluppo locale in condizioni consentite dal browser; una pagina HTTPS non deve aprire un canale non sicuro. Il costruttore browser accetta URL e sottoprotocolli opzionali, non un oggetto di header HTTP arbitrari. L'evento error e poco dettagliato per ragioni di sicurezza: esamina anche close, DevTools e log server, senza dedurre automaticamente che ogni errore sia CORS.

---
### Invio messaggi
```js
const message = {
  type: "chat-message",
  payload: {
    text: "ciao",
  },
};

if (socket.readyState === WebSocket.OPEN) {
  socket.send(JSON.stringify(message));
}
```

Il frammento usa un socket gia creato: se non e OPEN, non accoda il messaggio nell'applicazione. Il browser puo inviare stringhe, Blob, ArrayBuffer e viste binarie. `send()` restituisce undefined, non una Promise o una conferma di consegna. In CONNECTING lancia InvalidStateError; in CLOSING/CLOSED i dati vengono scartati. Il controllo dello stato non sostituisce un ACK applicativo.

---
### Parsing sicuro
JSON.parse controlla la sintassi, non lo schema. Protocollo dimostrativo: messaggio testuale fino a 64 KiB UTF-8, type notification e payload con id e text non vuoti. I limiti sono scelte dell'applicazione, non limiti standard WebSocket.

```js
function parseNotification(data) {
  if (typeof data !== "string" || new TextEncoder().encode(data).byteLength > 65_536) {
    throw new TypeError("Messaggio testuale troppo grande o non supportato");
  }
  const message = JSON.parse(data);
  const payload = message?.payload;
  if (message === null || typeof message !== "object" || Array.isArray(message) ||
      message.type !== "notification" || payload === null ||
      typeof payload !== "object" || Array.isArray(payload) ||
      typeof payload.id !== "string" || !payload.id.trim() || payload.id.length > 128 ||
      typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 4000) {
    throw new TypeError("Schema notification non valido");
  }
  return { type: "notification", payload: { id: payload.id, text: payload.text } };
}
```

Uso con un socket esistente:

```js
socket.addEventListener("message", (event) => {
  let message;
  try {
    message = parseNotification(event.data);
  } catch (error) {
    console.error("Messaggio non valido", error);
    return;
  }
  console.log(message.payload.text);
});
```

Il callback non usa HTML grezzo. In una UI usa textContent o rendering con escaping. Il limite client agisce quando il messaggio e gia ricevuto: servono limiti anche sul server. Per dati binari, event.data e Blob per default oppure ArrayBuffer se imposti `socket.binaryType = "arraybuffer"`; non passarlo direttamente a JSON.parse. Con parsing asincrono di Blob potresti completare le elaborazioni fuori ordine, anche se gli eventi sono arrivati in ordine.

---
### Stato della connessione
`socket.readyState` indica lo stato.

```js
const canSend = socket.readyState === WebSocket.OPEN;
```

Valori principali:

- `WebSocket.CONNECTING`;
- `WebSocket.OPEN`;
- `WebSocket.CLOSING`;
- `WebSocket.CLOSED`.

Una stringa "ping" inviata con send e un messaggio applicativo, non un frame Ping del protocollo. Il browser non espone metodi JavaScript per inviare Ping/Pong di protocollo. Un heartbeat applicativo richiede messaggi, timeout e risposte concordati con il server.

---
### Chiusura
```js
socket.close(1000, "chiusura normale");
```

Chiudere esplicitamente la connessione e importante quando il socket non serve piu, ad esempio al cambio pagina o allo smontaggio di un componente UI.

close avvia una chiusura, non e un kill sincrono del socket e non elimina automaticamente i dati gia accodati. Nell'API browser puoi omettere il codice, usare 1000 oppure un codice applicativo fra 3000 e 4999; non inviare 1006, che descrive localmente una chiusura anomala. La reason ha un limite di 123 byte UTF-8, non 123 caratteri. Un wasClean true non certifica l'elaborazione di tutti i messaggi sul server.

---
### Riconnessione
La WebSocket API non riconnette automaticamente. Un setTimeout(connect, 1000) in ogni close e incompleto: riparte anche dopo uno stop volontario, genera nuovi socket non controllabili dal vecchio riferimento e puo sovraccaricare il server.

Calcolo autonomo del ritardo: tentativo intero da zero, backoff esponenziale con tetto di 30 secondi e jitter nella seconda meta dell'intervallo. Il parametro random deve essere una funzione che restituisce un valore in [0, 1).

```js
function reconnectDelay(attempt, random = Math.random) {
  if (!Number.isSafeInteger(attempt) || attempt < 0) {
    throw new RangeError("Tentativo non valido");
  }
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError("Valore random non valido");
  }
  const cap = Math.min(30_000, 500 * 2 ** Math.min(attempt, 6));
  return Math.floor(cap / 2 + sample * cap / 2);
}
```

Il ritardo da solo non implementa la riconnessione. Servono stop esplicito, cancellazione del timer, numero massimo di tentativi, scelta dei codici ritentabili e nuova sottoscrizione. Il client completo e in [[Programmazione/JavaScript/Pagine/Real-time con WebSocket|Real-time con WebSocket]]. Una nuova connessione non recupera automaticamente gli eventi persi.

### Buffer e backpressure

`bufferedAmount` misura byte accodati da send e non ancora trasmessi, non dati confermati dal server. L'API WebSocket classica non offre backpressure automatica. Se produci o ricevi messaggi piu rapidamente di quanto siano gestibili, devi applicare limiti, aggregazione, scarto o controllo di flusso nel protocollo.

Non accumulare una coda offline illimitata e non fare un loop sincrono in attesa che bufferedAmount diminuisca. L'esempio sotto rifiuta l'invio quando supera una soglia: il chiamante decide come segnalarlo o riprovare.

---
### WebSocket vs HTTP
| Aspetto | HTTP con fetch | WebSocket |
| --- | --- | --- |
| Modello | richiesta-risposta | connessione persistente |
| Server push applicativo | possibile con streaming/SSE o long polling | nativo dopo apertura |
| Overhead | dipende da richieste, versione HTTP e riuso della connessione | frame dopo handshake; non e costo zero |
| Uso tipico | API REST, CRUD, risorse | realtime continuo |
| Complessita | minore | maggiore |

---
### Sicurezza
- Usa `wss://` in produzione.
- Autentica la connessione.
- Valida ogni messaggio lato server.
- Limita dimensione e frequenza dei messaggi.
- Gestisci permessi per canali e stanze.
- Verifica Origin sul server rispetto alle origini ammesse: il modello non e il normale controllo CORS/preflight di Fetch. Origin non sostituisce l'autenticazione e puo essere falsificato da client non browser.
- Considera cookie, scadenza della sessione e rischio di connessioni cross-site non autorizzate. Wss cifra il canale ma non decide chi puo leggere una stanza.
- Non mettere token duraturi nella query string o nei log; l'API browser non consente un header Authorization arbitrario nel costruttore.

---

## API / Sintassi

Creazione:

```js
const socket = new WebSocket("wss://example.com/ws");
```

Schema degli eventi: handleOpen, handleMessage, handleError e handleClose sono callback da fornire.

```js
socket.addEventListener("open", handleOpen);
socket.addEventListener("message", handleMessage);
socket.addEventListener("error", handleError);
socket.addEventListener("close", handleClose);
```

Invio con l'helper definito nell'esempio pratico e chiusura sono operazioni separate:

```js
const queued = sendMessage(socket, "subscribe", { topic: "orders" });
```

```js
socket.close(1000, "normal closure");
```

Stato:

```js
socket.readyState === WebSocket.OPEN;
```

## Esempio pratico

Invio di un envelope type/payload. Il payload deve essere un valore JSON serializzabile conforme al protocollo applicativo; il controllo generico non valida ogni possibile schema. Errori di tipo, serializzazione (cicli o BigInt) e send si propagano al chiamante.

```js
function sendMessage(socket, type, payload, maxBufferedBytes = 262_144) {
  if (typeof type !== "string" || !type.trim() || payload === undefined) {
    throw new TypeError("Servono type e payload");
  }
  if (!Number.isSafeInteger(maxBufferedBytes) || maxBufferedBytes < 1) {
    throw new RangeError("Limite del buffer non valido");
  }
  if (socket.readyState !== WebSocket.OPEN) return false;
  const text = JSON.stringify({ type, payload });
  const bytes = new TextEncoder().encode(text).byteLength;
  if (socket.readyState !== WebSocket.OPEN ||
      socket.bufferedAmount + bytes > maxBufferedBytes) return false;
  socket.send(text);
  return true;
}
```

True significa soltanto che send e stato chiamato su un socket aperto entro la soglia osservata. Non e consegna garantita; false non accoda un retry. Il limite di 256 KiB e dimostrativo e vale per il buffer di uscita, non per tutti i limiti del protocollo.

Il server deve riconoscere subscribe e autorizzare topic. Per confermare comandi importanti usa id, ACK, timeout e deduplicazione concordati. L'ordine dei messaggi sulla singola connessione non garantisce exactly-once, recupero dopo reconnect o ordine delle elaborazioni asincrone lato applicazione.

## Varianti

- **WebSocket nativo**: controllo diretto su connessione e protocollo.
- **Socket.IO**: protocollo e libreria propri con funzionalita aggiuntive; un client WebSocket nativo non e automaticamente compatibile con un server Socket.IO.
- **Server-Sent Events**: server push monodirezionale.
- **Polling/long polling**: alternative HTTP piu semplici.
- **WebSocket binario**: usa `ArrayBuffer` o `Blob`.

## Errori comuni

- Usare WebSocket per richieste semplici dove basta HTTP.
- Non gestire riconnessione.
- Non chiudere il socket quando non serve piu.
- Fidarsi dei messaggi ricevuti senza validazione.
- Inviare dati prima che `readyState` sia `OPEN`.
- Interpretare send, bufferedAmount zero o wasClean come ACK applicativi.
- Ripartire dopo stop volontario o ritentare all'infinito senza backoff.
- Confondere un messaggio "ping" con i frame Ping/Pong.

---

## Checklist

### Checklist operativa
- Usa `wss://`.
- Definisci un protocollo messaggi con `type` e `payload`.
- Gestisci `open`, `message`, `error` e `close`.
- Implementa reconnect con backoff se serve.
- Chiudi la connessione nel cleanup.
- Valida dati in ingresso e uscita.
- Stabilisci limiti, politica sui messaggi persi e recupero dopo riconnessione.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Fetch API|Fetch API]]
- [[Programmazione/JavaScript/Pagine/AJAX|AJAX]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/CORS|CORS]]
- [[Programmazione/JavaScript/Pagine/Real-time con WebSocket|Real-time con WebSocket]]


## Fonti

- [MDN - WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MDN - Costruttore](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket)
- [MDN - send](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send)
- [MDN - close](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close)
- [MDN - bufferedAmount](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount)
- [MDN - binaryType](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType)
- [MDN - Client WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [WHATWG - WebSockets](https://websockets.spec.whatwg.org/)
- [RFC 6455 - Protocollo e recupero dopo chiusura anomala](https://datatracker.ietf.org/doc/html/rfc6455#section-7.2.3)
- [Socket.IO - Introduzione e compatibilita](https://socket.io/docs/v4/)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
