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
  - index-signatures
  - object-types
  - dictionary
aliases:
  - Index Signature
  - Dizionari TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Oggetti e proprieta opzionali]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
title: Index Signatures
---

# Index Signatures

## Sintesi

Le index signatures descrivono oggetti con chiavi dinamiche, dove non conosci in anticipo tutti i nomi delle proprieta ma conosci il tipo dei valori.

Sono utili per dizionari, mappe semplici e strutture indicizzate da stringhe o numeri.

## Quando usarlo

- Dizionari di configurazione.
- Oggetti indicizzati da ID.
- Tabelle di lookup.
- Conteggi per categoria.
- Wrapper attorno a JSON con chiavi dinamiche.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022. In JavaScript una chiave di proprieta e una stringa o un simbolo; un numero usato come chiave viene convertito in stringa.

TypeScript permette index signature per string, number, symbol e pattern template literal. Se convivono indexer number e string, il valore del primo deve essere compatibile con quello del secondo, perche `obj[1]` e `obj["1"]` accedono alla stessa proprieta.

Le proprieta esplicite coperte dalla signature devono rispettarne il tipo. **La signature non crea chiavi, non valida dati e non assicura che una chiave esista.**

## API / Sintassi

```ts
type Scores = {
  [userId: string]: number;
};

const scores: Scores = {
  u_1: 10,
  u_2: 20,
};
```

Con `noUncheckedIndexedAccess: true`, `scores["missing"]` ha tipo `number | undefined`. Senza l'opzione il tipo puo essere soltanto `number`, ma il valore assente rimane `undefined` a runtime. `strict` non attiva automaticamente questa opzione.

## Esempio pratico

Lookup di soli flag propri con valore esattamente `true`:

```ts
type FeatureFlags = {
  [flagName: string]: boolean;
};

function isEnabled(flags: FeatureFlags, name: string): boolean {
  return Object.hasOwn(flags, name) && flags[name] === true;
}

const flags: FeatureFlags = {
  darkMode: true,
  betaDashboard: false,
};

console.log(isEnabled(flags, "darkMode")); // true
console.log(isEnabled(flags, "missing")); // false
console.log(isEnabled(flags, "toString")); // false
```

Il controllo di proprieta propria evita di leggere il prototipo come se fosse una configurazione. Con il solo `flags[name] ?? false`, `"toString"` puo restituire la funzione ereditata, violando la promessa di ritorno booleano nonostante il type check.

Questo lookup non e un parser dell'intero oggetto: dati esterni richiedono ancora validazione. Si assumono record ordinari, non getter o Proxy ostili; non sono implementate scritture di chiavi arbitrarie.

### Chiavi note e chiavi dinamiche

```ts
type FlagName = "darkMode" | "betaDashboard";
const complete: Record<FlagName, boolean> = {
  darkMode: true,
  betaDashboard: false,
};
const overrides: Partial<Record<FlagName, boolean>> = {};
// complete.unknown = true; // Errore: chiave non prevista.
```

`Record<FlagName, boolean>` richiede tutte le chiavi della union; `Partial` le rende facoltative. `Record<string, boolean>` invece descrive un dizionario aperto, non un oggetto che contiene ogni stringa possibile. Per una raccolta sparsa puoi rendere esplicita l'assenza con valori `boolean | undefined` o usare `Map`.

### Proprieta esplicite e accesso per indice

```ts
type Inventory = {
  label: string;
  quantities: { [sku: string]: number };
};

const inventory: Inventory = { label: "Magazzino", quantities: { pen: 3 } };
const count = inventory.quantities["pen"] ?? 0;
console.log(count); // 3
```

Separare metadati e dizionario evita di allargare tutti i valori a `string | number` solo per aggiungere una label.

`noPropertyAccessFromIndexSignature` richiede la notazione `obj["key"]` per proprieta note solo tramite index signature. E distinta da `noUncheckedIndexedAccess`: chiarisce l'origine del campo, non controlla la sua esistenza.

## Varianti

- **Index signature string**: `{ [key: string]: Value }`.
- **Index signature number**: `{ [index: number]: Value }`.
- **Pattern di chiavi**: ``{ [key: `data-${string}`]: string }`` per una famiglia con prefisso.
- **`Record<K, V>`**: mapped type utile per chiavi note, ma utilizzabile anche con `string`.
- **Mapped type**: forma piu precisa quando le chiavi sono una union.
- **Map<K, V>**: chiavi anche oggetto, assenza espressa da `get`, nessuna confusione con le proprieta del prototipo nella raccolta.

## Errori comuni

- **Usare index signature troppo larga**: `{ [key: string]: any }` elimina sicurezza.
- **Dimenticare chiavi mancanti**: il rischio runtime esiste anche senza `noUncheckedIndexedAccess`; l'opzione lo rende piu visibile al checker.
- **Mescolare proprieta esplicite incompatibili**: devono rispettare il tipo della signature.
- **Usare oggetti come mappe complesse**: per chiavi non stringa, spesso `Map` e piu adatto.

## Checklist

- Usare index signature solo per chiavi davvero dinamiche.
- Preferire `Record` o mapped types per chiavi note.
- Abilitare `noUncheckedIndexedAccess` nei progetti rigorosi.
- Evitare `any` come valore.
- Gestire il caso di chiave assente.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Oggetti e proprieta opzionali|Oggetti e proprieta opzionali]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/JavaScript/Pagine/Map e Set|Map e Set JavaScript]]

## Fonti

- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html), index signatures.
- [TSConfig: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html) e [noPropertyAccessFromIndexSignature](https://www.typescriptlang.org/tsconfig/noPropertyAccessFromIndexSignature.html).
- [TypeScript 4.4: symbol e template string pattern index signatures](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html).
- [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn), proprieta proprie.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
