---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - osservabilita
  - monitoraggio
aliases: []
prerequisites: []
related: []
---

# Metriche e alerting

## Sintesi

Metriche e alerting permettono di rilevare saturazione, query lente, replica lag, crescita WAL, lock, bloat e problemi di disponibilita prima che diventino incidenti.

## Quando usarlo

Serve per database in produzione, ambienti critici, replica, backup, sistemi con SLA o applicazioni dove downtime e perdita dati hanno impatto reale.

## Come funziona

PostgreSQL espone viste statistiche come `pg_stat_activity`, `pg_stat_database`, `pg_stat_user_tables`, `pg_stat_replication` e `pg_replication_slots`. I sistemi di monitoraggio raccolgono questi dati e generano alert.

## API / Sintassi

Connessioni:

```sql
SELECT count(*) FROM pg_stat_activity;
```

Database stats:

```sql
SELECT datname, xact_commit, xact_rollback, deadlocks
FROM pg_stat_database;
```

Replica lag:

```sql
SELECT now() - pg_last_xact_replay_timestamp() AS replica_lag;
```

Tuple morte:

```sql
SELECT relname, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

## Esempio pratico

Alert utili:

- connessioni oltre soglia;
- spazio disco sotto soglia;
- replica lag eccessivo;
- slot di replica inattivo;
- deadlock maggiori di zero;
- autovacuum non avanza;
- backup fallito.

## Varianti

- Metriche interne PostgreSQL.
- Exporter Prometheus.
- Dashboard Grafana.
- Alert cloud provider.
- Log-based alerting.
- APM applicativo.

## Errori comuni

- Monitorare solo CPU e RAM.
- Non controllare replica lag e WAL.
- Alert troppo rumorosi.
- Mancanza di alert su backup falliti.
- Non misurare query per frequenza e durata.
- Ignorare trend di crescita disco.

## Checklist

- Esistono alert su disco, connessioni e replica?
- I backup generano alert se falliscono?
- Deadlock e lock wait sono osservati?
- `pg_stat_statements` e raccolto?
- Le soglie sono testate?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/Postgres/Pagine/Slow query log|Slow query log]]
- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
