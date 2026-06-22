---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, tuple, variadic-tuples, generics]
aliases: [Variadic tuple type, Tuple variadiche]
prerequisites: [Array, Tuple e Readonly, Generics avanzati]
related: [Infer nei Conditional Types, Firme di funzione e overload]
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

## API / Sintassi

```ts
type WithContext<TArgs extends unknown[]> = [context: string, ...args: TArgs];
```

## Esempio pratico

```ts
type Fn = (...args: [id: string, active: boolean]) => void;

function withLog<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  return (...args) => {
    console.log(args);
    return fn(...args);
  };
}

const update = withLog((id: string, active: boolean) => {
  return { id, active };
});

update("u_1", true);
```

La funzione wrapper conserva i parametri originali.

## Varianti

- **Tuple con prefisso**: `[First, ...Rest]`.
- **Tuple con suffisso**: `[...Rest, Last]`.
- **Estrazione head/tail**: `T extends [infer H, ...infer R]`.
- **Preservazione parametri funzione**: `TArgs extends unknown[]`.
- **Named tuple elements**: elementi con nome documentativo.

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

- [[Array, Tuple e Readonly]]
- [[Generics avanzati]]
- [[Infer nei Conditional Types]]
