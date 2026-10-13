---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - javascript
  - nodejs
  - fs
  - filesystem
  - io
aliases:
  - fs
  - File System Node.js
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Path e Process]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer Node.js]]"
title: File System fs
---

# File System fs

## Sintesi

`node:fs` e il modulo incorporato di Node.js per file e directory. `node:fs/promises` espone le operazioni asincrone tramite Promise: usa `await` e gestisci gli errori dell'operazione effettiva, senza supporre che il filesystem rimanga invariato fra due controlli.

Gli esempi usano **Node.js 24.14.0**, moduli `.mjs` e nessuna dipendenza npm. Questa e la versione di prova, non una raccomandazione di restare su quella patch. Esegui le prove in una directory dedicata con file sacrificabili, mai su configurazioni o dati importanti.

## Quando usarlo

- Leggere configurazioni e importare piccoli file locali.
- Generare report, esportazioni, log e directory di lavoro.
- Ispezionare metadati, nomi e tipi delle voci.
- Elaborare contenuti binari o continui con stream.

`readFile` e comodo per file piccoli fidati. Per dati grandi valuta [[Programmazione/JavaScript/Pagine/Streams Node.js|stream]] e limiti espliciti: anche una lettura asincrona puo consumare molta memoria.

## Come funziona

### Tre famiglie di API

| Famiglia | Risultato ed errori | Uso tipico |
| --- | --- | --- |
| `node:fs/promises` | Promise risolta o rifiutata | Flussi con `async/await` |
| Callback di `node:fs` | Callback error-first | Integrazione con codice esistente |
| API `Sync` di `node:fs` | Risultato o eccezione sincrona | Piccole CLI/startup quando il blocco e accettabile |

Le API asincrone non rendono automaticamente concorrenti le scritture sullo stesso file. Attendi ogni modifica dipendente dalla precedente; `Promise.all` non e un lock. Le API sincrone bloccano il thread che le esegue, non necessariamente tutti gli eventuali worker del processo.

Import ESM, per file `.mjs`:

```js
import { readFile, writeFile } from "node:fs/promises";
```

Alternativa CommonJS, per file `.cjs`:

```js
const { readFile, writeFile } = require("node:fs/promises");
```

Non aggiungere `fs` alle dipendenze npm. Formati e avvio sono descritti in [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]].

### Lettura, byte e JSON

Salva questo frammento come `read-demo.mjs`; richiede un piccolo `config.json` nella directory corrente:

```js
import { readFile } from "node:fs/promises";

const bytes = await readFile("config.json");
const text = await readFile("config.json", "utf8");
console.log(Buffer.isBuffer(bytes)); // true
console.log(typeof text); // string
```

Sono due letture indipendenti, non uno snapshot garantito se il file cambia. Senza encoding ricevi un `Buffer`; con `utf8` ricevi testo. `JSON.parse` controlla la sintassi JSON, non la struttura dei dati: `null`, array e numeri sono JSON validi ma non necessariamente configurazioni valide.

Una lettura con `utf8` non e una validazione rigorosa dei byte UTF-8; per quel requisito usa un decoder con modalita fatal. Vedi [[Programmazione/JavaScript/Pagine/Buffer e Typed Arrays|Buffer e Typed Arrays]].

### Percorsi, metadati e gare fra operazioni

I percorsi relativi di `fs` partono da `process.cwd()`, non dalla directory del modulo. Sono accettate anche URL `file:` tramite oggetti `URL`; non passare una URL HTTP aspettandoti un download.

`stat` segue i link simbolici, `lstat` descrive il link stesso. `size` e in byte; i metadati non garantiscono che il file sia ancora uguale alla successiva lettura. `readdir` non promette un ordine: ordinalo se ti serve un risultato deterministico.

Evita il flusso "controlla con access/exists, poi apri": un altro processo puo cambiare il percorso fra le due operazioni. Apri direttamente e gestisci il codice di errore. Se devi creare senza sovrascrivere, usa il flag `wx`, non un controllo preliminare di esistenza.

### Errori e cancellazione

File autonomo `optional-text.mjs`, per un file opzionale:

```js
import { readFile } from "node:fs/promises";

export async function readOptionalText(filePath, { signal } = {}) {
  try {
    return await readFile(filePath, { encoding: "utf8", signal });
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}
```

`null` significa percorso assente; `""` e un file vuoto. ENOENT puo riguardare anche una directory intermedia assente. Non trasformare ogni errore in un default: permessi, disco, input e abort richiedono una decisione diversa.

