---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
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

## Quando usarlo

Usa `Buffer` quando lavori con byte grezzi in Node.js.

Casi tipici:

- leggere o scrivere file binari;
- gestire chunk da stream;
- convertire encoding testuali;
- lavorare con protocolli di rete;
- produrre hash, firme o dati crittografici;
- manipolare payload compressi o immagini.

Per testo normale, usa stringhe e specifica encoding nelle API file/stream.

## Come funziona

### Creare un Buffer
```js
const buffer = Buffer.from("ciao", "utf8");

console.log(buffer);
console.log(buffer.toString("utf8")); // ciao
```

`Buffer.from` e il modo consigliato per creare un Buffer da stringhe o array.

---
### Allocazione
```js
const safe = Buffer.alloc(10);
const unsafe = Buffer.allocUnsafe(10);
```

`Buffer.alloc` inizializza la memoria a zero.

`Buffer.allocUnsafe` e piu veloce, ma puo contenere dati vecchi in memoria e va usato solo quando verranno sovrascritti subito.

---
### Encoding
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
### Buffer e file system
Se non specifichi encoding, molte API Node restituiscono Buffer.

```js
import { readFile } from "node:fs/promises";

const data = await readFile("image.png");

console.log(Buffer.isBuffer(data)); // true
```

Questo e corretto per file binari.

---
### Buffer e stream
Gli stream Node producono spesso chunk come Buffer.

```js
stream.on("data", (chunk) => {
  console.log(Buffer.isBuffer(chunk));
});
```

Per testo, puoi impostare encoding o convertire con `toString`.

---
### Buffer vs ArrayBuffer
`Buffer` e specifico di Node.js ed estende `Uint8Array`.

`ArrayBuffer` e una primitiva JavaScript/Web standard per memoria binaria.

Nel browser si usano spesso `ArrayBuffer`, `TypedArray`, `Blob` e `DataView`. In Node.js si incontra spesso `Buffer`.

---

## API / Sintassi

Creazione:

```js
Buffer.from("ciao", "utf8");
Buffer.from([0x63, 0x69, 0x61, 0x6f]);
Buffer.alloc(1024);
```

Conversione:

```js
buffer.toString("utf8");
buffer.toString("base64");
buffer.toString("hex");
```

Controlli e operazioni:

```js
Buffer.isBuffer(value);
Buffer.byteLength("ciao", "utf8");
Buffer.concat([bufferA, bufferB]);
buffer.subarray(0, 4);
```

## Esempio pratico

Convertire un file letto come byte in Base64:

```js
import { readFile } from "node:fs/promises";

const image = await readFile("logo.png");
const base64 = image.toString("base64");

console.log(`data:image/png;base64,${base64}`);
```

Questo e utile per embedding o trasferimento testuale di dati binari, ma aumenta la dimensione rispetto ai byte originali.

## Varianti

- **Buffer da stringa**: `Buffer.from(text, encoding)`.
- **Buffer da array di byte**: `Buffer.from([1, 2, 3])`.
- **Buffer allocato**: `Buffer.alloc(size)`.
- **Buffer non inizializzato**: `Buffer.allocUnsafe(size)`, solo in casi controllati.
- **Uint8Array**: alternativa standard, compatibile con molte API moderne.
- **ArrayBuffer**: memoria binaria di base nelle API Web.

## Errori comuni

- Convertire dati binari in stringa senza motivo.
- Usare encoding sbagliato.
- Usare `Buffer.allocUnsafe` senza sovrascrivere tutto.
- Confondere byte length e lunghezza stringa.
- Caricare file enormi in un unico Buffer invece di usare stream.

---

## Checklist

### Checklist operativa
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
