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
  - jsdoc
  - javascript
  - checkjs
aliases:
  - JSDoc TypeScript
  - checkJs
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Migrazione da JavaScript a TypeScript]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
title: JSDoc e type checking in JavaScript
---

# JSDoc e type checking in JavaScript

## Sintesi

TypeScript puo controllare JavaScript usando commenti JSDoc, senza convertire i sorgenti in `.ts`. I commenti restano commenti nel runtime: il controllo avviene nell'editor o tramite il compilatore, non quando Node o il browser eseguono il file.

Baseline: **TypeScript 5.9.3**, **Node.js 24.14.0**, moduli ESM. Restare in JavaScript con JSDoc e una scelta legittima, non necessariamente una fase da abbandonare.

## Quando usarlo

- Aggiungere contratti a moduli JS senza una fase di emissione TypeScript.
- Preparare una migrazione progressiva.
- Documentare e controllare una libreria JavaScript.
- Esportare dichiarazioni generate mantenendo l'implementazione in JS.

## Come funziona

`allowJs` include i file JS; `checkJs` attiva i diagnostici su quelli inclusi. `// @ts-check` attiva il controllo del singolo file anche con `checkJs: false`; `// @ts-nocheck` lo disattiva per quel file.

L'inferenza e i tipi esposti a un consumer possono esistere anche senza diagnostici nel corpo JS. Per questo "l'editor suggerisce i parametri" non dimostra che tutti i file siano controllati.

JSDoc non e limitato a tipi elementari: il checker TypeScript supporta anche generics e molte espressioni di tipo avanzate. Alcuni tag sono specifici di TypeScript, non comuni a tutti gli strumenti JSDoc.

## API / Sintassi

Per eseguire i file con `import` e `export`, il progetto del demo usa:

```json
{
  "private": true,
  "type": "module",
  "devDependencies": { "typescript": "5.9.3" }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src/**/*.js", "src/**/*.d.ts"]
}
```

Dopo l'installazione delle dipendenze, controllare:

```sh
npm exec -- tsc -p tsconfig.json
```

I primi tre esempi seguenti sono file indipendenti in `src`.

## Esempio pratico

### Parametri, ritorni e typedef

`src/user.js`:

```js
// @ts-check

/** @typedef {{ id: string, email: string }} User */

/**
 * @param {User} user
 * @returns {string}
 */
export function formatUser(user) {
  return user.email + " (" + user.id + ")";
}

console.log(formatUser({ id: "u1", email: "user@example.test" }));
// user@example.test (u1)

// formatUser({ id: 42, email: "user@example.test" }); // errore statico
```

Eseguire il JavaScript originale:

```sh
node src/user.js
```

Il corpo viene controllato, ma il tipo `User` non esiste a runtime e non valida le stringhe come ID o email.

### Generics e array vuoti

`src/first.js`:

```js
// @ts-check

/**
 * @template T
 * @param {readonly T[]} values
 * @returns {T | undefined}
 */
export function first(values) {
  return values[0];
}

console.log(first(["ready"])); // ready
console.log(first([])); // undefined
```

Il ritorno ammette un array vuoto. Un `@template` collega il tipo dell'elemento a quello del risultato; non equivale a `any`.

### Annotazione e satisfies

`src/config.js`:

```js
// @ts-check

/** @typedef {{ mode: "read" | "write", retries?: number }} Config */

/** @satisfies {Config} */
const config = { mode: "read", retries: 0 };

/** @type {Config} */
const state = { mode: "read" };
state.mode = "write";

console.log(config.retries, state.mode); // 0 write
// config.mode = "write"; // errore: la proprieta e stata inferita come "read"
```

`@type` annota il contratto della variabile; `@satisfies` verifica la compatibilita e puo contestualizzare l'inferenza. Nessuno dei due congela l'oggetto o effettua una validazione runtime. Un cast JSDoc su un'espressione parentesizzata resta un'assertion, non un controllo.

## Varianti

### Tipi importati senza import runtime

Questa coppia di file e un esempio separato. `src/types.d.ts`:

```ts
export interface User {
  id: string;
  email: string;
}
```

`src/imported.js`:

```js
// @ts-check
/** @import { User } from "./types.js" */

/** @param {User} user */
export function describeUser(user) {
  return user.id + ":" + user.email;
}

console.log(describeUser({ id: "u1", email: "user@example.test" }));
// u1:user@example.test
```

Il checker risolve `./types.js` alla dichiarazione `types.d.ts`. Il commento `@import` non carica un file JavaScript: qui non serve un `types.js` runtime. Un'alternativa e `@param {import("./types.js").User} user`.

### Tipi generati da JavaScript

Per generare `.d.ts` con TypeScript, servono `allowJs`, `declaration`, `emitDeclarationOnly`, una directory di output separata e `noEmit: false`. Non basta aggiungere `declaration` al progetto sopra, che ha `noEmit: true`. La procedura e approfondita in [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]].

### Regole JS non identiche a TS

Il controllo di JS conserva alcune regole permissive, per esempio sui parametri non annotati e sugli oggetti letterali aperti. Le annotazioni esplicite riducono l'ambiguita; `strict` non rende ogni comportamento identico a un file TS.

## Errori comuni

- Inserire sintassi TypeScript eseguibile, come `const x: number`, in un file JS.
- Contare sul controllo dell'editor senza un comando ripetibile in CI.
- Pensare che tutti gli strumenti JSDoc capiscano le estensioni TypeScript.
- Confondere `@import` con un import che installa effetti collaterali.
- Aggiungere `@ts-ignore` per evitare di chiarire un contratto; una soppressione motivata deve restare circoscritta.
- Scrivere tipi corretti nei commenti ma non verificare input esterni.

## Checklist

- Il file entra nel programma e i diagnostici JS sono abilitati?
- Le firme pubbliche hanno tipi sufficientemente precisi?
- I casi vuoti e i valori opzionali sono rappresentati?
- Gli import di tipi sono distinti dagli import runtime?
- La pipeline controlla i file prima della distribuzione?
- JSDoc e implementazione sono mantenuti insieme?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Migrazione da JavaScript a TypeScript|Migrazione da JavaScript a TypeScript]]
- [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript|Typing di librerie JavaScript]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]

## Fonti

- [TypeScript - JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript - Type Checking JavaScript Files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
