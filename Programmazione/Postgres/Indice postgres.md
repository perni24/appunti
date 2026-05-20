## Percorso Base

### Architettura e Fondamenti

- [[Programmazione/Postgres/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/Postgres/Pagine/Architettura dei Processi|Architettura dei Processi]]
- [[Programmazione/Postgres/Pagine/Gestione della Memoria|Gestione della Memoria]]
- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]

### Setup e Amministrazione Base

- [[Programmazione/Postgres/Pagine/Installazione e Inizializzazione|Installazione e Inizializzazione]]
- [[Programmazione/Postgres/Pagine/Configurazione|Configurazione]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/Postgres/Pagine/Comandi psql e Meta-comandi|Comandi psql e Meta-comandi]]
- [[Programmazione/Postgres/Pagine/Schemi e Search Path|Database, schema e search_path]]

### SQL Fondamentale

- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/Postgres/Pagine/Subquery|Subquery]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Schemi e Search Path|Schemi e Search Path]]

### Modellazione Dati

- [[Programmazione/Postgres/Pagine/Normalizzazione|Normalizzazione]]
- [[Programmazione/Postgres/Pagine/Chiavi primarie e foreign key|Chiavi primarie e foreign key]]
- [[Programmazione/Postgres/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1:1, 1:N e N:N]]
- [[Programmazione/Postgres/Pagine/Tipi numerici testuali e temporali|Tipi numerici, testuali e temporali]]
- [[Programmazione/Postgres/Pagine/Tipi di Dato|JSON e JSONB]]

## Percorso Intermedio

### SQL Avanzato

- [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/Postgres/Pagine/Window Functions|Window Functions]]
- [[Programmazione/Postgres/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/Postgres/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]
- [[Programmazione/Postgres/Pagine/Views e Materialized Views|Views e Materialized Views]]
- [[Programmazione/Postgres/Pagine/Full Text Search|Full Text Search]]

### Integrita e Logica di Business

- [[Programmazione/Postgres/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/Postgres/Pagine/Regole|Regole]]
- [[Programmazione/Postgres/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]
- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]

### Transazioni e Concorrenza

- [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]
- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Deadlock]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Advisory locks]]

### Performance e Query Planning

- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Manutenzione|VACUUM e ANALYZE]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Bloat]]

## Percorso Avanzato

### Storage, WAL e Manutenzione

- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Checkpoint]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Autovacuum]]
- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|TOAST]]
- [[Programmazione/Postgres/Pagine/Fillfactor|Fillfactor]]
- [[Programmazione/Postgres/Pagine/Tablespace|Tablespace]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]

### Scalabilita e Alta Affidabilita

- [[Programmazione/Postgres/Pagine/Partitioning|Partitioning]]
- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/Postgres/Pagine/Failover e Load Balancing|Failover e Load Balancing]]
- [[Programmazione/Postgres/Pagine/Sharding|Sharding]]
- [[Programmazione/Postgres/Pagine/Read replicas|Read replicas]]

### Sicurezza

- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/Postgres/Pagine/SSL e TLS|SSL/TLS]]
- [[Programmazione/Postgres/Pagine/Audit logging|Audit logging]]
- [[Programmazione/Postgres/Pagine/Secret management|Secret management]]
- [[Programmazione/Postgres/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]

### Osservabilita e Troubleshooting

- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|pg_stat_activity]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|pg_stat_statements]]
- [[Programmazione/Postgres/Pagine/Slow query log|Slow query log]]
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Explain analyze in produzione]]
- [[Programmazione/Postgres/Pagine/Metriche e alerting|Metriche e alerting]]

## Applicazioni e Ecosistema

### Backup, Migrazioni e Operativita

- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|pg_dump e pg_restore]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Point-in-Time Recovery]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/Postgres/Pagine/Strategie zero-downtime|Strategie zero-downtime]]

### Estensioni e Funzionalita

- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|PostGIS]]
- [[Programmazione/Postgres/Pagine/Gestione delle Estensioni|pgvector]]
- [[Programmazione/Postgres/Pagine/TimescaleDB|TimescaleDB]]
- [[Programmazione/Postgres/Pagine/uuid-ossp e pgcrypto|uuid-ossp e pgcrypto]]
- [[Programmazione/Postgres/Pagine/FDW|FDW]]
- [[Programmazione/Postgres/Pagine/Logical decoding|Logical decoding]]

### Integrazione Applicativa

- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection pooling applicativo]]
- [[Programmazione/Postgres/Pagine/Prepared statements|Prepared statements]]
- [[Programmazione/Postgres/Pagine/ORM|ORM]]
- [[Programmazione/Postgres/Pagine/Pattern outbox|Pattern outbox]]
- [[Programmazione/Postgres/Pagine/Code e job table|Code e job table]]

## Conoscenza Operativa

### API Native Rapide

### Soluzioni pratiche

### Debugging

### Snippet

### Checklist

### Troubleshooting
