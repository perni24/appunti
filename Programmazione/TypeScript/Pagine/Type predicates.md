---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, type-predicates, type-guards, narrowing]
aliases: [Type predicate, value is Type]
prerequisites: [Type Guards, Type Narrowing]
related: [Assertion functions, Discriminated Unions]
---

# Type predicates

## Sintesi

Un **type predicate** e una firma di ritorno speciale del tipo `value is Type`. Dice a TypeScript che, se la funzione restituisce `true`, il valore controllato puo essere trattato come `Type`.

E il meccanismo principale per creare type guard personalizzati.

## Quando usarlo

- Quando un controllo runtime va riutilizzato.
- Quando devi filtrare array di union.
- Quando vuoi restringere `unknown` a un tipo applicativo.
- Quando una libreria restituisce valori non abbastanza tipizzati.
- Quando vuoi evitare ripetizione di controlli `typeof` e `in`.

## Come funziona

La funzione restituisce un booleano a runtime, ma la firma comunica al compilatore l'effetto del controllo. TypeScript si fida della firma: se la logica e sbagliata, il type system diventa ingannevole.

## API / Sintassi

```ts
function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
```

## Esempio pratico

```ts
type Admin = {
  role: "admin";
  permissions: string[];
};

type Guest = {
  role: "guest";
};

type User = Admin | Guest;

function isAdmin(user: User): user is Admin {
  return user.role === "admin";
}

function listPermissions(user: User): string[] {
  if (isAdmin(user)) {
    return user.permissions;
  }

  return [];
}
```

Nel ramo `if`, `user` viene ristretto ad `Admin`.

## Varianti

- **Predicate su parametro**: `value is Type`.
- **Predicate generico**: `item is T`.
- **Predicate per array filter**: filtra valori nullable o union.
- **Assertion function**: variante che lancia errore invece di restituire booleano.

## Errori comuni

- **Restituire `value is Type` senza controllo reale**: equivale a mentire al compilatore.
- **Controllare solo un campo debole**: meglio usare discriminanti stabili.
- **Usare predicate quando serve validazione dettagliata**: per input complessi meglio parser/schema.
- **Non testare type guard critici**: un bug nel guard propaga tipi sbagliati ovunque.

## Checklist

- Usare predicate per controlli piccoli e riutilizzabili.
- Verificare i campi necessari, non solo quelli comodi.
- Tenere input del guard come `unknown` quando viene da fuori.
- Testare guard usati su confini runtime.
- Preferire discriminated union quando controlli oggetti interni.

## Collegamenti

- [[Type Guards]]
- [[Assertion functions]]
- [[Discriminated Unions]]
