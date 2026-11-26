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
  - manutenibilita
  - debito-tecnico
aliases:
  - Manutenibilita del codice
  - Codice manutenibile
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Debito tecnico]]"
  - "[[Programmazione/Clean Code/Pagine/Semplicita e complessita accidentale]]"
title: Manutenibilita del codice
---

# Manutenibilita del codice

## Sintesi

La manutenibilità è la facilità con cui si può cambiare un sistema e verificare che il resto continui a funzionare. La leggibilità aiuta a capire una funzione; la manutenibilità si osserva seguendo una modifica attraverso l'intero sistema.

## Problema che risolve

Checkout, preventivo e conferma email contengono tre copie leggibili della stessa soglia di spedizione gratuita. Il giorno in cui la soglia cambia, correggerne solo due produce totali discordanti anche se ogni singola funzione è facile da leggere.

## Esempio

Il requisito è spedizione gratuita **a partire da** 50 euro; sotto soglia costa 4,90 euro. Gli importi sono interi non negativi, espressi in centesimi di euro.

```js
function shippingFeeCents(subtotalCents) {
  return subtotalCents >= 5000 ? 0 : 490;
}
```

Checkout e preventivo chiamano la stessa regola. Se la soglia passa a 60 euro, si modifica la regola e si verificano 5999 e 6000 centesimi. La conferma di **un ordine già accettato**, invece, mostra la spesa registrata sull'ordine: ricalcolarla al momento dell'invio riscriverebbe la storia. Centralizzare la decisione non significa riprenderla ogni volta.

## Come valutare una modifica

1. Scrivi un caso di confine prima di toccare il calcolo: oggi 4999 costa 490, 5000 costa zero.
2. Individua chi decide il prezzo e chi deve solo mostrarlo. Controlla anche gli utilizzi indiretti, come report, email o dati salvati.
3. Dopo la modifica verifica sia il preventivo nuovo sia la lettura di un ordine precedente. Un test sul solo modulo dei prezzi non copre quel secondo percorso.

## Limiti ed errori comuni

Non misurare la manutenibilità contando i file toccati: una migrazione del formato persistito può richiedere più interventi legittimi. È un segnale più utile dover indovinare **quali copie della stessa decisione** aggiornare. Per uno script usa e getta può bastare una sola funzione; una gerarchia di moduli senza modifiche indipendenti non compra stabilità.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]
- [[Programmazione/Clean Code/Pagine/Semplicita e complessita accidentale|Semplicita e complessita accidentale]]
- [[Programmazione/Clean Code/Pagine/Funzioni con responsabilita singola|Funzioni con responsabilita singola]]

## Fonti

- Martin Fowler, *Refactoring*
- Robert C. Martin, *Clean Code*
- Martin Fowler, [Design Stamina Hypothesis](https://martinfowler.com/bliki/DesignStaminaHypothesis.html)
