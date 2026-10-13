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
  - websocket
  - realtime
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/WebSockets]]"
  - "[[Programmazione/JavaScript/Pagine/JSON]]"
related:
  - "[[Programmazione/JavaScript/Pagine/AbortController]]"
  - "[[Programmazione/JavaScript/Pagine/API REST]]"
title: Real-time con WebSocket
---

# Real-time con WebSocket

## Sintesi

Il **real-time con WebSocket** permette comunicazione bidirezionale persistente tra client e server. A differenza di HTTP classico, il server puo inviare messaggi al client senza aspettare una nuova richiesta.

Qui l'obiettivo e gestire la durata di una connessione: apertura, sottoscrizione, ricezione, perdita del canale e stop. Per stati, send, parsing e buffer leggi prima [[Programmazione/JavaScript/Pagine/WebSockets|WebSockets]]. Realtime non significa consegna istantanea, persistente o exactly-once.

## Quando usarlo

- Chat.
- Dashboard live.
- Notifiche.
- Multiplayer.
- Aggiornamenti di stato frequenti.

## Come funziona

### Concetto chiave
WebSocket crea una connessione persistente. Dopo l'handshake iniziale, client e server si scambiano messaggi finche la connessione resta aperta. Ogni reconnect crea un nuovo oggetto WebSocket: le vecchie sottoscrizioni non vengono trasferite automaticamente.

Contratto dimostrativo concordato con il server:

```json
{"type":"subscribe","payload":{"topic":"orders"}}
```

Risposta o evento di notifica accettato dal client:

```json
{"type":"notification","payload":{"id":"evt-1","text":"Ordine aggiornato"}}
```

Sono due messaggi distinti, non un file JSON unico. Il server deve implementare questo schema e autorizzare la sottoscrizione: mandare subscribe non prova che sia stata accettata. Un protocollo reale puo aggiungere un ACK esplicito e una versione.
### Aspetti operativi
- Reconnect implementato dall'applicazione, non dalla WebSocket API.
- Heartbeat applicativo, se il server lo prevede; non basta inviare la stringa ping a un endpoint qualunque.
- Backoff sui retry.
- Autenticazione della connessione.
- Gestione ordinamento e duplicati.

### Ripristino e messaggi persi

La riconnessione riapre un canale, non ricostruisce lo stato. Dopo una disconnessione scegli una strategia: ricaricare uno snapshot HTTP oppure riprendere da un cursore/sequence che il server conserva. Per non perdere eventi fra snapshot e stream, il protocollo deve coordinare versione dello snapshot, sottoscrizione e replay.

Un id aiuta la deduplicazione soltanto se il suo significato e stabile e il client mantiene una finestra di memoria limitata. Per comandi ritentati servono idempotenza e conferme server; non reinviare automaticamente acquisti o modifiche solo perche manca una risposta.

### Autenticazione e sicurezza

Il server deve controllare autenticazione, Origin ammesso e permessi per ogni canale/messaggio. Wss protegge il trasporto, non autorizza l'utente. Il costruttore browser non accetta header Authorization arbitrari; il meccanismo di autenticazione va progettato con il backend. Non conservare token duraturi nell'URL, che puo essere registrato nei log.

## API / Sintassi

Schema degli eventi del browser, non codice da concatenare all'esempio completo:

```text
const socket = new WebSocket("wss://example.com/events");

socket.addEventListener("open", () => {});
socket.addEventListener("message", (event) => {});
socket.addEventListener("error", (event) => {});
socket.addEventListener("close", (event) => {});

// send solo dopo open; close per terminare il ciclo quando non serve piu.
```

Stati della connessione:

```text
WebSocket.CONNECTING;
WebSocket.OPEN;
WebSocket.CLOSING;
WebSocket.CLOSED;
```

Prima di inviare, controlla che la connessione sia aperta.

## Esempio pratico

Client browser con stop esplicito e tentativi limitati. Dipendenze: le tre funzioni `parseNotification`, `sendMessage` e `reconnectDelay` di [[Programmazione/JavaScript/Pagine/WebSockets|WebSockets]], nello stesso scope o importate dal tuo modulo. Gli URL example.com sono segnaposto; serve un server che parli il protocollo sopra.

Le callback devono essere sincrone e non lanciare errori. Il budget e di cinque riconnessioni per ciclo start/stop, non cinque per ogni apertura: non viene azzerato da connessioni che si aprono e cadono subito. La lista di codici ritentabili e una politica dimostrativa, da adattare al contratto del server.

