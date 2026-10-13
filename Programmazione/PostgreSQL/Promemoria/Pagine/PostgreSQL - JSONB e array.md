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
  - jsonb
  - array
aliases:
  - Cheatsheet JSONB PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Dato]]"
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Indici]]"
title: PostgreSQL - JSONB e array
---

# PostgreSQL - JSONB e array

## Creare JSONB

```sql
SELECT jsonb_build_object(
    'id', id,
    'name', name
)
FROM users;
```

```sql
SELECT jsonb_build_array('a', 'b', 'c');
SELECT to_jsonb(u) FROM users AS u;
```

## Leggere campi

```sql
SELECT metadata -> 'address' FROM users;
SELECT metadata ->> 'name' FROM users;
SELECT metadata #> '{address,city}' FROM users;
SELECT metadata #>> '{address,city}' FROM users;
```

`->` restituisce JSONB; `->>` restituisce testo.

## Filtrare

```sql
WHERE metadata @> '{"active": true}'::jsonb
WHERE metadata ? 'email'
WHERE metadata ?| ARRAY['email', 'phone']
WHERE metadata ?& ARRAY['email', 'phone']
```

## Modificare JSONB

```sql
SELECT metadata || '{"active": true}'::jsonb;
```

```sql
SELECT jsonb_set(
    metadata,
    '{address,city}',
    '"Roma"'::jsonb,
    TRUE
);
```

```sql
SELECT metadata - 'temporary';
SELECT metadata #- '{address,temporary}';
```

## Espandere

```sql
SELECT item
FROM jsonb_array_elements(metadata -> 'items') AS item;
```

```sql
SELECT key, value
FROM jsonb_each(metadata);
```

## Aggregare

```sql
SELECT jsonb_agg(to_jsonb(u) ORDER BY u.id)
FROM users AS u;
```

## Array

```sql
SELECT ARRAY[1, 2, 3];
SELECT ARRAY['a', 'b']::text[];
```

```sql
SELECT tags[1];
SELECT array_length(tags, 1);
SELECT array_append(tags, 'new');
SELECT array_remove(tags, 'old');
```

Gli indici degli array PostgreSQL partono normalmente da `1`.

## Filtrare array

```sql
WHERE 'admin' = ANY(roles)
WHERE roles @> ARRAY['admin']
WHERE roles && ARRAY['admin', 'editor']
```

## Espandere array

```sql
SELECT unnest(tags)
FROM entities;
```

## Indice GIN

```sql
CREATE INDEX entities_metadata_gin_idx
ON entities
USING gin (metadata);
```

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
