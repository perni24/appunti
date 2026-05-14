---
date: 2026-05-14
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

Nota su Backup e Ripristino in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
La strategia di backup in PostgreSQL si divide principalmente in tre categorie: **SQL Dump** (logico), **File System Level Backup** (fisico) e **Continuous Archiving** (PITR). La scelta dipende dalla dimensione del database e dal tempo di ripristino accettabile (RTO).

---

##  Backup Logico (SQL Dump)
Crea un file di testo (o un formato compresso) contenente i comandi SQL necessari per ricostruire il database.

### 1. `pg_dump`
Esegue il backup di un singolo database. Non blocca i lettori o gli scrittori (grazie a MVCC).
```bash
# Backup e Ripristino in PostgreSQL

## Sintesi

Nota su Backup e Ripristino in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
pg_dump mio_db > backup.sql

# Backup e Ripristino in PostgreSQL

## Sintesi

Nota su Backup e Ripristino in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
pg_dump -Fd mio_db -j 4 -f /percorso/directory_backup
```

### 2. `pg_dumpall`
Esegue il backup di tutti i database del cluster, inclusi i ruoli e i tablespace globali.
```bash
pg_dumpall > cluster_backup.sql
```

---

##  Ripristino (Restore)
A seconda del formato del dump, si usano tool diversi:

| Formato Dump | Tool di Ripristino | Comando |
| :--- | :--- | :--- |
| Testo (Plain SQL) | `psql` | `psql db_nuovo < backup.sql` |
| Custom / Directory / Tar | `pg_restore` | `pg_restore -d db_nuovo backup.dump` |

> [!TIP] Vantaggi di pg_restore
> Il tool `pg_restore` permette di selezionare solo alcune tabelle dal backup, di cambiare proprietario agli oggetti e di eseguire il ripristino in parallelo (`-j`).

---

## Logic layer: Continuous Archiving e PITR

Per database di grandi dimensioni o critici, si utilizza il **Point-In-Time Recovery**. 
Si basa sulla combinazione di:
1.  **Base Backup**: Una copia fisica dei file di dati (usando `pg_basebackup`).
2.  **WAL Archiving**: Il salvataggio continuo dei file WAL generati.

Questo permette di ripristinare il database a un qualsiasi istante temporale passato (es. un secondo prima di un errore umano).

---

##  Tool di Manutenzione Avanzata
Per gestire cicli di backup complessi in modo automatico, la comunità Postgres consiglia:
- **Barman** (Backup and Recovery Manager): Ideale per archiviare WAL in remoto.
- **pgBackRest**: Estremamente veloce, supporta compressione, backup incrementali e delta restore.

---

##  Best Practices
- **Test di ripristino**: Un backup non testato è un backup che potrebbe non esistere. Esegui regolarmente prove di restore su un server di test.
- **Distanza fisica**: Archivia i backup su un server o storage diverso da quello di produzione (off-site).
- **Monitoraggio**: Controlla sempre i log dei job di backup per individuare errori di spazio su disco o permessi.

---
