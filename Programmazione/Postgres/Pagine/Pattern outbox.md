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
  - pattern
  - integrazione
aliases: []
prerequisites: []
related: []
---

# Pattern outbox

## Sintesi

Il pattern outbox salva eventi da pubblicare nella stessa transazione che modifica i dati applicativi. Evita inconsistenza tra database e message broker.

## Quando usarlo

Usalo quando un cambiamento nel database deve produrre un evento esterno affidabile: email, Kafka, webhook, integrazione o proiezioni read model.

## Come funziona

La transazione scrive sia la modifica business sia una riga nella tabella `outbox`. Un processo separato legge eventi non pubblicati e li invia al sistema esterno.

## API / Sintassi

```sql
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type text NOT NULL,
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Scrittura atomica:

```sql
BEGIN;

UPDATE orders SET status = 'paid' WHERE id = 42;

INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
VALUES ('order', '42', 'order.paid', '{"order_id": 42}'::jsonb);

COMMIT;
```

## Esempio pratico

Publisher:

```sql
SELECT *
FROM outbox_events
WHERE published_at IS NULL
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

Dopo invio riuscito, aggiorna `published_at`.

## Varianti

- Polling outbox.
- Outbox con logical decoding.
- Outbox con job table.
- Eventi idempotenti.
- Deduplica lato consumer.

## Errori comuni

- Pubblicare evento prima del commit.
- Non rendere i consumer idempotenti.
- Non gestire retry.
- Cancellare eventi troppo presto.
- Non monitorare backlog outbox.

## Checklist

- Evento e dato business sono nella stessa transazione?
- Il publisher gestisce retry?
- I consumer sono idempotenti?
- Esiste monitoraggio backlog?
- Retention eventi e definita?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Code e job table|Code e job table]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
