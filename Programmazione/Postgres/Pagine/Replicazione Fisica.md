---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Replicazione Fisica]
prerequisites: []
related: []
---

# Replicazione Fisica in PostgreSQL

## Sintesi

La **replicazione fisica** crea una copia byte-per-byte del cluster PostgreSQL inviando WAL dal primario a uno o piu standby. Serve per alta disponibilita, read replicas e disaster recovery.

## Quando usarlo

Usala quando vuoi:

- avere standby promuovibili in caso di guasto;
- servire query read-only su repliche;
- spostare backup e reportistica lontano dal primario;
- mantenere una replica geografica;
- costruire una base per failover gestito.

## Come funziona

Il primario genera WAL. Un processo `wal sender` invia il flusso allo standby, dove un `wal receiver` lo riceve e lo applica. In hot standby, la replica puo eseguire query in sola lettura.

La replica fisica replica l'intero cluster: database, schema e dati. Richiede compatibilita stretta di versione e non permette di scegliere singole tabelle.

La replica puo essere asincrona o sincrona. L'asincrona e piu veloce ma puo perdere gli ultimi WAL se il primario muore prima di inviarli. La sincrona riduce o elimina perdita dati, ma aggiunge latenza.

## API / Sintassi

Creare slot fisico:

```sql
SELECT pg_create_physical_replication_slot('standby_1');
```

Base backup:

```bash
pg_basebackup -h primary.example.com -D /var/lib/postgresql/data -U replicator -P -R -S standby_1
```

Stato replica sul primario:

```sql
SELECT
  application_name,
  state,
  sync_state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn
FROM pg_stat_replication;
```

## Esempio pratico

Replica asincrona con slot:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'change_me';
SELECT pg_create_physical_replication_slot('replica_a');
```

Poi sullo standby:

```bash
pg_basebackup -h primary -U replicator -D /data/postgres -P -R -S replica_a
```

L'opzione `-R` scrive la configurazione necessaria per collegarsi al primario.

## Varianti

- Streaming replication asincrona.
- Streaming replication sincrona.
- Cascading replication: una replica alimenta altre repliche.
- Hot standby: query read-only sulla replica.
- Replication slot fisici.
- WAL shipping tramite archiviazione.

## Errori comuni

- Non monitorare replication lag.
- Usare slot fisici senza controllare crescita WAL.
- Mandare scritture a una replica read-only.
- Non testare promozione e failover.
- Lasciare query lunghe sulla replica che ritardano cleanup.
- Confondere replica con backup: una replica propaga anche errori logici come delete sbagliati.

## Checklist

- Esiste un utente `REPLICATION` dedicato?
- Il lag e monitorato?
- Gli slot fisici sono necessari e controllati?
- Le app distinguono primario e replica?
- Il failover e stato testato?
- Esistono backup indipendenti dalla replica?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Read replicas|Read replicas]]
- [[Programmazione/Postgres/Pagine/Failover e Load Balancing|Failover e Load Balancing]]
