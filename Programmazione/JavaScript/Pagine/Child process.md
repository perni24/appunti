---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - javascript
  - nodejs
  - processi
aliases: []
prerequisites: []
related: []
---

# Child process

## Sintesi

Il modulo `node:child_process` permette a Node.js di avviare comandi esterni o altri processi. E utile per integrare tool di sistema, script, build step e programmi CLI.

## Quando usarlo

Usa `child_process` quando Node.js deve delegare lavoro a un programma esterno o a un processo separato.

Casi tipici:

- chiamare tool CLI;
- eseguire script di build;
- integrare programmi non scritti in JavaScript;
- processare output streaming;
- isolare un task dal processo principale.

Per lavoro CPU-bound scritto in JavaScript valuta anche `worker_threads`.

## Come funziona

### Concetto chiave
Un processo figlio e separato dal processo Node principale. Comunica tramite stream, exit code o IPC.

```javascript
import { spawn } from "node:child_process";

const child = spawn("node", ["--version"]);

child.stdout.on("data", chunk => {
  console.log(chunk.toString());
});

child.on("close", code => {
  console.log(`exit code: ${code}`);
});
```
### Sicurezza
Evita di concatenare input utente dentro comandi shell. Preferisci `spawn` o `execFile` con argomenti separati.

## API / Sintassi

### API comuni
- `spawn`: adatto a output streaming.
- `exec`: comodo per comandi brevi con output bufferizzato.
- `execFile`: esegue un file senza shell.
- `fork`: avvia un processo Node con canale IPC.

## Esempio pratico

Esempio con `spawn`, adatto a output progressivo:

```javascript
import { spawn } from "node:child_process";

const child = spawn("npm", ["run", "build"], {
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

child.on("close", (code) => {
  if (code !== 0) {
    console.error(`Build fallita con exit code ${code}`);
  }
});
```

## Varianti

- **spawn**: output streaming, adatto a processi lunghi.
- **exec**: comodo per comandi brevi, ma usa una shell e bufferizza output.
- **execFile**: esegue un file senza shell, piu sicuro con argomenti separati.
- **fork**: avvia un processo Node.js con canale IPC.
- **worker_threads**: thread nello stesso processo, utile per CPU-bound JavaScript.

## Errori comuni

- Concatenare input utente dentro una stringa di shell.
- Ignorare `stderr` ed exit code.
- Usare `exec` per output molto grande, rischiando limiti di buffer.
- Non gestire timeout o cancellazione del processo.
- Presumere che il comando esista su tutti i sistemi operativi.

## Checklist

- Preferisci argomenti separati invece di stringhe shell.
- Usa `execFile` o `spawn` quando possibile.
- Gestisci `stdout`, `stderr`, `error` e `close`.
- Controlla exit code.
- Imposta timeout per processi potenzialmente lunghi.
- Valuta compatibilita cross-platform del comando.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams]]
