---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Architettura dei Processi
prerequisites: []
related: []
title: Architettura dei Processi in PostgreSQL
---

# Architettura dei Processi in PostgreSQL

## Sintesi

Un elenco di processi `postgres` non è un elenco di query. Il processo principale (*postmaster*) accetta connessioni e supervisiona l'istanza; i backend dei client gestiscono le sessioni. Altri processi scrivono pagine, curano la manutenzione o partecipano alla replica. Per distinguerli usa `backend_type`, non il solo PID.

## Chi fa cosa

| Processo | Compito |
|---|---|
| Backend client | Analizza ed esegue i comandi della sessione. Per alcuni piani può coordinare worker paralleli: non sono connessioni client aggiuntive. |
| Background writer | Scrive in anticipo alcune pagine modificate dei buffer condivisi per renderli riutilizzabili. Non è l'unico processo che scrive pagine. |
| Checkpointer | Coordina la scrittura e sincronizzazione necessarie ai checkpoint. Un checkpoint fissa un punto utile al recupero, non è un backup. |
| WAL writer | Scrive dati dai buffer WAL. Il WAL registra modifiche per il recupero; non è una copia dei file di tabella. Anche un backend può dover effettuare un flush del WAL. |
| Autovacuum launcher / worker | Il launcher pianifica, i worker eseguono `VACUUM` o `ANALYZE` quando necessario. Non è anomalo non vedere worker in un dato istante. |
| Archiver, WAL sender / receiver | L'archiver archivia segmenti WAL se configurato. Nella replica in streaming il sender invia dal server sorgente, il receiver riceve sulla replica. Non vanno cercati tutti sullo stesso nodo. |

## Esempio: riconoscere chi si sta osservando

Sulla propria connessione, con il monitoraggio attività abilitato:

```sql
SELECT pid, backend_type, state, wait_event_type, wait_event
FROM pg_stat_activity
WHERE pid = pg_backend_pid();
```

Con un client SQL normale ci si aspetta `client backend` e `active`: è la query di osservazione stessa a essere in esecuzione. Per vedere anche gli altri tipi di processo esposti dalla vista:

```sql
SELECT backend_type, count(*) AS processi
FROM pg_stat_activity
GROUP BY backend_type
ORDER BY backend_type;
```

I tipi e i conteggi variano con versione, configurazione e carico. La vista non è l'inventario di tutti i processi del sistema operativo. Per altre sessioni alcuni dettagli possono risultare nulli senza privilegi di monitoraggio; non concedere privilegi all'applicazione solo per questo controllo.

## Diagnosi: stato e attesa non sono sinonimi

`state` descrive l'attività della sessione; `wait_event_type` e `wait_event` dicono **se e dove sta aspettando** al momento dell'osservazione. Un backend può essere `active` e contemporaneamente in attesa di un lock. `ClientRead` su una sessione `idle` significa normalmente che si aspetta il prossimo comando dal client.

Per verificare l'ipotesi di un blocco, senza interrompere alcuna sessione:

```sql
SELECT pid AS in_attesa, pg_blocking_pids(pid) AS pid_bloccanti
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
```

Zero righe significa «nessuna attesa di questo tipo osservata ora», non «nessuna contesa durante la giornata». Nemmeno un evento `IO` isolato dimostra un disco lento. Prima di intervenire confronta più campioni, durata delle transazioni e metriche del sistema; non terminare un processo dal solo nome.

**Fonti:** [vista pg_stat_activity e wait events](https://www.postgresql.org/docs/18/monitoring-stats.html#MONITORING-PG-STAT-ACTIVITY-VIEW), [WAL e checkpoint](https://www.postgresql.org/docs/18/wal-configuration.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]
