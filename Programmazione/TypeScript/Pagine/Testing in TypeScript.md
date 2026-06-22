---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, testing, vitest, jest, quality]
aliases: [Test in TypeScript]
prerequisites: [tsconfig, TypeScript con Node.js]
related: [Type-level testing, Error Handling, Source maps e debugging]
---

# Testing in TypeScript

## Sintesi

Il testing in TypeScript combina test runtime e controllo statico. TypeScript intercetta errori di tipo prima dell'esecuzione, ma non sostituisce unit test, integration test, test end-to-end o test sui contratti API.

Un buon setup testa sia il comportamento del codice sia la correttezza delle API tipizzate.

## Quando usarlo

- Funzioni di dominio e utility.
- API backend e client HTTP.
- Componenti React.
- Parser e validatori runtime.
- Refactor su codebase con tipi complessi.

## Come funziona

Il test runner esegue codice TypeScript tramite transpiler, bundler o compilazione preventiva. Strumenti comuni includono Vitest, Jest, Node test runner, Playwright e Cypress.

Il type checking va eseguito separatamente con `tsc --noEmit`, perche molti runner transpiler non controllano i tipi in modo completo.

## API / Sintassi

```bash
tsc --noEmit
vitest run
```

## Esempio pratico

```ts
import { describe, expect, it } from "vitest";

function sum(a: number, b: number): number {
  return a + b;
}

describe("sum", () => {
  it("somma due numeri", () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

Il test verifica il comportamento, mentre TypeScript controlla la firma.

## Varianti

- **Unit test**: funzioni isolate.
- **Integration test**: piu moduli insieme.
- **E2E test**: flusso completo applicativo.
- **Type-level test**: verifica tipi, non runtime.
- **Contract test**: controlla compatibilita API.

## Errori comuni

- **Pensare che TypeScript sostituisca i test**: controlla tipi, non logica.
- **Usare runner che transpila senza `tsc --noEmit`**: errori type-level possono sfuggire.
- **Testare implementazione invece di comportamento**.
- **Non testare parser e validazioni runtime**.

## Checklist

- Eseguire `tsc --noEmit` in CI.
- Aggiungere unit test per logica di dominio.
- Testare validazione runtime e casi invalidi.
- Usare source map per stack trace leggibili.
- Separare test runtime e test type-level.

## Collegamenti

- [[Type-level testing]]
- [[Error Handling]]
- [[Source maps e debugging]]
