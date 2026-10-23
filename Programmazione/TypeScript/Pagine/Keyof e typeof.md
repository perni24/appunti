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
  - keyof
  - typeof
  - type-operators
aliases:
  - keyof
  - typeof TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Indexed Access Types]]"
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/as const]]"
title: Keyof e typeof
---

# Keyof e typeof

## Sintesi

`keyof` e `typeof` sono operatori type-level fondamentali.

`keyof T` produce una union delle chiavi di un tipo oggetto. `typeof value`, usato in posizione di tipo, ricava il tipo TypeScript da un valore esistente.

## Quando usarlo

- Collegare chiavi e valori in funzioni generiche.
- Derivare tipi da oggetti costanti.
- Evitare duplicazione tra valore runtime e tipo statico.
- Costruire mapped types.
- Creare API che accettano solo chiavi valide.

## Come funziona

`keyof` lavora su tipi. `typeof` in TypeScript puo lavorare su valori per ottenere il loro tipo statico. Insieme permettono di partire da oggetti runtime e derivare tipi precisi.

In posizione di tipo, `typeof` non esegue l'espressione: accetta riferimenti a variabili e proprieta, non chiamate arbitrarie come `typeof createConfig()`. Per il risultato di una funzione usa `ReturnType<typeof createConfig>`. In un'espressione, invece, `typeof config` e l'operatore JavaScript e restituisce per esempio la stringa `"object"`.

Gli esempi usano TS 5.9.3 con `strict: true`; i tipi non validano le chiavi ricevute dalla rete.

## API / Sintassi

```ts
type User = {
  id: string;
  email: string;
};

type UserKey = keyof User;

const roles = {
  admin: "ADMIN",
  user: "USER",
} as const;

type RoleKey = keyof typeof roles;
type RoleValue = (typeof roles)[RoleKey]; // "ADMIN" | "USER"
console.log(typeof roles); // object
```

## Esempio pratico

```ts
const config = {
  apiUrl: "https://example.com",
  timeoutMs: 5000,
} as const;

type ConfigKey = keyof typeof config;

function readConfig<K extends ConfigKey>(key: K): (typeof config)[K] {
  return config[key];
}

const timeout = readConfig("timeoutMs"); // tipo: 5000
console.log(timeout); // 5000
```

La funzione accetta le chiavi del tipo di `config` e conserva la relazione con il risultato. La firma non generica `readConfig(key: ConfigKey): (typeof config)[ConfigKey]` restituirebbe sempre la union di tutti i valori, anche chiamandola con `"timeoutMs"`. Qui non viene eseguita alcuna richiesta HTTP.

`as const` mantiene i literal e rende readonly le proprieta dell'espressione, ma non congela l'oggetto a runtime. `const` da solo impedisce la riassegnazione del binding, non l'allargamento di ogni proprieta mutabile.

## Varianti

- **`keyof T`**: union delle chiavi.
- **`typeof value`**: tipo derivato da valore.
- **`keyof typeof value`**: chiavi di un oggetto runtime.
- **`as const` + `typeof`**: preserva literal types.
- **`T[K]`**: accesso al tipo del valore.

### Index signature, symbol e union

```ts
const token = Symbol("token");
type Model = { id: string; 0: boolean; [token]: number };
type ModelKey = keyof Model; // "id" | 0 | typeof token
type DictionaryKey = keyof { [key: string]: number }; // string | number
type NumericKey = keyof { [key: number]: string }; // number

type Item = { id: string; text: string } | { id: string; count: number };
type CommonKey = keyof Item; // "id"
```

La chiave numerica di un oggetto viene rappresentata come stringa nelle normali operazioni JavaScript, ma i tipi possono distinguere literal numerici; i symbol restano chiavi separate. `keyof` di una union contiene le chiavi utilizzabili su ogni variante, non tutte le chiavi di tutte le varianti.

### Perche Object.keys non equivale a keyof

```ts
const full = { id: "u_1", debug: true };
const view: { id: string } = full;
type VisibleKey = keyof typeof view; // "id"
console.log(Object.keys(view)); // ["id", "debug"]
```

Il sistema e strutturale: una vista piu stretta non rimuove campi runtime. Inoltre `Object.keys` enumera solo proprieta proprie, enumerabili e stringa, mentre `keyof` non e una descrizione dell'enumerabilita. Per questo un helper generico che forza `Object.keys(obj) as (keyof T)[]` puo mentire. Usa una lista esplicita di chiavi consentite o una validazione coerente con l'operazione.

## Errori comuni

- **Confondere `typeof` runtime e type-level**: hanno sintassi simile ma contesti diversi.
- **Dimenticare `as const`**: i literal possono allargarsi a `string` o `number`.
- **Usare `string` invece di `keyof T`**: perdi controllo sulle chiavi.
- **Non considerare `number` e `symbol`**: `keyof` non e sempre solo stringhe.

## Checklist

- Usare `keyof` per chiavi valide.
- Usare `typeof` per derivare tipi da costanti.
- Combinare `as const` quando servono literal types.
- Usare indexed access per collegare chiave e valore.
- Evitare duplicazione manuale tra oggetto e tipo.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Indexed Access Types|Indexed Access Types]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]

## Fonti

- [TypeScript: keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html).
- [TypeScript: typeof nei tipi](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html).
- [MDN: Object.keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
