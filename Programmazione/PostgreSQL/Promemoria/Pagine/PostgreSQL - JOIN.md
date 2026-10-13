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
  - join
aliases:
  - Cheatsheet JOIN PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/JOIN]]"
  - "[[Programmazione/PostgreSQL/Pagine/LATERAL JOIN]]"
title: PostgreSQL - JOIN
---

# PostgreSQL - JOIN

## INNER JOIN

```sql
SELECT
    o.id,
    u.name
FROM orders AS o
JOIN users AS u
    ON u.id = o.user_id;
```

Restituisce soltanto le righe che trovano corrispondenza.

## LEFT JOIN

```sql
SELECT
    u.id,
    COUNT(o.id) AS order_count
FROM users AS u
LEFT JOIN orders AS o
    ON o.user_id = u.id
GROUP BY u.id;
```

Mantiene tutte le righe della tabella sinistra.

## Filtro nella clausola ON

```sql
SELECT u.id, o.id
FROM users AS u
LEFT JOIN orders AS o
    ON o.user_id = u.id
   AND o.status = 'open';
```

Spostare `o.status = 'open'` in `WHERE` eliminerebbe le righe senza ordine.

## RIGHT e FULL JOIN

```sql
SELECT *
FROM left_table AS l
RIGHT JOIN right_table AS r ON r.id = l.id;
```

```sql
SELECT *
FROM left_table AS l
FULL JOIN right_table AS r ON r.id = l.id;
```

## CROSS JOIN

```sql
SELECT color.name, size.name
FROM colors AS color
CROSS JOIN sizes AS size;
```

## Self join

```sql
SELECT
    employee.name,
    manager.name AS manager_name
FROM employees AS employee
LEFT JOIN employees AS manager
    ON manager.id = employee.manager_id;
```

## Anti join

```sql
SELECT u.*
FROM users AS u
WHERE NOT EXISTS (
    SELECT 1
    FROM orders AS o
    WHERE o.user_id = u.id
);
```

## LATERAL

```sql
SELECT u.id, latest.id AS latest_order_id
FROM users AS u
LEFT JOIN LATERAL (
    SELECT o.id
    FROM orders AS o
    WHERE o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 1
) AS latest ON TRUE;
```

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1 a 1 1 a N e N a N]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