`readFile` e `writeFile` accettano un `AbortSignal` nella baseline. L'abort non e un rollback: una scrittura puo avere gia modificato parte del file. Non usare timeout/abort come garanzia di consistenza.

## API / Sintassi

### Scrivere e aggiungere

I blocchi seguenti sono indipendenti e richiedono la directory corrente dedicata alle prove.

Creazione esclusiva di `demo-output.txt`: al secondo tentativo fallisce con EEXIST e conserva il file esistente.

```js
import { writeFile } from "node:fs/promises";

await writeFile("demo-output.txt", "prima riga\n", {
  encoding: "utf8",
  flag: "wx",
});
```

Con il flag predefinito `w`, `writeFile` crea oppure **tronca e riscrive** un file gia esistente. La directory madre deve esistere. Una Promise risolta non equivale a una transazione resistente a ogni interruzione o guasto del disco.

Append su un log dimostrativo, creato se assente:

```js
import { appendFile } from "node:fs/promises";

await appendFile("demo-log.txt", "nuova riga\n", "utf8");
```

L'append non fornisce da solo rotazione, limiti di spazio o un protocollo di coordinamento fra piu writer.

### Directory e ispezione

Crea le directory intermedie e lista i soli file direttamente contenuti:

```js
import { mkdir, readdir } from "node:fs/promises";

await mkdir("demo-dist/assets", { recursive: true });
const entries = await readdir("demo-dist", { withFileTypes: true });
const names = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
console.log(names.sort());
```

`recursive: true` tollera directory gia presenti, non elimina errori di permessi o un file che occupa il posto di una directory. `Dirent.isFile()` non segue un link simbolico per classificarne il target.

Metadati di un file gia creato:

```js
import { stat } from "node:fs/promises";

const info = await stat("demo-output.txt");
console.log(info.isFile());
console.log(info.size); // byte, non numero di caratteri
```

### Copia, spostamento e rimozione

| API | Effetto da conoscere |
| --- | --- |
| `copyFile(src, dst)` | Copia; normalmente puo sovrascrivere `dst`. `COPYFILE_EXCL` rifiuta un target esistente |
| `rename(src, dst)` | Sposta/rinomina; non e un'API "no-clobber" e fra filesystem diversi puo fallire con EXDEV |
| `unlink(file)` | Rimuove una voce file/link, non una directory |
| `rm(path)` | Rimuove; `recursive: true` estende la rimozione a un albero, `force: true` tollera l'assenza |

**Distruttivo:** questo frammento rimuove soltanto il file di prova creato sopra. Controlla la directory corrente prima di eseguirlo.

```js
import { rm } from "node:fs/promises";

await rm("demo-output.txt");
```

`force: true` non significa "ignora qualsiasi errore". Per una rimozione ricorsiva verifica prima radice e destinazione risolte; non costruirla da input arbitrari. Link simbolici e modifiche concorrenti richiedono ulteriori protezioni: un semplice confronto di stringhe non e una sandbox.

### FileHandle e chiusura

Modulo `read-block.mjs`: una lettura restituisce **fino a 16 byte**, anche meno se il file e corto. Non e una lettura per righe e non promette testo Unicode completo.

```js
import { open } from "node:fs/promises";

export async function readFirstBlock(filePath) {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
```

`open` produce un handle da chiudere, anche su errore. Usa `bytesRead`: non presumere che una singola chiamata riempia sempre il buffer. Per un numero esatto di byte serve un ciclo fino al limite o a EOF.

## Esempio pratico

### Esportare una configurazione validata

L'input e un piccolo JSON locale fidato. Il demo conserva il sorgente e crea un **nuovo file** con `updatedAt`, senza sovrascrivere output precedenti. Non e un database ne una procedura di aggiornamento transazionale.

`config.json`:

```json
{
  "appName": "demo",
  "enabled": true
}
```

`config-file.mjs`:

```js
import { readFile, writeFile } from "node:fs/promises";

export async function exportUpdatedConfig(source, destination) {
  const value = JSON.parse(await readFile(source, "utf8"));
  if (
    value === null || typeof value !== "object" || Array.isArray(value) ||
    typeof value.appName !== "string" || value.appName.trim() === "" ||
    typeof value.enabled !== "boolean"
  ) {
    throw new TypeError("Configurazione: richiesti appName non vuoto ed enabled booleano");
  }

  const output = {
    appName: value.appName,
    enabled: value.enabled,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(destination, JSON.stringify(output, null, 2) + "\n", {
    encoding: "utf8",
    flag: "wx",
  });
  return output;
}
```

Il contratto dell'esportazione include solo questi tre campi: eventuali campi aggiuntivi dell'input non vengono copiati. Il file originale rimane invariato. Parsing e controllo dello schema precedono la scrittura.

