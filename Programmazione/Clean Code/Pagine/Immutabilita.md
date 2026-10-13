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
  - immutabilita
  - stato
aliases:
  - Immutabilita
  - Immutability
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Funzioni pure e impure]]"
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
title: Immutabilita
---

# Immutabilita

## Sintesi

L'**immutabilita** e la scelta di rappresentare dati che, una volta creati, non vengono modificati.

Nel Clean Code riduce sorpresa e ambiguita: invece di cambiare un valore esistente, il codice crea un nuovo valore che rappresenta il nuovo stato.

## Problema che risolve

La mutazione condivisa rende difficile rispondere a domande semplici:

- chi ha cambiato questo valore?
- in quale momento e cambiato?
- esiste uno stato intermedio non valido?
- due parti del programma stanno guardando lo stesso oggetto?
- un test ha lasciato stato sporco per il test successivo?

## Concetto chiave

Con l'immutabilita, i dati diventano piu simili a fatti che a contenitori modificabili.

Questo non significa che il sistema non cambi. Significa che il cambiamento viene rappresentato creando nuove versioni dei dati, invece di alterare quella vecchia in modo implicito.

## Dettagli importanti

- I value objects sono candidati naturali all'immutabilita.
- L'immutabilita protegge invarianti e rende piu sicuro il passaggio di dati.
- Nei linguaggi con copie superficiali bisogna distinguere immutabilita esterna e interna.
- Le strutture persistenti possono ridurre il costo delle copie.
- L'immutabilita rende piu semplice ragionare su concorrenza e cache.

## Esempio

Mutazione diretta:

```js
function markPaid(invoice) {
  invoice.status = "paid";
  invoice.paidAt = new Date();
  return invoice;
}
```

Nuovo valore:

```js
function markPaid(invoice, paidAt) {
  return {
    ...invoice,
    status: "paid",
    paidAt,
  };
}
```

La seconda versione evita di modificare l'oggetto ricevuto.

## Limiti

- Copiare strutture molto grandi puo avere un costo.
- Alcune API o framework lavorano in modo mutabile.
- Database e UI restano sistemi stateful.
- L'immutabilita non sostituisce una buona modellazione del dominio.

## Errori comuni

- Usare spread o copie superficiali credendo di proteggere oggetti annidati.
- Mescolare oggetti immutabili e mutabili senza convenzioni chiare.
- Rendere immutabile un dato ma lasciare mutabili le sue dipendenze interne.
- Creare copie inutili in hot path senza misurare.
- Confondere immutabilita con assenza di eventi o cambiamenti nel programma.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Stato mutabile e immutabile|Stato mutabile e immutabile]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Funzioni pure e impure|Funzioni pure e impure]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]

## Fonti

- Eric Evans, *Domain-Driven Design*
- Martin Fowler, *Refactoring*
- Eric Elliott, *Composing Software*
