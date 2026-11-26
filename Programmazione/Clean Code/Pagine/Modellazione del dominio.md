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
  - dominio
  - modellazione
aliases:
  - Modellazione del dominio
  - Domain modeling
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Value objects]]"
  - "[[Programmazione/Clean Code/Pagine/Invarianti del dominio]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Tipi significativi]]"
  - "[[Programmazione/Clean Code/Pagine/Modellare stati impossibili]]"
  - "[[Programmazione/Clean Code/Pagine/Data objects e behavior objects]]"
title: Modellazione del dominio
---

# Modellazione del dominio

## Sintesi

Modellare il dominio significa dare un posto preciso alle decisioni del prodotto. Una colonna `status` registra un fatto; non dice **chi può cambiare lo stato, a quali condizioni, né cosa restituire se la transizione è vietata**. Una funzione può esprimere queste regole tanto quanto un metodo di una classe.

## Esempio: emettere una bozza

In questa applicazione una fattura può essere emessa una sola volta, deve contenere almeno una riga e il totale deve essere positivo. Le righe arrivano dal modello interno: importi interi non negativi in centesimi, con somma rappresentabile. Il modulo `invoice.mjs` implementa soltanto la decisione:

```js
export function issueInvoice(invoice) {
  if (invoice.status !== "draft") return { ok: false, code: "not_draft" };
  if (invoice.lineCents.length === 0) return { ok: false, code: "empty_invoice" };
  const totalCents = invoice.lineCents.reduce((sum, cents) => sum + cents, 0);
  if (totalCents === 0) return { ok: false, code: "zero_total" };
  return { ok: true, invoice: { ...invoice, status: "issued", totalCents } };
}
```

Una bozza vuota e una con una riga gratuita non hanno lo stesso esito: nel primo caso manca una riga, nel secondo manca un importo positivo. Il caso d'uso può tradurre questi codici in messaggi senza ricostruire le regole. Una seconda chiamata **sulla fattura emessa** è rifiutata; la bozza originale non viene modificata.

## Dove finisce il modello?

Il DTO del form accetta dati grezzi, la funzione decide la transizione, il repository la rende persistente. Il risultato contiene una copia superficiale: le righe condivise vanno trattate come immutabili. Due richieste possono ancora leggere la stessa bozza: per impedire una doppia emissione nel database occorre anche verificare la versione o lo stato quando si scrive. Le regole di fatturazione qui sono un esempio di prodotto, non prescrizioni fiscali.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Value objects|Value objects]]
- [[Programmazione/Clean Code/Pagine/Invarianti del dominio|Invarianti del dominio]]
- [[Programmazione/Clean Code/Pagine/Modellare stati impossibili|Modellare stati impossibili]]
- [[Programmazione/Clean Code/Pagine/Tipi significativi|Tipi significativi]]
- [[Programmazione/Clean Code/Pagine/Data objects e behavior objects|Data objects e behavior objects]]

## Fonti

- Martin Fowler, [Domain Model](https://martinfowler.com/eaaCatalog/domainModel.html)
- Eric Evans, *Domain-Driven Design*; Vaughn Vernon, *Implementing Domain-Driven Design*; Martin Fowler, *Patterns of Enterprise Application Architecture*
