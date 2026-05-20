---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - lock
  - osservabilita
aliases: []
prerequisites: []
related: []
---

# Lock monitoring

## Sintesi

Il **lock monitoring** osserva lock attivi, sessioni bloccate e transazioni che impediscono ad altre query di avanzare.

## Concetto chiave

I lock sono normali, ma lock lunghi o inattesi causano code, timeout e deadlock.

## Query utile

```sql
SELECT pid, wait_event_type, wait_event, state, query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
```

## Cosa cercare

- Transazioni aperte da molto tempo.
- Query in attesa di lock.
- Sessioni idle in transaction.
- DDL bloccato da traffico applicativo.

## Obiettivo

Da completare: descrivere cosa ottenere in pratica.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Procedura

1. Da completare.
2. Da completare.
3. Da completare.

## Snippet

```text
Da completare con codice o comando riutilizzabile.
```

## Adattamenti comuni

- Da completare: varianti per casi frequenti.

## Debug rapido

- Da completare: controlli rapidi in caso di errore.

## Checklist finale

- Da completare: verifiche finali.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]


