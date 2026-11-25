---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - pattern
  - code
aliases: []
prerequisites: []
related: []
title: Code e job table
---

# Code e job table

## Sintesi

Una job table è utile per accodare lavoro insieme a una modifica applicativa nello stesso database. Distingui il **lock di riga**, che dura fino alla fine della transazione, dal **diritto temporaneo di lavorare sul job** (*lease*), registrato nella tabella e quindi ancora verificabile dopo il commit. È quest'ultimo che permette di recuperare il lavoro di un worker scomparso.

## Laboratorio: prenotare un job

Database di prova vuoto, `psql` in autocommit. Il laboratorio ammette tre tentativi: `attempts` conta le prenotazioni iniziate, non soltanto gli errori riportati. Si passa da `ready` a `running` e poi a `done`; se scade la lease, si torna a `ready` oppure si finisce in `failed`.

```sql
CREATE TABLE lab_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, payload jsonb NOT NULL,
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','running','done','failed')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  available_at timestamptz NOT NULL DEFAULT now(),
  claim_token uuid, lease_until timestamptz,
  CHECK ((state = 'running') = (claim_token IS NOT NULL)),
  CHECK ((state = 'running') = (lease_until IS NOT NULL))
);
CREATE INDEX lab_jobs_ready ON lab_jobs (available_at, id) WHERE state = 'ready';
CREATE INDEX lab_jobs_expiry ON lab_jobs (lease_until, id) WHERE state = 'running';
INSERT INTO lab_jobs (payload) VALUES ('{"report":1}'), ('{"report":2}');
```

Un worker acquisisce **al massimo una riga** con questo singolo statement. Conserva ID e token restituiti; inizia il lavoro esterno solo dopo il commit della prenotazione.

```sql
WITH candidate AS (
  SELECT id FROM lab_jobs
  WHERE state = 'ready' AND attempts < 3 AND available_at <= statement_timestamp()
  ORDER BY available_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE lab_jobs AS j
SET state = 'running', attempts = attempts + 1, claim_token = gen_random_uuid(),
    lease_until = statement_timestamp() + interval '5 minutes'
FROM candidate AS c WHERE j.id = c.id
RETURNING j.id, j.claim_token, j.attempts, j.payload;
```

Su dati nuovi il primo worker ottiene il job 1 al tentativo 1. Se la riga è ancora bloccata, un secondo worker può prendere il job 2. Nessuna riga significa «niente di prenotabile **adesso**», non «coda vuota». `SKIP LOCKED` evita di aspettare le righe già prese: non promette FIFO rigoroso, assenza di starvation o assenza di attese per lock di tabella.

## Confermare solo il proprio tentativo

Esempio per `psql`: ai prompt indica l'ID e il token della prenotazione. In applicazione passa i due valori come parametri del driver.

```psql
\prompt 'ID del job: ' job_id
\prompt 'Token del tentativo: ' token
UPDATE lab_jobs SET state = 'done', claim_token = NULL, lease_until = NULL
WHERE id = :'job_id'::bigint AND claim_token = :'token'::uuid
  AND state = 'running' AND lease_until > statement_timestamp()
RETURNING id, state;
```

Una riga `1, done` conferma il tentativo. **Zero righe non è successo:** la lease è scaduta, il job è già chiuso o appartiene a un altro tentativo. Un worker lento non deve completare il lavoro di chi lo ha ripreso. Se il lavoro può durare oltre cinque minuti, dimensiona o rinnova la lease verificando lo stesso token prima della scadenza.

## Recuperare i job scaduti

Un processo di recupero esegue periodicamente piccoli batch in transazioni brevi. Nel laboratorio il ritardo prima del nuovo tentativo è di 30 secondi:

```sql
WITH expired AS (
  SELECT id FROM lab_jobs
  WHERE state = 'running' AND lease_until <= statement_timestamp()
  ORDER BY lease_until, id LIMIT 50 FOR UPDATE SKIP LOCKED
)
UPDATE lab_jobs AS j
SET state = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'ready' END,
    available_at = statement_timestamp() + interval '30 seconds',
    claim_token = NULL, lease_until = NULL
FROM expired AS e WHERE j.id = e.id
RETURNING j.id, j.state, j.attempts;
```

Con lease ancora valide non cambia nulla. Il recupero non incrementa `attempts`: lo farà la prossima prenotazione con un **nuovo token**. Al terzo tentativo scaduto il job diventa `failed` e resta disponibile per diagnosi. In un servizio reale distingui errori permanenti e temporanei, conserva l'ultima causa senza dati sensibili e controlla età dei job pronti, lease scadute e fallimenti definitivi.

## Garanzie e limiti

Il token protegge la scrittura **nella job table**, non annulla un effetto esterno già avvenuto. Se il worker invia un'email e si interrompe prima della conferma, il retry può ripetere l'invio. Usa una chiave idempotente stabile per l'operazione (per esempio l'ID del job), non il token che cambia a ogni tentativo. Se l'obiettivo è pubblicare un evento di dominio, vedi [[Programmazione/PostgreSQL/Pagine/Pattern outbox|Pattern outbox]]. Misura contesa, crescita della tabella e costo della manutenzione prima di preferire questa soluzione a un broker dedicato.

## Fonte

[PostgreSQL 18: FOR UPDATE e SKIP LOCKED](https://www.postgresql.org/docs/18/sql-select.html#SQL-FOR-UPDATE-SHARE)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Pattern outbox|Pattern outbox]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
