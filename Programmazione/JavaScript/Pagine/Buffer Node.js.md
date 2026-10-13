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
  - buffer
  - binary-data
aliases:
  - Node Buffer
  - Buffer
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays]]"
  - "[[Programmazione/JavaScript/Pagine/File System fs]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js]]"
title: Buffer Node.js
---

# Buffer Node.js

## Sintesi

`Buffer` e una sequenza di byte usata dalle API Node.js per file, socket, stream e crittografia. Estende `Uint8Array` con metodi per codifiche e campi numerici; non e una stringa e non indica da solo il formato dei dati.

Tre domande guidano il suo uso: **quali byte sono validi, chi puo modificarli e con quale codifica vanno interpretati?** Copiare, creare una vista e convertire valori sono operazioni diverse.

## Quando usarlo

Usalo per byte grezzi, protocolli binari, immagini, dati compressi, hash o conversioni Base64. Per testo semplice puoi chiedere una stringa direttamente alle API; per contenuti grandi usa [[Programmazione/JavaScript/Pagine/Streams Node.js|stream]], senza accumulare tutto in RAM.

Gli esempi sono moduli `.mjs` con import esplicito da `node:buffer`, senza pacchetti npm. Baseline: Node.js **24.14.0**, non una dichiarazione sulla patch piu recente. Per ArrayBuffer, DataView, transfer e memoria condivisa vedi [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]].

## Come funziona

### Byte e testo hanno lunghezze diverse

Demo autonomo `buffer-text.mjs`:

```js
import { Buffer } from "node:buffer";

const text = "caff\u00e8";
const bytes = Buffer.from(text, "utf8");
console.log(text.length, bytes.length, Buffer.byteLength(text, "utf8"));
console.log(bytes.toString("hex"));
console.log(bytes.toString("utf8") === text);
console.log(Buffer.isBuffer(bytes), bytes instanceof Uint8Array);
```

```sh
node buffer-text.mjs
```

Output: `5 6 6`, `63616666c3a8`, `true`, `true true`. `String.length` conta unita UTF-16; `Buffer.length` conta byte. Per `Content-Length` HTTP misura i byte effettivamente inviati, non la lunghezza della stringa originale.

`Buffer.from(text, "utf8")` codifica; `bytes.toString("utf8")` decodifica. Hex e Base64 rappresentano invece byte come testo: non sono cifratura, compressione o validazione del formato del file.

### Allocazione e input numerici

```js
import { Buffer } from "node:buffer";

const zeroed = Buffer.alloc(4);
const converted = Buffer.from([-1, 256, 3.9]);
console.log([...zeroed]); // [0, 0, 0, 0]
console.log([...converted]); // [255, 0, 3]
```

La conversione da array tronca e converte i valori: **non valida** che l'input contenga interi fra 0 e 255. Valida prima quando gli elementi arrivano da un formato esterno.

`Buffer.alloc` inizializza la memoria. `allocUnsafe` puo evitarne l'azzeramento, ma non promette un guadagno nel tuo caso: misura prima. Ogni byte che leggerai o esporrai deve essere inizializzato; una scrittura parziale non basta. Non verificare la sicurezza aspettandoti byte casuali nei test: a volte saranno gia zero. Evita il vecchio costruttore `new Buffer(...)`.

### Copia, vista e pool

Demo autonomo `buffer-views.mjs`:

```js
import { Buffer } from "node:buffer";

const source = Buffer.from([10, 20, 30, 40]);
const alias = source.subarray(1, 3);
const copy = Buffer.from(alias);
const shared = Buffer.from(alias.buffer, alias.byteOffset, alias.byteLength);

shared[0] = 99;
console.log([...source]); // [10, 99, 30, 40]
console.log([...copy]); // [20, 30]
console.log([...alias]); // [99, 30]
```

```sh
node buffer-views.mjs
```

`subarray` condivide i byte. Anche il vecchio `Buffer.slice` crea una vista, diversamente da `Uint8Array.slice`: preferisci `subarray` per rendere chiaro l'alias. `Buffer.from(buffer)` copia i byte, mentre l'overload con ArrayBuffer, offset e lunghezza condivide quella regione.

Un Buffer piccolo puo provenire da un pool: `.buffer` puo essere piu grande della sua porzione valida. Non inviare `new Uint8Array(buf.buffer)` come se coincidesse con `buf`; includi `byteOffset` e `byteLength`. Anche una copia indipendente dai byte sorgenti puo avere un backing store pooled: indipendenza dei dati non significa ArrayBuffer privato della stessa dimensione.

### Conversione di elementi multibyte

