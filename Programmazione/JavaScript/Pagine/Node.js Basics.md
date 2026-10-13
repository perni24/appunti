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
  - runtime
  - backend
aliases:
  - Node Basics
  - Node.js
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Async Await]]"
  - "[[Programmazione/JavaScript/Pagine/Event Loop]]"
related:
  - "[[Programmazione/JavaScript/Pagine/File System fs]]"
  - "[[Programmazione/JavaScript/Pagine/Path e Process]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Buffer Node.js]]"
title: Node.js Basics
---

# Node.js Basics

## Sintesi

Node.js e un runtime che esegue JavaScript fuori dal browser. Comprende il motore V8, un sistema di moduli e API per file, processi e rete. Non e un framework web: per una CLI non servono Express, un bundler o un server.

Questa nota introduce un progetto eseguibile; le API specifiche sono approfondite nelle note collegate. Gli esempi sono verificati con **Node.js 24.14.0**: e una baseline di prova, non l'indicazione dell'ultima patch disponibile. Per un progetto reale controlla la versione richiesta e usa una release ancora supportata e aggiornata.

## Quando usarlo

- Backend HTTP, API REST e applicazioni di rete.
- CLI, script di automazione e job batch.
- Tooling frontend: build, test, lint e formattazione.
- Servizi con molte attese I/O, per esempio file, database e rete.

Un calcolo lungo sul thread principale rallenta anche le altre richieste. Per lavoro CPU-bound valuta [[Programmazione/JavaScript/Pagine/Worker threads|worker thread]] o processi separati; mettere una funzione dentro una Promise non sposta il calcolo su un altro thread.

## Come funziona

### Runtime, linguaggio e browser

JavaScript e il linguaggio; Node.js e il contesto di esecuzione. Node non fornisce il DOM di una pagina: non ci sono `window` e `document`. In Node 24 sono invece disponibili anche API di origine web, come `fetch`, `URL`, `AbortController` e `TextEncoder`.

Questo non rende gli ambienti intercambiabili: un modulo che usa `document` non funziona in Node soltanto perche e JavaScript. Viceversa, `node:fs` non e un'API del browser.

File indipendente `runtime.mjs`:

```js
import process from "node:process";

console.log(process.version);
console.log(process.platform);
console.log(typeof document); // undefined
console.log(typeof fetch); // function in Node 24
```

```sh
node runtime.mjs
```

Il prefisso `node:` identifica un modulo incorporato. Non devi installare `fs`, `path` o `process` da npm.

### Event loop e I/O

Le callback JavaScript di un singolo event loop vengono eseguite una alla volta. Durante un'attesa I/O asincrona Node puo gestire altro lavoro; a seconda dell'API intervengono il sistema operativo o il pool di thread di libuv.

File indipendente `event-loop.mjs`:

```js
console.log("start");

setTimeout(() => {
  console.log("timer");
}, 0);

console.log("end");
```

L'ordine e `start`, `end`, `timer`. Lo zero non significa esecuzione immediata o puntualita garantita. API sincrone e calcoli lunghi bloccano il thread che li esegue, anche dentro una funzione `async`. Il modello completo e in [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]].

### ES modules e CommonJS

Rendi esplicita la scelta del formato, senza affidarti al riconoscimento automatico della sintassi:

| File o configurazione | Formato | Sintassi tipica |
| --- | --- | --- |
| `.mjs` | ESM | `import`, `export` |
| `.cjs` | CommonJS | `require`, `module.exports` |
| `.js` con `"type": "module"` nel `package.json` piu vicino | ESM | `import`, `export` |
| `.js` con `"type": "commonjs"` nel `package.json` piu vicino | CommonJS | `require`, `module.exports` |

Node 24 puo riconoscere sintassi ESM anche in file ambigui privi di `type`; non e quindi corretto dire che ogni `.js` senza configurazione sia sempre CommonJS. Dichiarare il formato evita sorprese tra strumenti e versioni.

Due alternative indipendenti, non due blocchi da unire nello stesso file.

`module-demo.mjs`:

