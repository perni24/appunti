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
  - indici
  - explain
aliases:
  - Cheatsheet indici PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Indici]]"
  - "[[Programmazione/PostgreSQL/Pagine/Analisi delle Query]]"
title: PostgreSQL - Indici ed EXPLAIN
---

# PostgreSQL - Indici ed EXPLAIN

Parti dalla query: quali righe cerca, come le ordina, quali colonne restituisce? Prova i blocchi in ordine in un **database di laboratorio**, con autocommit inizialmente attivo e permesso di creare schemi. Se `lab_idx` esiste già, fermati.

## Preparare un caso ripetibile

```sql
BEGIN;
CREATE SCHEMA lab_idx;
CREATE TABLE lab_idx.orders (id int PRIMARY KEY, customer_id int NOT NULL,
    ref text NOT NULL, status text NOT NULL, metadata jsonb NOT NULL);
INSERT INTO lab_idx.orders
SELECT i, i % 20, 'ORD-' || i, CASE WHEN i % 25 = 0 THEN 'open' ELSE 'closed' END,
       jsonb_build_object('web', i % 3 = 0) FROM generate_series(1, 2000) AS s(i);
COMMIT;
```

```sql
ANALYZE lab_idx.orders;
```

## Stimare, creare l'indice, misurare

```sql
EXPLAIN SELECT id, status FROM lab_idx.orders
WHERE customer_id = 7 ORDER BY id DESC LIMIT 3;
```

```sql
CREATE INDEX orders_customer_latest ON lab_idx.orders (customer_id, id DESC) INCLUDE (status);
```

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, status FROM lab_idx.orders
WHERE customer_id = 7 ORDER BY id DESC LIMIT 3;
```

Il B-tree composto cerca per cliente e offre l'ordine per ID; `INCLUDE` rende `status` disponibile nell'indice, non una chiave di ricerca. Per filtrare soltanto per cliente può bastare `(customer_id)`. Il planner può comunque scegliere una scansione sequenziale.

`EXPLAIN` mostra le stime. `EXPLAIN ANALYZE` **esegue** la query e mostra il piano, non le righe della SELECT: qui il nodo finale produce tre righe. Confronta righe stimate, `actual rows`, `loops` e buffer, non il costo con i millisecondi. Su un UPDATE o DELETE anche la modifica verrebbe eseguita.

## Varianti per una domanda diversa

Unicità dell'espressione: `ord-1` confligge con `ORD-1`.

```sql
CREATE UNIQUE INDEX orders_ref_ci ON lab_idx.orders (lower(ref));
```

Indice parziale per cercare solo ordini aperti. Il planner deve poter dedurre dal filtro della query che le righe richieste soddisfano il predicato.

```sql
CREATE INDEX orders_open ON lab_idx.orders (id) WHERE status = 'open';
```

GIN per il contenimento JSONB, ad esempio `metadata @> '{"web":true}'`.

```sql
CREATE INDEX orders_metadata ON lab_idx.orders USING gin (metadata);
```

## Creare o togliere un indice con scritture in corso

Esegui **ciascun comando da solo, fuori da BEGIN**. `CONCURRENTLY` permette di continuare le scritture, ma può attendere altre transazioni. Una creazione interrotta può lasciare un indice non valido.

```sql
CREATE INDEX CONCURRENTLY orders_status ON lab_idx.orders (status);
```

```sql
DROP INDEX CONCURRENTLY lab_idx.orders_status;
```

## Controllare definizioni e uso

```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'lab_idx' AND tablename = 'orders' ORDER BY indexname;
```

```sql
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes
WHERE relid = 'lab_idx.orders'::regclass ORDER BY indexrelname;
```

Restano cinque indici, incluso quello della PK. `idx_scan` è un contatore cumulativo: uno zero appena dopo la creazione non basta per decidere di eliminare un indice.

## Pulizia della prova

```sql
DROP TABLE lab_idx.orders;
DROP SCHEMA lab_idx;
```

Elimina soltanto la tabella del laboratorio (e i suoi indici) e lo schema rimasto vuoto.

## Approfondimento

- [PostgreSQL 18: CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html) e [lettura di EXPLAIN](https://www.postgresql.org/docs/18/sql-explain.html).

- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Slow query log|Slow query log]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
