---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - nodejs
  - processi
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]"
  - "[[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]"
  - "[[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]"
  - "[[Programmazione/JavaScript/Pagine/Worker threads|Worker threads]]"
title: Child process
---

# Child process

## Sintesi

`node:child_process` avvia programmi esterni o altri processi Node.js. Il processo figlio ha memoria e lifecycle separati e comunica tramite standard input/output, codice di uscita o IPC.

Separato **non significa sandbox**: normalmente il figlio usa gli stessi privilegi dell'utente e puo accedere a file, rete e credenziali disponibili. Scegli esplicitamente programma, argomenti, ambiente e directory di lavoro.

## Quando usarlo

Usalo per tool CLI, build, programmi non JavaScript e lavoro da separare a livello di processo. Per calcoli JavaScript nello stesso processo valuta [[Programmazione/JavaScript/Pagine/Worker threads|Worker threads]]; per normale I/O asincrono non serve creare un processo.

Gli esempi sono file `.mjs` per Node.js **24.14.0**, senza dipendenze npm. Usano `process.execPath`, cioe il Node che sta eseguendo il padre, e script locali fidati: non presuppongono la presenza di comandi Unix o di `node` nel PATH.

## Come funziona

### Scegliere l'API

| API | Esecuzione | Output e uso |
| --- | --- | --- |
| `spawn` | Programma e array di argomenti | Stream o stdio ereditato; lavori progressivi |
| `execFile` | File eseguibile, senza shell di default | Callback/Promise con output accumulato |
| `exec` | Stringa interpretata da una shell | Output accumulato; sintassi e quoting della shell |
| `fork` | Nuovo processo Node con canale IPC | Messaggi oltre agli stream |
| API `Sync` | Blocca il thread chiamante | Solo dove il blocco e accettabile |

Con `shell: false`, `"*.txt"`, `"$HOME"`, pipe e redirezioni non vengono espansi dalla shell: sono argomenti letterali. Non aggiungere virgolette manualmente a un elemento dell'array perche contiene spazi; fanno parte dell'argomento e possono cambiarne il significato.

`execFile` non e intrinsecamente senza limiti: accumula stdout/stderr entro `maxBuffer`. `spawn` espone stream, ma accumularli in un array ricrea lo stesso problema. Usa `stdio: "inherit"` per mostrare direttamente l'output oppure una pipeline/backpressure e limiti appropriati se devi elaborarlo.

### Avvio, uscita e chiusura

| Evento | Significato | Cosa controllare |
| --- | --- | --- |
| `spawn` | Il programma e stato avviato | Non significa operazione riuscita |
| `error` | Errore di avvio, invio, kill o abort | Anche programma/cwd mancanti |
| `exit` | Il processo e terminato | Gli stream possono non essere ancora chiusi |
| `close` | Processo terminato e stdio chiuso | Esito finale con code e signal |

Su terminazione tramite segnale `code` puo essere `null`. Un normale `spawn` non emette `error` solo perche il figlio termina con codice 1: controlla `close`/`exit`. Al contrario, la Promise di `execFile` rifiuta anche per un codice non zero.

`stderr` non e sinonimo di fallimento: molti tool vi scrivono avvisi e progresso anche con exit code 0. Il contratto del programma stabilisce cosa rappresentano output e codici.

## API / Sintassi

### Argomenti separati non sono una sandbox

Non costruire stringhe come `"tool " + input` da affidare a `exec` o `shell: true`. Gli argomenti separati evitano l'interpretazione della shell, **non** opzioni pericolose del programma avviato: un input che inizia con `-` puo comunque essere interpretato dal tool. Usa allowlist, validazione e, quando il tool lo supporta, il separatore `--`.

Un percorso dell'eseguibile controllato dall'utente consente comunque di scegliere codice da eseguire. Anche script, cwd, PATH e variabili come `NODE_OPTIONS` possono cambiarne il comportamento. Non usare un ambiente ereditato indiscriminatamente per tool ai quali non vuoi consegnare segreti.

### Windows, npm e script shell

Su Windows `.cmd` e `.bat` richiedono un interprete: non sono eseguibili nativi da passare direttamente a `execFile`. Per questo `spawn("npm", ...)` non e un esempio portabile sufficiente. Avviare `cmd.exe` o abilitare una shell reintroduce le regole di quoting e i rischi di injection.

