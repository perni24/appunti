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
  - insert
  - update
  - delete
  - upsert
aliases:
  - Cheatsheet modifica dati PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE]]"
  - "[[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT]]"
  - "[[Programmazione/PostgreSQL/Pagine/RETURNING]]"
title: PostgreSQL - INSERT, UPDATE, DELETE e UPSERT
---

# PostgreSQL - INSERT, UPDATE, DELETE e UPSERT

## INSERT

```sql
INSERT INTO entities (name, active)
VALUES ('Example', TRUE);
```

## Piu righe

```sql
INSERT INTO entities (name, active)
VALUES
    ('First', TRUE),
    ('Second', FALSE);
```

## RETURNING

```sql
INSERT INTO entities (name)
VALUES ($1)
RETURNING id, name, created_at;
```

## UPDATE

```sql
UPDATE entities
SET
    name = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
```

## UPDATE da un'altra tabella

```sql
UPDATE orders AS o
SET status = s.status
FROM order_status_updates AS s
WHERE s.order_id = o.id;
```

## DELETE

```sql
DELETE FROM entities
WHERE id = $1
RETURNING id;
```

## DELETE con USING

```sql
DELETE FROM sessions AS s
USING users AS u
WHERE s.user_id = u.id
  AND u.disabled = TRUE;
```

## UPSERT

```sql
INSERT INTO entities (external_id, name)
VALUES ($1, $2)
ON CONFLICT (external_id)
DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;
```

Serve un vincolo o indice univoco compatibile con il conflitto.

## Ignorare il conflitto

```sql
INSERT INTO tags (name)
VALUES ($1)
ON CONFLICT (name) DO NOTHING;
```

## Inserire da SELECT

```sql
INSERT INTO archived_entities (id, name)
SELECT id, name
FROM entities
WHERE deleted_at IS NOT NULL;
```

## Modifica protetta

Prima di `UPDATE` o `DELETE`, verificare il filtro:

```sql
SELECT *
FROM entities
WHERE id = $1;
```

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT INSERT UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Prepared statements|Prepared statements]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
