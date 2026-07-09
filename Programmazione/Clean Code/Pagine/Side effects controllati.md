---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, side-effects, architettura]
aliases: [Side effects controllati, Effetti collaterali controllati]
prerequisites: [Funzioni pure e impure, Funzioni con responsabilita singola]
related: [Pipeline di trasformazione, Immutabilita, Dipendenze esplicite]
---

# Side effects controllati

## Sintesi

I **side effects** sono effetti osservabili prodotti da una funzione oltre al valore restituito: scrivere su database, inviare email, modificare stato globale, loggare, pubblicare eventi o mutare un oggetto ricevuto.

Nel Clean Code non vanno eliminati sempre, ma resi espliciti, confinati e testabili.

## Problema che risolve

I side effects nascosti rendono il codice imprevedibile.

Una funzione apparentemente innocua puo:

- salvare dati;
- inviare notifiche;
- cambiare configurazione globale;
- modificare un parametro;
- scrivere log rumorosi;
- dipendere dall'ordine di chiamata.

Questo aumenta il rischio di regressioni.

## Concetto chiave

La regola pratica e separare:

- decisioni pure;
- trasformazioni;
- side effects;
- coordinamento.

Il codice di dominio dovrebbe decidere cosa deve succedere. Il bordo applicativo dovrebbe eseguire gli effetti necessari.

## Dettagli importanti

- Un side effect dovrebbe essere visibile dal nome o dal tipo della funzione.
- Le dipendenze che producono effetti dovrebbero essere esplicite.
- Le funzioni che scrivono dovrebbero essere piu facili da individuare di quelle che leggono.
- I side effects vanno testati con integrazione, mock mirati o adapter.
- In una pipeline, gli effetti dovrebbero stare in punti chiari.

## Esempio

Side effect nascosto:

```js
function calculateTotal(order) {
  auditLog("Calculating total");
  return order.items.reduce((sum, item) => sum + item.price, 0);
}
```

Separazione piu chiara:

```js
function calculateTotal(order) {
  return order.items.reduce((sum, item) => sum + item.price, 0);
}

function calculateAndLogTotal(order, logger) {
  const total = calculateTotal(order);
  logger.info("Calculated total", { total });
  return total;
}
```

La logica pura resta isolata; l'effetto e esplicito.

## Limiti

- Alcune applicazioni sono principalmente orchestrazione di effetti.
- Separare tutto puo introdurre troppi livelli.
- Il logging tecnico puo essere trasversale, ma va comunque governato.
- Gli effetti asincroni richiedono attenzione a retry, idempotenza e ordine.

## Errori comuni

- Mutare parametri senza comunicarlo.
- Nascondere salvataggi dentro funzioni chiamate `calculate`, `build` o `get`.
- Usare singletons globali per servizi con effetti.
- Mescolare validazione e scrittura nello stesso helper.
- Testare solo il valore di ritorno ignorando gli effetti prodotti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Funzioni pure e impure]]
- [[Immutabilita]]
- [[Pipeline di trasformazione]]
- [[Dipendenze esplicite]]
- [[Funzioni con responsabilita singola]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Michael Feathers, *Working Effectively with Legacy Code*