Per un tool Node, quando disponi del suo entry point JavaScript verificato, puoi avviarlo tramite `process.execPath` con quel file come argomento. Non indovinare un percorso npm universale: dipende dall'installazione. Nei demo seguenti gli entry point sono file creati appositamente nella stessa directory.

## Esempio pratico

### Due piccoli programmi figli

File `text-stats.mjs`. Legge un solo argomento e produce un piccolo JSON; il testo non viene eseguito ne usato come percorso.

```js
import { Buffer } from "node:buffer";

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].length > 4096) {
  console.error("Expected one text argument, maximum 4096 UTF-16 units");
  process.exitCode = 2;
} else {
  const text = args[0];
  if (text.length === 0) console.error("Empty text");
  console.log(JSON.stringify({
    codeUnits: text.length,
    utf8Bytes: Buffer.byteLength(text, "utf8"),
  }));
}
```

File `progress.mjs`. Simula tre avanzamenti temporizzati, non una build reale:

```js
import { setTimeout as delay } from "node:timers/promises";

for (let step = 1; step <= 3; step++) {
  await delay(100);
  console.log(`step ${step}/3`);
}
```

### Avvio e gestione dell'esito

Modulo `run-tools.mjs`, nella stessa directory dei due script:

```js
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const cwd = fileURLToPath(new URL(".", import.meta.url));

function childEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    /^(SystemRoot|WINDIR|TEMP|TMP)$/i.test(key),
  ));
}

export async function inspectText(text, { signal } = {}) {
  if (typeof text !== "string" || text.length > 4096) {
    throw new TypeError("Expected text up to 4096 UTF-16 units");
  }
  signal?.throwIfAborted();
  const script = fileURLToPath(new URL("./text-stats.mjs", import.meta.url));
  const { stdout, stderr } = await execFileAsync(process.execPath, [script, text], {
    cwd,
    env: childEnvironment(),
    shell: false,
    windowsHide: true,
    encoding: "utf8",
    timeout: 5_000,
    maxBuffer: 16 * 1024,
    signal,
  });
  const stats = JSON.parse(stdout);
  if (stats === null || typeof stats !== "object" || Array.isArray(stats) ||
      Object.keys(stats).length !== 2 ||
      !Number.isSafeInteger(stats.codeUnits) || stats.codeUnits < 0 ||
      !Number.isSafeInteger(stats.utf8Bytes) || stats.utf8Bytes < 0) {
    throw new TypeError("Unexpected child output");
  }
  return { stats, diagnostic: stderr.trim() };
}

export async function runProgress({ signal } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      fileURLToPath(new URL("./progress.mjs", import.meta.url)),
    ], {
      cwd,
      env: childEnvironment(),
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "inherit", "inherit"],
      timeout: 5_000,
      signal,
    });
    let failure;
    child.on("error", (error) => { failure ??= error; });
    child.once("close", (code, exitSignal) => {
      if (failure) reject(failure);
      else if (code === 0) resolve();
      else reject(new Error(`Child failed: code=${code}, signal=${exitSignal}`));
    });
  });
}
```

L'ambiente ridotto e una scelta dei demo: i programmi reali possono richiedere altre variabili, da aggiungere consapevolmente. `env` sostituisce l'ambiente del figlio, non lo integra automaticamente. Su Windows evita chiavi duplicate come `PATH` e `Path`.

`inspectText` usa buffering limitato e valida lo schema del risultato; non certifica la veridicita di un programma alterato. Gli argomenti di processo non possono contenere il carattere NUL: in quel caso Node rifiuta l'avvio. Per dati binari o testi voluminosi serve un protocollo su stdin o file, non un argomento illimitato. Un errore di `execFile` puo contenere `code`, `signal`, `stdout` e `stderr`: non riversarli automaticamente in risposte pubbliche o log con dati sensibili.

`runProgress` eredita stdout/stderr e non legge `child.stdout`, che in questa configurazione e `null`. Il listener `error` registra il problema e `close` conclude la Promise una sola volta, senza scambiare una richiesta di abort per la certezza che il processo sia gia chiuso.

### Uso completo

File `main.mjs`:

```js
import { inspectText, runProgress } from "./run-tools.mjs";

try {
  const { stats, diagnostic } = await inspectText("ciao mondo");
  console.log(JSON.stringify(stats));
  if (diagnostic) console.error(diagnostic);
  await runProgress();
  console.log("Completed");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Child operation failed");
  process.exitCode = 1;
}
```

