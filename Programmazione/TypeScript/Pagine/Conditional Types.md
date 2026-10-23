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
  - conditional-types
  - type-system
aliases:
  - Conditional Type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Distributive conditional types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
title: Conditional Types
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

La distribuzione avviene quando il lato sinistro di `extends` e un parametro di tipo "nudo", come `T`, poi sostituito con una union. Non basta scrivere una union concreta a sinistra. `extends` qui verifica assegnabilita, non uguaglianza esatta, ereditarieta di classi o una condizione JavaScript.

Se `T` e ancora generico, il risultato puo restare da risolvere fino all'istanziazione. Nessun ramo genera codice runtime. Baseline degli esempi: TypeScript 5.9.3, `strict: true`.

## API / Sintassi

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
type Mixed = IsString<string | number>; // true | false
type Concrete = (string | number) extends string ? true : false; // false

type AllStrings<T> = [T] extends [string] ? true : false;
type Whole = AllStrings<string | number>; // false
type Empty = IsString<never>; // never
type Unknown = IsString<unknown>; // false
type Unchecked = IsString<any>; // true | false
type IsNever<T> = [T] extends [never] ? true : false;
```

`never` e una union senza membri: in `IsString<never>` non c'e nessun membro da trasformare. Il wrapper tuple serve anche a riconoscerlo con `IsNever`. `any` puo selezionare entrambi i rami in questo esempio: non trattarlo come un caso ordinario, ne generalizzare il risultato a ogni conditional type.

## Esempio pratico

```ts
type ApiData<T> = T extends Promise<infer TValue> ? TValue : T;

type User = {
  id: string;
};

type A = ApiData<Promise<User>>;
type B = ApiData<User>;
type Nested = ApiData<Promise<Promise<User>>>; // Promise<User>
type Resolved = Awaited<Promise<Promise<User>>>; // User
```

`ApiData<Promise<User>>` diventa `User`; `ApiData<User>` resta `User`. L'alias estrae **un solo livello** e riconosce il pattern `Promise`, non ogni thenable. Per modellare il risultato di `await` usa normalmente `Awaited<T>` (TS 4.5+), che gestisce annidamento e strutture compatibili con il protocollo thenable. Nessuno dei due alias attende una promessa: per quello serve `await` nel codice.

## Varianti

- **Conditional semplice**: `T extends U ? X : Y`.
- **Conditional con `infer`**: estrae un tipo interno.
- **Distributive conditional type**: applicato a ogni membro di una union.
- **Non-distributive conditional**: usa tuple wrapper `[T] extends [U]`.

### Filtrare una union senza trasformare i dati

```ts
type Notification =
  | { kind: "email"; address: string }
  | { kind: "local"; message: string };

type WithAddress<T> = T extends { address: string } ? T : never;
type EmailNotification = WithAddress<Notification>;

const notification: EmailNotification = {
  kind: "email",
  address: "demo@example.com",
};
console.log(notification.kind); // email
```

Il membro escluso diventa `never`, che scompare dalla union risultante. Non e stata filtrata una lista, inviata un'email o verificato un indirizzo: sono operazioni separate. Un constraint `T extends { address: string }` sulla dichiarazione, invece, rifiuterebbe input incompatibili anziche produrre un fallback.

Un ritorno condizionale in una funzione generica non prova da solo che l'implementazione restituisca il ramo corretto. Il narrowing di un valore non risolve sempre il parametro generico: non nascondere gli errori con cast; valuta overload o un ritorno union piu semplice e testa i rami runtime.

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

- [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|Infer nei Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Distributive conditional types|Distributive conditional types]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]

## Fonti

- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html).
- [TypeScript: Awaited](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype).
- I casi limite `any`, `unknown` e `never` sono verificati anche con test type-level sulla baseline 5.9.3.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
