---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [postgresql, promemoria, select, query]
aliases: [Cheatsheet SELECT PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE]]"
  - "[[Programmazione/Postgres/Pagine/Prepared statements]]"
---

# PostgreSQL - SELECT e filtri

## SELECT

```sql
SELECT id, name, created_at
FROM public.entities;
```

## Alias

```sql
SELECT
    e.id,
    e.name AS entity_name
FROM public.entities AS e;
```

## Filtri

```sql
SELECT *
FROM entities
WHERE active = TRUE
  AND score >= 60
  AND deleted_at IS NULL;
```

## Operatori

```sql
WHERE id = 10
WHERE id <> 10
WHERE score BETWEEN 60 AND 100
WHERE status IN ('active', 'pending')
WHERE name LIKE 'Ada%'
WHERE name ILIKE '%ada%'
WHERE deleted_at IS NULL
WHERE deleted_at IS NOT NULL
```

## Ordinamento

```sql
SELECT *
FROM entities
ORDER BY created_at DESC, id ASC;
```

```sql
ORDER BY priority DESC NULLS LAST;
```

## Limit e offset

```sql
SELECT *
FROM entities
ORDER BY id
LIMIT 20
OFFSET 40;
```

Per dataset grandi preferire la paginazione keyset:

```sql
SELECT *
FROM entities
WHERE id > $1
ORDER BY id
LIMIT 20;
```

## Distinct

```sql
SELECT DISTINCT status
FROM entities;
```

```sql
SELECT DISTINCT ON (user_id)
    user_id,
    created_at,
    status
FROM events
ORDER BY user_id, created_at DESC;
```

Con `DISTINCT ON`, le espressioni iniziali di `ORDER BY` devono corrispondere.

## CASE

```sql
SELECT
    id,
    CASE
        WHEN score >= 90 THEN 'high'
        WHEN score >= 60 THEN 'medium'
        ELSE 'low'
    END AS level
FROM entities;
```

## Parametri

```sql
SELECT *
FROM entities
WHERE id = $1;
```

Passare i valori tramite parametri del driver, senza concatenare input nella query.

## Ordine delle clausole

```sql
SELECT
FROM
JOIN
WHERE
GROUP BY
HAVING
ORDER BY
LIMIT
OFFSET
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE]]
- [[Programmazione/Postgres/Pagine/Prepared statements]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato]]