```js
import { Buffer } from "node:buffer";

const words = new Uint16Array([0x1234, 0x5678]);
const converted = Buffer.from(words);
const rawCopy = Buffer.copyBytesFrom(words);
const rawView = Buffer.from(words.buffer, words.byteOffset, words.byteLength);

console.log([...converted]); // [52, 120]
console.log(rawCopy.length, rawView.length); // 4, 4
words[0] = 0;
console.log(rawCopy.equals(rawView)); // false
```

`Buffer.from(words)` copia convertendo gli elementi a byte, non tutti i byte della memoria originale. `copyBytesFrom` copia i byte di una TypedArray; offset e lunghezza opzionali di questa API contano **elementi** della vista. L'overload `from(arrayBuffer, offset, length)` misura invece byte. Per un formato portabile non basarti sull'endianness nativa di `Uint16Array`.

## API / Sintassi

### Lettura e scrittura di interi

Demo autonomo `buffer-numbers.mjs`:

```js
import { Buffer } from "node:buffer";

const header = Buffer.alloc(10);
header.writeUInt16BE(0x1234, 0);
header.writeBigUInt64BE(9_007_199_254_740_993n, 2);
console.log(header.readUInt16BE(0)); // 4660
console.log(header.readUInt16LE(0)); // 13330: ordine diverso
console.log(header.readBigUInt64BE(2).toString()); // 9007199254740993
```

```sh
node buffer-numbers.mjs
```

`BE` significa big-endian, `LE` little-endian. Offset e dimensioni sono in byte; il formato stabilisce ordine, segno e dimensione. I metodi numerici controllano i limiti della vista e del valore, ma non sostituiscono la validazione di uno schema. Una lettura di due byte richiede che entrambi siano presenti.

Per interi a 64 bit usa le API BigInt: convertire il risultato in Number puo perdere precisione. Un accesso `buf[index]` fuori intervallo restituisce invece `undefined`: non ha lo stesso contratto di `readUInt16BE`.

### Operazioni frequenti

| API | Uso | Attenzione |
| --- | --- | --- |
| `from` | Dati esistenti | L'overload decide copia o vista |
| `alloc` | Nuovo spazio azzerato | Imporre limiti prima di allocare |
| `byteLength` | Dimensione del testo codificato | Non usare `text.length` per UTF-8 |
| `concat` | Unisce chunk in un nuovo Buffer | Accumula memoria e copia |
| `subarray` | Vista di un intervallo | Modifiche condivise |
| `equals` | Confronta i byte | Non e un confronto crittografico constant-time |
| `toString` | Decodifica/rappresenta byte | Non valida da solo l'input |

In `Buffer.concat(list, totalLength)`, una lunghezza inferiore tronca e una superiore aggiunge zeri: se la indichi, calcolala dai chunk validati. Per segreti usa una strategia adatta, per esempio `crypto.timingSafeEqual` con i suoi prerequisiti; il resto del codice deve comunque evitare differenze temporali sensibili.

### Decodifica permissiva e validazione

`Buffer.from(text, "hex")` puo fermarsi al primo carattere non valido o ignorare una cifra finale isolata. Il decoder Base64 accetta anche spazi e varianti di alfabeto: il solo fatto che restituisca un Buffer non certifica il formato richiesto dal tuo protocollo.

Helper `strict-hex.mjs`, con un contratto deliberatamente piccolo: stringa hex senza prefisso, spazi o separatori, massimo 4 KiB, numero pari di cifre; la stringa vuota e ammessa.

```js
import { Buffer } from "node:buffer";

export function decodeHex(text) {
  if (typeof text !== "string") throw new TypeError("Expected a hex string");
  if (text.length > 8192) throw new RangeError("Hex input too large");
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(text)) {
    throw new TypeError("Invalid hex input");
  }
  return Buffer.from(text, "hex");
}
```

Il limite viene controllato prima della conversione e della regex. Non riutilizzare questa policy come validatore di hash, firme o chiavi: lunghezze e vincoli dipendono dal formato.

Per UTF-8 invalido, `toString("utf8")` inserisce caratteri sostitutivi. Per rifiutarlo usa un decoder con `fatal: true`:

```js
import { Buffer } from "node:buffer";
import { TextDecoder } from "node:util";

const invalid = Buffer.from([0xc3, 0x28]);
console.log(invalid.toString("utf8").includes("\ufffd")); // true
try {
  new TextDecoder("utf-8", { fatal: true }).decode(invalid);
} catch (error) {
  console.log(error.name); // TypeError
}
```

Un carattere valido puo essere diviso fra due chunk. Usa un decoder incrementale mantenuto fra le letture, oppure `setEncoding("utf8")`/`encoding: "utf8"` nello stream. Il decoder testuale incrementale non rende ogni chunk una riga e la modalita non fatal non rifiuta tutti gli errori: vedi [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]].

