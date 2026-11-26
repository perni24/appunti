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
  - architettura
  - service-layer
aliases:
  - Service layer
  - Application service
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
  - "[[Programmazione/Clean Code/Pagine/Controller sottili]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/DTO e modelli di dominio]]"
  - "[[Programmazione/Clean Code/Pagine/Modellazione del dominio]]"
title: Service layer
---

# Service layer

## Sintesi

Il service layer definisce **che cosa deve riuscire insieme** per completare un caso d'uso. Per l'emissione di una fattura non basta passare da `draft` a `issued`: occorre anche lasciare una notifica da consegnare. Salvare e poi chiamare un bus esterno lascia una finestra in cui la fattura risulta emessa ma nessun evento è partito.

## Esempio: un confine di commit per due scritture

`issueInvoice` non conosce HTTP. Riceve il comando validato, un orologio e la transizione [[Programmazione/Clean Code/Pagine/DTO e modelli di dominio|issueDraft]]. `repo` è il [[Programmazione/Clean Code/Pagine/Repository pattern|repository SQLite]] costruito **sulla stessa connessione** che possiede la transazione. In questo esempio tutte le operazioni, inclusa `work`, sono sincrone (Node 24, `DatabaseSync`); non passare callback che restituiscono promesse.

```js
function inWriteTransaction(db, work) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = work();
    db.exec("COMMIT");
    return value;
  } catch (primary) {
    if (db.isTransaction) {
      try { db.exec("ROLLBACK"); }
      catch (cleanup) { throw new AggregateError([primary, cleanup], "Rollback fallito"); }
    }
    throw primary;
  }
}

function issueInvoice({ invoiceId }, { db, repo, nowMs, issueDraft }) {
  return inWriteTransaction(db, () => {
    const current = repo.find(invoiceId);
    if (current === null) return { kind: "missing" };
    const issued = issueDraft(current, nowMs());
    if (issued === null || !repo.saveIssued(issued)) return { kind: "conflict" };
    repo.enqueueIssued(issued);
    return { kind: "issued", invoice: issued };
  });
}
```

## Esiti e limiti

- **Fattura assente o già emessa:** esito applicativo previsto; non viene accodata una seconda notifica.
- **Scrittura nell'outbox fallita:** l'errore risale; il rollback annulla anche il cambio di stato. Il chiamante non riceve un successo prima del commit. `BEGIN` è fuori dal `try` perché la funzione non deve annullare una transazione che non ha acquisito.
- **Commit riuscito:** la fattura e la riga nell'outbox sono persistite insieme. Un processo separato leggerà l'outbox e consegnerà l'evento. Questo **non** garantisce consegna esattamente una volta: se il processo si ferma dopo l'invio ma prima della conferma, il consumatore deve tollerare un duplicato.

La regola «solo una bozza si può emettere» appartiene al dominio; la sequenza «carica, applica la regola, salva e registra l'evento» al service. Verifica la seconda scrittura con un errore controllato e rileggi la prima: un test che osserva soltanto che i due metodi sono stati chiamati non dimostra l'atomicità.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Controller sottili|Controller sottili]]
- [[Programmazione/Clean Code/Pagine/Repository pattern|Repository pattern]]
- [[Programmazione/Clean Code/Pagine/Modellazione del dominio|Modellazione del dominio]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Codice testabile|Codice testabile]]

## Fonti

- Martin Fowler, *Service Layer*
- Robert C. Martin, *Clean Architecture*
- Eric Evans, *Domain-Driven Design*
- [Martin Fowler: Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Transactional Outbox: garanzie e duplicati](https://microservices.io/patterns/data/transactional-outbox.html)
- [SQLite: BEGIN IMMEDIATE e transazioni](https://www.sqlite.org/lang_transaction.html)
