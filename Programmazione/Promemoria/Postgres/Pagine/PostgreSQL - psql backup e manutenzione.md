---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, psql, backup, manutenzione]
aliases: [Cheatsheet psql PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Comandi psql e Meta-comandi]]"
  - "[[Programmazione/Postgres/Pagine/Backup e Ripristino]]"
  - "[[Programmazione/Postgres/Pagine/Manutenzione]]"
---

# PostgreSQL - psql, backup e manutenzione

## Connessione

```powershell
psql -h localhost -p 5432 -U app_user -d app_db
```

```powershell
psql "postgresql://app_user@localhost:5432/app_db"
```

Non inserire password nella connection string salvata nella cronologia della shell.

## Meta-comandi psql

| Comando | Uso |
|---|---|
| `\l` | Elenca database |
| `\c database` | Cambia database |
| `\dn` | Elenca schemi |
| `\dt schema.*` | Elenca tabelle |
| `\d schema.table` | Descrive tabella |
| `\di schema.*` | Elenca indici |
| `\du` | Elenca ruoli |
| `\x` | Output espanso |
| `\timing` | Mostra durata query |
| `\q` | Esce |

## Eseguire un file SQL

```powershell
psql -d app_db -f schema.sql
```

Da psql:

```text
\i schema.sql
```

## Esportare una query CSV

```text
\copy (SELECT * FROM app.users) TO 'users.csv' CSV HEADER
```

## Backup custom

```powershell
pg_dump -Fc -d app_db -f app_db.dump
```

## Ripristino custom

```powershell
pg_restore -d restored_db --clean --if-exists --no-owner app_db.dump
```

Creare prima il database di destinazione e verificare il ripristino in un ambiente isolato.

## Backup SQL

```powershell
pg_dump -d app_db -f app_db.sql
```

## Ripristino SQL

```powershell
psql -d restored_db -f app_db.sql
```

## Ruoli globali

```powershell
pg_dumpall --globals-only -f globals.sql
```

## VACUUM e ANALYZE

```sql
VACUUM (ANALYZE) app.orders;
```

```sql
ANALYZE app.orders;
```

`VACUUM FULL` riscrive la tabella e richiede un lock esclusivo:

```sql
VACUUM FULL app.orders;
```

## Dimensioni

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

```sql
SELECT pg_size_pretty(pg_total_relation_size('app.orders'));
```

## Connessioni

```sql
SELECT
    datname,
    usename,
    state,
    COUNT(*)
FROM pg_stat_activity
GROUP BY datname, usename, state
ORDER BY datname, usename, state;
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Comandi psql e Meta-comandi]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Manutenzione]]
- [[Programmazione/Postgres/Pagine/Metriche e alerting]]
- [[Programmazione/Postgres/Pagine/Slow query log]]
- [[Programmazione/Postgres/Pagine/Driver e connection string]]
