---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, conditional-types, distributive-types, union-types]
aliases: [Conditional types distributivi]
prerequisites: [Conditional Types, Union e Intersection Types]
related: [Infer nei Conditional Types, Utility Types]
---

# Distributive conditional types

## Sintesi

Un conditional type e **distributivo** quando viene applicato separatamente a ogni membro di una union.

Questo comportamento e potentissimo per filtrare o trasformare union, ma puo sorprendere se ti aspetti che la union venga trattata come un blocco unico.

## Quando usarlo

- Filtrare membri di una union.
- Estrarre tipi assegnabili a un certo vincolo.
- Costruire utility come `Exclude` o `Extract`.
- Trasformare union di oggetti.
- Modellare tipi derivati da API complesse.

## Come funziona

La distribuzione avviene quando il tipo controllato e un parametro generico "nudo", come `T extends U ? X : Y`.

Per disabilitarla si avvolgono i tipi in tuple: `[T] extends [U] ? X : Y`.

## API / Sintassi

```ts
type OnlyStrings<T> = T extends string ? T : never;

type Result = OnlyStrings<string | number | boolean>;
```

`Result` diventa `string`.

## Esempio pratico

```ts
type Event =
  | { type: "user"; userId: string }
  | { type: "order"; orderId: string }
  | { type: "system"; message: string };

type EventOfType<TType extends Event["type"]> = Event extends infer TEvent
  ? TEvent extends { type: TType }
    ? TEvent
    : never
  : never;

type UserEvent = EventOfType<"user">;
```

La union viene filtrata mantenendo solo la variante con `type: "user"`.

## Varianti

- **Filtro di union**: `T extends U ? T : never`.
- **Esclusione**: `T extends U ? never : T`.
- **Trasformazione**: ogni membro diventa un nuovo tipo.
- **Non distributivo**: `[T] extends [U]`.

## Errori comuni

- **Non aspettarsi distribuzione**: causa risultati apparentemente strani.
- **Usare `never` senza capirlo**: in union viene eliminato.
- **Distribuire union enormi**: puo rallentare il compilatore.
- **Dimenticare il wrapper tuple quando vuoi confronto globale**.

## Checklist

- Verificare se il conditional type deve distribuire.
- Usare `[T] extends [U]` quando vuoi bloccare la distribuzione.
- Testare utility con union piccole.
- Spezzare trasformazioni complesse.
- Ricordare che `never` sparisce nelle union.

## Collegamenti

- [[Conditional Types]]
- [[Infer nei Conditional Types]]
- [[Utility Types]]
