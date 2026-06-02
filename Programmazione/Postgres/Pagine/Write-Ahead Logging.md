---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Write-Ahead Logging (WAL)]
prerequisites: []
related: []
---

# Write-Ahead Logging (WAL) in PostgreSQL

## Sintesi

Il **Write-Ahead Logging** e il meccanismo che garantisce durabilita, crash recovery, backup fisico, Point-In-Time Recovery e replica. Prima di modificare i file dati, PostgreSQL registra la modifica nel WAL.

## Quando usarlo

Studia il WAL quando devi capire:

- durabilita delle transazioni;
- crash recovery;
- checkpoint;
- replica fisica e logica;
- backup con PITR;
- crescita anomala di `pg_wal`;
- impatto delle scritture su performance e storage.

## Come funziona

Quando una transazione modifica dati, PostgreSQL cambia prima le pagine in memoria e genera record WAL. Prima del `COMMIT`, i record WAL necessari vengono resi persistenti. Le pagine dati possono essere scritte piu tardi dal checkpointer o dal background writer.

In caso di crash, PostgreSQL riparte dall'ultimo checkpoint e riapplica i record WAL necessari per riportare il database a uno stato coerente.

Il WAL e anche il flusso usato da replica, logical decoding e archiviazione per backup avanzati.

## API / Sintassi

Parametri comuni:

```conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
max_wal_size = '4GB'
checkpoint_timeout = '15min'
synchronous_commit = on
```

Informazioni WAL:

```sql
SELECT pg_current_wal_lsn();
SELECT pg_walfile_name(pg_current_wal_lsn());
```

Creare un restore point:

```sql
SELECT pg_create_restore_point('before_migration');
```

## Esempio pratico

Abilitare archiviazione WAL per PITR:

```conf
archive_mode = on
archive_command = 'test ! -f /archive/%f && cp %p /archive/%f'
```

Con un base backup e gli archivi WAL, puoi ripristinare il database fino a un timestamp precedente a un errore umano.

## Varianti

- `wal_level = replica`: necessario per replica fisica.
- `wal_level = logical`: necessario per replicazione logica e logical decoding.
- `synchronous_commit = on`: massima durabilita ordinaria.
- `synchronous_commit = off`: minore latenza, rischio di perdere transazioni recenti in caso di crash.
- WAL archiving: conserva file WAL per PITR.
- Replication slot: trattiene WAL finche un consumer non lo ha ricevuto.

## Errori comuni

- Non monitorare la crescita di `pg_wal`.
- Creare replication slot non consumati, trattenendo WAL indefinitamente.
- Confondere checkpoint frequenti con maggiore sicurezza.
- Abilitare `archive_mode` senza verificare `archive_command`.
- Usare `synchronous_commit = off` senza accettare il rischio.
- Non testare restore PITR.

## Checklist

- Il valore di `wal_level` supporta replica o logical decoding richiesti?
- `archive_command` e testato?
- La directory WAL ha spazio e alert?
- Gli slot di replica sono monitorati?
- I checkpoint non sono troppo frequenti?
- Il restore da base backup + WAL e stato provato?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]
