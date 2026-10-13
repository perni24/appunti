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
  - tipi
  - cast
  - null
aliases:
  - Cheatsheet tipi PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Tipi di Dato]]"
  - "[[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali]]"
title: PostgreSQL - Tipi, cast e NULL
---

# PostgreSQL - Tipi, cast e NULL

## Tipi comuni

| Categoria | Tipi |
|---|---|
| Interi | `smallint`, `integer`, `bigint` |
| Decimali | `numeric(p,s)`, `real`, `double precision` |
| Testo | `text`, `varchar(n)`, `char(n)` |
| Booleano | `boolean` |
| Data e ora | `date`, `time`, `timestamp`, `timestamptz`, `interval` |
| Identificatore | `uuid` |
| Documento | `jsonb` |
| Binario | `bytea` |
| Rete | `inet`, `cidr` |

## Cast

```sql
SELECT '42'::integer;
SELECT CAST('42' AS integer);
SELECT created_at::date;
SELECT amount::numeric(10, 2);
```

## Generare identificatori

```sql
CREATE TABLE entities (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id uuid NOT NULL DEFAULT gen_random_uuid()
);
```

## NULL

```sql
WHERE value IS NULL
WHERE value IS NOT NULL
```

```sql
SELECT COALESCE(display_name, username, 'anonymous');
```

```sql
SELECT NULLIF(value, '');
```

## Confronto NULL-safe

```sql
WHERE left_value IS DISTINCT FROM right_value
```

```sql
WHERE left_value IS NOT DISTINCT FROM right_value
```

## Tipo di un'espressione

```sql
SELECT pg_typeof(expression);
```

## Valori booleani

```sql
WHERE active IS TRUE
WHERE active IS FALSE
WHERE active IS NOT TRUE
```

## Approfondimento

- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
