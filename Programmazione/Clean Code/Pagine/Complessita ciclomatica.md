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
  - complessita
  - metriche
aliases:
  - Complessita ciclomatica
  - Cyclomatic complexity
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Funzioni piccole]]"
  - "[[Programmazione/Clean Code/Pagine/Guard clauses]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Complessita cognitiva]]"
  - "[[Programmazione/Clean Code/Pagine/Codice testabile]]"
  - "[[Programmazione/Clean Code/Pagine/Refactoring sicuro]]"
title: Complessita ciclomatica
---

# Complessita ciclomatica

## Sintesi

La complessità ciclomatica di McCabe misura il numero di **percorsi linearmente indipendenti** nel grafo di controllo, non tutte le combinazioni di input o tutte le possibili esecuzioni. Un ciclo può ripetersi molte volte senza che la metrica diventi infinita.

## Esempio: quanti percorsi ha il listino?

Gli sconti non si sommano. Vince la prima regola applicabile nell'ordine VIP, promozione, coupon:

```js
function discountPercent(vip, onSale, hasCoupon) {
  if (vip) return 20;
  if (onSale) return 10;
  if (hasCoupon) return 15;
  return 0;
}
```

Per una funzione connessa con uscita comune (anche virtuale), `V = E - N + 2`: archi meno nodi più due. Qui ci sono tre decisioni binarie semplici; si può usare la scorciatoia **1 + 3 = 4**. Il ramo `else` di una scelta già conteggiata non aggiunge un'altra decisione. Le combinazioni dei tre booleani sono invece otto.

| Input: VIP, promozione, coupon | Prima regola che decide | Risultato |
| --- | --- | --- |
| Sì, sì, sì | VIP | 20 |
| No, sì, sì | Promozione | 10 |
| No, no, sì | Coupon | 15 |
| No, no, no | Nessuna | 0 |

## Come usare il numero

Questi quattro casi attraversano i quattro percorsi e provano alcuni conflitti di precedenza. Non dimostrano, da soli, che tutti i requisiti del listino siano corretti. Spostare un `if` in un helper può abbassare il punteggio locale senza eliminare la scelta dal sistema.

Specifica la variante dello strumento se confronti punteggi reali: per esempio ESLint distingue varianti per il conteggio di `switch` e può contare anche espressioni con corto circuito. Non confondere questa misura con la difficoltà umana di seguire l'annidamento.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Guard clauses|Guard clauses]]
- [[Programmazione/Clean Code/Pagine/Complessita cognitiva|Complessita cognitiva]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Code smells|Code smells]]

## Fonti

- Thomas J. McCabe, *A Complexity Measure*
- ESLint, [Regola complexity e varianti](https://eslint.org/docs/latest/rules/complexity)
- SonarSource, *Cognitive Complexity*; Martin Fowler, *Refactoring*
