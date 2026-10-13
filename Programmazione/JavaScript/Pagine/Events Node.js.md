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
  - nodejs
  - events
  - eventemitter
aliases:
  - EventEmitter
  - Events Node
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Callback]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling]]"
title: Events Node.js
---

# Events Node.js

## Sintesi

`EventEmitter`, dal modulo `node:events`, permette a un oggetto di notificare eventi a piu osservatori. La sorgente puo essere asincrona, ma **`emit()` chiama i listener in modo sincrono**: non e una coda di task e non aspetta le loro Promise.

Per un risultato finale usa una Promise; per notifiche ripetute usa eventi. Uno stesso job puo usare entrambi, con ruoli distinti.

## Quando usarlo

Progresso di job, lifecycle di servizi, plugin e notifiche interne sono casi adatti. Gli stream Node espongono eventi, ma per trasferire dati con controllo del flusso preferisci la loro API `pipeline` o l'iterazione asincrona.

Gli esempi sono moduli `.mjs` per Node.js; il riferimento tecnico e Node.js **24.14.0**, non una dichiarazione sulla versione piu recente. Non richiedono pacchetti npm.

## Come funziona

### Ordine, argomenti e valore restituito

Demo autonomo `events-order.mjs`:

```js
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
const trace = [];

emitter.on("user:created", function (user) {
  trace.push(`first:${user.id}:${this === emitter}`);
  return 42;
});
emitter.on("user:created", (user) => trace.push(`second:${user.id}`));

trace.push("before");
const delivered = emitter.emit("user:created", { id: 7 });
trace.push(`after:${delivered}`);
console.log(trace.join(" | "));
console.log(emitter.emit("unknown"));
```

```sh
node events-order.mjs
```

Output: `before | first:7:true | second:7 | after:true`, poi `false`. I listener registrati con `on` vengono chiamati nell'ordine di registrazione; `prependListener` puo cambiarlo. `emit` restituisce se esistevano listener, non `42`, non un risultato aggregato e non una conferma del completamento di lavoro asincrono.

Una funzione ordinaria riceve l'emitter come `this`; una arrow conserva il `this` lessicale. Gli oggetti passati come argomenti sono condivisi: non vengono clonati. Definisci payload stabili e non mutarli nei listener.

### Listener monouso e rimozione

`emitter.once(name, listener)` rimuove il listener prima di invocarlo: anche una nuova emissione ricorsiva non lo esegue due volte. `off` e alias di `removeListener` e richiede la stessa funzione registrata. Due chiamate `on` con la stessa funzione creano due registrazioni; una chiamata `off` ne rimuove al massimo una.

Questo helper `subscription.mjs` possiede una sola registrazione e restituisce un cleanup idempotente. Il wrapper evita di rimuovere una registrazione altrui della stessa callback:

```js
export function subscribe(emitter, eventName, listener) {
  if (typeof listener !== "function") {
    throw new TypeError("listener must be a function");
  }
  function ownedListener(...args) {
    return listener.apply(this, args);
  }
  emitter.on(eventName, ownedListener);
  let active = true;
  return function dispose() {
    if (!active) return;
    active = false;
    emitter.off(eventName, ownedListener);
  };
}
```

Chi sottoscrive conserva `dispose` e lo chiama alla fine del proprio lifecycle. Non usare `removeAllListeners` su oggetti condivisi: cancelleresti anche gli osservatori di altre parti dell'applicazione. La rimozione durante un'emissione gia in corso non revoca i listener che quella emissione deve ancora chiamare.

### Errori sincroni e listener async

Distingui tre casi:

- Un listener ordinario lancia: l'eccezione esce da `emit` e interrompe i listener successivi. Non diventa automaticamente un evento `error`.
- La sorgente emette `error`: senza un listener per quel nome, `emit` lancia; se nessuno intercetta l'eccezione, il processo termina.
- Un listener `async` rifiuta la Promise: un `try/catch` intorno a `emit` non la intercetta. Il chiamante non riceve quella Promise.

`captureRejections` puo inoltrare le rejection all'evento `error`, senza rendere `emit` attendibile con `await`. Demo autonomo `events-errors.mjs`:

```js
import { EventEmitter, once } from "node:events";

const emitter = new EventEmitter({ captureRejections: true });
const failure = once(emitter, "error");

emitter.on("refresh", async () => {
  await Promise.resolve();
  throw new Error("refresh failed");
});

console.log(emitter.emit("refresh"));
const [error] = await failure;
console.log(error.message);
```

```sh
node events-errors.mjs
```

Output: `true`, poi `refresh failed`. Qui il listener monouso installato da `once` intercetta proprio `error`; in un servizio che continua a funzionare serve invece una politica persistente. Mantieni sincroni i listener di `error`: le loro rejection non vengono ricatturate per evitare cicli infiniti. `errorMonitor` osserva gli errori, ma non sostituisce un gestore.

### Aspettare un evento senza perderlo

La funzione importata `once(emitter, name, options)` restituisce una Promise con l'array degli argomenti; e diversa dal metodo `emitter.once`, che registra una callback.

Un evento non viene conservato per chi si registra dopo. In `events-ready.mjs`, crea entrambe le attese **prima** di avviare la sorgente:

```js
import { EventEmitter, once } from "node:events";

const emitter = new EventEmitter();
const waiting = Promise.all([
  once(emitter, "ready"),
  once(emitter, "done"),
]);

emitter.emit("ready", { version: 1 });
emitter.emit("done", 3);

const [[info], [count]] = await waiting;
console.log(info.version, count);
```

