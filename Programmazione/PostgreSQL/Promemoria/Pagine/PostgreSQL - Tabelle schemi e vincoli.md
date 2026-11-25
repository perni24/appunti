---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - ddl
  - schemi
  - vincoli
aliases:
  - Cheatsheet DDL PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Schemi e Search Path]]"
  - "[[Programmazione/PostgreSQL/Pagine/Vincoli]]"
title: PostgreSQL - Tabelle, schemi e vincoli
---

# PostgreSQL - Tabelle, schemi e vincoli

Esegui i blocchi in ordine in **una sola sessione di prova**, senza transazione aperta. Serve il permesso di creare uno schema. Se `lab_ddl` esiste già, fermati: la prova usa e rimuove soltanto oggetti che crea lei.

## Schema e tabelle

```sql
BEGIN;
CREATE SCHEMA lab_ddl;
SET LOCAL search_path TO lab_ddl;
```

`SET LOCAL` vale fino alla fine della transazione. Nei comandi riutilizzati dall'app indica lo schema: il nome non deve dipendere dal `search_path` della connessione.

```sql
CREATE TABLE lab_ddl.customers (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL UNIQUE CHECK (btrim(email) <> ''),
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE lab_ddl.orders (
    id bigint PRIMARY KEY,
    customer_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id)
        REFERENCES lab_ddl.customers(id) DEFERRABLE INITIALLY DEFERRED
);
```

`CHECK` da solo non rifiuta NULL: per questo `amount` ha anche `NOT NULL`. La FK non crea automaticamente un indice su `orders.customer_id`.

## Controllare una FK differita

```sql
INSERT INTO lab_ddl.orders VALUES (10, 1, 12.50);
INSERT INTO lab_ddl.customers (email) VALUES ('ada@example.org') RETURNING id;
SET CONSTRAINTS lab_ddl.orders_customer_fk IMMEDIATE;
```

L'ordine può precedere il cliente **nella stessa transazione**. Il cliente appena creato ha ID 1. `SET CONSTRAINTS ... IMMEDIATE` controlla subito le righe già scritte: senza il cliente otterresti `23503`. Per vietare l'eliminazione di un padre referenziato senza differire quell'azione, usa `ON DELETE RESTRICT`.

## Aggiungere, rinominare e convertire una colonna

```sql
ALTER TABLE lab_ddl.orders ADD COLUMN batch text;
ALTER TABLE lab_ddl.orders ADD CONSTRAINT batch_not_blank CHECK (btrim(batch) <> '');
UPDATE lab_ddl.orders SET batch = '007' WHERE id = 10;
ALTER TABLE lab_ddl.orders RENAME COLUMN batch TO lot;
```

```sql
ALTER TABLE lab_ddl.orders DROP CONSTRAINT batch_not_blank;
ALTER TABLE lab_ddl.orders ALTER COLUMN lot TYPE integer USING lot::integer;
SELECT id, lot, pg_typeof(lot) FROM lab_ddl.orders;
```

Risultato: `10, 7, integer`. Gli zeri iniziali vanno persi. Il vincolo testuale usava `btrim`, perciò va sostituito o rimosso prima del cambio di tipo. Un testo non convertibile fa fallire l'ALTER.

## Rimuovere senza CASCADE

```sql
ALTER TABLE lab_ddl.orders DROP COLUMN lot;
DROP TABLE lab_ddl.orders;
DROP TABLE lab_ddl.customers;
DROP SCHEMA lab_ddl;
ROLLBACK;
```

Questi DROP distruggono dati: qui riguardano solo la prova. Prima la figlia, poi il padre, infine lo schema vuoto. Se non vuoi provare i DROP, esegui soltanto `ROLLBACK;`: annulla anche il CREATE SCHEMA iniziale.

## Approfondimento

- [PostgreSQL 18: vincoli](https://www.postgresql.org/docs/18/ddl-constraints.html) e [controllo differito](https://www.postgresql.org/docs/18/sql-set-constraints.html).

- [[Programmazione/PostgreSQL/Pagine/Schemi e Search Path|Schemi e Search Path]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1 a 1 1 a N e N a N]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
