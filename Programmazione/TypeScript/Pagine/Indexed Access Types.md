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
  - indexed-access-types
  - keyof
  - type-system
aliases:
  - Indexed access type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
title: Indexed Access Types
---

# Indexed Access Types

## Sintesi

Gli indexed access types permettono di ottenere il tipo di una proprieta usando la sintassi `T[K]`.

Sono utili quando vuoi collegare tipi senza duplicarli: se cambia il tipo originale, anche il tipo derivato si aggiorna.

## Quando usarlo

- Estrarre il tipo di una proprieta da un oggetto.
- Collegare una chiave al tipo del valore corrispondente.
- Costruire funzioni come `getProperty`.
- Derivare tipi da array, tuple e oggetti.
- Evitare duplicazione tra modelli correlati.

## Come funziona

Dato un tipo oggetto `T`, puoi accedere al tipo di una proprieta con `T["property"]`. Se la chiave e una union, il risultato e la union dei tipi corrispondenti.

Non e un accesso JavaScript: `type Value = Settings["theme"]` non legge un oggetto. Invece `settings["theme"]` in un'espressione restituisce un valore. Le chiavi devono essere tipi validi per il modello; per una union di oggetti puoi indicizzare direttamente solo le chiavi comuni, salvo prima filtrare o distribuire la union.

Esempi verificati con TS 5.9.3 e `strict: true`. Le opzioni aggiuntive sono indicate dove cambiano le garanzie.

## API / Sintassi

```ts
type User = {
  id: string;
  age: number;
};

type UserId = User["id"];
type UserValue = User[keyof User];
```

## Esempio pratico

```ts
type Settings = {
  theme: "light" | "dark";
  retries: number;
};

function getSetting<TKey extends keyof Settings>(
  settings: Settings,
  key: TKey
): Settings[TKey] {
  return settings[key];
}

const theme = getSetting({ theme: "dark", retries: 3 }, "theme");
console.log(theme); // dark
```

`theme` viene inferito come `"light" | "dark"`, non come `string`, ma neppure come il solo literal `"dark"`: la firma riceve `Settings`, quindi usa quel modello. Con `key: keyof Settings` il ritorno e la union dei valori possibili. Questo getter non controlla input esterni e non rende sicuro un cast da `string` a una chiave del modello.

## Varianti

- **Accesso a proprieta singola**: `T["id"]`.
- **Accesso con union di chiavi**: `T["id" | "email"]`.
- **Accesso con `keyof`**: `T[keyof T]`.
- **Array element type**: `T[number]`.
- **Tuple element type**: `Tuple[0]`.

### Array, tuple e assenza di elementi

```ts
const roles = ["reader", "editor"] as const;
type Role = (typeof roles)[number]; // "reader" | "editor"
type FirstRole = (typeof roles)[0]; // "reader"

function firstRole(items: readonly Role[]): Role | undefined {
  return items[0];
}
console.log(firstRole([])); // undefined
```

`T[number]` ricava il tipo degli elementi, non certifica che l'array sia non vuoto o che un indice esista. `noUncheckedIndexedAccess`, non incluso in `strict`, aggiunge `undefined` a letture indicizzate non garantite. Non modifica invece `type Element = string[][number]`, che resta `string`. Una tuple nota permette di controllare staticamente indici letterali fuori dalla sua lunghezza.

### Proprieta opzionali e chiavi ottenute da valori

```ts
type User = { id: string; profile?: { label: string } };
type Profile = User["profile"]; // { label: string } | undefined
type Label = NonNullable<Profile>["label"]; // string

const key = "id";
type Id = User[typeof key]; // string
const user: User = { id: "u_1" };
console.log(user.profile?.label); // undefined
```

`NonNullable` elimina nullish dal **tipo**, non crea `profile`: nel codice servono optional chaining o un controllo. `User[key]` non e valido perche `key` e un valore; `typeof key` ricava il suo tipo letterale. Una variabile `let key = "id"` normalmente si allarga a `string` e perde questa precisione.

## Errori comuni

- **Usare stringhe non chiave**: `T["missing"]` fallisce se la chiave non esiste.
- **Duplicare tipi invece di indicizzarli**: aumenta incoerenza.
- **Perdere precisione con chiavi larghe**: `string` e meno utile di `keyof T`.
- **Dimenticare array e tuple**: `typeof list[number]` e spesso molto utile.

## Checklist

- Usare indexed access per derivare tipi da fonti esistenti.
- Vincolare le chiavi con `keyof`.
- Preferire chiavi specifiche a `string`.
- Usare `T[number]` per estrarre elementi da array.
- Combinare con mapped types per trasformazioni piu grandi.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Array, Tuple e Readonly|Array, Tuple e Readonly]]

## Fonti

- [TypeScript: Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html).
- [TypeScript: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).
- [TypeScript: NonNullable](https://www.typescriptlang.org/docs/handbook/utility-types.html#nonnullabletype).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
