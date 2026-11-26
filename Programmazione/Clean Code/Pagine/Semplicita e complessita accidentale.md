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
  - semplicita
  - complessita
aliases:
  - Semplicita e complessita accidentale
  - Complessita accidentale
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Manutenibilita del codice]]"
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
title: Semplicita e complessita accidentale
---

# Semplicita e complessita accidentale

## Sintesi

La complessità **essenziale** resta anche cambiando implementazione, perché appartiene al problema che si è scelto di risolvere. Quella **accidentale** deriva dai meccanismi usati per risolverlo. «Accidentale» non significa automaticamente «inutile»: un meccanismo può essere il costo ragionevole di un vincolo reale.

## Esempio

Regola di esempio: gli iscritti premium ottengono 500 centesimi di sconto; gli altri zero. Lo sconto non può superare il totale dell'ordine. Il totale è un intero non negativo in centesimi.

```js
function discountCents(order) {
  if (order.plan !== "premium") return 0;
  return Math.min(order.totalCents, 500);
}
```

Con un ordine premium da 300 centesimi lo sconto è 300, non 500. Togliere `Math.min` accorcerebbe il codice eliminando **un requisito**. Togliere invece una factory che seleziona sempre e solo questa funzione eliminerebbe un passaggio senza perdere una decisione di dominio.

## Criterio di scelta

Chiedi «che cosa diventa impossibile se rimuoviamo questo livello?». Se la risposta è «non potremmo più caricare le regole dei partner senza ridistribuire il programma», il livello risponde a un requisito verificabile. Se è «forse un giorno ci servirà un partner», basta per ora una funzione con input e risultato definiti.

## Limiti ed errori comuni

- Una regola di dominio può cambiare: non è una legge universale, ma è essenziale **dato il requisito attuale**.
- Spostare una scelta in un file di configurazione non la elimina: qualcuno deve ancora validare i valori e stabilire cosa accade se mancano.
- Due formule oggi uguali non condividono necessariamente una politica. Accorparle ha senso se anche il motivo per cambiarle è lo stesso.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Clean Code|Clean Code]]
- [[Programmazione/Clean Code/Pagine/Manutenibilita del codice|Manutenibilita del codice]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Debito tecnico|Debito tecnico]]

## Fonti

- Fred Brooks, [No Silver Bullet: Essence and Accidents of Software Engineering](https://doi.org/10.1109/MC.1987.1663532)
- Martin Fowler, *Refactoring*
