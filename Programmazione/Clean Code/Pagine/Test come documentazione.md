---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, testing, documentazione]
aliases: [Test come documentazione, Tests as documentation]
prerequisites: [Test unitari leggibili]
related: [Contratti impliciti ed espliciti, Arrange Act Assert, Messaggi di errore utili]
---

# Test come documentazione

## Sintesi

I **test come documentazione** descrivono esempi concreti di comportamento atteso.

Sono utili per capire come usare una funzione, quali casi sono supportati e quali regole non devono essere rotte.

## Problema che risolve

La documentazione testuale puo diventare obsoleta. I test, invece, falliscono quando il comportamento non e piu rispettato.

Questo li rende una forma di documentazione eseguibile.

## Concetto chiave

Un test documenta bene quando e leggibile anche da chi non conosce l'implementazione.

Deve mostrare:

- contesto;
- input;
- azione;
- output atteso;
- motivo del comportamento.

## Esempio

```js
test("rejects an invoice without line items", () => {
  const invoice = draftInvoiceWithoutItems();

  expect(() => issueInvoice(invoice)).toThrow("Invoice must contain at least one item");
});
```

Il test documenta una regola di dominio e il messaggio atteso.

## Dettagli importanti

- I test documentano meglio quando usano termini del dominio.
- I nomi devono spiegare comportamento, non implementazione.
- Gli esempi dovrebbero coprire casi normali e casi limite importanti.
- I test possono sostituire commenti superflui, non tutta la documentazione.
- Quando cambia una regola, aggiornare test e note insieme.

## Limiti

- Una suite enorme non e automaticamente buona documentazione.
- Test pieni di setup tecnico sono difficili da leggere.
- I test non spiegano sempre il perche storico di una scelta.
- Non sostituiscono diagrammi o documenti architetturali quando servono.

## Errori comuni

- Scrivere test che descrivono dettagli interni.
- Usare dati casuali o poco significativi.
- Nascondere tutto in helper non leggibili.
- Mantenere test obsoleti adattandoli meccanicamente.
- Considerare la copertura come misura della qualita documentale.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Test unitari leggibili]]
- [[Contratti impliciti ed espliciti]]
- [[Arrange Act Assert]]
- [[Messaggi di errore utili]]
- [[Modellazione del dominio]]

## Fonti

- Kent Beck, *Test Driven Development*
- Gerard Meszaros, *xUnit Test Patterns*
- Martin Fowler, *SpecificationByExample*
