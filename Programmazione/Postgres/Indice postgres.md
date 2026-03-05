## Architettura e Fondamenti

- [[Pagine/Modello Client-Server|Modello Client-Server]]
- [[Pagine/Architettura dei Processi|Architettura dei Processi (Postmaster, Background Workers)]]
- [[Pagine/Gestione della Memoria|Gestione della Memoria (Shared Buffers, Local Memory)]]
- [[Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]

## Setup e Amministrazione

- Installazione e Inizializzazione (initdb)
- Configurazione (postgresql.conf, pg_hba.conf)
- Gestione Utenti e Ruoli
- Backup e Ripristino (pg_dump, pg_restore, Barman)
- Manutenzione (Vacuum, Analyze, Reindex)

## Linguaggio SQL ed Estensioni psql

- Tipi di Dato (Primitivi, Array, JSONB, Range Types)
- Comandi psql e Meta-comandi (\d, \copy, \watch)
- Common Table Expressions (CTE) e Recursive Queries
- Window Functions
- Full Text Search

## Integrità e Logica di Business

- Vincoli (Primary Key, Foreign Key, Check, Exclusion)
- Trigger e Event Trigger
- Regole (Rules System)
- Schemi e Search Path

## Performance e Tuning

- Tipi di Indici (B-Tree, GIN, GiST, BRIN, Hash)
- Indici Parziali e Coprenti
- Analisi delle Query (EXPLAIN, EXPLAIN ANALYZE)
- Statistiche e Query Planner
- Partitioning (Declarative Partitioning)

## Programmabilità

- PL/pgSQL: Variabili, Controllo Flusso, Cursori
- Funzioni e Store Procedures
- Gestione delle Estensioni (CREATE EXTENSION)

## Concorrenza e Transazioni

- Proprietà ACID
- MVCC (Multi-Version Concurrency Control)
- Livelli di Isolamento delle Transazioni
- Meccanismi di Locking (Row-level, Table-level, Advisory)
- Write-Ahead Logging (WAL)

## Scalabilità e Alta Affidabilità

- Replicazione Fisica (Streaming Replication)
- Replicazione Logica
- Connection Pooling (PgBouncer, pgcat)
- Failover e Load Balancing
