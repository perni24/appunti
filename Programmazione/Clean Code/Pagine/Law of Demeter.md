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
  - oop
  - accoppiamento
aliases:
  - Law of Demeter
  - Legge di Demetra
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Coesione e accoppiamento]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Tell Don't Ask]]"
  - "[[Programmazione/Clean Code/Pagine/Incapsulamento]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
title: Law of Demeter
---

# Law of Demeter

## Sintesi

La **Law of Demeter** suggerisce che un oggetto dovrebbe parlare solo con collaboratori vicini, evitando catene di accesso a oggetti interni.

E un principio per ridurre accoppiamento e conoscenza dei dettagli interni altrui.

## Problema che risolve

Catene come:

```ts
order.customer.address.country.code
```

mostrano che il codice conosce troppa struttura interna. Se cambia una parte della catena, il chiamante si rompe.

## Concetto chiave

Un oggetto dovrebbe interagire principalmente con:

- se stesso;
- i propri parametri;
- oggetti creati localmente;
- collaboratori diretti;
- componenti esplicitamente ricevuti.

Non dovrebbe navigare profondamente dentro oggetti di oggetti.

## Dettagli importanti

- La Law of Demeter non vieta ogni accesso a proprieta.
- Il problema e la dipendenza da struttura interna lontana.
- Spesso si risolve aggiungendo metodi che esprimono intenzione.
- Aiuta a proteggere incapsulamento.
- Va applicata con buon senso su DTO e strutture dati semplici.

## Esempio

Catena fragile:

```ts
if (order.customer.address.country.code === "IT") {
  applyItalianTax(order);
}
```

Metodo piu intenzionale:

```ts
if (order.isForCountry("IT")) {
  applyItalianTax(order);
}
```

Il chiamante non conosce piu la struttura interna dell'ordine.

## Limiti

- Nei DTO annidati una catena puo essere accettabile.
- Applicarla ovunque puo creare metodi pass-through inutili.
- Non sostituisce una buona modellazione.
- In alcuni linguaggi o framework certe catene sono idiomatiche.

## Errori comuni

- Ignorare lunghe catene di accesso in codice di dominio.
- Creare wrapper banali senza migliorare il modello.
- Confondere la legge con un divieto di usare punti.
- Esporre strutture interne mutabili.
- Far dipendere moduli da layout interni di altri moduli.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Tell Don't Ask|Tell Don't Ask]]
- [[Programmazione/Clean Code/Pagine/Incapsulamento|Incapsulamento]]
- [[Programmazione/Clean Code/Pagine/Coesione e accoppiamento|Coesione e accoppiamento]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]

## Fonti

- Ian Holland, *The Law of Demeter*
- Robert C. Martin, *Clean Code*
