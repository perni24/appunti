---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, funzioni, leggibilita]
aliases: [Funzioni piccole, Small functions]
prerequisites: [Clean Code]
related: [Funzioni con responsabilita singola, Leggibilita del codice]
---

# Funzioni piccole

## Sintesi

Le **funzioni piccole** sono funzioni con uno scopo limitato, facili da leggere e verificare. Non sono piccole solo per numero di righe: sono piccole per carico cognitivo.

Una funzione piccola permette al lettore di capire rapidamente cosa succede.

## Problema che risolve

Funzioni lunghe tendono a mescolare:

- validazione;
- calcolo;
- accesso dati;
- gestione errori;
- logging;
- trasformazioni;
- effetti collaterali.

Questo rende difficile testare e modificare il comportamento.

## Concetto chiave

Una funzione piccola dovrebbe:

- stare a un singolo livello di astrazione;
- avere pochi motivi per cambiare;
- avere input e output chiari;
- nascondere dettagli solo quando il nome li spiega bene;
- essere leggibile senza scorrere molto.

Non esiste un numero magico di righe, ma una funzione che richiede molte spiegazioni e spesso troppo grande.

## Dettagli importanti

- Estrarre funzioni serve a nominare concetti.
- Non estrarre funzioni solo per rispettare un limite numerico.
- Troppe micro-funzioni senza nomi chiari peggiorano la lettura.
- Le funzioni piccole facilitano test mirati.
- Una funzione piccola puo comunque essere sbagliata se il nome e debole.

## Esempio

Funzione lunga:

```js
function checkout(order) {
  validateOrder(order);
  const total = calculateTotal(order);
  chargePayment(order.customer, total);
  sendReceipt(order.customer);
}
```

Questa funzione e accettabile se resta orchestration ad alto livello. I dettagli stanno in funzioni nominate.

## Limiti

- Alcuni algoritmi sono piu leggibili se restano insieme.
- Estrarre troppi passaggi puo nascondere il flusso.
- Le funzioni piccole non risolvono design sbagliato.
- In codice performance-critical l'estrazione va valutata.

## Errori comuni

- Estrarre funzioni con nomi generici come `handleData`.
- Creare funzioni piccole ma piene di side effects.
- Mescolare livelli di astrazione.
- Lasciare parametri globali impliciti.
- Pensare che meno righe significhi sempre codice migliore.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Funzioni con responsabilita singola]]
- [[Leggibilita del codice]]
- [[Naming di variabili e funzioni]]
- [[Semplicita e complessita accidentale]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
