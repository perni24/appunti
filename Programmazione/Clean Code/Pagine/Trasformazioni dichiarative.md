---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [clean-code, dichiarativo, trasformazioni]
aliases: [Trasformazioni dichiarative, Codice dichiarativo]
prerequisites: [Funzioni pure e impure, Composizione di funzioni]
related: [Pipeline di trasformazione, Codice esplicito vs codice implicito, Leggibilita del codice]
---

# Trasformazioni dichiarative

## Sintesi

Le **trasformazioni dichiarative** descrivono cosa deve accadere ai dati piu che ogni dettaglio meccanico di come farlo.

Nel Clean Code aiutano a rendere leggibili operazioni come filtrare, mappare, raggruppare, validare e normalizzare dati.

## Problema che risolve

Il codice imperativo dettagliato puo nascondere l'intenzione dietro variabili temporanee e controllo manuale del flusso.

Il lettore vede molti dettagli:

- indici;
- accumulatori;
- condizioni annidate;
- mutazioni;
- cicli;
- stati intermedi.

Ma deve dedurre da solo lo scopo finale.

## Concetto chiave

Una trasformazione dichiarativa rende visibile l'intenzione:

```text
filtra ordini pagati -> estrai totale -> somma
```

Il focus non e eliminare ogni ciclo, ma scegliere una forma che faccia emergere il dominio.

## Dettagli importanti

- `map`, `filter`, `reduce`, query builder e pipeline sono strumenti dichiarativi comuni.
- Il codice dichiarativo non deve diventare criptico.
- I nomi dei predicati e delle trasformazioni contano molto.
- Una trasformazione dichiarativa e piu utile quando lavora su dati ben modellati.
- Le operazioni complesse possono richiedere passaggi nominati.

## Esempio

Versione imperativa:

```js
const totals = [];

for (const order of orders) {
  if (order.status === "paid") {
    totals.push(order.total);
  }
}
```

Versione dichiarativa:

```js
const paidTotals = orders
  .filter((order) => order.status === "paid")
  .map((order) => order.total);
```

La seconda versione evidenzia filtro e trasformazione.

## Limiti

- Catene troppo lunghe possono essere difficili da debuggare.
- `reduce` usato male puo diventare meno leggibile di un ciclo.
- Alcuni algoritmi sono piu chiari in forma esplicitamente imperativa.
- Le astrazioni dichiarative possono nascondere costi di performance.

## Errori comuni

- Usare stile dichiarativo per sembrare elegante, non per chiarire.
- Scrivere callback troppo lunghe dentro `map` o `filter`.
- Nascondere side effects dentro trasformazioni.
- Usare `reduce` per operazioni che richiedono nomi intermedi.
- Confondere codice compatto con codice leggibile.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Codice esplicito vs codice implicito]]
- [[Leggibilita del codice]]
- [[Composizione di funzioni]]
- [[Pipeline di trasformazione]]
- [[Side effects controllati]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Refactoring*
- Eric Elliott, *Composing Software*
