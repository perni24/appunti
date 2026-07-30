---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, transazioni, lock]
aliases: [Cheatsheet transazioni PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni]]"
  - "[[Programmazione/Postgres/Pagine/Meccanismi di Locking]]"
---

# PostgreSQL - Transazioni e lock

## Transazione

```sql
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

## Annullare

```sql
ROLLBACK;
```

## Savepoint

```sql
BEGIN;

SAVEPOINT before_optional_step;

UPDATE entities
SET status = 'processed'
WHERE id = 1;

ROLLBACK TO SAVEPOINT before_optional_step;

COMMIT;
```

## Livello di isolamento

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
```

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

| Livello | Uso |
|---|---|
| `READ COMMITTED` | Predefinito |
| `REPEATABLE READ` | Snapshot stabile nella transazione |
| `SERIALIZABLE` | Massima protezione, richiede retry |

## Lock di riga

```sql
SELECT *
FROM jobs
WHERE id = $1
FOR UPDATE;
```

```sql
SELECT *
FROM jobs
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

## Varianti

```sql
FOR NO KEY UPDATE
FOR SHARE
FOR KEY SHARE
NOWAIT
SKIP LOCKED
```

## Lock esplicito della tabella

```sql
LOCK TABLE entities IN SHARE MODE;
```

Usarlo soltanto quando il lock di riga non e sufficiente.

## Transazioni attive

```sql
SELECT
    pid,
    state,
    xact_start,
    wait_event_type,
    wait_event,
    query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL;
```

## Lock non concessi

```sql
SELECT *
FROM pg_locks
WHERE granted = FALSE;
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Proprietà ACID]]
- [[Programmazione/Postgres/Pagine/MVCC]]
- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Lock monitoring]]
- [[Programmazione/Postgres/Pagine/Code e job table]]
