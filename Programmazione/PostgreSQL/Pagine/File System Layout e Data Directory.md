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
  - File System Layout e Data Directory
prerequisites: []
related: []
title: File System Layout e Data Directory
---

# File System Layout e Data Directory

## Sintesi

La *data directory* è la directory dei dati di un **cluster**, non quella di una singola tabella o di un solo database. Alcuni file possono risiedere altrove: i tablespace utente hanno una posizione separata e anche i file di configurazione possono avere percorsi propri. Conoscere il layout aiuta a diagnosticare lo spazio occupato, non autorizza a manipolare i file.

## Orientarsi nel layout

| Voce | Contenuto |
|---|---|
| `base/` | Un sottodirettorio per OID di database nel tablespace predefinito `pg_default`. Non contiene necessariamente tutte le tabelle. |
| `global/` | Relazioni condivise fra i database del cluster e file di controllo. |
| `pg_tblspc/` | Collegamenti ai tablespace definiti dall'utente. Il percorso logico può puntare a un altro volume. |
| `pg_wal/` | Segmenti del write-ahead log, necessari fra l'altro a crash recovery, archiviazione e replica. |
| `pg_xact/` e `pg_stat/` | Stato di commit delle transazioni e statistiche persistenti, rispettivamente. Non sono directory da svuotare. |
| `postgresql.conf` e `pg_hba.conf` | Configurazione e regole di autenticazione. Spesso sono nella data directory, ma non è garantito. |

Su un server che amministri puoi leggere la posizione effettiva. Sono percorsi **del server**, non del computer da cui usi `psql`. Se il ruolo applicativo non può vederli, chiedi a chi amministra l'istanza.

```sql
SELECT current_setting('data_directory') AS dati,
       current_setting('config_file') AS configurazione,
       current_setting('hba_file') AS autenticazione;
```

## Esempio: da una relazione al suo file

La tabella di catalogo `pg_catalog.pg_class` esiste anche in un database nuovo. Le seguenti query sono di sola lettura; non serve creare una tabella `orders` o accedere al filesystem.

```sql
SELECT 'pg_catalog.pg_class'::regclass::oid AS oid_logico,
       pg_relation_filenode('pg_catalog.pg_class'::regclass) AS filenode,
       pg_relation_filepath('pg_catalog.pg_class'::regclass) AS percorso_relativo;
```

L'OID identifica la relazione nel catalogo; il *filenode* identifica lo storage corrente. Possono differire, ad esempio dopo una riscrittura della tabella. Il percorso è relativo alla data directory e identifica il primo segmento del *main fork*, **non** l'elenco di tutti i file della tabella e dei suoi indici.

```sql
SELECT pg_size_pretty(pg_relation_size('pg_catalog.pg_class')) AS solo_main_fork,
       pg_size_pretty(pg_total_relation_size('pg_catalog.pg_class')) AS con_indici_e_toast,
       pg_size_pretty(pg_database_size(current_database())) AS intero_database;
```

Usa la prima misura per il file dati principale (tutti i suoi segmenti), la seconda per la relazione completa con indici e dati TOAST se presenti. La terza riguarda il database corrente: non equivale all'occupazione dell'intero cluster o del suo WAL.

## TOAST

Una versione di riga della heap deve stare in una pagina. Per valori di lunghezza variabile, come `text` o `bytea`, TOAST può comprimere il dato, conservarlo fuori riga in una relazione associata, oppure fare entrambe le cose. In caso di memorizzazione esterna, la riga principale contiene un puntatore e il valore è suddiviso in pezzi. La soglia riguarda la **larghezza della riga**: «testo oltre 2 kB» non implica da solo «dato esterno».

**Prova nella stessa sessione.** La strategia `EXTERNAL` permette la memorizzazione fuori riga ma disabilita la compressione, così il comportamento non dipende da quanto è comprimibile la stringa. In condizioni normali non occorre forzarla. Il rollback annulla la creazione della tabella temporanea.

```sql
BEGIN;
CREATE TEMP TABLE lab_toast (body text NOT NULL);
ALTER TABLE lab_toast ALTER COLUMN body SET STORAGE EXTERNAL;
INSERT INTO lab_toast VALUES (repeat('x', 64000));
SELECT octet_length(body) AS logical_bytes,
       pg_relation_size(c.reltoastrelid) > 0 AS toast_has_pages
FROM lab_toast CROSS JOIN pg_class AS c
WHERE c.oid = 'lab_toast'::regclass;
ROLLBACK;
```

Risultato: **64000** byte logici e **true** per le pagine della relazione TOAST. L'esistenza di un `reltoastrelid` da sola non prova che vi siano già valori esterni. `pg_relation_size` sulla heap principale non include questi pezzi; `pg_total_relation_size` include anche TOAST e indici. [PostgreSQL 18: memorizzazione TOAST](https://www.postgresql.org/docs/18/storage-toast.html).

## Se lo spazio finisce

- Se cresce `pg_wal`, verifica archiviazione fallita, slot che trattengono WAL e produzione recente. Una replica lenta non implica sempre ritenzione illimitata: contano slot e configurazione.
- **Non cancellare manualmente segmenti WAL o file di relazione**, neppure se sembrano vecchi. Diagnostica la causa prima di intervenire.
- Copiare la cartella di una tabella o la data directory di un server acceso non produce, da solo, un backup consistente. Per un backup fisico online usa una procedura supportata, ad esempio `pg_basebackup`, includi i tablespace e verifica il ripristino. Considera separatamente le configurazioni esterne.

**Fonti:** [layout dei file](https://www.postgresql.org/docs/18/storage-file-layout.html), [posizione della configurazione](https://www.postgresql.org/docs/18/runtime-config-file-locations.html), [funzioni di dimensione e percorso](https://www.postgresql.org/docs/18/functions-admin.html#FUNCTIONS-ADMIN-DBOBJECT) e [backup a livello filesystem](https://www.postgresql.org/docs/18/backup-file.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/PostgreSQL/Pagine/Tablespace|Tablespace]]
