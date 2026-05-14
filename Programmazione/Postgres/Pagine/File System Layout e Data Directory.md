---
date: 2026-05-14
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
# File System Layout e Data Directory in PostgreSQL

## Sintesi

Nota su File System Layout e Data Directory in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
Tutti i dati gestiti da un'istanza di PostgreSQL (il "cluster") risiedono in una singola directory del file system, nota come **Data Directory** o `PGDATA`. Comprendere l'organizzazione interna di questa cartella è fondamentale per operazioni di backup, troubleshooting e ottimizzazione dei dischi.

---

##  Struttura della Data Directory

Ecco le sottocartelle più importanti che compongono l'ecosistema di Postgres:

| Cartella | Contenuto e Funzione |
| :--- | :--- |
| `base/` | Contiene le sottodirectory per ogni **Database**. I nomi delle cartelle corrispondono all'OID (Object Identifier) del database. |
| `global/` | Tabelle condivise a livello di intero cluster (es. `pg_database`, utenti e ruoli). |
| `pg_wal/` | Contiene i file del **Write-Ahead Log (WAL)**. È l'area più critica per il recovery dopo un crash. |
| `pg_stat/` | Dati temporanei del sottosistema delle statistiche. |
| `pg_tblspc/` | Link simbolici ai **Tablespaces** (locazioni esterne alla directory dati principale). |
| `pg_commit_ts/` | Dati relativi ai timestamp di commit delle transazioni. |

---

##  File di Configurazione e Controllo

All'interno della root di `PGDATA` troviamo i file vitali per il funzionamento:

- **`postgresql.conf`**: Il file di configurazione principale (memoria, porte, logging, ecc.).
- **`pg_hba.conf`**: (Host-Based Authentication) Gestisce chi può connettersi e come.
- **`postmaster.pid`**: File di lock che indica che il server è in esecuzione (contiene il PID del processo principale).
- **`PG_VERSION`**: Un semplice file di testo che indica la versione principale di Postgres.

---

## Logic layer: Come vengono salvate le Tabelle?

In Postgres, ogni database, tabella e indice è mappato su un file fisico tramite un **OID** (Object ID).

### Mappatura Fisica
Se cerchi una tabella nel file system:
1.  Trovi l'OID del database: `SELECT oid FROM pg_database WHERE datname = 'mio_db';`
2.  Entri in `base/[OID_DATABASE]/`.
3.  Trovi l'OID della tabella (filenode): `SELECT relfilenode FROM pg_class WHERE relname = 'mia_tabella';`
4.  Il file risultante sul disco avrà quel numero come nome.

> [!IMPORTANT] Dimensione dei File
> Per motivi di compatibilità con i vecchi file system, Postgres segmenta le tabelle in file da **1 GB** (chiamati segmenti). Se una tabella è di 3 GB, vedrai file chiamati `12345`, `12345.1`, `12345.2`.

---

##  Regola d'Oro
> [!CAUTION] Non toccare i file manualmente
> **MAI** modificare, spostare o cancellare file all'interno della Data Directory utilizzando comandi del sistema operativo (`rm`, `mv`, `vi`). Qualsiasi modifica deve essere effettuata tramite comandi SQL o tool ufficiali, pena la corruzione irreversibile del database.

---
