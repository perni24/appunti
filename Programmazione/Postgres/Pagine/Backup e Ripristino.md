---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Backup e Ripristino]
prerequisites: []
related: []
---

# Backup e Ripristino in PostgreSQL

## Sintesi

Il backup protegge i dati da errori umani, guasti, deploy sbagliati e perdita del server. In PostgreSQL le strategie principali sono dump logici, backup fisici e Point-In-Time Recovery tramite archiviazione dei WAL.

## Quando usarlo

Usa questa nota quando devi progettare o verificare una strategia di backup:

- esportare un database per migrazione o test;
- ripristinare una tabella o un database;
- proteggere un ambiente di produzione;
- definire RPO e RTO;
- testare procedure di disaster recovery;
- scegliere tra `pg_dump`, `pg_basebackup`, Barman o pgBackRest.

## Come funziona

Il backup logico esporta schema e dati in forma SQL o in un formato ripristinabile con `pg_restore`. E flessibile, ma puo essere lento su database grandi.

Il backup fisico copia i file del cluster PostgreSQL. E adatto a database grandi e viene spesso combinato con archiviazione WAL per il Point-In-Time Recovery.

Il PITR combina:

- base backup;
- archiviazione continua dei WAL;
- ripristino fino a un timestamp, un LSN o un restore point.

Un backup non testato non e affidabile: la prova di restore e parte della strategia, non un controllo opzionale.

## API / Sintassi

Dump logico plain SQL:

```bash
pg_dump app_db > app_db.sql
psql restored_db < app_db.sql
```

Dump custom:

```bash
pg_dump -Fc app_db -f app_db.dump
pg_restore -d restored_db app_db.dump
```

Dump directory parallelo:

```bash
pg_dump -Fd app_db -j 4 -f app_db_dump_dir
pg_restore -d restored_db -j 4 app_db_dump_dir
```

Cluster globale:

```bash
pg_dumpall --globals-only > globals.sql
```

Base backup fisico:

```bash
pg_basebackup -D /backup/base -Fp -Xs -P
```

## Esempio pratico

Backup e restore di test:

```bash
createdb restored_app_db
pg_dump -Fc app_db -f app_db.dump
pg_restore --clean --if-exists -d restored_app_db app_db.dump
```

Verifica minima dopo il restore:

```sql
SELECT count(*) FROM users;
SELECT count(*) FROM orders;
```

Per ambienti critici, il test deve includere anche utenti, estensioni, permessi, job applicativi e query principali.

## Varianti

- `pg_dump`: backup logico di un database.
- `pg_dumpall`: backup globale, utile per ruoli e tablespace.
- `pg_restore`: ripristino di dump custom, tar o directory.
- `pg_basebackup`: backup fisico del cluster.
- PITR: restore a un punto temporale specifico.
- Barman: gestione backup e WAL archiving.
- pgBackRest: backup compressi, incrementali e restore efficienti.

## Errori comuni

- Fare backup ma non provare mai il ripristino.
- Salvare backup sullo stesso disco del database.
- Dimenticare ruoli, permessi o estensioni.
- Usare solo dump logici su database troppo grandi per il tempo di restore richiesto.
- Non monitorare esito, dimensione e durata dei job.
- Non definire RPO e RTO.

## Checklist

- Esiste una politica chiara di retention?
- I backup sono salvati fuori dal server principale?
- Il restore e stato testato recentemente?
- Sono inclusi ruoli, permessi, estensioni e schema?
- Per produzione critica esiste PITR?
- I job di backup sono monitorati e generano alert?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]
