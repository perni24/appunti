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
  - javascript
  - migrazione
  - gradual-typing
aliases:
  - Migrare da JavaScript a TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/JSDoc e type checking in JavaScript]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
title: Migrazione da JavaScript a TypeScript
---

# Migrazione da JavaScript a TypeScript

## Sintesi

Migrare a TypeScript significa introdurre contratti controllabili senza cambiare accidentalmente il comportamento dell'applicazione. Rinominare i file non basta: bisogna decidere quali file vengono controllati, chi produce il JavaScript e come viene eseguito.

Baseline: **TypeScript 5.9.3**, **Node.js 24.14.0**. Il progetto dimostrativo usa ESM; non e una configurazione da copiare senza adattamenti in un'app Vite, CommonJS o in un framework.

## Quando usarlo

- Aggiungere controllo statico a una codebase JavaScript esistente.
- Convertire un modulo per volta mantenendo verificabile l'applicazione.
- Stabilizzare API pubbliche e confini con dati esterni.
- Evitare una conversione massiva piena di assertion e `any`.

## Come funziona

Separa tre decisioni:

1. **Inclusione**: `allowJs` permette ai file JavaScript di entrare nel programma TypeScript.
2. **Controllo**: `checkJs` abilita i diagnostici nei file JS; `// @ts-check` li abilita nel singolo file. I file TS vengono controllati normalmente.
3. **Esecuzione**: `noEmit` non produce JavaScript. Il runtime o la pipeline devono comunque supportare i file che eseguono.

Il progetto seguente tiene `strict: true` per il codice controllato e lascia temporaneamente non controllati i JS senza direttiva. Non significa che tutto il codice sia gia coperto. Su una codebase diversa puoi introdurre i flag strict per passi, ma devi rendere esplicite le lacune rimaste.

## API / Sintassi

`package.json` del progetto dimostrativo:

```json
{
  "private": true,
  "type": "module",
  "devDependencies": { "typescript": "5.9.3" }
}
```

`tsconfig.json` per il solo controllo:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src/**/*"]
}
```

Installare le dipendenze del progetto:

```sh
npm install
```

Eseguire il controllo, anche in CI:

```sh
npm exec -- tsc -p tsconfig.json
```

L'editor e utile, ma non sostituisce questo comando nella pipeline.

## Esempio pratico

### 1. Modulo JavaScript iniziale

`src/user.js`:

```js
export function formatUser(user) {
  return user.email + " (" + user.id + ")";
}
```

`src/main.js` e gia controllato:

```js
// @ts-check
import { formatUser } from "./user.js";

console.log(formatUser({ id: "u1", email: "user@example.test" }));
// user@example.test (u1)
```

Questo codice funziona, ma il parametro del modulo non annotato puo essere `any`: il chiamante non riceve ancora un contratto affidabile per `user`.

### 2. Conversione del modulo

Rinominare `src/user.js` in `src/user.ts` e sostituirne il contenuto:

```ts
export type User = {
  id: string;
  email: string;
};

export function formatUser(user: User): string {
  return user.email + " (" + user.id + ")";
}
```

Non conservare `user.js` e `user.ts` come due sorgenti concorrenti con lo stesso nome base. L'import di `main.js` resta `"./user.js"`: con NodeNext indica il percorso JavaScript finale e il compilatore risolve il sorgente TS.

Ora il controllo segnala, per esempio, `id: 42` nel chiamante controllato. Non verifica che la stringa email sia un indirizzo valido e non protegge chiamanti JS esclusi dal controllo.

### 3. Compilazione ed esecuzione

Per questo demo, `tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.build.json
```

Eseguire l'output, non `src/main.js` che punta a un file JS sorgente ormai rinominato:

```sh
node dist/main.js
```

Il risultato deve restare `user@example.test (u1)`. `allowJs` permette anche l'emissione del file `main.js` in `dist`. `noEmitOnError` blocca la nuova emissione in caso di errore, ma non rimuove output vecchi: non distribuire artefatti rimasti da una build precedente.

## Varianti

- **JSDoc first**: annota le firme in JS e attiva il controllo prima di rinominare.
- **Moduli isolati**: converti un modulo con test e consumer noti, poi estendi la copertura.
- **Boundary first**: modella DTO e API, ma ricevi input non verificati come `unknown` e controllali a runtime.
- **Build esistente**: Babel, esbuild o il framework possono continuare a emettere; esegui `tsc --noEmit` separatamente.
- **Frontend e JSX**: adatta `moduleResolution`, `lib`, `jsx` e l'estensione `.tsx`; NodeNext non e un preset universale.

## Errori comuni

- Rinominare un file senza aggiornare o verificare il percorso di esecuzione.
- Lasciare doppioni JS/TS con lo stesso basename e controllare il file diverso da quello eseguito.
- Usare `strict: false`, `any` o `@ts-nocheck` senza tracciare la copertura persa.
- Confondere un JSON tipizzato tramite cast con dati validati.
- Cambiare formato dei moduli e comportamento applicativo nello stesso passaggio senza test.

## Checklist

- Ho un test del comportamento prima e dopo la conversione?
- So quali file JS sono inclusi e quali sono effettivamente controllati?
- Il type check viene eseguito anche in CI?
- Gli import risolvono sia nel checker sia nel runtime?
- Build e sorgenti sono separati, senza output obsoleti distribuiti?
- Errori ignorati e moduli non migrati sono espliciti?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/JSDoc e type checking in JavaScript|JSDoc e type checking in JavaScript]]
- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- [TypeScript - Migrating from JavaScript](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [TypeScript - Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
