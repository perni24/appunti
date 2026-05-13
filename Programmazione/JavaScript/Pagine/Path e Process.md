---
date: 2026-05-13
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

## Perche usare `node:path`

Costruire percorsi concatenando stringhe e fragile, soprattutto tra Windows, Linux e macOS.

```js
import path from "node:path";

const filePath = path.join("data", "users", "users.json");
```

`path.join` usa il separatore corretto per il sistema operativo.

---

## Metodi principali di path

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

## `process.cwd()`

`process.cwd()` restituisce la cartella da cui e stato avviato il processo.

```js
console.log(process.cwd());
```

Non coincide sempre con la cartella del file corrente.

---

## Variabili d'ambiente

```js
const nodeEnv = process.env.NODE_ENV ?? "development";
const port = Number(process.env.PORT ?? 3000);
```

Le variabili d'ambiente sono stringhe o `undefined`.

Converti esplicitamente numeri e booleani.

---

## Argomenti CLI

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

## Exit code

```js
if (!process.env.API_KEY) {
  console.error("API_KEY mancante");
  process.exitCode = 1;
}
```

Preferisci `process.exitCode` a `process.exit()` quando vuoi lasciare completare cleanup e output pendenti.

---

## Errori comuni

- Usare `/` o `\\` manualmente nei path.
- Confondere `process.cwd()` con la cartella del modulo.
- Dimenticare che `process.env` contiene stringhe.
- Usare `process.exit()` interrompendo cleanup asincroni.
- Stampare segreti letti da variabili d'ambiente.

---

## Checklist operativa

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
