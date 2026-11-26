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
  - dipendenze
  - modularita
aliases:
  - Dipendenze esplicite
  - Dipendenze visibili
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito]]"
  - "[[Programmazione/Clean Code/Pagine/Confini tra moduli]]"
  - "[[Programmazione/Clean Code/Pagine/Moduli piccoli]]"
title: Dipendenze esplicite
---

# Dipendenze esplicite

## Sintesi

Una dipendenza è **visibile** se puoi individuarla; è **sostituibile** se puoi cambiarla senza modificare il codice che la usa. Importare il client SQL in cima al file rende chiaro che esiste, ma lega ancora il caso d'uso a quel client. Passare l'operazione necessaria consente di verificarlo anche senza un database.

## Esempio: emettere una fattura

Il chiamante ha già validato l'identificatore dell'ordine. Il caso d'uso deve registrare l'ordine e l'istante di emissione, quindi restituire l'ID assegnato dall'archivio. Non decide come aprire una connessione né da dove leggere l'ora.

```ts
type InvoiceDraft = { orderId: string; issuedAtMs: number };
type InvoiceDeps = {
  nowMs: () => number;
  insert: (draft: InvoiceDraft) => Promise<string>;
};

function makeIssueInvoice({ nowMs, insert }: InvoiceDeps) {
  return function issueInvoice(orderId: string): Promise<string> {
    return insert({ orderId, issuedAtMs: nowMs() });
  };
}
```

Il codice di avvio costruisce il servizio una volta, passando `Date.now` e una funzione che chiama il repository. A ogni ordine cambia `orderId`; i collaboratori restano gli stessi. Se `insert` proviene da un oggetto e usa `this`, passa `draft => repo.insert(draft)` invece del metodo staccato dal suo oggetto.

## Come verificarlo

Fornisci un orologio che restituisce 1000 e un archivio che registra il dato e risolve con `"inv-7"`. Con `"order-3"` il dato scritto deve essere `{ orderId: "order-3", issuedAtMs: 1000 }` e il chiamante deve ricevere `"inv-7"`. Se l'archivio rifiuta la promessa, lo stesso errore deve arrivare al chiamante. Questa prova non dice se il database reale rispetti il contratto: per quello serve un test dell'adattatore.

## Limiti ed errori comuni

- Un helper puro e stabile può restare un normale import. Inietta le dipendenze che cambiano tra contesti o producono effetti rilevanti, non ogni funzione.
- Leggere la configurazione all'avvio non basta se poi il modulo cerca servizi attraverso un contenitore globale. Passagli le sole operazioni che deve usare, non l'intero ambiente.
- Rendere visibile l'archivio non rende la scrittura idempotente: nell'esempio, due chiamate richiedono due inserimenti.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Codice esplicito vs codice implicito|Codice esplicito vs codice implicito]]
- [[Programmazione/Clean Code/Pagine/Confini tra moduli|Confini tra moduli]]
- [[Programmazione/Clean Code/Pagine/Moduli piccoli|Moduli piccoli]]
- [[Programmazione/Clean Code/Pagine/Oggetti con responsabilita chiara|Oggetti con responsabilita chiara]]

## Fonti

- Robert C. Martin, *Clean Architecture*
- Martin Fowler, [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
