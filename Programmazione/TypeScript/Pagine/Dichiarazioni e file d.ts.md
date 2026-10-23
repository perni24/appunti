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
  - declaration-files
  - dts
  - typings
aliases:
  - file d.ts
  - declaration files
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
related:
  - "[[Programmazione/TypeScript/Pagine/DefinitelyTyped]]"
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
title: Dichiarazioni e file d.ts
---

# Dichiarazioni e file d.ts

## Sintesi

Un file `.d.ts` descrive tipi e valori che devono essere forniti da un'implementazione. Non contiene codice eseguito e non installa funzioni, variabili globali o pacchetti.

Baseline: **TypeScript 5.9.3**, **Node.js 24.14.0**. Il progetto principale mostra una piccola libreria ESM che emette insieme JavaScript e dichiarazioni.

## Quando usarlo

- Distribuire una libreria TypeScript a consumer TypeScript e JavaScript.
- Descrivere un modulo JavaScript esistente.
- Dichiarare un'integrazione globale realmente installata.
- Distinguere problemi di risoluzione dei tipi da problemi del runtime.

## Come funziona

Una dichiarazione come `export declare function label(value: string): string` promette che il modulo runtime esponga quella funzione. Il checker si fida: se il JavaScript manca o restituisce un dato diverso, il `.d.ts` non lo corregge.

Esistono contesti distinti:

- file con import/export al livello superiore: dichiarazioni di un modulo;
- file script senza import/export: dichiarazioni nell'ambito globale;
- `declare module "nome"` in un file script: modulo ambient;
- `declare global` dentro un modulo: estensione dell'ambito globale;
- augmentation di un modulo gia esistente: caso separato approfondito nella relativa nota.

Con NodeNext, `.d.mts` indica ESM, `.d.cts` CommonJS; `.d.ts` segue il contesto del package. Non scegliere l'estensione indipendentemente dal JavaScript che descrive.

## API / Sintassi

Progetto dimostrativo `note-labels`, con `src/index.ts`. `package.json`:

```json
{
  "name": "note-labels",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "devDependencies": { "typescript": "5.9.3" }
}
```

`private: true` impedisce una pubblicazione npm accidentale: il demo serve a verificare il layout, non a pubblicare un pacchetto. La condizione `types` precede quella runtime; i percorsi devono puntare a file effettivamente presenti nel pacchetto distribuito.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "declaration": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": []
  },
  "include": ["src/**/*.ts"]
}
```

Dopo l'installazione delle dipendenze, compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

## Esempio pratico

### Sorgente della libreria

`src/index.ts`:

```ts
export interface LabelOptions {
  prefix?: string;
}

export function label(value: string, options: LabelOptions = {}): string {
  return (options.prefix ?? "item:") + value;
}
```

La compilazione genera `dist/index.js` e `dist/index.d.ts`. Il contratto emesso e equivalente a:

```ts
export interface LabelOptions {
  prefix?: string;
}
export declare function label(value: string, options?: LabelOptions): string;
```

Il parametro con default diventa opzionale nella firma pubblica. Il corpo della funzione si trova nel JavaScript, non nella dichiarazione.

### Consumer runtime

`consumer.mjs`, nella root del demo:

```js
import { label } from "./dist/index.js";
console.log(label("book")); // item:book
```

Eseguire:

```sh
node consumer.mjs
```

Per un consumer del pacchetto, l'import pubblico sara `"note-labels"`; il campo `exports` indirizza runtime e checker ai rispettivi file. Il test del pacchetto deve verificare entrambi, non soltanto l'esistenza del `.d.ts`.

## Varianti

### Emettere solo dichiarazioni

Per una pipeline che produce gia JavaScript, `tsconfig.types.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "outDir": "types"
  }
}
```

```sh
npm exec -- tsc -p tsconfig.types.json
```

Produce dichiarazioni in `types`, non implementazioni JS. Non rimuove vecchi artefatti. Se erediti da una configurazione con `noEmit: true`, devi disattivarlo esplicitamente. Per sorgenti JS aggiungi `allowJs: true`, includi i file JS e usa JSDoc per ottenere firme utili.

Le dichiarazioni generate non vanno corrette a mano: correggi sorgenti o annotazioni e rigenera. I `.d.ts` scritti manualmente per una libreria esterna sono invece sorgenti da mantenere e testare.

### Global augmentation nel browser

File separato `src/globals.d.ts`, per un progetto con tipi DOM:

```ts
export {};

declare global {
  interface Window {
    appConfig?: {
      apiUrl: string;
    };
  }
}
```

Non crea `window.appConfig`, non valida `apiUrl` come URL e non rende `window` disponibile in Node. L'opzionalita rappresenta l'eventuale assenza dell'inizializzazione. Qui `export {}` rende il file un modulo, necessario per usare `declare global` in questa forma.

### Dichiarazioni pubbliche e dipendenze

Se il `.d.ts` pubblico importa tipi da un altro pacchetto, anche il consumer deve poterli risolvere. Non lasciare tutte quelle dipendenze soltanto nelle devDependencies per abitudine: distingui strumenti di build da dipendenze del contratto distribuito. Per pacchetti ESM/CJS duali, verifica entrambe le entry e dichiarazioni; il demo non implementa un pacchetto duale.

## Errori comuni

- Aggiungere un corpo di funzione al `.d.ts` invece che al JavaScript.
- Eseguire o importare una dichiarazione come file runtime.
- Pubblicare solo i tipi quando il consumer deve chiamare funzioni.
- Dimenticare `exports`, estensioni o file inclusi nella distribuzione.
- Dichiarare globali obbligatori che non sono sempre inizializzati.
- Usare `skipLibCheck` come validazione della coerenza tra tipi e codice.

## Checklist

- Il file descrive un modulo, un globale o un'augmentation?
- L'implementazione dichiarata esiste e viene distribuita?
- Checker e runtime risolvono l'entry prevista?
- Le dipendenze delle dichiarazioni sono disponibili ai consumer?
- Ho provato un consumer tipizzato e un'esecuzione reale?
- I tipi generati possono essere riprodotti dai sorgenti?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript|Typing di librerie JavaScript]]
- [[Programmazione/TypeScript/Pagine/DefinitelyTyped|DefinitelyTyped]]
- [[Programmazione/TypeScript/Pagine/Declaration Merging|Declaration Merging]]
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]

## Fonti

- [TypeScript - Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [TypeScript - Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [TypeScript - Creating .d.ts Files from .js Files](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
