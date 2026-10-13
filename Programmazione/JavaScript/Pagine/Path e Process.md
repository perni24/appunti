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
  - path
  - process
  - environment
aliases:
  - Path Node.js
  - Process Node.js
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics]]"
related:
  - "[[Programmazione/JavaScript/Pagine/File System fs]]"
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
title: Path e Process
---

# Path e Process

## Sintesi

`node:path` manipola **stringhe di percorso**; non apre file, non controlla che esistano e non assegna autorizzazioni. `process` descrive e controlla il processo Node corrente: directory di lavoro, argomenti, ambiente e uscita.

Gli esempi sono moduli `.mjs`, verificati con **Node.js 24.14.0**. Usa una versione supportata e aggiornata nel progetto reale. Per operazioni effettive sui file consulta [[Programmazione/JavaScript/Pagine/File System fs|File System fs]].

## Quando usarlo

- Costruire percorsi del filesystem senza concatenare separatori a mano.
- Distinguere file dell'applicazione da file scelti rispetto al terminale.
- Leggere opzioni CLI e configurazione d'ambiente con un contratto esplicito.
- Restituire alla shell/CI un codice di uscita utile senza perdere output.

Per URL web usa `URL`, non `path.join`: separatori, query, percent encoding e origine non sono regole del filesystem.

## Come funziona

### Join, resolve e normalizzazione

| API | Significato |
| --- | --- |
| `join` | Unisce e normalizza segmenti; puo restare relativo |
| `resolve` | Produce un assoluto, partendo da destra; se serve usa la cwd |
| `normalize` | Normalizza separatori e segmenti `.` / `..`, senza accesso al disco |
| `relative` | Percorso da una base all'altra; `""` per la stessa destinazione |
| `isAbsolute` | Controlla la forma, non l'esistenza o la sicurezza |
| `basename` / `dirname` / `extname` | Nome finale, directory e ultima estensione |
| `parse` / `format` | Scompone un percorso e lo ricompone da campi |

File indipendente `path-demo.mjs`. L'uso di `posix` rende questi risultati uguali anche su Windows:

```js
import path from "node:path";

console.log(path.posix.join("data", "users", "..", "users.json"));
// data/users.json
console.log(path.posix.resolve("/srv/app", "/tmp/report.pdf"));
// /tmp/report.pdf: l'ultimo segmento assoluto sostituisce la base
console.log(path.posix.normalize("/srv/app/../private/key.txt"));
// /srv/private/key.txt: normalizzare non confina il percorso
console.log(path.posix.relative("/srv/app", "/srv/app2/file.txt"));
// ../app2/file.txt
```

Non trattare `join` e `resolve` come sinonimi. Nessuno dei due risolve link simbolici: per il percorso effettivo di una voce esistente serve `fs.realpath`, che puo fallire e non elimina da solo le race condition successive.

### Windows, POSIX e nomi di file

Il `path` predefinito segue la piattaforma host. Se stai interpretando una stringa proveniente da un'altra piattaforma usa `path.win32` o `path.posix` esplicitamente. Non trasformare un percorso in minuscolo presumendo che ogni filesystem sia case-insensitive.

File indipendente `path-parts.mjs`:

```js
import path from "node:path";

const posixPath = "/tmp/report.pdf";
console.log(path.posix.basename(posixPath)); // report.pdf
console.log(path.posix.dirname(posixPath)); // /tmp
console.log(path.posix.extname(posixPath)); // .pdf
console.log(path.posix.format(path.posix.parse(posixPath))); // /tmp/report.pdf
console.log(path.win32.basename("C:/work/report.pdf")); // report.pdf
console.log(path.win32.isAbsolute("C:report.pdf")); // false
```

`C:report.pdf` e relativo alla directory corrente dell'unita C, non equivale a `C:/report.pdf`. `extname("archive.tar.gz")` restituisce `.gz`: l'estensione non certifica il formato del contenuto.

