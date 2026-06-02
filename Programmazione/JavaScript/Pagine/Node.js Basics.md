---
date: 2026-06-02
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

## Quando usarlo

Usa Node.js quando vuoi eseguire JavaScript fuori dal browser.

Casi comuni:

- backend HTTP;
- API REST;
- script di automazione;
- CLI;
- tooling di sviluppo;
- job batch;
- accesso a file system e processi;
- servizi I/O-bound.

Per lavoro CPU-bound pesante serve attenzione: il thread principale puo bloccarsi, quindi valuta worker thread, processi separati o altri runtime.

## Come funziona

### Runtime vs browser
Nel browser JavaScript ha accesso a DOM, BOM e Web API.

In Node.js JavaScript ha accesso ad API di sistema come file system, processi, stream, rete e moduli nativi.

```js
console.log(process.version);
console.log(process.platform);
```

Node.js non ha `document` o `window`.

---
### Event loop
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
### Moduli
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
### Package manager
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
### Eseguire script
```powershell
node app.js
```

Con script npm:

```powershell
npm run dev
```

Gli script sono il punto standard per avviare build, test, lint e tool di progetto.

---
### Variabili d'ambiente
Node.js legge variabili d'ambiente tramite `process.env`.

```js
const port = process.env.PORT ?? "3000";
```

Non salvare segreti nel codice sorgente. Usa variabili d'ambiente o un secret manager.

---

## API / Sintassi

Comandi base:

```powershell
node app.js
npm init
npm install package-name
npm run dev
```

Moduli nativi:

```js
import path from "node:path";
import { readFile } from "node:fs/promises";
```

Variabili di processo:

```js
process.version;
process.platform;
process.cwd();
process.env.NODE_ENV;
process.argv;
```

Script in `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  }
}
```

## Esempio pratico

Script Node.js che legge un file:

```js
import { readFile } from "node:fs/promises";
import path from "node:path";

const filePath = path.resolve(process.cwd(), "README.md");
const content = await readFile(filePath, "utf8");

console.log(content.slice(0, 200));
```

Questo mostra tre differenze rispetto al browser: accesso al file system, uso di `process.cwd()` e moduli nativi.

## Varianti

- **Script Node.js**: automazione locale.
- **CLI**: programma invocato da terminale.
- **Backend HTTP**: server e API.
- **Tooling frontend**: bundler, test runner, formatter.
- **Worker thread**: lavoro CPU-bound in thread separati.
- **Child process**: esecuzione di comandi o processi esterni.

## Errori comuni

- Usare API browser come `document` in Node.js.
- Bloccare il runtime con lavoro CPU pesante.
- Confondere CommonJS ed ES modules nello stesso file.
- Salvare segreti nel repository.
- Non gestire errori asincroni.

---

## Checklist

### Checklist operativa
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
