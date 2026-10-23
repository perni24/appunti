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
  - inference
  - generics
  - type-system
aliases:
  - Inferenza avanzata TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
related:
  - "[[Programmazione/TypeScript/Pagine/const type parameters]]"
  - "[[Programmazione/TypeScript/Pagine/satisfies operator]]"
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
title: Type inference avanzata
---

# Type inference avanzata

## Sintesi

L'inferenza raccoglie informazioni da argomenti, espressioni e contesto per determinare i tipi. Progettare una buona firma significa conservare le relazioni utili senza promettere proprieta che il codice non garantisce.

Baseline: **TypeScript 5.9.3**, `strict: true`, target `ES2022`. I blocchi sono indipendenti. Il compilatore analizza il codice: non esegue la funzione per scoprire quale valore restituira.

## Quando usarlo

- Scrivere helper generici con chiamate brevi e risultati precisi.
- Tipizzare callback attraverso il loro contesto.
- Conservare letterali nelle configurazioni.
- Capire perche un'annotazione o un argomento generico esplicito cambia il risultato.

## Come funziona

Le principali fonti di informazione sono:

- gli argomenti da cui inferire i parametri generici;
- il tipo atteso, che puo contestualizzare una funzione o un letterale;
- le espressioni restituite da una funzione;
- vincoli e default dei parametri di tipo.

Non esiste una regola generale "viene scelto sempre il tipo piu stretto". Widening, mutabilita e posizione dell'espressione possono cambiare il risultato. Un vincolo `extends` definisce cio che la funzione puo assumere, non obbliga a restituire esattamente quel vincolo.

## API / Sintassi

### Argomenti e contextual typing

```ts
function mapValues<T, U>(
  values: readonly T[],
  transform: (value: T) => U,
): U[] {
  return values.map(transform);
}

const lengths = mapValues(["alpha", "beta"], value => value.length);
console.log(lengths.join(",")); // 5,4
```

L'array permette di inferire `T = string`; il callback riceve quindi un parametro `string` senza annotazione. Il risultato del callback determina `U = number`. Una funzione dichiarata separatamente senza contesto, invece, non riceve il tipo del parametro retroattivamente solo perche viene passata in seguito a `mapValues`.

### Configurazione e const type parameters

```ts
function defineConfig<const T extends object>(config: T): T {
  return config;
}

const config = defineConfig({
  mode: "strict",
  routes: ["home", "settings"],
});
// mode: "strict"; routes: readonly ["home", "settings"]

const existing = { mode: "strict" };
const reused = defineConfig(existing);
// reused.mode: string; il valore era gia stato allargato

console.log(config.mode, reused === existing); // strict true
```

Il parametro `const` favorisce l'inferenza letterale delle espressioni scritte nella chiamata. Non ricostruisce informazioni perse in una variabile, non clona l'oggetto e non lo congela. Il readonly inferito non e `Object.freeze`.

## Esempio pratico

### Conservare le chiavi senza garantire presenze inesistenti

Una collezione di chiavi non prova che ogni membro della loro union sia presente. Un array dinamico puo contenere solo alcune chiavi, duplicati o nessun elemento.

```ts
function createMap<const TItems extends readonly string[]>(
  items: TItems,
): Map<TItems[number], boolean> {
  const flags = new Map<TItems[number], boolean>();
  for (const item of items) flags.set(item, true);
  return flags;
}

const flags = createMap(["read", "write"]);
console.log(flags.get("read")); // true
// flags.get("delete"); // errore: chiave non ammessa

const selected: Array<"read" | "write"> = ["read"];
const partial = createMap(selected);
console.log(partial.get("write")); // undefined
```

La firma conserva la union delle chiavi ammesse. `Map.get` restituisce `boolean | undefined`: modella anche l'assenza di una chiave ammessa.

Un cast da `Object.fromEntries` a `Record<TItems[number], boolean>` prometterebbe troppo nel secondo caso: anche `write` risulterebbe obbligatoria. L'assertion non dimostrerebbe questa presenza. Per un oggetto-dizionario serve un contratto che ammetta chiavi mancanti e consideri accessi al prototipo; qui `Map` evita anche quel problema.

## Varianti

### Parametri generici espliciti e default

```ts
function pair<A, B = unknown>(first: A, second: B): [A, B] {
  return [first, second];
}

const inferred = pair("id", 42); // [string, number]
const explicit = pair<string>("id", 42); // [string, unknown]
console.log(inferred[1].toFixed(0)); // 42
// explicit[1].toFixed(0); // errore: unknown
```

Specificare solo `A` non significa "inferisci sempre gli altri parametri": in questa chiamata `B` usa il default. Per conservare l'inferenza puoi non specificare i generics, specificarli entrambi oppure riprogettare l'API in due chiamate con currying se serve davvero.

### Inferenza, verifica e contratti pubblici

- `satisfies` verifica la compatibilita e puo fornire contesto; non e un cast.
- `NoInfer<T>` puo impedire che un argomento alteri il parametro inferito da un altro. Vedi [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]; non va aggiunto ovunque.
- `infer` nei conditional types estrae parti di tipi esistenti; non analizza valori runtime. Vedi [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|infer nei conditional types]].
- Per una funzione sovraccarica, l'estrazione con `ReturnType` usa l'ultima firma visibile: e diversa dalla scelta di un overload per una chiamata concreta. Vedi [[Programmazione/TypeScript/Pagine/Firme di funzione e overload|Firme di funzione e overload]].
- Un tipo di ritorno esplicito e utile per stabilizzare un'API pubblica, anche se meno stretto del risultato che il compilatore inferirebbe.

## Errori comuni

- Annotare troppo presto un valore con un tipo ampio e aspettarsi che un helper recuperi i letterali.
- Sostituire una relazione generica con `any`.
- Credere che un cast finale renda corretta un'implementazione.
- Usare un record totale per una raccolta di chiavi solo parzialmente presente.
- Presumere che l'inferenza dei parametri avvenga dalle future chiamate di una funzione gia dichiarata.

## Checklist

- Ogni parametro generico rappresenta una relazione effettiva?
- Il callback ha un contesto sufficiente?
- Il valore e stato allargato prima della chiamata?
- Il risultato ammette assenze e casi vuoti reali?
- Gli argomenti generici espliciti stanno attivando un default inatteso?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/const type parameters|const type parameters]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]

## Fonti

- [TypeScript - Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [TypeScript - Generic Parameter Defaults](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults)
- [TypeScript 5.0 - const Type Parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
