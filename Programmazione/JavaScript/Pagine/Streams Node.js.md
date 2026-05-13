---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, nodejs, streams, io, backpressure]
aliases: [Node Streams, Streams]
prerequisites: [Node.js Basics, Events Node.js, Buffer Node.js]
related: [File System fs, Buffer Node.js, Events Node.js]
---

# Streams Node.js

## Sintesi

Gli stream permettono di processare dati a blocchi invece di caricare tutto in memoria.

Sono fondamentali per file grandi, upload/download, rete, compressione e pipeline di trasformazione.

---

## Tipi di stream

- Readable: produce dati.
- Writable: consuma dati.
- Duplex: legge e scrive.
- Transform: modifica dati mentre passano.

Esempi:

- `fs.createReadStream`;
- `fs.createWriteStream`;
- stream HTTP request/response;
- stream di compressione.

---

## Leggere uno stream

```js
import { createReadStream } from "node:fs";

const stream = createReadStream("input.txt", "utf8");

stream.on("data", (chunk) => {
  console.log(chunk);
});

stream.on("end", () => {
  console.log("fine");
});

stream.on("error", (error) => {
  console.error(error);
});
```

Gli stream sono EventEmitter.

---

## Scrivere uno stream

```js
import { createWriteStream } from "node:fs";

const stream = createWriteStream("output.txt");

stream.write("prima riga\n");
stream.write("seconda riga\n");
stream.end();
```

`end()` segnala che non verranno scritti altri dati.

---

## Pipe

`pipe` collega uno stream leggibile a uno scrivibile.

```js
import { createReadStream, createWriteStream } from "node:fs";

createReadStream("input.txt").pipe(createWriteStream("output.txt"));
```

Per gestione errori robusta preferisci `pipeline`.

---

## Pipeline

```js
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

await pipeline(
  createReadStream("input.txt"),
  createGzip(),
  createWriteStream("input.txt.gz")
);
```

`pipeline` propaga errori e chiude correttamente gli stream.

---

## Backpressure

La backpressure avviene quando il consumer non riesce a processare dati alla velocita del producer.

Gli stream gestiscono questo problema meglio rispetto a letture manuali complete in memoria.

`pipe` e `pipeline` aiutano a rispettare la capacita dello stream di destinazione.

---

## Async iterator

Molti Readable stream possono essere letti con `for await`.

```js
for await (const chunk of createReadStream("input.txt", "utf8")) {
  console.log(chunk);
}
```

Questa forma e leggibile per trasformazioni semplici.

---

## Errori comuni

- Usare `readFile` per file troppo grandi.
- Non gestire eventi `error`.
- Usare `pipe` senza considerare propagazione errori.
- Ignorare backpressure in scritture manuali.
- Mischiare modalita event, pipe e async iterator senza criterio.

---

## Checklist operativa

- Usa stream per dati grandi o continui.
- Usa `pipeline` per collegare stream in modo robusto.
- Gestisci sempre errori.
- Usa `for await` per letture semplici.
- Non accumulare tutti i chunk in memoria se non necessario.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]
