---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, indici, explain]
aliases: [Cheatsheet indici PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Tipi di Indici]]"
  - "[[Programmazione/Postgres/Pagine/Analisi delle Query]]"
---

# PostgreSQL - Indici ed EXPLAIN

## Indice B-tree

```sql
CREATE INDEX orders_user_id_idx
ON orders (user_id);
```

## Indice composto

```sql
CREATE INDEX orders_user_created_idx
ON orders (user_id, created_at DESC);
```

L'ordine delle colonne deve seguire filtri e ordinamenti reali.

## Indice univoco

```sql
CREATE UNIQUE INDEX users_email_unique_idx
ON users (lower(email));
```

## Indice parziale

```sql
CREATE INDEX orders_open_created_idx
ON orders (created_at)
WHERE status = 'open';
```

La query deve contenere un predicato compatibile.

## Colonne incluse

```sql
CREATE INDEX orders_user_covering_idx
ON orders (user_id)
INCLUDE (status, amount);
```

## Indice GIN

```sql
CREATE INDEX entities_metadata_gin_idx
ON entities
USING gin (metadata);
```

## Creazione concorrente

```sql
CREATE INDEX CONCURRENTLY orders_status_idx
ON orders (status);
```

`CREATE INDEX CONCURRENTLY` non puo essere eseguito dentro una transazione esplicita.

## Eliminare

```sql
DROP INDEX CONCURRENTLY orders_status_idx;
```

## EXPLAIN

```sql
EXPLAIN
SELECT *
FROM orders
WHERE user_id = 42;
```

## Eseguire e misurare

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM orders
WHERE user_id = 42;
```

`ANALYZE` esegue realmente la query. Usarlo con cautela su modifiche dati.

## Indici presenti

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders';
```

## Statistiche utilizzo

```sql
SELECT
    relname,
    indexrelname,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## Aggiornare statistiche

```sql
ANALYZE orders;
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Tipi di Indici]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Slow query log]]
