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
  - funzioni
  - side-effects
aliases:
  - Funzioni pure e impure
  - Pure functions
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
  - "[[Programmazione/Clean Code/Pagine/Immutabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
title: Funzioni pure e impure
---

# Funzioni pure e impure

## Sintesi

Una funzione è **pura** se il risultato dipende soltanto dai valori di ingresso e la chiamata non produce effetti osservabili all'esterno. Sono due condizioni distinte. Una funzione che registra ogni chiamata può restituire sempre lo stesso totale e restare impura; una funzione che legge l'ora può non scrivere nulla e restare imprevedibile a parità di argomenti.

## Esempio: di chi è la decisione sullo sconto?

Il negozio calcola il prezzo finale in centesimi. Per questo esempio il listino fornisce un intero tra 0 e 1.000.000 e uno sconto percentuale intero tra 0 e 100. La regola arrotonda **il totale finale** al centesimo più vicino, per eccesso a metà centesimo:

```js
function discountedTotalCents(listCents, percentOff) {
  return Math.round(listCents * (100 - percentOff) / 100);
}

let currentDiscount = 10;

function quoteFromSettings(listCents) {
  return discountedTotalCents(listCents, currentDiscount);
}
```

`discountedTotalCents(1250, 15)` restituisce 1063 anche se cambia la configurazione del negozio. `quoteFromSettings(1250)`, invece, passa da 1125 a 1063 quando `currentDiscount` passa da 10 a 15. Il calcolo è lo stesso: è la **lettura nascosta di un valore modificabile** a rendere impura la seconda funzione. La validazione degli importi esterni è un compito separato.

## Come riconoscerla

| Operazione | Cosa osserva il chiamante |
| --- | --- |
| Aggiungere elementi a un array locale appena creato e restituirlo | Nessuna mutazione di dati preesistenti: la mutazione locale, da sola, non rende impura la trasformazione. |
| Aggiungere elementi all'array ricevuto | Anche chi possiede un altro riferimento vede il cambiamento, persino se la funzione restituisce un numero. |
| Leggere una costante numerica immutabile | Il semplice fatto che la costante sia dichiarata fuori dalla funzione non introduce variabilità. |
| Chiamare un orologio passato come parametro | La dipendenza è esplicita, ma la funzione legge ancora il tempo. Per un calcolo puro passa **l'istante misurato**, non l'orologio. |

## Limiti

Due chiamate riuscite con lo stesso risultato non provano la purezza: potrebbero avere anche scritto due righe di log. Se si restituisce un nuovo oggetto, «stesso risultato» va inteso rispetto al contratto sui valori, non come promessa della stessa identità JavaScript. Non serve rendere pura l'intera applicazione: separare la scelta dello sconto dal calcolo permette di testarli per ciò che fanno.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Immutabilita|Immutabilita]]

## Fonti

- React, [Keeping Components Pure](https://react.dev/learn/keeping-components-pure), inclusa la distinzione tra mutazione locale e mutazione di dati preesistenti.
- Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*; Eric Elliott, *Composing Software*
