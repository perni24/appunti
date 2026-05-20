---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - code
  - job
aliases: []
prerequisites: []
related: []
---

# Code e job table

## Sintesi

Le **code e job table** usano PostgreSQL per memorizzare lavori da eseguire in background.

## Concetto chiave

Una tabella di job contiene stato, payload, tentativi e timestamp. Worker concorrenti prendono job liberi usando lock controllati.

```sql
SELECT id
FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

## Campi comuni

- `status`.
- `payload`.
- `attempts`.
- `run_at`.
- `locked_at`.
- `last_error`.

## Errori comuni

- Non usare `SKIP LOCKED` con worker concorrenti.
- Non prevedere retry e dead-letter.
- Tenere transazioni aperte durante lavoro esterno lungo.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Pattern outbox|Pattern outbox]]
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]


