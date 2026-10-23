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
  - variabili
  - type-annotations
aliases:
  - Annotazioni di tipo
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
title: Variabili e annotazioni di tipo
---

# Variabili e annotazioni di tipo

## Sintesi

Le annotazioni di tipo permettono di dichiarare esplicitamente il tipo atteso per variabili, parametri, ritorni di funzione e proprieta.

In TypeScript non serve annotare tutto: si annotano soprattutto confini pubblici, parametri, ritorni importanti e valori che l'inferenza non riesce a descrivere bene.

## Quando usarlo

- Parametri di funzione.
- Ritorni di funzioni pubbliche o complesse.
- Oggetti esportati da un modulo.
- Variabili inizializzate piu tardi.
- API tra moduli, layer o componenti.

## Come funziona

L'annotazione si scrive dopo il nome, separata da `:`; per il risultato di una funzione viene dopo la lista dei parametri. Descrive il contratto statico, senza convertire o validare il valore a runtime.

Gli esempi sono indipendenti, verificati con TypeScript 5.9.3 e `strict: true`. `let`, `const`, scope e mutazione mantengono la semantica JavaScript. `const` blocca la riassegnazione del binding, non le modifiche alle proprieta.

Il tipo dichiarato resta il limite per le assegnazioni future, anche quando il flusso lo restringe temporaneamente:

```ts
let selectedId: string | null = null;
selectedId = "u_1";
console.log(selectedId.toUpperCase()); // U_1: qui e string.
selectedId = null; // Ancora valido: il contratto comprende null.
// selectedId = 12; // Errore statico.
```

## API / Sintassi

```ts
const displayName: string = "Luca";
let count: number = 0;

function sum(a: number, b: number): number {
  return a + b;
}
```

Un parametro di funzione dichiarata senza contesto va normalmente annotato. Invece in `["a", "b"].map(value => value.toUpperCase())`, `value` viene inferito come `string`: non serve ripetere il tipo.

## Esempio pratico

Calcolo locale, senza rete o salvataggi. `CartLine` documenta i parametri; il corpo impone in piu interi sicuri, quantita positive e limite sul prodotto.

```ts
type CartLine = {
  unitPriceCents: number;
  quantity: number;
};

function calculateLineTotal(line: CartLine): number {
  if (!Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new RangeError("Invalid unit price");
  }
  if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
    throw new RangeError("Invalid quantity");
  }
  const total = line.unitPriceCents * line.quantity;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Total exceeds the safe integer range");
  }
  return total;
}

const line: CartLine = { unitPriceCents: 1250, quantity: 2 };
const total = calculateLineTotal(line); // Inferito come number.
console.log(total); // 2500
```

`total` non richiede annotazione. Il ritorno esplicito impedisce di cambiare per errore la funzione in una che restituisce una stringa; non dimostra che il calcolo sia corretto. Input esterni devono comunque attraversare un parser prima di essere trattati come `CartLine`.

Annotare una variabile non assegna un valore:

```ts
function readUninitialized(): number {
  let result: number;
  // return result; // Errore: usata prima dell'assegnazione.
  result = 10;
  return result;
}
```

Evitare `!` per aggirare il controllo senza una garanzia reale di inizializzazione.

## Varianti

- **Annotazione variabile**: `let value: number`.
- **Annotazione parametro**: `function f(value: number)`.
- **Annotazione ritorno**: `function f(): string`.
- **Annotazione oggetto**: `const user: User = ...`.
- **Asserzione**: `value as User` comunica un'assunzione al checker, non e equivalente a un'annotazione verificata sull'inizializzatore.
- **satisfies**: verifica la compatibilita con un tipo mantenendo informazioni utili dell'espressione; vedi la nota dedicata.

## Errori comuni

- **Annotare valori ovvi**: `const x: number = 1` spesso e rumore.
- **Aspettarsi inferenza dai chiamanti per una normale dichiarazione di funzione**: senza annotazione o contesto il parametro puo diventare implicitamente `any`.
- **Annotare ritorni troppo larghi**: un ritorno `object` o `any` nasconde informazioni utili.
- **Usare annotazioni per forzare il compilatore**: se il tipo non combacia, va capito il problema invece di mascherarlo.

## Checklist

- Annotare parametri di funzione.
- Annotare API esportate o pubbliche.
- Lasciare inferire variabili locali semplici.
- Preferire type alias o interface per oggetti non banali.
- Evitare `any` come annotazione di comodo.
- Controllare inizializzazione e regole runtime, non soltanto assegnabilita.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Tipi primitivi|Tipi primitivi]]
- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Assertion e casting dei tipi|Assertion e casting dei tipi]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]

## Fonti

- [TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), annotazioni e inferenza contestuale.
- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), assegnamenti e tipo dichiarato.
- [TSConfig: noImplicitAny](https://www.typescriptlang.org/tsconfig/noImplicitAny.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
