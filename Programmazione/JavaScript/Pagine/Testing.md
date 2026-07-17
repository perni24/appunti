---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: beginner
tags: [javascript, testing, quality, unit-test, e2e]
aliases: [Testing JS, Test JavaScript]
prerequisites: [Funzioni, Moduli, Error Handling]
related: [Design Patterns, Functional Programming, Error Handling]
---

# Testing

## Sintesi

Il testing verifica che il codice si comporti come previsto e riduce il rischio di regressioni.

In JavaScript si testano funzioni, moduli, componenti, API, integrazioni e flussi end-to-end.

---

## Quando usarlo

Scrivi test quando il comportamento deve restare stabile nel tempo o quando un bug potrebbe tornare facilmente.

Priorita alte:

- logica di business;
- parsing e validazione;
- funzioni pure riusate;
- flussi critici utente;
- integrazioni con API;
- bug fix gia avvenuti.

Per prototipi molto piccoli puoi partire senza test, ma appena il codice diventa riusato conviene aggiungerli.

## Come funziona

### Tipi di test
- Unit test: verificano una singola funzione, classe o modulo in isolamento.
- Integration test: verificano piu parti che collaborano.
- End-to-end test: simulano flussi utente reali.
- Contract test: verificano accordi tra servizi o moduli.
- Regression test: impediscono il ritorno di bug gia risolti.

---
### Piramide dei test
Una strategia comune:

- molti unit test;
- meno integration test;
- pochi E2E mirati.

Gli unit test sono veloci e precisi. Gli E2E danno fiducia sul flusso reale, ma sono piu lenti e fragili.

---
### Arrange Act Assert
Struttura pratica:

- arrange: prepara input e dipendenze;
- act: esegui l'azione;
- assert: verifica il risultato.

```js
test("applica uno sconto", () => {
  const price = 100;

  const result = applyDiscount(price, 10);

  expect(result).toBe(90);
});
```

---
### Mock e stub
I mock sostituiscono dipendenze esterne.

```js
const api = {
  loadUser: vi.fn().mockResolvedValue({ id: 1 }),
};
```

Usali per isolare il codice, ma non abusarne: troppi mock possono testare l'implementazione invece del comportamento.

---
### TDD
TDD segue il ciclo:

- Red: scrivi un test che fallisce;
- Green: scrivi il minimo codice per farlo passare;
- Refactor: migliora il codice mantenendo i test verdi.

Non e obbligatorio per ogni task, ma e utile per logica complessa o bug fix.

---

## API / Sintassi

Sintassi tipica in Jest/Vitest:

```js
describe("applyDiscount", () => {
  test("applica lo sconto percentuale", () => {
    expect(applyDiscount(100, 10)).toBe(90);
  });
});
```

Assertion comuni:

```js
expect(value).toBe(1);
expect(object).toEqual({ id: 1 });
expect(fn).toThrow();
await expect(loadData()).resolves.toEqual(data);
await expect(loadData()).rejects.toThrow();
```

La sintassi esatta dipende dal framework, ma il modello arrange-act-assert resta valido.

## Esempio pratico

### Esempio unit test
```js
export function sum(a, b) {
  return a + b;
}
```

```js
import { sum } from "./sum.js";

describe("sum", () => {
  test("somma due numeri", () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

La sintassi e compatibile con framework come Jest e Vitest.

---

## Varianti

- **Unit test**: veloci, isolati, utili per logica piccola.
- **Integration test**: verificano collaborazione tra moduli.
- **Component test**: testano componenti UI in isolamento controllato.
- **End-to-end test**: verificano flussi reali dal punto di vista utente.
- **Snapshot test**: utili con cautela per output strutturati.
- **Contract test**: controllano accordi tra client e server.

## Errori comuni

- Testare dettagli interni invece del comportamento.
- Avere solo E2E lenti e fragili.
- Non testare percorsi di errore.
- Usare mock troppo profondi.
- Scrivere test non deterministici.

---

## Checklist

### Checklist operativa
- Testa comportamento osservabile.
- Copri casi limite ed errori.
- Mantieni test veloci e indipendenti.
- Usa E2E per flussi critici.
- Aggiungi un test quando correggi un bug.

---

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Funzioni|Funzioni]]
- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Functional Programming|Functional Programming]]
