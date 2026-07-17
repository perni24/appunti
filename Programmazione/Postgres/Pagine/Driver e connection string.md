---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - driver
  - applicazioni
aliases: []
prerequisites: []
related: []
---

# Driver e connection string

## Sintesi

I driver permettono alle applicazioni di connettersi a PostgreSQL. La connection string descrive host, porta, database, utente, password e opzioni come TLS, timeout e application name.

## Quando usarlo

Usa questa nota quando configuri l'accesso applicativo al database:

- backend web;
- script di migrazione;
- worker e job schedulati;
- strumenti CLI;
- connessione tramite PgBouncer;
- ambienti con TLS obbligatorio.

## Come funziona

Una connection string raccoglie i parametri necessari al driver. Puo essere in formato URL o keyword/value. Il driver interpreta questi valori e apre una connessione TCP o Unix socket verso PostgreSQL o verso un pooler.

Le opzioni importanti includono:

- `host`, `port`, `dbname`;
- `user`, `password`;
- `sslmode`;
- timeout di connessione;
- `application_name`;
- parametri specifici del driver.

## API / Sintassi

Formato URL:

```text
postgresql://app_user:secret@localhost:5432/app_db?sslmode=require
```

Formato keyword/value:

```text
host=localhost port=5432 dbname=app_db user=app_user password=secret sslmode=require
```

Con application name:

```text
postgresql://app_user:secret@db.internal:5432/app_db?sslmode=verify-full&application_name=api
```

## Esempio pratico

Connection string per produzione dietro PgBouncer:

```text
postgresql://app_user:${DB_PASSWORD}@pgbouncer.internal:6432/app_db?sslmode=verify-full&application_name=orders-api
```

In applicazione conviene leggere la stringa da un secret manager o da variabili d'ambiente non versionate.

## Varianti

- URL connection string.
- Keyword/value connection string.
- Unix socket locale.
- Connessione diretta a PostgreSQL.
- Connessione tramite PgBouncer.
- TLS con `sslmode=require`, `verify-ca` o `verify-full`.

## Errori comuni

- Loggare connection string complete con password.
- Versionare `.env` contenenti segreti.
- Usare `sslmode=require` pensando che verifichi il nome host.
- Non impostare timeout di connessione.
- Condividere lo stesso utente tra applicazione, migrazioni e operatori.
- Non impostare `application_name`, rendendo difficile il monitoring.

## Checklist

- La password non e hardcoded?
- La connection string non viene loggata?
- `sslmode` e coerente con l'ambiente?
- Esiste un timeout di connessione?
- `application_name` identifica servizio e ambiente?
- L'utente ha solo i privilegi necessari?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/Postgres/Pagine/SSL e TLS|SSL/TLS]]
- [[Programmazione/Postgres/Pagine/Secret management|Secret management]]
