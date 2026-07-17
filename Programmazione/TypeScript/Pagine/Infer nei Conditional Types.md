---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, infer, conditional-types, type-system]
aliases: [infer TypeScript]
prerequisites: [Conditional Types, Generics avanzati]
related: [Utility Types, Recursive types]
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

`infer` puo comparire nel ramo `extends` di un conditional type. Se il tipo combacia con il pattern, TypeScript assegna la parte corrispondente alla variabile inferita.

## API / Sintassi

```ts
type UnwrapPromise<T> = T extends Promise<infer TValue> ? TValue : T;
```

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
```

`User` viene derivato dal ritorno reale della funzione.

## Varianti

- **Infer da Promise**: `Promise<infer T>`.
- **Infer da Array**: `Array<infer T>`.
- **Infer da funzione**: `(...args: infer A) => infer R`.
- **Infer da tuple**: `[infer Head, ...infer Tail]`.
- **Infer ricorsivo**: unwrap annidato.

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

- [[Conditional Types]]
- [[Utility Types]]
- [[Recursive types]]
