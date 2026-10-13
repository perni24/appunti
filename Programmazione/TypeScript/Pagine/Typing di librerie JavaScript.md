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
  - typings
  - librerie
  - dts
aliases:
  - Tipizzare librerie JavaScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
related:
  - "[[Programmazione/TypeScript/Pagine/DefinitelyTyped]]"
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
title: Typing di librerie JavaScript
---

# Typing di librerie JavaScript

## Sintesi

Tipizzare una libreria JavaScript significa fornire a TypeScript informazioni su funzioni, oggetti, classi e moduli che la libreria espone.

I tipi possono essere inclusi nel pacchetto, installati da `@types`, scritti localmente in file `.d.ts` oppure creati tramite module augmentation.

## Quando usarlo

- Una libreria JavaScript non ha tipi inclusi.
- I tipi esistenti sono incompleti o obsoleti.
- Stai usando plugin che estendono una libreria.
- Vuoi tipizzare un modulo interno scritto in JavaScript.
- Devi integrare codice legacy in un progetto TypeScript.

## Come funziona

TypeScript cerca dichiarazioni di tipo accanto al pacchetto, nel campo `types` o `typings`, nei package `@types/*` e nei file inclusi dal `tsconfig`.

Se non trova dichiarazioni, il modulo puo diventare `any` o produrre errore.

## API / Sintassi

```ts
declare module "legacy-lib" {
  export function parse(input: string): unknown;
  export function format(value: unknown): string;
}
```

## Esempio pratico

```ts
// types/legacy-lib.d.ts
declare module "legacy-lib" {
  export type Options = {
    strict?: boolean;
  };

  export function load(path: string, options?: Options): Promise<unknown>;
}
```

Questo file permette di importare `legacy-lib` con tipi minimi invece di `any`.

## Varianti

- **Tipi inclusi nel package**: preferibili.
- **`@types/package`**: tipi gestiti su DefinitelyTyped.
- **Dichiarazione locale**: file `.d.ts` nel progetto.
- **Module augmentation**: estensione di tipi esistenti.
- **Wrapper tipizzato**: incapsula libreria non tipizzata dietro API sicura.

## Errori comuni

- **Dichiarare tutto come `any`**: elimina il beneficio.
- **Tipizzare piu API di quelle usate**: aumenta manutenzione inutile.
- **Non includere i file `.d.ts` nel `tsconfig`**.
- **Confondere default export e named export**: comune con librerie CommonJS.

## Checklist

- Controllare prima se il package include tipi.
- Cercare `@types/nome-pacchetto`.
- Scrivere dichiarazioni minime se mancano tipi.
- Preferire `unknown` ad `any` nei confini incerti.
- Testare import reali con il formato modulo usato.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]
- [[Programmazione/TypeScript/Pagine/DefinitelyTyped|DefinitelyTyped]]
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]
- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