`export-demo.mjs`, accanto agli altri due file:

```js
import process from "node:process";
import path from "node:path";
import { exportUpdatedConfig } from "./config-file.mjs";

try {
  const source = path.resolve(process.cwd(), "config.json");
  const destination = path.resolve(process.cwd(), "config.updated.json");
  await exportUpdatedConfig(source, destination);
  console.log("Creato config.updated.json; sorgente conservato");
} catch (error) {
  console.error("Esportazione fallita:", error?.code ?? error?.name ?? "errore");
  process.exitCode = 1;
}
```

Dalla directory del demo:

```sh
node export-demo.mjs
```

Il primo avvio crea `config.updated.json`; un secondo avvio fallisce con EEXIST. JSON malformato, schema invalido o lettura fallita non creano l'output. Un errore durante la scrittura puo invece lasciare un file parziale: va esaminato, non eliminato automaticamente a partire da un percorso non verificato.

Per riscrivere il file originale servono una scelta esplicita su sovrascrittura, backup e concorrenza. Il pattern temporaneo + rename, nello stesso filesystem e con semantica verificata, puo evitare di mostrare un file parzialmente scritto, ma non impedisce aggiornamenti persi fra writer e non garantisce da solo durabilita dopo un crash.

## Varianti

### Stream con propagazione degli errori

Modulo indipendente `copy-stream.mjs`:

```js
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

export async function copyWithStreams(source, destination) {
  await pipeline(
    createReadStream(source),
    createWriteStream(destination, { flags: "wx" }),
  );
}
```

Invoca `await copyWithStreams(source, destination)` dentro un `try/catch`, con percorsi locali verificati e directory madre esistente. `pipeline` coordina backpressure e errori; un listener `data` da solo non gestisce questi aspetti. Su fallimento l'output puo essere vuoto o parziale; un file preesistente non viene sovrascritto.

Uno stream produce chunk, non necessariamente righe o record interi. Per questi serve un parser incrementale; approfondimento in [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]].

### Watcher

`fs.watch` segnala cambiamenti con differenze fra piattaforme e filesystem: non e un registro affidabile di ogni modifica e il nome del file puo mancare. Gestisci gli errori, chiudi il watcher quando non serve e, per uno stato affidabile, riconcilia con una nuova lettura della directory. Non usarlo come unica fonte di audit.

## Errori comuni

| Errore | Significato operativo |
| --- | --- |
| ENOENT | Un componente del percorso non esiste |
| EEXIST con `wx` | La destinazione esiste: non e autorizzata una sovrascrittura |
| EACCES / EPERM | Operazione non permessa; non mascherarla come file assente |
| ENOTDIR | Un componente che dovrebbe essere una directory non lo e |
| ENOSPC | Spazio disponibile insufficiente; controlla anche l'output parziale |
| SyntaxError da JSON.parse | Testo letto, ma JSON non valido |
| TypeError dello schema | JSON valido, ma dati fuori dal contratto del demo |

Non usare il testo di `error.message` come protocollo stabile e non stampare automaticamente dati o configurazioni contenenti segreti. I codici esatti possono dipendere da sistema operativo e operazione.

## Checklist

- Dichiara encoding, directory di base e dimensione attesa dei file.
- Separa parsing, schema e autorizzazione dei percorsi.
- Indica se una scrittura crea, sovrascrive o aggiunge.
- Attendi le operazioni dipendenti; per writer multipli serve coordinamento.
- Gestisci errori di stream/Promise e chiudi handle e watcher.
- Verifica radice e target prima di cancellazioni; prova su file sacrificabili.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/JSON|JSON]]

## Fonti

Verifica tecnica: 2026-10-08, baseline Node.js 24.14.0. I test locali non certificano filesystem di rete, crash, permessi di ogni OS o modifiche concorrenti ostili.

- [Node.js 24.14.0: File system](https://nodejs.org/download/release/v24.14.0/docs/api/fs.html).
- [Node.js: lettura dei file](https://nodejs.org/en/learn/manipulating-files/reading-files-with-nodejs), [scrittura](https://nodejs.org/en/learn/manipulating-files/writing-files-with-nodejs), [directory](https://nodejs.org/en/learn/manipulating-files/working-with-folders-in-nodejs) e [file descriptor](https://nodejs.org/en/learn/manipulating-files/working-with-file-descriptors-in-nodejs).
- [Node.js 24.14.0: pipeline e stream](https://nodejs.org/download/release/v24.14.0/docs/api/stream.html).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
