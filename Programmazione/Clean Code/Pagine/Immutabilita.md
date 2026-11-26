---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - clean-code
  - immutabilita
  - stato
aliases:
  - Immutabilita
  - Immutability
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
title: Immutabilita
---

# Immutabilita

## Sintesi

**Non modificare l'input durante una chiamata** e **restituire un valore che nessuno potrà alterare in seguito** sono garanzie diverse. Una copia superficiale può soddisfare la prima ma non la seconda: il nuovo contenitore mantiene i riferimenti agli stessi oggetti annidati.

## Esempio: aggiornamento della fattura o ricevuta storica?

Una fattura contiene un identificatore testuale `id`, un totale intero in centesimi `totalCents` e un array di righe. Il chiamante passa una `Date` valida. Per aggiornare la vista corrente senza toccare l'oggetto precedente si potrebbe scrivere:

```js
function withPayment(invoice, paidAt) {
  return { ...invoice, status: "paid", paidAt };
}
```

Durante la chiamata la fattura originale non viene modificata. Ma la nuova fattura condivide `lines` con la vecchia e contiene proprio la `Date` del chiamante. Se domani il chiamante usa `paidAt.setTime(0)`, cambia anche il valore letto dalla nuova fattura. Congelare soltanto il contenitore con `Object.freeze` non elimina questi riferimenti.

Per conservare **una ricevuta con i soli dati necessari**, proietta invece su campi primitivi. Non è una copia completa della fattura: il diverso nome segnala un diverso contratto.

```js
function paymentSnapshot(invoice, paidAt) {
  const paidAtMs = paidAt.getTime();
  if (!Number.isFinite(paidAtMs)) throw new RangeError("Istante di pagamento non valido");
  return Object.freeze({
    invoiceId: invoice.id,
    totalCents: invoice.totalCents,
    paidAtMs,
  });
}
```

Qui non passa alla ricevuta né l'array né l'oggetto `Date`. Con l'ID testuale e il totale numerico previsti, congelare il record basta a mantenerne stabili i dati. Se servono anche le righe storiche occorre decidere quali campi conservare e come isolarli: aggiungere `lines: invoice.lines` reintrodurrebbe il problema.

## Criterio di scelta

- Per aggiornare lo stato di un'interfaccia, condividere rami che tutti trattano come immutabili evita copie inutili. Per il procedimento vedi [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]].
- Per un documento storico, conserva i valori validi **al momento dell'evento**; una copia completa del grafo può costare di più senza rispondere meglio al requisito.
- L'immutabilità non verifica che un pagamento sia avvenuto e non impedisce a due scrittori di sovrascrivere la versione corrente. Sono vincoli diversi, da proteggere altrove.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]

## Fonti

- React, [Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- MDN, [Object.freeze(): congelamento superficiale](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- Eric Evans, *Domain-Driven Design*; Martin Fowler, *Refactoring*; Eric Elliott, *Composing Software*
