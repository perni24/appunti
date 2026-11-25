---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Vincoli (Constraints)
prerequisites: []
related: []
title: Vincoli (Constraints) in PostgreSQL
---

# Vincoli (Constraints) in PostgreSQL

## Sintesi

Un tipo dice quali valori si possono rappresentare; un vincolo dice quali stati del database sono ammessi. Per esempio, `integer` rappresenta anche numeri negativi: per una quantità obbligatoria e positiva servono **sia** `NOT NULL` **sia** `CHECK (qty > 0)`. La validazione nell'app migliora il messaggio all'utente, ma non protegge gli altri client che scrivono sulla stessa tabella.

## Scegliere la regola

| Regola | Vincolo e limite |
|---|---|
| Campo obbligatorio | `NOT NULL`. Un `CHECK` respinge **false**, non il risultato sconosciuto dovuto a `NULL`. |
| Unicità | `UNIQUE`, anche su più colonne. Di default ammette più valori nulli; `UNIQUE NULLS NOT DISTINCT` li considera uguali. |
| Identità della riga | Una sola `PRIMARY KEY` per tabella, anche composta: impone unicità e non-nullità. PK e unique creano l'indice che applica l'unicità. |
| Relazione fra tabelle | `FOREIGN KEY` verifica il riferimento. Con una FK semplice nullable, `NULL` indica assenza di riferimento: aggiungi `NOT NULL` se il legame è obbligatorio. Sul lato figlio non nasce automaticamente un indice; valutalo per accessi e cancellazioni frequenti. |
| Relazione fra righe | `EXCLUDE` vieta una coppia per cui **tutti** i confronti dichiarati sono veri; non devono essere tutti confronti di uguaglianza. Non usare un normale `CHECK` per confrontare righe diverse. |

## Esempio: cliente obbligatorio e quantità positiva

Esegui l'intero blocco su un database di prova senza transazione aperta. Le tabelle temporanee vengono annullate alla fine.

```sql
BEGIN;
CREATE TEMP TABLE lab_customers (
    id integer PRIMARY KEY,
    email text NOT NULL UNIQUE,
    external_ref text UNIQUE
);
CREATE TEMP TABLE lab_orders (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id integer NOT NULL,
    qty integer NOT NULL CONSTRAINT lab_qty_positive CHECK (qty > 0),
    CONSTRAINT lab_customer_fk FOREIGN KEY (customer_id)
        REFERENCES lab_customers(id) ON DELETE RESTRICT
);
INSERT INTO lab_customers VALUES (1,'ada@example.org',NULL), (2,'teo@example.org',NULL);
INSERT INTO lab_orders (customer_id, qty) VALUES (1, 2) RETURNING customer_id, qty;
ROLLBACK;
```

Risultato: `1, 2`. I due `NULL` in `external_ref` sono ammessi. In questa struttura una quantità zero viola il `CHECK`; una quantità nulla viola `NOT NULL`; un cliente inesistente viola la FK. I nomi dei vincoli aiutano a distinguere questi errori senza dipendere dal testo tradotto del messaggio.

Con `ON DELETE RESTRICT` non puoi cancellare il cliente finché esiste un ordine che lo riferisce. `CASCADE` eliminerebbe anche gli ordini; `SET NULL` richiederebbe che la colonna figlia ammetta il nullo. La scelta descrive la regola del dominio, non una scorciatoia per far riuscire una cancellazione.

## Esempio: prenotazioni non sovrapposte

Per questo blocco serve `btree_gist` disponibile sul server: fornisce l'operatore GiST di uguaglianza per l'intero della stanza. Solo in un **database di prova** e con i permessi necessari, esegui il blocco intero. L'eventuale creazione dell'estensione è annullata dal rollback; se era già presente non viene rimossa.

```sql
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TEMP TABLE lab_bookings (
    room_id integer NOT NULL,
    period tstzrange NOT NULL CHECK (NOT isempty(period)),
    CONSTRAINT lab_no_overlap EXCLUDE USING gist (room_id WITH =, period WITH &&)
);
INSERT INTO lab_bookings VALUES
    (1, tstzrange('2026-06-01 10:00+00', '2026-06-01 11:00+00', '[)')),
    (1, tstzrange('2026-06-01 11:00+00', '2026-06-01 12:00+00', '[)')),
    (2, tstzrange('2026-06-01 10:00+00', '2026-06-01 11:00+00', '[)'));
SELECT room_id, count(*) FROM lab_bookings GROUP BY room_id ORDER BY room_id;
ROLLBACK;
```

La stanza 1 ammette le due prenotazioni adiacenti; la stanza 2 può usare la stessa fascia della 1. Una terza prenotazione della stanza 1 dalle 10:30 alle 11:30 sarebbe rifiutata.

## Quando avviene il controllo?

Normalmente gli errori emergono durante l'istruzione. `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY` ed `EXCLUDE` possono essere dichiarati `DEFERRABLE`: con controllo differito il fallimento può emergere al `COMMIT`, non alla singola scrittura. `CHECK` e `NOT NULL` non si possono rendere differibili. Per esigenze di verifica differita sulle cancellazioni non confondere `RESTRICT` con `NO ACTION`.

**Fonti:** [vincoli di PostgreSQL 18](https://www.postgresql.org/docs/18/ddl-constraints.html), [CREATE TABLE: DEFERRABLE](https://www.postgresql.org/docs/18/sql-createtable.html) e [btree_gist](https://www.postgresql.org/docs/18/btree-gist.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]
