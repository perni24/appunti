---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [clean-code, testing, unit-test]
aliases: [Test unitari leggibili, Readable unit tests]
prerequisites: [Codice testabile, Arrange Act Assert]
related: [Test come documentazione, Test data builders, Codice testabile]
---

# Test unitari leggibili

## Sintesi

I **test unitari leggibili** verificano una piccola porzione di comportamento e spiegano chiaramente scenario, azione e risultato atteso.

Un buon test deve aiutare a capire il codice, non solo proteggere da regressioni.

## Problema che risolve

Test confusi diventano un costo:

- falliscono senza spiegare il motivo;
- richiedono setup enorme;
- testano dettagli interni;
- duplicano logica dell'implementazione;
- rendono difficile refactorare;
- vengono ignorati perche rumorosi.

## Concetto chiave

Un test leggibile ha un'intenzione evidente.

Il nome del test, il setup e le asserzioni dovrebbero raccontare il comportamento atteso in un caso specifico.

## Esempio

```js
test("applies discount only to active customers", () => {
  const customer = activeCustomer();
  const order = orderWithTotal(100);

  const total = calculateDiscountedTotal(order, customer);

  expect(total).toBe(90);
});
```

Il test mostra scenario, azione e aspettativa senza dettagli irrilevanti.

## Dettagli importanti

- Un test dovrebbe avere una ragione chiara per fallire.
- Il setup deve contenere solo cio che serve al caso.
- Le asserzioni dovrebbero essere specifiche ma non fragili.
- I nomi dei test devono parlare di comportamento.
- I helper di test devono migliorare lettura, non nascondere troppo.

## Limiti

- Non tutti i comportamenti sono verificabili bene con unit test.
- Test troppo isolati possono ignorare errori di integrazione.
- Mock eccessivi rendono i test fragili.
- Un test leggibile non compensa un design confuso.

## Errori comuni

- Usare nomi generici come `should work`.
- Creare setup condiviso difficile da seguire.
- Testare metodi privati invece del comportamento pubblico.
- Mettere molte asserzioni non correlate nello stesso test.
- Copiare la logica produttiva dentro l'asserzione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice testabile]]
- [[Arrange Act Assert]]
- [[Test come documentazione]]
- [[Test data builders]]
- [[Funzioni piccole]]

## Fonti

- Kent Beck, *Test Driven Development*
- Gerard Meszaros, *xUnit Test Patterns*
- Martin Fowler, *TestPyramid*
