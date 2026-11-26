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
  - composizione
aliases:
  - Composizione di funzioni
  - Function composition
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Pipeline di trasformazione]]"
  - "[[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative]]"
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
title: Composizione di funzioni
---

# Composizione di funzioni

## Sintesi

Comporre due funzioni significa usare **il risultato della prima come ingresso della seconda**. Se `f` trasforma A in B e `g` trasforma B in C, la funzione che riceve A e restituisce `g(f(a))` va da A a C. Chiamare due funzioni una dopo l'altra senza passare il risultato non è la stessa cosa.

## Esempio: buono e confezione regalo

Regola del negozio: un buono da 500 centesimi sconta solo la merce e non porta il prezzo sotto zero. La confezione regalo costa altri 200 centesimi e **non** è scontabile. Gli importi di esempio sono interi non negativi di piccola entità.

```js
const applyVoucher = (goodsCents) => Math.max(0, goodsCents - 500);
const addGiftWrap = (netGoodsCents) => netGoodsCents + 200;

function giftTotalCents(goodsCents) {
  return addGiftWrap(applyVoucher(goodsCents));
}
```

Con 300 centesimi di merce, prima il buono porta la merce a 0 e poi la confezione porta il totale a 200. Invertendo l'ordine, `applyVoucher(addGiftWrap(300))` restituisce 0: la confezione è stata scontata. **Due funzioni pure non sono necessariamente intercambiabili di posto.** Con 1000 centesimi entrambe le sequenze danno 700: un test limitato al caso ordinario non rileverebbe l'errore.

## Che cosa deve combaciare?

- **Forma:** il secondo passaggio deve poter usare il valore prodotto dal primo. Una funzione che restituisce una Promise non si compone direttamente con una che si aspetta il valore risolto: attendi il risultato o usa una continuazione.
- **Significato:** `goodsCents` e totale comprensivo della confezione sono entrambi numeri, ma rappresentano momenti diversi del calcolo. Il tipo da solo non basta.
- **Promessa del nome:** in una catena di filtro e normalizzazione, non chiamare `isValidEmail` un predicato che cerca soltanto una `@`. Dare un nome ai passaggi non ne rafforza le garanzie.

## Limiti

Un helper generico `compose` non è necessario per due passaggi. Se stai perdendo di vista l'ordine o il punto in cui può nascere un errore, assegna il risultato intermedio a una variabile con un nome di dominio. Per un flusso con validazione, rifiuti e scritture vedi la nota sulla pipeline.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]
- [[Programmazione/Clean Code/Pagine/Pipeline di trasformazione|Pipeline di trasformazione]]
- [[Programmazione/Clean Code/Pagine/Trasformazioni dichiarative|Trasformazioni dichiarative]]

## Fonti

- Brian Lonsdorf, [A Mostly Adequate Guide to Functional Programming: Coding by Composing](https://mostly-adequate.gitbook.io/mostly-adequate-guide/ch05)
- Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*; Eric Elliott, *Composing Software*
