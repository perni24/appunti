---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Modello Client-Server]
prerequisites: []
related: []
---

# Modello Client-Server in PostgreSQL

## Sintesi

PostgreSQL usa un modello client-server: i client inviano query tramite una connessione, il server le esegue e restituisce risultati. Ogni connessione viene gestita da un processo backend dedicato.

## Quando usarlo

Serve capirlo quando configuri connessioni, pooling, autenticazione, timeout, networking o diagnostichi saturazione di `max_connections`.

## Come funziona

Il server principale accetta connessioni. Per ogni client crea o assegna un backend che autentica l'utente, riceve query, interagisce con buffer, WAL e storage, poi restituisce risultati.

Questo modello e semplice e robusto, ma molte connessioni simultanee consumano memoria e CPU. Per applicazioni web ad alta concorrenza conviene usare pooling.

## API / Sintassi

Connection string tipica:

```text
postgresql://app_user:secret@db.internal:5432/app_db
```

Controllare connessioni:

```sql
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity;
```

## Esempio pratico

Architettura comune:

```text
app -> PgBouncer -> PostgreSQL
```

PgBouncer riduce il numero di backend reali mantenuti da PostgreSQL.

## Varianti

- Connessione diretta client-server.
- Connessione tramite pooler.
- Connessione locale via Unix socket.
- Connessione remota TCP/TLS.
- Read/write split con endpoint diversi.

## Errori comuni

- Aumentare `max_connections` senza calcolare memoria.
- Aprire una connessione per ogni richiesta senza pooling.
- Non impostare `application_name`.
- Lasciare sessioni `idle in transaction`.
- Confondere connessioni client con query attive.

## Checklist

- Esiste un limite di connessioni coerente con la RAM?
- L'app usa pooling?
- I timeout sono configurati?
- `application_name` identifica i servizi?
- Le connessioni idle sono monitorate?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Architettura dei Processi|Architettura dei Processi]]
