---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - union-types
  - intersection-types
  - type-system
aliases:
  - Union Types
  - Intersection Types
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - "[[Programmazione/TypeScript/Pagine/Type Narrowing]]"
title: Union e Intersection Types
---

# Union e Intersection Types

## Sintesi

Le union e le intersection sono operatori fondamentali per combinare tipi.

Una **union** (`A | B`) indica che un valore puo essere di tipo `A` oppure di tipo `B`. Una **intersection** (`A & B`) indica che un valore deve soddisfare sia `A` sia `B`.

## Quando usarlo

- Rappresentare alternative: successo/errore, stato caricato/non caricato, ruoli diversi.
- Modellare valori con un insieme limitato di opzioni.
- Comporre tipi oggetto riutilizzabili.
- Rendere espliciti stati applicativi invece di usare booleani sparsi.

## Come funziona

Gli esempi sono indipendenti, verificati con TypeScript 5.9.3 e `strict: true`.

Con una union puoi eseguire solo operazioni valide per ogni alternativa ancora possibile. Avere un campo con lo stesso nome non significa che abbia lo stesso tipo in tutti i membri: anche il suo valore puo richiedere narrowing.

Con un'intersection il valore deve rispettare entrambi i vincoli. **`&` non unisce oggetti a runtime e non significa "il tipo a destra sovrascrive quello a sinistra".**

La union non e necessariamente esclusiva: un oggetto con entrambe le proprieta puo soddisfare `{ id: string } | { email: string }`. Per distinguere varianti incompatibili, usa un discriminante literal come `kind`.

## API / Sintassi

```ts
type Status = "idle" | "loading" | "success" | "error";

type Timestamped = {
  createdAt: Date;
};

type User = {
  id: string;
  email: string;
};

type StoredUser = User & Timestamped;

const stored: StoredUser = {
  id: "u_1",
  email: "luca@example.com",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};
```

La presenza di `Date` non verifica che la data sia valida o proveniente da una fonte attendibile.

## Esempio pratico

Risultato di una lettura **locale**; non rappresenta una chiamata HTTP:

```ts
type Result =
  | { ok: true; value: string }
  | { ok: false; error: string };

function read(result: Result): string {
  if (result.ok) {
    return result.value;
  }

  return `Errore: ${result.error}`;
}

console.log(read({ ok: true, value: "File letto" })); // File letto
console.log(read({ ok: false, error: "File assente" })); // Errore: File assente
// read({ ok: true, error: "File assente" }); // Errore statico.
```

`ok` e un literal diverso nei due rami: dopo il controllo, `value` o `error` sono accessibili nel ramo corretto. Usare un unico oggetto `{ ok: boolean; value?: string; error?: string }` permetterebbe combinazioni come successo senza valore.

### Intersezioni incompatibili

```ts
type ImpossibleValue = string & number; // never
type Conflicting = { id: string } & { id: number };
// const item: Conflicting = { id: "u_1" }; // id deve essere string & number.

type Named = { name: string };
type WithId = { id: string };
const user: Named & WithId = { name: "Luca", id: "u_1" };
```

Una proprieta in conflitto puo diventare `never`; alcuni conflitti tra discriminanti fanno ridurre a `never` l'intera intersection. Non leggere `A & B` come una strategia per correggere tipi incoerenti.

Comporre i valori richiede invece codice JavaScript, per esempio `{ ...a, ...b }`: le collisioni seguono l'ordine dello spread, non l'algebra delle intersection.

## Varianti

- **Union di primitive**: `"draft" | "published"`.
- **Union di oggetti**: stati applicativi o risultati.
- **Intersection di oggetti**: composizione di capacita.
- **Discriminated union**: union con campo discriminante stabile.
- **Priorita degli operatori**: `A | B & C` significa `A | (B & C)`; usa parentesi quando chiariscono l'intento.

## Errori comuni

- **Pensare che `A | B` permetta tutte le proprieta di A e B**: prima del narrowing sono accessibili solo le parti comuni.
- **Usare intersection su tipi incompatibili**: puo produrre proprieta impossibili.
- **Usare booleani invece di union di stati**: spesso rende il dominio meno chiaro.
- **Non usare un discriminante**: le union di oggetti diventano piu difficili da gestire.
- **Trattare una union come validatore JSON**: un `as Result` non dimostra che `ok` o i dati siano corretti.

## Checklist

- Usare union per alternative reali.
- Usare intersection per composizione di oggetti compatibili.
- Preferire discriminanti come `type`, `kind`, `status`.
- Gestire tutti i casi di una union.
- Evitare tipi troppo larghi come `string | number | object` se il dominio e piu preciso.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Narrowing|Type Narrowing]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking|Exhaustiveness Checking]]
- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]

## Fonti

- [TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), union.
- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html), intersection e conflitti.
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), union discriminate.
- [TypeScript 3.9: intersections reduced by discriminants](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
