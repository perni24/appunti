---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Gestione della Memoria]
prerequisites: []
related: []
---

# Gestione della Memoria in PostgreSQL

## Sintesi

La memoria in PostgreSQL e divisa tra memoria condivisa, usata dal server, e memoria per backend/query. I parametri piu noti sono `shared_buffers`, `work_mem`, `maintenance_work_mem` ed `effective_cache_size`.

## Quando usarlo

Serve quando fai tuning, diagnostichi sort su disco, troppi backend, query parallele o consumo RAM superiore alle attese.

## Come funziona

`shared_buffers` e la cache interna di PostgreSQL. `work_mem` e usata per sort, hash join e aggregazioni per singola operazione, non per database intero. `maintenance_work_mem` riguarda operazioni come vacuum, create index e alter table. `effective_cache_size` stima la cache disponibile tra OS e database e influenza il planner.

## API / Sintassi

```sql
SHOW shared_buffers;
SHOW work_mem;
SHOW maintenance_work_mem;
SHOW effective_cache_size;
```

Impostazione per sessione:

```sql
SET work_mem = '128MB';
```

## Esempio pratico

Se `EXPLAIN (ANALYZE, BUFFERS)` mostra sort esterni su disco, puoi testare:

```sql
SET work_mem = '128MB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT ...
ORDER BY ...;
```

La modifica globale va fatta solo dopo calcolo della concorrenza.

## Varianti

- Memoria condivisa: `shared_buffers`.
- Memoria per operazione: `work_mem`.
- Memoria per manutenzione: `maintenance_work_mem`.
- Stima cache OS: `effective_cache_size`.
- Memoria per autovacuum: `autovacuum_work_mem`.

## Errori comuni

- Impostare `work_mem` troppo alto globalmente.
- Ignorare che una query puo usare piu volte `work_mem`.
- Aumentare `max_connections` senza pooling.
- Confondere cache PostgreSQL e cache del sistema operativo.
- Fare tuning senza misurare.

## Checklist

- Quante connessioni concorrenti esistono?
- Le query fanno sort/hash su disco?
- Il pooling limita i backend?
- `work_mem` e adeguato ma non pericoloso?
- Le modifiche sono state testate con query reali?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/Postgres/Pagine/Configurazione|Configurazione]]
