---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - fdw
aliases: []
prerequisites: []
related: []
---

# FDW

## Sintesi

I **Foreign Data Wrapper** permettono a PostgreSQL di accedere a dati esterni come se fossero tabelle, per esempio un altro database PostgreSQL.

## Quando usarlo

Usali per integrazione, query federate, migrazioni progressive, accesso read-only a dati esterni o collegamento temporaneo tra database.

## Come funziona

Un FDW definisce server esterno, user mapping e foreign table. PostgreSQL invia parte della query al server remoto quando possibile.

## API / Sintassi

```sql
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER remote_db
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'remote', dbname 'app_db', port '5432');

CREATE USER MAPPING FOR app_user
SERVER remote_db
OPTIONS (user 'remote_user', password 'secret');
```

Foreign table:

```sql
CREATE FOREIGN TABLE remote_users (
  id bigint,
  email text
)
SERVER remote_db
OPTIONS (schema_name 'public', table_name 'users');
```

## Esempio pratico

```sql
SELECT *
FROM remote_users
WHERE email LIKE 'a%';
```

Controlla con `EXPLAIN` quanto viene spinto al server remoto.

## Varianti

- `postgres_fdw`.
- FDW per file.
- FDW per altri database.
- Import schema remoto.
- Foreign table read-only o writable.

## Errori comuni

- Usare FDW per carichi ad alta latenza senza misurare.
- Non proteggere credenziali remote.
- Aspettarsi pushdown completo di ogni query.
- Fare join pesanti tra locale e remoto.
- Non gestire permessi separati.

## Checklist

- La latenza remota e accettabile?
- Le credenziali sono protette?
- `EXPLAIN` mostra pushdown utile?
- I permessi sono minimi?
- Serve davvero federazione invece di replica/import?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