`path.sep` e il separatore dei segmenti; `path.delimiter` separa le voci di variabili come PATH. Sono due concetti diversi.

### Directory corrente e directory del modulo

`process.cwd()` e la directory di lavoro **corrente**, inizialmente stabilita da chi avvia il processo. `process.chdir()` puo modificarla per il processo; non e una proprieta privata del modulo. Librerie che cambiano cwd possono rompere operazioni altrui.

Gli import relativi ESM partono dal modulo importatore; i percorsi relativi passati a `fs` partono dalla cwd. Per risorse distribuite accanto al codice usa `import.meta.url`.

File indipendente `module-location.mjs`, che non legge ne scrive file:

```js
import process from "node:process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const resourceURL = new URL("./config/app.json", import.meta.url);
const examplePath = path.resolve("dati con spazi #1.txt");
const roundTrip = fileURLToPath(pathToFileURL(examplePath));

console.log(JSON.stringify({
  cwd: process.cwd(),
  moduleDir,
  resourcePath: fileURLToPath(resourceURL),
  samePath: roundTrip === examplePath,
}));
```

Puoi passare `resourceURL` direttamente a `readFile`. Non usare `.pathname` al posto di `fileURLToPath`: percent encoding, drive Windows e percorsi UNC richiedono conversione corretta. Per trasformare un percorso locale in URL usa `pathToFileURL`, non la concatenazione di `"file://"`.

### Un percorso normalizzato non e un percorso autorizzato

`resolve(base, input)` puo uscire da `base`, tramite `..` o un segmento assoluto. Anche `target.startsWith(base)` e insufficiente: `/srv/app2` inizia come `/srv/app`, ma non e una sua sottodirectory.

Un controllo lessicale usa, fra l'altro, `relative`, confini dei segmenti e rifiuto degli assoluti inattesi. Restano link simbolici, junction e cambiamenti tra controllo e apertura. Nemmeno `realpath` seguito da `readFile` costituisce una garanzia contro sostituzioni concorrenti in directory modificabili da altri.

Per file scelti da client remoti preferisci identificatori mappati a percorsi controllati dal server, permessi minimi e una strategia di isolamento adeguata. Gli esempi sotto accettano configurazione locale fidata: **non sono un filtro anti-path-traversal**.

## API / Sintassi

### Argomenti del processo

In un normale avvio da file, `process.argv` contiene eseguibile Node, percorso dello script e argomenti applicativi. `process.execArgv` contiene invece le opzioni del runtime.

`argv-demo.mjs`:

```js
import process from "node:process";

console.log(JSON.stringify({
  args: process.argv.slice(2),
  nodeOptions: process.execArgv,
}));
```

Dalla directory che contiene il file:

```sh
node --trace-warnings argv-demo.mjs --verbose "dati con spazi"
```

`--trace-warnings` e di Node; `--verbose` e una stringa per l'app. Il runtime non la converte da solo in un booleano. Le virgolette della shell mantengono il percorso con spazi in un singolo argomento.

Per CLI semplici la baseline include `parseArgs` da `node:util`; per interfacce piu articolate valuta un parser dedicato. Un parser sintattico non sostituisce i controlli sui valori.

### Variabili d'ambiente

Le variabili lette da `process.env` sono stringhe o `undefined`. `Number("")` vale 0 e `Boolean("false")` vale true: conversione e validazione sono passi distinti. `NODE_ENV` e una convenzione usata da applicazioni e strumenti, non un interruttore che cambia da solo tutta la sicurezza del programma.

Leggi e valida la configurazione all'avvio, poi passa i valori necessari alle funzioni. Non assegnare numeri/booleani a `process.env` per usarlo come oggetto di stato; per rimuovere una voce usa `delete process.env.NOME`, non l'assegnazione di `undefined`.