```js
function createRealtimeClient(url, {
  onNotification, onStatus, onError, maxRetries = 5,
}) {
  if (![onNotification, onStatus, onError].every((fn) => typeof fn === "function")) {
    throw new TypeError("Servono le callback del client");
  }
  if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) {
    throw new RangeError("Numero di tentativi non valido");
  }
  const retryable = new Set([1001, 1006, 1011, 1012, 1013, 1014]);
  let socket = null;
  let timer = null;
  let stopped = true;
  let retries = 0;
  let detach = () => {};

  function connect() {
    if (stopped) return;
    let current;
    try {
      current = new WebSocket(url);
    } catch (error) {
      stopped = true;
      onError(error);
      onStatus("failed");
      return;
    }
    socket = current;
    const listeners = new AbortController();
    detach = () => listeners.abort();
    const options = { signal: listeners.signal };
    const isCurrent = () => !stopped && socket === current;

    current.addEventListener("open", () => {
      if (!isCurrent()) return;
      try {
        if (!sendMessage(current, "subscribe", { topic: "orders" })) {
          throw new Error("Sottoscrizione non accodata");
        }
      } catch (error) {
        onError(error);
        current.close(1000, "Subscription failed");
        return;
      }
      onStatus("open");
    }, options);

    current.addEventListener("message", (event) => {
      if (!isCurrent()) return;
      let message;
      try {
        message = parseNotification(event.data);
      } catch (error) {
        onError(error);
        return;
      }
      onNotification(message.payload);
    }, options);

    current.addEventListener("error", () => {
      if (isCurrent()) onError(new Error("Errore WebSocket; attendere close"));
    }, options);

    current.addEventListener("close", (event) => {
      if (!isCurrent()) return;
      listeners.abort();
      detach = () => {};
      socket = null;
      if (!retryable.has(event.code)) {
        stopped = true;
        onStatus("closed");
        return;
      }
      if (retries >= maxRetries) {
        stopped = true;
        onStatus("exhausted");
        return;
      }
      const delay = reconnectDelay(retries++);
      timer = setTimeout(() => {
        timer = null;
        connect();
      }, delay);
      onStatus("retrying");
    }, options);
    onStatus("connecting");
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      retries = 0;
      connect();
    },
    send(type, payload) {
      return !stopped && socket ? sendMessage(socket, type, payload) : false;
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      timer = null;
      detach();
      detach = () => {};
      const previous = socket;
      socket = null;
      if (previous && previous.readyState < WebSocket.CLOSING) {
        previous.close(1000, "Client stopped");
      }
      onStatus("stopped");
    },
  };
}
```

Uso con callback esplicite:

```js
const client = createRealtimeClient("wss://example.com/events", {
  onNotification: ({ text }) => console.log(text),
  onStatus: (status) => console.log("WebSocket:", status),
  onError: (error) => console.error(error),
});
client.start();
```

Quando la vista termina, chiama `client.stop()`. Lo stop cancella il timer di retry, rimuove i listener e avvia la chiusura del socket corrente, anche se ancora CONNECTING. Non aspetta che la rete completi l'handshake di chiusura. `start()` ripetuto mentre attivo non crea un secondo canale; dopo stop, errore definitivo o esaurimento dei tentativi puoi avviare un nuovo ciclo esplicito.

Il retry viene pianificato solo in close, non anche in error, evitando due timer per lo stesso guasto. Una chiusura normale 1000, una violazione 1008 o altri codici non previsti non fanno ripartire il client. Eventi dei vecchi socket non aggiornano lo stato del nuovo.

### Limiti dell'esempio

- Nessuna autenticazione completa, heartbeat, deadline dell'handshake o rilevamento affidabile dell'offline.
- Nessun ACK della sottoscrizione: lo stato open significa canale aperto e subscribe accodato, non iscrizione confermata.
- Nessuna coda offline o ritrasmissione dei comandi. send false richiede una decisione del chiamante, non un loop immediato.
- Nessun replay, snapshot o deduplicazione: le notifiche perse non vengono recuperate.
- I messaggi non conformi vengono segnalati e ignorati; per ripetuti abusi serve una politica di chiusura lato client e limiti server.
- I timer possono essere ritardati e navigator.onLine non prova che il backend sia raggiungibile.

Per una pagina intera valuta stop su pagehide e ripartenza su pageshow, se compatibile con la navigazione e la back-forward cache. In un framework collega start/stop al ciclo di vita del componente, senza aprire connessioni a ogni rendering.

## Varianti

- **WebSocket puro**: controllo diretto del protocollo.
- **Server-Sent Events**: server invia eventi, client non invia messaggi sulla stessa connessione.
- **Polling**: richieste periodiche, piu semplice ma meno efficiente.
- **Long polling**: richiesta tenuta aperta finche ci sono dati.
- **Socket.IO o librerie simili**: aggiungono fallback, room, reconnect e convenzioni.

Socket.IO non e un wrapper trasparente del protocollo WebSocket: client e server devono essere compatibili. SSE usa HTTP per lo stream server-client e un'API EventSource con proprie regole di riconnessione; per inviare comandi dal client puoi affiancare Fetch.

## Errori comuni

- Non gestire reconnect e perdita di connessione.
- Fidarsi dei messaggi ricevuti senza validazione.
- Inviare messaggi prima che `readyState` sia `OPEN`.
- Non autenticare la connessione.
- Non gestire duplicati, ordine o messaggi persi.
- Tenere connessioni aperte inutilmente.
- Pianificare retry sia su error sia su close, oppure dopo una chiusura volontaria.
- Confondere subscribe inviato con sottoscrizione autorizzata e confermata.
- Ripartire da una connessione nuova senza una strategia per i dati mancanti.

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
- [[Programmazione/JavaScript/Pagine/AbortController|AbortController]]


## Fonti

- [MDN - Client WebSocket e ciclo di vita della pagina](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [MDN - Codici di chiusura](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code)
- [MDN - Evento error](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event)
- [WHATWG - WebSockets](https://websockets.spec.whatwg.org/)
- [RFC 6455 - Backoff dopo chiusura anomala](https://datatracker.ietf.org/doc/html/rfc6455#section-7.2.3)
- [MDN - Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Socket.IO - Introduzione](https://socket.io/docs/v4/)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
