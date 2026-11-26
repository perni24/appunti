---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - funzioni
  - leggibilita
aliases:
  - Funzioni piccole
  - Small functions
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola]]"
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
title: Funzioni piccole
---

# Funzioni piccole

## Sintesi

Una funzione è abbastanza piccola quando chi legge può seguirne lo scopo senza tenere in mente dettagli estranei. Conta il lavoro necessario a ricostruire il flusso, non una soglia di righe. Una sequenza di più chiamate può già essere l'unità giusta.

## Esempio: che cosa vale la pena estrarre?

Al checkout si devono validare l'ordine, addebitare il totale e solo dopo inviare la ricevuta. Le righe contengono quantità positive e prezzi unitari in centesimi; non ci sono tasse o sconti nell'esempio. I servizi sono forniti dal chiamante.

```js
function orderTotalCents(lines) {
  return lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
}

async function checkout(order, { validateOrder, chargePayment, sendReceipt }) {
  validateOrder(order);
  const totalCents = orderTotalCents(order.lines);
  const payment = await chargePayment(order.customer, totalCents);
  await sendReceipt(order.customer, payment);
  return payment;
}
```

`orderTotalCents` dà un nome a un calcolo con input e risultato propri. Lo puoi provare su due pezzi da 350 centesimi e uno da 100: il totale deve essere 800. `checkout` mantiene visibile l'ordine degli effetti. Estrarre `multiply(a, b)` solo per accorciare la riga del calcolo costringerebbe invece a seguire un altro rimando senza spiegare una regola.

## Dettagli importanti

La validazione è sincrona e segnala un ordine non valido lanciando un errore; un addebito rifiutato impedisce l'invio. Se fallisce l'invio, l'addebito è **già avvenuto**: l'estrazione non rende atomiche le operazioni. Un checkout reale deve gestire recupero e tentativi ripetuti, non rilanciare l'intera sequenza alla cieca.

## Limiti ed errori comuni

Tieni insieme passaggi brevi che condividono strettamente lo stato locale. Se l'helper richiede di passargli mezza funzione o si chiama `doStep2`, prova a lasciarlo in linea. Viceversa, un calcolo con un nome di dominio può meritare una funzione anche se occupa una sola riga.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Semplicita e complessita accidentale|Semplicita e complessita accidentale]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, [Extract Function](https://refactoring.com/catalog/extractFunction.html), con il rimando all’operazione inversa *Inline Function*.
