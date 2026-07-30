---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, ddl, schemi, vincoli]
aliases: [Cheatsheet DDL PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Schemi e Search Path]]"
  - "[[Programmazione/Postgres/Pagine/Vincoli]]"
---

# PostgreSQL - Tabelle, schemi e vincoli

## Schema

```sql
CREATE SCHEMA app;
```

```sql
SET search_path TO app, public;
```

Preferire nomi qualificati nel codice sensibile:

```sql
SELECT * FROM app.users;
```

## Tabella

```sql
CREATE TABLE app.users (
    id bigint GENERATED ALWAYS AS IDENTITY,
    email text NOT NULL,
    active boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pk PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_not_empty CHECK (email <> '')
);
```

## Foreign key

```sql
CREATE TABLE app.orders (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL,
    amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
    CONSTRAINT orders_user_fk
        FOREIGN KEY (user_id)
        REFERENCES app.users (id)
        ON DELETE RESTRICT
);
```

## Aggiungere una colonna

```sql
ALTER TABLE app.users
ADD COLUMN display_name text;
```

## Aggiungere un vincolo

```sql
ALTER TABLE app.users
ADD CONSTRAINT users_display_name_not_empty
CHECK (display_name IS NULL OR display_name <> '');
```

## Rinominare

```sql
ALTER TABLE app.users
RENAME COLUMN display_name TO full_name;
```

## Modificare tipo

```sql
ALTER TABLE app.users
ALTER COLUMN id TYPE bigint
USING id::bigint;
```

## Eliminare

```sql
ALTER TABLE app.users
DROP COLUMN full_name;
```

```sql
DROP TABLE app.users;
DROP SCHEMA app;
```

Evitare `CASCADE` senza aver verificato tutti gli oggetti dipendenti.

## Vincolo deferrable

```sql
CONSTRAINT relation_fk
    FOREIGN KEY (parent_id)
    REFERENCES parent (id)
    DEFERRABLE INITIALLY DEFERRED
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Schemi e Search Path]]
- [[Programmazione/Postgres/Pagine/Vincoli]]
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Relazioni 1 a 1 1 a N e N a N]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Normalizzazione]]
