---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Connection Pooling]
prerequisites: []
related: []
---

# Connection Pooling in PostgreSQL

## Sintesi

Il connection pooling riusa connessioni gia aperte verso PostgreSQL. Riduce overhead, memoria e numero di processi backend, soprattutto in applicazioni web con molte richieste brevi.

## Quando usarlo

Usa il pooling quando:

- l'applicazione apre molte connessioni brevi;
- `max_connections` tende a saturarsi;
- molti microservizi parlano con lo stesso database;
- ci sono serverless function o worker elastici;
- vuoi limitare connessioni reali al database;
- devi proteggere PostgreSQL da picchi di traffico.

## Come funziona

PostgreSQL usa un modello process-per-connection: ogni connessione client crea un backend. Troppe connessioni aumentano memoria, context switching e carico sul server.

Un pooler mantiene un numero limitato di connessioni reali e le assegna ai client solo quando serve.

PgBouncer e il pooler piu comune. In modalita transaction pooling, una connessione server viene restituita al pool alla fine della transazione.

## API / Sintassi

Esempio concettuale PgBouncer:

```ini
[databases]
app_db = host=127.0.0.1 port=5432 dbname=app_db

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
pool_mode = transaction
default_pool_size = 20
max_client_conn = 1000
```

Connection string verso PgBouncer:

```text
postgresql://app_user:secret@pgbouncer.internal:6432/app_db?sslmode=require
```

## Esempio pratico

Web app con molte richieste:

```text
Client HTTP -> App -> PgBouncer:6432 -> PostgreSQL:5432
```

L'applicazione puo avere centinaia di client concorrenti, mentre PostgreSQL vede solo poche decine di connessioni reali.

Con transaction pooling, evitare session state persistente:

```sql
-- Preferire SET LOCAL dentro transazione
BEGIN;
SET LOCAL statement_timeout = '5s';
SELECT ...
COMMIT;
```

## Varianti

- Pool applicativo: integrato in driver/framework.
- PgBouncer session pooling: una connessione server per sessione client.
- PgBouncer transaction pooling: connessione server solo per transazione.
- PgBouncer statement pooling: raramente usato, una connessione per statement.
- Pooler lato infrastruttura: proxy condiviso tra servizi.

## Errori comuni

- Aumentare `max_connections` invece di ridurre connessioni reali.
- Usare transaction pooling con feature che richiedono session state persistente.
- Usare prepared statements lato sessione senza compatibilita col pooler.
- Configurare pool troppo grandi in ogni microservizio.
- Non impostare timeout e limiti.
- Dimenticare che ogni connessione reale consuma memoria.

## Checklist

- Quante connessioni reali puo sostenere PostgreSQL?
- Il pool applicativo e coordinato con PgBouncer?
- La modalita `transaction` e compatibile con l'app?
- Sono configurati timeout di idle e query?
- Le metriche mostrano saturazione del pool?
- Le connection string puntano al pooler dove previsto?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Configurazione|Configurazione]]
