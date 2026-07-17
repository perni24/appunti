---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [javascript, web-workers, browser, performance, concurrency]
aliases: [Worker JS, Web Worker]
prerequisites: [Event Loop, Scheduling Browser]
related: [Optimization, Service Workers e PWA, Buffer e Typed Arrays]
---

# Web Workers

## Sintesi

I Web Workers permettono di eseguire JavaScript in un thread separato dal main thread del browser.

Sono utili per lavoro CPU pesante che altrimenti bloccherebbe UI, input e rendering.

---

## Quando usarlo

### Quando usarli
Usa Web Worker per:

- parsing pesante;
- compressione;
- elaborazione immagini;
- calcoli numerici;
- ricerca locale su grandi dataset;
- trasformazioni dati costose.

Non usarli per lavoro leggero: creano complessita e overhead di comunicazione.

---

## Come funziona

### Worker base
Pagina principale:

```js
const worker = new Worker("worker.js");

worker.postMessage({ type: "start", payload: [1, 2, 3] });

worker.addEventListener("message", (event) => {
  console.log(event.data);
});
```

`worker.js`:

```js
self.addEventListener("message", (event) => {
  const result = event.data.payload.reduce((total, value) => total + value, 0);

  self.postMessage({ type: "done", result });
});
```

La comunicazione avviene tramite messaggi.

---
### Dati copiati e trasferiti
I messaggi vengono serializzati con structured clone.

Per dati binari grandi, puoi trasferire ownership con transferables.

```js
const buffer = new ArrayBuffer(1024);

worker.postMessage(buffer, [buffer]);
```

Dopo il trasferimento, il buffer originale non e piu utilizzabile nel thread mittente.

---
### Terminazione
```js
worker.terminate();
```

Termina un worker quando non serve piu, soprattutto in applicazioni con viste dinamiche.

---

## API / Sintassi

Creazione:

```js
const worker = new Worker("worker.js");
```

Con modulo ES:

```js
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
```

Comunicazione:

```js
worker.postMessage({ type: "calculate", payload });

worker.addEventListener("message", (event) => {
  console.log(event.data);
});

worker.addEventListener("error", (event) => {
  console.error(event.message);
});
```

## Esempio pratico

Somma pesante fuori dal main thread:

```js
// main.js
const worker = new Worker("sum-worker.js");

worker.postMessage({ numbers: [1, 2, 3, 4] });

worker.addEventListener("message", (event) => {
  console.log(event.data.total);
});
```

```js
// sum-worker.js
self.addEventListener("message", (event) => {
  const total = event.data.numbers.reduce((sum, value) => sum + value, 0);
  self.postMessage({ total });
});
```

La UI resta libera mentre il worker esegue il calcolo.

## Varianti

### Limiti
Un Web Worker non ha accesso diretto a:

- DOM;
- `window`;
- elementi HTML;
- API UI legate al main thread.

Ha invece accesso a molte API come `fetch`, timer, Web Crypto e strutture dati standard.

---

## Errori comuni

- Provare a manipolare il DOM dal worker.
- Passare troppi dati avanti e indietro.
- Usare worker per task piccoli.
- Non terminare worker non piu necessari.
- Ignorare errori e messaggi non validi.

---

## Checklist

### Checklist operativa
- Usa worker solo per CPU pesante o lavoro isolabile.
- Definisci un protocollo messaggi con `type`.
- Usa transferables per dati binari grandi.
- Termina il worker nel cleanup.
- Mantieni la UI sul main thread.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Scheduling Browser|Scheduling Browser]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Service Workers e PWA|Service Workers e PWA]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
