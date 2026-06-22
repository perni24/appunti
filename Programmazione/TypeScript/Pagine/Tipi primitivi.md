---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, tipi, primitive-types]
aliases: [Tipi primitivi TypeScript]
prerequisites: [Introduzione a TypeScript]
related: [Variabili e annotazioni di tipo, Union e Intersection Types]
---

# Tipi primitivi

## Sintesi

I tipi primitivi in TypeScript descrivono i valori base ereditati da JavaScript: `string`, `number`, `boolean`, `bigint`, `symbol`, `null` e `undefined`.

Sono il punto di partenza del type system: quasi tutti i tipi piu complessi combinano o specializzano questi valori.

## Quando usarlo

- Quando definisci parametri e ritorni di funzioni semplici.
- Quando descrivi campi base di oggetti e DTO.
- Quando vuoi distinguere valori presenti, assenti o opzionali.
- Quando vuoi evitare conversioni implicite poco chiare.

## Come funziona

TypeScript assegna a ogni valore un tipo. Alcuni tipi sono ampi, come `string`, e rappresentano qualsiasi stringa. Altri possono essere piu specifici, come il literal type `"admin"`, che rappresenta solo quella stringa.

Con `strictNullChecks`, `null` e `undefined` non sono automaticamente assegnabili agli altri tipi: devono essere dichiarati esplicitamente.

## API / Sintassi

```ts
let username: string = "luca";
let age: number = 34;
let active: boolean = true;
let id: bigint = 123n;
let token: symbol = Symbol("token");

let missing: undefined = undefined;
let empty: null = null;
```

## Esempio pratico

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  description?: string;
};

const product: Product = {
  id: "p_1",
  name: "Monitor",
  price: 199.99,
  available: true,
};
```

`description?: string` indica una proprieta opzionale: puo essere una stringa oppure non essere presente.

## Varianti

- **Primitive type**: `string`, `number`, `boolean`.
- **Literal type**: `"draft"`, `42`, `true`.
- **Nullable union**: `string | null`.
- **Optional property**: `description?: string`.

## Errori comuni

- **Usare `String`, `Number`, `Boolean` al posto di `string`, `number`, `boolean`**: i primi sono wrapper object, quasi mai desiderati.
- **Dimenticare `undefined`**: un valore opzionale va gestito prima di usarlo.
- **Confondere `null` e `undefined`**: conviene scegliere una convenzione di progetto.
- **Pensare che `number` distingua interi e decimali**: JavaScript usa un unico tipo numerico principale.

## Checklist

- Usare primitive minuscole: `string`, `number`, `boolean`.
- Abilitare `strictNullChecks`.
- Esplicitare `null` solo quando fa parte del dominio.
- Usare literal types quando un campo ha pochi valori ammessi.
- Gestire sempre valori opzionali prima dell'uso.

## Collegamenti

- [[Introduzione a TypeScript]]
- [[Variabili e annotazioni di tipo]]
- [[Union e Intersection Types]]
