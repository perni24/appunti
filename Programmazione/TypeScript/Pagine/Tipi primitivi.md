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
  - tipi
  - primitive-types
aliases:
  - Tipi primitivi TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
title: Tipi primitivi
---

# Tipi primitivi

## Sintesi

I tipi primitivi in TypeScript descrivono i valori base ereditati da JavaScript: `string`, `number`, `boolean`, `bigint`, `symbol`, `null` e `undefined`.

Descrivono categorie di valori, non tutte le regole del dominio: `number` non significa "intero positivo" e `string` non significa "email valida".

## Quando usarlo

- Quando definisci parametri e ritorni di funzioni semplici.
- Quando descrivi campi base di oggetti e DTO.
- Quando vuoi distinguere valori presenti, assenti o opzionali.
- Quando vuoi evitare conversioni implicite poco chiare.

## Come funziona

Gli esempi usano TypeScript 5.9.3 con `strict: true` e target ES2022. Ogni blocco e indipendente. Un literal type come `"admin"` e piu specifico di `string`, ma non cambia il valore JavaScript.

| Tipo | Cosa non garantisce |
| --- | --- |
| `string` | Formato, lunghezza, encoding esterno o attendibilita. |
| `number` | Include frazioni, `NaN` e infinita; non garantisce precisione intera oltre l'intervallo sicuro. |
| `boolean` | Accetta solo `true` e `false`, non le stringhe `"true"` e `"false"`. |
| `bigint` | Rappresenta interi, non decimali; non si mescola a `number` nell'aritmetica ordinaria. |
| `symbol` | L'identita non coincide con la descrizione testuale del simbolo. |
| `null` / `undefined` | Sono valori distinti; il loro significato applicativo va deciso. |

Con `strictNullChecks` un parametro `string` non accetta automaticamente `null` o `undefined`. Dichiarare `string | null` rende esplicita l'assenza. Il controllo `value !== null` conserva anche la stringa vuota; un controllo di truthiness la scarterebbe.

`void` e `never` sono tipi del sistema statico, non nuovi primitivi JavaScript. `String`, `Number` e `Boolean` indicano tipi associati ai wrapper oggetto: per i normali valori usa le forme minuscole.

## API / Sintassi

```ts
let username: string = "luca";
let age: number = 34;
let active: boolean = true;
let id: bigint = 123n;
let token: symbol = Symbol("token");

let missing: undefined = undefined;
let empty: null = null;

console.log(typeof id, typeof empty); // "bigint", "object"
```

`typeof null` restituisce `"object"`, non `"null"`: per escludere `null` serve un controllo esplicito. I literal BigInt richiedono target almeno ES2020 e un runtime compatibile; alzare il target non aggiunge un polyfill.

## Esempio pratico

Un prodotto locale rappresenta il prezzo in centesimi interi. La funzione rifiuta valori non finiti, negativi o non sicuri: l'annotazione `number` da sola non basta.

```ts
type Product = {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
  description?: string;
};

function assertPriceCents(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("priceCents must be a non-negative safe integer");
  }
}

function describeProduct(product: Product): string {
  assertPriceCents(product.priceCents);
  const description = product.description ?? "Nessuna descrizione";
  return `${product.name}: ${product.priceCents} centesimi - ${description}`;
}

const product: Product = {
  id: "p_1",
  name: "Monitor",
  priceCents: 19999,
  available: true,
};

console.log(describeProduct(product));
// Monitor: 19999 centesimi - Nessuna descrizione
```

Il controllo riguarda il prezzo, non valida l'intero oggetto proveniente dall'esterno. Non sono implementati cambio valuta, imposte o arrotondamenti monetari. `??` conserva una descrizione vuota, mentre `||` la sostituirebbe.

`description?: string` consente l'assenza della proprieta; leggerla produce `string | undefined`. In scrittura:

- Con `exactOptionalPropertyTypes: false`, anche `{ description: undefined }` e accettato.
- Con `exactOptionalPropertyTypes: true`, `undefined` esplicito richiede `description?: string | undefined`.
- Una proprieta assente e una presente con valore `undefined` si distinguono con `Object.hasOwn`. Il valore letto puo essere uguale.

## Varianti

- **Primitive type**: `string`, `number`, `boolean`.
- **Literal type**: `"draft"`, `42`, `true`.
- **Nullable union**: `string | null`.
- **Optional property**: `description?: string`.
- **Unita di misura**: il nome `priceCents` comunica una convenzione, non crea automaticamente un tipo nominale diverso da altri numeri.

## Errori comuni

- **Usare `String`, `Number`, `Boolean` al posto di `string`, `number`, `boolean`**: i primi sono wrapper object, quasi mai desiderati.
- **Dimenticare `undefined`**: un valore opzionale va gestito prima di usarlo.
- **Confondere `null` e `undefined`**: conviene scegliere una convenzione di progetto.
- **Pensare che `number` distingua interi e decimali**: JavaScript usa un unico tipo numerico principale.
- **Convertire un BigInt enorme in Number**: la conversione puo perdere precisione.
- **Serializzare BigInt con JSON.stringify senza una convenzione**: normalmente genera `TypeError`; anche i simboli non vengono rappresentati come valori JSON ordinari.
- **Scambiare annotazione per conversione**: `const count: number = "3"` e un errore, non produce `3`.

## Checklist

- Usare primitive minuscole: `string`, `number`, `boolean`.
- Abilitare `strictNullChecks`.
- Esplicitare `null` solo quando fa parte del dominio.
- Usare literal types quando un campo ha pochi valori ammessi.
- Gestire sempre valori opzionali prima dell'uso.
- Separare formato, intervallo, unita di misura e rappresentazione statica.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Introduzione a TypeScript|Introduzione a TypeScript]]
- [[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo|Variabili e annotazioni di tipo]]
- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Oggetti e proprieta opzionali|Oggetti e proprieta opzionali]]
- [[Programmazione/JavaScript/Pagine/Tipi di Dati|Tipi di Dati JavaScript]]

## Fonti

- [TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), primitive e valori nullish.
- [TSConfig: strictNullChecks](https://www.typescriptlang.org/tsconfig/strictNullChecks.html) ed [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).
- [MDN: Number.isSafeInteger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger), [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) e [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
