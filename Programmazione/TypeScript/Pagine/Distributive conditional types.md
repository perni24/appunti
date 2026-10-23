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
  - distributive-types
  - union-types
aliases:
  - Conditional types distributivi
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
title: Distributive conditional types
---

# Distributive conditional types

## Sintesi

Un conditional type distribuisce su una union quando il tipo controllato a sinistra di `extends` e un **parametro di tipo nudo**, come `T`. Il compilatore valuta il ramo per ciascun membro e riunisce i risultati.

Baseline: **TypeScript 5.9.3**, `strict: true`. E un'operazione sui tipi, non un ciclo eseguito sui dati a runtime. I blocchi sono indipendenti.

## Quando usarlo

- Filtrare o trasformare i membri di una union.
- Selezionare varianti di una discriminated union.
- Capire la differenza fra un array di union e una union di array.
- Evitare distribuzioni involontarie in utility personalizzate.

## Come funziona

Con `type OnlyStrings<T> = T extends string ? T : never`, il parametro `string | number` viene trattato come due casi. Il ramo positivo produce `string`, quello negativo `never`; `string | never` si semplifica a `string`.

Non basta che una union compaia da qualche parte: `(string | number) extends string` considera l'insieme completo, come anche un controllo su `[T]` o su un accesso del tipo `T["value"]`.

## API / Sintassi

### Distribuire oppure controllare l'intera union

```ts
type OnlyStrings<T> = T extends string ? T : never;
type WholeString<T> = [T] extends [string] ? T : never;

type Filtered = OnlyStrings<"ready" | 42>; // "ready"
type Rejected = WholeString<"ready" | 42>; // never
type Concrete = ("ready" | 42) extends string ? true : false; // false

const filtered: Filtered = "ready";
console.log(filtered); // ready
```

Le parentesi quadre qui costruiscono tipi tupla. Non aggiungono array ai valori e non richiedono di passare una tupla alla funzione che usera questi tipi.

### Union di array oppure array misto

```ts
type SeparateArrays<T> = T extends unknown ? T[] : never;
type MixedArray<T> = [T] extends [unknown] ? T[] : never;

const strings: SeparateArrays<string | number> = ["a", "b"];
const mixed: MixedArray<string | number> = ["a", 1];
// const rejected: SeparateArrays<string | number> = ["a", 1]; // errore

console.log(strings.length, mixed.length); // 2 2
```

Nel primo caso il tipo finale e `string[] | number[]`; nel secondo e `(string | number)[]`. Non confondere questa distinzione statica con una validazione degli elementi di un array esterno.

## Esempio pratico

Per selezionare eventi applicativi si puo usare direttamente `Extract`, che esegue gia un filtro distributivo. Una utility equivalente rende visibile il meccanismo:

```ts
type AppEvent =
  | { type: "user:created"; userId: string }
  | { type: "user:deleted"; userId: string }
  | { type: "invoice:paid"; invoiceId: string };

type SelectEvent<T, Pattern> = T extends Pattern ? T : never;
type UserEvent = SelectEvent<AppEvent, { type: `user:${string}` }>;
type BuiltInUserEvent = Extract<AppEvent, { type: `user:${string}` }>;

function describeUserEvent(event: UserEvent): string {
  return event.type + ":" + event.userId;
}

console.log(describeUserEvent({
  type: "user:created",
  userId: "u1",
})); // user:created:u1
```

Il nome `AppEvent` evita di confondersi con `Event` del DOM. Non serve introdurre un `infer` intermedio per filtrare questa union. Il filtro non seleziona messaggi da una coda e non autentica il payload: riguarda solo l'assegnabilita.

## Varianti

### never, any e unknown

```ts
type Category<T> = T extends string ? "text" : "other";
type IsNever<T> = [T] extends [never] ? true : false;

type Empty = Category<never>; // never: nessun membro da distribuire
type UnknownCategory = Category<unknown>; // "other"
type AnyCategory = Category<any>; // "text" | "other", per questo conditional
type NeverDetected = IsNever<never>; // true
type NormalDetected = IsNever<string>; // false
```

Non generalizzare il comportamento di `any` a qualsiasi conditional: per esempio `T extends unknown ? ... : ...` non ha la stessa ambiguita del test su `string`. Per riconoscere `never`, il wrapper evita che la distribuzione produca subito `never`.

### Distribuzioni annidate

```ts
type Pair<A, B> =
  A extends unknown
    ? B extends unknown
      ? [A, B]
      : never
    : never;

type Pairs = Pair<"read" | "write", 200 | 400>;
// ["read", 200] | ["read", 400] | ["write", 200] | ["write", 400]
```

Due parametri distribuiti producono tutte le combinazioni. Con union grandi e trasformazioni ricorsive la complessita cresce rapidamente; misura il costo prima di aggiungere livelli di metaprogrammazione.

## Errori comuni

- Aspettarsi distribuzione da una union concreta senza parametro generico nudo.
- Disattivarla involontariamente avvolgendo `T`.
- Usare `never` come un valore sentinella runtime.
- Usare `any` come test rappresentativo dei dati di ingresso.
- Scrivere una utility complessa quando `Extract` o `Exclude` esprimono gia il filtro.

## Checklist

- Voglio analizzare ogni membro o l'intera union?
- Il controllo a sinistra di `extends` usa direttamente il parametro?
- Ho verificato anche `never`, `unknown` e una union mista?
- Il tipo prodotto conserva le correlazioni tra discriminante e payload?
- L'operazione sui tipi e separata dalla validazione runtime?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|Infer nei Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]

## Fonti

- [TypeScript - Distributive Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
