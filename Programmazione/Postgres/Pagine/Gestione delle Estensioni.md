---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Gestione delle Estensioni]
prerequisites: []
related: []
---

# Gestione delle Estensioni

## Sintesi

Le estensioni aggiungono funzionalita a PostgreSQL: tipi, funzioni, indici, linguaggi, strumenti di monitoraggio e moduli applicativi.

## Quando usarlo

Usale quando una funzionalita e disponibile come estensione stabile invece di implementarla manualmente.

## Come funziona

Un'estensione viene installata a livello server e abilitata in un database con `CREATE EXTENSION`. Alcune richiedono librerie presenti sul sistema operativo.

## API / Sintassi

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP EXTENSION pgcrypto;
```

Lista:

```sql
SELECT * FROM pg_available_extensions;
SELECT * FROM pg_extension;
```

## Esempio pratico

Abilitare `pgcrypto`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT gen_random_uuid();
```

## Varianti

- Estensioni core distribuite con PostgreSQL.
- Estensioni di terze parti.
- Estensioni per tipi dati.
- Estensioni per osservabilita.
- Estensioni per linguaggi procedurali.

## Errori comuni

- Abilitare estensioni non necessarie.
- Non versionare `CREATE EXTENSION` nelle migrazioni.
- Usare estensioni non disponibili in produzione.
- Ignorare privilegi richiesti.
- Non valutare sicurezza di estensioni terze.

## Checklist

- L'estensione e disponibile in tutti gli ambienti?
- E versionata in migrazione?
- I privilegi sono adeguati?
- La dipendenza e documentata?
- L'estensione e mantenuta e affidabile?

## Collegamenti

- [[Programmazione/Postgres/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/Postgres/Pagine/Full Text Search|Full Text Search]]
