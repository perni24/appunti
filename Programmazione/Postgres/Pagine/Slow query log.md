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
  - logging
  - performance
aliases: []
prerequisites: []
related: []
---

# Slow query log

## Sintesi

Lo slow query log registra query che superano una soglia di durata. Serve per trovare query costose realmente eseguite in produzione.

## Quando usarlo

Usalo quando ci sono timeout, latenza alta, carico periodico, regressioni di performance o query applicative difficili da riprodurre.

## Come funziona

PostgreSQL puo loggare query lente tramite `log_min_duration_statement`. Il valore e in millisecondi. Con `auto_explain` puoi anche registrare piani di esecuzione per query lente.

## API / Sintassi

```sql
ALTER SYSTEM SET log_min_duration_statement = '500ms';
SELECT pg_reload_conf();
```

Per sessione:

```sql
SET log_min_duration_statement = '100ms';
```

Auto explain:

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '500ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
```

## Esempio pratico

Procedura:

1. Imposta una soglia ragionevole.
2. Raccogli log per un periodo rappresentativo.
3. Raggruppa query simili.
4. Analizza con `EXPLAIN (ANALYZE, BUFFERS)`.
5. Applica una modifica alla volta.

## Varianti

- `log_min_duration_statement`.
- `pg_stat_statements`.
- `auto_explain`.
- Logging applicativo con query id.
- APM esterno.

## Errori comuni

- Impostare soglia troppo bassa e generare log ingestibili.
- Ottimizzare query rare ignorando quelle frequenti.
- Non anonimizzare dati sensibili.
- Guardare solo durata e non frequenza.
- Non collegare query al servizio applicativo.

## Checklist

- La soglia e adatta al carico?
- I log non espongono dati sensibili?
- Le query lente sono raggruppate?
- `pg_stat_statements` e disponibile?
- Le query piu impattanti sono misurate con `EXPLAIN`?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Metriche e alerting|Metriche e alerting]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
