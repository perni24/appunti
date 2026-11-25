---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - logging
  - performance
aliases: []
prerequisites: []
related: []
title: Slow query log
---

# Slow query log

## Sintesi

Il log delle query lente risponde a «quale esecuzione ha superato una durata?». `pg_stat_statements` risponde invece a «quale famiglia di statement ha consumato più tempo nel complesso?». Una query da 5 ms ripetuta un milione di volte può non comparire mai nel primo elenco ed essere in cima al secondo. Nessuno dei due misura da solo la latenza completa percepita dal client.

## Registrare una singola esecuzione

`log_min_duration_statement` registra sul **server** durata e statement al completamento, quando la durata raggiunge la soglia. `-1` disabilita questa specifica registrazione, `0` registra tutto. Con protocollo esteso, Parse, Bind ed Execute vengono cronometrati separatamente. Una lunga durata può includere un'attesa di lock: non equivale a tempo di CPU.

In una sessione `psql` di prova con permesso di impostare il parametro, esegui i comandi separatamente come nel blocco. Serve accesso al log del server o alla console del provider per osservare il risultato:

```sql
BEGIN;
SET LOCAL log_min_duration_statement = '50ms';
SELECT pg_sleep(0.1) AS lab_query_lenta;
COMMIT;
```

Cerca `lab_query_lenta` in una voce con durata. Il client non restituisce il file di log. Il commit ripristina l'impostazione precedente: non occorre modificare tutto il cluster per questa verifica. In produzione scegli soglia, finestra e destinazione in base al volume; limita accesso e retention. Testo SQL e parametri possono contenere dati sensibili.

## pg_stat_statements

Serve il modulo in `shared_preload_libraries` (modificare l'elenco mantenendo le altre librerie e riavviare se non era già caricato), il calcolo dei query ID attivo e `CREATE EXTENSION pg_stat_statements` nel database dal quale interroghi la vista. Su servizi gestiti verifica disponibilità e permessi. La query assume che la vista sia raggiungibile nello `search_path`.

```sql
SELECT userid, queryid, calls,
       round(total_exec_time::numeric, 2) AS totale_ms,
       round(mean_exec_time::numeric, 2) AS media_ms,
       stats_since, left(query, 120) AS esempio
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND toplevel
ORDER BY total_exec_time DESC
LIMIT 10;
```

`calls` conta le esecuzioni, `total_exec_time` ne somma il tempo di esecuzione e `mean_exec_time` ne dà la media: non è il p95 e non comprende il tempo di pianificazione. Il testo è rappresentativo e normalmente normalizza le costanti; non è uno storico con i parametri di ogni chiamata. Per leggere testo e identificatori di altri utenti servono privilegi di monitoraggio appropriati.

Il ranking è cumulativo, non significa «negli ultimi cinque minuti». Per un intervallo confronta due campioni della stessa istanza, database, ruolo, `queryid` e `toplevel`; usa `Δtotal_exec_time / Δcalls` solo se `Δcalls > 0` e `stats_since` non è cambiato. Una voce rimossa e ricreata o statistiche azzerate interrompono la serie. Non azzerare i contatori condivisi per iniziare una misura.

## Dal log al piano

Se non puoi riprodurre una query lenta, `auto_explain` può registrare il piano durante una sua esecuzione reale. Laboratorio separato, nella stessa sessione e con permessi per caricare il modulo:

```sql
LOAD 'auto_explain';
BEGIN;
SET LOCAL auto_explain.log_min_duration = '0ms';
SET LOCAL auto_explain.log_analyze = on;
SET LOCAL auto_explain.log_timing = off;
SET LOCAL auto_explain.log_buffers = on;
SELECT sum(i) AS lab_piano FROM generate_series(1, 10) AS g(i);
COMMIT;
```

Attesi `55` sul client e un piano con `Aggregate` nel log del server. La soglia zero serve **solo nel laboratorio**. `log_analyze` aggiunge strumentazione anche a statement che possono non finire nei log; disabilitare il timing per nodo riduce il costo, non lo elimina. Per una diagnosi confronta poche esecuzioni rappresentative, verifica attese e frequenza, poi consulta [[Programmazione/PostgreSQL/Pagine/Analisi delle Query#EXPLAIN in produzione|EXPLAIN in produzione]] prima di rieseguire il carico.

## Fonti

[PostgreSQL 18: soglie di logging](https://www.postgresql.org/docs/18/runtime-config-logging.html) · [pg_stat_statements](https://www.postgresql.org/docs/18/pgstatstatements.html) · [auto_explain](https://www.postgresql.org/docs/18/auto-explain.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Metriche e alerting|Metriche e alerting]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
