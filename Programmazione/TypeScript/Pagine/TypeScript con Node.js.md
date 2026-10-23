---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - nodejs
  - backend
  - esm
  - commonjs
aliases:
  - Node.js con TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
  - "[[Programmazione/TypeScript/Pagine/Module resolution]]"
related:
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Express-Fastify]]"
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Source maps e debugging]]"
title: TypeScript con Node.js
---

# TypeScript con Node.js

## Sintesi

Node esegue il programma, TypeScript ne controlla i tipi. Puoi distribuire JavaScript compilato oppure scegliere un esecutore TypeScript con limiti espliciti: nessuna delle due scelte valida automaticamente file, ambiente o rete.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, **@types/node 24.19.2**. La versione dei tipi non installa API nel runtime; gli esempi usano soltanto API provate su Node 24.14.0.

## Quando usarlo

- CLI, script, worker e servizi backend.
- Progetti in cui import, build e distribuzione devono essere riproducibili.
- Codice che legge configurazioni esterne e deve gestirne gli errori.

## Come funziona

Il percorso principale di questa nota e `tsc -> dist -> node`. `package.json` dichiara ESM, `NodeNext` segue le regole dei moduli Node e gli import relativi usano l'estensione runtime `.js` anche nel sorgente `.ts`.

I tipi Node descrivono API e globali; non servono i tipi DOM per una CLI. Un path alias del checker non viene riscritto automaticamente nell'output. Il working directory e distinto dalla directory del modulo.

## API / Sintassi

Progetto separato, `package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node --enable-source-maps dist/main.js"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "24.19.2"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "module": "NodeNext",
    "strict": true,
    "verbatimModuleSyntax": true,
    "noEmitOnError": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## Esempio pratico

La CLI legge un file locale scelto dall'operatore, controlla una porta e la stampa. Non avvia un server e non modifica il file.

`src/config.ts`:

```ts
import { readFile } from "node:fs/promises";

export type Config = { port: number };

export function parseConfig(data: unknown): Config {
  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data) ||
    !Object.hasOwn(data, "port") ||
    !("port" in data) ||
    typeof data.port !== "number" ||
    !Number.isInteger(data.port) ||
    data.port < 1 ||
    data.port > 65535
  ) {
    throw new TypeError("Invalid port configuration");
  }
  return { port: data.port };
}

export async function loadConfig(file: string): Promise<Config> {
  const text = await readFile(file, "utf8");
  const data: unknown = JSON.parse(text);
  return parseConfig(data);
}
```

`src/main.ts`:

```ts
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: node dist/main.js <config.json>");
    process.exitCode = 2;
    return;
  }
  const file = args[0];
  if (file === undefined) throw new Error("Missing argument");

  try {
    const config = await loadConfig(file);
    console.log("Port: " + config.port);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON");
    } else if (error instanceof TypeError) {
      console.error("Invalid configuration");
    } else {
      console.error("Cannot read configuration");
    }
    process.exitCode = 1;
  }
}

await main();
```

`config.json`:

```json
{ "port": 8080 }
```

Installare:

```sh
npm install
```

Compilare:

```sh
npm run build
```

Eseguire dalla radice del progetto; risultato `Port: 8080`:

```sh
npm start -- config.json
```

Conserva il lockfile e usa `npm ci` nelle installazioni successive. Il percorso relativo del file parte dal working directory, non da `dist`.

### Garanzie e limiti

La configurazione accetta soltanto una porta numerica intera nell'intervallo dichiarato, non `"8080"`, `0` o una frazione. Gli extra sono ignorati tramite proiezione. Per env vars, che sono stringhe o assenti, usa un parser dedicato invece di `Number(process.env.PORT)` senza controlli.

`readFile` legge tutto il contenuto: il demo e per piccoli file locali fidati quanto a dimensione e percorso. Non e un endpoint per caricare file arbitrari; servono limiti e autorizzazione dei percorsi in quel caso. Il messaggio d'errore e volutamente generico e non include il payload.

## Varianti

### Esecuzione TypeScript nativa

Node 24.14.0 puo eseguire sintassi TypeScript cancellabile senza type checking, con type stripping stabile. Non legge `tsconfig`, non risolve `paths` e non supporta TSX. Nella modalita predefinita costrutti che richiedono generazione di codice, come enum e parameter properties, non sono accettati.

Per un progetto nativo separato, gli import relativi puntano ai file `.ts` reali. Non eseguire direttamente `src/main.ts` di questo demo: importa `./config.js`, che esiste soltanto nell'output. Opzioni come `erasableSyntaxOnly` e un controllo `tsc --noEmit` aiutano ad allineare il sorgente alla modalita scelta.

### Loader, bundler e CommonJS

Un loader come tsx o un bundler puo trasformare piu sintassi, ma il checker resta una fase distinta. Verifica strumenti disponibili in produzione, formati, dipendenze esterne e source map. CommonJS rimane una scelta valida se configurazione ed estensioni sono coerenti; ESM non e imposto da TypeScript.

## Errori comuni

- Confondere esecuzione nativa con validazione statica.
- Eseguire artefatti vecchi dopo una build fallita: `noEmitOnError` non cancella `dist`.
- Importare sorgenti o alias che il runtime non risolve.
- Supporre che il tipo Node scelto certifichi tutte le API della propria versione runtime.
- Convertire input prima di verificarne il contratto o registrare dati riservati negli errori.

## Checklist

- Moduli, estensioni e entry point sono coerenti?
- La build e il controllo dei tipi fanno parte della CI?
- File ed env vars sono validati?
- Percorsi, dimensioni e codici di uscita sono espliciti?
- Ho provato il comando Node sull'output reale?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]
- [[Programmazione/TypeScript/Pagine/Parsing sicuro di input esterni|Parsing sicuro di input esterni]]
- [[Programmazione/TypeScript/Pagine/Source maps e debugging|Source maps e debugging]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Express-Fastify|TypeScript con Express/Fastify]]

## Fonti

- [Node 24.14.0 - TypeScript](https://nodejs.org/download/release/v24.14.0/docs/api/typescript.html)
- [Node 24.14.0 - File System](https://nodejs.org/download/release/v24.14.0/docs/api/fs.html)
- [TypeScript - Moduli Node](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-node20-nodenext)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
