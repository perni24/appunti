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
  - streams
  - io
  - backpressure
aliases:
  - Node Streams
  - Streams
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer Node.js]]"
related:
  - "[[Programmazione/JavaScript/Pagine/File System fs]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js]]"
title: Streams Node.js
---

# Streams Node.js

## Sintesi

Gli stream elaborano dati progressivamente, senza richiedere che l'intero contenuto sia disponibile in memoria. Sono adatti a file grandi, upload/download, compressione, log e risposte HTTP progressive.

Il vantaggio dipende dal codice che li usa: accumulare tutti i chunk o avviare lavoro asincrono senza limiti annulla il controllo del flusso. Per collegare sorgente, trasformazioni e destinazione, il punto di partenza e `pipeline` da `node:stream/promises`.

## Quando usarlo

Usa stream per dati grandi o continui; per piccoli file di configurazione `readFile` puo essere piu semplice. Scegli un unico modo di consumare una sorgente: `pipeline`, `for await` oppure eventi, senza mescolarli sullo stesso flusso.

Gli esempi sono moduli `.mjs`, con riferimento Node.js **24.14.0**, senza dipendenze npm. I percorsi relativi dei file dipendono dalla directory di lavoro. Provali in una directory temporanea dedicata, con file di esempio non personali.

## Come funziona

### Tipi di stream

| Tipo | Ruolo | Esempio |
| --- | --- | --- |
| `Readable` | Produce dati | `createReadStream` |
| `Writable` | Riceve dati | `createWriteStream` |
| `Duplex` | Ha un lato leggibile e uno scrivibile | Socket TCP |
| `Transform` | Produce dati a partire da quelli ricevuti | Gzip |

Un Duplex non deve necessariamente trasformare cio che riceve: i due lati possono essere indipendenti. Un Transform e un Duplex con una relazione tra input e output. Gli stream Node espongono eventi tramite EventEmitter; i Web Streams sono un'altra API.

### Un chunk non e un record

Un chunk puo contenere mezza riga, molte righe o una parte di un carattere UTF-8. Non usare `JSON.parse(chunk)` per interpretare messaggi JSON arbitrari: serve prima ricostruire il framing del protocollo.

Per testo UTF-8 usa `encoding: "utf8"`, `setEncoding` o un decoder incrementale. `buffer.toString("utf8")` chiamato separatamente su ogni chunk puo spezzare caratteri multibyte. Con `StringDecoder`, conserva una sola istanza per il flusso e chiama anche `end()`.

In modalita binaria si trasferiscono byte; in `objectMode` si trasferiscono valori JavaScript. Gli oggetti non vengono clonati. `null` indica fine lettura, non un elemento valido da inviare.

### Backpressure: rallentare il produttore

Quando il consumer e piu lento, i buffer si riempiono. Se `writable.write(chunk)` restituisce `false`, **quel chunk e gia stato accettato nel buffer**: non va rispedito. Bisogna sospendere nuove scritture fino a `drain`, gestendo nel frattempo anche errori e chiusure premature.

`highWaterMark` e una soglia, non un limite rigido della memoria del processo. Un singolo chunk puo superarla; i Transform hanno buffer su entrambi i lati. In object mode la soglia conta oggetti, non il loro peso. Per stream testuali decodificati la misura puo essere in unita UTF-16: non assumere che ogni soglia conti sempre byte.

`pipeline` coordina questa pressione tra gli stream. Evita un ciclo che ignora il risultato di `write`; anche `on("data", async chunk => ...)` non aspetta la Promise del listener e puo avviare molte operazioni concorrenti.

### Fine, chiusura ed errore

| Segnale | Significato | Non garantisce |
| --- | --- | --- |
| `end` | Il lato leggibile e stato consumato fino alla fine | Fine di tutte le scritture successive |
| `finish` | Il Writable ha completato le scritture dopo `end()` | Durabilita su disco o ACK remoto |
| `close` | La risorsa sottostante e stata chiusa | Completamento riuscito |
| `error` | Il flusso ha incontrato un errore | Rollback dei dati gia scritti |
| `drain` | Si puo riprendere dopo una `write` con esito `false` | Fine dello stream |

`writable.end()` dichiara che non arriveranno altri dati; il suo ritorno non e un'attesa del completamento. `destroy(error)` interrompe il flusso: non sostituisce una chiusura regolare riuscita.

## API / Sintassi

Preferisci queste composizioni invece di frammenti con variabili non definite:

