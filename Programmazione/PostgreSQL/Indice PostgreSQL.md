# Indice PostgreSQL

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Promemoria di sintassi e comandi]]
- [[Programmazione/Indice Programmazione|Tutti i percorsi di Programmazione]]

## Percorso Base

### Architettura e Fondamenti

- [[Programmazione/PostgreSQL/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/PostgreSQL/Pagine/Architettura dei Processi|Architettura dei Processi]]
- [[Programmazione/PostgreSQL/Pagine/Gestione della Memoria|Gestione della Memoria]]
- [[Programmazione/PostgreSQL/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]

### Setup e Amministrazione Base

- [[Programmazione/PostgreSQL/Pagine/Installazione e Inizializzazione|Installazione e Inizializzazione]]
- [[Programmazione/PostgreSQL/Pagine/Configurazione|Configurazione]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Comandi psql e Meta-comandi|Comandi psql e Meta-comandi]]
- [[Programmazione/PostgreSQL/Pagine/Schemi e Search Path|Database, schema e search_path]]

### SQL Fondamentale

- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/PostgreSQL/Pagine/Subquery|Subquery]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Schemi e Search Path|Schemi e Search Path]]

### Modellazione Dati

- [[Programmazione/PostgreSQL/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/PostgreSQL/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/PostgreSQL/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1:1, 1:N e N:N]]
- [[Programmazione/PostgreSQL/Pagine/Tipi numerici testuali e temporali|Tipi numerici, testuali e temporali]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|JSON e JSONB]]

## Percorso Intermedio

### SQL Avanzato

- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/PostgreSQL/Pagine/Window Functions|Window Functions]]
- [[Programmazione/PostgreSQL/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]
- [[Programmazione/PostgreSQL/Pagine/Views e Materialized Views|Views e Materialized Views]]
- [[Programmazione/PostgreSQL/Pagine/Full Text Search|Full Text Search]]

### Integrita e Logica di Business

- [[Programmazione/PostgreSQL/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/PostgreSQL/Pagine/Regole|Regole]]
- [[Programmazione/PostgreSQL/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/PostgreSQL/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]

### Transazioni e Concorrenza

- [[Programmazione/PostgreSQL/Pagine/Proprietà ACID|Proprietà ACID]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Deadlock]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Advisory locks]]

### Performance e Query Planning

- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|VACUUM e ANALYZE]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Bloat]]

## Percorso Avanzato

### Storage, WAL e Manutenzione

- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Checkpoint]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Autovacuum]]
- [[Programmazione/PostgreSQL/Pagine/File System Layout e Data Directory|TOAST]]
- [[Programmazione/PostgreSQL/Pagine/Fillfactor|Fillfactor]]
- [[Programmazione/PostgreSQL/Pagine/Tablespace|Tablespace]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]

### Scalabilita e Alta Affidabilita

- [[Programmazione/PostgreSQL/Pagine/Partitioning|Partitioning]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/PostgreSQL/Pagine/Failover e Load Balancing|Failover e Load Balancing]]
- [[Programmazione/PostgreSQL/Pagine/Sharding|Sharding]]
- [[Programmazione/PostgreSQL/Pagine/Read replicas|Read replicas]]

### Sicurezza

- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/PostgreSQL/Pagine/SSL e TLS|SSL/TLS]]
- [[Programmazione/PostgreSQL/Pagine/Audit logging|Audit logging]]
- [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]

### Osservabilita e Troubleshooting

- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|pg_stat_activity]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|pg_stat_statements]]
- [[Programmazione/PostgreSQL/Pagine/Slow query log|Slow query log]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Explain analyze in produzione]]
- [[Programmazione/PostgreSQL/Pagine/Metriche e alerting|Metriche e alerting]]

## Applicazioni e Ecosistema

### Backup, Migrazioni e Operativita

- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|pg_dump e pg_restore]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Point-in-Time Recovery]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/PostgreSQL/Pagine/Strategie zero-downtime|Strategie zero-downtime]]

### Estensioni e Funzionalita

- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|PostGIS]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|pgvector]]
- [[Programmazione/PostgreSQL/Pagine/TimescaleDB|TimescaleDB]]
- [[Programmazione/PostgreSQL/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/PostgreSQL/Pagine/FDW|FDW]]
- [[Programmazione/PostgreSQL/Pagine/Logical decoding|Logical decoding]]

### Integrazione Applicativa

- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection pooling applicativo]]
- [[Programmazione/PostgreSQL/Pagine/Prepared statements|Prepared statements]]
- [[Programmazione/PostgreSQL/Pagine/ORM|ORM]]
- [[Programmazione/PostgreSQL/Pagine/Pattern outbox|Pattern outbox]]
- [[Programmazione/PostgreSQL/Pagine/Code e job table|Code e job table]]
