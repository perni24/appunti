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
  - infer
  - conditional-types
  - type-system
aliases:
  - infer TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Recursive types]]"
title: Infer nei Conditional Types
---

# Infer nei Conditional Types

## Sintesi

`infer` permette di dichiarare una variabile di tipo dentro un conditional type e farla dedurre a TypeScript.

Serve per estrarre tipi interni da funzioni, promise, array, tuple e strutture generiche.

## Quando usarlo

- Estrarre il tipo risolto di una `Promise`.
- Estrarre il ritorno di una funzione.
- Estrarre parametri o elementi da tuple.
- Scrivere utility type personalizzati.
- Modellare trasformazioni type-level ricorsive.

## Come funziona

`infer` puo comparire nel pattern a destra di `extends` in un conditional type. Se il tipo e compatibile con il pattern, TypeScript deduce la parte corrispondente; la variabile introdotta e utilizzabile nel ramo vero. Non e una variabile JavaScript, non esegue funzioni e non modifica i dati.

Il risultato dipende dal pattern: `Array<infer E>` non riconosce un array readonly; `readonly (infer E)[]` riconosce sia array mutabili sia readonly. Esempi verificati con TypeScript 5.9.3 e `strict: true`.

## API / Sintassi

```ts
type UnwrapPromise<T> = T extends Promise<infer TValue> ? TValue : T;
type Single = UnwrapPromise<Promise<number>>; // number
type Nested = UnwrapPromise<Promise<Promise<number>>>; // Promise<number>
type Resolved = Awaited<Promise<Promise<number>>>; // number
```

Questa utility estrae un livello, non e un sostituto completo di `Awaited`. Un pattern su `PromiseLike` accetta piu strutture thenable, ma una utility personalizzata deve comunque definire ricorsione, nullish e casi non conformi. Preferisci `Awaited<T>` per rappresentare `await`.

## Esempio pratico

```ts
type Return<T> = T extends (...args: never[]) => infer TResult
  ? TResult
  : never;

function createUser() {
  return {
    id: "u_1",
    email: "luca@example.com",
  };
}

type User = Return<typeof createUser>;
const user: User = createUser();
console.log(user.id); // u_1
```

`User` viene derivato dal **tipo di ritorno statico** della funzione, non osservando una chiamata. Per esempio `id` resta `string`, non necessariamente `"u_1"`. Se la funzione dichiara un ritorno piu largo, l'alias vede quella dichiarazione. La chiamata a `createUser()` nell'esempio e un'operazione runtime distinta.

`never[]` nel pattern serve a riconoscere firme con parametri diversi; non e la lista di argomenti da passare alla funzione. `unknown[]` non e un sostituto equivalente: sotto `strictFunctionTypes`, una funzione che accetta solo `string` non puo accettare arbitrari `unknown`. Nell'uso comune esistono gia `ReturnType` e `Parameters`.

## Varianti

- **Infer da Promise**: `Promise<infer T>`.
- **Infer da Array**: `Array<infer T>`.
- **Infer da funzione**: `(...args: infer A) => infer R`.
- **Infer da tuple**: `[infer Head, ...infer Tail]`.
- **Infer ricorsivo**: unwrap annidato.

### Array, tuple e constraint su infer

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type First<T> = T extends readonly [infer H, ...unknown[]] ? H : never;
type StringFirst<T> =
  T extends readonly [infer H extends string, ...unknown[]] ? H : never;
type Args<T> = T extends (...args: infer A) => unknown ? A : never;

type Element = ElementOf<readonly ["a", 2]>; // "a" | 2
type Head = First<readonly ["a", 2]>; // "a"
type Empty = First<[]>; // never
type GeneralArray = First<string[]>; // never: puo essere vuoto
type TextHead = StringFirst<readonly ["a", 2]>; // "a"
type NotText = StringFirst<[number]>; // never
type Arguments = Args<(id: string, active?: boolean) => void>;
// [id: string, active?: boolean]
```

Il constraint `infer H extends string` e disponibile da TS 4.7. Il fallback `never` e una scelta dell'utility, non un errore automatico: se vuoi trattare un array generico come possibile lista non vuota, devi usare un contratto diverso.

### Overload e funzioni generiche

```ts
declare function parse(input: string): number;
declare function parse(input: number): string;
declare function parse(input: string | number): string | number;

type Parsed = ReturnType<typeof parse>; // string | number
type IdentityResult = ReturnType<<T>(value: T) => T>; // unknown
```

Questo blocco descrive solo firme: `declare` non implementa `parse`, quindi non chiamarla senza una vera implementazione. L'estrazione vede l'ultima firma di overload, non sceglie un overload per un ipotetico argomento. Una relazione generica puo diventare `unknown` quando estrai il solo ritorno perdendo il legame con l'input.

Con union, il conditional type puo distribuire. Piu occorrenze della stessa variabile `infer` non impongono automaticamente uguaglianza: l'inferenza puo combinare i candidati. Testa il risultato invece di trattare `infer` come un cast o una prova di identita dei tipi.

## Errori comuni

- **Usare `infer` fuori da conditional types**: non e valido.
- **Rendere utility troppo difficili da leggere**: meglio spezzare in alias.
- **Inferire da pattern sbagliati**: il ramo falso puo diventare `never`.
- **Dimenticare distribuzione sulle union**: conditional types possono distribuirsi.

## Checklist

- Usare `infer` per estrarre, non per forzare.
- Tenere i pattern piccoli e leggibili.
- Prevedere un ramo falso sensato.
- Testare utility con casi semplici e casi limite.
- Preferire utility built-in quando gia esistono.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Recursive types|Recursive types]]

## Fonti

- [TypeScript: infer e overload nei conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types).
- [TypeScript: utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html), ReturnType, Parameters e Awaited.
- [TypeScript 4.7: constraint sulle variabili inferite](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#extends-constraints-on-infer-type-variables).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
