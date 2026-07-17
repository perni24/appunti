---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, union-types, intersection-types, type-system]
aliases: [Union Types, Intersection Types]
prerequisites: [Tipi primitivi, Type Aliases e Interfaces]
related: [Discriminated Unions, Type Narrowing]
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

Con una union puoi usare solo le proprieta comuni a tutti i membri, finche non restringi il tipo con un controllo.

Con una intersection TypeScript richiede che il valore abbia tutte le proprieta richieste dai tipi combinati.

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
```

## Esempio pratico

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
```

La proprieta `ok` permette a TypeScript di capire quale ramo della union e attivo.

## Varianti

- **Union di primitive**: `"draft" | "published"`.
- **Union di oggetti**: stati applicativi o risultati.
- **Intersection di oggetti**: composizione di capacita.
- **Discriminated union**: union con campo discriminante stabile.

## Errori comuni

- **Pensare che `A | B` permetta tutte le proprieta di A e B**: prima del narrowing sono accessibili solo le parti comuni.
- **Usare intersection su tipi incompatibili**: puo produrre proprieta impossibili.
- **Usare booleani invece di union di stati**: spesso rende il dominio meno chiaro.
- **Non usare un discriminante**: le union di oggetti diventano piu difficili da gestire.

## Checklist

- Usare union per alternative reali.
- Usare intersection per composizione di oggetti compatibili.
- Preferire discriminanti come `type`, `kind`, `status`.
- Gestire tutti i casi di una union.
- Evitare tipi troppo larghi come `string | number | object` se il dominio e piu preciso.

## Collegamenti

- [[Type Narrowing]]
- [[Discriminated Unions]]
- [[Exhaustiveness Checking]]
- [[Type Aliases e Interfaces]]
