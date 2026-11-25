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
  - osservabilita
  - monitoraggio
aliases: []
prerequisites: []
related: []
title: Metriche e alerting
---

# Metriche e alerting

## Sintesi

Un alert utile descrive un problema osservabile, indica per quanto tempo deve durare e suggerisce la prima verifica. Prima di impostare una soglia distingui **valore istantaneo** (connessioni correnti), **contatore cumulativo** (deadlock dall'ultimo reset) e **stima** (tuple morte). Non hanno lo stesso significato, anche se tutti e tre crescono.

## Quante connessioni e in quale stato?

```sql
SELECT state, count(*) AS sessioni
FROM pg_stat_activity
WHERE backend_type = 'client backend' AND datname = current_database()
GROUP BY state ORDER BY state;
```

Il filtro esclude i processi di supporto; la connessione di monitoraggio conta come `active`. La query descrive **un database**, non la capacità libera dell'istanza. Per la saturazione considera tutti i database, le connessioni riservate, i limiti dei pool e l'attesa dei client. Molte sessioni `idle` non significano molte query in esecuzione; per una coda di lock verifica i bloccanti.

## Misurare gli incrementi

Campiona la vista a intervalli noti, in transazioni brevi e separate. Mantieni l'identificativo dell'istanza nel sistema di raccolta:

```sql
SELECT clock_timestamp() AS campione, datid, stats_reset,
       xact_commit, xact_rollback, deadlocks
FROM pg_stat_database WHERE datname = current_database();
```

Se `deadlocks` passa da 7 a 7 non c'è un nuovo evento; da 7 a 9 gli eventi sono due. Per una frequenza dividi l'incremento per i secondi effettivamente trascorsi. Se cambia istanza, `datid` o `stats_reset`, o se il contatore diminuisce, riparti da una nuova base: non emettere un tasso negativo. Le statistiche possono aggiornarsi con ritardo. Un rollback esplicito dell'applicazione aumenta `xact_rollback` e non prova da solo che ci sia stato un errore.

## Segnali da interpretare insieme

| Segnale | Prima verifica | Cosa non concludere |
| --- | --- | --- |
| Letture vecchie su una replica | Stato della connessione, WAL inviato, ricevuto e applicato; confronta le posizioni sulla stessa storia WAL | Il tempo dall'ultimo commit riprodotto cresce anche con un primario inattivo |
| Spazio WAL in crescita | Spazio libero sul volume, archiviazione e slot | Uno slot inattivo non implica da solo perdita di dati o disco già pieno |
| Tuple morte | Andamento di `n_dead_tup` per tabella, dimensione, ultimo autovacuum e transazioni lunghe | `n_dead_tup` è una stima, non una misura esatta del bloat |
| Backup | Età dell'ultimo backup riuscito, WAL necessario e ultimo ripristino di prova | Un job verde non prova la recuperabilità |
| Latenza | Percentili lato applicazione, errori, attese nel pool, lock e statement frequenti | La media di esecuzione SQL non è il p95 end-to-end |

Sul **primario**, per capire se uno slot è rimasto indietro rispetto al WAL corrente:

```sql
SELECT slot_name, active, wal_status, restart_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) AS distanza_byte
FROM pg_replication_slots ORDER BY slot_name;
```

È una distanza tra posizioni, **non** lo spazio disco esatto imputabile a quello slot. Più slot possono richiedere gli stessi segmenti; non sommare le distanze. `NULL` indica che la posizione non è disponibile; zero righe significa nessuno slot, non assenza di replica. Controlla `wal_status` e il consumer prima di intervenire: eliminare uno slot può rendere impossibile la ripresa senza una nuova sincronizzazione.

## Dalla metrica alla notifica

Per esempio, per un servizio che ha un limite concordato di attesa nel pool, notifica se il limite viene superato per più finestre **e** si osservano richieste in coda. Nella notifica indica servizio, istanza, finestra, valore misurato e collegamento alla diagnosi; verifica anche il rientro con un carico noto. Scegli soglie e finestre dal comportamento abituale e dagli obiettivi del servizio, non da una percentuale universale. Distingui «nessun dato dal collector» da «valore zero» con un controllo separato.

## Fonti

[PostgreSQL 18: viste statistiche e tempi di aggiornamento](https://www.postgresql.org/docs/18/monitoring-stats.html) · [Stato degli slot di replica](https://www.postgresql.org/docs/18/view-pg-replication-slots.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/PostgreSQL/Pagine/Slow query log|Slow query log]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Read replicas|Read replicas e misura del replay]]
