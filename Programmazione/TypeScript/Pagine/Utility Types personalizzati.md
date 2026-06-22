---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, utility-types, type-system, mapped-types]
aliases: [Custom utility types]
prerequisites: [Utility Types, Mapped Types, Conditional Types]
related: [Generics avanzati, Infer nei Conditional Types]
---

# Utility Types personalizzati

## Sintesi

Gli utility types personalizzati sono trasformazioni type-level create per esigenze specifiche del progetto. Permettono di esprimere regole ripetute senza duplicare tipi manualmente.

Vanno usati con misura: una utility ben nominata chiarisce il dominio, una troppo astratta rende il codice difficile da capire.

## Quando usarlo

- Quando una trasformazione di tipo ricorre spesso.
- Quando vuoi rendere esplicita una regola di dominio.
- Quando le utility standard non bastano.
- Quando lavori con modelli annidati.
- Quando vuoi derivare tipi da API, form o DTO.

## Come funziona

Si combinano generics, mapped types, conditional types, indexed access e `infer` per produrre nuovi tipi.

## API / Sintassi

```ts
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
```

## Esempio pratico

```ts
type RequireKeys<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

type DraftUser = {
  id?: string;
  email?: string;
  name?: string;
};

type PersistedUser = RequireKeys<DraftUser, "id" | "email">;
```

`PersistedUser` mantiene il modello originale ma rende obbligatori `id` ed `email`.

## Varianti

- **Utility superficiali**: trasformano solo il primo livello.
- **Utility profonde**: attraversano oggetti annidati.
- **Utility con key remapping**: rinominano proprieta.
- **Utility condizionali**: cambiano comportamento in base al tipo.
- **Utility di dominio**: codificano regole applicative.

## Errori comuni

- **Creare utility troppo generiche**: difficile prevedere tutti i casi.
- **Non testare i tipi**: una utility puo funzionare su un caso e rompersi su union o optional.
- **Rallentare il compilatore**: utility ricorsive profonde possono pesare.
- **Nascondere il dominio**: nomi astratti peggiorano comprensione.

## Checklist

- Dare nomi chiari e legati all'uso.
- Preferire utility standard quando bastano.
- Aggiungere esempi di input/output del tipo.
- Evitare ricorsione profonda se non necessaria.
- Verificare comportamento con optional, readonly e union.

## Collegamenti

- [[Utility Types]]
- [[Mapped Types]]
- [[Conditional Types]]
- [[Infer nei Conditional Types]]
