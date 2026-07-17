---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, modules, esm, commonjs, nodejs]
aliases: [ESM e CommonJS, Moduli TypeScript]
prerequisites: [tsconfig]
related: [Module resolution, TypeScript con Node.js]
---

# Moduli ES e CommonJS

## Sintesi

TypeScript supporta sia i moduli ES (`import` / `export`) sia CommonJS (`require` / `module.exports`), ma la scelta reale dipende da runtime, bundler, `package.json` e `tsconfig`.

Il punto critico e distinguere sintassi TypeScript, formato JavaScript emesso e regole di risoluzione dei moduli.

## Quando usarlo

- Quando configuri un progetto Node.js TypeScript.
- Quando pubblichi una libreria npm.
- Quando migri codice CommonJS a ESM.
- Quando usi bundler come Vite, Webpack, Rollup o esbuild.
- Quando incontri errori su import, default export o estensioni file.

## Come funziona

ESM e lo standard moderno di JavaScript. CommonJS e il sistema storico di Node.js. TypeScript puo leggere codice scritto con `import`, ma in base a `module` puo emettere ESM o CommonJS.

In Node.js moderno, anche il campo `"type"` in `package.json` influenza se i file `.js` sono interpretati come ESM o CommonJS.

## API / Sintassi

```ts
// ESM
import { readFile } from "node:fs/promises";
export function parse(value: string): string[] {
  return value.split(",");
}

// CommonJS
const fs = require("node:fs");
module.exports = { fs };
```

## Esempio pratico

```ts
// math.ts
export function sum(a: number, b: number): number {
  return a + b;
}

// app.ts
import { sum } from "./math";

console.log(sum(1, 2));
```

Con un bundler moderno questo import funziona normalmente. Con Node.js ESM puro possono servire estensioni nel codice emesso o configurazioni `NodeNext`.

## Varianti

- **ESM puro**: `module: "NodeNext"` o `ESNext`, package `"type": "module"`.
- **CommonJS**: `module: "CommonJS"`.
- **Bundler mode**: `moduleResolution: "Bundler"`.
- **Dual package**: libreria che pubblica sia ESM sia CommonJS.
- **Interop**: `esModuleInterop`, default import da pacchetti CommonJS.

## Errori comuni

- **Mescolare ESM e CommonJS senza strategia**: produce errori runtime difficili.
- **Pensare che TypeScript risolva tutto**: il runtime deve capire lo stesso formato.
- **Ignorare `package.json type`**: cambia interpretazione dei file `.js`.
- **Usare default import da CommonJS senza interop configurato**: puo fallire o produrre tipi fuorvianti.

## Checklist

- Decidere se il progetto emette ESM, CommonJS o usa bundler.
- Allineare `module`, `moduleResolution` e `package.json`.
- Controllare come il runtime esegue il codice compilato.
- Usare import coerenti con il formato scelto.
- Testare la build finale, non solo il type checking.

## Collegamenti

- [[tsconfig]]
- [[Module resolution]]
- [[TypeScript con Node.js]]
