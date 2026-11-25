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

Usa il tipo per esprimere il dato e il cast per convertirlo. I blocchi sono indipendenti; quello sugli identificatori va eseguito in una sessione di prova senza transazione aperta.

## Scegliere il tipo

| Ti serve | Tipo |
|---|---|
| Contare unità intere | `smallint`, `integer`, `bigint` secondo l'intervallo |
| Importo decimale esatto | `numeric(p,s)`: precisione totale e scala |
| Misura approssimata | `real`, `double precision`: virgola mobile |
| Testo o stato logico | `text`, `varchar(n)` per un limite in caratteri, `char(n)` a lunghezza fissa; `boolean` per vero/falso |
| Giorno, ora, istante o intervallo | `date`, `time`, `timestamp` (ora civile), `timestamptz` (istante), `interval` |
| Identificatore, documento, binario, rete | `uuid`, `jsonb`, `bytea`, `inet` o `cidr` |

## Convertire e controllare il tipo

```sql
SELECT '42'::integer, CAST('42' AS integer), 12.345::numeric(5,2),
       timestamp '2026-07-30 12:30'::date, pg_typeof(42::bigint);
```

Risultati: `42` in entrambe le sintassi, `12.35`, il 30 luglio, `bigint`. Un testo non numerico non diventa NULL: il cast a intero genera un errore.

## Trattare NULL, stringa vuota e false

```sql
SELECT coalesce('', 'anon') AS empty_kept,
       coalesce(nullif('', ''), 'anon') AS fallback,
       NULL::int = NULL::int AS ordinary,
       NULL::int IS NOT DISTINCT FROM NULL::int AS same,
       NULL::int IS DISTINCT FROM 0 AS different;
```

Risultati: stringa vuota, `anon`, NULL, vero, vero. Per cercare assenza o presenza usa `IS NULL` o `IS NOT NULL`, non `= NULL`.

```sql
SELECT flag, flag IS TRUE AS yes, flag IS FALSE AS no,
       flag IS NOT TRUE AS false_or_unknown
FROM (VALUES (true), (false), (NULL::boolean)) AS v(flag)
ORDER BY flag DESC NULLS LAST;
```

`WHERE flag IS NOT TRUE` include sia false sia NULL; `WHERE flag IS FALSE` solo false.

## Generare due identificatori

```sql
BEGIN;
CREATE TEMP TABLE lab_ids (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()
);
INSERT INTO pg_temp.lab_ids DEFAULT VALUES
RETURNING id, pg_typeof(public_id), public_id IS NOT NULL AS generated;
ROLLBACK;
```

Su questa tabella nuova: `1, uuid, true`. Identity e default generano i valori; `PRIMARY KEY` e `UNIQUE` ne impongono l'unicità.

## Approfondimento

- [PostgreSQL 18: tipi di dato](https://www.postgresql.org/docs/18/datatype.html) e [confronti con NULL](https://www.postgresql.org/docs/18/functions-comparison.html).

- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]
