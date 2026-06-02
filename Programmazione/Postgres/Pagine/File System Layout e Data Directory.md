---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [File System Layout e Data Directory]
prerequisites: []
related: []
---

# File System Layout e Data Directory

## Sintesi

La data directory contiene i file fisici del cluster PostgreSQL: dati, WAL, configurazione, cataloghi, tablespace linkati e metadati. Non va modificata manualmente mentre il server e in uso.

## Quando usarlo

Serve per capire backup fisici, spazio disco, WAL, configurazione, tablespace e struttura del cluster.

## Come funziona

La data directory contiene sottocartelle come `base`, `global`, `pg_wal`, `pg_tblspc`, `pg_stat`, `pg_xact` e file di configurazione. I file non hanno nomi leggibili per tabella: PostgreSQL usa OID e relfilenode.

## API / Sintassi

Trovare la data directory:

```sql
SHOW data_directory;
```

Trovare file associato a una tabella:

```sql
SELECT pg_relation_filepath('orders');
```

Dimensioni:

```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
SELECT pg_size_pretty(pg_total_relation_size('orders'));
```

## Esempio pratico

`pg_wal` cresce se archiviazione, replica o slot non consumano WAL. Prima di cancellare file manualmente bisogna capire la causa. Cancellare file da `pg_wal` puo rendere il cluster non avviabile.

## Varianti

- `base`: dati dei database.
- `global`: cataloghi globali.
- `pg_wal`: Write-Ahead Log.
- `pg_tblspc`: link verso tablespace.
- `postgresql.conf`: configurazione.
- `pg_hba.conf`: autenticazione.

## Errori comuni

- Modificare file dati manualmente.
- Cancellare file WAL per liberare spazio.
- Fare copia fisica senza procedura corretta.
- Ignorare permessi del filesystem.
- Non monitorare spazio disco.

## Checklist

- La data directory e su storage affidabile?
- `pg_wal` e monitorato?
- I backup fisici usano strumenti corretti?
- I permessi impediscono accessi non autorizzati?
- I tablespace sono documentati?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Tablespace|Tablespace]]