Il file `.env` non e caricato automaticamente da Node. Per il caricamento esplicito e la precedenza dell'ambiente vedi [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]. Non stampare l'intero `process.env` o un JSON di configurazione che potrebbe contenere segreti.

### Uscita e cleanup

`process.exitCode = 1` imposta lo stato finale, **non interrompe il flusso corrente** e non esegue il cleanup al posto tuo. Dopo una configurazione invalida devi anche fermare l'avvio con `throw`, `return` o un ramo appropriato.

`process.exit()` termina forzatamente e puo troncare output pendente. Per una CLI finita usa un catch al livello piu esterno e lascia terminare il processo. Server, connessioni e timer aperti richiedono invece chiusura esplicita. Un handler dell'evento `exit` non puo completare cleanup asincrono.

Per servizi gestisci i segnali di arresto appropriati al deployment: non presumere identica semantica su Windows e POSIX. Non nascondere un errore fatale per continuare in uno stato potenzialmente incoerente.

## Esempio pratico

### Configurazione con precedenza esplicita

Il demo legge un piccolo `app.json` locale, valida i campi usati e stampa solo un riepilogo. Non avvia un server; `port` dimostra il parsing, non prova che una porta sia disponibile.

Contratto:

- `--config` / `-c` indica una **directory**, non il file. Precede `CONFIG_DIR`, che precede il default `config`.
- `PORT` ammette cifre decimali e un valore da 1 a 65535; se assente vale 3000. La porta 0 e esclusa da questo contratto, anche se puo avere un uso valido di assegnazione automatica nei server.
- `VERBOSE` accetta solo `"true"` o `"false"`; il default e false. `--verbose` / `-v` attiva il valore e ha precedenza sull'ambiente.
- Opzioni sconosciute, argomenti posizionali e valori mancanti sono errori. Il demo non implementa `--help` o `--no-verbose`.

Struttura:

```text
path-process-demo/
  settings.mjs
  main.mjs
  config/
    app.json
```

`settings.mjs`:

```js
import process from "node:process";
import path from "node:path";
import { parseArgs } from "node:util";

export function parsePort(raw = "3000") {
  if (typeof raw !== "string" || !/^[0-9]+$/.test(raw)) {
    throw new TypeError("PORT deve contenere soltanto cifre decimali");
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError("PORT deve essere compresa fra 1 e 65535");
  }
  return port;
}

export function parseBoolean(raw = "false") {
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new TypeError("VERBOSE deve essere true oppure false");
}

export function readSettings(args, env, cwd = process.cwd()) {
  const { values } = parseArgs({
    args,
    options: {
      config: { type: "string", short: "c" },
      verbose: { type: "boolean", short: "v" },
    },
    strict: true,
    allowPositionals: false,
  });
  const directory = values.config ?? env.CONFIG_DIR ?? "config";
  if (typeof directory !== "string" || directory.trim() === "" || directory.includes("\0")) {
    throw new TypeError("La directory di configurazione deve essere non vuota e senza NUL");
  }
  return {
    configPath: path.resolve(cwd, directory, "app.json"),
    port: parsePort(env.PORT),
    verbose: values.verbose ?? parseBoolean(env.VERBOSE),
  };
}
```

Una directory assoluta e accettata intenzionalmente; una relativa parte dalla cwd. Il controllo non elimina spazi significativi dai nomi e non pretende di riconoscere ogni nome vietato da ogni filesystem.

`main.mjs`:

```js
import process from "node:process";
import { readFile } from "node:fs/promises";
import { readSettings } from "./settings.mjs";

async function main() {
  const settings = readSettings(process.argv.slice(2), process.env);
  const config = JSON.parse(await readFile(settings.configPath, "utf8"));
  if (
    config === null || typeof config !== "object" || Array.isArray(config) ||
    typeof config.appName !== "string" || config.appName.trim() === ""
  ) {
    throw new TypeError("Configurazione: appName deve essere una stringa non vuota");
  }
  console.log(JSON.stringify({
    appName: config.appName,
    port: settings.port,
    verbose: settings.verbose,
  }));
}

main().catch((error) => {
  console.error("Avvio fallito:", error?.code ?? error?.name ?? "errore");
  process.exitCode = 1;
});
```

