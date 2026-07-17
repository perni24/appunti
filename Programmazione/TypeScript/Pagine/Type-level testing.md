---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, type-level-testing, testing, type-system]
aliases: [Test type-level]
prerequisites: [Utility Types, Conditional Types]
related: [Testing in TypeScript, Utility Types personalizzati]
---

# Type-level testing

## Sintesi

Il type-level testing verifica che tipi e utility TypeScript producano il risultato atteso. Non esegue logica runtime: controlla assegnabilita, inferenza, errori attesi e regressioni del type system.

E utile soprattutto per librerie, utility types e API generiche.

## Quando usarlo

- Utility types personalizzati.
- Librerie TypeScript pubbliche.
- Builder API generiche.
- Tipi generati.
- Regressioni su inferenza o overload.

## Come funziona

Si scrivono file di test che devono compilare o fallire. Alcuni strumenti usano assertion type-level, altri usano `@ts-expect-error` e `tsc --noEmit`.

## API / Sintassi

```ts
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

type Expect<T extends true> = T;
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

type UserId = User["id"];

type Test = Expect<Equal<UserId, string>>;
```

Se `UserId` non e piu `string`, il test non compila.

## Varianti

- **Compile-pass tests**: devono compilare.
- **Compile-fail tests**: devono fallire con `@ts-expect-error`.
- **Assertion helpers**: `Expect`, `Equal`.
- **Tool dedicati**: librerie per testare tipi.
- **Snapshot di tipi generati**: utile con codegen.

## Errori comuni

- **Testare solo runtime e ignorare API type-level pubbliche**.
- **Usare `@ts-ignore` invece di `@ts-expect-error`**.
- **Scrivere test troppo fragili su dettagli interni**.
- **Non eseguire `tsc --noEmit` in CI**.

## Checklist

- Testare utility types pubbliche.
- Usare `@ts-expect-error` per errori intenzionali.
- Eseguire type tests in CI.
- Mantenere test type-level piccoli.
- Distinguere test di tipo da test runtime.

## Collegamenti

- [[Testing in TypeScript]]
- [[Utility Types personalizzati]]
- [[Conditional Types]]
