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
  - tuple
  - variadic-tuples
  - generics
aliases:
  - Variadic tuple type
  - Tuple variadiche
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Array, Tuple e Readonly]]"
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Firme di funzione e overload]]"
title: Variadic tuple types
---

# Variadic tuple types

## Sintesi

I variadic tuple types permettono di rappresentare tuple con una parte variabile usando la sintassi spread nei tipi, per esempio `[Head, ...Tail]`.

Sono utili per tipizzare funzioni che manipolano parametri, wrapper, curry, pipe, compose e helper che preservano la firma originale.

## Quando usarlo

- Wrapper di funzioni che preservano parametri.
- Utility per curry o partial application.
- Tuple con prefisso o suffisso fisso.
- Estrazione di head/tail da tuple.
- API dove il numero di argomenti e variabile ma tipizzato.

## Come funziona

Una tuple puo includere uno spread type. Con `infer` puoi estrarre parti di una tuple: primo elemento, resto, ultimo elemento o combinazioni.

Una tuple conserva posizione e lunghezza nota, un array aperto no. Uno spread di una tuple espande posizioni note; uno spread di `string[]` rappresenta una sequenza di lunghezza non nota. Le etichette come `context` documentano le posizioni: non creano proprieta dell'array e non cambiano la compatibilita.

Tuple variadiche da TS 4.0; rest in posizione iniziale/intermedia da TS 4.2. Esempi verificati con TS 5.9.3 e `strict: true`.

## API / Sintassi

```ts
type WithContext<TArgs extends readonly unknown[]> =
  [context: string, ...args: TArgs];
type RequestArgs = WithContext<readonly [id: string, active: boolean]>;
const args: RequestArgs = ["local", "u_1", true];
console.log(args[1]); // u_1
```

Accettare input readonly non rende automaticamente readonly il risultato: `RequestArgs` e una nuova tuple mutabile. Per il risultato in sola lettura scrivi `readonly [context: string, ...args: TArgs]`.

## Esempio pratico

```ts
type Fn = (...args: [id: string, active: boolean]) => void;

function withLog<TArgs extends unknown[], TResult>(
  fn: (this: void, ...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  return (...args) => {
    console.log("Function called");
    return fn(...args);
  };
}

const update = withLog((id: string, active: boolean) => {
  return { id, active };
});

console.log(update("u_1", true));
// Function called
// { id: "u_1", active: true }
```

La funzione wrapper conserva la tuple dei parametri e il ritorno di una singola firma. `Fn` mostra la forma equivalente con rest tuple. Il log non include gli argomenti, che potrebbero contenere dati sensibili; in produzione valuta anche se serve registrare la chiamata.

Il wrapper non fa `await` e non intercetta errori: conserva l'identita di una Promise restituita, propaga un throw sincrono e lascia al chiamante la gestione delle rejection. Non preserva automaticamente overload, firme generiche o proprieta della funzione. `this: void` dichiara che la callback non richiede un ricevitore; non passare un metodo non associato che usa `this`, anche se il suo tipo implicito non rende evidente il requisito. Usa una closure o `bind` quando necessario.

## Varianti

- **Tuple con prefisso**: `[First, ...Rest]`.
- **Tuple con suffisso**: `[...Rest, Last]`.
- **Estrazione head/tail**: `T extends [infer H, ...infer R]`.
- **Preservazione parametri funzione**: `TArgs extends unknown[]`.
- **Named tuple elements**: elementi con nome documentativo.

### Concatenare preservando le posizioni

```ts
function concat<T extends readonly unknown[], U extends readonly unknown[]>(
  left: T,
  right: U
): [...T, ...U] {
  return [...left, ...right];
}

const combined = concat(["u_1"] as const, [true, 3] as const);
// tipo: ["u_1", true, 3]
console.log(combined); // ["u_1", true, 3]
```

Lo spread runtime crea un nuovo array ma non clona gli oggetti contenuti. Con input `string[]` e `number[]` non si possono ricostruire lunghezze perse: il risultato ha elementi `string | number`, non tre posizioni fisse.

### Prefissi, suffissi e partial application

```ts
type Tail<T extends readonly unknown[]> =
  T extends readonly [unknown, ...infer Rest] ? Rest : never;
type Rest = Tail<readonly [string, boolean, number]>; // [boolean, number]
type Empty = Tail<[]>; // never, scelta esplicita dell'utility
type Open = Tail<string[]>; // never: non garantisce il primo elemento
type WithFlag = [...names: string[], enabled: boolean];

function bindFirst<First, Rest extends unknown[], Result>(
  fn: (this: void, first: First, ...rest: Rest) => Result,
  first: First
): (...rest: Rest) => Result {
  return (...rest) => fn(first, ...rest);
}

const label = bindFirst(
  (prefix: string, id: number) => `${prefix}:${id}`,
  "item"
);
console.log(label(7)); // item:7
```

Un rest aperto non puo essere seguito da un elemento opzionale o da un secondo rest aperto. Le tuple generiche possono invece espandersi in piu sequenze finite. `bindFirst` e una partial application limitata a una firma senza ricevitore, non un motore universale di curry/pipe; per casi ordinari una closure o `bind` puo essere piu leggibile.

## Errori comuni

- **Usare array generici quando serve una tuple precisa**: si perde informazione posizionale.
- **Rendere troppo complesse le firme**: difficile da leggere e debuggare.
- **Usare `any[]` invece di `unknown[]`**: riduce sicurezza.
- **Non preservare readonly tuple**: alcune utility devono gestire `readonly`.

## Checklist

- Usare variadic tuple types per API che preservano parametri.
- Preferire `unknown[]` a `any[]`.
- Mantenere esempi di chiamata per verificare inferenza.
- Usare nomi sugli elementi tuple quando aiutano documentazione.
- Evitare astrazioni troppo profonde se non necessarie.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Array, Tuple e Readonly|Array, Tuple e Readonly]]
- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/Infer nei Conditional Types|Infer nei Conditional Types]]

## Fonti

- [TypeScript 4.0: Variadic Tuple Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types).
- [TypeScript 4.2: leading e middle rest](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-2.html#leadingmiddle-rest-elements-in-tuple-types).
- [TypeScript: funzioni e this](https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
