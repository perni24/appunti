---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, window-functions]
aliases: [Cheatsheet window functions PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Window Functions]]"
---

# PostgreSQL - Window functions

## Numerare righe

```sql
SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY created_at DESC
    ) AS row_number
FROM orders;
```

## Ranking

```sql
SELECT
    name,
    score,
    RANK() OVER (ORDER BY score DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY score DESC) AS dense_rank
FROM users;
```

| Funzione | Parita |
|---|---|
| `ROW_NUMBER()` | Numeri sempre diversi |
| `RANK()` | Lascia salti dopo i pari merito |
| `DENSE_RANK()` | Non lascia salti |

## Totale per gruppo

```sql
SELECT
    id,
    user_id,
    amount,
    SUM(amount) OVER (PARTITION BY user_id) AS user_total
FROM orders;
```

## Totale progressivo

```sql
SELECT
    created_at,
    amount,
    SUM(amount) OVER (
        ORDER BY created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total
FROM orders;
```

## Riga precedente e successiva

```sql
SELECT
    created_at,
    value,
    LAG(value) OVER (ORDER BY created_at) AS previous_value,
    LEAD(value) OVER (ORDER BY created_at) AS next_value
FROM measurements;
```

## Primo e ultimo valore

```sql
SELECT
    user_id,
    FIRST_VALUE(status) OVER w AS first_status,
    LAST_VALUE(status) OVER w AS last_status
FROM events
WINDOW w AS (
    PARTITION BY user_id
    ORDER BY created_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
);
```

## Ultima riga per gruppo

```sql
WITH ranked AS (
    SELECT
        orders.*,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY created_at DESC
        ) AS position
    FROM orders
)
SELECT *
FROM ranked
WHERE position = 1;
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Window Functions]]
- [[Programmazione/Postgres/Pagine/Aggregazioni e GROUP BY]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query]]
