---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sicurezza
  - audit
aliases: []
prerequisites: []
related: []
---

# Audit logging

## Sintesi

L'audit logging registra chi ha fatto cosa, quando e su quali dati. Serve per sicurezza, debug, compliance e ricostruzione degli incidenti.

## Quando usarlo

Usalo per dati sensibili, azioni amministrative, modifiche critiche, accessi privilegiati e sistemi con requisiti di tracciabilita.

## Come funziona

Puoi fare audit a livello applicativo, tramite trigger, tramite log PostgreSQL o estensioni dedicate. La scelta dipende da dettaglio richiesto, volume e requisiti legali.

## API / Sintassi

Tabella audit semplice:

```sql
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor text,
  action text NOT NULL,
  table_name text NOT NULL,
  row_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Logging statement:

```sql
ALTER SYSTEM SET log_statement = 'mod';
SELECT pg_reload_conf();
```

## Esempio pratico

Trigger audit per update:

```sql
INSERT INTO audit_log (actor, action, table_name, row_id)
VALUES (current_user, 'update', 'orders', NEW.id::text);
```

Per audit serio, salva anche valori vecchi/nuovi rilevanti o una rappresentazione JSON controllata.

## Varianti

- Audit applicativo.
- Audit con trigger.
- Audit via log PostgreSQL.
- Estensioni come pgaudit.
- Logical decoding per stream audit.
- Audit immutabile su storage esterno.

## Errori comuni

- Loggare dati sensibili non necessari.
- Non proteggere la tabella audit.
- Non sincronizzare utente applicativo e attore reale.
- Generare volume ingestibile.
- Non definire retention.

## Checklist

- Cosa va tracciato?
- Chi e l'attore reale?
- I log sono protetti da modifica?
- La retention e definita?
- I dati sensibili sono minimizzati?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]
