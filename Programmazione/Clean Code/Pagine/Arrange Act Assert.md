---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, testing, aaa]
aliases: [Arrange Act Assert, AAA pattern]
prerequisites: [Codice testabile]
related: [Test unitari leggibili, Test data builders, Test come documentazione]
---

# Arrange Act Assert

## Sintesi

**Arrange Act Assert** e una struttura per scrivere test leggibili:

- Arrange: prepara lo scenario;
- Act: esegui il comportamento;
- Assert: verifica il risultato.

Aiuta a separare setup, azione e verifica.

## Problema che risolve

Molti test diventano difficili da leggere perche mischiano preparazione, chiamate e asserzioni.

Quando queste parti sono confuse, non e chiaro cosa il test stia davvero verificando.

## Concetto chiave

Un test dovrebbe avere un'azione principale.

Se ci sono molte azioni o molte verifiche non correlate, probabilmente il test sta coprendo piu comportamenti insieme.

## Esempio

```js
test("calculates total with tax", () => {
  const order = orderWithItems([item(100)]);
  const taxRate = 0.22;

  const total = calculateTotal(order, taxRate);

  expect(total).toBe(122);
});
```

Il test separa chiaramente scenario, esecuzione e aspettativa.

## Dettagli importanti

- Arrange deve essere il piu breve possibile.
- Act dovrebbe essere una singola chiamata significativa.
- Assert deve verificare comportamento osservabile.
- I builder aiutano a rendere leggibile il setup.
- Non serve commentare sempre le tre sezioni se la struttura e gia evidente.

## Limiti

- Alcuni test di integrazione richiedono piu passaggi.
- Flussi asincroni o event-driven possono richiedere struttura diversa.
- Forzare AAA in ogni caso puo produrre test artificiosi.
- Non sostituisce buoni nomi e buoni dati di test.

## Errori comuni

- Fare piu `Act` nello stesso test.
- Mettere asserzioni nel setup.
- Preparare dati irrilevanti.
- Verificare dettagli interni.
- Usare AAA come formato rigido invece che come guida.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice testabile]]
- [[Test unitari leggibili]]
- [[Test data builders]]
- [[Test come documentazione]]

## Fonti

- Bill Wake, *Arrange Act Assert*
- Kent Beck, *Test Driven Development*
- Gerard Meszaros, *xUnit Test Patterns*
