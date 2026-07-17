---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Schemi e Search Path]
prerequisites: []
related: []
---

# Schemi e Search Path

## Sintesi

Gli schemi organizzano oggetti dentro un database. `search_path` decide in quali schemi PostgreSQL cerca nomi non qualificati come `orders` invece di `app.orders`.

## Quando usarlo

Serve per separare moduli, tenant, estensioni, oggetti applicativi, permessi e funzioni `SECURITY DEFINER`.

## Come funziona

Un database contiene piu schemi. Se una query usa un nome non qualificato, PostgreSQL cerca negli schemi elencati in `search_path`. Questo e comodo, ma puo creare ambiguita e rischi di sicurezza.

## API / Sintassi

```sql
CREATE SCHEMA app;
CREATE TABLE app.orders (id bigint PRIMARY KEY);

SHOW search_path;
SET search_path = app, public;
```

Permessi:

```sql
GRANT USAGE ON SCHEMA app TO app_runtime;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

## Esempio pratico

Query qualificata:

```sql
SELECT * FROM app.orders;
```

Funzione sicura:

```sql
CREATE FUNCTION app.safe_fn()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$ BEGIN END; $$;
```

## Varianti

- Schema `public`.
- Schemi per moduli applicativi.
- Schemi per estensioni.
- Schemi per tenant.
- `search_path` per ruolo.
- Nomi completamente qualificati.

## Errori comuni

- Affidarsi a `search_path` implicito in funzioni sensibili.
- Lasciare `CREATE` su `public` a tutti.
- Creare oggetti con stesso nome in schemi diversi.
- Non concedere `USAGE` sullo schema.
- Confondere database e schema.

## Checklist

- Gli oggetti applicativi stanno in uno schema dedicato?
- `public` e limitato?
- Le funzioni `SECURITY DEFINER` fissano `search_path`?
- Le query critiche usano nomi qualificati?
- I privilegi schema sono espliciti?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
