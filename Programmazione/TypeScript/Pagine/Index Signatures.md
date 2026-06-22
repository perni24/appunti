---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, index-signatures, object-types, dictionary]
aliases: [Index Signature, Dizionari TypeScript]
prerequisites: [Oggetti e proprieta opzionali, Type Aliases e Interfaces]
related: [Mapped Types, Record, Keyof e typeof]
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

Una index signature dichiara il tipo della chiave e il tipo del valore. In JavaScript le chiavi degli oggetti sono principalmente stringhe o simboli; TypeScript supporta index signature string, number e symbol.

Le proprieta esplicite devono essere compatibili con il tipo indicizzato.

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

## Esempio pratico

```ts
type FeatureFlags = {
  [flagName: string]: boolean;
};

function isEnabled(flags: FeatureFlags, name: string): boolean {
  return flags[name] ?? false;
}

const flags: FeatureFlags = {
  darkMode: true,
  betaDashboard: false,
};
```

La funzione accetta qualunque nome flag e gestisce il caso in cui la chiave non esista.

## Varianti

- **Index signature string**: `{ [key: string]: Value }`.
- **Index signature number**: `{ [index: number]: Value }`.
- **`Record<K, V>`**: alternativa per insiemi noti di chiavi.
- **Mapped type**: forma piu precisa quando le chiavi sono una union.

## Errori comuni

- **Usare index signature troppo larga**: `{ [key: string]: any }` elimina sicurezza.
- **Dimenticare chiavi mancanti**: `obj[key]` puo essere `undefined`, soprattutto con `noUncheckedIndexedAccess`.
- **Mescolare proprieta esplicite incompatibili**: devono rispettare il tipo della signature.
- **Usare oggetti come mappe complesse**: per chiavi non stringa, spesso `Map` e piu adatto.

## Checklist

- Usare index signature solo per chiavi davvero dinamiche.
- Preferire `Record` o mapped types per chiavi note.
- Abilitare `noUncheckedIndexedAccess` nei progetti rigorosi.
- Evitare `any` come valore.
- Gestire il caso di chiave assente.

## Collegamenti

- [[Oggetti e proprieta opzionali]]
- [[Mapped Types]]
- [[Keyof e typeof]]
