---
date: 2026-05-13
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [javascript, nodejs, buffer, binary-data]
aliases: [Node Buffer, Buffer]
prerequisites: [Node.js Basics]
related: [Buffer e Typed Arrays, File System fs, Streams Node.js]
---

# Buffer Node.js

## Sintesi

`Buffer` e la struttura dati di Node.js per gestire dati binari.

E usata da file system, rete, stream, crittografia e protocolli che lavorano con byte.

---

## Creare un Buffer

```js
const buffer = Buffer.from("ciao", "utf8");

console.log(buffer);
console.log(buffer.toString("utf8")); // ciao
```

`Buffer.from` e il modo consigliato per creare un Buffer da stringhe o array.

---

## Allocazione

```js
const safe = Buffer.alloc(10);
const unsafe = Buffer.allocUnsafe(10);
```

`Buffer.alloc` inizializza la memoria a zero.

`Buffer.allocUnsafe` e piu veloce, ma puo contenere dati vecchi in memoria e va usato solo quando verranno sovrascritti subito.

---

## Encoding

```js
const text = "ciao";

const buffer = Buffer.from(text, "utf8");

console.log(buffer.toString("base64"));
```

Encoding comuni:

- `utf8`;
- `base64`;
- `hex`;
- `ascii`.

---

## Buffer e file system

Se non specifichi encoding, molte API Node restituiscono Buffer.

```js
import { readFile } from "node:fs/promises";

const data = await readFile("image.png");

console.log(Buffer.isBuffer(data)); // true
```

Questo e corretto per file binari.

---

## Buffer e stream

Gli stream Node producono spesso chunk come Buffer.

```js
stream.on("data", (chunk) => {
  console.log(Buffer.isBuffer(chunk));
});
```

Per testo, puoi impostare encoding o convertire con `toString`.

---

## Buffer vs ArrayBuffer

`Buffer` e specifico di Node.js ed estende `Uint8Array`.

`ArrayBuffer` e una primitiva JavaScript/Web standard per memoria binaria.

Nel browser si usano spesso `ArrayBuffer`, `TypedArray`, `Blob` e `DataView`. In Node.js si incontra spesso `Buffer`.

---

## Errori comuni

- Convertire dati binari in stringa senza motivo.
- Usare encoding sbagliato.
- Usare `Buffer.allocUnsafe` senza sovrascrivere tutto.
- Confondere byte length e lunghezza stringa.
- Caricare file enormi in un unico Buffer invece di usare stream.

---

## Checklist operativa

- Usa `Buffer.from` per creare Buffer da dati esistenti.
- Usa `Buffer.alloc` per memoria nuova inizializzata.
- Specifica encoding quando converti testo.
- Usa stream per dati grandi.
- Evita `allocUnsafe` salvo casi controllati.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
