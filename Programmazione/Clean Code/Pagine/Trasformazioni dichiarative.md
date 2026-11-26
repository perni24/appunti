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
  - dichiarativo
  - trasformazioni
aliases:
  - Trasformazioni dichiarative
  - Codice dichiarativo
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Composizione di funzioni]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
  - "[[Programmazione/Clean Code/Pagine/Leggibilita del codice]]"
title: Trasformazioni dichiarative
---

# Trasformazioni dichiarative

## Sintesi

Una trasformazione dichiarativa dice **quali elementi tenere e quale valore ricavarne**, lasciando all'operazione di collezione il compito di visitarli. È una scelta di espressione, non una garanzia automatica di purezza, velocità o equivalenza rispetto a un ciclo.

## Esempio: quali totali sono stati pagati?

Il risultato richiesto è una **lista**, non una somma: i totali in centesimi degli ordini pagati, nell'ordine di ingresso, inclusi zeri e duplicati. L'input è un array denso di normali record già validati, senza getter o modifiche durante la visita.

```js
function paidTotalsLoop(orders) {
  const totals = [];
  for (const order of orders) {
    if (order.status === "paid") totals.push(order.totalCents);
  }
  return totals;
}

function paidTotals(orders) {
  return orders
    .filter((order) => order.status === "paid")
    .map((order) => order.totalCents);
}
```

Con un ordine in bozza da 300, un pagato da 0 e due pagati da 250, entrambe restituiscono `[0, 250, 250]`. Senza ordini pagati restituiscono `[]`. Un filtro applicato al totale come valore booleano perderebbe lo zero; un `Set` eliminerebbe un duplicato; un `reduce` che somma i valori risponderebbe a un'altra domanda.

## Quando cambia il comportamento?

Il ciclo legge stato e, se necessario, totale di ogni ordine prima di passare al successivo. Con gli array JavaScript, `filter` completa il filtro e crea un array intermedio **prima** che `map` legga i totali. Se i campi sono getter con effetti, l'ordine delle letture è osservabile: lo stesso array restituito non implica allora equivalenza completa.

## Quando preferire il ciclo

Se devi uscire al primo errore, procedere con uno stato che dipende dal passo precedente o evitare una grande collezione intermedia, il ciclo può spiegare l'algoritmo meglio della catena. Per trovare il **primo** elemento che soddisfa una condizione considera anche `find`. Non aggiungere effetti nelle callback per accorciare il codice; per decisioni sulle prestazioni misura con dati rappresentativi.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Composizione di funzioni|Composizione di funzioni]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]

## Fonti

- ECMA-262, [Array.prototype.filter](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.filter) e [Array.prototype.map](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map)
- Martin Fowler, [Collection Pipeline](https://martinfowler.com/articles/collection-pipeline/)
- Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*; Eric Elliott, *Composing Software*
