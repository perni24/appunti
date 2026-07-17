---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, declaration-files, dts, typings]
aliases: [file d.ts, declaration files]
prerequisites: [Typing di librerie JavaScript, Moduli ES e CommonJS]
related: [DefinitelyTyped, Declaration Merging, Module augmentation]
---

# Dichiarazioni e file d.ts

## Sintesi

I file `.d.ts` contengono dichiarazioni di tipo senza implementazione runtime. Servono a descrivere codice JavaScript esistente, API globali, moduli npm, plugin e librerie compilate.

Sono una parte centrale dell'interoperabilita tra TypeScript e JavaScript.

## Quando usarlo

- Librerie JavaScript senza tipi.
- Pacchetti TypeScript compilati che devono esportare tipi.
- API globali disponibili a runtime.
- Plugin che estendono oggetti o moduli.
- Wrapper su codice legacy.

## Come funziona

Un file `.d.ts` dichiara forme, funzioni, classi e moduli. TypeScript lo usa per type checking, ma non genera codice JavaScript da quel file.

Le dichiarazioni devono corrispondere al runtime reale: se dichiarano un metodo che non esiste, TypeScript non puo accorgersene.

## API / Sintassi

```ts
declare module "legacy-lib" {
  export function parse(input: string): unknown;
}
```

## Esempio pratico

```ts
// globals.d.ts
declare global {
  interface Window {
    appConfig?: {
      apiUrl: string;
    };
  }
}

export {};
```

Questo file estende il tipo globale `Window` in modo controllato.

## Varianti

- **Module declaration**: `declare module "pkg"`.
- **Global declaration**: `declare global`.
- **Ambient variable/function**: `declare const`, `declare function`.
- **Generated declarations**: generate da `declaration: true`.
- **DefinitelyTyped declarations**: pacchetti `@types`.

## Errori comuni

- **Scrivere tipi non coerenti col runtime**: il compilatore si fida.
- **Dimenticare `export {}` nei file global augmentation**.
- **Mettere implementazione in `.d.ts`**: non e il suo ruolo.
- **Non includere il file nel progetto**: TypeScript non lo vede.

## Checklist

- Verificare che le dichiarazioni riflettano il comportamento runtime.
- Tenere file `.d.ts` piccoli e focalizzati.
- Usare `unknown` nei punti incerti.
- Includere cartelle di tipi nel `tsconfig`.
- Generare declaration files per librerie pubblicate.

## Collegamenti

- [[Typing di librerie JavaScript]]
- [[DefinitelyTyped]]
- [[Declaration Merging]]
- [[Module augmentation]]
