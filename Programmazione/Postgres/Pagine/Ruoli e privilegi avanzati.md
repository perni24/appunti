---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sicurezza
  - ruoli
aliases: []
prerequisites: []
related: []
---

# Ruoli e privilegi avanzati

## Sintesi

I privilegi avanzati riguardano ownership, membership, default privileges, `SECURITY DEFINER` e separazione tra ruoli umani, applicativi e tecnici. Servono a ridurre privilegi eccessivi senza bloccare il lavoro.

## Quando usarlo

Usa questa nota quando la gestione base dei ruoli non basta:

- vuoi separare owner e runtime user;
- devi configurare permessi per oggetti futuri;
- usi funzioni `SECURITY DEFINER`;
- hai piu team o applicazioni nello stesso database;
- devi revocare privilegi da `PUBLIC`;
- devi evitare che l'applicazione possieda lo schema.

## Come funziona

L'owner di un oggetto ha poteri speciali su quell'oggetto. Per questo e spesso utile creare un ruolo owner senza login e assegnare all'applicazione solo i privilegi necessari.

I default privileges definiscono permessi applicati automaticamente ai nuovi oggetti creati da un certo ruolo in uno schema.

`SECURITY DEFINER` esegue una funzione con i privilegi del proprietario della funzione. E potente, ma richiede attenzione a `search_path` e input.

## API / Sintassi

Owner tecnico:

```sql
CREATE ROLE app_owner NOLOGIN;
CREATE ROLE app_runtime LOGIN PASSWORD 'change_me';
```

Schema posseduto dall'owner:

```sql
CREATE SCHEMA app AUTHORIZATION app_owner;
GRANT USAGE ON SCHEMA app TO app_runtime;
```

Default privileges:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

Revoca da `PUBLIC`:

```sql
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

## Esempio pratico

Funzione controllata con `SECURITY DEFINER`:

```sql
CREATE FUNCTION app.cancel_order(order_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
BEGIN
  UPDATE app.orders
  SET status = 'cancelled'
  WHERE id = order_id
    AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION app.cancel_order(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.cancel_order(bigint) TO app_runtime;
```

La funzione espone una singola operazione invece di concedere privilegi generici troppo ampi.

## Varianti

- Ruolo owner `NOLOGIN`.
- Ruolo runtime con privilegi minimi.
- Ruoli read-only e read-write.
- Default privileges per tabelle, sequenze e funzioni.
- `SECURITY DEFINER` per operazioni controllate.
- `SET ROLE` per assumere temporaneamente un ruolo.

## Errori comuni

- Usare l'owner dello schema come utente applicativo.
- Concedere `SUPERUSER` senza necessita.
- Dimenticare privilegi sulle sequenze.
- Configurare default privileges sul ruolo sbagliato.
- Usare `SECURITY DEFINER` senza fissare `search_path`.
- Lasciare funzioni sensibili eseguibili da `PUBLIC`.

## Checklist

- Owner e runtime user sono separati?
- I default privileges sono impostati dal ruolo che crea gli oggetti?
- I privilegi su sequenze e funzioni sono inclusi?
- `PUBLIC` ha privilegi solo se intenzionali?
- Le funzioni `SECURITY DEFINER` impostano `search_path`?
- Le grant sono documentate per ruolo e scopo?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/Postgres/Pagine/Audit logging|Audit logging]]
