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
  - pattern
  - code
aliases: []
prerequisites: []
related: []
---

# Code e job table

## Sintesi

Una job table usa PostgreSQL come coda di lavoro persistente. I worker selezionano job disponibili, li bloccano, li marcano in esecuzione e li completano.

## Quando usarlo

Usala per workload moderati, job transazionali vicini ai dati, retry semplici, outbox processing o sistemi dove aggiungere una coda esterna sarebbe eccessivo.

## Come funziona

I worker usano `FOR UPDATE SKIP LOCKED` per prendere job diversi senza bloccarsi a vicenda. Lo stato del job traccia lifecycle, tentativi, errori e timestamp.

## API / Sintassi

```sql
CREATE TABLE jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'available',
  attempts integer NOT NULL DEFAULT 0,
  run_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz
);
```

Picking:

```sql
WITH picked AS (
  SELECT id
  FROM jobs
  WHERE status = 'available'
    AND run_at <= now()
  ORDER BY run_at, id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE jobs
SET status = 'running', locked_at = now()
FROM picked
WHERE jobs.id = picked.id
RETURNING jobs.*;
```

## Esempio pratico

Un worker apre una transazione breve, prende un job, committa, poi lavora fuori transazione. Alla fine aggiorna il job come `completed` o `failed`.

## Varianti

- Job table semplice.
- Retry con `attempts`.
- Scheduling con `run_at`.
- Priorita.
- Dead letter queue.
- Outbox processor.

## Errori comuni

- Tenere la transazione aperta durante tutto il lavoro.
- Non usare `SKIP LOCKED`.
- Non gestire retry e job bloccati.
- Non indicizzare `status`, `run_at` e priorita.
- Usare Postgres come coda ad altissimo throughput senza valutare alternative.

## Checklist

- Il picking usa `FOR UPDATE SKIP LOCKED`?
- Le transazioni sono brevi?
- Esistono retry e dead letter?
- I job stuck vengono recuperati?
- Gli indici coprono `status` e `run_at`?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Pattern outbox|Pattern outbox]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
