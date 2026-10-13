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
  - cte
  - subquery
aliases:
  - Cheatsheet CTE PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries]]"
  - "[[Programmazione/PostgreSQL/Pagine/Subquery]]"
title: PostgreSQL - CTE, subquery e insiemi
---

# PostgreSQL - CTE, subquery e insiemi

## CTE

```sql
WITH active_users AS (
    SELECT id, name
    FROM users
    WHERE active = TRUE
)
SELECT *
FROM active_users
ORDER BY name;
```

## Piu CTE

```sql
WITH
active_users AS (
    SELECT id
    FROM users
    WHERE active = TRUE
),
totals AS (
    SELECT user_id, SUM(amount) AS total
    FROM orders
    GROUP BY user_id
)
SELECT u.id, t.total
FROM active_users AS u
JOIN totals AS t ON t.user_id = u.id;
```

## CTE di modifica

```sql
WITH deleted AS (
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    RETURNING user_id
)
SELECT COUNT(*) FROM deleted;
```

## CTE ricorsiva

```sql
WITH RECURSIVE tree AS (
    SELECT id, parent_id, name, 0 AS depth
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    SELECT c.id, c.parent_id, c.name, tree.depth + 1
    FROM categories AS c
    JOIN tree ON tree.id = c.parent_id
)
SELECT *
FROM tree
ORDER BY depth, name;
```

## Subquery scalare

```sql
SELECT
    u.id,
    (
        SELECT COUNT(*)
        FROM orders AS o
        WHERE o.user_id = u.id
    ) AS order_count
FROM users AS u;
```

## EXISTS

```sql
SELECT *
FROM users AS u
WHERE EXISTS (
    SELECT 1
    FROM orders AS o
    WHERE o.user_id = u.id
);
```

## Operazioni tra insiemi

```sql
SELECT email FROM customers
UNION
SELECT email FROM leads;
```

| Operatore | Effetto |
|---|---|
| `UNION` | Unisce eliminando duplicati |
| `UNION ALL` | Unisce mantenendo duplicati |
| `INTERSECT` | Righe presenti in entrambi |
| `EXCEPT` | Righe presenti solo a sinistra |

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/PostgreSQL/Pagine/Subquery|Subquery]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
