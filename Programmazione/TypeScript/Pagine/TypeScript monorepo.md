---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - monorepo
  - project-references
  - workspace
aliases:
  - Monorepo TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Project references]]"
  - "[[Programmazione/TypeScript/Pagine/Path aliases]]"
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Generazione di tipi da API]]"
title: TypeScript monorepo
---

# TypeScript monorepo

## Sintesi

Un monorepo contiene piu applicazioni e package nello stesso repository. Workspace npm, project references TypeScript ed export map risolvono problemi diversi: installazione, ordine della build e superficie pubblica del package.

Baseline: **TypeScript 5.9.3**, **Node 24.14.0**, npm **11**, **@types/node 24.19.2**. Il demo ha due workspace Node ESM; non pretende di configurare anche un'app browser.

## Quando usarlo

- App e librerie interne con dipendenze chiare.
- Refactor coordinati e contratti condivisi.
- Build separate con un grafo senza cicli.
- Progetti in cui il costo di piu configurazioni e giustificato.

## Come funziona

Un workspace rende un package locale disponibile per nome dopo l'installazione. La dipendenza nel `package.json` descrive cosa usa il consumer. La reference nel `tsconfig` permette a `tsc -b` di costruire prima il progetto richiesto.

Nessuno dei due meccanismi sostituisce l'altro. Un alias `paths` non installa o collega un package e non riscrive automaticamente gli import runtime. `exports` rende espliciti gli entry point, ma non e una sandbox contro accessi diretti al filesystem.

## API / Sintassi

Struttura completa del demo:

```text
monorepo/
  package.json
  tsconfig.json
  tsconfig.base.json
  packages/domain/
    package.json
    tsconfig.json
    src/index.ts
  apps/api/
    package.json
    tsconfig.json
    src/main.ts
```

Puoi aggiungere in seguito `apps/web`, `packages/ui` o configurazioni condivise. Non elencarli nelle references finche non esistono e non hanno la configurazione necessaria.

## Esempio pratico

### Root

`package.json`:

```json
{
  "name": "notes-workspace-demo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "tsc -b --stopBuildOnErrors",
    "start": "npm run start --workspace @notes/api"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/node": "24.19.2"
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": [],
    "module": "NodeNext",
    "strict": true,
    "verbatimModuleSyntax": true,
    "composite": true,
    "declaration": true,
    "noEmitOnError": true
  }
}
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./packages/domain" }, { "path": "./apps/api" }]
}
```

### Package di dominio

`packages/domain/package.json`:

```json
{
  "name": "@notes/domain",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

`packages/domain/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

`packages/domain/src/index.ts`:

```ts
export function greeting(name: string): string {
  return "Ciao " + name;
}
```

### Applicazione consumatrice

`apps/api/package.json`:

```json
{
  "name": "@notes/api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": { "start": "node dist/main.js" },
  "dependencies": { "@notes/domain": "1.0.0" }
}
```

`apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src"],
  "references": [{ "path": "../../packages/domain" }]
}
```

`apps/api/src/main.ts`:

```ts
import { greeting } from "@notes/domain";

console.log(greeting("Ada"));
```

La cartella si chiama api, ma il demo esegue soltanto una CLI: non implementa un server HTTP.

### Installazione, build e avvio

Dalla root del demo:

```sh
npm install
```

```sh
npm run build
```

```sh
npm start
```

Risultato: `Ciao Ada`. npm collega il package locale con versione compatibile; `tsc` genera JS e dichiarazioni in entrambi i `dist`. Non importiamo `../../domain/src` dal consumer.

Conserva il lockfile della root. In un checkout pulito:

```sh
npm ci
```

Poi ripeti la build. Gli output e le cache `.tsbuildinfo` non sostituiscono i sorgenti; non distribuire output precedenti dopo una build fallita.

Per costruire solo l'app e le sue dipendenze:

```sh
npm exec -- tsc -b apps/api --stopBuildOnErrors
```

Un comando `npm run ... --workspaces` non e automaticamente un ordinatore topologico delle build: il grafo TypeScript qui e gestito da `tsc -b`. `tsc -p apps/api` invece non costruisce le dipendenze.

## Varianti

- **Frontend e backend**: condividi DTO o schemi privi di dipendenze server; usa configurazioni browser/Node separate.
- **Package pubblicabili**: `private: true` blocca la pubblicazione npm, non nasconde sorgenti o dati. Servono test del pacchetto distribuito, file inclusi e dipendenze pubbliche.
- **Task runner**: Nx o Turborepo possono coordinare task/cache; non sono necessari per questo piccolo esempio e richiedono input/output di cache corretti.
- **Package manager diversi**: sintassi come `workspace:*` e regole dei lockfile non sono intercambiabili con il demo npm.

Un package interno puo dipendere dalla configurazione della root. "Build isolata" significa prima ricostruire le sue dipendenze dichiarate; non implica copiare una cartella senza toolchain, lockfile o package richiesti.

## Errori comuni

- References soltanto alla root ma non tra consumer e dipendenza.
- Dipendenza locale non dichiarata che funziona per hoisting accidentale.
- Import di file privati o cicli fra package.
- Credere che tipi condivisi siano validazione runtime.
- Eseguire la build sull'editor gia inizializzato e non da checkout pulito.

## Checklist

- Dipendenze npm e references sono coerenti?
- Ogni package dichiara formato ed entry point?
- Installazione pulita, build e avvio funzionano senza output precedenti?
- Client e server mantengono confini appropriati?
- Cache e artefatti sono invalidati quando cambiano le dipendenze?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Project references|Project references]]
- [[Programmazione/TypeScript/Pagine/Path aliases|Path aliases]]
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Generazione di tipi da API|Generazione di tipi da API]]

## Fonti

- [npm 11 - Workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/)
- [TypeScript - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Node - Package entry points](https://nodejs.org/download/release/v24.14.0/docs/api/packages.html#package-entry-points)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