- `await pipeline(...)`: trasferimento completo con errori propagati alla Promise.
- `for await (const chunk of readable)`: consumo sequenziale con possibilita di attendere il lavoro per ogni chunk.
- `finished(stream, { cleanup: true })`, da `node:stream/promises`: attesa di uno stream gia avviato, rimuovendo i listener installati dall'attesa. Non avvia il consumo di un Readable fermo.

`source.pipe(destination)` gestisce la backpressure, ma non costituisce una politica completa di errori e cleanup dell'intera catena. Usa `pipeline` salvo esigenze specifiche.

## Esempi pratici

### Leggere testo e attendere il consumer

Modulo `consume-text.mjs`. `consume` riceve **chunk di testo**, non righe; puo restituire una Promise. Il segnale, se fornito, controlla la lettura del file, non interrompe automaticamente il lavoro interno alla callback.

```js
import { createReadStream } from "node:fs";

export async function consumeText(filePath, consume, { signal } = {}) {
  if (typeof consume !== "function") {
    throw new TypeError("consume must be a function");
  }
  signal?.throwIfAborted();
  const input = createReadStream(filePath, { encoding: "utf8", signal });
  for await (const text of input) {
    await consume(text);
  }
}
```

Uso `read-demo.mjs`, nella stessa directory, con un `input.txt` gia esistente:

```js
import { consumeText } from "./consume-text.mjs";

try {
  let codeUnits = 0;
  await consumeText("input.txt", (text) => {
    codeUnits += text.length;
  });
  console.log(`Unita UTF-16: ${codeUnits}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "read failed");
  process.exitCode = 1;
}
```

```sh
node read-demo.mjs
```

Il conteggio non e il numero di byte o di caratteri percepiti. Un errore del file o della callback rifiuta la funzione. Non accumuliamo il testo completo; il filesystem puo comunque anticipare alcune letture nei buffer.

### Scrivere senza ignorare il controllo del flusso

Modulo `write-chunks.mjs`. Accetta un iterable, anche asincrono, di stringhe o Buffer; il nome specifica che non aggiunge separatori o righe automaticamente.

```js
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export async function writeChunks(filePath, chunks, { signal } = {}) {
  signal?.throwIfAborted();
  await pipeline(
    Readable.from(chunks, { objectMode: false }),
    createWriteStream(filePath, { flags: "wx" }),
    { signal },
  );
}
```

Uso `write-demo.mjs`:

```js
import { writeChunks } from "./write-chunks.mjs";

try {
  await writeChunks("output.txt", ["prima riga\n", "seconda riga\n"]);
  console.log("Scrittura completata");
} catch (error) {
  console.error(error instanceof Error ? error.message : "write failed");
  process.exitCode = 1;
}
```

```sh
node write-demo.mjs
```

**Effetto:** crea `output.txt`. `wx` rifiuta un file preesistente invece di troncarlo; non crea directory mancanti. La pipeline termina la destinazione quando finisce la sorgente. In caso di guasto o abort puo restare un file parziale: non e una scrittura atomica.

Un async generator che attende operazioni proprie deve cooperare con la cancellazione, per esempio inoltrando il signal alle API che usa. Distruggere lo stream non annulla magicamente una Promise arbitraria pendente nel produttore.

### Comprimere un file

Modulo `gzip-file.mjs`:

```js
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

export async function gzipFile(source, destination, { signal } = {}) {
  signal?.throwIfAborted();
  await pipeline(
    createReadStream(source),
    createGzip(),
    createWriteStream(destination, { flags: "wx" }),
    { signal },
  );
}
```

CLI `gzip-demo.mjs` nella stessa directory:

```js
import { gzipFile } from "./gzip-file.mjs";

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error("Usage: node gzip-demo.mjs <source> <destination>");
  process.exitCode = 1;
} else {
  try {
    await gzipFile(args[0], args[1]);
    console.log("Compressione completata");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "compression failed");
    process.exitCode = 1;
  }
}
```

Con un `input.txt` di prova e una destinazione non ancora esistente:

```sh
node gzip-demo.mjs input.txt input.txt.gz
```

**Effetto:** crea l'archivio senza modificare la sorgente. Errori di apertura, lettura, compressione o scrittura rifiutano la pipeline; gli stream coinvolti vengono distrutti quando necessario. Anche se manca la sorgente, l'apertura concorrente della destinazione puo lasciare un file vuoto o incompleto. Nessuna cancellazione automatica dell'output: prima di rimuoverlo verifica che appartenga davvero a questa operazione.

Il controllo iniziale del signal evita di aprire file quando e gia annullato. Un abort durante il trasferimento interrompe la pipeline, ma non ripristina il filesystem. Per pubblicare solo un risultato completo serve un protocollo con file temporaneo e passaggio finale, come discusso in [[Programmazione/JavaScript/Pagine/File System fs|File System fs]].

### Interrompere un Readable

Demo autonomo `stream-break.mjs`:

```js
import { Readable } from "node:stream";

