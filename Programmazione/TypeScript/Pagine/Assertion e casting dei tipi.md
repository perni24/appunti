---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, type-assertion, casting, type-safety]
aliases: [Type assertions, Casting TypeScript]
prerequisites: [any, unknown e never, Type Narrowing]
related: [Type Guards, Assertion functions]
---

# Assertion e casting dei tipi

## Sintesi

Le type assertion dicono al compilatore di trattare un valore come un certo tipo. Sono spesso chiamate "casting", ma in TypeScript non trasformano il valore a runtime: cambiano solo il modo in cui il compilatore lo interpreta.

Vanno usate con cautela, perche possono aggirare controlli importanti.

## Quando usarlo

- Quando conosci piu informazioni del compilatore.
- Quando lavori con API DOM o librerie non tipizzate perfettamente.
- Dopo validazioni runtime non rappresentate dal type system.
- Durante migrazioni da JavaScript a TypeScript.
- In punti di integrazione con dati legacy.

## Come funziona

La sintassi principale e `value as Type`. TypeScript accetta l'assertion se i tipi sono sufficientemente compatibili. Per forzature estreme si vede talvolta `as unknown as Type`, ma e un segnale di rischio.

L'assertion non modifica il dato reale.

## API / Sintassi

```ts
const input = document.querySelector("input") as HTMLInputElement | null;

if (input) {
  input.value = "ciao";
}
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
}

const raw: unknown = JSON.parse('{"id":"u_1","email":"luca@example.com"}');

if (isUser(raw)) {
  console.log(raw.email);
}
```

Qui un type guard e piu sicuro di `raw as User`, perche controlla il dato.

## Varianti

- **Type assertion**: `value as Type`.
- **Non-null assertion**: `value!`.
- **Const assertion**: `as const`.
- **Double assertion**: `value as unknown as Type`, da evitare salvo casi eccezionali.

## Errori comuni

- **Pensare che `as` converta il valore**: non fa parsing, validazione o trasformazione.
- **Usare `!` per ignorare `null` e `undefined`**: puo produrre errori runtime.
- **Assertare input esterni senza validazione**: rompe il confine tra runtime e type system.
- **Usare double assertion come scorciatoia**: spesso indica un modello tipi sbagliato.

## Checklist

- Preferire narrowing e type guard alle assertion.
- Usare assertion solo in punti locali e motivati.
- Non assertare dati di rete senza validazione runtime.
- Evitare `!` se puoi gestire esplicitamente il caso nullo.
- Controllare se il problema si risolve con tipi piu precisi.

## Collegamenti

- [[any, unknown e never]]
- [[Type Guards]]
- [[Assertion functions]]
- [[as const]]
