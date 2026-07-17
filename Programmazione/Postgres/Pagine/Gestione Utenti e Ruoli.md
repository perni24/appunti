---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Gestione Utenti e Ruoli]
prerequisites: []
related: []
---

# Gestione Utenti e Ruoli in PostgreSQL

## Sintesi

In PostgreSQL utenti e gruppi sono entrambi **ruoli**. Un ruolo con `LOGIN` puo connettersi; un ruolo senza `LOGIN` viene spesso usato come gruppo per aggregare permessi.

## Quando usarlo

Usa questa nota quando devi creare accessi o separare privilegi:

- utente applicativo;
- utente read-only;
- ruolo per migrazioni;
- ruoli umani per amministrazione;
- gruppi di permessi;
- revoca di privilegi troppo ampi.

## Come funziona

I ruoli sono globali nel cluster PostgreSQL. I privilegi sugli oggetti sono invece legati a database, schema, tabelle, sequenze, funzioni e altri oggetti.

Una buona configurazione separa:

- owner degli oggetti;
- ruolo runtime dell'applicazione;
- ruoli di lettura;
- ruoli per migrazioni;
- ruoli amministrativi.

Il principio guida e il least privilege: ogni ruolo deve avere solo i permessi necessari.

## API / Sintassi

Creare un ruolo utente:

```sql
CREATE ROLE app_user
WITH LOGIN PASSWORD 'change_me';
```

Creare un ruolo gruppo:

```sql
CREATE ROLE app_readonly;
```

Assegnare membership:

```sql
GRANT app_readonly TO analyst_user;
```

Permessi su schema e tabelle:

```sql
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
```

Revoca:

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

## Esempio pratico

Ruolo applicativo con lettura e scrittura limitata:

```sql
CREATE ROLE app_runtime WITH LOGIN PASSWORD 'change_me';

GRANT CONNECT ON DATABASE app_db TO app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

Default privileges per nuove tabelle:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

## Varianti

- `LOGIN`: ruolo che puo autenticarsi.
- `NOLOGIN`: ruolo gruppo o owner tecnico.
- `SUPERUSER`: bypassa quasi tutti i controlli, da evitare per applicazioni.
- `CREATEDB`: puo creare database.
- `CREATEROLE`: puo gestire altri ruoli.
- `REPLICATION`: usato per replica fisica.
- Role membership: assegna permessi tramite gruppi.

## Errori comuni

- Usare `postgres` o un owner come utente applicativo.
- Dare `SUPERUSER` per risolvere problemi di permessi.
- Dimenticare `USAGE` sulle sequenze.
- Dimenticare `USAGE` sullo schema.
- Lasciare `CREATE` sullo schema `public` a `PUBLIC`.
- Assegnare permessi a singoli utenti invece che a ruoli gruppo.

## Checklist

- L'applicazione usa un ruolo non owner?
- I permessi sono assegnati tramite gruppi?
- `PUBLIC` ha solo privilegi intenzionali?
- Le sequenze hanno privilegi corretti?
- I nuovi oggetti ricevono default privileges coerenti?
- Nessun ruolo applicativo e `SUPERUSER`?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/Postgres/Pagine/Secret management|Secret management]]
