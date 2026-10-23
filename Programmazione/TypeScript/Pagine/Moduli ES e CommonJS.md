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
  - modules
  - esm
  - commonjs
  - nodejs
aliases:
  - ESM e CommonJS
  - Moduli TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Module resolution]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
title: Moduli ES e CommonJS
---

# Moduli ES e CommonJS

## Sintesi

ESM e CommonJS sono sistemi di moduli distinti. La sintassi del sorgente TypeScript non basta per sapere cosa eseguira Node: contano estensioni, `package.json` e opzioni del compilatore.

Gli esempi usano TypeScript **5.9.3**, Node **24.14.0** e JavaScript compilato con `tsc`.

## Quando usarlo

- Configurare un backend Node o migrare da CommonJS a ESM.
- Diagnosticare `require is not defined`, import mancanti o export inattesi.
- Pubblicare una libreria, controllando separatamente i formati offerti.

## Come funziona

Con `module: "NodeNext"` il formato viene determinato **per file**, non imposto a tutto il progetto:

| Sorgente | Output | Interpretazione |
| --- | --- | --- |
| `.mts` | `.mjs` | ESM |
| `.cts` | `.cjs` | CommonJS |
| `.ts` | `.js` | Dipende dal `"type"` del `package.json` piu vicino |

Per i normali `.ts`, dichiara esplicitamente `"type": "module"` o `"type": "commonjs"`. In questo modello, senza `"type": "module"`, TypeScript tratta il file come CommonJS. Non affidarti al rilevamento automatico della sintassi JavaScript di alcune versioni Node.

I file `.d.ts`, `.d.mts` e `.d.cts` descrivono tipi: non sono implementazioni eseguibili.

## API / Sintassi

In ESM si usano `import` / `export`. Gli import relativi eseguiti da Node richiedono l'estensione del file JavaScript, anche se il sorgente e TypeScript: `"./math.js"` puo risolversi a `math.ts` durante il controllo. Il testo dell'import rimane `"./math.js"` nell'output.

Con `import type` si importa soltanto un tipo; l'import viene eliminato e non carica il modulo a runtime. Per richiedere esplicitamente effetti collaterali serve un import di valore o `import "./setup.js"`.

## Esempio pratico

Prerequisiti: `typescript` e `@types/node` locali. Comandi dalla radice del progetto.

`package.json` minimo:

```json
{
  "private": true,
  "type": "module"
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
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

`src/math.ts`:

```ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

`src/app.ts`:

```ts
import { sum } from "./math.js";

console.log(sum(1, 2));
```

Compila:

```sh
npm exec -- tsc -p tsconfig.json
```

Esegui: stampa `3`.

```sh
node dist/app.js
```

Cambiare l'import in `"./math"` non e equivalente: il compilatore segnala l'estensione mancante in questo progetto ESM. `NodeNext` non aggiunge automaticamente `.js` agli import senza estensione.

## Varianti

### CommonJS esplicito nello stesso progetto

Aggiungi `src/math.cts`:

```ts
function sum(a: number, b: number): number {
  return a + b;
}

export = { sum };
```

Aggiungi `src/app.cts`:

```ts
import math = require("./math.cjs");

console.log(math.sum(1, 2));
```

Ricompila con lo stesso comando ed esegui l'output CommonJS: stampa `3`.

```sh
node dist/app.cjs
```

Questi sono file separati dall'esempio ESM. Non copiare `module.exports` in un file che Node carichera come ESM.

### Bundler e interoperabilita

- `module: "ESNext"` con `moduleResolution: "Bundler"` e adatto a una pipeline che gestisce gli import; non prova che l'output non elaborato parta in Node.
- `verbatimModuleSyntax` rende esplicita la distinzione tra import di tipi e valori e impedisce certe conversioni implicite ESM/CommonJS. Non va attivato senza controllare il formato dei file.
- `esModuleInterop` riguarda controlli e helper di emissione in determinati formati; non modifica il loader ESM nativo di Node.
- Importando CommonJS da ESM in Node, il default rappresenta `module.exports`; gli export nominati dipendono da analisi euristiche e non sono sempre disponibili.
- In Node 24, `require()` puo caricare alcuni moduli ESM sincroni, ma non un grafo con top-level `await`. `import()` offre il caricamento asincrono anche da CommonJS.
- Una libreria dual-package richiede due output coerenti, dichiarazioni compatibili ed export map testate: non basta cambiare un solo flag.

## Errori comuni

- Confondere il formato dei moduli con la versione della sintassi scelta da `target`.
- Omettere il `package.json` necessario quando si distribuisce `dist`.
- Usare `import type` aspettandosi l'esecuzione di inizializzazioni.
- Correggere soltanto l'editor senza eseguire gli artefatti finali.

## Checklist

- Ogni file ha un formato riconoscibile da compilatore e runtime?
- Gli import relativi ESM puntano a estensioni eseguibili?
- Tipi e valori sono importati intenzionalmente?
- Hai provato il pacchetto distribuito, non solo il sorgente?

## Fonti

- [TypeScript: moduli e formati Node](https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-node18-node20-nodenext)
- [TypeScript: verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html)
- [Node 24.14.0: moduli ESM e interoperabilita](https://nodejs.org/download/release/v24.14.0/docs/api/esm.html)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/Module resolution|Module resolution]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
