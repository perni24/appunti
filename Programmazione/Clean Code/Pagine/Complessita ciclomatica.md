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

La **complessita ciclomatica** misura quanti percorsi logici indipendenti esistono in una funzione o modulo.

In pratica aumenta con `if`, `else`, `switch`, loop, condizioni booleane e rami di controllo.

## Problema che risolve

Una funzione con molti rami e difficile da capire e testare.

Ogni ramo aggiunge combinazioni possibili, casi limite e percorsi da verificare. La metrica aiuta a individuare funzioni che meritano attenzione.

## Concetto chiave

La complessita ciclomatica non dice se il codice e sbagliato, ma segnala quanto e difficile coprire tutti i percorsi.

Una funzione con valore alto spesso sta facendo troppe decisioni insieme.

## Esempio

```js
function priceFor(customer, product) {
  if (customer.vip) return product.price * 0.8;
  if (product.onSale) return product.price * 0.9;
  if (customer.hasCoupon) return product.price * 0.85;

  return product.price;
}
```

La funzione contiene piu rami decisionali. Se le regole crescono, conviene estrarle in policy nominate o tabelle di regole.

## Dettagli importanti

- La metrica e utile come segnale, non come giudizio assoluto.
- Funzioni con molti rami richiedono piu test.
- Estrarre funzioni puo ridurre il carico locale, ma non sempre la complessita totale.
- Strategie, policy e guard clauses possono semplificare il flusso.
- Alcuni parser o algoritmi hanno complessita naturale piu alta.

## Limiti

- Non misura quanto il codice e leggibile per una persona.
- Non considera nomi, dominio, side effects o struttura dei dati.
- Una funzione con bassa complessita puo comunque essere confusa.
- Ridurre la metrica meccanicamente puo peggiorare il design.

## Errori comuni

- Inseguire una soglia numerica senza capire il codice.
- Spezzare funzioni in modo artificiale.
- Ignorare combinazioni tra rami indipendenti.
- Non aggiungere test per percorsi alternativi.
- Confondere complessita ciclomatica e complessita cognitiva.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Funzioni piccole|Funzioni piccole]]
- [[Programmazione/Clean Code/Pagine/Guard clauses|Guard clauses]]
- [[Programmazione/Clean Code/Pagine/Complessita cognitiva|Complessita cognitiva]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]
- [[Programmazione/Clean Code/Pagine/Code smells|Code smells]]

## Fonti

- Thomas J. McCabe, *A Complexity Measure*
- SonarSource, *Cognitive Complexity*
- Martin Fowler, *Refactoring*
