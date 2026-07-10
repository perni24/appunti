---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, nodejs, backend, esm, commonjs]
aliases: [Node.js con TypeScript]
prerequisites: [tsconfig, Moduli ES e CommonJS, Module resolution]
related: [TypeScript con Express-Fastify, API tipizzate, Source maps e debugging]
---

# TypeScript con Node.js

## Sintesi

TypeScript con Node.js permette di scrivere backend, script, CLI e servizi con type checking statico, mantenendo l'esecuzione su runtime JavaScript.

Le decisioni piu importanti sono formato moduli, strategia di build, gestione source map, tipizzazione di variabili ambiente e validazione degli input.

## Quando usarlo

- Backend HTTP.
- Worker e job asincroni.
- CLI tool.
- Script di automazione.
- Librerie npm.
- Servizi che integrano database, queue o API esterne.

## Come funziona

Il codice `.ts` viene controllato da TypeScript e poi eseguito dopo compilazione, tramite loader/transpiler o tramite bundler. In produzione conviene avere una strategia chiara: compilare a `dist`, usare ESM/CommonJS coerente e non dipendere da tool di sviluppo.

## API / Sintassi

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  }
}
```

## Esempio pratico

```ts
import { readFile } from "node:fs/promises";

type Config = {
  port: number;
};

async function loadConfig(path: string): Promise<Config> {
  const raw = await readFile(path, "utf8");
  const data: unknown = JSON.parse(raw);

  if (
    typeof data === "object" &&
    data !== null &&
    "port" in data &&
    typeof data.port === "number"
  ) {
    return { port: data.port };
  }

  throw new Error("Config non valida");
}
```

Anche in Node.js i dati letti da file restano input runtime da validare.

## Varianti

- **Compilazione con `tsc`**: semplice e prevedibile.
- **Esecuzione dev con loader/transpiler**: utile in sviluppo.
- **Bundling server-side**: riduce file e dipendenze distribuite.
- **ESM**: moderno ma richiede configurazione coerente.
- **CommonJS**: ancora presente in molte codebase.

## Errori comuni

- **Mescolare ESM e CommonJS senza capire il runtime**.
- **Usare path alias solo in TypeScript**: Node non li risolve automaticamente.
- **Saltare la validazione di env vars e JSON**.
- **Eseguire TypeScript in produzione con tool pensati per dev senza motivo**.
- **Non generare source map**: debugging piu difficile.

## Checklist

- Scegliere ESM o CommonJS esplicitamente.
- Allineare `tsconfig`, `package.json` e script npm.
- Validare env vars e file di configurazione.
- Generare source map se servono stack trace leggibili.
- Separare build di sviluppo e produzione.

## Collegamenti

- [[Moduli ES e CommonJS]]
- [[Module resolution]]
- [[Programmazione/TypeScript/Pagine/Source maps e debugging|Source maps e debugging]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Express-Fastify|TypeScript con Express/Fastify]]
