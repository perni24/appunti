---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, assertion-functions, narrowing, runtime-validation]
aliases: [Assertion function, asserts]
prerequisites: [Type Guards, Type predicates]
related: [Assertion e casting dei tipi, any, unknown e never]
---

# Assertion functions

## Sintesi

Le **assertion functions** sono funzioni che, se non lanciano errore, comunicano a TypeScript che una condizione e vera o che un valore ha un certo tipo.

Usano firme come `asserts condition` oppure `asserts value is Type`.

## Quando usarlo

- Quando vuoi fallire subito se un valore non e valido.
- Quando validi input all'inizio di una funzione.
- Quando vuoi evitare controlli ripetuti dopo una validazione.
- Quando scrivi helper di test o invariant check.
- Quando trasformi dati `unknown` in tipi applicativi dopo controllo.

## Come funziona

Una assertion function non restituisce `true` o `false`: se la condizione non e valida, lancia un errore. Se ritorna normalmente, TypeScript restringe il tipo nel codice successivo.

## API / Sintassi

```ts
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Expected string");
  }
}
```

## Esempio pratico

```ts
type Config = {
  apiUrl: string;
};

function assertConfig(value: unknown): asserts value is Config {
  if (
    typeof value !== "object" ||
    value === null ||
    !("apiUrl" in value) ||
    typeof value.apiUrl !== "string"
  ) {
    throw new Error("Invalid config");
  }
}

const raw: unknown = { apiUrl: "https://example.com" };

assertConfig(raw);

console.log(raw.apiUrl);
```

Dopo `assertConfig(raw)`, TypeScript tratta `raw` come `Config`.

## Varianti

- **`asserts condition`**: garantisce che una condizione sia vera.
- **`asserts value is Type`**: restringe un valore a un tipo.
- **Invariant helper**: lancia se uno stato impossibile accade.
- **Test assertions**: helper per test e validazioni.

## Errori comuni

- **Usare assertion function per flussi recuperabili**: se il caso e normale, meglio restituire risultato/errore.
- **Non lanciare errore quando il valore e invalido**: la firma diventa falsa.
- **Nascondere validazioni complesse in funzioni non testate**: rischio alto ai confini runtime.
- **Confondere con type assertion `as`**: qui c'e logica runtime reale.

## Checklist

- Lanciare sempre errore quando la condizione non e valida.
- Usare assertion functions per invarianti o validazioni all'ingresso.
- Testare assertion usate su dati esterni.
- Preferire type guard se serve ramo `true/false`.
- Evitare messaggi d'errore generici nei confini importanti.

## Collegamenti

- [[Type Guards]]
- [[Type predicates]]
- [[Assertion e casting dei tipi]]
