---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, keyof, typeof, type-operators]
aliases: [keyof, typeof TypeScript]
prerequisites: [Type Aliases e Interfaces, Generics]
related: [Indexed Access Types, Mapped Types, as const]
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
```

## Esempio pratico

```ts
const config = {
  apiUrl: "https://example.com",
  timeoutMs: 5000,
} as const;

type ConfigKey = keyof typeof config;

function readConfig(key: ConfigKey): (typeof config)[ConfigKey] {
  return config[key];
}
```

La funzione accetta solo chiavi realmente presenti in `config`.

## Varianti

- **`keyof T`**: union delle chiavi.
- **`typeof value`**: tipo derivato da valore.
- **`keyof typeof value`**: chiavi di un oggetto runtime.
- **`as const` + `typeof`**: preserva literal types.
- **`T[K]`**: accesso al tipo del valore.

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

- [[Indexed Access Types]]
- [[Mapped Types]]
- [[as const]]
