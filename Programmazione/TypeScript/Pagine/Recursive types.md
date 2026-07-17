---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, recursive-types, type-system]
aliases: [Tipi ricorsivi, Recursive type]
prerequisites: [Type Aliases e Interfaces, Conditional Types]
related: [Infer nei Conditional Types, Mapped Types]
---

# Recursive types

## Sintesi

I recursive types sono tipi che fanno riferimento a se stessi direttamente o indirettamente. Servono per modellare strutture annidate come alberi, JSON, menu, commenti e filesystem.

Sono potenti, ma possono diventare pesanti per il compilatore se usati in trasformazioni type-level molto profonde.

## Quando usarlo

- Alberi e gerarchie.
- Strutture JSON.
- Menu annidati.
- Commenti con risposte.
- Utility type profonde come `DeepReadonly` o `DeepPartial`.

## Come funziona

Un tipo puo contenere una proprieta che usa lo stesso tipo. Per trasformazioni ricorsive, si combinano conditional types e mapped types.

## API / Sintassi

```ts
type TreeNode = {
  id: string;
  children: TreeNode[];
};
```

## Esempio pratico

```ts
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const data: JsonValue = {
  user: {
    id: "u_1",
    tags: ["admin", "editor"],
  },
};
```

`JsonValue` descrive valori JSON annidabili a profondita arbitraria.

## Varianti

- **Ricorsione strutturale**: un tipo contiene se stesso.
- **Ricorsione con array**: `children: Node[]`.
- **Ricorsione con dizionario**: `{ [key: string]: JsonValue }`.
- **Utility ricorsive**: `DeepReadonly<T>`.

## Errori comuni

- **Creare ricorsioni troppo profonde**: il compilatore puo diventare lento o raggiungere limiti.
- **Usare recursive types dove basta un tipo piatto**: aumenta complessita.
- **Modellare JSON con `any`**: perde sicurezza.
- **Dimenticare casi base**: ogni tipo ricorsivo deve avere valori terminali.

## Checklist

- Usare recursive types solo per strutture realmente annidate.
- Definire casi base chiari.
- Evitare utility profonde se rallentano il progetto.
- Testare esempi validi e invalidi.
- Preferire validazione runtime per JSON esterno.

## Collegamenti

- [[Conditional Types]]
- [[Mapped Types]]
- [[Infer nei Conditional Types]]
