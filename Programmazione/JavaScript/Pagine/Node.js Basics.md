---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, nodejs, runtime, backend]
aliases: [Node Basics, Node.js]
prerequisites: [Moduli, Async Await, Event Loop]
related: [File System fs, Path e Process, Events Node.js, Streams Node.js, Buffer Node.js]
---

# Node.js Basics

## Sintesi

Node.js e un runtime JavaScript fuori dal browser.

Permette di usare JavaScript per server, CLI, script di automazione, tooling, API backend e applicazioni di rete.

---

## Runtime vs browser

Nel browser JavaScript ha accesso a DOM, BOM e Web API.

In Node.js JavaScript ha accesso ad API di sistema come file system, processi, stream, rete e moduli nativi.

```js
console.log(process.version);
console.log(process.platform);
```

Node.js non ha `document` o `window`.

---

## Event loop

Node.js usa un event loop per gestire I/O asincrono senza bloccare il thread principale.

```js
console.log("start");

setTimeout(() => {
  console.log("timer");
}, 0);

console.log("end");
```

Il modello e adatto a server I/O-bound, ma non rende automaticamente parallelo il lavoro CPU-bound.

---

## Moduli

Node.js supporta sia CommonJS sia ES modules.

CommonJS:

```js
const path = require("node:path");
```

ES modules:

```js
import path from "node:path";
```

Nel codice moderno conviene usare ES modules quando il progetto lo permette.

---

## Package manager

Node.js viene spesso usato con un package manager:

- `npm`;
- `pnpm`;
- `yarn`.

Il file `package.json` descrive dipendenze, script, entry point e metadati del progetto.

```json
{
  "scripts": {
    "dev": "node src/index.js"
  }
}
```

---

## Eseguire script

```powershell
node app.js
```

Con script npm:

```powershell
npm run dev
```

Gli script sono il punto standard per avviare build, test, lint e tool di progetto.

---

## Variabili d'ambiente

Node.js legge variabili d'ambiente tramite `process.env`.

```js
const port = process.env.PORT ?? "3000";
```

Non salvare segreti nel codice sorgente. Usa variabili d'ambiente o un secret manager.

---

## Errori comuni

- Usare API browser come `document` in Node.js.
- Bloccare il runtime con lavoro CPU pesante.
- Confondere CommonJS ed ES modules nello stesso file.
- Salvare segreti nel repository.
- Non gestire errori asincroni.

---

## Checklist operativa

- Controlla la versione Node richiesta dal progetto.
- Usa `node:` prefix per moduli nativi quando possibile.
- Metti comandi ricorrenti in `package.json`.
- Gestisci errori e shutdown dei processi.
- Per CPU pesante valuta worker thread o processi separati.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
