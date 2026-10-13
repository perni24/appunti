---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - postgresql
  - promemoria
  - aggregazioni
  - group-by
aliases:
  - Cheatsheet aggregazioni PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY]]"
title: PostgreSQL - Aggregazioni
---

# PostgreSQL - Aggregazioni

## Funzioni principali

```sql
SELECT
    COUNT(*) AS total_rows,
    COUNT(email) AS non_null_emails,
    COUNT(DISTINCT user_id) AS unique_users,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_amount,
    MIN(amount) AS minimum_amount,
    MAX(amount) AS maximum_amount
FROM orders;
```

`COUNT(column)` ignora i valori `NULL`; `COUNT(*)` conta le righe.

## GROUP BY

```sql
SELECT
    status,
    COUNT(*) AS total
FROM orders
GROUP BY status
ORDER BY total DESC;
```

## HAVING

```sql
SELECT
    user_id,
    SUM(amount) AS total
FROM orders
GROUP BY user_id
HAVING SUM(amount) >= 100;
```

`WHERE` filtra prima dell'aggregazione; `HAVING` dopo.

## FILTER

```sql
SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'open') AS open_count,
    COUNT(*) FILTER (WHERE status = 'closed') AS closed_count
FROM orders;
```

## String e array aggregate

```sql
SELECT
    user_id,
    string_agg(tag, ', ' ORDER BY tag) AS tags,
    array_agg(order_id ORDER BY created_at) AS order_ids
FROM user_tags
GROUP BY user_id;
```

## JSON aggregate

```sql
SELECT
    user_id,
    jsonb_agg(
        jsonb_build_object(
            'id', id,
            'amount', amount
        )
        ORDER BY created_at
    ) AS orders
FROM orders
GROUP BY user_id;
```

## GROUPING SETS

```sql
SELECT region, status, SUM(amount)
FROM orders
GROUP BY GROUPING SETS (
    (region, status),
    (region),
    ()
);
```

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/PostgreSQL/Pagine/Window Functions|Window Functions]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
