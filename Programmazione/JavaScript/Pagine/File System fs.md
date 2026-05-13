---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, nodejs, fs, filesystem, io]
aliases: [fs, File System Node.js]
prerequisites: [Node.js Basics, Async Await]
related: [Path e Process, Streams Node.js, Buffer Node.js]
---

# File System fs

## Sintesi

Il modulo `node:fs` permette a Node.js di leggere, scrivere e gestire file e cartelle.

Per codice moderno si usa spesso `node:fs/promises`, che espone API basate su Promise.

---

## Import

```js
import { readFile, writeFile } from "node:fs/promises";
```

Con CommonJS:

```js
const { readFile, writeFile } = require("node:fs/promises");
```

---

## Leggere file

```js
import { readFile } from "node:fs/promises";

const content = await readFile("config.json", "utf8");
const config = JSON.parse(content);
```

Specifica `"utf8"` quando vuoi una stringa. Senza encoding ottieni un `Buffer`.

---

## Scrivere file

```js
import { writeFile } from "node:fs/promises";

await writeFile("output.txt", "contenuto\n", "utf8");
```

`writeFile` sovrascrive il file se esiste.

---

## Aggiungere contenuto

```js
import { appendFile } from "node:fs/promises";

await appendFile("log.txt", "nuova riga\n", "utf8");
```

Utile per log semplici o output incrementale.

---

## Cartelle

```js
import { mkdir, readdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const entries = await readdir("dist");
```

`recursive: true` evita errore se cartelle intermedie non esistono.

---

## Stat e controllo file

```js
import { stat } from "node:fs/promises";

const info = await stat("data.json");

console.log(info.isFile());
console.log(info.size);
```

Usa `stat` per leggere metadati del file system.

---

## Stream

Per file grandi, evita `readFile`: carica tutto in memoria.

```js
import { createReadStream } from "node:fs";

const stream = createReadStream("large.log", "utf8");

stream.on("data", (chunk) => {
  console.log(chunk);
});
```

Gli stream processano dati a blocchi.

---

## Errori comuni

- Usare path relativi senza sapere da quale cartella parte il processo.
- Leggere file grandi con `readFile`.
- Dimenticare encoding e ricevere un `Buffer`.
- Ignorare errori di permessi o file mancanti.
- Costruire path con stringhe invece di `node:path`.

---

## Checklist operativa

- Usa `fs/promises` con `async/await`.
- Usa `path.join` o `path.resolve` per costruire percorsi.
- Gestisci errori con `try/catch`.
- Usa stream per file grandi.
- Non fidarti di path ricevuti dall'utente senza validazione.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]