## Esempio pratico

### Leggere un piccolo file in Base64 con limite

Modulo `file-base64.mjs`: legge al massimo `maxBytes + 1` byte da un file regolare. Il byte aggiuntivo permette di distinguere un file esattamente al limite da uno troppo grande; non ci affidiamo soltanto alla dimensione dichiarata dai metadati.

```js
import { Buffer } from "node:buffer";
import { open } from "node:fs/promises";

export async function fileToBase64(filePath, maxBytes = 1024 * 1024) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 16 * 1024 * 1024) {
    throw new RangeError("maxBytes must be an integer from 0 to 16777216");
  }
  const handle = await open(filePath, "r");
  try {
    if (!(await handle.stat()).isFile()) throw new TypeError("Expected a regular file");
    const bytes = Buffer.alloc(maxBytes + 1);
    let used = 0;
    while (used < bytes.length) {
      const { bytesRead } = await handle.read(bytes, used, bytes.length - used, null);
      if (bytesRead === 0) break;
      used += bytesRead;
    }
    if (used > maxBytes) throw new RangeError("File too large");
    return bytes.subarray(0, used).toString("base64");
  } finally {
    await handle.close();
  }
}
```

CLI `base64-demo.mjs`, nella stessa directory:

```js
import { fileToBase64 } from "./file-base64.mjs";

const [filePath, ...extra] = process.argv.slice(2);
if (!filePath || extra.length) {
  console.error("Usage: node base64-demo.mjs <file>");
  process.exitCode = 1;
} else {
  try {
    console.log(await fileToBase64(filePath));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Read failed");
    process.exitCode = 1;
  }
}
```

Con un piccolo `logo.png` di prova gia esistente:

```sh
node base64-demo.mjs logo.png
```

**Effetto:** legge il file e ne stampa il contenuto codificato; non scrive file. Non usarlo su segreti che non vuoi lasciare nella cronologia del terminale o nei log. Il nome `.png` non verifica il formato: un eventuale prefisso `data:image/png;base64,` va aggiunto solo dopo aver accertato che sia davvero un PNG.

Per `n` byte, Base64 standard con padding occupa `4 * Math.ceil(n / 3)` caratteri, circa un terzo in piu per input grandi. Il Buffer, la stringa risultante e altre allocazioni possono coesistere: il limite dei byte letti non e un limite totale di RAM. Il demo alloca subito `maxBytes + 1`, anche per un file piccolo.

La lettura non e uno snapshot contro modifiche concorrenti e non e una sandbox per percorsi non fidati. Per file grandi usa stream e una trasformazione Base64 corretta: concatenare Base64 di chunk arbitrari e sbagliato se i blocchi intermedi non sono multipli di tre byte.

## Varianti e limiti

Molte API Node accettano anche Uint8Array. Usa Buffer quando le sue API servono davvero; evita conversioni superflue per dati gia nel formato richiesto.

Non serializzare `.buffer` ignorando la vista; non presumere di poter trasferire qualunque Buffer pooled a un worker. Per transfer, shared memory e formati binari completi continua nella nota [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]].

## Errori comuni

- Confondere byte, unita UTF-16 e caratteri percepiti.
- Usare `allocUnsafe` e poi esporre byte mai inizializzati.
- Considerare `Buffer.slice` una copia o `Buffer.from(words)` una copia grezza di parole multibyte.
- Perdere offset e lunghezza quando si accede all'ArrayBuffer sottostante.
- Scambiare una conversione hex/Base64 riuscita per validazione rigorosa.
- Convertire ogni chunk UTF-8 separatamente o sommare Base64 di blocchi arbitrari.
- Leggere tutto prima di verificare il limite o convertire un UInt64 in Number senza controllarne la precisione.

## Checklist

- Il formato specifica codifica, dimensioni, segno ed endianness.
- I limiti sono verificati prima delle allocazioni controllabili.
- Ogni vista ha offset, lunghezza e proprietario chiari.
- Copie, alias e conversioni hanno il comportamento voluto.
- I byte esposti sono tutti inizializzati.
- Errori di parsing, I/O e cleanup vengono gestiti dal chiamante.

## Fonti

- [Node.js 24.14.0: Buffer](https://nodejs.org/download/release/v24.14.0/docs/api/buffer.html).
- [Node.js 24.14.0: TextDecoder](https://nodejs.org/download/release/v24.14.0/docs/api/util.html#class-utiltextdecoder).
- [Node.js 24.14.0: StringDecoder](https://nodejs.org/download/release/v24.14.0/docs/api/string_decoder.html).

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]]

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
