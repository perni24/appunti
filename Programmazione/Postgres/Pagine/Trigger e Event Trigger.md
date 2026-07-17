---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Trigger e Event Trigger]
prerequisites: []
related: []
---

# Trigger e Event Trigger

## Sintesi

I trigger eseguono funzioni automaticamente quando avvengono `INSERT`, `UPDATE`, `DELETE` o `TRUNCATE`. Gli event trigger reagiscono a eventi DDL come `CREATE TABLE` o `ALTER TABLE`.

## Quando usarlo

Usali per audit, timestamp automatici, validazioni complesse, sincronizzazione interna o controllo di DDL.

## Come funziona

Un trigger e collegato a una tabella e chiama una funzione trigger. Puo essere `BEFORE`, `AFTER` o `INSTEAD OF`, per riga o per statement.

## API / Sintassi

Funzione trigger:

```sql
CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

Trigger:

```sql
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

## Esempio pratico

Audit minimale:

```sql
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text,
  operation text,
  changed_at timestamptz DEFAULT now()
);
```

Un trigger `AFTER INSERT OR UPDATE OR DELETE` puo scrivere su questa tabella.

## Varianti

- `BEFORE` trigger.
- `AFTER` trigger.
- `INSTEAD OF` trigger su view.
- Row-level trigger.
- Statement-level trigger.
- Event trigger per DDL.

## Errori comuni

- Nascondere troppa logica nei trigger.
- Creare trigger ricorsivi involontari.
- Ignorare costo su scritture massive.
- Non documentare effetti collaterali.
- Usare trigger dove basta un vincolo.

## Checklist

- Il trigger e davvero necessario?
- La funzione e breve e testabile?
- Esistono test per insert/update/delete?
- Il costo su batch e accettabile?
- Gli effetti collaterali sono documentati?

## Collegamenti

- [[Programmazione/Postgres/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]
- [[Programmazione/Postgres/Pagine/Audit logging|Audit logging]]
