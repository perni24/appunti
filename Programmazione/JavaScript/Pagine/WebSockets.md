---
date: 2026-02-20
tags: [javascript, programming, networking, real-time]
type: #permanent-note
status: budding
---

# WebSockets in JavaScript

Il protocollo **WebSocket** abilita una comunicazione **bidirezionale** (full-duplex) e persistente tra un client (browser) e un server. A differenza dell'HTTP tradizionale, dove il client deve sempre iniziare la richiesta, con i WebSocket il server può inviare dati al client in qualsiasi momento senza essere sollecitato.

## 1. Come funzionano

La connessione inizia come una normale richiesta HTTP che viene poi "promossa" (upgrade) a WebSocket. Una volta stabilita, la connessione rimane aperta finché una delle due parti non la chiude.

## 2. API WebSocket nel Browser

Creare e gestire una connessione è molto semplice grazie all'oggetto nativo `WebSocket`.

```javascript
// Apertura della connessione
const socket = new WebSocket('wss://api.esempio.com/chat');

// Evento: Connessione stabilita
socket.onopen = (event) => {
    console.log("Connessione aperta!");
    socket.send("Ciao Server!"); // Invio di un messaggio
};

// Evento: Ricezione messaggio
socket.onmessage = (event) => {
    console.log("Messaggio ricevuto:", event.data);
};

// Evento: Errore
socket.onerror = (error) => {
    console.error("Errore WebSocket:", error);
};

// Evento: Chiusura
socket.onclose = (event) => {
    console.log("Connessione chiusa.");
};
```

## 3. Invio di dati

È possibile inviare stringhe, ma solitamente si scambiano oggetti JSON serializzati.

```javascript
const messaggio = {
    tipo: "chat",
    testo: "Ehilà!",
    utente: "Luca"
};

socket.send(JSON.stringify(messaggio));
```

## 4. WebSocket vs HTTP

| Caratteristica | HTTP | WebSocket |
| :--- | :--- | :--- |
| **Tipo** | Richiesta/Risposta (Unidirezionale) | Full-Duplex (Bidirezionale) |
| **Stato** | Stateless | Stateful (Connessione persistente) |
| **Latenza** | Più alta (overhead di header per ogni req) | Molto bassa |
| **Uso tipico** | Documenti, API REST, Caricamento risorse | Chat, Trading, Gaming, Collaborazione real-time |

> [!IMPORTANT] Sicurezza
> Usa sempre il protocollo **`wss://`** (WebSocket Secure) invece di `ws://` in produzione. È l'equivalente di HTTPS e cripta i dati trasmessi.

---
