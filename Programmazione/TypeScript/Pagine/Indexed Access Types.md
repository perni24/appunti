---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, indexed-access-types, keyof, type-system]
aliases: [Indexed access type]
prerequisites: [Keyof e typeof, Type Aliases e Interfaces]
related: [Mapped Types, Utility Types]
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
```

`theme` viene inferito come `"light" | "dark"`, non come valore generico.

## Varianti

- **Accesso a proprieta singola**: `T["id"]`.
- **Accesso con union di chiavi**: `T["id" | "email"]`.
- **Accesso con `keyof`**: `T[keyof T]`.
- **Array element type**: `T[number]`.
- **Tuple element type**: `Tuple[0]`.

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

- [[Keyof e typeof]]
- [[Mapped Types]]
- [[Utility Types]]
