---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [postgresql, promemoria, ruoli, privilegi, rls]
aliases: [Cheatsheet sicurezza PostgreSQL]
prerequisites: []
related:
  - "[[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli]]"
  - "[[Programmazione/Postgres/Pagine/Row Level Security]]"
---

# PostgreSQL - Ruoli, privilegi e RLS

## Creare ruoli

```sql
CREATE ROLE app_owner NOLOGIN;
CREATE ROLE app_user LOGIN;
CREATE ROLE app_readonly LOGIN;
```

Impostare le password tramite un canale amministrativo sicuro, senza salvarle negli script versionati.

## Assegnare appartenenza

```sql
GRANT app_owner TO migration_user;
```

## Database e schema

```sql
GRANT CONNECT ON DATABASE app_db TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
```

## Tabelle e sequenze

```sql
GRANT SELECT, INSERT, UPDATE, DELETE
ON ALL TABLES IN SCHEMA app
TO app_user;
```

```sql
GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA app
TO app_user;
```

## Privilegi predefiniti

Eseguire come ruolo che creera i nuovi oggetti:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA app
GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

## Revocare

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON TABLE app.secrets FROM app_user;
```

## Cambiare ruolo

```sql
SET ROLE app_owner;
RESET ROLE;
```

## RLS

```sql
ALTER TABLE app.documents ENABLE ROW LEVEL SECURITY;
```

```sql
CREATE POLICY documents_by_owner
ON app.documents
USING (
    owner_id = current_setting('app.user_id')::bigint
)
WITH CHECK (
    owner_id = current_setting('app.user_id')::bigint
);
```

```sql
BEGIN;
SET LOCAL app.user_id = '42';
SELECT * FROM app.documents;
COMMIT;
```

Eseguire sulla stessa connessione; in caso di errore fare `ROLLBACK`. Il backend imposta l'ID autenticato a ogni transazione: un setting modificabile dal client non e una prova di identita.

Il ruolo proprietario normalmente bypassa RLS; `FORCE ROW LEVEL SECURITY` puo assoggettarlo alle policy, ma non limita superuser o ruoli `BYPASSRLS`. Verificare con il ruolo dell'applicazione. Dettagli in [[Programmazione/Postgres/Pagine/Row Level Security]].

## Privilegi di una tabella

```sql
SELECT *
FROM information_schema.role_table_grants
WHERE table_schema = 'app'
  AND table_name = 'documents';
```

## Approfondimento

- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Row Level Security]]
- [[Programmazione/Postgres/Pagine/Schemi e Search Path]]
- [[Programmazione/Postgres/Pagine/Secret management]]
- [[Programmazione/Postgres/Pagine/SSL e TLS]]