```js
import path from "node:path";

console.log(path.basename("docs/README.md")); // README.md
```

`module-demo.cjs`:

```js
const path = require("node:path");

console.log(path.basename("docs/README.md")); // README.md
```

Negli import ESM relativi specifica il file, compresa l'estensione: `import { readPreviewLength } from "./config.js"`. Questo percorso parte dal modulo importatore, non dalla directory del terminale.

In ESM non esistono automaticamente `require`, `module.exports` e `__dirname`. Per una risorsa accanto al modulo puoi costruire `new URL("./data.json", import.meta.url)`, accettata dalle API `fs`. L'interoperabilita non si risolve sostituendo meccanicamente ogni `require` con `import`: vedi [[Programmazione/JavaScript/Pagine/Moduli|Moduli]].

### Runtime e package manager

`node` esegue il programma; npm, pnpm e Yarn gestiscono pacchetti e comandi del progetto. Non sono tre runtime diversi. Segui il package manager gia scelto dal repository, senza rigenerare lockfile alternativi durante lo stesso lavoro.

| Elemento | Ruolo |
| --- | --- |
| `package.json` | Metadati, formato dei moduli, script e dipendenze dichiarate |
| `package-lock.json` | Risoluzione registrata da npm, da versionare nelle applicazioni |
| `node_modules/` | Dipendenze installate, normalmente escluse da Git |
| `scripts` | Comandi nominati come `start`, `dev` e `test` |

I nomi `dev` e `build` non hanno un comportamento universale: leggi il loro valore. Uno script puo eseguire codice arbitrario. Per installazioni riproducibili, lifecycle e rischi dei pacchetti consulta [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]].

## API / Sintassi

### Controllare e avviare

Questi comandi di verifica non creano un progetto:

```sh
node --version
```

```sh
npm --version
```

Per un file `app.js` gia esistente, con formato configurato come sopra:

```sh
node app.js
```

Dentro un progetto che dichiara lo script `dev`:

```sh
npm run dev
```

Per inizializzare interattivamente un **nuovo progetto**, dalla sua directory dedicata:

```sh
npm init
```

Il comando crea o aggiorna `package.json`. Non eseguirlo alla cieca in un repository esistente. Il demo sotto fornisce gia quel file.

Per aggiungere una dipendenza, `package-name` e un segnaposto da sostituire con un pacchetto verificato:

```sh
npm install package-name
```

L'installazione modifica manifest/lockfile e `node_modules`, usa il registry configurato e puo eseguire script. Non serve per i moduli `node:` e non e necessaria per il demo.

### Processo e configurazione

| API | Cosa restituisce o controlla |
| --- | --- |
| `process.version` / `process.platform` | Versione Node / sistema operativo |
| `process.cwd()` | Directory di lavoro corrente, modificabile con `process.chdir()` |
| `process.argv.slice(2)` | Argomenti dopo eseguibile Node e file dello script |
| `process.env.NOME` | Valore testuale della variabile, oppure `undefined` |
| `process.exitCode` | Codice da usare quando il processo termina |

La cartella di lavoro non coincide necessariamente con quella del sorgente. Un percorso relativo passato a `readFile` parte dalla prima; un import relativo parte invece dal modulo.

`process.env.PORT ?? "3000"` fornisce un default, **non** valida una porta: anche `""` o `"abc"` possono arrivare dall'ambiente. Converti e controlla i valori secondo il contratto dell'app. Analogamente, la stringa `"false"` e truthy.

Node non carica `.env` semplicemente perche il file esiste. Nel demo sotto usiamo l'opzione `--env-file=.env`, disponibile nella baseline: il percorso e relativo alla directory corrente, il file mancante genera un errore e una variabile gia presente nell'ambiente ha precedenza.

Non caricare file `.env` non fidati: possono contenere anche opzioni del runtime. Escludi i segreti da Git e dai log; un file `.env.example` contiene soltanto valori dimostrativi.

## Esempio pratico

### File e contratto

Crea un progetto separato, senza dipendenze esterne:

