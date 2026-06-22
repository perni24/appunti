---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, enum, literal-types, union-types]
aliases: [Enums, Literal Types]
prerequisites: [Union e Intersection Types, Tipi primitivi]
related: [Discriminated Unions, as const]
---

# Enums e Literal Types

## Sintesi

Enums e literal types servono a rappresentare insiemi limitati di valori. In TypeScript moderno spesso si preferiscono union di literal types, perche sono leggere, chiare e non generano codice runtime.

Gli `enum`, invece, creano una struttura JavaScript a runtime, salvo casi particolari come `const enum`.

## Quando usarlo

- Stati applicativi con valori noti.
- Ruoli utente, permessi, modalita, categorie.
- Campi discriminanti nelle union.
- API che accettano solo un insieme ristretto di stringhe.
- Valori condivisi tra runtime e type system.

## Come funziona

Un literal type rappresenta un valore specifico, non un insieme ampio. Per esempio `"admin"` e diverso da `string`: accetta solo la stringa `"admin"`.

Un enum definisce nomi simbolici associati a valori numerici o stringhe e produce codice JavaScript.

## API / Sintassi

```ts
type Role = "admin" | "editor" | "viewer";

enum Direction {
  Up = "UP",
  Down = "DOWN",
}
```

## Esempio pratico

```ts
type Status = "idle" | "loading" | "success" | "error";

function label(status: Status): string {
  switch (status) {
    case "idle":
      return "In attesa";
    case "loading":
      return "Caricamento";
    case "success":
      return "Completato";
    case "error":
      return "Errore";
  }
}
```

La union impedisce valori non previsti come `"done"` o `"failed"`.

## Varianti

- **String literal union**: `"small" | "medium" | "large"`.
- **Numeric literal union**: `1 | 2 | 3`.
- **String enum**: `enum Role { Admin = "admin" }`.
- **Const object con `as const`**: alternativa runtime-friendly agli enum.

## Errori comuni

- **Usare enum per ogni lista di stringhe**: spesso una union e piu semplice.
- **Dimenticare che enum genera runtime code**: puo influire su bundle e interoperabilita.
- **Usare numeric enum senza motivo**: possono accettare valori numerici non desiderati in alcuni casi.
- **Non centralizzare valori condivisi con API esterne**: aumenta il rischio di mismatch.

## Checklist

- Preferire literal union per valori solo type-level.
- Usare enum solo quando serve una struttura runtime nominata.
- Valutare oggetto `as const` per valori condivisi.
- Usare literal types come discriminanti nelle union.
- Tenere allineati i valori con API, database e validazione runtime.

## Collegamenti

- [[Union e Intersection Types]]
- [[Discriminated Unions]]
- [[as const]]
