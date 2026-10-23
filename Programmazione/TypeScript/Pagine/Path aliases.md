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
  - path-aliases
  - tsconfig
  - module-resolution
aliases:
  - Path alias TypeScript
  - paths
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
  - "[[Programmazione/TypeScript/Pagine/Module resolution]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
  - "[[Programmazione/TypeScript/Pagine/TypeScript monorepo]]"
title: Path aliases
---

# Path aliases

## Sintesi

Un alias abbrevia un import, per esempio `@/shared/label`. L'opzione TypeScript `paths` insegna al compilatore dove cercare i tipi, **ma non riscrive gli import emessi**.

Deve esistere una risoluzione corrispondente nel bundler o nel runtime. Gli esempi usano TypeScript **5.9.3**, esbuild **0.27.3** e Node **24.14.0**.

## Quando usarlo

- Percorsi relativi profondi rendono difficili da leggere gli import.
- La toolchain supporta esplicitamente la stessa mappatura.
- Vuoi un piccolo insieme di prefissi stabili per le cartelle principali.

Per file vicini un import relativo rimane spesso piu chiaro. Un alias non impone confini architetturali e non impedisce dipendenze circolari.

## Come funziona

`paths` associa pattern di import a percorsi. `baseUrl` **non e necessario**: senza di esso i target sono relativi al file di configurazione che definisce la mappatura. Se lo imposti, cambi anche la base usata nella risoluzione: non aggiungerlo per abitudine.

Per `"@/*": ["./src/*"]`, l'import `@/shared/label` fa cercare il modulo sotto `src/shared/label`. La sintassi `@` non ha alcun significato speciale per Node.

## API / Sintassi

Progetto per un bundler; `tsconfig.json` completo:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Esempio pratico

Prerequisiti: `typescript` ed `esbuild` installati localmente. Comandi dalla radice del progetto.

`src/shared/label.ts`:

```ts
export function label(name: string): string {
  return "Ciao " + name;
}
```

`src/app.ts`:

```ts
import { label } from "@/shared/label";

console.log(label("Ada"));
```

Controlla i tipi:

```sh
npm exec -- tsc -p tsconfig.json
```

Crea un bundle ESM per Node:

```sh
npm exec -- esbuild src/app.ts --bundle --platform=node --format=esm --target=node24 --outfile=dist/app.mjs
```

esbuild legge `paths` dal `tsconfig.json` durante il bundling; `--bundle` e essenziale per questa risoluzione. esbuild **non esegue il type checking**, quindi non sostituisce il comando precedente.

Esegui il bundle: stampa `Ciao Ada`.

```sh
node dist/app.mjs
```

Se invece abiliti l'emissione di `tsc`, nell'output resta `@/shared/label`: Node, senza una soluzione aggiuntiva, non sa dove trovarlo. Il fatto che l'editor navighi al file non prova che il programma parta.

## Varianti

### Alias nativi Node con package imports

Per un backend compilato senza bundler puoi usare `imports` del `package.json`, con prefissi che iniziano per `#`. Questo e un **progetto alternativo**, non un alias da aggiungere a quello precedente.

`package.json` minimo:

```json
{
  "private": true,
  "type": "module",
  "imports": {
    "#shared/*": "./dist/shared/*.js"
  }
}
```

`tsconfig.json`, con `typescript` e `@types/node` locali:

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

Mantieni lo stesso `src/shared/label.ts` e sostituisci `src/app.ts` con:

```ts
import { label } from "#shared/label";

console.log(label("Ada"));
```

TypeScript puo ricondurre il target di output al sorgente locale usando `rootDir` e `outDir`; Node legge lo stesso `imports` per trovare il file compilato. Non serve `paths` in questo esempio.

Compila:

```sh
npm exec -- tsc -p tsconfig.json
```

Esegui: stampa ancora `Ciao Ada`.

```sh
node dist/app.js
```

Distribuisci anche il `package.json`, mantenendo i percorsi coerenti con `dist`. Una cartella di soli file JavaScript privata di quella mappatura non e equivalente.

### Pacchetti e altri strumenti

Per librerie e workspace, preferisci nomi di pacchetto e `exports` pubblici. Un alias ai sorgenti di un altro package puo aggirarne le condizioni di esportazione e nascondere errori della distribuzione reale.

Non tutti i bundler, test runner o resolver ESLint leggono automaticamente `tsconfig.paths`: verifica la versione e la configurazione di ciascun tool. La configurazione esbuild mostrata non si trasferisce automaticamente a Vite o Jest.

## Errori comuni

- Pensare che `paths` modifichi l'output di `tsc`.
- Configurare l'alias nel bundler ma non nei test, o viceversa.
- Pubblicare dichiarazioni che contengono alias privati irrisolvibili dai consumatori.
- Moltiplicare i prefissi senza un vantaggio concreto nella navigazione.

## Checklist

- Chi risolve l'alias: compilatore, bundler o runtime?
- Il progetto parte da una build nuova senza dipendere dall'editor?
- Gli strumenti di test e lint conoscono la mappatura necessaria?
- Il pacchetto distribuito contiene tutti i metadati richiesti?

## Fonti

- [TypeScript: paths](https://www.typescriptlang.org/tsconfig/paths.html)
- [esbuild: opzioni tsconfig supportate](https://esbuild.github.io/content-types/#tsconfig-json)
- [TypeScript: package imports](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-imports-and-self-name-imports)
- [Node 24.14.0: subpath imports](https://nodejs.org/download/release/v24.14.0/docs/api/packages.html#subpath-imports)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/Module resolution|Module resolution]]
- [[Programmazione/TypeScript/Pagine/TypeScript monorepo|TypeScript monorepo]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