```sh
node main.mjs
```

Output atteso: `{"codeUnits":10,"utf8Bytes":10}`, tre righe di progresso e `Completed`. **Effetto:** avvia due processi Node in sequenza; non modifica file e non contatta servizi esterni. Anche cwd con spazi e testo contenente metacaratteri rimangono dati, senza shell intermedia.

## Timeout, abort e segnali

`timeout` richiede la terminazione con il segnale configurato, normalmente SIGTERM. Un processo POSIX puo gestirlo o ignorarlo; su Windows la semantica e differente e la terminazione puo essere forzata. Non trattare questo valore come una deadline garantita di cleanup per qualunque programma.

Un AbortSignal puo interrompere `spawn`/`execFile`. Nel demo `runProgress` aspetta `close`; il rifiuto di una API su abort, da solo, non e una prova universale che tutti i processi siano terminati. `child.killed` indica l'invio riuscito di un segnale, non il completamento della terminazione.

I demo avviano soltanto script fidati che non creano discendenti e non intercettano i segnali. In generale terminare una shell o il figlio diretto non elimina automaticamente tutti i suoi discendenti. Alberi di processi, job object Windows, gruppi POSIX e procedure di escalation richiedono una policy specifica della piattaforma; non risolverli con cancellazioni o kill indiscriminate.

Non lasciare pipe di output non consumate: quando si riempiono possono bloccare il figlio. Se il programma legge da stdin, invia i dati rispettando la backpressure e chiudi stdin quando hai finito. In `runProgress`, il primo elemento `"ignore"` di `stdio` fornisce input vuoto al figlio; non esiste un'opzione `stdin: "ignore"` per `spawn`.

## Varianti

`fork` e una specializzazione per avviare un altro Node con un canale IPC, non il clone della memoria del padre come suggerirebbe il nome POSIX. Il figlio riceve messaggi tramite `process.on("message")`; il padre usa `child.send` e ascolta `message`. Valida tipo, identificatore e payload di ogni messaggio.

Il ritorno booleano di `send` e la callback riguardano il trasporto/backlog, non il completamento del lavoro remoto: serve una risposta applicativa. La serializzazione predefinita e basata su JSON; `serialization: "advanced"` abilita piu tipi supportati, non il trasferimento generale di qualsiasi oggetto. `disconnect` chiude IPC, non equivale a terminare il figlio.

Per task JavaScript frequenti considera worker riusabili; per processi frequenti considera un numero limitato di processi e una coda limitata. `detached` e `unref` cambiano lifecycle e attesa del padre, non forniscono un gestore di servizi o una sandbox.

## Errori comuni

- Concatenare dati in una stringa shell o consentire un eseguibile arbitrario.
- Credere che gli argomenti separati impediscano anche option injection.
- Confondere avviso su stderr, errore di avvio e exit code non zero.
- Leggere output senza limiti o lasciare pipe bloccate.
- Assumere che `npm`, comandi Unix e file `.cmd` si avviino allo stesso modo ovunque.
- Equiparare timeout, signal, killed e morte dell'intero albero di processi.
- Ereditare segreti, preload e PATH senza una decisione esplicita.

## Checklist

- Programma, script, cwd e argomenti hanno provenienza fidata e vincoli chiari.
- La shell e evitata oppure indispensabile e gestita esplicitamente.
- Output, stdin, errori e codice finale sono controllati.
- Ambiente e privilegi sono ridotti in modo compatibile con il programma.
- Limiti di output e policy di timeout/chiusura sono documentati.
- Compatibilita Windows/POSIX e processi discendenti sono valutati separatamente.

## Fonti

- [Node.js 24.14.0: Child process](https://nodejs.org/download/release/v24.14.0/docs/api/child_process.html).
- [Node.js 24.14.0: process e segnali](https://nodejs.org/download/release/v24.14.0/docs/api/process.html#signal-events).

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/Path e Process|Path e Process]]
- [[Programmazione/JavaScript/Pagine/Events Node.js|Events Node.js]]
- [[Programmazione/JavaScript/Pagine/Streams Node.js|Streams Node.js]]
- [[Programmazione/JavaScript/Pagine/Worker threads|Worker threads]]

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
