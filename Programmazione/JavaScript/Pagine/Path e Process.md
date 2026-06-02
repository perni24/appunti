---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [javascript, nodejs, path, process, environment]
aliases: [Path Node.js, Process Node.js]
prerequisites: [Node.js Basics]
related: [File System fs, Moduli]
---

# Path e Process

## Sintesi

`node:path` serve a gestire percorsi file in modo portabile.

`process` espone informazioni e controllo sul processo Node.js in esecuzione.

---

## Quando usarlo

Usa `node:path` ogni volta che costruisci, analizzi o normalizzi percorsi file in Node.js.

Usa `process` quando devi leggere informazioni sul processo corrente, configurazione da ambiente o argomenti CLI.

Casi comuni:

- costruire path portabili tra Windows, Linux e macOS;
- leggere file partendo dalla working directory;
- configurare porta, ambiente e feature flag;
- gestire script CLI;
- impostare exit code in caso di errore.

## Come funziona

### Perche usare `node:path`
Costruire percorsi concatenando stringhe e fragile, soprattutto tra Windows, Linux e macOS.

```js
import path from "node:path";

const filePath = path.join("data", "users", "users.json");
```

`path.join` usa il separatore corretto per il sistema operativo.

---
### Metodi principali di path
```js
import path from "node:path";

console.log(path.basename("/tmp/report.pdf")); // report.pdf
console.log(path.dirname("/tmp/report.pdf"));  // /tmp
console.log(path.extname("report.pdf"));       // .pdf
```

Altri metodi utili:

- `path.resolve()`;
- `path.normalize()`;
- `path.parse()`;
- `path.format()`;
- `path.isAbsolute()`.

---
### `process.cwd()`
`process.cwd()` restituisce la cartella da cui e stato avviato il processo.

```js
console.log(process.cwd());
```

Non coincide sempre con la cartella del file corrente.

---
### Variabili d'ambiente
```js
const nodeEnv = process.env.NODE_ENV ?? "development";
const port = Number(process.env.PORT ?? 3000);
```

Le variabili d'ambiente sono stringhe o `undefined`.

Converti esplicitamente numeri e booleani.

---
### Argomenti CLI
`process.argv` contiene gli argomenti passati al comando.

```js
console.log(process.argv);
```

Esempio:

```powershell
node script.js --verbose
```

Per CLI complesse conviene usare un parser dedicato, ma capire `argv` e utile per script semplici.

---
### Exit code
```js
if (!process.env.API_KEY) {
  console.error("API_KEY mancante");
  process.exitCode = 1;
}
```

Preferisci `process.exitCode` a `process.exit()` quando vuoi lasciare completare cleanup e output pendenti.

---

## API / Sintassi

Import consigliato:

```js
import path from "node:path";
```

API `path` comuni:

```js
path.join("data", "users.json");
path.resolve("data", "users.json");
path.basename("/tmp/report.pdf");
path.dirname("/tmp/report.pdf");
path.extname("report.pdf");
path.parse("/tmp/report.pdf");
path.isAbsolute("/tmp/report.pdf");
```

API `process` comuni:

```js
process.cwd();
process.env.NODE_ENV;
process.argv;
process.exitCode = 1;
```

In moduli ES, per ottenere la cartella del file corrente usa `import.meta.url` insieme a `fileURLToPath`.

## Esempio pratico

Leggere configurazione da ambiente e costruire un percorso:

```js
import path from "node:path";
import { readFile } from "node:fs/promises";

const configDir = process.env.CONFIG_DIR ?? "config";
const configPath = path.resolve(process.cwd(), configDir, "app.json");

const config = JSON.parse(await readFile(configPath, "utf8"));

console.log(config);
```

`path.resolve` evita path relativi ambigui e `process.cwd()` rende esplicito che il percorso parte dalla cartella di avvio.

## Varianti

- **`path.join`**: compone segmenti e normalizza separatori.
- **`path.resolve`**: produce un percorso assoluto.
- **`path.posix`**: usa convenzioni POSIX anche su sistemi diversi.
- **`path.win32`**: usa convenzioni Windows.
- **`process.env`**: configurazione esterna al codice.
- **`process.argv`**: argomenti CLI grezzi.
- **`process.exitCode`**: segnala fallimento senza terminare subito il processo.

## Errori comuni

- Usare `/` o `\\` manualmente nei path.
- Confondere `process.cwd()` con la cartella del modulo.
- Dimenticare che `process.env` contiene stringhe.
- Usare `process.exit()` interrompendo cleanup asincroni.
- Stampare segreti letti da variabili d'ambiente.

---

## Checklist

### Checklist operativa
- Usa `node:path` per tutti i percorsi.
- Valida e converti variabili d'ambiente.
- Usa `process.cwd()` solo quando vuoi la cartella di avvio.
- Imposta `process.exitCode` per segnalare fallimento.
- Non loggare token, password o chiavi.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
