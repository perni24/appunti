---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, conditional-types, type-system]
aliases: [Conditional Type]
prerequisites: [Generics, Union e Intersection Types]
related: [Infer nei Conditional Types, Distributive conditional types, Utility Types]
---

# Conditional Types

## Sintesi

I conditional types permettono di scegliere un tipo in base a una condizione type-level. La forma base e `T extends U ? X : Y`.

Sono fondamentali per costruire utility type, trasformare tipi e modellare relazioni tra input e output.

## Quando usarlo

- Quando un tipo risultato dipende da un altro tipo.
- Per estrarre parti da array, promise, funzioni o oggetti.
- Per costruire utility type riutilizzabili.
- Per filtrare union.
- Per modellare API con comportamenti diversi in base al tipo.

## Come funziona

TypeScript valuta se `T` e assegnabile a `U`. Se si, produce il ramo vero; altrimenti produce il ramo falso.

Quando `T` e una union "nuda", il conditional type e distributivo: viene applicato a ogni membro della union separatamente.

## API / Sintassi

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
```

## Esempio pratico

```ts
type ApiData<T> = T extends Promise<infer TValue> ? TValue : T;

type User = {
  id: string;
};

type A = ApiData<Promise<User>>;
type B = ApiData<User>;
```

`ApiData<Promise<User>>` diventa `User`; `ApiData<User>` resta `User`.

## Varianti

- **Conditional semplice**: `T extends U ? X : Y`.
- **Conditional con `infer`**: estrae un tipo interno.
- **Distributive conditional type**: applicato a ogni membro di una union.
- **Non-distributive conditional**: usa tuple wrapper `[T] extends [U]`.

## Errori comuni

- **Non aspettarsi distribuzione sulle union**: puo produrre risultati sorprendenti.
- **Annidare troppi conditional types**: diventano difficili da leggere.
- **Usare conditional types per logica runtime**: esistono solo a compile-time.
- **Dimenticare il caso falso**: spesso serve un fallback utile, non `never` casuale.

## Checklist

- Usare conditional types per trasformazioni type-level reali.
- Controllare il comportamento con union.
- Usare `infer` per estrazioni da tipi generici.
- Spezzare conditional complessi in alias intermedi.
- Aggiungere test type-level per utility critiche.

## Collegamenti

- [[Infer nei Conditional Types]]
- [[Distributive conditional types]]
- [[Utility Types]]
- [[Generics avanzati]]