```sh
node events-ready.mjs
```

Output: `1 3`. Scrivere prima `await once(..., "ready")` e solo dopo creare l'attesa di `done` perderebbe la seconda emissione sincrona.

Per un'attesa che potrebbe non terminare, `ready-wait.mjs` accetta il signal del chiamante:

```js
import { once } from "node:events";

export async function waitForReady(emitter, { signal } = {}) {
  const [info] = await once(emitter, "ready", { signal });
  return info;
}
```

Avvia `waitForReady` prima della sorgente e gestisci la sua Promise. Un abort rifiuta con `AbortError` e rimuove i listener temporanei; non ferma il produttore. Un `error` emesso nell'attesa di `ready` rifiuta la Promise. Quando si attende proprio `error`, invece, quell'evento e il risultato, come nel demo precedente. Dopo il cleanup resta responsabilita della sorgente gestire eventuali errori futuri.

## API / Sintassi

I nomi brevi indicano metodi dell'emitter; le due funzioni importate sono specificate nella tabella.

| API | Scopo | Attenzione |
| --- | --- | --- |
| `on` | Registra una callback | Non deduplica le registrazioni |
| `once` | Callback monouso | Va registrata prima dell'evento |
| `off` | Rimuove una registrazione | Usa l'identita della funzione |
| `emit` | Notifica subito gli osservatori | Non attende lavoro asincrono |
| `listenerCount` | Conta i listener | Utile per controllare il cleanup |
| `events.once` | Promise per un evento | Supporta `signal`; puo rifiutare |
| `events.on` | Iteratore asincrono di eventi | La coda puo crescere |

## Esempio pratico

Modulo `job.mjs`: `run` restituisce l'esito del lavoro; gli eventi servono soltanto a osservare l'avanzamento. Il worker viene passato esplicitamente, non e una funzione sottintesa.

```js
import { EventEmitter } from "node:events";

export class Job extends EventEmitter {
  #running = false;

  async run(items, processItem) {
    if (this.#running) throw new Error("job already running");
    if (!Array.isArray(items) || typeof processItem !== "function") {
      throw new TypeError("items must be an array and processItem a function");
    }
    const input = Array.from(items);
    const results = [];
    this.#running = true;
    try {
      this.emit("start", { total: input.length });
      for (const [index, item] of input.entries()) {
        results.push(await processItem(item));
        this.emit("progress", { done: index + 1, total: input.length });
      }
      this.emit("done", { total: input.length });
      return results;
    } finally {
      this.#running = false;
    }
  }
}
```

Uso in `job-demo.mjs`, nella stessa directory:

```js
import { Job } from "./job.mjs";

const job = new Job();
const report = ({ done, total }) => console.log(`${done}/${total}`);
job.on("progress", report);

try {
  const result = await job.run([2, 4], async (value) => value * 2);
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : "job failed");
  process.exitCode = 1;
} finally {
  job.off("progress", report);
}
```

```sh
node job-demo.mjs
```

Output: `1/2`, `2/2`, `[4,8]`. Un input vuoto produce `start` e `done`, senza `progress`. Il primo errore del worker rifiuta `run` e interrompe gli elementi successivi; non viene emesso un secondo errore con un canale alternativo.

**Contratto dei listener del demo:** callback sincrone che non lanciano. Un loro errore rifiuta comunque `run`, anche da `done` dopo il lavoro svolto: non significa che quel lavoro sia stato annullato. Un listener `async` non viene atteso. Se un osservatore deve essere parte dell'operazione, chiamalo esplicitamente e attendilo invece di nasconderlo dietro un evento.

La copia dell'array fissa l'elenco iniziale, non clona gli oggetti. Il demo accumula i risultati: adatto a piccoli batch, non a flussi infiniti. Non implementa persistenza, retry, rollback o cancellazione del worker.

## Varianti e limiti

`events.on` restituisce un iteratore che produce array di argomenti. Uscire con `break` rimuove i listener dell'iteratore. Elaborare con `for await` rende sequenziale il consumer, **non** rallenta automaticamente chi chiama `emit`: per i watermark di `events.on` servono sorgenti con `pause` e `resume`. Un normale EventEmitter non le fornisce.

`EventTarget` usa `addEventListener` e oggetti `Event`: non e un sostituto intercambiabile, in particolare per payload ed errori. Per un flusso con backpressure scegli uno stream; per un unico completamento scegli una Promise.

## Errori comuni

- Trattare `await emitter.emit(...)` come attesa dei listener.
- Scambiare una notifica `done` con una transazione completata e persistita.
- Registrarsi dopo l'avvio di una sorgente che puo emettere sincronicamente.
- Nascondere problemi aumentando indiscriminatamente `setMaxListeners`: l'avviso indica una soglia superata, non un limite rigido ne la prova certa di un leak.
- Confondere cleanup dell'ascolto, arresto del produttore e annullamento degli effetti gia avvenuti.

## Checklist

- Nome, payload e frequenza di ogni evento sono documentati.
- Esiste un canale chiaro per il risultato finale e per gli errori.
- I listener vengono registrati prima di avviare il lavoro.
- Le sottoscrizioni temporanee hanno un proprietario e un cleanup.
- Le callback async hanno una politica esplicita per attesa e rejection.
- Code e batch hanno limiti adatti al carico reale.

## Fonti

- [Node.js 24.14.0: Events, errori e Promise](https://nodejs.org/download/release/v24.14.0/docs/api/events.html).
- [Node.js Learn: EventEmitter](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter).

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Callback|Callback]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
