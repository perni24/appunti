---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, nodejs, events, eventemitter]
aliases: [EventEmitter, Events Node]
prerequisites: [Node.js Basics, Callback]
related: [Event Loop, Streams Node.js, Error Handling]
---

# Events Node.js

## Sintesi

Node.js usa un modello event-driven.

Il modulo `node:events` espone `EventEmitter`, una classe per registrare listener e notificare eventi.

---

## EventEmitter base

```js
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();

emitter.on("user:created", (user) => {
  console.log("utente creato", user.id);
});

emitter.emit("user:created", { id: 1 });
```

`on` registra un listener. `emit` notifica un evento.

---

## `once`

`once` registra un listener eseguito una sola volta.

```js
emitter.once("ready", () => {
  console.log("inizializzato");
});
```

Utile per eventi di inizializzazione.

---

## Rimuovere listener

```js
function handleData(data) {
  console.log(data);
}

emitter.on("data", handleData);
emitter.off("data", handleData);
```

Rimuovere listener non piu necessari evita memory leak.

---

## Evento `error`

In Node.js, un evento `error` non gestito puo terminare il processo.

```js
emitter.on("error", (error) => {
  console.error("errore gestito", error);
});
```

Se una classe estende `EventEmitter`, documenta sempre quali errori puo emettere.

---

## Emettere eventi da una classe

```js
import { EventEmitter } from "node:events";

class JobRunner extends EventEmitter {
  run(job) {
    this.emit("start", job);

    try {
      this.emit("done", job);
    } catch (error) {
      this.emit("error", error);
    }
  }
}
```

Questo pattern separa produzione e consumo degli eventi.

---

## EventEmitter vs Promise

Usa Promise per un risultato singolo futuro.

Usa EventEmitter per una sequenza di eventi nel tempo.

Esempi:

- Promise: caricare un file;
- EventEmitter: ricevere chunk da uno stream;
- Promise: completare una richiesta HTTP;
- EventEmitter: notificare progresso o stato.

---

## Errori comuni

- Non gestire l'evento `error`.
- Aggiungere listener in loop senza rimuoverli.
- Usare eventi dove una Promise sarebbe piu semplice.
- Emettere eventi con payload non documentati.
- Dipendere dall'ordine dei listener senza renderlo esplicito.

---

## Checklist operativa

- Registra sempre listener per `error` quando serve.
- Usa `once` per eventi che devono accadere una sola volta.
- Rimuovi listener temporanei.
- Documenta nome evento e payload.
- Preferisci Promise se il risultato e singolo.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