const input = Readable.from([10, 20, 30]);
for await (const value of input) {
  console.log(value);
  break;
}
console.log(input.destroyed);
```

```sh
node stream-break.mjs
```

Output: `10`, poi `true`. Con l'iteratore predefinito, uscire prima della fine con `break`, `return` o un errore distrugge lo stream. In Node 24 `iterator({ destroyOnReturn: false })` permette di conservarlo: chi lo usa deve poi riprendere il consumo o chiuderlo esplicitamente.

### Trasformare oggetti in JSON Lines

Modulo `json-lines.mjs`: il lato scrivibile riceve valori JSON-serializzabili, quello leggibile produce byte di testo. La callback va chiamata esattamente una volta per elemento.

```js
import { Transform } from "node:stream";

export function createJsonLines() {
  return new Transform({
    writableObjectMode: true,
    transform(value, encoding, callback) {
      let line;
      try {
        const json = JSON.stringify(value);
        if (json === undefined) throw new TypeError("value is not JSON data");
        line = json + "\n";
      } catch (error) {
        callback(error);
        return;
      }
      callback(null, line);
    },
  });
}
```

Uso `json-lines-demo.mjs`:

```js
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createJsonLines } from "./json-lines.mjs";

try {
  await pipeline(
    Readable.from([{ id: 1 }, { id: 2 }]),
    createJsonLines(),
    createWriteStream("records.jsonl", { flags: "wx" }),
  );
  console.log("Esportazione completata");
} catch (error) {
  console.error(error instanceof Error ? error.message : "export failed");
  process.exitCode = 1;
}
```

```sh
node json-lines-demo.mjs
```

**Effetto:** crea `records.jsonl` con un oggetto per riga, senza sovrascriverlo. Non e un validatore di schema: valgono le regole di `JSON.stringify`, incluse omissioni e conversioni. Cicli e BigInt falliscono; `null` non puo essere passato come chunk. Usa record ordinari fidati: getter e `toJSON` possono eseguire codice. Un singolo record enorme viene comunque serializzato interamente in memoria.

## Varianti e limiti

Il `body` di una risposta `fetch` e un Web `ReadableStream`, non un Node Readable: non assumere che abbia `.pipe()`. Gli adattatori `Readable.fromWeb` e `Readable.toWeb` collegano i modelli; controlla disponibilita e ownership nella versione usata. Il body puo essere `null` o gia consumato.

`pipeline` prende in carico il lifecycle degli stream passati. Non riusare una catena fallita; puo lasciare listener interni sugli oggetti. Con HTTP, un errore puo distruggere anche il socket prima che tu possa inviare una risposta alternativa: pianifica gestione degli header ed errori prima del trasferimento.

## Errori comuni

- Trattare ogni chunk come una riga, un messaggio o un carattere completo.
- Ripetere un chunk dopo `write` con esito `false` o continuare a scrivere senza attendere.
- Usare `on("data", async ...)` pensando di avere consumo sequenziale.
- Confondere `finish`, `close`, persistenza su disco e conferma del destinatario.
- Pensare che gzip, abort o `wx` forniscano una transazione con rollback.
- Dichiarare `async transform(...)` senza gestire la callback richiesta dalla API.

## Checklist

- Il framing e la codifica dei dati sono espliciti.
- Un solo consumer controlla la sorgente.
- Backpressure ed errori attraversano tutta la catena.
- Il produttore e gli eventuali task async rispettano la cancellazione.
- Output preesistenti e file parziali hanno una politica esplicita.
- I limiti riguardano anche singoli oggetti, espansione dei dati e lavoro in corso.

## Fonti

- [Node.js 24.14.0: Stream](https://nodejs.org/download/release/v24.14.0/docs/api/stream.html).
- [Node.js Learn: uso degli stream](https://nodejs.org/en/learn/modules/how-to-use-streams).
- [Node.js Learn: backpressure](https://nodejs.org/en/learn/modules/backpressuring-in-streams).
- [Node.js 24.14.0: StringDecoder](https://nodejs.org/download/release/v24.14.0/docs/api/string_decoder.html).
- [Node.js 24.14.0: filesystem e flag di apertura](https://nodejs.org/download/release/v24.14.0/docs/api/fs.html).

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
