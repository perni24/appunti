---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
difficulty: base
tags: [clean-code, commenti, todo, debito-tecnico]
aliases: [Commenti temporanei e TODO, TODO nel codice]
prerequisites: [Commenti che spiegano il perche non il cosa]
related: [Debito tecnico, README e documentazione tecnica]
---

# Commenti temporanei e TODO

## Sintesi

I **commenti temporanei** e i `TODO` servono a segnalare lavoro incompleto, compromessi o punti da rivedere. Sono utili solo se hanno contesto, ownership e una possibilita reale di essere risolti.

Un `TODO` senza responsabilita diventa facilmente debito tecnico invisibile.

## Problema che risolve

Durante lo sviluppo capita di lasciare una soluzione provvisoria. Il problema nasce quando il provvisorio resta nel codice senza spiegazione.

Commenti temporanei ben scritti permettono di non perdere contesto, ma non devono diventare una discarica.

## Concetto chiave

Un `TODO` utile dovrebbe spiegare:

- cosa manca;
- perche non e stato fatto ora;
- quale rischio crea;
- chi o cosa lo traccia;
- quando va rimosso.

Se non c'e un piano, il commento sta solo spostando il problema.

## Dettagli importanti

- Collega il `TODO` a issue, ticket o decisione.
- Evita commenti generici come `fix later`.
- Rimuovi commenti temporanei quando il lavoro viene completato.
- Non usare `TODO` per spiegare codice incomprensibile.
- I workaround devono spiegare il vincolo esterno.

## Esempio

Debole:

```js
// TODO: sistemare
calculatePrice(order);
```

Migliore:

```js
// TODO(#421): sostituire questa regola quando il nuovo listino sara attivo.
calculateLegacyPrice(order);
```

Il secondo commento rende chiaro contesto e tracciamento.

## Limiti

- Alcuni team preferiscono non lasciare `TODO` nel codice.
- Troppi `TODO` riducono fiducia nella codebase.
- Un ticket esterno puo essere piu adatto di un commento.
- Non tutto il lavoro incompleto deve entrare nel branch principale.

## Errori comuni

- Lasciare `TODO` senza issue.
- Usare commenti temporanei per mesi senza revisione.
- Scrivere commenti vaghi.
- Non rimuovere workaround non piu necessari.
- Usare `TODO` per evitare una decisione tecnica.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Commenti che spiegano il perche non il cosa]]
- [[Debito tecnico]]
- [[README e documentazione tecnica]]
- [[Convenzioni di progetto]]

## Fonti

- Robert C. Martin, *Clean Code*
- Martin Fowler, *Technical Debt*
