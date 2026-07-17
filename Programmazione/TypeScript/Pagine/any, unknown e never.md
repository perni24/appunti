---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, any, unknown, never, type-safety]
aliases: [any unknown never]
prerequisites: [Introduzione a TypeScript, Inferenza dei tipi]
related: [Type Narrowing, Type Guards, Exhaustiveness Checking]
---

# any, unknown e never

## Sintesi

`any`, `unknown` e `never` rappresentano tre casi speciali del type system TypeScript.

- `any` disattiva il controllo statico.
- `unknown` rappresenta un valore non ancora verificato.
- `never` rappresenta un valore impossibile o un ramo che non ritorna.

Capirli e fondamentale per mantenere type safety nei confini incerti del programma.

## Quando usarlo

- `any`: solo come ultima risorsa o durante migrazioni temporanee.
- `unknown`: per input esterni, JSON, errori, dati non validati.
- `never`: per exhaustiveness checking, funzioni che lanciano sempre errore, stati impossibili.

## Come funziona

`any` permette qualsiasi operazione: puoi chiamare metodi inesistenti e il compilatore non segnala nulla.

`unknown` e piu sicuro: puoi assegnargli qualsiasi valore, ma prima di usarlo devi restringere il tipo.

`never` indica che un valore non puo esistere. Compare spesso quando TypeScript ha eliminato tutti i casi possibili di una union.

## API / Sintassi

```ts
let unsafe: any = JSON.parse("{}");
let value: unknown = JSON.parse("{}");

function fail(message: string): never {
  throw new Error(message);
}
```

## Esempio pratico

```ts
function parseUser(input: unknown): { email: string } {
  if (
    typeof input === "object" &&
    input !== null &&
    "email" in input &&
    typeof input.email === "string"
  ) {
    return { email: input.email };
  }

  throw new Error("Invalid user");
}
```

`unknown` obbliga a controllare la forma del dato prima di usarlo.

## Varianti

- **`any` implicito**: da evitare con `noImplicitAny`.
- **`unknown` per confini runtime**: scelta sicura per input non fidati.
- **`never` per stati impossibili**: utile con `switch` su union discriminate.

## Errori comuni

- **Usare `any` per zittire il compilatore**: sposta gli errori al runtime.
- **Usare `unknown` senza narrowing**: il valore resta inutilizzabile.
- **Non capire `never` negli errori**: spesso significa che TypeScript ha dimostrato che un ramo e impossibile.
- **Tipizzare `catch (error)` come se fosse sempre `Error`**: in JavaScript si puo lanciare qualsiasi valore.

## Checklist

- Preferire `unknown` ad `any` per dati esterni.
- Abilitare `noImplicitAny`.
- Ridurre gli `any` temporanei con note di migrazione tracciabili.
- Usare `never` per verificare switch esaustivi.
- Validare dati runtime prima di convertirli in tipi applicativi.

## Collegamenti

- [[Inferenza dei tipi]]
- [[Type Narrowing]]
- [[Type Guards]]
- [[Exhaustiveness Checking]]
