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
  - stato
  - immutabilita
aliases:
  - Stato mutabile e immutabile
  - Mutabilita e immutabilita
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
title: Stato mutabile e immutabile
---

# Stato mutabile e immutabile

## Sintesi

Con uno stato mutabile, due riferimenti allo stesso oggetto osservano anche le modifiche successive. Con un aggiornamento immutabile, chi ha conservato la versione precedente continua a vedere i vecchi dati. Il sistema cambia comunque: cambia **quale versione** viene scelta come corrente.

## Esempio: cambiare la quantità di una riga

Considera un ordine con righe già validate, ciascuna con `id` univoco e `quantity` positiva. Fare una copia dell'ordine con lo spread non copia le righe. Qui il chiamante osserverebbe la modifica anche attraverso l'ordine originale:

```js
function withQuantityWrong(order, id, quantity) {
  const next = { ...order };
  const line = next.lines.find((item) => item.id === id);
  if (!line) throw new RangeError("Riga assente");
  line.quantity = quantity;
  return next;
}
```

Nella versione corretta si copiano i livelli attraversati dalla modifica: ordine, array delle righe e riga interessata. Le righe non modificate possono restare condivise.

```js
function withQuantity(order, id, quantity) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new RangeError("Quantità non valida");
  }
  const index = order.lines.findIndex((line) => line.id === id);
  if (index < 0) throw new RangeError("Riga assente");
  if (order.lines[index].quantity === quantity) return order;

  const lines = order.lines.slice();
  lines[index] = { ...lines[index], quantity };
  return { ...order, lines };
}
```

Con la prima riga che passa da 1 a 3, il vecchio ordine deve continuare a mostrare 1. Anche l'identità racconta qualcosa: l'array e la prima riga sono nuovi, la seconda riga è lo stesso oggetto. Se la quantità richiesta è già presente, la funzione restituisce direttamente l'ordine originale. Modificare **la copia locale dell'array** è lecito: nessun altro la possiede ancora.

## Limiti ed errori comuni

- Questa è una **trasformazione non mutante**, non un congelamento profondo. Scrivere dopo sulla seconda riga condivisa cambierebbe entrambe le versioni. Chi le riceve deve trattare come immutabili i rami condivisi.
- `const` impedisce di riassegnare il riferimento, non di cambiare gli oggetti raggiungibili. Analogamente, aggiornare solo il totale di un ordine copiato non rende indipendenti i suoi dati annidati.
- La copia dell'array richiede lavoro proporzionale al numero di righe. Una mutazione locale con un solo proprietario può essere preferibile; l'aspetto decisivo è chi può osservare le modifiche. Due scrittori che pubblicano versioni concorrenti possono ancora perdere un aggiornamento.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Principio del minimo stupore|Principio del minimo stupore]]

## Fonti

- React, [Updating Objects in State: updating a nested object](https://react.dev/learn/updating-objects-in-state#updating-a-nested-object)
- Eric Evans, *Domain-Driven Design*; Martin Fowler, *Refactoring*
