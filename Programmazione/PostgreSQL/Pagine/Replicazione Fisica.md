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
  - Replicazione Fisica
prerequisites: []
related: []
title: Replicazione Fisica in PostgreSQL
---

# Replicazione Fisica in PostgreSQL

## Sintesi

Uno standby fisico parte da una copia di base dell'intero cluster e riproduce i record WAL del primario. Non seleziona singole tabelle. Il processo `walreceiver` riceve il flusso; il processo di recovery applica i record. Ricevere, rendere durevole e rendere visibile una modifica non sono lo stesso evento.

## Preparare uno standby

Usa binari compatibili della stessa major, percorsi adatti agli eventuali tablespace, spazio per dati e WAL e connettività verso il primario. Sul primario servono `wal_level` almeno `replica`, abbastanza `max_wal_senders`, un ruolo `LOGIN REPLICATION` e una regola `pg_hba.conf` ristretta alle connessioni di replica autorizzate. Per usare uno slot serve anche capacità in `max_replication_slots`.

Esempio sul **futuro standby**, con istanza ferma, directory nuova e vuota, servizio libpq `vault_primary` configurato con host, porta, ruolo e autenticazione. In produzione verifica l'identità del server tramite TLS e non inserire password nella riga di comando.

```bash
pg_basebackup --dbname="service=vault_primary" --pgdata=standby-data --wal-method=stream --write-recovery-conf --create-slot --slot=lab_standby
```

`--create-slot` richiede un nome libero. `--write-recovery-conf` crea `standby.signal` e registra le impostazioni di connessione e lo slot. L'account del servizio PostgreSQL deve poter risolvere la connessione anche **dopo** la fine del backup. Prima di avviare lo standby, controlla percorsi e, se i due nodi condividono un host, assegna porte diverse.

## Leggere lo stato dal nodo giusto

Sul **primario**, con permessi di monitoraggio:

```sql
SELECT application_name, state, sync_state, sent_lsn, write_lsn, flush_lsn, replay_lsn
FROM pg_stat_replication ORDER BY application_name;
```

Una riga per connessione diretta; una vista vuota non prova che una replica sia aggiornata. `streaming` descrive la fase del collegamento, `sync_state` la partecipazione alla replica sincrona. `replay_lsn` è l'ultima posizione applicata comunicata al primario, non una lettura istantanea dello standby.

Sullo **standby**:

```sql
SELECT pg_is_in_recovery() AS standby,
       pg_last_wal_receive_lsn() AS ricevuto,
       pg_last_wal_replay_lsn() AS applicato;
```

In streaming ci si aspetta `standby = true`; un divario persistente tra ricevuto e applicato invita a indagare il replay. `NULL` non significa ritardo zero: può mancare il relativo flusso o non essere iniziato il replay.

## Scelte operative ed errori comuni

- **Asincrona o sincrona:** normalmente il commit non aspetta lo standby. Con standby sincroni configurati, `synchronous_commit=on` attende il flush remoto richiesto, `remote_apply` attende anche l'applicazione. Più garanzie possono aumentare latenza e attese quando manca uno standby.
- **Slot o archivio:** uno slot conserva WAL necessario, anche con client scollegato: controlla spazio disco, `restart_lsn` e limiti di retention. Un limite evita crescita illimitata dovuta allo slot, ma uno standby rimasto troppo indietro può dover essere ricreato. Il WAL archiviato è un altro possibile canale di recupero.
- **Cascata e backup:** uno standby può alimentarne un altro; misura ogni tratta. Una cancellazione accidentale viene riprodotta: serve comunque un backup indipendente con ripristino provato.

## Fonti

[PostgreSQL 18: standby e replica in streaming](https://www.postgresql.org/docs/18/warm-standby.html) · [pg_basebackup](https://www.postgresql.org/docs/18/app-pgbasebackup.html) · [Statistiche di replica](https://www.postgresql.org/docs/18/monitoring-stats.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Read replicas|Read replicas]]
- [[Programmazione/PostgreSQL/Pagine/Failover e Load Balancing|Failover e Load Balancing]]
