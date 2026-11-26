---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - clean-code
  - idempotenza
  - resilienza
aliases:
  - Idempotenza
  - Idempotency
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori]]"
  - "[[Programmazione/Clean Code/Pagine/Side effects controllati]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Race condition e leggibilita]]"
  - "[[Programmazione/Clean Code/Pagine/Code e worker]]"
  - "[[Programmazione/Clean Code/Pagine/Operazioni atomiche]]"
title: Idempotenza
---

# Idempotenza

## Sintesi

Un'operazione è **idempotente** quando ripetere la stessa intenzione ha lo stesso effetto voluto che applicarla una volta. Non significa ottenere necessariamente la stessa risposta: «creata» al primo tentativo e «già registrata» al secondo sono compatibili con una sola ricevuta.

## Esempio: la ricevuta è l'effetto da proteggere

Il client conserva una chiave per l'intera operazione, anche quando non sa se la prima risposta sia andata persa. Per questo servizio la chiave è unica **per tenant**; `orderId` è l'intero contenuto significativo della richiesta. Il registro SQLite è persistente in produzione e le righe non vengono modificate o cancellate durante il periodo in cui sono ammessi i retry.

```sql
CREATE TABLE receipts (
  id INTEGER PRIMARY KEY,
  tenant TEXT NOT NULL,
  request_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  UNIQUE (tenant, request_key)
);
```

```js
function registerReceipt(db, { tenant, key, orderId }) {
  const created = db.prepare(
    "INSERT INTO receipts (tenant, request_key, order_id) VALUES (?, ?, ?) " +
    "ON CONFLICT (tenant, request_key) DO NOTHING RETURNING id"
  ).get(tenant, key, orderId);
  if (created) return { kind: "created", id: created.id };

  const previous = db.prepare(
    "SELECT id, order_id FROM receipts WHERE tenant = ? AND request_key = ?"
  ).get(tenant, key);
  if (previous.order_id !== orderId) return { kind: "key_conflict" };
  return { kind: "replayed", id: previous.id };
}
```

La funzione usa `DatabaseSync` di Node e riceve tre stringhe non vuote già validate. La scrittura del registro **è la creazione della ricevuta**: non c'è una seconda operazione da fare dopo. Il vincolo decide chi può inserire, senza un fragile «prima controlla se esiste». Chi ripete la stessa chiave con un altro ordine ottiene un conflitto, non la ricevuta del primo. Una chiave diversa rappresenta una nuova intenzione, anche per lo stesso ordine: se il dominio ammette una sola ricevuta per ordine serve un vincolo ulteriore.

## Limiti e verifica

Un timeout non dimostra che la creazione sia fallita. Prova a ignorare la prima risposta e ripetere la richiesta: deve tornare lo stesso ID. Verifica anche il riuso scorretto della chiave e la separazione fra tenant. Se cambiano i parametri rilevanti, confronta anche quelli; se cancelli il registro troppo presto, una vecchia richiesta può produrre un nuovo effetto.

Per un addebito esterno o un'email la riga locale **non rende idempotente il provider**. Un arresto tra chiamata esterna e scrittura locale lascia un esito incerto: occorrono il contratto di deduplicazione del destinatario o una procedura di riconciliazione.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Gestione esplicita degli errori|Gestione esplicita degli errori]]
- [[Programmazione/Clean Code/Pagine/Side effects controllati|Side effects controllati]]
- [[Programmazione/Clean Code/Pagine/Race condition e leggibilita|Race condition e leggibilita]]
- [[Programmazione/Clean Code/Pagine/Code e worker|Code e worker]]
- [[Programmazione/Clean Code/Pagine/Operazioni atomiche|Operazioni atomiche]]

## Fonti

- Martin Kleppmann, *Designing Data-Intensive Applications*
- Michael Nygard, *Release It!*
- [RFC 9110: semantica dei metodi idempotenti](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)
- [SQLite: UPSERT e vincolo che attiva ON CONFLICT](https://www.sqlite.org/lang_upsert.html)
- [Stripe: contratto delle richieste idempotenti](https://docs.stripe.com/api/idempotent_requests)