```text
node-basics-demo/
  package.json
  README.md
  .env
  .gitignore
  src/
    config.js
    main.js
  test/
    config.test.js
```

Il programma legge un **piccolo file di testo locale fidato** e ne stampa l'inizio. Accetta zero o un argomento: senza argomento usa `README.md` nella directory di lavoro. `PREVIEW_LENGTH` ammette interi decimali da 1 a 1000, senza spazi o zeri iniziali; se assente vale 200.

`package.json`:

```json
{
  "name": "node-basics-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/main.js",
    "dev": "node --watch src/main.js",
    "test": "node --test test/config.test.js"
  }
}
```

`README.md`, contenuto di prova:

```markdown
# Demo Node

Questo file viene letto dalla CLI.
```

`src/config.js`:

```js
export function readPreviewLength(value = "200") {
  if (typeof value !== "string" || !/^(?:[1-9]\d{0,2}|1000)$/.test(value)) {
    throw new TypeError("PREVIEW_LENGTH deve essere un intero da 1 a 1000");
  }

  return Number(value);
}
```

`src/main.js`:

```js
import process from "node:process";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { readPreviewLength } from "./config.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args[0] === "") {
    throw new Error("Uso: node src/main.js [file]");
  }

  const length = readPreviewLength(process.env.PREVIEW_LENGTH);
  const filePath = path.resolve(process.cwd(), args[0] ?? "README.md");
  const content = await readFile(filePath, "utf8");
  console.log(content.slice(0, length));
}

main().catch((error) => {
  const message = error?.code === "ENOENT"
    ? "File non trovato: controlla il percorso e la directory di lavoro"
    : error instanceof Error ? error.message : "Errore inatteso";

  console.error(message);
  process.exitCode = 1;
});
```

Il valore determina quante **unita UTF-16** stampare, non byte o caratteri percepiti: `slice` puo separare una coppia surrogate. Il demo non e un troncatore Unicode per interfacce utente.

`readFile` legge comunque tutto il file in memoria; tagliare l'output non limita la lettura. Per file grandi servono limiti espliciti e/o [[Programmazione/JavaScript/Pagine/Streams Node.js|stream]]. Il codice non scrive file e non e un endpoint sicuro a cui passare percorsi ricevuti da utenti remoti.

`.env`, opzionale e senza segreti:

```dotenv
PREVIEW_LENGTH=8
```

`.gitignore` del demo:

```gitignore
node_modules/
.env
```

`test/config.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readPreviewLength } from "../src/config.js";

test("lunghezza: default, limite e input invalido", () => {
  assert.equal(readPreviewLength(), 200);
  assert.equal(readPreviewLength("1000"), 1000);
  assert.throws(() => readPreviewLength(""), TypeError);
});
```

### Esecuzione

Tutti i comandi seguenti partono da `node-basics-demo/`. Non e necessario eseguire `npm install`.

Avvio diretto con il file di default, senza caricamento automatico di `.env`:

```sh
node src/main.js
```

Avvio equivalente tramite lo script:

```sh
npm start
```

Passaggio di un percorso al programma tramite npm:

```sh
npm run start -- README.md
```

Il separatore `--` inoltra gli argomenti allo script. Per percorsi contenenti spazi usa le virgolette. Le opzioni di Node devono invece precedere il file dello script.

Avvio con la configurazione del file `.env`:

```sh
node --env-file=.env src/main.js README.md
```

Se `PREVIEW_LENGTH` non e gia impostata nell'ambiente, l'output e `# Demo N` seguito da un ritorno a capo.

Esecuzione del test reale presente nel progetto:

```sh
npm test
```

Ricaricamento in sviluppo, interrotto con Ctrl+C:

```sh
npm run dev
```

`--watch` riavvia il processo quando cambiano i file sorvegliati: non e un gestore di processi per produzione. Lo script `dev` del demo non contiene `--env-file`, quindi non carica quel file.

### Errori e fine del processo

