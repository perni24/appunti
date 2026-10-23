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
  - recursive-types
  - type-system
aliases:
  - Tipi ricorsivi
  - Recursive type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
title: Recursive types
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

Sono due problemi diversi: descrivere un albero ricorsivo e calcolare un nuovo tipo attraversando un altro tipo. Il primo non esegue una visita dell'albero; il secondo richiede lavoro al checker e puo raggiungere limiti di istanziazione. Nessuno dei due previene cicli o stack overflow nel codice JavaScript.

Esempi verificati con TypeScript 5.9.3 e `strict: true`. Non esiste una profondita universale garantita per ogni trasformazione.

## API / Sintassi

```ts
type TreeNode = {
  id: string;
  children: TreeNode[];
};

function countNodes(node: TreeNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

const tree: TreeNode = {
  id: "root",
  children: [{ id: "leaf", children: [] }],
};
console.log(countNodes(tree)); // 2
```

L'esempio presume un albero finito, aciclico e di profondita contenuta. `children: []` rappresenta una foglia. Il tipo accetta anche un nodo che contiene se stesso: con grafi o input esterni servono rilevamento dei cicli, limiti di risorse e, quando necessario, una visita iterativa. I nodi condivisi verrebbero contati piu volte: definisci la semantica prima di riusare la funzione su un grafo.

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
console.log(JSON.stringify(data));
// {"user":{"id":"u_1","tags":["admin","editor"]}}
```

`JsonValue` e un'approssimazione strutturale dei dati JSON annidati, non un validatore o una garanzia di serializzazione. Non impone una profondita nel modello, ma memoria, parser e visite hanno limiti reali.

Il ramo `number` ammette anche `NaN` e infinito, che `JSON.stringify` serializza come `null`. Un array puo contenere se stesso pur essendo assegnabile a `JsonValue[]`, causando un errore durante la serializzazione. Il tipo non esclude automaticamente proprieta non enumerabili, getter o altre particolarita degli oggetti JavaScript. Per input esterni usa `unknown` e un parser con schema e limiti; `JSON.parse` verifica la sintassi JSON, non il tuo modello applicativo.

## Varianti

- **Ricorsione strutturale**: un tipo contiene se stesso.
- **Ricorsione con array**: `children: Node[]`.
- **Ricorsione con dizionario**: `{ [key: string]: JsonValue }`.
- **Utility ricorsive**: `DeepReadonly<T>`.

### Una trasformazione ricorsiva con caso base

```ts
type NestedElement<T> =
  T extends readonly (infer E)[] ? NestedElement<E> : T;

type A = NestedElement<readonly (readonly number[])[]>; // number
type B = NestedElement<string | number[][]>; // string | number
type C = NestedElement<[]>; // never
```

Il caso base e un valore non array. Ogni passo estrae un livello, ma non viene appiattito alcun array a runtime. Per una struttura autoreferenziale che e sempre un altro array il calcolo puo non terminare entro i limiti del checker. I conditional types ricorsivi sono supportati da TS 4.1; alcune forme beneficiano di ottimizzazioni da TS 4.5, senza eliminare ogni limite.

### Readonly profondo per dati semplici

```ts
type DeepReadonlyData<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonlyData<T[K]> }
  : T;

const source = { rows: [{ label: "A" }] };
const view: DeepReadonlyData<typeof source> = source;
// view.rows[0]!.label = "B"; // errore di compilazione
source.rows[0]!.label = "B";
console.log(view.rows[0]?.label); // B
```

Utility didattica per record, array e tuple di dati semplici: non e un `DeepReadonly` universale per funzioni, classi, `Date`, `Map` o `Set`. Il mapped type non protegge lo stato interno di metodi e istanze. Anche sui dati semplici non congela ne clona: l'alias `source` resta mutabile, come mostra l'esempio. Gli indici con `!` qui sono giustificati dal literal locale appena costruito, non da array arbitrari.

## Errori comuni

- **Creare ricorsioni troppo profonde**: il compilatore puo diventare lento o raggiungere limiti.
- **Usare recursive types dove basta un tipo piatto**: aumenta complessita.
- **Modellare JSON con `any`**: perde sicurezza.
- **Dimenticare la terminazione**: una trasformazione deve avere un caso base raggiungibile; una struttura dati deve prevedere come terminano le visite, anche in presenza di cicli.

## Checklist

- Usare recursive types solo per strutture realmente annidate.
- Definire casi base chiari.
- Evitare utility profonde se rallentano il progetto.
- Testare esempi validi e invalidi.
- Preferire validazione runtime per JSON esterno.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|Infer nei Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]

## Fonti

- [TypeScript 4.1: recursive conditional types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#recursive-conditional-types).
- [TypeScript 4.5: limiti e tail recursion](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-5.html#tail-recursion-elimination-on-conditional-types).
- [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), numeri non finiti e riferimenti circolari.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
