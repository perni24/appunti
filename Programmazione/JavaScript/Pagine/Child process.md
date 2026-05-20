---
date: 2026-05-20
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

## Concetto chiave

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

## API comuni

- `spawn`: adatto a output streaming.
- `exec`: comodo per comandi brevi con output bufferizzato.
- `execFile`: esegue un file senza shell.
- `fork`: avvia un processo Node con canale IPC.

## Sicurezza

Evita di concatenare input utente dentro comandi shell. Preferisci `spawn` o `execFile` con argomenti separati.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams]]