`main().catch(...)` gestisce il rifiuto di `main`, compresi gli errori di lettura attesi con `await`; non cattura magicamente errori di callback esterne o Promise avviate senza attenderle.

Su errore la CLI scrive su stderr e imposta codice 1. Su successo usa il normale codice 0. `process.exitCode` lascia terminare le attivita pendenti; `process.exit(1)` forza invece l'uscita e puo troncare output ancora da scrivere. Impostare `exitCode` non chiude server, timer o connessioni: un servizio richiede cleanup e shutdown propri.

## Varianti

- **CLI/automazione**: input da argomenti, output su stdout, diagnostica su stderr.
- **Backend HTTP**: processo persistente, validazione delle richieste, limiti, timeout e shutdown; vedi [[Programmazione/JavaScript/Pagine/HTTP server|HTTP server]].
- **Tooling frontend**: Node esegue gli strumenti, ma il bundle dell'app puo essere destinato al browser.
- **Worker thread**: separa lavoro JavaScript CPU-bound; non rende ogni operazione piu veloce.
- **Child process**: esegue programmi esterni con un proprio processo; richiede gestione di argomenti, errori e risorse.

## Errori comuni

| Sintomo o errore | Controllo da fare |
| --- | --- |
| `document is not defined` | Il codice richiede il DOM, non soltanto JavaScript |
| `require is not defined` | Il file e ESM; verifica formato e API usate |
| Import relativo non risolto | Specifica estensione e percorso rispetto al modulo |
| File letto nella cartella sbagliata | Distingui directory corrente da directory del sorgente |
| `.env` ignorato | Caricalo esplicitamente; controlla anche le variabili gia impostate |
| Configurazione apparentemente falsa ma attiva | I valori dell'ambiente sono stringhe, non booleani |
| Server lento durante un calcolo | `async` non sposta CPU su un altro thread |
| Processo che non termina | Cerca timer, server o connessioni ancora aperti |

## Checklist

- Verifica runtime, formato dei moduli e directory da cui esegui i comandi.
- Leggi `scripts`, dipendenze e lockfile prima di installare o avviare codice altrui.
- Separa argomenti del programma, opzioni Node e variabili d'ambiente.
- Valida la configurazione prima di aprire file, server o connessioni.
- Gestisci errori asincroni e risorse; usa codici di uscita utili alla shell/CI.
- Non trattare gli esempi come limiti di memoria, sandbox o policy di sicurezza.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Event Loop|Event Loop]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Async Await|Async Await]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Buffer Node.js|Buffer Node.js]]
- [[Programmazione/JavaScript/Pagine/Worker threads|Worker threads]]
- [[Programmazione/JavaScript/Pagine/Child process|Child process]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Supply chain security npm|Supply chain security npm]]

## Fonti

Verifica tecnica: 2026-10-08. Esempi locali provati con Node.js 24.14.0 e npm 11.19.0; non e una matrice di compatibilita fra sistemi operativi, package manager o versioni.

- [Node.js: versioni e stato del supporto](https://nodejs.org/en/about/previous-releases).
- [Node.js: event loop e worker pool](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop).
- [Node.js 24.14.0: oggetti globali](https://nodejs.org/download/release/v24.14.0/docs/api/globals.html).
- [Node.js 24.14.0: formati dei pacchetti](https://nodejs.org/download/release/v24.14.0/docs/api/packages.html) e [moduli ESM](https://nodejs.org/download/release/v24.14.0/docs/api/esm.html).
- [Node.js 24.14.0: opzioni CLI](https://nodejs.org/download/release/v24.14.0/docs/api/cli.html) e [variabili d'ambiente](https://nodejs.org/download/release/v24.14.0/docs/api/environment_variables.html).
- [Node.js 24.14.0: process](https://nodejs.org/download/release/v24.14.0/docs/api/process.html), [file system](https://nodejs.org/download/release/v24.14.0/docs/api/fs.html) e [path](https://nodejs.org/download/release/v24.14.0/docs/api/path.html).
- [npm: esecuzione degli script](https://docs.npmjs.com/cli/v11/commands/npm-run/).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
