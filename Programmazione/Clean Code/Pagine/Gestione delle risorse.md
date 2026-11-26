---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - risorse
  - lifecycle
aliases:
  - Gestione delle risorse
  - Resource management
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/File system e IO]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse]]"
  - "[[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti]]"
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
title: Gestione delle risorse
---

# Gestione delle risorse

## Sintesi

Il proprietario di una risorsa deve sapere **quando l'acquisizione è riuscita** e quale operazione ne conclude l'uso. Chi prende in prestito una connessione non deve chiuderla; può però essere responsabile di una transazione aperta su quella connessione. `COMMIT`, `ROLLBACK` e chiusura della connessione non sono sinonimi.

## Esempio: ordine e riga devono comparire insieme

Esempio per `DatabaseSync` di `node:sqlite` in Node 24.14. Si presuppongono una connessione aperta, vincoli di chiave esterna abilitati e tre tabelle: `orders(id)`, `products(id)` e `order_lines(order_id, product_id)`. Il riferimento al prodotto è dichiarato `DEFERRABLE INITIALLY DEFERRED`: un prodotto inesistente può emergere al **commit**, non all'inserimento della riga.

```js
function saveOrder(db, orderId, productId) {
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO orders(id) VALUES (?)").run(orderId);
    db.prepare("INSERT INTO order_lines(order_id, product_id) VALUES (?, ?)").run(orderId, productId);
    db.exec("COMMIT");
  } catch (primary) {
    if (db.isTransaction) {
      try {
        db.exec("ROLLBACK");
      } catch (cleanup) {
        throw new AggregateError([primary, cleanup], "Ordine e rollback falliti");
      }
    }
    throw primary;
  }
}
```

`BEGIN` resta fuori dal `try`: se il chiamante aveva già una transazione aperta, il nuovo `BEGIN` fallisce e la funzione **non annulla lavoro altrui**. Dopo l'acquisizione, `isTransaction` indica se serve ancora il rollback. Solo il chiamante chiuderà `db`. In un pool, restituire una connessione sana e scartare una di stato incerto sono decisioni diverse.

## Scegliere la strategia

Per file e handle basta spesso acquisire, usare e chiudere in un `finally`. RAII, context manager e `using` legano il rilascio allo scope; non decidono da soli se confermare o annullare un'operazione di dominio. Per più risorse indipendenti, registra il rilascio dopo ogni acquisizione riuscita, non dopo l'ultima.

## Limiti e verifica

Questo esempio è sincrono, su una sola connessione SQLite, senza transazioni annidate. Verifica che un errore alla seconda istruzione o al commit non lasci un nuovo ordine senza riga. Non estendere automaticamente la regola a un database remoto: una disconnessione durante il commit può lasciare il client senza certezza sull'esito.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/File system e IO|File system e IO]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Cleanup e rilascio risorse|Cleanup e rilascio risorse]]
- [[Programmazione/Clean Code/Pagine/Lifecycle degli oggetti|Lifecycle degli oggetti]]

## Fonti

- Robert C. Martin, *Clean Code*
- Michael Nygard, *Release It!*
- Bjarne Stroustrup, *The C++ Programming Language*
- [SQLite: transazioni e gestione degli errori](https://www.sqlite.org/lang_transaction.html)
- [SQLite: vincoli di chiave esterna differiti](https://www.sqlite.org/foreignkeys.html#fk_deferred)
- [Node.js: DatabaseSync.isTransaction](https://nodejs.org/api/sqlite.html#databaseistransaction)
