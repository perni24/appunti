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
  - lock
  - osservabilita
aliases: []
prerequisites: []
related: []
---

# Lock monitoring

## Sintesi

Il **lock monitoring** osserva lock attivi, sessioni bloccate e transazioni che impediscono ad altre query di avanzare.

## Quando usarlo

Usa il lock monitoring quando il database sembra fermo ma CPU e I/O non spiegano il problema:

- query in attesa per molto tempo;
- migrazioni bloccate;
- errori `lock timeout`;
- deadlock nei log;
- molte sessioni `idle in transaction`;
- job concorrenti che non avanzano.

## Come funziona

### Concetto chiave
I lock sono normali, ma lock lunghi o inattesi causano code, timeout e deadlock.
### Query utile
```sql
SELECT pid, wait_event_type, wait_event, state, query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
```
### Cosa cercare
- Transazioni aperte da molto tempo.
- Query in attesa di lock.
- Sessioni idle in transaction.
- DDL bloccato da traffico applicativo.

## API / Sintassi

Sessioni in attesa di lock:

```sql
SELECT
  pid,
  wait_event_type,
  wait_event,
  state,
  age(clock_timestamp(), query_start) AS query_age,
  query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
ORDER BY query_start;
```

Blocchi e bloccanti:

```sql
SELECT
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query
FROM pg_stat_activity AS blocked
JOIN pg_locks AS blocked_locks
  ON blocked_locks.pid = blocked.pid
JOIN pg_locks AS blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
 AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
 AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
 AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
 AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
 AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
 AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
 AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
 AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
 AND blocking_locks.pid <> blocked_locks.pid
JOIN pg_stat_activity AS blocking
  ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted
  AND blocking_locks.granted;
```

Terminare una sessione solo dopo verifica:

```sql
SELECT pg_cancel_backend(pid);
SELECT pg_terminate_backend(pid);
```

## Esempio pratico

### Procedura
1. Identificare le sessioni in attesa con `pg_stat_activity`.
2. Trovare il blocker con `pg_locks`.
3. Controllare da quanto tempo e aperta la transazione bloccante.
4. Valutare se usare `pg_cancel_backend` o `pg_terminate_backend`.
5. Correggere la causa: transazione lunga, DDL invasivo, ordine lock incoerente o job concorrenti.

Query per sessioni `idle in transaction`:

```sql
SELECT
  pid,
  usename,
  application_name,
  age(clock_timestamp(), xact_start) AS transaction_age,
  query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start;
```

## Varianti

- Monitoraggio manuale con `pg_stat_activity`.
- Analisi dei lock con `pg_locks`.
- Log automatico con `log_lock_waits`.
- Soglia di deadlock con `deadlock_timeout`.
- Timeout preventivi con `lock_timeout`.
- Dashboard esterne basate su metriche PostgreSQL.

## Errori comuni

- Terminare sessioni senza capire quale transazione sta bloccando cosa.
- Confondere una query lenta con una query bloccata.
- Lasciare `idle in transaction` senza timeout applicativo.
- Non abilitare log utili per attese lunghe.
- Uccidere il processo sbagliato, causando rollback costosi.
- Non correggere il flusso applicativo dopo l'incidente.

## Checklist

- Le sessioni bloccate hanno `wait_event_type = 'Lock'`?
- E stato identificato il blocker?
- La transazione bloccante e attiva o `idle in transaction`?
- Esistono migrazioni DDL in corso?
- Sono configurati `lock_timeout` e `statement_timeout` dove serve?
- Dopo la mitigazione e stata corretta la causa applicativa?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
