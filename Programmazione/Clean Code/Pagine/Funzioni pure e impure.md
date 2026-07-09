---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, funzioni, side-effects]
aliases: [Funzioni pure e impure, Pure functions]
prerequisites: [Clean Code, Funzioni piccole]
related: [Side effects controllati, Immutabilita, Codice testabile]
---

# Funzioni pure e impure

## Sintesi

Una **funzione pura** restituisce sempre lo stesso risultato a parita di input e non produce side effects osservabili.

Una **funzione impura** dipende da stato esterno o modifica qualcosa fuori dal proprio valore di ritorno.

Nel Clean Code questa distinzione serve a capire quali parti del codice sono prevedibili e quali parti interagiscono con il mondo esterno.

## Problema che risolve

Quando una funzione legge o modifica stato esterno senza renderlo chiaro, il lettore deve ricostruire piu contesto di quanto dovrebbe.

Questo porta a problemi come:

- test fragili;
- bug che dipendono dall'ordine di esecuzione;
- funzioni difficili da riusare;
- logica di dominio mescolata con I/O;
- modifiche apparentemente locali che cambiano comportamenti lontani.

## Concetto chiave

Una funzione pura e una trasformazione esplicita:

```text
input -> output
```

Non legge clock, rete, database, variabili globali o stato condiviso. Non scrive file, non muta parametri e non invia eventi.

Una funzione impura invece puo essere necessaria, ma dovrebbe essere riconoscibile. In un buon design, la logica pura viene separata dai punti in cui il programma produce effetti.

## Dettagli importanti

- Le funzioni pure sono piu facili da testare.
- Le funzioni impure sono inevitabili in applicazioni reali.
- Il problema non e l'impurita in se, ma l'impurita nascosta.
- Una funzione che muta un parametro e impura anche se non usa servizi esterni.
- Una funzione che legge `Date.now()`, random, cache globale o configurazione mutabile non e pura.

## Esempio

Funzione impura:

```js
let discount = 0.1;

function calculateTotal(order) {
  return order.total * (1 - discount);
}
```

Il risultato dipende da `discount`, che non e passato come input.

Funzione pura:

```js
function calculateTotal(order, discount) {
  return order.total * (1 - discount);
}
```

Ora il comportamento dipende solo dagli argomenti.

## Limiti

- Non tutto il codice puo essere puro.
- UI, database, rete, log e file system richiedono effetti.
- Rendere tutto puro puo produrre astrazioni artificiali.
- In alcuni casi passare troppi parametri puo peggiorare la leggibilita.

## Errori comuni

- Chiamare pura una funzione che muta oggetti ricevuti in input.
- Nascondere accessi a servizi esterni dentro helper apparentemente innocui.
- Usare variabili globali per evitare parametri espliciti.
- Mescolare validazione, trasformazione e salvataggio nella stessa funzione.
- Pensare che una funzione senza `return` sia solo una procedura innocua: spesso e piena di effetti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Funzioni piccole]]
- [[Funzioni con responsabilita singola]]
- [[Stato mutabile e immutabile]]
- [[Side effects controllati]]
- [[Immutabilita]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Eric Elliott, *Composing Software*