`config/app.json`:

```json
{
  "appName": "demo"
}
```

### Avvio

Dalla directory del demo, con `PORT`, `VERBOSE` e `CONFIG_DIR` non impostate:

```sh
node main.mjs
```

Risultato:

```json
{"appName":"demo","port":3000,"verbose":false}
```

Con opzioni esplicite:

```sh
node main.mjs --config config --verbose
```

Il risultato ha `verbose: true`. Per provare una directory con spazi crea prima il relativo `app.json`:

```sh
node main.mjs --config "config di prova"
```

Per una CLI reale aggiungi diagnostica mirata e una guida alle opzioni. Questo demo stampa soltanto il tipo/codice dell'errore per non riportare accidentalmente il contenuto del JSON nel messaggio di un errore di parsing. Leggi i dettagli completi solo in un contesto di sviluppo controllato.

## Varianti

- **Risorsa accanto al codice**: URL costruita da `import.meta.url`, indipendente dalla cwd.
- **File scelto dall'operatore**: percorso relativo alla cwd o assoluto, secondo contratto dichiarato.
- **Configurazione di deploy**: variabili d'ambiente validate prima di aprire risorse.
- **CLI**: parser per le opzioni, output su stdout e diagnostica su stderr.
- **Stringhe di percorsi esterni**: `path.posix` / `win32` espliciti; non confonderli con accesso reale a quel filesystem.

## Errori comuni

| Errore | Correzione |
| --- | --- |
| `resolve` considerato un filtro di sicurezza | Distingui costruzione del percorso da autorizzazione e isolamento |
| Confronto con un semplice prefisso | Considera confini, link e race condition |
| Percorso del modulo uguale alla cwd | Usa `import.meta.url` per le risorse dell'app |
| URL costruita con `path.join` | Usa `URL` e, per file locali, le conversioni `node:url` |
| `Boolean("false")` usato per un flag | Definisci valori testuali accettati e rifiuta gli altri |
| `exitCode` seguito dall'avvio del server | Interrompi esplicitamente il flusso che non deve proseguire |
| Log dell'intero ambiente/config | Stampa solo campi non riservati e diagnostica selezionata |

## Checklist

- Dichiara se ogni percorso e relativo alla cwd, al modulo o a un'altra base.
- Scegli semantica host, POSIX, Windows o URL in modo esplicito.
- Definisci precedenza e schema di CLI, ambiente e default.
- Non correggere silenziosamente input invalidi con fallback troppo permissivi.
- Separa validazione dei dati, esistenza del file e autorizzazione all'accesso.
- Ferma l'avvio su errore; chiudi le risorse prima dell'uscita normale.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]
- [[Programmazione/JavaScript/Pagine/File System fs|File System fs]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Child process|Child process]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## Fonti

Verifica tecnica: 2026-10-08, baseline Node.js 24.14.0. Gli esempi non sono una sandbox, una matrice di filesystem o un collaudo di segnali/shutdown multipiattaforma.

- [Node.js 24.14.0: Path](https://nodejs.org/download/release/v24.14.0/docs/api/path.html) e [guida ai percorsi](https://nodejs.org/en/learn/manipulating-files/nodejs-file-paths).
- [Node.js 24.14.0: Process](https://nodejs.org/download/release/v24.14.0/docs/api/process.html) e [variabili d'ambiente](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs).
- [Node.js 24.14.0: URL e conversione dei percorsi](https://nodejs.org/download/release/v24.14.0/docs/api/url.html).
- [Node.js 24.14.0: util.parseArgs](https://nodejs.org/download/release/v24.14.0/docs/api/util.html#utilparseargsconfig).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
