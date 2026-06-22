---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, narrowing, type-system, control-flow-analysis]
aliases: [Narrowing TypeScript]
prerequisites: [Union e Intersection Types, any, unknown e never]
related: [Type Guards, Type predicates, Discriminated Unions, Exhaustiveness Checking]
---

# Type Narrowing

## Sintesi

Il **type narrowing** e il processo con cui TypeScript restringe un tipo ampio a un tipo piu specifico in base ai controlli presenti nel codice.

E fondamentale quando lavori con union, valori opzionali, `unknown`, input esterni e stati applicativi che possono assumere forme diverse.

## Quando usarlo

- Quando una variabile ha tipo union.
- Quando un valore puo essere `null` o `undefined`.
- Quando ricevi input `unknown` da JSON, form, file o rete.
- Quando una funzione deve gestire piu forme di dato.
- Quando vuoi evitare assertion non sicure.

## Come funziona

TypeScript analizza il flusso di controllo: `if`, `switch`, `return`, `throw`, controlli con `typeof`, `instanceof`, `in`, confronti letterali e funzioni type guard.

Dopo un controllo, nel ramo in cui la condizione e vera TypeScript usa un tipo piu preciso.

## API / Sintassi

```ts
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  return value.toUpperCase();
}
```

## Esempio pratico

```ts
type ApiResponse =
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function render(response: ApiResponse): string {
  if (response.status === "success") {
    return response.data.join(", ");
  }

  return `Errore: ${response.message}`;
}
```

Il controllo su `status` restringe automaticamente il tipo della risposta.

## Varianti

- **`typeof` narrowing**: primitive come `string`, `number`, `boolean`.
- **`instanceof` narrowing**: istanze di classi o costruttori.
- **`in` narrowing**: presenza di una proprieta.
- **Equality narrowing**: confronto con literal value.
- **Control-flow narrowing**: `return`, `throw`, `continue` eliminano casi.

## Errori comuni

- **Usare `as` invece di narrowing**: aggira il compilatore e aumenta rischio runtime.
- **Dimenticare `null`**: `typeof null === "object"`.
- **Controllare proprieta non discriminanti**: puo non restringere come previsto.
- **Mutare una variabile dopo il narrowing**: puo invalidare assunzioni logiche.

## Checklist

- Preferire narrowing a type assertion.
- Usare discriminanti stabili per union di oggetti.
- Gestire `null` e `undefined` in modo esplicito.
- Separare validazione runtime e uso del dato validato.
- Usare `never` per controllare casi impossibili.

## Collegamenti

- [[Type Guards]]
- [[Type predicates]]
- [[Discriminated Unions]]
- [[Exhaustiveness Checking]]
